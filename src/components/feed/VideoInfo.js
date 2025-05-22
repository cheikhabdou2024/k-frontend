
// src/components/feed/VideoInfo.js
import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const VideoInfo = ({ video, onSoundPress }) => {
  return (
    <View style={styles.container}>
      {/* Username and caption */}
      <Text style={styles.videoUsername}>
        {video.user.username} <Text style={styles.fireEmoji}>🔥</Text> MR🔮✗ 🔥
      </Text>
      
      {/* Location info if available */}
      {video.location && (
        <Text style={styles.locationText}>
          {video.location} insta Id:- flyingarround6 @ 
          <Text style={styles.userHighlight}>Awara ...</Text>
        </Text>
      )}
      
      {/* Sound info */}
      <TouchableOpacity 
        style={styles.soundInfo}
        onPress={() => onSoundPress(video.sound.id)}
      >
        <Ionicons name="musical-note" size={16} color="#FFF" />
        <Text style={styles.soundText}>
          Contains: love nwantiti (ah ah ah)...
        </Text>
      </TouchableOpacity>
      
      {/* Repost banner */}
      <TouchableOpacity style={styles.repostBanner}>
        <Ionicons name="repeat" size={20} color="#FFF" />
        <Text style={styles.repostText}>Repost to followers</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 90,
    zIndex: 10,
  },
  videoUsername: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  fireEmoji: {
    fontSize: 16,
  },
  userHighlight: {
    color: '#EEE',
    fontWeight: '500',
  },
  locationText: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  soundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  soundText: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  repostBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginTop: 8,
  },
  repostText: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default VideoInfo;