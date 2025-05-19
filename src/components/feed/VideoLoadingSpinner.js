import React from 'react';
import { View, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';

/**
 * Custom loading spinner component for video playback
 * Shows an animated loading indicator while videos are buffering
 */
const VideoLoadingSpinner = ({ isVisible = false, size = 'medium' }) => {
  // Don't render anything if not visible
  if (!isVisible) return null;
  
  // Determine size based on prop
  const spinnerSize = {
    small: 30,
    medium: 50,
    large: 70
  }[size] || 50;
  
  return (
    <Animatable.View
      animation="fadeIn"
      duration={300}
      style={[
        styles.container,
        { 
          width: spinnerSize, 
          height: spinnerSize,
          marginLeft: -spinnerSize/2,
          marginTop: -spinnerSize/2
        }
      ]}
    >
      {/* Outer circle with animated rotation */}
      <Animatable.View
        animation="rotate"
        iterationCount="infinite"
        duration={1500}
        easing="linear"
        style={styles.spinner}
      >
        <View style={[
          styles.arc,
          { width: spinnerSize * 0.9, height: spinnerSize * 0.9 }
        ]} />
      </Animatable.View>
      
      {/* Center dot */}
      <View
        style={[
          styles.centerDot,
          { width: spinnerSize * 0.15, height: spinnerSize * 0.15 }
        ]}
      />
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  spinner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arc: {
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 100,
    borderTopColor: 'transparent',
    borderRightColor: 'rgba(255, 255, 255, 0.4)',
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  centerDot: {
    position: 'absolute',
    backgroundColor: '#FE2C55', // TikTok red
    borderRadius: 100,
  },
});

export default VideoLoadingSpinner;