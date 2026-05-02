import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Upload, Images } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Search, MessageSquare, ExternalLink } from 'lucide-react';

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

interface PromoSubmission {
  id: string;
  user_id: string;
  title: string;
  description: string;
  event_type: string;
  location: string;
  contact_name: string;
  contact_phone: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  website?: string;
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
  const [activeTab, setActiveTab] = useState<'events' | 'submissions'>('events');
  const [submissions, setSubmissions] = useState<PromoSubmission[]>([]);
  const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(false);

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
    fetchSubmissions();
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

  const fetchSubmissions = async () => {
    setIsSubmissionsLoading(true);
    try {
      const { data, error } = await supabase
        .from('business_promo_submissions' as any)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSubmissions((data as any) || []);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setIsSubmissionsLoading(false);
    }
  };

  const handleApproveSubmission = async (id: string) => {
    try {
      // 1. Get the submission data
      const { data: sub, error: fetchErr } = await (supabase as any)
        .from('business_promo_submissions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchErr || !sub) throw fetchErr || new Error('Submission not found');

      // 2. Insert into live events table
      const { error: insertErr } = await supabase
        .from('events')
        .insert({
          title: sub.title,
          description: sub.description,
          category: sub.event_type || 'promo',
          image_url: sub.image_url || null, // Submissions should have image_url
          event_date: sub.event_date || null,
          location: sub.location,
          location_detail: sub.location_detail || null,
          organizer_name: sub.contact_name,
          organizer_whatsapp: sub.contact_phone,
          promo_text: sub.promo_text || null,
          is_approved: true,
          is_published: true,
          created_by: sub.user_id,
        });

      if (insertErr) throw insertErr;

      // 3. Mark submission as approved
      const { error } = await (supabase as any)
        .from('business_promo_submissions')
        .update({ status: 'approved' })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({ title: 'Submission approved & Published 🎉' });
      fetchSubmissions();
      fetchEvents(); // Refresh events list too
    } catch (err: any) {
      console.error('Approval error:', err);
      toast({ title: 'Approval failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleRejectSubmission = async (id: string) => {
    try {
      const { error } = await supabase
        .from('business_promo_submissions' as any)
        .update({ status: 'rejected' })
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: 'Submission rejected' });
      fetchSubmissions();
    } catch (_err) {
      toast({ title: 'Rejection failed', variant: 'destructive' });
    }
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
    <div className="min-h-screen bg-background p-4 pt-[env(safe-area-inset-top)] pb-24 max-w-2xl mx-auto">
      <PageHeader
        title="Manage Events"
        subtitle="Create and manage Eventos & Experiencias"
        actions={
          <div className="flex gap-2">
            <Link to="/admin/photos">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Images className="w-4 h-4" /> Photos
              </Button>
            </Link>
            <Button
              onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}
              size="sm"
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" /> New Event
            </Button>
          </div>
        }
      />

      <div className="flex gap-1 p-1 mb-6 rounded-2xl bg-muted/30 border border-border/10">
        <button
          onClick={() => setActiveTab('events')}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'events' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Events
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative",
            activeTab === 'submissions' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Submissions
          {submissions.filter(s => s.status === 'pending').length > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          )}
        </button>
      </div>

      {activeTab === 'events' ? (
        <>
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
              <button 
                onClick={() => { setShowForm(false); setEditingId(null); }}
                title="Close form"
                aria-label="Close form"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <Input placeholder="Event title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

            <select
              value={form.category}
              title="Select event category"
              aria-label="Select event category"
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
      ) : (
        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p>No events yet. Create your first one!</p>
            </div>
          ) : (
            events.map(ev => (
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
                  <button onClick={() => togglePublish(ev.id, ev.is_published)} className="p-2 rounded-lg hover:bg-muted/50" title={ev.is_published ? 'Unpublish event' : 'Publish event'} aria-label={ev.is_published ? 'Unpublish event' : 'Publish event'}>
                    {ev.is_published ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  <button onClick={() => handleEdit(ev.id)} className="p-2 rounded-lg hover:bg-muted/50" title="Edit event" aria-label="Edit event">
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(ev.id)} className="p-2 rounded-lg hover:bg-red-500/10" title="Delete event" aria-label="Delete event">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  ) : (
    <div className="space-y-4">
      {isSubmissionsLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-3xl bg-card animate-pulse" />)}
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-20 bg-card/30 rounded-[2.5rem] border border-dashed border-border/40">
          <Search className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No Submissions Found</p>
        </div>
      ) : (
        submissions.map(sub => (
              <motion.div
                key={sub.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 rounded-[2rem] bg-card border border-border/30 shadow-sm space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                        sub.status === 'pending' && "bg-orange-500/10 text-orange-400 border-orange-500/20",
                        sub.status === 'approved' && "bg-green-500/10 text-green-400 border-green-500/20",
                        sub.status === 'rejected' && "bg-red-500/10 text-red-400 border-red-500/20"
                      )}>
                        {sub.status}
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-black text-foreground uppercase tracking-tight italic">{sub.title}</h4>
                  </div>
                  <div className="flex gap-2">
                    {sub.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          title="Approve submission"
                          className="h-10 px-4 rounded-xl border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all font-black text-xs uppercase tracking-widest"
                          onClick={() => handleApproveSubmission(sub.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          title="Reject submission"
                          className="h-10 px-4 rounded-xl border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 active:scale-95 transition-all font-black text-xs uppercase tracking-widest"
                          onClick={() => handleRejectSubmission(sub.id)}
                        >
                          <XCircle className="w-4 h-4 mr-2" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Contact Information</p>
                    <p className="text-xs font-bold text-foreground">{sub.contact_name}</p>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-green-400" />
                      <p className="text-xs font-bold text-muted-foreground">{sub.contact_phone}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Type & Location</p>
                    <p className="text-xs font-bold text-foreground">{sub.event_type}</p>
                    <p className="text-xs font-bold text-muted-foreground">{sub.location}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-muted/30 text-[11px] font-medium leading-relaxed text-muted-foreground border border-border/10">
                  {sub.description}
                </div>

                {sub.website && (
                  <a
                    href={sub.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-[10px] font-black text-orange-400 uppercase tracking-widest hover:translate-x-1 transition-transform"
                  >
                    View Website <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}


