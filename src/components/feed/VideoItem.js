// src/components/feed/VideoItem.js - Updated with Adaptive Video
import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Animated  } from 'react-native';
import SimpleAdaptiveVideo from '../video/SimpleAdaptiveVideo'; // Using the simple version
import { PanGestureHandler, TapGestureHandler, State } from 'react-native-gesture-handler';
import EnhancedFeedHeader from './EnhancedFeedHeader';
import VideoOverlays from './VideoOverlays';
import VideoActionButtons from './VideoActionButton';
import VideoInfo from './VideoInfo';
import * as Haptics from 'expo-haptics';
import VideoSkeletonLoader from '../loading/VideoSkeletonLoader';



const { width, height } = Dimensions.get('window');

const VideoItem = ({
  item,
  index,
  currentIndex,
  activeTab,
  onTabChange,
  insets,
  videoLoading,
  showHeartAnimation,
  showPlayPauseIndicator,
  isVideoPaused,
  playbackStatus,
  bookmark,
  videoRefs,
  onVideoTap,
  onVideoLoadStart,
  onVideoLoad,
  onVideoError,
  onPlaybackStatusUpdate,
  onUserProfilePress,
  onLikeVideo,
  onCommentPress,
  onBookmarkPress,
  onSharePress,
  onSoundPress,
  onHeartAnimationEnd,
  onSwipeUp,
  onSwipeDown,
}) => {
  const isActive = index === currentIndex;
  const isVideoLoading = videoLoading[item.id];
  const isHeartAnimationVisible = showHeartAnimation[item.id] || false;
  const isBookmarked = bookmark[item.id] || false;

  // Animation refs
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const tapAnim = useRef(new Animated.Value(1)).current;
  const swipeProgressAnim = useRef(new Animated.Value(0)).current;
  
  // Gesture refs
  const doubleTapRef = useRef();
  const singleTapRef = useRef();
  const panRef = useRef();
  
  // State
  const [isPressed, setIsPressed] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);

   // Reset animations when video becomes active/inactive
  useEffect(() => {
    if (isActive) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [isActive]);


  // Enhanced video load handler
  const handleVideoLoad = (status) => {
    console.log(`📹 Video ${item.id} loaded:`, {
      duration: status.durationMillis,
      dimensions: status.naturalSize,
      isLoaded: status.isLoaded
    });
    
    if (onVideoLoad) {
      onVideoLoad(item.id);
    }
  };

  // Enhanced video load start handler
  const handleVideoLoadStart = () => {
    console.log(`📹 Video ${item.id} started loading...`);
    
    if (onVideoLoadStart) {
      onVideoLoadStart(item.id);
    }
  };

  // Enhanced video error handler
  const handleVideoError = (error) => {
    console.error(`❌ Video ${item.id} failed to load:`, error);
    
    if (onVideoError) {
      onVideoError(item.id, error);
    }
  };
  

  // Enhanced tap handling
  const handleSingleTap = ({ nativeEvent }) => {
    if (nativeEvent.state === State.ACTIVE) {
      // Light haptic feedback for single tap
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Animate tap feedback
      Animated.sequence([
        Animated.timing(tapAnim, {
          toValue: 0.98,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(tapAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Call parent tap handler
      onVideoTap(item.id);
    }
  };

  const handleDoubleTap = ({ nativeEvent }) => {
    if (nativeEvent.state === State.ACTIVE) {
      // Medium haptic feedback for double tap (like)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Animate heart scale
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Trigger like with double tap animation
      onLikeVideo(item.id, true);
    }
  };

  // Enhanced swipe handling
  const handlePanGesture = ({ nativeEvent }) => {
    const { translationY, velocityY, state } = nativeEvent;
    
    if (state === State.ACTIVE) {
      // Update swipe progress
      const progress = Math.abs(translationY) / (height * 0.3);
      const clampedProgress = Math.min(progress, 1);
      
      swipeProgressAnim.setValue(clampedProgress);
      
      // Determine swipe direction
      if (Math.abs(translationY) > 50) {
        const direction = translationY > 0 ? 'down' : 'up';
        if (direction !== swipeDirection) {
          setSwipeDirection(direction);
          // Light haptic feedback when direction is determined
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } else if (state === State.END) {
      // Reset swipe progress
      Animated.spring(swipeProgressAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      
      setSwipeDirection(null);
      
      // Check if swipe threshold is met
      const threshold = height * 0.15;
      const velocityThreshold = 800;
      
      const shouldSwipe = 
        Math.abs(translationY) > threshold || 
        Math.abs(velocityY) > velocityThreshold;
      
      if (shouldSwipe) {
        // Medium haptic feedback for successful swipe
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        if (translationY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (translationY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    }
  };

  // Press animation handlers
  const handlePressIn = () => {
    setIsPressed(true);
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };


  return (
   <Animated.View 
      style={[
        styles.videoContainer,
        {
          transform: [
            { scale: scaleAnim },
            { 
              scale: tapAnim 
            },
            {
              translateY: swipeProgressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, swipeDirection === 'up' ? -20 : 20],
              })
            }
          ]
        }
      ]}
    >
      <PanGestureHandler
        ref={panRef}
        onGestureEvent={handlePanGesture}
        onHandlerStateChange={handlePanGesture}
        shouldCancelWhenOutside
        activeOffsetY={[-20, 20]}
        failOffsetX={[-50, 50]}
      >
        <Animated.View style={styles.gestureContainer}>
          <TapGestureHandler
            ref={singleTapRef}
            onHandlerStateChange={handleSingleTap}
            waitFor={doubleTapRef}
          >
            <TapGestureHandler
              ref={doubleTapRef}
              onHandlerStateChange={handleDoubleTap}
              numberOfTaps={2}
            >
              <Animated.View style={styles.videoWrapper}>
                {/* Enhanced Video Container */}
                <TouchableOpacity
                  activeOpacity={1}
                  style={styles.touchableContainer}
                  onPressIn={handlePressIn} 
                  onPressOut={handlePressOut}
                >

                  <SimpleAdaptiveVideo                         
                    videoRef={(ref) => { videoRefs.current[item.id] = ref; }}
                    source={{ uri: item.videoUrl }}
                    shouldPlay={isActive}
                    isLooping={true}
                    fillMode="smart"
                    onLoadStart={handleVideoLoadStart}
                    onLoad={handleVideoLoad}
                    onError={handleVideoError} 
                    rate={1.0}
                    volume={1.0}
                    onPlaybackStatusUpdate={(status) => onPlaybackStatusUpdate(status, item.id)}
                  />
                  
                  {/* Video Overlays */}
                  <VideoOverlays
                    isVideoLoading={isVideoLoading}
                    showPlayPauseIndicator={showPlayPauseIndicator}
                    isVideoPaused={isVideoPaused}
                    isActive={isActive}
                    playbackStatus={isActive ? playbackStatus : {}}
                    isHeartAnimationVisible={isHeartAnimationVisible}
                    onHeartAnimationEnd={onHeartAnimationEnd}
                    videoId={item.id}
                  />
                  
                  {/* Swipe indicator */}
                  {swipeDirection && (
                    <Animated.View 
                      style={[
                        styles.swipeIndicator,
                        swipeDirection === 'up' ? styles.swipeUp : styles.swipeDown,
                        {
                          opacity: swipeProgressAnim.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [0, 0.8, 1],
                          }),
                          transform: [{
                            scale: swipeProgressAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.8, 1.2],
                            })
                          }]
                        }
                      ]}
                    >
                      <Animated.Text 
                        style={[
                          styles.swipeIndicatorText,
                          {
                            transform: [{
                              translateY: swipeProgressAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, swipeDirection === 'up' ? -10 : 10],
                              })
                            }]
                          }
                        ]}
                      >
                        {swipeDirection === 'up' ? '👆 Next' : '👇 Previous'}
                      </Animated.Text>
                    </Animated.View>
                  )}
                </TouchableOpacity>
                
                {/* Top navigation - only show on first video or when scrolling */}
                <EnhancedFeedHeader 
                  activeTab={activeTab}
                  onTabChange={onTabChange}
                  insets={insets}
                />

                


                {/* Action Buttons - Right Side */}
                <VideoActionButtons
                  video={item}
                  isBookmarked={isBookmarked}
                  onUserProfilePress={onUserProfilePress}
                  onLikePress={onLikeVideo}
                  onCommentPress={onCommentPress}
                  onBookmarkPress={onBookmarkPress}
                  onSharePress={onSharePress}
                />
                
                {/* User Info Overlay */}
                <VideoInfo
                  video={item}
                  onSoundPress={onSoundPress}
                />
              </Animated.View>
            </TapGestureHandler>
          </TapGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  videoContainer: {
    width,
    height,
  },
   gestureContainer: {
    flex: 1,
  },
   touchableContainer: {
    flex: 1,
  },
  swipeIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  swipeUp: {
    top: '20%',
  },
  swipeDown: {
    bottom: '20%',
  },
  swipeIndicatorText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  videoWrapper: {
    flex: 1,
  },
});

export default VideoItem;