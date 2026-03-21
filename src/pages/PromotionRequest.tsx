import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Sparkles, Zap, Calendar, MapPin, 
  Image as ImageIcon, Send, CheckCircle2, Upload, Star, 
  Users, TrendingUp, Eye, FileText, Phone, Building,
  Rocket, Crown, ShieldCheck, HeartHandshake
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { triggerHaptic } from '@/utils/haptics';
import { toast } from '@/components/ui/sonner';

// ── CATEGORY OPTIONS ────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'nightlife', label: 'Nightlife', emoji: '🎶', gradient: 'from-purple-600 to-indigo-600' },
  { id: 'dining', label: 'Dining', emoji: '🍷', gradient: 'from-rose-600 to-pink-600' },
  { id: 'jungle', label: 'Jungle', emoji: '🌿', gradient: 'from-emerald-600 to-green-600' },
  { id: 'wellness', label: 'Wellness', emoji: '🧘', gradient: 'from-cyan-600 to-blue-600' },
  { id: 'beach', label: 'Beach', emoji: '🏖️', gradient: 'from-amber-500 to-orange-500' },
  { id: 'art', label: 'Art & Culture', emoji: '🎨', gradient: 'from-fuchsia-600 to-pink-600' },
  { id: 'sports', label: 'Sports', emoji: '⚡', gradient: 'from-blue-600 to-indigo-600' },
  { id: 'business', label: 'Business', emoji: '💼', gradient: 'from-slate-600 to-zinc-600' },
  { id: 'promo', label: 'Brand Promo', emoji: '🔥', gradient: 'from-orange-600 to-red-600' },
];

// ── STATS CARDS ─────────────────────────────────────────────────────────────
const STATS = [
  { icon: Users, value: '15k+', label: 'Monthly Users', color: 'text-emerald-400' },
  { icon: Eye, value: '120k+', label: 'Monthly Views', color: 'text-blue-400' },
  { icon: TrendingUp, value: '89%', label: 'Engagement Rate', color: 'text-amber-400' },
  { icon: Star, value: '4.9', label: 'Avg Rating', color: 'text-purple-400' },
];

// ── FORM STATE ──────────────────────────────────────────────────────────────
interface PromotionForm {
  brandName: string;
  eventTitle: string;
  description: string;
  category: string;
  eventDate: string;
  eventEndDate: string;
  location: string;
  locationDetail: string;
  whatsapp: string;
  promoText: string;
  discountTag: string;
  priceText: string;
  isFree: boolean;
  imageUrl: string;
}

const initialForm: PromotionForm = {
  brandName: '',
  eventTitle: '',
  description: '',
  category: '',
  eventDate: '',
  eventEndDate: '',
  location: '',
  locationDetail: '',
  whatsapp: '',
  promoText: '',
  discountTag: '',
  priceText: '',
  isFree: false,
  imageUrl: '',
};

// ── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function PromotionRequest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [form, setForm] = useState<PromotionForm>(initialForm);
  const [step, setStep] = useState<'info' | 'details' | 'review'>('info');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const updateField = useCallback(<K extends keyof PromotionForm>(field: K, value: PromotionForm[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // ── IMAGE UPLOAD ──────────────────────────────────────────────────────────
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      // Preview
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `promotion-${user.id}-${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('event-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (error) {
        // If bucket doesn't exist, use a placeholder
        console.warn('Upload failed (bucket may not exist):', error.message);
        // Still use the preview as fallback
        updateField('imageUrl', '');
        toast.info('Image preview saved', { description: 'Final upload will happen on approval.' });
      } else {
        const { data: { publicUrl } } = supabase.storage.from('event-images').getPublicUrl(data.path);
        updateField('imageUrl', publicUrl);
        toast.success('Image uploaded!');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error('Upload failed', { description: 'Please try again.' });
    } finally {
      setUploading(false);
    }
  }, [user, updateField]);

  // ── SUBMIT TO SUPABASE ────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!user) {
      toast.error('Sign in required', { description: 'Please sign in to submit a promotion request.' });
      return;
    }

    if (!form.eventTitle.trim() || !form.category) {
      toast.error('Required fields missing', { description: 'Please fill in the event title and category.' });
      return;
    }

    setSubmitting(true);
    triggerHaptic('medium');

    try {
      const { error } = await supabase.from('events').insert({
        title: form.eventTitle.trim(),
        description: form.description.trim() || null,
        category: form.category,
        event_date: form.eventDate || null,
        event_end_date: form.eventEndDate || null,
        location: form.location.trim() || null,
        location_detail: form.locationDetail.trim() || null,
        organizer_name: form.brandName.trim() || user.user_metadata?.full_name || 'Community Member',
        organizer_whatsapp: form.whatsapp.trim() || null,
        promo_text: form.promoText.trim() || null,
        discount_tag: form.discountTag.trim() || null,
        price_text: form.isFree ? 'FREE' : (form.priceText.trim() || null),
        is_free: form.isFree,
        image_url: form.imageUrl || null,
        is_approved: false,
        is_published: false,
        created_by: user.id,
      });

      if (error) throw error;

      setSubmitted(true);
      triggerHaptic('success');
      toast.success('Promotion request submitted!', { 
        description: 'Our team will review it within 24 hours.' 
      });
    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error('Submission failed', { description: err?.message || 'Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }, [user, form]);

  // ── SUCCESS STATE ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className={cn(
        "min-h-screen flex flex-col items-center justify-center p-8 text-center",
        isLight ? "bg-white" : "bg-black"
      )}>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="flex flex-col items-center gap-8 max-w-sm"
        >
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
            <CheckCircle2 className="w-14 h-14 text-white" />
          </div>
          
          <div className="space-y-3">
            <h1 className={cn(
              "text-4xl font-black italic uppercase tracking-tighter",
              isLight ? "text-slate-900" : "text-white"
            )}>
              Request Sent!
            </h1>
            <p className={cn(
              "text-sm font-medium leading-relaxed",
              isLight ? "text-slate-500" : "text-white/50"
            )}>
              Your promotion request has been submitted successfully. Our partnerships team will review it and get back to you within 24 hours.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/explore/eventos')}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-500/20"
            >
              Explore Events
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className={cn(
                "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs border",
                isLight ? "bg-slate-100 border-slate-200 text-slate-600" : "bg-zinc-900 border-white/10 text-white/60"
              )}
            >
              Go Back
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── STEP VALIDATION ───────────────────────────────────────────────────────
  const canProceedToDetails = form.eventTitle.trim().length > 0 && form.category.length > 0;
  const canProceedToReview = canProceedToDetails && (form.location.trim().length > 0 || form.description.trim().length > 0);

  return (
    <div className={cn(
      "min-h-screen flex flex-col",
      isLight ? "bg-slate-50" : "bg-black"
    )}>
      {/* ── SCROLLABLE HEADER ── */}
      <header className={cn(
        "sticky top-0 z-50 backdrop-blur-xl border-b",
        isLight ? "bg-white/80 border-slate-200" : "bg-black/80 border-white/5"
      )}>
        <div className="flex items-center justify-between px-4 h-16" style={{ paddingTop: 'var(--safe-top)' }}>
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => step === 'info' ? navigate(-1) : setStep(step === 'review' ? 'details' : 'info')}
              className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center",
                isLight ? "bg-slate-100" : "bg-white/10"
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <div>
              <h1 className="text-base font-black tracking-tight">Promote Your Brand</h1>
              <p className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                isLight ? "text-slate-400" : "text-white/30"
              )}>
                {step === 'info' ? 'Step 1 · Basics' : step === 'details' ? 'Step 2 · Details' : 'Step 3 · Review'}
              </p>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex gap-1.5">
            {['info', 'details', 'review'].map((s, i) => (
              <div 
                key={s}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  s === step ? "w-6 bg-primary" : 
                  i < ['info', 'details', 'review'].indexOf(step) ? "w-3 bg-primary/50" : 
                  "w-3 bg-slate-200 dark:bg-white/10"
                )}
              />
            ))}
          </div>
        </div>
      </header>

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="px-4 py-6 space-y-8 pb-48">
          
          <AnimatePresence mode="wait">
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* STEP 1: BASICS                                                     */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {step === 'info' && (
              <motion.div 
                key="info"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                {/* Hero Stats Banner */}
                <div className={cn(
                  "p-6 rounded-[2.5rem] relative overflow-hidden",
                  isLight ? "bg-indigo-50 border border-indigo-100" : "bg-indigo-600/10 border border-indigo-500/20"
                )}>
                  <div className="absolute -top-16 -right-16 w-48 h-48 bg-indigo-500 blur-[80px] opacity-10" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className={cn(
                        "p-2 rounded-xl", 
                        isLight ? "bg-indigo-100" : "bg-indigo-500/20"
                      )}>
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                      </div>
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Why Promote Here?</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      {STATS.map((stat) => (
                        <div key={stat.label} className={cn(
                          "p-4 rounded-2xl",
                          isLight ? "bg-white shadow-sm" : "bg-black/30"
                        )}>
                          <stat.icon className={cn("w-4 h-4 mb-2", stat.color)} />
                          <p className={cn("text-lg font-black", isLight ? "text-slate-900" : "text-white")}>{stat.value}</p>
                          <p className={cn("text-[9px] font-bold uppercase tracking-wider", isLight ? "text-slate-400" : "text-white/30")}>{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Brand Name */}
                <div className="space-y-3">
                  <label className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] px-1",
                    isLight ? "text-slate-400" : "text-white/30"
                  )}>
                    Brand / Company Name
                  </label>
                  <input
                    type="text"
                    value={form.brandName}
                    onChange={(e) => updateField('brandName', e.target.value)}
                    placeholder="e.g. Swipess Events, Tulum Wellness Co."
                    className={cn(
                      "w-full px-5 py-4 rounded-2xl text-sm font-bold border transition-all focus:ring-2 focus:ring-primary/30 outline-none",
                      isLight 
                        ? "bg-white border-slate-200 text-slate-900 placeholder:text-slate-300"
                        : "bg-zinc-900 border-white/10 text-white placeholder:text-white/20"
                    )}
                  />
                </div>

                {/* Event Title */}
                <div className="space-y-3">
                  <label className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] px-1 flex items-center gap-2",
                    isLight ? "text-slate-400" : "text-white/30"
                  )}>
                    Event / Campaign Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.eventTitle}
                    onChange={(e) => updateField('eventTitle', e.target.value)}
                    placeholder="e.g. Sunset Rooftop Party, Yoga Retreat..."
                    className={cn(
                      "w-full px-5 py-4 rounded-2xl text-sm font-bold border transition-all focus:ring-2 focus:ring-primary/30 outline-none",
                      isLight 
                        ? "bg-white border-slate-200 text-slate-900 placeholder:text-slate-300"
                        : "bg-zinc-900 border-white/10 text-white placeholder:text-white/20"
                    )}
                  />
                </div>

                {/* Category Grid */}
                <div className="space-y-3">
                  <label className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] px-1 flex items-center gap-2",
                    isLight ? "text-slate-400" : "text-white/30"
                  )}>
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => {
                      const isActive = form.category === cat.id;
                      return (
                        <motion.button
                          key={cat.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => { updateField('category', cat.id); triggerHaptic('light'); }}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all border",
                            isActive
                              ? `bg-gradient-to-r ${cat.gradient} text-white border-transparent shadow-lg`
                              : isLight
                                ? "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                : "bg-zinc-900 border-white/10 text-white/60 hover:border-white/20"
                          )}
                        >
                          <span className="text-base">{cat.emoji}</span>
                          {cat.label}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <label className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] px-1",
                    isLight ? "text-slate-400" : "text-white/30"
                  )}>
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Tell people what makes this event special..."
                    rows={4}
                    className={cn(
                      "w-full px-5 py-4 rounded-2xl text-sm font-medium border transition-all focus:ring-2 focus:ring-primary/30 outline-none resize-none",
                      isLight 
                        ? "bg-white border-slate-200 text-slate-900 placeholder:text-slate-300"
                        : "bg-zinc-900 border-white/10 text-white placeholder:text-white/20"
                    )}
                  />
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* STEP 2: DETAILS                                                    */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {step === 'details' && (
              <motion.div 
                key="details"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className={cn(
                      "text-[10px] font-black uppercase tracking-[0.2em] px-1 flex items-center gap-1.5",
                      isLight ? "text-slate-400" : "text-white/30"
                    )}>
                      <Calendar className="w-3 h-3" /> Start Date
                    </label>
                    <input
                      type="datetime-local"
                      value={form.eventDate}
                      onChange={(e) => updateField('eventDate', e.target.value)}
                      className={cn(
                        "w-full px-4 py-3.5 rounded-2xl text-xs font-bold border transition-all focus:ring-2 focus:ring-primary/30 outline-none",
                        isLight 
                          ? "bg-white border-slate-200 text-slate-900"
                          : "bg-zinc-900 border-white/10 text-white [color-scheme:dark]"
                      )}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className={cn(
                      "text-[10px] font-black uppercase tracking-[0.2em] px-1 flex items-center gap-1.5",
                      isLight ? "text-slate-400" : "text-white/30"
                    )}>
                      <Clock className="w-3 h-3" /> End Date
                    </label>
                    <input
                      type="datetime-local"
                      value={form.eventEndDate}
                      onChange={(e) => updateField('eventEndDate', e.target.value)}
                      className={cn(
                        "w-full px-4 py-3.5 rounded-2xl text-xs font-bold border transition-all focus:ring-2 focus:ring-primary/30 outline-none",
                        isLight 
                          ? "bg-white border-slate-200 text-slate-900"
                          : "bg-zinc-900 border-white/10 text-white [color-scheme:dark]"
                      )}
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-3">
                  <label className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] px-1 flex items-center gap-1.5",
                    isLight ? "text-slate-400" : "text-white/30"
                  )}>
                    <MapPin className="w-3 h-3" /> Location
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    placeholder="e.g. Tulum Beach, Playa del Carmen..."
                    className={cn(
                      "w-full px-5 py-4 rounded-2xl text-sm font-bold border transition-all focus:ring-2 focus:ring-primary/30 outline-none",
                      isLight 
                        ? "bg-white border-slate-200 text-slate-900 placeholder:text-slate-300"
                        : "bg-zinc-900 border-white/10 text-white placeholder:text-white/20"
                    )}
                  />
                </div>

                {/* Location Detail */}
                <div className="space-y-3">
                  <label className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] px-1",
                    isLight ? "text-slate-400" : "text-white/30"
                  )}>
                    Venue / Meeting Point
                  </label>
                  <input
                    type="text"
                    value={form.locationDetail}
                    onChange={(e) => updateField('locationDetail', e.target.value)}
                    placeholder="e.g. Papaya Playa Project, Main Gate..."
                    className={cn(
                      "w-full px-5 py-4 rounded-2xl text-sm font-bold border transition-all focus:ring-2 focus:ring-primary/30 outline-none",
                      isLight 
                        ? "bg-white border-slate-200 text-slate-900 placeholder:text-slate-300"
                        : "bg-zinc-900 border-white/10 text-white placeholder:text-white/20"
                    )}
                  />
                </div>

                {/* WhatsApp */}
                <div className="space-y-3">
                  <label className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] px-1 flex items-center gap-1.5",
                    isLight ? "text-slate-400" : "text-white/30"
                  )}>
                    <Phone className="w-3 h-3" /> WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={form.whatsapp}
                    onChange={(e) => updateField('whatsapp', e.target.value)}
                    placeholder="+52 984 123 4567"
                    className={cn(
                      "w-full px-5 py-4 rounded-2xl text-sm font-bold border transition-all focus:ring-2 focus:ring-primary/30 outline-none",
                      isLight
                        ? "bg-white border-slate-200 text-slate-900 placeholder:text-slate-300"
                        : "bg-zinc-900 border-white/10 text-white placeholder:text-white/20"
                    )}
                  />
                </div>

                {/* Pricing */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className={cn(
                      "text-[10px] font-black uppercase tracking-[0.2em] px-1 flex items-center gap-1.5",
                      isLight ? "text-slate-400" : "text-white/30"
                    )}>
                      <DollarSign className="w-3 h-3" /> Pricing
                    </label>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => updateField('isFree', !form.isFree)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all",
                        form.isFree 
                          ? "bg-emerald-500 text-white border-emerald-400" 
                          : isLight 
                            ? "bg-white border-slate-200 text-slate-600" 
                            : "bg-zinc-900 border-white/10 text-white/60"
                      )}
                    >
                      {form.isFree ? '✓ Free Event' : 'Mark as Free'}
                    </motion.button>
                  </div>
                  {!form.isFree && (
                    <input
                      type="text"
                      value={form.priceText}
                      onChange={(e) => updateField('priceText', e.target.value)}
                      placeholder="e.g. $50 USD, $35 MXN..."
                      className={cn(
                        "w-full px-5 py-4 rounded-2xl text-sm font-bold border transition-all focus:ring-2 focus:ring-primary/30 outline-none",
                        isLight
                          ? "bg-white border-slate-200 text-slate-900 placeholder:text-slate-300"
                          : "bg-zinc-900 border-white/10 text-white placeholder:text-white/20"
                      )}
                    />
                  )}
                </div>

                {/* Promo Text & Tag */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className={cn(
                      "text-[10px] font-black uppercase tracking-[0.2em] px-1 flex items-center gap-1.5",
                      isLight ? "text-slate-400" : "text-white/30"
                    )}>
                      <Tag className="w-3 h-3" /> Promo Text
                    </label>
                    <input
                      type="text"
                      value={form.promoText}
                      onChange={(e) => updateField('promoText', e.target.value)}
                      placeholder="e.g. 2x1 Cocktails"
                      className={cn(
                        "w-full px-4 py-3.5 rounded-2xl text-xs font-bold border transition-all focus:ring-2 focus:ring-primary/30 outline-none",
                        isLight
                          ? "bg-white border-slate-200 text-slate-900 placeholder:text-slate-300"
                          : "bg-zinc-900 border-white/10 text-white placeholder:text-white/20"
                      )}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className={cn(
                      "text-[10px] font-black uppercase tracking-[0.2em] px-1 flex items-center gap-1.5",
                      isLight ? "text-slate-400" : "text-white/30"
                    )}>
                      <Zap className="w-3 h-3" /> Badge Tag
                    </label>
                    <input
                      type="text"
                      value={form.discountTag}
                      onChange={(e) => updateField('discountTag', e.target.value)}
                      placeholder="e.g. NEW, HOT, VIP"
                      className={cn(
                        "w-full px-4 py-3.5 rounded-2xl text-xs font-bold border transition-all focus:ring-2 focus:ring-primary/30 outline-none",
                        isLight
                          ? "bg-white border-slate-200 text-slate-900 placeholder:text-slate-300"
                          : "bg-zinc-900 border-white/10 text-white placeholder:text-white/20"
                      )}
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-3">
                  <label className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] px-1 flex items-center gap-1.5",
                    isLight ? "text-slate-400" : "text-white/30"
                  )}>
                    <ImageIcon className="w-3 h-3" /> Cover Image
                  </label>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {previewUrl ? (
                    <div className="relative rounded-2xl overflow-hidden">
                      <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover rounded-2xl" />
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => { setPreviewUrl(null); updateField('imageUrl', ''); }}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white"
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    </div>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className={cn(
                        "w-full h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all",
                        isLight
                          ? "border-slate-200 hover:border-primary/40 bg-slate-50"
                          : "border-white/10 hover:border-white/20 bg-zinc-900/50"
                      )}
                    >
                      {uploading ? (
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Upload className={cn("w-8 h-8", isLight ? "text-slate-300" : "text-white/20")} />
                          <span className={cn("text-xs font-bold", isLight ? "text-slate-400" : "text-white/30")}>
                            Tap to Upload Cover Image
                          </span>
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* STEP 3: REVIEW                                                     */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {step === 'review' && (
              <motion.div 
                key="review"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Preview Card */}
                <div className={cn(
                  "rounded-[2.5rem] overflow-hidden border shadow-2xl",
                  isLight ? "bg-white border-slate-200 shadow-black/5" : "bg-zinc-900 border-white/10"
                )}>
                  {/* Image */}
                  {previewUrl && (
                    <div className="h-52 relative overflow-hidden">
                      <img src={previewUrl} alt="Cover" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      {form.discountTag && (
                        <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-primary text-[9px] font-black text-white uppercase tracking-widest">
                          {form.discountTag}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-6 space-y-5">
                    {/* Title */}
                    <div>
                      <h2 className={cn(
                        "text-2xl font-black italic uppercase tracking-tighter",
                        isLight ? "text-slate-900" : "text-white"
                      )}>
                        {form.eventTitle || 'Your Event Title'}
                      </h2>
                      {form.brandName && (
                        <p className={cn(
                          "text-xs font-bold mt-1",
                          isLight ? "text-slate-400" : "text-white/40"
                        )}>
                          by {form.brandName}
                        </p>
                      )}
                    </div>

                    {/* Info pills */}
                    <div className="flex flex-wrap gap-2">
                      {form.category && (
                        <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                          {CATEGORIES.find(c => c.id === form.category)?.emoji} {form.category}
                        </span>
                      )}
                      {form.isFree && (
                        <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                          ✓ Free
                        </span>
                      )}
                      {form.priceText && !form.isFree && (
                        <span className={cn(
                          "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                          isLight ? "bg-slate-100 text-slate-600" : "bg-white/10 text-white/60"
                        )}>
                          {form.priceText}
                        </span>
                      )}
                      {form.promoText && (
                        <span className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                          ⚡ {form.promoText}
                        </span>
                      )}
                    </div>

                    {/* Details rows */}
                    <div className="space-y-3">
                      {form.eventDate && (
                        <div className="flex items-center gap-3">
                          <Calendar className={cn("w-4 h-4", isLight ? "text-indigo-500" : "text-indigo-400")} />
                          <span className={cn("text-xs font-bold", isLight ? "text-slate-600" : "text-white/60")}>
                            {new Date(form.eventDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                      )}
                      {form.location && (
                        <div className="flex items-center gap-3">
                          <MapPin className={cn("w-4 h-4", isLight ? "text-emerald-500" : "text-emerald-400")} />
                          <span className={cn("text-xs font-bold", isLight ? "text-slate-600" : "text-white/60")}>
                            {form.location}{form.locationDetail ? ` · ${form.locationDetail}` : ''}
                          </span>
                        </div>
                      )}
                      {form.whatsapp && (
                        <div className="flex items-center gap-3">
                          <MessageCircle className={cn("w-4 h-4", isLight ? "text-green-500" : "text-green-400")} />
                          <span className={cn("text-xs font-bold", isLight ? "text-slate-600" : "text-white/60")}>
                            {form.whatsapp}
                          </span>
                        </div>
                      )}
                    </div>

                    {form.description && (
                      <p className={cn(
                        "text-sm font-medium leading-relaxed",
                        isLight ? "text-slate-500" : "text-white/50"
                      )}>
                        {form.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Approval Notice */}
                <div className={cn(
                  "p-5 rounded-2xl flex items-start gap-4",
                  isLight ? "bg-amber-50 border border-amber-100" : "bg-amber-500/5 border border-amber-500/10"
                )}>
                  <FileText className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Review Process</p>
                    <p className={cn("text-[11px] font-medium mt-1 leading-relaxed", isLight ? "text-amber-700/70" : "text-amber-300/50")}>
                      Your promotion will be reviewed by our partnerships team within 24 hours. Once approved, it will appear in the Events feed and Stories carousel for maximum visibility.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── FIXED BOTTOM CTA ── */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 p-4 backdrop-blur-xl border-t z-50",
        isLight ? "bg-white/80 border-slate-200" : "bg-black/80 border-white/5"
      )} style={{ paddingBottom: 'calc(var(--safe-bottom) + 1rem)' }}>
        <div className="max-w-xl mx-auto">
          {step === 'info' && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { setStep('details'); triggerHaptic('light'); }}
              disabled={!canProceedToDetails}
              className={cn(
                "w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2",
                canProceedToDetails
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-500/20"
                  : isLight
                    ? "bg-slate-100 text-slate-300"
                    : "bg-zinc-900 text-white/20"
              )}
            >
              Continue to Details <ArrowUpRight className="w-4 h-4" />
            </motion.button>
          )}

          {step === 'details' && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { setStep('review'); triggerHaptic('light'); }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              Preview & Review <ArrowUpRight className="w-4 h-4" />
            </motion.button>
          )}

          {step === 'review' && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 text-white text-sm font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" /> Submit for Review
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
