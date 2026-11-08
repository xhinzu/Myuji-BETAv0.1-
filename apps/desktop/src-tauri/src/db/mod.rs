use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DbTrack {
    pub id: String,
    pub source: String,
    pub source_id: String,
    pub title: String,
    pub artist: String,
    pub album: Option<String>,
    pub duration: f64,
    pub path: Option<String>,
    pub artwork_url: Option<String>,
    pub has_lyrics: bool,
    pub raw_lyrics: Option<String>,
    pub added_at: i64,
}

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn open<P: AsRef<Path>>(path: P) -> Result<Self> {
        let conn = Connection::open(path)?;
        let db = Database { conn };
        db.init_schema()?;
        Ok(db)
    }

    pub fn open_in_memory() -> Result<Self> {
        let conn = Connection::open_in_memory()?;
        let db = Database { conn };
        db.init_schema()?;
        Ok(db)
    }

    fn init_schema(&self) -> Result<()> {
        self.conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS tracks (
                id TEXT PRIMARY KEY,
                source TEXT NOT NULL,
                source_id TEXT NOT NULL,
                title TEXT NOT NULL,
                artist TEXT NOT NULL,
                album TEXT,
                duration REAL NOT NULL,
                path TEXT,
                artwork_url TEXT,
                has_lyrics INTEGER DEFAULT 0,
                raw_lyrics TEXT,
                added_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS playlists (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                created_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS playlist_tracks (
                playlist_id TEXT NOT NULL,
                track_id TEXT NOT NULL,
                position INTEGER NOT NULL,
                PRIMARY KEY (playlist_id, track_id)
            );

            CREATE TABLE IF NOT EXISTS likes (
                track_id TEXT PRIMARY KEY,
                liked_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS play_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                track_id TEXT NOT NULL,
                played_at INTEGER NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist);
            CREATE INDEX IF NOT EXISTS idx_tracks_title ON tracks(title);
            CREATE INDEX IF NOT EXISTS idx_play_history_time ON play_history(played_at);
            ",
        )?;
        Ok(())
    }

    pub fn insert_track(&self, track: &DbTrack) -> Result<()> {
        self.conn.execute(
            "
            INSERT INTO tracks (id, source, source_id, title, artist, album, duration, path, artwork_url, has_lyrics, raw_lyrics, added_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                artist = excluded.artist,
                album = excluded.album,
                duration = excluded.duration,
                path = excluded.path,
                artwork_url = excluded.artwork_url,
                has_lyrics = excluded.has_lyrics,
                raw_lyrics = excluded.raw_lyrics
            ",
            params![
                track.id,
                track.source,
                track.source_id,
                track.title,
                track.artist,
                track.album,
                track.duration,
                track.path,
                track.artwork_url,
                if track.has_lyrics { 1 } else { 0 },
                track.raw_lyrics,
                track.added_at,
            ],
        )?;
        Ok(())
    }

    pub fn get_all_tracks(&self) -> Result<Vec<DbTrack>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, source, source_id, title, artist, album, duration, path, artwork_url, has_lyrics, raw_lyrics, added_at
             FROM tracks ORDER BY added_at DESC",
        )?;

        let track_iter = stmt.query_map([], |row| {
            Ok(DbTrack {
                id: row.get(0)?,
                source: row.get(1)?,
                source_id: row.get(2)?,
                title: row.get(3)?,
                artist: row.get(4)?,
                album: row.get(5)?,
                duration: row.get(6)?,
                path: row.get(7)?,
                artwork_url: row.get(8)?,
                has_lyrics: row.get::<_, i32>(9)? == 1,
                raw_lyrics: row.get(10)?,
                added_at: row.get(11)?,
            })
        })?;

        let mut tracks = Vec::new();
        for t in track_iter {
            tracks.push(t?);
        }
        Ok(tracks)
    }

    pub fn search_tracks(&self, query: &str) -> Result<Vec<DbTrack>> {
        let search_pattern = format!("%{}%", query);
        let mut stmt = self.conn.prepare(
            "SELECT id, source, source_id, title, artist, album, duration, path, artwork_url, has_lyrics, raw_lyrics, added_at
             FROM tracks
             WHERE title LIKE ?1 OR artist LIKE ?1 OR album LIKE ?1
             ORDER BY title ASC",
        )?;

        let track_iter = stmt.query_map(params![search_pattern], |row| {
            Ok(DbTrack {
                id: row.get(0)?,
                source: row.get(1)?,
                source_id: row.get(2)?,
                title: row.get(3)?,
                artist: row.get(4)?,
                album: row.get(5)?,
                duration: row.get(6)?,
                path: row.get(7)?,
                artwork_url: row.get(8)?,
                has_lyrics: row.get::<_, i32>(9)? == 1,
                raw_lyrics: row.get(10)?,
                added_at: row.get(11)?,
            })
        })?;

        let mut tracks = Vec::new();
        for t in track_iter {
            tracks.push(t?);
        }
        Ok(tracks)
    }

    pub fn toggle_like(&self, track_id: &str) -> Result<bool> {
        let exists: bool = self.conn.query_row(
            "SELECT COUNT(1) FROM likes WHERE track_id = ?1",
            params![track_id],
            |row| row.get::<_, i64>(0).map(|count| count > 0),
        )?;

        if exists {
            self.conn.execute("DELETE FROM likes WHERE track_id = ?1", params![track_id])?;
            Ok(false)
        } else {
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs() as i64;
            self.conn.execute(
                "INSERT INTO likes (track_id, liked_at) VALUES (?1, ?2)",
                params![track_id, now],
            )?;
            Ok(true)
        }
    }

    pub fn get_liked_tracks(&self) -> Result<Vec<DbTrack>> {
        let mut stmt = self.conn.prepare(
            "SELECT t.id, t.source, t.source_id, t.title, t.artist, t.album, t.duration, t.path, t.artwork_url, t.has_lyrics, t.raw_lyrics, t.added_at
             FROM tracks t
             INNER JOIN likes l ON t.id = l.track_id
             ORDER BY l.liked_at DESC",
        )?;

        let track_iter = stmt.query_map([], |row| {
            Ok(DbTrack {
                id: row.get(0)?,
                source: row.get(1)?,
                source_id: row.get(2)?,
                title: row.get(3)?,
                artist: row.get(4)?,
                album: row.get(5)?,
                duration: row.get(6)?,
                path: row.get(7)?,
                artwork_url: row.get(8)?,
                has_lyrics: row.get::<_, i32>(9)? == 1,
                raw_lyrics: row.get(10)?,
                added_at: row.get(11)?,
            })
        })?;

        let mut tracks = Vec::new();
        for t in track_iter {
            tracks.push(t?);
        }
        Ok(tracks)
    }

    pub fn add_play_history(&self, track_id: &str) -> Result<()> {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;
        self.conn.execute(
            "INSERT INTO play_history (track_id, played_at) VALUES (?1, ?2)",
            params![track_id, now],
        )?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_db_init_and_insert() {
        let db = Database::open_in_memory().expect("in-memory db failed");
        let track = DbTrack {
            id: "local:test.mp3".to_string(),
            source: "local".to_string(),
            source_id: "test.mp3".to_string(),
            title: "Test Song".to_string(),
            artist: "Test Artist".to_string(),
            album: Some("Test Album".to_string()),
            duration: 180.5,
            path: Some("F:/Music/test.mp3".to_string()),
            artwork_url: None,
            has_lyrics: true,
            raw_lyrics: Some("[00:01.00]Line 1".to_string()),
            added_at: 1000,
        };

        db.insert_track(&track).expect("insert failed");
        let tracks = db.get_all_tracks().expect("query failed");
        assert_eq!(tracks.len(), 1);
        assert_eq!(tracks[0].title, "Test Song");
        assert_eq!(tracks[0].duration, 180.5);

        // Test search
        let results = db.search_tracks("Test Song").expect("search failed");
        assert_eq!(results.len(), 1);
        let no_results = db.search_tracks("Nonexistent").expect("search failed");
        assert_eq!(no_results.len(), 0);

        // Test likes toggle
        let liked = db.toggle_like("local:test.mp3").expect("like failed");
        assert!(liked);
        let liked_tracks = db.get_liked_tracks().expect("get likes failed");
        assert_eq!(liked_tracks.len(), 1);

        let unliked = db.toggle_like("local:test.mp3").expect("unlike failed");
        assert!(!unliked);
        let liked_tracks_after = db.get_liked_tracks().expect("get likes failed");
        assert_eq!(liked_tracks_after.len(), 0);

        // Test play history
        db.add_play_history("local:test.mp3").expect("add history failed");
    }
}
