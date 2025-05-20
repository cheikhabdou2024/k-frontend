import React, { memo, useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  Image,
  Dimensions,
  Platform
} from 'react-native';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Animatable from 'react-native-animatable';

// Enhanced components
import EnhancedVideoCaption from './EnhancedVideoCaption';
import VideoActionButtons from './VideoActionButtons';
import VideoControls from '../video/VideoControls';
import SoundDisk from './SoundDisk';
import VideoLoadingSpinner from './VideoLoadingSpinner';
import EnhancedHeartAnimation from './EnhancedHeartAnimation';

const { width, height } = Dimensions.get('window');

/**
 * Enhanced video item component for TikTok-style feed
 */
const EnhancedFeedVideoItem = memo(({ 
  item, 
  isActive,
  videoRef,
  onVideoLoadStart,
  onVideoLoad,
  onVideoError,
  onLike,
  onComment,
  onShare,
  onHashtagPress,
  onUserPress,
  onSoundPress,
  style = {}
}) => {
  // State
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(isActive);
  const [soundIconAnimating, setSoundIconAnimating] = useState(isActive);
  
  // Handle video loading states
  const handleLoadStart = () => {
    setIsVideoLoading(true);
    if (onVideoLoadStart) onVideoLoadStart(item.id);
  };
  
  const handleLoad = () => {
    setIsVideoLoading(false);
    if (onVideoLoad) onVideoLoad(item.id);
    
    // Animate sound icon when video loaded
    if (isActive) {
      setSoundIconAnimating(true);
      setTimeout(() => setSoundIconAnimating(false), 1500);
    }
  };
  
  const handleError = (error) => {
    setIsVideoLoading(false);
    if (onVideoError) onVideoError(item.id, error);
  };
  
  // Handle video controls
  const handleSingleTap = (zone) => {
    if (videoRef) {
      videoRef.getStatusAsync().then(status => {
        const newPlayingState = !status.isPlaying;
        setIsPlaying(newPlayingState);
        if (newPlayingState) {
          videoRef.playAsync();
        } else {
          videoRef.pauseAsync();
        }
      });
    }
  };
  
  const handleDoubleTap = (zone) => {
    // Like the video on double tap
    if (onLike) {
      onLike(item.id, true);
      setIsHeartAnimating(true);
    }
  };
  
  return (
    <View style={[styles.container, style]}>
      {/* Video component */}
      <Video
        ref={ref => videoRef && videoRef(item.id, ref)}
        source={{ uri: item.videoUrl }}
        style={styles.video}
        resizeMode="cover"
        shouldPlay={isActive}
        isLooping
        useNativeControls={false}
        onLoadStart={handleLoadStart}
        onLoad={handleLoad}
        onError={handleError}
        progressUpdateIntervalMillis={1000}
      />
      
      {/* Video Controls (tap detection) */}
      <VideoControls
        onSingleTap={handleSingleTap}
        onDoubleTap={handleDoubleTap}
      >
        {/* Bottom gradient overlay for better text visibility */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)']}
          style={styles.gradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        
        {/* Video loading spinner */}
        <VideoLoadingSpinner isVisible={isVideoLoading} />
        
        {/* Heart animation for double-tap */}
        <EnhancedHeartAnimation
          isVisible={isHeartAnimating}
          onAnimationEnd={() => setIsHeartAnimating(false)}
          size="large"
        />
        
        {/* Pause indicator (shows when video is paused) */}
        {isActive && !isPlaying && (
          <View style={styles.pauseIconContainer}>
            <Ionicons name="play" size={60} color="rgba(255,255,255,0.6)" />
          </View>
        )}
        
        {/* User info and caption */}
        <View style={styles.bottomContainer}>
          <View style={styles.userInfoContainer}>
            {/* Username and caption */}
            <EnhancedVideoCaption
              username={`@${item.user.username}`}
              caption={item.caption}
              onHashtag={onHashtagPress}
              onUserMention={onUserPress}
              maxLines={2}
              style={styles.captionContainer}
            />
            
            {/* Sound info with rotating disc */}
            <TouchableOpacity 
              style={styles.soundInfoContainer}
              onPress={() => onSoundPress && onSoundPress(item.sound.id)}
              activeOpacity={0.8}
            >
              <SoundDisk
                imageUrl={item.user.avatarUrl}
                soundName={item.sound.name}
                isActive={isActive && soundIconAnimating}
                size="tiny"
              />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Action buttons (like, comment, share) */}
        <VideoActionButtons
          video={item}
          onLike={onLike}
          onComment={onComment}
          onShare={onShare}
          onProfile={() => onUserPress && onUserPress(item.user.username)}
          style={styles.actionButtonsContainer}
        />
      </VideoControls>
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memoization to prevent unnecessary re-renders
  return (
    prevProps.isActive === nextProps.isActive &&
    prevProps.item.isLiked === nextProps.item.isLiked &&
    prevProps.item.likes === nextProps.item.likes &&
    prevProps.item.comments === nextProps.item.comments &&
    prevProps.item.shares === nextProps.item.shares
  );
});

const styles = StyleSheet.create({
  container: {
    width: width,
    height: height,
    backgroundColor: '#000',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%', 
    zIndex: 1,
  },
  pauseIconContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 90 : 60, // Adjust for bottom tab bar
    zIndex: 2,
  },
  userInfoContainer: {
    flex: 1,
    marginRight: 80, // Space for action buttons
  },
  captionContainer: {
    marginBottom: 10,
  },
  soundInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  actionButtonsContainer: {
    position: 'absolute',
    right: 8,
    bottom: Platform.OS === 'ios' ? 100 : 80,
    zIndex: 3,
  }
});

export default EnhancedFeedVideoItem; 