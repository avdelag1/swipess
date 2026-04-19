import { useSharedValue, useDerivedValue, withSpring, runOnJS } from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';
import { useMapStore } from '../store/useMapStore';
import * as Haptics from 'expo-haptics';

export function useRadiusGesture() {
  const { radiusKm, setRadiusKm } = useMapStore();
  
  // Shared value for the radius being dragged (internal)
  const draggingRadius = useSharedValue(radiusKm);
  
  // Convert KM to a UI offset or scale if needed, 
  // but we'll use km directly to update the store debounced.
  
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Logic: vertical drag determines radius change. 
      // Up = larger, Down = smaller (inverted logic for natural feel)
      const sensitivity = 0.05;
      const delta = -event.translationY * sensitivity;
      const nextRadius = Math.max(1, Math.min(100, draggingRadius.value + delta));
      
      if (Math.floor(nextRadius) !== Math.floor(draggingRadius.value)) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }
      
      draggingRadius.value = nextRadius;
    })
    .onEnd(() => {
      // Snapping logic
      const snapped = Math.round(draggingRadius.value);
      draggingRadius.value = withSpring(snapped);
      runOnJS(setRadiusKm)(snapped);
      runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
    });

  const animatedRadius = useDerivedValue(() => {
    return draggingRadius.value;
  });

  return { panGesture, animatedRadius };
}
