import React, { useState } from 'react';
import { View, StatusBar } from 'react-native';
import { MapDiscoveryView } from './MapView';
import { FilterChips } from './components/FilterChips';
import { BottomSheetCard } from './components/BottomSheetCard';
import { FloatingControls } from './components/FloatingControls';
import { useSupabaseDiscovery } from '../../src/hooks/useSupabaseDiscovery';
import { useMapStore, DiscoverItem } from '../../src/store/useMapStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

export default function MapDiscoveryScreen() {
  const insets = useSafeAreaInsets();
  const { data: items = [], isLoading } = useSupabaseDiscovery();
  const { selectedItemId, selectItem } = useMapStore();

  const selectedItem = items.find(i => i.id === selectedItemId) || null;

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
        className="absolute top-0 inset-x-0 z-20"
        style={{ paddingTop: insets.top }}
      >
        <FilterChips />
      </View>

      {/* 🪁 FLOATING MAP CONTROLS */}
      <FloatingControls onRecenter={() => {}} />

      {/* 🃏 BOTTOM SHEET CARD PREVIEW */}
      <BottomSheetCard 
        item={selectedItem}
        onClose={() => selectItem(null)}
      />

    </View>
  );
}
