import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";

import { colors, spacing, radius, fonts, fontSize } from "@/src/theme/theme";

type Props = {
  answer: string;
  accent: string;
  label?: string;
};

export default function ModelAnswerCard({ answer, accent, label = "Model Answer" }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.card} testID="model-answer-card">
      <Pressable
        style={styles.header}
        onPress={() => setOpen((v) => !v)}
        testID="model-answer-toggle"
      >
        <View style={[styles.iconWrap, { backgroundColor: accent }]}>
          <Feather name="key" size={13} color={colors.onBrandPrimary} />
        </View>
        <View style={styles.headText}>
          <Text style={styles.title}>{label}</Text>
          <Text style={styles.subtitle}>
            {open ? "How a top answer could sound" : "Tap to reveal a sample answer"}
          </Text>
        </View>
        <Feather name={open ? "chevron-up" : "chevron-down"} size={20} color={colors.muted} />
      </Pressable>

      {open ? (
        <Animated.View entering={FadeIn.duration(220)} style={styles.body}>
          <Text style={styles.answer} testID="model-answer-text">
            {answer}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  headText: { flex: 1, gap: 1 },
  title: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.base,
    color: colors.onSurface,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
  },
  answer: {
    fontFamily: fonts.serif,
    fontSize: fontSize.lg,
    color: colors.onSurface,
    lineHeight: 26,
  },
});
