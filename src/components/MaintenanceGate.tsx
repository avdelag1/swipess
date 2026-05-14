import React, { startTransition, useState, useEffect } from "react";
import { Lock, ArrowRight, ChevronDown, MessageSquare, Send, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "swipess_promo_unlocked";
const SESSION_KEY = "swipess_promo_session_unlocked";
const PROMO_CODE = "URDBEST";

const normalizeCode = (value: string) =>
  value
    .normalize("NFKC")
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase();

const persistUnlock = () => {
  try { localStorage.setItem(STORAGE_KEY, "true"); } catch { /* ignore */ }
  try { sessionStorage.setItem(SESSION_KEY, "true"); } catch { /* ignore */ }
  try { document.cookie = `${STORAGE_KEY}=true; path=/; max-age=31536000; SameSite=Lax`; } catch { /* ignore */ }
};

const hasPersistedUnlock = () => {
  try {
    if (localStorage.getItem(STORAGE_KEY) === "true") return true;
  } catch { /* ignore */ }
  try {
    if (sessionStorage.getItem(SESSION_KEY) === "true") return true;
  } catch { /* ignore */ }
  try {
    return document.cookie.split(";").some((item) => item.trim() === `${STORAGE_KEY}=true`);
  } catch {
    return false;
  }
};

const hasTrustedPublicEntry = () => {
  if (typeof window === "undefined") return false;
  const { pathname, search } = window.location;
  const params = new URLSearchParams(search);
  const returnTo = params.get("returnTo");
  const intent = params.get("intent");
  return pathname.startsWith("/listing/") || pathname.startsWith("/profile/") || (!!returnTo && !!intent);
};

interface RequestForm {
  name: string;
  email: string;
  whatsapp: string;
  message: string;
}

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    return hasPersistedUnlock() || hasTrustedPublicEntry();
  });
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  // Request form state
  const [showRequest, setShowRequest] = useState(false);
  const [form, setForm] = useState<RequestForm>({ name: "", email: "", whatsapp: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (unlocked) persistUnlock();
  }, [unlocked]);

  if (unlocked) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (normalizeCode(code) === PROMO_CODE) {
      persistUnlock();
      setError(false);
      startTransition(() => setUnlocked(true));
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      if ("vibrate" in navigator) navigator.vibrate(40);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const { error: dbError } = await supabase
        .from("code_requests" as any)
        .insert({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          whatsapp: form.whatsapp.trim() || null,
          message: form.message.trim() || null,
        });
      if (dbError) throw dbError;
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateForm = (field: keyof RequestForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="min-h-[100dvh] flex items-start justify-center px-6 py-12 bg-background relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 20%, hsl(var(--primary) / 0.18) 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, hsl(var(--primary) / 0.12) 0%, transparent 55%)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo + lock icon */}
        <div className="flex flex-col items-center text-center mb-8">
          <img
            src="/icons/Swipess-wordmark-white.svg"
            alt="Swipess"
            className="h-7 mb-8 opacity-90"
            draggable={false}
          />
          <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center mb-5 shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
            <Lock className="w-7 h-7 text-foreground" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Private Access</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Enter your promo code to unlock the app.
          </p>
        </div>

        {/* Code form */}
        <motion.form
          onSubmit={handleSubmit}
          animate={shake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
          transition={{ duration: 0.45 }}
          className="space-y-3"
        >
          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value); if (error) setError(false); }}
            placeholder="PROMO CODE"
            autoFocus
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="w-full h-14 rounded-2xl bg-card border border-border focus:border-primary/60 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)] px-5 text-center text-foreground text-lg font-semibold tracking-[0.3em] uppercase placeholder:text-muted-foreground/40 placeholder:tracking-[0.3em] outline-none transition-all"
          />

          {error && (
            <p className="text-xs text-destructive text-center">
              Invalid code. Please try again.
            </p>
          )}

          <button
            type="submit"
            disabled={!code.trim()}
            className="w-full h-14 rounded-2xl bg-foreground text-background font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.97] transition-transform disabled:opacity-40 disabled:active:scale-100"
          >
            Unlock
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.form>

        {/* Request access toggle */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <motion.button
            onClick={() => setShowRequest(v => !v)}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span>{showRequest ? "Hide request form" : "Don't have a code? Request access"}</span>
            <motion.span
              animate={{ rotate: showRequest ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="shrink-0"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.span>
          </motion.button>

          {/* Pulsing dot + bouncing arrow when form is hidden */}
          <AnimatePresence>
            {!showRequest && (
              <motion.div
                key="arrow-hint"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center gap-1"
              >
                <motion.div
                  animate={{ y: [0, 7, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
                  className="w-7 h-7 rounded-full border border-primary/25 bg-primary/8 flex items-center justify-center shadow-[0_0_12px_rgba(var(--primary-rgb,255,77,0)/0.18)]"
                >
                  <ChevronDown className="w-3.5 h-3.5 text-primary/60" />
                </motion.div>
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="w-1 h-1 rounded-full bg-primary/40"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Request form */}
        <AnimatePresence initial={false}>
          {showRequest && (
            <motion.div
              key="request-form"
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              style={{ transformOrigin: "top center" }}
            >
              <div className="mt-5 rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <MessageSquare className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">Request Access</p>
                    <p className="text-[10px] text-muted-foreground">We'll send your code within 24 h</p>
                  </div>
                </div>

                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-2 py-4 text-center"
                  >
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                    <p className="text-sm font-semibold text-foreground">Request sent!</p>
                    <p className="text-xs text-muted-foreground">We'll reach out to you soon.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleRequestSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1 block">
                          Name <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={updateForm("name")}
                          placeholder="Your name"
                          required
                          className="w-full h-10 rounded-xl bg-background border border-border px-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/60 focus:shadow-[0_0_0_2px_hsl(var(--primary)/0.12)] transition-all"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1 block">
                          Email <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={updateForm("email")}
                          placeholder="your@email.com"
                          required
                          className="w-full h-10 rounded-xl bg-background border border-border px-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/60 focus:shadow-[0_0_0_2px_hsl(var(--primary)/0.12)] transition-all"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1 block">
                          WhatsApp <span className="text-muted-foreground/50">(optional)</span>
                        </label>
                        <input
                          type="tel"
                          value={form.whatsapp}
                          onChange={updateForm("whatsapp")}
                          placeholder="+1 555 000 0000"
                          className="w-full h-10 rounded-xl bg-background border border-border px-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/60 focus:shadow-[0_0_0_2px_hsl(var(--primary)/0.12)] transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1 block">
                        Tell us more <span className="text-muted-foreground/50">(optional)</span>
                      </label>
                      <textarea
                        value={form.message}
                        onChange={updateForm("message")}
                        placeholder="Who are you, what are you looking for, or anything you'd like us to know…"
                        rows={3}
                        className="w-full rounded-xl bg-background border border-border px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/60 focus:shadow-[0_0_0_2px_hsl(var(--primary)/0.12)] transition-all resize-none"
                      />
                    </div>

                    {submitError && (
                      <p className="text-xs text-destructive text-center">{submitError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting || !form.name.trim() || !form.email.trim()}
                      className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform disabled:opacity-40 disabled:active:scale-100"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          Request Code
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-[10px] text-muted-foreground/60 text-center mt-8 uppercase tracking-[0.3em]">
          Invite Only · Swipess
        </p>
      </motion.div>
    </div>
  );
}

export default MaintenanceGate;
