"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, X } from "lucide-react";
import { sendMessage, synthesizeSpeech } from "@/lib/api";
import { v4 as uuidv4 } from "uuid";

type VoiceState = "idle" | "listening" | "thinking" | "speaking";

// Blob border-radius variants para morfose
const BLOB_SHAPES = [
  "60% 40% 30% 70% / 60% 30% 70% 40%",
  "30% 60% 70% 40% / 50% 60% 30% 60%",
  "50% 40% 60% 30% / 40% 60% 40% 70%",
  "40% 60% 40% 60% / 60% 40% 60% 40%",
  "60% 40% 30% 70% / 60% 30% 70% 40%",
];

// Alturas das pílulas para animação de fala
const PILL_DELAYS = [0, 0.15, 0.08, 0.22];
const PILL_DURATIONS = [0.5, 0.65, 0.45, 0.7];

export default function Home() {
  const [state, setState]       = useState<VoiceState>("idle");
  const [subtitle, setSubtitle] = useState("");
  const [sessionId]             = useState(() => uuidv4());
  const transcriptRef           = useRef("");
  const recognitionRef          = useRef<SpeechRecognition | null>(null);
  const stateRef                = useRef<VoiceState>("idle");
  const intentionalStopRef      = useRef(false);

  // Mantém stateRef sincronizado
  useEffect(() => { stateRef.current = state; }, [state]);

  const speak = useCallback(async (text: string) => {
    window.speechSynthesis.cancel();
    setState("speaking");
    setSubtitle(text);

    try {
      // Usa ElevenLabs via backend
      const blob = await synthesizeSpeech(text);
      const url  = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => { setState("idle"); setSubtitle(""); URL.revokeObjectURL(url); };
      audio.onerror = () => {
        // Fallback para browser TTS se ElevenLabs falhar
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang  = "pt-BR";
        utter.onend = () => { setState("idle"); setSubtitle(""); };
        window.speechSynthesis.speak(utter);
      };
      await audio.play();
    } catch {
      // Fallback para browser TTS
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang  = "pt-BR";
      utter.onend = () => { setState("idle"); setSubtitle(""); };
      window.speechSynthesis.speak(utter);
    }
  }, []);

  const handlePress = useCallback(async () => {
    if (state === "speaking") {
      window.speechSynthesis.cancel();
      setState("idle");
      setSubtitle("");
      return;
    }
    if (state === "listening") {
      intentionalStopRef.current = true;
      recognitionRef.current?.stop();
      return;
    }
    if (state !== "idle") return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setSubtitle("Use o Google Chrome para reconhecimento de voz.");
      return;
    }

    intentionalStopRef.current = false;
    transcriptRef.current = "";
    setState("listening");
    setSubtitle("");

    const startRec = () => {
      const rec: SpeechRecognition = new SpeechRec();
      rec.lang           = "pt-BR";
      rec.continuous     = true;
      rec.interimResults = true;

      rec.onresult = (e: SpeechRecognitionEvent) => {
        transcriptRef.current = Array.from(e.results)
          .map(r => r[0].transcript).join("");
        setSubtitle(transcriptRef.current);
      };

      rec.onend = async () => {
        // Se ainda estamos ouvindo e o stop não foi intencional, reinicia automaticamente
        if (stateRef.current === "listening" && !intentionalStopRef.current) {
          try { startRec(); } catch {}
          return;
        }
        // Stop intencional: processa o texto
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
          setSubtitle("Permissão do microfone negada. Clique no cadeado e permita o microfone.");
          setState("idle");
          intentionalStopRef.current = true;
        }
        // outros erros: deixa o onend reiniciar automaticamente
      };

      recognitionRef.current = rec;
      rec.start();
    };

    startRec();
  }, [state, sessionId, speak]);

  const handleCancel = useCallback(() => {
    intentionalStopRef.current = true;
    window.speechSynthesis.cancel();
    recognitionRef.current?.stop();
    setState("idle");
    setSubtitle("");
  }, []);

  return (
    <div
      className="relative flex flex-col items-center justify-between h-screen overflow-hidden select-none"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      {/* Header — só aparece em idle/listening */}
      <AnimatePresence>
        {(state === "idle" || state === "listening") && (
          <motion.div
            className="pt-14 flex flex-col items-center gap-1 z-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <h1
              className="text-xl font-semibold tracking-[0.25em] text-white"
              style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: "0.3em" }}
            >
              AURA
            </h1>
            <p className="text-xs tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>
              FATEC ZONA SUL
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CENTRO: elemento visual por estado ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full px-8">

        {/* IDLE — orb simples */}
        <AnimatePresence mode="wait">
          {state === "idle" && (
            <motion.div
              key="idle"
              className="flex flex-col items-center gap-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                style={{
                  width: 120, height: 120,
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 38% 32%, #2a0000, #0A0A0A 80%)",
                  border: "1px solid rgba(192,0,0,0.3)",
                  boxShadow: "0 0 30px rgba(192,0,0,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <span style={{
                  color: "rgba(192,0,0,0.8)",
                  fontSize: 32, fontWeight: 700,
                  fontFamily: "'Orbitron', sans-serif",
                  textShadow: "0 0 16px rgba(192,0,0,0.5)",
                }}>A</span>
              </motion.div>
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, letterSpacing: "0.2em" }}>
                TOQUE PARA FALAR
              </p>
            </motion.div>
          )}

          {/* LISTENING — orb quieto + transcrição */}
          {state === "listening" && (
            <motion.div
              key="listening"
              className="flex flex-col items-center gap-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <div style={{
                width: 120, height: 120,
                borderRadius: "50%",
                background: "radial-gradient(circle at 38% 32%, #200000, #0A0A0A 80%)",
                border: "1px solid rgba(192,0,0,0.2)",
                boxShadow: "0 0 20px rgba(192,0,0,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{
                  color: "rgba(192,0,0,0.5)",
                  fontSize: 32, fontWeight: 700,
                  fontFamily: "'Orbitron', sans-serif",
                }}>A</span>
              </div>
              {/* Transcrição em tempo real */}
              <AnimatePresence>
                {subtitle && (
                  <motion.p
                    key={subtitle}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: 14,
                      textAlign: "center",
                      maxWidth: 280,
                      lineHeight: 1.6,
                    }}
                  >
                    {subtitle}
                  </motion.p>
                )}
              </AnimatePresence>
              {!subtitle && (
                <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, letterSpacing: "0.2em" }}>
                  FALE AGORA · TOQUE NOVAMENTE PARA ENVIAR
                </p>
              )}
            </motion.div>
          )}

          {/* THINKING — blob de pensamento */}
          {state === "thinking" && (
            <motion.div
              key="thinking"
              className="flex flex-col items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{ position: "relative", width: 300, height: 300 }}
            >
              {/* Blob principal */}
              <motion.div
                style={{
                  position: "absolute",
                  width: 220, height: 200,
                  background: "#FFFFFF",
                  top: 20, left: "50%", x: "-50%",
                }}
                animate={{
                  borderRadius: BLOB_SHAPES,
                  scale: [1, 1.04, 0.98, 1.03, 1],
                  x: ["-50%", "-48%", "-52%", "-50%"],
                  y: [0, -6, 4, -3, 0],
                }}
                transition={{
                  borderRadius: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                  scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                  x: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                  y: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
                }}
              />

              {/* Bolinha pequena do balão */}
              <motion.div
                style={{
                  position: "absolute",
                  width: 28, height: 28,
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  bottom: 52, left: "35%",
                }}
                animate={{
                  scale: [1, 1.1, 0.95, 1.05, 1],
                  x: [0, -4, 2, -2, 0],
                  y: [0, 3, -2, 2, 0],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Bolinha menor */}
              <motion.div
                style={{
                  position: "absolute",
                  width: 14, height: 14,
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  bottom: 28, left: "28%",
                }}
                animate={{
                  scale: [1, 1.15, 0.9, 1.1, 1],
                  x: [0, -3, 1, -1, 0],
                  y: [0, 2, -2, 1, 0],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              />
            </motion.div>
          )}

          {/* SPEAKING — pílulas animadas estilo ChatGPT */}
          {state === "speaking" && (
            <motion.div
              key="speaking"
              className="flex flex-col items-center gap-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* 4 pílulas */}
              <div className="flex items-center justify-center gap-3">
                {PILL_DELAYS.map((delay, i) => (
                  <motion.div
                    key={i}
                    style={{
                      width: 52, height: 52,
                      borderRadius: 26,
                      background: "#FFFFFF",
                    }}
                    animate={{
                      scaleY: [1, 0.35, 1.2, 0.5, 1],
                      scaleX: [1, 1.1, 0.9, 1.05, 1],
                    }}
                    transition={{
                      duration: PILL_DURATIONS[i],
                      repeat: Infinity,
                      delay,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>

              {/* Texto da resposta */}
              <AnimatePresence>
                {subtitle && (
                  <motion.p
                    key="resp"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      color: "rgba(255,255,255,0.45)",
                      fontSize: 13,
                      textAlign: "center",
                      maxWidth: 280,
                      lineHeight: 1.7,
                    }}
                  >
                    {subtitle.length > 120 ? subtitle.slice(0, 120) + "…" : subtitle}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── RODAPÉ: botões ── */}
      <div className="pb-14 flex items-center gap-12 z-10">

        {/* Botão microfone */}
        <motion.button
          onClick={handlePress}
          disabled={state === "thinking"}
          style={{
            width: 56, height: 56,
            borderRadius: "50%",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: state === "thinking" ? "default" : "pointer",
            opacity: state === "thinking" ? 0.3 : 1,
          }}
          whileTap={state !== "thinking" ? { scale: 0.88 } : {}}
          whileHover={state !== "thinking" ? { borderColor: "rgba(255,255,255,0.4)" } : {}}
        >
          {state === "idle" || state === "thinking"
            ? <Mic size={22} color="rgba(255,255,255,0.7)" />
            : <Square size={18} color="rgba(255,255,255,0.7)" fill="rgba(255,255,255,0.7)" />
          }
        </motion.button>

        {/* Botão cancelar (vermelho) — só aparece quando ativo */}
        <AnimatePresence>
          {state !== "idle" && (
            <motion.button
              onClick={handleCancel}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{
                width: 56, height: 56,
                borderRadius: "50%",
                background: "#C00000",
                border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 0 20px rgba(192,0,0,0.4)",
              }}
              whileTap={{ scale: 0.88 }}
            >
              <X size={20} color="white" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Mensagem de erro/status */}
      <AnimatePresence>
        {subtitle && state === "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute",
              bottom: 100,
              left: "50%", transform: "translateX(-50%)",
              background: "rgba(192,0,0,0.15)",
              border: "1px solid rgba(192,0,0,0.3)",
              borderRadius: 12,
              padding: "10px 20px",
              maxWidth: 300,
              textAlign: "center",
              fontSize: 12,
              color: "rgba(255,255,255,0.6)",
            }}
          >
            {subtitle}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
