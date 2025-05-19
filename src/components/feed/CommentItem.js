import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { formatRelativeTime } from '../../utils/formatters';

const CommentItem = ({ comment, onLike, onReply, onUserPress }) => {
  return (
    <View style={styles.container}>
      {/* User avatar */}
      <TouchableOpacity 
        style={styles.avatarContainer}
        onPress={() => onUserPress && onUserPress(comment.user.id)}
      >
        <Image 
          source={{ uri: comment.user.avatarUrl }} 
          style={styles.avatar} 
        />
      </TouchableOpacity>
      
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => onUserPress && onUserPress(comment.user.id)}>
            <Text style={styles.username}>{comment.user.username}</Text>
          </TouchableOpacity>
          <Text style={styles.time}>{formatRelativeTime(comment.createdAt)}</Text>
        </View>
        
        <Text style={styles.content}>{comment.content}</Text>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onLike && onLike(comment.id)}
          >
            <Ionicons 
              name={comment.isLiked ? "heart" : "heart-outline"} 
              size={16} 
              color={comment.isLiked ? "#FE2C55" : "#888"} 
            />
            {comment.likes > 0 && (
              <Text style={styles.likesCount}>{comment.likes}</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onReply && onReply(comment.id, comment.user.username)}
          >
            <Text style={styles.replyText}>Reply</Text>
          </TouchableOpacity>
        </View>
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
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  replyText: {
    fontSize: 12,
    color: '#888',
  },
});

export default CommentItem;