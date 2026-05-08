import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Upload, Trash2, Loader2, RefreshCw, ImagePlus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { POKER_CARDS, OWNER_INTENT_CARDS, POKER_CARD_PHOTOS } from '@/components/swipe/CardData';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

const BUCKET = 'admin-uploads';

interface CategoryPhoto {
  id: string;
  category_id: string;
  image_url: string;
  sort_order: number;
}

const ALL_CATEGORIES = [
  ...POKER_CARDS.map(c => ({ id: c.id, label: c.label, side: 'Client' as const })),
  ...OWNER_INTENT_CARDS.map(c => ({ id: c.id, label: c.label, side: 'Owner' as const })),
];

export default function AdminCategoryPhotos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string>(POKER_CARDS[0].id);
  const [photos, setPhotos] = useState<CategoryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      if (!user) { navigate('/'); return; }
      const { data: ok } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' as any });
      if (!ok) { navigate('/'); return; }
      await load();
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selected]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('category_photos' as any)
      .select('id, category_id, image_url, sort_order')
      .eq('category_id', selected)
      .order('sort_order', { ascending: true });
    if (error) {
      toast({ title: 'Failed to load', description: error.message, variant: 'destructive' });
    }
    setPhotos((data as any) || []);
    setLoading(false);
  };

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    let nextOrder = (photos[photos.length - 1]?.sort_order ?? 0) + 1;
    let added = 0;
    for (const file of files) {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `category-${selected}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (up.error) {
        toast({ title: `Upload failed`, description: up.error.message, variant: 'destructive' });
        continue;
      }
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const ins = await supabase
        .from('category_photos' as any)
        .insert({
          category_id: selected,
          image_url: urlData.publicUrl,
          sort_order: nextOrder++,
          is_active: true,
        });
      if (ins.error) {
        toast({ title: 'Save failed', description: ins.error.message, variant: 'destructive' });
      } else {
        added++;
      }
    }
    if (added > 0) toast({ title: `${added} photo${added > 1 ? 's' : ''} added` });
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
    qc.invalidateQueries({ queryKey: ['category-photos'] });
    load();
  };

  const remove = async (p: CategoryPhoto) => {
    setDeletingId(p.id);
    const { error } = await supabase.from('category_photos' as any).delete().eq('id', p.id);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    } else {
      setPhotos(prev => prev.filter(x => x.id !== p.id));
      qc.invalidateQueries({ queryKey: ['category-photos'] });
    }
    setDeletingId(null);
  };

  const baseCover = useMemo(() => POKER_CARD_PHOTOS[selected], [selected]);
  const grouped = useMemo(() => {
    const client = ALL_CATEGORIES.filter(c => c.side === 'Client');
    const owner = ALL_CATEGORIES.filter(c => c.side === 'Owner');
    return { client, owner };
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 pt-[env(safe-area-inset-top)] pb-24 max-w-5xl mx-auto">
      <PageHeader
        title="Category Card Photos"
        subtitle="Carousel photos shown on each quick-filter card"
        actions={
          <div className="flex gap-2">
            <Link to="/admin/photos"><Button variant="outline" size="sm">Photo Library</Button></Link>
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        }
      />

      <div className="mt-4 space-y-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Client Side</p>
          <div className="flex flex-wrap gap-2">
            {grouped.client.map(c => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm border transition-colors',
                  selected === c.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:bg-muted'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Owner Side</p>
          <div className="flex flex-wrap gap-2">
            {grouped.owner.map(c => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm border transition-colors',
                  selected === c.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:bg-muted'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{ALL_CATEGORIES.find(c => c.id === selected)?.label}</h2>
        <Button onClick={() => fileRef.current?.click()} disabled={uploading} size="sm" className="gap-1.5">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Add Photos
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={upload}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {baseCover && (
          <div className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-primary/40">
            <img src={baseCover} alt="default" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] uppercase tracking-wider px-2 py-1">
              Default (built-in)
            </div>
          </div>
        )}
        {loading && (
          <div className="col-span-full flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}
        {!loading && photos.map(p => (
          <div key={p.id} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted group">
            <img src={p.image_url} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => remove(p)}
              disabled={deletingId === p.id}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Delete"
            >
              {deletingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        ))}
        {!loading && photos.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground border-2 border-dashed border-border rounded-xl">
            <ImagePlus className="w-8 h-8 mx-auto mb-2 opacity-60" />
            <p className="text-sm">No extra photos yet — add some to start the carousel.</p>
          </div>
        )}
      </div>
    </div>
  );
}