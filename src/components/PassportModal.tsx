import { memo, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, MapPin, Navigation, Sparkles, Globe2, Search, Loader2, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { useModalStore } from '@/state/modalStore';
import { useFilterStore } from '@/state/filterStore';
import { appToast } from '@/utils/appNotification';
import useAppTheme from '@/hooks/useAppTheme';
import { canGeolocate, getCurrentPosition } from '@/utils/geolocation';
import { DEFAULT_CITY_PHOTO, getCityPhoto, PREMIUM_DESTINATIONS } from '@/data/cityPhotos';
import { prefetchCityPhotosImmediate } from '@/utils/prefetchCityPhotos';
import { searchCities } from '@/data/worldLocations';
import { isMapboxPlacesReady, searchMapboxPlaces, type GeocodeResult } from '@/utils/mapboxPlaces';
import {
  GENIE_ORIGIN_BOTTOM,
  GENIE_SHEET_EXIT,
  GENIE_SHEET_OPEN,
  GENIE_SHEET_VISIBLE,
  GENIE_SPRING_CLOSE,
  GENIE_SPRING_OPEN,
} from '@/utils/genieMotion';

function coordsNear(a: number | null, b: number, tolerance = 0.05): boolean {
  return a != null && Math.abs(a - b) < tolerance;
}

export const PassportModal = memo(() => {
  const { isLight } = useAppTheme();
  const isOpen = useModalStore(s => s.showPassportModal);
  const passportMapHandoff = useModalStore(s => s.passportMapHandoff);
  const setModal = useModalStore(s => s.setModal);
  const openPassportMap = useModalStore(s => s.openPassportMap);
  const setPassportLocation = useFilterStore(s => s.setPassportLocation);
  const setUserLocation = useFilterStore(s => s.setUserLocation);
  const setRadiusKm = useFilterStore(s => s.setRadiusKm);
  const currentLat = useFilterStore(s => s.userLatitude);
  const currentLng = useFilterStore(s => s.userLongitude);
  const passportMode = useFilterStore(s => s.passportMode);
  const passportLabel = useFilterStore(s => s.passportLabel);

  const [searchQuery, setSearchQuery] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [mapboxResults, setMapboxResults] = useState<GeocodeResult[]>([]);
  const [mapboxSearching, setMapboxSearching] = useState(false);

  const localResults = useMemo(
    () => (searchQuery.length >= 2 ? searchCities(searchQuery).slice(0, 8) : []),
    [searchQuery],
  );

  useEffect(() => {
    if (searchQuery.length < 2 || !isMapboxPlacesReady()) {
      setMapboxResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setMapboxSearching(true);
      const results = await searchMapboxPlaces(searchQuery, 6);
      setMapboxResults(results);
      setMapboxSearching(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const hasSearchResults = localResults.length > 0 || mapboxResults.length > 0;

  useEffect(() => {
    if (isOpen) prefetchCityPhotosImmediate();
  }, [isOpen]);

  const onClose = () => {
    triggerHaptic('light');
    setSearchQuery('');
    setModal('showPassportModal', false);
  };

  const handleTeleport = (label: string, lat: number, lng: number) => {
    triggerHaptic('heavy');
    setPassportLocation(lat, lng, label);
    setRadiusKm(20);
    setSearchQuery('');
    openPassportMap({ handoff: true });
    appToast.success(`Exploring ${label}`);
  };

  const openLiveMap = () => {
    triggerHaptic('medium');
    openPassportMap({ handoff: true });
  };

  const handleUseGPS = () => {
    if (!canGeolocate()) {
      appToast.error('Location not available on this device');
      return;
    }
    triggerHaptic('medium');
    setGpsLoading(true);
    openPassportMap({ handoff: true });
    void (async () => {
      try {
        const { latitude, longitude } = await getCurrentPosition({ timeout: 8000, maximumAge: 30000 });
        setUserLocation(latitude, longitude);
        setRadiusKm(20);
        appToast.success('Using your current location');
      } catch {
        appToast.error('Could not detect your location. Check permissions.');
      } finally {
        setGpsLoading(false);
      }
    })();
  };

  const isGpsActive = !passportMode && currentLat != null && currentLng != null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10020] flex flex-col justify-end pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            onClick={onClose}
            className={cn(
              'absolute inset-0 pointer-events-auto',
              isLight ? 'bg-black/25' : 'bg-black/55',
            )}
          />

          <motion.div
            initial={GENIE_SHEET_OPEN}
            animate={GENIE_SHEET_VISIBLE}
            exit={passportMapHandoff ? { opacity: 0, transition: { duration: 0 } } : { ...GENIE_SHEET_EXIT, transition: GENIE_SPRING_CLOSE }}
            transition={passportMapHandoff ? { duration: 0 } : GENIE_SPRING_OPEN}
            style={GENIE_ORIGIN_BOTTOM}
            className={cn(
              'w-full h-[96vh] rounded-t-3xl flex flex-col pointer-events-auto overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.35)] will-change-transform gpu-ultra',
              isLight ? 'bg-white' : 'bg-[#0A0A0A] border-t border-white/10',
            )}
          >
            <div className="p-6 pb-4 flex items-center justify-between relative z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Globe2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className={cn('text-xl font-black uppercase tracking-widest', isLight ? 'text-slate-900' : 'text-white')}>Global Passport</h2>
                  <p className={cn('text-[11px] font-bold uppercase tracking-widest mt-1', isLight ? 'text-slate-500' : 'text-white/40')}>
                    {passportMode && passportLabel ? `Exploring ${passportLabel}` : 'Search any city worldwide'}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className={cn('p-2 rounded-full transition-all active:scale-90', isLight ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-white/5 text-white/50 hover:bg-white/10')}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 pb-3 shrink-0">
              <div className="relative">
                <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', isLight ? 'text-slate-400' : 'text-white/40')} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cities, countries..."
                  autoComplete="off"
                  className={cn(
                    'w-full pl-10 pr-4 py-3 rounded-2xl text-sm font-medium outline-none transition-all border',
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20'
                      : 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20',
                  )}
                />
                {searchQuery.length > 0 && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={cn('absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full', isLight ? 'text-slate-400 hover:text-slate-600' : 'text-white/40 hover:text-white/70')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={openLiveMap}
                className={cn(
                  'w-full mt-3 py-3 rounded-2xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest border transition-all active:scale-[0.98]',
                  isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20',
                )}
              >
                <Map className="w-4 h-4" />
                Explore on Live Map
              </button>

              {searchQuery.length >= 2 && hasSearchResults && (
                <div className={cn(
                  'mt-2 rounded-2xl border overflow-hidden max-h-48 overflow-y-auto custom-scrollbar',
                  isLight ? 'bg-white border-slate-200 shadow-lg' : 'bg-[#111] border-white/10',
                )}>
                  {localResults.map(({ region, country, city }) => (
                    <button
                      key={`${region}-${country}-${city.name}`}
                      onClick={() => handleTeleport(`${city.name}, ${country}`, city.coordinates.lat, city.coordinates.lng)}
                      className={cn(
                        'w-full text-left px-4 py-3 flex items-center justify-between transition-colors border-b last:border-b-0',
                        isLight ? 'hover:bg-slate-50 border-slate-100' : 'hover:bg-white/5 border-white/5',
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 ring-1 ring-black/10">
                          <img
                            src={getCityPhoto(city.name, city.coordinates)}
                            alt=""
                            loading="eager"
                            decoding="async"
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.src = DEFAULT_CITY_PHOTO; }}
                          />
                        </div>
                        <span className={cn('text-sm font-bold truncate', isLight ? 'text-slate-900' : 'text-white')}>{city.name}</span>
                      </div>
                      <span className={cn('text-[10px] font-bold uppercase tracking-wider shrink-0 ml-2', isLight ? 'text-slate-400' : 'text-white/40')}>{country}</span>
                    </button>
                  ))}
                  {mapboxResults.map((place) => (
                    <button
                      key={place.label}
                      onClick={() => handleTeleport(place.label, place.lat, place.lng)}
                      className={cn(
                        'w-full text-left px-4 py-3 flex items-center justify-between transition-colors border-b last:border-b-0',
                        isLight ? 'hover:bg-slate-50 border-slate-100' : 'hover:bg-white/5 border-white/5',
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Globe2 className={cn('w-3.5 h-3.5 shrink-0', isLight ? 'text-purple-500' : 'text-purple-400')} />
                        <span className={cn('text-sm font-bold truncate', isLight ? 'text-slate-900' : 'text-white')}>{place.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && !hasSearchResults && (
                <p className={cn('mt-2 text-center text-xs font-medium py-2', isLight ? 'text-slate-400' : 'text-white/40')}>
                  {mapboxSearching ? 'Searching worldwide...' : 'No cities found — try Live Map'}
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pt-0 pb-6">
              <button
                onClick={handleUseGPS}
                disabled={gpsLoading}
                className={cn(
                  'w-full mb-5 p-4 rounded-2xl flex items-center justify-between transition-all border group active:scale-[0.98]',
                  isLight ? 'bg-slate-50 border-slate-200 hover:border-slate-300' : 'bg-white/5 border-white/10 hover:border-white/20',
                  isGpsActive && (isLight ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-indigo-500 ring-2 ring-indigo-500/40'),
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', isLight ? 'bg-indigo-100' : 'bg-indigo-500/20')}>
                    {gpsLoading
                      ? <Loader2 className={cn('w-4 h-4 animate-spin', isLight ? 'text-indigo-600' : 'text-indigo-400')} />
                      : <Navigation className={cn('w-4 h-4', isLight ? 'text-indigo-600' : 'text-indigo-400')} />
                    }
                  </div>
                  <div className="text-left">
                    <div className={cn('text-sm font-black uppercase tracking-widest', isLight ? 'text-slate-900' : 'text-white')}>Current Location</div>
                    <div className={cn('text-[10px] font-bold uppercase tracking-wider', isLight ? 'text-slate-500' : 'text-white/40')}>Use device GPS</div>
                  </div>
                </div>
                {isGpsActive && <Sparkles className="w-4 h-4 text-indigo-500" />}
              </button>

              {searchQuery.length < 2 && (
                <>
                  <p className={cn('text-[10px] font-black uppercase tracking-[0.2em] mb-3', isLight ? 'text-slate-400' : 'text-white/30')}>Popular Destinations</p>
                  <div className="grid grid-cols-3 gap-2">
                    {PREMIUM_DESTINATIONS.map((dest) => {
                      const isActive = passportMode && coordsNear(currentLat, dest.lat) && coordsNear(currentLng, dest.lng);
                      return (
                        <button
                          key={dest.name}
                          onClick={() => handleTeleport(`${dest.name}, ${dest.country}`, dest.lat, dest.lng)}
                          className="relative group rounded-xl overflow-hidden aspect-[3/4] shadow-md active:scale-95 transition-transform"
                        >
                          <img
                            src={dest.img}
                            alt={dest.name}
                            loading="eager"
                            decoding="async"
                            fetchPriority="high"
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.src = DEFAULT_CITY_PHOTO; }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/90" />

                          {isActive && (
                            <div className="absolute top-2 right-2 px-2 py-1 bg-white/20 backdrop-blur-md rounded-lg border border-white/30 flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                              <span className="text-[9px] font-black uppercase tracking-widest text-white shadow-sm">Active</span>
                            </div>
                          )}

                          <div className="absolute bottom-0 left-0 right-0 p-2 text-left">
                            <h3 className="text-sm font-black text-white leading-tight shadow-sm">{dest.name}</h3>
                            <div className="flex items-center gap-0.5 mt-0.5">
                              <MapPin className="w-2.5 h-2.5 text-white/70" />
                              <span className="text-[9px] font-bold uppercase tracking-widest text-white/80">{dest.country}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});
PassportModal.displayName = 'PassportModal';