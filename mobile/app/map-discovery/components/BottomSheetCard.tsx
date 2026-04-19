import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { DiscoverItem } from '../../../src/store/useMapStore';
import { BlurView } from 'expo-blur';
import { Star, MapPin, Zap, MessageCircle, Heart, Share2, Verified } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { cn } from '../../../src/utils/cn';

interface BottomSheetCardProps {
  item: DiscoverItem | null;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export function BottomSheetCard({ item, onClose }: BottomSheetCardProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['45%'], []);

  useEffect(() => {
    if (item) {
      bottomSheetRef.current?.expand();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [item]);

  if (!item) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{ backgroundColor: 'transparent' }}
      handleIndicatorStyle={{ backgroundColor: 'rgba(255,255,255,0.2)', width: 40 }}
    >
      <BlurView intensity={80} tint="dark" className="flex-1 mx-2 mb-4 rounded-[3.5rem] border border-white/10 overflow-hidden shadow-2xl">
        <BottomSheetView className="flex-1 p-6">
          <View className="flex-row gap-6">
            {/* 📸 IMAGE STACK */}
            <View className="relative">
               <Image 
                 source={{ uri: item.photo }} 
                 className="w-32 h-44 rounded-3xl bg-white/5" 
                 resizeMode="cover"
               />
               {item.isVerified && (
                 <View className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-lg">
                    <Verified size={14} color="#007AFF" />
                 </View>
               )}
            </View>

            {/* 📝 INFO STACK */}
            <View className="flex-1 justify-between py-2">
              <View>
                <View className="flex-row items-center gap-1.5 mb-2">
                   <Text className="text-primary text-[9px] font-black uppercase tracking-[0.2em] italic">Premium Discover</Text>
                   {item.isVIP && <Text className="bg-yellow-400 text-black text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase">VIP</Text>}
                </View>
                <Text className="text-white text-3xl font-black italic uppercase tracking-tighter leading-none mb-3" numberOfLines={2}>
                  {item.title}
                </Text>
                
                <View className="flex-row items-center gap-2 mb-2">
                   <Star size={14} color="#FFD700" fill="#FFD700" />
                   <Text className="text-white/80 text-[11px] font-black">{item.rating || '4.9'}</Text>
                   <Text className="text-white/20 text-[10px] font-black uppercase tracking-widest">• {item.category}</Text>
                </View>

                <View className="flex-row items-center gap-1 opacity-40">
                   <MapPin size={10} color="white" />
                   <Text className="text-white text-[9px] font-bold uppercase tracking-widest">{item.distanceKm.toFixed(1)}km near you</Text>
                </View>
              </View>

              {/* ⚡ ACTION HUD */}
              <View className="flex-row gap-3">
                 <TouchableOpacity 
                   className="flex-1 h-14 bg-primary rounded-2xl items-center justify-center flex-row gap-2 shadow-xl border-t border-white/20"
                   onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)}
                 >
                    <Zap size={18} color="white" fill="white" />
                    <Text className="text-white font-black uppercase italic tracking-widest text-[11px]">Ignite</Text>
                 </TouchableOpacity>

                 <TouchableOpacity 
                   className="w-14 h-14 bg-white/10 rounded-2xl items-center justify-center border border-white/5"
                   onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                 >
                    <MessageCircle size={20} color="white" />
                 </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 🔗 QUICK REEL */}
          <View className="mt-8 pt-6 border-t border-white/5 flex-row justify-around">
             <TouchableOpacity className="items-center gap-1.5 opacity-40">
                <Heart size={18} color="white" />
                <Text className="text-white text-[7px] font-black uppercase tracking-widest">Savvy</Text>
             </TouchableOpacity>
             <TouchableOpacity className="items-center gap-1.5 opacity-40">
                <Share2 size={18} color="white" />
                <Text className="text-white text-[7px] font-black uppercase tracking-widest">Blast</Text>
             </TouchableOpacity>
             <TouchableOpacity className="items-center gap-1.5" onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)}>
                <View className="bg-primary/20 p-2 rounded-xl">
                   <Zap size={16} color="#EB4898" />
                </View>
                <Text className="text-primary text-[7px] font-black uppercase tracking-widest">Super ignite</Text>
             </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BlurView>
    </BottomSheet>
  );
}
