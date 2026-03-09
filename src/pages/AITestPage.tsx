import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Zap, AlertCircle, CheckCircle, Lock, Trash2, Sparkles, ChevronLeft } from "lucide-react";
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
    <div className="w-full min-h-screen bg-background flex flex-col pb-32 overflow-x-hidden">
      {/* Background Polish */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-brand-accent-2/5 to-transparent" />
      </div>

      <div className="relative w-full max-w-lg mx-auto flex flex-col flex-1 px-4 pt-[calc(56px+var(--safe-top)+1.5rem)] sm:px-6">

        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Main Hub
            </motion.button>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-brand-accent-2" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                AI Orchestrator
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-white">Test Lab</h1>
          </div>

          <div className="flex items-center gap-3 mb-1">
            {status === "ok" && (
              <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[9px] uppercase tracking-widest">
                {providerUsed} ONLINE
              </Badge>
            )}
            {messages.length > 0 && (
              <button onClick={() => setMessages([])} className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 space-y-4 mb-8 min-h-[300px]">
          {messages.length === 0 && (
            <div className="text-center py-24 px-12 bg-white/[0.02] border border-dashed border-white/5 rounded-[3rem]">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bot className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Engine Ready</p>
              <p className="text-[11px] font-bold text-muted-foreground/60 leading-relaxed uppercase">
                Send a sample listing prompt or ask a local question to test MiniMax & Gemini orchestration.
              </p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.ts}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-[1.75rem] px-5 py-4 text-sm font-bold leading-relaxed shadow-lg",
                    msg.role === "user"
                      ? "bg-brand-primary text-white rounded-br-md"
                      : msg.error
                        ? "bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-bl-md"
                        : "bg-black/60 border border-white/5 text-white/90 rounded-bl-md backdrop-blur-xl"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.provider && !msg.error && (
                    <div className="mt-3 flex items-center gap-1.5 opacity-40">
                      <Zap className="w-2.5 h-2.5" />
                      <span className="text-[9px] font-black uppercase tracking-widest">{msg.provider}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <div className="flex justify-start gap-3">
              <div className="bg-black/60 border border-white/5 rounded-[1.5rem] px-5 py-4 backdrop-blur-xl">
                <div className="flex gap-1.5 items-center">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-brand-accent-2"
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                      transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Massive Input Card */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary to-brand-accent-2 rounded-[2rem] blur opacity-20 group-focus-within:opacity-40 transition-opacity" />
          <div className="relative rounded-[2rem] bg-black/80 backdrop-blur-3xl border border-white/10 overflow-hidden">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Prompt the AI Engine…"
              rows={2}
              className="w-full bg-transparent px-6 pt-5 pb-3 text-sm text-white placeholder:text-white/20 resize-none outline-none font-bold"
              disabled={loading}
            />
            <div className="px-4 pb-4 flex justify-between items-center">
              <div className="flex items-center gap-2 pl-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Ready</span>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest disabled:opacity-20 transition-all hover:bg-brand-accent-2 hover:text-white"
              >
                Send Message
              </motion.button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AITestPage;
