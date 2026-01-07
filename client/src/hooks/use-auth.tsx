import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";

interface AuthContextType {
  user: User | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isLoggedIn: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- مكون شاشة التحميل الاحترافية (Gemini Style) ---
const LoadingScreen = () => (
  <motion.div 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#131314]"
  >
    <motion.div 
      animate={{ scale: [1, 1.02, 1], opacity: [0.8, 1, 0.8] }} 
      transition={{ repeat: Infinity, duration: 2 }}
      className="text-5xl font-bold bg-gradient-to-r from-[#4285F4] via-[#9b72cb] to-[#d96570] bg-clip-text text-transparent mb-10 select-none"
    >
      joojle AI
    </motion.div>

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
    // 1. جلب الجلسة الأولية عند تحميل التطبيق
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      // تأخير بسيط فقط لضمان نعومة الانتقال البصري
      setTimeout(() => setIsLoading(false), 800);
    });

    // 2. مراقبة التغيرات في حالة المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      if (_event === 'SIGNED_IN') {
        setIsLoading(false);
      }

      if (_event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
        // مسح أي بيانات متبقية في التخزين المحلي لضمان الخصوصية
        window.localStorage.clear(); 
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' } // للسماح للمستخدم بتبديل الحساب بسهولة
      }
    });
    if (error) {
      setIsLoading(false);
      console.error("Login Error:", error.message);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    // مسح المستخدم من الحالة فوراً قبل انتظار رد سوبابيس لضمان حماية البيانات
    setUser(null); 
    await supabase.auth.signOut();

    // إعادة تحميل الصفحة اختيارياً لتنظيف جميع حالات React Query والمخازن
    window.location.href = "/"; 
  };

  return (
    <AuthContext.Provider value={{ user, signInWithGoogle, signOut, isLoggedIn: !!user, isLoading }}>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <LoadingScreen key="loading" />
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full w-full"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};