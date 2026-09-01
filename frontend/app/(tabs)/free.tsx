import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";

import { colors, spacing, radius, fonts, fontSize } from "@/src/theme/theme";
import { useRecorder } from "@/src/hooks/use-recorder";
import RecordButton from "@/src/components/RecordButton";
import TranscriptBox from "@/src/components/TranscriptBox";
import StatsBar from "@/src/components/StatsBar";
import FeedbackCards from "@/src/components/FeedbackCards";
import ModelAnswerCard from "@/src/components/ModelAnswerCard";
import PermissionSheet from "@/src/components/PermissionSheet";
import { scorePractice, type Assessment } from "@/src/api/client";
import { countFillers, wordCount, computeWpm } from "@/src/utils/fillers";
import {
  getFreeTalk,
  setGoal,
  addSeconds,
  todaySeconds,
  type FreeTalkStore,
} from "@/src/utils/freetalk";
import { FREE_TOPICS, ENCOURAGEMENTS, MILESTONE_MESSAGES } from "@/src/data/freeTopics";

const ACCENT = colors.brandPrimary;
const MILESTONES = [0.25, 0.5, 0.75, 1];
const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

export default function FreeTalkTab() {
  const insets = useSafeAreaInsets();
  const rec = useRecorder();

  const [store, setStore] = useState<FreeTalkStore | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [topicIdx, setTopicIdx] = useState(0);
  const [encouragement, setEncouragement] = useState(ENCOURAGEMENTS[0]);
  const [reachedIdx, setReachedIdx] = useState(-1);
  const [sheet, setSheet] = useState<null | "explain" | "blocked">(null);

  // quick tips (AI)
  const [tipState, setTipState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [tips, setTips] = useState<Assessment | null>(null);

  const goalMin = store?.dailyGoalMin ?? 20;
  const storedToday = store ? todaySeconds(store) : 0;
  const todayLive = storedToday + sessionSeconds;
  const progress = Math.min(1, todayLive / (goalMin * 60));

  const load = useCallback(async () => {
    const s = await getFreeTalk();
    setStore(s);
    const p = todaySeconds(s) / (s.dailyGoalMin * 60);
    let idx = -1;
    MILESTONES.forEach((m, i) => {
      if (p >= m) idx = i;
    });
    setReachedIdx(idx);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    setTopicIdx(Math.floor(Math.random() * FREE_TOPICS.length));
  }, []);

  // session timer + topic auto-rotation + rotating encouragement
  useEffect(() => {
    if (!rec.isRecording) return;
    const id = setTimeout(() => {
      setSessionSeconds((v) => {
        const next = v + 1;
        if (next > 0 && next % 60 === 0) {
          setTopicIdx((t) => (t + 1) % FREE_TOPICS.length);
          setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
        }
        return next;
      });
    }, 1000);
    return () => clearTimeout(id);
  }, [rec.isRecording, sessionSeconds]);

  // milestone detection
  useEffect(() => {
    let idx = reachedIdx;
    for (let i = 0; i < MILESTONES.length; i++) if (progress >= MILESTONES[i]) idx = i;
    if (idx > reachedIdx) {
      setReachedIdx(idx);
      setEncouragement(MILESTONE_MESSAGES[idx]);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(
          idx === 3
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning,
        );
      }
    }
  }, [progress, reachedIdx]);

  const flush = useCallback(async () => {
    if (sessionSeconds <= 0) return;
    const updated = await addSeconds(sessionSeconds);
    setStore(updated);
    setSessionSeconds(0);
  }, [sessionSeconds]);

  // persist practice time whenever a recording session ends
  const wasRecording = useRef(false);
  useEffect(() => {
    if (rec.isRecording) {
      wasRecording.current = true;
      return;
    }
    if (wasRecording.current) {
      wasRecording.current = false;
      flush();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rec.isRecording]);

  const startFlow = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTipState("idle");
    setTips(null);
    rec.start();
  };

  const onMicPress = async () => {
    if (rec.isRecording) {
      rec.stop();
      return;
    }
    if (rec.permStatus === "granted") return startFlow();
    if (rec.permStatus === "blocked") return setSheet("blocked");
    setSheet("explain");
  };

  const onAllow = async () => {
    setSheet(null);
    const status = await rec.requestPermission();
    if (status === "granted") startFlow();
    else if (status === "blocked") setSheet("blocked");
  };

  const changeGoal = async (min: number) => {
    const s = await setGoal(min);
    setStore(s);
  };

  const nextTopic = () => {
    setTopicIdx((t) => (t + 1) % FREE_TOPICS.length);
    setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
  };

  const getTips = async () => {
    const t = rec.transcript;
    if (wordCount(t) < 3) {
      setTipState("error");
      return;
    }
    setTipState("loading");
    try {
      const a = await scorePractice({
        mode: "free",
        practice_type: "free",
        practice_label: "Free Talk",
        prompt: FREE_TOPICS[topicIdx],
        transcript: t,
      });
      setTips(a);
      setTipState("done");
    } catch {
      setTipState("error");
    }
  };

  const liveWords = wordCount(rec.transcript);
  const goalReached = progress >= 1;
  const hasTranscript = rec.transcript.trim().length > 0;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Free Talk</Text>
            <Text style={styles.subtitle}>Daily fluency workout</Text>
          </View>
          <View style={styles.streakChip}>
            <Feather name="zap" size={14} color={colors.warning} />
            <Text style={styles.streakText}>{store?.streak ?? 0} day streak</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily goal + progress */}
        <View style={styles.goalCard}>
          <View style={styles.goalTop}>
            <Text style={styles.goalLabel}>Today&apos;s speaking</Text>
            <View style={styles.goalChips}>
              {[20, 30].map((m) => {
                const active = goalMin === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => changeGoal(m)}
                    style={[
                      styles.goalChip,
                      active
                        ? { backgroundColor: ACCENT, borderColor: ACCENT }
                        : { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                    testID={`goal-chip-${m}`}
                  >
                    <Text
                      style={[
                        styles.goalChipText,
                        { color: active ? colors.onBrandPrimary : colors.muted },
                      ]}
                    >
                      {m}m
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Text style={styles.goalTime} testID="free-today-time">
            {fmt(todayLive)}{" "}
            <Text style={styles.goalTarget}>/ {goalMin}:00</Text>
          </Text>

          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {
                  width: `${Math.round(progress * 100)}%`,
                  backgroundColor: goalReached ? colors.success : ACCENT,
                },
              ]}
            />
          </View>
          {goalReached ? (
            <Text style={styles.goalDone}>Daily goal complete — great job! 🎉</Text>
          ) : null}
        </View>

        {/* Topic */}
        <View style={styles.topicCard} testID="free-topic-card">
          <View style={styles.topicHead}>
            <View style={styles.topicTag}>
              <Feather name="message-circle" size={12} color={colors.onBrandPrimary} />
              <Text style={styles.topicTagText}>TALK ABOUT</Text>
            </View>
            <Pressable onPress={nextTopic} style={styles.nextTopic} hitSlop={8} testID="next-topic-button">
              <Feather name="refresh-cw" size={13} color={colors.muted} />
              <Text style={styles.nextTopicText}>New topic</Text>
            </Pressable>
          </View>
          <Text style={styles.topicText} testID="free-topic-text">
            {FREE_TOPICS[topicIdx]}
          </Text>
        </View>

        {/* Encouragement */}
        <Animated.View key={encouragement} entering={FadeIn.duration(260)} style={styles.encourage}>
          <Feather name="heart" size={14} color={colors.brandTertiary} />
          <Text style={styles.encourageText} testID="encouragement-text">
            {encouragement}
          </Text>
        </Animated.View>

        <TranscriptBox text={rec.transcript} live={rec.isRecording} />

        <StatsBar
          words={liveWords}
          wpm={computeWpm(liveWords, sessionSeconds)}
          seconds={sessionSeconds}
          fillers={countFillers(rec.transcript)}
          accent={ACCENT}
        />

        {/* Quick tips */}
        {!rec.isRecording && hasTranscript ? (
          <Pressable
            style={[styles.tipsBtn, { borderColor: ACCENT }]}
            onPress={getTips}
            testID="get-tips-button"
          >
            <Feather name="zap" size={16} color={ACCENT} />
            <Text style={[styles.tipsBtnText, { color: ACCENT }]}>
              Get quick tips on what I said
            </Text>
          </Pressable>
        ) : null}

        {tipState === "loading" ? (
          <View style={styles.tipNote} testID="tips-loading">
            <Text style={styles.tipNoteText}>Reviewing your free talk…</Text>
          </View>
        ) : null}
        {tipState === "error" ? (
          <View style={styles.tipNote} testID="tips-error">
            <Text style={styles.tipNoteText}>
              Speak a little (in Chrome or a device build) to get tips.
            </Text>
          </View>
        ) : null}
        {tipState === "done" && tips ? (
          <Animated.View entering={FadeIn.duration(300)} style={styles.tipsResult}>
            {tips.summary ? (
              <View style={styles.summaryCard} testID="free-summary">
                <Feather name="message-square" size={15} color={ACCENT} />
                <Text style={styles.summaryText}>{tips.summary}</Text>
              </View>
            ) : null}
            <FeedbackCards
              feedback={{
                scoreLabel: tips.scoreLabel,
                scoreValue: tips.scoreValue,
                scoreCaption: tips.scoreCaption,
                grammar: tips.grammar,
                vocabulary: tips.vocabulary,
                phraseology: undefined,
              }}
            />
            {tips.modelAnswer ? (
              <ModelAnswerCard answer={tips.modelAnswer} accent={ACCENT} label="Say it more fluently" />
            ) : null}
          </Animated.View>
        ) : null}
      </ScrollView>

      <View style={[styles.recordBar, { paddingBottom: spacing.lg }]}>
        <RecordButton recording={rec.isRecording} accent={ACCENT} onPress={onMicPress} />
      </View>

      <PermissionSheet
        visible={sheet !== null}
        mode={sheet === "blocked" ? "blocked" : "explain"}
        accent={ACCENT}
        onAccent={colors.onBrandPrimary}
        onAllow={onAllow}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontFamily: fonts.serifMedium, fontSize: fontSize["2xl"], color: colors.onSurface },
  subtitle: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.muted, marginTop: 2 },
  streakChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.warningTint,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  streakText: { fontFamily: fonts.sansMedium, fontSize: fontSize.xs, color: "#B07514" },
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing["2xl"],
  },
  goalCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  goalTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  goalLabel: { fontFamily: fonts.sansMedium, fontSize: fontSize.sm, color: colors.muted },
  goalChips: { flexDirection: "row", gap: spacing.sm },
  goalChip: {
    height: 32,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  goalChipText: { fontFamily: fonts.sansMedium, fontSize: fontSize.xs },
  goalTime: {
    fontFamily: fonts.serifMedium,
    fontSize: fontSize["3xl"],
    color: colors.onSurface,
    fontVariant: ["tabular-nums"],
  },
  goalTarget: { fontFamily: fonts.sans, fontSize: fontSize.lg, color: colors.muted },
  track: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
    overflow: "hidden",
  },
  fill: { height: 10, borderRadius: radius.pill },
  goalDone: { fontFamily: fonts.sansMedium, fontSize: fontSize.sm, color: colors.success },
  topicCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  topicHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topicTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: ACCENT,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  topicTagText: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.onBrandPrimary,
  },
  nextTopic: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  nextTopicText: { fontFamily: fonts.sansMedium, fontSize: fontSize.sm, color: colors.muted },
  topicText: {
    fontFamily: fonts.serifMedium,
    fontSize: fontSize.xl,
    color: colors.onSurface,
    lineHeight: 30,
  },
  encourage: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  encourageText: { flex: 1, fontFamily: fonts.sansMedium, fontSize: fontSize.sm, color: colors.onSurfaceTertiary },
  tipsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  tipsBtnText: { fontFamily: fonts.sansMedium, fontSize: fontSize.base },
  tipNote: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: "center",
  },
  tipNoteText: { fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.muted, textAlign: "center" },
  tipsResult: { gap: spacing.lg },
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
  summaryText: { flex: 1, fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.onSurface, lineHeight: 21 },
  recordBar: {
    paddingTop: spacing.md,
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
});
