import React, { useState } from 'react';
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';
import { AnimatePresence, motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Baby, Calendar, Car, ChefHat, ChevronLeft, ChevronRight,
  Clock, DollarSign, Dumbbell, Edit, Hammer, HeartPulse, Laptop,
  Leaf, MapPin, Package, Paintbrush, Plus, Search,
  Shield, Sparkles, Trash2, Wrench, X, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import useAppTheme from '@/hooks/useAppTheme';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const WORKER_CATEGORIES = [
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

interface FormState {
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

const DEFAULT_FORM: FormState = {
  categoryId: '', subcategory: '', description: '',
  date: '', time: '', duration: '', days: [],
  budget: '', pricingUnit: 'hourly',
  location: '', urgency: 'flexible',
};

export function SeekerAdSection() {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const isLight = theme === 'light';
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const descRef = useAutoResizeTextarea(form.description);

  const activeCat = WORKER_CATEGORIES.find(c => c.id === form.categoryId);

  const { data: requests, isLoading } = useQuery({
    queryKey: ['my-seeker-requests', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('owner_id', user?.id)
        .eq('listing_type', 'request')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
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

      if (editingId) {
        const { error } = await supabase.from('listings').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('listings').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-seeker-requests'] });
      closeModal();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('listings').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-seeker-requests'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('listings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-seeker-requests'] }),
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setStep(0);
    setForm(DEFAULT_FORM);
  };

  const openNew = () => { setForm(DEFAULT_FORM); setStep(0); setEditingId(null); setIsModalOpen(true); };

  const openEdit = (req: any) => {
    setEditingId(req.id);
    const timeSlots = req.time_slots_available as any[];
    setForm({
      categoryId: req.category || '',
      subcategory: req.service_category || '',
      description: req.description || '',
      date: req.available_from?.split('T')[0] || '',
      time: timeSlots?.[0]?.start || '',
      duration: req.minimum_booking_hours?.toString() || '',
      days: Array.isArray(req.days_available) ? req.days_available as string[] : [],
      budget: req.price?.toString() || '',
      pricingUnit: req.pricing_unit || 'hourly',
      location: req.location || '',
      urgency: req.status || 'flexible',
    });
    setStep(1);
    setIsModalOpen(true);
  };

  const toggleDay = (d: string) =>
    setForm(f => ({ ...f, days: f.days.includes(d) ? f.days.filter(x => x !== d) : [...f.days, d] }));

  const canAdvance = step === 0 ? !!form.categoryId : (!!form.location);

  if (!user) return null;

  return (
    <div className={cn('rounded-3xl p-6 border shadow-xl relative overflow-hidden', isLight ? 'bg-white border-black/5' : 'bg-black/40 border-white/10')}>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-fuchsia-500/5 to-transparent pointer-events-none" />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-400/30 shadow-lg">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-lg text-foreground tracking-tight">Seeker Requests</h3>
            <p className="text-xs text-muted-foreground font-medium">Post what professional you need</p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={openNew}
          className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg"
        >
          <Plus className="w-5 h-5" />
        </motion.button>
      </div>

      <div className="space-y-3 relative z-10">
        {isLoading ? (
          <div className="h-20 animate-pulse bg-muted rounded-2xl" />
        ) : requests && requests.length > 0 ? (
          requests.map(req => {
            const cat = WORKER_CATEGORIES.find(c => c.id === req.category);
            const Icon = cat?.Icon ?? Search;
            return (
              <div key={req.id} className={cn('p-4 rounded-2xl border flex items-center justify-between transition-all', isLight ? 'bg-slate-50 border-black/5' : 'bg-white/5 border-white/5', !req.is_active && 'opacity-50')}>
                <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
                  <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center" style={{ background: `${cat?.color ?? '#94a3b8'}22` }}>
                    <Icon className="w-4 h-4" style={{ color: cat?.color ?? '#94a3b8' }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: cat?.color ?? '#94a3b8' }}>{cat?.label ?? req.category}</span>
                      {req.service_category && <span className="text-[10px] text-muted-foreground">· {req.service_category}</span>}
                      {!req.is_active && <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">Off</span>}
                    </div>
                    <p className="font-bold text-foreground truncate text-sm">{req.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {req.available_from && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{new Date(req.available_from).toLocaleDateString()}</span>}
                      {req.price > 0 && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><DollarSign className="w-2.5 h-2.5" />{req.price}/{req.pricing_unit}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={!!req.is_active} onCheckedChange={v => toggleMutation.mutate({ id: req.id, is_active: v })} className="data-[state=checked]:bg-indigo-500" />
                  <button onClick={() => openEdit(req)} className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-secondary">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteMutation.mutate(req.id)} className="text-red-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-500/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center p-6 border border-dashed rounded-2xl border-border bg-background/50">
            <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">No Active Requests</p>
            <p className="text-xs text-muted-foreground">Post a request to let professionals know you need help.</p>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={v => { if (!v) closeModal(); }}>
        <DialogContent className="p-0 overflow-hidden rounded-[2rem] border-border bg-background max-w-sm w-full max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
                {step === 0 ? 'Step 1 of 2' : 'Step 2 of 2'}
              </p>
              <h2 className="text-2xl font-black tracking-tighter text-foreground">
                {step === 0 ? 'What do you need?' : `${activeCat?.label ?? 'Details'} request`}
              </h2>
            </div>
            <button onClick={closeModal} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Animated step content */}
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            <AnimatePresence mode="sync" initial={false}>
              {step === 0 ? (
                <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                  <div className="grid grid-cols-3 gap-2">
                    {WORKER_CATEGORIES.map(cat => {
                      const isSelected = form.categoryId === cat.id;
                      return (
                        <motion.button
                          key={cat.id}
                          whileTap={{ scale: 0.93 }}
                          onClick={() => setForm(f => ({ ...f, categoryId: cat.id, subcategory: '' }))}
                          className={cn('flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all', isSelected ? 'border-transparent shadow-lg' : 'border-border bg-background hover:border-border/60')}
                          style={isSelected ? { background: `${cat.color}18`, borderColor: cat.color, boxShadow: `0 4px 20px ${cat.color}33` } : {}}
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: isSelected ? `${cat.color}28` : 'hsl(var(--muted))' }}>
                            <cat.Icon className="w-4 h-4" style={{ color: isSelected ? cat.color : 'hsl(var(--muted-foreground))' }} />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wide leading-tight text-center" style={{ color: isSelected ? cat.color : 'hsl(var(--foreground))' }}>{cat.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-5">
                  {/* Subcategory */}
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2 block">Task type</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {activeCat?.subcategories.map(sub => (
                        <button
                          key={sub}
                          onClick={() => setForm(f => ({ ...f, subcategory: f.subcategory === sub ? '' : sub }))}
                          className={cn('px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all', form.subcategory === sub ? 'text-white border-transparent' : 'border-border text-foreground bg-background hover:border-border/80')}
                          style={form.subcategory === sub ? { background: activeCat?.color, borderColor: activeCat?.color } : {}}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2 block">Tell us more</Label>
                    <textarea
                      ref={descRef}
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Describe exactly what you need, any specific requirements..."
                      rows={3}
                      className="w-full rounded-xl bg-secondary border border-transparent text-foreground text-sm font-medium p-3 resize-none focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-muted-foreground/50"
                    />
                  </div>

                  {/* Adaptive schedule fields */}
                  {activeCat?.type === 'time-sensitive' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2 block flex items-center gap-1"><Calendar className="w-3 h-3" />Date</Label>
                          <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="h-11 rounded-xl bg-secondary border-transparent" />
                        </div>
                        <div>
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2 block flex items-center gap-1"><Clock className="w-3 h-3" />Time</Label>
                          <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="h-11 rounded-xl bg-secondary border-transparent" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2 block">Duration (hours)</Label>
                          <Input type="number" min="0.5" step="0.5" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 2" className="h-11 rounded-xl bg-secondary border-transparent" />
                        </div>
                        <div>
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2 block flex items-center gap-1"><DollarSign className="w-3 h-3" />Budget/hr</Label>
                          <Input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value, pricingUnit: 'hourly' }))} placeholder="0" className="h-11 rounded-xl bg-secondary border-transparent" />
                        </div>
                      </div>
                    </>
                  )}

                  {activeCat?.type === 'project' && (
                    <>
                      <div>
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2 block flex items-center gap-1"><Calendar className="w-3 h-3" />Preferred by</Label>
                        <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="h-11 rounded-xl bg-secondary border-transparent" />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2 block">Urgency</Label>
                        <div className="flex gap-2">
                          {['flexible', 'soon', 'urgent'].map(u => (
                            <button key={u} onClick={() => setForm(f => ({ ...f, urgency: u }))}
                              className={cn('flex-1 py-2 rounded-xl text-[11px] font-bold capitalize border transition-all', form.urgency === u ? 'bg-foreground text-background border-foreground' : 'border-border text-foreground bg-background')}>
                              {u}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2 block flex items-center gap-1"><DollarSign className="w-3 h-3" />Budget (total)</Label>
                        <div className="flex gap-2">
                          <Input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="0" className="h-11 rounded-xl bg-secondary border-transparent flex-1" />
                          <div className="flex rounded-xl overflow-hidden border border-border">
                            {['fixed', 'hourly'].map(unit => (
                              <button key={unit} onClick={() => setForm(f => ({ ...f, pricingUnit: unit }))}
                                className={cn('px-3 text-[11px] font-bold capitalize transition-all', form.pricingUnit === unit ? 'bg-foreground text-background' : 'text-muted-foreground bg-background')}>
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
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2 block">Days needed</Label>
                        <div className="flex gap-1.5">
                          {DAYS.map(d => (
                            <button key={d} onClick={() => toggleDay(d)}
                              className={cn('flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all border', form.days.includes(d) ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground bg-background')}>
                              {d.slice(0, 1)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2 block flex items-center gap-1"><Clock className="w-3 h-3" />Start time</Label>
                          <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="h-11 rounded-xl bg-secondary border-transparent" />
                        </div>
                        <div>
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2 block flex items-center gap-1"><DollarSign className="w-3 h-3" />$/session</Label>
                          <Input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value, pricingUnit: 'session' }))} placeholder="0" className="h-11 rounded-xl bg-secondary border-transparent" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Location */}
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2 block flex items-center gap-1"><MapPin className="w-3 h-3" />Location / Area</Label>
                    <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Downtown Miami, Aldea Zama..." className="h-11 rounded-xl bg-secondary border-transparent" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer navigation */}
          <div className="flex gap-3 px-6 pb-6 pt-2 shrink-0 border-t border-border/50">
            {step === 1 && (
              <button onClick={() => setStep(0)} className="flex items-center gap-1.5 h-12 px-4 rounded-xl font-bold text-sm border border-border text-foreground bg-background hover:bg-secondary transition-colors">
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            {step === 0 ? (
              <button
                disabled={!canAdvance}
                onClick={() => setStep(1)}
                className="flex-1 h-12 rounded-xl font-black text-sm text-white flex items-center justify-center gap-1.5 disabled:opacity-40 transition-opacity"
                style={{ background: activeCat?.color ?? 'hsl(var(--foreground))' }}
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                disabled={saveMutation.isPending || !form.location.trim()}
                onClick={() => saveMutation.mutate()}
                className="flex-1 h-12 rounded-xl font-black text-sm text-white flex items-center justify-center gap-1.5 disabled:opacity-40 transition-opacity"
                style={{ background: activeCat?.color ?? 'hsl(var(--foreground))' }}
              >
                {saveMutation.isPending ? 'Posting...' : editingId ? 'Save Changes' : 'Post Request'}
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
