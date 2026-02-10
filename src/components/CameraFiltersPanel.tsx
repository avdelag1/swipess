import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  X,
  Sparkles,
  User,
  Moon,
  Sun,
  Palette,
} from 'lucide-react';
import {
  FilterType,
  CAMERA_FILTERS,
  PortraitModeConfig,
  DEFAULT_PORTRAIT_CONFIG,
  NightModeConfig,
  DEFAULT_NIGHT_CONFIG,
} from '@/utils/cameraFilters';

interface CameraFiltersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  portraitConfig: PortraitModeConfig;
  onPortraitConfigChange: (config: PortraitModeConfig) => void;
  nightConfig: NightModeConfig;
  onNightConfigChange: (config: NightModeConfig) => void;
  previewImageUrl?: string;
}

type EffectsTab = 'filters' | 'portrait' | 'night';

export function CameraFiltersPanel({
  isOpen,
  onClose,
  selectedFilter,
  onFilterChange,
  portraitConfig,
  onPortraitConfigChange,
  nightConfig,
  onNightConfigChange,
  previewImageUrl,
}: CameraFiltersPanelProps) {
  const [activeTab, setActiveTab] = useState<EffectsTab>('filters');

  const tabs: { key: EffectsTab; label: string; icon: React.ReactNode }[] = [
    { key: 'filters', label: 'Filters', icon: <Palette className="w-4 h-4" /> },
    { key: 'portrait', label: 'Portrait', icon: <User className="w-4 h-4" /> },
    { key: 'night', label: 'Night', icon: <Moon className="w-4 h-4" /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl z-50 max-h-[70vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-white" />
                <h3 className="text-lg font-semibold text-white">Effects</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Tab Selector */}
            <div className="flex items-center justify-center gap-2 py-3 border-b border-white/10">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? 'bg-white/20 text-white'
                      : 'text-white/50 hover:text-white/70'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(70vh-150px)] pb-safe">
              <AnimatePresence mode="wait">
                {/* Filters Tab */}
                {activeTab === 'filters' && (
                  <motion.div
                    key="filters"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4"
                  >
                    <div className="grid grid-cols-3 gap-3">
                      {(Object.entries(CAMERA_FILTERS) as [FilterType, typeof CAMERA_FILTERS[FilterType]][]).map(([key, config]) => (
                        <motion.button
                          key={key}
                          onClick={() => onFilterChange(key)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`relative flex flex-col items-center gap-2 p-2.5 rounded-2xl transition-all ${
                            selectedFilter === key
                              ? 'bg-gradient-to-br from-red-500/30 to-orange-500/20 ring-2 ring-red-500 shadow-lg shadow-red-500/20'
                              : 'bg-white/5 hover:bg-white/10 shadow-md'
                          }`}
                        >
                          {/* Filter preview with better styling */}
                          <div className={`relative w-full aspect-square rounded-xl overflow-hidden ${
                            selectedFilter === key
                              ? 'ring-2 ring-white/30 shadow-xl'
                              : 'shadow-md'
                          }`}>
                            {previewImageUrl ? (
                              <img
                                src={previewImageUrl}
                                alt={config.name}
                                className="w-full h-full object-cover"
                                style={{ filter: config.cssFilter }}
                              />
                            ) : (
                              <div
                                className="w-full h-full bg-gradient-to-br from-red-400 via-pink-500 to-orange-500"
                                style={{ filter: config.cssFilter }}
                              />
                            )}
                            {/* Selected indicator */}
                            {selectedFilter === key && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                                className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
                              >
                                <svg
                                  className="w-4 h-4 text-white"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="3"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path d="M5 13l4 4L19 7" />
                                </svg>
                              </motion.div>
                            )}
                          </div>
                          {/* Filter name with better typography */}
                          <span className={`text-xs font-semibold tracking-wide ${
                            selectedFilter === key ? 'text-red-400' : 'text-white/80'
                          }`}>
                            {config.name}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Portrait Tab */}
                {activeTab === 'portrait' && (
                  <motion.div
                    key="portrait"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-6 space-y-6"
                  >
                    {/* Portrait Mode Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">Portrait Mode</h4>
                          <p className="text-white/50 text-sm">Blur background effect</p>
                        </div>
                      </div>
                      <button
                        onClick={() => onPortraitConfigChange({
                          ...portraitConfig,
                          enabled: !portraitConfig.enabled,
                        })}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          portraitConfig.enabled
                            ? 'bg-red-500 text-white'
                            : 'bg-white/10 text-white/70'
                        }`}
                      >
                        {portraitConfig.enabled ? 'On' : 'Off'}
                      </button>
                    </div>

                    {/* Blur Intensity Slider */}
                    <div className={`space-y-3 transition-opacity ${
                      portraitConfig.enabled ? 'opacity-100' : 'opacity-40'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="text-white/80 text-sm">Blur Intensity</span>
                        <span className="text-white font-medium text-sm">
                          {portraitConfig.blurIntensity}%
                        </span>
                      </div>
                      <Slider
                        value={[portraitConfig.blurIntensity]}
                        min={0}
                        max={100}
                        step={5}
                        disabled={!portraitConfig.enabled}
                        onValueChange={([value]) => onPortraitConfigChange({
                          ...portraitConfig,
                          blurIntensity: value,
                        })}
                        className="w-full"
                      />
                    </div>

                    {/* Focus Area Slider */}
                    <div className={`space-y-3 transition-opacity ${
                      portraitConfig.enabled ? 'opacity-100' : 'opacity-40'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="text-white/80 text-sm">Focus Area</span>
                        <span className="text-white font-medium text-sm">
                          {portraitConfig.focusAreaSize}%
                        </span>
                      </div>
                      <Slider
                        value={[portraitConfig.focusAreaSize]}
                        min={30}
                        max={90}
                        step={5}
                        disabled={!portraitConfig.enabled}
                        onValueChange={([value]) => onPortraitConfigChange({
                          ...portraitConfig,
                          focusAreaSize: value,
                        })}
                        className="w-full"
                      />
                    </div>

                    <p className="text-white/40 text-xs text-center">
                      Portrait mode simulates depth-of-field blur for professional-looking photos
                    </p>
                  </motion.div>
                )}

                {/* Night Tab */}
                {activeTab === 'night' && (
                  <motion.div
                    key="night"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-6 space-y-6"
                  >
                    {/* Night Mode Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          <Moon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">Night Mode</h4>
                          <p className="text-white/50 text-sm">Enhanced low-light photos</p>
                        </div>
                      </div>
                      <button
                        onClick={() => onNightConfigChange({
                          ...nightConfig,
                          enabled: !nightConfig.enabled,
                        })}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          nightConfig.enabled
                            ? 'bg-indigo-500 text-white'
                            : 'bg-white/10 text-white/70'
                        }`}
                      >
                        {nightConfig.enabled ? 'On' : 'Off'}
                      </button>
                    </div>

                    {/* Brightness Boost Slider */}
                    <div className={`space-y-3 transition-opacity ${
                      nightConfig.enabled ? 'opacity-100' : 'opacity-40'
                    }`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Sun className="w-4 h-4 text-white/60" />
                          <span className="text-white/80 text-sm">Brightness Boost</span>
                        </div>
                        <span className="text-white font-medium text-sm">
                          {nightConfig.brightnessBoost}%
                        </span>
                      </div>
                      <Slider
                        value={[nightConfig.brightnessBoost]}
                        min={0}
                        max={100}
                        step={5}
                        disabled={!nightConfig.enabled}
                        onValueChange={([value]) => onNightConfigChange({
                          ...nightConfig,
                          brightnessBoost: value,
                        })}
                        className="w-full"
                      />
                    </div>

                    {/* Noise Reduction Slider */}
                    <div className={`space-y-3 transition-opacity ${
                      nightConfig.enabled ? 'opacity-100' : 'opacity-40'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="text-white/80 text-sm">Noise Reduction</span>
                        <span className="text-white font-medium text-sm">
                          {nightConfig.noiseReduction}%
                        </span>
                      </div>
                      <Slider
                        value={[nightConfig.noiseReduction]}
                        min={0}
                        max={100}
                        step={5}
                        disabled={!nightConfig.enabled}
                        onValueChange={([value]) => onNightConfigChange({
                          ...nightConfig,
                          noiseReduction: value,
                        })}
                        className="w-full"
                      />
                    </div>

                    <p className="text-white/40 text-xs text-center">
                      Night mode enhances visibility in low-light conditions
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CameraFiltersPanel;
