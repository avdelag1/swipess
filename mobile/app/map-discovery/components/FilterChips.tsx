import React from 'react';
import { ScrollView, TouchableOpacity, Text, View } from 'react-native';
import { useMapStore } from '../../../src/store/useMapStore';
import { cn } from '../../../src/utils/cn'; // I'll create this helper

const FILTERS = [
  { id: 'property', label: 'Homes', icon: '🏠' },
  { id: 'vehicle', label: 'Cars', icon: '🚗' },
  { id: 'worker', label: 'Pro Workers', icon: '👷' },
  { id: 'service', label: 'Services', icon: '🛠️' },
  { id: 'vip', label: 'VIP Only', icon: '💎' },
  { id: 'verified', label: 'Verified', icon: '✅' },
];

export function FilterChips() {
  const { activeFilters, toggleFilter } = useMapStore();

  return (
    <View className="py-4">
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
      >
        {FILTERS.map((f) => {
          const isActive = activeFilters.includes(f.id);
          return (
            <TouchableOpacity
              key={f.id}
              onPress={() => toggleFilter(f.id)}
              className={cn(
                "px-5 py-2.5 rounded-full border flex-row items-center",
                isActive 
                  ? "bg-primary border-primary" 
                  : "bg-black/40 border-white/10 backdrop-blur-md"
              )}
            >
              <Text className="mr-2 text-sm">{f.icon}</Text>
              <Text className={cn(
                "text-[12px] font-black uppercase tracking-widest italic",
                isActive ? "text-white" : "text-white/60"
              )}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
