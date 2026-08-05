import React, { useState } from 'react';
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';
import { AnimatePresence, motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Baby, Calendar, Car, ChefHat, ChevronLeft, ChevronRight,
  Clock, DollarSign, Dumbbell, Hammer, HeartPulse, Laptop,
  Leaf, MapPin, Package, Paintbrush,
  Shield, Sparkles, Wrench, X, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useModalStore } from '@/state/modalStore';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const WORKER_CATEGORIES = [
  { id: 'cleaning',   label: 'Cleaning',   Icon: Sparkles,   type: 'time-sensitive' as const, color: '#3b82f6', gradient: 'from-blue-500 to-cyan-400',       subcategories: ['Regular cleaning', 'Deep cleaning', 'Move-in/out', 'Office cleaning', 'Post-construction'] },
  { id: 'plumbing',   label: 'Plumbing',   Icon: Wrench,     type: 'project'        as const, color: '#06b6d4', gradient: 'from-cyan-500 to-teal-400',       subcategories: ['Leak repair', 'Pipe installation', 'Drain unclog', 'Water heater', 'Bathroom work'] },
  { id: 'electrical', label: 'Electrical', Icon: Zap,        type: 'project'        as const, color: '#f59e0b', gradient: 'from-amber-500 to-orange-400',     subcategories: ['Outlet/switch', 'Lighting install', 'Circuit breaker', 'Wiring', 'Generator'] },
  { id: 'driving',    label: 'Driver',     Icon: Car,        type: 'time-sensitive' as const, color: '#10b981', gradient: 'from-emerald-500 to-green-400',    subcategories: ['Airport transfer', 'Daily driver', 'Event chauffeur', 'Errands', 'Moving items'] },
  { id: 'chef',       label: 'Chef',       Icon: ChefHat,    type: 'time-sensitive' as const, color: '#f97316', gradient: 'from-orange-500 to-rose-400',      subcategories: ['Private dinner', 'Meal prep', 'Party catering', 'Cooking classes', 'Special diet'] },
  { id: 'gardening',  label: 'Gardening',  Icon: Leaf,       type: 'ongoing'        as const, color: '#22c55e', gradient: 'from-green-500 to-emerald-400',    subcategories: ['Lawn mowing', 'Landscaping', 'Tree trimming', 'Garden design', 'Irrigation'] },
  { id: 'handyman',   label: 'Handyman',   Icon: Hammer,     type: 'project'        as const, color: '#8b5cf6', gradient: 'from-violet-500 to-purple-400',    subcategories: ['Furniture assembly', 'Wall mounting', 'Door/lock repair', 'Tile repair', 'General repairs'] },
  { id: 'childcare',  label: 'Childcare',  Icon: Baby,       type: 'ongoing'        as const, color: '#ec4899', gradient: 'from-pink-500 to-rose-400',        subcategories: ['Full-time nanny', 'Babysitter', 'After-school care', 'Weekend coverage', 'Newborn'] },
  { id: 'fitness',    label: 'Fitness',    Icon: Dumbbell,   type: 'ongoing'        as const, color: '#ef4444', gradient: 'from-red-500 to-orange-400',        subcategories: ['Personal training', 'Group fitness', 'Yoga', 'Nutrition coaching', 'Sports'] },
  { id: 'massage',    label: 'Massage',    Icon: HeartPulse, type: 'time-sensitive' as const, color: '#a855f7', gradient: 'from-purple-500 to-fuchsia-400',   subcategories: ['Swedish', 'Deep tissue', 'Sports massage', 'Couples massage', 'Prenatal'] },
  { id: 'moving',     label: 'Moving',     Icon: Package,    type: 'time-sensitive' as const, color: '#f43f5e', gradient: 'from-rose-500 to-pink-400',        subcategories: ['Full move', 'Partial move', 'Packing help', 'Loading/unloading', 'Rearranging'] },
  { id: 'tech',       label: 'Tech / IT',  Icon: Laptop,     type: 'project'        as const, color: '#6366f1', gradient: 'from-indigo-500 to-blue-400',      subcategories: ['Computer repair', 'Network setup', 'Smart home', 'Phone repair', 'Software help'] },
  { id: 'painting',   label: 'Painting',   Icon: Paintbrush, type: 'project'        as const, color: '#0ea5e9', gradient: 'from-sky-500 to-blue-400',         subcategories: ['Interior', 'Exterior', 'Murals/decorative', 'Furniture refinishing', 'Touch-ups'] },
  { id: 'security',   label: 'Security',   Icon: Shield,     type: 'ongoing'        as const, color: '#64748b', gradient: 'from-slate-500 to-gray-400',       subcategories: ['Security guard', 'CCTV install', 'Home security', 'Event security', 'Night watch'] },
  { id: 'other',      label: 'Other',      Icon: Sparkles,   type: 'project'        as const, color: '#94a3b8', gradient: 'from-slate-400 to-zinc-400',       subcategories: ['Describe your need below'] },
] as const;

export interface SeekerFormState {
  categoryId: string;
  subcategory: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  days: string[];
  budget: string;
  pricingUnit: string;
  location: string;
  urgency: string;
}

export const DEFAULT_FORM: SeekerFormState = {
  categoryId: '', subcategory: '', description: '',
  date: '', time: '', duration: '', days: [],
  budget: '', pricingUnit: 'hourly',
  location: '', urgency: 'flexible',
};

export function SeekerRequestDialog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const modalStore = useModalStore();
  const isOpen = modalStore.showSeekerRequestDialog;
  const close = () => modalStore.setModal('showSeekerRequestDialog', false);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<SeekerFormState>(DEFAULT_FORM);
  const descRef = useAutoResizeTextarea(form.description);
  
  // Clean up when opening
  React.useEffect(() => {
    if (isOpen) {
      setStep(0);
      setForm(DEFAULT_FORM);
    }
  }, [isOpen]);

  const activeCat = WORKER_CATEGORIES.find(c => c.id === form.categoryId);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Must be logged in");
      const cat = WORKER_CATEGORIES.find(c => c.id === form.categoryId);
      const title = `${cat?.label ?? 'Worker'} needed${form.subcategory ? ` — ${form.subcategory}` : ''}`;

      const timeSlots = form.time ? [{ start: form.time }] : null;
      const daysAvailable = form.days.length > 0 ? form.days : null;

      const payload = {
        owner_id: user?.id,
        user_id: user?.id,
        listing_type: 'request',
        mode: 'seek',
        is_active: true,
        category: form.categoryId || 'other',
        service_category: form.subcategory || null,
        title,
        description: form.description || null,
        available_from: form.date || null,
        time_slots_available: timeSlots,
        minimum_booking_hours: form.duration ? parseFloat(form.duration) : null,
        days_available: daysAvailable,
        price: form.budget ? parseFloat(form.budget) : 0,
        pricing_unit: form.pricingUnit,
        location: form.location || 'Miami',
        status: form.urgency,
      };

      const { error } = await supabase.from('listings').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-seeker-requests'] });
      close();
    },
  });

  const toggleDay = (d: string) =>
    setForm(f => ({ ...f, days: f.days.includes(d) ? f.days.filter(x => x !== d) : [...f.days, d] }));

  const canAdvance = step === 0 ? !!form.categoryId : (!!form.location);

  // Build dynamic gradient based on active category
  const headerGradient = activeCat
    ? `linear-gradient(135deg, ${activeCat.color}22, ${activeCat.color}08)`
    : 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.05))';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent hideCloseButton={true} className="max-w-md w-full p-0 gap-0 overflow-hidden rounded-[32px] border-0 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)]"
        style={{
          background: 'linear-gradient(165deg, #0c0c14 0%, #111118 40%, #0a0a12 100%)',
        }}
      >
        {/* Ambient glow orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[32px]" aria-hidden="true">
          <div
            className="absolute top-[-30%] right-[-20%] w-[70%] h-[70%] rounded-full blur-[100px] mix-blend-screen transition-all duration-700"
            style={{ background: activeCat ? `${activeCat.color}20` : 'rgba(99,102,241,0.12)' }}
          />
          <div
            className="absolute bottom-[-20%] left-[-15%] w-[50%] h-[50%] rounded-full blur-[80px] mix-blend-screen transition-all duration-700"
            style={{ background: activeCat ? `${activeCat.color}15` : 'rgba(139,92,246,0.1)' }}
          />
        </div>

        {/* Header */}
        <div
          className="p-6 pb-4 relative z-10 flex justify-between items-start border-b border-white/[0.06]"
          style={{ background: headerGradient }}
        >
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] mb-1.5 block"
              style={{ color: activeCat?.color ?? '#A5B4FC' }}
            >
              Step {step + 1} of 2
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight italic">
              {step === 0 ? 'What do you need?' : `${activeCat?.label ?? 'Details'}`}
            </h2>
          </div>
          <button onClick={close} className="w-9 h-9 rounded-2xl bg-white/8 hover:bg-white/15 flex items-center justify-center text-white transition-all border border-white/10 active:scale-90 shadow-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 relative z-10 min-h-[400px] max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {step === 0 ? (
              <motion.div key="step0" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {WORKER_CATEGORIES.map(cat => {
                  const Icon = cat.Icon;
                  const isSelected = form.categoryId === cat.id;
                  return (
                    <motion.button
                      key={cat.id}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setForm(f => ({ ...f, categoryId: cat.id, subcategory: '' }))}
                      className={cn(
                        'flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all border relative overflow-hidden',
                        isSelected
                          ? 'text-white border-white/25 shadow-neumorph'
                          : 'bg-white/[0.04] border-white/[0.06] text-white/50 hover:bg-white/[0.08] hover:text-white/80'
                      )}
                      style={isSelected ? {
                        background: `linear-gradient(135deg, ${cat.color}dd, ${cat.color}88)`,
                        boxShadow: `0 8px 32px ${cat.color}40, inset 0 1px 0 rgba(255,255,255,0.15)`,
                      } : undefined}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.2),transparent_60%)] pointer-events-none" />
                      )}
                      <Icon className="w-6 h-6 mb-0.5 relative z-10" style={{ color: isSelected ? '#fff' : cat.color }} />
                      <span className="text-[9px] font-black uppercase tracking-wider text-center relative z-10">{cat.label}</span>
                    </motion.button>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="space-y-5">

                {/* Subcategory chips */}
                {activeCat?.subcategories && (
                  <div>
                    <Label className="text-[10px] uppercase tracking-[0.2em] font-black mb-2.5 block"
                      style={{ color: activeCat.color }}
                    >
                      Specific service
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {activeCat.subcategories.map(sub => (
                        <motion.button
                          key={sub}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setForm(f => ({ ...f, subcategory: sub }))}
                          className={cn(
                            'px-3.5 py-2 rounded-2xl text-[11px] font-bold transition-all border',
                            form.subcategory === sub
                              ? 'text-white border-transparent shadow-lg'
                              : 'bg-white/[0.04] border-white/[0.08] text-white/60 hover:bg-white/[0.08] hover:text-white/90'
                          )}
                          style={form.subcategory === sub ? {
                            background: `linear-gradient(135deg, ${activeCat.color}cc, ${activeCat.color}88)`,
                            boxShadow: `0 4px 20px ${activeCat.color}30`,
                          } : undefined}
                        >
                          {sub}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 mb-2 block">Details (Optional)</Label>
                  <textarea
                    ref={descRef}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Describe exactly what you need done..."
                    className="w-full min-h-[80px] rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4 text-sm resize-none focus:outline-none text-white placeholder-white/25 transition-all"
                    style={{ borderColor: form.description ? `${activeCat?.color ?? '#6366f1'}55` : undefined }}
                  />
                </div>

                {activeCat?.type === 'time-sensitive' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 mb-2 block flex items-center gap-1"><Calendar className="w-3 h-3" />Date</Label>
                        <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] text-white focus:border-white/20" />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 mb-2 block flex items-center gap-1"><Clock className="w-3 h-3" />Time</Label>
                        <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] text-white focus:border-white/20" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 mb-2 block">Duration (hrs)</Label>
                        <Input type="number" min="0.5" step="0.5" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 2" className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] text-white placeholder-white/25 focus:border-white/20" />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 mb-2 block flex items-center gap-1"><DollarSign className="w-3 h-3" />Budget/hr</Label>
                        <Input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value, pricingUnit: 'hourly' }))} placeholder="0" className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] text-white placeholder-white/25 focus:border-white/20" />
                      </div>
                    </div>
                  </>
                )}

                {activeCat?.type === 'project' && (
                  <>
                    <div>
                      <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 mb-2 block flex items-center gap-1"><Calendar className="w-3 h-3" />Preferred by</Label>
                      <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] text-white focus:border-white/20" />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 mb-2 block">Urgency</Label>
                      <div className="flex gap-2">
                        {(['flexible', 'soon', 'urgent'] as const).map(u => {
                          const urgencyColors: Record<string, string> = {
                            flexible: '#10b981',
                            soon: '#f59e0b',
                            urgent: '#ef4444',
                          };
                          return (
                            <motion.button
                              key={u}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setForm(f => ({ ...f, urgency: u }))}
                              className={cn(
                                'flex-1 py-2.5 rounded-xl text-[11px] font-black capitalize border transition-all uppercase tracking-wider',
                                form.urgency === u
                                  ? 'text-white border-transparent'
                                  : 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:bg-white/[0.08]'
                              )}
                              style={form.urgency === u ? {
                                background: `linear-gradient(135deg, ${urgencyColors[u]}dd, ${urgencyColors[u]}88)`,
                                boxShadow: `0 4px 16px ${urgencyColors[u]}30`,
                              } : undefined}
                            >
                              {u}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 mb-2 block flex items-center gap-1"><DollarSign className="w-3 h-3" />Budget (total)</Label>
                      <div className="flex gap-2">
                        <Input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="0" className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] text-white placeholder-white/25 focus:border-white/20 flex-1" />
                        <div className="flex rounded-xl overflow-hidden border border-white/[0.08]">
                          {['fixed', 'hourly'].map(unit => (
                            <motion.button
                              key={unit}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setForm(f => ({ ...f, pricingUnit: unit }))}
                              className={cn(
                                'px-3.5 text-[11px] font-bold capitalize transition-all',
                                form.pricingUnit === unit
                                  ? 'text-white'
                                  : 'bg-white/[0.02] text-white/50'
                              )}
                              style={form.pricingUnit === unit ? {
                                background: `linear-gradient(135deg, ${activeCat.color}cc, ${activeCat.color}88)`,
                              } : undefined}
                            >
                              {unit}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeCat?.type === 'ongoing' && (
                  <>
                    <div>
                      <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 mb-2.5 block">Days needed</Label>
                      <div className="flex gap-1.5">
                        {DAYS.map(d => (
                          <motion.button
                            key={d}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleDay(d)}
                            className={cn(
                              'flex-1 py-2 rounded-xl text-[10px] font-black transition-all border',
                              form.days.includes(d)
                                ? 'text-white border-transparent'
                                : 'bg-white/[0.04] border-white/[0.08] text-white/50'
                            )}
                            style={form.days.includes(d) ? {
                              background: `linear-gradient(135deg, ${activeCat.color}cc, ${activeCat.color}88)`,
                              boxShadow: `0 3px 12px ${activeCat.color}30`,
                            } : undefined}
                          >
                            {d.slice(0, 1)}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 mb-2 block flex items-center gap-1"><Clock className="w-3 h-3" />Start time</Label>
                        <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] text-white focus:border-white/20" />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 mb-2 block flex items-center gap-1"><DollarSign className="w-3 h-3" />$/session</Label>
                        <Input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value, pricingUnit: 'session' }))} placeholder="0" className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] text-white placeholder-white/25 focus:border-white/20" />
                      </div>
                    </div>
                  </>
                )}

                {/* Location */}
                <div>
                  <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 mb-2 block flex items-center gap-1"><MapPin className="w-3 h-3" />Location / Area</Label>
                  <Input
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. Downtown Miami, Aldea Zama..."
                    className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] text-white placeholder-white/25 focus:border-white/20"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer navigation */}
        <div className="flex gap-3 px-6 pb-6 pt-4 shrink-0 relative z-10 border-t border-white/[0.04]">
          {step === 1 && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setStep(0)}
              className="flex items-center justify-center w-12 h-12 rounded-2xl font-bold text-sm border border-white/[0.08] text-white bg-white/[0.04] hover:bg-white/[0.08] transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
          )}
          {step === 0 ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={!canAdvance}
              onClick={() => setStep(1)}
              className={cn(
                "flex-1 h-14 rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] italic text-white flex items-center justify-center gap-2 transition-all relative overflow-hidden",
                !canAdvance && "opacity-30 cursor-not-allowed"
              )}
              style={{
                background: canAdvance
                  ? `linear-gradient(135deg, ${activeCat?.color ?? '#6366f1'}, ${activeCat?.color ?? '#8b5cf6'}88)`
                  : 'rgba(255,255,255,0.06)',
                boxShadow: canAdvance ? `0 12px 40px ${activeCat?.color ?? '#6366f1'}35` : 'none',
              }}
            >
              {canAdvance && (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
              )}
              <span className="relative z-10">Continue to Details</span>
              <ChevronRight className="w-5 h-5 relative z-10" />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={saveMutation.isPending || !form.location.trim()}
              onClick={() => saveMutation.mutate()}
              className={cn(
                "flex-1 h-14 rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] italic text-white flex items-center justify-center gap-2 transition-all relative overflow-hidden",
                (saveMutation.isPending || !form.location.trim()) && "opacity-30 cursor-not-allowed"
              )}
              style={{
                background: !saveMutation.isPending && form.location.trim()
                  ? `linear-gradient(135deg, ${activeCat?.color ?? '#6366f1'}, ${activeCat?.color ?? '#8b5cf6'}88)`
                  : 'rgba(255,255,255,0.06)',
                boxShadow: !saveMutation.isPending && form.location.trim()
                  ? `0 12px 40px ${activeCat?.color ?? '#6366f1'}35`
                  : 'none',
              }}
            >
              {!saveMutation.isPending && form.location.trim() && (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
              )}
              <span className="relative z-10">{saveMutation.isPending ? 'Posting...' : 'Post Request'}</span>
            </motion.button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
