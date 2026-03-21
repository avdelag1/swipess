import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Upload } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface EventRow {
  id: string;
  title: string;
  category: string;
  image_url: string | null;
  event_date: string | null;
  location: string | null;
  is_published: boolean;
  is_approved: boolean;
  organizer_whatsapp: string | null;
}

const CATEGORY_OPTIONS = [
  { value: 'event', label: 'General Event' },
  { value: 'beach', label: 'Beach Clubs & Parties' },
  { value: 'jungle', label: 'Jungle & Nature Tours' },
  { value: 'music', label: 'Music & Fiestas' },
  { value: 'food', label: 'Food & Restaurants' },
  { value: 'promo', label: 'Promos & Discounts' },
];

const emptyForm = {
  title: '',
  description: '',
  category: 'event',
  image_url: '',
  event_date: '',
  event_end_date: '',
  location: '',
  location_detail: '',
  organizer_name: '',
  organizer_whatsapp: '',
  promo_text: '',
  discount_tag: '',
  is_free: false,
  price_text: '',
  is_published: true,
  is_approved: true,
};

export default function AdminEventos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    checkAdmin();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkAdmin = async () => {
    if (!user) { navigate('/'); return; }
    const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!data) { navigate('/'); return; }
    setIsAdmin(true);
    fetchEvents();
  };

  const fetchEvents = async () => {
    // Admin needs to see ALL events (including unpublished), so query without RLS filter
    const { data } = await supabase
      .from('events')
      .select('id, title, category, image_url, event_date, location, is_published, is_approved, organizer_whatsapp')
      .order('created_at', { ascending: false });
    setEvents((data as EventRow[]) || []);
    setIsLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('event-images').upload(path, file);
    if (error) {
      toast({ title: 'Upload failed', variant: 'destructive' });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('event-images').getPublicUrl(path);
    setForm(f => ({ ...f, image_url: urlData.publicUrl }));
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }

    const payload: any = {
      title: form.title,
      description: form.description || null,
      category: form.category,
      image_url: form.image_url || null,
      event_date: form.event_date || null,
      event_end_date: form.event_end_date || null,
      location: form.location || null,
      location_detail: form.location_detail || null,
      organizer_name: form.organizer_name || null,
      organizer_whatsapp: form.organizer_whatsapp || null,
      promo_text: form.promo_text || null,
      discount_tag: form.discount_tag || null,
      is_free: form.is_free,
      price_text: form.price_text || null,
      is_published: form.is_published,
      is_approved: form.is_approved,
    };

    if (editingId) {
      await supabase.from('events').update(payload).eq('id', editingId);
      toast({ title: 'Event updated' });
    } else {
      payload.created_by = user!.id;
      await supabase.from('events').insert(payload);
      toast({ title: 'Event published 🎉' });
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    fetchEvents();
  };

  const handleEdit = async (eventId: string) => {
    const { data } = await supabase.from('events').select('*').eq('id', eventId).single();
    if (!data) return;
    const d = data as any;
    setForm({
      title: d.title || '',
      description: d.description || '',
      category: d.category || 'event',
      image_url: d.image_url || '',
      event_date: d.event_date ? new Date(d.event_date).toISOString().slice(0, 16) : '',
      event_end_date: d.event_end_date ? new Date(d.event_end_date).toISOString().slice(0, 16) : '',
      location: d.location || '',
      location_detail: d.location_detail || '',
      organizer_name: d.organizer_name || '',
      organizer_whatsapp: d.organizer_whatsapp || '',
      promo_text: d.promo_text || '',
      discount_tag: d.discount_tag || '',
      is_free: d.is_free || false,
      price_text: d.price_text || '',
      is_published: d.is_published ?? true,
      is_approved: d.is_approved ?? true,
    });
    setEditingId(eventId);
    setShowForm(true);
  };

  const handleDelete = async (eventId: string) => {
    await supabase.from('events').delete().eq('id', eventId);
    toast({ title: 'Event deleted' });
    fetchEvents();
  };

  const togglePublish = async (eventId: string, current: boolean) => {
    await supabase.from('events').update({ is_published: !current }).eq('id', eventId);
    fetchEvents();
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background p-4 pb-24 max-w-2xl mx-auto">
      <PageHeader
        title="Manage Events"
        subtitle="Create and manage Eventos & Experiencias"
        actions={
          <Button
            onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}
            size="sm"
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" /> New Event
          </Button>
        }
      />

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-2xl bg-card border border-border/30 space-y-3"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-foreground">{editingId ? 'Edit Event' : 'New Event'}</h3>
              <button onClick={() => { setShowForm(false); setEditingId(null); }}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            <Input placeholder="Event title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full h-10 rounded-2xl border border-input bg-background px-3 text-sm"
            >
              {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>

            {/* Image */}
            <div className="space-y-2">
              {form.image_url && (
                <img src={form.image_url} alt="" className="w-full h-40 object-cover rounded-xl" />
              )}
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border/50 cursor-pointer hover:bg-card/80 transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{uploading ? 'Uploading...' : 'Upload portrait image'}</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Start date/time</label>
                <Input type="datetime-local" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">End date/time</label>
                <Input type="datetime-local" value={form.event_end_date} onChange={e => setForm(f => ({ ...f, event_end_date: e.target.value }))} />
              </div>
            </div>

            <Input placeholder="Location (e.g. Tulum Beach)" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            <Input placeholder="Location detail (address)" value={form.location_detail} onChange={e => setForm(f => ({ ...f, location_detail: e.target.value }))} />
            <Input placeholder="Organizer name" value={form.organizer_name} onChange={e => setForm(f => ({ ...f, organizer_name: e.target.value }))} />
            <Input placeholder="Organizer WhatsApp (e.g. 529841234567)" value={form.organizer_whatsapp} onChange={e => setForm(f => ({ ...f, organizer_whatsapp: e.target.value }))} />
            <Input placeholder="Promo text (e.g. Free drink with entry)" value={form.promo_text} onChange={e => setForm(f => ({ ...f, promo_text: e.target.value }))} />
            <Input placeholder="Discount badge (e.g. -30%)" value={form.discount_tag} onChange={e => setForm(f => ({ ...f, discount_tag: e.target.value }))} />

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_free} onChange={e => setForm(f => ({ ...f, is_free: e.target.checked }))} className="rounded" />
                Free entry
              </label>
              {!form.is_free && (
                <Input placeholder="Price (e.g. $500 MXN)" value={form.price_text} onChange={e => setForm(f => ({ ...f, price_text: e.target.value }))} className="flex-1" />
              )}
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} className="rounded" />
                Published
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_approved} onChange={e => setForm(f => ({ ...f, is_approved: e.target.checked }))} className="rounded" />
                Approved
              </label>
            </div>

            <Button onClick={handleSave} className="w-full">
              {editingId ? 'Save Changes' : 'Publish Event'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-card animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No events yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(ev => (
            <div key={ev.id} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/30">
              {ev.image_url ? (
                <img src={ev.image_url} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-muted flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{ev.title}</p>
                <p className="text-xs text-muted-foreground">{ev.location || 'No location'}</p>
                <div className="flex gap-1 mt-1">
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", ev.is_published ? "bg-rose-500/15 text-rose-400" : "bg-muted text-muted-foreground")}>
                    {ev.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => togglePublish(ev.id, ev.is_published)} className="p-2 rounded-lg hover:bg-muted/50">
                  {ev.is_published ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                </button>
                <button onClick={() => handleEdit(ev.id)} className="p-2 rounded-lg hover:bg-muted/50">
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </button>
                <button onClick={() => handleDelete(ev.id)} className="p-2 rounded-lg hover:bg-red-500/10">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
