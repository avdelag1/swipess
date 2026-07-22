import React, { useState } from 'react';
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';
import { AnimatePresence, motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Baby, Calendar, Car, ChefHat, ChevronLeft, ChevronRight,
  Clock, DollarSign, Dumbbell, Edit, Hammer, HeartPulse, Laptop,
  Leaf, MapPin, Package, Paintbrush, Plus, Search,
  Shield, Sparkles, Trash2, Wrench, X, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useModalStore } from '@/state/modalStore';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const WORKER_CATEGORIES = [
  { id: 'cleaning',   label: 'Cleaning',   Icon: Sparkles,   type: 'time-sensitive' as const, color: '#3b82f6', subcategories: ['Regular cleaning', 'Deep cleaning', 'Move-in/out', 'Office cleaning', 'Post-construction'] },
  { id: 'plumbing',   label: 'Plumbing',   Icon: Wrench,     type: 'project'        as const, color: '#06b6d4', subcategories: ['Leak repair', 'Pipe installation', 'Drain unclog', 'Water heater', 'Bathroom work'] },
  { id: 'electrical', label: 'Electrical', Icon: Zap,        type: 'project'        as const, color: '#f59e0b', subcategories: ['Outlet/switch', 'Lighting install', 'Circuit breaker', 'Wiring', 'Generator'] },
  { id: 'driving',    label: 'Driver',     Icon: Car,        type: 'time-sensitive' as const, color: '#10b981', subcategories: ['Airport transfer', 'Daily driver', 'Event chauffeur', 'Errands', 'Moving items'] },
  { id: 'chef',       label: 'Chef',       Icon: ChefHat,    type: 'time-sensitive' as const, color: '#f97316', subcategories: ['Private dinner', 'Meal prep', 'Party catering', 'Cooking classes', 'Special diet'] },
  { id: 'gardening',  label: 'Gardening',  Icon: Leaf,       type: 'ongoing'        as const, color: '#22c55e', subcategories: ['Lawn mowing', 'Landscaping', 'Tree trimming', 'Garden design', 'Irrigation'] },
  { id: 'handyman',   label: 'Handyman',   Icon: Hammer,     type: 'project'        as const, color: '#8b5cf6', subcategories: ['Furniture assembly', 'Wall mounting', 'Door/lock repair', 'Tile repair', 'General repairs'] },
  { id: 'childcare',  label: 'Childcare',  Icon: Baby,       type: 'ongoing'        as const, color: '#ec4899', subcategories: ['Full-time nanny', 'Babysitter', 'After-school care', 'Weekend coverage', 'Newborn'] },
  { id: 'fitness',    label: 'Fitness',    Icon: Dumbbell,   type: 'ongoing'        as const, color: '#ef4444', subcategories: ['Personal training', 'Group fitness', 'Yoga', 'Nutrition coaching', 'Sports'] },
  { id: 'massage',    label: 'Massage',    Icon: HeartPulse, type: 'time-sensitive' as const, color: '#a855f7', subcategories: ['Swedish', 'Deep tissue', 'Sports massage', 'Couples massage', 'Prenatal'] },
  { id: 'moving',     label: 'Moving',     Icon: Package,    type: 'time-sensitive' as const, color: '#f43f5e', subcategories: ['Full move', 'Partial move', 'Packing help', 'Loading/unloading', 'Rearranging'] },
  { id: 'tech',       label: 'Tech / IT',  Icon: Laptop,     type: 'project'        as const, color: '#6366f1', subcategories: ['Computer repair', 'Network setup', 'Smart home', 'Phone repair', 'Software help'] },
  { id: 'painting',   label: 'Painting',   Icon: Paintbrush, type: 'project'        as const, color: '#0ea5e9', subcategories: ['Interior', 'Exterior', 'Murals/decorative', 'Furniture refinishing', 'Touch-ups'] },
  { id: 'security',   label: 'Security',   Icon: Shield,     type: 'ongoing'        as const, color: '#64748b', subcategories: ['Security guard', 'CCTV install', 'Home security', 'Event security', 'Night watch'] },
  { id: 'other',      label: 'Other',      Icon: Sparkles,   type: 'project'        as const, color: '#94a3b8', subcategories: ['Describe your need below'] },
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-md w-full p-0 gap-0 overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-slate-800 to-black border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)]">
        {/* Header */}
        <div className="p-6 pb-2 relative z-10 flex justify-between items-start bg-white/5 backdrop-blur-md border-b border-white/5">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1 block">STEP {step + 1} OF 2</span>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {step === 0 ? 'What do you need?' : `${activeCat?.label ?? 'Details'}`}
            </h2>
          </div>
          <button onClick={close} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors border border-white/5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 relative z-10 min-h-[400px]">
          <AnimatePresence mode="wait">
            {step === 0 ? (
              <motion.div key="step0" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {WORKER_CATEGORIES.map(cat => {
                  const Icon = cat.Icon;
                  const isSelected = form.categoryId === cat.id;
                  return (
                    <button key={cat.id} onClick={() => setForm(f => ({ ...f, categoryId: cat.id, subcategory: '' }))}
                      className={cn(
                        'flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all border',
                        isSelected ? 'bg-white/20 border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                      )}>
                      <Icon className="w-6 h-6 mb-1" style={{ color: isSelected ? cat.color : undefined }} />
                      <span className="text-[9px] font-black uppercase tracking-wider text-center">{cat.label}</span>
                    </button>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="space-y-5">

                {/* Subcategory */}
                {activeCat?.subcategories && (
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-white/50 mb-2 block">Specific service</Label>
                    <div className="flex flex-wrap gap-2">
                      {activeCat.subcategories.map(sub => (
                        <button key={sub} onClick={() => setForm(f => ({ ...f, subcategory: sub }))}
                          className={cn('px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border', form.subcategory === sub ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10')}>
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <Label className="text-[10px] uppercase tracking-widest font-bold text-white/50 mb-2 block">Details (Optional)</Label>
                  <textarea
                    ref={descRef}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Describe exactly what you need done..."
                    className="w-full min-h-[80px] rounded-2xl bg-white/5 border border-white/10 p-4 text-sm resize-none focus:outline-none focus:border-white/30 text-white placeholder-white/30"
                  />
                </div>

                {activeCat?.type === 'time-sensitive' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-white/50 mb-2 block flex items-center gap-1"><Calendar className="w-3 h-3" />Date</Label>
                        <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="h-11 rounded-xl bg-white/5 border-white/10 text-white" />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-white/50 mb-2 block flex items-center gap-1"><Clock className="w-3 h-3" />Time</Label>
                        <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="h-11 rounded-xl bg-white/5 border-white/10 text-white" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-white/50 mb-2 block">Duration (hrs)</Label>
                        <Input type="number" min="0.5" step="0.5" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 2" className="h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder-white/30" />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-white/50 mb-2 block flex items-center gap-1"><DollarSign className="w-3 h-3" />Budget/hr</Label>
                        <Input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value, pricingUnit: 'hourly' }))} placeholder="0" className="h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder-white/30" />
                      </div>
                    </div>
                  </>
                )}

                {activeCat?.type === 'project' && (
                  <>
                    <div>
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-white/50 mb-2 block flex items-center gap-1"><Calendar className="w-3 h-3" />Preferred by</Label>
                      <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="h-11 rounded-xl bg-white/5 border-white/10 text-white" />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-white/50 mb-2 block">Urgency</Label>
                      <div className="flex gap-2">
                        {['flexible', 'soon', 'urgent'].map(u => (
                          <button key={u} onClick={() => setForm(f => ({ ...f, urgency: u }))}
                            className={cn('flex-1 py-2 rounded-xl text-[11px] font-bold capitalize border transition-all', form.urgency === u ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-white/70')}>
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-white/50 mb-2 block flex items-center gap-1"><DollarSign className="w-3 h-3" />Budget (total)</Label>
                      <div className="flex gap-2">
                        <Input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="0" className="h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder-white/30 flex-1" />
                        <div className="flex rounded-xl overflow-hidden border border-white/10">
                          {['fixed', 'hourly'].map(unit => (
                            <button key={unit} onClick={() => setForm(f => ({ ...f, pricingUnit: unit }))}
                              className={cn('px-3 text-[11px] font-bold capitalize transition-all', form.pricingUnit === unit ? 'bg-white text-black' : 'bg-white/5 text-white/70')}>
                              {unit}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeCat?.type === 'ongoing' && (
                  <>
                    <div>
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-white/50 mb-2 block">Days needed</Label>
                      <div className="flex gap-1.5">
                        {DAYS.map(d => (
                          <button key={d} onClick={() => toggleDay(d)}
                            className={cn('flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all border', form.days.includes(d) ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-white/70')}>
                            {d.slice(0, 1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-white/50 mb-2 block flex items-center gap-1"><Clock className="w-3 h-3" />Start time</Label>
                        <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="h-11 rounded-xl bg-white/5 border-white/10 text-white" />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-white/50 mb-2 block flex items-center gap-1"><DollarSign className="w-3 h-3" />$/session</Label>
                        <Input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value, pricingUnit: 'session' }))} placeholder="0" className="h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder-white/30" />
                      </div>
                    </div>
                  </>
                )}

                {/* Location */}
                <div>
                  <Label className="text-[10px] uppercase tracking-widest font-bold text-white/50 mb-2 block flex items-center gap-1"><MapPin className="w-3 h-3" />Location / Area</Label>
                  <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Downtown Miami, Aldea Zama..." className="h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder-white/30" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer navigation */}
        <div className="flex gap-3 px-6 pb-6 pt-4 shrink-0 bg-white/5 backdrop-blur-md border-t border-white/5">
          {step === 1 && (
            <button onClick={() => setStep(0)} className="flex items-center justify-center w-12 h-12 rounded-xl font-bold text-sm border border-white/10 text-white bg-white/5 hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {step === 0 ? (
            <button
              disabled={!canAdvance}
              onClick={() => setStep(1)}
              className={cn(
                "flex-1 h-14 rounded-2xl font-black text-[15px] uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all shadow-xl",
                canAdvance 
                  ? "bg-gradient-to-r from-[#FF4D00] to-[#EB4898] hover:scale-[0.98] shadow-pink-500/25" 
                  : "bg-white/10 text-white/40 shadow-none cursor-not-allowed border border-white/5"
              )}
            >
              Continue to Details
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              disabled={saveMutation.isPending || !form.location.trim()}
              onClick={() => saveMutation.mutate()}
              className={cn(
                "flex-1 h-14 rounded-2xl font-black text-[15px] uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all shadow-xl",
                !saveMutation.isPending && form.location.trim()
                  ? "bg-gradient-to-r from-[#FF4D00] to-[#EB4898] hover:scale-[0.98] shadow-pink-500/25"
                  : "bg-white/10 text-white/40 shadow-none cursor-not-allowed border border-white/5"
              )}
            >
              {saveMutation.isPending ? 'Posting...' : 'Post Request'}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
