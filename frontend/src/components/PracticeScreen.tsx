import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { colors, spacing, fonts, fontSize } from "@/src/theme/theme";
import type { Mode } from "@/src/data/mockData";
import { useRecorder } from "@/src/hooks/use-recorder";
import ChipRow from "@/src/components/ChipRow";
import PromptCard from "@/src/components/PromptCard";
import TimerWidget, { type TimerPhase } from "@/src/components/TimerWidget";
import RecordButton from "@/src/components/RecordButton";
import TranscriptBox from "@/src/components/TranscriptBox";
import ScoreBadge from "@/src/components/ScoreBadge";
import FeedbackCards from "@/src/components/FeedbackCards";
import PermissionSheet from "@/src/components/PermissionSheet";

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

  // transcript reveal
  const words = useMemo(() => type.transcriptSample.split(" "), [type.transcriptSample]);
  const [revealed, setRevealed] = useState(0);

  // permission modal
  const [sheet, setSheet] = useState<null | "explain" | "blocked">(null);

  const stopTimerRef = useRef<() => void>(() => {});
  stopTimerRef.current = () => rec.stop();

  // Reset everything when practice type changes.
  useEffect(() => {
    setPromptIdx(Math.floor(Math.random() * type.prompts.length));
    setPrepLeft(null);
    setElapsed(0);
    setRevealed(0);
    if (rec.isRecording) rec.stop();
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

  // Live transcript reveal while recording.
  useEffect(() => {
    if (!rec.isRecording) return;
    if (revealed >= words.length) return;
    const id = setTimeout(() => setRevealed((v) => v + 1), 320);
    return () => clearTimeout(id);
  }, [rec.isRecording, revealed, words.length]);

  const startRecordingFlow = () => {
    setPrepLeft(null);
    setElapsed(0);
    setRevealed(0);
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
    if (rec.isRecording) rec.stop();
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

  const transcript = rec.isRecording || revealed > 0 ? words.slice(0, revealed).join(" ") : "";

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

        <TranscriptBox text={transcript} live={rec.isRecording} />

        <View style={styles.feedbackHeader}>
          <Text style={styles.feedbackTitle}>Assessment</Text>
          <Text style={styles.feedbackHint}>Sample feedback</Text>
        </View>

        <ScoreBadge
          label={type.feedback.scoreLabel}
          value={type.feedback.scoreValue}
          caption={type.feedback.scoreCaption}
          accent={mode.accent}
          onAccent={mode.onAccent}
        />

        <FeedbackCards feedback={type.feedback} />
      </ScrollView>

      {/* Sticky record bar */}
      <View style={[styles.recordBar, { paddingBottom: spacing.lg }]}>
        <RecordButton recording={rec.isRecording} accent={mode.accent} onPress={onMicPress} />
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
  recordBar: {
    paddingTop: spacing.md,
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
});
