use crate::db::{Database, DbTrack};
use lofty::file::{AudioFile, TaggedFileExt};
use lofty::probe::Probe;
use lofty::tag::Accessor;
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

const SUPPORTED_EXTENSIONS: &[&str] = &["mp3", "flac", "wav", "ogg", "m4a", "aac", "opus"];

pub fn scan_directory<P: AsRef<Path>>(dir_path: P, db: &Database) -> Result<usize, String> {
    let path = dir_path.as_ref();
    if !path.exists() || !path.is_dir() {
        return Err(format!("Directory path does not exist or is not a directory: {:?}", path));
    }

    let mut scanned_count = 0;

    for entry in WalkDir::new(path).into_iter().filter_map(|e| e.ok()) {
        let entry_path = entry.path();
        if entry_path.is_file() {
            if let Some(ext) = entry_path.extension().and_then(|s| s.to_str()) {
                if SUPPORTED_EXTENSIONS.contains(&ext.to_lowercase().as_str()) {
                    if let Ok(track) = extract_metadata(entry_path) {
                        if db.insert_track(&track).is_ok() {
                            scanned_count += 1;
                        }
                    }
                }
            }
        }
    }

    Ok(scanned_count)
}

pub fn extract_metadata(file_path: &Path) -> Result<DbTrack, String> {
    let tagged_file = Probe::open(file_path)
        .map_err(|e| e.to_string())?
        .read()
        .map_err(|e| e.to_string())?;

    let properties = tagged_file.properties();
    let duration = properties.duration().as_secs_f64();

    let tag = tagged_file.primary_tag().or_else(|| tagged_file.first_tag());

    let file_stem = file_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Unknown Title");

    let title = tag
        .and_then(|t| t.title().map(|s| s.to_string()))
        .unwrap_or_else(|| file_stem.to_string());

    let artist = tag
        .and_then(|t| t.artist().map(|s| s.to_string()))
        .unwrap_or_else(|| "Unknown Artist".to_string());

    let album = tag.and_then(|t| t.album().map(|s| s.to_string()));

    // Check for sidecar .lrc or .elrc
    let (has_lyrics, raw_lyrics) = find_sidecar_lyrics(file_path);

    let path_str = file_path.to_string_lossy().to_string();
    let track_id = format!("local:{}", path_str.replace('\\', "/"));

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;

    Ok(DbTrack {
        id: track_id.clone(),
        source: "local".to_string(),
        source_id: path_str.clone(),
        title,
        artist,
        album,
        duration,
        path: Some(path_str),
        artwork_url: None,
        has_lyrics,
        raw_lyrics,
        added_at: now,
    })
}

fn find_sidecar_lyrics(audio_path: &Path) -> (bool, Option<String>) {
    // 1. Check same stem with .elrc
    let elrc_path = audio_path.with_extension("elrc");
    if elrc_path.exists() {
        if let Ok(content) = fs::read_to_string(&elrc_path) {
            return (true, Some(content));
        }
    }

    // 2. Check same stem with .lrc
    let lrc_path = audio_path.with_extension("lrc");
    if lrc_path.exists() {
        if let Ok(content) = fs::read_to_string(&lrc_path) {
            return (true, Some(content));
        }
    }

    (false, None)
}
