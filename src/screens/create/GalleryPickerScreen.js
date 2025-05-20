import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const VIDEO_ITEM_SIZE = width / 3;

// Mock videos data for the gallery
const MOCK_VIDEOS = [
  {
    id: '1',
    uri: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-waving-her-hair-in-a-pool-1229-large.mp4',
    thumbnail: 'https://picsum.photos/id/237/300/300',
  },
  {
    id: '2',
    uri: 'https://assets.mixkit.co/videos/preview/mixkit-woman-dancing-inside-a-car-4823-large.mp4',
    thumbnail: 'https://picsum.photos/id/238/300/300',
  },
  {
    id: '3',
    uri: 'https://assets.mixkit.co/videos/preview/mixkit-portrait-of-a-fashion-woman-with-silver-makeup-39875-large.mp4',
    thumbnail: 'https://picsum.photos/id/239/300/300',
  },
  {
    id: '4',
    uri: 'https://assets.mixkit.co/videos/preview/mixkit-woman-running-above-the-camera-on-a-running-track-32807-large.mp4',
    thumbnail: 'https://picsum.photos/id/240/300/300',
  },
  {
    id: '5',
    uri: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4',
    thumbnail: 'https://picsum.photos/id/241/300/300',
  },
  {
    id: '6',
    uri: 'https://assets.mixkit.co/videos/preview/mixkit-winter-fashion-cold-looking-woman-concept-video-39874-large.mp4',
    thumbnail: 'https://picsum.photos/id/242/300/300',
  },
];

const GalleryPickerScreen = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [galleryVideos, setGalleryVideos] = useState(MOCK_VIDEOS);
  
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  
  // Handle selection of a video from gallery
  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
  };
  
  // Handle picking a video from device library
  const handlePickVideo = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 1,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        
        // Create new video object with the selected asset
        const newVideo = {
          id: `custom_${Date.now()}`,
          uri: selectedAsset.uri,
          thumbnail: 'https://picsum.photos/id/999/300/300', // Placeholder
          // In a real app, you would generate a thumbnail from the video
        };
        
        // Add to gallery videos
        setGalleryVideos([newVideo, ...galleryVideos]);
        
        // Select it
        setSelectedVideo(newVideo);
      }
    } catch (error) {
      console.error('Error picking video:', error);
    }
  }, [galleryVideos]);
  
  // Handle continue button press
  const handleContinue = () => {
    if (!selectedVideo) return;
    
    // Navigate to video edit screen (to be implemented)
    // navigation.navigate('VideoEdit', { videoUri: selectedVideo.uri });
    
    // For now, just go back
    navigation.goBack();
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
      <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      
      {/* Selected indicator */}
      {selectedVideo?.id === item.id && (
        <View style={styles.selectedIndicator}>
          <Ionicons name="checkmark-circle" size={24} color="#FE2C55" />
        </View>
      )}
      
      {/* Video indicator */}
      <View style={styles.videoIndicator}>
        <Ionicons name="videocam" size={16} color="#FFF" />
      </View>
    </TouchableOpacity>
  );
  
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
        
        <Text style={styles.headerTitle}>Gallery</Text>
        
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
              <Text style={styles.pickButtonText}>Upload</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      />
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
  galleryContainer: {
    padding: 2,
  },
  videoItem: {
    width: VIDEO_ITEM_SIZE,
    height: VIDEO_ITEM_SIZE,
    padding: 2,
  },
  selectedVideoItem: {
    borderWidth: 2,
    borderColor: '#FE2C55',
    padding: 0,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    padding: 4,
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
    fontSize: 14,
    marginTop: 4,
    fontWeight: 'bold',
  },
});

export default GalleryPickerScreen;