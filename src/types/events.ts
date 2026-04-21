export interface EventItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  image_url: string | null;
  image_urls?: any[];
  event_date: string | null;
  event_end_date?: string | null;
  location: string | null;
  location_detail: string | null;
  organizer_name: string | null;
  organizer_photo_url?: string | null;
  organizer_whatsapp: string | null;
  promo_text: string | null;
  discount_tag: string | null;
  is_free: boolean;
  price_text: string | null;
}

