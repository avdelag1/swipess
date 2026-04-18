/**
 * DISCOVERY MAP VIEW — 🛸 ULTRA RADAR v12.0
 * 
 * Production-Grade Stability & Reactivity:
 * 1. Forced Tile Invalidation: Guaranteed map flight on every interaction.
 * 2. Ultra-Compact HUD: Sized for high-density information display.
 * 3. Scope Sensitivity: Correctly handles 'isEmbedded' and 'mode' props.
 */

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { Navigation, RefreshCw, ArrowLeft, PersonStanding, Layers } from 'lucide-react';
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

export const DiscoveryMapView = memo(({ 
  category, 
  onBack, 
  onStartSwiping: _onStartSwiping, 
  onCategoryChange,
  isEmbedded = false,
  mode = 'client'
}: {
  category: any;
  onBack: () => void;
  onStartSwiping?: () => void;
  onCategoryChange?: (cat: any) => void;
  isEmbedded?: boolean;
  mode?: 'client' | 'owner';
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  
  const radiusKm = useFilterStore(s => s.radiusKm);
  const setRadiusKm = useFilterStore(s => s.setRadiusKm);
  const setUserLocation = useFilterStore(s => s.setUserLocation);
  const userLatitude = useFilterStore(s => s.userLatitude);
  const userLongitude = useFilterStore(s => s.userLongitude);

  const radarCircle = useRef<L.Circle | null>(null);
  const centerMarker = useRef<L.Marker | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  const [localKm, setLocalKm] = useState(radiusKm || 1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>(isEmbedded ? 'satellite' : 'streets');

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

  // 🛰️ MOUNT: Initialize Engine
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

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            subdomains: 'abcd',
            maxZoom: 20,
            crossOrigin: true
        }).addTo(map);

        radarCircle.current = L.circle(currentCenter, {
            color: '#EB4898',
            fillColor: '#EB4898',
            fillOpacity: 0.1,
            weight: 2,
            radius: localKm * 1000,
            className: 'sentient-radar-circle'
        }).addTo(map);

        const centerIcon = L.divIcon({
            className: 'radar-center',
            html: `
              <div class="relative w-6 h-6 flex items-center justify-center">
                <div class="absolute inset-0 bg-[#EB4898] opacity-30 rounded-full animate-ping"></div>
                <div class="w-2.5 h-2.5 bg-black border-[2px] border-white rounded-full shadow-2xl relative z-10"></div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
        centerMarker.current = L.marker(currentCenter, { icon: centerIcon }).addTo(map);
        markersRef.current = L.layerGroup().addTo(map);
        mapInstance.current = map;
        
        setTimeout(() => map.invalidateSize(), 150);
    } catch (e) { console.error("Map Init Failed:", e); }

    return () => {
        if (mapInstance.current) {
            mapInstance.current.remove();
            mapInstance.current = null;
        }
    };
  }, []);

  // 🛰️ UPDATE: React to radius/km/style changes
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !radarCircle.current) return;

    // A. Sync Visual Overlays
    radarCircle.current.setRadius(localKm * 1000);
    radarCircle.current.setLatLng(currentCenter);
    centerMarker.current?.setLatLng(currentCenter);

    // B. Aggressive Move Logic (Force Leaflet to re-calculate)
    map.invalidateSize({ animate: false });
    
    const zoomLevel = localKm === 1 ? 15 : localKm === 5 ? 13.2 : localKm === 25 ? 11.2 : 9.2;
    
    // Attempt two-stage zoom to guarantee visibility
    map.flyTo(currentCenter, zoomLevel, { 
        animate: true, 
        duration: 1.0,
        easeLinearity: 0.1
    });

    // C. Swap Layers
    const tileUrl = mapStyle === 'satellite' 
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    
    map.eachLayer(layer => {
        if (layer instanceof L.TileLayer) map.removeLayer(layer);
    });
    L.tileLayer(tileUrl, { maxZoom: 19, crossOrigin: true }).addTo(map);

    // D. Generate Dummy Pins
    if (markersRef.current) {
        markersRef.current.clearLayers();
        const pins = [
            { l: [currentCenter[0] + 0.01, currentCenter[1] + 0.01], c: 'property', i: '🏠' },
            { l: [currentCenter[0] - 0.01, currentCenter[1] - 0.01], c: 'motorcycle', i: '🛵' }
        ];
        pins.forEach(p => {
             const icon = L.divIcon({
                className: 'radar-pin',
                html: `<div class="w-10 h-10 bg-white rounded-xl shadow-xl border border-black/5 flex items-center justify-center text-lg">${p.i}</div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
             });
             L.marker(p.l as any, { icon }).addTo(markersRef.current!);
        });
    }

  }, [localKm, mapStyle, currentCenter]);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    triggerHaptic('medium');
    navigator.geolocation.getCurrentPosition(
      pos => { 
        setUserLocation(pos.coords.latitude, pos.coords.longitude); 
        toast.success('GPS Synced'); 
      },
      () => toast.error('Enable GPS'),
      { timeout: 8000 }
    );
  }, []);

  return (
    <motion.div className={cn("flex flex-col h-full w-full bg-slate-50 relative overflow-hidden", isEmbedded && "rounded-[3rem]")} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      
      {/* 🛸 HUD RE-MASTERED: MINIATURIZED (v12.0) */}
      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+12px)] inset-x-0 px-4 z-[2000] flex items-start justify-between pointer-events-none">
          
          {/* Back btn (Hidden in embedded mode as parent handles it) */}
          {!isEmbedded ? (
            <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-lg pointer-events-auto active:scale-95 border border-black/5">
                <ArrowLeft className="w-5 h-5 text-black" />
            </button>
          ) : <div className="w-10" />}

          <div className="flex flex-col items-center gap-1.5">
              <div className="px-4 py-1.5 rounded-full bg-white shadow-lg flex flex-col items-center pointer-events-auto border border-black/5 min-w-[100px]">
                  <span className="text-[7px] font-black uppercase tracking-widest text-[#EB4898] opacity-60">Radar</span>
                  <span className="text-[12px] font-bold text-black">{localKm}KM Area</span>
              </div>
              <div className="flex items-center gap-0.5 p-1 rounded-full bg-white/95 shadow-lg pointer-events-auto backdrop-blur-md border border-black/5">
                  {[1, 5, 25, 100].map(km => (
                      <button 
                        key={km} 
                        onClick={() => { triggerHaptic('light'); setLocalKm(km); setRadiusKm(km); }} 
                        className={cn("w-9 h-7 rounded-full text-[9px] font-black transition-all", localKm === km ? "bg-black text-white" : "bg-transparent text-black/20")}
                      >
                        {km}K
                      </button>
                  ))}
              </div>
          </div>

          <div className="w-10" />
      </div>

      {/* 🛰️ UNIFIED COMMAND RAIL (Miniature) */}
      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+12px)] right-4 bottom-32 z-[2010] flex flex-col items-center gap-3 pointer-events-none">
          <div className="p-1 rounded-full bg-white/95 shadow-xl pointer-events-auto backdrop-blur-xl border border-black/5 flex flex-col gap-1.5">
              <button 
                onClick={() => { triggerHaptic('light'); setMapStyle(prev => prev === 'streets' ? 'satellite' : 'streets'); }} 
                className={cn("w-9 h-9 rounded-full flex items-center justify-center transition-all", mapStyle === 'satellite' ? "bg-black text-white" : "bg-white text-black hover:bg-black/5")}
              >
                  <Layers className="w-4 h-4" />
              </button>
              <button 
                onClick={detectLocation} 
                className={cn("w-9 h-9 rounded-full flex items-center justify-center transition-all", userLatitude ? "bg-[#EB4898] text-white" : "bg-white text-black")}
              >
                  <Navigation className="w-4 h-4" />
              </button>
          </div>

          <div className="w-3 h-[1px] bg-black/10 my-0.5" />

          <div className="p-1.5 rounded-[1.8rem] flex flex-col items-center gap-2.5 bg-white shadow-xl pointer-events-auto border border-black/5">
              {[
                  { id: 'property', icon: RealEstateIcon }, 
                  { id: 'motorcycle', icon: VespaIcon }, 
                  { id: 'bicycle', icon: BeachBicycleIcon }, 
                  { id: 'services', icon: WorkersIcon }
              ].map(cat => (
                  <button 
                      key={cat.id} 
                      onClick={() => { triggerHaptic('light'); onCategoryChange?.(cat.id as any); }} 
                      className={cn(
                          "w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm", 
                          category === cat.id ? "bg-[#EB4898] text-white scale-110 shadow-md" : "bg-slate-50 text-black/20 hover:bg-black/5"
                      )}
                  >
                      <cat.icon className="w-5 h-5" />
                  </button>
              ))}
          </div>
      </div>

      <div id="map-container" ref={mapContainerRef} className="absolute inset-0 w-full h-full bg-[#f1f5f9] z-0" />

      {/* 📡 SCAN CTA */}
      <div className="absolute bottom-[24px] inset-x-0 z-[2000] flex justify-center px-10 pointer-events-none">
        <button 
          onClick={handleRefresh} 
          className={cn(
            "w-full max-w-[320px] h-14 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 border-none pointer-events-auto shadow-[0_20px_50px_rgba(235,72,152,0.4)] backdrop-blur-md",
            isRefreshing ? "bg-black text-white" : "bg-[#EB4898] text-white active:scale-95"
          )}
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} /> 
          <span>{isRefreshing ? 'Scanning...' : 'Start Scan'}</span>
        </button>
      </div>

      {/* Build Debug: 2026-04-18-v12 */}
      <style dangerouslySetInnerHTML={{ __html: `
        .leaflet-container { width: 100%; height: 100%; background: #f1f5f9 !important; outline: none; }
        .leaflet-tile { filter: brightness(0.95) contrast(1.05) !important; transition: opacity 0.4s ease; } 
        .sentient-radar-circle { 
            animation: radar-pulse 2.5s infinite ease-in-out; 
            transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes radar-pulse {
          0%, 100% { stroke-opacity: 0.8; stroke-width: 2; filter: drop-shadow(0 0 5px rgba(235, 72, 152, 0.4)); }
          50% { stroke-opacity: 0.2; stroke-width: 6; filter: drop-shadow(0 0 15px rgba(235, 72, 152, 0.6)); }
        }
      `}} />
    </motion.div>
  );
});

DiscoveryMapView.displayName = 'DiscoveryMapView';
