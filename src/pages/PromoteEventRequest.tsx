import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/sonner';

/**
 * Step 1 of event promotion flow: user submits the event for review.
 * After admin approves, user is routed to /promote-event/packages to pay.
 */
export default function PromoteEventRequest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [city, setCity] = useState('');
  const [link, setLink] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('Please sign in first.');
      return;
    }
    if (!eventName.trim()) {
      toast.error('Event name is required.');
      return;
    }
    setSubmitting(true);
    const { error } = await (supabase as any)
      .from('event_promotion_requests')
      .insert({
        user_id: user.id,
        event_name: eventName.trim(),
        event_date: eventDate || null,
        city: city.trim() || null,
        link: link.trim() || null,
        description: description.trim() || null,
        status: 'pending',
      });
    setSubmitting(false);
    if (error) {
      toast.error('Could not submit', { description: error.message });
      return;
    }
    toast.success('Request submitted', {
      description: 'We will review your event and notify you once approved.',
    });
    navigate('/client/dashboard');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted-foreground mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Megaphone className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-black tracking-tight text-foreground">Promote your event</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">
          Tell us about your event. Our team reviews every request to keep Swipess high quality. Once approved, you can choose a promotion package.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="event-name">Event name *</Label>
            <Input id="event-name" value={eventName} onChange={(e) => setEventName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="event-date">Date</Label>
              <Input id="event-date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="event-city">City</Label>
              <Input id="event-city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="event-link">Link (tickets, info)</Label>
            <Input id="event-link" type="url" placeholder="https://" value={link} onChange={(e) => setLink(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="event-description">Description</Label>
            <Textarea id="event-description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <Button type="submit" disabled={submitting} className="w-full h-12 rounded-2xl font-black uppercase tracking-widest">
            {submitting ? 'Submitting…' : 'Submit for review'}
          </Button>
        </form>
      </div>
    </div>
  );
}