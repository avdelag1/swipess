// @ts-nocheck
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Radio, MapPin, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRadio } from '@/contexts/RadioContext';
import { getStationsByCity } from '@/data/radioStations';
import { cn } from '@/lib/utils';
import type { CityLocation } from '@/types/radio';

const CITIES: { id: CityLocation; label: string; emoji: string }[] = [
  { id: 'tulum', label: 'Tulum', emoji: '🏖️' },
  { id: 'playa-del-carmen', label: 'Playa del Carmen', emoji: '🌴' },
  { id: 'cancun', label: 'Cancún', emoji: '🌊' },
  { id: 'merida', label: 'Mérida', emoji: '🏛️' },
  { id: 'chetumal', label: 'Chetumal', emoji: '🗺️' },
];

interface StationCascadeProps {
  isOpen: boolean;
  onClose: () => void;
  onStationSelect?: (stationId: string) => void;
}

export function StationCascade({ isOpen, onClose, onStationSelect }: StationCascadeProps) {
  const { state, changeStation, setCity, play, togglePlayPause } = useRadio();
  const [expandedCity, setExpandedCity] = useState<CityLocation | null>(state.currentCity);
  const [hoveredStation, setHoveredStation] = useState<string | null>(null);

  const stations = getStationsByCity(state.currentCity);

  const handleCityChange = useCallback((city: CityLocation) => {
    setCity(city);
    setExpandedCity(city);
  }, [setCity]);

  const handleStationSelect = useCallback((stationId: string) => {
    if (onStationSelect) {
      onStationSelect(stationId);
    } else {
      const station = stations.find(s => s.id === stationId);
      if (station) {
        play(station);
      }
    }
    onClose();
  }, [stations, play, onStationSelect, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10001]"
            onClick={onClose}
          />

          {/* Cascade Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-[#1C1C1E] rounded-t-3xl z-[10002] max-h-[80vh] overflow-hidden"
            style={{
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
            }}
          >
            {/* Handle Bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-4 pb-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-orange-500" />
                  <h2 className="text-white font-semibold">Select Station</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white/60 hover:text-white"
                >
                  Close
                </Button>
              </div>

              {/* City Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {CITIES.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => handleCityChange(city.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all",
                      state.currentCity === city.id
                        ? "bg-orange-500 text-white"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    )}
                  >
                    <span>{city.emoji}</span>
                    <span>{city.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stations List */}
            <div className="overflow-y-auto max-h-[50vh] p-4 space-y-3">
              {stations.map((station, index) => (
                <motion.div
                  key={station.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <button
                    onClick={() => handleStationSelect(station.id)}
                    onMouseEnter={() => setHoveredStation(station.id)}
                    onMouseLeave={() => setHoveredStation(null)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                      state.currentStation?.id === station.id
                        ? "bg-orange-500/20 border border-orange-500/50"
                        : "bg-white/5 border border-transparent hover:bg-white/10"
                    )}
                  >
                    {/* Station Logo/Icon */}
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                      state.currentStation?.id === station.id
                        ? "bg-orange-500"
                        : "bg-white/10"
                    )}>
                      {station.logo ? (
                        <img src={station.logo} alt={station.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <Radio className={cn(
                          "w-6 h-6",
                          state.currentStation?.id === station.id ? "text-white" : "text-white/60"
                        )} />
                      )}
                    </div>

                    {/* Station Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={cn(
                          "font-medium truncate",
                          state.currentStation?.id === station.id ? "text-orange-400" : "text-white"
                        )}>
                          {station.name}
                        </h3>
                        {state.currentStation?.id === station.id && (
                          <span className="flex-shrink-0 px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">
                            Playing
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-white/50">
                        <span>{station.genre}</span>
                        <span>•</span>
                        <span>{station.bitrate}kbps</span>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-1">
                      {state.currentStation?.id === station.id ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlayPause();
                          }}
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                            state.isPlaying
                              ? "bg-orange-500 text-white"
                              : "bg-white/10 text-white/70"
                          )}
                        >
                          {state.isPlaying ? (
                            <div className="flex gap-0.5 items-end h-4">
                              <motion.div
                                className="w-1 bg-white rounded-full"
                                animate={{ height: ['40%', '100%', '40%'] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                              />
                              <motion.div
                                className="w-1 bg-white rounded-full"
                                animate={{ height: ['100%', '40%', '100%'] }}
                                transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
                              />
                              <motion.div
                                className="w-1 bg-white rounded-full"
                                animate={{ height: ['60%', '100%', '60%'] }}
                                transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
                              />
                            </div>
                          ) : (
                            <ChevronUp className="w-5 h-5" />
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStationSelect(station.id);
                          }}
                          className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center"
                        >
                          <ChevronUp className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Footer with current station info */}
            {state.currentStation && (
              <div className="p-4 border-t border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-4 h-4 text-orange-500" />
                  <div className="flex-1">
                    <p className="text-sm text-white/70">
                      Now playing: <span className="text-white font-medium">{state.currentStation.name}</span>
                    </p>
                    <p className="text-xs text-white/50">{state.currentStation.genre} • {state.currentCity}</p>
                  </div>
                  <div className="text-xs text-orange-500">
                    {state.isPlaying ? '🔴 Live' : '⏸️ Paused'}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Mini station selector button for placement anywhere
export function StationSelectorButton({ className }: { className?: string }) {
  const { state } = useRadio();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all",
          className
        )}
      >
        <Radio className="w-4 h-4 text-orange-500" />
        <span className="text-sm text-white font-medium truncate max-w-[100px]">
          {state.currentStation?.name || 'Select Station'}
        </span>
        <ChevronDown className="w-4 h-4 text-white/50" />
      </button>

      <StationCascade isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
