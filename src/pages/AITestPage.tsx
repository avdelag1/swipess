import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Zap, AlertCircle, CheckCircle, Lock } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  provider?: string;
  error?: boolean;
  ts: number;
}

const AITestPage = () => {
  const { user } = useAuth();
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
      <div className="w-full min-h-full flex flex-col items-center justify-center px-4 py-12 max-w-2xl mx-auto text-center">
        <div className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center mb-4">
          <Lock className="w-6 h-6 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-black text-foreground mb-2">Sign in required</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          The AI test console requires an account. Please sign in to test the AI engine.
        </p>
        <a
          href="/"
          className="mt-5 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold inline-block"
        >
          Go to Sign In
        </a>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full flex flex-col px-4 py-4 pb-32 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            AI Test Console
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Send any question to the AI engine — test connectivity &amp; responses
          </p>
        </div>

        <div className="flex items-center gap-2">
          {status === "ok" && (
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              {providerUsed}
            </div>
          )}
          {status === "error" && (
            <div className="flex items-center gap-1 text-red-400 text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
              failed
            </div>
          )}
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 mb-4 min-h-[200px]">
        {messages.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Bot className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Ask anything</p>
            <p className="text-xs mt-1">The AI will respond using MiniMax (fallback: Gemini)</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.ts}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed font-medium ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-br-sm"
                    : msg.error
                    ? "bg-red-950/60 border border-red-500/30 text-red-300 rounded-bl-sm"
                    : "bg-secondary border border-border text-foreground/90 rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.provider && !msg.error && (
                  <p className="text-[10px] text-muted-foreground mt-1.5">via {msg.provider}</p>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
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
            <div className="bg-secondary border border-border rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="rounded-2xl bg-card border border-border backdrop-blur-xl overflow-hidden">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type any question… (Enter to send, Shift+Enter for newline)"
          rows={2}
          className="w-full bg-transparent px-4 pt-3 pb-2 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none font-medium"
          disabled={loading}
        />
        <div className="px-3 pb-3 flex justify-between items-center">
          <span className="text-[10px] text-muted-foreground">
            {messages.filter((m) => m.role === "assistant" && !m.error).length} successful replies
          </span>
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-black disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default AITestPage;
