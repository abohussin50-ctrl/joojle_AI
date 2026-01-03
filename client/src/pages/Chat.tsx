import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useChat, useSendMessage } from "@/hooks/use-chat";
import { Sidebar } from "@/components/Sidebar";
import { Message, TypingIndicator } from "@/components/Message";
import { SendHorizontal, Sparkles, AlertCircle, Mic, Image as ImageIcon, Languages, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

import { useLanguage } from "@/hooks/use-language";

export default function Chat() {
  const { t, isArabic, language, setLanguage } = useLanguage();
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const chatId = id ? parseInt(id) : null;
  const { data, isLoading, error } = useChat(chatId);
  const sendMessage = useSendMessage();
  
  const [input, setInput] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if ((!input.trim() && !imageUrl) || !chatId || sendMessage.isPending) return;

    sendMessage.mutate({ 
      chatId, 
      content: input || (imageUrl ? "Analyze this image" : ""), 
      imageUrl: imageUrl || undefined 
    });
    
    setInput("");
    setImageUrl(null);
    
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        setImageUrl(base64Image);

        // Optionally, send the image immediately with a default prompt
        if (chatId) {
          sendMessage.mutate({
            chatId,
            content: "Analyze this image and tell me what you see.",
            imageUrl: base64Image,
          });
        }
        setInput(""); // Clear the input
      };
      reader.readAsDataURL(file);
    }
  };
  let recognition: SpeechRecognition | null = null;

  const toggleMic = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert("Browser does not support speech recognition");
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!recognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = isArabic ? "ar-SA" : "en-US";

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSubmit(); // Automatically submit the transcribed text
      };

      recognition.onerror = (event) => {
        console.error("Speech error:", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.lang = isArabic ? "ar-SA" : "en-US";
      try {
        recognition.start();
      } catch (error) {
        console.error("Recognition start error:", error);
        setIsRecording(false); // Ensure recording state is false in case of errors
      }
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
          <h2 className="text-2xl font-bold mb-2">{t("chat.notFound")}</h2>
          <p className="text-muted-foreground mb-6">{t("chat.notFoundDesc")}</p>
          <button 
            onClick={() => setLocation("/")}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition"
          >
            {t("chat.returnHome")}
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
            {/* Image Preview */}
            <AnimatePresence>
              {imageUrl && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full mb-4 left-0"
                >
                  <div className="relative group/img">
                    <img src={imageUrl} alt="Upload preview" className="h-20 w-20 object-cover rounded-xl border-2 border-primary/50" />
                    <button 
                      onClick={() => setImageUrl(null)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover/img:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-accent/50 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            
            <div className="relative bg-card rounded-2xl border border-white/10 shadow-2xl flex items-end overflow-hidden focus-within:ring-1 focus-within:ring-primary/50 transition-all">
              <div className="pb-3 pl-3 flex gap-1">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-white/5"
                  title={t("input.image")}
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={toggleMic}
                  className={cn(
                    "p-2 transition-colors rounded-lg hover:bg-white/5",
                    isRecording ? "text-destructive animate-pulse" : "text-muted-foreground hover:text-primary"
                  )}
                  title={t("input.mic")}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setLanguage(language === "en" ? "ar" : "en")}
                  className={cn(
                    "p-2 transition-colors rounded-lg hover:bg-white/5",
                    isArabic ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"
                  )}
                  title={t("input.language")}
                >
                  <Languages className="w-5 h-5" />
                </button>
              </div>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("input.placeholder")}
                rows={1}
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/60 border-0 py-4 px-4 resize-none max-h-48 focus:ring-0 text-base md:text-lg scrollbar-thin"
                disabled={sendMessage.isPending}
              />
              
              <div className="pb-3 pr-3">
                <button
                  onClick={() => handleSubmit()}
                  disabled={(!input.trim() && !imageUrl) || sendMessage.isPending}
                  className={cn(
                    "p-2 rounded-xl transition-all duration-200 flex items-center justify-center",
                    (input.trim() || imageUrl)
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
                {t("app.warning")}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
