import { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useChat, useSendMessage } from "@/hooks/use-chat";
import { Sidebar } from "@/components/Sidebar";
import { Message, TypingIndicator } from "@/components/Message";
import { SendHorizontal, Sparkles, AlertCircle, Mic, Image as ImageIcon, Languages, X } from "lucide-react";
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

  // حالة لتخزين الرسالة التي يتم إرسالها حالياً لعرضها فوراً
  const [optimisticMessage, setOptimisticMessage] = useState<{content: string, imageUrl?: string} | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // دمج الرسائل القديمة مع الرسالة الحالية "المتفائلة"
  const allMessages = useMemo(() => {
    const msgs = data?.messages ? [...data.messages] : [];
    if (optimisticMessage) {
      msgs.push({
        id: Date.now(), // معرف مؤقت
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

  // التمرير للأسفل عند إضافة أي رسالة (حتى المتفائلة)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages, sendMessage.isPending]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const contentToSend = input.trim();
    if ((!contentToSend && !imageUrl) || !chatId || sendMessage.isPending) return;

    // 1. عرض الرسالة فوراً في الواجهة
    setOptimisticMessage({ 
      content: contentToSend || (imageUrl ? "Analyze this image" : ""), 
      imageUrl: imageUrl || undefined 
    });

    // 2. إرسال الطلب للخادم
    sendMessage.mutate({ 
      chatId, 
      content: contentToSend || (imageUrl ? "Analyze this image" : ""), 
      imageUrl: imageUrl || undefined 
    }, {
      onSettled: () => {
        // 3. عند انتهاء الطلب (نجاح أو فشل)، نحذف الرسالة المؤقتة لأنها ستأتي من قاعدة البيانات
        setOptimisticMessage(null);
      }
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
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        setImageUrl(base64Image);
        // هنا يفضل ترك المستخدم يضغط إرسال أو إرسالها فوراً بنفس منطق الـ Optimistic
        setOptimisticMessage({ content: "Analyze this image...", imageUrl: base64Image });
        sendMessage.mutate({
          chatId: chatId!,
          content: "Analyze this image and tell me what you see.",
          imageUrl: base64Image,
        }, { onSettled: () => setOptimisticMessage(null) });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleMic = () => {
    if (!SpeechRecognition) {
      alert("Browser does not support speech recognition");
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.onstart = () => setIsRecording(true);
      recognitionRef.current.onend = () => setIsRecording(false);
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        // إرسال فوري مع تحديث متفائل
        setOptimisticMessage({ content: transcript });
        sendMessage.mutate({ chatId: chatId!, content: transcript }, { onSettled: () => setOptimisticMessage(null) });
      };
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.lang = isArabic ? "ar-SA" : "en-US";
      recognitionRef.current.start();
    }
  };

  if (isLoading && chatId && !optimisticMessage) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Sparkles className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // ... (نفس شروط الخطأ و chatId غير الموجود تبقى كما هي)
  if (!chatId) return <div className="flex h-screen bg-background"><Sidebar /><main className="flex-1 flex items-center justify-center"><h1>Select Chat</h1></main></div>;

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

            {/* مؤشر التحميل يظهر فقط عندما ننتظر رد الذكاء الاصطناعي والرسالة المتفائلة قد أرسلت */}
            {sendMessage.isPending && <TypingIndicator />}

            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* صندوق الإدخال كما هو مع إضافة التحسينات البسيطة */}
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