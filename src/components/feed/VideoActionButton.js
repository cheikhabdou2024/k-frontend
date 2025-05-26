// src/components/feed/VideoActionButton.js - IMPROVED VERSION
import React, { useRef, useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  Image, 
  Animated,
  Dimensions 
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

const VideoActionButtons = ({
  video,
  isBookmarked,
  onUserProfilePress,
  onLikePress,
  onCommentPress,
  onBookmarkPress,
  onSharePress,
  onFollowPress,
  currentUserId,
  isVisible = true,
}) => {
  // Animation refs
  const containerFadeAnim = useRef(new Animated.Value(1)).current;
  const likeScaleAnim = useRef(new Animated.Value(1)).current;
  const followScaleAnim = useRef(new Animated.Value(1)).current;
  const heartBeatAnim = useRef(new Animated.Value(1)).current;
  
  // State
  const [isLiked, setIsLiked] = useState(video.isLiked);
  const [likesCount, setLikesCount] = useState(video.likes);
  const [isFollowing, setIsFollowing] = useState(video.user.isFollowing || false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);

  // Animate container visibility
  useEffect(() => {
    Animated.timing(containerFadeAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  // Heart beat animation for liked videos
  useEffect(() => {
    if (isLiked) {
      const heartBeat = Animated.loop(
        Animated.sequence([
          Animated.timing(heartBeatAnim, {
            toValue: 1.1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(heartBeatAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      heartBeat.start();
      
      return () => heartBeat.stop();
    }
  }, [isLiked]);

  // Enhanced like button handler
  const handleLikePress = () => {
    const newLikedState = !isLiked;
    
    // Optimistic updates
    setIsLiked(newLikedState);
    setLikesCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));
    
    // Haptic feedback
    if (newLikedState) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 1000);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Like animation
    Animated.sequence([
      Animated.timing(likeScaleAnim, {
        toValue: newLikedState ? 1.3 : 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(likeScaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Call parent handler
    if (onLikePress) {
      onLikePress(video.id, newLikedState);
    }
  };

  // Enhanced follow button handler
  const handleFollowPress = () => {
    if (video.user.id === currentUserId) return;
    
    const newFollowingState = !isFollowing;
    setIsFollowing(newFollowingState);
    
    // Haptic feedback
    Haptics.impactAsync(
      newFollowingState 
        ? Haptics.ImpactFeedbackStyle.Medium 
        : Haptics.ImpactFeedbackStyle.Light
    );
    
    // Follow button animation
    Animated.sequence([
      Animated.timing(followScaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(followScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    if (onFollowPress) {
      onFollowPress(video.user.id, newFollowingState);
    }
  };

  // Enhanced interaction handlers
  const handleCommentPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onCommentPress) onCommentPress(video.id);
  };

  const handleSharePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onSharePress) onSharePress(video.id);
  };

  const handleBookmarkPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onBookmarkPress) onBookmarkPress(video.id);
  };

  // Format count display
  const formatCount = (count) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  // Render profile button with follow indicator
  const renderProfileButton = () => (
    <View style={styles.profileButtonContainer}>
      <TouchableOpacity 
        style={styles.profileButton}
        onPress={() => onUserProfilePress && onUserProfilePress(video.user.id)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: video.user.avatarUrl }}
          style={styles.profileAvatar}
        />
        
        {/* Online indicator */}
        {video.user.isOnline && (
          <View style={styles.onlineIndicator} />
        )}
      </TouchableOpacity>
      
      {/* Follow button - only show if not current user */}
      {video.user.id !== currentUserId && (
        <Animated.View 
          style={[
            styles.followButtonContainer,
            { transform: [{ scale: followScaleAnim }] }
          ]}
        >
          <TouchableOpacity 
            style={[
              styles.followButton,
              isFollowing && styles.followingButton
            ]}
            onPress={handleFollowPress}
            activeOpacity={0.8}
          >
            {isFollowing ? (
              <Ionicons name="checkmark" size={12} color="#FFF" />
            ) : (
              <Ionicons name="add" size={12} color="#FFF" />
            )}
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );

  // Render like button with enhanced effects
  const renderLikeButton = () => (
    <View style={styles.actionButtonContainer}>
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={handleLikePress}
        activeOpacity={0.8}
      >
        <Animated.View 
          style={[
            styles.actionIconContainer,
            {
              transform: [
                { scale: Animated.multiply(likeScaleAnim, heartBeatAnim) },
              ]
            }
          ]}
        >
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={32} 
            color={isLiked ? "#FE2C55" : "#FFF"} 
          />
          
          {/* Heart burst effect */}
          {showHeartBurst && (
            <View style={styles.heartBurst}>
              {[...Array(6)].map((_, index) => (
                <Animatable.View
                  key={index}
                  animation="fadeOutUp"
                  duration={1000}
                  delay={index * 100}
                  style={[
                    styles.heartParticle,
                    {
                      transform: [
                        { rotate: `${index * 60}deg` }
                      ]
                    }
                  ]}
                >
                  <Ionicons name="heart" size={8} color="#FE2C55" />
                </Animatable.View>
              ))}
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
      <Text style={[styles.actionText, isLiked && styles.likedText]}>
        {formatCount(likesCount)}
      </Text>
    </View>
  );

  // Render comment button
  const renderCommentButton = () => (
    <View style={styles.actionButtonContainer}>
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={handleCommentPress}
        activeOpacity={0.8}
      >
        <View style={styles.actionIconContainer}>
          <Ionicons name="chatbubble-ellipses-outline" size={28} color="#FFF" />
        </View>
      </TouchableOpacity>
      <Text style={styles.actionText}>
        {formatCount(video.comments)}
      </Text>
    </View>
  );

  // Render bookmark button
  const renderBookmarkButton = () => (
    <View style={styles.actionButtonContainer}>
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={handleBookmarkPress}
        activeOpacity={0.8}
      >
        <View style={styles.actionIconContainer}>
          <Ionicons 
            name={isBookmarked ? "bookmark" : "bookmark-outline"} 
            size={28} 
            color={isBookmarked ? "#FFD700" : "#FFF"} 
          />
        </View>
      </TouchableOpacity>
      <Text style={[styles.actionText, isBookmarked && styles.bookmarkedText]}>
        {formatCount(video.bookmarks || 568)}
      </Text>
    </View>
  );

  // Render share button
  const renderShareButton = () => (
    <View style={styles.actionButtonContainer}>
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={handleSharePress}
        activeOpacity={0.8}
      >
        <View style={styles.actionIconContainer}>
          <Ionicons name="arrow-redo-outline" size={28} color="#FFF" />
        </View>
      </TouchableOpacity>
      <Text style={styles.actionText}>
        {formatCount(video.shares || 201)}
      </Text>
    </View>
  );

  // Render music disc with enhanced rotation animation
  const renderMusicDisc = () => (
    <View style={styles.musicDiscContainer}>
      <Animatable.View 
        animation="rotate"
        iterationCount="infinite" 
        duration={3000}
        easing="linear"
        style={styles.musicDiscWrapper}
      >
        <LinearGradient
          colors={['#FE2C55', '#25F4EE']}
          style={styles.musicDiscGradient}
        >
          <Image
            source={{ uri: video.user.avatarUrl }}
            style={styles.musicDisc}
          />
        </LinearGradient>
      </Animatable.View>
      
      {/* Center dot */}
      <View style={styles.musicDiscCenter} />
    </View>
  );

  return (
    <Animated.View 
      style={[
        styles.container,
        { opacity: containerFadeAnim }
      ]}
    >
      {/* Profile button with follow */}
      {renderProfileButton()}
      
      {/* Like button */}
      {renderLikeButton()}
      
      {/* Comment button */}
      {renderCommentButton()}
      
      {/* Bookmark button */}
      {renderBookmarkButton()}
      
      {/* Share button */}
      {renderShareButton()}
      
      {/* Music disc */}
      {renderMusicDisc()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 12,
    bottom: 120,
    alignItems: 'center',
    zIndex: 10,
  },
  
  // Profile button styles
  profileButtonContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileButton: {
    position: 'relative',
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  followButtonContainer: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -12,
  },
  followButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FE2C55',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  followingButton: {
    backgroundColor: '#4CAF50',
  },
  
  // Action button styles
  actionButtonContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 4,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
    minWidth: 30,
  },
  likedText: {
    color: '#FE2C55',
  },
  bookmarkedText: {
    color: '#FFD700',
  },
  
  // Heart burst effect
  heartBurst: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartParticle: {
    position: 'absolute',
  },
  
  // Music disc styles
  musicDiscContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    position: 'relative',
  },
  musicDiscWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
  },
  musicDiscGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicDisc: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  musicDiscCenter: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: '#FFF',
  },
});

export default VideoActionButtons;