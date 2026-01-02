import { useCreateChat } from "@/hooks/use-chat";
import { Sidebar } from "@/components/Sidebar";
import { Sparkles, ArrowRight, MessageSquareText, Zap, Shield } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export function Home() {
  const createChat = useCreateChat();
  const [prompt, setPrompt] = useState("");
  const [, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      createChat.mutate(prompt, {
        onSuccess: (chat) => {
          setLocation(`/chat/${chat.id}`, {
            state: { message: prompt },
          });
        },
      });
    }
  };

  const handleSuggestionClick = (text: string) => {
    setPrompt(text);
    createChat.mutate(text, {
      onSuccess: (chat) => {
        setLocation(`/chat/${chat.id}`, {
          state: { message: text },
        });
      },
    });
  };

  const suggestions = [
    "Explain quantum computing in simple terms",
    "Write a Python script to scrape a website",
    "Give me 5 creative date ideas for a rainy day",
    "Draft a professional email to my boss"
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
              <span>Powered by Advanced AI</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight">
              <span className="text-gradient">joojle AI</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Your intelligent creative partner. Ask anything, get answers, and spark new ideas instantly.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="w-full max-w-2xl"
          >
            <form onSubmit={handleSubmit} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-500"></div>

              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Message joojle AI..."
                className="relative w-full bg-card/90 backdrop-blur-xl text-foreground placeholder:text-muted-foreground/50 border-0 rounded-2xl py-4 pl-6 pr-14 shadow-2xl focus:ring-0 text-lg"
                disabled={createChat.isPending}
              />

              <button
                type="submit"
                disabled={!prompt.trim() || createChat.isPending}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary/20 text-primary hover:bg-primary hover:text-white rounded-xl transition-all disabled:opacity-0 disabled:scale-90"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </motion.div>

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
              <Zap className="w-4 h-4" /> Fast
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" /> Secure
            </div>
            <div className="flex items-center gap-2">
              <MessageSquareText className="w-4 h-4" /> Smart
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default Home;
