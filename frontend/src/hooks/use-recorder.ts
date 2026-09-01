// Real microphone recording (native) with a web-safe simulation fallback.
// UI phase: we capture real audio on device but the transcript is mock.

import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  getRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";

export type PermStatus = "undetermined" | "granted" | "denied" | "blocked";

export function useRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [permStatus, setPermStatus] = useState<PermStatus>(
    Platform.OS === "web" ? "granted" : "undetermined",
  );

  // Reflect the current OS permission on mount (native only).
  useEffect(() => {
    if (Platform.OS === "web") return;
    (async () => {
      try {
        const res = await getRecordingPermissionsAsync();
        setPermStatus(
          res.granted ? "granted" : res.canAskAgain ? "undetermined" : "blocked",
        );
      } catch {
        // leave as undetermined
      }
    })();
  }, []);

  // Triggers the native permission prompt (respects canAskAgain).
  const requestPermission = useCallback(async (): Promise<PermStatus> => {
    if (Platform.OS === "web") {
      setPermStatus("granted");
      return "granted";
    }
    try {
      const res = await requestRecordingPermissionsAsync();
      const status: PermStatus = res.granted
        ? "granted"
        : res.canAskAgain
          ? "denied"
          : "blocked";
      setPermStatus(status);
      return status;
    } catch {
      setPermStatus("blocked");
      return "blocked";
    }
  }, []);

  const start = useCallback(async () => {
    setIsRecording(true);
    if (Platform.OS === "web") return;
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      // Keep the UI in a recording state even if the native call hiccups.
    }
  }, [recorder]);

  const stop = useCallback(async () => {
    setIsRecording(false);
    if (Platform.OS === "web") return;
    try {
      await recorder.stop();
    } catch {
      // ignore
    }
  }, [recorder]);

  return { isRecording, permStatus, requestPermission, start, stop };
}
