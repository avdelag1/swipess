import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import {
  Search, MapPin, Calendar, Sparkles, X, SlidersHorizontal,
  ChevronLeft, Heart,
  Waves, Trees, Music, Utensils, Ticket,
  ArrowUpRight, Check, ChevronRight,
  MessageSquare,
  LayoutGrid, PanelsTopLeft,
  Clock, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { triggerHaptic } from '@/utils/haptics';
import { EventGroupChat } from '@/components/EventGroupChat';
import { useAppNavigate } from '@/hooks/useAppNavigate';

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface EventItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  image_url: string | null;
  event_date: string | null;
  location: string | null;
  location_detail: string | null;
  organizer_name: string | null;
  promo_text: string | null;
  discount_tag: string | null;
  is_free: boolean;
  price_text: string | null;
  is_promo?: boolean;
}

type SortOrder = 'upcoming' | 'newest';
type ViewMode = 'feed' | 'stories';

// ── MOCK DATA ─────────────────────────────────────────────────────────────────
const MOCK_EVENTS: EventItem[] = [
  // Your full mock data array here (keep all entries as-is from HEAD)
  // ... (paste your MOCK_EVENTS array)
];

const CATEGORIES = [
  { key: 'all', label: 'All', icon: Sparkles, color: '#FFD700', gradient: 'from-yellow-400 to-orange-500' },
  { key: 'beach', label: 'Beach', icon: Waves, color: '#00BFFF', gradient: 'from-cyan-400 to-blue-500' },
  { key: 'jungle', label: 'Jungle', icon: Trees, color: '#32CD32', gradient: 'from-emerald-400 to-green-600' },
  { key: 'music', label: 'Music', icon: Music, color: '#FF4500', gradient: 'from-red-400 to-rose-600' },
  { key: 'food', label: 'Food', icon: Utensils, color: '#FFA500', gradient: 'from-amber-400 to-orange-500' },
  { key: 'promo', label: 'Promos', icon: Ticket, color: '#BA55D3', gradient: 'from-violet-400 to-purple-600' },
];

const LIKED_STORAGE_KEY = 'eventos_liked_ids';

function loadLikedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LIKED_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveLikedIds(ids: Set<string>) {
  try {
    localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {}
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 7) return `In ${diff} days`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function EventosFeed() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [viewMode, setViewMode] = useState<ViewMode>('feed');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showLiked, setShowLiked] = useState(false);
  const [showGroupChat, setShowGroupChat] = useState(false);
  const [chatEvent, setChatEvent] = useState<EventItem | null>(null);
  const [freeOnly, setFreeOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOrder>('upcoming');
  const [likedIds, setLikedIds] = useState<Set<string>>(loadLikedIds());

  const { data: rawEvents, isLoading } = useQuery({
    queryKey: ['eventos', 'v3'],
    queryFn: async (): Promise<EventItem[]> => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('event_date', { ascending: true });
        if (error) throw error;
        const formatted: EventItem[] = (data || []).map((ev: any) => ({
          id: ev.id,
          title: ev.title || 'Untitled Event',
          description: ev.description || null,
          category: ev.category || 'all',
          image_url: ev.image_url || null,
          event_date: ev.event_date || null,
          location: ev.location || null,
          location_detail: ev.location_detail || null,
          organizer_name: ev.organizer_name || null,
          promo_text: ev.promo_text || null,
          discount_tag: ev.discount_tag || null,
          is_free: !!ev.is_free,
          price_text: ev.price_text || null,
        }));
        return [...MOCK_EVENTS, ...formatted];
      } catch {
        return MOCK_EVENTS;
      }
    },
    staleTime: 1000 * 60 * 5,
    placeholderData: MOCK_EVENTS,
  });

  const allEvents = rawEvents?.length ? rawEvents : MOCK_EVENTS;

  const filteredEvents = useMemo(() => {
    return allEvents
      .filter(e => {
        const matchesCat = activeCategory === 'all' || e.category === activeCategory;
        const matchesSearch = !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase()) || (e.location || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFree = !freeOnly || e.is_free;
        return matchesCat && matchesSearch && matchesFree;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.event_date || 0).getTime() - new Date(a.event_date || 0).getTime();
        }
        return new Date(a.event_date || 0).getTime() - new Date(b.event_date || 0).getTime();
      });
  }, [allEvents, activeCategory, searchQuery, freeOnly, sortBy]);

  const likedCount = likedIds.size;
  const activeFilterCount = (freeOnly ? 1 : 0) + (sortBy !== 'upcoming' ? 1 : 0) + (activeCategory !== 'all' ? 1 : 0);

  const handleLike = useCallback((id: string) => {
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveLikedIds(next);
      return next;
    });
  }, []);

  const handleOpenChat = useCallback((event: EventItem, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    setChatEvent(event);
    setShowGroupChat(true);
  }, []);

  return (
    <div className={cn(
      "relative w-full h-[100dvh] overflow-hidden flex flex-col font-sans transition-colors duration-300",
      isDark ? "bg-[#0a0a0a]" : "bg-slate-50"
    )}>
      {/* HEADER + CATEGORIES */}
      {/* ... keep your full header, search, filters, likes, view toggle from HEAD ... */}

      {/* MAIN CONTENT */}
      <div className="flex-1 w-full relative overflow-hidden">
        <AnimatePresence mode="sync">
          {viewMode === 'feed' ? (
            <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* InstaFeed component from HEAD */}
              {/* ... paste your InstaFeed code here ... */}
            </motion.div>
          ) : (
            <motion.div key="stories" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* StoriesView component from HEAD */}
              {/* ... paste your StoriesView code here ... */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* OVERLAYS */}
      {/* FilterSheet, LikedSheet, EventGroupChat from HEAD */}
      {/* ... paste them here ... */}
    </div>
  );
}