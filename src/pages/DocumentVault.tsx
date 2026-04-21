import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Trash2, Download, FolderOpen, Search, Plus, Shield, ScrollText, CreditCard, File, Upload, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: FolderOpen },
  { id: 'contracts', label: 'Contracts', icon: ScrollText },
  { id: 'identity', label: 'IDs', icon: CreditCard },
  { id: 'fideicomiso', label: 'Fideicomiso', icon: Shield },
  { id: 'other', label: 'Other', icon: File },
];

const DOC_TYPES = [
  { value: 'rental_agreement', label: 'Rental Agreement', category: 'contracts' },
  { value: 'ownership_deed', label: 'Ownership Deed', category: 'contracts' },
  { value: 'fideicomiso', label: 'Fideicomiso', category: 'fideicomiso' },
  { value: 'government_id', label: 'Government ID', category: 'identity' },
  { value: 'passport', label: 'Passport', category: 'identity' },
  { value: 'rfc', label: 'RFC Document', category: 'identity' },
  { value: 'other', label: 'Other', category: 'other' },
];

const DOC_TYPE_MAP: Record<string, string> = Object.fromEntries(
  DOC_TYPES.map(d => [d.value, d.category])
);

// Auto-detect doc type from filename
function detectDocType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes('rental') || lower.includes('lease') || lower.includes('contrato')) return 'rental_agreement';
  if (lower.includes('deed') || lower.includes('escritura')) return 'ownership_deed';
  if (lower.includes('fideicomiso') || lower.includes('trust')) return 'fideicomiso';
  if (lower.includes('passport') || lower.includes('pasaporte')) return 'passport';
  if (lower.includes('rfc')) return 'rfc';
  if (lower.includes('ine') || lower.includes('license') || lower.includes('id')) return 'government_id';
  return 'other';
}

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
  const [uploadState, setUploadState] = useState<{ uploading: boolean; progress: number; fileName: string }>({ uploading: false, progress: 0, fileName: '' });
  const [deleteTarget, setDeleteTarget] = useState<DocItem | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadDocType, setUploadDocType] = useState('');
  const [pendingFile, setPendingFile] = useState<globalThis.File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchDocuments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchDocuments = async () => {
    if (!user) return;
    setIsLoading(true);
    const [docsRes, contractsRes] = await Promise.all([
      supabase.from('legal_documents').select('id, file_name, file_path, document_type, status, created_at, file_size, mime_type').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('digital_contracts').select('id, title, status, created_at, owner_id, client_id').or(`owner_id.eq.${user.id},client_id.eq.${user.id}`).order('created_at', { ascending: false }),
    ]);
    setDocuments(docsRes.data || []);
    setContracts(contractsRes.data || []);
    setIsLoading(false);
  };

  const processUpload = async (file: globalThis.File, docType: string) => {
    if (!user) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Max 10MB'); return; }

    setUploadState({ uploading: true, progress: 10, fileName: file.name });
    try {
      const filePath = `${user.id}/${crypto.randomUUID()}-${file.name}`;
      setUploadState(s => ({ ...s, progress: 30 }));

      const { error: uploadErr } = await supabase.storage.from('legal-documents').upload(filePath, file);
      if (uploadErr) throw uploadErr;
      setUploadState(s => ({ ...s, progress: 70 }));

      const { error: dbErr } = await supabase.from('legal_documents').insert({
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        mime_type: file.type,
        file_size: file.size,
        document_type: docType,
        status: 'uploaded',
      });
      if (dbErr) throw dbErr;

      setUploadState(s => ({ ...s, progress: 100 }));
      toast.success('Document uploaded');
      fetchDocuments();
    } catch {
      toast.error('Upload failed');
    } finally {
      setTimeout(() => setUploadState({ uploading: false, progress: 0, fileName: '' }), 1000);
    }
  };

  const handleFileSelected = (file: globalThis.File) => {
    const detected = detectDocType(file.name);
    setUploadDocType(detected);
    setPendingFile(file);
  };

  const confirmUpload = () => {
    if (pendingFile) {
      processUpload(pendingFile, uploadDocType);
      setPendingFile(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.storage.from('legal-documents').remove([deleteTarget.file_path]);
    await supabase.from('legal_documents').delete().eq('id', deleteTarget.id);
    toast.success('Document deleted');
    setDeleteTarget(null);
    fetchDocuments();
  };

  const handleDownload = async (doc: DocItem) => {
    const { data } = await supabase.storage.from('legal-documents').createSignedUrl(doc.file_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelected(file);
  }, []);

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

  const getDocTypeLabel = (type: string) => DOC_TYPES.find(d => d.value === type)?.label || 'Other';

  return (
    <div
      className="min-h-screen bg-background p-4 pb-24 max-w-2xl mx-auto"
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={onDrop}
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-primary/10 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="p-8 rounded-2xl border-2 border-dashed border-primary bg-card/90 text-center">
              <Upload className="w-12 h-12 text-primary mx-auto mb-3" />
              <p className="text-lg font-semibold text-foreground">Drop your document here</p>
              <p className="text-sm text-muted-foreground">PDF, JPG, PNG up to 10MB</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload type picker sheet */}
      <AnimatePresence>
        {pendingFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={() => setPendingFile(null)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-t-2xl sm:rounded-2xl p-6 space-y-4 border border-border/30"
            >
              <h3 className="text-lg font-bold text-foreground">Document Type</h3>
              <p className="text-sm text-muted-foreground truncate">{pendingFile.name}</p>
              <Select value={uploadDocType} onValueChange={setUploadDocType}>
                <SelectTrigger className="bg-accent/30 border-border/50">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setPendingFile(null)}>Cancel</Button>
                <Button className="flex-1" onClick={confirmUpload}>Upload</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload progress bar */}
      <AnimatePresence>
        {uploadState.uploading && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-4 right-4 z-40 max-w-2xl mx-auto"
          >
            <div className="bg-card border border-border/50 rounded-xl p-3 shadow-lg">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-foreground truncate mr-2">{uploadState.fileName}</span>
                <span className="text-xs text-muted-foreground">{uploadState.progress}%</span>
              </div>
              <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadState.progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Document Vault</h1>
          <p className="text-sm text-muted-foreground mt-1">Securely store contracts, IDs & legal docs</p>
        </div>
        <label className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all',
          'bg-primary text-primary-foreground hover:bg-primary/90',
          uploadState.uploading && 'opacity-50 pointer-events-none'
        )}>
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Upload</span>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleInputChange} disabled={uploadState.uploading} />
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
              <p className="text-xs text-muted-foreground/60">Drag & drop or tap Upload</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocs.map(doc => (
                <motion.div
                  key={doc.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/30 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent/50 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-foreground/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getDocTypeLabel(doc.document_type)} · {formatSize(doc.file_size)} · {format(new Date(doc.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(doc)}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(doc)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Document
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.file_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


