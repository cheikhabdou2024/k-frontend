// src/components/feed/VideoItem.js - Updated with Adaptive Video
import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import SimpleAdaptiveVideo from '../video/SimpleAdaptiveVideo'; // Using the simple version
import FeedHeader from './FeedHeader';
import VideoOverlays from './VideoOverlays';
import VideoActionButtons from './VideoActionButton';
import VideoInfo from './VideoInfo';

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
}) => {
  const isActive = index === currentIndex;
  const isVideoLoading = videoLoading[item.id];
  const isHeartAnimationVisible = showHeartAnimation[item.id] || false;
  const isBookmarked = bookmark[item.id] || false;

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

  return (
    <View style={styles.videoContainer}>
      <TouchableOpacity
        activeOpacity={1}
        style={styles.videoWrapper}
        onPress={() => onVideoTap(item.id)}
      >
        {/* Adaptive Video Container */}
        <SimpleAdaptiveVideo                         
          videoRef={(ref) => { videoRefs.current[item.id] = ref; }}
          source={{ uri: item.videoUrl }}
          shouldPlay={isActive}
          isLooping={true}
          fillMode="smart" // 'smart', 'cover', 'fit'
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
        
        {/* Top navigation - only show on first video or when scrolling */}
        <FeedHeader 
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
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  videoContainer: {
    width,
    height,
  },
  videoWrapper: {
    flex: 1,
  },
});

export default VideoItem;