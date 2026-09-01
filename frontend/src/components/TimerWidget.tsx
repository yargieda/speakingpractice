import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing, radius, fonts, fontSize } from "@/src/theme/theme";

export type TimerPhase = "idle" | "prep" | "recording" | "done";

type Props = {
  phase: TimerPhase;
  label: string;
  timeText: string;
  targetText: string;
  accent: string;
  hasPrep: boolean;
  prepActive: boolean;
  onStartPrep: () => void;
};

export default function TimerWidget({
  phase,
  label,
  timeText,
  targetText,
  accent,
  hasPrep,
  prepActive,
  onStartPrep,
}: Props) {
  const danger = phase === "recording";
  const timeColor = danger ? colors.error : prepActive ? accent : colors.onSurface;

  return (
    <View style={styles.card} testID="timer-widget">
      <View style={styles.left}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.time, { color: timeColor }]} testID="timer-value">
          {timeText}
        </Text>
        <Text style={styles.target}>{targetText}</Text>
      </View>

      {hasPrep && phase !== "recording" ? (
        <Pressable
          onPress={onStartPrep}
          style={[
            styles.prepBtn,
            prepActive
              ? { backgroundColor: colors.surfaceTertiary, borderColor: colors.borderStrong }
              : { backgroundColor: accent, borderColor: accent },
          ]}
          testID="start-prep-button"
        >
          <Feather
            name={prepActive ? "rotate-ccw" : "clock"}
            size={14}
            color={prepActive ? colors.onSurfaceTertiary : colors.onBrandPrimary}
          />
          <Text
            style={[
              styles.prepText,
              { color: prepActive ? colors.onSurfaceTertiary : colors.onBrandPrimary },
            ]}
          >
            {prepActive ? "Restart Prep" : "Start Prep"}
          </Text>
        </Pressable>
      ) : (
        <View style={[styles.dot, { backgroundColor: danger ? colors.error : colors.border }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  left: {
    gap: 2,
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.muted,
  },
  time: {
    fontFamily: fonts.serifMedium,
    fontSize: fontSize["3xl"],
    fontVariant: ["tabular-nums"],
  },
  target: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  prepBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  prepText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.sm,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: radius.pill,
  },
});
