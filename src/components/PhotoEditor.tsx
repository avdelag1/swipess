import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  X,
  Check,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Crop,
  Sun,
  Contrast,
  Droplets,
  Thermometer,
  Sparkles,
  Undo2,
  Maximize2,
  Square,
  RectangleHorizontal,
  RectangleVertical,
} from 'lucide-react';
import { logger } from '@/utils/prodLogger';
import {
  FilterType,
  CAMERA_FILTERS,
  PhotoAdjustments,
  DEFAULT_ADJUSTMENTS,
  adjustmentsToCssFilter,
  applyAllEdits,
  CropArea,
  DEFAULT_CROP_AREA,
} from '@/utils/cameraFilters';

interface PhotoEditorProps {
  imageDataUrl: string;
  onSave: (editedImageDataUrl: string) => void;
  onCancel: () => void;
}

type EditorTab = 'filters' | 'adjust' | 'crop';

interface AdjustmentControl {
  key: keyof PhotoAdjustments;
  label: string;
  icon: React.ReactNode;
  min: number;
  max: number;
}

const ADJUSTMENT_CONTROLS: AdjustmentControl[] = [
  { key: 'brightness', label: 'Brightness', icon: <Sun className="w-4 h-4" />, min: -100, max: 100 },
  { key: 'contrast', label: 'Contrast', icon: <Contrast className="w-4 h-4" />, min: -100, max: 100 },
  { key: 'saturation', label: 'Saturation', icon: <Droplets className="w-4 h-4" />, min: -100, max: 100 },
  { key: 'warmth', label: 'Warmth', icon: <Thermometer className="w-4 h-4" />, min: -100, max: 100 },
  { key: 'exposure', label: 'Exposure', icon: <Sun className="w-4 h-4" />, min: -100, max: 100 },
  { key: 'vignette', label: 'Vignette', icon: <Sparkles className="w-4 h-4" />, min: 0, max: 100 },
];

const ASPECT_RATIO_OPTIONS = [
  { label: 'Free', value: 'free', icon: <Maximize2 className="w-4 h-4" /> },
  { label: '1:1', value: '1:1', icon: <Square className="w-4 h-4" /> },
  { label: '4:3', value: '4:3', icon: <RectangleHorizontal className="w-4 h-4" /> },
  { label: '16:9', value: '16:9', icon: <RectangleHorizontal className="w-4 h-4" /> },
  { label: '3:4', value: '3:4', icon: <RectangleVertical className="w-4 h-4" /> },
];

export function PhotoEditor({ imageDataUrl, onSave, onCancel }: PhotoEditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>('filters');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('none');
  const [adjustments, setAdjustments] = useState<PhotoAdjustments>(DEFAULT_ADJUSTMENTS);
  const [cropArea, setCropArea] = useState<CropArea>(DEFAULT_CROP_AREA);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>('free');
  const [isSaving, setIsSaving] = useState(false);
  const [activeAdjustment, setActiveAdjustment] = useState<keyof PhotoAdjustments | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate preview filter CSS
  const getPreviewStyle = useCallback(() => {
    let filter = '';

    // Apply selected filter
    if (selectedFilter !== 'none') {
      filter = CAMERA_FILTERS[selectedFilter].cssFilter;
    }

    // Apply adjustments
    const adjustmentFilter = adjustmentsToCssFilter(adjustments);
    if (adjustmentFilter !== 'none') {
      filter = filter ? `${filter} ${adjustmentFilter}` : adjustmentFilter;
    }

    // Apply transforms
    let transform = '';
    if (rotation !== 0) {
      transform += `rotate(${rotation}deg) `;
    }
    if (flipH) {
      transform += 'scaleX(-1) ';
    }
    if (flipV) {
      transform += 'scaleY(-1) ';
    }

    return {
      filter: filter || 'none',
      transform: transform.trim() || 'none',
    };
  }, [selectedFilter, adjustments, rotation, flipH, flipV]);

  // Reset all adjustments
  const handleReset = () => {
    setSelectedFilter('none');
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setCropArea(DEFAULT_CROP_AREA);
    setSelectedAspectRatio('free');
  };

  // Update single adjustment
  const updateAdjustment = (key: keyof PhotoAdjustments, value: number) => {
    setAdjustments(prev => ({ ...prev, [key]: value }));
  };

  // Rotate image
  const rotateLeft = () => setRotation(prev => (prev - 90) % 360);
  const rotateRight = () => setRotation(prev => (prev + 90) % 360);

  // Save edited image
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Create canvas to apply all edits
      const img = new Image();
      img.src = imageDataUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Calculate rotated dimensions
      const isRotated90 = Math.abs(rotation) === 90 || Math.abs(rotation) === 270;
      canvas.width = isRotated90 ? img.height : img.width;
      canvas.height = isRotated90 ? img.width : img.height;

      // Build filter string
      let filterString = '';
      if (selectedFilter !== 'none') {
        filterString = CAMERA_FILTERS[selectedFilter].cssFilter;
      }
      const adjustmentFilter = adjustmentsToCssFilter(adjustments);
      if (adjustmentFilter !== 'none') {
        filterString = filterString ? `${filterString} ${adjustmentFilter}` : adjustmentFilter;
      }

      // Apply filter
      if (filterString) {
        ctx.filter = filterString;
      }

      // Apply transforms
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      if (flipH) ctx.scale(-1, 1);
      if (flipV) ctx.scale(1, -1);

      // Draw image
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      // Reset filter for vignette
      ctx.filter = 'none';

      // Apply vignette if needed
      if (adjustments.vignette > 0) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 0,
          canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.7
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.5, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(0,0,0,${adjustments.vignette / 100 * 0.7})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const editedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onSave(editedDataUrl);
    } catch (error) {
      logger.error('Error saving edited photo:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const previewStyle = getPreviewStyle();

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="text-white hover:bg-white/10"
        >
          <X className="w-6 h-6" />
        </Button>

        <h2 className="text-white font-semibold">Edit Photo</h2>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleReset}
          className="text-white hover:bg-white/10"
        >
          <Undo2 className="w-5 h-5" />
        </Button>
      </div>

      {/* Image Preview */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-4 overflow-hidden"
      >
        <motion.img
          ref={imageRef}
          src={imageDataUrl}
          alt="Edit preview"
          className="max-w-full max-h-full object-contain rounded-lg"
          style={{
            filter: previewStyle.filter,
            transform: previewStyle.transform,
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        />
      </div>

      {/* Editor Controls */}
      <div className="bg-gradient-to-t from-black via-black/95 to-transparent">
        {/* Tab Selector */}
        <div className="flex items-center justify-center gap-8 py-4 border-b border-white/10">
          {(['filters', 'adjust', 'crop'] as EditorTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-medium capitalize transition-all px-4 py-2 rounded-full ${
                activeTab === tab
                  ? 'text-white bg-white/20'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="py-4 min-h-[180px]">
          <AnimatePresence mode="wait">
            {/* Filters Tab */}
            {activeTab === 'filters' && (
              <motion.div
                key="filters"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-4"
              >
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                  {(Object.entries(CAMERA_FILTERS) as [FilterType, typeof CAMERA_FILTERS[FilterType]][]).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedFilter(key)}
                      className={`flex-shrink-0 flex flex-col items-center gap-2 ${
                        selectedFilter === key ? 'opacity-100' : 'opacity-60'
                      }`}
                    >
                      <div
                        className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedFilter === key ? 'border-white' : 'border-transparent'
                        }`}
                      >
                        <img
                          src={imageDataUrl}
                          alt={config.name}
                          className="w-full h-full object-cover"
                          style={{ filter: config.cssFilter }}
                        />
                      </div>
                      <span className="text-xs text-white font-medium">{config.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Adjust Tab */}
            {activeTab === 'adjust' && (
              <motion.div
                key="adjust"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-4"
              >
                {/* Adjustment buttons */}
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                  {ADJUSTMENT_CONTROLS.map((control) => (
                    <button
                      key={control.key}
                      onClick={() => setActiveAdjustment(
                        activeAdjustment === control.key ? null : control.key
                      )}
                      className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                        activeAdjustment === control.key
                          ? 'bg-white/20 text-white'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {control.icon}
                      <span className="text-xs font-medium">{control.label}</span>
                      {adjustments[control.key] !== 0 && (
                        <span className="text-[10px] text-red-400">
                          {adjustments[control.key] > 0 ? '+' : ''}{adjustments[control.key]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Active adjustment slider */}
                <AnimatePresence>
                  {activeAdjustment && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-4 border-t border-white/10"
                    >
                      {ADJUSTMENT_CONTROLS.filter(c => c.key === activeAdjustment).map((control) => (
                        <div key={control.key} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-white/80 text-sm">{control.label}</span>
                            <span className="text-white font-medium text-sm">
                              {adjustments[control.key]}
                            </span>
                          </div>
                          <Slider
                            value={[adjustments[control.key]]}
                            min={control.min}
                            max={control.max}
                            step={1}
                            onValueChange={([value]) => updateAdjustment(control.key, value)}
                            className="w-full"
                          />
                          <div className="flex justify-between text-white/40 text-xs">
                            <span>{control.min}</span>
                            <button
                              onClick={() => updateAdjustment(control.key, 0)}
                              className="text-white/60 hover:text-white"
                            >
                              Reset
                            </button>
                            <span>{control.max}</span>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Crop Tab */}
            {activeTab === 'crop' && (
              <motion.div
                key="crop"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-4 space-y-4"
              >
                {/* Rotation controls */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={rotateLeft}
                    className="text-white hover:bg-white/10"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFlipH(!flipH)}
                    className={`text-white hover:bg-white/10 ${flipH ? 'bg-white/20' : ''}`}
                  >
                    <FlipHorizontal className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFlipV(!flipV)}
                    className={`text-white hover:bg-white/10 ${flipV ? 'bg-white/20' : ''}`}
                  >
                    <FlipVertical className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={rotateRight}
                    className="text-white hover:bg-white/10"
                  >
                    <RotateCw className="w-5 h-5" />
                  </Button>
                </div>

                {/* Aspect ratio options */}
                <div className="flex items-center justify-center gap-2">
                  {ASPECT_RATIO_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedAspectRatio(option.value)}
                      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                        selectedAspectRatio === option.value
                          ? 'bg-white/20 text-white'
                          : 'text-white/50 hover:text-white'
                      }`}
                    >
                      {option.icon}
                      <span className="text-xs">{option.label}</span>
                    </button>
                  ))}
                </div>

                {/* Rotation indicator */}
                {rotation !== 0 && (
                  <div className="text-center text-white/60 text-sm">
                    Rotation: {rotation}°
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 px-4 pb-safe pt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-12 bg-transparent border-white/30 text-white hover:bg-white/10"
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 h-12 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white border-0"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Apply
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PhotoEditor;
