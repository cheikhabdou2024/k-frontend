import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * TikTok-style enhanced caption component
 * Based on the provided screenshots to exactly match TikTok interface
 */
const EnhancedCaption = ({
  username,
  caption,
  onUsernamePress,
  onHashtagPress,
  maxLines = 2,
  style
}) => {
  const [expanded, setExpanded] = useState(false);
  
  // Parse caption to format hashtags
  const formatCaption = (text) => {
    if (!text) return [];
    
    // Regular expression to identify hashtags
    const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
    
    // Split the caption by hashtags
    const parts = text.split(hashtagRegex);
    const hashtags = text.match(hashtagRegex) || [];
    
    const result = [];
    
    // Interleave regular text and hashtags
    parts.forEach((part, index) => {
      if (part) {
        result.push(
          <Text key={`text-${index}`} style={styles.captionText}>
            {part}
          </Text>
        );
      }
      
      if (hashtags[index]) {
        result.push(
          <Text
            key={`hashtag-${index}`}
            style={styles.hashtag}
            onPress={() => onHashtagPress && onHashtagPress(hashtags[index])}
          >
            {hashtags[index]}
          </Text>
        );
      }
    });
    
    return result;
  };
  
  return (
    <View style={[styles.container, style]}>
      {/* Username */}
      <TouchableOpacity onPress={onUsernamePress}>
        <Text style={styles.username}>{username}</Text>
      </TouchableOpacity>
      
      {/* Caption */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setExpanded(!expanded)}
      >
        <Text
          style={styles.caption}
          numberOfLines={expanded ? undefined : maxLines}
          ellipsizeMode="tail"
        >
          {formatCaption(caption)}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
    marginBottom: 8,
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
  caption: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  captionText: {
    color: '#FFF',
  },
  hashtag: {
    color: '#FFF',
    fontWeight: 'bold',
  }
});

export default EnhancedCaption;