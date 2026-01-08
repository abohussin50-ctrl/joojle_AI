import { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useChat, useSendMessage } from "@/hooks/use-chat";
import { Sidebar } from "@/components/Sidebar";
import { Message, TypingIndicator } from "@/components/Message";
import { SendHorizontal, Sparkles, AlertCircle, Mic, Image as ImageIcon, Languages, X, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/hooks/use-language";

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

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
  const [optimisticMessage, setOptimisticMessage] = useState<{content: string, imageUrl?: string} | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const allMessages = useMemo(() => {
    const msgs = data?.messages ? [...data.messages] : [];
    if (optimisticMessage) {
      msgs.push({
        id: Date.now(),
        chatId: chatId || 0,
        role: "user",
        content: optimisticMessage.content,
        imageUrl: optimisticMessage.imageUrl || null,
        createdAt: new Date().toISOString()
      } as any);
    }
    return msgs;
  }, [data?.messages, optimisticMessage, chatId]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages, sendMessage.isPending]);

  // دالة الإرسال
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const contentToSend = input.trim();
    if ((!contentToSend && !imageUrl) || !chatId || sendMessage.isPending) return;

    setOptimisticMessage({ 
      content: contentToSend || (imageUrl ? "Analyze this image" : ""), 
      imageUrl: imageUrl || undefined 
    });

    sendMessage.mutate({ 
      chatId, 
      content: contentToSend || (imageUrl ? "Analyze this image" : ""), 
      imageUrl: imageUrl || undefined 
    }, {
      onSettled: () => setOptimisticMessage(null)
    });

    setInput("");
    setImageUrl(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
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
      reader.onloadend = () => setImageUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const toggleMic = () => {
    if (!SpeechRecognition) return;
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.onstart = () => setIsRecording(true);
      recognitionRef.current.onend = () => setIsRecording(false);
      recognitionRef.current.onresult = (event: any) => {
        setInput(event.results[0][0].transcript);
      };
    }
    isRecording ? recognitionRef.current.stop() : recognitionRef.current.start();
  };

  // 1. شاشة التحميل
  if (isLoading && chatId && !optimisticMessage) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center bg-[#0b0b0c]">
          <motion.div 
            // أنيميشن النبض مع تغيير طفيف في الحجم والشفافية
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: [0.7, 1, 0.7] 
            }} 
            transition={{ 
              repeat: Infinity, 
              duration: 1.5, 
              ease: "easeInOut" 
            }}
            className="relative flex items-center justify-center"
          >
            {/* تأثير الهالة المضيئة خلف الشعار */}
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />

            {/* عرض الصورة favicon.png */}
            <img 
              src="/favicon.png" 
              alt="Loading..." 
              className="w-16 h-16 object-contain relative z-10"
              onError={(e) => {
                // في حال عدم العثور على الصورة يظهر البديل الافتراضي
                e.currentTarget.src = "https://www.gstatic.com/lamda/images/favicon_v1_150160d13988654cbfd5.svg";
              }}
            />
          </motion.div>
        </div>
      </div>
    );
  }

  // 2. شاشة الخطأ أو عدم الصلاحية (تم تحسينها)
  if (error || !chatId) {
    const isNoChat = !chatId;
    const isForbidden = error?.message === "Unauthorized" || error?.message === "Forbidden";

    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/5 border border-white/10 p-8 rounded-3xl max-w-sm"
          >
            <div className="bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-xl font-bold mb-2">
              {isNoChat 
                ? (isArabic ? "لم يتم اختيار محادثة" : "No Chat Selected")
                : isForbidden
                  ? (isArabic ? "تم رفض الوصول" : "Access Denied")
                  : (isArabic ? "المحادثة غير موجودة" : "Chat Not Found")}
            </h1>

            <p className="text-muted-foreground mb-6 text-sm">
              {isNoChat
                ? (isArabic 
                    ? "يرجى اختيار محادثة من القائمة الجانبية لبدء التحدث." 
                    : "Please select a chat from the sidebar to start talking.")
                : isForbidden
                  ? (isArabic 
                      ? "ليس لديك صلاحية لعرض هذه المحادثة." 
                      : "You don't have permission to view this conversation.")
                  : (isArabic
                      ? "ربما تم حذف هذه المحادثة أو أنها غير موجودة."
                      : "This conversation might have been deleted or doesn't exist.")}
            </p>
            <button 
              onClick={() => setLocation("/")}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-xl mx-auto hover:opacity-90 transition-all"
            >
              <Home className="w-4 h-4" />
              {isArabic ? "الرئيسية" : "Go Home"}
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-body">
      <Sidebar />

      <main className="flex-1 ml-0 md:ml-72 flex flex-col h-full relative">
        <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-white/5 p-4 md:hidden flex items-center h-16">
          <div className="w-full text-center font-semibold text-foreground/90 truncate px-12">
            {data?.chat.title || "joojle AI"}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-thin pt-16 md:pt-4 pb-4 px-4">
          <div className="max-w-4xl mx-auto min-h-full flex flex-col justify-end">
            <AnimatePresence initial={false}>
              {allMessages.map((msg) => (
                <Message key={msg.id} message={msg} />
              ))}
            </AnimatePresence>
            {sendMessage.isPending && <TypingIndicator />}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        <div className="p-4 md:p-6 bg-gradient-to-t from-background via-background z-20">
          <div className="max-w-3xl mx-auto relative group">
            <AnimatePresence>
              {imageUrl && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full mb-4 left-0">
                  <div className="relative group/img">
                    <img src={imageUrl} alt="Upload preview" className="h-20 w-20 object-cover rounded-xl border-2 border-primary/50" />
                    <button onClick={() => setImageUrl(null)} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"><X className="w-3 h-3" /></button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative bg-[#1e1f20] rounded-3xl border border-white/10 shadow-2xl flex flex-col md:flex-row items-stretch md:items-end overflow-hidden focus-within:ring-1 focus-within:ring-primary/40 transition-all">
              <div className="flex items-center gap-1 p-2 border-b md:border-b-0 md:border-r border-white/5">
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-muted-foreground hover:text-primary transition-colors"><ImageIcon className="w-5 h-5" /></button>
                <button onClick={toggleMic} className={cn("p-2 transition-colors", isRecording ? "text-destructive animate-pulse" : "text-muted-foreground hover:text-primary")}><Mic className="w-5 h-5" /></button>
                <button onClick={() => setLanguage(language === "en" ? "ar" : "en")} className={cn("p-2 transition-colors", isArabic ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary")}><Languages className="w-5 h-5" /></button>
              </div>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("input.placeholder")}
                rows={1}
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/50 border-0 py-4 px-4 resize-none max-h-60 focus:ring-0 text-base md:text-lg"
                disabled={sendMessage.isPending}
              />

              <div className="p-2 flex justify-end">
                <button
                  onClick={() => handleSubmit()}
                  disabled={(!input.trim() && !imageUrl) || sendMessage.isPending}
                  className={cn("p-3 rounded-2xl transition-all", (input.trim() || imageUrl) ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90" : "bg-white/5 text-muted-foreground/30 cursor-not-allowed")}
                >
                  {sendMessage.isPending ? <Sparkles className="w-5 h-5 animate-spin" /> : <SendHorizontal className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}