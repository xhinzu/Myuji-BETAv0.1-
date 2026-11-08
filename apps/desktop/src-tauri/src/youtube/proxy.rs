use super::resolver::StreamResolver;
use super::tool_manager::ToolManager;
use sha2::{Digest, Sha256};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::SystemTime;
use tiny_http::{Header, Response, Server, StatusCode};

pub struct LoopbackProxy {
    port: u16,
    session_token: String,
    running: Arc<AtomicBool>,
}

impl LoopbackProxy {
    pub fn start(
        resolver: Arc<StreamResolver>,
        tool_manager: Arc<ToolManager>,
    ) -> Result<Self, String> {
        let server = Server::http("127.0.0.1:0").map_err(|e| e.to_string())?;
        let port = server.server_addr().to_ip().map(|a| a.port()).unwrap_or(0);

        // Generate per-session token
        let nonce = format!(
            "myujiku_proxy_{}_{:?}",
            port,
            SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .unwrap_or_default()
        );
        let mut hasher = Sha256::new();
        hasher.update(nonce.as_bytes());
        let session_token = format!("{:x}", hasher.finalize())[..24].to_string();

        let running = Arc::new(AtomicBool::new(true));
        let running_clone = running.clone();
        let token_clone = session_token.clone();

        thread::spawn(move || {
            let client = reqwest::blocking::Client::builder()
                .timeout(std::time::Duration::from_secs(30))
                .build()
                .unwrap_or_default();

            for request in server.incoming_requests() {
                if !running_clone.load(Ordering::Relaxed) {
                    break;
                }

                let url_raw = request.url().to_string();
                let method = request.method().as_str().to_uppercase();

                // CORS preflight
                if method == "OPTIONS" {
                    let mut resp = Response::empty(StatusCode(200));
                    if let Ok(h1) = Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]) {
                        resp.add_header(h1);
                    }
                    if let Ok(h2) = Header::from_bytes(&b"Access-Control-Allow-Methods"[..], &b"GET, HEAD, OPTIONS"[..]) {
                        resp.add_header(h2);
                    }
                    if let Ok(h3) = Header::from_bytes(&b"Access-Control-Allow-Headers"[..], &b"Range, Content-Type, Accept"[..]) {
                        resp.add_header(h3);
                    }
                    let _ = request.respond(resp);
                    continue;
                }

                // Ping route
                if url_raw.starts_with("/ping") {
                    let mut resp = Response::from_string("pong");
                    if let Ok(h) = Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]) {
                        resp.add_header(h);
                    }
                    let _ = request.respond(resp);
                    continue;
                }

                if !url_raw.starts_with("/stream") {
                    let _ = request.respond(Response::empty(StatusCode(404)));
                    continue;
                }

                // Parse query parameters
                let query_str = url_raw.split_once('?').map(|x| x.1).unwrap_or("");
                let mut token_val = None;
                let mut video_id_val = None;

                for pair in query_str.split('&') {
                    if let Some((k, v)) = pair.split_once('=') {
                        if k == "token" {
                            token_val = Some(v.to_string());
                        } else if k == "id" {
                            video_id_val = Some(v.to_string());
                        }
                    }
                }

                // Validate session token
                if token_val.as_deref() != Some(&token_clone) {
                    let _ = request.respond(Response::empty(StatusCode(403)));
                    continue;
                }

                let video_id = match video_id_val {
                    Some(id) if !id.is_empty() => id,
                    _ => {
                        let _ = request.respond(Response::empty(StatusCode(400)));
                        continue;
                    }
                };

                // Get stream URL (cached or resolve)
                let stream_info = match resolver.get_cached(&video_id) {
                    Some(info) => Ok(info),
                    None => {
                        let yt_path = tool_manager.get_yt_dlp_path();
                        let qjs_path = tool_manager.get_qjs_path();
                        resolver.resolve_audio(&video_id, &yt_path, Some(&qjs_path))
                    }
                };

                let stream_info = match stream_info {
                    Ok(info) => info,
                    Err(e) => {
                        let mut resp = Response::from_string(format!("Failed to resolve stream: {}", e))
                            .with_status_code(StatusCode(502));
                        if let Ok(h) = Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]) {
                            resp.add_header(h);
                        }
                        let _ = request.respond(resp);
                        continue;
                    }
                };

                // Forward client Range header
                let mut req_builder = client.get(&stream_info.url).header(
                    reqwest::header::USER_AGENT,
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                );

                for header in request.headers() {
                    if header.field.equiv("range") {
                        req_builder = req_builder.header("Range", header.value.as_str());
                    }
                }

                let mut upstream_res = match req_builder.send() {
                    Ok(res) => res,
                    Err(_) => {
                        let _ = request.respond(Response::empty(StatusCode(504)));
                        continue;
                    }
                };

                // If upstream is 403 / 410, re-resolve and retry once
                if upstream_res.status() == reqwest::StatusCode::FORBIDDEN
                    || upstream_res.status() == reqwest::StatusCode::GONE
                {
                    let yt_path = tool_manager.get_yt_dlp_path();
                    let qjs_path = tool_manager.get_qjs_path();
                    if let Ok(fresh_info) = resolver.resolve_audio(&video_id, &yt_path, Some(&qjs_path)) {
                        let mut retry_builder = client.get(&fresh_info.url).header(
                            reqwest::header::USER_AGENT,
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        );
                        for header in request.headers() {
                            if header.field.equiv("range") {
                                retry_builder = retry_builder.header("Range", header.value.as_str());
                            }
                        }
                        if let Ok(res2) = retry_builder.send() {
                            upstream_res = res2;
                        }
                    }
                }

                let status_code = upstream_res.status().as_u16();
                let is_partial = status_code == 206;

                let mut response_headers = Vec::new();
                if let Ok(h) = Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]) {
                    response_headers.push(h);
                }
                if let Ok(h) = Header::from_bytes(&b"Access-Control-Expose-Headers"[..], &b"Content-Range, Content-Length, Accept-Ranges"[..]) {
                    response_headers.push(h);
                }
                if let Ok(h) = Header::from_bytes(&b"Accept-Ranges"[..], &b"bytes"[..]) {
                    response_headers.push(h);
                }

                if let Some(content_type) = upstream_res.headers().get(reqwest::header::CONTENT_TYPE) {
                    if let Ok(val) = content_type.to_str() {
                        if let Ok(h) = Header::from_bytes(&b"Content-Type"[..], val.as_bytes()) {
                            response_headers.push(h);
                        }
                    }
                } else if let Ok(h) = Header::from_bytes(&b"Content-Type"[..], &b"audio/webm"[..]) {
                    response_headers.push(h);
                }

                if let Some(content_range) = upstream_res.headers().get("content-range") {
                    if let Ok(val) = content_range.to_str() {
                        if let Ok(h) = Header::from_bytes(&b"Content-Range"[..], val.as_bytes()) {
                            response_headers.push(h);
                        }
                    }
                }

                let content_len = upstream_res.content_length();
                let response = Response::new(
                    StatusCode(if is_partial { 206 } else { 200 }),
                    response_headers,
                    upstream_res,
                    content_len.map(|l| l as usize),
                    None,
                );

                let _ = request.respond(response);
            }
        });

        Ok(LoopbackProxy {
            port,
            session_token,
            running,
        })
    }

    pub fn get_port(&self) -> u16 {
        self.port
    }

    pub fn get_session_token(&self) -> &str {
        &self.session_token
    }

    pub fn build_stream_url(&self, video_id: &str) -> String {
        format!(
            "http://127.0.0.1:{}/stream?id={}&token={}",
            self.port, video_id, self.session_token
        )
    }

    pub fn stop(&self) {
        self.running.store(false, Ordering::Relaxed);
    }
}

impl Drop for LoopbackProxy {
    fn drop(&mut self) {
        self.stop();
    }
}
