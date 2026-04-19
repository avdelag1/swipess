import React from 'react';
import { ScrollView, TouchableOpacity, Text, View } from 'react-native';
import { useMapStore } from '../../../src/store/useMapStore';
import { cn } from '../../../src/utils/cn';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const FILTERS = [
  { id: 'all', label: 'All Discovery', icon: '✨' },
  { id: 'property', label: 'Homes', icon: '🏠' },
  { id: 'motorcycle', label: 'Motos', icon: '🏍️' },
  { id: 'worker', label: 'Pro Workers', icon: '👷' },
  { id: 'vip', label: 'VIP Nodes', icon: '💎' },
  { id: 'verified', label: 'Verified', icon: '✅' },
];

export function FilterChips() {
  const { activeFilters, toggleFilter } = useMapStore();

  const handleToggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFilter(id);
  };

  return (
    <View className="py-2">
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      >
        {FILTERS.map((f) => {
          const isActive = activeFilters.includes(f.id);
          return (
            <TouchableOpacity
              key={f.id}
              onPress={() => handleToggle(f.id)}
              className="rounded-2xl overflow-hidden"
              activeOpacity={0.8}
            >
              <BlurView
                intensity={isActive ? 60 : 30}
                tint={isActive ? "default" : "dark"}
                className={cn(
                  "px-5 py-3 border flex-row items-center",
                  isActive 
                    ? "bg-primary/20 border-primary" 
                    : "bg-black/40 border-white/10"
                )}
              >
                <Text className="mr-2 text-sm">{f.icon}</Text>
                <Text className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em] italic",
                  isActive ? "text-white" : "text-white/40"
                )}>
                  {f.label}
                </Text>
              </BlurView>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
