pub mod proxy;
pub mod resolver;
pub mod search;
pub mod tool_manager;

pub use proxy::LoopbackProxy;
pub use resolver::{ResolvedStreamInfo, StreamResolver};
pub use search::{search_youtube, YouTubeTrack};
pub use tool_manager::{ToolManager, ToolStatus};

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Arc;

    #[test]
    fn test_tool_manager_detection() {
        let manager = ToolManager::new();
        let status = manager.get_status();
        assert!(status.installed, "yt-dlp should be installed in tools directory");
        assert!(status.js_runtime.is_some(), "QuickJS-NG runtime should be detected");
    }

    #[test]
    fn test_proxy_startup_and_ping() {
        let tool_mgr = Arc::new(ToolManager::new());
        let resolver = Arc::new(StreamResolver::new());
        let proxy = LoopbackProxy::start(resolver, tool_mgr).expect("proxy should start");
        assert!(proxy.get_port() > 0, "proxy port should be assigned by OS");

        let ping_url = format!("http://127.0.0.1:{}/ping", proxy.get_port());
        let client = reqwest::blocking::Client::new();
        let res = client.get(&ping_url).send().expect("ping request should succeed");
        assert_eq!(res.status(), reqwest::StatusCode::OK);
        assert_eq!(res.text().unwrap(), "pong");
    }

    #[test]
    fn test_search_empty_query() {
        let manager = ToolManager::new();
        let results = search_youtube("", 10, &manager.get_yt_dlp_path()).unwrap();
        assert!(results.is_empty());
    }
}
