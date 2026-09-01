"""Backend tests for POST /api/score (IELTS + ICAO)."""
import os
import pytest
import requests

BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/") if "EXPO_PUBLIC_BACKEND_URL" in os.environ else None
if not BASE_URL:
    # fall back to frontend/.env preview host
    from pathlib import Path
    for line in Path("/app/frontend/.env").read_text().splitlines():
        if line.startswith("EXPO_PUBLIC_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


IELTS_TRANSCRIPT = (
    "In my hometown people generally rely on public buses and shared minibuses to get around, "
    "however traffic congestion during rush hour is a real headache, and many young professionals "
    "are switching to cycling which is honestly a breath of fresh air."
)

ICAO_TRANSCRIPT = (
    "Tower, we have a bird strike on climb out passing two thousand feet, engine two vibration, "
    "requesting immediate return to the airport, we need fire trucks standing by on the runway, "
    "souls on board one four two, endurance two hours fuel remaining, request vectors to final."
)


# --- IELTS -------------------------------------------------------------------
def test_ielts_score_shape(api):
    r = api.post(f"{BASE_URL}/api/score", json={
        "mode": "ielts",
        "practice_type": "part2",
        "practice_label": "Part 2 · Long Turn",
        "prompt": "Describe a change you have made in your daily routine recently.",
        "transcript": IELTS_TRANSCRIPT,
    }, timeout=90)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["score_label"] == "IELTS Band"
    # score_value is a string but must be numeric 0-9 (0.5 steps)
    val = float(data["score_value"])
    assert 0.0 <= val <= 9.0
    assert isinstance(data["score_caption"], str) and data["score_caption"]
    assert isinstance(data["summary"], str) and data["summary"]
    assert 2 <= len(data["grammar"]) <= 3
    assert len(data["vocabulary"]) == 3
    for item in data["grammar"] + data["vocabulary"]:
        assert set(item.keys()) >= {"original", "suggestion", "note"}
        assert item["original"] and item["suggestion"] and item["note"]
    # phraseology must be null for IELTS
    assert data.get("phraseology") is None


# --- ICAO --------------------------------------------------------------------
def test_icao_score_shape(api):
    r = api.post(f"{BASE_URL}/api/score", json={
        "mode": "icao",
        "practice_type": "emergency",
        "practice_label": "Emergency Report",
        "prompt": "Report a bird strike shortly after takeoff and request return.",
        "transcript": ICAO_TRANSCRIPT,
    }, timeout=90)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["score_label"] == "ICAO Level"
    val = int(float(data["score_value"]))
    assert 1 <= val <= 6
    assert data["score_caption"]
    assert data["summary"]
    assert 2 <= len(data["grammar"]) <= 3
    assert len(data["vocabulary"]) >= 2  # spec says ~3
    assert isinstance(data["phraseology"], list)
    assert 2 <= len(data["phraseology"]) <= 3
    for item in data["phraseology"]:
        assert item["original"] and item["suggestion"] and item["note"]


# --- Validation --------------------------------------------------------------
def test_score_transcript_too_short(api):
    r = api.post(f"{BASE_URL}/api/score", json={
        "mode": "ielts",
        "practice_type": "part1",
        "practice_label": "Part 1",
        "prompt": "Tell me about your hometown.",
        "transcript": "hi there",
    }, timeout=30)
    assert r.status_code == 400
    assert "short" in r.json().get("detail", "").lower()


def test_api_root(api):
    r = api.get(f"{BASE_URL}/api/", timeout=15)
    assert r.status_code == 200
    assert "message" in r.json()
