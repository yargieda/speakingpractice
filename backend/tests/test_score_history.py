"""Backend tests for /api/score and /api/history (Phase 3)."""
import os
import time
import pytest
import requests

BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/") if os.environ.get("EXPO_PUBLIC_BACKEND_URL") else None
if not BASE_URL:
    # fallback: read from frontend/.env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("EXPO_PUBLIC_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")
                break

DEVICE_ID = f"TEST_device_{int(time.time())}"

IELTS_TRANSCRIPT = (
    "My hometown is a small city in the north where I grew up with my family. "
    "It is known for its ancient temples and green mountains around the valley. "
    "I really love the food there because the flavors are unique and fresh."
)  # ~40 words

ICAO_TRANSCRIPT = (
    "Tower, Alpha Bravo Charlie, we have a minor hydraulic warning on approach, "
    "requesting priority landing on runway two seven left, "
    "we have sixty souls on board and fuel for forty minutes."
)


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def created_ids():
    return []


# ---- POST /api/score IELTS ----
class TestScore:
    def test_score_ielts_success(self, api, created_ids):
        payload = {
            "device_id": DEVICE_ID,
            "mode": "ielts",
            "practice_type": "part2",
            "practice_label": "Part 2 - Cue Card",
            "prompt": "Describe your hometown.",
            "transcript": IELTS_TRANSCRIPT,
            "stats": {"word_count": 40, "duration_seconds": 45, "wpm": 53, "filler_count": 0},
        }
        r = api.post(f"{BASE_URL}/api/score", json=payload, timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "id" in data and data["id"]
        assert "_id" not in data
        assert data["device_id"] == DEVICE_ID
        assert data["stats"]["word_count"] == 40
        a = data["assessment"]
        assert a["score_label"] == "IELTS Band"
        assert a["score_value"]
        assert isinstance(a["grammar"], list)
        assert isinstance(a["vocabulary"], list)
        created_ids.append(data["id"])

    def test_score_icao_has_phraseology(self, api, created_ids):
        payload = {
            "device_id": DEVICE_ID,
            "mode": "icao",
            "practice_type": "emergency",
            "practice_label": "Emergency scenario",
            "prompt": "Report a hydraulic warning to ATC.",
            "transcript": ICAO_TRANSCRIPT,
            "stats": {"word_count": 35, "duration_seconds": 40, "wpm": 52, "filler_count": 0},
        }
        r = api.post(f"{BASE_URL}/api/score", json=payload, timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        a = data["assessment"]
        assert a["score_label"] == "ICAO Level"
        assert a.get("phraseology") is not None
        assert isinstance(a["phraseology"], list)
        assert len(a["phraseology"]) >= 1
        created_ids.append(data["id"])

    def test_score_too_short_returns_400(self, api):
        payload = {
            "device_id": DEVICE_ID,
            "mode": "ielts",
            "practice_type": "part1",
            "practice_label": "Part 1",
            "prompt": "Hi",
            "transcript": "hi there",
            "stats": {"word_count": 2, "duration_seconds": 3, "wpm": 40, "filler_count": 0},
        }
        r = api.post(f"{BASE_URL}/api/score", json=payload, timeout=30)
        assert r.status_code == 400


# ---- GET /api/history ----
class TestHistory:
    def test_history_lists_saved_newest_first(self, api, created_ids):
        assert len(created_ids) >= 2, "prerequisite scoring failed"
        r = api.get(f"{BASE_URL}/api/history", params={"device_id": DEVICE_ID}, timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 2
        assert all("id" in x and "_id" not in x for x in data)
        # newest first
        dates = [x["created_at"] for x in data]
        assert dates == sorted(dates, reverse=True)
        ids = {x["id"] for x in data}
        for cid in created_ids:
            assert cid in ids

    def test_history_unknown_device_empty(self, api):
        r = api.get(f"{BASE_URL}/api/history", params={"device_id": "TEST_never_seen_xyz"}, timeout=30)
        assert r.status_code == 200
        assert r.json() == []

    def test_delete_history_soft_deletes(self, api, created_ids):
        target = created_ids[0]
        r = api.delete(f"{BASE_URL}/api/history/{target}", timeout=30)
        assert r.status_code == 200
        assert r.json() == {"ok": True}
        # confirm gone
        r2 = api.get(f"{BASE_URL}/api/history", params={"device_id": DEVICE_ID}, timeout=30)
        assert r2.status_code == 200
        ids = {x["id"] for x in r2.json()}
        assert target not in ids

    def test_delete_history_invalid_id(self, api):
        r = api.delete(f"{BASE_URL}/api/history/not-an-oid", timeout=30)
        assert r.status_code == 400
