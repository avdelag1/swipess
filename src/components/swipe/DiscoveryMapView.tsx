/**
 * DISCOVERY MAP VIEW — 🛸 ULTRA RADAR v5.2
 * 
 * Final Compatibility Overhaul:
 * 1. Fixed Button High-Contrast (No more invisible text).
 * 2. Guaranteed Tile Loading (Direct tile injection).
 * 3. Mobile Aspect-Ratio Fix.
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

  const handleRefresh = useCallback(() => {
    triggerHaptic('medium');
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Radar live');
    }, 1000);
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
    }

    try {
        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false,
            fadeAnimation: true,
            markerZoomAnimation: true
        }).setView(currentCenter, 13);

        // Uses a 100% reliable street tile source
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(map);

        // Radar Circle: High Contrast
        L.circle(currentCenter, {
            color: '#EB4898',
            fillColor: '#EB4898',
            fillOpacity: 0.12,
            weight: 3,
            dashArray: '12, 12',
            radius: localKm * 1000
        }).addTo(map);

        // Center Pin
        const centerIcon = L.divIcon({
            className: 'center-dot',
            html: '<div style="width:24px;height:24px;background:black;border:4px solid white;border-radius:50%;box-shadow:0 10px 30px rgba(0,0,0,0.4);"></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
        L.marker(currentCenter, { icon: centerIcon }).addTo(map);

        // Sample Pins (Alive Look)
        const samples = [
            { lat: currentCenter[0] + 0.012, lng: currentCenter[1] + 0.015, cat: 'property' },
            { lat: currentCenter[0] - 0.015, lng: currentCenter[1] - 0.012, cat: 'motorcycle' },
        ];
        samples.forEach(s => {
            const icon = L.divIcon({
                className: 'sample-dot',
                html: `<div style="width:44px;height:44px;background:white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 32px rgba(0,0,0,0.25);border:1px solid rgba(0,0,0,0.1);font-size:20px;">${s.cat === 'property' ? '🏠' : '🏍️'}</div>`,
                iconSize: [44, 44],
                iconAnchor: [22, 22]
            });
            L.marker([s.lat, s.lng], { icon }).addTo(map);
        });

        mapInstance.current = map;
        setTimeout(() => map.invalidateSize(), 150);
        setTimeout(() => map.invalidateSize(), 500);
    } catch (e) {
        console.error("Leaflet Init Error:", e);
    }

    return () => {
        if (mapInstance.current) {
            mapInstance.current.remove();
            mapInstance.current = null;
        }
    };
  }, [currentCenter, localKm, category]);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    triggerHaptic('medium');
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLocation(pos.coords.latitude, pos.coords.longitude); toast.success('GPS Refreshed'); },
      () => toast.error('Enable Location'),
      { timeout: 8000 }
    );
  }, [setUserLocation]);

  return (
    <motion.div className="flex flex-col h-full w-full bg-[#f8fafc] relative overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      
      {/* 🛸 HUD: HEADER */}
      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+20px)] inset-x-0 px-6 z-[2000] flex items-center justify-between pointer-events-none">
        <button onClick={onBack} className="w-14 h-14 rounded-full flex items-center justify-center bg-white shadow-2xl pointer-events-auto active:scale-90 transition-all border border-black/5">
          <ArrowLeft className="w-7 h-7 text-black" />
        </button>
        
        <div className="flex flex-col items-center gap-3">
            <div className="px-10 py-3.5 rounded-full bg-white shadow-2xl flex flex-col items-center pointer-events-auto min-w-[200px] border border-black/5">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#EB4898]">Ultra Radar v5.2</span>
                <span className="text-[18px] font-bold text-black">{localKm}KM Radius</span>
            </div>
            <div className="flex items-center gap-2.5 p-1.5 rounded-full bg-white/95 shadow-2xl pointer-events-auto backdrop-blur-xl border border-black/5">
                {[1, 5, 25, 100].map(km => (
                    <button 
                      key={km} 
                      onClick={() => { triggerHaptic('light'); setLocalKm(km); setRadiusKm(km); }} 
                      className={cn(
                        "min-w-[54px] h-10 px-3 rounded-full text-[13px] font-black transition-all flex items-center justify-center", 
                        localKm === km ? "bg-black text-white scale-110 shadow-xl" : "bg-white text-black/50 hover:bg-black/5"
                      )}
                      style={localKm === km ? { backgroundColor: '#000', color: '#FFF' } : {}}
                    >
                      {km}K
                    </button>
                ))}
            </div>
        </div>

        <button onClick={detectLocation} className={cn("w-14 h-14 rounded-full flex items-center justify-center shadow-2xl pointer-events-auto active:scale-90 transition-all border border-black/5", userLatitude ? "bg-[#EB4898] text-white" : "bg-white text-black")}>
          <Navigation className="w-6 h-6" />
        </button>
      </div>

      {/* 🛸 FILTERS */}
      <div className="absolute top-1/2 -translate-y-1/2 right-4 z-[2000] flex flex-col items-center">
        <div className="p-4 rounded-[2.5rem] flex flex-col items-center gap-5 bg-white shadow-2xl pointer-events-auto backdrop-blur-2xl border border-black/5">
          {[
            { id: 'property', icon: Building2 }, { id: 'motorcycle', icon: MotorcycleIcon }, { id: 'bicycle', icon: Bike }, { id: 'services', icon: HardHat }, { id: 'roommate', icon: PersonStanding }
          ].map(cat => (
            <button key={cat.id} onClick={() => { triggerHaptic('light'); onCategoryChange?.(cat.id as any); }} className={cn("w-16 h-16 flex items-center justify-center rounded-[1.25rem] transition-all", category === cat.id ? "bg-[#EB4898] text-white scale-110 shadow-2xl" : "text-black/30 hover:bg-black/5")}>
              <cat.icon className="w-8 h-8" />
            </button>
          ))}
        </div>
      </div>

      {/* 🛸 THE MAP AREA: Full Visibility Fix */}
      <div 
        ref={mapContainerRef}
        className="flex-1 w-full h-full bg-slate-200 z-10"
        style={{ minHeight: '100dvh' }}
      />

      {/* 🛸 CTA: SCANNING */}
      <div className="absolute bottom-[calc(var(--bottom-nav-height,72px)+env(safe-area-inset-bottom,0px)+20px)] inset-x-0 z-[2000] flex justify-center px-10 pointer-events-none">
        <button 
          onClick={handleRefresh} 
          className="w-full max-w-[380px] h-18 rounded-[2rem] text-[14px] font-black uppercase tracking-[0.55em] bg-[#EB4898] text-white shadow-[0_45px_100px_rgba(235,72,152,0.6)] pointer-events-auto active:scale-95 transition-all flex items-center justify-center gap-4 border-none"
        >
          <RefreshCw className={cn("w-6 h-6", isRefreshing && "animate-spin")} /> SCANNING
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .leaflet-container { width: 100%; height: 100%; background: #f1f5f9; outline: none; }
        .leaflet-pane { z-index: 1 !important; }
        .leaflet-tile-pane { z-index: 2 !important; }
        .leaflet-marker-pane { z-index: 1000 !important; }
      `}} />
    </motion.div>
  );
});

DiscoveryMapView.displayName = 'DiscoveryMapView';
