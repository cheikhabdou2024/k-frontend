import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

/**
 * Video progress bar component
 * Shows playback progress at bottom of video
 */
const ProgressBar = ({ 
  progress = 0, // Value from 0 to 1
  isVisible = true,
  color = '#FE2C55',
  height = 3
}) => {
  // Animation for smooth progress updates
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Update animation when progress changes
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [progress]);
  
  if (!isVisible) return null;
  
  return (
    <View style={[styles.container, { height }]}>
      <Animated.View 
        style={[
          styles.progress, 
          { 
            backgroundColor: color,
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }) 
          }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 10,
  },
  progress: {
    height: '100%',
  },
});

export default ProgressBar;