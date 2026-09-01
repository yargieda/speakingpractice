from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional

from emergentintegrations.llm.chat import LlmChat, UserMessage


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection (kept available for future server-side needs)
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ----------------------------- Models -----------------------------
class Correction(BaseModel):
    original: str
    suggestion: str
    note: str


class Assessment(BaseModel):
    score_label: str
    score_value: str
    score_caption: str
    summary: str = ""
    model_answer: str = ""
    grammar: List[Correction] = []
    vocabulary: List[Correction] = []
    phraseology: Optional[List[Correction]] = None


class ScoreRequest(BaseModel):
    mode: str  # "ielts" | "icao"
    practice_type: str = ""
    practice_label: str = ""
    prompt: str = ""
    transcript: str


# ----------------------------- AI prompts -----------------------------
def build_system_message(mode: str) -> str:
    if mode == "free":
        return (
            "You are a warm, encouraging English conversation coach helping a learner improve everyday "
            "spoken fluency during a free-talk session. The transcript is casual speech, not an exam. Be "
            "supportive and motivating, never harsh.\n"
            "Return ONLY valid minified JSON (no markdown, no prose) with EXACTLY this shape:\n"
            '{"summary":"<2 sentences: one encouraging observation about their speaking + one concrete thing to try next>",'
            '"model_answer":"<a short example of how they could expand their idea more fluently and naturally, 2-3 sentences>",'
            '"grammar":[{"original":"<quote>","suggestion":"<fixed>","note":"<gentle tip>"}],'
            '"vocabulary":[{"original":"<word/phrase used>","suggestion":"<more natural or varied choice>","note":"<why it sounds better>"}]}\n'
            "Provide up to 3 gentle grammar fixes and up to 3 vocabulary upgrades, grounded in the transcript. "
            "If the transcript is short, still encourage them warmly."
        )
    if mode == "icao":
        return (
            "You are a certified ICAO Aviation English rater assessing a pilot/ATC trainee's spoken "
            "response (given as a transcript). Rate strictly against the ICAO Language Proficiency "
            "Rating Scale, Level 1 (Pre-elementary) to Level 6 (Expert); Level 4 is the operational minimum. "
            "Evaluate phraseology accuracy, plain-English clarity under operational stress, pronunciation, "
            "structure, vocabulary, fluency, comprehension and interactions.\n"
            "Return ONLY valid minified JSON (no markdown, no prose) with EXACTLY this shape:\n"
            '{"score_value":"<integer level 1-6, e.g. 4>","score_caption":"<official band name, e.g. Operational>",'
            '"summary":"<one sentence on plain-English clarity under operational stress>",'
            '"model_answer":"<a concise expert Level-6 model response to the scenario using correct standard ICAO phraseology>",'
            '"grammar":[{"original":"<quote from transcript>","suggestion":"<fixed version>","note":"<short why>"}],'
            '"vocabulary":[{"original":"<generic wording used>","suggestion":"<standard aviation terminology>","note":"<why standard term is preferred>"}],'
            '"phraseology":[{"original":"<what they said>","suggestion":"<correct ICAO standard phraseology>","note":"<short rule>"}]}\n'
            "Provide 2-3 grammar items, ~3 vocabulary items focused on STANDARD AVIATION TERMINOLOGY, and 2-3 "
            "phraseology items. Ground every item in the actual transcript. If the transcript is too short, give "
            "the lowest reasonable level and explain in the notes."
        )
    return (
        "You are an experienced IELTS Speaking examiner assessing a candidate's spoken response (given as a "
        "transcript). Rate strictly against the IELTS band descriptors (Fluency & Coherence, Lexical Resource, "
        "Grammatical Range & Accuracy, Pronunciation) and give an OVERALL band from 0 to 9 in 0.5 steps.\n"
        "Return ONLY valid minified JSON (no markdown, no prose) with EXACTLY this shape:\n"
        '{"score_value":"<band 0-9 in 0.5 steps, e.g. 7.5>","score_caption":"<official band name, e.g. Good User>",'
        '"summary":"<one sentence overall impression>",'
        '"model_answer":"<a natural Band 9 model answer to this exact prompt, 2-4 sentences>",'
        '"grammar":[{"original":"<quote from transcript>","suggestion":"<fixed version>","note":"<short why>"}],'
        '"vocabulary":[{"original":"<word/phrase used>","suggestion":"<more advanced word, idiom or collocation>","note":"<why it is higher-band>"}]}\n'
        "Provide EXACTLY 2-3 grammar corrections and EXACTLY 3 advanced vocabulary/idiom suggestions. Ground every "
        "item in the actual transcript. If the transcript is too short to assess, give a low band and say so in the notes."
    )


def _strip_json(text: str) -> str:
    t = text.strip()
    if t.startswith("```"):
        t = t[3:]
        if t.lstrip().lower().startswith("json"):
            t = t.lstrip()[4:]
        if "```" in t:
            t = t[: t.rfind("```")]
    start = t.find("{")
    end = t.rfind("}")
    if start != -1 and end != -1:
        t = t[start:end + 1]
    return t.strip()


async def run_assessment(req: ScoreRequest) -> Assessment:
    if req.mode == "icao":
        score_label = "ICAO Level"
    elif req.mode == "free":
        score_label = "Fluency"
    else:
        score_label = "IELTS Band"

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"score-{req.mode}-{req.practice_type or 'x'}",
        system_message=build_system_message(req.mode),
    ).with_model("openai", "gpt-5.4")

    user_text = (
        f"Practice type: {req.practice_label}\n"
        f"Prompt / scenario:\n{req.prompt}\n\n"
        f"Candidate transcript:\n\"\"\"\n{req.transcript}\n\"\"\"\n\n"
        "Assess it now and reply with ONLY the JSON object."
    )

    raw = await chat.send_message(UserMessage(text=user_text))
    parsed = json.loads(_strip_json(raw))

    def corrections(key: str) -> List[Correction]:
        out: List[Correction] = []
        for it in (parsed.get(key) or []):
            try:
                out.append(Correction(
                    original=str(it.get("original", "")),
                    suggestion=str(it.get("suggestion", "")),
                    note=str(it.get("note", "")),
                ))
            except Exception:
                continue
        return out

    return Assessment(
        score_label=score_label,
        score_value=str(parsed.get("score_value", "")),
        score_caption=str(parsed.get("score_caption", "")),
        summary=str(parsed.get("summary", "")),
        model_answer=str(parsed.get("model_answer", "")),
        grammar=corrections("grammar"),
        vocabulary=corrections("vocabulary"),
        phraseology=corrections("phraseology") if req.mode == "icao" else None,
    )


# ----------------------------- Routes -----------------------------
@api_router.get("/")
async def root():
    return {"message": "IELTS & ICAO Speaking Tutor API"}


@api_router.post("/score", response_model=Assessment)
async def score(req: ScoreRequest):
    if len((req.transcript or "").split()) < 3:
        raise HTTPException(status_code=400, detail="Transcript too short to assess.")
    try:
        return await run_assessment(req)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Scoring failed")
        raise HTTPException(status_code=502, detail=f"Assessment failed: {e}")


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
