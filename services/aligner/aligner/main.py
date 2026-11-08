import re
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from aligner.models import (
    DeriveRequest,
    DeriveResponse,
    LineTiming,
    WordTiming,
)

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
    intro = duration * 0.05
    outro = duration * 0.04
    active_window = duration - intro - outro

    total_chars = sum(max(10, len(l)) for l in lines_raw)
    current_time = intro

    result_lines: list[LineTiming] = []
    elrc_lines: list[str] = [
        "[by:MyuJiku aligner v2.0]",
        f"[length:{int(duration//60):02d}:{int(duration%60):02d}]",
    ]

    for idx, line_text in enumerate(lines_raw):
        fraction = max(10, len(line_text)) / total_chars
        line_dur = max(1.5, fraction * active_window)
        start = round(current_time, 2)
        end = round(current_time + line_dur, 2)
        current_time += line_dur

        words_raw = line_text.split()
        words: list[WordTiming] = []
        if words_raw:
            w_total_len = sum(max(2, len(w)) for w in words_raw)
            w_cursor = start
            word_tags: list[str] = []
            for w_idx, w in enumerate(words_raw):
                w_frac = max(2, len(w)) / w_total_len
                w_dur = w_frac * line_dur
                w_start = round(w_cursor, 2)
                w_end = round(w_cursor + w_dur, 2)
                w_cursor += w_dur
                words.append(WordTiming(text=w, start=w_start, end=w_end, confidence=0.85))

                mm = int(w_start // 60)
                ss = int(w_start % 60)
                xx = int((w_start % 1) * 100)
                if w_idx == 0:
                    word_tags.append(f"[{mm:02d}:{ss:02d}.{xx:02d}]{w}")
                else:
                    word_tags.append(f"<{mm:02d}:{ss:02d}.{xx:02d}>{w}")

            elrc_lines.append(" ".join(word_tags))
        else:
            words.append(WordTiming(text=line_text, start=start, end=end, confidence=0.85))

        result_lines.append(
            LineTiming(
                id=idx + 1,
                text=line_text,
                start=start,
                end=end,
                confidence=0.85,
                words=words,
                is_fallback=True,
            )
        )

    return DeriveResponse(lines=result_lines, enhanced_lrc="\n".join(elrc_lines))
