import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { formatCount } from '../../utils/formatters';
import * as Animatable from 'react-native-animatable';

/**
 * Video action buttons component (like, comment, share, etc.)
 * Styled to match TikTok's vertical action bar
 */
const VideoActionButtons = ({
  video,
  onLike,
  onComment,
  onShare,
  onProfile,
  onBookmark,
  style
}) => {
  // Handle like action with animation
  const handleLike = () => {
    if (onLike) {
      onLike(video.id);
    }
  };
  
  return (
    <View style={[styles.container, style]}>
      {/* Profile button */}
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => onProfile && onProfile(video.user.id)}
        activeOpacity={0.9}
      >
        <View style={styles.profileContainer}>
          <Image
            source={{ uri: video.user.avatarUrl }}
            style={styles.profileImage}
          />
          {/* Plus button for follow */}
          <View style={styles.plusButton}>
            <Ionicons name="add" color="#FFF" size={12} />
          </View>
        </View>
      </TouchableOpacity>
      
      {/* Like button */}
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={handleLike}
        activeOpacity={0.7}
      >
        <Animatable.View 
          animation={video.isLiked ? "pulse" : undefined}
          style={styles.iconContainer}
        >
          <Ionicons 
            name={video.isLiked ? "heart" : "heart-outline"} 
            color={video.isLiked ? "#FE2C55" : "#FFF"} 
            size={30} 
          />
        </Animatable.View>
        <Text style={styles.actionText}>{formatCount(video.likes)}</Text>
      </TouchableOpacity>
      
      {/* Comment button */}
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => onComment && onComment(video.id)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="chatbubble-ellipses-outline" color="#FFF" size={28} />
        </View>
        <Text style={styles.actionText}>{formatCount(video.comments)}</Text>
      </TouchableOpacity>
      
      {/* Bookmark button */}
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => onBookmark && onBookmark(video.id)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="bookmark-outline" color="#FFF" size={28} />
        </View>
        <Text style={styles.actionText}>Save</Text>
      </TouchableOpacity>
      
      {/* Share button */}
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => onShare && onShare(video.id)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="arrow-redo-outline" color="#FFF" size={28} />
        </View>
        <Text style={styles.actionText}>{formatCount(video.shares)}</Text>
      </TouchableOpacity>
      
      {/* Rotating music disc */}
      <TouchableOpacity 
        style={styles.musicDiscButton}
        activeOpacity={0.9}
      >
        <Animatable.View
          animation="rotate"
          iterationCount="infinite"
          duration={3000}
          easing="linear"
          style={styles.musicDisc}
        >
          <Image 
            source={{ uri: video.user.avatarUrl }}
            style={styles.musicDiscImage}
          />
        </Animatable.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 8,
    bottom: 100, // Adjust based on your layout
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1.5,
  },
  profileContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFF',
    position: 'relative',
  },
  profileImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  plusButton: {
    position: 'absolute',
    bottom: -10,
    left: '50%',
    marginLeft: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FE2C55',
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicDiscButton: {
    alignItems: 'center',
    marginTop: 10,
  },
  musicDisc: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 10,
    borderColor: '#000',
    overflow: 'hidden',
  },
  musicDiscImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

export default VideoActionButtons;