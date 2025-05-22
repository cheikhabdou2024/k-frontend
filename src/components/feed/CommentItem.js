import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { formatRelativeTime } from '../../utils/formatters';
import * as Haptics from 'expo-haptics';

const CommentItem = ({ 
  comment, 
  onLike, 
  onReply, 
  onUserPress,
  onPlayAudio,
  onPin,
  isPinned = false,
  currentUserId,
  isReply = false,
  parentId = null
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [likeAnimation] = useState(new Animated.Value(1));
  
  const hasReplies = comment.replies && comment.replies.length > 0;
  const isCurrentUser = comment.user?.id === currentUserId;
  
  const toggleReplies = () => {
    setShowReplies(!showReplies);
  };
  
  // Handle heart animation when liking
  const handleLike = () => {
    // Animate the heart
    Animated.sequence([
      Animated.timing(likeAnimation, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(likeAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    onLike && onLike(comment.id, isReply, parentId);
  };
  
  // Handle reply action
  const handleReply = () => {
    onReply && onReply(isReply ? parentId : comment.id, comment.user.username);
  };
  
  // Handle playing audio comment
  const handlePlayAudio = () => {
    if (comment.isAudio && comment.audioUri && onPlayAudio) {
      onPlayAudio(comment.audioUri);
    }
  };
  
  // Handle pin/unpin comment
  const handlePin = () => {
    if (onPin && isCurrentUser) {
      onPin(comment.id);
    }
  };
  
  // Format timestamp
  const getTimeAgo = () => {
    try {
      return formatRelativeTime(comment.createdAt);
    } catch (error) {
      return 'now';
    }
  };
  
  // Get user avatar with fallback
  const getUserAvatar = () => {
    return comment.user?.avatar || 'https://randomuser.me/api/portraits/men/32.jpg';
  };
  
  return (
    <View style={[styles.container, isReply && styles.replyContainer, isPinned && styles.pinnedContainer]}>
      {/* Pinned indicator */}
      {isPinned && (
        <View style={styles.pinnedIndicator}>
          <Ionicons name="pin" size={14} color="#FE2C55" />
          <Text style={styles.pinnedText}>Pinned</Text>
        </View>
      )}
      
      {/* User avatar */}
      <TouchableOpacity 
        style={styles.avatarContainer}
        onPress={() => onUserPress && onUserPress(comment.user?.id)}
      >
        <Image 
          source={{ uri: getUserAvatar() }} 
          style={[styles.avatar, isReply && styles.replyAvatar]} 
        />
      </TouchableOpacity>
      
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => onUserPress && onUserPress(comment.user?.id)}>
            <Text style={styles.username}>{comment.user?.username || 'Unknown User'}</Text>
          </TouchableOpacity>
          <Text style={styles.time}>{getTimeAgo()}</Text>
          
          {/* Options menu for current user's comments */}
          {isCurrentUser && onPin && (
            <TouchableOpacity 
              style={styles.optionsButton}
              onPress={handlePin}
            >
              <Ionicons 
                name={isPinned ? "pin" : "ellipsis-horizontal"} 
                size={16} 
                color={isPinned ? "#FE2C55" : "#888"} 
              />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Comment content */}
        {comment.isAudio ? (
          <TouchableOpacity 
            style={styles.audioCommentContainer}
            onPress={handlePlayAudio}
          >
            <View style={styles.audioIconContainer}>
              <Ionicons name="play-circle" size={24} color="#FE2C55" />
            </View>
            <View style={styles.audioWaveformPreview}>
              <Text style={styles.audioCommentText}>Voice comment</Text>
              <View style={styles.waveformBars}>
                {[1, 2, 3, 4, 5].map(i => (
                  <View 
                    key={i} 
                    style={[
                      styles.waveformBar, 
                      { height: Math.random() * 20 + 5 }
                    ]} 
                  />
                ))}
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <Text style={styles.content}>{comment.content}</Text>
        )}
        
        {/* Action buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleLike}
          >
            <Animated.View style={{ transform: [{ scale: likeAnimation }] }}>
              <Ionicons 
                name={comment.isLiked ? "heart" : "heart-outline"} 
                size={isReply ? 14 : 16} 
                color={comment.isLiked ? "#FE2C55" : "#888"} 
              />
            </Animated.View>
            <Text style={[
              styles.likesCount, 
              comment.isLiked && styles.likedCount
            ]}>
              {comment.likes || 0}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleReply}
          >
            <Text style={styles.replyText}>Reply</Text>
          </TouchableOpacity>
          
          {/* Show timestamp on tap */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              // Show full timestamp or other options
              console.log('Full timestamp:', comment.createdAt);
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={14} color="#888" />
          </TouchableOpacity>
        </View>
        
        {/* Replies section */}
        {hasReplies && (
          <View style={styles.repliesContainer}>
            <TouchableOpacity 
              style={styles.viewRepliesButton}
              onPress={toggleReplies}
            >
              <View style={styles.replyLine} />
              <Text style={styles.viewRepliesText}>
                {showReplies 
                  ? 'Hide replies' 
                  : `View ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`
                }
              </Text>
              <Ionicons 
                name={showReplies ? "chevron-up" : "chevron-down"} 
                size={14} 
                color="#888" 
              />
            </TouchableOpacity>
            
            {showReplies && (
              <View style={styles.repliesList}>
                {comment.replies.map(reply => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    onLike={onLike}
                    onReply={onReply}
                    onUserPress={onUserPress}
                    onPlayAudio={onPlayAudio}
                    currentUserId={currentUserId}
                    isReply={true}
                    parentId={comment.id}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#222',
  },
  replyContainer: {
    paddingLeft: 24,
    paddingRight: 8,
    paddingVertical: 8,
    borderBottomWidth: 0,
    backgroundColor: '#0a0a0a',
    marginLeft: 16,
    marginRight: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  pinnedContainer: {
    backgroundColor: 'rgba(254, 44, 85, 0.05)',
    borderLeftWidth: 3,
    borderLeftColor: '#FE2C55',
  },
  pinnedIndicator: {
    position: 'absolute',
    top: 8,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(254, 44, 85, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pinnedText: {
    fontSize: 10,
    color: '#FE2C55',
    marginLeft: 2,
    fontWeight: '500',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  replyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  contentContainer: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: '#888',
    flex: 1,
  },
  optionsButton: {
    padding: 4,
  },
  content: {
    fontSize: 14,
    color: '#FFF',
    lineHeight: 20,
    marginBottom: 8,
  },
  audioCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 8,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  audioIconContainer: {
    marginRight: 8,
  },
  audioWaveformPreview: {
    flex: 1,
  },
  audioCommentText: {
    fontSize: 14,
    color: '#FFF',
    marginBottom: 4,
  },
  waveformBars: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
  },
  waveformBar: {
    width: 3,
    backgroundColor: '#FE2C55',
    marginRight: 2,
    borderRadius: 1.5,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 4,
  },
  likesCount: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },
  likedCount: {
    color: '#FE2C55',
    fontWeight: '500',
  },
  replyText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  repliesContainer: {
    marginTop: 8,
  },
  viewRepliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  replyLine: {
    width: 20,
    height: 1,
    backgroundColor: '#444',
    marginRight: 8,
  },
  viewRepliesText: {
    fontSize: 12,
    color: '#888',
    marginRight: 4,
    flex: 1,
  },
  repliesList: {
    marginTop: 4,
  },
});

export default CommentItem;