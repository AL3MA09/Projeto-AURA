"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, Volume2, Zap, Shield, Info } from "lucide-react";
import { useChatStore } from "@/store/chat";
import { cn } from "@/lib/utils";

export function SettingsSidebar() {
  const { isSidebarOpen, config, toggleSidebar, toggleAutoSpeak, toggleVoiceEnabled, toggleWakeWord } = useChatStore();

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Sidebar */}
          <motion.aside
            key="sidebar"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-80 glass-dark border-l border-white/5 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h2 className="font-display font-semibold text-white">Configurações</h2>
              <button onClick={toggleSidebar} className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all">
                <X size={18} />
              </button>
            </div>

            {/* Settings */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Voz */}
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Voz</h3>
                <div className="space-y-3">
                  <ToggleSetting
                    icon={<Mic size={16} />}
                    label="Entrada por voz"
                    description="Gravar mensagens usando o microfone"
                    checked={config.voiceEnabled}
                    onChange={toggleVoiceEnabled}
                  />
                  <ToggleSetting
                    icon={<Volume2 size={16} />}
                    label="Resposta em áudio"
                    description="AURA fala as respostas automaticamente"
                    checked={config.autoSpeak}
                    onChange={toggleAutoSpeak}
                  />
                  <ToggleSetting
                    icon={<Zap size={16} />}
                    label="Wake Word 'AURA'"
                    description="Ativar escuta contínua por palavra-chave"
                    checked={config.wakeWordEnabled}
                    onChange={toggleWakeWord}
                  />
                </div>
              </section>

              {/* Privacidade */}
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Privacidade</h3>
                <div className="glass rounded-xl p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <Shield size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-400">
                      Suas conversas são protegidas por criptografia e tratadas conforme a LGPD.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-400">
                      Apenas os 3 primeiros dígitos do CPF são solicitados para validação. Nunca o CPF completo.
                    </p>
                  </div>
                </div>
              </section>

              {/* Sobre */}
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Sobre</h3>
                <div className="glass rounded-xl p-3 space-y-1">
                  <p className="text-xs text-gray-300 font-medium">AURA v1.0.0</p>
                  <p className="text-xs text-gray-500">Assistente Universitária de Respostas Acadêmicas</p>
                  <p className="text-xs text-gray-500">FATEC Zona Sul — São Paulo, SP</p>
                  <p className="text-xs text-aura-400 mt-2">secretaria@fateczonasul.edu.br</p>
                  <p className="text-xs text-aura-400">(11) 5686-6164</p>
                </div>
              </section>

              {/* TTS Info */}
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tecnologia de Voz</h3>
                <div className="glass rounded-xl p-3 space-y-2">
                  <InfoRow label="STT" value="OpenAI Whisper" />
                  <InfoRow label="TTS" value="ElevenLabs Multilingual v2" />
                  <InfoRow label="IA" value="GPT-4o + Claude (fallback)" />
                  <InfoRow label="Wake Word" value="Web Speech API" />
                </div>
              </section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function ToggleSetting({ icon, label, description, checked, onChange }: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 glass rounded-xl">
      <div className="flex items-start gap-3">
        <span className="text-aura-400 mt-0.5">{icon}</span>
        <div>
          <p className="text-sm text-white font-medium">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <button
        onClick={onChange}
        className={cn(
          "relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0",
          checked ? "bg-aura-600" : "bg-gray-700"
        )}
      >
        <motion.div
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
          animate={{ x: checked ? 22 : 4 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      </button>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs text-gray-300">{value}</span>
    </div>
  );
}
