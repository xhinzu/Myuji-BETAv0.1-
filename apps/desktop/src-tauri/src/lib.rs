pub mod aligner_manager;
pub mod db;
pub mod library;
pub mod youtube;

use aligner_manager::{AlignerManager, AlignerStatus};
use db::{Database, DbTrack};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tauri::State;
use youtube::{
    search_youtube, LoopbackProxy, StreamResolver, ToolManager, ToolStatus,
    YouTubeTrack,
};

#[derive(Debug, Serialize, Deserialize)]
pub struct AppStatus {
    pub name: String,
    pub version: String,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ResolvedAudioResult {
    pub stream_url: String,
    pub title: String,
    pub artist: String,
    pub duration: f64,
    pub thumbnail: Option<String>,
    pub format_id: String,
}

pub struct AppState {
    pub db: Arc<Mutex<Database>>,
    pub tool_manager: Arc<ToolManager>,
    pub resolver: Arc<StreamResolver>,
    pub proxy: Arc<Mutex<Option<LoopbackProxy>>>,
    pub aligner_manager: Arc<AlignerManager>,
}

pub mod commands {
    use super::*;

    #[tauri::command]
    pub fn get_app_status() -> AppStatus {
        AppStatus {
            name: "MyuJiku".to_string(),
            version: "2.0.0".to_string(),
            status: "active".to_string(),
        }
    }

    #[tauri::command]
    pub fn greet(name: &str) -> String {
        format!("Hello, {}! Welcome to MyuJiku v2.", name)
    }

    #[tauri::command]
    pub fn get_ytdlp_status(state: State<'_, AppState>) -> ToolStatus {
        state.tool_manager.get_status()
    }

    #[tauri::command]
    pub fn check_ytdlp_status(state: State<'_, AppState>) -> ToolStatus {
        state.tool_manager.get_status()
    }

    #[tauri::command]
    pub async fn resolve_youtube_stream(
        state: State<'_, AppState>,
        video_id: String,
    ) -> Result<ResolvedAudioResult, String> {
        let tool_path = state.tool_manager.get_yt_dlp_path();
        let qjs_path = state.tool_manager.get_qjs_path();

        let resolved = state
            .resolver
            .resolve_audio(&video_id, &tool_path, Some(&qjs_path))?;

        // Ensure loopback proxy is running
        let proxy_url = {
            let mut proxy_lock = state.proxy.lock().map_err(|e| e.to_string())?;
            if proxy_lock.is_none() {
                let new_proxy = LoopbackProxy::start(
                    state.resolver.clone(),
                    state.tool_manager.clone(),
                )?;
                *proxy_lock = Some(new_proxy);
            }
            let proxy_ref = proxy_lock.as_ref().unwrap();
            proxy_ref.build_stream_url(&video_id)
        };

        Ok(ResolvedAudioResult {
            stream_url: proxy_url,
            title: resolved.title,
            artist: resolved.artist,
            duration: resolved.duration,
            thumbnail: resolved.thumbnail,
            format_id: resolved.format_id,
        })
    }

    #[tauri::command]
    pub async fn search_youtube_tracks(
        state: State<'_, AppState>,
        query: String,
        limit: Option<usize>,
    ) -> Result<Vec<YouTubeTrack>, String> {
        let tool_path = state.tool_manager.get_yt_dlp_path();
        let max_results = limit.unwrap_or(15);
        search_youtube(&query, max_results, &tool_path)
    }

    #[tauri::command]
    pub async fn get_home_shelves(
        state: State<'_, AppState>,
    ) -> Result<serde_json::Value, String> {
        let tool_path = state.tool_manager.get_yt_dlp_path();
        
        let trending = search_youtube("top music hits 2026", 8, &tool_path).unwrap_or_default();
        let lofi_chill = search_youtube("chill lofi hip hop official audio", 8, &tool_path).unwrap_or_default();

        Ok(serde_json::json!({
            "trending": trending,
            "lofi": lofi_chill
        }))
    }

    #[tauri::command]
    pub async fn scan_local_folder(
        state: State<'_, AppState>,
        folder_path: String,
    ) -> Result<usize, String> {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        library::scan_directory(&folder_path, &db)
    }

    #[tauri::command]
    pub async fn get_library_tracks(state: State<'_, AppState>) -> Result<Vec<DbTrack>, String> {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        db.get_all_tracks().map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn search_library(
        state: State<'_, AppState>,
        query: String,
    ) -> Result<Vec<DbTrack>, String> {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        db.search_tracks(&query).map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn toggle_like(state: State<'_, AppState>, track_id: String) -> Result<bool, String> {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        db.toggle_like(&track_id).map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn get_liked_tracks(state: State<'_, AppState>) -> Result<Vec<DbTrack>, String> {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        db.get_liked_tracks().map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn add_play_history(
        state: State<'_, AppState>,
        track_id: String,
    ) -> Result<(), String> {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        db.add_play_history(&track_id).map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub async fn check_aligner_health(state: State<'_, AppState>) -> Result<bool, String> {
        state.aligner_manager.check_health()
    }

    #[tauri::command]
    pub async fn start_aligner_sidecar(state: State<'_, AppState>) -> Result<AlignerStatus, String> {
        state.aligner_manager.start()?;
        let running = state.aligner_manager.is_running();
        Ok(AlignerStatus {
            running,
            port: state.aligner_manager.get_port(),
            token: state.aligner_manager.get_token().to_string(),
            model: "base".to_string(),
            last_error: None,
        })
    }

    #[tauri::command]
    pub async fn stop_aligner_sidecar(state: State<'_, AppState>) -> Result<(), String> {
        state.aligner_manager.stop();
        Ok(())
    }

    #[tauri::command]
    pub async fn toggle_mini_player(window: tauri::Window, is_mini: bool) -> Result<(), String> {
        use tauri::{LogicalSize, Size};
        if is_mini {
            let _ = window.set_always_on_top(true);
            let _ = window.set_size(Size::Logical(LogicalSize {
                width: 380.0,
                height: 180.0,
            }));
            let _ = window.set_resizable(false);
        } else {
            let _ = window.set_always_on_top(false);
            let _ = window.set_size(Size::Logical(LogicalSize {
                width: 1200.0,
                height: 800.0,
            }));
            let _ = window.set_resizable(true);
        }
        Ok(())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db = match Database::open("myujiku.db") {
        Ok(db) => db,
        Err(_) => Database::open_in_memory().expect("failed to open in-memory database"),
    };

    let tool_manager = Arc::new(ToolManager::new());
    let resolver = Arc::new(StreamResolver::new());
    let aligner_manager = Arc::new(AlignerManager::new());
    
    // Start loopback range-proxy
    let proxy = match LoopbackProxy::start(resolver.clone(), tool_manager.clone()) {
        Ok(p) => Some(p),
        Err(e) => {
            eprintln!("Failed to start loopback proxy on startup: {}", e);
            None
        }
    };

    let app_state = AppState {
        db: Arc::new(Mutex::new(db)),
        tool_manager,
        resolver,
        proxy: Arc::new(Mutex::new(proxy)),
        aligner_manager,
    };

    tauri::Builder::default()
        .manage(app_state)
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_app_status,
            commands::greet,
            commands::get_ytdlp_status,
            commands::check_ytdlp_status,
            commands::resolve_youtube_stream,
            commands::search_youtube_tracks,
            commands::get_home_shelves,
            commands::scan_local_folder,
            commands::get_library_tracks,
            commands::search_library,
            commands::toggle_like,
            commands::get_liked_tracks,
            commands::add_play_history,
            commands::check_aligner_health,
            commands::start_aligner_sidecar,
            commands::stop_aligner_sidecar,
            commands::toggle_mini_player
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
