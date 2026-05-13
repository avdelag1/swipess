export function GestureHints({ hidden = false }: { hidden?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300"
      style={{ opacity: hidden ? 0 : 1 }}
    >
      {/* Top-center grab pill — "pull down to close" affordance */}
      <div
        className="absolute left-1/2 -translate-x-1/2 animate-gesture-breathe"
        style={{ top: 10 }}
      >
        <div
          className="rounded-full"
          style={{
            width: 36,
            height: 4,
            background: 'rgba(255,255,255,0.45)',
            boxShadow: '0 0 8px rgba(255,255,255,0.18)',
          }}
        />
      </div>
    </div>
  );
}