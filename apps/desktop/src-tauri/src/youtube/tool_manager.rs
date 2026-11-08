use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs::{self, File};
use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolStatus {
    pub installed: bool,
    pub yt_dlp_path: Option<String>,
    pub yt_dlp_version: Option<String>,
    pub channel: String,
    pub js_runtime: Option<String>,
    pub js_runtime_path: Option<String>,
    pub last_updated: Option<i64>,
    pub last_error: Option<String>,
}

pub struct ToolManager {
    tools_dir: PathBuf,
}

impl ToolManager {
    pub fn new() -> Self {
        // Prioritize F:\vbcode\tools during development
        let dev_dir = PathBuf::from("F:\\vbcode\\tools");
        let tools_dir = if dev_dir.exists() || Path::new("F:\\vbcode").exists() {
            let _ = fs::create_dir_all(&dev_dir);
            dev_dir
        } else {
            let mut p = std::env::temp_dir();
            p.push("myujiku_tools");
            let _ = fs::create_dir_all(&p);
            p
        };

        ToolManager { tools_dir }
    }

    pub fn get_tools_dir(&self) -> &Path {
        &self.tools_dir
    }

    pub fn get_yt_dlp_path(&self) -> PathBuf {
        self.tools_dir.join("yt-dlp.exe")
    }

    pub fn get_qjs_path(&self) -> PathBuf {
        self.tools_dir.join("qjs.exe")
    }

    pub fn get_status(&self) -> ToolStatus {
        let yt_path = self.get_yt_dlp_path();
        let qjs_path = self.get_qjs_path();

        let installed = yt_path.exists();
        let mut version = None;

        if installed {
            if let Ok(output) = Command::new(&yt_path).arg("--version").output() {
                if output.status.success() {
                    version = Some(String::from_utf8_lossy(&output.stdout).trim().to_string());
                }
            }
        }

        let js_runtime = if qjs_path.exists() {
            Some("quickjs".to_string())
        } else {
            None
        };

        ToolStatus {
            installed,
            yt_dlp_path: if installed { Some(yt_path.to_string_lossy().to_string()) } else { None },
            yt_dlp_version: version,
            channel: "stable".to_string(),
            js_runtime,
            js_runtime_path: if qjs_path.exists() { Some(qjs_path.to_string_lossy().to_string()) } else { None },
            last_updated: None,
            last_error: None,
        }
    }

    pub fn verify_sha256(file_path: &Path, expected_hex: &str) -> Result<bool, String> {
        let mut file = File::open(file_path).map_err(|e| e.to_string())?;
        let mut hasher = Sha256::new();
        let mut buffer = [0u8; 8192];

        loop {
            let count = file.read(&mut buffer).map_err(|e| e.to_string())?;
            if count == 0 {
                break;
            }
            hasher.update(&buffer[..count]);
        }

        let hash_bytes = hasher.finalize();
        let computed = format!("{:x}", hash_bytes);
        Ok(computed.eq_ignore_ascii_case(expected_hex.trim()))
    }
}
