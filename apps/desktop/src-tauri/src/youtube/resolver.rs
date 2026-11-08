use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::path::Path;
use std::process::Command;
use std::sync::Mutex;
use std::time::{Duration, Instant};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResolvedStreamInfo {
    pub id: String,
    pub url: String,
    pub title: String,
    pub artist: String,
    pub duration: f64,
    pub thumbnail: Option<String>,
    pub acodec: String,
    pub format_id: String,
    pub expires_at: i64,
}

pub struct StreamResolver {
    cache: Mutex<HashMap<String, (ResolvedStreamInfo, Instant)>>,
    cache_ttl: Duration,
}

impl StreamResolver {
    pub fn new() -> Self {
        StreamResolver {
            cache: Mutex::new(HashMap::new()),
            cache_ttl: Duration::from_secs(3600), // 1 hour TTL
        }
    }

    pub fn get_cached(&self, video_id: &str) -> Option<ResolvedStreamInfo> {
        let lock = self.cache.lock().ok()?;
        if let Some((info, inserted_at)) = lock.get(video_id) {
            if inserted_at.elapsed() < self.cache_ttl {
                return Some(info.clone());
            }
        }
        None
    }

    pub fn insert_cache(&self, video_id: String, info: ResolvedStreamInfo) {
        if let Ok(mut lock) = self.cache.lock() {
            lock.insert(video_id, (info, Instant::now()));
        }
    }

    pub fn resolve_audio(
        &self,
        video_id: &str,
        tool_path: &Path,
        qjs_path: Option<&Path>,
    ) -> Result<ResolvedStreamInfo, String> {
        // Check cache first
        if let Some(cached) = self.get_cached(video_id) {
            return Ok(cached);
        }

        let mut cmd = Command::new(tool_path);
        cmd.arg("--format")
            .arg("ba/ba*")
            .arg("-j")
            .arg("--no-playlist")
            .arg("--no-warnings")
            .arg("--extractor-args")
            .arg("youtube:player_client=ios,android,web");

        if let Some(qjs) = qjs_path {
            if qjs.exists() {
                cmd.arg("--js-runtimes").arg(format!("quickjs:{}", qjs.display()));
            }
        }

        let target_url = format!("https://www.youtube.com/watch?v={}", video_id);
        cmd.arg(&target_url);

        let output = cmd.output().map_err(|e| format!("Failed to spawn yt-dlp: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(Self::map_error(&stderr));
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let val: Value = serde_json::from_str(&stdout)
            .map_err(|e| format!("Failed to parse yt-dlp JSON: {}", e))?;

        let stream_url = val["url"].as_str().ok_or("Stream URL not found in yt-dlp response")?.to_string();
        let title = val["title"].as_str().unwrap_or("Unknown Title").to_string();
        let artist = val["uploader"]
            .as_str()
            .or_else(|| val["channel"].as_str())
            .unwrap_or("Unknown Artist")
            .to_string();
        let duration = val["duration"].as_f64().unwrap_or(0.0);
        let acodec = val["acodec"].as_str().unwrap_or("unknown").to_string();
        let format_id = val["format_id"].as_str().unwrap_or("").to_string();

        let thumbnail = val["thumbnail"]
            .as_str()
            .or_else(|| {
                val["thumbnails"]
                    .as_array()
                    .and_then(|arr| arr.last())
                    .and_then(|t| t["url"].as_str())
            })
            .map(|s| s.to_string());

        let expires_at = (std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs()
            + 3600) as i64;

        let info = ResolvedStreamInfo {
            id: video_id.to_string(),
            url: stream_url,
            title,
            artist,
            duration,
            thumbnail,
            acodec,
            format_id,
            expires_at,
        };

        self.insert_cache(video_id.to_string(), info.clone());
        Ok(info)
    }

    fn map_error(stderr: &str) -> String {
        let err = stderr.to_lowercase();
        if err.contains("sign in to confirm") || err.contains("bot") {
            "Sign-in / bot challenge triggered. Please verify in browser or update tools.".to_string()
        } else if err.contains("video unavailable") {
            "This video is unavailable or has been removed.".to_string()
        } else if err.contains("private video") {
            "This video is private.".to_string()
        } else if err.contains("members-only") || err.contains("join this channel") {
            "This content is members-only.".to_string()
        } else if err.contains("403") {
            "Stream request rejected (HTTP 403). Rotating stream credentials.".to_string()
        } else if err.contains("rate-limit") || err.contains("429") {
            "Rate limited by YouTube. Please wait a moment.".to_string()
        } else {
            format!("yt-dlp error: {}", stderr.trim())
        }
    }
}

