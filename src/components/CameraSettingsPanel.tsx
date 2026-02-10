import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  X,
  Settings2,
  ImagePlus,
  Ratio,
  Sparkles,
  Focus,
  Smartphone,
  MapPin,
  FlipHorizontal,
} from 'lucide-react';
import {
  CameraSettings,
  DEFAULT_CAMERA_SETTINGS,
  QUALITY_SETTINGS,
} from '@/utils/cameraFilters';

interface CameraSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CameraSettings;
  onSettingsChange: (settings: CameraSettings) => void;
}

const QUALITY_OPTIONS: { value: CameraSettings['quality']; label: string; description: string }[] = [
  { value: 'low', label: 'Low', description: '800x600 • Fastest' },
  { value: 'medium', label: 'Medium', description: '1280x960 • Balanced' },
  { value: 'high', label: 'High', description: '1920x1440 • Recommended' },
  { value: 'ultra', label: 'Ultra', description: '2560x1920 • Best quality' },
];

const ASPECT_RATIO_OPTIONS: { value: CameraSettings['aspectRatio']; label: string }[] = [
  { value: '1:1', label: 'Square 1:1' },
  { value: '4:3', label: 'Standard 4:3' },
  { value: '16:9', label: 'Wide 16:9' },
  { value: '3:2', label: 'Photo 3:2' },
];

export function CameraSettingsPanel({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}: CameraSettingsPanelProps) {
  const updateSetting = <K extends keyof CameraSettings>(
    key: K,
    value: CameraSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

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
            className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl z-50 max-h-[80vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Settings2 className="w-5 h-5 text-white" />
                <h3 className="text-lg font-semibold text-white">Camera Settings</h3>
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

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(80vh-100px)] pb-safe">
              {/* Quality Section */}
              <div className="px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <ImagePlus className="w-4 h-4 text-white/60" />
                  <Label className="text-white/80 text-sm font-medium">Photo Quality</Label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {QUALITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateSetting('quality', option.value)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        settings.quality === option.value
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <span className={`text-sm font-medium ${
                        settings.quality === option.value ? 'text-red-400' : 'text-white'
                      }`}>
                        {option.label}
                      </span>
                      <p className="text-xs text-white/50 mt-0.5">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio Section */}
              <div className="px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Ratio className="w-4 h-4 text-white/60" />
                  <Label className="text-white/80 text-sm font-medium">Aspect Ratio</Label>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {ASPECT_RATIO_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateSetting('aspectRatio', option.value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        settings.aspectRatio === option.value
                          ? 'bg-red-500 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle Options */}
              <div className="px-6 py-4 space-y-4">
                {/* HDR */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <Label className="text-white text-sm font-medium">HDR</Label>
                      <p className="text-xs text-white/50">Enhanced dynamic range</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.hdr}
                    onCheckedChange={(checked) => updateSetting('hdr', checked)}
                  />
                </div>

                {/* Auto Focus */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Focus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <Label className="text-white text-sm font-medium">Auto Focus</Label>
                      <p className="text-xs text-white/50">Automatic focus adjustment</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.autoFocus}
                    onCheckedChange={(checked) => updateSetting('autoFocus', checked)}
                  />
                </div>

                {/* Stabilization */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <Label className="text-white text-sm font-medium">Stabilization</Label>
                      <p className="text-xs text-white/50">Reduce camera shake</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.stabilization}
                    onCheckedChange={(checked) => updateSetting('stabilization', checked)}
                  />
                </div>

                {/* Mirror Front Camera */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <FlipHorizontal className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <Label className="text-white text-sm font-medium">Mirror Front Camera</Label>
                      <p className="text-xs text-white/50">Flip selfie preview</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.mirror}
                    onCheckedChange={(checked) => updateSetting('mirror', checked)}
                  />
                </div>

                {/* Location */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <Label className="text-white text-sm font-medium">Save Location</Label>
                      <p className="text-xs text-white/50">Add location to photos</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.location}
                    onCheckedChange={(checked) => updateSetting('location', checked)}
                  />
                </div>
              </div>

              {/* Reset Button */}
              <div className="px-6 py-4">
                <Button
                  variant="outline"
                  onClick={() => onSettingsChange(DEFAULT_CAMERA_SETTINGS)}
                  className="w-full bg-transparent border-white/20 text-white/70 hover:bg-white/10"
                >
                  Reset to Defaults
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CameraSettingsPanel;
