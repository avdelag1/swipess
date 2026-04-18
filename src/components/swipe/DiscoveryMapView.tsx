/**
 * DISCOVERY MAP VIEW — 🛸 ULTRA RADAR
 * 
 * v5.0: The "Visible Proof" Update.
 * Uses standard imports + explicit height + force color change to verify deploy.
 */

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { Navigation, RefreshCw, Building2, Bike, ArrowLeft, HardHat, PersonStanding } from 'lucide-react';
import { toast } from 'sonner';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { useFilterStore } from '@/state/filterStore';

export const DiscoveryMapView = memo(({ 
  category, 
  onBack, 
  onStartSwiping, 
  onCategoryChange 
}: {
  category: any;
  onBack: () => void;
  onStartSwiping: () => void;
  onCategoryChange?: (cat: any) => void;
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  
  const radiusKm = useFilterStore(s => s.radiusKm);
  const setRadiusKm = useFilterStore(s => s.setRadiusKm);
  const setUserLocation = useFilterStore(s => s.setUserLocation);
  const userLatitude = useFilterStore(s => s.userLatitude);
  const userLongitude = useFilterStore(s => s.userLongitude);

  const [localKm, setLocalKm] = useState(radiusKm);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const tulumCenter: [number, number] = [20.2114, -87.4654];
  const currentCenter: [number, number] = userLatitude ? [userLatitude, userLongitude] : tulumCenter;

  // ── LEAFLET INITIALIZATION ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Cleanup existing instance
    if (mapInstance.current) {
      mapInstance.current.remove();
    }

    // Fix icons
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(currentCenter, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // Radar Circle
    L.circle(currentCenter, {
      color: '#EB4898',
      fillColor: '#EB4898',
      fillOpacity: 0.1,
      weight: 2,
      dashArray: '10, 10',
      radius: localKm * 1000
    }).addTo(map);

    // Center Dot
    const centerIcon = L.divIcon({
      className: 'center-dot',
      html: '<div style="width:20px;height:20px;background:black;border:3px solid white;border-radius:50%;box-shadow:0 8px 24px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
    L.marker(currentCenter, { icon: centerIcon }).addTo(map);

    mapInstance.current = map;
    
    // 🔥 CRITICAL: Force invalidate size multiple times to ensure visibility
    setTimeout(() => map.invalidateSize(), 150);
    setTimeout(() => map.invalidateSize(), 800);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [currentCenter, localKm]); // Only re-init if coords or radius changes significantly

  const handleRefresh = useCallback(() => {
    triggerHaptic('medium');
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Radar live');
    }, 1000);
  }, []);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    triggerHaptic('medium');
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLocation(pos.coords.latitude, pos.coords.longitude); toast.success('GPS sync success'); },
      () => toast.error('Enable location data'),
      { timeout: 8000 }
    );
  }, [setUserLocation]);

  return (
    <motion.div className="flex flex-col h-screen w-full bg-black relative overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      
      {/* HUD: HEADER — Vivid Mexican Pink Version Tag */}
      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+24px)] inset-x-0 px-8 z-[2000] flex items-center justify-between pointer-events-none">
        <button onClick={onBack} className="w-16 h-16 rounded-full flex items-center justify-center bg-white shadow-2xl pointer-events-auto active:scale-90 transition-all">
          <ArrowLeft className="w-8 h-8 text-black" />
        </button>
        
        <div className="flex flex-col items-center gap-4">
            <div className="px-10 py-4 rounded-full bg-white shadow-2xl flex flex-col items-center pointer-events-auto min-w-[180px]">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#EB4898] animate-pulse">Ultra Radar v5.1</span>
                <span className="text-[20px] font-black text-black">{localKm}KM Radius</span>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-full bg-white/95 shadow-2xl pointer-events-auto backdrop-blur-xl">
                {[1, 5, 25, 100].map(km => (
                    <button 
                      key={km} 
                      onClick={() => { triggerHaptic('light'); setLocalKm(km); setRadiusKm(km); }} 
                      className={cn("min-w-[60px] h-12 px-5 rounded-full text-[14px] font-black transition-all", localKm === km ? "bg-black text-white scale-110 shadow-xl" : "text-black/40 hover:bg-black/5")}
                    >
                      {km}K
                    </button>
                ))}
            </div>
        </div>

        <button onClick={detectLocation} className={cn("w-16 h-16 rounded-full flex items-center justify-center shadow-2xl pointer-events-auto active:scale-90 transition-all", userLatitude ? "bg-[#EB4898] text-white" : "bg-white text-black")}>
          <Navigation className="w-8 h-8" />
        </button>
      </div>

      {/* QUICK FILTERS: High Res Icons */}
      <div className="absolute top-1/2 -translate-y-1/2 right-6 z-[2000] flex flex-col items-center">
        <div className="p-5 rounded-[3rem] flex flex-col items-center gap-6 bg-white shadow-2xl pointer-events-auto backdrop-blur-2xl border border-black/5">
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
              className={cn("w-16 h-16 flex items-center justify-center rounded-[1.5rem] transition-all", category === cat.id ? "bg-[#EB4898] text-white scale-110 shadow-2xl" : "text-black/30 hover:bg-black/5")}
            >
              <cat.icon className="w-8 h-8" />
            </button>
          ))}
        </div>
      </div>

      {/* THE MAP: Explicit Height Fix */}
      <div 
        ref={mapContainerRef}
        className="flex-1 m-4 rounded-[4rem] bg-zinc-100 shadow-inner z-10"
        style={{ minHeight: '600px', width: 'calc(100% - 32px)' }}
      />

      {/* SCAN BUTTON: Forced Color Proof (MEXICAN PINK) */}
      <div className="absolute bottom-[calc(var(--bottom-nav-height,72px)+env(safe-area-inset-bottom,0px)+24px)] inset-x-0 z-[2000] flex justify-center px-10 pointer-events-none">
        <button 
          onClick={handleRefresh} 
          className="w-full max-w-[400px] h-20 rounded-[2.5rem] text-[15px] font-black uppercase tracking-[0.6em] bg-[#EB4898] text-white shadow-[0_45px_100px_rgba(235,72,152,0.6)] pointer-events-auto active:scale-95 transition-all flex items-center justify-center gap-5"
        >
          <RefreshCw className={cn("w-8 h-8", isRefreshing && "animate-spin")} /> SCANNING
        </button>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-60 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-[2000]" />
    </motion.div>
  );
});

DiscoveryMapView.displayName = 'DiscoveryMapView';
