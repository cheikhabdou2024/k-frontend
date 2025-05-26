// src/components/feed/VideoItem.js - Updated with Adaptive Video
import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Animated, Text } from 'react-native';
import SimpleAdaptiveVideo from '../video/SimpleAdaptiveVideo'; // Using the simple version
import { PanGestureHandler, TapGestureHandler, State } from 'react-native-gesture-handler';
import VideoOverlays from './VideoOverlays';
import VideoActionButtons from './VideoActionButton';
import VideoInfo from './VideoInfo';
import * as Haptics from 'expo-haptics';
import NetInfo from '@react-native-community/netinfo';
import TikTokLoader from '../loading/TikTokLoader';
import EnhancedHeartAnimation from './EnhancedHeartAnimation'; // Updated import


 
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
  playbackStatus,
  bookmark,
  videoRefs,
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
  onSwipeLeft,
  onSwipeRight,
  
}) => {
  const [isLiked, setIsLiked] = useState(false);
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
  const panXRef = useRef(); // NEW: for horizontal pan
  
  // State
  const [isPressed, setIsPressed] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [lastTapPosition, setLastTapPosition] = useState(null);
  const [heartAnimationIntensity, setHeartAnimationIntensity] = useState('normal');
  const [localHeartVisible, setLocalHeartVisible] = useState(false); // NEW: local heart visibility state

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

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
  

  // Update the handleSingleTap function to only handle heart animation
  const handleSingleTap = ({ nativeEvent }) => {
    if (nativeEvent.state === State.ACTIVE) {
      // Store tap position
      setLastTapPosition({
        x: nativeEvent.absoluteX,
        y: nativeEvent.absoluteY
      });
      
      // Light haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Just animate tap feedback without play/pause
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
    }
  };

  // Update handleDoubleTap to focus on heart animation
  const handleDoubleTap = ({ nativeEvent }) => {
  if (nativeEvent.state === State.ACTIVE) {
    setLastTapPosition({
      x: nativeEvent.absoluteX,
      y: nativeEvent.absoluteY
    });
    setHeartAnimationIntensity('strong');
    setLocalHeartVisible(true);

    // Toggle like state locally
    setIsLiked(prev => !prev);

    // Call parent handler if needed
    if (onLikeVideo) {
      try {
        onLikeVideo(item.id, !isLiked);
      } catch (error) {
        console.error('Failed to toggle like:', error);
      }
    }
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

  // --- Horizontal swipe handler ---
  const handlePanGestureX = ({ nativeEvent }) => {
    const { translationX, velocityX, state } = nativeEvent;

    if (state === State.END) {
      const threshold = width * 0.15;
      const velocityThreshold = 800;
      const shouldSwipe =
        Math.abs(translationX) > threshold ||
        Math.abs(velocityX) > velocityThreshold;

      if (shouldSwipe) {
        if (translationX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (translationX < 0 && onSwipeLeft) {
          onSwipeLeft();
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
        ref={panXRef}
        onGestureEvent={handlePanGestureX}
        onHandlerStateChange={handlePanGestureX}
        activeOffsetX={[-20, 20]}
        failOffsetY={[-50, 50]}
      >
        <Animated.View style={{ flex: 1 }}>
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
                      {/* TikTok Loader: show when loading or offline */}
                      {(isVideoLoading || isOffline) && (
                        <TikTokLoader />
                      )}

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
                        isHeartAnimationVisible={isHeartAnimationVisible}
                        onPlaybackStatusUpdate={(status) => onPlaybackStatusUpdate(status, item.id)}
                      />

                      {/* Enhanced Heart Animation */}
                      <EnhancedHeartAnimation
                        isVisible={localHeartVisible}
                        onAnimationEnd={() => setLocalHeartVisible(false)}
                        size="large"
                        tapPosition={lastTapPosition}
                        intensity={heartAnimationIntensity}
                      />

                      {/* Video Overlays */}
                      <VideoOverlays
                        isVideoLoading={isVideoLoading}
                        isActive={isActive}
                        playbackStatus={isActive ? playbackStatus : {}}
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
                    
                   

                    


                    {/* Action Buttons - Right Side */}
                    <VideoActionButtons
                      video={item}
                      isLiked={isLiked}
                      isBookmarked={isBookmarked}
                      onUserProfilePress={onUserProfilePress}
                      onLikePress={() => {
                        setIsLiked(prev => !prev);
                        if (onLikeVideo) {
                          try {
                            onLikeVideo(item.id, !isLiked);
                          } catch (error) {
                            console.error('Failed to toggle like:', error);
                          }
                        }
                      }}
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