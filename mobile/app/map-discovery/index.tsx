import React, { useState, useCallback } from 'react';
import { View, StatusBar, Text, TouchableOpacity } from 'react-native';
import { MapDiscoveryView } from './MapView';
import { FilterChips } from './components/FilterChips';
import { BottomSheetCard } from './components/BottomSheetCard';
import { FloatingControls } from './components/FloatingControls';
import { useSupabaseDiscovery } from '../../src/hooks/useSupabaseDiscovery';
import { useMapStore, DiscoverItem } from '../../src/store/useMapStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { ChevronLeft, Zap, List } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

/**
 * 🛰️ RADAR NEXUS - MAIN DISCOVERY ORCHESTRATOR
 * This screen manages the transition between map search and swipe deck.
 */
export default function MapDiscoveryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: items = [], isLoading } = useSupabaseDiscovery();
  const { selectedItemId, selectItem, radiusKm } = useMapStore();

  const selectedItem = items.find(i => i.id === selectedItemId) || null;

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleStartSwiping = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Future: Push to swipe deck screen
    // router.push('/swipe-deck');
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      
      {/* 🗺️ THE CORE MAP ENGINE */}
      <MapDiscoveryView 
        items={items} 
        onItemSelect={(item) => selectItem(item.id)}
      />

      {/* ⚡ TOP HUD GLASSMOPHISM */}
      <View 
        className="absolute top-0 inset-x-0 z-20 pointer-events-none"
        style={{ paddingTop: insets.top + 10 }}
      >
        <View className="flex-row items-center justify-between px-6 mb-4 pointer-events-auto">
           <TouchableOpacity 
             onPress={handleBack}
             className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 items-center justify-center overflow-hidden"
           >
              <BlurView intensity={30} className="absolute inset-0" />
              <ChevronLeft size={24} color="white" />
           </TouchableOpacity>

           <View className="items-center">
              <Text className="text-white text-[10px] font-black uppercase tracking-[0.4em] italic">Radar Nexus</Text>
              <Text className="text-primary text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">Scanning {radiusKm}km Field</Text>
           </View>

           <TouchableOpacity className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 items-center justify-center overflow-hidden">
              <BlurView intensity={30} className="absolute inset-0" />
              <List size={20} color="white" />
           </TouchableOpacity>
        </View>

        <View className="pointer-events-auto">
          <FilterChips />
        </View>
      </View>

      {/* 🪁 FLOATING MAP CONTROLS */}
      <FloatingControls onRecenter={() => {}} />

      {/* 🚀 START SWIPING TRIGGER */}
      {!selectedItemId && (
        <View 
          className="absolute bottom-12 inset-x-0 px-8 z-30"
          style={{ paddingBottom: insets.bottom }}
        >
           <TouchableOpacity 
             onPress={handleStartSwiping}
             activeOpacity={0.9}
             className="w-full h-18 bg-primary rounded-[2rem] flex-row items-center justify-center gap-3 shadow-[0_20px_40px_rgba(235,72,152,0.4)] border-t-2 border-white/30"
           >
              <Zap size={20} color="white" fill="white" />
              <Text className="text-white text-lg font-black uppercase italic tracking-[0.1em]">Engage Swipe Deck</Text>
           </TouchableOpacity>
        </View>
      )}

      {/* 🃏 BOTTOM SHEET CARD PREVIEW */}
      <BottomSheetCard 
        item={selectedItem}
        onClose={() => selectItem(null)}
      />

    </View>
  );
}
