import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion"; // أضفنا هذه المكتبة

interface AuthContextType {
  user: User | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isLoggedIn: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- 1. إضافة مكون شاشة التحميل الاحترافية ---
const LoadingScreen = () => (
  <motion.div 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#131314]"
  >
    {/* شعار متحرك */}
    <motion.div 
      animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }} 
      transition={{ repeat: Infinity, duration: 2 }}
      className="text-5xl font-bold bg-gradient-to-r from-[#4285F4] via-[#9b72cb] to-[#d96570] bg-clip-text text-transparent mb-10"
    >
      joojle AI
    </motion.div>

    {/* بار التحميل النحيف (Gemini Style) */}
    <div className="w-64 h-[2px] bg-white/5 rounded-full overflow-hidden relative">
      <motion.div 
        animate={{ x: [-250, 250] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
      />
    </div>
  </motion.div>
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      // نعطي تأخير بسيط ليشعر المستخدم بسلاسة التصميم
      setTimeout(() => setIsLoading(false), 800);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (_event === 'SIGNED_IN' || _event === 'SIGNED_OUT') {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    // تفعيل شاشة التحميل فوراً عند الضغط
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) {
      setIsLoading(false);
      console.error(error.message);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    // تأخير بسيط لمحاكاة الخروج الاحترافي
    setTimeout(() => {
      setUser(null);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <AuthContext.Provider value={{ user, signInWithGoogle, signOut, isLoggedIn: !!user, isLoading }}>
      {/* 2. إضافة AnimatePresence للتحكم في ظهور واختفاء الشاشة */}
      <AnimatePresence>
        {isLoading && <LoadingScreen />}
      </AnimatePresence>

      {/* عرض المحتوى الأصلي */}
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};