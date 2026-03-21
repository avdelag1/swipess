import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Check, Megaphone, Sparkles, Star, Zap, Calendar,
  Music, Utensils, Dumbbell, Palette, ShoppingBag, Globe, Camera,
  Users, Eye, TrendingUp, Instagram, Phone, Flame, Crown
} from "lucide-react";
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
    emoji: "⚡",
    color: "#22c55e",
    colorRgb: "34,197,94",
    prices: { week: 50, month: 150, quarter: 350 },
    perks: ["Basic listing", "1 photo", "Standard placement", "Email support"],
    tagline: "Perfect to get started",
  },
  {
    id: "growth",
    name: "Growth",
    icon: <Star className="w-5 h-5" />,
    emoji: "🔥",
    color: "#f97316",
    colorRgb: "249,115,22",
    prices: { week: 99, month: 250, quarter: 580 },
    perks: ["Featured badge", "Up to 5 photos", "Priority placement", "Chat support"],
    popular: true,
    tagline: "Most chosen by Tulum brands",
  },
  {
    id: "premium",
    name: "Premium",
    icon: <Crown className="w-5 h-5" />,
    emoji: "👑",
    color: "#a855f7",
    colorRgb: "168,85,247",
    prices: { week: 199, month: 499, quarter: 1150 },
    perks: ["Top of feed", "Unlimited photos", "Push notification blast", "Dedicated manager"],
    tagline: "Maximum reach & visibility",
  },
];

const MXN_TO_USD = 0.052;

const EVENT_TYPES = [
  { id: "music", label: "Music / DJ Night", icon: <Music className="w-5 h-5" />, emoji: "🎶" },
  { id: "food", label: "Food & Drinks", icon: <Utensils className="w-5 h-5" />, emoji: "🍷" },
  { id: "fitness", label: "Fitness / Wellness", icon: <Dumbbell className="w-5 h-5" />, emoji: "🧘" },
  { id: "art", label: "Art / Culture", icon: <Palette className="w-5 h-5" />, emoji: "🎨" },
  { id: "market", label: "Market / Pop-up", icon: <ShoppingBag className="w-5 h-5" />, emoji: "🛍️" },
  { id: "other", label: "Other / Service", icon: <Globe className="w-5 h-5" />, emoji: "✨" },
];

const DURATIONS = [
  { id: "week", label: "1 Week", sublabel: "Try it out" },
  { id: "month", label: "1 Month", sublabel: "Best value" },
  { id: "quarter", label: "3 Months", sublabel: "Maximum ROI" },
];

const STATS = [
  { icon: Users, value: "15k+", label: "Monthly Users", color: "#22c55e" },
  { icon: Eye, value: "120k+", label: "Monthly Views", color: "#3b82f6" },
  { icon: TrendingUp, value: "89%", label: "Engagement", color: "#f97316" },
  { icon: Star, value: "4.9★", label: "Avg Rating", color: "#a855f7" },
];

type View = "landing" | "form";
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
  photoUrl: string;
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
  photoUrl: "",
};

const SAMPLE_CARDS = [
  {
    bg: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&q=80&auto=format",
    tag: "TONIGHT",
    title: "Cenote Rave",
    venue: "Zamna Tulum",
    price: "$800 MXN",
    color: "#a855f7",
  },
  {
    bg: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80&auto=format",
    tag: "FREE ENTRY",
    title: "Food Market",
    venue: "La Veleta",
    price: "Free",
    color: "#22c55e",
  },
  {
    bg: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80&auto=format",
    tag: "EARLY BIRD",
    title: "Cacao Ceremony",
    venue: "Playa Paraíso",
    price: "$350 MXN",
    color: "#f97316",
  },
];

export default function AdvertisePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [view, setView] = useState<View>("landing");
  const [step, setStep] = useState<Step>("type");
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => set("photoUrl", ev.target?.result as string);
    reader.readAsDataURL(file);
  };

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
    } catch {
      toast.error("Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── SUCCESS SCREEN ──────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center gap-6 bg-black">
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-orange-500/30 blur-[60px] rounded-full scale-150 animate-pulse" />
          <div className="w-28 h-28 rounded-[2.5rem] flex items-center justify-center relative z-10"
            style={{ background: "linear-gradient(135deg,#f97316,#a855f7)", boxShadow: "0 20px 60px rgba(249,115,22,0.4)" }}>
            <Check className="w-14 h-14 text-white" strokeWidth={3} />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="space-y-3">
          <h2 className="text-3xl font-black text-white">You're on the list! 🎉</h2>
          <p className="text-white/60 max-w-xs leading-relaxed">
            Our team will review your submission and contact you via WhatsApp within 24 hours.
          </p>
        </motion.div>
        <motion.button
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          onClick={() => navigate(-1)}
          className="px-10 py-4 rounded-[2rem] font-black text-white text-sm uppercase tracking-widest"
          style={{ background: "linear-gradient(135deg,#f97316,#a855f7)", boxShadow: "0 12px 40px rgba(249,115,22,0.35)" }}
        >
          Back to App
        </motion.button>
      </div>
    );
  }

  // ── LANDING PAGE ────────────────────────────────────────────────────────────
  if (view === "landing") {
    return (
      <div className="min-h-[100dvh] bg-black overflow-y-auto">
        {/* Back button */}
        <div className="absolute top-0 left-0 right-0 z-50 pt-safe px-4 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* ── HERO ── */}
        <div className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center pb-12 pt-24">
          {/* Background gradient blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full opacity-20 blur-[100px]"
              style={{ background: "radial-gradient(circle, #f97316, transparent)" }} />
            <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full opacity-20 blur-[100px]"
              style={{ background: "radial-gradient(circle, #a855f7, transparent)" }} />
          </div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.35)" }}
          >
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-[11px] font-black text-orange-400 uppercase tracking-[0.2em]">Tulum's #1 Discovery App</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-black text-white leading-[0.95] tracking-tighter mb-4"
            style={{ textShadow: "0 0 80px rgba(249,115,22,0.3)" }}
          >
            Promote<br />
            <span style={{ background: "linear-gradient(135deg,#f97316,#fb923c,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Your Brand
            </span><br />
            in Tulum
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/60 text-base max-w-xs leading-relaxed mb-8"
          >
            Reach thousands of expats, digital nomads & tourists actively looking for what you offer
          </motion.p>

          {/* Sample cards stack */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="relative w-full max-w-[280px] h-[200px] mb-8"
          >
            {SAMPLE_CARDS.map((card, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-[2rem] overflow-hidden"
                style={{
                  transform: `rotate(${(i - 1) * 6}deg) translateY(${(i - 1) * -8}px)`,
                  zIndex: SAMPLE_CARDS.length - i,
                  boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                }}
                animate={{ rotate: [(i - 1) * 6, (i - 1) * 6 + 1, (i - 1) * 6] }}
                transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
              >
                <img src={card.bg} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-x-3 bottom-3">
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-white"
                    style={{ background: card.color }}>
                    {card.tag}
                  </span>
                  <div className="text-white font-black text-sm mt-1">{card.title}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-[10px]">{card.venue}</span>
                    <span className="font-bold text-[10px]" style={{ color: card.color }}>{card.price}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-4 gap-3 w-full max-w-sm mb-10"
          >
            {STATS.map(stat => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex flex-col items-center gap-1 p-3 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Icon className="w-4 h-4 mb-0.5" style={{ color: stat.color }} />
                  <div className="text-white font-black text-sm">{stat.value}</div>
                  <div className="text-white/40 text-[9px] text-center leading-tight">{stat.label}</div>
                </div>
              );
            })}
          </motion.div>

          {/* CTA */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => { haptics.tap(); setView("form"); }}
            className="w-full max-w-sm py-5 rounded-[2rem] font-black text-white text-base flex items-center justify-center gap-3"
            style={{ background: "linear-gradient(135deg,#f97316,#a855f7)", boxShadow: "0 16px 50px rgba(249,115,22,0.4)" }}
          >
            <Megaphone className="w-5 h-5" />
            Start Promoting — From $50 MXN
          </motion.button>

          <p className="text-white/30 text-[11px] mt-4">No upfront payment · We contact you to confirm</p>
        </div>

        {/* ── WHAT YOU GET ── */}
        <div className="px-6 pb-16">
          <h2 className="text-2xl font-black text-white text-center mb-2">Everything you need</h2>
          <p className="text-white/50 text-sm text-center mb-8">to get noticed in Tulum</p>

          <div className="space-y-4">
            {[
              {
                icon: <Eye className="w-5 h-5" />,
                color: "#3b82f6",
                title: "Massive Reach",
                desc: "Your event shown to 15,000+ active users browsing Tulum daily",
              },
              {
                icon: <Instagram className="w-5 h-5" />,
                color: "#f97316",
                title: "TikTok-Style Feed",
                desc: "Full-screen immersive cards that stop the scroll and drive action",
              },
              {
                icon: <Phone className="w-5 h-5" />,
                color: "#22c55e",
                title: "Direct WhatsApp Leads",
                desc: "Customers reach you directly through the app with one tap",
              },
              {
                icon: <Crown className="w-5 h-5" />,
                color: "#a855f7",
                title: "Priority Placement",
                desc: "Featured at the top of category feeds for maximum visibility",
              },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-4 p-4 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `rgba(${item.color === "#3b82f6" ? "59,130,246" : item.color === "#f97316" ? "249,115,22" : item.color === "#22c55e" ? "34,197,94" : "168,85,247"},0.2)`, color: item.color }}>
                  {item.icon}
                </div>
                <div>
                  <div className="text-white font-black text-sm">{item.title}</div>
                  <div className="text-white/50 text-xs mt-0.5 leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing preview */}
          <h2 className="text-2xl font-black text-white text-center mt-12 mb-2">Simple pricing</h2>
          <p className="text-white/50 text-sm text-center mb-6">Choose what fits your budget</p>

          <div className="space-y-3">
            {PACKAGES.map(pkg => (
              <div key={pkg.id} className="relative p-4 rounded-2xl overflow-hidden"
                style={{ background: `rgba(${pkg.colorRgb},0.08)`, border: `1.5px solid rgba(${pkg.colorRgb},0.25)` }}>
                {pkg.popular && (
                  <div className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-white"
                    style={{ background: pkg.color }}>POPULAR</div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ background: `rgba(${pkg.colorRgb},0.2)`, color: pkg.color }}>
                    {pkg.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-black">{pkg.name}</div>
                    <div className="text-white/40 text-[10px]">{pkg.tagline}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black" style={{ color: pkg.color }}>From ${pkg.prices.week}</div>
                    <div className="text-white/40 text-[10px]">MXN / week</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => { haptics.tap(); setView("form"); }}
            className="w-full py-5 rounded-[2rem] font-black text-white mt-8 flex items-center justify-center gap-3"
            style={{ background: "linear-gradient(135deg,#f97316,#a855f7)", boxShadow: "0 12px 40px rgba(249,115,22,0.35)" }}
          >
            Get Started Now <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    );
  }

  // ── FORM ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] flex flex-col bg-black pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-safe pt-4 pb-3 sticky top-0 z-10"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button
          onClick={() => stepIdx === 0 ? setView("landing") : back()}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-black text-white">Promote Your Event</h1>
          <p className="text-[11px] text-white/40">Step {stepIdx + 1} of {steps.length}</p>
        </div>
        <div className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,rgba(249,115,22,0.2),rgba(168,85,247,0.2))", border: "1px solid rgba(249,115,22,0.3)" }}>
          <Megaphone className="w-4 h-4 text-orange-400" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-[2px] mx-0" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div
          className="h-full"
          style={{ background: "linear-gradient(90deg,#f97316,#a855f7)" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={{
              enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d < 0 ? 60 : -60, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="px-5 pt-6 pb-4 overflow-y-auto"
            style={{ maxHeight: "calc(100dvh - 96px)" }}
          >

            {/* ── Step 1: Event Type ── */}
            {step === "type" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-black text-white mb-1">What are you<br />promoting?</h2>
                  <p className="text-white/50 text-sm">Choose the category that fits your business</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {EVENT_TYPES.map(et => {
                    const selected = form.eventType === et.id;
                    return (
                      <button
                        key={et.id}
                        onClick={() => { haptics.tap(); set("eventType", et.id); }}
                        className="flex flex-col items-start gap-2 p-4 rounded-2xl text-left transition-all active:scale-95"
                        style={{
                          background: selected ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.04)",
                          border: `1.5px solid ${selected ? "rgba(249,115,22,0.6)" : "rgba(255,255,255,0.08)"}`,
                        }}
                      >
                        <span className="text-2xl">{et.emoji}</span>
                        <span className="text-sm font-bold text-white">{et.label}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={next}
                  disabled={!form.eventType}
                  className="w-full h-14 rounded-2xl font-black text-white flex items-center justify-center gap-2 disabled:opacity-30 transition-opacity active:scale-[0.97]"
                  style={{ background: "linear-gradient(135deg,#f97316,#a855f7)" }}
                >
                  Continue <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* ── Step 2: Details ── */}
            {step === "details" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-black text-white mb-1">Tell us the details</h2>
                  <p className="text-white/50 text-sm">Fill in as much as you can — more info = better results</p>
                </div>

                {/* Photo upload */}
                <div>
                  <label className="text-xs font-bold text-white/50 mb-2 block uppercase tracking-widest">Event Photo</label>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  {form.photoUrl ? (
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
                      <img src={form.photoUrl} className="w-full h-full object-cover" alt="Preview" />
                      <button
                        onClick={() => set("photoUrl", "")}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
                      >
                        <ArrowLeft className="w-4 h-4 text-white rotate-45" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-video rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-98"
                      style={{ background: "rgba(255,255,255,0.04)", border: "2px dashed rgba(255,255,255,0.15)" }}
                    >
                      <Camera className="w-8 h-8 text-white/30" />
                      <span className="text-white/40 text-sm font-bold">Tap to add a photo</span>
                      <span className="text-white/25 text-[11px]">JPG, PNG · Recommended 1:1</span>
                    </button>
                  )}
                </div>

                {[
                  { key: "title", label: "Event / Service Name *", placeholder: "e.g. Sunset Beach Party" },
                  { key: "location", label: "Location / Venue *", placeholder: "e.g. La Veleta, Tulum" },
                  { key: "date", label: "Date or Time Period", placeholder: "e.g. Every Friday, Apr 5–7" },
                  { key: "contactName", label: "Your Name / Brand *", placeholder: "Contact or business name" },
                  { key: "contactPhone", label: "WhatsApp / Phone *", placeholder: "+52 984..." },
                  { key: "website", label: "Instagram or Website", placeholder: "@handle or https://..." },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[11px] font-bold text-white/40 mb-1.5 block uppercase tracking-widest">{f.label}</label>
                    <input
                      type="text"
                      value={(form as any)[f.key]}
                      onChange={e => set(f.key as keyof FormData, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full h-12 px-4 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-orange-400/50 transition-colors placeholder:text-white/25"
                    />
                  </div>
                ))}

                <div>
                  <label className="text-[11px] font-bold text-white/40 mb-1.5 block uppercase tracking-widest">Description *</label>
                  <textarea
                    value={form.description}
                    onChange={e => set("description", e.target.value)}
                    placeholder="Describe your event or service in a few sentences..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-orange-400/50 transition-colors resize-none placeholder:text-white/25"
                  />
                </div>

                <div className="flex gap-3">
                  <button onClick={back}
                    className="h-14 px-5 rounded-2xl font-bold text-white border border-white/10 active:scale-[0.97] bg-white/5">
                    Back
                  </button>
                  <button
                    onClick={next}
                    disabled={!form.title || !form.location || !form.contactName || !form.contactPhone || !form.description}
                    className="flex-1 h-14 rounded-2xl font-black text-white flex items-center justify-center gap-2 disabled:opacity-30 active:scale-[0.97]"
                    style={{ background: "linear-gradient(135deg,#f97316,#a855f7)" }}
                  >
                    Choose Package <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Package ── */}
            {step === "package" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-black text-white mb-1">Choose your package</h2>
                  <p className="text-white/50 text-sm">All prices in MXN. Cancel anytime.</p>
                </div>

                {/* Duration selector */}
                <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {DURATIONS.map(d => (
                    <button
                      key={d.id}
                      onClick={() => { haptics.tap(); set("duration", d.id as any); }}
                      className="flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-0.5"
                      style={{
                        background: form.duration === d.id ? "linear-gradient(135deg,#f97316,#a855f7)" : "transparent",
                        color: form.duration === d.id ? "white" : "rgba(255,255,255,0.4)",
                      }}
                    >
                      <span>{d.label}</span>
                      <span style={{ fontSize: "9px", opacity: 0.7 }}>{d.sublabel}</span>
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
                        }}
                      >
                        {pkg.popular && (
                          <div className="absolute top-2 right-3 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-white"
                            style={{ background: pkg.color }}>
                            Most Popular
                          </div>
                        )}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: `rgba(${pkg.colorRgb},0.2)`, color: pkg.color }}>
                            {pkg.icon}
                          </div>
                          <div>
                            <div className="font-black text-white">{pkg.name}</div>
                            <div className="text-[10px] text-white/40">{pkg.tagline}</div>
                          </div>
                          <div className="ml-auto text-right">
                            <div className="font-black" style={{ color: pkg.color }}>${p.toLocaleString()}</div>
                            <div className="text-[10px] text-white/30">MXN · ≈${usd} USD</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                          {pkg.perks.map(perk => (
                            <div key={perk} className="flex items-center gap-1.5 text-xs text-white/50">
                              <Check className="w-3 h-3 flex-shrink-0" style={{ color: pkg.color }} />
                              {perk}
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <button onClick={back}
                    className="h-14 px-5 rounded-2xl font-bold text-white border border-white/10 active:scale-[0.97] bg-white/5">
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

            {/* ── Step 4: Confirm ── */}
            {step === "confirm" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-black text-white mb-1">Review & Submit</h2>
                  <p className="text-white/50 text-sm">Our team will contact you to confirm payment and publishing.</p>
                </div>

                {/* Summary */}
                <div className="rounded-2xl p-4 space-y-3"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {form.photoUrl && (
                    <div className="w-full aspect-video rounded-xl overflow-hidden mb-3">
                      <img src={form.photoUrl} className="w-full h-full object-cover" alt="" />
                    </div>
                  )}
                  {[
                    { label: "Event / Service", value: form.title },
                    { label: "Type", value: EVENT_TYPES.find(e => e.id === form.eventType)?.label },
                    { label: "Location", value: form.location },
                    { label: "Contact", value: `${form.contactName} · ${form.contactPhone}` },
                    form.date ? { label: "Date", value: form.date } : null,
                    form.website ? { label: "Website / IG", value: form.website } : null,
                  ].filter(Boolean).map((row: any) => (
                    <div key={row.label} className="flex justify-between text-sm gap-4">
                      <span className="text-white/40">{row.label}</span>
                      <span className="font-bold text-white text-right flex-1 truncate">{row.value}</span>
                    </div>
                  ))}
                  <div className="border-t border-white/10 pt-3 flex justify-between items-center mt-1">
                    <div>
                      <div className="text-xs text-white/40">{selectedPkg?.name} · {DURATIONS.find(d => d.id === form.duration)?.label}</div>
                      <div className="font-black text-lg text-white">
                        ${price?.toLocaleString()} <span className="text-sm text-white/40">MXN</span>
                        <span className="text-sm text-white/30 ml-2">≈${priceUsd} USD</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `rgba(${selectedPkg?.colorRgb},0.2)`, color: selectedPkg?.color }}>
                      {selectedPkg?.icon}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-white/30 text-center px-4">
                  By submitting, you agree our team will reach out via WhatsApp to finalize payment before publishing.
                </p>

                <div className="flex gap-3">
                  <button onClick={back}
                    className="h-14 px-5 rounded-2xl font-bold text-white border border-white/10 active:scale-[0.97] bg-white/5">
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 h-14 rounded-2xl font-black text-white flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.97]"
                    style={{ background: "linear-gradient(135deg,#f97316,#a855f7)" }}
                    data-testid="button-submit-promo"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>Submit & Get Promoted 🚀</>
                    )}
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
