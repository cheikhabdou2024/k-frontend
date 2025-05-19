import React, { memo } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
import { Video } from 'expo-av';
import VideoCaption from './VideoCaption';
import VideoLoadingSpinner from './VideoLoadingSpinner';
import HeartAnimation from './HeartAnimation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { formatCount } from '../../utils/formatters';

/**
 * Optimized video item component for feed with memoization
 * Extracts render logic from FeedScreen for better performance
 */
const FeedVideoItem = memo(({ 
  item, 
  isActive, 
  isVideoLoading, 
  isHeartAnimationVisible,
  onVideoRef,
  onVideoLoadStart,
  onVideoLoad,
  onVideoError,
  onHeartAnimationEnd,
  onVideoTap,
  onLike,
  onCommentPress,
  onSharePress,
  onHashtagPress,
  onUserMentionPress
}) => {
  return (
    <View style={styles.videoContainer}>
      <TouchableOpacity
        activeOpacity={1}
        style={styles.videoWrapper}
        onPress={() => onVideoTap(item.id)}
      >
        <Video
          ref={ref => onVideoRef && onVideoRef(item.id, ref)}
          source={{ uri: item.videoUrl }}
          style={styles.video}
          resizeMode="cover"
          shouldPlay={isActive}
          isLooping
          useNativeControls={false}
          onLoadStart={() => onVideoLoadStart && onVideoLoadStart(item.id)}
          onLoad={() => onVideoLoad && onVideoLoad(item.id)}
          onError={(error) => onVideoError && onVideoError(item.id, error)}
          rate={1.0}
          volume={1.0}
        />
        
        {/* Loading Spinner */}
        <VideoLoadingSpinner 
          isVisible={isVideoLoading} 
          size="medium" 
        />
        
        {/* Heart Animation */}
        <HeartAnimation
          isVisible={isHeartAnimationVisible}
          onAnimationEnd={() => onHeartAnimationEnd(item.id)}
          size="large"
        />
        
        {/* User Info Overlay */}
        <View style={styles.userInfoContainer}>
          <View style={styles.userInfo}>
            <TouchableOpacity style={styles.userProfileImageContainer}>
              <Image
                source={{ uri: item.user.avatarUrl }}
                style={styles.userProfileImage}
              />
            </TouchableOpacity>
            
            <Text style={styles.username}>@{item.user.username}</Text>
            
            <VideoCaption
              caption={item.caption}
              onHashtag={(hashtag) => onHashtagPress(hashtag)}
              onUserMention={(mention) => onUserMentionPress(mention)}
            />
            
            {/* Sound Info */}
            <View style={styles.soundInfo}>
              <Text style={styles.soundText}>
                {item.sound.name}
              </Text>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onLike(item.id)}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons 
                  name={item.isLiked ? "heart" : "heart-outline"} 
                  size={28} 
                  color={item.isLiked ? "#FE2C55" : "#FFF"} 
                />
              </View>
              <Text style={styles.actionText}>{formatCount(item.likes)}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onCommentPress(item.id)}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={26} color="#FFF" />
              </View>
              <Text style={styles.actionText}>{formatCount(item.comments)}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onSharePress(item.id)}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="share-outline" size={26} color="#FFF" />
              </View>
              <Text style={styles.actionText}>{formatCount(item.shares)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memoization 
  // Only re-render when these specific props change
  return (
    prevProps.isActive === nextProps.isActive &&
    prevProps.isVideoLoading === nextProps.isVideoLoading &&
    prevProps.isHeartAnimationVisible === nextProps.isHeartAnimationVisible &&
    prevProps.item.isLiked === nextProps.item.isLiked &&
    prevProps.item.likes === nextProps.item.likes &&
    prevProps.item.comments === nextProps.item.comments &&
    prevProps.item.shares === nextProps.item.shares
  );
});

const styles = StyleSheet.create({
  videoContainer: {
    width: '100%',
    height: '100%',
  },
  videoWrapper: {
    flex: 1,
  },
  video: {
    flex: 1,
  },
  userInfoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 40,
  },
  userInfo: {
    flex: 1,
    marginRight: 80,
  },
  userProfileImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  userProfileImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  username: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  soundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  soundText: {
    color: '#FFF',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  actionButtons: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 15,
  },
  actionIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
  },
});

export default FeedVideoItem;