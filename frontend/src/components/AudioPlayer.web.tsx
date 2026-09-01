// WEB audio playback for the user's own recording (Blob URL) via HTMLAudioElement.
import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing, radius, fonts, fontSize } from "@/src/theme/theme";

export default function AudioPlayer({ uri, accent }: { uri: string; accent: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const a = new Audio(uri);
    a.onended = () => setPlaying(false);
    a.onpause = () => setPlaying(false);
    audioRef.current = a;
    return () => {
      a.pause();
      audioRef.current = null;
    };
  }, [uri]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.currentTime = 0;
      a.play();
      setPlaying(true);
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
