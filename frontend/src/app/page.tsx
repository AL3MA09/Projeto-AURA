"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Wifi } from "lucide-react";
import { sendMessage } from "@/lib/api";
import { v4 as uuidv4 } from "uuid";

type VoiceState = "idle" | "listening" | "thinking" | "speaking";

// Predefined bar heights for the equalizer
const BAR_HEIGHTS_ACTIVE = [
  14, 28, 42, 56, 70, 52, 38, 60, 44, 72,
  58, 36, 66, 48, 30, 62, 46, 34, 54, 26,
];
const BAR_HEIGHTS_IDLE = [
  6, 8, 6, 8, 6, 8, 6, 8, 6, 8,
  6, 8, 6, 8, 6, 8, 6, 8, 6, 8,
];

const STATUS_LABEL: Record<VoiceState, string> = {
  idle:      "TOQUE PARA FALAR",
  listening: "OUVINDO...",
  thinking:  "PROCESSANDO...",
  speaking:  "RESPONDENDO",
};

const ORB_CLASS: Record<VoiceState, string> = {
  idle:      "orb-idle",
  listening: "orb-listening",
  thinking:  "orb-thinking",
  speaking:  "orb-speaking",
};

export default function Home() {
  const [state, setState]       = useState<VoiceState>("idle");
  const [subtitle, setSubtitle] = useState("");
  const [sessionId]             = useState(() => uuidv4());
  const [barHeights, setBarHeights] = useState(BAR_HEIGHTS_IDLE);
  const transcriptRef           = useRef("");
  const recognitionRef          = useRef<SpeechRecognition | null>(null);
  const barIntervalRef          = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animate bars based on state
  useEffect(() => {
    if (barIntervalRef.current) clearInterval(barIntervalRef.current);

    if (state === "listening" || state === "speaking") {
      barIntervalRef.current = setInterval(() => {
        setBarHeights(BAR_HEIGHTS_ACTIVE.map(h =>
          Math.max(6, h + (Math.random() - 0.5) * 30)
        ));
      }, 120);
    } else if (state === "thinking") {
      barIntervalRef.current = setInterval(() => {
        setBarHeights(prev => prev.map((_, i) => {
          const wave = Math.sin(Date.now() / 200 + i * 0.5) * 20 + 24;
          return Math.max(6, wave);
        }));
      }, 60);
    } else {
      setBarHeights(BAR_HEIGHTS_IDLE);
    }

    return () => { if (barIntervalRef.current) clearInterval(barIntervalRef.current); };
  }, [state]);

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
      setSubtitle("Use o Google Chrome para reconhecimento de voz.");
      return;
    }

    transcriptRef.current = "";
    setState("listening");
    setSubtitle("");

    const rec: SpeechRecognition = new SpeechRec();
    rec.lang           = "pt-BR";
    rec.continuous     = false;
    rec.interimResults = true;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      transcriptRef.current = Array.from(e.results)
        .map(r => r[0].transcript).join("");
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
        setSubtitle("Erro de conexão. Tente novamente.");
      }
    };

    rec.onerror = (e: Event) => {
      const err = (e as any).error;
      if (err === "not-allowed") {
        setSubtitle("Permissão negada. Clique no cadeado e permita o microfone.");
      } else if (err === "no-speech") {
        setSubtitle("Nenhuma fala detectada.");
      } else {
        setSubtitle("Erro: " + err);
      }
      setState("idle");
    };

    recognitionRef.current = rec;
    rec.start();
  }, [state, sessionId, speak]);

  const isActive = state === "listening" || state === "speaking";

  return (
    <div
      className="relative flex flex-col items-center justify-between h-screen overflow-hidden bg-grid"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(192,0,0,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Corner decorations */}
      <div className="absolute top-6 left-6 w-8 h-8 corner-tl" />
      <div className="absolute top-6 right-6 w-8 h-8 corner-tr" />
      <div className="absolute bottom-6 left-6 w-8 h-8 corner-bl" />
      <div className="absolute bottom-6 right-6 w-8 h-8 corner-br" />

      {/* Header */}
      <div className="relative z-10 pt-12 flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#C00000", boxShadow: "0 0 8px #C00000" }} />
          <h1
            className="text-3xl font-bold tracking-[0.3em] text-white"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            AURA
          </h1>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#C00000", boxShadow: "0 0 8px #C00000" }} />
        </div>
        <p className="text-xs tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>
          Assistente Universitária · FATEC Zona Sul
        </p>
        {/* Status indicator */}
        <div className="flex items-center gap-2 mt-1">
          <motion.div
            style={{ width: 5, height: 5, borderRadius: "50%", background: "#C00000" }}
            animate={{ opacity: [1, 0.3, 1], boxShadow: ["0 0 4px #C00000", "0 0 12px #C00000", "0 0 4px #C00000"] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-xs tracking-widest" style={{ color: "rgba(192,0,0,0.7)" }}>ONLINE</span>
        </div>
      </div>

      {/* Main orb + visualizer */}
      <div className="relative z-10 flex flex-col items-center gap-8">

        {/* Orb */}
        <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>

          {/* Outer pulse rings */}
          <AnimatePresence>
            {isActive && [0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  width: 220, height: 220,
                  borderRadius: "50%",
                  border: "1px solid rgba(192,0,0,0.3)",
                }}
                initial={{ width: 220, height: 220, opacity: 0.6 }}
                animate={{ width: 340 + i * 60, height: 340 + i * 60, opacity: 0 }}
                transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
              />
            ))}
          </AnimatePresence>

          {/* Orbit ring for thinking */}
          {state === "thinking" && (
            <motion.div
              className="absolute"
              style={{
                width: 240, height: 240,
                borderRadius: "50%",
                border: "1px dashed rgba(192,0,0,0.4)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          )}

          {/* Main orb */}
          <motion.div
            className={`relative flex items-center justify-center cursor-pointer ${ORB_CLASS[state]}`}
            style={{ width: 200, height: 200, borderRadius: "50%" }}
            animate={
              state === "thinking"
                ? { scale: [1, 1.04, 1] }
                : state === "speaking"
                ? { scale: [1, 1.07, 1, 1.05, 1] }
                : state === "listening"
                ? { scale: [1, 1.06, 1] }
                : { scale: [1, 1.015, 1] }
            }
            transition={{
              duration: state === "idle" ? 4 : state === "thinking" ? 1.5 : 0.6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            onClick={handlePress}
          >
            {/* Inner shine */}
            <div style={{
              position: "absolute", top: 28, left: 36,
              width: 44, height: 44,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              filter: "blur(12px)",
            }} />
            {/* Inner ring */}
            <div style={{
              position: "absolute",
              width: 150, height: 150,
              borderRadius: "50%",
              border: "1px solid rgba(192,0,0,0.2)",
            }} />

            {/* Letter A */}
            <span
              className="relative z-10 text-white font-bold"
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 42,
                textShadow: "0 0 20px rgba(192,0,0,0.8), 0 0 40px rgba(192,0,0,0.4)",
                letterSpacing: 2,
              }}
            >
              A
            </span>

            {/* Bottom red line inside orb */}
            <div style={{
              position: "absolute", bottom: 36, left: "50%",
              transform: "translateX(-50%)",
              width: 40, height: 1,
              background: "linear-gradient(90deg, transparent, #C00000, transparent)",
            }} />
          </motion.div>
        </div>

        {/* Equalizer bars */}
        <div className="flex items-end justify-center gap-[3px]" style={{ height: 80 }}>
          {barHeights.map((h, i) => (
            <motion.div
              key={i}
              className="eq-bar"
              animate={{ height: h }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
            />
          ))}
        </div>

        {/* Status + subtitle */}
        <div className="flex flex-col items-center gap-3 min-h-[64px] px-8 text-center">
          <motion.p
            key={state}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-semibold tracking-[0.25em]"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              color: state === "idle" ? "rgba(255,255,255,0.3)" : "#C00000",
            }}
          >
            {STATUS_LABEL[state]}
          </motion.p>

          <AnimatePresence mode="wait">
            {subtitle && (
              <motion.p
                key={subtitle.slice(0, 20)}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm max-w-xs leading-relaxed"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                {subtitle.length > 100 ? subtitle.slice(0, 100) + "…" : subtitle}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mic button */}
      <div className="relative z-10 pb-14 flex flex-col items-center gap-3">
        {/* Decorative line */}
        <div style={{
          width: 60, height: 1,
          background: "linear-gradient(90deg, transparent, rgba(192,0,0,0.4), transparent)",
          marginBottom: 8,
        }} />

        <motion.button
          onClick={handlePress}
          disabled={state === "thinking"}
          className="relative flex items-center justify-center"
          style={{
            width: 64, height: 64,
            borderRadius: "50%",
            background: state === "thinking"
              ? "rgba(192,0,0,0.2)"
              : "rgba(192,0,0,0.15)",
            border: `1px solid ${state === "idle" ? "rgba(192,0,0,0.4)" : "#C00000"}`,
            boxShadow: state !== "idle" && state !== "thinking"
              ? "0 0 20px rgba(192,0,0,0.5), 0 0 40px rgba(192,0,0,0.2)"
              : "0 0 10px rgba(192,0,0,0.2)",
            cursor: state === "thinking" ? "default" : "pointer",
          }}
          whileTap={state !== "thinking" ? { scale: 0.9 } : {}}
          whileHover={state !== "thinking" ? { scale: 1.08 } : {}}
        >
          {/* Button glow ring */}
          {isActive && (
            <motion.div
              className="absolute inset-0"
              style={{ borderRadius: "50%", border: "1px solid rgba(192,0,0,0.6)" }}
              animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          )}

          {state === "idle" || state === "thinking"
            ? <Mic size={24} color={state === "thinking" ? "rgba(192,0,0,0.4)" : "#C00000"} />
            : <Square size={20} color="#C00000" fill="#C00000" />
          }
        </motion.button>

        <p
          className="text-xs tracking-widest uppercase"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          {state === "idle"      && "Pressione para falar"}
          {state === "listening" && "Pressione para parar"}
          {state === "thinking"  && "Aguarde..."}
          {state === "speaking"  && "Pressione para interromper"}
        </p>
      </div>

    </div>
  );
}
