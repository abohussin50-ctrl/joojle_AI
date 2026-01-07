import { useCreateChat } from "@/hooks/use-chat";
import { Sidebar } from "@/components/Sidebar";
import { Sparkles, MessageSquareText, Zap, Shield, Mic, Image as ImageIcon, Languages, SendHorizontal, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth"; // استيراد نظام المصادقة
import { useLanguage } from "@/hooks/use-language";

export function Home() {
  const { isLoggedIn } = useAuth(); // جلب حالة تسجيل الدخول
  const { t, isArabic, language, setLanguage } = useLanguage();
  const createChat = useCreateChat();
  const [input, setInput] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [, setLocation] = useLocation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    // التحقق من تسجيل الدخول
    if (!isLoggedIn) {
      alert(isArabic ? "يرجى تسجيل الدخول أولاً للمتابعة" : "Please sign in first to continue");
      return;
    }

    if ((!input.trim() && !imageUrl) || createChat.isPending) return;

    createChat.mutate(input || (imageUrl ? t("suggestion.quantum") : t("sidebar.newChat")), {
      onSuccess: (chat) => {
        setLocation(`/chat/${chat.id}`, {
          state: { message: input, imageUrl },
        });
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isLoggedIn) {
      alert(isArabic ? "سجل الدخول لرفع الصور" : "Sign in to upload images");
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleMic = () => {
    if (!isLoggedIn) {
      alert(isArabic ? "سجل الدخول لاستخدام الميكروفون" : "Sign in to use voice input");
      return;
    }
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert("Browser does not support speech recognition");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = isArabic ? "ar-SA" : "en-US";

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const handleSuggestionClick = (text: string) => {
    if (!isLoggedIn) {
      alert(isArabic ? "يرجى تسجيل الدخول أولاً" : "Please sign in first");
      return;
    }
    createChat.mutate(text, {
      onSuccess: (chat) => {
        setLocation(`/chat/${chat.id}`, {
          state: { message: text },
        });
      },
    });
  };

  const suggestions = [
    t("suggestion.quantum"),
    t("suggestion.python"),
    t("suggestion.date"),
    t("suggestion.email")
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-body">
      <Sidebar />

      <main className="flex-1 ml-0 md:ml-72 flex flex-col h-full overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px]" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 w-full max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-6 mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-primary-foreground mb-4">
              <Sparkles className="w-3 h-3 text-primary" />
              <span>{t("app.powered")}</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight">
              <span className="text-gradient">{t("app.name")}</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
              {t("app.tagline")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="w-full max-w-2xl relative"
          >
            {/* Image Preview */}
            <AnimatePresence>
              {imageUrl && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full mb-4 left-0 z-20"
                >
                  <div className="relative group/img">
                    <img src={imageUrl} alt="Upload preview" className="h-20 w-20 object-cover rounded-xl border-2 border-primary/50" />
                    <button 
                      onClick={() => setImageUrl(null)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-lg"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={cn(
              "relative bg-[#1e1f20] rounded-3xl border border-white/10 shadow-2xl flex flex-col md:flex-row items-stretch md:items-end overflow-hidden focus-within:ring-1 focus-within:ring-primary/40 transition-all",
              !isLoggedIn && "opacity-80 border-dashed"
            )}>
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 pt-3 pb-1 md:pb-3 md:pl-3 border-b md:border-b-0 border-white/5">
                <div className="flex gap-1">
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-xl hover:bg-white/5"
                    title={t("input.image")}
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={toggleMic}
                    className={cn(
                      "p-2 transition-colors rounded-xl hover:bg-white/5",
                      isRecording ? "text-destructive animate-pulse bg-destructive/10" : "text-muted-foreground hover:text-primary"
                    )}
                    title={t("input.mic")}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setLanguage(language === "en" ? "ar" : "en")}
                    className={cn(
                      "p-2 transition-colors rounded-xl hover:bg-white/5",
                      isArabic ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"
                    )}
                    title={t("input.language")}
                  >
                    <Languages className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isLoggedIn ? t("input.placeholder") : (isArabic ? "سجل الدخول للبدء في المحادثة..." : "Sign in to start chatting...")}
                rows={1}
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/50 border-0 py-4 px-4 resize-none max-h-60 focus:ring-0 text-base md:text-lg scrollbar-none"
                disabled={createChat.isPending}
              />

              <div className="pb-3 pr-3 flex justify-end">
                <button
                  onClick={() => handleSubmit()}
                  disabled={createChat.isPending || (!isLoggedIn && !input.trim())}
                  className={cn(
                    "p-2.5 rounded-2xl transition-all duration-300 flex items-center justify-center",
                    (input.trim() || imageUrl) && isLoggedIn
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 scale-100" 
                      : "bg-white/5 text-muted-foreground/30 cursor-not-allowed scale-90"
                  )}
                >
                  {createChat.isPending ? (
                    <Sparkles className="w-5 h-5 animate-spin" />
                  ) : (
                    <SendHorizontal className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Suggestions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12 w-full max-w-3xl"
          >
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-left p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group"
              >
                <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  "{suggestion}"
                </p>
              </button>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-16 flex gap-8 text-xs text-muted-foreground/60 font-medium uppercase tracking-widest"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" /> {t("features.fast")}
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" /> {t("features.secure")}
            </div>
            <div className="flex items-center gap-2">
              <MessageSquareText className="w-4 h-4" /> {t("features.smart")}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default Home;