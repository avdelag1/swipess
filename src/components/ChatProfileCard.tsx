import { memo, useCallback, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface ChatProfileData {
  id: string;
  name?: string;
  age?: number;
  image?: string;
  images?: string[];
  city?: string;
  location?: string;
  nationality?: string;
  budget_min?: number;
  budget_max?: number;
}

interface ChatProfileCardProps {
  profile: ChatProfileData;
  isSwipess: boolean;
  onNavigate?: (path: string) => void;
}

export const ChatProfileCard = memo(function ChatProfileCard({
  profile,
  isSwipess,
  onNavigate,
}: ChatProfileCardProps) {
  const [imgError, setImgError] = useState(false);
  const rawImageUrl = profile.image || (profile.images?.[0]) || '';
  
  const imageUrl = useMemo(() => {
    if (!rawImageUrl) return '';
    if (rawImageUrl.startsWith('http')) return rawImageUrl;
    const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vnvbxyuawchofksmzzmw.supabase.co';
    return `${baseUrl}${rawImageUrl.startsWith('/') ? '' : '/'}${rawImageUrl}`;
  }, [rawImageUrl]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate?.(`/profile/${profile.id}`);
  }, [profile.id, onNavigate]);

  const handleImgError = useCallback(() => {
    setImgError(true);
  }, []);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "w-full text-left overflow-hidden rounded-2xl border transition-all active:scale-[0.98] hover:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.4)]",
        isSwipess ? "bg-white/[0.04] border-white/10" : "bg-card border-border/60"
      )}
    >
      {imageUrl && !imgError && (
        <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
          <img src={imageUrl} alt={profile.name || ''} loading="lazy" onError={handleImgError} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-3 space-y-1">
        <p className="text-sm font-bold leading-tight line-clamp-1">
          {profile.name?.split(' ')[0] || "User"}{profile.age ? `, ${profile.age}` : ''}
        </p>
        <p className="text-[11px] font-medium opacity-50 line-clamp-1">
          {profile.city || profile.location || ''}
        </p>
        {(profile.budget_min || profile.budget_max) && (
          <p className="text-[11px] font-medium opacity-50">
            Budget: ${Number(profile.budget_min || 0).toLocaleString()} – ${Number(profile.budget_max || 0).toLocaleString()}
          </p>
        )}
      </div>
    </button>
  );
});
