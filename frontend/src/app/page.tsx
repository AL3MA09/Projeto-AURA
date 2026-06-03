"use client";
import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Mic, Square } from "lucide-react";
import { sendMessage } from "@/lib/api";
import { v4 as uuidv4 } from "uuid";

type VoiceState = "idle" | "listening" | "thinking" | "speaking";

const ORB_CONFIG = {
  idle:      { from: "#3c42d0", to: "#4a52e8", glow: "rgba(97,113,243,0.25)",  btn: "linear-gradient(135deg,#6171f3,#4a52e8)" },
  listening: { from: "#0891b2", to: "#06b6d4", glow: "rgba(6,182,212,0.35)",   btn: "linear-gradient(135deg,#06b6d4,#0891b2)" },
  thinking:  { from: "#6d28d9", to: "#7c3aed", glow: "rgba(124,58,237,0.35)",  btn: "linear-gradient(135deg,#7c3aed,#6d28d9)" },
  speaking:  { from: "#4a52e8", to: "#6171f3", glow: "rgba(97,113,243,0.45)",  btn: "linear-gradient(135deg,#ef4444,#dc2626)" },
};

const STATUS = {
  idle:      "Toque para falar",
  listening: "Ouvindo...",
  thinking:  "Pensando...",
  speaking:  "",
};

export default function Home() {
  const [state, setState]       = useState<VoiceState>("idle");
  const [subtitle, setSubtitle] = useState("");
  const [sessionId]             = useState(() => uuidv4());
  const transcriptRef           = useRef("");
  const recognitionRef          = useRef<SpeechRecognition | null>(null);

  const speak = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    setState("speaking");
    setSubtitle(text);

    const utter  = new SpeechSynthesisUtterance(text);
    utter.lang   = "pt-BR";
    utter.rate   = 1.0;
    utter.pitch  = 1.05;

    const ptVoice = window.speechSynthesis.getVoices().find(v => v.lang.startsWith("pt"));
    if (ptVoice) utter.voice = ptVoice;

    utter.onend = () => { setState("idle"); setSubtitle(""); };
    window.speechSynthesis.speak(utter);
  }, []);

  const handlePress = useCallback(async () => {
    if (state === "speaking") {
      window.speechSynthesis.cancel();
      setState("idle");
      setSubtitle("");
      return;
    }

    if (state === "listening") {
      recognitionRef.current?.stop();
      return;
    }

    if (state !== "idle") return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Use o Google Chrome para reconhecimento de voz.");
      return;
    }

    transcriptRef.current = "";
    setState("listening");
    setSubtitle("");

    const rec: SpeechRecognition = new SpeechRec();
    rec.lang             = "pt-BR";
    rec.continuous       = false;
    rec.interimResults   = true;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      transcriptRef.current = Array.from(e.results)
        .map(r => r[0].transcript)
        .join("");
      setSubtitle(transcriptRef.current);
    };

    rec.onend = async () => {
      const text = transcriptRef.current.trim();
      if (!text) { setState("idle"); setSubtitle(""); return; }

      setState("thinking");
      setSubtitle("");
      try {
        const res = await sendMessage(text, sessionId);
        speak(res.message);
      } catch {
        setState("idle");
        setSubtitle("");
      }
    };

    rec.onerror = (e: Event) => {
      const err = (e as any).error;
      if (err === "not-allowed" || err === "permission-denied") {
        setSubtitle("Permissão do microfone negada. Clique no cadeado na barra do Chrome e permita o microfone.");
      } else if (err === "no-speech") {
        setSubtitle("Nenhuma fala detectada. Tente novamente.");
      } else {
        setSubtitle("Erro ao acessar microfone: " + err);
      }
      setState("idle");
    };
    recognitionRef.current = rec;
    rec.start();
  }, [state, sessionId, speak]);

  const cfg = ORB_CONFIG[state];

  return (
    <div className="flex flex-col items-center justify-between h-screen bg-gray-950 select-none overflow-hidden">

      {/* Header */}
      <div className="pt-14 text-center">
        <h1 className="text-2xl font-display font-bold text-white tracking-wide">AURA</h1>
        <p className="text-gray-500 text-xs mt-1">Assistente Universitária · FATEC Zona Sul</p>
      </div>

      {/* Orb area */}
      <div className="flex flex-col items-center gap-10">

        {/* Orb */}
        <div className="relative flex items-center justify-center w-56 h-56">

          {/* Pulse rings */}
          {(state === "listening" || state === "speaking") && [0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{ border: `1px solid ${cfg.from}60` }}
              initial={{ width: 176, height: 176, opacity: 0.7 }}
              animate={{ width: 280 + i * 50, height: 280 + i * 50, opacity: 0 }}
              transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.55, ease: "easeOut" }}
            />
          ))}

          {/* Main orb */}
          <motion.div
            className="w-44 h-44 rounded-full relative overflow-hidden cursor-pointer"
            style={{
              background: `radial-gradient(circle at 38% 32%, ${cfg.from}, ${cfg.to} 80%)`,
              boxShadow: `0 0 70px ${cfg.glow}, 0 0 140px ${cfg.glow}`,
            }}
            animate={
              state === "thinking"
                ? { scale: [1, 1.06, 1], rotate: [0, 360] }
                : state === "speaking"
                ? { scale: [1, 1.09, 1, 1.06, 1] }
                : state === "listening"
                ? { scale: [1, 1.07, 1] }
                : { scale: [1, 1.025, 1] }
            }
            transition={
              state === "thinking"
                ? { scale: { duration: 1.2, repeat: Infinity }, rotate: { duration: 3, repeat: Infinity, ease: "linear" } }
                : { duration: state === "idle" ? 3.5 : 0.7, repeat: Infinity, ease: "easeInOut" }
            }
            onClick={handlePress}
          >
            {/* Shine */}
            <div className="absolute top-7 left-9 w-10 h-10 bg-white/25 rounded-full blur-lg" />
            <div className="absolute top-4 left-6 w-5 h-5 bg-white/15 rounded-full blur-sm" />

            {/* Letter */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white/90 font-display font-bold text-3xl">A</span>
            </div>
          </motion.div>
        </div>

        {/* Status + subtitle */}
        <div className="flex flex-col items-center gap-2 min-h-[60px] px-8 text-center">
          <motion.p
            key={state}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white/70 text-sm font-medium"
          >
            {STATUS[state]}
          </motion.p>
          {subtitle && (
            <motion.p
              key={subtitle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-400 text-sm max-w-xs leading-snug"
            >
              {subtitle.length > 120 ? subtitle.slice(0, 120) + "…" : subtitle}
            </motion.p>
          )}
        </div>
      </div>

      {/* Mic button */}
      <div className="pb-16 flex flex-col items-center gap-3">
        <motion.button
          onClick={handlePress}
          className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl"
          style={{ background: cfg.btn }}
          whileTap={{ scale: 0.88 }}
          whileHover={{ scale: 1.08 }}
          disabled={state === "thinking"}
        >
          {state === "idle" || state === "thinking"
            ? <Mic size={26} color="white" />
            : <Square size={22} color="white" fill="white" />
          }
        </motion.button>
        <p className="text-gray-600 text-xs">
          {state === "idle"      && "Toque para falar"}
          {state === "listening" && "Toque para parar"}
          {state === "thinking"  && "Aguarde..."}
          {state === "speaking"  && "Toque para interromper"}
        </p>
      </div>

    </div>
  );
}
