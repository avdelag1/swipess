import React, { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "Swipess_maintenance_unlocked_v1";
const REQUIRED_TAPS = 8;
const TAP_RESET_MS = 1500;

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(STORAGE_KEY) === "true";
  });
  const taps = useRef(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // While locked: fix the browser tab title and reset the URL to /
  useEffect(() => {
    if (unlocked) return;
    document.title = "Swipess";
    if (window.location.pathname !== "/") {
      window.history.replaceState(null, "", "/");
    }
  }, [unlocked]);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  if (unlocked) {
    return <>{children}</>;
  }

  const handleLogoTap = () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);

    taps.current += 1;
    if (taps.current >= REQUIRED_TAPS) {
      taps.current = 0;
      try {
        sessionStorage.setItem(STORAGE_KEY, "true");
      } catch {
        // ignore
      }
      setUnlocked(true);
      return;
    }

    resetTimer.current = setTimeout(() => {
      taps.current = 0;
    }, TAP_RESET_MS);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
        userSelect: "none",
        WebkitUserSelect: "none",
        overflow: "hidden",
      }}
    >
      {/* Subtle ambient glow behind logo */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "60vw",
          height: "60vw",
          maxWidth: 420,
          maxHeight: 420,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(220,38,38,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Wordmark logo — tap 8× to unlock */}
      <button
        type="button"
        aria-label="Swipess"
        onClick={handleLogoTap}
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "default",
          outline: "none",
          WebkitTapHighlightColor: "transparent",
          position: "relative",
          zIndex: 1,
        }}
      >
        <img
          src="/icons/Swipess-wordmark-white.svg"
          alt="Swipess"
          draggable={false}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "/icons/Swipess-wordmark-white.png";
          }}
          style={{
            width: "min(72vw, 320px)",
            height: "auto",
            pointerEvents: "none",
            filter: "drop-shadow(0 2px 24px rgba(255,255,255,0.08))",
          }}
        />
      </button>

      {/* Minimal message */}
      <p
        style={{
          marginTop: "3rem",
          color: "rgba(255,255,255,0.45)",
          fontSize: "clamp(0.75rem, 2.5vw, 0.9rem)",
          fontWeight: 600,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
        }}
      >
        Maintenance in progress &mdash; back in 24h
      </p>
    </div>
  );
}

export default MaintenanceGate;
