import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { spacing, radius, fonts, fontSize } from "@/src/theme/theme";

type Props = {
  label: string; // "IELTS Band" | "ICAO Level"
  value: string; // "7.5" | "4"
  caption: string;
  accent: string;
  onAccent: string;
};

export default function ScoreBadge({ label, value, caption, accent, onAccent }: Props) {
  return (
    <View style={[styles.card, { backgroundColor: accent }]} testID="score-badge">
      <View style={styles.left}>
        <View style={styles.labelRow}>
          <Feather name="award" size={14} color={onAccent} />
          <Text style={[styles.label, { color: onAccent }]}>{label}</Text>
        </View>
        <Text style={[styles.caption, { color: onAccent }]}>{caption}</Text>
      </View>
      <Text style={[styles.value, { color: onAccent }]} testID="score-value">
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  left: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.lg,
    opacity: 0.95,
  },
  caption: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    opacity: 0.8,
  },
  value: {
    fontFamily: fonts.serifMedium,
    fontSize: fontSize.score,
    lineHeight: fontSize.score + 4,
  },
});
