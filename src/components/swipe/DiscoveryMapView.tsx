/**
 * DISCOVERY MAP VIEW — 🛸 RADAR NEXUS v14.0 (Wide-screen Hybrid)
 * 
 * Final Ergonomic Polish:
 * 1. Balanced Center Hud: Shifted KM selects and Category Matrix to the horizontal center axis.
 * 2. Visual Breathing Room: Adjusted z-index and spacing for maximum document momentum.
 * 3. Liquid Glass Command Pill: Unified horizontal category rail at the bottom for thumb-reach ergonomics.
 */

import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, RefreshCw, ArrowLeft, Layers, Sparkles, ChevronLeft, Zap } from 'lucide-react';
import { toast } from 'sonner';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { VespaIcon } from '@/components/icons/VespaIcon';
import { BeachBicycleIcon } from '@/components/icons/BeachBicycleIcon';
import { WorkersIcon } from '@/components/icons/WorkersIcon';
import { RealEstateIcon } from '@/components/icons/RealEstateIcon';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { useFilterStore } from '@/state/filterStore';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';
import type { QuickFilterCategory } from '@/types/filters';

// ——— Category display config ——————————————————————————————————————————————————————————————————————
const CATEGORY_META: Record<string, { label: string; accent: string; accentRgb: string }> = {
  property:   { label: 'Properties',  accent: '#3b82f6', accentRgb: '59,130,246' },
  motorcycle: { label: 'Motorcycles', accent: '#f97316', accentRgb: '249,115,22' },
  bicycle:    { label: 'Bicycles',    accent: '#f43f5e', accentRgb: '244,63,94' },
  services:   { label: 'Workers',     accent: '#a855f7', accentRgb: '168,85,247' },
};

// ——— Slider Constants ——————————————————————————————————————————————————————————————————————
const MIN_KM = 1;
const MAX_KM = 100;
const SLIDER_TRACK_H = 6;
const THUMB_SIZE = 28;

// Tile layer URLs hoisted to module scope so all effects can reference them.
const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const SATELLITE_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

export const DiscoveryMapView = memo(({ 
  category, 
  onBack, 
  onStartSwiping, 
  onCategoryChange,
  isEmbedded = false,
  mode = 'client'
}: {
  category: QuickFilterCategory;
  onBack: () => void;
  onStartSwiping: () => void;
  onCategoryChange?: (cat: QuickFilterCategory) => void;
  isEmbedded?: boolean;
  mode?: 'client' | 'owner';
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { user } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  
  const radiusKm = useFilterStore(s => s.radiusKm);
  const setRadiusKm = useFilterStore(s => s.setRadiusKm);
  const setUserLocation = useFilterStore(s => s.setUserLocation);
  const userLatitude = useFilterStore(s => s.userLatitude);
  const userLongitude = useFilterStore(s => s.userLongitude);

  const [localKm, setLocalKm] = useState(radiusKm || 1);
  const [detecting, setDetecting] = useState(false);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>(isEmbedded ? 'satellite' : 'streets');
  const [dotCount, setDotCount] = useState(0);

  const radarCircle = useRef<L.Circle | null>(null);
  const centerMarker = useRef<L.Marker | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  const meta = CATEGORY_META[category] || CATEGORY_META.property;
  const tulumCenter: [number, number] = [20.2114, -87.4654];
  const currentCenter: [number, number] = (userLatitude != null && userLongitude != null)
    ? [userLatitude, userLongitude]
    : tulumCenter;

  // 🛰️ Engine Mount
  useEffect(() => {
    if (!mapContainerRef.current || mapInstance.current) return;

    try {
        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false,
            fadeAnimation: true,
            markerZoomAnimation: true,
            worldCopyJump: true
        }).setView(currentCenter, 15);

        const initialTiles = mapStyle === 'satellite' 
            ? SATELLITE_TILES
            : isLight ? LIGHT_TILES : DARK_TILES;

        const layer = L.tileLayer(initialTiles, { maxZoom: 20, crossOrigin: true }).addTo(map);
        (map as any)._activeTileLayer = layer;

        radarCircle.current = L.circle(currentCenter, {
            color: meta.accent,
            fillColor: meta.accent,
            fillOpacity: 0.1,
            weight: 2,
            radius: localKm * 1000,
            className: 'sentient-radar-circle'
        }).addTo(map);

        const centerIcon = L.divIcon({
            className: 'radar-center',
            html: `
              <div class="relative w-12 h-12 flex items-center justify-center">
                <div class="absolute inset-0 bg-${meta.accent} opacity-50 rounded-full animate-ping"></div>
                <div class="absolute inset-2 bg-${meta.accent}/30 rounded-full"></div>
                <div class="w-5 h-5 bg-white border-[3px] border-[${meta.accent}] rounded-full shadow-[0_0_20px_rgba(59,130,246,0.8)] relative z-10"></div>
              </div>
            `,
            iconSize: [48, 48],
            iconAnchor: [24, 24]
        });
        centerMarker.current = L.marker(currentCenter, { icon: centerIcon }).addTo(map);
        markersRef.current = L.layerGroup().addTo(map);
        mapInstance.current = map;
        
        setTimeout(() => map.invalidateSize(), 300);
    } catch (e) { console.error("Map Error:", e); }

    return () => {
        if (mapInstance.current) {
            mapInstance.current.remove();
            mapInstance.current = null;
        }
    };
  }, []);

  // 🛰️ Sync Overlays & Layer Swap
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !radarCircle.current) return;

    radarCircle.current.setRadius(localKm * 1000);
    radarCircle.current.setLatLng(currentCenter);
    radarCircle.current.setStyle({ color: meta.accent, fillColor: meta.accent });
    centerMarker.current?.setLatLng(currentCenter);

    map.invalidateSize({ animate: false });
    
    const zoomLevel = localKm <= 1 ? 14.5 : localKm <= 5 ? 12.8 : localKm <= 25 ? 10.8 : 8.8;
    map.flyTo(currentCenter, zoomLevel, { animate: true, duration: 1.4 });

    const tileUrl = mapStyle === 'satellite' 
        ? SATELLITE_TILES
        : isLight ? LIGHT_TILES : DARK_TILES;

    const prev = (map as any)._activeTileLayer as L.TileLayer | undefined;
    if (prev && (prev as any)._url !== tileUrl) {
        map.removeLayer(prev);
        const next = L.tileLayer(tileUrl, { maxZoom: 20, crossOrigin: true }).addTo(map);
        (map as any)._activeTileLayer = next;
    }
  }, [localKm, mapStyle, currentCenter, isLight, meta.accent]);

  // Fetch real listing/profile dots
  useEffect(() => {
    if (!user?.id || !mapInstance.current || !markersRef.current) return;
    
    const fetchDots = async () => {
      try {
        let dotsData = [];
        if (mode === 'owner') {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, latitude, longitude')
            .not('latitude', 'is', null)
            .not('longitude', 'is', null)
            .neq('id', user.id)
            .limit(200);
          if (!error && data) dotsData = data;
        } else {
          const categoryDb = category === 'services' ? 'worker' : category;
          const { data, error } = await supabase
            .from('listings')
            .select('id, latitude, longitude')
            .eq('status', 'active')
            .eq('category', categoryDb)
            .not('latitude', 'is', null)
            .not('longitude', 'is', null)
            .neq('user_id', user.id)
            .limit(200);
          if (!error && data) dotsData = data;
        }

        markersRef.current?.clearLayers();
        setDotCount(dotsData.length);

        dotsData.forEach(dot => {
            const icon = L.divIcon({
                className: 'listing-dot',
                html: `<div class="w-2.5 h-2.5 rounded-full bg-white border-2 border-[${meta.accent}] shadow-lg"></div>`,
                iconSize: [10, 10],
                iconAnchor: [5, 5]
            });
            L.marker([dot.latitude, dot.longitude], { icon }).addTo(markersRef.current!);
        });
      } catch (e) { logger.error('[DiscoveryMap] error:', e); }
    };
    fetchDots();
  }, [user?.id, category, mode, meta.accent]);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    triggerHaptic('medium');
    navigator.geolocation.getCurrentPosition(
      pos => { 
        setUserLocation(pos.coords.latitude, pos.coords.longitude); 
        setDetecting(false);
        toast.success('GPS Latched'); 
      },
      () => {
        setDetecting(false);
        toast.error('Enable GPS');
      },
      { timeout: 8000 }
    );
  }, [setUserLocation]);

  // Debounce radius update
  useEffect(() => {
    const t = setTimeout(() => { if (localKm !== radiusKm) setRadiusKm(localKm); }, 250);
    return () => clearTimeout(t);
  }, [localKm, radiusKm, setRadiusKm]);

  // Slider drag logic
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDraggingSlider = useRef(false);
  const sliderRectRef = useRef<DOMRect | null>(null);

  const updateSliderFromX = useCallback((clientX: number) => {
    const track = sliderRef.current;
    if (!track) return;
    if (!sliderRectRef.current) sliderRectRef.current = track.getBoundingClientRect();
    const rect = sliderRectRef.current;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const km = Math.round(MIN_KM + ratio * (MAX_KM - MIN_KM));
    setLocalKm(km);
  }, []);

  const handleSliderPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    isDraggingSlider.current = true;
    sliderRectRef.current = (e.currentTarget as HTMLElement).getBoundingClientRect();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    triggerHaptic('light');
    updateSliderFromX(e.clientX);
  }, [updateSliderFromX]);

  const handleSliderPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingSlider.current) return;
    e.stopPropagation();
    updateSliderFromX(e.clientX);
  }, [updateSliderFromX]);

  const handleSliderPointerUp = useCallback(() => {
    isDraggingSlider.current = false;
    sliderRectRef.current = null;
    triggerHaptic('light');
  }, []);

  const sliderRatio = (localKm - MIN_KM) / (MAX_KM - MIN_KM);

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden bg-background">
      {/* 🛸 TOP HUD */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => { triggerHaptic('light'); onBack(); }}
        className={cn(
          "absolute top-[calc(env(safe-area-inset-top,0px)+12px)] left-4 z-[2000] flex items-center gap-1.5 px-4 py-2.5 rounded-2xl",
          "transition-transform active:scale-95 border",
          isLight
            ? "bg-white/75 backdrop-blur-[40px] saturate-[180%] border-black/5 text-black shadow-lg"
            : "bg-black/65 backdrop-blur-[40px] saturate-[180%] border-white/10 text-white shadow-2xl"
        )}
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="text-[12px] font-black uppercase tracking-[0.2em]">Back</span>
      </motion.button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute top-[calc(env(safe-area-inset-top,0px)+12px)] left-1/2 -translate-x-1/2 z-[2000] pointer-events-none"
      >
        <div
          className={cn(
            "px-6 py-2.5 rounded-2xl flex items-center gap-2.5 border",
            isLight
              ? "bg-white/75 backdrop-blur-[40px] border-black/5 shadow-lg"
              : "bg-black/65 backdrop-blur-[40px] border-white/10 shadow-2xl"
          )}
        >
          <div
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ background: meta.accent }}
          />
          <span className="text-[12px] font-black uppercase tracking-[0.25em]" style={{ color: meta.accent }}>
            {meta.label}
          </span>
          <span className={cn("text-[11px] font-bold", isLight ? "text-black/40" : "text-white/40")}>
            {dotCount} nearby
          </span>
        </div>
      </motion.div>

      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+12px)] right-4 z-[2000] flex gap-2">
        <button 
          onClick={() => { triggerHaptic('light'); setMapStyle(prev => prev === 'streets' ? 'satellite' : 'streets'); }} 
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center active:scale-90 transition-all border",
            isLight ? "bg-white/75 backdrop-blur-[40px] border-black/5 text-black" : "bg-black/65 backdrop-blur-[40px] border-white/10 text-white"
          )}
        >
          <Layers className="w-5 h-5" />
        </button>
        <button
          onClick={detectLocation}
          disabled={detecting}
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center active:scale-90 transition-all border",
            isLight ? "bg-white/75 backdrop-blur-[40px] border-black/5 text-black" : "bg-black/65 backdrop-blur-[40px] border-white/10 text-white"
          )}
        >
          <Navigation className={cn("w-5 h-5", detecting && "animate-spin")} style={userLatitude ? { color: meta.accent } : {}} />
        </button>
      </div>

      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* 🛸 BOTTOM PANEL (Wide-screen Style) */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "absolute bottom-0 inset-x-0 z-[2000] px-5 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] flex flex-col gap-5",
          isLight
            ? "bg-white/95 backdrop-blur-2xl border-t border-black/5"
            : "bg-black/95 backdrop-blur-3xl border-t border-white/10"
        )}
      >
        {/* Category Rail (Lovable Style integrated into Wide-screen bottom) */}
        <div className="flex justify-center -mt-2 mb-1">
            <div className={cn(
               "p-1.5 rounded-[2rem] flex items-center gap-1.5 border transition-all",
               isLight ? "bg-black/5 border-black/5" : "bg-white/5 border-white/5"
            )}>
                {[
                    { id: 'property', icon: RealEstateIcon, label: 'Estate' }, 
                    { id: 'motorcycle', icon: VespaIcon, label: 'Moto' }, 
                    { id: 'bicycle', icon: BeachBicycleIcon, label: 'Aqua' }, 
                    { id: 'services', icon: WorkersIcon, label: 'Crew' }
                ].map(catItem => (
                    <button 
                        key={catItem.id} 
                        onClick={() => { triggerHaptic('light'); onCategoryChange?.(catItem.id as QuickFilterCategory); }} 
                        className={cn(
                            "h-10 px-4 flex items-center gap-2 rounded-[1.5rem] transition-all whitespace-nowrap", 
                            category === catItem.id 
                              ? "bg-white text-black shadow-lg" 
                              : isLight ? "text-black/30 hover:bg-black/5" : "text-white/20 hover:bg-white/5"
                        )}
                    >
                        <catItem.icon className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest italic">{catItem.label}</span>
                    </button>
                ))}
            </div>
        </div>

        <div className="flex items-center justify-between px-2">
          <span className={cn("text-[10px] font-black uppercase tracking-[0.3em]", isLight ? "text-black/40" : "text-white/40")}>
            Discovery Radius
          </span>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-black tabular-nums" style={{ color: meta.accent }}>
              {localKm}
            </span>
            <span className={cn("text-xs font-bold mt-1", isLight ? "text-black/30" : "text-white/30")}>km</span>
          </div>
        </div>

        <div className="relative w-full select-none" style={{ height: THUMB_SIZE }}>
          <div
            ref={sliderRef}
            className="absolute left-0 right-0 flex items-center"
            style={{
              top: '50%', transform: 'translateY(-50%)',
              height: THUMB_SIZE + 12,
              touchAction: 'none', cursor: 'pointer',
            }}
            onPointerDown={handleSliderPointerDown}
            onPointerMove={handleSliderPointerMove}
            onPointerUp={handleSliderPointerUp}
            onPointerCancel={handleSliderPointerUp}
          >
            <div
              className="absolute left-0 right-0 rounded-full overflow-hidden"
              style={{
                top: '50%', transform: 'translateY(-50%)',
                height: SLIDER_TRACK_H,
                background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
              }}
            >
              <div
                className="absolute left-0 top-0 bottom-0 rounded-full"
                style={{
                  width: `${sliderRatio * 100}%`,
                  background: meta.accent,
                }}
              />
            </div>

            <div
              className="absolute rounded-full"
              style={{
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                top: '50%',
                left: `calc(${sliderRatio * 100}% - ${THUMB_SIZE / 2}px)`,
                transform: 'translateY(-50%)',
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => { triggerHaptic('medium'); onStartSwiping(); }}
          className={cn(
            "relative w-full h-15 rounded-2xl font-black text-[13px] uppercase tracking-[0.25em] flex items-center justify-center gap-2.5 overflow-hidden shadow-2xl",
          )}
          style={{
            background: meta.accent,
            color: '#fff',
          }}
        >
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.2) 48%, rgba(255,255,255,0.05) 52%, transparent 70%)',
            }}
            initial={{ x: '-120%' }}
            animate={{ x: ['-120%', '180%', '180%'] }}
            transition={{ duration: 1.8, ease: 'easeInOut', repeat: Infinity, repeatDelay: 4 }}
          />
          <Zap className="w-4.5 h-4.5" style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.5))' }} />
          <span>Start Swiping</span>
          {dotCount > 0 && (
            <span className="text-[10px] opacity-60 font-bold normal-case tracking-normal">
              ({dotCount} found)
            </span>
          )}
        </motion.button>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        .leaflet-container { width: 100%; height: 100%; outline: none; background: ${isLight ? '#f8fafc' : '#0d0d0f'} !important; }
        .leaflet-tile { transition: opacity 0.6s ease; ${isLight ? '' : 'filter: brightness(0.4) contrast(1.2) saturate(0.8);'} } 
        .sentient-radar-circle { 
            animation: radar-pulse-v14 3.5s infinite ease-in-out; 
            transition: all 1.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes radar-pulse-v14 {
          0%, 100% { stroke-opacity: 0.8; stroke-width: 2; fill-opacity: 0.1; }
          50% { stroke-opacity: 0.2; stroke-width: 4; fill-opacity: 0.05; }
        }
      `}} />
    </div>
  );
});

DiscoveryMapView.displayName = 'DiscoveryMapView';
