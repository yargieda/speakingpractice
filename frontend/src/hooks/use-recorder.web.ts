// WEB implementation — real-time STT via browser SpeechRecognition +
// raw audio capture via MediaRecorder. Metro auto-selects this file on web.
// All processing stays client-side; no external services.

import { useCallback, useEffect, useRef, useState } from "react";

export type PermStatus = "undetermined" | "granted" | "denied" | "blocked";

const getSR = () =>
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : undefined;

export function useRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [permStatus, setPermStatus] = useState<PermStatus>("undetermined");

  const liveSupported = !!getSR();

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const finalRef = useRef("");
  const recordingRef = useRef(false);

  // Reflect current mic permission state where the browser exposes it.
  useEffect(() => {
    (async () => {
      try {
        const perms = (navigator as any).permissions;
        if (perms?.query) {
          const res = await perms.query({ name: "microphone" as any });
          const map = (s: string): PermStatus =>
            s === "granted" ? "granted" : s === "denied" ? "blocked" : "undetermined";
          setPermStatus(map(res.state));
          res.onchange = () => setPermStatus(map(res.state));
        }
      } catch {
        // permissions API not available — stay undetermined
      }
    })();
  }, []);

  const requestPermission = useCallback(async (): Promise<PermStatus> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setPermStatus("granted");
      return "granted";
    } catch {
      setPermStatus("blocked");
      return "blocked";
    }
  }, []);

  const stop = useCallback(async () => {
    recordingRef.current = false;
    setIsRecording(false);
    try {
      recognitionRef.current?.stop();
    } catch {
      /* noop */
    }
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    } catch {
      /* noop */
    }
  }, []);

  const clearAudio = useCallback((uri: string | null) => {
    if (uri) {
      try {
        URL.revokeObjectURL(uri);
      } catch {
        /* noop */
      }
    }
  }, []);

  const start = useCallback(async () => {
    // Fresh take: clear previous transcript + audio.
    finalRef.current = "";
    setTranscript("");
    setAudioUri((prev) => {
      clearAudio(prev);
      return null;
    });
    chunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setPermStatus("blocked");
      return;
    }
    streamRef.current = stream;
    setPermStatus("granted");

    // Raw audio capture for playback.
    try {
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mr.mimeType || "audio/webm",
        });
        const url = URL.createObjectURL(blob);
        setAudioUri(url);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      mr.start();
    } catch {
      /* MediaRecorder unsupported — continue with STT only */
    }

    // Real-time speech recognition.
    const SR = getSR();
    if (SR) {
      const recog = new SR();
      recog.lang = "en-US";
      recog.continuous = true;
      recog.interimResults = true;
      recog.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) finalRef.current += res[0].transcript;
          else interim += res[0].transcript;
        }
        setTranscript((finalRef.current + interim).trim());
      };
      recog.onerror = () => {
        /* ignore transient errors (e.g. no-speech) */
      };
      recog.onend = () => {
        // Chrome auto-stops after silence; restart while the user is still recording.
        if (recordingRef.current) {
          try {
            recog.start();
          } catch {
            /* noop */
          }
        }
      };
      recognitionRef.current = recog;
      try {
        recog.start();
      } catch {
        /* noop */
      }
    }

    recordingRef.current = true;
    setIsRecording(true);
  }, [clearAudio]);

  const reset = useCallback(() => {
    finalRef.current = "";
    setTranscript("");
    setAudioUri((prev) => {
      clearAudio(prev);
      return null;
    });
  }, [clearAudio]);

  // Cleanup on unmount.
  useEffect(
    () => () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* noop */
      }
      try {
        mediaRecorderRef.current?.stop();
      } catch {
        /* noop */
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

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
