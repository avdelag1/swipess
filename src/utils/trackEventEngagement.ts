import { supabase } from '@/integrations/supabase/client';

export type EventEngagementAction =
  | 'impression'
  | 'tap_contact'
  | 'tap_whatsapp'
  | 'tap_call'
  | 'request'
  | 'buy'
  | 'rent'
  | 'promote_submit'
  | 'tap_share'
  | 'tap_like'
  | 'tap_detail'
  | 'tap_promote_cta'
  | 'tap_events_entry';

export type EventEngagementSource =
  | 'feed'
  | 'detail'
  | 'share_modal'
  | 'promote_card'
  | 'advertise'
  | 'dashboard_teaser'
  | 'nav';

type TrackInput = {
  action: EventEngagementAction;
  source: EventEngagementSource;
  eventId?: string | null;
  promoSubmissionId?: string | null;
  organizerWhatsapp?: string | null;
  organizerName?: string | null;
  metadata?: Record<string, unknown>;
};

const SESSION_KEY = 'swipess_eng_sid';
const impressionGate = new Set<string>();

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `s_${Date.now().toString(36)}`;
  }
}

/**
 * Fire-and-forget engagement ping for event / promo businesses.
 * Never throws into UI; safe on native + web.
 */
export function trackEventEngagement(input: TrackInput): void {
  void (async () => {
    try {
      if (input.action === 'impression' && input.eventId) {
        const key = `${input.eventId}:${input.source}`;
        if (impressionGate.has(key)) return;
        impressionGate.add(key);
        // Allow a fresh impression after 45s (user scrolled away and back)
        setTimeout(() => impressionGate.delete(key), 45_000);
      }

      const { data: auth } = await supabase.auth.getSession();
      const userId = auth.session?.user?.id ?? null;

      const row = {
        user_id: userId,
        session_id: getSessionId(),
        event_id: input.eventId || null,
        promo_submission_id: input.promoSubmissionId || null,
        organizer_whatsapp: input.organizerWhatsapp || null,
        organizer_name: input.organizerName || null,
        action: input.action,
        source: input.source,
        metadata: input.metadata || {},
      };

      const { error } = await supabase.from('event_engagement_events' as any).insert(row);
      if (error && import.meta.env.DEV) {
        console.warn('[trackEventEngagement]', error.message);
      }
    } catch {
      /* never block UX */
    }
  })();
}

/** Infer buy/rent/request interest from event copy when user contacts organizer. */
export function inferContactIntent(event: {
  is_free?: boolean | null;
  price_text?: string | null;
  title?: string | null;
  promo_text?: string | null;
  category?: string | null;
}): EventEngagementAction {
  const blob = `${event.price_text || ''} ${event.promo_text || ''} ${event.title || ''} ${event.category || ''}`.toLowerCase();
  if (/\brent\b|rental|alquiler/.test(blob)) return 'rent';
  if (/\bbuy\b|purchase|ticket|entrada|pago|\$|usd|mxn/.test(blob) || event.is_free === false) return 'buy';
  if (/\brequest\b|reserva|book|rsvp|register|inscrib/.test(blob)) return 'request';
  return 'tap_contact';
}
