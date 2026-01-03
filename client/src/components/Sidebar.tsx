import { Link, useLocation } from "wouter";
import { useChats, useCreateChat, useDeleteChat } from "@/hooks/use-chat";
import { Plus, MessageSquare, Trash2, Menu, X, Sparkles, Settings, History, UserRound, Puzzle, Link as LinkIcon, SunMoon, CreditCard, ExternalLink, MessageSquareQuote, HelpCircle, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { useLanguage } from "@/hooks/use-language";

export function Sidebar() {
  const { t, isArabic } = useLanguage();
  const [location] = useLocation();
  const { data: chats, isLoading } = useChats();
  const createChat = useCreateChat();
  const deleteChat = useDeleteChat();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Extract ID from path: /chat/123 -> 123
  const currentChatId = location.startsWith("/chat/") 
    ? parseInt(location.split("/")[2]) 
    : null;

  const handleCreateNew = () => {
    createChat.mutate(t("sidebar.newChat"));
    setIsMobileOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(t("sidebar.delete") + "?")) {
      deleteChat.mutate(id);
    }
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
          onClick={() => alert("Appearance settings")}
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
          onClick={() => alert("Send feedback")}
          className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-sm text-foreground"
        >
          <div className="flex items-center gap-3">
            <MessageSquareQuote className="w-4 h-4 opacity-70" />
            <span>{t("settings.feedback")}</span>
          </div>
        </button>

        <button 
          onClick={() => alert("Help Center")}
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
    <div className="flex flex-col h-full bg-[#131314] backdrop-blur-xl border-r border-white/5">
      {/* Header */}
      <div className="p-4">
        <button
          onClick={handleCreateNew}
          disabled={createChat.isPending}
          className="w-full flex items-center justify-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary-foreground py-3 px-4 rounded-xl border border-primary/20 transition-all duration-200 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          <span className="font-semibold">{createChat.isPending ? t("sidebar.creating") : t("sidebar.newChat")}</span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 scrollbar-thin">
        <div className="text-xs font-medium text-muted-foreground px-3 py-2 uppercase tracking-wider">
          {t("sidebar.recent")}
        </div>
        
        {isLoading ? (
          <div className="px-3 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : chats?.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-20" />
            {t("sidebar.empty")}
          </div>
        ) : (
          chats?.map((chat) => (
            <Link key={chat.id} href={`/chat/${chat.id}`}>
              <div
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200",
                  currentChatId === chat.id
                    ? "bg-[#282a2c] text-white shadow-lg"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
                onClick={() => setIsMobileOpen(false)}
              >
                <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">
                    {chat.title}
                  </div>
                  <div className="text-[10px] opacity-50 truncate">
                    {format(new Date(chat.createdAt), "MMM d, h:mm a")}
                  </div>
                </div>

                {/* Delete button appears on hover or if active */}
                <button
                  onClick={(e) => handleDelete(e, chat.id)}
                  className={cn(
                    "absolute right-2 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100",
                    currentChatId === chat.id && "opacity-0 group-hover:opacity-100" // Keep clean when active unless hovering
                  )}
                  title={t("sidebar.delete")}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-white/5 space-y-1">
        <Popover>
          <PopoverTrigger asChild>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-sm text-muted-foreground hover:text-foreground transition-all active:scale-[0.98]">
              <Settings className="w-4 h-4" />
              <span className="font-medium">{t("settings.title")}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent side="right" align="end" className="p-0 border-none bg-transparent shadow-none" sideOffset={10}>
            <SettingsMenu />
          </PopoverContent>
        </Popover>

        <div className="px-4 py-2 text-[10px] text-muted-foreground/40 text-center uppercase tracking-widest">
          {t("sidebar.footer")}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50 flex items-center gap-2">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2.5 bg-[#131314] border border-white/10 rounded-xl shadow-lg text-foreground active:scale-95 transition-transform"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-72 h-screen fixed left-0 top-0 bottom-0 z-30">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
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
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 z-50 md:hidden bg-card"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
