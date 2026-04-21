import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Clock, CheckCircle2, AlertTriangle, DollarSign, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface EscrowDeposit {
  id: string;
  contract_id: string;
  client_id: string;
  owner_id: string;
  amount: number;
  currency: string;
  status: string;
  held_at: string | null;
  released_at: string | null;
  disputed_at: string | null;
  notes: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  held: { label: 'Held in Escrow', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  released: { label: 'Released', icon: CheckCircle2, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  disputed: { label: 'Disputed', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
};

export default function EscrowDashboard() {
  const { user } = useAuth();
  const [deposits, setDeposits] = useState<EscrowDeposit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchDeposits();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchDeposits = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('escrow_deposits')
      .select('*')
      .or(`client_id.eq.${user.id},owner_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    setDeposits((data as unknown as EscrowDeposit[]) || []);
    setIsLoading(false);
  };

  const handleStatusUpdate = async (depositId: string, newStatus: string) => {
    const { error } = await supabase
      .from('escrow_deposits')
      .update({
        status: newStatus,
        ...(newStatus === 'held' ? { held_at: new Date().toISOString() } : {}),
        ...(newStatus === 'released' ? { released_at: new Date().toISOString() } : {}),
        ...(newStatus === 'disputed' ? { disputed_at: new Date().toISOString() } : {}),
      })
      .eq('id', depositId);
    if (error) { toast.error('Failed to update'); return; }
    toast.success(`Deposit ${newStatus}`);
    fetchDeposits();
  };

  const isOwner = (d: EscrowDeposit) => d.owner_id === user?.id;

  return (
    <div className="min-h-screen bg-background p-4 pb-24 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Deposit Escrow
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Track and manage security deposits</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-card animate-pulse" />)}
        </div>
      ) : deposits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Shield className="w-16 h-16 text-muted-foreground/30" />
          <h2 className="text-lg font-bold text-foreground">No Deposits Yet</h2>
          <p className="text-sm text-muted-foreground text-center">Escrow deposits will appear here when created through contracts.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deposits.map(deposit => {
            const config = STATUS_CONFIG[deposit.status] || STATUS_CONFIG.pending;
            const StatusIcon = config.icon;
            return (
              <div key={deposit.id} className="rounded-2xl bg-card border border-border/30 overflow-hidden">
                {/* Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', config.bg)}>
                      <StatusIcon className={cn('w-5 h-5', config.color)} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" />
                        ${deposit.amount.toLocaleString()} {deposit.currency}
                      </p>
                      <p className={cn('text-xs font-medium', config.color)}>{config.label}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{format(new Date(deposit.created_at), 'MMM d')}</span>
                </div>

                {/* Timeline */}
                <div className="px-4 pb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={deposit.status !== 'pending' ? 'text-rose-400 font-medium' : ''}>Created</span>
                    <ArrowRight className="w-3 h-3" />
                    <span className={deposit.status === 'held' || deposit.status === 'released' ? 'text-blue-400 font-medium' : ''}>Held</span>
                    <ArrowRight className="w-3 h-3" />
                    <span className={deposit.status === 'released' ? 'text-rose-400 font-medium' : ''}>Released</span>
                  </div>
                </div>

                {/* Actions (owner only) */}
                {isOwner(deposit) && deposit.status === 'held' && (
                  <div className="px-4 pb-4 flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => handleStatusUpdate(deposit.id, 'released')}>
                      Release Deposit
                    </Button>
                  </div>
                )}
                {isOwner(deposit) && deposit.status === 'pending' && (
                  <div className="px-4 pb-4 flex gap-2">
                    <Button size="sm" className="text-xs" onClick={() => handleStatusUpdate(deposit.id, 'held')}>
                      Confirm Deposit Held
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

