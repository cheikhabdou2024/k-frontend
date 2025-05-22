// src/components/feed/CommentItem.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { formatRelativeTime } from '../../utils/formatters';

const CommentItem = ({ 
  comment, 
  onLike, 
  onReply, 
  onUserPress,
  onPlayAudio,
  isReply = false,
  parentId = null
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const hasReplies = comment.replies && comment.replies.length > 0;
  
  const toggleReplies = () => {
    setShowReplies(!showReplies);
  };
  
  // Handle heart animation when liking
  const handleLike = () => {
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
  
  return (
    <View style={[styles.container, isReply && styles.replyContainer]}>
      {/* User avatar */}
      <TouchableOpacity 
        style={styles.avatarContainer}
        onPress={() => onUserPress && onUserPress(comment.user.id)}
      >
        <Image 
          source={{ uri: comment.user.avatarUrl }} 
          style={[styles.avatar, isReply && styles.replyAvatar]} 
        />
      </TouchableOpacity>
      
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => onUserPress && onUserPress(comment.user.id)}>
            <Text style={styles.username}>{comment.user.username}</Text>
          </TouchableOpacity>
          <Text style={styles.time}>{formatRelativeTime(comment.createdAt)}</Text>
        </View>
        
        {comment.isAudio ? (
          <TouchableOpacity 
            style={styles.audioCommentContainer}
            onPress={handlePlayAudio}
          >
            <Ionicons name="play-circle" size={20} color="#FE2C55" />
            <Text style={styles.audioCommentText}>{comment.content}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.content}>{comment.content}</Text>
        )}
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleLike}
          >
            <Ionicons 
              name={comment.isLiked ? "heart" : "heart-outline"} 
              size={isReply ? 14 : 16} 
              color={comment.isLiked ? "#FE2C55" : "#888"} 
            />
            <Text style={[
              styles.likesCount, 
              comment.isLiked && styles.likedCount
            ]}>
              {comment.likes}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleReply}
          >
            <Text style={styles.replyText}>Reply</Text>
          </TouchableOpacity>
        </View>
        
        {/* Replies section */}
        {hasReplies && (
          <View style={styles.repliesContainer}>
            <TouchableOpacity 
              style={styles.viewRepliesButton}
              onPress={toggleReplies}
            >
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
    paddingLeft: 8,
    paddingRight: 8,
    paddingVertical: 8,
    borderBottomWidth: 0,
    backgroundColor: '#0f0f0f',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  },
  content: {
    fontSize: 14,
    color: '#FFF',
    lineHeight: 20,
  },
  audioCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  audioCommentText: {
    fontSize: 14,
    color: '#FFF',
    marginLeft: 6,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  likesCount: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },
  likedCount: {
    color: '#FE2C55',
  },
  replyText: {
    fontSize: 12,
    color: '#888',
  },
  repliesContainer: {
    marginTop: 8,
  },
  viewRepliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  viewRepliesText: {
    fontSize: 12,
    color: '#888',
    marginRight: 4,
  },
  repliesList: {
    marginTop: 4,
    paddingLeft: 4,
  },
});

export default CommentItem;