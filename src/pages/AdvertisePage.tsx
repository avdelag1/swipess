import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Megaphone, Sparkles, Star, Zap, Calendar, Music, Utensils, Dumbbell, Palette, ShoppingBag, Globe, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { haptics } from "@/utils/microPolish";
import { toast } from "@/components/ui/sonner";

// ── Pricing packages ──────────────────────────────────────────────────────────
const PACKAGES = [
  {
    id: "starter",
    name: "Starter",
    icon: <Zap className="w-5 h-5" />,
    color: "#22c55e",
    colorRgb: "34,197,94",
    prices: { week: 50, month: 150, quarter: 350 },
    perks: ["Basic listing", "1 photo", "Standard placement", "Email support"],
  },
  {
    id: "growth",
    name: "Growth",
    icon: <Star className="w-5 h-5" />,
    color: "#f97316",
    colorRgb: "249,115,22",
    prices: { week: 99, month: 250, quarter: 580 },
    perks: ["Featured badge", "Up to 5 photos", "Priority placement", "Chat support"],
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    icon: <Sparkles className="w-5 h-5" />,
    color: "#a855f7",
    colorRgb: "168,85,247",
    prices: { week: 199, month: 499, quarter: 1150 },
    perks: ["Top of feed", "Unlimited photos", "Push notification blast", "Dedicated manager"],
  },
];

const MXN_TO_USD = 0.052; // approx

const EVENT_TYPES = [
  { id: "music", label: "Music / DJ Night", icon: <Music className="w-4 h-4" /> },
  { id: "food", label: "Food & Drinks", icon: <Utensils className="w-4 h-4" /> },
  { id: "fitness", label: "Fitness / Wellness", icon: <Dumbbell className="w-4 h-4" /> },
  { id: "art", label: "Art / Culture", icon: <Palette className="w-4 h-4" /> },
  { id: "market", label: "Market / Pop-up", icon: <ShoppingBag className="w-4 h-4" /> },
  { id: "other", label: "Other / Service", icon: <Globe className="w-4 h-4" /> },
];

const DURATIONS = [
  { id: "week", label: "1 Week" },
  { id: "month", label: "1 Month" },
  { id: "quarter", label: "3 Months" },
];

type Step = "type" | "details" | "package" | "confirm";

interface FormData {
  eventType: string;
  title: string;
  description: string;
  date: string;
  location: string;
  contactName: string;
  contactPhone: string;
  website: string;
  packageId: string;
  duration: "week" | "month" | "quarter";
}

const INITIAL: FormData = {
  eventType: "",
  title: "",
  description: "",
  date: "",
  location: "",
  contactName: "",
  contactPhone: "",
  website: "",
  packageId: "growth",
  duration: "month",
};

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? 60 : -60, opacity: 0 }),
};

export default function AdvertisePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("type");
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const steps: Step[] = ["type", "details", "package", "confirm"];
  const stepIdx = steps.indexOf(step);
  const progress = ((stepIdx + 1) / steps.length) * 100;

  const goTo = (s: Step) => {
    setDir(steps.indexOf(s) > stepIdx ? 1 : -1);
    setStep(s);
  };
  const next = () => { haptics.tap(); goTo(steps[stepIdx + 1]); };
  const back = () => { haptics.tap(); goTo(steps[stepIdx - 1]); };

  const set = (field: keyof FormData, val: string) => setForm(f => ({ ...f, [field]: val }));

  const selectedPkg = PACKAGES.find(p => p.id === form.packageId)!;
  const price = selectedPkg?.prices[form.duration];
  const priceUsd = (price * MXN_TO_USD).toFixed(0);

  const handleSubmit = async () => {
    if (submitting) return;
    haptics.success();
    setSubmitting(true);
    try {
      const { error } = await supabase.from("business_promo_submissions" as any).insert({
        user_id: user?.id,
        event_type: form.eventType,
        title: form.title,
        description: form.description,
        event_date: form.date || null,
        location: form.location,
        contact_name: form.contactName,
        contact_phone: form.contactPhone,
        website: form.website || null,
        package_id: form.packageId,
        duration: form.duration,
        price_mxn: price,
        status: "pending",
      });
      if (error) throw error;
      setDone(true);
    } catch (err: any) {
      toast.error("Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#f97316,#a855f7)" }}
        >
          <Check className="w-12 h-12 text-white" />
        </motion.div>
        <h2 className="text-2xl font-black">You're on the list! 🎉</h2>
        <p className="text-muted-foreground max-w-xs">
          Our team will review your submission and contact you within 24 hours to confirm your promotion.
        </p>
        <button
          onClick={() => navigate("/client/profile")}
          className="mt-4 px-8 py-3 rounded-2xl font-bold text-white"
          style={{ background: "linear-gradient(135deg,#f97316,#a855f7)" }}
        >
          Back to Profile
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-safe pt-4 pb-3 sticky top-0 z-10"
        style={{ background: "var(--background)", backdropFilter: "blur(16px)" }}>
        <button
          onClick={() => stepIdx === 0 ? navigate("/client/profile") : back()}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-foreground/5 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-black">Promote Your Event</h1>
          <p className="text-[11px] text-muted-foreground">Step {stepIdx + 1} of {steps.length}</p>
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,rgba(249,115,22,0.15),rgba(168,85,247,0.15))", border: "1px solid rgba(249,115,22,0.3)" }}>
          <Megaphone className="w-5 h-5 text-orange-400" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 mx-4 rounded-full bg-foreground/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg,#f97316,#a855f7)" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="px-4 pt-6 pb-4"
          >

            {/* ── Step 1: Event Type ─────────────────────────────────────────── */}
            {step === "type" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-black mb-1">What are you promoting?</h2>
                  <p className="text-sm text-muted-foreground">Select the category that best fits your event or service.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {EVENT_TYPES.map(et => (
                    <button
                      key={et.id}
                      onClick={() => { haptics.tap(); set("eventType", et.id); }}
                      className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all active:scale-95"
                      style={{
                        background: form.eventType === et.id
                          ? "linear-gradient(135deg,rgba(249,115,22,0.2),rgba(168,85,247,0.2))"
                          : "rgba(255,255,255,0.04)",
                        border: `1.5px solid ${form.eventType === et.id ? "rgba(249,115,22,0.5)" : "rgba(255,255,255,0.08)"}`,
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <span className="text-orange-400">{et.icon}</span>
                      <span className="text-sm font-bold">{et.label}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={next}
                  disabled={!form.eventType}
                  className="w-full h-14 rounded-2xl font-black text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity active:scale-[0.97]"
                  style={{ background: "linear-gradient(135deg,#f97316,#a855f7)" }}
                >
                  Continue <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* ── Step 2: Details ────────────────────────────────────────────── */}
            {step === "details" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-black mb-1">Tell us the details</h2>
                  <p className="text-sm text-muted-foreground">Fill in as much as you can — the more detail, the better.</p>
                </div>

                {[
                  { key: "title", label: "Event / Service Name *", placeholder: "e.g. Sunset Beach Party", required: true },
                  { key: "location", label: "Location / Venue *", placeholder: "e.g. La Veleta, Tulum", required: true },
                  { key: "date", label: "Date or Time Period", placeholder: "e.g. Every Friday, Apr 5–7", required: false, type: "text" },
                  { key: "contactName", label: "Your Name / Brand *", placeholder: "Contact or business name", required: true },
                  { key: "contactPhone", label: "WhatsApp / Phone *", placeholder: "+52 984...", required: true },
                  { key: "website", label: "Instagram or Website", placeholder: "@handle or https://...", required: false },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">{f.label}</label>
                    <input
                      type={f.type || "text"}
                      value={(form as any)[f.key]}
                      onChange={e => set(f.key as keyof FormData, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full h-12 px-4 rounded-xl text-sm bg-foreground/5 border border-foreground/10 focus:outline-none focus:border-orange-400/50 transition-colors"
                    />
                  </div>
                ))}

                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Description *</label>
                  <textarea
                    value={form.description}
                    onChange={e => set("description", e.target.value)}
                    placeholder="Describe your event or service in a few sentences..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-foreground/5 border border-foreground/10 focus:outline-none focus:border-orange-400/50 transition-colors resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={back}
                    className="h-14 px-5 rounded-2xl font-bold border border-foreground/10 active:scale-[0.97]"
                  >
                    Back
                  </button>
                  <button
                    onClick={next}
                    disabled={!form.title || !form.location || !form.contactName || !form.contactPhone || !form.description}
                    className="flex-1 h-14 rounded-2xl font-black text-white flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.97]"
                    style={{ background: "linear-gradient(135deg,#f97316,#a855f7)" }}
                  >
                    Choose Package <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Package ────────────────────────────────────────────── */}
            {step === "package" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-black mb-1">Choose your package</h2>
                  <p className="text-sm text-muted-foreground">All prices in MXN. USD shown for reference.</p>
                </div>

                {/* Duration selector */}
                <div className="flex gap-2 p-1 rounded-xl bg-foreground/5 border border-foreground/10">
                  {DURATIONS.map(d => (
                    <button
                      key={d.id}
                      onClick={() => set("duration", d.id as any)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: form.duration === d.id ? "linear-gradient(135deg,#f97316,#a855f7)" : "transparent",
                        color: form.duration === d.id ? "white" : undefined,
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                {/* Package cards */}
                <div className="space-y-3">
                  {PACKAGES.map(pkg => {
                    const p = pkg.prices[form.duration];
                    const usd = (p * MXN_TO_USD).toFixed(0);
                    const selected = form.packageId === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        onClick={() => { haptics.tap(); set("packageId", pkg.id); }}
                        className="w-full p-4 rounded-2xl text-left relative overflow-hidden transition-all active:scale-[0.98]"
                        style={{
                          background: selected
                            ? `linear-gradient(135deg, rgba(${pkg.colorRgb},0.2), rgba(${pkg.colorRgb},0.1))`
                            : "rgba(255,255,255,0.04)",
                          border: `2px solid ${selected ? pkg.color : "rgba(255,255,255,0.08)"}`,
                          backdropFilter: "blur(10px)",
                        }}
                      >
                        {pkg.popular && (
                          <div className="absolute top-2 right-3 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-white"
                            style={{ background: pkg.color }}>
                            Most Popular
                          </div>
                        )}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                            style={{ background: `rgba(${pkg.colorRgb},0.3)`, color: pkg.color }}>
                            {pkg.icon}
                          </div>
                          <div>
                            <div className="font-black text-base">{pkg.name}</div>
                            <div className="text-xs text-muted-foreground">${usd} USD / period</div>
                          </div>
                          <div className="ml-auto text-right">
                            <div className="font-black text-lg" style={{ color: pkg.color }}>
                              ${p.toLocaleString()} <span className="text-xs font-bold text-muted-foreground">MXN</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {pkg.perks.map(perk => (
                            <div key={perk} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Check className="w-3 h-3" style={{ color: pkg.color }} />
                              {perk}
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <button onClick={back} className="h-14 px-5 rounded-2xl font-bold border border-foreground/10 active:scale-[0.97]">
                    Back
                  </button>
                  <button
                    onClick={next}
                    className="flex-1 h-14 rounded-2xl font-black text-white flex items-center justify-center gap-2 active:scale-[0.97]"
                    style={{ background: "linear-gradient(135deg,#f97316,#a855f7)" }}
                  >
                    Review Order <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 4: Confirm ────────────────────────────────────────────── */}
            {step === "confirm" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-black mb-1">Review & Submit</h2>
                  <p className="text-sm text-muted-foreground">Our team will contact you to confirm payment and publishing.</p>
                </div>

                {/* Summary card */}
                <div className="rounded-2xl p-4 space-y-3"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}>
                  {[
                    { label: "Event / Service", value: form.title },
                    { label: "Type", value: EVENT_TYPES.find(e => e.id === form.eventType)?.label },
                    { label: "Location", value: form.location },
                    { label: "Contact", value: `${form.contactName} · ${form.contactPhone}` },
                    form.date && { label: "Date", value: form.date },
                    form.website && { label: "Website / IG", value: form.website },
                  ].filter(Boolean).map((row: any) => (
                    <div key={row.label} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-bold text-right max-w-[55%]">{row.value}</span>
                    </div>
                  ))}
                  <div className="border-t border-foreground/10 pt-3 flex justify-between items-center">
                    <div>
                      <div className="text-xs text-muted-foreground">{selectedPkg?.name} · {DURATIONS.find(d => d.id === form.duration)?.label}</div>
                      <div className="font-black text-lg" style={{ color: selectedPkg?.color }}>
                        ${price?.toLocaleString()} MXN <span className="text-xs text-muted-foreground">≈ ${priceUsd} USD</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                      style={{ background: `rgba(${selectedPkg?.colorRgb},0.3)`, color: selectedPkg?.color }}>
                      {selectedPkg?.icon}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground text-center px-4">
                  By submitting, you agree our team will reach out via WhatsApp to finalize payment before publishing.
                </p>

                <div className="flex gap-3">
                  <button onClick={back} className="h-14 px-5 rounded-2xl font-bold border border-foreground/10 active:scale-[0.97]">
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 h-14 rounded-2xl font-black text-white flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.97]"
                    style={{ background: "linear-gradient(135deg,#f97316,#a855f7)" }}
                    data-testid="button-submit-promo"
                  >
                    {submitting ? "Submitting..." : "Submit & Get Promoted 🚀"}
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
