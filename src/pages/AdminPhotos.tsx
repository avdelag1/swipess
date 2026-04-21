import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Trash2, Copy, Check, ImagePlus, Link2,
  RefreshCw, X, ChevronDown, Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const BUCKET = 'admin-uploads';

interface StorageFile {
  name: string;
  id: string;
  publicUrl: string;
  size: number;
  created_at: string;
  eventId?: string;
  eventTitle?: string;
}

interface EventOption {
  id: string;
  title: string;
  image_url: string | null;
}

export default function AdminPhotos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<StorageFile[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<StorageFile | null>(null);
  const [assignDropdownId, setAssignDropdownId] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAndLoad();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkAdminAndLoad = async () => {
    if (!user) { navigate('/'); return; }
    const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!data) { navigate('/'); return; }
    await Promise.all([loadPhotos(), loadEvents()]);
  };

  const loadPhotos = async () => {
    setLoading(true);
    const { data: files, error } = await supabase.storage.from(BUCKET).list('', {
      limit: 200,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (error) {
      toast({ title: 'Failed to load photos', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    const imageFiles = (files || []).filter(f => f.name && !f.name.startsWith('.'));

    const mapped: StorageFile[] = imageFiles.map(f => {
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(f.name);
      return {
        name: f.name,
        id: f.id || f.name,
        publicUrl: urlData.publicUrl,
        size: f.metadata?.size || 0,
        created_at: f.created_at || '',
      };
    });

    setPhotos(mapped);
    setLoading(false);
  };

  const loadEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('id, title, image_url')
      .order('created_at', { ascending: false });
    setEvents((data as EventOption[]) || []);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setUploadProgress(0);
    let uploaded = 0;

    for (const file of files) {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (error) {
        toast({ title: `Failed: ${file.name}`, description: error.message, variant: 'destructive' });
      } else {
        uploaded++;
      }
      setUploadProgress(Math.round(((files.indexOf(file) + 1) / files.length) * 100));
    }

    if (uploaded > 0) {
      toast({ title: `${uploaded} photo${uploaded > 1 ? 's' : ''} uploaded` });
    }
    setUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    loadPhotos();
  };

  const handleCopyUrl = async (photo: StorageFile) => {
    await navigator.clipboard.writeText(photo.publicUrl);
    setCopiedId(photo.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (photo: StorageFile) => {
    setDeletingId(photo.id);
    const { error } = await supabase.storage.from(BUCKET).remove([photo.name]);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Photo deleted' });
      if (selectedPhoto?.id === photo.id) setSelectedPhoto(null);
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
    }
    setDeletingId(null);
  };

  const handleAssignToEvent = async (photo: StorageFile, eventId: string) => {
    setAssigningId(photo.id);
    setAssignDropdownId(null);
    const { error } = await supabase
      .from('events')
      .update({ image_url: photo.publicUrl })
      .eq('id', eventId);

    if (error) {
      toast({ title: 'Assignment failed', description: error.message, variant: 'destructive' });
    } else {
      const ev = events.find(e => e.id === eventId);
      toast({ title: `Set as cover for "${ev?.title}"` });
      await loadEvents();
    }
    setAssigningId(null);
  };

  const _formatBytes = (bytes: number) => {
    if (bytes === 0) return '—';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Determine which event uses each photo
  const photoToEvent = (photo: StorageFile) =>
    events.find(e => e.image_url === photo.publicUrl);

  return (
    <div className="min-h-screen bg-background p-4 pb-24 max-w-5xl mx-auto">
      <PageHeader
        title="Photo Library"
        subtitle={`admin-uploads bucket · ${photos.length} photos`}
        actions={
          <div className="flex gap-2">
            <Link to="/admin/eventos">
              <Button variant="outline" size="sm" className="gap-1.5">Events</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={loadPhotos} className="gap-1.5">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {uploadProgress}%</>
              ) : (
                <><ImagePlus className="w-4 h-4" /> Upload Photos</>
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleUpload}
            />
          </div>
        }
      />

      {/* Upload drop zone */}
      <div
        className="mb-6 border-2 border-dashed border-border/40 rounded-2xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-card/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          if (fileInputRef.current) {
            // Create a DataTransfer to set files on the input
            const dt = new DataTransfer();
            Array.from(e.dataTransfer.files).forEach(f => dt.items.add(f));
            fileInputRef.current.files = dt.files;
            fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {uploading ? `Uploading... ${uploadProgress}%` : 'Click or drag & drop photos here'}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">Supports JPG, PNG, WebP · Multiple files ok</p>
      </div>

      {/* Photo grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-card animate-pulse" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ImagePlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No photos yet. Upload some above!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map(photo => {
            const assignedEvent = photoToEvent(photo);
            return (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group rounded-2xl overflow-hidden bg-card border border-border/30 cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="aspect-square">
                  <img
                    src={photo.publicUrl}
                    alt={photo.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Assigned badge */}
                {assignedEvent && (
                  <div className="absolute top-2 left-2 max-w-[80%]">
                    <span className="text-[10px] bg-emerald-500/90 text-white px-2 py-0.5 rounded-full truncate block">
                      {assignedEvent.title}
                    </span>
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <div className="flex gap-1.5 w-full" onClick={e => e.stopPropagation()}>
                    <button
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs"
                      onClick={() => handleCopyUrl(photo)}
                    >
                      {copiedId === photo.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>

                    {/* Assign dropdown trigger */}
                    <div className="relative flex-1">
                      <button
                        className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs"
                        onClick={() => setAssignDropdownId(assignDropdownId === photo.id ? null : photo.id)}
                        disabled={assigningId === photo.id}
                      >
                        {assigningId === photo.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <><Link2 className="w-3 h-3" /><ChevronDown className="w-3 h-3" /></>
                        )}
                      </button>

                      <AnimatePresence>
                        {assignDropdownId === photo.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            className="absolute bottom-full mb-1 left-0 right-0 bg-popover border border-border rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto min-w-[160px]"
                          >
                            {events.length === 0 ? (
                              <p className="text-xs text-muted-foreground p-3">No events yet</p>
                            ) : (
                              events.map(ev => (
                                <button
                                  key={ev.id}
                                  className={cn(
                                    "w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors",
                                    ev.image_url === photo.publicUrl && "text-emerald-500 font-medium"
                                  )}
                                  onClick={() => handleAssignToEvent(photo, ev.id)}
                                >
                                  {ev.title}
                                  {ev.image_url === photo.publicUrl && ' ✓'}
                                </button>
                              ))
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <button
                      className="flex items-center justify-center py-1.5 px-2 rounded-lg bg-red-500/40 hover:bg-red-500/60 text-white"
                      onClick={() => handleDelete(photo)}
                      disabled={deletingId === photo.id}
                    >
                      {deletingId === photo.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-card rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative">
                <img
                  src={selectedPhoto.publicUrl}
                  alt={selectedPhoto.name}
                  className="w-full max-h-80 object-cover"
                />
                <button
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70"
                  onClick={() => setSelectedPhoto(null)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div className="text-xs text-muted-foreground font-mono break-all bg-muted/50 rounded-lg p-2">
                  {selectedPhoto.publicUrl}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() => handleCopyUrl(selectedPhoto)}
                  >
                    {copiedId === selectedPhoto.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedId === selectedPhoto.id ? 'Copied!' : 'Copy URL'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => handleDelete(selectedPhoto)}
                    disabled={deletingId === selectedPhoto.id}
                  >
                    {deletingId === selectedPhoto.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Delete
                  </Button>
                </div>

                {/* Assign to event */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Set as event cover image:</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {events.map(ev => (
                      <button
                        key={ev.id}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-muted transition-colors text-left",
                          ev.image_url === selectedPhoto.publicUrl && "bg-emerald-500/10 text-emerald-500"
                        )}
                        onClick={() => handleAssignToEvent(selectedPhoto, ev.id)}
                        disabled={assigningId === selectedPhoto.id}
                      >
                        {ev.image_url ? (
                          <img src={ev.image_url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-muted flex-shrink-0" />
                        )}
                        <span className="truncate">{ev.title}</span>
                        {ev.image_url === selectedPhoto.publicUrl && (
                          <Check className="w-4 h-4 ml-auto flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close dropdown on outside click */}
      {assignDropdownId && (
        <div className="fixed inset-0 z-40" onClick={() => setAssignDropdownId(null)} />
      )}
    </div>
  );
}


