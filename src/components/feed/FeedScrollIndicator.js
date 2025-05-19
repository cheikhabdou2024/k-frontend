import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

/**
 * Custom scroll indicator for the video feed
 * Shows a subtle vertical indicator of current position in the feed
 */
const FeedScrollIndicator = ({ 
  currentIndex = 0, 
  totalVideos = 0, 
  scrollY = new Animated.Value(0),
  height = 150
}) => {
  if (totalVideos <= 1) return null;
  
  // Calculate the height of each indicator dot and spacing
  const indicatorHeight = height / totalVideos;
  const activeIndicatorHeight = indicatorHeight * 1.5;
  
  return (
    <View style={[styles.container, { height }]}>
      {/* Background track */}
      <View style={styles.track} />
      
      {/* Active indicator */}
      <Animated.View 
        style={[
          styles.activeIndicator, 
          { 
            height: activeIndicatorHeight,
            transform: [
              { 
                translateY: Animated.multiply(
                  scrollY, 
                  (height - activeIndicatorHeight) / (totalVideos - 1) / Animated.divide(scrollY, currentIndex || 1)
                )
              }
            ]
          }
        ]}
      />
      
      {/* Indicator dots */}
      {Array.from({ length: totalVideos }).map((_, index) => (
        <View 
          key={`indicator-${index}`}
          style={[
            styles.indicatorDot,
            {
              top: index * indicatorHeight + (indicatorHeight - 4) / 2,
              backgroundColor: currentIndex === index ? 'rgba(255, 255, 255, 0)' : 'rgba(255, 255, 255, 0.4)'
            }
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 8,
    top: '40%',
    width: 4,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  track: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
  },
  activeIndicator: {
    position: 'absolute',
    width: 4,
    backgroundColor: '#FE2C55',
    borderRadius: 2,
    left: 0,
  },
  indicatorDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  }
});

export default FeedScrollIndicator;