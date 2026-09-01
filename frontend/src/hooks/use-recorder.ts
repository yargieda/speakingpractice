// NATIVE implementation — real audio capture + playback via expo-audio.
// Browser SpeechRecognition is unavailable on native, so liveSupported=false
// and the screen falls back to a demo transcript. Audio playback is real.

import { useCallback, useEffect, useState } from "react";
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
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [permStatus, setPermStatus] = useState<PermStatus>("undetermined");

  // Native browsers' live STT API is not available here.
  const liveSupported = false;
  const transcript = "";

  useEffect(() => {
    (async () => {
      try {
        const res = await getRecordingPermissionsAsync();
        setPermStatus(
          res.granted ? "granted" : res.canAskAgain ? "undetermined" : "blocked",
        );
      } catch {
        // stay undetermined
      }
    })();
  }, []);

  const requestPermission = useCallback(async (): Promise<PermStatus> => {
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
    setAudioUri(null);
    setIsRecording(true);
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      // keep UI in recording state even if the native call hiccups
    }
  }, [recorder]);

  const stop = useCallback(async () => {
    setIsRecording(false);
    try {
      await recorder.stop();
      setAudioUri(recorder.uri ?? null);
    } catch {
      // ignore
    }
  }, [recorder]);

  const reset = useCallback(() => {
    setAudioUri(null);
  }, []);

  return {
    isRecording,
    transcript,
    audioUri,
    permStatus,
    liveSupported,
    requestPermission,
    start,
    stop,
    reset,
  };
}
