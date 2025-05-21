import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

/**
 * Enhanced play/pause indicator component
 * Shows an animated play or pause icon when video state changes
 */
const PlayPauseIndicator = ({ 
  isPlaying, 
  isVisible = false,
  size = 'small' 
}) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  // Determine icon size based on prop
  const iconSize = {
    small: 40,
    medium: 60,
    large: 80
  }[size] || 60;
  
  // Run animation when visibility changes
  useEffect(() => {
    if (isVisible) {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      
      // Run animation sequence
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300, 
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(600),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [isVisible]);

  if (!isVisible) return null;
  
  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name={isPlaying ? 'play' : 'pause'} 
          size={iconSize} 
          color="white" 
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PlayPauseIndicator;