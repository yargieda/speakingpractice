import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Platform, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { colors, spacing, radius, fonts, fontSize } from "@/src/theme/theme";
import type { Mode } from "@/src/data/mockData";
import { useRecorder } from "@/src/hooks/use-recorder";
import ChipRow from "@/src/components/ChipRow";
import PromptCard from "@/src/components/PromptCard";
import TimerWidget, { type TimerPhase } from "@/src/components/TimerWidget";
import RecordButton from "@/src/components/RecordButton";
import TranscriptBox from "@/src/components/TranscriptBox";
import AudioPlayer from "@/src/components/AudioPlayer";
import ScoreBadge from "@/src/components/ScoreBadge";
import FeedbackCards from "@/src/components/FeedbackCards";
import ModelAnswerCard from "@/src/components/ModelAnswerCard";
import PermissionSheet from "@/src/components/PermissionSheet";
import StatsBar from "@/src/components/StatsBar";
import { scorePractice, transcribeAudio, type Assessment } from "@/src/api/client";
import { addHistory } from "@/src/utils/history";
import { countFillers, wordCount, computeWpm } from "@/src/utils/fillers";

const fmt = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export default function PracticeScreen({ mode }: { mode: Mode }) {
  const insets = useSafeAreaInsets();
  const rec = useRecorder();

  const [typeId, setTypeId] = useState(mode.types[0].id);
  const type = useMemo(
    () => mode.types.find((t) => t.id === typeId) ?? mode.types[0],
    [mode.types, typeId],
  );

  const [promptIdx, setPromptIdx] = useState(0);
  const prompt = type.prompts[promptIdx];

  // timers
  const [prepLeft, setPrepLeft] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // demo transcript reveal — used only when live browser STT is unavailable (native)
  const words = useMemo(() => type.transcriptSample.split(" "), [type.transcriptSample]);
  const [revealed, setRevealed] = useState(0);
  const liveSupported = rec.liveSupported;

  // permission modal
  const [sheet, setSheet] = useState<null | "explain" | "blocked">(null);

  // AI scoring state
  const [feedbackState, setFeedbackState] = useState<
    "sample" | "loading" | "transcribing" | "scored" | "tooShort" | "error"
  >("sample");
  const [aiAssessment, setAiAssessment] = useState<Assessment | null>(null);
  const [resolvedTranscript, setResolvedTranscript] = useState<string | null>(null);

  const stopTimerRef = useRef<() => void>(() => {});
  stopTimerRef.current = () => rec.stop();

  // Reset everything when practice type changes.
  useEffect(() => {
    setPromptIdx(Math.floor(Math.random() * type.prompts.length));
    setPrepLeft(null);
    setElapsed(0);
    setRevealed(0);
    setFeedbackState("sample");
    setAiAssessment(null);
    setResolvedTranscript(null);
    if (rec.isRecording) rec.stop();
    rec.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeId]);

  // Prep countdown.
  useEffect(() => {
    if (prepLeft === null) return;
    if (prepLeft <= 0) {
      setPrepLeft(null);
      return;
    }
    const id = setTimeout(() => setPrepLeft((v) => (v === null ? null : v - 1)), 1000);
    return () => clearTimeout(id);
  }, [prepLeft]);

  // Response elapsed counter + auto-stop at target.
  useEffect(() => {
    if (!rec.isRecording) return;
    if (elapsed >= type.responseSeconds) {
      stopTimerRef.current();
      return;
    }
    const id = setTimeout(() => setElapsed((v) => v + 1), 1000);
    return () => clearTimeout(id);
  }, [rec.isRecording, elapsed, type.responseSeconds]);

  // Live transcript reveal while recording — demo fallback only (native).
  useEffect(() => {
    if (liveSupported) return;
    if (!rec.isRecording) return;
    if (revealed >= words.length) return;
    const id = setTimeout(() => setRevealed((v) => v + 1), 320);
    return () => clearTimeout(id);
  }, [liveSupported, rec.isRecording, revealed, words.length]);

  const startRecordingFlow = () => {
    setPrepLeft(null);
    setElapsed(0);
    setRevealed(0);
    setFeedbackState("sample");
    setAiAssessment(null);
    setResolvedTranscript(null);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    rec.start();
  };

  const onMicPress = async () => {
    if (rec.isRecording) {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      rec.stop();
      return;
    }
    if (rec.permStatus === "granted") {
      startRecordingFlow();
      return;
    }
    if (rec.permStatus === "blocked") {
      setSheet("blocked");
      return;
    }
    // undetermined or denied (can ask again) — show contextual explainer first
    setSheet("explain");
  };

  const onAllow = async () => {
    setSheet(null);
    const status = await rec.requestPermission();
    if (status === "granted") startRecordingFlow();
    else if (status === "blocked") setSheet("blocked");
    // denied but can-ask-again: user can tap the mic again
  };

  const shuffle = () => {
    if (type.prompts.length < 2) return;
    let next = promptIdx;
    while (next === promptIdx) next = Math.floor(Math.random() * type.prompts.length);
    setPromptIdx(next);
    setElapsed(0);
    setRevealed(0);
    setPrepLeft(null);
    setFeedbackState("sample");
    setAiAssessment(null);
    setResolvedTranscript(null);
    if (rec.isRecording) rec.stop();
    rec.reset();
  };

  const onReRecord = () => {
    setRevealed(0);
    setElapsed(0);
    setPrepLeft(null);
    setFeedbackState("sample");
    setAiAssessment(null);
    setResolvedTranscript(null);
    rec.reset();
  };

  // Derive timer widget props.
  const hasPrep = type.prepSeconds > 0;
  const prepActive = prepLeft !== null;
  let phase: TimerPhase = "idle";
  let timeText = fmt(type.responseSeconds);
  let label = "Response Limit";
  let targetText = `Speak for up to ${fmt(type.responseSeconds)}`;
  if (rec.isRecording) {
    phase = "recording";
    label = "Recording";
    timeText = fmt(elapsed);
    targetText = `Target ${fmt(type.responseSeconds)}`;
  } else if (prepActive) {
    phase = "prep";
    label = "Preparation";
    timeText = fmt(prepLeft ?? 0);
    targetText = "Plan your answer — then record";
  }

  const liveTranscript = liveSupported
    ? rec.transcript
    : rec.isRecording || revealed > 0
      ? words.slice(0, revealed).join(" ")
      : "";

  // What the user sees: the finalized (Whisper) transcript once available, else the live one.
  const transcript = resolvedTranscript ?? liveTranscript;

  const showReRecord =
    !rec.isRecording &&
    feedbackState !== "transcribing" &&
    feedbackState !== "loading" &&
    (transcript.length > 0 || rec.audioUri !== null);

  // live stats
  const liveWords = wordCount(transcript);
  const liveFillers = countFillers(transcript);
  const liveWpm = computeWpm(liveWords, elapsed);

  // capture latest values so post-stop scoring reads the finalized transcript
  const latest = useRef({ raw: "", elapsed: 0, prompt: "", label: "", typeId: "" });
  latest.current = {
    raw: rec.transcript, // real browser STT only ("" on native / when unavailable)
    elapsed,
    prompt,
    label: type.label,
    typeId: type.id,
  };

  const waitForAudio = async () => {
    for (let i = 0; i < 15; i++) {
      const a = rec.getRecordedAudio();
      if (a) return a;
      await new Promise((r) => setTimeout(r, 200));
    }
    return null;
  };

  const finalizeAndScore = async () => {
    const { raw, elapsed: dur, prompt: p, label, typeId: tId } = latest.current;

    // 1) Resolve the transcript: prefer live browser STT; otherwise Whisper the recording.
    let finalT = (raw || "").trim();
    if (wordCount(finalT) < 3) {
      const audio = await waitForAudio();
      if (audio) {
        setFeedbackState("transcribing");
        try {
          finalT = (await transcribeAudio(audio)).trim();
        } catch {
          setFeedbackState("error");
          return;
        }
      }
    }
    setResolvedTranscript(finalT);

    // 2) Guard against empty/too-short speech.
    const wc = wordCount(finalT);
    if (wc < 3) {
      setFeedbackState(finalT.length > 0 ? "tooShort" : "sample");
      return;
    }

    // 3) Score it.
    const stats = {
      wordCount: wc,
      durationSeconds: dur,
      wpm: computeWpm(wc, dur),
      fillerCount: countFillers(finalT),
    };
    setFeedbackState("loading");
    try {
      const assessment = await scorePractice({
        mode: mode.id,
        practice_type: tId,
        practice_label: label,
        prompt: p,
        transcript: finalT,
      });
      setAiAssessment(assessment);
      setFeedbackState("scored");
      addHistory({
        mode: mode.id,
        practiceType: tId,
        practiceLabel: label,
        prompt: p,
        transcript: finalT,
        assessment,
        stats,
      });
    } catch {
      setFeedbackState("error");
    }
  };

  const wasRecordingRef = useRef(false);
  useEffect(() => {
    if (rec.isRecording) {
      wasRecordingRef.current = true;
      return;
    }
    if (wasRecordingRef.current) {
      wasRecordingRef.current = false;
      finalizeAndScore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rec.isRecording]);

  const activeFeedback =
    feedbackState === "scored" && aiAssessment
      ? {
          scoreLabel: aiAssessment.scoreLabel,
          scoreValue: aiAssessment.scoreValue,
          scoreCaption: aiAssessment.scoreCaption,
          grammar: aiAssessment.grammar,
          vocabulary: aiAssessment.vocabulary,
          phraseology: aiAssessment.phraseology ?? undefined,
        }
      : type.feedback;

  const correctionPhrases =
    feedbackState === "scored" && aiAssessment
      ? [
          ...aiAssessment.grammar,
          ...aiAssessment.vocabulary,
          ...(aiAssessment.phraseology ?? []),
        ]
          .map((c) => c.original)
          .filter((s) => s && s.trim().length >= 2)
      : [];

  const hintText =
    feedbackState === "scored"
      ? "AI assessment"
      : feedbackState === "loading"
        ? "Scoring…"
        : feedbackState === "transcribing"
          ? "Transcribing…"
          : feedbackState === "error"
            ? "Scoring failed"
            : feedbackState === "tooShort"
              ? "Not enough speech"
              : "Sample feedback";

  return (
    <View style={styles.root}>
      {/* Sticky header + chip row */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{mode.title}</Text>
            <Text style={styles.subtitle}>{mode.subtitle}</Text>
          </View>
          <View style={[styles.modePill, { backgroundColor: mode.accent }]}>
            <Text style={[styles.modePillText, { color: mode.onAccent }]}>
              {mode.id === "ielts" ? "IELTS" : "ICAO"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.chipWrap}>
        <ChipRow
          types={mode.types}
          selectedId={typeId}
          accent={mode.accent}
          onAccent={mode.onAccent}
          onSelect={setTypeId}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.instructionLabel}>{type.instruction}</Text>

        <PromptCard
          instruction={hasPrep ? "Cue Card" : "Question"}
          prompt={prompt}
          accent={mode.accent}
          heroImage={mode.heroImage}
          onShuffle={shuffle}
        />

        <TimerWidget
          phase={phase}
          label={label}
          timeText={timeText}
          targetText={targetText}
          accent={mode.accent}
          hasPrep={hasPrep}
          prepActive={prepActive}
          onStartPrep={() => setPrepLeft(type.prepSeconds)}
        />

        <TranscriptBox
          text={transcript}
          live={rec.isRecording}
          corrections={correctionPhrases}
        />

        <StatsBar
          words={liveWords}
          wpm={liveWpm}
          seconds={elapsed}
          fillers={liveFillers}
          accent={mode.accent}
        />

        {rec.audioUri && !rec.isRecording ? (
          <AudioPlayer uri={rec.audioUri} accent={mode.accent} />
        ) : null}

        <View style={styles.feedbackHeader}>
          <Text style={styles.feedbackTitle}>Assessment</Text>
          <Text style={styles.feedbackHint}>{hintText}</Text>
        </View>

        {feedbackState === "transcribing" ? (
          <View style={styles.stateCard} testID="transcribing-loading">
            <ActivityIndicator color={mode.accent} />
            <Text style={styles.stateText}>Transcribing your recording…</Text>
          </View>
        ) : feedbackState === "loading" ? (
          <View style={styles.stateCard} testID="scoring-loading">
            <ActivityIndicator color={mode.accent} />
            <Text style={styles.stateText}>Analysing your response with AI…</Text>
          </View>
        ) : feedbackState === "error" ? (
          <View style={styles.stateCard} testID="scoring-error">
            <Feather name="alert-triangle" size={20} color={colors.error} />
            <Text style={styles.stateText}>Couldn&apos;t score this attempt.</Text>
            <Pressable
              style={[styles.retryBtn, { borderColor: mode.accent }]}
              onPress={finalizeAndScore}
              testID="retry-score-button"
            >
              <Feather name="refresh-cw" size={14} color={mode.accent} />
              <Text style={[styles.retryText, { color: mode.accent }]}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {feedbackState === "tooShort" ? (
              <View style={styles.noteCard} testID="too-short-note">
                <Feather name="info" size={16} color={colors.muted} />
                <Text style={styles.noteText}>
                  Speak a little longer to get a real AI score. Showing a sample below.
                </Text>
              </View>
            ) : null}

            <Animated.View
              key={feedbackState === "scored" ? "scored" : "sample"}
              entering={FadeInDown.duration(320)}
              style={styles.resultBlock}
            >
              <ScoreBadge
                label={activeFeedback.scoreLabel}
                value={activeFeedback.scoreValue}
                caption={activeFeedback.scoreCaption}
                accent={mode.accent}
                onAccent={mode.onAccent}
              />

              {feedbackState === "scored" && aiAssessment?.summary ? (
                <View style={styles.summaryCard} testID="assessment-summary">
                  <Feather name="message-square" size={15} color={mode.accent} />
                  <Text style={styles.summaryText}>{aiAssessment.summary}</Text>
                </View>
              ) : null}

              <FeedbackCards feedback={activeFeedback} />

              {feedbackState === "scored" && aiAssessment?.modelAnswer ? (
                <ModelAnswerCard answer={aiAssessment.modelAnswer} accent={mode.accent} />
              ) : null}
            </Animated.View>
          </>
        )}
      </ScrollView>

      {/* Sticky record bar */}
      <View style={[styles.recordBar, { paddingBottom: spacing.lg }]}>
        <View style={styles.recordRow}>
          <View style={styles.sideSlot}>
            {showReRecord ? (
              <Pressable
                onPress={onReRecord}
                style={styles.reRecord}
                testID="re-record-button"
              >
                <Feather name="rotate-ccw" size={18} color={colors.onSurface} />
                <Text style={styles.reRecordText}>Re-record</Text>
              </Pressable>
            ) : null}
          </View>
          <RecordButton recording={rec.isRecording} accent={mode.accent} onPress={onMicPress} />
          <View style={styles.sideSlot} />
        </View>
      </View>

      <PermissionSheet
        visible={sheet !== null}
        mode={sheet === "blocked" ? "blocked" : "explain"}
        accent={mode.accent}
        onAccent={mode.onAccent}
        onAllow={onAllow}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleBlock: {
    gap: 2,
  },
  title: {
    fontFamily: fonts.serifMedium,
    fontSize: fontSize["2xl"],
    color: colors.onSurface,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  modePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
  },
  modePillText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.sm,
    letterSpacing: 0.5,
  },
  chipWrap: {
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing["2xl"],
  },
  instructionLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.muted,
    lineHeight: 20,
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  feedbackTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: fontSize.xl,
    color: colors.onSurface,
  },
  feedbackHint: {
    fontFamily: fonts.sans,
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  stateCard: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing["2xl"],
    paddingHorizontal: spacing.lg,
  },
  stateText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.base,
    color: colors.muted,
    textAlign: "center",
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    height: 42,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  retryText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.base,
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  noteText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.onSurfaceTertiary,
    lineHeight: 20,
  },
  resultBlock: {
    gap: spacing.lg,
  },
  summaryCard: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  summaryText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.onSurface,
    lineHeight: 21,
  },
  recordBar: {
    paddingTop: spacing.md,
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    paddingHorizontal: spacing.lg,
  },
  sideSlot: {
    width: 96,
    alignItems: "center",
    justifyContent: "center",
  },
  reRecord: {
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  reRecordText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.xs,
    color: colors.onSurface,
  },
});
