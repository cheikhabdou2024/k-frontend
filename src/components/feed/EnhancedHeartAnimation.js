import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

/**
 * Enhanced heart animation component for double-tap like feature
 * Shows a scaling, rotating and fading heart icon when triggered
 */
const EnhancedHeartAnimation = ({ 
  isVisible, 
  onAnimationEnd, 
  size = 'large', 
  position = 'center',
  color = '#FE2C55'
}) => {
  // Animated values for scale, opacity and rotation
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // State to track animation completion
  const [inProgress, setInProgress] = useState(false);
  
  // Determine size based on prop
  const heartSize = {
    small: 60,
    medium: 90,
    large: 120
  }[size] || 90;
  
  // Position of the heart (center is default)
  const positionStyle = {
    center: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    custom: {},  // Custom position can be passed via style prop
  }[position] || { alignItems: 'center', justifyContent: 'center' };
  
  // Run animation sequence when visibility changes
  useEffect(() => {
    if (isVisible && !inProgress) {
      setInProgress(true);
      
      // Reset animation values
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      rotateAnim.setValue(0);
      
      // Run animation sequence
      Animated.parallel([
        // Scale animation
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 150,
            useNativeDriver: true,
            easing: Easing.out(Easing.back(1.5)),
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        
        // Opacity animation
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.delay(500),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        
        // Rotation animation
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
      ]).start(() => {
        // Animation complete
        setInProgress(false);
        if (onAnimationEnd) {
          onAnimationEnd();
        }
      });
    }
  }, [isVisible, inProgress]);
  
  // Calculate rotation for the heart
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-20deg', '0deg'],
  });
  
  // Don't render if not visible and not in progress
  if (!isVisible && !inProgress) return null;
  
  return (
    <View style={[styles.container, positionStyle]}>
      <Animated.View
        style={[
          styles.heartContainer,
          { 
            width: heartSize,
            height: heartSize,
            transform: [
              { scale: scaleAnim },
              { rotate }
            ],
            opacity: opacityAnim,
          }
        ]}
      >
        <Ionicons
          name="heart"
          size={heartSize}
          color={color}
          style={styles.heartIcon}
        />
      </Animated.View>
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
    shadowOpacity: 0.6,
    shadowRadius: 15,
  }
});

export default EnhancedHeartAnimation;