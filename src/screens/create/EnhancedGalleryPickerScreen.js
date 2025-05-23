import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  FlatList, 
  Dimensions, 
  StatusBar,
  Alert,
  ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const VIDEO_ITEM_SIZE = width / 3;

const EnhancedGalleryPickerScreen = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [galleryVideos, setGalleryVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  
  // Load videos from device on mount
  useEffect(() => {
    requestPermissionAndLoadVideos();
  }, []);
  
  // Request media library permission and load videos
  const requestPermissionAndLoadVideos = async () => {
    try {
      console.log('📱 Requesting media library permission...');
      
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Media library access is required to select videos from your gallery.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }
      
      setPermissionGranted(true);
      await loadDeviceVideos();
      
    } catch (error) {
      console.error('❌ Permission request failed:', error);
      setLoading(false);
    }
  };
  
  // Load videos from device media library
  const loadDeviceVideos = async () => {
    try {
      console.log('📹 Loading videos from device...');
      
      const mediaAssets = await MediaLibrary.getAssetsAsync({
        mediaType: 'video',
        first: 50, // Load first 50 videos
        sortBy: ['creationTime'],
      });
      
      console.log(`📹 Found ${mediaAssets.assets.length} videos on device`);
      
      // Generate thumbnails for videos
      const videosWithThumbnails = await Promise.all(
        mediaAssets.assets.map(async (asset) => {
          try {
            const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(
              asset.uri,
              {
                time: 1000, // 1 second into video
                quality: 0.7,
              }
            );
            
            return {
              id: asset.id,
              uri: asset.uri,
              thumbnail: thumbnailUri,
              duration: asset.duration,
              width: asset.width,
              height: asset.height,
              creationTime: asset.creationTime,
              filename: asset.filename,
            };
          } catch (error) {
            console.warn('⚠️ Failed to generate thumbnail for video:', asset.filename);
            return {
              id: asset.id,
              uri: asset.uri,
              thumbnail: null,
              duration: asset.duration,
              width: asset.width,
              height: asset.height,
              creationTime: asset.creationTime,
              filename: asset.filename,
            };
          }
        })
      );
      
      setGalleryVideos(videosWithThumbnails);
      console.log(`✅ Loaded ${videosWithThumbnails.length} videos with thumbnails`);
      
    } catch (error) {
      console.error('❌ Failed to load device videos:', error);
      Alert.alert('Error', 'Failed to load videos from your device.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle video selection from gallery
  const handleVideoSelect = (video) => {
    console.log('📹 Selected video:', video.filename);
    setSelectedVideo(video);
  };
  
  // Handle picking a video from device library using ImagePicker
  const handlePickVideo = useCallback(async () => {
    try {
      console.log('📱 Opening device video picker...');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [9, 16], // TikTok aspect ratio
        quality: 1,
        videoMaxDuration: 60, // 60 seconds max
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        
        console.log('✅ Video selected from picker:', {
          duration: selectedAsset.duration,
          width: selectedAsset.width,
          height: selectedAsset.height,
        });
        
        // Generate thumbnail for the picked video
        let thumbnailUri = null;
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(
            selectedAsset.uri,
            { time: 1000, quality: 0.7 }
          );
          thumbnailUri = uri;
        } catch (error) {
          console.warn('⚠️ Failed to generate thumbnail for picked video');
        }
        
        // Create video object
        const newVideo = {
          id: `picked_${Date.now()}`,
          uri: selectedAsset.uri,
          thumbnail: thumbnailUri,
          duration: selectedAsset.duration || 0,
          width: selectedAsset.width,
          height: selectedAsset.height,
          filename: 'Selected Video',
          isPicked: true,
        };
        
        // Add to gallery videos at the beginning
        setGalleryVideos(prev => [newVideo, ...prev]);
        
        // Auto-select it
        setSelectedVideo(newVideo);
      }
    } catch (error) {
      console.error('❌ Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video from library.');
    }
  }, []);
  
  // Handle continue button press
  const handleContinue = async () => {
    if (!selectedVideo) {
      Alert.alert('No Video Selected', 'Please select a video to continue.');
      return;
    }
    
    try {
      console.log('➡️ Proceeding with selected video');
      
      // Navigate to video preview/edit screen
      navigation.navigate('VideoPreview', {
        videoUri: selectedVideo.uri,
        duration: selectedVideo.duration,
        videoInfo: {
          width: selectedVideo.width,
          height: selectedVideo.height,
          filename: selectedVideo.filename,
        },
        isFromGallery: true,
      });
      
    } catch (error) {
      console.error('❌ Error proceeding with video:', error);
      Alert.alert('Error', 'Failed to process selected video.');
    }
  };
  
  // Format video duration
  const formatDuration = (duration) => {
    if (!duration) return '0:00';
    
    const totalSeconds = Math.floor(duration / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Render gallery item
  const renderGalleryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.videoItem,
        selectedVideo?.id === item.id && styles.selectedVideoItem,
      ]}
      onPress={() => handleVideoSelect(item)}
      activeOpacity={0.8}
    >
      {/* Video thumbnail */}
      {item.thumbnail ? (
        <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.noThumbnail]}>
          <Ionicons name="videocam-outline" size={24} color="#666" />
        </View>
      )}
      
      {/* Selected indicator */}
      {selectedVideo?.id === item.id && (
        <View style={styles.selectedIndicator}>
          <Ionicons name="checkmark-circle" size={24} color="#FE2C55" />
        </View>
      )}
      
      {/* Video duration */}
      {item.duration > 0 && (
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>
            {formatDuration(item.duration)}
          </Text>
        </View>
      )}
      
      {/* Video info */}
      <View style={styles.videoInfo}>
        <Ionicons name="videocam" size={12} color="#FFF" />
        {item.isPicked && (
          <Ionicons name="download-outline" size={12} color="#25F4EE" style={{ marginLeft: 4 }} />
        )}
      </View>
    </TouchableOpacity>
  );
  
  // Render loading state
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FE2C55" />
        <Text style={styles.loadingText}>Loading your videos...</Text>
      </View>
    );
  }
  
  // Render permission denied state
  if (!permissionGranted) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="folder-open-outline" size={64} color="#666" />
        <Text style={styles.permissionTitle}>Media Access Required</Text>
        <Text style={styles.permissionText}>
          Please allow access to your media library to select videos.
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.permissionButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Select Video</Text>
        
        <TouchableOpacity 
          style={[
            styles.headerButton,
            !selectedVideo && styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={!selectedVideo}
        >
          <Text 
            style={[
              styles.continueText,
              !selectedVideo && styles.disabledText,
            ]}
          >
            Next
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Video count info */}
      <View style={styles.infoBar}>
        <Text style={styles.videoCount}>
          📹 {galleryVideos.length} videos found
        </Text>
        {selectedVideo && (
          <Text style={styles.selectedInfo}>
            ✅ {selectedVideo.filename}
          </Text>
        )}
      </View>
      
      {/* Gallery Grid */}
      <FlatList
        data={galleryVideos}
        renderItem={renderGalleryItem}
        keyExtractor={item => item.id}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.galleryContainer}
        ListHeaderComponent={() => (
          <TouchableOpacity 
            style={styles.pickVideoButton}
            onPress={handlePickVideo}
          >
            <LinearGradient
              colors={['#FE2C55', '#25F4EE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.pickButtonGradient}
            >
              <Ionicons name="add" size={30} color="#FFF" />
              <Text style={styles.pickButtonText}>Pick Video</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="videocam-off-outline" size={48} color="#666" />
            <Text style={styles.emptyTitle}>No Videos Found</Text>
            <Text style={styles.emptyText}>
              No videos found on your device. Try recording a new video with the camera.
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => navigation.navigate('CameraScreen')}
            >
              <Text style={styles.emptyButtonText}>Open Camera</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      
      {/* Selected video preview */}
      {selectedVideo && (
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Selected Video</Text>
            <TouchableOpacity onPress={() => setSelectedVideo(null)}>
              <Ionicons name="close-circle-outline" size={20} color="#888" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.previewContent}>
            {selectedVideo.thumbnail ? (
              <Image source={{ uri: selectedVideo.thumbnail }} style={styles.previewThumbnail} />
            ) : (
              <View style={[styles.previewThumbnail, styles.noThumbnail]}>
                <Ionicons name="videocam-outline" size={20} color="#666" />
              </View>
            )}
            
            <View style={styles.previewInfo}>
              <Text style={styles.previewFilename} numberOfLines={1}>
                {selectedVideo.filename}
              </Text>
              <Text style={styles.previewDetails}>
                {formatDuration(selectedVideo.duration)} • {selectedVideo.width}×{selectedVideo.height}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
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
  continueText: {
    color: '#FE2C55',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#888',
  },
  infoBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  videoCount: {
    color: '#CCC',
    fontSize: 14,
  },
  selectedInfo: {
    color: '#25F4EE',
    fontSize: 12,
    marginTop: 2,
  },
  galleryContainer: {
    padding: 2,
  },
  videoItem: {
    width: VIDEO_ITEM_SIZE,
    height: VIDEO_ITEM_SIZE,
    padding: 2,
    position: 'relative',
  },
  selectedVideoItem: {
    borderWidth: 3,
    borderColor: '#FE2C55',
    padding: 0,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#111',
  },
  noThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  durationText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  videoInfo: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickVideoButton: {
    width: VIDEO_ITEM_SIZE,
    height: VIDEO_ITEM_SIZE,
    padding: 2,
  },
  pickButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickButtonText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 4,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#FE2C55',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 16,
    fontSize: 16,
  },
  permissionTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    color: '#CCC',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
    paddingHorizontal: 40,
  },
  permissionButton: {
    backgroundColor: '#FE2C55',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewContainer: {
    backgroundColor: '#111',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
  },
  previewInfo: {
    flex: 1,
  },
  previewFilename: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  previewDetails: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
});

export default EnhancedGalleryPickerScreen;