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
  Alert,
  Keyboard
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CommentItem from '../../components/feed/CommentItem';
import { formatCount } from '../../utils/formatters';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

// Import API services
import { videoService } from '../../services/api';
import commentService from '../../services/commentService';
import mockDataService from '../../services/mockDataService';

const { width, height } = Dimensions.get('window');
const MODAL_HEIGHT = height * 0.7;

// (Removed misplaced navigation and API code block)

const CommentsScreen = ({ route, navigation }) => {
  const { videoId, onClose } = route.params || {};
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [posting, setPosting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioCommentUri, setAudioCommentUri] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isAudioMode, setIsAudioMode] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true
  });
  
  const insets = useSafeAreaInsets();
  const inputRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const flatListRef = useRef(null);
  const durationTimerRef = useRef(null);
  
  // Animate in when component mounts
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Add keyboard listeners
    const keyboardWillShowSub = Keyboard.addListener(
      'keyboardWillShow',
      () => setKeyboardVisible(true)
    );
    const keyboardWillHideSub = Keyboard.addListener(
      'keyboardWillHide',
      () => setKeyboardVisible(false)
    );
    
    return () => {
      keyboardWillShowSub.remove();
      keyboardWillHideSub.remove();
      
      // Clean up recording resources
      if (recording) {
        stopRecording();
      }
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, []);
  
  // Load comments and comment count when component mounts
  useEffect(() => {
    if (videoId) {
      fetchComments();
      fetchCommentCount();
    }
  }, [videoId]);
  
  // Fetch comments from API
  const fetchComments = async (page = 1, isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      console.log(`Fetching comments for video ${videoId}, page ${page}`);
      
      // Use mock data service for now (replace with real API when ready)
      const response = await mockDataService.getVideoComments(videoId, page, pagination.limit);
      
      if (response && response.comments) {
        if (isLoadMore) {
          setComments(prev => [...prev, ...response.comments]);
        } else {
          setComments(response.comments);
        }
        
        setPagination(prev => ({
          ...prev,
          page,
          hasMore: response.pagination.hasMore
        }));
      }
      
      // When ready to use real API, replace above with:
      /*
      const response = await commentService.getVideoComments(videoId, page, pagination.limit);
      
      if (response && response.comments) {
        if (isLoadMore) {
          setComments(prev => [...prev, ...response.comments]);
        } else {
          setComments(response.comments);
        }
        
        setPagination(prev => ({
          ...prev,
          page,
          hasMore: response.pagination.hasMore
        }));
      }
      */
      
    } catch (error) {
      console.error('Error loading comments:', error);
      Alert.alert('Error', 'Failed to load comments. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };
  
  // Fetch comment count
  const fetchCommentCount = async () => {
    try {
      // Use mock data service
      const response = await mockDataService.getCommentCount(videoId);
      if (response && typeof response.count === 'number') {
        setCommentCount(response.count);
      }
      
      // When ready to use real API, replace above with:
      /*
      const response = await commentService.getCommentCount(videoId);
      if (response && typeof response.count === 'number') {
        setCommentCount(response.count);
      }
      */
    } catch (error) {
      console.error('Error fetching comment count:', error);
    }
  };
  
  // Load more comments
  const loadMoreComments = () => {
    if (!loadingMore && pagination.hasMore) {
      fetchComments(pagination.page + 1, true);
    }
  };
  
  // Handle pull to refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchComments(1, false);
  };

  // Handle closing the modal with animation
  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: MODAL_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      if (onClose) onClose();
      navigation.goBack();
    });
  };
  
  // Start audio recording
  const startRecording = async () => {
    try {
      const permissionResult = await Audio.requestPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission required', 'Please allow microphone access to record audio comments.');
        return;
      }
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await recording.startAsync();
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 30) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };
  
  // Stop audio recording
  const stopRecording = async () => {
    try {
      if (!recording) return;
      
      await recording.stopAndUnloadAsync();
      clearInterval(durationTimerRef.current);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const uri = recording.getURI();
      setAudioCommentUri(uri);
      setRecording(null);
      setIsRecording(false);
      
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
  const postAudioComment = async () => {
    if (!audioCommentUri) return;
    
    try {
      setPosting(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Use mock data service
      const newComment = await mockDataService.addAudioComment(
        videoId, 
        audioCommentUri, 
        recordingDuration
      );
      
      setComments([newComment, ...comments]);
      setCommentCount(prev => prev + 1);
      setAudioCommentUri(null);
      
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: true });
      }
      
      // When ready to use real API, replace above with:
      /*
      const response = await commentService.addComment(videoId, "🎤 Voice comment", authToken);
      if (response) {
        setComments([response, ...comments]);
        setCommentCount(prev => prev + 1);
        setAudioCommentUri(null);
        
        if (flatListRef.current) {
          flatListRef.current.scrollToOffset({ offset: 0, animated: true });
        }
      }
      */
    } catch (error) {
      console.error('Error posting audio comment:', error);
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    } finally {
      setPosting(false);
    }
  };
  
  // Handle posting a text comment
  const handlePostComment = async () => {
    if (isAudioMode && audioCommentUri) {
      await postAudioComment();
      return;
    }
    
    if (!newComment.trim()) return;
    
    try {
      setPosting(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Use mock data service
      const addedComment = await mockDataService.addComment(videoId, newComment.trim());
      
      setComments([addedComment, ...comments]);
      setCommentCount(prev => prev + 1);
      setNewComment('');
      
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: true });
      }
      
      // When ready to use real API, replace above with:
      /*
      const response = await commentService.addComment(videoId, newComment, authToken);
      if (response) {
        setComments([response, ...comments]);
        setCommentCount(prev => prev + 1);
        setNewComment('');
        
        if (flatListRef.current) {
          flatListRef.current.scrollToOffset({ offset: 0, animated: true });
        }
      }
      */
      
    } catch (error) {
      console.error('Error posting comment:', error);
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    } finally {
      setPosting(false);
    }
    
    // Clear reply if any
    if (replyTo) {
      setReplyTo(null);
    }
  };
  
  // Handle like comment
  const handleLikeComment = async (commentId) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Use mock data service
      await mockDataService.toggleCommentLike(videoId, commentId);
      
      // Update local state
      setComments(prevComments => 
        prevComments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              isLiked: !comment.isLiked,
              likes: comment.isLiked ? Math.max(0, (comment.likes || 0) - 1) : (comment.likes || 0) + 1
            };
          }
          // Check replies too
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply => {
                if (reply.id === commentId) {
                  return {
                    ...reply,
                    isLiked: !reply.isLiked,
                    likes: reply.isLiked ? Math.max(0, (reply.likes || 0) - 1) : (reply.likes || 0) + 1
                  };
                }
                return reply;
              })
            };
          }
          return comment;
        })
      );
      
      // When ready to use real API, replace above with:
      /*
      await commentService.toggleCommentLike(commentId, authToken);
      // Then update local state as above
      */
    } catch (error) {
      console.error('Error liking comment:', error);
    }
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
        {formatCount(commentCount)} comments
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
        {renderHeader()}
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
      {["😂", "❤️", "👍", "🔥", "👏", "😍", "😮", "😢", "🤔", "💯", "🙌", "👀", "💕", "🥰", "😭", "🤣"].map(emoji => (
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
            <Animated.View style={styles.recordingDot} />
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
  
  // Render footer (loading more indicator)
  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color="#FE2C55" />
        <Text style={styles.footerLoadingText}>Loading more comments...</Text>
      </View>
    );
  };
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          paddingBottom: insets.bottom,
          height: MODAL_HEIGHT + (keyboardVisible ? 100 : 0),
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
          ref={flatListRef}
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
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.commentsList}
          onEndReached={loadMoreComments}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FE2C55"
              colors={["#FE2C55"]}
            />
          }
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
          {isAudioMode && audioCommentUri ? (
            <TouchableOpacity 
              style={[
                styles.postButton,
                (!audioCommentUri || posting) && styles.postButtonDisabled
              ]}
              onPress={postAudioComment}
              disabled={!audioCommentUri || posting}
            >
              {posting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.postButtonText}>Post</Text>
              )}
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
                editable={!posting}
              />
              
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={handleToggleEmojis}
                disabled={posting}
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
                disabled={posting}
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
                  (!newComment.trim() || posting) && styles.postButtonDisabled
                ]}
                onPress={handlePostComment}
                disabled={!newComment.trim() || posting}
              >
                {posting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.postButtonText}>Post</Text>
                )}
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
  footerLoading: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  footerLoadingText: {
    color: '#888',
    marginLeft: 8,
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
    flexWrap: 'wrap',
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