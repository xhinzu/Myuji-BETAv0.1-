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
    assert "[by:MyuJiku aligner v2.0]" in data["enhanced_lrc"]
