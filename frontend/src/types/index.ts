export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
  confidence?: number;
  timestamp: Date;
  audioUrl?: string;
  isStreaming?: boolean;
}

export interface ChatSession {
  sessionId: string;
  messages: Message[];
  isAuthenticated: boolean;
  studentName?: string;
  studentRA?: string;
  studentCourse?: string;
}

export interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  wakeWordDetected: boolean;
  transcript: string;
  error: string | null;
}

export interface ChatAPIResponse {
  session_id: string;
  message: string;
  intent: string;
  confidence: number;
  processing_ms: number;
  authenticated: boolean;
}

export interface VoiceProcessResponse {
  session_id: string;
  transcript: string;
  query: string;
  response: string;
  intent: string;
  processing_ms: number;
  audio_base64: string | null;
  audio_format: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  event_date: string;
  end_date?: string;
  category: string;
  semester?: string;
}

export interface AuraConfig {
  voiceEnabled: boolean;
  autoSpeak: boolean;
  wakeWordEnabled: boolean;
  language: string;
  theme: "dark" | "light";
}
