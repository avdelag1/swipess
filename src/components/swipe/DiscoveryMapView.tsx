/**
 * DISCOVERY MAP VIEW — High Fidelity Radar
 * 
 * v4.3: Absolute Visibility Fix.
 * Uses Direct CDN Leaflet to bypass bundle issues.
 * Fixed HUD scaling for all devices.
 */

import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, RefreshCw, Building2, Bike, ArrowLeft, HardHat, PersonStanding } from 'lucide-react';
import { toast } from 'sonner';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { triggerHaptic } from '@/utils/haptics';
import { useFilterStore } from '@/state/filterStore';
import { useAuth } from '@/hooks/useAuth';

// 🚀 COMPONENT-LEVEL STYLING
const HUD_STYLE = {
  glass: "bg-white/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-black/5"
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
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  
  const radiusKm = useFilterStore(s => s.radiusKm);
  const setRadiusKm = useFilterStore(s => s.setRadiusKm);
  const setUserLocation = useFilterStore(s => s.setUserLocation);
  const userLatitude = useFilterStore(s => s.userLatitude);
  const userLongitude = useFilterStore(s => s.userLongitude);

  const [localKm, setLocalKm] = useState(radiusKm);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const tulumCenter: [number, number] = [20.2114, -87.4654];
  const currentCenter: [number, number] = userLatitude ? [userLatitude, userLongitude] : tulumCenter;

  const handleRefresh = useCallback(() => {
    triggerHaptic('medium');
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Radar live');
    }, 1000);
  }, []);

  useEffect(() => { handleRefresh(); }, [category, localKm]);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    triggerHaptic('medium');
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLocation(pos.coords.latitude, pos.coords.longitude); toast.success('Location updated'); },
      () => toast.error('Check location settings'),
      { timeout: 8000 }
    );
  }, [setUserLocation]);

  // ── 🌍 DIRECT LEAFLET INJECTION (FOOLPROOF) ────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = async () => {
      // Ensure Leaflet is loaded from CDN
      if (!(window as any).L) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        document.head.appendChild(script);

        await new Promise(resolve => { script.onload = resolve; });
      }

      const L = (window as any).L;
      if (leafletRef.current) {
        leafletRef.current.remove();
      }

      // Initialize map
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView(currentCenter, 13);

      // Add White/Normal Carto Tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}@2x.png', {
        maxZoom: 20
      }).addTo(map);

      // Radar Circle
      const circle = L.circle(currentCenter, {
        color: '#000',
        fillColor: '#000',
        fillOpacity: 0.05,
        weight: 1.5,
        dashArray: '10, 10',
        radius: localKm * 1000
      }).addTo(map);

      // Center Dot Marker
      const centerIcon = L.divIcon({
        className: 'center-dot',
        html: '<div style="width:16px; height:16px; background:black; border:3px solid white; border-radius:50%; box-shadow:0 4px 12px rgba(0,0,0,0.3);"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });
      L.marker(currentCenter, { icon: centerIcon }).addTo(map);

      // Sample Markers
      const samples = [
        { lat: currentCenter[0] + 0.005, lng: currentCenter[1] + 0.008, cat: 'property' },
        { lat: currentCenter[0] - 0.007, lng: currentCenter[1] - 0.005, cat: 'motorcycle' },
        { lat: currentCenter[0] + 0.012, lng: currentCenter[1] - 0.012, cat: 'services' },
      ];

      samples.forEach(s => {
        if (category && s.cat !== category) return;
        const icon = L.divIcon({
          className: 'sample-icon',
          html: '<div style="width:40px; height:40px; background:white; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 16px rgba(0,0,0,0.25); border:1px solid rgba(0,0,0,0.05);">📍</div>',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });
        L.marker([s.lat, s.lng], { icon }).addTo(map);
      });

      leafletRef.current = map;
      
      // Critical: Ensure map layout update
      setTimeout(() => map.invalidateSize(), 300);
    };

    initMap();

    return () => {
      if (leafletRef.current) leafletRef.current.remove();
    };
  }, [currentCenter, localKm, category]);

  return (
    <motion.div className="flex flex-col h-full w-full bg-white relative overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      
      {/* HUD: FIXED SCALING */}
      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+16px)] inset-x-0 px-6 z-[2000] flex items-center justify-between pointer-events-none">
        <button onClick={onBack} className={cn("w-14 h-14 rounded-full flex items-center justify-center pointer-events-auto active:scale-90 transition-all", HUD_STYLE.glass)}>
          <ArrowLeft className="w-7 h-7 text-black" />
        </button>
        
        <div className="flex flex-col items-center gap-3">
            <div className={cn("px-8 py-3 rounded-full flex items-center gap-2 pointer-events-auto", HUD_STYLE.glass)}>
                <span className="text-[12px] font-black uppercase tracking-widest text-black/30">KM:</span>
                <span className="text-[18px] font-black text-black">{localKm}</span>
            </div>
            <div className={cn("flex items-center gap-2 p-1.5 rounded-full pointer-events-auto", HUD_STYLE.glass)}>
                {[1, 5, 25, 100].map(km => (
                    <button 
                      key={km} 
                      onClick={() => { triggerHaptic('light'); setLocalKm(km); setRadiusKm(km); }} 
                      className={cn("min-w-[48px] h-10 px-4 rounded-full text-[12px] font-black transition-all", localKm === km ? "bg-black text-white shadow-lg scale-105" : "text-black/40 hover:bg-black/5")}
                    >
                      {km}K
                    </button>
                ))}
            </div>
        </div>

        <button onClick={detectLocation} className={cn("w-14 h-14 rounded-full flex items-center justify-center pointer-events-auto active:scale-90 transition-all", userLatitude ? "bg-black text-white" : HUD_STYLE.glass)}>
          <Navigation className="w-6 h-6" />
        </button>
      </div>

      {/* RIGHT FILTERS: FIXED SCALING */}
      <div className="absolute top-1/2 -translate-y-1/2 right-4 z-[2000] flex flex-col items-center">
        <div className={cn("p-4 rounded-[2.5rem] flex flex-col items-center gap-5 pointer-events-auto", HUD_STYLE.glass)}>
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
              className={cn("w-16 h-16 flex items-center justify-center rounded-3xl transition-all", category === cat.id ? "bg-black text-white scale-110 shadow-2xl" : "text-black/30 hover:bg-black/5")}
            >
              <cat.icon className="w-8 h-8" />
            </button>
          ))}
        </div>
      </div>

      {/* MAP CONTAINER: GUARANTEED VISIBILITY */}
      <div 
        ref={mapRef}
        className="flex-1 m-4 rounded-[3.5rem] bg-[#f8fafc] shadow-inner border border-black/5 z-10"
        style={{ minHeight: '400px' }}
      />

      {/* BOTTOM CTA: START SCANNING */}
      <div className="absolute bottom-[calc(var(--bottom-nav-height,72px)+env(safe-area-inset-bottom,0px)+16px)] inset-x-0 z-[2000] flex justify-center px-10 pointer-events-none">
        <button 
          onClick={handleRefresh} 
          className="w-full max-w-[360px] h-18 rounded-[2.25rem] text-[14px] font-black uppercase tracking-[0.5em] bg-black text-white shadow-[0_32px_64px_rgba(0,0,0,0.5)] pointer-events-auto active:scale-95 transition-all flex items-center justify-center gap-4"
        >
          <RefreshCw className={cn("w-6 h-6", isRefreshing && "animate-spin")} /> START SCANNING
        </button>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-[2000]" />
    </motion.div>
  );
});

DiscoveryMapView.displayName = 'DiscoveryMapView';
