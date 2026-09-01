// NATIVE implementation — real audio capture + playback via expo-audio.
// Browser SpeechRecognition is unavailable on native, so liveSupported=false
// and the screen falls back to a demo transcript. Audio playback is real.

import { useCallback, useEffect, useRef, useState } from "react";
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
  const audioUriRef = useRef<string | null>(null);

  // Native browsers' live STT API is not available here.
  const liveSupported = false;
  const transcript = "";
  const audioBlob = null;

  const getRecordedAudio = () =>
    audioUriRef.current ? { uri: audioUriRef.current } : null;

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
    audioUriRef.current = null;
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
      audioUriRef.current = recorder.uri ?? null;
      setAudioUri(recorder.uri ?? null);
    } catch {
      // ignore
    }
  }, [recorder]);

  const reset = useCallback(() => {
    setAudioUri(null);
    audioUriRef.current = null;
  }, []);

  return {
    isRecording,
    transcript,
    audioUri,
    audioBlob,
    permStatus,
    liveSupported,
    requestPermission,
    getRecordedAudio,
    start,
    stop,
    reset,
  };
}
