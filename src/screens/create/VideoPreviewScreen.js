import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Video } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import SimpleAdaptiveVideo from '../../components/video/SimpleAdaptiveVideo';
import apiService from '../../services/apiService';
import videoUploadService from '../../services/uploadService';


const { width, height } = Dimensions.get('window');

const VideoPreviewScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Extract params from navigation
  const {
    videoUri,
    duration = 0,
    filter = null,
    segments = [],
    videoInfo = {},
    isFromGallery = false
  } = route.params || {};
  
  // Video state
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoStatus, setVideoStatus] = useState({});
  
  // Form state
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const videoRef = useRef(null);
  
  useEffect(() => {
    console.log('📹 Video Preview Screen loaded:', {
      videoUri,
      duration,
      isFromGallery,
      videoInfo
    });
  }, []);
  
  // Handle video playback status
  const handlePlaybackStatusUpdate = (status) => {
    setVideoStatus(status);
  };
  
  // Toggle video play/pause
  const togglePlayback = async () => {
    if (!videoRef.current) return;
    
    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('❌ Playback toggle failed:', error);
    }
  };
  
  // Format video duration
  const formatDuration = (ms) => {
    if (!ms) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Handle post/upload video
const handlePostVideo = async () => {
  if (!caption.trim()) {
    Alert.alert('Caption Required', 'Please add a caption for your video.');
    return;
  }
  
  try {
    setIsUploading(true);
    setUploadProgress(0);
    
    console.log('📤 Starting real video upload...');
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Prepare video metadata
    const videoMetadata = {
      title: caption.split('\n')[0] || 'Untitled Video',
      description: caption,
      duration: duration ? Math.floor(duration / 1000) : 0, // Convert to seconds
      width: videoInfo.width,
      height: videoInfo.height,
      hashtags: extractHashtags(caption + ' ' + hashtags),
      isPrivate: isPrivate,
      filter: filter?.id || 'normal',
    };
    
    console.log('📋 Video metadata:', videoMetadata);
    
    // Upload video to backend
    const uploadResult = await videoUploadService.uploadVideo(
      videoUri,
      videoMetadata,
      (progress) => {
        // Update progress
        setUploadProgress(progress.percentage);
        console.log(`📊 Upload progress: ${progress.percentage}%`);
      }
    );
    
    console.log('✅ Upload complete:', uploadResult);
    
    // Success feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    Alert.alert(
      'Video Posted! 🎉',
      'Your video has been uploaded successfully!',
      [
        {
          text: 'View Feed',
          onPress: () => {
            // Navigate to home and refresh feed
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            });
          }
        }
      ]
    );
    
  } catch (error) {
    console.error('❌ Video upload failed:', error);
    setUploadProgress(0);
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    
    Alert.alert(
      'Upload Failed',
      error.message || 'Failed to upload your video. Please try again.',
      [
        { 
          text: 'Retry', 
          onPress: () => handlePostVideo() 
        },
        { 
          text: 'Cancel', 
          style: 'cancel' 
        }
      ]
    );
  } finally {
    setIsUploading(false);
  }
};
  
  // Simulate video upload to backend
  const simulateVideoUpload = async (videoData) => {
    // Simulate different upload steps
    const steps = [
      'Uploading video file...',
      'Processing video...',
      'Generating thumbnail...',
      'Saving to database...',
      'Finalizing...'
    ];
    
    for (let i = 0; i < steps.length; i++) {
      console.log(`📤 ${steps[i]}`);
      await new Promise(resolve => setTimeout(resolve, 800));
      setUploadProgress(20 + (i * 15));
    }
    
    // In a real app, make actual API call:
    // const response = await apiService.post('/videos', videoData);
    // return response;
  };
  
  // Extract hashtags from text
  const extractHashtags = (text) => {
    const hashtagRegex = /#\w+/g;
    const matches = text.match(hashtagRegex) || [];
    return matches.map(tag => tag.substring(1)); // Remove # symbol
  };
  
  // Handle going back
  const handleGoBack = () => {
    if (isUploading) {
      Alert.alert(
        'Upload in Progress',
        'Are you sure you want to cancel the upload?',
        [
          { text: 'Continue Upload', style: 'cancel' },
          { 
            text: 'Cancel Upload', 
            style: 'destructive',
            onPress: () => {
              setIsUploading(false);
              navigation.goBack();
            }
          }
        ]
      );
    } else {
      navigation.goBack();
    }
  };
  
  // Render upload progress
  const renderUploadProgress = () => (
    <View style={styles.uploadOverlay}>
      <View style={styles.uploadModal}>
        <Text style={styles.uploadTitle}>Uploading Video 📤</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${uploadProgress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{Math.round(uploadProgress)}%</Text>
        </View>
        
        <Text style={styles.uploadSubtext}>
          Please don't close the app while uploading...
        </Text>
        
        <ActivityIndicator size="large" color="#FE2C55" style={{ marginTop: 20 }} />
      </View>
    </View>
  );
  
  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleGoBack}
          disabled={isUploading}
        >
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Preview</Text>
        
        <TouchableOpacity 
          style={[styles.headerButton, isUploading && styles.disabledButton]}
          onPress={handlePostVideo}
          disabled={isUploading || !caption.trim()}
        >
          <Text style={[
            styles.postText,
            (!caption.trim() || isUploading) && styles.disabledText
          ]}>
            Post
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Video Preview */}
        <View style={styles.videoContainer}>
          <TouchableOpacity 
            style={styles.videoWrapper}
            onPress={togglePlayback}
            activeOpacity={0.9}
          >
            <SimpleAdaptiveVideo
              videoRef={videoRef}
              source={{ uri: videoUri }}
              shouldPlay={isPlaying}
              isLooping={true}
              fillMode="fit"
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            />
            
            {/* Play/Pause overlay */}
            {!isPlaying && (
              <View style={styles.playOverlay}>
                <Ionicons name="play" size={48} color="rgba(255,255,255,0.8)" />
              </View>
            )}
          </TouchableOpacity>
          
          {/* Video info */}
          <View style={styles.videoInfo}>
            <Text style={styles.videoDuration}>
              {formatDuration(videoStatus.durationMillis || duration)}
            </Text>
            {videoInfo.width && videoInfo.height && (
              <Text style={styles.videoResolution}>
                {videoInfo.width}×{videoInfo.height}
              </Text>
            )}
          </View>
        </View>
        
        {/* Caption Input */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Caption</Text>
          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption... #hashtags"
            placeholderTextColor="#666"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={150}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{caption.length}/150</Text>
        </View>
        
        {/* Additional Hashtags */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Additional Hashtags</Text>
          <TextInput
            style={styles.hashtagInput}
            placeholder="#trending #fyp #viral"
            placeholderTextColor="#666"
            value={hashtags}
            onChangeText={setHashtags}
            maxLength={100}
          />
        </View>
        
        {/* Privacy Settings */}
        <View style={styles.formSection}>
          <View style={styles.privacyRow}>
            <View style={styles.privacyInfo}>
              <Text style={styles.privacyTitle}>Private Video</Text>
              <Text style={styles.privacySubtext}>
                Only you can see this video
              </Text>
            </View>
            
            <TouchableOpacity
              style={[styles.toggleButton, isPrivate && styles.toggleActive]}
              onPress={() => setIsPrivate(!isPrivate)}
            >
              <View style={[
                styles.toggleCircle,
                isPrivate && styles.toggleCircleActive
              ]} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Video Details */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Video Details</Text>
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Source:</Text>
              <Text style={styles.detailValue}>
                {isFromGallery ? '📱 Gallery' : '📸 Camera'}
              </Text>
            </View>
            
            {segments.length > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Segments:</Text>
                <Text style={styles.detailValue}>{segments.length}</Text>
              </View>
            )}
            
            {filter && filter.id !== 'normal' && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Filter:</Text>
                <Text style={styles.detailValue}>{filter.name}</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Post Button */}
        <View style={styles.postButtonContainer}>
          <TouchableOpacity
            style={[
              styles.postButton,
              (!caption.trim() || isUploading) && styles.postButtonDisabled
            ]}
            onPress={handlePostVideo}
            disabled={!caption.trim() || isUploading}
          >
            <Text style={styles.postButtonText}>
              {isUploading ? 'Uploading...' : 'Post Video 🚀'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Safe area bottom padding */}
        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
      
      {/* Upload Progress Overlay */}
      {isUploading && renderUploadProgress()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  postText: {
    color: '#FE2C55',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#666',
  },
  content: {
    flex: 1,
  },
  videoContainer: {
    height: height * 0.4,
    marginBottom: 20,
    position: 'relative',
  },
  videoWrapper: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  videoInfo: {
    position: 'absolute',
    bottom: 12,
    right: 28,
    alignItems: 'flex-end',
  },
  videoDuration: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  videoResolution: {
    color: '#FFF',
    fontSize: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  formSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  captionInput: {
    backgroundColor: '#111',
    color: '#FFF',
    fontSize: 16,
    padding: 16,
    borderRadius: 12,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#333',
  },
  charCount: {
    color: '#666',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
  },
  hashtagInput: {
    backgroundColor: '#111',
    color: '#FFF',
    fontSize: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  privacyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  privacyInfo: {
    flex: 1,
  },
  privacyTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  privacySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 2,
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#333',
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#FE2C55',
  },
  toggleCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFF',
    transform: [{ translateX: 0 }],
  },
  toggleCircleActive: {
    transform: [{ translateX: 20 }],
  },
  detailsContainer: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    color: '#888',
    fontSize: 14,
  },
  detailValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  postButtonContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  postButton: {
    backgroundColor: '#FE2C55',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#333',
  },
  postButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  uploadModal: {
    backgroundColor: '#111',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 40,
    borderWidth: 1,
    borderColor: '#333',
  },
  uploadTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FE2C55',
    borderRadius: 4,
  },
  progressText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadSubtext: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default VideoPreviewScreen; 