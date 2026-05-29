"use client";
import { motion } from "framer-motion";
import { Settings, RotateCcw, Wifi, WifiOff, GraduationCap } from "lucide-react";
import { AuraAvatar } from "@/components/chat/AuraAvatar";
import { useChatStore } from "@/store/chat";
import { cn } from "@/lib/utils";

interface HeaderProps {
  isConnected?: boolean;
  isSpeaking?: boolean;
  isListening?: boolean;
}

export function Header({ isConnected = true, isSpeaking, isListening }: HeaderProps) {
  const { session, clearMessages, toggleSidebar } = useChatStore();

  return (
    <header className="glass-dark border-b border-white/5 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Logo + Avatar */}
        <div className="flex items-center gap-3">
          <AuraAvatar
            size="sm"
            isActive={isConnected}
            isSpeaking={isSpeaking}
            isListening={isListening}
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-lg gradient-text">AURA</h1>
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-emerald-400 animate-pulse-slow" : "bg-red-400"
                )}
              />
            </div>
            <p className="text-[11px] text-gray-500 leading-none">
              Assistente Universitária · FATEC Zona Sul
            </p>
          </div>
        </div>

        {/* Student info */}
        {session.isAuthenticated && session.studentName && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-aura-950/60 border border-aura-800/30"
          >
            <GraduationCap size={14} className="text-aura-400" />
            <span className="text-xs text-gray-300">
              {session.studentName.split(" ")[0]} — RA {session.studentRA}
            </span>
          </motion.div>
        )}

        {/* Ações */}
        <div className="flex items-center gap-2">
          {/* Status de conexão */}
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
            {isConnected ? (
              <Wifi size={13} className="text-emerald-400" />
            ) : (
              <WifiOff size={13} className="text-red-400" />
            )}
            <span className="hidden sm:inline">
              {isConnected ? "Online" : "Offline"}
            </span>
          </div>

          {/* Limpar conversa */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearMessages}
            title="Nova conversa"
            className="p-2 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
          >
            <RotateCcw size={16} />
          </motion.button>

          {/* Configurações */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleSidebar}
            title="Configurações"
            className="p-2 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
          >
            <Settings size={16} />
          </motion.button>
        </div>
      </div>
    </header>
  );
}
