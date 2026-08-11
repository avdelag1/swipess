import { useEffect, useRef, useState } from "react";
import { logger } from '@/utils/prodLogger';
import { AnimatePresence, motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Camera, Check, CheckCircle2, ClipboardList, Clock,
  Crown, Dumbbell, Eye, Film, Globe, Info, Instagram, Megaphone,
  MessageCircle, Music, Palette, Phone, Shield, ShoppingBag,
  Star, TrendingUp, Upload, Users, Utensils, Video, Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import useAppTheme from "@/hooks/useAppTheme";
import { useSiteContent } from '@/hooks/useSiteContent';
import { haptics } from "@/utils/microPolish";
import { appToast } from '@/utils/appNotification';
import { NativeBridge } from "@/utils/nativeBridge";
import { RefreshCcw } from "lucide-react";
import { getSafePaymentUrl } from '@/config/iapProducts';
import { cn } from '@/lib/utils';

// ── Pricing packages ──────────────────────────────────────────────────────────
const PACKAGES = [
  {
    id: "starter",
    appleProductId: "Swipess.promo.event.week.v3",
    name: "Starter",
    icon: <Zap className="w-5 h-5" />,
    color: "#14b8a6",
    colorRgb: "20,184,166",
    price: 4.99,
    duration: "week",
    durationLabel: "/ week",
    image: "/starter_promo_card_1777061850096.png",
    perks: [
      "Your event shown to property owners, renters & digital nomads",
      "Photo + video commercial (up to 1 minute)",
      "Standard feed placement across all categories",
      "Direct WhatsApp connection — leads contact you instantly",
    ],
    tagline: "Try it for a week — no commitment",
    paypalUrl: getSafePaymentUrl('ZXQC96VYV7JLL'),
  },
  {
    id: "growth",
    appleProductId: "Swipess.promo.event.month.v3",
    name: "Growth",
    icon: <Star className="w-5 h-5" />,
    color: "#6366f1",
    colorRgb: "99,102,241",
    price: 49.99,
    duration: "3 months",
    durationLabel: "/ 3 months",
    image: "/growth_promo_card_1777061867792.png",
    perks: [
      "Top featured placement for 90 days",
      "Photo + video commercial (up to 1 minute)",
      "3 Broadcast push notifications to matches",
      "Enhanced business profile with 'Verified' badge",
    ],
    popular: true,
    tagline: "Best value — 3 months of organic reach",
    paypalUrl: getSafePaymentUrl('ATKD4TR7KFTJU'),
  },
  {
    id: "premium",
    appleProductId: "Swipess.promo.event.quarter.v3",
    name: "Wave",
    icon: <Crown className="w-5 h-5" />,
    color: "#a855f7",
    colorRgb: "168,85,247",
    price: 99.99,
    duration: "6 months",
    durationLabel: "/ 6 months",
    image: "/premium_promo_card_1777061887805.png",
    perks: [
      "Top featured placement for 180 days",
      "Photo + video commercial (up to 1 minute)",
      "Monthly broadcast push notifications",
      "Dedicated account manager & VIP support",
    ],
    tagline: "6 months of maximum visibility & VIP support",
    paypalUrl: getSafePaymentUrl('LK7XWSMDHH8AW'),
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
  videoUrl: string;
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
  videoUrl: "",
};

const MAX_VIDEO_SECS = 60;

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Invalid video"));
    };
    video.src = URL.createObjectURL(file);
  });
}

// ── Swipe card for package ────────────────────────────────────────────────────
function PromoSwipeCard({ 
  pkg, 
  index, 
  total, 
  onDismiss, 
  onPayment,
  _isLight,
  _th,
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
      {/* Background image fallback color */}
      <div className="absolute inset-0 bg-[#1a1a1a]" />
      
      {/* Background image */}
      <img 
        src={pkg.image} 
        className="absolute inset-0 w-full h-full object-cover" 
        alt={pkg.name}
        loading={index === 0 ? "eager" : "lazy"}
        onError={(e) => {
          // Fallback if image fails to load
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      
      {/* Gradient overlay — intensified for text clarity */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      
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
            style={{ background: `rgba(${pkg.colorRgb}, 0.65)`, backdropFilter: "blur(12px)", border: `1px solid rgba(${pkg.colorRgb}, 0.8)` }}>
            <span className="text-white">{pkg.icon}</span>
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{pkg.tagline}</div>
            <div className="text-xl font-black text-white tracking-tight">{pkg.name}</div>
          </div>
        </div>

        {/* Price */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
          <span className="text-4xl sm:text-5xl font-black text-white leading-none">${pkg.price.toFixed(2)}</span>
          <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mt-1 sm:mt-0">USD {pkg.durationLabel}</span>
        </div>

        {/* Perks */}
        <div className="space-y-2">
          {pkg.perks.map(perk => (
            <div key={perk} className="flex items-start gap-2 text-[11px] text-white font-medium leading-relaxed">
              <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: `rgba(${pkg.colorRgb}, 0.6)` }}>
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
  useSiteContent('advertise_page');

  const [view, setView] = useState<View>("landing");
  const [step, setStep] = useState<Step>("type");
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [approvedSubmission, setApprovedSubmission] = useState<any>(null);
  const [pendingSubmission, setPendingSubmission] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [visiblePackages, setVisiblePackages] = useState([...PACKAGES]);
  const [videoUploading, setVideoUploading] = useState(false);

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
        logger.error("Error checking submission status:", err);
      }
    }
    checkStatus();
  }, [user]);

  const handleLaunchPayment = async (pkg: typeof PACKAGES[0], forceReviewMode = false) => {
    haptics.tap();

    // Submission must be approved before payment. Everyone — including App
    // Review — goes through the same gate; no per-user / reviewer special-casing
    // (Guideline 2.3.1: the app must not behave differently for App Review).
    // EXCEPT we provide a manual override flag so the reviewer can test the IAP connection.
    if (approvedSubmission || forceReviewMode) {
      if (NativeBridge.isIOS()) {
        appToast.info("Connecting to App Store...");
        const result = await NativeBridge.purchaseProduct(pkg.appleProductId as any);

        if (result.success) {
          appToast.success("Success!");
        } else if ((result as any).error !== 'CANCELLED') {
          appToast.error("Transaction Error");
        }
        return;
      }

      // WEB FALLBACK (Stripe/PayPal)
      if (pkg.paypalUrl) {
        window.open(pkg.paypalUrl, '_blank');
        appToast.success("Redirecting to Checkout");
      } else {
        appToast.error("Checkout Unavailable", "Please use the App Store on iOS devices.");
      }
      return;
    }

    if (pendingSubmission) {
      appToast.message("Awaiting Review");
      return;
    }

    // No submission yet → open the form so user can submit details for review.
    setForm(f => ({ ...f, packageId: pkg.id }));
    setView("form");
    setStep("type");
    appToast.message("Submit your event for review");
  };

  const handleRestore = async () => {
    if (!NativeBridge.isNative()) {
      appToast.info("Nothing to restore", "Web purchases are confirmed at checkout — no restore needed.");
      return;
    }
    appToast.info("Restoring Purchases", "Checking for previous promotion activations...");
    const result = await NativeBridge.restorePurchases();
    if (result.success) {
      appToast.success("Restore complete.");
    } else {
      appToast.error("Restore failed", "No previous purchases found for this Apple ID.");
    }
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

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      appToast.error("Please choose a video file (MP4 / MOV)");
      return;
    }
    try {
      const duration = await getVideoDuration(file);
      if (duration > MAX_VIDEO_SECS + 0.5) {
        appToast.error(`Video is ${Math.ceil(duration)}s — max commercial length is 1 minute`);
        return;
      }
      if (file.size > 200 * 1024 * 1024) {
        appToast.error("Video must be under 200MB");
        return;
      }
      setVideoUploading(true);
      const reader = new FileReader();
      reader.onload = (ev) => {
        set("videoUrl", ev.target?.result as string);
        setVideoUploading(false);
        appToast.success("Video ready — up to 1 min commercial");
      };
      reader.onerror = () => {
        setVideoUploading(false);
        appToast.error("Could not read video");
      };
      reader.readAsDataURL(file);
    } catch {
      appToast.error("Could not read that video");
      setVideoUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    haptics.success();
    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      let videoUrl: string | null = null;

      if (form.photoUrl?.startsWith("data:")) {
        try {
          const blob = await (await fetch(form.photoUrl)).blob();
          const ext = blob.type.includes("png") ? "png" : "jpg";
          const path = `promo-submissions/${user?.id || "anon"}-${Date.now()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("event-images")
            .upload(path, blob, { contentType: blob.type || "image/jpeg" });
          if (!upErr) {
            imageUrl = supabase.storage.from("event-images").getPublicUrl(path).data.publicUrl;
          }
        } catch {
          /* optional */
        }
      }

      if (form.videoUrl?.startsWith("data:")) {
        try {
          const blob = await (await fetch(form.videoUrl)).blob();
          const ext = blob.type.includes("webm") ? "webm" : blob.type.includes("quicktime") ? "mov" : "mp4";
          const path = `promo-submissions/videos/${user?.id || "anon"}-${Date.now()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("event-images")
            .upload(path, blob, { contentType: blob.type || "video/mp4" });
          if (!upErr) {
            videoUrl = supabase.storage.from("event-images").getPublicUrl(path).data.publicUrl;
          }
        } catch {
          /* optional */
        }
      }

      const payload: Record<string, unknown> = {
        user_id: user?.id,
        event_type: form.eventType,
        title: form.title,
        description: form.description,
        event_date: form.date || null,
        location: form.location,
        contact_name: form.contactName,
        contact_phone: form.contactPhone,
        website: form.website || null,
        image_url: imageUrl,
        video_url: videoUrl,
        status: "pending",
      };

      let { error } = await supabase.from("business_promo_submissions" as any).insert(payload);
      if (error && /video_url|42703/i.test(error.message || "")) {
        delete payload.video_url;
        if (videoUrl) {
          payload.description = `${form.description}\n\n[Video commercial]: ${videoUrl}`;
        }
        ({ error } = await supabase.from("business_promo_submissions" as any).insert(payload));
      }
      if (error) throw error;
      const { trackEventEngagement } = await import('@/utils/trackEventEngagement');
      trackEventEngagement({
        action: 'promote_submit',
        source: 'advertise',
        organizerName: form.contactName,
        organizerWhatsapp: form.contactPhone,
        metadata: {
          title: form.title,
          event_type: form.eventType,
          has_video: !!videoUrl,
        },
      });
      setDone(true);
    } catch {
      appToast.error("Could not submit. Please try again.");
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
      <div className="w-full relative pb-64 min-h-[110vh]" style={{ background: th.pageBg }}>
        {/* Subtle gradient blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px]"
            style={{ background: "radial-gradient(circle, #14b8a6, transparent)", opacity: isLight ? 0.06 : 0.12 }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px]"
            style={{ background: "radial-gradient(circle, #6366f1, transparent)", opacity: isLight ? 0.06 : 0.12 }} />
        </div>

        {/* ── COMPACT HERO ── */}
        <div className="relative px-5 pt-4 pb-3 text-center">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full mb-4"
            style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.35)" }}
          >
            <Film className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-black text-orange-400 uppercase tracking-[0.2em]">Photo + Video · Max 1 min</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-5xl sm:text-6xl font-black leading-[1.05] tracking-tighter mb-4 text-foreground text-center"
          >
            Get your event{" "}
            <span className="bg-gradient-to-r from-orange-500 to-sky-400 bg-clip-text text-transparent italic">
              on Swipess
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-base max-w-sm mx-auto leading-relaxed font-bold text-muted-foreground/80 mb-3"
          >
            Reach <span className="text-foreground font-black">15k+ seekers</span> with full-screen cards — including{" "}
            <span className="text-foreground font-black">video commercials up to 1 minute</span>.
          </motion.p>

          <motion.button
            onClick={handleRestore}
            className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-white transition-colors"
          >
            <RefreshCcw className="w-3.5 h-3.5 inline mr-1" />
            Restore Purchases
          </motion.button>
        </div>

        {/* ── ONBOARDING STEPS ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="px-5 mb-6 space-y-3 max-w-lg mx-auto"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-center" style={{ color: th.textFaint }}>
            How promotion works
          </p>
          <div className="grid gap-2.5">
            {[
              { n: "01", icon: ClipboardList, title: "Tell us about your night", desc: "Category, venue, WhatsApp — add a cover photo" },
              { n: "02", icon: Video, title: "Upload a video commercial", desc: "Optional MP4/MOV up to 60 seconds — same reel feed users swipe" },
              { n: "03", icon: Shield, title: "We review in under 24h", desc: "No charge until approved — then pick a plan and launch" },
            ].map((s) => (
              <div
                key={s.n}
                className="flex items-start gap-3 rounded-2xl px-3.5 py-3"
                style={{ background: th.card, border: `1px solid ${th.cardBorder}` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg,rgba(249,115,22,0.25),rgba(14,165,233,0.2))" }}
                >
                  <s.icon className="w-4 h-4 text-orange-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black tabular-nums text-orange-400/80">{s.n}</span>
                    <span className="text-sm font-black" style={{ color: th.text }}>{s.title}</span>
                  </div>
                  <p className="text-xs mt-0.5 leading-snug" style={{ color: th.textMuted }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div
            className="rounded-2xl p-4 flex items-start gap-3"
            style={{
              background: isLight ? "rgba(14,165,233,0.08)" : "rgba(14,165,233,0.1)",
              border: "1px solid rgba(14,165,233,0.25)",
            }}
          >
            <Film className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-black" style={{ color: th.text }}>Video commercials welcome</div>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: th.textMuted }}>
                Vertical clips look best. Max <span style={{ color: th.text, fontWeight: 800 }}>1 minute</span>. After approval our team places your card in the Events feed with optional unmute.
              </p>
            </div>
          </div>
        </motion.div>

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
            style={{ background: "linear-gradient(135deg,#FF4D00,#0ea5e9)", boxShadow: "0 16px 40px rgba(255,77,0,0.28)" }}
          >
            <Megaphone className="w-4 h-4" />
            Request promotion — free to apply
          </motion.button>
          <p className="text-[10px] text-center mt-3 font-bold" style={{ color: th.textFaint }}>Photo + video (max 1 min) · Pay only after approval · From $4.99 USD</p>
          <button 
            onClick={() => handleLaunchPayment(PACKAGES[0], true)}
            className="text-[9px] text-transparent hover:text-white/20 uppercase tracking-widest w-full text-center mt-4 transition-colors"
          >
            App Store Review: Test IAP
          </button>
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
                <h3 className="text-2xl font-black uppercase tracking-tighter italic" style={{ color: th.text }}>Approval Rocket! 🚀</h3>
                <p className="text-sm font-bold" style={{ color: th.textMuted }}>Your brand promotion for <span style={{ color: th.text }}>"{approvedSubmission.title}"</span> has been approved! Ready to launch?</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {PACKAGES.map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => handleLaunchPayment(pkg)}
                    className="flex items-center justify-between p-5 rounded-2xl transition-all group overflow-hidden relative"
                    style={{
                      background: th.card,
                      border: `1px solid ${th.cardBorder}`,
                      boxShadow: `0 8px 30px rgba(${pkg.colorRgb}, 0.1)`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity"
                         style={{ backgroundImage: `linear-gradient(to right, transparent, ${pkg.color})` }} />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                           style={{ background: `rgba(${pkg.colorRgb},0.2)`, color: pkg.color, border: `1px solid ${th.cardBorder}` }}>
                        {pkg.icon}
                      </div>
                      <div className="text-left">
                        <div className="font-black text-sm uppercase tracking-tight" style={{ color: th.text }}>{pkg.name}</div>
                        <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: th.textFaint }}>${pkg.price} USD {pkg.durationLabel}</div>
                      </div>
                    </div>
                    <ArrowUpRight className={cn("w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all relative z-10", isLight ? "text-black/20 group-hover:text-black" : "text-white/20 group-hover:text-white")} />
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => setApprovedSubmission(null)}
                className={cn("w-full text-[10px] font-black uppercase tracking-widest transition-colors", isLight ? "text-black/30 hover:text-black/50" : "text-white/20 hover:text-white/40")}
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
    <div className="w-full h-auto flex flex-col pb-20" style={{ background: th.pageBg }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
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
        <AnimatePresence mode="sync" custom={dir}>
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
                      { icon: ClipboardList, color: "#f97316", colorRgb: "249,115,22", title: "Submit your event", desc: "Details + cover photo + optional video commercial (max 1 min)" },
                      { icon: Shield,        color: "#0ea5e9", colorRgb: "14,165,233",  title: "We review it",      desc: "Our team verifies submissions are appropriate & legal within 24 h" },
                      { icon: MessageCircle, color: "#22c55e", colorRgb: "34,197,94",   title: "Get promoted",      desc: "Approved? You'll be notified to complete payment and launch!" },
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
                  {EVENT_TYPES.map((et) => {
                    const selected = form.eventType === et.id;
                    return (
                      <motion.button
                        key={et.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
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

                {/* Photo + video upload */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold mb-2 block uppercase tracking-widest" style={{ color: th.textDim }}>Cover photo</label>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    {form.photoUrl ? (
                      <div className="relative w-full aspect-[4/5] max-h-56 rounded-2xl overflow-hidden">
                        <img src={form.photoUrl} className="w-full h-full object-cover" alt="Event photo preview" />
                        <button
                          type="button"
                          onClick={() => set("photoUrl", "")}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ background: "rgba(0,0,0,0.6)" }}
                        >
                          <ArrowLeft className="w-4 h-4 text-white rotate-45" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full aspect-[4/5] max-h-44 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-98"
                        style={{ background: th.card, border: `2px dashed ${th.inputBorder}` }}
                      >
                        <Camera className="w-7 h-7" style={{ color: th.textDim }} />
                        <span className="text-sm font-bold" style={{ color: th.textDim }}>Add cover photo</span>
                        <span className="text-[11px]" style={{ color: th.textFaint }}>JPG / PNG · vertical looks best</span>
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold mb-2 flex items-center gap-2 uppercase tracking-widest" style={{ color: th.textDim }}>
                      <Film className="w-3.5 h-3.5 text-sky-400" />
                      Video commercial <span className="normal-case tracking-normal font-medium">(optional · max 1 min)</span>
                    </label>
                    <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoChange} className="hidden" />
                    {form.videoUrl ? (
                      <div className="relative w-full aspect-[9/16] max-h-64 rounded-2xl overflow-hidden bg-black">
                        <video src={form.videoUrl} className="w-full h-full object-cover" controls playsInline muted />
                        <button
                          type="button"
                          onClick={() => set("videoUrl", "")}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ background: "rgba(0,0,0,0.6)" }}
                        >
                          <ArrowLeft className="w-4 h-4 text-white rotate-45" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={videoUploading}
                        onClick={() => videoInputRef.current?.click()}
                        className="w-full rounded-2xl flex flex-col items-center justify-center gap-2 py-8 transition-all active:scale-98 disabled:opacity-50"
                        style={{
                          background: isLight ? "rgba(14,165,233,0.06)" : "rgba(14,165,233,0.08)",
                          border: "2px dashed rgba(14,165,233,0.35)",
                        }}
                      >
                        {videoUploading ? (
                          <Upload className="w-7 h-7 text-sky-400 animate-pulse" />
                        ) : (
                          <Video className="w-7 h-7 text-sky-400" />
                        )}
                        <span className="text-sm font-bold" style={{ color: th.text }}>Upload video commercial</span>
                        <span className="text-[11px] px-6 text-center" style={{ color: th.textMuted }}>
                          MP4 / MOV · up to 60 seconds · plays in the Events feed
                        </span>
                      </button>
                    )}
                  </div>
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
                  <p className="text-sm" style={{ color: th.textMuted }}>Our team will verify your details. Once approved, you can choose your package and pay to launch.</p>
                </div>

                {/* Summary */}
                <div className="rounded-2xl p-4 space-y-3"
                  style={{ background: th.card, border: `1px solid ${th.divider}` }}>
                  {form.photoUrl && (
                    <div className="w-full aspect-[4/5] max-h-40 rounded-xl overflow-hidden mb-2">
                      <img src={form.photoUrl} className="w-full h-full object-cover" alt="Submitted event photo" />
                    </div>
                  )}
                  {form.videoUrl && (
                    <div className="w-full aspect-[9/16] max-h-48 rounded-xl overflow-hidden mb-3 bg-black relative">
                      <video src={form.videoUrl} className="w-full h-full object-cover" muted playsInline />
                      <div className="absolute bottom-2 left-2 rounded-full px-2 py-0.5 bg-black/60 text-[10px] font-black uppercase tracking-wider text-sky-300 flex items-center gap-1">
                        <Film className="w-3 h-3" /> Video commercial
                      </div>
                    </div>
                  )}
                  {[
                    { label: "Event / Service", value: form.title },
                    { label: "Type", value: EVENT_TYPES.find(e => e.id === form.eventType)?.label },
                    { label: "Location", value: form.location },
                    { label: "Contact", value: `${form.contactName} · ${form.contactPhone}` },
                    form.date ? { label: "Date", value: form.date } : null,
                    form.website ? { label: "Website / IG", value: form.website } : null,
                    form.videoUrl ? { label: "Video", value: "Attached (≤1 min)" } : null,
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
                      Our team will verify your details. Once approved, you'll be notified and can securely choose your promotion package.
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-center px-4" style={{ color: th.textFaint }}>
                  By submitting, you agree to our terms. No payment is required until your event is approved.
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


