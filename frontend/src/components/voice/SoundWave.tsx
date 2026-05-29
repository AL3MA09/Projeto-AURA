"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SoundWaveProps {
  isActive: boolean;
  variant?: "listening" | "speaking" | "processing";
  bars?: number;
  className?: string;
}

const variantColors = {
  listening:  "from-aura-400 to-aurora-cyan",
  speaking:   "from-aurora-purple to-aura-400",
  processing: "from-aura-300 to-aurora-purple",
};

const variantDelays = [0, 0.1, 0.2, 0.1, 0];

export function SoundWave({ isActive, variant = "listening", bars = 5, className }: SoundWaveProps) {
  return (
    <div className={cn("flex items-center gap-[3px]", className)}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            "sound-wave-bar bg-gradient-to-t",
            variantColors[variant]
          )}
          animate={
            isActive
              ? {
                  scaleY: [0.4, 1, 0.4],
                  transition: {
                    duration: 0.8,
                    delay: variantDelays[i % variantDelays.length],
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }
              : { scaleY: 0.4 }
          }
          style={{ height: 24, width: 4, borderRadius: 2, originY: "center" }}
        />
      ))}
    </div>
  );
}
