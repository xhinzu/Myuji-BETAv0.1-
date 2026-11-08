import sqlite3
import time
from pathlib import Path
from typing import Optional, Tuple

class AlignmentCache:
    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            db_path = str(Path(__file__).parent.parent / "aligner_cache.db")
        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS alignment_cache (
                    hash TEXT PRIMARY KEY,
                    result_json TEXT NOT NULL,
                    enhanced_lrc TEXT NOT NULL,
                    model TEXT NOT NULL,
                    created_at INTEGER NOT NULL,
                    hits INTEGER DEFAULT 1
                )
                """
            )
            conn.commit()

    def get(self, cache_hash: str) -> Optional[Tuple[str, str]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT result_json, enhanced_lrc FROM alignment_cache WHERE hash = ?",
                (cache_hash,),
            )
            row = cursor.fetchone()
            if row:
                conn.execute(
                    "UPDATE alignment_cache SET hits = hits + 1 WHERE hash = ?",
                    (cache_hash,),
                )
                conn.commit()
                return (row["result_json"], row["enhanced_lrc"])
        return None

    def set(self, cache_hash: str, result_json: str, enhanced_lrc: str, model: str):
        with self._get_connection() as conn:
            now = int(time.time())
            conn.execute(
                """
                INSERT OR REPLACE INTO alignment_cache (hash, result_json, enhanced_lrc, model, created_at, hits)
                VALUES (?, ?, ?, ?, ?, COALESCE((SELECT hits + 1 FROM alignment_cache WHERE hash = ?), 1))
                """,
                (cache_hash, result_json, enhanced_lrc, model, now, cache_hash),
            )
            conn.commit()
