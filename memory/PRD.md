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

## Backlog (Phase 2)
- P0: Wire real speech-to-text for live transcript.
- P0: Real AI scoring + feedback (IELTS band / ICAO level) from recorded audio.
- P1: Save practice history and progress tracking.
- P1: Playback of recorded audio.
- P2: Model answers / sample band-9 responses per prompt.

## Next Tasks
- Integrate STT + LLM scoring service in Phase 2 (swap mock feedback).
