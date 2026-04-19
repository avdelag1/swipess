import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useMapStore } from '../src/store/useMapStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, Rect, LinearGradient, vec } from "@shopify/react-native-skia";
import { BlurView } from 'expo-blur';
import { Home, Bike, Briefcase, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'property', label: 'Properties', icon: Home, color: '#EB4898' },
  { id: 'motorcycle', label: 'Motos', icon: Bike, color: '#007AFF' },
  { id: 'bicycle', label: 'Bicycles', icon: Bike, color: '#34C759' },
  { id: 'services', label: 'Services', icon: Briefcase, color: '#FF9500' },
];

export default function NexusHub() {
  const router = useRouter();
  const { setRadiusKm, toggleFilter } = useMapStore();
  const [activeIdx, setActiveIdx] = useState(0);

  const handleLaunch = (catId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    toggleFilter(catId);
    router.push('/map-discovery');
  };

  return (
    <View className="flex-1 bg-black">
      {/* 🛸 CINEMATIC ATMOSPHERE */}
      <View className="absolute inset-0 opacity-40">
        <Canvas style={{ flex: 1 }}>
          <Rect x={0} y={0} width={width} height={height}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(width, height)}
              colors={["#EB489820", "#000000", "#007AFF20"]}
            />
          </Rect>
        </Canvas>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <View className="mb-12 items-center">
          <Text className="text-white text-5xl font-black italic uppercase tracking-tighter">Swipess</Text>
          <Text className="text-primary text-[10px] font-black uppercase tracking-[0.5em] mt-2 italic shadow-lg">Liquid Discovery Engine</Text>
        </View>

        {/* 🃏 POKER CARDS IN THE MIDDLE */}
        <View className="relative w-full aspect-[4/5] items-center justify-center">
          {CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            const isTop = idx === activeIdx;
            
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => handleLaunch(cat.id)}
                activeOpacity={0.9}
                className="absolute w-64 h-96 rounded-[3rem] overflow-hidden border border-white/20 shadow-2xl"
                style={{
                  transform: [
                    { rotate: `${(idx - activeIdx) * 12}deg` },
                    { translateX: (idx - activeIdx) * 30 },
                    { scale: isTop ? 1 : 0.9 },
                  ],
                  zIndex: CATEGORIES.length - idx,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                }}
              >
                <BlurView intensity={20} className="flex-1 items-center justify-center p-8">
                  <View className="w-20 h-20 rounded-full items-center justify-center bg-white/10 mb-6">
                    <Icon size={40} color={cat.color} strokeWidth={2.5} />
                  </View>
                  <Text className="text-white text-3xl font-black uppercase italic tracking-tighter text-center">{cat.label}</Text>
                  <View className="mt-8 flex-row items-center gap-2">
                    <Zap size={14} color={cat.color} fill={cat.color} />
                    <Text className="text-white/40 text-[9px] font-black uppercase tracking-widest">Tap to Ignite Radar</Text>
                  </View>
                </BlurView>
              </TouchableOpacity>
            );
          })}
        </View>

        <View className="mt-16 flex-row gap-4">
          <TouchableOpacity 
            className="px-8 py-4 rounded-full bg-white/5 border border-white/10"
            onPress={() => setActiveIdx((prev) => (prev + 1) % CATEGORIES.length)}
          >
            <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest italic">Cycle Nexus</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 🧭 BOTTOM SAFE AREA CONTROLS */}
      <View className="absolute bottom-12 inset-x-0 items-center">
         <Text className="text-white/20 text-[8px] font-black uppercase tracking-[0.4em]">Nexus Core v1.0.95 — Apple Store Flagship</Text>
      </View>
    </View>
  );
}
