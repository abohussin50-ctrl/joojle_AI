import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  isArabic: boolean;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    "app.name": "joojle AI",
    "app.tagline": "Your intelligent creative partner. Ask anything, get answers, and spark new ideas instantly.",
    "app.powered": "Powered by Advanced AI",
    "app.warning": "Joojle AI can make mistakes. Verify important information.",
    "input.placeholder": "Message joojle AI...",
    "input.mic": "Voice input",
    "input.image": "Upload image",
    "input.language": "Toggle Language",
    "sidebar.newChat": "New Chat",
    "sidebar.creating": "Creating...",
    "sidebar.recent": "Recent",
    "sidebar.empty": "No chats yet. Start a new conversation!",
    "sidebar.delete": "Delete chat",
    "sidebar.footer": "joojle AI © 2025",
    "chat.notFound": "Chat not found",
    "chat.notFoundDesc": "This conversation may have been deleted or doesn't exist.",
    "chat.returnHome": "Return Home",
    "suggestion.quantum": "Explain quantum computing in simple terms",
    "suggestion.python": "Write a Python script to scrape a website",
    "suggestion.date": "Give me 5 creative date ideas for a rainy day",
    "suggestion.email": "Draft a professional email to my boss",
    "features.fast": "Fast",
    "features.secure": "Secure",
    "features.smart": "Smart",
    "common.you": "You",
    "common.ai": "Joojle AI",
    "common.copy": "Copy",
    "common.copied": "Copied",
    "settings.title": "Settings",
    "settings.activity": "Activity",
    "settings.geminiInstructions": "Gemini Instructions",
    "settings.extensions": "Extensions",
    "settings.links": "Public Links",
    "settings.appearance": "Appearance",
    "settings.subscriptions": "Subscriptions",
    "settings.notebooklm": "NotebookLM",
    "settings.feedback": "Send feedback",
    "settings.help": "Help"
  },
  ar: {
    "app.name": "joojle AI",
    "app.tagline": "شريكك الإبداعي الذكي. اسأل أي شيء، واحصل على إجابات، واطلق أفكاراً جديدة على الفور.",
    "app.powered": "مدعوم بالذكاء الاصطناعي المتقدم",
    "app.warning": "يمكن أن يخطئ Joojle AI. تحقق من المعلومات المهمة.",
    "input.placeholder": "اسأل joojle AI...",
    "input.mic": "إدخال صوتي",
    "input.image": "رفع صورة",
    "input.language": "تبديل اللغة",
    "sidebar.newChat": "محادثة جديدة",
    "sidebar.creating": "جاري الإنشاء...",
    "sidebar.recent": "الأخيرة",
    "sidebar.empty": "لا توجد محادثات بعد. ابدأ محادثة جديدة!",
    "sidebar.delete": "حذف المحادثة",
    "sidebar.footer": "joojle AI © 2025",
    "chat.notFound": "المحادثة غير موجودة",
    "chat.notFoundDesc": "ربما تم حذف هذه المحادثة أو أنها غير موجودة.",
    "chat.returnHome": "العودة للرئيسية",
    "suggestion.quantum": "اشرح الحوسبة الكمومية بكلمات بسيطة",
    "suggestion.python": "اكتب سكربت بايثون لسحب بيانات من موقع",
    "suggestion.date": "أعطني 5 أفكار إبداعية لموعد في يوم ممطر",
    "suggestion.email": "مسودة بريد إلكتروني احترافي لمديري",
    "features.fast": "سريع",
    "features.secure": "آمن",
    "features.smart": "ذكي",
    "common.you": "أنت",
    "common.ai": "Joojle AI",
    "common.copy": "نسخ",
    "common.copied": "تم النسخ",
    "settings.title": "الإعدادات",
    "settings.activity": "النشاط",
    "settings.geminiInstructions": "تعليمات لـ Gemini",
    "settings.extensions": "التطبيقات المرتبطة",
    "settings.links": "الروابط المتاحة للجميع",
    "settings.appearance": "المظهر",
    "settings.subscriptions": "عرض الاشتراكات",
    "settings.notebooklm": "NotebookLM",
    "settings.feedback": "إرسال ملاحظات",
    "settings.help": "مساعدة"
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const browserLang = navigator.language.split("-")[0];
    if (browserLang === "ar") {
      setLanguageState("ar");
    } else {
      setLanguageState("en");
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  const isArabic = language === "ar";

  return (
    <LanguageContext.Provider value={{ language, isArabic, setLanguage, t }}>
      <div dir={isArabic ? "rtl" : "ltr"} className={isArabic ? "rtl" : ""}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
