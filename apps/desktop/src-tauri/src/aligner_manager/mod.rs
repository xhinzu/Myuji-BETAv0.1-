use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::process::{Child, Command};
use std::sync::Mutex;
use std::time::{Duration, SystemTime};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlignerStatus {
    pub running: bool,
    pub port: u16,
    pub token: String,
    pub model: String,
    pub last_error: Option<String>,
}

pub struct AlignerManager {
    process: Mutex<Option<Child>>,
    port: u16,
    token: String,
}

impl AlignerManager {
    pub fn new() -> Self {
        let nonce = format!(
            "myujiku_aligner_{:?}",
            SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .unwrap_or_default()
        );
        let mut hasher = Sha256::new();
        hasher.update(nonce.as_bytes());
        let token = format!("{:x}", hasher.finalize())[..32].to_string();

        AlignerManager {
            process: Mutex::new(None),
            port: 8765,
            token,
        }
    }

    pub fn get_token(&self) -> &str {
        &self.token
    }

    pub fn get_port(&self) -> u16 {
        self.port
    }

    pub fn is_running(&self) -> bool {
        if let Ok(mut lock) = self.process.lock() {
            if let Some(ref mut child) = *lock {
                match child.try_wait() {
                    Ok(None) => return true,
                    _ => *lock = None,
                }
            }
        }
        false
    }

    pub fn start(&self) -> Result<(), String> {
        let mut lock = self.process.lock().map_err(|e| e.to_string())?;
        if lock.is_some() {
            return Ok(());
        }

        let mut cmd = Command::new("python");
        cmd.arg("-m")
            .arg("uvicorn")
            .arg("services.aligner.aligner.main:app")
            .arg("--port")
            .arg(self.port.to_string())
            .env("MYUJIKU_SIDECAR_TOKEN", &self.token);

        let child = cmd
            .spawn()
            .map_err(|e| format!("Failed to spawn aligner sidecar process: {}", e))?;

        *lock = Some(child);
        Ok(())
    }

    pub fn stop(&self) {
        if let Ok(mut lock) = self.process.lock() {
            if let Some(mut child) = lock.take() {
                let _ = child.kill();
            }
        }
    }

    pub fn check_health(&self) -> Result<bool, String> {
        let url = format!("http://127.0.0.1:{}/health", self.port);
        let client = reqwest::blocking::Client::builder()
            .timeout(Duration::from_millis(800))
            .build()
            .map_err(|e| e.to_string())?;

        match client.get(&url).send() {
            Ok(res) => Ok(res.status().is_success()),
            Err(_) => Ok(false),
        }
    }
}

impl Drop for AlignerManager {
    fn drop(&mut self) {
        self.stop();
    }
}
