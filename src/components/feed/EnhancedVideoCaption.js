import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Animated } from 'react-native';

/**
 * Enhanced caption component that formats hashtags, mentions, and handles caption expansion
 */
const EnhancedVideoCaption = ({ 
  caption, 
  username,
  onHashtag, 
  onUserMention, 
  onCaptionPress,
  maxLines = 2,
  style = {}
}) => {
  const [expanded, setExpanded] = useState(false);
  const [textHeight, setTextHeight] = useState(0);
  const [needsExpansion, setNeedsExpansion] = useState(false);
  
  // Animation for expanded state
  const expandAnim = useState(new Animated.Value(0))[0];
  
  // Determine if text needs expansion once we know its height
  useEffect(() => {
    if (textHeight > 0) {
      // Rough estimation of line height (can be adjusted)
      const lineHeight = 18;
      const estimatedLines = textHeight / lineHeight;
      setNeedsExpansion(estimatedLines > maxLines);
    }
  }, [textHeight, maxLines]);
  
  // Run animation when expanded state changes
  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [expanded]);
  
  // Handle text layout to get height
  const onTextLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    setTextHeight(height);
  };
  
  // Toggle expanded state
  const toggleExpand = () => {
    setExpanded(!expanded);
    if (onCaptionPress) {
      onCaptionPress(!expanded);
    }
  };
  
  // Format caption to parse hashtags and mentions
  const formatCaption = (text) => {
    if (!text) return [];
    
    // Split by hashtags and mentions
    const pattern = /(\#[\w\u0590-\u05ff]+)|(\@[\w\u0590-\u05ff]+)/g;
    const parts = text.split(pattern).filter(Boolean);
    
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        // Hashtag
        return (
          <Text
            key={`${index}-${part}`}
            style={styles.hashtag}
            onPress={() => onHashtag && onHashtag(part)}
          >
            {part}
          </Text>
        );
      } else if (part.startsWith('@')) {
        // Mention
        return (
          <Text
            key={`${index}-${part}`}
            style={styles.mention}
            onPress={() => onUserMention && onUserMention(part.substring(1))}
          >
            {part}
          </Text>
        );
      } else {
        // Regular text
        return (
          <Text key={`${index}-text`} style={styles.textContent}>
            {part}
          </Text>
        );
      }
    });
  };
  
  // Calculate caption max height based on expanded state
  const maxHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [needsExpansion ? maxLines * 18 : 1000, 1000],
  });
  
  return (
    <View style={[styles.container, style]}>
      {/* Username */}
      {username && (
        <Text style={styles.username}>
          {username}{' '}
        </Text>
      )}
      
      {/* Caption */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={toggleExpand}
        disabled={!needsExpansion}
      >
        <Animated.View style={{ maxHeight }}>
          <Text
            style={styles.caption}
            onLayout={onTextLayout}
            numberOfLines={expanded ? undefined : maxLines}
            ellipsizeMode="tail"
          >
            {formatCaption(caption)}
          </Text>
        </Animated.View>
        
        {/* Show more indicator */}
        {needsExpansion && !expanded && (
          <Text style={styles.readMore}>more</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  caption: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 18,
    flexWrap: 'wrap',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  username: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  textContent: {
    color: '#FFF',
  },
  hashtag: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  mention: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  readMore: {
    color: '#CCC',
    fontSize: 14,
    marginTop: 2,
  },
});

export default EnhancedVideoCaption;