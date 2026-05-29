"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AuraAvatarProps {
  isActive?: boolean;
  isSpeaking?: boolean;
  isListening?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm:  { outer: 40, inner: 32, ring: 36 },
  md:  { outer: 56, inner: 44, ring: 50 },
  lg:  { outer: 80, inner: 64, ring: 72 },
  xl:  { outer: 120, inner: 96, ring: 108 },
};

export function AuraAvatar({ isActive, isSpeaking, isListening, size = "md", className }: AuraAvatarProps) {
  const s = sizes[size];

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: s.outer, height: s.outer }}
    >
      {/* Anel de gradiente girando */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "conic-gradient(from 0deg, #6171f3, #7c3aed, #06b6d4, #6171f3)",
          padding: 2,
        }}
        animate={{ rotate: isActive ? 360 : 0 }}
        transition={{
          duration: isSpeaking ? 2 : 6,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <div
          className="w-full h-full rounded-full bg-gray-950"
          style={{ padding: 2 }}
        />
      </motion.div>

      {/* Glow externo quando falando */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          boxShadow: isSpeaking
            ? "0 0 30px rgba(97,113,243,0.6), 0 0 60px rgba(124,58,237,0.3)"
            : isListening
            ? "0 0 25px rgba(239,68,68,0.5)"
            : isActive
            ? "0 0 20px rgba(97,113,243,0.3)"
            : "0 0 0px transparent",
        }}
        transition={{ duration: 0.4 }}
      />

      {/* Avatar interior */}
      <motion.div
        className="relative z-10 flex items-center justify-center rounded-full overflow-hidden"
        style={{
          width: s.inner,
          height: s.inner,
          background: "linear-gradient(135deg, #1c1f52 0%, #2d3282 50%, #1c1f52 100%)",
        }}
        animate={isSpeaking ? { scale: [1, 1.04, 1] } : { scale: 1 }}
        transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
      >
        {/* Letra A estilizada */}
        <span
          className="font-display font-bold select-none bg-gradient-to-br from-aura-300 to-aurora-cyan bg-clip-text text-transparent"
          style={{ fontSize: s.inner * 0.42 }}
        >
          A
        </span>

        {/* Partículas internas */}
        {isActive && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-aura-400/60"
                animate={{
                  x: [0, (i - 1) * 12, 0],
                  y: [0, (i % 2 === 0 ? -8 : 8), 0],
                  opacity: [0, 0.8, 0],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </>
        )}
      </motion.div>
    </div>
  );
}
