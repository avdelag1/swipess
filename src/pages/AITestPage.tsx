import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Zap, AlertCircle, CheckCircle, Lock, Trash2, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { SwipessLogo } from "@/components/SwipessLogo";
import { haptics } from "@/utils/microPolish";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  provider?: string;
  error?: boolean;
  ts: number;
}

const AITestPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [providerUsed, setProviderUsed] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    haptics.tap();
    const userMsg: Message = { role: "user", content: text, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setStatus("idle");

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke("ai-orchestrator", {
        body: {
          task: "chat",
          data: { messages: history },
        },
      });

      if (error) throw new Error(error.message || "Function error");
      if (data?.error) throw new Error(data.error);

      const reply = data?.result?.text || data?.result?.message || data?.message || "(no response)";
      const provider = data?.provider_used || data?.provider || "unknown";

      setProviderUsed(provider);
      setStatus("ok");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, provider, ts: Date.now() },
      ]);
    } catch (err: any) {
      setStatus("error");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Connection Error: ${err.message}`,
          error: true,
          ts: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <Lock className="w-12 h-12 text-zinc-800 mb-6" />
        <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Test Console Locked</h2>
        <p className="text-sm font-bold text-muted-foreground max-w-xs mb-8">
          Sign in required to access the marketplace AI orchestration engine.
        </p>
        <button onClick={() => navigate('/')} className="px-10 py-4 rounded-2xl bg-brand-primary text-white text-xs font-black uppercase tracking-widest">
          Go Login
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen flex flex-col overflow-hidden bg-background">
      {/* Background Polish & Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px] animate-pulse-subtle" />
        <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-pink-500/10 rounded-full blur-[80px] animate-float-slow" />
        <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/5 to-transparent" />
      </div>

      <div className="relative z-10 w-full flex-1 flex flex-col px-4 pt-[calc(var(--safe-top)+16px)] pb-32 max-w-2xl mx-auto view-enter-premium">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex flex-col">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors w-fit"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Main Hub
            </motion.button>
            <div className="flex items-center gap-3">
              <SwipessLogo size="sm" className="drop-shadow-glow" />
              <div>
                <h1 className="text-xl font-black tracking-tighter text-foreground flex items-center gap-1.5 uppercase italic">
                  Oracle <span className="text-primary not-italic">Test</span>
                </h1>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                  AI Diagnostic Interface 2.0
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {status === "ok" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-tight"
              >
                {providerUsed} ONLINE
              </motion.div>
            )}
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 transition-all active:scale-90"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 space-y-4 mb-8 min-h-[300px]">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 bg-white/[0.02] border border-white/[0.05] rounded-[32px] backdrop-blur-sm"
            >
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <Bot className="relative w-full h-full text-primary drop-shadow-glow" />
              </div>
              <h2 className="text-lg font-black tracking-tight text-white mb-2 uppercase italic">Awaiting Commands</h2>
              <p className="text-xs text-zinc-500 font-medium max-w-[240px] mx-auto leading-relaxed uppercase tracking-widest opacity-60">
                The Swipess Oracle is online. <br /> AI Orchestration Engine Ready.
              </p>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.ts}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}

                <div
                  className={cn(
                    "relative max-w-[85%] rounded-[24px] px-5 py-3.5 text-sm font-semibold leading-relaxed transition-all shadow-xl",
                    msg.role === "user"
                      ? "bg-gradient-to-br from-primary to-primary/80 text-white rounded-br-none shadow-primary/20"
                      : msg.error
                        ? "bg-red-500/10 border border-red-500/30 text-red-300 rounded-bl-none backdrop-blur-md"
                        : "bg-white/5 border border-white/10 text-white rounded-bl-none backdrop-blur-xl"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.provider && !msg.error && (
                    <div className="flex items-center gap-1 mt-2.5 opacity-40 uppercase tracking-tighter text-[9px] font-black">
                      <Zap className="w-2.5 h-2.5" />
                      <span>Processed via {msg.provider}</span>
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-zinc-700 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-zinc-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 justify-start"
            >
              <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="bg-black/60 border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3 backdrop-blur-xl">
                <div className="flex gap-1.5 items-center h-4">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                      transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Massive Input Card - Fixed Bottom */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/90 to-transparent pt-12 pb-[calc(var(--safe-bottom)+16px)]">
          <div className="max-w-2xl mx-auto group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-pink-500 rounded-[2rem] blur opacity-20 group-focus-within:opacity-40 transition-opacity" />
            <div className="relative rounded-[2rem] bg-zinc-900/60 backdrop-blur-3xl border border-white/10 overflow-hidden shadow-2xl p-1.5">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Prompt the Oracle Engine…"
                rows={2}
                className="w-full bg-transparent px-6 pt-5 pb-3 text-sm text-white placeholder:text-white/20 resize-none outline-none font-bold italic uppercase tracking-tight"
                disabled={loading}
              />
              <div className="px-4 pb-4 flex justify-between items-center">
                <div className="flex items-center gap-2 pl-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-widest italic">Live Engine</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest disabled:opacity-20 transition-all hover:bg-primary hover:text-white"
                >
                  {loading ? "Processing…" : "Execute"}
                  <ChevronRight className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITestPage;
