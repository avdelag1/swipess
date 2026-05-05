import React, { useState, useEffect } from "react";
import { Lock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const STORAGE_KEY = "swipess_promo_unlocked";
const PROMO_CODE = "URD BEST";

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (unlocked) {
      try { localStorage.setItem(STORAGE_KEY, "true"); } catch { /* ignore */ }
    }
  }, [unlocked]);

  if (unlocked) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().toUpperCase() === PROMO_CODE) {
      setError(false);
      setUnlocked(true);
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      if ('vibrate' in navigator) navigator.vibrate(40);
    }
  };

  return (
    <div className="min-h-screen min-h-dvh flex items-center justify-center px-6 bg-background relative overflow-hidden">
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
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Private Access
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Enter your promo code to unlock the app.
          </p>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          animate={shake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
          transition={{ duration: 0.45 }}
          className="space-y-3"
        >
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (error) setError(false);
            }}
            placeholder="PROMO CODE"
            autoFocus
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className={`w-full h-14 rounded-2xl bg-card border px-5 text-center text-foreground text-lg font-semibold tracking-[0.3em] uppercase placeholder:text-muted-foreground/40 placeholder:tracking-[0.3em] outline-none transition-all ${
              error
                ? "border-destructive shadow-[0_0_0_3px_hsl(var(--destructive)/0.18)]"
                : "border-border focus:border-primary/60 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]"
            }`}
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

        <p className="text-[10px] text-muted-foreground/60 text-center mt-8 uppercase tracking-[0.3em]">
          Invite Only · Swipess
        </p>
      </motion.div>
    </div>
  );
}

export default MaintenanceGate;
