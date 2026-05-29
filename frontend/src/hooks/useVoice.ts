"use client";
import { useRef, useCallback, useEffect } from "react";
import { useChatStore } from "@/store/chat";
import { processVoice } from "@/lib/api";
import toast from "react-hot-toast";

const WAKE_WORDS = ["aura", "olá aura", "ei aura", "hey aura"];

export function useVoice() {
  const { session, voice, config, setVoiceState, addMessage, setLoading } = useChatStore();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // ── Reproduzir áudio TTS ─────────────────────────────────────────────────
  const speak = useCallback((audioBase64: string) => {
    if (!config.autoSpeak) return;
    try {
      const binary = atob(audioBase64);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(url);
      audioRef.current = audio;
      setVoiceState({ isSpeaking: true });

      audio.play();
      audio.onended = () => {
        setVoiceState({ isSpeaking: false });
        URL.revokeObjectURL(url);
      };
    } catch (e) {
      setVoiceState({ isSpeaking: false });
    }
  }, [config.autoSpeak, setVoiceState]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setVoiceState({ isSpeaking: false });
  }, [setVoiceState]);

  // ── Iniciar gravação ────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (voice.isListening || voice.isProcessing) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        await processVoiceInput(audioBlob);
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      recorder.start(250); // chunk a cada 250ms
      setVoiceState({ isListening: true, error: null, transcript: "" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao acessar microfone";
      setVoiceState({ error: msg });
      toast.error("Não foi possível acessar o microfone. Verifique as permissões.");
    }
  }, [voice.isListening, voice.isProcessing]);

  // ── Parar gravação ──────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setVoiceState({ isListening: false });
  }, [setVoiceState]);

  // ── Processar voz ────────────────────────────────────────────────────────
  const processVoiceInput = useCallback(
    async (audioBlob: Blob) => {
      setVoiceState({ isProcessing: true });
      setLoading(true);

      try {
        const result = await processVoice(audioBlob, session.sessionId);

        // Adicionar mensagem do usuário (transcrito)
        addMessage({ role: "user", content: result.transcript });

        // Adicionar resposta da AURA
        addMessage({
          role: "assistant",
          content: result.response,
          intent: result.intent,
        });

        setVoiceState({ transcript: result.transcript });

        // Reproduzir áudio da resposta
        if (result.audio_base64) {
          speak(result.audio_base64);
        }
      } catch (e) {
        toast.error("Não consegui processar o áudio. Tente novamente.");
        setVoiceState({ error: "Erro ao processar voz" });
      } finally {
        setVoiceState({ isProcessing: false });
        setLoading(false);
      }
    },
    [session.sessionId, addMessage, speak, setVoiceState, setLoading]
  );

  // ── Wake Word via Web Speech API ─────────────────────────────────────────
  useEffect(() => {
    if (!config.wakeWordEnabled || typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "pt-BR";
    recognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ")
        .toLowerCase();

      const detected = WAKE_WORDS.some((w) => transcript.includes(w));
      if (detected && !voice.isListening && !voice.isProcessing) {
        setVoiceState({ wakeWordDetected: true });
        setTimeout(() => startRecording(), 300);
        setTimeout(() => setVoiceState({ wakeWordDetected: false }), 2000);
      }
    };

    recognition.start();
    return () => recognition.stop();
  }, [config.wakeWordEnabled]);

  return {
    isListening: voice.isListening,
    isProcessing: voice.isProcessing,
    isSpeaking: voice.isSpeaking,
    wakeWordDetected: voice.wakeWordDetected,
    transcript: voice.transcript,
    error: voice.error,
    startRecording,
    stopRecording,
    speak,
    stopSpeaking,
  };
}
