import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollText, File, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';

interface DocumentSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDocument: (doc: { id: string; name: string; type: 'contract' | 'document' }) => void;
}

export function DocumentSelectorDialog({ open, onOpenChange, onSelectDocument }: DocumentSelectorDialogProps) {
  const { user } = useAuth();
  const { isLight } = useAppTheme();
  const [activeTab, setActiveTab] = useState('contracts');
  const [documents, setDocuments] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && user?.id) {
      fetchData();
    }
  }, [open, user?.id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [docsRes, contractsRes] = await Promise.all([
        supabase.from('legal_documents').select('id, file_name, file_path, document_type, status, created_at, file_size, mime_type').eq('user_id', user!.id).order('created_at', { ascending: false }),
        supabase.from('digital_contracts').select('id, title, status, created_at, owner_id, client_id').or(`owner_id.eq.${user!.id},client_id.eq.${user!.id}`).order('created_at', { ascending: false }),
      ]);
      setDocuments(docsRes.data || []);
      setContracts(contractsRes.data || []);
    } catch (e) {
      console.error('Error fetching vault data', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-md w-[90vw] rounded-[24px] overflow-hidden p-0", isLight ? "bg-white" : "bg-card")}>
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle className={cn("text-xl font-black uppercase italic tracking-tighter", isLight ? "text-slate-900" : "text-white")}>
              Select Attachment
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50 rounded-xl p-1">
              <TabsTrigger value="contracts" className="rounded-lg font-bold text-xs uppercase tracking-widest data-[state=active]:bg-[#EB4898] data-[state=active]:text-white">Contracts</TabsTrigger>
              <TabsTrigger value="documents" className="rounded-lg font-bold text-xs uppercase tracking-widest data-[state=active]:bg-[#EB4898] data-[state=active]:text-white">Vault Docs</TabsTrigger>
            </TabsList>

            <div className="h-[350px] overflow-y-auto no-scrollbar pb-4 pr-1">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#EB4898]" />
                </div>
              ) : (
                <>
                  <TabsContent value="contracts" className="m-0 space-y-2 focus:outline-none">
                    {contracts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-center opacity-50">
                        <ScrollText className="w-10 h-10 mb-3" />
                        <p className="text-sm font-medium">No contracts found</p>
                      </div>
                    ) : (
                      contracts.map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            onSelectDocument({ id: c.id, name: c.title, type: 'contract' });
                            onOpenChange(false);
                          }}
                          className={cn("w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left active:scale-95", isLight ? "bg-slate-50 border-slate-200 hover:bg-slate-100" : "bg-white/5 border-white/10 hover:bg-white/10")}
                        >
                          <div className="w-10 h-10 rounded-xl bg-[#EB4898]/10 flex items-center justify-center shrink-0">
                            <ScrollText className="w-5 h-5 text-[#EB4898]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-[14px] font-bold truncate", isLight ? "text-slate-900" : "text-white")}>{c.title}</p>
                            <p className={cn("text-[11px] uppercase tracking-widest mt-0.5", isLight ? "text-slate-500" : "text-white/50")}>
                              {c.status} · {format(new Date(c.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="documents" className="m-0 space-y-2 focus:outline-none">
                    {documents.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-center opacity-50">
                        <File className="w-10 h-10 mb-3" />
                        <p className="text-sm font-medium">No documents found</p>
                      </div>
                    ) : (
                      documents.map(d => (
                        <button
                          key={d.id}
                          onClick={() => {
                            onSelectDocument({ id: d.file_path, name: d.file_name, type: 'document' });
                            onOpenChange(false);
                          }}
                          className={cn("w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left active:scale-95", isLight ? "bg-slate-50 border-slate-200 hover:bg-slate-100" : "bg-white/5 border-white/10 hover:bg-white/10")}
                        >
                          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                            <File className="w-5 h-5 text-violet-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-[14px] font-bold truncate", isLight ? "text-slate-900" : "text-white")}>{d.file_name}</p>
                            <p className={cn("text-[11px] uppercase tracking-widest mt-0.5", isLight ? "text-slate-500" : "text-white/50")}>
                              {d.document_type.replace('_', ' ')} · {format(new Date(d.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </TabsContent>
                </>
              )}
            </div>
          </Tabs>
        </div>
        <div className={cn("p-4 border-t flex justify-end", isLight ? "bg-slate-50 border-slate-100" : "bg-black/20 border-white/5")}>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className={cn("rounded-xl font-bold", isLight ? "text-slate-600 hover:bg-slate-200" : "text-white/70 hover:bg-white/10")}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
