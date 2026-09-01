import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";

import { colors, spacing, radius, fonts, fontSize, shadow } from "@/src/theme/theme";

type Props = {
  instruction: string;
  prompt: string;
  accent: string;
  heroImage: string;
  onShuffle: () => void;
};

export default function PromptCard({
  instruction,
  prompt,
  accent,
  heroImage,
  onShuffle,
}: Props) {
  return (
    <View style={styles.card} testID="prompt-card">
      <Image
        source={{ uri: heroImage }}
        style={styles.hero}
        contentFit="cover"
        transition={250}
      />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={[styles.tag, { backgroundColor: accent }]}>
            <Feather name="book-open" size={12} color={colors.onBrandPrimary} />
            <Text style={styles.tagText}>PROMPT</Text>
          </View>
          <Pressable
            onPress={onShuffle}
            style={styles.shuffle}
            hitSlop={8}
            testID="shuffle-prompt-button"
          >
            <Feather name="refresh-cw" size={14} color={colors.muted} />
            <Text style={styles.shuffleText}>New</Text>
          </Pressable>
        </View>

        <Text style={styles.instruction}>{instruction}</Text>
        <Text style={styles.prompt} testID="prompt-text">
          {prompt}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadow.card,
  },
  hero: {
    width: "100%",
    height: 96,
    backgroundColor: colors.surfaceTertiary,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  tagText: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.onBrandPrimary,
  },
  shuffle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  shuffleText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  instruction: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.muted,
    lineHeight: 20,
  },
  prompt: {
    fontFamily: fonts.serifMedium,
    fontSize: fontSize.xl,
    color: colors.onSurface,
    lineHeight: 30,
  },
});
