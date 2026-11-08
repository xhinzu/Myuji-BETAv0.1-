use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::path::Path;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YouTubeTrack {
    pub id: String,
    pub title: String,
    pub artist: String,
    pub duration: f64,
    pub thumbnail: Option<String>,
}

pub fn search_youtube(
    query: &str,
    limit: usize,
    tool_path: &Path,
) -> Result<Vec<YouTubeTrack>, String> {
    let clean_query = query.trim();
    if clean_query.is_empty() {
        return Ok(Vec::new());
    }

    let capped_limit = limit.clamp(1, 25);
    let search_target = format!("ytsearch{}:{}", capped_limit, clean_query);

    let output = Command::new(tool_path)
        .arg(&search_target)
        .arg("--flat-playlist")
        .arg("-j")
        .arg("--no-warnings")
        .output()
        .map_err(|e| format!("Failed to run yt-dlp search: {}", e))?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        return Err(format!("yt-dlp search error: {}", err.trim()));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut results = Vec::new();

    for line in stdout.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }

        if let Ok(val) = serde_json::from_str::<Value>(line) {
            let id = match val["id"].as_str() {
                Some(id) => id.to_string(),
                None => continue,
            };

            // Filter out live streams
            if let Some(status) = val["live_status"].as_str() {
                if status == "is_live" {
                    continue;
                }
            }

            let duration = val["duration"].as_f64().unwrap_or(0.0);
            // Exclude tracks shorter than 15s or longer than 15 minutes for default music search
            if duration > 0.0 && (duration < 15.0 || duration > 900.0) {
                continue;
            }

            let raw_title = val["title"].as_str().unwrap_or("Unknown Title").to_string();
            let raw_uploader = val["uploader"]
                .as_str()
                .or_else(|| val["channel"].as_str())
                .unwrap_or("Unknown Artist")
                .to_string();

            // Extract best thumbnail
            let thumbnail = val["thumbnails"]
                .as_array()
                .and_then(|arr| arr.last())
                .and_then(|t| t["url"].as_str())
                .map(|s| s.to_string());

            results.push(YouTubeTrack {
                id,
                title: raw_title,
                artist: raw_uploader,
                duration,
                thumbnail,
            });
        }
    }

    Ok(results)
}

