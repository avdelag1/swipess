import React, { useMemo, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useMapStore, DiscoverItem } from '../../../src/store/useMapStore';
import { Star, MapPin, ShieldCheck, Zap } from 'lucide-react-native';

interface BottomSheetCardProps {
  item: DiscoverItem | null;
  onClose: () => void;
}

export function BottomSheetCard({ item, onClose }: BottomSheetCardProps) {
  const snapPoints = useMemo(() => ['25%', '50%'], []);
  
  const bottomSheetRef = React.useRef<BottomSheet>(null);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) onClose();
  }, [onClose]);

  if (!item) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: '#111', borderRadius: 40 }}
      handleIndicatorStyle={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
    >
      <BottomSheetView className="p-6">
        <View className="flex-row gap-4">
          <Image 
            source={{ uri: item.photo }} 
            className="w-24 h-24 rounded-2xl bg-white/10"
          />
          <View className="flex-1 justify-center">
            <View className="flex-row items-center gap-2 mb-1">
              <Text className="text-xl font-black italic uppercase text-white leading-tight">
                {item.title}
              </Text>
              {item.isVerified && <ShieldCheck size={16} color="#007AFF" />}
            </View>
            
            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center">
                <MapPin size={12} color="rgba(255,255,255,0.4)" />
                <Text className="text-[10px] text-white/40 font-bold ml-1">
                  {item.distanceKm.toFixed(1)} KM
                </Text>
              </View>
              <View className="flex-row items-center">
                <Star size={12} color="#FFD700" fill="#FFD700" />
                <Text className="text-[10px] text-white/40 font-bold ml-1">
                  {item.rating || '4.9'}
                </Text>
              </View>
            </View>

            <View className="mt-3 self-start px-2 py-0.5 bg-primary/20 rounded-md border border-primary/30">
               <Text className="text-[8px] font-black uppercase text-primary italic tracking-widest">
                  {item.category}
               </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          className="w-full h-14 bg-primary rounded-2xl mt-6 items-center justify-center flex-row shadow-xl shadow-primary/40"
          activeOpacity={0.8}
        >
          <Zap size={18} color="white" />
          <Text className="text-white font-black italic uppercase tracking-widest ml-2">
            View Protocol
          </Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}
