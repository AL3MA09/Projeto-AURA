"use client";
import { useState, useRef, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, Loader2, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { VoiceButton } from "@/components/voice/VoiceButton";
import { SoundWave } from "@/components/voice/SoundWave";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  transcript: string;
  voiceEnabled: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onStopSpeaking: () => void;
}

const QUICK_REPLIES = [
  "Quando são as próximas provas?",
  "Quero uma declaração de matrícula",
  "Como funciona o estágio obrigatório?",
  "Quero trancar minha matrícula",
];

export function ChatInput({
  onSend,
  isLoading,
  isListening,
  isProcessing,
  isSpeaking,
  transcript,
  voiceEnabled,
  onStartRecording,
  onStopRecording,
  onStopSpeaking,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const msg = value.trim();
    if (!msg || isLoading) return;
    onSend(msg);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
  };

  return (
    <div className="space-y-3">
      {/* Quick replies */}
      <div className="flex gap-2 flex-wrap px-4">
        {QUICK_REPLIES.map((q) => (
          <motion.button
            key={q}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSend(q)}
            disabled={isLoading}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border border-aura-800/50",
              "bg-aura-950/50 text-aura-300 hover:bg-aura-900/50 hover:border-aura-600",
              "transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            {q}
          </motion.button>
        ))}
      </div>

      {/* Input area */}
      <div className="px-4 pb-4">
        <div className={cn(
          "flex items-end gap-3 glass rounded-2xl px-4 py-3 transition-all duration-200",
          isListening && "border-red-500/50 shadow-red-500/10 shadow-lg",
        )}>
          {/* Indicador de gravação */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 text-red-400 text-sm"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <SoundWave isActive variant="listening" bars={4} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={isListening ? transcript || "Ouvindo..." : value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            disabled={isLoading || isListening}
            placeholder="Digite sua mensagem ou use o microfone..."
            rows={1}
            className={cn(
              "flex-1 bg-transparent text-white placeholder:text-gray-500 resize-none",
              "text-sm leading-relaxed focus:outline-none",
              "max-h-[150px] overflow-y-auto scrollbar-thin",
              (isLoading || isListening) && "opacity-60"
            )}
          />

          {/* Botões de ação */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Botão de voz */}
            {voiceEnabled && (
              <VoiceButton
                isListening={isListening}
                isProcessing={isProcessing}
                isSpeaking={isSpeaking}
                onStartRecording={onStartRecording}
                onStopRecording={onStopRecording}
                onStopSpeaking={onStopSpeaking}
                className="w-10 h-10"
              />
            )}

            {/* Botão de envio */}
            <motion.button
              onClick={handleSend}
              disabled={!value.trim() || isLoading}
              whileTap={{ scale: 0.92 }}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-aura-400 focus:ring-offset-2 focus:ring-offset-gray-950",
                value.trim() && !isLoading
                  ? "bg-aura-600 hover:bg-aura-500 shadow-lg shadow-aura-500/30"
                  : "bg-gray-800 opacity-50 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <Loader2 className="animate-spin text-white" size={18} />
              ) : (
                <Send className="text-white" size={18} />
              )}
            </motion.button>
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-600 mt-2">
          AURA pode cometer erros. Para atendimento urgente ligue{" "}
          <span className="text-aura-500">(11) 5686-6164</span>
        </p>
      </div>
    </div>
  );
}
