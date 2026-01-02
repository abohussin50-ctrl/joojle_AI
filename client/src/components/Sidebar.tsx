import { Link, useLocation } from "wouter";
import { useChats, useCreateChat, useDeleteChat } from "@/hooks/use-chat";
import { Plus, MessageSquare, Trash2, Menu, X, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Sidebar() {
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
    createChat.mutate("New Conversation");
    setIsMobileOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Delete this chat?")) {
      deleteChat.mutate(id);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-secondary/30 backdrop-blur-xl border-r border-white/5">
      {/* Header */}
      <div className="p-4">
        <button
          onClick={handleCreateNew}
          disabled={createChat.isPending}
          className="w-full flex items-center justify-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary-foreground py-3 px-4 rounded-xl border border-primary/20 transition-all duration-200 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          <span className="font-semibold">{createChat.isPending ? "Creating..." : "New Chat"}</span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 scrollbar-thin">
        <div className="text-xs font-medium text-muted-foreground px-3 py-2 uppercase tracking-wider">
          Recent
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
            No chats yet. Start a new conversation!
          </div>
        ) : (
          chats?.map((chat) => (
            <Link key={chat.id} href={`/chat/${chat.id}`}>
              <div
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200",
                  currentChatId === chat.id
                    ? "bg-white/10 text-white shadow-lg shadow-black/5"
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
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5 text-xs text-muted-foreground text-center">
        <p>joojle AI &copy; 2025</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 bg-card border border-white/10 rounded-lg shadow-lg text-foreground"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
