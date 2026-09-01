import { useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";

import { colors, spacing, fonts, fontSize } from "@/src/theme/theme";

type Props = {
  recording: boolean;
  accent: string;
  onPress: () => void;
};

export default function RecordButton({ recording, accent, onPress }: Props) {
  const pulse = useSharedValue(0);
  const press = useSharedValue(1);

  useEffect(() => {
    if (recording) {
      pulse.value = withRepeat(
        withTiming(1, { duration: 1200, easing: Easing.out(Easing.ease) }),
        -1,
        false,
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(0, { duration: 200 });
    }
  }, [recording, pulse]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.35 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 0.6 }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));

  const handleIn = () => {
    press.value = withTiming(0.94, { duration: 90 });
  };
  const handleOut = () => {
    press.value = withSequence(
      withTiming(1.03, { duration: 120 }),
      withTiming(1, { duration: 90 }),
    );
  };

  const fill = recording ? colors.error : accent;

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={[styles.halo, { backgroundColor: colors.error, pointerEvents: "none" }, haloStyle]}
      />
      <Animated.View style={buttonStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={handleIn}
          onPressOut={handleOut}
          style={[styles.button, { backgroundColor: fill }]}
          testID="record-button"
          accessibilityLabel={recording ? "Stop recording" : "Start recording"}
        >
          {recording ? (
            <View style={styles.stopIcon} />
          ) : (
            <Feather name="mic" size={30} color={colors.onBrandPrimary} />
          )}
        </Pressable>
      </Animated.View>
      <Text style={styles.caption} testID="record-caption">
        {recording ? "Tap to stop" : "Tap to record"}
      </Text>
    </View>
  );
}

const SIZE = 84;

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  halo: {
    position: "absolute",
    top: 0,
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: { boxShadow: "0px 4px 12px rgba(28,25,23,0.18)" },
      default: {
        shadowColor: "#1C1917",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  },
  stopIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.onError,
  },
  caption: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.sm,
    color: colors.muted,
  },
});
