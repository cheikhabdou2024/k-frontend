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
  duration={400} // Increase from 300 to 400
  easing="ease-in-out" // Add easing
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
    duration={1200} // Adjust for smoother rotation
    easing="linear"
    style={styles.spinner}
  >
    <View style={[
      styles.arc,
      { width: spinnerSize * 0.9, height: spinnerSize * 0.9 }
    ]} />
  </Animatable.View>
      
      {/* Center dot with pulse animation */}
  <Animatable.View
    animation="pulse"
    iterationCount="infinite"
    duration={1500}
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
     backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 100,
  },
  spinner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  }, 
  arc: {
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 100,
    borderTopColor: 'transparent',
    borderRightColor: 'rgba(255, 255, 255, 0.6)',
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  centerDot: {
    position: 'absolute',
    backgroundColor: '#FE2C55', // TikTok red
    borderRadius: 100,
     shadowColor: '#FE2C55',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
});

export default VideoLoadingSpinner;