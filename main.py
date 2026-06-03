"""
AURA AI — Lecture-to-Study-Material Converter
Backend: FastAPI + OpenAI GPT-4o-mini + Azure Speech Services
"""

import asyncio
import json
import logging
import os
import tempfile
import threading
from concurrent.futures import ThreadPoolExecutor

import azure.cognitiveservices.speech as speechsdk
from dotenv import load_dotenv
from pydub import AudioSegment
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from openai import OpenAI
from pydantic import BaseModel

from prompts import (
    CHAT_SYSTEM,
    QUIZ_SYSTEM,
    QUIZ_USER,
    SUMMARY_SYSTEM,
    SUMMARY_USER,
    TRANSLATE_SYSTEM,
    TRANSLATE_USER,
)

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aura_ai")

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
AZURE_SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY")
AZURE_SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION")

_executor = ThreadPoolExecutor(max_workers=3)

app = FastAPI(
    title="AURA AI",
    description="Lecture-to-study-material converter",
    version="2.0.0",
)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


# ── Request Models ────────────────────────────────────────────────────────────

class TextRequest(BaseModel):
    text: str

class SummaryRequest(BaseModel):
    text: str
    language: str = "en"

class ChatRequest(BaseModel):
    question: str
    lecture_text: str

class TranslateRequest(BaseModel):
    text: str
    target_language: str


# ── Audio conversion ──────────────────────────────────────────────────────────

def _to_pcm_wav(src_path: str, original_name: str) -> str:
    """
    Convert any audio/video file to 16 kHz mono 16-bit PCM WAV.
    Returns the path of the converted WAV (caller must delete it).
    Raises RuntimeError with a user-friendly message on failure.
    """
    ext = os.path.splitext(original_name)[1].lower().lstrip(".") or "wav"

    try:
        audio = AudioSegment.from_file(src_path, format=ext)
    except FileNotFoundError as exc:
        # ffmpeg binary missing
        if "ffmpeg" in str(exc).lower() or "avconv" in str(exc).lower():
            raise RuntimeError(
                "ffmpeg غير مثبّت على الخادم. "
                "ثبّته بـ: winget install ffmpeg  أو  choco install ffmpeg  "
                "أو ارفع ملف WAV مباشرة."
            ) from exc
        raise RuntimeError(f"تعذّر فتح الملف الصوتي: {exc}") from exc
    except Exception as exc:
        raise RuntimeError(
            f"تعذّر فتح الملف الصوتي ({ext}). "
            "تأكد أن الملف غير تالف وأن ffmpeg مثبّت."
        ) from exc

    # Normalise: 16 kHz, mono, 16-bit PCM
    audio = audio.set_frame_rate(16_000).set_channels(1).set_sample_width(2)

    wav_fd, wav_path = tempfile.mkstemp(suffix=".wav")
    os.close(wav_fd)
    audio.export(wav_path, format="wav")
    return wav_path


# ── Azure Speech (sync, runs in thread pool) ──────────────────────────────────

def _azure_transcribe_sync(file_path: str, language: str = "en-US") -> str:
    """
    Continuous recognition via Azure Speech SDK.
    Runs synchronously — must be called via run_in_executor.
    """
    speech_config = speechsdk.SpeechConfig(
        subscription=AZURE_SPEECH_KEY,
        region=AZURE_SPEECH_REGION,
    )
    speech_config.speech_recognition_language = language

    audio_config = speechsdk.audio.AudioConfig(filename=file_path)
    recognizer = speechsdk.SpeechRecognizer(
        speech_config=speech_config,
        audio_config=audio_config,
    )

    results: list[str] = []
    done = threading.Event()

    def on_recognized(evt):
        if evt.result.reason == speechsdk.ResultReason.RecognizedSpeech:
            results.append(evt.result.text)

    def on_session_stopped(evt):
        done.set()

    def on_canceled(evt):
        details = evt.result.cancellation_details
        logger.warning("Azure Speech canceled: %s — %s", details.reason, details.error_details)
        done.set()

    recognizer.recognized.connect(on_recognized)
    recognizer.session_stopped.connect(on_session_stopped)
    recognizer.canceled.connect(on_canceled)

    recognizer.start_continuous_recognition_async().get()
    done.wait(timeout=300)
    recognizer.stop_continuous_recognition_async().get()

    return " ".join(results).strip()


def _convert_and_transcribe(src_path: str, original_name: str, language: str) -> str:
    """
    Full pipeline (runs in thread pool):
      1. Convert uploaded file to 16 kHz mono PCM WAV via pydub/ffmpeg.
      2. Run Azure Speech continuous recognition on the WAV.
      3. Delete the converted WAV regardless of outcome.
    """
    wav_path = _to_pcm_wav(src_path, original_name)
    try:
        return _azure_transcribe_sync(wav_path, language)
    finally:
        if os.path.exists(wav_path):
            os.unlink(wav_path)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    language: str = "en-US",
):
    """
    Accepts an audio file, transcribes it with Azure Speech Services.
    Supported formats: WAV (recommended), MP3, OGG.
    language: BCP-47 tag, e.g. 'en-US' or 'ar-EG'.
    """
    if not AZURE_SPEECH_KEY or not AZURE_SPEECH_REGION:
        raise HTTPException(
            status_code=500,
            detail="Azure Speech credentials are not configured on the server.",
        )

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    original_name = file.filename or "audio.wav"
    suffix = os.path.splitext(original_name)[1] or ".wav"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        loop = asyncio.get_event_loop()
        transcript = await loop.run_in_executor(
            _executor, _convert_and_transcribe, tmp_path, original_name, language
        )
    except RuntimeError as exc:
        # User-friendly errors raised by _to_pcm_wav
        logger.warning("Conversion error: %s", exc)
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception:
        logger.exception("Transcription error")
        raise HTTPException(
            status_code=500,
            detail="فشل التفريغ. تأكد من صحة بيانات Azure وأن الملف يحتوي على صوت واضح.",
        )
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

    if not transcript:
        raise HTTPException(
            status_code=422,
            detail="No speech detected. Ensure the file contains clear audio.",
        )

    return {"transcript": transcript}


@app.post("/summary")
async def generate_summary(req: SummaryRequest):
    """Returns {summary, key_points, important_concepts} as JSON."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SUMMARY_SYSTEM},
                {"role": "user", "content": SUMMARY_USER(req.text, req.language)},
            ],
            max_tokens=800,
            temperature=0.4,
        )
        data = json.loads(response.choices[0].message.content)
        return {
            "summary": data.get("summary", ""),
            "key_points": data.get("key_points", []),
            "important_concepts": data.get("important_concepts", []),
        }
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="AI returned a malformed response.")
    except Exception:
        logger.exception("Summary error")
        raise HTTPException(status_code=500, detail="Summary generation failed.")


@app.post("/quiz")
async def generate_quiz(req: TextRequest):
    """Returns {questions: [{question, options, answer}]} — 5 MCQ questions."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": QUIZ_SYSTEM},
                {"role": "user", "content": QUIZ_USER(req.text)},
            ],
            max_tokens=900,
            temperature=0.5,
        )
        data = json.loads(response.choices[0].message.content)
        return {"questions": data.get("questions", [])}
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="AI returned a malformed response.")
    except Exception:
        logger.exception("Quiz error")
        raise HTTPException(status_code=500, detail="Quiz generation failed.")


@app.post("/chat")
async def chat(req: ChatRequest):
    """
    Answers questions strictly from the provided lecture text.
    The lecture is injected into the system prompt — model cannot use outside knowledge.
    """
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    if not req.lecture_text.strip():
        raise HTTPException(status_code=400, detail="Lecture text is required for context.")

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": CHAT_SYSTEM(req.lecture_text)},
                {"role": "user", "content": req.question},
            ],
            max_tokens=500,
            temperature=0.3,
        )
        return {"response": response.choices[0].message.content}
    except Exception:
        logger.exception("Chat error")
        raise HTTPException(status_code=500, detail="Chat failed.")


@app.post("/translate")
async def translate(req: TranslateRequest):
    """Translates any text into the specified target language."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": TRANSLATE_SYSTEM},
                {"role": "user", "content": TRANSLATE_USER(req.text, req.target_language)},
            ],
            max_tokens=700,
            temperature=0.2,
        )
        return {"translation": response.choices[0].message.content}
    except Exception:
        logger.exception("Translation error")
        raise HTTPException(status_code=500, detail="Translation failed.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
