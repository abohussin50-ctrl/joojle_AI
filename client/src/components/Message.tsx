import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { User, Sparkles, Copy, Check } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import type { Message as MessageType } from "@shared/schema";
import { motion } from "framer-motion";

interface MessageProps {
  message: MessageType;
}

import { useLanguage } from "@/hooks/use-language";

export function Message({ message }: MessageProps) {
  const { t } = useLanguage();
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex gap-4 md:gap-6 py-8 px-4 md:px-8 w-full mx-auto max-w-4xl rounded-2xl transition-colors",
        isUser ? "bg-transparent" : "bg-white/[0.02]"
      )}
    >
      {/* Avatar */}
      <div className="shrink-0 flex flex-col items-center gap-1">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shadow-lg border",
          isUser 
            ? "bg-white/10 border-white/20 text-white" 
            : "bg-gradient-to-br from-primary to-purple-600 border-transparent text-white"
        )}>
          {isUser ? <User className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {isUser ? t("common.you") : t("common.ai")}
          </span>
          <span className="text-[10px] text-muted-foreground/50">
            {format(new Date(message.createdAt), "h:mm a")}
          </span>
        </div>

        <div className={cn(
          "prose prose-invert max-w-none text-base md:text-lg leading-relaxed break-words",
          isUser ? "text-foreground" : "text-gray-100"
        )}>
          {message.imageUrl && (
            <div className="mb-4">
              <img 
                src={message.imageUrl} 
                alt="Attachment" 
                className="max-h-64 rounded-xl border border-white/10 shadow-lg object-contain bg-black/20" 
              />
            </div>
          )}
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown>{message.content}</ReactMarkdown>
          )}
        </div>

        {/* Actions (Only for AI messages usually) */}
        {!isUser && (
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors py-1 px-2 rounded hover:bg-white/5"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? t("common.copied") : t("common.copy")}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function TypingIndicator() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex gap-4 md:gap-6 py-6 px-4 md:px-8 w-full mx-auto max-w-4xl"
    >
      <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-primary to-purple-600 text-white animate-pulse">
        <Sparkles className="w-5 h-5" />
      </div>
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
      </div>
    </motion.div>
  );
}
