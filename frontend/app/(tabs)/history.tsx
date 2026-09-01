import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { colors, spacing, radius, fonts, fontSize } from "@/src/theme/theme";
import { getHistory, deleteHistory, type HistoryEntry } from "@/src/utils/history";

const ACCENT: Record<string, string> = { ielts: colors.brandSecondary, icao: colors.brandTertiary };

const fmtDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }) + " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

const fmtTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

function HistoryCard({ item, onDelete }: { item: HistoryEntry; onDelete: (id: string) => void }) {
  const accent = ACCENT[item.mode] ?? colors.brandPrimary;
  return (
    <View style={styles.card} testID={`history-card-${item.id}`}>
      <View style={styles.cardTop}>
        <View style={[styles.modeTag, { backgroundColor: accent }]}>
          <Text style={styles.modeTagText}>{item.mode === "ielts" ? "IELTS" : "ICAO"}</Text>
        </View>
        <Text style={styles.cardType}>{item.practiceLabel}</Text>
        <Pressable
          onPress={() => onDelete(item.id)}
          hitSlop={8}
          style={styles.deleteBtn}
          testID={`history-delete-${item.id}`}
        >
          <Feather name="trash-2" size={16} color={colors.muted} />
        </Pressable>
      </View>

      <View style={styles.scoreRow}>
        <Text style={[styles.scoreValue, { color: accent }]}>{item.assessment.scoreValue}</Text>
        <View style={styles.scoreMeta}>
          <Text style={styles.scoreLabel}>{item.assessment.scoreLabel}</Text>
          <Text style={styles.scoreCaption}>{item.assessment.scoreCaption}</Text>
        </View>
        <Text style={styles.date}>{fmtDate(item.createdAt)}</Text>
      </View>

      <Text style={styles.transcript} numberOfLines={2}>
        {item.transcript}
      </Text>

      <View style={styles.statsRow}>
        <Text style={styles.statChip}>{item.stats.wordCount} words</Text>
        <Text style={styles.statChip}>{item.stats.wpm} wpm</Text>
        <Text style={styles.statChip}>{fmtTime(item.stats.durationSeconds)}</Text>
        {item.stats.fillerCount > 0 ? (
          <Text style={[styles.statChip, styles.fillerChip]}>{item.stats.fillerCount} fillers</Text>
        ) : null}
      </View>
    </View>
  );
}

export default function HistoryTab() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getHistory();
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const onDelete = async (id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    await deleteHistory(id);
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>Practice History</Text>
        <Text style={styles.subtitle}>Your scored attempts over time</Text>
      </View>

      {loading ? (
        <View style={styles.center} testID="history-loading">
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(x) => x.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <HistoryCard item={item} onDelete={onDelete} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.brandPrimary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty} testID="history-empty">
              <View style={styles.emptyIcon}>
                <Feather name="mic" size={28} color={colors.muted} />
              </View>
              <Text style={styles.emptyTitle}>No attempts yet</Text>
              <Text style={styles.emptyText}>
                Record and finish a speaking answer to see your AI score and track progress here.
              </Text>
            </View>
          }
        />
      )}
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
  title: {
    fontFamily: fonts.serifMedium,
    fontSize: fontSize["2xl"],
    color: colors.onSurface,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 2,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: {
    padding: spacing.xl,
    gap: spacing.md,
    paddingBottom: spacing["2xl"],
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  modeTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  modeTagText: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    letterSpacing: 0.5,
    color: colors.onBrandPrimary,
  },
  cardType: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.sm,
    color: colors.onSurface,
  },
  deleteBtn: { padding: spacing.xs },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  scoreValue: {
    fontFamily: fonts.serifMedium,
    fontSize: fontSize["3xl"],
    fontVariant: ["tabular-nums"],
  },
  scoreMeta: { flex: 1, gap: 1 },
  scoreLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.sm,
    color: colors.onSurface,
  },
  scoreCaption: {
    fontFamily: fonts.sans,
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  date: {
    fontFamily: fonts.sans,
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  transcript: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.onSurfaceTertiary,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statChip: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.muted,
    backgroundColor: colors.surfaceTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  fillerChip: {
    color: "#B07514",
    backgroundColor: colors.warningTint,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["3xl"],
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: fontSize.xl,
    color: colors.onSurface,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.base,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 22,
  },
});
