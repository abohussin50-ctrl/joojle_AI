import { Link, useLocation } from "wouter";
import { useChats, useCreateChat, useDeleteChat } from "@/hooks/use-chat";
import { Plus, MessageSquare, Trash2, Menu, X, Sparkles, Settings, History, UserRound, Puzzle, Link as LinkIcon, SunMoon, CreditCard, ExternalLink, MessageSquareQuote, HelpCircle, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";

export function Sidebar() {
  const { user, signInWithGoogle, signOut, isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const { t, isArabic } = useLanguage();
  const [location, setLocation] = useLocation();
  const { data: chats, isLoading } = useChats();
  const createChat = useCreateChat();
  const deleteChat = useDeleteChat();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Extract ID from path: /chat/123 -> 123
  const currentChatId = location.startsWith("/chat/") 
    ? parseInt(location.split("/")[2]) 
    : null;

  const handleCreateNew = () => {
    // 1. التحقق من تسجيل الدخول أولاً
    if (!isLoggedIn) {
      alert(t("auth.loginRequired") || "Please sign in first to create a new chat");
      // يمكنك أيضاً تفعيل عملية تسجيل الدخول تلقائياً هنا
      // signInWithGoogle();
      return;
    }

    // 2. إذا كان جاري الإنشاء بالفعل، لا تفعل شيئاً
    if (createChat.isPending) return;

    // 3. البدء بعملية الإنشاء
    createChat.mutate(t("sidebar.newChat") || "New Chat", {
      onSuccess: (newChat) => {
        setLocation(`/chat/${newChat.id}`);
        setIsMobileOpen(false);
      },
      onError: (error) => {
        console.error("Create Chat Error:", error);
        alert("Failed to create chat. Please try again.");
      }
    });
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();

    // التأكد من أن الحذف لن يتم إلا إذا أكد المستخدم
    if (window.confirm(t("sidebar.delete") + "?")) {
      deleteChat.mutate(id, {
        onSuccess: () => {
          // إذا كان المستخدم داخل المحادثة التي يتم حذفها، نخرجه للرئيسية
          if (currentChatId === id) {
            setLocation("/");
          }
        },
        onError: (err) => {
          console.error("Delete Error:", err);
          alert("Could not delete chat. It might not belong to you.");
        }
      });
    }
  };

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  const SettingsMenu = () => (
    <div className="flex flex-col w-64 bg-[#1e1f20] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
      <div className="flex flex-col py-2">
        <button 
          onClick={() => window.open('https://myactivity.google.com', '_blank')}
          className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-sm text-foreground"
        >
          <div className="flex items-center gap-3">
            <History className="w-4 h-4 opacity-70" />
            <span>{t("settings.activity")}</span>
          </div>
        </button>

        <button 
          onClick={() => alert("Gemini Instructions")}
          className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-sm text-foreground"
        >
          <div className="flex items-center gap-3">
            <UserRound className="w-4 h-4 opacity-70" />
            <span>{t("settings.geminiInstructions")}</span>
          </div>
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
        </button>

        <button 
          onClick={() => alert("Extensions")}
          className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-sm text-foreground"
        >
          <div className="flex items-center gap-3">
            <Puzzle className="w-4 h-4 opacity-70" />
            <span>{t("settings.extensions")}</span>
          </div>
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
        </button>

        <button 
          onClick={() => alert("Public Links")}
          className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-sm text-foreground"
        >
          <div className="flex items-center gap-3">
            <LinkIcon className="w-4 h-4 opacity-70" />
            <span>{t("settings.links")}</span>
          </div>
        </button>

        <div className="h-px bg-white/5 my-1" />

        <button 
          onClick={toggleTheme}
          className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-sm text-foreground"
        >
          <div className="flex items-center gap-3">
            <SunMoon className="w-4 h-4 opacity-70" />
            <span>{t("settings.appearance")}</span>
          </div>
          <ChevronRight className={cn("w-3 h-3 opacity-40", isArabic && "rotate-180")} />
        </button>

        <button 
          onClick={() => alert("Subscriptions")}
          className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-sm text-foreground"
        >
          <div className="flex items-center gap-3">
            <CreditCard className="w-4 h-4 opacity-70" />
            <span>{t("settings.subscriptions")}</span>
          </div>
        </button>

        <button 
          onClick={() => window.open('https://notebooklm.google.com', '_blank')}
          className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-sm text-foreground"
        >
          <div className="flex items-center gap-3">
            <ExternalLink className="w-4 h-4 opacity-70" />
            <span>{t("settings.notebooklm")}</span>
          </div>
        </button>

        <button 
          onClick={() => {
            const feedbackUrl = "https://support.google.com/gemini/answer/13275745";
            window.open(feedbackUrl, '_blank');
          }}
          className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-sm text-foreground"
        >
          <div className="flex items-center gap-3">
            <MessageSquareQuote className="w-4 h-4 opacity-70" />
            <span>{t("settings.feedback")}</span>
          </div>
        </button>

        <button 
          onClick={() => {
            const helpUrl = isArabic 
              ? "https://support.google.com/gemini/?hl=en" 
              : "https://support.google.com/gemini/";
            window.open(helpUrl, '_blank');
          }}
          className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-sm text-foreground"
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="w-4 h-4 opacity-70" />
            <span>{t("settings.help")}</span>
          </div>
          <ChevronRight className={cn("w-3 h-3 opacity-40", isArabic && "rotate-180")} />
        </button>
      </div>
    </div>
  );

  const SidebarContent = () => (
    <motion.div 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 288 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className={cn(
        "flex flex-col h-full bg-[#131314] backdrop-blur-xl border-r border-white/5 overflow-hidden"
      )}
    >
      {/* Header with Logo and Collapse Button */}
      <div className={cn(
        "flex items-center p-4 mb-2 relative",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent truncate whitespace-nowrap">
              joojle
            </span>
          )}
        </div>
        
        {/* Minimize Button - Desktop Only */}
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="hidden md:flex p-2 hover:bg-white/5 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            title="Minimize"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        
        {/* Expand Button - Desktop Only */}
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="hidden md:flex absolute top-4 right-2 p-1.5 hover:bg-white/5 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            title="Expand"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* New Chat Button */}
      <div className="px-4 mb-4">
        <button
          onClick={handleCreateNew}
          disabled={createChat.isPending}
          className={cn(
            "flex items-center justify-center gap-2 py-3 rounded-xl border transition-all duration-200 group overflow-hidden",
            "bg-primary/20 hover:bg-primary/30 text-primary-foreground border-primary/20",
            isCollapsed ? "w-12 px-0" : "w-full px-4",
            createChat.isPending && "opacity-50 cursor-not-allowed"
          )}
        >
          <Plus className={cn("w-5 h-5 transition-transform duration-300", !createChat.isPending && "group-hover:rotate-90")} />
          {!isCollapsed && <span className="font-semibold whitespace-nowrap">{createChat.isPending ? t("sidebar.creating") : t("sidebar.newChat")}</span>}
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 scrollbar-thin">
        {!isCollapsed && (
          <div className="text-xs font-medium text-muted-foreground px-3 py-2 uppercase tracking-wider">
            {t("sidebar.recent")}
          </div>
        )}

        {isLoading ? (
          <div className="px-3 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={cn("bg-white/5 rounded-lg animate-pulse", isCollapsed ? "h-10 w-10 mx-auto" : "h-10 w-full")} />
            ))}
          </div>
        ) : !chats || chats.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-20" />
            {!isCollapsed && t("sidebar.empty")}
          </div>
        ) : (
          chats.map((chat) => (
            <Link key={chat.id} href={`/chat/${chat.id}`}>
              <div
                className={cn(
                  "group relative flex items-center rounded-lg cursor-pointer transition-all duration-200",
                  isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-3",
                  currentChatId === chat.id
                    ? "bg-[#282a2c] text-white shadow-lg"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
                onClick={() => setIsMobileOpen(false)}
              >
                <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />

                {!isCollapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium">
                        {chat.title}
                      </div>
                      <div className="text-[10px] opacity-50 truncate">
                        {format(new Date(chat.createdAt), "MMM d, h:mm a")}
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDelete(e, chat.id)}
                      className={cn(
                        "p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100",
                        currentChatId === chat.id && "opacity-0 group-hover:opacity-100"
                      )}
                      title={t("sidebar.delete")}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-white/5 space-y-1">
        <div className="px-2">
          {isLoggedIn ? (
            <Popover>
              <PopoverTrigger asChild>
                <button className={cn(
                  "group flex items-center rounded-2xl hover:bg-white/[0.05] transition-all duration-200",
                  isCollapsed ? "p-1 justify-center" : "w-full gap-3 p-2"
                )}>
                  <div className="relative">
                    <img 
                      src={user?.user_metadata?.avatar_url || `https://avatar.iran.liara.run/public/${user?.id}`} 
                      className="w-9 h-9 rounded-full border border-white/10 group-hover:border-blue-500/50 transition-colors" 
                      alt="User" 
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#131314] rounded-full" />
                  </div>
                  {!isCollapsed && (
                    <div className="flex-1 text-left overflow-hidden">
                      <p className="text-sm font-semibold text-white/90 truncate">
                        {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                      </p>
                      <p className="text-[10px] text-white/40 truncate">Account Active</p>
                    </div>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent side={isCollapsed ? "right" : "top"} align="center" className="w-72 p-2 bg-[#1e1f20] border-white/10 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="px-4 py-3 border-b border-white/5 mb-1">
                    <p className="text-xs text-white/40 mb-1">{t("auth.signedInAs")}</p>
                    <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                  </div>
                  <button 
                    onClick={() => signOut()} 
                    className="w-full flex items-center gap-2 p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-medium"
                  >
                    <X className="w-4 h-4" />
                    {t("auth.signOut")}
                  </button>
              </PopoverContent>
            </Popover>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              disabled={isAuthLoading}
              className={cn(
                "group relative flex items-center justify-center rounded-2xl transition-all duration-300 active:scale-[0.97] overflow-hidden",
                isCollapsed ? "h-12 w-12" : "w-full py-3.5"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#4285F4] via-[#9b72cb] to-[#d96570] opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
              <div className="relative flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-white" />
                {!isCollapsed && (
                  <span className="text-sm font-bold text-white tracking-wide">
                    {isAuthLoading ? t("auth.loading") : t("auth.getStarted")}
                  </span>
                )}
              </div>
            </button>
          )}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(
              "flex items-center rounded-xl hover:bg-white/5 text-sm text-muted-foreground hover:text-foreground transition-all active:scale-[0.98]",
              isCollapsed ? "p-3 justify-center" : "w-full gap-3 px-4 py-3"
            )}>
              <Settings className="w-4 h-4" />
              {!isCollapsed && <span className="font-medium">{t("settings.title")}</span>}
            </button>
          </PopoverTrigger>
          <PopoverContent side={isCollapsed ? "right" : "top"} align="center" className="p-0 border-none bg-transparent shadow-none" sideOffset={10}>
            <SettingsMenu />
          </PopoverContent>
        </Popover>

        {!isCollapsed && (
          <div className="px-4 py-2 text-[10px] text-muted-foreground/40 text-center uppercase tracking-widest">
            {t("sidebar.footer")}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="md:hidden fixed top-4 left-4 z-50 flex items-center gap-2">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2.5 bg-[#131314] border border-white/10 rounded-xl shadow-lg text-foreground active:scale-95 transition-transform"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <motion.div 
        initial={false}
        animate={{ width: isCollapsed ? 80 : 288 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={cn(
          "hidden md:block h-screen fixed left-0 top-0 bottom-0 z-30 overflow-hidden"
        )}
      >
        <SidebarContent />
      </motion.div>

      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: isArabic ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: isArabic ? "100%" : "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn(
                "fixed inset-y-0 w-72 z-50 md:hidden bg-card",
                isArabic ? "right-0" : "left-0"
              )}
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}