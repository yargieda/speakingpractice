import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing, radius, fonts, fontSize } from "@/src/theme/theme";
import type { Feedback, FeedbackItem } from "@/src/data/mockData";

type Section = {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  tint: string;
  accent: string;
  items: FeedbackItem[];
};

function Row({ item, accent }: { item: FeedbackItem; accent: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.diffLine}>
        <Feather name="x" size={13} color={colors.error} />
        <Text style={styles.original}>{item.original}</Text>
      </View>
      <View style={styles.diffLine}>
        <Feather name="check" size={13} color={colors.success} />
        <Text style={styles.suggestion}>{item.suggestion}</Text>
      </View>
      <Text style={[styles.note, { color: accent }]}>{item.note}</Text>
    </View>
  );
}

function Card({ section }: { section: Section }) {
  return (
    <View style={styles.card} testID={`feedback-card-${section.icon}`}>
      <View style={[styles.head, { backgroundColor: section.tint }]}>
        <Feather name={section.icon} size={15} color={section.accent} />
        <Text style={[styles.headText, { color: section.accent }]}>{section.title}</Text>
        <View style={[styles.count, { backgroundColor: section.accent }]}>
          <Text style={styles.countText}>{section.items.length}</Text>
        </View>
      </View>
      <View style={styles.body}>
        {section.items.map((item, i) => (
          <Row key={i} item={item} accent={section.accent} />
        ))}
      </View>
    </View>
  );
}

export default function FeedbackCards({ feedback }: { feedback: Feedback }) {
  const sections: Section[] = [
    {
      title: "Grammar Fixes",
      icon: "edit-3",
      tint: colors.errorTint,
      accent: colors.error,
      items: feedback.grammar,
    },
    {
      title: "Vocabulary Enhancements",
      icon: "trending-up",
      tint: colors.successTint,
      accent: colors.success,
      items: feedback.vocabulary,
    },
  ];

  if (feedback.phraseology && feedback.phraseology.length > 0) {
    sections.push({
      title: "Aviation Phraseology Check",
      icon: "radio",
      tint: colors.warningTint,
      accent: "#B07514",
      items: feedback.phraseology,
    });
  }

  return (
    <View style={styles.wrap}>
      {sections.map((s) => (
        <Card key={s.title} section={s} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  headText: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.base,
  },
  count: {
    minWidth: 20,
    height: 20,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.onBrandPrimary,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  row: {
    gap: spacing.xs,
  },
  diffLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  original: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.muted,
    textDecorationLine: "line-through",
    lineHeight: 20,
  },
  suggestion: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.sm,
    color: colors.onSurface,
    lineHeight: 20,
  },
  note: {
    fontFamily: fonts.sans,
    fontSize: fontSize.xs,
    lineHeight: 18,
    marginTop: 2,
  },
});
