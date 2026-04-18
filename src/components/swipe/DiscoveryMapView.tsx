/**
 * DISCOVERY MAP VIEW — Apple-Style High Fidelity Radar
 * 
 * v4.1: Production Leaflet Implementation.
 * Full-bleed, immersive, 100% visible map.
 */

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, RefreshCw, Building2, Bike, ArrowLeft, HardHat, PersonStanding } from 'lucide-react';
import { MapContainer, TileLayer, Circle, Marker, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { toast } from 'sonner';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { triggerHaptic } from '@/utils/haptics';
import { useFilterStore } from '@/state/filterStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { QuickFilterCategory } from '@/types/filters';

// ── LEAFLET ASSET REPAIR ───────────────────────────────────────────────────
// Force Leaflet to find its icon assets correctly or use custom ones
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Marker Configuration
const createCustomIcon = (iconName: string, active: boolean) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div class="flex items-center justify-center w-11 h-11 rounded-full bg-white shadow-2xl border-2 ${active ? 'border-primary' : 'border-black/5'} transition-all transform hover:scale-110 active:scale-90">
        <div class="text-black pointer-events-none">
          ${iconName === 'property' ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"></path><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3"></path><path d="M19 21v-4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v4"></path><path d="M9 21h6"></path></svg>' : 
            iconName === 'motorcycle' ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"></circle><circle cx="5.5" cy="17.5" r="3.5"></circle><circle cx="15" cy="5" r="1"></circle><path d="M12 17.5V14l-2-3 4-3 2 3h2"></path></svg>' :
            iconName === 'services' ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"></path><path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"></path><path d="M4 15V9a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v6"></path><path d="M6 19v2"></path><path d="M18 19v2"></path></svg>' :
            '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'}
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};

// Map center controller with force invalidate transition
const MapController = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
    // This is critical for 100% visibility in all browsers
    setTimeout(() => map.invalidateSize(), 150);
  }, [center, map]);
  return null;
};

export const DiscoveryMapView = memo(({ 
  category, 
  onBack, 
  onStartSwiping, 
  onCategoryChange 
}: {
  category: QuickFilterCategory;
  onBack: () => void;
  onStartSwiping: () => void;
  onCategoryChange?: (cat: QuickFilterCategory) => void;
}) => {
  const { theme } = useTheme();
  
  const radiusKm = useFilterStore(s => s.radiusKm);
  const setRadiusKm = useFilterStore(s => s.setRadiusKm);
  const setUserLocation = useFilterStore(s => s.setUserLocation);
  const userLatitude = useFilterStore(s => s.userLatitude);
  const userLongitude = useFilterStore(s => s.userLongitude);

  const [localKm, setLocalKm] = useState(radiusKm);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [markers, setMarkers] = useState<any[]>([]);

  const tulumCenter: [number, number] = [20.2114, -87.4654];
  const currentCenter: [number, number] = userLatitude ? [userLatitude, userLongitude] : tulumCenter;

  const handleRefresh = useCallback(() => {
    triggerHaptic('medium');
    setIsRefreshing(true);
    
    setTimeout(() => {
      const samples = [
        { id: '1', lat: currentCenter[0] + 0.005, lng: currentCenter[1] + 0.008, cat: 'property' },
        { id: '2', lat: currentCenter[0] - 0.007, lng: currentCenter[1] - 0.005, cat: 'motorcycle' },
        { id: '3', lat: currentCenter[0] + 0.012, lng: currentCenter[1] - 0.012, cat: 'bicycle' },
        { id: '4', lat: currentCenter[0] - 0.003, lng: currentCenter[1] + 0.015, cat: 'services' },
        { id: '5', lat: currentCenter[0] + 0.020, lng: currentCenter[1] + 0.020, cat: 'property' },
      ];
      setMarkers(samples);
      setIsRefreshing(false);
      toast.success('Radar live');
    }, 1200);
  }, [currentCenter]);

  useEffect(() => {
    handleRefresh();
  }, [category, localKm]);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    triggerHaptic('medium');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation(pos.coords.latitude, pos.coords.longitude);
        toast.success('GPS position synced');
      },
      () => toast.error('Check location permissions'),
      { timeout: 8000 }
    );
  }, [setUserLocation]);

  return (
    <motion.div 
      className="flex flex-col h-full w-full bg-slate-100 relative overflow-hidden" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
    >
      {/* 🛠️ BROWSER COMPATIBILITY: Inject Leaflet CSS directly just in case the bundle import fails */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossOrigin="" />

      {/* HUD: Header — iOS Style (Clean, Full-Bleed) */}
      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+12px)] inset-x-0 px-4 z-[2000] flex items-center justify-between pointer-events-none">
        <button onClick={onBack} className="w-13 h-13 rounded-full flex items-center justify-center bg-white shadow-2xl border border-black/5 pointer-events-auto active:scale-90 transition-all">
          <ArrowLeft className="w-7 h-7 text-black" />
        </button>
        
        <div className="flex flex-col items-center gap-2 pointer-events-none">
            <div className="px-6 py-2.5 rounded-full bg-white shadow-2xl border border-black/5 flex items-center gap-2 pointer-events-auto">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#EC4899] animate-pulse">Scanning:</span>
                <span className="text-[16px] font-black text-black">{localKm}KM</span>
            </div>
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/95 shadow-xl border border-black/5 pointer-events-auto backdrop-blur-md">
                {[1, 5, 25, 100].map(km => (
                    <button 
                      key={km} 
                      onClick={() => { triggerHaptic('light'); setLocalKm(km); setRadiusKm(km); }} 
                      className={cn("px-4.5 py-1.5 rounded-full text-[11px] font-black transition-all", localKm === km ? "bg-black text-white scale-105 shadow-md" : "text-black/50 hover:bg-black/5")}
                    >
                      {km}K
                    </button>
                ))}
            </div>
        </div>

        <button onClick={detectLocation} className={cn("w-13 h-13 rounded-full flex items-center justify-center shadow-2xl border border-black/5 pointer-events-auto active:scale-90 transition-all", userLatitude ? "bg-black text-white" : "bg-white text-black")}>
          <Navigation className="w-6 h-6" />
        </button>
      </div>

      {/* RIGHT SIDE FILTERS: Vertical Column */}
      <div className="absolute top-1/2 -translate-y-1/2 right-4 z-[2000] flex flex-col gap-3 pointer-events-none">
        <div className="p-3.5 rounded-[2.5rem] flex flex-col items-center gap-4 bg-white shadow-2xl border border-black/5 pointer-events-auto backdrop-blur-md">
          {[
            { id: 'property', icon: Building2 }, 
            { id: 'motorcycle', icon: MotorcycleIcon }, 
            { id: 'bicycle', icon: Bike }, 
            { id: 'services', icon: HardHat },
            { id: 'roommate', icon: PersonStanding }
          ].map(cat => (
            <button 
              key={cat.id} 
              onClick={() => { triggerHaptic('light'); onCategoryChange?.(cat.id as any); }} 
              className={cn("w-15 h-15 flex items-center justify-center rounded-[1.25rem] transition-all", category === cat.id ? "bg-[#EC4899] text-white scale-110 shadow-xl" : "text-black/30 hover:bg-black/5")}
            >
              <cat.icon className="w-7 h-7" />
            </button>
          ))}
        </div>
      </div>

      {/* IMMERSIVE FULL-BLEED MAP */}
      <div className="flex-1 relative w-full h-full z-10 bg-[#e5e7eb]">
        <MapContainer 
          center={currentCenter} 
          zoom={13} 
          className="w-full h-full" 
          zoomControl={false}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OSM'
          />
          <MapController center={currentCenter} />
          
          {/* RADAR CIRCLE — Vivid Mexican Pink */}
          <Circle
            center={currentCenter}
            radius={localKm * 1000}
            pathOptions={{ 
              color: '#EC4899', 
              fillColor: '#EC4899', 
              fillOpacity: 0.15,
              weight: 3,
              dashArray: '12, 12'
            }}
          />

          {/* CENTER DOT */}
          <Marker position={currentCenter} icon={L.divIcon({ 
            className: 'center-dot', 
            html: '<div class="w-5 h-5 rounded-full bg-black border-[3px] border-white shadow-2xl"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })} />

          {/* SAMPLE MARKERS (Filtered live) */}
          {markers.filter(m => !category || m.cat === category).map(m => (
            <Marker 
              key={m.id} 
              position={[m.lat, m.lng]} 
              icon={createCustomIcon(m.cat, false)}
              eventHandlers={{
                click: () => {
                  triggerHaptic('medium');
                  toast.info(`View details: ${m.cat}`);
                }
              }}
            />
          ))}

          <ZoomControl position="bottomright" />
        </MapContainer>
      </div>

      {/* BOTTOM ACTION: Start Scanning */}
      <div className="absolute bottom-[calc(var(--bottom-nav-height,72px)+env(safe-area-inset-bottom,0px)+12px)] inset-x-0 z-[2000] flex justify-center px-6 pointer-events-none">
        <button 
          onClick={handleRefresh} 
          className="w-full max-w-[340px] h-16 rounded-[2rem] text-[13px] font-black uppercase tracking-[0.45em] bg-black text-white shadow-[0_32px_64px_rgba(0,0,0,0.5)] flex items-center justify-center gap-3 pointer-events-auto active:scale-95 transition-all"
        >
          <RefreshCw className={cn("w-6 h-6", isRefreshing && "animate-spin")} /> START SCANNING
        </button>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-[calc(var(--bottom-nav-height,72px)+60px)] bg-gradient-to-t from-black/30 to-transparent pointer-events-none z-[2000]" />
    </motion.div>
  );
});

DiscoveryMapView.displayName = 'DiscoveryMapView';
