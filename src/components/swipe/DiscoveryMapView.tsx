import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useDiscoveryStore } from '@/store/useDiscoveryStore';
import { motion } from 'framer-motion';

// 🗝️ OFFICIAL MAPBOX ASSETS
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const MAPBOX_STYLE = 'mapbox/dark-v11';
const TILE_URL = `https://api.mapbox.com/styles/v1/${MAPBOX_STYLE}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`;

// 📍 CUSTOM NEXUS MARKER
const createCustomIcon = (color: string) => L.divIcon({
  className: 'nexus-marker',
  html: `
    <div style="
      width: 20px; 
      height: 20px; 
      border-radius: 50%; 
      background: ${color}; 
      border: 3px solid white;
      box-shadow: 0 0 15px ${color}80;
      animation: pulse 2s infinite;
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Helper component to sync map center
const MapController = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13, { duration: 1.5 });
  }, [center, map]);
  return null;
};

/**
 * 🛰️ GLOBAL DISCOVERY RADAR (WEB)
 * High-performance Leaflet implementation using Mapbox tiles and Nexus aesthetics.
 */
export const DiscoveryMapView = () => {
  const { userLocation, radiusKm, filteredListings, dashboardMode } = useDiscoveryStore();
  
  const defaultCenter: [number, number] = [20.2114, -87.4654]; // Tulum Default
  const mapCenter: [number, number] = userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter;

  const accentColor = dashboardMode === 'client' ? '#EB4898' : '#3b82f6';

  return (
    <motion.div 
      className="w-full h-full relative overflow-hidden flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <MapContainer 
        center={mapCenter} 
        zoom={13} 
        scrollWheelZoom={true}
        className="w-full h-full z-0 font-sans"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.mapbox.com/">Mapbox</a>'
          url={TILE_URL}
          tileSize={512}
          zoomOffset={-1}
        />

        <MapController center={mapCenter} />

        {/* 🆘 USER NEXUS CORE */}
        <CircleMarker
          center={mapCenter}
          radius={12}
          pathOptions={{ 
            fillColor: accentColor, 
            fillOpacity: 0.8, 
            color: 'white', 
            weight: 3 
          }}
        >
          <Popup>Your current location</Popup>
        </CircleMarker>

        {/* 🎯 RADAR RADIUS FIELD */}
        <CircleMarker
          center={mapCenter}
          radius={radiusKm * 100} // Approximate visualization
          pathOptions={{ 
            fillColor: accentColor, 
            fillOpacity: 0.05, 
            color: accentColor, 
            dashArray: '10, 10',
            weight: 2 
          }}
        />

        {/* 📍 DISCOVERY NODES (Listings/Clients) */}
        {filteredListings.map((item) => (
          <Marker 
            key={item.id} 
            position={[item.lat, item.lng]}
            icon={createCustomIcon(accentColor)}
          >
            <Popup className="nexus-popup">
              <div className="p-2 min-w-[120px]">
                <img 
                  src={item.images?.[0] || 'https://via.placeholder.com/150'} 
                  className="w-full h-24 object-cover rounded-xl mb-3 border border-white/10" 
                  alt={item.title}
                />
                <p className="text-white font-black uppercase text-[10px] tracking-widest">{item.title}</p>
                <p className="text-primary text-[9px] font-bold mt-1 italic">${item.price}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* 🧭 HUD OVERLAYS */}
      <div className="absolute top-6 left-6 z-10">
         <div className="bg-black/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl shadow-2xl">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
               Radar: <span className="text-white">{filteredListings.length} Nodes Found</span>
            </span>
         </div>
      </div>

      <style>{`
        .leaflet-container {
          background: #000 !important;
        }
        .nexus-popup .leaflet-popup-content-wrapper {
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          color: white;
          padding: 8px;
        }
        .nexus-popup .leaflet-popup-tip {
          background: rgba(0, 0, 0, 0.9);
        }
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(235, 72, 152, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(235, 72, 152, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(235, 72, 152, 0); }
        }
      `}</style>
    </motion.div>
  );
};

export default DiscoveryMapView;
