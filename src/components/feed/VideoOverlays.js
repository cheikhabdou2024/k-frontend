// src/components/feed/VideoOverlays.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import VideoLoadingSpinner from './VideoLoadingSpinner';
import PlayPauseIndicator from '../video/PlayPauseIndicator';
import ProgressBar from '../video/ProgressBar';
import HeartAnimation from './EnhancedHeartAnimation';

const VideoOverlays = ({
  isVideoLoading,
  showPlayPauseIndicator,
  isVideoPaused,
  isActive,
  playbackStatus,
  isHeartAnimationVisible,
  onHeartAnimationEnd,
  videoId,
}) => {
  return (
    <>
      {/* Top gradient overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'transparent']}
        style={styles.topGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      
      {/* Bottom gradient overlay for better text contrast */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.6)']}
        style={styles.gradientOverlay}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      
      {/* Loading Spinner */}
      <VideoLoadingSpinner 
        isVisible={isVideoLoading} 
        size="medium" 
      />
      
      {/* PlayPause Indicator */}
      <PlayPauseIndicator 
        isPlaying={!isVideoPaused}
        isVisible={showPlayPauseIndicator && isActive} 
      />

      {/* Progress Bar */}
      <ProgressBar 
        progress={playbackStatus.positionMillis && playbackStatus.durationMillis ? 
          playbackStatus.positionMillis / playbackStatus.durationMillis : 0}
        isVisible={isActive}
      />

      {/* Heart Animation */}
      <HeartAnimation
        isVisible={isHeartAnimationVisible}
        onAnimationEnd={() => onHeartAnimationEnd(videoId)}
        size="large"
      />
    </>
  );
};

const styles = StyleSheet.create({
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    zIndex: 1,
  },
});

export default VideoOverlays;