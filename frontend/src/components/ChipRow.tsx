import { ScrollView, Pressable, Text, StyleSheet } from "react-native";

import { colors, spacing, radius, fonts, fontSize } from "@/src/theme/theme";
import type { PracticeType } from "@/src/data/mockData";

type Props = {
  types: PracticeType[];
  selectedId: string;
  accent: string;
  onAccent: string;
  onSelect: (id: string) => void;
};

export default function ChipRow({
  types,
  selectedId,
  accent,
  onAccent,
  onSelect,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.row}
      contentContainerStyle={styles.content}
      testID="practice-type-chip-row"
    >
      {types.map((t) => {
        const active = t.id === selectedId;
        return (
          <Pressable
            key={t.id}
            onPress={() => onSelect(t.id)}
            style={[
              styles.chip,
              active
                ? { backgroundColor: accent, borderColor: accent }
                : { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
            ]}
            testID={`chip-${t.id}`}
          >
            <Text
              style={[
                styles.chipText,
                { color: active ? onAccent : colors.muted },
              ]}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexGrow: 0,
  },
  content: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
  },
  chip: {
    flexShrink: 0,
    height: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  chipText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.sm,
  },
});
