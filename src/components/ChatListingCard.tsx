import { memo } from 'react';
import { cn } from '@/lib/utils';

interface ChatListingData {
  id: string;
  title?: string;
  price?: number;
  currency?: string;
  image?: string;
  images?: string[];
  city?: string;
  bedrooms?: number;
  bathrooms?: number;
  listing_type?: string;
  beds?: number;
  baths?: number;
  category?: string;
  share_url?: string;
}

interface ChatListingCardProps {
  listing: ChatListingData;
  isSwipess: boolean;
  onNavigate?: (path: string) => void;
}

export const ChatListingCard = memo(function ChatListingCard({
  listing,
  isSwipess,
  onNavigate,
}: ChatListingCardProps) {
  const imageUrl = listing.image || (listing.images?.[0]) || '';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onNavigate?.(`/listing/${listing.id}`);
      }}
      className={cn(
        "w-full text-left overflow-hidden rounded-2xl border transition-all active:scale-[0.98] hover:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.4)]",
        isSwipess ? "bg-white/[0.04] border-white/10" : "bg-card border-border/60"
      )}
    >
      {imageUrl && (
        <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
          <img src={imageUrl} alt={listing.title || ''} loading="lazy" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-3 space-y-1">
        {listing.title && (
          <p className="text-sm font-bold leading-tight line-clamp-1">{listing.title}</p>
        )}
        <p className="text-[13px] font-black text-primary">
          {listing.currency === "MXN" ? "MXN$" : "$"}{Number(listing.price || 0).toLocaleString()}
          {listing.listing_type && (
            <span className="text-[10px] font-bold opacity-50 ml-1">/ {listing.listing_type}</span>
          )}
        </p>
        <p className="text-[11px] font-medium opacity-50 line-clamp-1">
          {[listing.beds ?? listing.bedrooms ? `${listing.beds ?? listing.bedrooms} bd` : null, listing.baths ?? listing.bathrooms ? `${listing.baths ?? listing.bathrooms} ba` : null, listing.city].filter(Boolean).join(" · ")}
        </p>
      </div>
    </button>
  );
});
