export interface EventItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  image_url: string | null;
  video_url?: string | null;
  /** When true, event video may play with its own audio track (user can unmute). */
  video_audio_enabled?: boolean | null;
  /** Optional MP3/WAV/M4A bed that loops under the video when unmuted. */
  background_music_url?: string | null;
  image_urls?: any[];
  event_date: string | null;
  event_end_date?: string | null;
  location: string | null;
  location_detail: string | null;
  /** Venue latitude — required for nearby-only discovery when set. */
  latitude?: number | null;
  /** Venue longitude — required for nearby-only discovery when set. */
  longitude?: number | null;
  /** Optional per-event visibility cap (km). Null uses the viewer's discovery radius. */
  visibility_radius_km?: number | null;
  organizer_name: string | null;
  organizer_photo_url?: string | null;
  organizer_whatsapp: string | null;
  promo_text: string | null;
  discount_tag: string | null;
  is_free: boolean;
  price_text: string | null;
  promo_status?: 'none' | 'pending_approval' | 'pending_payment' | 'active' | 'rejected';
  selected_promo_package?: string | null;
  admin_notes?: string | null;
}


