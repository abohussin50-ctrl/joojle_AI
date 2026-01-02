import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useChat, useSendMessage } from "@/hooks/use-chat";
import { Sidebar } from "@/components/Sidebar";
import { Message, TypingIndicator } from "@/components/Message";
import { SendHorizontal, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Chat() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const chatId = id ? parseInt(id) : null;
  const { data, isLoading, error } = useChat(chatId);
  const sendMessage = useSendMessage();
  
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !chatId || sendMessage.isPending) return;

    sendMessage.mutate({ chatId, content: input });
    setInput("");
    
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Handle errors (e.g., chat deleted or invalid ID)
  if (error || (data === null && !isLoading)) {
    return (
      <div className="flex h-screen bg-background text-foreground">
        <Sidebar />
        <div className="flex-1 ml-0 md:ml-72 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-destructive/10 p-4 rounded-full mb-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Chat not found</h2>
          <p className="text-muted-foreground mb-6">This conversation may have been deleted or doesn't exist.</p>
          <button 
            onClick={() => setLocation("/")}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-body">
      <Sidebar />

      <main className="flex-1 ml-0 md:ml-72 flex flex-col h-full relative">
        {/* Chat Header (Mobile only basically, or sticky title) */}
        <header className="absolute top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-md border-b border-white/5 p-4 md:hidden">
          <div className="pl-12 font-medium truncate">{data?.chat.title || "Chat"}</div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scroll-smooth pt-16 md:pt-4 pb-4">
          <div className="max-w-4xl mx-auto min-h-full flex flex-col justify-end">
            <AnimatePresence initial={false}>
              {data?.messages.map((msg) => (
                <Message key={msg.id} message={msg} />
              ))}
            </AnimatePresence>
            
            {sendMessage.isPending && <TypingIndicator />}
            
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-gradient-to-t from-background via-background to-transparent z-20">
          <div className="max-w-3xl mx-auto relative group">
            {/* Glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-accent/50 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            
            <div className="relative bg-card rounded-2xl border border-white/10 shadow-2xl flex items-end overflow-hidden focus-within:ring-1 focus-within:ring-primary/50 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                rows={1}
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/60 border-0 py-4 pl-4 pr-12 resize-none max-h-48 focus:ring-0 text-base md:text-lg scrollbar-thin"
                disabled={sendMessage.isPending}
              />
              
              <div className="pb-3 pr-3">
                <button
                  onClick={() => handleSubmit()}
                  disabled={!input.trim() || sendMessage.isPending}
                  className={cn(
                    "p-2 rounded-xl transition-all duration-200 flex items-center justify-center",
                    input.trim() 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90" 
                      : "bg-secondary text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {sendMessage.isPending ? (
                    <Sparkles className="w-5 h-5 animate-spin" />
                  ) : (
                    <SendHorizontal className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-center mt-2">
              <p className="text-[10px] text-muted-foreground/50">
                Joojle AI can make mistakes. Verify important information.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
