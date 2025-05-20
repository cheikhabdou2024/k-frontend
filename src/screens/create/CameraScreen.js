import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  Animated,
  BackHandler,
  Platform
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import RecordButton from '../../components/camera/RecordButton';
import FilterSelector from '../../components/camera/FilterSelector';
import FilterOverlay from '../../components/camera/FilterOverlay';
import TimerDisplay from '../../components/camera/TimerDisplay';
import CameraTopControls from '../../components/camera/CameraTopControls';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

// Maximum recording duration in seconds
const MAX_DURATION = 60;

// List of available filters
const FILTERS = [
  { id: 'normal', name: 'Normal', intensity: 0 },
  { id: 'warm', name: 'Warm', intensity: 0.5 },
  { id: 'cool', name: 'Cool', intensity: 0.5 },
  { id: 'vintage', name: 'Vintage', intensity: 0.7 },
  { id: 'mono', name: 'Mono', intensity: 1.0 },
  { id: 'sepia', name: 'Sepia', intensity: 0.8 },
  { id: 'vivid', name: 'Vivid', intensity: 0.5 },
];

const CameraScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [flash, setFlash] = useState(Camera.Constants?.FlashMode?.off || 'off');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]); // Default to normal
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  // Animations
  const recordingAnimation = useRef(new Animated.Value(0)).current;
  
  // Refs
  const cameraRef = useRef(null);
  const timerRef = useRef(null);
  
  const navigation = useNavigation();
  
  // Request camera and audio permissions
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: audioStatus } = await Audio.requestPermissionsAsync();
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      
      setHasPermission(
        cameraStatus === 'granted' && 
        audioStatus === 'granted' &&
        mediaStatus === 'granted'
      );
    })();
  }, []);
  
  // Handle back button press
  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS === 'android') {
        const onBackPress = () => {
          if (isRecording) {
            stopRecording();
            return true;
          }
          return false;
        };
        
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
      }
    }, [isRecording])
  );
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Recording progress animation
  useEffect(() => {
    if (isRecording) {
      Animated.timing(recordingAnimation, {
        toValue: 1,
        duration: MAX_DURATION * 1000,
        useNativeDriver: false,
      }).start();
    } else {
      recordingAnimation.setValue(0);
    }
  }, [isRecording]);
  
  // Handle permission denied
  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Camera and microphone permissions are required to use this feature.
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
  
  // Handle permissions loading
  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Requesting camera permissions...</Text>
      </View>
    );
  }
  
  // Start recording
  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;
    
    setIsRecording(true);
    setRecordingDuration(0);
    
    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingDuration((prevDuration) => {
        if (prevDuration >= MAX_DURATION) {
          stopRecording();
          return MAX_DURATION;
        }
        return prevDuration + 1;
      });
    }, 1000);
    
    // Start recording
    try {
      const options = {
        quality: '720p',
        maxDuration: MAX_DURATION,
        mute: false,
      };
      
      await cameraRef.current.recordAsync(options);
    } catch (error) {
      console.error('Error starting recording:', error);
      stopRecording();
    }
  };
  
  // Stop recording
  const stopRecording = async () => {
    if (!cameraRef.current || !isRecording) return;
    
    clearInterval(timerRef.current);
    setIsRecording(false);
    
    try {
      const video = await cameraRef.current.stopRecording();
      
      // Apply filter to the video (in a real app, this would be more complex)
      if (selectedFilter.id !== 'normal') {
        console.log(`Applying ${selectedFilter.name} filter to video`);
        // This is where you would process the video with the selected filter
        // For a real implementation, you'd need a native module or server-side processing
      }
      
      // Save to camera roll
      const asset = await MediaLibrary.createAssetAsync(video.uri);
      console.log('Video saved to', asset);
      
      // Navigate to preview screen (to be implemented in next sprint)
      // navigation.navigate('VideoPreview', { videoUri: video.uri, filter: selectedFilter });
      
      // For now, just go back
      navigation.goBack();
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };
  
  // Toggle camera type (front/back)
  const toggleCameraType = () => {
    setCameraType(
      cameraType === CameraType.back
        ? CameraType.front
        : CameraType.back
    );
  };
  
  // Toggle flash mode
  const toggleFlash = () => {
    const flashModes = Camera.Constants?.FlashMode || { off: 'off', torch: 'torch' };
    setFlash(
      flash === flashModes.off
        ? flashModes.torch
        : flashModes.off
    );
  };
  
  // Handle camera ready state
  const onCameraReady = () => {
    setIsCameraReady(true);
  };
  
  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Camera View */}
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={cameraType}
        flashMode={flash}
        onCameraReady={onCameraReady}
        ratio="16:9"
      >
        {/* Filter Overlay */}
        <FilterOverlay filter={selectedFilter} />
        
        {/* Recording progress indicator */}
        <Animated.View 
          style={[
            styles.progressBar,
            {
              width: recordingAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              })
            }
          ]}
        />
        
        {/* Top Controls */}
        <CameraTopControls 
          onClose={() => navigation.goBack()}
          onFlip={toggleCameraType}
          onFlash={toggleFlash}
          flashMode={flash}
          isRecording={isRecording}
        />
        
        {/* Recording Timer */}
        <TimerDisplay 
          duration={recordingDuration} 
          isRecording={isRecording}
          maxDuration={MAX_DURATION}
        />
        
        {/* Controls Container */}
        <View style={styles.controlsContainer}>
          {/* Filter Selector */}
          <FilterSelector 
            filters={FILTERS}
            selectedFilter={selectedFilter}
            onSelectFilter={setSelectedFilter}
            disabled={isRecording}
          />
          
          {/* Record Button */}
          <RecordButton 
            isRecording={isRecording}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            disabled={!isCameraReady}
          />
          
          {/* Upload from gallery button */}
          <TouchableOpacity 
            style={styles.galleryButton}
            onPress={() => {
              // navigation.navigate('GalleryPicker');
              // To be implemented in next sprint
              console.log('Open gallery');
            }}
            disabled={isRecording}
          >
            <Ionicons 
              name="images-outline" 
              size={30} 
              color={isRecording ? '#555' : '#fff'} 
            />
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#FE2C55',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 4,
    backgroundColor: '#FE2C55',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
});

export default CameraScreen;