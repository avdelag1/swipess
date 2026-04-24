import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Check, CheckCircle2, Megaphone, Star, Zap,
  Music, Utensils, Dumbbell, Palette, ShoppingBag, Globe, Camera,
  Users, Eye, TrendingUp, Instagram, Phone, Crown,
  Info, Shield, ClipboardList, MessageCircle, Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import useAppTheme from "@/hooks/useAppTheme";
import { haptics } from "@/utils/microPolish";
import { toast } from "@/components/ui/sonner";
import { NativeBridge } from "@/utils/nativeBridge";
import { RefreshCcw } from "lucide-react";

// ── Pricing packages ──────────────────────────────────────────────────────────
const PACKAGES = [
  {
    id: "starter",
    name: "Starter",
    icon: <Zap className="w-5 h-5" />,
    color: "#14b8a6",
    colorRgb: "20,184,166",
    price: 4.99,
    duration: "week",
    durationLabel: "/ week",
    image: "/images/promo/promo_1.png",
    perks: [
      "Your event shown to property owners, renters & digital nomads",
      "1 photo with your listing card",
      "Standard feed placement across all categories",
      "Direct WhatsApp connection — leads contact you instantly",
    ],
    tagline: "Try it for a week — no commitment",
    paypalUrl: "https://www.paypal.com/ncp/payment/ZXQC96VYV7JLL",
  },
  {
    id: "growth",
    name: "Growth",
    icon: <Star className="w-5 h-5" />,
    color: "#6366f1",
    colorRgb: "99,102,241",
    price: 6.99,
    duration: "3months",
    durationLabel: "/ 3 months",
    image: "/images/promo/promo_3.png",
    perks: [
      "Featured badge — stand out in the feed",
      "Up to 5 photos to showcase your event",
      "Priority placement above standard listings",
      "Real-time performance stats — views, taps & leads",
    ],
    popular: true,
    tagline: "Best value — 3 months of organic reach",
    paypalUrl: "https://www.paypal.com/ncp/payment/ATKD4TR7KFTJU",
  },
  {
    id: "premium",
    name: "Premium",
    icon: <Crown className="w-5 h-5" />,
    color: "#a855f7",
    colorRgb: "168,85,247",
    price: 9.99,
    duration: "6months",
    durationLabel: "/ 6 months",
    image: "/images/promo/promo_5.png",
    perks: [
      "Top of feed — first thing users see",
      "Unlimited photos & rich media",
      "Push notification blast to thousands",
      "Dedicated account manager & VIP support",
    ],
    tagline: "6 months of maximum visibility & VIP support",
    paypalUrl: "https://www.paypal.com/ncp/payment/LK7XWSMDHH8AW",
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

// ── Swipe card for package ────────────────────────────────────────────────────
function PromoSwipeCard({ 
  pkg, 
  index, 
  total, 
  onDismiss, 
  onPayment,
  isLight,
  th,
}: { 
  pkg: typeof PACKAGES[0]; 
  index: number; 
  total: number;
  onDismiss: () => void;
  onPayment: (pkg: typeof PACKAGES[0]) => void;
  isLight: boolean;
  th: any;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-8, 8]);
  const opacity = useTransform(x, [-200, -120, 0, 120, 200], [0.5, 1, 1, 1, 0.5]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 60) {
      onDismiss();
    }
  };

  const stackOffset = index * 6;
  const stackScale = 1 - index * 0.04;

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      animate={{ opacity: 1, scale: stackScale, y: stackOffset }}
      exit={{ x: 300, opacity: 0, rotate: 15, transition: { duration: 0.3 } }}
      className="absolute inset-0 rounded-[2rem] overflow-hidden cursor-grab active:cursor-grabbing"
      style={{ 
        x, rotate, opacity,
        zIndex: total - index, 
        scale: stackScale, 
        y: stackOffset,
        boxShadow: index === 0 
          ? `0 20px 60px rgba(${pkg.colorRgb}, 0.25), 0 8px 20px rgba(0,0,0,0.3)` 
          : "0 4px 20px rgba(0,0,0,0.2)",
      }}
    >
      {/* Background image */}
      <img 
        src={pkg.image} 
        className="absolute inset-0 w-full h-full object-cover" 
        alt={pkg.name}
        loading={index === 0 ? "eager" : "lazy"}
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      
      {/* Popular badge */}
      {(pkg as any).popular && (
        <div className="absolute top-4 right-4 z-10">
          <div className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-white"
            style={{ background: `linear-gradient(135deg, ${pkg.color}, rgba(${pkg.colorRgb}, 0.7))`, boxShadow: `0 4px 16px rgba(${pkg.colorRgb}, 0.4)` }}>
            Most Popular
          </div>
        </div>
      )}

      {/* Card counter */}
      <div className="absolute top-4 left-4 z-10 flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="h-1 rounded-full transition-all" 
            style={{ 
              width: i === index ? 24 : 8, 
              background: i === index ? pkg.color : "rgba(255,255,255,0.3)" 
            }} 
          />
        ))}
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4 z-10">
        {/* Package name & icon */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: `rgba(${pkg.colorRgb}, 0.3)`, backdropFilter: "blur(12px)", border: `1px solid rgba(${pkg.colorRgb}, 0.5)` }}>
            <span className="text-white">{pkg.icon}</span>
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">{pkg.tagline}</div>
            <div className="text-xl font-black text-white tracking-tight">{pkg.name}</div>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-black text-white">${pkg.price.toFixed(2)}</span>
          <span className="text-sm font-bold text-white/50 uppercase tracking-wider">USD {pkg.durationLabel}</span>
        </div>

        {/* Perks */}
        <div className="space-y-2">
          {pkg.perks.map(perk => (
            <div key={perk} className="flex items-start gap-2 text-[11px] text-white/80 font-medium leading-relaxed">
              <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: `rgba(${pkg.colorRgb}, 0.4)` }}>
                <Check className="w-2.5 h-2.5 text-white" />
              </div>
              <span>{perk}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={(e) => { e.stopPropagation(); onPayment(pkg); }}
          className="w-full py-4 rounded-2xl font-black text-white text-sm uppercase tracking-[0.1em] relative overflow-hidden"
          style={{ 
            background: `linear-gradient(135deg, ${pkg.color}, rgba(${pkg.colorRgb}, 0.7))`,
            boxShadow: `0 12px 30px rgba(${pkg.colorRgb}, 0.4)`,
          }}
        >
          <div className="absolute inset-0 bg-white/10" />
          <span className="relative z-10">Get Started</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

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
  const { theme } = useAppTheme();
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
  const [visiblePackages, setVisiblePackages] = useState([...PACKAGES]);

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

  const handleLaunchPayment = async (pkg: typeof PACKAGES[0]) => {
    haptics.tap();
    
    if (NativeBridge.isIOS()) {
      toast({ title: "In-App Purchase", description: "Connecting to App Store..." });
      const result = await NativeBridge.purchaseProduct(`Swipess.promo.${pkg.id}`);
      if (result.success) {
        toast.success("Payment Received!", { description: "Your promotion will be live shortly." });
        return;
      } else {
        toast.error("Payment Failed", { description: "Transaction could not be completed." });
        return;
      }
    }

    window.open(pkg.paypalUrl, '_blank');
    toast.success("Redirecting to Checkout", { description: `Launching ${pkg.name} package.` });
  };

  const handleRestore = () => {
    toast({ title: "Restoring Purchases", description: "Checking for previous promotion activations..." });
    setTimeout(() => toast.success("Restore complete."), 1500);
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
      <div className="w-full relative pb-20 min-h-screen overflow-y-auto" style={{ background: th.pageBg }}>
        {/* Subtle gradient blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px]"
            style={{ background: "radial-gradient(circle, #14b8a6, transparent)", opacity: isLight ? 0.06 : 0.12 }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px]"
            style={{ background: "radial-gradient(circle, #6366f1, transparent)", opacity: isLight ? 0.06 : 0.12 }} />
        </div>

        {/* ── COMPACT HERO ── */}
        <div className="relative px-5 pt-28 pb-3 text-center">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full mb-4"
            style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.35)" }}
          >
            <Megaphone className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">#1 Discovery App</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-5xl sm:text-6xl font-black leading-[1.1] tracking-tighter mb-6 text-foreground text-center"
          >
            Promote{" "}
            <span className="bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent uppercase italic">
              Your Brand
            </span>{" "}
            on Swipess
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-lg max-w-sm mx-auto leading-relaxed font-bold text-muted-foreground/80 mb-4"
          >
            Reach <span className="text-foreground font-black">15k+ high-value seekers</span>, property owners & travelers
          </motion.p>

          <motion.button
            onClick={handleRestore}
            className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-white transition-colors"
          >
            <RefreshCcw className="w-3.5 h-3.5 inline mr-1" />
            Restore Purchases
          </motion.button>
        </div>

        {/* ── SWIPE PACKAGE CARDS ── */}
        <div className="px-5 py-8">
          <div className="relative w-full mx-auto" style={{ maxWidth: 380, height: 520 }}>
            <AnimatePresence>
              {visiblePackages.map((pkg, index) => (
                <PromoSwipeCard
                  key={pkg.id}
                  pkg={pkg}
                  index={index}
                  total={visiblePackages.length}
                  onDismiss={() => {
                    haptics.tap();
                    setVisiblePackages(prev => {
                      const next = [...prev];
                      const [first] = next.splice(0, 1);
                      return [...next, first];
                    });
                  }}
                  onPayment={handleLaunchPayment}
                  isLight={isLight}
                  th={th}
                />
              ))}
            </AnimatePresence>
          </div>
          
          {/* Swipe hint */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground/40" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Swipe to browse plans</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40" />
          </div>
        </div>

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

        {/* ── MAIN CTA ── */}
        <div className="px-5 pb-8">
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { haptics.tap(); setView("form"); }}
            className="w-full py-4 rounded-[2rem] font-black text-white flex items-center justify-center gap-2 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg,#14b8a6,#6366f1)", boxShadow: "0 16px 40px rgba(99,102,241,0.3)" }}
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
    <div className="w-full min-h-screen flex flex-col pb-20" style={{ background: th.pageBg }}>
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
      <div className="flex-1">
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
            className="px-5 pt-6 pb-20"
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


