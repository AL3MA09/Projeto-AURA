import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { Message, ChatSession, VoiceState, AuraConfig } from "@/types";

interface ChatStore {
  session: ChatSession;
  voice: VoiceState;
  config: AuraConfig;
  isLoading: boolean;
  isSidebarOpen: boolean;

  // Chat actions
  initSession: () => void;
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  updateLastMessage: (content: string) => void;
  clearMessages: () => void;
  setLoading: (v: boolean) => void;
  setAuthenticated: (data: { name: string; ra: string; course: string }) => void;

  // Voice actions
  setVoiceState: (updates: Partial<VoiceState>) => void;
  resetVoiceState: () => void;

  // Config actions
  toggleAutoSpeak: () => void;
  toggleVoiceEnabled: () => void;
  toggleWakeWord: () => void;
  toggleSidebar: () => void;
}

const defaultVoice: VoiceState = {
  isListening: false,
  isProcessing: false,
  isSpeaking: false,
  wakeWordDetected: false,
  transcript: "",
  error: null,
};

const defaultConfig: AuraConfig = {
  voiceEnabled: true,
  autoSpeak: true,
  wakeWordEnabled: false,
  language: "pt-BR",
  theme: "dark",
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      session: {
        sessionId: uuidv4(),
        messages: [],
        isAuthenticated: false,
      },
      voice: defaultVoice,
      config: defaultConfig,
      isLoading: false,
      isSidebarOpen: false,

      initSession: () => {
        set({
          session: {
            sessionId: uuidv4(),
            messages: [],
            isAuthenticated: false,
          },
        });
      },

      addMessage: (message) => {
        const newMsg: Message = {
          ...message,
          id: uuidv4(),
          timestamp: new Date(),
        };
        set((state) => ({
          session: {
            ...state.session,
            messages: [...state.session.messages, newMsg],
          },
        }));
      },

      updateLastMessage: (content) => {
        set((state) => {
          const messages = [...state.session.messages];
          if (messages.length > 0) {
            messages[messages.length - 1] = {
              ...messages[messages.length - 1],
              content,
              isStreaming: false,
            };
          }
          return { session: { ...state.session, messages } };
        });
      },

      clearMessages: () => {
        set((state) => ({
          session: {
            ...state.session,
            sessionId: uuidv4(),
            messages: [],
            isAuthenticated: false,
          },
        }));
      },

      setLoading: (v) => set({ isLoading: v }),

      setAuthenticated: ({ name, ra, course }) => {
        set((state) => ({
          session: {
            ...state.session,
            isAuthenticated: true,
            studentName: name,
            studentRA: ra,
            studentCourse: course,
          },
        }));
      },

      setVoiceState: (updates) => {
        set((state) => ({ voice: { ...state.voice, ...updates } }));
      },

      resetVoiceState: () => set({ voice: defaultVoice }),

      toggleAutoSpeak: () => {
        set((state) => ({
          config: { ...state.config, autoSpeak: !state.config.autoSpeak },
        }));
      },

      toggleVoiceEnabled: () => {
        set((state) => ({
          config: { ...state.config, voiceEnabled: !state.config.voiceEnabled },
        }));
      },

      toggleWakeWord: () => {
        set((state) => ({
          config: { ...state.config, wakeWordEnabled: !state.config.wakeWordEnabled },
        }));
      },

      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    }),
    {
      name: "aura-store",
      partialize: (state) => ({ config: state.config }),
    }
  )
);
