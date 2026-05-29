"use client";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { AuraAvatar } from "./AuraAvatar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
  isLast?: boolean;
}

const intentLabels: Record<string, string> = {
  calendar:          "Calendário",
  document_request:  "Documentos",
  enrollment_lock:   "Trancamento",
  internship:        "Estágio",
  discipline_info:   "Disciplinas",
  professor_info:    "Professores",
  greeting:          "Saudação",
  general_query:     "Consulta",
};

export function MessageBubble({ message, isLast }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const timeStr = format(new Date(message.timestamp), "HH:mm", { locale: ptBR });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex gap-3 px-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <AuraAvatar size="sm" isActive={isLast && message.isStreaming} />
        </div>
      )}

      {/* Bubble */}
      <div className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start", "max-w-[85%]")}>
        {/* Intent badge (apenas AURA) */}
        {!isUser && message.intent && intentLabels[message.intent] && (
          <span className="text-[10px] text-aura-400/70 font-medium px-2 py-0.5 rounded-full bg-aura-950/50 border border-aura-800/30">
            {intentLabels[message.intent]}
          </span>
        )}

        {/* Conteúdo */}
        <div
          className={cn(
            isUser
              ? "message-bubble-user shadow-lg"
              : "message-bubble-aura"
          )}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed">{message.content}</p>
          ) : (
            <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="text-aura-300 font-semibold">{children}</strong>,
                  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
                  li: ({ children }) => <li className="text-gray-200">{children}</li>,
                  code: ({ children }) => (
                    <code className="bg-gray-800 text-aura-300 px-1 py-0.5 rounded text-xs">{children}</code>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>

              {/* Cursor de streaming */}
              {message.isStreaming && (
                <span className="inline-block w-0.5 h-4 bg-aura-400 animate-pulse ml-0.5 align-middle" />
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-gray-600 px-1">{timeStr}</span>
      </div>
    </motion.div>
  );
}

// Indicador de digitação da AURA
export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex gap-3 px-4"
    >
      <AuraAvatar size="sm" isActive />
      <div className="glass rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-aura-400"
              animate={{ y: [-3, 0, -3] }}
              transition={{
                duration: 0.8,
                delay: i * 0.15,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
