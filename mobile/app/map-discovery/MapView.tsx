import React, { useRef, useMemo, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { useMapStore, DiscoverItem } from '../../../src/store/useMapStore';
import { useRadiusGesture } from '../../../src/hooks/useRadiusGesture';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

// 🗝️ OFFICIAL MAPBOX ACCESS
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || "");

interface MapViewProps {
  items: DiscoverItem[];
  onItemSelect: (item: DiscoverItem) => void;
}

/**
 * 🛰️ RADAR NEXUS ENGINE v2.0
 * High-performance Mapbox discovery with geodesic radius and clustering.
 */
export function MapDiscoveryView({ items, onItemSelect }: MapViewProps) {
  const { userLocation, radiusKm, vibe, dashboardMode } = useMapStore();
  const cameraRef = useRef<Mapbox.Camera>(null);
  
  const { panGesture, animatedRadius } = useRadiusGesture();

  // 💎 DATA TRANSFORM: Clusters & Points
  const featureCollection = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: items.map(item => ({
        type: 'Feature',
        id: item.id,
        properties: { ...item },
        geometry: {
          type: 'Point',
          coordinates: [item.lng, item.lat]
        }
      }))
    };
  }, [items]);

  // 📏 GEODESIC CIRCLE GENERATOR (Accurate meters)
  const radiusCircle = useMemo(() => {
    if (!userLocation) return null;
    const center = [userLocation.lng, userLocation.lat];
    const points = 64;
    const coords = [];
    const distance = radiusKm / 6371; // Earth radius in KM
    const lat1 = (center[1] * Math.PI) / 180;
    const lon1 = (center[0] * Math.PI) / 180;

    for (let i = 0; i <= points; i++) {
        const bearing = (i * 360) / points * Math.PI / 180;
        const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distance) + Math.cos(lat1) * Math.sin(distance) * Math.cos(bearing));
        const lon2 = lon1 + Math.atan2(Math.sin(bearing) * Math.sin(distance) * Math.cos(lat1), Math.cos(distance) - Math.sin(lat1) * Math.sin(lat2));
        coords.push([(lon2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
    }

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coords]
      }
    };
  }, [userLocation, radiusKm]);

  return (
    <View className="flex-1 bg-black">
      <Mapbox.MapView 
        style={styles.map} 
        styleURL={vibe === 'dark' ? Mapbox.StyleURL.Dark : Mapbox.StyleURL.Light}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
      >
        <Mapbox.Camera
          ref={cameraRef}
          zoomLevel={12 - (radiusKm / 20)}
          centerCoordinate={userLocation ? [userLocation.lng, userLocation.lat] : undefined}
          animationMode="flyTo"
          animationDuration={1500}
        />

        {/* 🆘 USER CORE */}
        {userLocation && (
           <Mapbox.PointAnnotation id="user-location" coordinate={[userLocation.lng, userLocation.lat]}>
              <View className="w-10 h-10 items-center justify-center">
                 <View className="absolute w-8 h-8 rounded-full bg-primary/20 border border-primary/40 scale-125 opacity-40" />
                 <View className="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-xl" />
              </View>
           </Mapbox.PointAnnotation>
        )}

        {/* 🎯 NEXUS RADAR FIELD (Geodesic Fill) */}
        {radiusCircle && (
          <Mapbox.ShapeSource id="radiusSource" shape={radiusCircle as any}>
            <Mapbox.FillLayer
              id="radiusFill"
              style={{
                fillColor: dashboardMode === 'client' ? '#EB4898' : '#007AFF',
                fillOpacity: 0.12,
              }}
            />
            <Mapbox.LineLayer
              id="radiusLine"
              style={{
                lineColor: dashboardMode === 'client' ? '#EB4898' : '#007AFF',
                lineWidth: 2,
                lineDasharray: [4, 4],
                lineOpacity: 0.8,
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {/* 📍 CLUSTERED INTELLIGENCE */}
        <Mapbox.ShapeSource
          id="itemSource"
          cluster
          clusterRadius={60}
          clusterMaxZoom={15}
          shape={featureCollection as any}
          onPress={(e) => {
             const feature = e.features[0];
             if (feature && feature.properties && !feature.properties.cluster) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onItemSelect(feature.properties as DiscoverItem);
             }
          }}
        >
          {/* Cluster Disks */}
          <Mapbox.CircleLayer
            id="clusteredPoints"
            belowLayerID="pointCount"
            filter={['has', 'point_count']}
            style={{
              circleColor: dashboardMode === 'client' ? '#EB4898' : '#007AFF',
              circleRadius: 24,
              circleOpacity: 0.7,
              circleStrokeWidth: 2,
              circleStrokeColor: 'white',
            }}
          />

          <Mapbox.SymbolLayer
            id="pointCount"
            style={{
              textField: ['get', 'point_count_abbreviated'],
              textSize: 12,
              textColor: 'white',
              textFont: ['DIN Offc Pro Bold'],
            }}
          />

          {/* Individual Discovery Nodes */}
          <Mapbox.CircleLayer
             id="unclusteredPoints"
             filter={['!', ['has', 'point_count']]}
             style={{
                circleRadius: 10,
                circleColor: dashboardMode === 'client' ? '#EB4898' : '#007AFF',
                circleStrokeWidth: 4,
                circleStrokeColor: 'white',
                circleOpacity: 1,
                circleBlur: 0.1,
             }}
          />
        </Mapbox.ShapeSource>

        {/* 🕹️ RADIUS RESIZE GRABBER (High Performance) */}
        {userLocation && (
          <Mapbox.PointAnnotation 
            id="radius-grabber" 
            coordinate={[userLocation.lng, userLocation.lat + (radiusKm * 0.0089)]}
          >
            <GestureDetector gesture={panGesture}>
              <Animated.View 
                className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-2xl border-4 border-primary"
              >
                 <View className="w-1.5 h-6 bg-primary rounded-full" />
              </Animated.View>
            </GestureDetector>
          </Mapbox.PointAnnotation>
        )}

      </Mapbox.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1
  }
});
