import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { appToast } from '@/utils/appNotification';
import { logger } from '@/utils/prodLogger';
import { Images, FileText, Scale, RefreshCw } from 'lucide-react';

interface LegalRequest {
  id: string;
  user_id: string | null;
  category: string | null;
  subcategory: string | null;
  description: string;
  role: string | null;
  package_id: string | null;
  status: string;
  created_at: string;
}

interface ContractRow {
  id: string;
  title: string;
  status: string;
  template_type: string | null;
  owner_id: string;
  client_id: string;
  updated_at: string;
  metadata: Record<string, unknown> | null;
}

const REQUEST_STATUSES = ['pending', 'in_progress', 'resolved'] as const;

function statusClasses(status: string): string {
  switch (status) {
    case 'resolved':
    case 'signed':
      return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20';
    case 'in_progress':
    case 'sent':
      return 'bg-amber-500/15 text-amber-500 border-amber-500/20';
    default:
      return 'bg-muted text-muted-foreground border-border/20';
  }
}

export default function AdminLegalRequests() {
  const [tab, setTab] = useState<'requests' | 'contracts'>('requests');
  const [requests, setRequests] = useState<LegalRequest[]>([]);
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [reqRes, conRes] = await Promise.all([
      supabase
        .from('legal_help_requests')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('digital_contracts')
        .select('id, title, status, template_type, owner_id, client_id, updated_at, metadata')
        .order('updated_at', { ascending: false })
        .limit(100),
    ]);

    if (reqRes.error) {
      logger.error('[AdminLegalRequests] requests fetch failed:', reqRes.error);
    } else {
      setRequests((reqRes.data as LegalRequest[]) || []);
    }
    if (conRes.error) {
      logger.error('[AdminLegalRequests] contracts fetch failed:', conRes.error);
    } else {
      setContracts((conRes.data as ContractRow[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateStatus = async (id: string, status: string) => {
    // Optimistic update
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    const { error } = await supabase
      .from('legal_help_requests')
      .update({ status })
      .eq('id', id);
    if (error) {
      logger.error('[AdminLegalRequests] status update failed:', error);
      appToast.error('Could not update status', 'Refresh and try again.');
      fetchData();
    } else {
      appToast.success('Status updated');
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-background p-4 pt-[env(safe-area-inset-top)] pb-24 max-w-2xl mx-auto">
      <PageHeader
        title="Legal & Contracts"
        subtitle={`${pendingCount} pending request${pendingCount !== 1 ? 's' : ''}`}
        backTo="/admin/eventos"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={fetchData} disabled={loading}>
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} /> Refresh
            </Button>
            <Link to="/admin/photos">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Images className="w-4 h-4" /> Photos
              </Button>
            </Link>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 p-1 mb-6 rounded-2xl bg-muted/30 border border-border/10">
        {([
          { id: 'requests', label: `Service Requests (${requests.length})`, icon: Scale },
          { id: 'contracts', label: `Smart Contracts (${contracts.length})`, icon: FileText },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
              tab === t.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground py-16">Loading…</p>
      ) : tab === 'requests' ? (
        requests.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-16">No legal requests yet.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border/15 bg-card/40 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-black uppercase italic tracking-tight text-foreground truncate">
                      {r.package_id ? `Package · ${r.package_id}` : `${r.category || 'General'} · ${r.subcategory || ''}`}
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
                      {r.role || 'user'} · {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={cn('shrink-0 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border', statusClasses(r.status))}>
                    {r.status}
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed text-foreground/80 whitespace-pre-wrap break-words">
                  {r.description}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {REQUEST_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(r.id, s)}
                      disabled={r.status === s}
                      className={cn(
                        'text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all active:scale-95',
                        r.status === s
                          ? 'opacity-40 cursor-default ' + statusClasses(s)
                          : 'border-border/20 text-muted-foreground hover:text-foreground hover:border-foreground/30'
                      )}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : contracts.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-16">No smart contracts yet.</p>
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border/15 bg-card/40 p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-black uppercase italic tracking-tight text-foreground truncate">{c.title}</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
                  {c.template_type || 'contract'} · {new Date(c.updated_at).toLocaleDateString()}
                </p>
              </div>
              <span className={cn('shrink-0 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border', statusClasses(c.status))}>
                {c.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
