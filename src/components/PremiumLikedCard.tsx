import { motion } from "framer-motion";
import { Heart, MessageCircle, MapPin, Trash2, Eye, Bed, Bath, Square, User, Home, Bike, Briefcase, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
                    ? "bg-white border border-black/5 shadow-xl shadow-black/5"
                    : "bg-zinc-900/50 backdrop-blur-xl border border-white/5 shadow-2xl shadow-black/40"
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
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                        {type === 'listing' ? <Home className="w-12 h-12 text-zinc-600" /> : <User className="w-12 h-12 text-zinc-600" />}
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
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/5 text-white/60 hover:text-rose-500 transition-colors active:scale-95"
                >
                    <Trash2 className="w-4 h-4" />
                </button>

                {/* Bottom Info on Image */}
                <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-black text-lg sm:text-xl leading-tight truncate drop-shadow-lg">
                        {title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-white/70 text-xs font-bold mt-1">
                        <MapPin className="w-3 h-3 text-[#E4007C] flex-shrink-0" />
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
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/50 border border-white/5">
                                    <Bed className="w-3.5 h-3.5 text-zinc-400" />
                                    <span className="text-[10px] font-black text-zinc-200">{data.beds}</span>
                                </div>
                            )}
                            {data.price && (
                                <div className="px-3 py-1.5 rounded-xl bg-[#E4007C]/10 border border-[#E4007C]/20 text-[#E4007C] text-[10px] font-black">
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
                    <p className="text-xs text-zinc-400 font-medium line-clamp-2 leading-relaxed">
                        {data.bio || data.description}
                    </p>
                )}

                {/* Standardized Action Buttons */}
                <div className="flex gap-2 pt-2">
                    <button
                        onClick={() => onAction('message', data)}
                        className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl bg-[#E4007C] hover:bg-[#FF1493] text-white text-xs font-black shadow-[0_4px_16px_rgba(228,0,124,0.3)] transition-all active:scale-95"
                    >
                        <MessageCircle className="w-4 h-4" />
                        MESSAGE
                    </button>

                    <button
                        onClick={() => onAction('view', data)}
                        className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-black border border-white/5 transition-all active:scale-95"
                    >
                        <Eye className="w-4 h-4" />
                        VIEW
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
