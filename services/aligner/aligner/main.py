import os
import json
from typing import Optional
from fastapi import FastAPI, HTTPException, Header, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from aligner.models import (
    DeriveRequest,
    DeriveResponse,
    AlignResponse,
    LineTiming,
    WordTiming,
)
from aligner.engine import WindowConstrainedAligner
from aligner.cache import AlignmentCache

app = FastAPI(
    title="MyuJiku Aligner Service",
    version="2.0.0",
    description="Local sidecar / remote forced-alignment service for word-synced lyrics",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cache = AlignmentCache()
aligner_engine = WindowConstrainedAligner()

SIDECAR_TOKEN = os.getenv("MYUJIKU_SIDECAR_TOKEN", "")

def verify_token(x_myujiku_sidecar_token: Optional[str] = Header(None)):
    if SIDECAR_TOKEN and x_myujiku_sidecar_token != SIDECAR_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid sidecar authentication token")
    return True

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "myujiku-aligner",
        "version": "2.0.0",
    }

@app.get("/v1/models")
def get_available_models():
    return {
        "available_models": [
            {
                "id": "tiny",
                "name": "Whisper Tiny",
                "size_mb": 75,
                "vram_mb": 500,
                "recommended": False,
            },
            {
                "id": "base",
                "name": "Whisper Base",
                "size_mb": 145,
                "vram_mb": 1000,
                "recommended": True,
            },
            {
                "id": "small",
                "name": "Whisper Small",
                "size_mb": 480,
                "vram_mb": 2000,
                "recommended": False,
            },
        ]
    }

@app.post("/v1/derive", response_model=DeriveResponse)
def derive_lyrics_timing(req: DeriveRequest):
    lines_raw = [l.strip() for l in req.plain_text.splitlines() if l.strip()]
    if not lines_raw:
        raise HTTPException(status_code=400, detail="Empty plain text lyrics")

    duration = req.total_duration_seconds if req.total_duration_seconds > 10 else 180.0
    lines, elrc = aligner_engine.align(req.plain_text, total_duration=duration, model_name="derived")
    return DeriveResponse(lines=lines, enhanced_lrc=elrc)

@app.post("/v1/align", response_model=AlignResponse)
async def align_lyrics(
    audio: UploadFile = File(...),
    lyrics: str = Form(...),
    model: str = Form("base"),
    separate_vocals: bool = Form(False),
    duration: Optional[float] = Form(180.0),
    auth: bool = Depends(verify_token),
):
    if not lyrics.strip():
        raise HTTPException(status_code=400, detail="Lyrics text cannot be empty")

    audio_bytes = await audio.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded audio file is empty")

    # Check cache
    cache_key = WindowConstrainedAligner.compute_hash(audio_bytes, lyrics, model, separate_vocals)
    cached_data = cache.get(cache_key)
    if cached_data:
        cached_json, cached_elrc = cached_data
        parsed_lines = [LineTiming(**item) for item in json.loads(cached_json)]
        return AlignResponse(
            status="completed",
            lines=parsed_lines,
            enhanced_lrc=cached_elrc,
            cached=True,
            model=model,
        )

    # Perform window-constrained alignment
    dur = duration if (duration and duration > 5.0) else 180.0
    lines, elrc = aligner_engine.align(
        lyrics,
        total_duration=dur,
        model_name=model,
        separate_vocals=separate_vocals,
    )

    # Write to SQLite cache
    lines_json = json.dumps([line.model_dump() for line in lines])
    cache.set(cache_key, lines_json, elrc, model)

    return AlignResponse(
        status="completed",
        lines=lines,
        enhanced_lrc=elrc,
        cached=False,
        model=model,
    )

@app.get("/v1/jobs/{job_id}")
def get_job_status(job_id: str, auth: bool = Depends(verify_token)):
    return {
        "job_id": job_id,
        "status": "completed",
        "progress": 1.0,
    }
