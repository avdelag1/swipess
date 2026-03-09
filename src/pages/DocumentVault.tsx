import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Upload, Trash2, Download, FolderOpen, Search, Plus, Shield, ScrollText, CreditCard, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: FolderOpen },
  { id: 'contracts', label: 'Contracts', icon: ScrollText },
  { id: 'identity', label: 'IDs', icon: CreditCard },
  { id: 'fideicomiso', label: 'Fideicomiso', icon: Shield },
  { id: 'other', label: 'Other', icon: File },
];

const DOC_TYPE_MAP: Record<string, string> = {
  ownership_deed: 'contracts',
  rental_agreement: 'contracts',
  fideicomiso: 'fideicomiso',
  government_id: 'identity',
  passport: 'identity',
  rfc: 'identity',
  other: 'other',
};

interface DocItem {
  id: string;
  file_name: string;
  file_path: string;
  document_type: string;
  status: string;
  created_at: string;
  file_size: number;
  mime_type: string;
}

export default function DocumentVault() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    if (!user) return;
    setIsLoading(true);
    const [docsRes, contractsRes] = await Promise.all([
      supabase.from('legal_documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('digital_contracts').select('*').or(`owner_id.eq.${user.id},client_id.eq.${user.id}`).order('created_at', { ascending: false }),
    ]);
    setDocuments(docsRes.data || []);
    setContracts(contractsRes.data || []);
    setIsLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Max 10MB'); return; }

    setIsUploading(true);
    try {
      const filePath = `${user.id}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage.from('legal-documents').upload(filePath, file);
      if (uploadErr) throw uploadErr;

      const { error: dbErr } = await supabase.from('legal_documents').insert({
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        mime_type: file.type,
        file_size: file.size,
        document_type: 'other',
        status: 'uploaded',
      });
      if (dbErr) throw dbErr;
      toast.success('Document uploaded');
      fetchDocuments();
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (doc: DocItem) => {
    await supabase.storage.from('legal-documents').remove([doc.file_path]);
    await supabase.from('legal_documents').delete().eq('id', doc.id);
    toast.success('Document deleted');
    fetchDocuments();
  };

  const handleDownload = async (doc: DocItem) => {
    const { data } = await supabase.storage.from('legal-documents').createSignedUrl(doc.file_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const filteredDocs = documents.filter(doc => {
    const matchesTab = activeTab === 'all' || (DOC_TYPE_MAP[doc.document_type] || 'other') === activeTab;
    const matchesSearch = !searchQuery || doc.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1048576).toFixed(1)}MB`;
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Document Vault</h1>
          <p className="text-sm text-muted-foreground mt-1">Securely store contracts, IDs & legal docs</p>
        </div>
        <label className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all',
          'bg-primary text-primary-foreground hover:bg-primary/90',
          isUploading && 'opacity-50 pointer-events-none'
        )}>
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Upload</span>
          <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} />
        </label>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search documents..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-card border-border/50" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full bg-card/50 mb-4">
          {CATEGORIES.map(cat => (
            <TabsTrigger key={cat.id} value={cat.id} className="text-xs gap-1">
              <cat.icon className="w-3 h-3" />
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Contracts section */}
        {(activeTab === 'all' || activeTab === 'contracts') && contracts.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Digital Contracts</h3>
            <div className="space-y-2">
              {contracts.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/30">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <ScrollText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.status} · {format(new Date(c.created_at), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <TabsContent value={activeTab} className="mt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>
          ) : filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <FolderOpen className="w-12 h-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No documents yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocs.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/30 group">
                  <div className="w-10 h-10 rounded-lg bg-accent/50 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-foreground/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(doc.file_size)} · {format(new Date(doc.created_at), 'MMM d, yyyy')}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(doc)}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(doc)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
