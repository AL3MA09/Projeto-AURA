"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "@/store/chat";
import { MessageBubble, TypingIndicator } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { AuraAvatar } from "./AuraAvatar";
import { Header } from "@/components/layout/Header";
import { SettingsSidebar } from "@/components/layout/SettingsSidebar";
import { useVoice } from "@/hooks/useVoice";
import { sendMessage, streamMessage } from "@/lib/api";
import toast from "react-hot-toast";
import { Sparkles } from "lucide-react";

const WELCOME_MESSAGE = `Olá! Sou a **AURA**, assistente virtual da secretaria acadêmica da FATEC Zona Sul. 🎓

Posso ajudar você com:
- Calendário acadêmico e datas de prova
- Solicitação de documentos (declaração, histórico)
- Trancamento e transferência de matrícula
- Informações sobre estágio obrigatório
- Dados sobre disciplinas e professores

Como posso ajudar você hoje?`;

export function ChatWindow() {
  const { session, config, isLoading, addMessage, setLoading, updateLastMessage } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voice = useVoice();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [session.messages]);

  // Mensagem de boas-vindas
  useEffect(() => {
    if (session.messages.length === 0) {
      addMessage({ role: "assistant", content: WELCOME_MESSAGE });
    }
  }, []);

  const handleSend = async (message: string) => {
    if (isLoading) return;
    addMessage({ role: "user", content: message });
    setLoading(true);

    // Adiciona bubble de streaming vazia
    addMessage({ role: "assistant", content: "", isStreaming: true });

    let fullResponse = "";
    try {
      await streamMessage(
        message,
        session.sessionId,
        (chunk) => {
          fullResponse += chunk;
          updateLastMessage(fullResponse);
        },
        async () => {
          updateLastMessage(fullResponse);
          setLoading(false);
          // TTS para a resposta
          if (config.autoSpeak && config.voiceEnabled && fullResponse) {
            try {
              const { synthesizeSpeech } = await import("@/lib/api");
              const blob = await synthesizeSpeech(fullResponse);
              const url = URL.createObjectURL(blob);
              const audio = new Audio(url);
              audio.play();
              audio.onended = () => URL.revokeObjectURL(url);
            } catch {}
          }
        }
      );
    } catch (error) {
      // Fallback para API sem streaming
      try {
        const { sendMessage: send } = await import("@/lib/api");
        const result = await send(message, session.sessionId);
        updateLastMessage(result.message);
      } catch {
        updateLastMessage("Desculpe, não consegui processar sua mensagem. Tente novamente.");
        toast.error("Erro de conexão com a AURA.");
      } finally {
        setLoading(false);
      }
    }
  };

  const isEmpty = session.messages.length === 0;

  return (
    <div className="flex flex-col h-screen bg-gray-950 particles-bg">
      <Header
        isConnected={!isLoading || true}
        isSpeaking={voice.isSpeaking}
        isListening={voice.isListening}
      />
      <SettingsSidebar />

      {/* Messages area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-6 space-y-4">
          <AnimatePresence>
            {session.messages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isLast={i === session.messages.length - 1}
              />
            ))}
            {isLoading && session.messages[session.messages.length - 1]?.role !== "assistant" && (
              <TypingIndicator key="typing" />
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Estado vazio — Hero central */}
        {isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full gap-6 py-20"
          >
            <AuraAvatar size="xl" isActive />
            <div className="text-center space-y-2">
              <h2 className="font-display font-bold text-3xl gradient-text">Olá! Sou a AURA</h2>
              <p className="text-gray-400 text-sm max-w-sm">
                Sua assistente universitária inteligente da FATEC Zona Sul.
                Pergunte qualquer coisa sobre sua vida acadêmica.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-aura-400/60">
              <Sparkles size={12} />
              <span>Powered by GPT-4o + RAG</span>
            </div>
          </motion.div>
        )}
      </main>

      {/* Input */}
      <div className="glass-dark border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            onSend={handleSend}
            isLoading={isLoading}
            isListening={voice.isListening}
            isProcessing={voice.isProcessing}
            isSpeaking={voice.isSpeaking}
            transcript={voice.transcript}
            voiceEnabled={config.voiceEnabled}
            onStartRecording={voice.startRecording}
            onStopRecording={voice.stopRecording}
            onStopSpeaking={voice.stopSpeaking}
          />
        </div>
      </div>
    </div>
  );
}
