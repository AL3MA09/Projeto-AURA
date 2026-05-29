import axios from "axios";
import type { ChatAPIResponse, VoiceProcessResponse, CalendarEvent } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Interceptor para token JWT
api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("aura_token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Chat ──────────────────────────────────────────────────────────────────────
export const sendMessage = async (
  message: string,
  sessionId?: string
): Promise<ChatAPIResponse> => {
  const { data } = await api.post<ChatAPIResponse>("/chat/message", {
    message,
    session_id: sessionId,
  });
  return data;
};

export const newSession = async (): Promise<{ session_id: string }> => {
  const { data } = await api.post("/chat/new-session");
  return data;
};

export const clearSession = async (sessionId: string): Promise<void> => {
  await api.delete(`/chat/session/${sessionId}`);
};

// ── Voice ─────────────────────────────────────────────────────────────────────
export const processVoice = async (
  audioBlob: Blob,
  sessionId: string
): Promise<VoiceProcessResponse> => {
  const formData = new FormData();
  formData.append("audio", audioBlob, "audio.webm");
  formData.append("session_id", sessionId);
  formData.append("synthesize_response", "true");

  const { data } = await api.post<VoiceProcessResponse>("/voice/process", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000,
  });
  return data;
};

export const synthesizeSpeech = async (text: string): Promise<Blob> => {
  const formData = new FormData();
  formData.append("text", text);

  const response = await api.post("/voice/synthesize", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    responseType: "blob",
  });
  return response.data;
};

export const transcribeAudio = async (audioBlob: Blob): Promise<{ transcript: string }> => {
  const formData = new FormData();
  formData.append("audio", audioBlob, "audio.webm");
  formData.append("detect_wake", "true");

  const { data } = await api.post("/voice/transcribe", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

// ── Academic ──────────────────────────────────────────────────────────────────
export const getCalendar = async (semester?: string): Promise<CalendarEvent[]> => {
  const { data } = await api.get<CalendarEvent[]>("/academic/calendar", {
    params: semester ? { semester } : {},
  });
  return data;
};

export const getNextExam = async () => {
  const { data } = await api.get("/academic/calendar/next-exam");
  return data;
};

// ── Streaming Chat ─────────────────────────────────────────────────────────────
export const streamMessage = async (
  message: string,
  sessionId: string,
  onChunk: (chunk: string) => void,
  onDone: () => void
): Promise<void> => {
  const response = await fetch(`${BASE_URL}/api/v1/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId, stream: true }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) return;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value);
    const lines = text.split("\n").filter((l) => l.startsWith("data: "));
    for (const line of lines) {
      const raw = line.replace("data: ", "");
      if (raw === "[DONE]") {
        onDone();
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        if (parsed.chunk) onChunk(parsed.chunk);
      } catch {}
    }
  }
  onDone();
};

export default api;
