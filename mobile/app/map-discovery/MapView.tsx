import React, { useRef, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { useMapStore, DiscoverItem } from '../../../src/store/useMapStore';
import { useRadiusGesture } from '../../../src/hooks/useRadiusGesture';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';

// User specified the token in the prompt
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '');

interface MapViewProps {
  items: DiscoverItem[];
  onItemSelect: (item: DiscoverItem) => void;
}

export function MapDiscoveryView({ items, onItemSelect }: MapViewProps) {
  const { userLocation, radiusKm, vibe } = useMapStore();
  const cameraRef = useRef<Mapbox.Camera>(null);
  
  const { panGesture, animatedRadius } = useRadiusGesture();

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

  // ANIMATED STYLES FOR RADAR PULSE
  const radarStyle = useAnimatedStyle(() => ({
     // We can't easily animate Mapbox layers via Reanimated directly without
     // using the 'style' prop or custom layers. 
     // For radius resize, we'll update the 'circle-radius' property via props.
     transform: [{ scale: 1 }]
  }));

  return (
    <View className="flex-1 bg-black">
      <Mapbox.MapView 
        style={styles.map} 
        styleURL={vibe === 'dark' ? Mapbox.StyleURL.Dark : Mapbox.StyleURL.Street}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <Mapbox.Camera
          ref={cameraRef}
          zoomLevel={12}
          centerCoordinate={userLocation ? [userLocation.lng, userLocation.lat] : undefined}
          animationMode="flyTo"
          animationDuration={2000}
        />

        {/* 🆘 USER LOCATION PULSE */}
        {userLocation && (
           <Mapbox.PointAnnotation id="user-location" coordinate={[userLocation.lng, userLocation.lat]}>
              <View className="w-6 h-6 bg-primary/20 rounded-full items-center justify-center">
                 <View className="w-3 h-3 bg-primary rounded-full border-2 border-white" />
              </View>
           </Mapbox.PointAnnotation>
        )}

        {/* 🎯 NEXUS SEARCH RADIUS */}
        {userLocation && (
          <Mapbox.ShapeSource
            id="radiusSource"
            shape={{
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [userLocation.lng, userLocation.lat]
              },
              properties: {}
            }}
          >
            <Mapbox.CircleLayer
              id="radiusFill"
              style={{
                circleRadius: radiusKm * 100, // Approximate screen-space or use meters
                circleColor: '#EB4898',
                circleOpacity: 0.1,
                circleStrokeColor: '#EB4898',
                circleStrokeWidth: 2
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {/* 📍 CLUSTERED MARKERS */}
        <Mapbox.ShapeSource
          id="itemSource"
          cluster
          clusterRadius={50}
          clusterMaxZoom={14}
          shape={featureCollection as any}
          onPress={(e) => {
             const feature = e.features[0];
             if (feature && feature.properties && !feature.properties.cluster) {
                onItemSelect(feature.properties as DiscoverItem);
             }
          }}
        >
          {/* Cluster Circles */}
          <Mapbox.CircleLayer
            id="clusteredPoints"
            belowLayerID="pointCount"
            filter={['has', 'point_count']}
            style={{
              circleColor: '#EB4898',
              circleRadius: 20,
              circleOpacity: 0.6,
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
            }}
          />

          {/* Individual Pins */}
          <Mapbox.CircleLayer
             id="unclusteredPoints"
             filter={['!', ['has', 'point_count']]}
             style={{
                circleRadius: 8,
                circleColor: '#007AFF',
                circleStrokeWidth: 3,
                circleStrokeColor: 'white',
                circleOpacity: 0.8
             }}
          />
        </Mapbox.ShapeSource>

        {/* 🕹️ INTERACTIVE RADIUS HANDLE (FINGER RESIZE) */}
        {userLocation && (
          <Mapbox.PointAnnotation 
            id="radius-handle" 
            coordinate={[userLocation.lng, userLocation.lat + (radiusKm * 0.009)]} // Approx offset for radius
          >
            <GestureDetector gesture={panGesture}>
               <Animated.View 
                 className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-xl border-4 border-primary"
                 style={radarStyle}
               >
                  <View className="w-1.5 h-6 bg-primary rounded-full opacity-20" />
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
