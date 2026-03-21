import { motion } from "framer-motion";
import { MessageCircle, MapPin, Trash2, Eye, Bed, User, Home, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumLikedCardProps {
    type: 'listing' | 'profile';
    data: any;
    onAction: (action: 'message' | 'view' | 'remove', data: any) => void;
    isLight?: boolean;
}

export function PremiumLikedCard({ type, data, onAction, isLight }: PremiumLikedCardProps) {
    const imageUrl = type === 'listing'
        ? (data.images?.[0] || data.image_url)
        : (data.images?.[0] || data.avatar_url || data.profile_images?.[0]);

    const title = type === 'listing' ? data.title : data.full_name || data.name;
    const subtitle = type === 'listing'
        ? (data.address || data.city || data.location?.city)
        : (data.occupation || (data.age ? `${data.age} years old` : ''));

    const category = data.category || data.property_type || 'Profile';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className={cn(
                "group relative rounded-[2rem] overflow-hidden transition-all duration-300",
                isLight
                  ? "bg-white border border-border/50 shadow-xl hover:shadow-2xl"
                  : "bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] shadow-2xl hover:border-white/[0.12]"
            )}
        >
            {/* Visual Header / Image */}
            <div className="relative h-48 sm:h-56 overflow-hidden">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                        {type === 'listing' ? <Home className="w-12 h-12 text-muted-foreground" /> : <User className="w-12 h-12 text-muted-foreground" />}
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                {/* Top Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                    <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                        {category}
                    </div>
                </div>

                <button
                    onClick={() => onAction('remove', data)}
                    aria-label="Remove from favorites"
                    title="Remove from favorites"
                    className="absolute top-4 right-4 h-11 w-11 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/60 hover:text-rose-500 transition-all active:scale-95 shadow-lg group/trash"
                >
                    <Trash2 className="w-5 h-5 transition-transform group-hover/trash:scale-110" />
                </button>

                {/* Bottom Info on Image */}
                <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-black text-lg sm:text-xl leading-tight truncate drop-shadow-lg">
                        {title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-white/70 text-xs font-bold mt-1">
                        <MapPin className="w-3 h-3 text-[var(--color-brand-accent-2)] flex-shrink-0" />
                        <span className="truncate">{subtitle}</span>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-5 space-y-4">
                {/* Specs / Details */}
                <div className="flex flex-wrap gap-2">
                    {type === 'listing' && (
                        <>
                            {data.beds && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary border border-border">
                                    <Bed className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-[10px] font-black text-foreground">{data.beds}</span>
                                </div>
                            )}
                            {data.price && (
                                <div className="px-3 py-1.5 rounded-xl bg-[var(--color-brand-accent-2)]/10 border border-[var(--color-brand-accent-2)]/20 text-[var(--color-brand-accent-2)] text-[10px] font-black">
                                    ${data.price.toLocaleString()}{data.pricing_unit ? `/${data.pricing_unit}` : '/mo'}
                                </div>
                            )}
                        </>
                    )}
                    {type === 'profile' && data.verified && (
                        <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black flex items-center gap-1.5">
                            <Zap className="w-3 h-3 fill-current" />
                            VERIFIED
                        </div>
                    )}
                </div>

                {/* Description Preview */}
                {(data.bio || data.description) && (
                    <p className="text-xs text-muted-foreground font-medium line-clamp-2 leading-relaxed">
                        {data.bio || data.description}
                    </p>
                )}

                {/* Standardized Action Buttons */}
                <div className="flex gap-2 pt-2">
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onAction('message', data)}
                        className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl bg-[var(--color-brand-accent-2)] hover:bg-[#FF1493] text-white text-xs font-black shadow-[0_4px_16px_rgba(228,0,124,0.3)] transition-all"
                    >
                        <MessageCircle className="w-4 h-4" />
                        MESSAGE
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onAction('view', data)}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl text-xs font-black transition-all",
                          isLight
                            ? "bg-secondary hover:bg-muted text-foreground border border-border/40"
                            : "bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.08]"
                        )}
                    >
                        <Eye className="w-4 h-4" />
                        VIEW
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}
