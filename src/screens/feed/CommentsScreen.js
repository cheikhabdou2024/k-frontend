import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CommentItem from '../../components/feed/CommentItem';
import { formatCount } from '../../utils/formatters';

// Mock data for comments
const mockComments = [
  {
    id: '1',
    content: 'This is amazing! 🔥',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    likes: 42,
    isLiked: false,
    user: {
      id: 'u1',
      username: 'johndoe',
      avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
    }
  },
  {
    id: '2',
    content: 'Love your content! Keep it up 👏',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    likes: 18,
    isLiked: true,
    user: {
      id: 'u2',
      username: 'sarahsmith',
      avatarUrl: 'https://randomuser.me/api/portraits/women/32.jpg',
    }
  },
  {
    id: '3',
    content: 'Can you do a tutorial on this?',
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    likes: 7,
    isLiked: false,
    user: {
      id: 'u3',
      username: 'mikewilson',
      avatarUrl: 'https://randomuser.me/api/portraits/men/51.jpg',
    }
  },
  {
    id: '4',
    content: 'Just followed you! Check out my profile 🙌',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    likes: 3,
    isLiked: false,
    user: {
      id: 'u4',
      username: 'emilyjones',
      avatarUrl: 'https://randomuser.me/api/portraits/women/43.jpg',
    }
  },
  {
    id: '5',
    content: 'The editing on this is so smooth! What app do you use?',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    likes: 12,
    isLiked: false,
    user: {
      id: 'u5',
      username: 'alexthompson',
      avatarUrl: 'https://randomuser.me/api/portraits/men/61.jpg',
    }
  },
];

const CommentsScreen = ({ route, navigation }) => {
  const { videoId } = route.params || {};
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  
  const inputRef = useRef(null);
  
  // Load comments
  useEffect(() => {
    // Simulate API call to fetch comments
    setTimeout(() => {
      setComments(mockComments);
      setLoading(false);
    }, 1000);
  }, [videoId]);
  
  // Handle closing the modal
  const handleClose = () => {
    navigation.goBack();
  };
  
  // Handle posting a new comment
  const handlePostComment = () => {
    if (!newComment.trim()) return;
    
    // Create new comment object
    const newCommentObj = {
      id: `comment_${Date.now()}`,
      content: newComment,
      createdAt: new Date().toISOString(),
      likes: 0,
      isLiked: false,
      user: {
        id: 'current_user',
        username: 'current_user',
        avatarUrl: 'https://randomuser.me/api/portraits/men/88.jpg',
      }
    };
    
    // Add to comments list at the beginning
    setComments([newCommentObj, ...comments]);
    setNewComment('');
    
    // Clear reply if any
    if (replyTo) {
      setReplyTo(null);
    }
  };
  
  // Handle like comment
  const handleLikeComment = (commentId) => {
    setComments(prevComments => 
      prevComments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            isLiked: !comment.isLiked,
            likes: comment.isLiked ? Math.max(0, comment.likes - 1) : comment.likes + 1
          };
        }
        return comment;
      })
    );
  };
  
  // Handle reply to comment
  const handleReply = (commentId, username) => {
    setReplyTo({ commentId, username });
    setNewComment(`@${username} `);
    
    // Focus input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Cancel reply
  const handleCancelReply = () => {
    setReplyTo(null);
    setNewComment('');
  };
  
  // Render header
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>
        {formatCount(comments.length)} comments
      </Text>
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Ionicons name="close" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
  
  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FE2C55" />
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Comments list */}
      <FlatList
        data={comments}
        renderItem={({ item }) => (
          <CommentItem
            comment={item}
            onLike={handleLikeComment}
            onReply={handleReply}
            onUserPress={(userId) => console.log('Navigate to user profile:', userId)}
          />
        )}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.commentsList}
      />
      
      {/* Reply indicator */}
      {replyTo && (
        <View style={styles.replyContainer}>
          <Text style={styles.replyText}>
            Replying to <Text style={styles.replyUsername}>{replyTo.username}</Text>
          </Text>
          <TouchableOpacity onPress={handleCancelReply}>
            <Ionicons name="close-circle" size={18} color="#888" />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Comment input */}
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Add a comment..."
          placeholderTextColor="#777"
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
        <TouchableOpacity 
          style={[
            styles.postButton,
            !newComment.trim() && styles.postButtonDisabled
          ]}
          onPress={handlePostComment}
          disabled={!newComment.trim()}
        >
          <Text style={styles.postButtonText}>Post</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#222',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeButton: {
    padding: 4,
  },
  commentsList: {
    paddingBottom: 20,
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#111',
    borderTopWidth: 0.5,
    borderTopColor: '#222',
  },
  replyText: {
    fontSize: 12,
    color: '#888',
  },
  replyUsername: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#222',
    backgroundColor: '#111',
  },
  input: {
    flex: 1,
    backgroundColor: '#222',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#FFF',
    fontSize: 14,
    maxHeight: 100,
  },
  postButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: '#FE2C55',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default CommentsScreen;