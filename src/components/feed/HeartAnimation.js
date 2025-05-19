import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import Ionicons from 'react-native-vector-icons/Ionicons';

/**
 * Heart animation component for double-tap like feature
 * Displays a scaling and fading heart icon when triggered
 */
const HeartAnimation = ({ isVisible, onAnimationEnd, size = 'large', position = 'center' }) => {
  // Reference to control the animation
  const heartRef = useRef(null);
  
  // Determine size based on prop
  const heartSize = {
    small: 50,
    medium: 80,
    large: 100
  }[size] || 80;
  
  // Position of the heart (center is default)
  const positionStyle = {
    center: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    custom: {},  // Custom position can be passed via style prop
  }[position] || { alignItems: 'center', justifyContent: 'center' };
  
  // When visibility changes to true, trigger animation
  useEffect(() => {
    if (isVisible && heartRef.current) {
      // Play the animation sequence
      heartRef.current.animate(
        {
          0: { opacity: 0, scale: 0.3 },
          0.3: { opacity: 1, scale: 1.1 },
          0.6: { opacity: 1, scale: 0.9 },
          0.8: { opacity: 1, scale: 1 },
          1: { opacity: 0, scale: 0.3 }
        },
        800
      ).then(() => {
        // Notify parent component when animation ends
        if (onAnimationEnd) {
          onAnimationEnd();
        }
      });
    }
  }, [isVisible, onAnimationEnd]);
  
  if (!isVisible) return null;
  
  return (
    <View style={[styles.container, positionStyle]}>
      <Animatable.View
        ref={heartRef}
        style={[styles.heartContainer, { width: heartSize, height: heartSize }]}
        useNativeDriver={true}
      >
        <Ionicons
          name="heart"
          size={heartSize}
          color="#FE2C55" // TikTok red
          style={styles.heartIcon}
        />
      </Animatable.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    pointerEvents: 'none', // Allows taps to pass through
  },
  heartContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  }
});

export default HeartAnimation;