import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableWithoutFeedback, 
  Animated, 
  Dimensions 
} from 'react-native';
import EnhancedHeartAnimation from '../feed/EnhancedHeartAnimation';

const { width, height } = Dimensions.get('window');

/**
 * Enhanced video controls with tap detection zones
 * Supports single tap, double tap, and swipe actions
 */
const VideoControls = ({ 
  onSingleTap, 
  onDoubleTap, 
  onLongPress,
  onSwipeUp,
  onSwipeDown,
  children 
}) => {
  // State to track taps
  const [showLeftHeart, setShowLeftHeart] = useState(false);
  const [showRightHeart, setShowRightHeart] = useState(false);
  const [showCenterHeart, setShowCenterHeart] = useState(false);
  
  // Refs for touch tracking
  const lastTapTimeRef = useRef({
    left: 0,
    center: 0,
    right: 0
  });
  const touchStartRef = useRef({
    x: 0,
    y: 0,
    time: 0
  });
  const longPressTimeoutRef = useRef(null);
  
  // Ref for animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  // Handle touch start
  const handleTouchStart = (e, zone) => {
    const { pageX, pageY } = e.nativeEvent;
    
    // Record touch start position and time
    touchStartRef.current = {
      x: pageX,
      y: pageY,
      time: Date.now(),
      zone
    };
    
    // Set up long press timeout
    if (onLongPress) {
      longPressTimeoutRef.current = setTimeout(() => {
        onLongPress(zone);
      }, 600); // 600ms is typical long press threshold
    }
  };
  
  // Handle touch end
  const handleTouchEnd = (e, zone) => {
    // Clear long press timeout
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
    
    const { pageX, pageY } = e.nativeEvent;
    const touchStart = touchStartRef.current;
    const touchTime = Date.now() - touchStart.time;
    
    // Calculate distance moved
    const deltaX = pageX - touchStart.x;
    const deltaY = pageY - touchStart.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // If touch moved significantly, handle as swipe
    if (distance > 50) {
      // Determine swipe direction
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        // Vertical swipe
        if (deltaY < -50 && onSwipeUp) {
          onSwipeUp(touchStart.zone);
          return;
        } else if (deltaY > 50 && onSwipeDown) {
          onSwipeDown(touchStart.zone);
          return;
        }
      }
      // No need to handle horizontal swipes in this component
      return;
    }
    
    // Handle as tap if touch was brief and didn't move much
    if (touchTime < 300 && distance < 10) {
      const now = Date.now();
      const lastTap = lastTapTimeRef.current[zone] || 0;
      const timeDiff = now - lastTap;
      
      // Check if this is a double tap (time difference less than 300ms)
      if (timeDiff < 300) {
        // Double tap detected
        handleDoubleTap(zone);
      } else {
        // Single tap detected
        // Wait a bit to see if there's a second tap coming
        setTimeout(() => {
          const lastTapUpdated = lastTapTimeRef.current[zone];
          // Only trigger single tap if no second tap occurred
          if (now === lastTapUpdated && onSingleTap) {
            onSingleTap(zone);
          }
        }, 300);
      }
      
      // Update last tap time
      lastTapTimeRef.current[zone] = now;
    }
  };
  
  // Handle double tap
  const handleDoubleTap = (zone) => {
    if (onDoubleTap) {
      onDoubleTap(zone);
    }
    
    // Show heart animation based on tap zone
    switch (zone) {
      case 'left':
        setShowLeftHeart(true);
        break;
      case 'center':
        setShowCenterHeart(true);
        break;
      case 'right':
        setShowRightHeart(true);
        break;
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Left tap zone */}
      <TouchableWithoutFeedback
        onPressIn={(e) => handleTouchStart(e, 'left')}
        onPressOut={(e) => handleTouchEnd(e, 'left')}
      >
        <View style={styles.leftZone} />
      </TouchableWithoutFeedback>
      
      {/* Center tap zone */}
      <TouchableWithoutFeedback
        onPressIn={(e) => handleTouchStart(e, 'center')}
        onPressOut={(e) => handleTouchEnd(e, 'center')}
      >
        <View style={styles.centerZone} />
      </TouchableWithoutFeedback>
      
      {/* Right tap zone */}
      <TouchableWithoutFeedback
        onPressIn={(e) => handleTouchStart(e, 'right')}
        onPressOut={(e) => handleTouchEnd(e, 'right')}
      >
        <View style={styles.rightZone} />
      </TouchableWithoutFeedback>
      
      {/* Heart animations */}
      <EnhancedHeartAnimation
        isVisible={showLeftHeart}
        position="custom"
        size="medium"
        onAnimationEnd={() => setShowLeftHeart(false)}
        style={styles.leftHeart}
      />
      
      <EnhancedHeartAnimation
        isVisible={showCenterHeart}
        position="center"
        size="large"
        onAnimationEnd={() => setShowCenterHeart(false)}
      />
      
      <EnhancedHeartAnimation
        isVisible={showRightHeart}
        position="custom"
        size="medium"
        onAnimationEnd={() => setShowRightHeart(false)}
        style={styles.rightHeart}
      />
      
      {/* Child components */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  leftZone: {
    flex: 1,
    height: '100%',
  },
  centerZone: {
    flex: 1,
    height: '100%',
  },
  rightZone: {
    flex: 1,
    height: '100%',
  },
  leftHeart: {
    position: 'absolute',
    top: '40%',
    left: '25%',
  },
  rightHeart: {
    position: 'absolute',
    top: '40%',
    right: '25%',
  },
});

export default VideoControls;