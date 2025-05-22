// src/components/feed/VideoItem.js
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Text,
  Image,
} from 'react-native';
import { Video } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import ProgressBar from '../video/ProgressBar';
import VideoLoadingSpinner from '../video/VideoLoadingSpinner';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

// Format numbers for display (e.g., 1.2K, 4.5M)
const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

const VideoItem = ({
  item,
  isActive,
  videoRef,
  onLoadStart,
  onLoad,
  onError,
  onProgress,
  onDoubleTap,
  isLoading,
  progress,
}) => {
  const insets = useSafeAreaInsets();
  const [isLiked, setIsLiked] = useState(false);
  const [lastTap, setLastTap] = useState(null);
  
  // Handle tap on video
  const handleVideoPress = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (lastTap && (now - lastTap) < DOUBLE_TAP_DELAY) {
      // Double tap detected
      if (!isLiked) {
        setIsLiked(true);
        onDoubleTap && onDoubleTap();
      }
    }
    
    setLastTap(now);
  };
  
  // Toggle like
  const toggleLike = () => {
    setIsLiked(!isLiked);
    // You would also update the like status in your backend
  };
  
  return (
    <View style={styles.container}>
      {/* Video Background */}
      {item.thumbnailUrl && isLoading && (
        <Image
          source={{ uri: item.thumbnailUrl }}
          style={styles.thumbnail}
          blurRadius={2}
        />
      )}
      
      {/* Video Player */}
      <TouchableWithoutFeedback onPress={handleVideoPress}>
        <View style={styles.videoWrapper}>
          <Video
            ref={videoRef}
            source={{ uri: item.videoUrl }}
            style={styles.video}
            resizeMode="cover"
            shouldPlay={isActive}
            isLooping
            useNativeControls={false}
            onLoadStart={onLoadStart}
            onLoad={onLoad}
            onError={onError}
            onPlaybackStatusUpdate={(status) => {
              if (status.isLoaded && !status.isBuffering) {
                onProgress && onProgress({
                  positionMillis: status.positionMillis,
                  durationMillis: status.durationMillis,
                });
              }
            }}
            posterSource={{ uri: item.thumbnailUrl }}
            usePoster={true}
            rate={1.0}
            volume={1.0}
          />
          
          {/* Loading Spinner */}
          <VideoLoadingSpinner isVisible={isLoading} />
          
          {/* Video Progress Bar */}
          <ProgressBar 
            progress={progress || 0} 
            isVisible={isActive}
            showBuffering={true}
          />
        </View>
      </TouchableWithoutFeedback>
      
      {/* Right Side Actions */}
      <View style={[
        styles.rightActions,
        { bottom: insets.bottom + 10 }
      ]}>
        {/* Profile Avatar */}
        <TouchableOpacity style={styles.avatarButton}>
          <Image
            source={{ uri: item.user.avatarUrl }}
            style={styles.avatar}
          />
          <View style={styles.followBadge}>
            <AntDesign name="plus" size={12} color="#FFF" />
          </View>
        </TouchableOpacity>
        
        {/* Like Button */}
        <TouchableOpacity style={styles.actionButton} onPress={toggleLike}>
          <AntDesign
            name={isLiked ? "heart" : "hearto"}
            size={28}
            color={isLiked ? "#FE2C55" : "#FFF"}
          />
          <Text style={styles.actionText}>{formatNumber(item.likes)}</Text>
        </TouchableOpacity>
        
        {/* Comment Button */}
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-ellipses-outline" size={28} color="#FFF" />
          <Text style={styles.actionText}>{formatNumber(item.comments)}</Text>
        </TouchableOpacity>
        
        {/* Share Button */}
        <TouchableOpacity style={styles.actionButton}>
          <Feather name="send" size={28} color="#FFF" />
          <Text style={styles.actionText}>{formatNumber(item.shares)}</Text>
        </TouchableOpacity>
        
        {/* Music Disc */}
        <TouchableOpacity style={styles.musicDisc}>
          <Image
            source={{ uri: item.user.avatarUrl }}
            style={styles.musicDiscImage}
          />
        </TouchableOpacity>
      </View>
      
      {/* Bottom Info */}
      <View style={[
        styles.bottomInfo,
        { bottom: insets.bottom + 10 }
      ]}>
        {/* Username */}
        <TouchableOpacity>
          <Text style={styles.usernameText}>@{item.user.username}</Text>
        </TouchableOpacity>
        
        {/* Caption */}
        <Text style={styles.captionText}>{item.caption}</Text>
        
        {/* Audio Name */}
        <View style={styles.audioNameContainer}>
          <FontAwesome name="music" size={12} color="#FFF" style={styles.audioIcon} />
          <Text style={styles.audioNameText}>{item.audioName}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    backgroundColor: '#000',
  },
  thumbnail: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111',
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  rightActions: {
    position: 'absolute',
    right: 10,
    bottom: 60,
    alignItems: 'center',
    zIndex: 2,
  },
  avatarButton: {
    width: 48,
    height: 48,
    marginBottom: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  followBadge: {
    position: 'absolute',
    bottom: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FE2C55',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 4,
  },
  musicDisc: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 8,
    borderColor: '#000',
  },
  musicDiscImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  bottomInfo: {
    position: 'absolute',
    left: 0,
    right: 60,
    bottom: 60,
    paddingLeft: 16,
    zIndex: 2,
  },
  usernameText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 6,
  },
  captionText: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 10,
    width: '80%',
  },
  audioNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  audioIcon: {
    marginRight: 6,
  },
  audioNameText: {
    color: '#FFF',
    fontSize: 14,
    width: '80%',
  },
});

export default VideoItem;