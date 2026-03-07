import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Zap, AlertCircle, CheckCircle, Lock } from "lucide-react";
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
  const { theme } = useTheme();
  const isDark = theme !== 'white-matte';
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

      // The edge function returns { result: { text, message }, provider_used }
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
          content: `Error: ${err.message}`,
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

  const clearChat = () => {
    setMessages([]);
    setStatus("idle");
    setProviderUsed(null);
  };

  // The AI orchestrator edge function requires authentication
  if (!user) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center px-6 py-12 max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 rounded-[2.5rem] bg-secondary/50 border border-border/50 flex items-center justify-center mb-6 backdrop-blur-xl">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-3 tracking-tight">Access Restricted</h2>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          The Swipess AI Intelligence Suite requires authentication. Please sign in to interact with the neural engine.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-8 px-8 py-3 rounded-full bg-primary text-white text-sm font-black uppercase tracking-widest hover:scale-105 transition-transform"
        >
          Authenticate
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col bg-background transition-colors duration-500">
      <div className="flex-1 flex flex-col px-4 py-8 pb-40 max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              Neural Engine
            </h1>
            <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
              Real-time Diagnostic Console
            </p>
          </div>

          <div className="flex items-center gap-3">
            {status === "ok" && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {providerUsed}
              </div>
            )}
            {status === "error" && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase">
                <AlertCircle className="w-3.5 h-3.5" />
                System Offline
              </div>
            )}
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all px-3 py-1.5 rounded-full bg-secondary/50"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-6 mb-8">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center space-y-4"
            >
              <div className="w-24 h-24 rounded-[3rem] bg-secondary flex items-center justify-center">
                <Bot className="w-10 h-10 text-primary opacity-50" />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">How can I assist you?</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-[240px] leading-relaxed">
                  Query the Swipess Neural Network. MiniMax-6b & Gemini clusters are online.
                </p>
              </div>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.ts}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[85%] rounded-[1.8rem] px-5 py-4 text-[13px] sm:text-sm leading-relaxed font-bold shadow-sm",
                    msg.role === "user"
                      ? "bg-primary text-white rounded-tr-sm"
                      : msg.error
                        ? "bg-red-500/10 border border-red-500/20 text-red-500 rounded-tl-sm"
                        : isDark
                          ? "bg-white/[0.03] border border-white/5 text-white/90 rounded-tl-sm backdrop-mirror"
                          : "bg-black/[0.02] border border-black/5 text-black/90 rounded-tl-sm"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.provider && !msg.error && (
                    <div className="flex items-center gap-1.5 mt-3 opacity-40">
                      <Zap className="w-2.5 h-2.5" />
                      <span className="text-[10px] font-black uppercase tracking-tighter">Diagnostic: {msg.provider}</span>
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 mt-1 border border-border/10">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-4 justify-start items-start"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 animate-pulse">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div className={cn("rounded-[1.8rem] px-6 py-4 rounded-tl-sm", isDark ? "bg-white/[0.03]" : "bg-black/[0.02]")}>
                <div className="flex gap-1.5 items-center h-4">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                      animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input - Sticky floating bar */}
        <div className="fixed bottom-32 left-4 right-4 max-w-3xl mx-auto z-50">
          <div className={cn(
            "rounded-[2.5rem] border border-white/10 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden transition-all duration-500",
            isDark ? "bg-[#0a0a0c]/80" : "bg-white/95 border-black/5"
          )}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Neural query interface…"
              rows={1}
              className="w-full bg-transparent px-8 pt-6 pb-2 text-sm text-foreground placeholder:text-muted-foreground/40 resize-none outline-none font-bold"
              disabled={loading}
            />
            <div className="px-6 pb-4 flex justify-between items-center">
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Ready
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.93 }}
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-30 disabled:grayscale transition-all shadow-xl shadow-primary/20"
              >
                <Send className="w-3.5 h-3.5" />
                Transmit
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITestPage;
