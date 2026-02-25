import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraDirection } from '@capacitor/camera';
import { useCamera, CapturedPhoto } from '@/hooks/useCamera';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  RefreshCw,
  Sparkles,
  Timer,
  SlidersHorizontal,
  ChevronDown,
  Check,
  Image,
  Trash2,
  Camera,
  Zap,
  Grid3X3,
  Edit3,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CameraSettingsPanel } from '@/components/CameraSettingsPanel';
import { CameraFiltersPanel } from '@/components/CameraFiltersPanel';
import { PhotoEditor } from '@/components/PhotoEditor';
import {
  FilterType,
  CAMERA_FILTERS,
  CameraSettings,
  DEFAULT_CAMERA_SETTINGS,
  PortraitModeConfig,
  DEFAULT_PORTRAIT_CONFIG,
  NightModeConfig,
  DEFAULT_NIGHT_CONFIG,
  getNightModeCssFilter,
  adjustmentsToCssFilter,
  QUALITY_SETTINGS,
} from '@/utils/cameraFilters';

interface CameraCaptureProps {
  mode: 'selfie' | 'listing';
  maxPhotos?: number;
  onComplete: (photos: CapturedPhoto[]) => void;
  onCancel: () => void;
  title?: string;
}

type PhotoMode = 'PHOTO' | 'PORTRAIT' | 'NIGHT';

export function CameraCapture({
  mode,
  maxPhotos = mode === 'selfie' ? 1 : 10,
  onComplete,
  onCancel,
  title,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [photoMode, setPhotoMode] = useState<PhotoMode>('PHOTO');
  const [showGrid, setShowGrid] = useState(false);
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('auto');
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<number | null>(null);

  // New feature states
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('none');
  const [cameraSettings, setCameraSettings] = useState<CameraSettings>(DEFAULT_CAMERA_SETTINGS);
  const [portraitConfig, setPortraitConfig] = useState<PortraitModeConfig>(DEFAULT_PORTRAIT_CONFIG);
  const [nightConfig, setNightConfig] = useState<NightModeConfig>(DEFAULT_NIGHT_CONFIG);

  const {
    isCapturing,
    capturedPhotos,
    currentDirection,
    hasPermission,
    isNative,
    checkPermissions,
    requestPermissions,
    startStream,
    stopStream,
    capture,
    pickFromGallery,
    flipCamera,
    addPhoto,
    updatePhoto,
    removePhoto,
    clearPhotos,
    cleanup,
  } = useCamera({
    mode,
  });

  // Handle photo mode changes
  useEffect(() => {
    if (photoMode === 'PORTRAIT') {
      setPortraitConfig(prev => ({ ...prev, enabled: true }));
      setNightConfig(prev => ({ ...prev, enabled: false }));
    } else if (photoMode === 'NIGHT') {
      setNightConfig(prev => ({ ...prev, enabled: true }));
      setPortraitConfig(prev => ({ ...prev, enabled: false }));
    } else {
      setPortraitConfig(prev => ({ ...prev, enabled: false }));
      setNightConfig(prev => ({ ...prev, enabled: false }));
    }
  }, [photoMode]);

  // Get combined preview filter CSS
  const getPreviewFilter = useCallback(() => {
    const filters: string[] = [];

    // Apply selected filter
    if (selectedFilter !== 'none') {
      filters.push(CAMERA_FILTERS[selectedFilter].cssFilter);
    }

    // Apply night mode filter
    if (nightConfig.enabled) {
      const nightFilter = getNightModeCssFilter(nightConfig);
      if (nightFilter !== 'none') {
        filters.push(nightFilter);
      }
    }

    // Apply portrait mode visual indicator (subtle vignette)
    if (portraitConfig.enabled) {
      filters.push('brightness(1.02)');
    }

    return filters.length > 0 ? filters.join(' ') : 'none';
  }, [selectedFilter, nightConfig, portraitConfig]);

  // Initialize camera
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const permitted = await checkPermissions();
      if (!isMounted) return;

      if (!permitted) {
        const granted = await requestPermissions();
        if (!granted || !isMounted) return;
      }

      if (!isNative && videoRef.current && isMounted) {
        const success = await startStream(videoRef.current);
        if (isMounted) {
          setIsStreamActive(success);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [checkPermissions, requestPermissions, isNative, startStream, cleanup]);

  // Restart stream when direction changes
  useEffect(() => {
    if (!isNative && videoRef.current && isStreamActive) {
      startStream(videoRef.current);
    }
  }, [currentDirection, isNative, isStreamActive, startStream]);

  // Custom capture with filters applied
  const captureWithEffects = useCallback(async () => {
    if (!videoRef.current) {
      return await capture();
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return await capture();

    // Use quality settings for dimensions
    const qualityConfig = QUALITY_SETTINGS[cameraSettings.quality];
    const width = mode === 'listing' ? qualityConfig.width : Math.min(qualityConfig.width, 1080);
    const height = mode === 'listing' ? qualityConfig.height : Math.min(qualityConfig.height, 1080);

    canvas.width = width;
    canvas.height = height;

    // Calculate crop to maintain aspect ratio
    const videoAspect = video.videoWidth / video.videoHeight;
    const targetAspect = width / height;

    let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;

    if (videoAspect > targetAspect) {
      sw = video.videoHeight * targetAspect;
      sx = (video.videoWidth - sw) / 2;
    } else {
      sh = video.videoWidth / targetAspect;
      sy = (video.videoHeight - sh) / 2;
    }

    // Build filter string
    let filterString = '';

    if (selectedFilter !== 'none') {
      filterString = CAMERA_FILTERS[selectedFilter].cssFilter;
    }

    if (nightConfig.enabled) {
      const nightFilter = getNightModeCssFilter(nightConfig);
      if (nightFilter !== 'none') {
        filterString = filterString ? `${filterString} ${nightFilter}` : nightFilter;
      }
    }

    // Apply HDR simulation if enabled
    if (cameraSettings.hdr) {
      const hdrFilter = 'contrast(1.05) saturate(1.1)';
      filterString = filterString ? `${filterString} ${hdrFilter}` : hdrFilter;
    }

    // Apply filter to canvas
    if (filterString) {
      ctx.filter = filterString;
    }

    // Mirror front camera if setting enabled
    const shouldMirror = currentDirection === CameraDirection.Front && cameraSettings.mirror;
    if (shouldMirror) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    // Draw video frame
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, width, height);

    // Reset filter for additional effects
    ctx.filter = 'none';

    // Apply portrait mode blur effect (simulated vignette focus)
    if (portraitConfig.enabled) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // Create a subtle radial gradient to simulate depth-of-field
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2,
        (canvas.width * portraitConfig.focusAreaSize / 100) / 2,
        canvas.width / 2, canvas.height / 2,
        Math.max(canvas.width, canvas.height) * 0.7
      );

      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(0.7, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, `rgba(0,0,0,${portraitConfig.blurIntensity / 100 * 0.3})`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const quality = qualityConfig.jpegQuality;
    const dataUrl = canvas.toDataURL('image/jpeg', quality);

    const capturedPhoto: CapturedPhoto = {
      dataUrl,
      format: 'jpeg',
      saved: false,
      timestamp: Date.now(),
    };

    return capturedPhoto;
  }, [
    capture,
    selectedFilter,
    nightConfig,
    portraitConfig,
    cameraSettings,
    currentDirection,
    mode,
  ]);

  // Handle timer countdown and capture
  const handleCapture = useCallback(async () => {
    if (capturedPhotos.length >= maxPhotos) {
      toast({
        title: 'Photo Limit Reached',
        description: `Maximum ${maxPhotos} photos allowed.`,
        variant: 'destructive',
      });
      return;
    }

    if (timerSeconds > 0) {
      setCountdown(timerSeconds);
      for (let i = timerSeconds; i > 0; i--) {
        setCountdown(i);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setCountdown(null);
    }

    // Simulate flash effect
    if (flashMode === 'on' || (flashMode === 'auto' && nightConfig.enabled)) {
      const flashOverlay = document.createElement('div');
      flashOverlay.className = 'fixed inset-0 bg-white z-[100] pointer-events-none';
      document.body.appendChild(flashOverlay);
      setTimeout(() => flashOverlay.remove(), 100);
    }

    const photo = await captureWithEffects();
    if (photo) {
      // Add photo to the captured photos array
      addPhoto(photo);
      toast({
        title: 'Photo Captured!',
        description: `${capturedPhotos.length + 1}/${maxPhotos} photos taken`,
      });
    }
  }, [timerSeconds, capturedPhotos.length, maxPhotos, captureWithEffects, flashMode, nightConfig.enabled, addPhoto]);

  // Handle complete
  const handleComplete = () => {
    if (capturedPhotos.length === 0) {
      toast({
        title: 'No Photos',
        description: 'Please take at least one photo.',
        variant: 'destructive',
      });
      return;
    }
    stopStream();
    onComplete(capturedPhotos);
  };

  // Handle close
  const handleClose = () => {
    cleanup();
    onCancel();
  };

  // Cycle flash mode
  const cycleFlashMode = () => {
    const modes: ('off' | 'on' | 'auto')[] = ['off', 'on', 'auto'];
    const currentIndex = modes.indexOf(flashMode);
    setFlashMode(modes[(currentIndex + 1) % modes.length]);
  };

  // Cycle timer
  const cycleTimer = () => {
    const timers = [0, 3, 5, 10];
    const currentIndex = timers.indexOf(timerSeconds);
    setTimerSeconds(timers[(currentIndex + 1) % timers.length]);
  };

  // Open photo editor
  const handleEditPhoto = (index: number) => {
    setEditingPhotoIndex(index);
    setShowPhotoEditor(true);
    setShowPreview(false);
  };

  // Save edited photo
  const handleSaveEditedPhoto = (editedDataUrl: string) => {
    if (editingPhotoIndex !== null && capturedPhotos[editingPhotoIndex]) {
      // Update the photo in the array using the hook's updatePhoto method
      updatePhoto(editingPhotoIndex, {
        ...capturedPhotos[editingPhotoIndex],
        dataUrl: editedDataUrl,
      });
      toast({
        title: 'Photo Edited!',
        description: 'Your changes have been applied.',
      });
    }
    setShowPhotoEditor(false);
    setEditingPhotoIndex(null);
  };

  // Photo modes
  const photoModes: PhotoMode[] = ['PHOTO', 'PORTRAIT', 'NIGHT'];

  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6">
        <Camera className="w-16 h-16 text-white/50 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Camera Access Required</h2>
        <p className="text-white/60 text-center mb-6">
          Please enable camera access in your device settings to take photos.
        </p>
        <Button onClick={requestPermissions} className="bg-red-500 hover:bg-red-600">
          Request Permission
        </Button>
        <Button variant="ghost" onClick={handleClose} className="mt-4 text-white/60">
          Cancel
        </Button>
      </div>
    );
  }

  // Show photo editor
  if (showPhotoEditor && editingPhotoIndex !== null && capturedPhotos[editingPhotoIndex]) {
    return (
      <PhotoEditor
        imageDataUrl={capturedPhotos[editingPhotoIndex].dataUrl}
        onSave={handleSaveEditedPhoto}
        onCancel={() => {
          setShowPhotoEditor(false);
          setEditingPhotoIndex(null);
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Camera Preview / Video */}
      <div className="relative flex-1 overflow-hidden">
        {/* Video Stream with Filters */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-200 ${
            currentDirection === CameraDirection.Front && cameraSettings.mirror ? 'scale-x-[-1]' : ''
          }`}
          style={{ filter: getPreviewFilter() }}
        />

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Portrait Mode Focus Indicator */}
        {portraitConfig.enabled && (
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-white/40 rounded-full"
              style={{
                width: `${portraitConfig.focusAreaSize}%`,
                height: `${portraitConfig.focusAreaSize}%`,
              }}
            />
          </div>
        )}

        {/* Grid Overlay */}
        {showGrid && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-full grid grid-cols-3 grid-rows-3">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-white/20" />
              ))}
            </div>
          </div>
        )}

        {/* Countdown Overlay */}
        <AnimatePresence>
          {countdown !== null && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/50"
            >
              <span className="text-8xl font-bold text-white">{countdown}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview Overlay */}
        <AnimatePresence>
          {showPreview && selectedPreviewIndex !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black z-30 flex flex-col"
            >
              <div className="flex items-center justify-between p-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowPreview(false);
                    setSelectedPreviewIndex(null);
                  }}
                  className="text-white"
                >
                  <X className="w-6 h-6" />
                </Button>
                <span className="text-white font-medium">
                  Photo {selectedPreviewIndex + 1} of {capturedPhotos.length}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditPhoto(selectedPreviewIndex)}
                    className="text-white"
                  >
                    <Edit3 className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      removePhoto(selectedPreviewIndex);
                      setShowPreview(false);
                      setSelectedPreviewIndex(null);
                    }}
                    className="text-red-500"
                  >
                    <Trash2 className="w-6 h-6" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center p-4">
                <img
                  src={capturedPhotos[selectedPreviewIndex]?.dataUrl}
                  alt={`Preview ${selectedPreviewIndex + 1}`}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-white bg-black/30 hover:bg-black/50 rounded-full w-10 h-10"
          >
            <X className="w-6 h-6" />
          </Button>

          {title && (
            <Badge className="bg-black/50 text-white border-0 px-4 py-2 text-sm font-medium">
              {title}
            </Badge>
          )}

          {/* Photo count */}
          <Badge className="bg-black/50 text-white border-0 px-3 py-1.5">
            {capturedPhotos.length}/{maxPhotos}
          </Badge>
        </div>

        {/* Active Filter/Mode Indicator */}
        {(selectedFilter !== 'none' || portraitConfig.enabled || nightConfig.enabled) && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20">
            <Badge className="bg-black/50 text-white border-0 px-3 py-1.5 text-xs">
              {portraitConfig.enabled && 'Portrait'}
              {nightConfig.enabled && 'Night Mode'}
              {selectedFilter !== 'none' && !portraitConfig.enabled && !nightConfig.enabled &&
                CAMERA_FILTERS[selectedFilter].name}
            </Badge>
          </div>
        )}

        {/* Right Side Controls */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-20">
          {/* Flip Camera */}
          <motion.button
            whileTap={{ scale: 0.9, rotate: 180 }}
            onClick={flipCamera}
            className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center text-white"
          >
            <RefreshCw className="w-6 h-6" />
          </motion.button>

          {/* Flash */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={cycleFlashMode}
            className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center text-white relative"
          >
            <Zap className={`w-6 h-6 ${flashMode === 'on' ? 'text-yellow-400' : ''}`} />
            {flashMode === 'auto' && (
              <span className="absolute -bottom-1 text-[10px] font-bold text-yellow-400">A</span>
            )}
          </motion.button>

          {/* Timer */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={cycleTimer}
            className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center text-white relative"
          >
            <Timer className="w-6 h-6" />
            {timerSeconds > 0 && (
              <span className="absolute -bottom-1 text-[10px] font-bold text-yellow-400">
                {timerSeconds}s
              </span>
            )}
          </motion.button>

          {/* Grid */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowGrid(!showGrid)}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              showGrid ? 'bg-white/30' : 'bg-black/30'
            } text-white`}
          >
            <Grid3X3 className="w-6 h-6" />
          </motion.button>

          {/* Effects/Filters */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowFiltersPanel(true)}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${
              selectedFilter !== 'none' || portraitConfig.enabled || nightConfig.enabled
                ? 'bg-red-500/50'
                : 'bg-black/30'
            }`}
          >
            <Sparkles className="w-6 h-6" />
          </motion.button>

          {/* Settings */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowSettingsPanel(true)}
            className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center text-white"
          >
            <SlidersHorizontal className="w-6 h-6" />
          </motion.button>

          <ChevronDown className="w-6 h-6 text-white/50 mx-auto" />
        </div>

        {/* Focus indicator */}
        {!portraitConfig.enabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="w-20 h-20 border-2 border-white/30 rounded-lg" />
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-gradient-to-t from-black via-black/95 to-transparent pt-8 pb-safe">
        {/* Photo Mode Selector */}
        <div className="flex items-center justify-center gap-6 mb-6">
          {photoModes.map((m) => (
            <button
              key={m}
              onClick={() => setPhotoMode(m)}
              className={`text-sm font-medium transition-all ${
                photoMode === m
                  ? 'text-white px-4 py-1.5 bg-white/20 rounded-full'
                  : 'text-white/50'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Capture Controls */}
        <div className="flex items-center justify-center gap-8 mb-6">
          {/* Gallery Thumbnails */}
          <div className="flex items-center gap-2">
            {capturedPhotos.slice(-2).map((photo, index) => (
              <motion.button
                key={photo.timestamp}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={() => {
                  setSelectedPreviewIndex(capturedPhotos.length - 2 + index);
                  setShowPreview(true);
                }}
                className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/30"
              >
                <img
                  src={photo.dataUrl}
                  alt={`Captured ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </motion.button>
            ))}
            {capturedPhotos.length === 0 && (
              <button
                onClick={pickFromGallery}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20"
              >
                <Image className="w-5 h-5 text-white/60" />
              </button>
            )}
          </div>

          {/* Main Capture Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCapture}
            disabled={isCapturing || countdown !== null}
            className="relative w-20 h-20 flex items-center justify-center"
          >
            {/* Outer ring */}
            <div className={`absolute inset-0 rounded-full border-4 ${
              photoMode === 'PORTRAIT' ? 'border-pink-400' :
              photoMode === 'NIGHT' ? 'border-indigo-400' : 'border-white'
            }`} />

            {/* Inner button */}
            <motion.div
              animate={{
                scale: isCapturing ? 0.8 : 1,
              }}
              className={`w-16 h-16 rounded-full ${
                photoMode === 'PORTRAIT'
                  ? 'bg-gradient-to-br from-pink-500 to-purple-500'
                  : photoMode === 'NIGHT'
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                  : mode === 'selfie'
                  ? 'bg-gradient-to-br from-pink-500 to-red-500'
                  : 'bg-gradient-to-br from-red-500 to-orange-500'
              }`}
            />

            {/* Capturing indicator */}
            {isCapturing && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </motion.button>

          {/* Gallery / More button */}
          <button
            onClick={pickFromGallery}
            className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20"
          >
            <Image className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4 px-6">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1 h-12 bg-transparent border-white/30 text-white hover:bg-white/10"
          >
            Cancel
          </Button>

          <Button
            onClick={handleComplete}
            disabled={capturedPhotos.length === 0}
            className={`flex-1 h-12 ${
              photoMode === 'PORTRAIT'
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600'
                : photoMode === 'NIGHT'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
                : mode === 'selfie'
                ? 'bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600'
                : 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'
            } text-white border-0`}
          >
            <Check className="w-5 h-5 mr-2" />
            {mode === 'selfie' ? 'Use Photo' : `Done (${capturedPhotos.length})`}
          </Button>
        </div>

        {/* Tips */}
        <p className="text-center text-white/40 text-xs mt-4 px-6">
          {photoMode === 'PORTRAIT'
            ? 'Portrait mode adds a professional background blur effect'
            : photoMode === 'NIGHT'
            ? 'Night mode enhances photos in low-light conditions'
            : mode === 'selfie'
            ? 'Take a clear selfie with good lighting for your profile'
            : 'Capture multiple angles of your listing for better visibility'}
        </p>
      </div>

      {/* Settings Panel */}
      <CameraSettingsPanel
        isOpen={showSettingsPanel}
        onClose={() => setShowSettingsPanel(false)}
        settings={cameraSettings}
        onSettingsChange={setCameraSettings}
      />

      {/* Filters Panel */}
      <CameraFiltersPanel
        isOpen={showFiltersPanel}
        onClose={() => setShowFiltersPanel(false)}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        portraitConfig={portraitConfig}
        onPortraitConfigChange={(config) => {
          setPortraitConfig(config);
          if (config.enabled) {
            setPhotoMode('PORTRAIT');
          }
        }}
        nightConfig={nightConfig}
        onNightConfigChange={(config) => {
          setNightConfig(config);
          if (config.enabled) {
            setPhotoMode('NIGHT');
          }
        }}
        previewImageUrl={capturedPhotos[0]?.dataUrl}
      />
    </div>
  );
}

export default CameraCapture;
