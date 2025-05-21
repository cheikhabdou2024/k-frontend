// src/screens/feed/CommentsScreen.js
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
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CommentItem from '../../components/feed/CommentItem';
import { formatCount } from '../../utils/formatters';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');
const MODAL_HEIGHT = height * 0.7; // Modal takes 70% of screen height

// We'll continue using your mock data
// In src/screens/feed/CommentsScreen.js
// Update the mockComments array structure

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
    },
    replies: [
      {
        id: '1.1',
        content: 'Thanks! Glad you liked it 😊',
        createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
        likes: 12,
        isLiked: false,
        user: {
          id: 'current_user',
          username: 'current_user',
          avatarUrl: 'https://randomuser.me/api/portraits/men/88.jpg',
        }
      }
    ]
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
    },
    replies: []
  },
  // Keep the other comments as they are, but add empty replies array
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
    },
    replies: [
      {
        id: '3.1',
        content: 'I second this! Would love to see how it\'s done',
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        likes: 5,
        isLiked: false,
        user: {
          id: 'u4',
          username: 'emilyjones',
          avatarUrl: 'https://randomuser.me/api/portraits/women/43.jpg',
        }
      },
      {
        id: '3.2',
        content: 'Yes! tutorial please 🙏',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        likes: 3,
        isLiked: false,
        user: {
          id: 'u5',
          username: 'alexthompson',
          avatarUrl: 'https://randomuser.me/api/portraits/men/61.jpg',
        }
      }
    ]
  },
  // Add empty replies arrays to the remaining comments
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
    },
    replies: []
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
    },
    replies: []
  },
]; 

const CommentsScreen = ({ route, navigation }) => {
  const { videoId } = route.params || {};
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioCommentUri, setAudioCommentUri] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isAudioMode, setIsAudioMode] = useState(false);
  
  const insets = useSafeAreaInsets();
  const inputRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const durationTimerRef = useRef(null);
  
  // Animate in when component mounts
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);
  
  // Cleanup recording resources
  useEffect(() => {
    return () => {
      if (recording) {
        stopRecording();
      }
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [recording]);
  
  // Load comments
  useEffect(() => {
    // Simulate API call to fetch comments
    setTimeout(() => {
      setComments(mockComments);
      setLoading(false);
    }, 1000);
  }, [videoId]);
  
  // Handle closing the modal with animation
  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: MODAL_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      navigation.goBack();
    });
  };
  
  // Start audio recording
  const startRecording = async () => {
    try {
      // Request permissions
      const permissionResult = await Audio.requestPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        alert('Permission to record audio denied');
        return;
      }
      
      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      // Start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await recording.startAsync();
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start timer for recording duration
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording', error);
    }
  };
  
  // Stop audio recording
  const stopRecording = async () => {
    try {
      if (!recording) return;
      
      // Stop recording
      await recording.stopAndUnloadAsync();
      clearInterval(durationTimerRef.current);
      
      // Get recording URI
      const uri = recording.getURI();
      setAudioCommentUri(uri);
      setRecording(null);
      setIsRecording(false);
      
      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
    } catch (error) {
      console.error('Failed to stop recording', error);
    }
  };
  
  // Play recorded audio
  const playRecordedAudio = async () => {
    if (!audioCommentUri) return;
    
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: audioCommentUri });
      await sound.playAsync();
    } catch (error) {
      console.error('Failed to play audio', error);
    }
  };
  
  // Reset audio comment
  const resetAudioComment = () => {
    setAudioCommentUri(null);
  };
  
  // Toggle audio mode
  const toggleAudioMode = () => {
    setIsAudioMode(!isAudioMode);
    setShowEmojis(false);
  };
  
  // Format seconds to mm:ss
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Post audio comment
  const postAudioComment = () => {
    if (!audioCommentUri) return;
    
    // Create new comment object with audio
    const newCommentObj = {
      id: `comment_${Date.now()}`,
      content: "🎤 Voice comment",
      createdAt: new Date().toISOString(),
      likes: 0,
      isLiked: false,
      isAudio: true,
      audioUri: audioCommentUri,
      user: {
        id: 'current_user',
        username: 'current_user',
        avatarUrl: 'https://randomuser.me/api/portraits/men/88.jpg',
      },
      replies: []
    };
    
    // Add to comments list at the beginning
    setComments([newCommentObj, ...comments]);
    setAudioCommentUri(null);
  };
  
  // Handle posting a text comment
  const handlePostComment = () => {
    if (isAudioMode && audioCommentUri) {
      postAudioComment();
      return;
    }
    
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
      },
      replies: []
    };
    
    // If replying to a comment, add as a reply instead
    if (replyTo) {
      setComments(prevComments => 
        prevComments.map(comment => {
          if (comment.id === replyTo.commentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newCommentObj]
            };
          }
          return comment;
        })
      );
    } else {
      // Add to comments list at the beginning
      setComments([newCommentObj, ...comments]);
    }
    
    setNewComment('');
    
    // Clear reply if any
    if (replyTo) {
      setReplyTo(null);
    }
  };
  
  // Handle like comment
  const handleLikeComment = (commentId, isReply = false, parentId = null) => {
    setComments(prevComments => 
      prevComments.map(comment => {
        // If this is a reply, find the parent comment
        if (isReply && comment.id === parentId) {
          return {
            ...comment,
            replies: comment.replies.map(reply => {
              if (reply.id === commentId) {
                return {
                  ...reply,
                  isLiked: !reply.isLiked,
                  likes: reply.isLiked ? Math.max(0, reply.likes - 1) : reply.likes + 1
                };
              }
              return reply;
            })
          };
        }
        
        // If this is a main comment
        if (!isReply && comment.id === commentId) {
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
  
  // Play audio comment
  const playAudioComment = async (audioUri) => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      await sound.playAsync();
    } catch (error) {
      console.error('Failed to play audio comment', error);
    }
  };
  
  // Handle reply to comment
  const handleReply = (commentId, username) => {
    setReplyTo({ commentId, username });
    setNewComment(`@${username} `);
    setIsAudioMode(false);
    
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
  
  // Toggle emoji selector
  const handleToggleEmojis = () => {
    setShowEmojis(!showEmojis);
    setIsAudioMode(false);
  };
  
  // Add emoji to comment
  const handleEmojiSelect = (emoji) => {
    setNewComment(prev => prev + emoji);
  };
  
  // Render header
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerLine} />
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
      <Animated.View 
        style={[
          styles.container, 
          { transform: [{ translateY: slideAnim }] }
        ]}
      >
        <View style={styles.headerContainer}>
          <View style={styles.headerLine} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FE2C55" />
          <Text style={styles.loadingText}>Loading comments...</Text>
        </View>
      </Animated.View>
    );
  }
  
  // Simple emoji selector component
  const EmojiSelector = () => (
    <View style={styles.emojiSelector}>
      {["😂", "❤️", "👍", "🔥", "👏", "😍", "😮", "😢"].map(emoji => (
        <TouchableOpacity 
          key={emoji} 
          style={styles.emojiButton}
          onPress={() => handleEmojiSelect(emoji)}
        >
          <Text style={styles.emoji}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
  
  // Audio recording interface
  const AudioRecordingInterface = () => (
    <View style={styles.audioRecordingContainer}>
      {isRecording ? (
        <>
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>
              Recording... {formatDuration(recordingDuration)}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.stopRecordingButton}
            onPress={stopRecording}
          >
            <Ionicons name="square" size={24} color="#FFF" />
          </TouchableOpacity>
        </>
      ) : audioCommentUri ? (
        <View style={styles.audioPreviewContainer}>
          <TouchableOpacity 
            style={styles.playAudioButton}
            onPress={playRecordedAudio}
          >
            <Ionicons name="play" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.audioWaveform}>
            <Text style={styles.audioPreviewText}>Voice comment • {formatDuration(recordingDuration)}s</Text>
          </View>
          <TouchableOpacity 
            style={styles.deleteAudioButton}
            onPress={resetAudioComment}
          >
            <Ionicons name="trash-outline" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.startRecordingButton}
          onPress={startRecording}
        >
          <Ionicons name="mic" size={24} color="#FFF" />
          <Text style={styles.startRecordingText}>Tap to record</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          paddingBottom: insets.bottom,
          height: MODAL_HEIGHT,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        {renderHeader()}
        
        {/* Comments list */}
        <FlatList
          data={comments}
          renderItem={({ item }) => (
            <CommentItem
              comment={item}
              onLike={(id) => handleLikeComment(id)}
              onReply={handleReply}
              onUserPress={(userId) => console.log('Navigate to user profile:', userId)}
              onPlayAudio={playAudioComment}
            />
          )}
          keyExtractor={item => item.id}
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
        
        {/* Emoji selector */}
        {showEmojis && <EmojiSelector />}
        
        {/* Audio recording interface */}
        {isAudioMode && <AudioRecordingInterface />}
        
        {/* Comment input */}
        <View style={styles.inputContainer}>
          {isAudioMode ? (
            <TouchableOpacity 
              style={[
                styles.postButton,
                !audioCommentUri && styles.postButtonDisabled
              ]}
              onPress={postAudioComment}
              disabled={!audioCommentUri}
            >
              <Text style={styles.postButtonText}>Post</Text>
            </TouchableOpacity>
          ) : (
            <>
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
                style={styles.iconButton}
                onPress={handleToggleEmojis}
              >
                <Ionicons 
                  name="happy-outline" 
                  size={24} 
                  color={showEmojis ? "#FE2C55" : "#888"} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={toggleAudioMode}
              >
                <Ionicons 
                  name="mic-outline" 
                  size={24} 
                  color={isAudioMode ? "#FE2C55" : "#888"} 
                />
              </TouchableOpacity>
              
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
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  keyboardContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 20,
    fontWeight: '600',
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#222',
  },
  headerLine: {
    width: 40,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 16,
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
  iconButton: {
    marginLeft: 8,
    padding: 6,
  },
  postButton: {
    marginLeft: 8,
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
  emojiSelector: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#191919',
    borderTopWidth: 0.5,
    borderTopColor: '#333',
    justifyContent: 'space-around',
  },
  emojiButton: {
    padding: 8,
  },
  emoji: {
    fontSize: 24,
  },
  audioRecordingContainer: {
    padding: 16,
    backgroundColor: '#191919',
    borderTopWidth: 0.5,
    borderTopColor: '#333',
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FE2C55',
    marginRight: 8,
  },
  recordingText: {
    color: '#FE2C55',
    fontSize: 14,
  },
  startRecordingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 20,
  },
  startRecordingText: {
    color: '#FFF',
    marginLeft: 8,
  },
  stopRecordingButton: {
    backgroundColor: '#FE2C55',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 8,
  },
  playAudioButton: {
    backgroundColor: '#333',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  audioWaveform: {
    flex: 1,
    height: 40,
    backgroundColor: '#333',
    borderRadius: 20,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  audioPreviewText: {
    color: '#FFF',
    fontSize: 14,
  },
  deleteAudioButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default CommentsScreen;