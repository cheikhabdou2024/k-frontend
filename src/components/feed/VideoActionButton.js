// src/components/feed/VideoActionButtons.js
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Animatable from 'react-native-animatable';
import { formatCount } from '../../utils/formatters';

const VideoActionButtons = ({
  video,
  isBookmarked,
  onUserProfilePress,
  onLikePress,
  onCommentPress,
  onBookmarkPress,
  onSharePress,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => onUserProfilePress(video.user.id)}
      >
        <View style={styles.actionIconContainer}>
          <Image
            source={{ uri: video.user.avatarUrl }}
            style={styles.actionAvatar}
          />
          <View style={styles.plusButtonSmall}>
            <Ionicons name="add" size={10} color="#FFF" />
          </View>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => onLikePress(video.id)}
      >
        <View style={styles.actionIconContainer}>
          <Ionicons 
            name={video.isLiked ? "heart" : "heart-outline"} 
            size={28} 
            color={video.isLiked ? "#FE2C55" : "#FFF"} 
          />
        </View>
        <Text style={styles.actionText}>{formatCount(video.likes)}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => onCommentPress(video.id)}
      > 
        <View style={styles.actionIconContainer}>
          <Ionicons name="chatbubble-ellipses-outline" size={26} color="#FFF" />
        </View>
        <Text style={styles.actionText}>{formatCount(video.comments)}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => onBookmarkPress(video.id)}
      >
        <View style={styles.actionIconContainer}>
          <Ionicons 
            name={isBookmarked ? "bookmark" : "bookmark-outline"} 
            size={26} 
            color="#FFF" 
          />
        </View>
        <Text style={styles.actionText}>{formatCount(568)}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => onSharePress(video.id)}
      >
        <View style={styles.actionIconContainer}>
          <Ionicons name="arrow-redo-outline" size={26} color="#FFF" />
        </View>
        <Text style={styles.actionText}>{formatCount(201)}</Text>
      </TouchableOpacity>
      
      <Animatable.View 
        animation="rotate"
        iterationCount="infinite" 
        duration={3000}
        easing="linear"
        style={styles.musicDiscContainer}
      >
        <Image
          source={{ uri: video.user.avatarUrl }}
          style={styles.actionMusicDisc}
        />
      </Animatable.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 10,
    bottom: 120,
    alignItems: 'center',
    zIndex: 10,
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  actionAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  plusButtonSmall: {
    position: 'absolute',
    bottom: -4,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FE2C55',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1.5,
  },
  musicDiscContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 12,
    borderColor: '#000',
    overflow: 'hidden',
  },
  actionMusicDisc: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
});

export default VideoActionButtons;