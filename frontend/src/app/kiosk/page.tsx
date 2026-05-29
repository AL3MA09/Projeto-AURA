"use client";
/**
 * Modo Quiosque — tela cheia para terminais físicos na secretaria.
 * Otimizado para touchscreen sem teclado.
 */
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { AuraAvatar } from "@/components/chat/AuraAvatar";
import { SoundWave } from "@/components/voice/SoundWave";
import { useVoice } from "@/hooks/useVoice";
import { useChatStore } from "@/store/chat";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { Mic, MicOff } from "lucide-react";

const QUICK_ACTIONS = [
  { label: "📅 Calendário Acadêmico", query: "Quando são as próximas provas?" },
  { label: "📄 Declaração de Matrícula", query: "Preciso de uma declaração de matrícula" },
  { label: "🔒 Trancar Matrícula", query: "Quero trancar minha matrícula" },
  { label: "📋 Histórico Escolar", query: "Quero meu histórico escolar" },
  { label: "🎓 Sobre Estágio", query: "Como funciona o estágio obrigatório?" },
  { label: "👨‍🏫 Professores", query: "Informações sobre professores e disciplinas" },
];

export default function KioskPage() {
  const { session } = useChatStore();
  const voice = useVoice();
  const [isPressed, setIsPressed] = useState(false);

  const lastMessages = session.messages.slice(-3);

  return (
    <div className="flex flex-col h-screen bg-gray-950 select-none particles-bg">
      {/* Header grande para tela touchscreen */}
      <header className="glass-dark border-b border-white/5 py-6 px-8">
        <div className="flex items-center gap-5">
          <AuraAvatar
            size="lg"
            isActive
            isSpeaking={voice.isSpeaking}
            isListening={voice.isListening}
          />
          <div>
            <h1 className="font-display font-bold text-4xl gradient-text">AURA</h1>
            <p className="text-gray-400 text-lg">Assistente Universitária — FATEC Zona Sul</p>
            <p className="text-gray-600 text-sm">Toque no microfone ou escolha uma opção abaixo</p>
          </div>
        </div>
      </header>

      {/* Mensagens recentes */}
      <div className="flex-1 overflow-hidden px-8 py-6 space-y-4">
        <AnimatePresence>
          {lastMessages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </AnimatePresence>

        {/* Status de voz */}
        <AnimatePresence>
          {voice.isListening && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-4 justify-center py-4"
            >
              <SoundWave isActive bars={8} variant="listening" className="scale-150" />
              <p className="text-red-400 text-lg font-medium animate-pulse">Ouvindo...</p>
            </motion.div>
          )}
          {voice.isProcessing && (
            <motion.div className="text-center text-aura-400 text-lg animate-pulse">
              Processando...
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Botão de microfone central */}
      <div className="flex justify-center py-6">
        <motion.button
          onPointerDown={() => { setIsPressed(true); voice.startRecording(); }}
          onPointerUp={() => { setIsPressed(false); voice.stopRecording(); }}
          onPointerLeave={() => { if (isPressed) { setIsPressed(false); voice.stopRecording(); } }}
          className={`
            w-32 h-32 rounded-full flex flex-col items-center justify-center gap-2
            transition-all duration-200 shadow-2xl
            ${voice.isListening
              ? "bg-red-500 shadow-red-500/50 scale-110"
              : "bg-aura-600 hover:bg-aura-500 shadow-aura-500/30"}
          `}
          animate={{ scale: isPressed ? 1.1 : 1 }}
        >
          {voice.isListening
            ? <SoundWave isActive bars={4} variant="listening" />
            : <Mic size={40} className="text-white" />
          }
          <span className="text-white text-xs font-medium">
            {voice.isListening ? "Soltar para enviar" : "Toque e fale"}
          </span>
        </motion.button>
      </div>

      {/* Ações rápidas — grid para touchscreen */}
      <div className="px-8 pb-8 grid grid-cols-3 gap-3">
        {QUICK_ACTIONS.map((action) => (
          <motion.button
            key={action.label}
            whileTap={{ scale: 0.95 }}
            className="glass rounded-2xl p-4 text-left hover:bg-white/10 active:bg-white/15 transition-all"
          >
            <span className="text-sm text-gray-200 font-medium leading-snug">{action.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Footer */}
      <footer className="glass-dark border-t border-white/5 py-3 px-8 text-center">
        <p className="text-gray-600 text-sm">
          FATEC Zona Sul · Secretaria Acadêmica · (11) 5686-6164 · Seg a Sex, 8h–22h
        </p>
      </footer>
    </div>
  );
}
