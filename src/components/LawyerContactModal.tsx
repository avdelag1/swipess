import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Phone, MessageSquare, Scale, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { triggerHaptic } from '@/utils/haptics';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LawyerContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LawyerContactModal({ isOpen, onClose }: LawyerContactModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    problem: '',
    phone: '',
    category: 'Rental Agreement'
  });

  const categories = ['Rental Agreement', 'Ownership Dispute', 'Contract Review', 'Other'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    triggerHaptic('medium');

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setStep('success');
      triggerHaptic('success');
      toast.success('Inquiry sent to our legal team');
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-card border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <Scale className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-white uppercase italic">Legal Assistance</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">Personal Lawyer Contact</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/5">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-8">
              {step === 'form' ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Preloaded Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Account</label>
                      <div className="px-4 py-3 bg-white/5 rounded-2xl border border-white/5 text-xs text-white/60 font-medium">
                        {user?.email || 'User'}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Phone Number</label>
                      <Input
                        required
                        type="tel"
                        placeholder="+52 984 ..."
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="h-11 bg-white/5 border-white/10 rounded-2xl focus:ring-amber-500/50"
                      />
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Type of Inquiry</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => { triggerHaptic('light'); setFormData({...formData, category: cat}); }}
                          className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                            formData.category === cat 
                              ? "bg-amber-500 border-amber-500 text-black" 
                              : "bg-white/5 border-white/5 text-white/70 hover:text-white/60"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Problem Description */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Describe your problem</label>
                    <Textarea
                      required
                      placeholder="Please provide as much detail as possible..."
                      value={formData.problem}
                      onChange={e => setFormData({...formData, problem: e.target.value})}
                      className="min-h-[120px] bg-white/5 border-white/10 rounded-2xl focus:ring-amber-500/50 resize-none p-4"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] transition-all text-black font-black uppercase tracking-[0.2em] text-xs shadow-[0_10px_30px_rgba(245,158,11,0.3)]"
                  >
                    {loading ? 'Processing...' : 'Request Direct Contact'}
                    <Send className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              ) : (
                <div className="py-12 flex flex-col items-center text-center space-y-6">
                  <div className="w-20 h-20 rounded-[2rem] bg-violet-500/10 flex items-center justify-center border border-violet-500/20 shadow-[0_0_40px_rgba(139,92,246,0.2)]">
                    <CheckCircle2 className="w-10 h-10 text-violet-500" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black tracking-tight text-white uppercase italic">Inquiry Received</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
                      Our legal team has been notified. A personal lawyer will contact you via {formData.phone || 'your registered number'} within 24 hours.
                    </p>
                  </div>
                  <Button 
                    onClick={onClose}
                    className="w-full h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] border border-white/10"
                  >
                    Got it, thanks
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}


