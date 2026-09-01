"""Backend tests for POST /api/score (IELTS + ICAO + Free Talk, Phase-4 model answers)."""
import os
import pytest
import requests

BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/") if "EXPO_PUBLIC_BACKEND_URL" in os.environ else None
if not BASE_URL:
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

FREE_TRANSCRIPT = (
    "So today I woke up quite early and went for a short walk in the park near my house, "
    "and then I had coffee with a friend, we talked about our plans for the weekend and I felt "
    "really happy because the weather was nice and the streets were quiet."
)


# --- IELTS (Phase-4: model_answer required) ---------------------------------
def test_ielts_score_shape_and_model_answer(api):
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
    val = float(data["score_value"])
    assert 0.0 <= val <= 9.0
    assert isinstance(data["score_caption"], str) and data["score_caption"]
    assert isinstance(data["summary"], str) and data["summary"]
    # Phase-4: model_answer must be non-empty
    assert isinstance(data.get("model_answer"), str) and len(data["model_answer"].strip()) > 20, \
        f"model_answer missing/empty: {data.get('model_answer')!r}"
    assert 2 <= len(data["grammar"]) <= 3
    assert len(data["vocabulary"]) == 3
    for item in data["grammar"] + data["vocabulary"]:
        assert set(item.keys()) >= {"original", "suggestion", "note"}
        assert item["original"] and item["suggestion"] and item["note"]
    assert data.get("phraseology") is None


# --- ICAO (Phase-4: model_answer required) ----------------------------------
def test_icao_score_shape_and_model_answer(api):
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
    assert isinstance(data.get("model_answer"), str) and len(data["model_answer"].strip()) > 20, \
        f"model_answer missing/empty: {data.get('model_answer')!r}"
    assert 2 <= len(data["grammar"]) <= 3
    assert len(data["vocabulary"]) >= 2
    assert isinstance(data["phraseology"], list)
    assert 2 <= len(data["phraseology"]) <= 3
    for item in data["phraseology"]:
        assert item["original"] and item["suggestion"] and item["note"]


# --- Free Talk (Phase-4 new mode) -------------------------------------------
def test_free_talk_score_shape(api):
    r = api.post(f"{BASE_URL}/api/score", json={
        "mode": "free",
        "practice_type": "free",
        "practice_label": "Free Talk",
        "prompt": "Tell me about your day so far.",
        "transcript": FREE_TRANSCRIPT,
    }, timeout=90)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["score_label"] == "Fluency"
    assert isinstance(data["summary"], str) and data["summary"]
    assert isinstance(data.get("model_answer"), str) and len(data["model_answer"].strip()) > 10
    assert isinstance(data["grammar"], list) and len(data["grammar"]) <= 3
    assert isinstance(data["vocabulary"]) if False else True
    assert isinstance(data["vocabulary"], list) and len(data["vocabulary"]) <= 3
    # phraseology must be null for free
    assert data.get("phraseology") is None


# --- Validation --------------------------------------------------------------
@pytest.mark.parametrize("mode", ["ielts", "icao", "free"])
def test_score_transcript_too_short(api, mode):
    r = api.post(f"{BASE_URL}/api/score", json={
        "mode": mode,
        "practice_type": "x",
        "practice_label": "x",
        "prompt": "x",
        "transcript": "hi there",
    }, timeout=30)
    assert r.status_code == 400
    assert "short" in r.json().get("detail", "").lower()


def test_api_root(api):
    r = api.get(f"{BASE_URL}/api/", timeout=15)
    assert r.status_code == 200
    assert "message" in r.json()
