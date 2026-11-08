from typing import List, Optional
from pydantic import BaseModel, Field

class WordTiming(BaseModel):
    text: str
    start: float
    end: float
    confidence: Optional[float] = 1.0

class LineTiming(BaseModel):
    id: int
    text: str
    start: float
    end: float
    confidence: Optional[float] = 1.0
    words: List[WordTiming] = Field(default_factory=list)
    is_fallback: bool = False

class AlignmentJobRequest(BaseModel):
    lrc_text: str
    language: Optional[str] = "en"
    model: Optional[str] = "base"
    separate_vocals: bool = False
    padding_ms: int = 150

class AlignmentJobResponse(BaseModel):
    job_id: str
    status: str
    progress: float

class DeriveRequest(BaseModel):
    plain_text: str
    total_duration_seconds: float = 180.0

class DeriveResponse(BaseModel):
    lines: List[LineTiming]
    enhanced_lrc: str
