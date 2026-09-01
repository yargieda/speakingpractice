import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing, radius, fonts, fontSize } from "@/src/theme/theme";

type Props = {
  words: number;
  wpm: number;
  seconds: number;
  fillers: number;
  accent: string;
};

const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

function Stat({
  icon,
  value,
  label,
  tint,
}: {
  icon: keyof typeof Feather.glyphMap;
  value: string;
  label: string;
  tint: string;
}) {
  return (
    <View style={styles.stat}>
      <Feather name={icon} size={14} color={tint} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export default function StatsBar({ words, wpm, seconds, fillers, accent }: Props) {
  return (
    <View style={styles.card} testID="stats-bar">
      <Stat icon="type" value={String(words)} label="words" tint={accent} />
      <View style={styles.sep} />
      <Stat icon="activity" value={String(wpm)} label="wpm" tint={accent} />
      <View style={styles.sep} />
      <Stat icon="clock" value={fmt(seconds)} label="time" tint={accent} />
      <View style={styles.sep} />
      <Stat
        icon="alert-circle"
        value={String(fillers)}
        label="fillers"
        tint={fillers > 0 ? colors.warning : accent}
      />
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
    paddingHorizontal: spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  value: {
    fontFamily: fonts.serifMedium,
    fontSize: fontSize.lg,
    color: colors.onSurface,
    fontVariant: ["tabular-nums"],
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.muted,
  },
  sep: {
    width: 1,
    height: 28,
    backgroundColor: colors.divider,
  },
});
