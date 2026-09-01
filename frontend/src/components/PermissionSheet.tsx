import { Modal, View, Text, Pressable, StyleSheet, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing, radius, fonts, fontSize } from "@/src/theme/theme";

type Props = {
  visible: boolean;
  mode: "explain" | "blocked";
  accent: string;
  onAccent: string;
  onAllow: () => void;
  onClose: () => void;
};

export default function PermissionSheet({
  visible,
  mode,
  accent,
  onAccent,
  onAllow,
  onClose,
}: Props) {
  const blocked = mode === "blocked";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID="permission-sheet"
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={[styles.iconWrap, { backgroundColor: colors.surfaceTertiary }]}>
            <Feather
              name={blocked ? "mic-off" : "mic"}
              size={26}
              color={blocked ? colors.error : accent}
            />
          </View>

          <Text style={styles.title}>
            {blocked ? "Microphone Access Blocked" : "Enable Your Microphone"}
          </Text>
          <Text style={styles.body}>
            {blocked
              ? "Microphone access is turned off. Open Settings to allow it, then return to record your response."
              : "We use your microphone to record your speaking response for practice. Audio stays on your device during this phase."}
          </Text>

          {blocked ? (
            <Pressable
              style={[styles.primary, { backgroundColor: accent }]}
              onPress={() => Linking.openSettings()}
              testID="open-settings-button"
            >
              <Feather name="settings" size={16} color={onAccent} />
              <Text style={[styles.primaryText, { color: onAccent }]}>Open Settings</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.primary, { backgroundColor: accent }]}
              onPress={onAllow}
              testID="allow-microphone-button"
            >
              <Feather name="check" size={16} color={onAccent} />
              <Text style={[styles.primaryText, { color: onAccent }]}>Allow Microphone</Text>
            </Pressable>
          )}

          <Pressable style={styles.secondary} onPress={onClose} testID="permission-dismiss-button">
            <Text style={styles.secondaryText}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(28,25,23,0.45)",
    justifyContent: "center",
    padding: spacing.xl,
  },
  sheet: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.serifMedium,
    fontSize: fontSize.xl,
    color: colors.onSurface,
    textAlign: "center",
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: fontSize.base,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 22,
  },
  primary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 50,
    borderRadius: radius.md,
    alignSelf: "stretch",
    marginTop: spacing.sm,
  },
  primaryText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.lg,
  },
  secondary: {
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.base,
    color: colors.muted,
  },
});
