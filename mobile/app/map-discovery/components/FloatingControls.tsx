import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Navigation, Layers, Compass, Zap } from 'lucide-react-native';
import { useMapStore } from '../../../src/store/useMapStore';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { cn } from '../../../src/utils/cn';

interface FloatingControlsProps {
  onRecenter: () => void;
}

export function FloatingControls({ onRecenter }: FloatingControlsProps) {
  const { vibe, setVibe, radiusKm, setRadiusKm } = useMapStore();

  const handleRecenter = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRecenter();
  };

  const toggleVibe = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setVibe(vibe === 'dark' ? 'light' : 'dark');
  };

  return (
    <View className="absolute right-6 top-1/3 z-30 flex-col gap-4">
      {/* 🧭 NAVIGATION GROUP */}
      <View className="flex-col gap-2">
        <TouchableOpacity onPress={handleRecenter} activeOpacity={0.8}>
          <BlurView intensity={40} tint="dark" className="w-14 h-14 rounded-2xl items-center justify-center border border-white/10 overflow-hidden">
            <Navigation size={24} color="white" />
          </BlurView>
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleVibe} activeOpacity={0.8}>
          <BlurView intensity={40} tint="dark" className="w-14 h-14 rounded-2xl items-center justify-center border border-white/10 overflow-hidden">
            <Layers size={21} color={vibe === 'dark' ? '#EB4898' : 'white'} />
          </BlurView>
        </TouchableOpacity>
      </View>

      {/* 📏 RADIUS PRESETS (VERTICAL) */}
      <View className="flex-col gap-2 mt-4 bg-black/40 p-1 rounded-3xl border border-white/10">
        {[5, 10, 25, 50].map((km) => {
          const isActive = radiusKm === km;
          return (
            <TouchableOpacity 
              key={km} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setRadiusKm(km);
              }}
              className={cn(
                "w-12 h-12 rounded-2xl items-center justify-center",
                isActive ? "bg-primary" : "bg-transparent"
              )}
            >
              <Text className={cn(
                "text-[10px] font-black uppercase tracking-tighter",
                isActive ? "text-white" : "text-white/40"
              )}>{km}k</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* ⚡ RADAR ENGINE STATUS */}
      <TouchableOpacity className="items-center justify-center mt-4">
         <BlurView intensity={40} tint="dark" className="w-14 h-14 rounded-full items-center justify-center border border-primary/20 overflow-hidden">
            <Zap size={20} color="#EB4898" fill="#EB4898" />
         </BlurView>
      </TouchableOpacity>
    </View>
  );
}
