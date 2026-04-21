import { useState, type ComponentType } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/PageHeader';
import { MaintenanceRequestForm } from '@/components/MaintenanceRequestForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Wrench, Zap, Wind, Cpu, Building2, MoreHorizontal, Clock, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const categoryIcons: Record<string, ComponentType<{ className?: string }>> = {
  plumbing: Wrench,
  electrical: Zap,
  ac: Wind,
  appliance: Cpu,
  structural: Building2,
  other: MoreHorizontal,
};

const statusConfig: Record<string, { label: string; color: string; icon: ComponentType<{ className?: string }> }> = {
  submitted: { label: 'Submitted', color: 'bg-blue-500/15 text-blue-400 border-blue-500/25', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-amber-500/15 text-amber-400 border-amber-500/25', icon: Wrench },
  resolved: { label: 'Resolved', color: 'bg-rose-500/15 text-rose-400 border-rose-500/25', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'bg-muted text-muted-foreground border-border', icon: CheckCircle2 },
};

const priorityColors: Record<string, string> = {
  low: 'text-rose-400',
  medium: 'text-amber-400',
  high: 'text-orange-400',
  urgent: 'text-red-400',
};

const filters = ['all', 'submitted', 'in_progress', 'resolved'] as const;

const MaintenanceRequests = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const { data: requests, refetch, isLoading } = useQuery({
    queryKey: ['maintenance-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const filtered = requests?.filter(r => activeFilter === 'all' || r.status === activeFilter) || [];

  return (
    <div className="w-full min-h-full px-4 pt-4 pb-32 scrollbar-hide bg-background">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader title="Maintenance" subtitle="Report and track issues" showBack backTo="/client/settings" />
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              size="sm"
              className="rounded-xl gap-1.5"
            >
              <Plus className="w-4 h-4" />
              New
            </Button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {showForm ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-5"
            >
              <h3 className="text-sm font-bold text-foreground mb-4">New Maintenance Request</h3>
              <MaintenanceRequestForm
                onSuccess={() => { setShowForm(false); refetch(); }}
                onCancel={() => setShowForm(false)}
              />
            </motion.div>
          ) : (
            <motion.div key="list" className="space-y-4">
              {/* Filter pills */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {filters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                      activeFilter === f
                        ? "bg-primary/15 text-primary border-primary/30"
                        : "bg-card/50 text-muted-foreground border-border"
                    )}
                  >
                    {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              {/* Request cards */}
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 space-y-3"
                >
                  <Wrench className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm text-muted-foreground">No maintenance requests yet</p>
                  <Button onClick={() => setShowForm(true)} variant="outline" size="sm" className="rounded-xl">
                    Submit your first request
                  </Button>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((req, i) => {
                    const status = statusConfig[req.status] || statusConfig.submitted;
                    const StatusIcon = status.icon;
                    const CatIcon = categoryIcons[req.category] || MoreHorizontal;
                    const photoUrls = (req.photo_urls as string[]) || [];

                    return (
                      <motion.div
                        key={req.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <CatIcon className="w-4.5 h-4.5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-foreground truncate">{req.title}</h4>
                              <p className="text-[11px] text-muted-foreground capitalize">{req.category} · <span className={priorityColors[req.priority]}>{req.priority}</span></p>
                            </div>
                          </div>
                          <Badge variant="outline" className={cn("text-[10px] font-bold shrink-0 gap-1", status.color)}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </Badge>
                        </div>

                        {req.description && (
                          <p className="text-xs text-foreground/70 leading-relaxed line-clamp-2">{req.description}</p>
                        )}

                        {photoUrls.length > 0 && (
                          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                            {photoUrls.map((url, j) => (
                              <img key={j} src={url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-border" />
                            ))}
                          </div>
                        )}

                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(req.created_at), 'MMM d, yyyy · h:mm a')}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MaintenanceRequests;

