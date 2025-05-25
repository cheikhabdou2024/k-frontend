// src/components/feed/EnhancedVideoOverlays.js
import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Import your existing components
import VideoLoadingSpinner from './VideoLoadingSpinner';
import PlayPauseIndicator from '../video/PlayPauseIndicator';
import ProgressBar from '../video/ProgressBar';
import EnhancedHeartAnimation from './EnhancedHeartAnimation';

// Import new enhanced components
import VideoInfo from './VideoInfo';
import VideoActionButtons from './VideoActionButton';
import UserProfileOverlay from '../profile/UserProfileOverlay';

const { width, height } = Dimensions.get('window');

const VideoOverlays = ({
  // Video state props
  video,
  isActive,
  isVideoLoading,
  showPlayPauseIndicator,
  isVideoPaused,
  playbackStatus,
  isHeartAnimationVisible,
  
  // User interaction props
  currentUserId,
  isBookmarked,
  isFollowing,
  
  // Handler props
  onHeartAnimationEnd,
  onUserProfilePress,
  onLikePress,
  onCommentPress,
  onBookmarkPress,
  onSharePress,
  onSoundPress,
  onHashtagPress,
  onLocationPress,
  onFollowPress,
  onMessagePress,
  
  // Visibility props
  showOverlays = true,
  autoHideDelay = 3000,
}) => {
  // State
  const [overlaysVisible, setOverlaysVisible] = useState(true);
  const [profileOverlayVisible, setProfileOverlayVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Animation refs
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const fadeTimeoutRef = useRef(null);

  // Auto-hide overlays when video is playing
  useEffect(() => {
    if (isActive && !isVideoPaused && showOverlays) {
      resetAutoHideTimer();
    } else {
      clearAutoHideTimer();
      showOverlaysAnimated();
    }
    
    return () => clearAutoHideTimer();
  }, [isActive, isVideoPaused, showOverlays]);

  // Reset auto-hide timer
  const resetAutoHideTimer = () => {
    clearAutoHideTimer();
    
    if (autoHideDelay > 0) {
      fadeTimeoutRef.current = setTimeout(() => {
        hideOverlaysAnimated();
      }, autoHideDelay);
    }
  };

  // Clear auto-hide timer
  const clearAutoHideTimer = () => {
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
  };

  // Show overlays with animation
  const showOverlaysAnimated = () => {
    if (!overlaysVisible) {
      setOverlaysVisible(true);
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  // Hide overlays with animation
  const hideOverlaysAnimated = () => {
    if (overlaysVisible) {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setOverlaysVisible(false);
      });
    }
  };

  // Handle user interaction (show overlays on tap)
  const handleUserInteraction = () => {
    showOverlaysAnimated();
    resetAutoHideTimer();
  };

  // Handle user profile press
  const handleUserProfilePress = (userId) => {
    handleUserInteraction();
    
    // Set selected user and show profile overlay
    setSelectedUser(video.user);
    setProfileOverlayVisible(true);
    
    // Call parent handler
    if (onUserProfilePress) {
      onUserProfilePress(userId);
    }
  };

  // Handle like press with interaction feedback
  const handleLikePress = (videoId, doubleTap = false) => {
    handleUserInteraction();
    if (onLikePress) {
      onLikePress(videoId, doubleTap);
    }
  };

  // Handle comment press with interaction feedback
  const handleCommentPress = (videoId) => {
    handleUserInteraction();
    if (onCommentPress) {
      onCommentPress(videoId);
    }
  };

  // Handle bookmark press with interaction feedback
  const handleBookmarkPress = (videoId) => {
    handleUserInteraction();
    if (onBookmarkPress) {
      onBookmarkPress(videoId);
    }
  };

  // Handle share press with interaction feedback
  const handleSharePress = (videoId) => {
    handleUserInteraction();
    if (onSharePress) {
      onSharePress(videoId);
    }
  };

  // Handle sound press with interaction feedback
  const handleSoundPress = (soundId) => {
    handleUserInteraction();
    if (onSoundPress) {
      onSoundPress(soundId);
    }
  };

  // Handle hashtag press
  const handleHashtagPress = (hashtag) => {
    handleUserInteraction();
    if (onHashtagPress) {
      onHashtagPress(hashtag);
    }
  };

  // Handle location press
  const handleLocationPress = (location) => {
    handleUserInteraction();
    if (onLocationPress) {
      onLocationPress(location);
    }
  };

  // Handle follow press from profile overlay
  const handleFollowPress = (userId, isNowFollowing) => {
    if (onFollowPress) {
      onFollowPress(userId, isNowFollowing);
    }
  };

  // Handle message press from profile overlay
  const handleMessagePress = (userId) => {
    setProfileOverlayVisible(false);
    if (onMessagePress) {
      onMessagePress(userId);
    }
  };

  // Handle view full profile
  const handleViewProfile = (userId) => {
    setProfileOverlayVisible(false);
    if (onUserProfilePress) {
      onUserProfilePress(userId);
    }
  };

  if (!video) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Background gradients for better text contrast */}
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'transparent']}
        style={styles.topGradient}
        pointerEvents="none"
      />
      
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />
      
      {/* Loading Spinner */}
      {isVideoLoading && (
        <VideoLoadingSpinner 
          isVisible={true}
          size="medium" 
        />
      )}
      
      {/* PlayPause Indicator */}
      {showPlayPauseIndicator && (
        <PlayPauseIndicator 
          isPlaying={!isVideoPaused}
          isVisible={true}
          size="medium"
        />
      )}

      {/* Progress Bar */}
      {isActive && playbackStatus && (
        <ProgressBar 
          progress={
            playbackStatus.positionMillis && playbackStatus.durationMillis 
              ? playbackStatus.positionMillis / playbackStatus.durationMillis 
              : 0
          }
          isVisible={true}
          color="#FE2C55"
        />
      )}

      {/* Heart Animation */}
      <EnhancedHeartAnimation
        isVisible={isHeartAnimationVisible}
        onAnimationEnd={onHeartAnimationEnd}
        size="large"
        position="center"
      />

      {/* Interactive Overlays */}
      {showOverlays && (
        <Animated.View 
          style={[
            styles.interactiveOverlays,
            { opacity: overlayOpacity }
          ]}
          pointerEvents={overlaysVisible ? "box-none" : "none"}
        >
          {/* Enhanced Video Info */}
          <EnhancedVideoInfo
            video={video}
            isVisible={overlaysVisible}
            onUserPress={handleUserProfilePress}
            onSoundPress={handleSoundPress}
            onHashtagPress={handleHashtagPress}
            onLocationPress={handleLocationPress}
          />
          
          {/* Enhanced Action Buttons */}
          <EnhancedVideoActionButtons
            video={video}
            isBookmarked={isBookmarked}
            currentUserId={currentUserId}
            isVisible={overlaysVisible}
            onUserProfilePress={handleUserProfilePress}
            onLikePress={handleLikePress}
            onCommentPress={handleCommentPress}
            onBookmarkPress={handleBookmarkPress}
            onSharePress={handleSharePress}
            onFollowPress={handleFollowPress}
          />
        </Animated.View>
      )}

      {/* User Profile Overlay Modal */}
      <UserProfileOverlay
        user={selectedUser}
        isVisible={profileOverlayVisible}
        isFollowing={isFollowing}
        currentUserId={currentUserId}
        onClose={() => setProfileOverlayVisible(false)}
        onFollowPress={handleFollowPress}
        onMessagePress={handleMessagePress}
        onViewProfile={handleViewProfile}
      />

      {/* Touch area for showing overlays when hidden */}
      {!overlaysVisible && (
        <View 
          style={styles.touchArea}
          pointerEvents="box-only"
          onTouchStart={handleUserInteraction}
        />
      )}
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
    zIndex: 5,
  },
  
  // Gradient overlays
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 1,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 1,
  },
  
  // Interactive overlays container
  interactiveOverlays: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  
  // Touch area for hidden overlays
  touchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 15,
  },
});

export default VideoOverlays;