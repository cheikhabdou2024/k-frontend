import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Animatable from 'react-native-animatable';

/**
 * TikTok-style sound info bar that appears at the bottom of videos
 * Based on the provided screenshots to exactly match TikTok interface
 */
const SoundInfoBar = ({
  soundName,
  userAvatar,
  onPress,
  style
}) => {
  return (
    <TouchableOpacity 
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Music note icon */}
      <Ionicons name="musical-note" size={18} color="#FFF" />
      
      {/* Sound name */}
      <Text style={styles.soundText}>{soundName}</Text>
      
      {/* User avatar in disc */}
      <Animatable.View
        animation="rotate"
        iterationCount="infinite"
        duration={3000}
        easing="linear"
        style={styles.avatarContainer}
      >
        <Image
          source={{ uri: userAvatar }}
          style={styles.avatar}
        />
      </Animatable.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  soundText: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  avatarContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFF',
    overflow: 'hidden',
    marginLeft: 10,
  },
  avatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
  }
});

export default SoundInfoBar;