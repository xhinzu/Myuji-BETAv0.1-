pub mod db;
pub mod library;

use db::{Database, DbTrack};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct AppStatus {
    pub name: String,
    pub version: String,
    pub status: String,
}

pub struct AppState {
    pub db: Arc<Mutex<Database>>,
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
    pub fn check_ytdlp_status() -> serde_json::Value {
        serde_json::json!({
            "installed": false,
            "version": null,
            "channel": "stable",
            "cache_cap_mb": 500,
        })
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

    let app_state = AppState {
        db: Arc::new(Mutex::new(db)),
    };

    tauri::Builder::default()
        .manage(app_state)
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_app_status,
            commands::greet,
            commands::check_ytdlp_status,
            commands::scan_local_folder,
            commands::get_library_tracks,
            commands::search_library,
            commands::toggle_like,
            commands::get_liked_tracks,
            commands::add_play_history,
            commands::toggle_mini_player
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
