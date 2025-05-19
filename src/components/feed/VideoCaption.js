import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { formatCaption } from '../../utils/formatters';

/**
 * Component to display video captions with styled hashtags and mentions
 */
const VideoCaption = ({ caption, onHashtag, onUserMention, maxLines = 3 }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Return early if no caption
  if (!caption) {
    return null;
  }
  
  // Format caption to get segments (plain text, hashtags, mentions)
  const captionSegments = formatCaption(caption);
  
  // Toggle expand/collapse caption
  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={toggleExpand}
        style={styles.captionContainer}
      >
        <Text
          style={styles.caption}
          numberOfLines={expanded ? undefined : maxLines}
          ellipsizeMode="tail"
        >
          {captionSegments.map((segment, index) => {
            // Render hashtags with special styling and tap handling
            if (segment.type === 'hashtag') {
              return (
                <Text
                  key={index}
                  style={styles.hashtag}
                  onPress={(e) => {
                    e.stopPropagation();
                    onHashtag && onHashtag(segment.text);
                  }}
                >
                  {segment.text}
                </Text>
              );
            }
            
            // Render user mentions with special styling and tap handling
            if (segment.type === 'mention') {
              return (
                <Text
                  key={index}
                  style={styles.mention}
                  onPress={(e) => {
                    e.stopPropagation();
                    onUserMention && onUserMention(segment.text);
                  }}
                >
                  {segment.text}
                </Text>
              );
            }
            
            // Regular text
            return (
              <Text key={index} style={styles.captionText}>
                {segment.text}
              </Text>
            );
          })}
        </Text>
        
        {/* Show "more" text if caption is longer than maxLines and not expanded */}
        {!expanded && caption.length > 50 && (
          <Text style={styles.moreText}>more</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  captionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  caption: {
    flex: 1,
    flexWrap: 'wrap',
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
  },
  captionText: {
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
  moreText: {
    color: '#CCC',
    fontSize: 14,
    marginLeft: 5,
  },
});

export default VideoCaption;