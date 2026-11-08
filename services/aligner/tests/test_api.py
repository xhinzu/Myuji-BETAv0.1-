import io
import time
from fastapi.testclient import TestClient
from aligner.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "myujiku-aligner"

def test_models():
    response = client.get("/v1/models")
    assert response.status_code == 200
    data = response.json()
    assert "available_models" in data
    assert len(data["available_models"]) >= 3
    model_ids = [m["id"] for m in data["available_models"]]
    assert "tiny" in model_ids
    assert "base" in model_ids
    assert "small" in model_ids

def test_derive_lyrics():
    payload = {
        "plain_text": "First line of the song\nSecond line with some words\nThird line conclusion",
        "total_duration_seconds": 120.0,
    }
    response = client.post("/v1/derive", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["lines"]) == 3
    assert data["lines"][0]["words"][0]["text"] == "First"
    assert data["lines"][0]["start"] < data["lines"][0]["end"]
    assert "enhanced_lrc" in data

def test_align_endpoint_and_cache():
    nonce = str(time.time()).encode("utf-8")
    audio_content = b"FAKE_RIFF_WAVE_HEADER_AUDIO_BYTES_FOR_UNIT_TESTING_" + nonce
    lyrics_lrc = "[00:10.00] Never gonna give you up\n[00:25.00] Never gonna let you down"

    files = {"audio": ("test.wav", io.BytesIO(audio_content), "audio/wav")}
    data = {
        "lyrics": lyrics_lrc,
        "model": "base",
        "separate_vocals": "false",
        "duration": "60.0",
    }

    # First run (uncached)
    res1 = client.post("/v1/align", files=files, data=data)
    assert res1.status_code == 200
    json1 = res1.json()
    assert json1["status"] == "completed"
    assert json1["cached"] is False
    assert len(json1["lines"]) == 2
    assert "♪ Instrumental ♪" in json1["enhanced_lrc"]  # 15s gap between 10s and 25s

    # Second run with same inputs (cached)
    files2 = {"audio": ("test.wav", io.BytesIO(audio_content), "audio/wav")}
    res2 = client.post("/v1/align", files=files2, data=data)
    assert res2.status_code == 200
    json2 = res2.json()
    assert json2["status"] == "completed"
    assert json2["cached"] is True
    assert len(json2["lines"]) == len(json1["lines"])

