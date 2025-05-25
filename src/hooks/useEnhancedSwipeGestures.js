// src/hooks/useEnhancedSwipeGestures.js
import { useRef, useCallback } from 'react';
import { Dimensions, PanResponder } from 'react-native';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Configuration for swipe behavior
const SWIPE_CONFIG = {
  // Horizontal swipe (tab switching)
  HORIZONTAL_THRESHOLD: SCREEN_WIDTH * 0.25, // 25% of screen width
  HORIZONTAL_VELOCITY_THRESHOLD: 0.5,
  
  // Vertical swipe (video navigation)
  VERTICAL_THRESHOLD: SCREEN_HEIGHT * 0.15, // 15% of screen height
  VERTICAL_VELOCITY_THRESHOLD: 0.8,
  
  // Haptic feedback settings
  HAPTIC_ENABLED: true,
  HAPTIC_INTENSITY: 'medium',
};

export const useEnhancedSwipeGestures = ({
  onSwipeUp,
  onSwipeDown,
  onSwipeLeft,
  onSwipeRight,
  onSwipeStart,
  onSwipeEnd,
  disabled = false,
}) => {
  const swipeStartRef = useRef(null);
  const lastHapticRef = useRef(0);
  const isSwipingRef = useRef(false);

  // Haptic feedback with throttling
  const triggerHaptic = useCallback((type = 'light') => {
    if (!SWIPE_CONFIG.HAPTIC_ENABLED || disabled) return;
    
    const now = Date.now();
    if (now - lastHapticRef.current < 100) return; // Throttle haptics
    
    lastHapticRef.current = now;
    
    switch (type) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'selection':
        Haptics.selectionAsync();
        break;
    }
  }, [disabled]);

  // Calculate swipe direction and distance
  const calculateSwipe = useCallback((gestureState) => {
    const { dx, dy, vx, vy } = gestureState;
    
    // Determine if it's more horizontal or vertical
    const isHorizontal = Math.abs(dx) > Math.abs(dy);
    const isVertical = Math.abs(dy) > Math.abs(dx);
    
    return {
      isHorizontal,
      isVertical,
      deltaX: dx,
      deltaY: dy,
      velocityX: vx,
      velocityY: vy,
      distance: Math.sqrt(dx * dx + dy * dy),
    };
  }, []);

  // Enhanced pan responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (disabled) return false;
        
        const { dx, dy } = gestureState;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Only start gesture if movement is significant
        return distance > 10;
      },
      
      onPanResponderGrant: (evt, gestureState) => {
        isSwipingRef.current = true;
        swipeStartRef.current = {
          x: evt.nativeEvent.pageX,
          y: evt.nativeEvent.pageY,
          timestamp: Date.now(),
        };
        
        // Light haptic feedback on swipe start
        triggerHaptic('light');
        
        if (onSwipeStart) {
          onSwipeStart({
            x: evt.nativeEvent.pageX,
            y: evt.nativeEvent.pageY,
          });
        }
      },
      
      onPanResponderMove: (evt, gestureState) => {
        if (!isSwipingRef.current) return;
        
        const swipe = calculateSwipe(gestureState);
        
        // Trigger medium haptic when crossing thresholds
        if (swipe.isHorizontal && Math.abs(swipe.deltaX) > SWIPE_CONFIG.HORIZONTAL_THRESHOLD) {
          triggerHaptic('medium');
        } else if (swipe.isVertical && Math.abs(swipe.deltaY) > SWIPE_CONFIG.VERTICAL_THRESHOLD) {
          triggerHaptic('medium');
        }
      },
      
      onPanResponderRelease: (evt, gestureState) => {
        if (!isSwipingRef.current) return;
        
        const swipe = calculateSwipe(gestureState);
        isSwipingRef.current = false;
        
        // Determine swipe direction based on distance and velocity
        let swipeDetected = false;
        
        // Horizontal swipes (tab switching)
        if (swipe.isHorizontal) {
          const meetsDistanceThreshold = Math.abs(swipe.deltaX) > SWIPE_CONFIG.HORIZONTAL_THRESHOLD;
          const meetsVelocityThreshold = Math.abs(swipe.velocityX) > SWIPE_CONFIG.HORIZONTAL_VELOCITY_THRESHOLD;
          
          if (meetsDistanceThreshold || meetsVelocityThreshold) {
            if (swipe.deltaX > 0 && onSwipeRight) {
              // Swipe right - go to previous tab
              triggerHaptic('selection');
              onSwipeRight(swipe);
              swipeDetected = true;
            } else if (swipe.deltaX < 0 && onSwipeLeft) {
              // Swipe left - go to next tab
              triggerHaptic('selection');
              onSwipeLeft(swipe);
              swipeDetected = true;
            }
          }
        }
        
        // Vertical swipes (video navigation)
        if (swipe.isVertical && !swipeDetected) {
          const meetsDistanceThreshold = Math.abs(swipe.deltaY) > SWIPE_CONFIG.VERTICAL_THRESHOLD;
          const meetsVelocityThreshold = Math.abs(swipe.velocityY) > SWIPE_CONFIG.VERTICAL_VELOCITY_THRESHOLD;
          
          if (meetsDistanceThreshold || meetsVelocityThreshold) {
            if (swipe.deltaY > 0 && onSwipeDown) {
              // Swipe down - go to previous video
              triggerHaptic('light');
              onSwipeDown(swipe);
              swipeDetected = true;
            } else if (swipe.deltaY < 0 && onSwipeUp) {
              // Swipe up - go to next video
              triggerHaptic('light');
              onSwipeUp(swipe);
              swipeDetected = true;
            }
          }
        }
        
        if (onSwipeEnd) {
          onSwipeEnd({
            swipeDetected,
            direction: swipe.isHorizontal ? 'horizontal' : 'vertical',
            ...swipe,
          });
        }
      },
      
      onPanResponderTerminate: () => {
        isSwipingRef.current = false;
        if (onSwipeEnd) {
          onSwipeEnd({ swipeDetected: false, terminated: true });
        }
      },
    })
  ).current;

  // Return pan responder and utility functions
  return {
    panHandlers: panResponder.panHandlers,
    isSwiming: isSwipingRef.current,
    triggerHaptic,
    swipeConfig: SWIPE_CONFIG,
  };
};