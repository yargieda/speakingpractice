import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing, radius, fonts, fontSize } from "@/src/theme/theme";
import { isFiller } from "@/src/utils/fillers";

type Props = {
  text: string;
  live: boolean;
  corrections?: string[];
};

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function renderTokensWithFillers(text: string, keyBase: string) {
  const parts = text.split(/(\s+)/);
  return parts.map((part, i) => {
    if (part === "" || /^\s+$/.test(part)) return <Text key={`${keyBase}-${i}`}>{part}</Text>;
    if (isFiller(part)) {
      return (
        <Text key={`${keyBase}-${i}`} style={styles.filler}>
          {part}
        </Text>
      );
    }
    return <Text key={`${keyBase}-${i}`}>{part}</Text>;
  });
}

function renderContent(text: string, corrections?: string[]) {
  const phrases = (corrections ?? [])
    .map((p) => p.trim())
    .filter((p) => p.length >= 2)
    .sort((a, b) => b.length - a.length);

  if (phrases.length === 0) return renderTokensWithFillers(text, "f");

  const re = new RegExp(`(${phrases.map(escapeRe).join("|")})`, "gi");
  const segments = text.split(re);
  const lowerSet = new Set(phrases.map((p) => p.toLowerCase()));

  return segments.map((seg, i) => {
    if (seg === "") return null;
    if (lowerSet.has(seg.toLowerCase())) {
      return (
        <Text key={`c-${i}`} style={styles.correction}>
          {seg}
        </Text>
      );
    }
    return <Text key={`seg-${i}`}>{renderTokensWithFillers(seg, `s${i}`)}</Text>;
  });
}

export default function TranscriptBox({ text, live, corrections }: Props) {
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
          {renderContent(text, corrections)}
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
  filler: {
    fontFamily: fonts.sansMedium,
    color: "#B07514",
    backgroundColor: colors.warningTint,
    textDecorationLine: "underline",
  },
  correction: {
    fontFamily: fonts.sansMedium,
    color: colors.error,
    backgroundColor: colors.errorTint,
    textDecorationLine: "line-through",
  },
  caret: {
    color: colors.error,
    fontFamily: fonts.sansMedium,
  },
});
