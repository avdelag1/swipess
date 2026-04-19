import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useMapStore } from '../../../src/store/useMapStore';
import { Target, Layers, Map as MapIcon, Compass } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { cn } from '../../../src/utils/cn';

const RADIUS_PRESETS = [1, 5, 10, 25, 100];

export function FloatingControls({ onRecenter }: { onRecenter: () => void }) {
  const { radiusKm, setRadiusKm, vibe, setVibe } = useMapStore();

  const handlePreset = (km: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRadiusKm(km);
  };

  return (
    <View className="absolute bottom-36 right-4 gap-4 items-end">
      
      {/* 📡 RADIUS PRESET PILLS */}
      <View className="bg-black/60 backdrop-blur-3xl rounded-3xl p-1.5 border border-white/10">
        {RADIUS_PRESETS.map((km) => (
          <TouchableOpacity
            key={km}
            onPress={() => handlePreset(km)}
            className={cn(
              "w-12 h-10 items-center justify-center rounded-2xl mb-1 last:mb-0",
              radiusKm === km ? "bg-primary" : "bg-transparent"
            )}
          >
            <Text className={cn(
              "text-[10px] font-black italic uppercase",
              radiusKm === km ? "text-white" : "text-white/40"
            )}>
              {km}K
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 🕹️ MACRO CONTROLS */}
      <View className="gap-3">
        <TouchableOpacity 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setVibe(vibe === 'dark' ? 'light' : 'dark');
          }}
          className="w-14 h-14 bg-black/80 backdrop-blur-2xl rounded-full items-center justify-center border border-white/20 shadow-2xl"
        >
          <Compass size={24} color={vibe === 'dark' ? '#EB4898' : '#007AFF'} />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={onRecenter}
          className="w-14 h-14 bg-primary rounded-full items-center justify-center border border-white/30 shadow-2xl shadow-primary/40"
        >
          <Target size={24} color="white" />
        </TouchableOpacity>
      </View>

    </View>
  );
}
