import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import useAppTheme from '@/hooks/useAppTheme';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function SeekerAdSection() {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const isLight = theme === 'light';
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', category: 'worker', description: '' });

  const { data: requests, isLoading } = useQuery({
    queryKey: ['my-requests', user?.id],
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
      if (editingId) {
        const { error } = await supabase
          .from('listings')
          .update({ title: formData.title, category: formData.category, description: formData.description })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('listings')
          .insert({
            owner_id: user?.id,
            listing_type: 'request',
            title: formData.title,
            category: formData.category,
            description: formData.description,
            is_active: true,
            mode: 'seek', // Important: designates seeking vs offering
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      setIsModalOpen(false);
      resetForm();
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('listings')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
    }
  });

  const resetForm = () => {
    setEditingId(null);
    setFormData({ title: '', category: 'worker', description: '' });
  };

  const openEdit = (req: any) => {
    setEditingId(req.id);
    setFormData({ title: req.title || '', category: req.category || 'worker', description: req.description || '' });
    setIsModalOpen(true);
  };

  const openNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  if (!user) return null;

  return (
    <div className={cn("rounded-3xl p-6 border shadow-xl relative overflow-hidden", isLight ? "bg-white border-black/5" : "bg-black/40 border-white/10")}>
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-fuchsia-500/5 to-transparent pointer-events-none" />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-400/30 shadow-lg">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-lg text-foreground tracking-tight">Seeker Requests</h3>
            <p className="text-xs text-muted-foreground font-medium">Post what you are looking for</p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={openNew}
          className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
        </motion.button>
      </div>

      <div className="space-y-3 relative z-10">
        {isLoading ? (
          <div className="h-20 animate-pulse bg-muted rounded-2xl" />
        ) : requests && requests.length > 0 ? (
          requests.map(req => (
            <div key={req.id} className={cn("p-4 rounded-2xl border flex items-center justify-between transition-all", isLight ? "bg-slate-50 border-black/5 hover:border-black/10" : "bg-white/5 border-white/5 hover:border-white/10", !req.is_active && "opacity-60")}>
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">{req.category === 'worker' ? 'Tasker' : req.category}</span>
                  {!req.is_active && <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Inactive</span>}
                </div>
                <h4 className="font-bold text-foreground truncate text-sm">{req.title || 'Untitled Request'}</h4>
                {req.description && <p className="text-xs text-muted-foreground truncate">{req.description}</p>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Switch
                  checked={req.is_active}
                  onCheckedChange={(c) => toggleMutation.mutate({ id: req.id, is_active: c })}
                  disabled={toggleMutation.isPending}
                  className="data-[state=checked]:bg-indigo-500"
                />
                <button onClick={() => openEdit(req)} className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-secondary">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => deleteMutation.mutate(req.id)} className="text-red-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-500/10">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center p-6 border border-dashed rounded-2xl border-border bg-background/50 backdrop-blur-sm">
            <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">No Active Requests</p>
            <p className="text-xs text-muted-foreground">Post a request to let others know what you need (e.g. Plumber, Roommate, Apartment).</p>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-border bg-background p-6">
          <DialogHeader>
            <DialogTitle className="font-black text-2xl tracking-tighter text-foreground">
              {editingId ? 'Edit Request' : 'New Request'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                <SelectTrigger className="h-12 rounded-xl bg-secondary border-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border">
                  <SelectItem value="worker">Tasker / Service</SelectItem>
                  <SelectItem value="property">Property / Housing</SelectItem>
                  <SelectItem value="roommate">Roommate</SelectItem>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">What do you need?</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. Looking for a reliable plumber"
                className="h-12 rounded-xl font-medium bg-secondary border-transparent focus-visible:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Details (Optional)</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="e.g. Need help fixing a leak under the sink..."
                className="h-12 rounded-xl bg-secondary border-transparent focus-visible:ring-indigo-500"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl h-12 font-bold w-full border-border hover:bg-secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !formData.title.trim()}
              className="rounded-xl h-12 font-black w-full bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
