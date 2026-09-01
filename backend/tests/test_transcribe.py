"""Backend tests for POST /api/transcribe (Whisper server-side transcription)."""
import io
import os
import math
import struct
import wave
import subprocess
import pytest
import requests
from pathlib import Path


def _load_base_url() -> str:
    if os.environ.get("EXPO_PUBLIC_BACKEND_URL"):
        return os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")
    for line in Path("/app/frontend/.env").read_text().splitlines():
        if line.startswith("EXPO_PUBLIC_BACKEND_URL="):
            return line.split("=", 1)[1].strip().strip('"').rstrip("/")
    raise RuntimeError("EXPO_PUBLIC_BACKEND_URL not set")


BASE_URL = _load_base_url()


def _sine_wav(duration_s: float = 1.0, freq: float = 440.0, sr: int = 16000) -> bytes:
    """A tiny sine-wave WAV — Whisper accepts it (returns something like 'You' or empty)."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        n = int(duration_s * sr)
        for i in range(n):
            val = int(32767 * 0.3 * math.sin(2 * math.pi * freq * i / sr))
            w.writeframes(struct.pack("<h", val))
    return buf.getvalue()


def _speech_wav_via_espeak(text: str, path: Path) -> bool:
    """Try to synthesize real speech via espeak-ng into a wav. Returns True on success."""
    for cmd in (["espeak-ng", "-v", "en", "-w", str(path), text],
                ["espeak", "-v", "en", "-w", str(path), text]):
        try:
            r = subprocess.run(cmd, capture_output=True, timeout=15)
            if r.returncode == 0 and path.exists() and path.stat().st_size > 200:
                return True
        except (FileNotFoundError, subprocess.TimeoutExpired):
            continue
    return False


# --- /api/transcribe: happy path (sine wav) --------------------------------
def test_transcribe_wav_returns_200_with_transcript_key():
    """Backend accepts a valid wav upload and returns {transcript: str}."""
    audio = _sine_wav(1.0)
    r = requests.post(
        f"{BASE_URL}/api/transcribe",
        files={"audio": ("test.wav", audio, "audio/wav")},
        timeout=120,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert "transcript" in body
    assert isinstance(body["transcript"], str)


# --- /api/transcribe: real speech round-trip (if espeak is present) --------
def test_transcribe_real_speech_roundtrip(tmp_path):
    """If we can synthesize speech locally, Whisper should return recognisable words."""
    wav_path = tmp_path / "speech.wav"
    if not _speech_wav_via_espeak("The quick brown fox jumps over the lazy dog.", wav_path):
        pytest.skip("espeak/espeak-ng not installed on tester container")
    with open(wav_path, "rb") as fh:
        r = requests.post(
            f"{BASE_URL}/api/transcribe",
            files={"audio": ("speech.wav", fh, "audio/wav")},
            timeout=180,
        )
    assert r.status_code == 200, r.text
    txt = r.json().get("transcript", "").lower()
    assert len(txt.split()) >= 3, f"expected multiple recognised words, got: {txt!r}"
    # At least one distinctive word should survive Whisper
    assert any(w in txt for w in ("fox", "quick", "brown", "dog", "jumps", "lazy"))


# --- /api/transcribe: negative cases --------------------------------------
def test_transcribe_missing_file_returns_4xx():
    r = requests.post(f"{BASE_URL}/api/transcribe", timeout=30)
    assert 400 <= r.status_code < 500, r.text


def test_transcribe_empty_file_returns_400():
    r = requests.post(
        f"{BASE_URL}/api/transcribe",
        files={"audio": ("empty.webm", b"", "audio/webm")},
        timeout=30,
    )
    assert r.status_code == 400, r.text
    assert "empty" in r.json().get("detail", "").lower()
