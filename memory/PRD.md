# IELTS & ICAO Speaking Tutor — PRD

## Original Problem Statement
Build ONLY the lightweight mobile-first UI for a dual-mode speaking practice app: "IELTS & ICAO Speaking Tutor".
- Navigation: Tab 1 "IELTS Speaking" (Part 1, Part 2 Cue Card, Part 3); Tab 2 "ICAO Aviation" (Picture Description, Radio Scenario, Emergency Response).
- Core practice view: Prompt display, Timer widget (prep for IELTS Part 2 / response timer), Voice recorder UI (big record/stop with active state), Live transcript box.
- Feedback cards (mock): Score Badge (IELTS Band / ICAO Level), Correction cards (Grammar Fixes, Vocabulary Enhancements, Aviation Phraseology Check).
- Use local mock JSON. No API calls / complex logic. Structured for Phase 2.

## User Choices
- Visual style: Clean & academic.
- Voice recorder: Real mic recording UI (permission flow wired) with mock live transcript.
- Feedback cards: Always visible with sample data.
- Score display: band/level number + label only.

## Architecture
- Frontend: Expo Router (file-based), React Native, react-native-reanimated animations.
- Fonts: Lora (serif headings), Plus Jakarta Sans (body) via expo-font.
- Recording: expo-audio (native mic + permissions); web simulates for preview.
- Data: local mock JSON in `src/data/mockData.ts` (no backend used).
- Design tokens centralized in `src/theme/theme.ts` (warm charcoal base; forest green = IELTS accent; rust = ICAO accent; no blue/purple per guidelines).

### Key files
- `app/(tabs)/_layout.tsx` — 2-tab nav (NativeTabs on iOS 26+, classic Tabs elsewhere)
- `app/(tabs)/ielts.tsx`, `app/(tabs)/icao.tsx` — render shared `PracticeScreen` with mode config
- `src/components/PracticeScreen.tsx` — orchestrator (type selection, timers, recording, transcript reveal)
- `src/components/`: ChipRow, PromptCard, TimerWidget, RecordButton, TranscriptBox, ScoreBadge, FeedbackCards, PermissionSheet
- `src/hooks/use-recorder.ts` — mic permission + record lifecycle

## Personas
- IELTS candidate practicing spoken English for band improvement.
- Pilot / ATC trainee practicing ICAO aviation English proficiency.

## Implemented (2026-06)
- Dual-mode tabs with distinct accents (IELTS green / ICAO rust).
- Practice-type chip selector per mode; random prompt on switch + shuffle button.
- Timer widget: prep countdown (Part 2 / ICAO scenarios), response counter with auto-stop.
- Big record/stop FAB with pulsing active state + haptics; contextual mic permission flow with Open Settings fallback.
- Live transcript box that reveals mock text word-by-word while recording.
- Always-visible Score Badge (Band/Level + label) and correction cards (Grammar, Vocabulary, + Aviation Phraseology for ICAO), all mock JSON.

## Phase 2 — Voice Recording + Real-time STT (2026-06)
- Browser-native SpeechRecognition / webkitSpeechRecognition (en-US) streams live transcript into the Live Transcript Box (web). Platform-split hooks: `use-recorder.web.ts` (browser APIs) and `use-recorder.ts` (native expo-audio; falls back to demo transcript since browser STT is unavailable on native).
- Parallel raw-audio capture via MediaRecorder (web) / expo-audio (native); AudioPlayer below the transcript lets the user listen back (`AudioPlayer.web.tsx` HTMLAudioElement / `AudioPlayer.tsx` expo-audio).
- Re-record button clears transcript + audio and resets timers.
- All client-side; no external AI/text-analysis services. Verified by testing agent (9/9 web flows pass).

## Backlog (Phase 2)
- P0: Wire real speech-to-text for live transcript.
- P0: Real AI scoring + feedback (IELTS band / ICAO level) from recorded audio.
- P1: Save practice history and progress tracking.
- P1: Playback of recorded audio.
- P2: Model answers / sample band-9 responses per prompt.

## Phase 3 — AI Evaluation + Local History (2026-06)
- Backend `POST /api/score` (GPT-5.4 via emergentintegrations, evaluation-only, no DB): IELTS -> Band 0-9 + 2-3 grammar + 3 advanced vocabulary/idiom; ICAO -> Level 1-6 + grammar + standard aviation terminology + 2-3 phraseology corrections, plus a one-line summary. Returns 400 for transcripts under 3 words.
- Scoring auto-runs on Stop: Idle -> Recording -> Processing (loading) -> Result, with a reanimated fade-in on the result.
- Feedback dashboard populated dynamically (ScoreBadge + FeedbackCards); AI-corrected phrases highlighted inline in the transcript (line-through), filler words highlighted amber.
- Live StatsBar: words, WPM, duration, filler count. Filler detection in `src/utils/fillers.ts`.
- Local session history in on-device storage (localStorage on web via the storage util) — `src/utils/history.ts`, key `practice_history_v1`; History tab lists past attempts (date, exam type, score, transcript, stats) with delete + pull-to-refresh; persists across reloads.
- Verified end-to-end by testing agent: 4/4 backend + 9/9 frontend flows pass (real GPT-5.4 call exercised).

## Next Tasks
- Optional: progress charts/trends over time in History; export attempts; per-criterion IELTS sub-scores.

## Phase 4 — Model Answers + Free Talk (2026-06)
- Model Answers: /api/score now returns `model_answer` (GPT-5.4). IELTS = natural Band-9 answer to the exact prompt; ICAO = expert Level-6 standard-phraseology response. Shown as a collapsible "Model Answer" reveal card (`ModelAnswerCard`) in the scored result — an on-demand answer key.
- Free Talk tab (4th tab): daily fluency practice with 20/30-min goal, on-device streak + progress bar (`src/utils/freetalk.ts`, key `free_talk_v1`), rotating conversational topics (`src/data/freeTopics.ts`), milestone + rotating encouragement messages, live transcript + StatsBar, and an optional "Get quick tips" that calls /api/score mode `free` (Fluency summary + gentle grammar/vocab tips + a "say it more fluently" model answer).
- Backend adds mode `free` (score_label "Fluency", no exam band). Verified by testing agent: 7/7 backend + all frontend flows (real GPT-5.4).
