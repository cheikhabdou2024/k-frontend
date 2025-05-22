// src/components/feed/VideoItem.js
import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Video } from 'expo-av';
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

  return (
    <View style={styles.videoContainer}>
      <TouchableOpacity
        activeOpacity={1}
        style={styles.videoWrapper}
        onPress={() => onVideoTap(item.id)}
      >
        <Video
          ref={ref => { videoRefs.current[item.id] = ref; }}
          source={{ uri: item.videoUrl }}
          style={styles.video}
          resizeMode="cover"
          shouldPlay={isActive}
          isLooping
          useNativeControls={false}
          onLoadStart={() => onVideoLoadStart(item.id)}
          onLoad={() => onVideoLoad(item.id)}
          onError={(error) => onVideoError(item.id, error)}
          rate={1.0}
          volume={1.0}
          onPlaybackStatusUpdate={(status) => onPlaybackStatusUpdate(status, item.id)}
        />
        
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
        
        {/* Top navigation */}
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
  video: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default VideoItem;
