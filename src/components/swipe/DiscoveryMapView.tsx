import React from 'react';

// 🛸 MAP CLEAN SLATE — ALL MAPS PURGED AS REQUESTED
export const DiscoveryMapView = () => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black/90 text-white/40">
            <div className="animate-pulse flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-4 border-white/10 mb-6" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] italic">Map Engine Offline</p>
                <p className="text-[8px] font-bold uppercase tracking-widest mt-2 opacity-40">Awaiting New Architecture Instructions</p>
            </div>
        </div>
    );
};

export default DiscoveryMapView;
