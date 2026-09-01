import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing, radius, fonts, fontSize } from "@/src/theme/theme";

type Props = {
  text: string;
  live: boolean;
};

export default function TranscriptBox({ text, live }: Props) {
  const empty = text.length === 0;

  return (
    <View style={styles.card} testID="transcript-box">
      <View style={styles.header}>
        <Feather name="align-left" size={14} color={colors.muted} />
        <Text style={styles.title}>Live Transcript</Text>
        {live ? (
          <View style={styles.liveTag}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        ) : null}
      </View>

      {empty ? (
        <Text style={styles.placeholder} testID="transcript-placeholder">
          Your speech will appear here as you speak…
        </Text>
      ) : (
        <Text style={styles.body} testID="transcript-text">
          {text}
          {live ? <Text style={styles.caret}> ▍</Text> : null}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    minHeight: 120,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.sm,
    color: colors.onSurfaceTertiary,
  },
  liveTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.errorTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  liveText: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.error,
  },
  placeholder: {
    fontFamily: fonts.sans,
    fontSize: fontSize.base,
    color: colors.muted,
    lineHeight: 24,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: fontSize.base,
    color: colors.onSurface,
    lineHeight: 24,
  },
  caret: {
    color: colors.error,
    fontFamily: fonts.sansMedium,
  },
});
