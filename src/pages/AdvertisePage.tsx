import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Check, CheckCircle2, Megaphone, Star, Zap,
  Music, Utensils, Dumbbell, Palette, ShoppingBag, Globe, Camera,
  Users, Eye, TrendingUp, Instagram, Phone, Flame, Crown,
  Info, Shield, ClipboardList, MessageCircle, Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { haptics } from "@/utils/microPolish";
import { toast } from "@/components/ui/sonner";

// ── Pricing packages ──────────────────────────────────────────────────────────
const PACKAGES = [
  {
    id: "starter",
    name: "Starter Boost",
    icon: <Zap className="w-5 h-5" />,
    emoji: "⚡",
    color: "var(--color-brand-accent)",
    colorRgb: "236,72,153",
    price: 69.00,
    duration: "week",
    durationLabel: "/ week",
    perks: [
      "Your event shown to property owners, renters & digital nomads",
      "1 high-quality photo showcase",
      "Standard feed placement across all categories",
      "Direct WhatsApp connection — leads contact you instantly",
      "Email support to help you get set up",
    ],
    tagline: "Great for one-off events or pop-ups",
    paypalUrl: "https://www.paypal.com/ncp/payment/KP9WHGEN23MYA",
  },
  {
    id: "growth",
    name: "Growth Accelerator",
    icon: <Star className="w-5 h-5" />,
    emoji: "🔥",
    color: "var(--color-brand-primary)",
    colorRgb: "255,77,0",
    price: 99.00,
    duration: "1month",
    durationLabel: "/ month",
    perks: [
      "Featured badge — stand out in a feed full of high-spending users",
      "Up to 3 photos to showcase your event or service",
      "Priority placement above standard free listings",
      "Highlighted in your category so the right audience finds you",
      "Real-time performance tracking (views, taps & leads)",
    ],
    popular: true,
    tagline: "Best value — a full month of organic reach",
    paypalUrl: "https://www.paypal.com/ncp/payment/Y856SPQRC9WHA",
  },
  {
    id: "premium",
    name: "Premium Takeover",
    icon: <Crown className="w-5 h-5" />,
    emoji: "👑",
    color: "#8B5CF6",
    colorRgb: "139,92,246",
    price: 119.00,
    duration: "3months",
    durationLabel: "/ 3 months",
    perks: [
      "Top of feed — firsthand visibility to property owners & expats",
      "Unlimited photos & rich media for your listing",
      "1 Push notification blast to thousands of active users",
      "Dedicated account manager for hands-on support",
      "Cross-promotion on Swipess official social channels",
      "Custom branded card designed for maximum engagement",
    ],
    tagline: "90 days of absolute maximum visibility & VIP support",
    paypalUrl: "https://www.paypal.com/ncp/payment/8SNPZXP9TT8KW",
  },
];

const EVENT_TYPES = [
  { id: "music",   label: "Music / DJ Night",    icon: <Music      className="w-6 h-6" />, color: "#f43f5e", colorRgb: "244,63,94"   },
  { id: "food",    label: "Food & Drinks",        icon: <Utensils   className="w-6 h-6" />, color: "#f97316", colorRgb: "249,115,22"  },
  { id: "fitness", label: "Fitness / Wellness",   icon: <Dumbbell   className="w-6 h-6" />, color: "#22c55e", colorRgb: "34,197,94"   },
  { id: "art",     label: "Art / Culture",        icon: <Palette    className="w-6 h-6" />, color: "#a855f7", colorRgb: "168,85,247"  },
  { id: "market",  label: "Market / Pop-up",      icon: <ShoppingBag className="w-6 h-6" />, color: "#3b82f6", colorRgb: "59,130,246"  },
  { id: "other",   label: "Other / Service",      icon: <Globe      className="w-6 h-6" />, color: "#eab308", colorRgb: "234,179,8"   },
];


const STATS = [
  { icon: Users, value: "15k+", label: "Monthly Users", color: "#ef4444" },
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
  photoUrl: "",
};

const _SAMPLE_CARDS = [
  {
    bg: "/images/events/cenote_rave.png",
    tag: "TONIGHT",
    title: "Cenote Rave",
    venue: "Zamna Tulum",
    price: "$42",
    color: "#a855f7",
  },
  {
    bg: "/images/events/food_market.png",
    tag: "FREE ENTRY",
    title: "Food Market",
    venue: "La Veleta",
    price: "Free",
    color: "#ef4444",
  },
  {
    bg: "/images/events/cacao_ceremony.png",
    tag: "EARLY BIRD",
    title: "Cacao Ceremony",
    venue: "Playa Paraíso",
    price: "$18",
    color: "#f97316",
  },
  {
    bg: "/images/events/sunset_session.png",
    tag: "LIVE DJ",
    title: "Sunset Session",
    venue: "Papaya Playa",
    price: "$30",
    color: "#3b82f6",
  },
  {
    bg: "/images/events/yoga_sound.png",
    tag: "WELLNESS",
    title: "Yoga & Sound",
    venue: "Holistika",
    price: "$25",
    color: "#10b981",
  },
  {
    bg: "/images/events/gallery_night.png",
    tag: "PRIVATE ART",
    title: "Gallery Night",
    venue: "Azulik",
    price: "Invite",
    color: "#eab308",
  },
];

// ── Photo strip — Tulum lifestyle imagery ─────────────────────────────────────
const PHOTO_STRIP = [
  "/images/promo/promo_1.png", // Beach club sunset
  "/images/promo/promo_2.png", // Jungle restaurant
  "/images/promo/promo_3.png", // Beach party DJ
  "/images/promo/promo_4.png", // Wellness retreat
  "/images/promo/promo_5.png", // Boutique hotel
  "/images/promo/promo_6.png", // Sunset dinner
  "/images/promo/promo_7.png", // Yacht chill
];

// ── Feature items ──────────────────────────────────────────────────────────────
const _FEATURES = [
  {
    icon: <Users className="w-5 h-5" />,
    color: "#3b82f6",
    colorRgb: "59,130,246",
    title: "High-Value Audience",
    desc: "Property owners, motorcycle & bicycle renters, service providers, digital nomads and expats — people who actively spend money every day",
  },
  {
    icon: <Phone className="w-5 h-5" />,
    color: "#ef4444",
    colorRgb: "239,68,68",
    title: "Direct Connection",
    desc: "No middlemen. Users tap your listing and reach you instantly via WhatsApp — real leads, real conversations, real customers",
  },
  {
    icon: <Instagram className="w-5 h-5" />,
    color: "#f97316",
    colorRgb: "249,115,22",
    title: "TikTok-Style Feed",
    desc: "Full-screen immersive cards designed to stop the scroll. Your event gets the same attention as a viral post on Instagram or TikTok",
  },
  {
    icon: <Eye className="w-5 h-5" />,
    color: "#22c55e",
    colorRgb: "34,197,94",
    title: "Organic & Healthy Environment",
    desc: "A trusted community of verified users — not random ads. Your promotion lives alongside real listings from property owners and local businesses",
  },
  {
    icon: <Crown className="w-5 h-5" />,
    color: "#a855f7",
    colorRgb: "168,85,247",
    title: "Priority Placement",
    desc: "Get featured at the top of category feeds so thousands of active users see your event before anything else",
  },
];

export default function AdvertisePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [view, setView] = useState<View>("landing");
  const [step, setStep] = useState<Step>("type");
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [approvedSubmission, setApprovedSubmission] = useState<any>(null);
  const [pendingSubmission, setPendingSubmission] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps: Step[] = ["type", "details", "confirm"];
  const stepIdx = steps.indexOf(step);
  const progress = ((stepIdx + 1) / steps.length) * 100;

  // ── CHECK FOR APPROVED SUBMISSIONS ──
  useEffect(() => {
    async function checkStatus() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("business_promo_submissions" as any)
          .select("*")
          .eq("user_id", user.id)
          .in("status", ["approved", "pending"])
          .order("created_at", { ascending: false });
        
        if (!error && data && data.length > 0) {
          const approved = data.find((s: any) => s.status === 'approved');
          const pending = data.find((s: any) => s.status === 'pending');
          
          if (approved) setApprovedSubmission(approved);
          else if (pending) setPendingSubmission(pending);
        }
      } catch (err) {
        console.error("Error checking submission status:", err);
      }
    }
    checkStatus();
  }, [user]);

  const handleLaunchPayment = (pkg: typeof PACKAGES[0]) => {
    haptics.tap();
    window.open(pkg.paypalUrl, '_blank');
    toast.success("Redirecting to PayPal", { description: `Launching ${pkg.name} package.` });
  };

  // ── Theme-aware style helpers ─────────────────────────────────────────────
  const th = {
    pageBg:       isLight ? "#f8f8f8"                        : "#000000",
    card:         isLight ? "rgba(0,0,0,0.04)"               : "rgba(255,255,255,0.05)",
    cardBorder:   isLight ? "rgba(0,0,0,0.08)"               : "rgba(255,255,255,0.08)",
    inputBg:      isLight ? "rgba(0,0,0,0.04)"               : "rgba(255,255,255,0.05)",
    inputBorder:  isLight ? "rgba(0,0,0,0.12)"               : "rgba(255,255,255,0.10)",
    inputText:    isLight ? "#111"                            : "#fff",
    inputPlaceholder: isLight ? "rgba(0,0,0,0.3)"            : "rgba(255,255,255,0.25)",
    headerBg:     isLight ? "rgba(248,248,248,0.92)"          : "rgba(0,0,0,0.85)",
    headerBorder: isLight ? "rgba(0,0,0,0.07)"               : "rgba(255,255,255,0.06)",
    backBtn:      isLight ? "rgba(0,0,0,0.07)"               : "rgba(255,255,255,0.10)",
    backBtnBorder:isLight ? "rgba(0,0,0,0.12)"               : "rgba(255,255,255,0.15)",
    text:         isLight ? "#0a0a0a"                        : "#ffffff",
    textMuted:    isLight ? "rgba(0,0,0,0.65)"               : "rgba(255,255,255,0.75)",
    textDim:      isLight ? "rgba(0,0,0,0.45)"               : "rgba(255,255,255,0.55)",
    textFaint:    isLight ? "rgba(0,0,0,0.35)"               : "rgba(255,255,255,0.40)",
    divider:      isLight ? "rgba(0,0,0,0.08)"               : "rgba(255,255,255,0.12)",
    progressBg:   isLight ? "rgba(0,0,0,0.06)"               : "rgba(255,255,255,0.10)",
    backFormBtn:  isLight ? "rgba(0,0,0,0.05)"               : "rgba(255,255,255,0.08)",
    backFormBorder:isLight ? "rgba(0,0,0,0.12)"              : "rgba(255,255,255,0.15)",
  };

  const goTo = (s: Step) => {
    setDir(steps.indexOf(s) > stepIdx ? 1 : -1);
    setStep(s);
  };
  const next = () => { haptics.tap(); goTo(steps[stepIdx + 1]); };
  const back = () => { haptics.tap(); goTo(steps[stepIdx - 1]); };
  const set = (field: keyof FormData, val: string) => setForm(f => ({ ...f, [field]: val }));

  const selectedPkg = PACKAGES.find(p => p.id === form.packageId)!;
  const _price = selectedPkg?.price;

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
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center gap-6"
        style={{ background: th.pageBg }}>
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-orange-500/30 blur-[60px] rounded-full scale-150 animate-pulse" />
          <div className="w-28 h-28 rounded-[2.5rem] flex items-center justify-center relative z-10"
            style={{ background: "linear-gradient(135deg,#f97316,#a855f7)", boxShadow: "0 20px 60px rgba(249,115,22,0.4)" }}>
            <Check className="w-14 h-14 text-white" strokeWidth={2} />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="space-y-3">
          <h2 className="text-3xl font-black" style={{ color: th.text }}>You're on the list! 🎉</h2>
          <p className="max-w-xs leading-relaxed" style={{ color: th.textMuted }}>
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
      <div className="min-h-[100dvh] overflow-y-auto" style={{ background: th.pageBg }}>
        {/* Subtle gradient blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px]"
            style={{ background: "radial-gradient(circle, #f97316, transparent)", opacity: isLight ? 0.08 : 0.18 }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px]"
            style={{ background: "radial-gradient(circle, #a855f7, transparent)", opacity: isLight ? 0.08 : 0.18 }} />
        </div>

        {/* ── COMPACT HERO ── */}
        <div className="relative px-5 pt-28 pb-3 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-3"
            style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.35)" }}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em]">#1 Discovery App</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-4xl sm:text-5xl font-black leading-[1.1] tracking-tighter mb-4 text-foreground text-center"
          >
            Promote{" "}
            <span className="brand-gradient-text uppercase italic relative px-2 py-1">
              Your Brand
            </span>{" "}
            on Swipess
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-sm max-w-sm mx-auto leading-relaxed font-bold text-muted-foreground/80"
          >
            Reach <span className="text-white">15k+ property owners</span>, renters & tourists — direct, zero middlemen
          </motion.p>
        </div>

        {/* ── PHOTO STRIP — IMMERSIVE ── */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex gap-4 overflow-x-auto px-5 py-6 no-scrollbar"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as any}
        >
          {PHOTO_STRIP.map((url, i) => (
            <div key={i} className="flex-shrink-0 h-[120px] w-[200px] rounded-[2rem] overflow-hidden relative group"
              style={{ 
                boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.08)"
              }}>
              <img
                src={url}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                alt=""
                style={{ 
                  animation: `breathing-zoom 8s ease-in-out ${i * 1.2}s infinite alternate`, 
                  backfaceVisibility: "hidden" as any, 
                  transformOrigin: "center" 
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
            </div>
          ))}
        </motion.div>

        {/* ── STATS ROW ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 mb-8 max-w-5xl mx-auto"
        >
          {STATS.map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex flex-col items-center gap-0.5 p-2.5 rounded-xl"
                style={{ background: th.card, border: `1px solid ${th.cardBorder}` }}>
                <Icon className="w-3.5 h-3.5 mb-0.5" style={{ color: stat.color }} />
                <div className="font-black text-xs" style={{ color: th.text }}>{stat.value}</div>
                <div className="text-[8px] text-center leading-tight" style={{ color: th.textDim }}>{stat.label}</div>
              </div>
            );
          })}
        </motion.div>

        {/* ── PRICING CARDS ── */}
        <div className="px-5 mb-8 max-w-6xl mx-auto">
          <div className="flex items-baseline justify-between mb-4 px-2">
            <h2 className="text-xl font-black uppercase tracking-tighter" style={{ color: th.text }}>Choose your plan</h2>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: th.textDim }}>Pay only after review</span>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-2"
          >
            {PACKAGES.map((pkg, idx) => (
              <motion.div 
                key={pkg.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + (idx * 0.1) }}
                className="w-full max-w-[320px] md:max-w-none p-6 rounded-[2.5rem] relative flex flex-col group overflow-hidden"
                style={{ 
                  background: `rgba(${pkg.colorRgb}, 0.08)`, 
                  backdropFilter: "blur(20px)",
                  border: `1.5px solid rgba(${pkg.colorRgb}, ${pkg.popular ? "0.4" : "0.1"})`, 
                  boxShadow: pkg.popular ? `0 20px 50px rgba(${pkg.colorRgb}, 0.15)` : "none"
                }}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-orange-500 to-rose-500 text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1 rounded-full text-white shadow-xl whitespace-nowrap">
                      ★ MOST POPULAR
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4 mt-1">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ 
                      background: `linear-gradient(135deg, rgba(${pkg.colorRgb}, 0.3), rgba(${pkg.colorRgb}, 0.1))`, 
                      color: pkg.color,
                      boxShadow: `0 8px 20px rgba(${pkg.colorRgb}, 0.2)`
                    }}>
                    {pkg.icon}
                  </div>
                  <div className="font-black text-base tracking-tight" style={{ color: th.text }}>{pkg.name}</div>
                </div>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-black text-4xl leading-none" style={{ color: pkg.color }}>${pkg.price.toFixed(2)}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: th.textDim }}>USD</span>
                </div>
                <div className="text-[11px] font-bold mb-5 opacity-60 uppercase tracking-widest" style={{ color: th.textDim }}>{pkg.durationLabel}</div>
                
                <div className="space-y-3 flex-1 mb-6">
                  {pkg.perks.slice(0, 4).map(perk => (
                    <div key={perk} className="flex items-start gap-2.5 text-[11px] leading-relaxed font-medium" style={{ color: th.textMuted }}>
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `rgba(${pkg.colorRgb}, 0.15)` }}>
                        <Check className="w-2.5 h-2.5" style={{ color: pkg.color }} />
                      </div>
                      <span className="opacity-80">{perk}</span>
                    </div>
                  ))}
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleLaunchPayment(pkg)}
                  className="w-full py-3.5 rounded-[1.5rem] font-black text-white text-[12px] uppercase tracking-[0.15em] relative shadow-2xl overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${pkg.color}, rgba(${pkg.colorRgb}, 0.7))` }}
                >
                  <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors" />
                  <span className="relative z-10">Get Started</span>
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* ── MAIN CTA ── */}
        <div className="px-5 pb-8">
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { haptics.tap(); setView("form"); }}
            className="w-full py-4 rounded-[2rem] font-black text-white flex items-center justify-center gap-2 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg,#f97316,#a855f7)", boxShadow: "0 16px 40px rgba(249,115,22,0.35)" }}
          >
            <Megaphone className="w-4 h-4" />
            Start Promoting — From $4.99 USD
          </motion.button>
          <p className="text-[10px] text-center mt-2" style={{ color: th.textFaint }}>No upfront payment · We contact you to confirm</p>
        </div>

           {approvedSubmission && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-12 p-8 rounded-[3rem] border-2 border-primary/20 bg-primary/5 space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-[1.5rem] bg-primary/20 flex items-center justify-center mx-auto mb-4 border border-primary/30 rotate-3">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Approval Rocket! 🚀</h3>
                <p className="text-sm font-bold text-white/60">Your brand promotion for <span className="text-white">"{approvedSubmission.title}"</span> has been approved! Ready to launch?</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {PACKAGES.map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => handleLaunchPayment(pkg)}
                    className="flex items-center justify-between p-5 rounded-2xl bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `rgba(${pkg.colorRgb},0.2)`, color: pkg.color }}>
                        {pkg.icon}
                      </div>
                      <div className="text-left">
                        <div className="font-black text-white text-sm uppercase tracking-tight">{pkg.name}</div>
                        <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">${pkg.price} USD / {pkg.durationLabel}</div>
                      </div>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-white/20 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => setApprovedSubmission(null)}
                className="w-full text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors"
              >
                Create another submission
              </button>
            </motion.div>
          )}

          {pendingSubmission && !approvedSubmission && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-12 p-8 rounded-[3rem] border border-orange-500/20 bg-orange-500/5 space-y-4 text-center"
            >
              <div className="w-16 h-16 rounded-[1.5rem] bg-orange-500/20 flex items-center justify-center mx-auto mb-2 border border-orange-500/30">
                <Clock className="w-8 h-8 text-orange-400 animate-pulse" />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Review in Progress</h3>
              <p className="text-xs font-bold text-white/60">We're reviewing <span className="text-white">"{pendingSubmission.title}"</span>. You'll be notified as soon as it's ready to launch!</p>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 pt-2">Estimated: &lt; 24h</div>
            </motion.div>
          )}
        </div>
      );
    }

  // ── FORM ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] flex flex-col pb-10" style={{ background: th.pageBg }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-20 pb-3">
        <div className="flex-1">
          <h1 className="text-sm font-black" style={{ color: th.text }}>Promote Your Event</h1>
          <p className="text-[11px]" style={{ color: th.textDim }}>Step {stepIdx + 1} of {steps.length}</p>
        </div>
        <div className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,rgba(249,115,22,0.2),rgba(168,85,247,0.2))", border: "1px solid rgba(249,115,22,0.3)" }}>
          <Megaphone className="w-4 h-4 text-orange-400" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-[2px]" style={{ background: th.progressBg }}>
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
                  <h2 className="text-2xl font-black mb-1" style={{ color: th.text }}>What are you<br />promoting?</h2>
                  <p className="text-sm" style={{ color: th.textMuted }}>Choose the category that fits your business</p>
                </div>

                {/* How it works */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.08 }}
                  className="rounded-2xl p-4"
                  style={{ background: th.card, border: `1px solid ${th.cardBorder}` }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg,rgba(249,115,22,0.25),rgba(168,85,247,0.25))" }}>
                      <Info className="w-3 h-3 text-orange-400" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: th.text }}>How it works</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { icon: ClipboardList, color: "#f97316", colorRgb: "249,115,22", title: "Submit your event", desc: "Fill out this form with your event or business details" },
                      { icon: Shield,        color: "#3b82f6", colorRgb: "59,130,246",  title: "We review it",      desc: "Our team verifies submissions are appropriate & legal within 24 h" },
                      { icon: MessageCircle, color: "#22c55e", colorRgb: "34,197,94",   title: "Get promoted",      desc: "Approved? We contact you on WhatsApp to finalize & publish" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: `linear-gradient(135deg, rgba(${item.colorRgb},0.20), rgba(${item.colorRgb},0.08))`,
                            boxShadow: `0 2px 12px rgba(${item.colorRgb},0.18)`,
                          }}>
                          <item.icon className="w-4 h-4" style={{ color: item.color }} />
                        </div>
                        <div>
                          <div className="text-sm font-bold" style={{ color: th.text }}>{item.title}</div>
                          <div className="text-xs leading-relaxed" style={{ color: th.textMuted }}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Review/guidelines notice */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.14 }}
                  className="rounded-xl px-4 py-3 flex items-start gap-3"
                  style={{
                    background: isLight ? "rgba(234,179,8,0.07)" : "rgba(234,179,8,0.06)",
                    border: `1px solid ${isLight ? "rgba(234,179,8,0.18)" : "rgba(234,179,8,0.13)"}`,
                  }}
                >
                  <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#eab308" }} />
                  <p className="text-xs leading-relaxed" style={{ color: th.textMuted }}>
                    All submissions are reviewed to ensure events are <span style={{ color: th.text, fontWeight: 700 }}>appropriate, legal, and relevant to your area</span>. We reserve the right to decline submissions that don't meet our guidelines — no payment is charged until approval.
                  </p>
                </motion.div>

                {/* Category grid */}
                <div className="grid grid-cols-2 gap-3">
                  {EVENT_TYPES.map((et, index) => {
                    const selected = form.eventType === et.id;
                    return (
                      <motion.button
                        key={et.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.28, delay: 0.18 + index * 0.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { haptics.tap(); set("eventType", et.id); }}
                        className="flex flex-col items-start gap-3 p-4 rounded-2xl text-left transition-colors"
                        style={{
                          background: selected ? `rgba(${et.colorRgb},0.13)` : th.card,
                          border: `1.5px solid ${selected ? et.color : th.cardBorder}`,
                          boxShadow: selected ? `0 0 0 1px rgba(${et.colorRgb},0.15), 0 4px 20px rgba(${et.colorRgb},0.18)` : undefined,
                        }}
                      >
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all"
                          style={{
                            background: selected
                              ? `linear-gradient(135deg, rgba(${et.colorRgb},0.35), rgba(${et.colorRgb},0.18))`
                              : `linear-gradient(135deg, rgba(${et.colorRgb},0.18), rgba(${et.colorRgb},0.07))`,
                            boxShadow: selected
                              ? `0 4px 24px rgba(${et.colorRgb},0.40)`
                              : `0 2px 12px rgba(${et.colorRgb},0.12)`,
                            color: et.color,
                          }}
                        >
                          {et.icon}
                        </div>
                        <span className="text-sm font-bold leading-tight" style={{ color: th.text }}>{et.label}</span>
                      </motion.button>
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
                  <h2 className="text-2xl font-black mb-1" style={{ color: th.text }}>Tell us the details</h2>
                  <p className="text-sm" style={{ color: th.textMuted }}>Fill in as much as you can — more info = better results</p>
                </div>

                {/* Photo upload */}
                <div>
                  <label className="text-xs font-bold mb-2 block uppercase tracking-widest" style={{ color: th.textDim }}>Event Photo</label>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  {form.photoUrl ? (
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
                      <img src={form.photoUrl} className="w-full h-full object-cover" alt="" />
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
                      style={{ background: th.card, border: `2px dashed ${th.inputBorder}` }}
                    >
                      <Camera className="w-8 h-8" style={{ color: th.textDim }} />
                      <span className="text-sm font-bold" style={{ color: th.textDim }}>Tap to add a photo</span>
                      <span className="text-[11px]" style={{ color: th.textFaint }}>JPG, PNG · Recommended 1:1</span>
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
                    <label className="text-[11px] font-bold mb-1.5 block uppercase tracking-widest" style={{ color: th.textDim }}>{f.label}</label>
                    <input
                      type="text"
                      value={(form as any)[f.key]}
                      onChange={e => set(f.key as keyof FormData, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full h-12 px-4 rounded-xl text-sm focus:outline-none focus:border-orange-400/50 transition-colors"
                      style={{
                        background: th.inputBg,
                        border: `1px solid ${th.inputBorder}`,
                        color: th.inputText,
                      }}
                    />
                  </div>
                ))}

                <div>
                  <label className="text-[11px] font-bold mb-1.5 block uppercase tracking-widest" style={{ color: th.textDim }}>Description *</label>
                  <textarea
                    value={form.description}
                    onChange={e => set("description", e.target.value)}
                    placeholder="Describe your event or service in a few sentences..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-orange-400/50 transition-colors resize-none"
                    style={{
                      background: th.inputBg,
                      border: `1px solid ${th.inputBorder}`,
                      color: th.inputText,
                    }}
                  />
                </div>

                <div className="flex gap-3">
                  <button onClick={back}
                    className="h-14 px-5 rounded-2xl font-bold active:scale-[0.97]"
                    style={{ background: th.backFormBtn, border: `1px solid ${th.backFormBorder}`, color: th.text }}>
                    Back
                  </button>
                  <button
                    onClick={next}
                    disabled={!form.title || !form.location || !form.contactName || !form.contactPhone || !form.description}
                    className="flex-1 h-14 rounded-2xl font-black text-white flex items-center justify-center gap-2 disabled:opacity-30 active:scale-[0.97]"
                    style={{ background: "linear-gradient(135deg,#f97316,#a855f7)" }}
                  >
                    Review Submission <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 4: Confirm ── */}
            {step === "confirm" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-black mb-1" style={{ color: th.text }}>Review & Submit</h2>
                  <p className="text-sm" style={{ color: th.textMuted }}>Our team will contact you to confirm payment and publishing.</p>
                </div>

                {/* Summary */}
                <div className="rounded-2xl p-4 space-y-3"
                  style={{ background: th.card, border: `1px solid ${th.divider}` }}>
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
                      <span style={{ color: th.textDim }}>{row.label}</span>
                      <span className="font-bold text-right flex-1 truncate" style={{ color: th.text }}>{row.value}</span>
                    </div>
                  ))}
                  <div className="pt-3 space-y-2 mt-1"
                    style={{ borderTop: `1px solid ${th.divider}` }}>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-orange-400">Step 1: Free Review</p>
                    <p className="text-xs leading-relaxed" style={{ color: th.textMuted }}>
                      Our team will verify your details. Once approved, you'll receive a notification and can choose your promotion package.
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-center px-4" style={{ color: th.textFaint }}>
                  By submitting, you agree our team will reach out via WhatsApp to finalize payment before publishing.
                </p>

                <div className="flex gap-3">
                  <button onClick={back}
                    className="h-14 px-5 rounded-2xl font-bold active:scale-[0.97]"
                    style={{ background: th.backFormBtn, border: `1px solid ${th.backFormBorder}`, color: th.text }}>
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
