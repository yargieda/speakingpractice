// NATIVE audio playback for the user's own recording via expo-audio.
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

import { colors, spacing, radius, fonts, fontSize } from "@/src/theme/theme";

export default function AudioPlayer({ uri, accent }: { uri: string; accent: string }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const playing = status?.playing ?? false;

  const toggle = () => {
    if (playing) {
      player.pause();
    } else {
      player.seekTo(0);
      player.play();
    }
  };

  return (
    <View style={styles.card} testID="audio-player">
      <Pressable
        onPress={toggle}
        style={[styles.playBtn, { backgroundColor: accent }]}
        testID="audio-play-button"
      >
        <Feather name={playing ? "pause" : "play"} size={18} color={colors.onBrandPrimary} />
      </Pressable>
      <View style={styles.meta}>
        <Text style={styles.title}>Your recording</Text>
        <Text style={styles.hint}>{playing ? "Playing…" : "Tap to listen back"}</Text>
      </View>
      <Feather name="volume-2" size={18} color={colors.muted} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.base,
    color: colors.onSurface,
  },
  hint: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.muted,
  },
});
