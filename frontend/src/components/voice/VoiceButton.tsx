"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Loader2, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SoundWave } from "./SoundWave";

interface VoiceButtonProps {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onStopSpeaking: () => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceButton({
  isListening,
  isProcessing,
  isSpeaking,
  onStartRecording,
  onStopRecording,
  onStopSpeaking,
  disabled,
  className,
}: VoiceButtonProps) {
  const handleClick = () => {
    if (isSpeaking) { onStopSpeaking(); return; }
    if (isListening) { onStopRecording(); return; }
    if (!isProcessing) onStartRecording();
  };

  const label = isSpeaking
    ? "Clique para parar a fala"
    : isListening
    ? "Clique para parar a gravação"
    : isProcessing
    ? "Processando..."
    : "Clique para falar com a AURA";

  const bgClass = isListening
    ? "bg-red-500 hover:bg-red-600 shadow-red-500/40"
    : isSpeaking
    ? "bg-aurora-purple hover:bg-purple-700 shadow-purple-500/40"
    : isProcessing
    ? "bg-aura-600 shadow-aura-500/40"
    : "bg-aura-600 hover:bg-aura-700 shadow-aura-500/40";

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || isProcessing}
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.92 }}
      className={cn(
        "relative flex items-center justify-center rounded-full transition-all duration-200",
        "shadow-lg focus:outline-none focus:ring-2 focus:ring-aura-400 focus:ring-offset-2 focus:ring-offset-gray-950",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        bgClass,
        className
      )}
    >
      {/* Anel pulsante quando gravando */}
      <AnimatePresence>
        {isListening && (
          <motion.span
            key="ring"
            className="absolute inset-0 rounded-full border-2 border-red-400"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 1.6, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      {/* Ícone central */}
      <AnimatePresence mode="wait">
        {isProcessing ? (
          <motion.div key="loading" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
            <Loader2 className="animate-spin text-white" size={22} />
          </motion.div>
        ) : isSpeaking ? (
          <motion.div key="speaking" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
            <SoundWave isActive bars={4} variant="speaking" className="scale-75" />
          </motion.div>
        ) : isListening ? (
          <motion.div key="listening" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
            <SoundWave isActive bars={4} variant="listening" className="scale-75" />
          </motion.div>
        ) : (
          <motion.div key="idle" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
            <Mic className="text-white" size={22} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
