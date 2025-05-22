// src/hooks/useFeedLogic.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export const useFeedLogic = (videos, navigation) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [videoLoading, setVideoLoading] = useState({});
  const [showHeartAnimation, setShowHeartAnimation] = useState({});
  const [playbackStatus, setPlaybackStatus] = useState({});
  const [showPlayPauseIndicator, setShowPlayPauseIndicator] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [bookmark, setBookmark] = useState({});
  
  // Refs
  const flatListRef = useRef(null);
  const videoRefs = useRef({});
  const lastTapTimeRef = useRef({});
  const doubleTapTimeoutRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Handle app foreground/background state
  useFocusEffect(
    useCallback(() => {
      // Play current video when screen gains focus
      const currentVideoRef = videoRefs.current[videos[currentIndex]?.id];
      if (currentVideoRef) {
        currentVideoRef.playAsync();
      }

      return () => {
        // Pause all videos when screen loses focus
        Object.values(videoRefs.current).forEach(videoRef => {
          if (videoRef) {
            videoRef.pauseAsync();
          }
        });
      };
    }, [currentIndex, videos])
  );

  // Handle video loading state change
  const onVideoLoadStart = useCallback((videoId) => {
    setVideoLoading(prev => ({ ...prev, [videoId]: true }));
  }, []);

  // Handle video ready state
  const onVideoLoad = useCallback((videoId) => {
    setVideoLoading(prev => ({ ...prev, [videoId]: false }));
  }, []);

  // Handle playback errors
  const onVideoError = useCallback((videoId, error) => {
    console.error(`Error loading video ${videoId}:`, error);
    setVideoLoading(prev => ({ ...prev, [videoId]: false }));
  }, []);
  
  // Handle heart animation end
  const onHeartAnimationEnd = useCallback((videoId) => {
    setShowHeartAnimation(prev => ({ ...prev, [videoId]: false }));
  }, []);

  // Handle like action
  const handleLikeVideo = useCallback((videoId, doubleTap = false) => {
    // Update videos array to toggle like status
    // This would typically be handled by a state management solution
    // For now, we'll emit an event to the parent component
    
    // If it's a double tap, show heart animation
    if (doubleTap) {
      setShowHeartAnimation(prev => ({ ...prev, [videoId]: true }));
    }
  }, []);
  
  // Handle single tap on video (for play/pause)
  const handleVideoTap = useCallback((videoId) => {
    const now = Date.now();
    const lastTap = lastTapTimeRef.current[videoId] || 0;
    const timeDiff = now - lastTap;
    
    // Clear any existing timeout for single tap actions
    if (doubleTapTimeoutRef.current) {
      clearTimeout(doubleTapTimeoutRef.current);
    }
    
    // Check if this is a double tap (time difference less than 300ms)
    if (timeDiff < 300) {
      // Double tap detected
      handleLikeVideo(videoId, true);
    } else {
      // Set a timeout for single tap action (play/pause)
      doubleTapTimeoutRef.current = setTimeout(() => {
        const videoRef = videoRefs.current[videoId];
        if (videoRef) {
          videoRef.getStatusAsync().then(status => {
            const newPlayingState = !status.isPlaying;
            setIsVideoPaused(!newPlayingState);
            setShowPlayPauseIndicator(true);
            
            // Hide indicator after a brief delay
            setTimeout(() => {
              setShowPlayPauseIndicator(false);
            }, 1000);
            
            if (newPlayingState) {
              videoRef.playAsync();
            } else {
              videoRef.pauseAsync();
            }
          });
        }
      }, 300); // Wait for potential second tap
    }
    
    // Update last tap time
    lastTapTimeRef.current[videoId] = now;
  }, [handleLikeVideo]);

  // Track playback status
  const onPlaybackStatusUpdate = useCallback((status, videoId) => {
    if (videoId === videos[currentIndex]?.id) {
      setPlaybackStatus(status);
    }
  }, [currentIndex, videos]);

  // Handle scroll events
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  // Handle video viewability change
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      setCurrentIndex(index);

      // Pause all videos then play the current one
      Object.keys(videoRefs.current).forEach(key => {
        const videoRef = videoRefs.current[key];
        if (videoRef) {
          videoRef.pauseAsync();
        }
      });

      const currentVideoRef = videoRefs.current[viewableItems[0].item.id];
      if (currentVideoRef) {
        currentVideoRef.playAsync();
      }
    }
  }).current;

  // Configuration for viewability
  const viewabilityConfig = {
    itemVisiblePercentThreshold: 60,
  };

  // Handle comments press
  const handleCommentPress = (videoId) => {
    navigation.navigate('CommentsScreen', { videoId });
  };

  // Handle bookmark press
  const handleBookmarkPress = (videoId) => {
    setBookmark(prev => ({ 
      ...prev, 
      [videoId]: !prev[videoId] 
    }));
  };

  // Handle user profile press
  const handleUserProfilePress = (userId) => {
    navigation.navigate('Profile', { 
      screen: 'ProfileHome',
      params: { userId } 
    });
  };

  // Handle share action
  const handleSharePress = (videoId) => {
    console.log('Share video:', videoId);
  };
  
  // Handle sound press
  const handleSoundPress = (soundId) => {
    console.log('Navigate to sound details:', soundId);
  };

  return {
    // State
    currentIndex,
    loading,
    refreshing,
    videoLoading,
    showHeartAnimation,
    playbackStatus,
    showPlayPauseIndicator,
    isVideoPaused,
    bookmark,
    
    // Refs
    flatListRef,
    videoRefs,
    scrollY,
    
    // Handlers
    onVideoLoadStart,
    onVideoLoad,
    onVideoError,
    onHeartAnimationEnd,
    handleLikeVideo,
    handleVideoTap,
    onPlaybackStatusUpdate,
    handleScroll,
    onViewableItemsChanged,
    viewabilityConfig,
    handleCommentPress,
    handleBookmarkPress,
    handleUserProfilePress,
    handleSharePress,
    handleSoundPress,
    
    // Setters (for parent component control)
    setLoading,
    setRefreshing,
  };
};

// ==========================================