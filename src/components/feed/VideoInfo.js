// src/components/feed/EnhancedVideoInfo.js
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  Image, 
  Animated, 
  Dimensions 
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const VideoInfo = ({ 
  video, 
  onSoundPress, 
  onUserPress,
  onHashtagPress,
  onLocationPress,
  isVisible = true,
  style
}) => {
  // State
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [captionHeight, setCaptionHeight] = useState(0);
  
  // Animation refs
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const captionAnim = useRef(new Animated.Value(0)).current;
  
  // Animate in when component becomes visible
  useEffect(() => {
    if (isVisible) {
      animateIn();
    } else {
      animateOut();
    }
  }, [isVisible]);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Parse caption for hashtags and mentions
  const parseCaption = (caption) => {
    if (!caption) return [];
    
    const parts = caption.split(/([@#][\w]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return {
          id: index,
          text: part,
          type: 'hashtag',
          onPress: () => onHashtagPress && onHashtagPress(part.substring(1))
        };
      } else if (part.startsWith('@')) {
        return {
          id: index,
          text: part,
          type: 'mention',
          onPress: () => onUserPress && onUserPress(part.substring(1))
        };
      } else {
        return {
          id: index,
          text: part,
          type: 'text'
        };
      }
    });
  };

  // Handle caption expand/collapse
  const toggleCaption = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const newExpanded = !showFullCaption;
    setShowFullCaption(newExpanded);
    
    Animated.timing(captionAnim, {
      toValue: newExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Handle user profile press with animation
  const handleUserPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    if (onUserPress) {
      onUserPress(video.user.id);
    }
  };

  // Handle sound press with animation
  const handleSoundPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (onSoundPress) {
      onSoundPress(video.sound?.id);
    }
  };

  // Render parsed caption
  const renderCaption = () => {
    const parsedCaption = parseCaption(video.caption);
    const maxLength = 100;
    const isLongCaption = video.caption && video.caption.length > maxLength;
    
    return (
      <View style={styles.captionContainer}>
        <Animated.View style={[
          styles.captionContent,
          {
            maxHeight: captionAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [60, 200], // Animate height
            })
          }
        ]}>
          <Text style={styles.captionText}>
            {parsedCaption.map((part) => (
              part.type === 'hashtag' ? (
                <Text
                  key={part.id}
                  style={styles.hashtag}
                  onPress={part.onPress}
                >
                  {part.text}
                </Text>
              ) : part.type === 'mention' ? (
                <Text
                  key={part.id}
                  style={styles.mention}
                  onPress={part.onPress}
                >
                  {part.text}
                </Text>
              ) : (
                <Text key={part.id} style={styles.normalText}>
                  {part.text}
                </Text>
              )
            ))}
          </Text>
        </Animated.View>
        
        {isLongCaption && (
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={toggleCaption}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.expandText}>
              {showFullCaption ? 'Less' : 'More'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render user info section
  const renderUserInfo = () => (
    <Animated.View 
      style={[
        styles.userInfoContainer,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <TouchableOpacity 
        style={styles.userRow}
        onPress={handleUserPress}
        activeOpacity={0.8}
      >
        <Image 
          source={{ uri: video.user.avatarUrl }} 
          style={styles.miniAvatar}
        />
        <View style={styles.userTextContainer}>
          <View style={styles.usernameRow}>
            <Text style={styles.username}>
              {video.user.username}
            </Text>
            {video.user.isVerified && (
              <Ionicons 
                name="checkmark-circle" 
                size={14} 
                color="#20BDFF" 
                style={styles.verifiedIcon}
              />
            )}
            <View style={styles.followIndicator}>
              <Text style={styles.followText}>Follow</Text>
            </View>
          </View>
          
          {video.user.name && (
            <Text style={styles.displayName}>
              {video.user.name}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  // Render location info
  const renderLocationInfo = () => {
    if (!video.location) return null;
    
    return (
      <TouchableOpacity 
        style={styles.locationContainer}
        onPress={() => onLocationPress && onLocationPress(video.location)}
        activeOpacity={0.8}
      >
        <Ionicons name="location-outline" size={14} color="#FFF" />
        <Text style={styles.locationText} numberOfLines={1}>
          {video.location}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render sound info
  const renderSoundInfo = () => {
    if (!video.sound) return null;
    
    return (
      <TouchableOpacity 
        style={styles.soundContainer}
        onPress={handleSoundPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.3)']}
          style={styles.soundGradient}
        >
          <View style={styles.soundContent}>
            <Ionicons name="musical-notes" size={16} color="#FFF" />
            <Text style={styles.soundText} numberOfLines={1}>
              {video.sound.name}
            </Text>
            <View style={styles.soundWaveIcon}>
              <View style={[styles.wave, styles.wave1]} />
              <View style={[styles.wave, styles.wave2]} />
              <View style={[styles.wave, styles.wave3]} />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // Render video stats
  const renderVideoStats = () => (
    <View style={styles.statsContainer}>
      {video.views && (
        <View style={styles.statItem}>
          <Ionicons name="eye-outline" size={12} color="rgba(255,255,255,0.8)" />
          <Text style={styles.statText}>
            {formatCount(video.views)}
          </Text>
        </View>
      )}
      
      <View style={styles.statItem}>
        <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.8)" />
        <Text style={styles.statText}>
          {formatTimeAgo(video.createdAt)}
        </Text>
      </View>
    </View>
  );

  if (!isVisible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            })
          }]
        },
        style
      ]}
    >
      {/* Main content container */}
      <View style={styles.contentContainer}>
        {/* User info section */}
        {renderUserInfo()}
        
        {/* Caption section */}
        {video.caption && renderCaption()}
        
        {/* Location info */}
        {renderLocationInfo()}
        
        {/* Video stats */}
        {renderVideoStats()}
        
        {/* Sound info */}
        {renderSoundInfo()}
      </View>
      
      {/* Gradient overlay for better text readability */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.gradientOverlay}
        pointerEvents="none"
      />
    </Animated.View>
  );
};

// Helper functions
const formatCount = (count) => {
  if (!count) return '0';
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 90,
    zIndex: 10,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    right: -20,
    height: 120,
    zIndex: -1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  
  // User info styles
  userInfoContainer: {
    marginBottom: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  userTextContainer: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  followIndicator: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(254, 44, 85, 0.8)',
    borderRadius: 10,
  },
  followText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  displayName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  
  // Caption styles
  captionContainer: {
    marginBottom: 8,
  },
  captionContent: {
    overflow: 'hidden',
  },
  captionText: {
    lineHeight: 20,
  },
  normalText: {
    color: '#FFF',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  hashtag: {
    color: '#25F4EE',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  mention: {
    color: '#FE2C55',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  expandButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  expandText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Location styles
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  
  // Stats styles
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '500',
  },
  
  // Sound styles
  soundContainer: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    overflow: 'hidden',
    maxWidth: SCREEN_WIDTH * 0.7,
  },
  soundGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  soundContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  soundText: {
    color: '#FFF',
    fontSize: 12,
    marginLeft: 6,
    marginRight: 8,
    fontWeight: '500',
    flex: 1,
  },
  soundWaveIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wave: {
    width: 2,
    backgroundColor: '#FFF',
    marginHorizontal: 1,
    borderRadius: 1,
  },
  wave1: {
    height: 8,
  },
  wave2: {
    height: 12,
  },
  wave3: {
    height: 6,
  },
});

export default VideoInfo;