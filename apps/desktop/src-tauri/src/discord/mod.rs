use serde::{Deserialize, Serialize};
use std::fs::OpenOptions;
use std::io::{Read, Write};
use std::process;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

pub const DISCORD_APP_ID: &str = "1567903090177343499";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscordPresencePayload {
  pub title: String,
  pub artist: String,
  pub album: Option<String>,
  pub duration_secs: Option<f64>,
  pub elapsed_secs: Option<f64>,
  pub room_code: Option<String>,
  pub cover_url: Option<String>,
  pub hide_details: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscordRpcStatus {
  pub connected: bool,
  pub application_id: String,
  pub last_error: Option<String>,
}

pub struct DiscordRpcManager {
  application_id: String,
  is_connected: Mutex<bool>,
  last_error: Mutex<Option<String>>,
}

impl DiscordRpcManager {
  pub fn new() -> Self {
    Self {
      application_id: DISCORD_APP_ID.to_string(),
      is_connected: Mutex::new(false),
      last_error: Mutex::new(None),
    }
  }

  pub fn get_status(&self) -> DiscordRpcStatus {
    DiscordRpcStatus {
      connected: *self.is_connected.lock().unwrap(),
      application_id: self.application_id.clone(),
      last_error: self.last_error.lock().unwrap().clone(),
    }
  }

  /// Sends a packet over the Windows Discord IPC named pipe
  fn send_ipc_payload(&self, opcode: u32, payload_json: &str) -> Result<String, String> {
    for i in 0..10 {
      let pipe_path = format!(r"\\.\pipe\discord-ipc-{}", i);
      let mut pipe = match OpenOptions::new().read(true).write(true).open(&pipe_path) {
        Ok(file) => file,
        Err(_) => continue,
      };

      // 1. Send Handshake
      let handshake = serde_json::json!({
        "v": 1,
        "client_id": self.application_id
      })
      .to_string();

      let mut handshake_buf = Vec::with_capacity(8 + handshake.len());
      handshake_buf.extend_from_slice(&(0u32).to_le_bytes()); // Opcode 0 = Handshake
      handshake_buf.extend_from_slice(&(handshake.len() as u32).to_le_bytes());
      handshake_buf.extend_from_slice(handshake.as_bytes());

      if pipe.write_all(&handshake_buf).is_err() {
        continue;
      }

      // Read handshake response
      let mut header = [0u8; 8];
      if pipe.read_exact(&mut header).is_err() {
        continue;
      }
      let resp_len = u32::from_le_bytes([header[4], header[5], header[6], header[7]]) as usize;
      let mut resp_buf = vec![0u8; resp_len];
      if pipe.read_exact(&mut resp_buf).is_err() {
        continue;
      }

      // 2. Send requested opcode payload (e.g. SET_ACTIVITY)
      let mut packet = Vec::with_capacity(8 + payload_json.len());
      packet.extend_from_slice(&opcode.to_le_bytes());
      packet.extend_from_slice(&(payload_json.len() as u32).to_le_bytes());
      packet.extend_from_slice(payload_json.as_bytes());

      if let Err(e) = pipe.write_all(&packet) {
        *self.last_error.lock().unwrap() = Some(format!("Pipe write failed: {}", e));
        continue;
      }

      // Read reply
      let mut reply_header = [0u8; 8];
      if pipe.read_exact(&mut reply_header).is_ok() {
        let reply_len = u32::from_le_bytes([
          reply_header[4],
          reply_header[5],
          reply_header[6],
          reply_header[7],
        ]) as usize;
        let mut reply_body = vec![0u8; reply_len];
        if pipe.read_exact(&mut reply_body).is_ok() {
          *self.is_connected.lock().unwrap() = true;
          *self.last_error.lock().unwrap() = None;
          return Ok(String::from_utf8_lossy(&reply_body).to_string());
        }
      }

      *self.is_connected.lock().unwrap() = true;
      return Ok("sent".to_string());
    }

    *self.is_connected.lock().unwrap() = false;
    let err = "Discord desktop client is not running or named pipe unreachable".to_string();
    *self.last_error.lock().unwrap() = Some(err.clone());
    Err(err)
  }

  /// Sets or updates the current playing activity
  pub fn set_activity(&self, data: DiscordPresencePayload) -> Result<(), String> {
    let now = SystemTime::now()
      .duration_since(UNIX_EPOCH)
      .unwrap_or_default()
      .as_secs();

    let details = if data.hide_details {
      "Listening to Music".to_string()
    } else {
      data.title
    };

    let state = if data.hide_details {
      "MyuJiku Desktop".to_string()
    } else {
      data.artist
    };

    let (start_time, end_time) = match (data.duration_secs, data.elapsed_secs) {
      (Some(dur), Some(el)) if dur > 0.0 => {
        let start = now.saturating_sub(el as u64);
        let end = start + (dur as u64);
        (Some(start), Some(end))
      }
      _ => (Some(now), None),
    };

    let large_image = if data.hide_details {
      "myujiku_logo".to_string()
    } else {
      data.cover_url.unwrap_or_else(|| "myujiku_logo".to_string())
    };

    let mut buttons = Vec::new();
    if let Some(code) = data.room_code {
      buttons.push(serde_json::json!({
        "label": "Listen Along",
        "url": format!("https://myujiku.app/room/{}", code)
      }));
    }

    let activity = serde_json::json!({
      "details": details,
      "state": state,
      "timestamps": {
        "start": start_time,
        "end": end_time
      },
      "assets": {
        "large_image": large_image,
        "large_text": "MyuJiku v2 — Synced Lyrics",
        "small_image": "play",
        "small_text": "Playing"
      },
      "buttons": if buttons.is_empty() { serde_json::Value::Null } else { serde_json::json!(buttons) }
    });

    let frame = serde_json::json!({
      "cmd": "SET_ACTIVITY",
      "args": {
        "pid": process::id(),
        "activity": activity
      },
      "nonce": format!("myu-{}", now)
    })
    .to_string();

    self.send_ipc_payload(1, &frame)?;
    Ok(())
  }

  /// Clears the current Discord activity
  pub fn clear_activity(&self) -> Result<(), String> {
    let now = SystemTime::now()
      .duration_since(UNIX_EPOCH)
      .unwrap_or_default()
      .as_secs();

    let frame = serde_json::json!({
      "cmd": "SET_ACTIVITY",
      "args": {
        "pid": process::id(),
        "activity": serde_json::Value::Null
      },
      "nonce": format!("clear-{}", now)
    })
    .to_string();

    let _ = self.send_ipc_payload(1, &frame);
    Ok(())
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_discord_rpc_initial_state() {
    let rpc = DiscordRpcManager::new();
    let status = rpc.get_status();
    assert_eq!(status.application_id, DISCORD_APP_ID);
    assert!(!status.connected);
  }
}

