import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Animated,
  BackHandler,
  Platform,
  Dimensions
} from 'react-native';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import RecordButton from '../../components/camera/RecordButton';
import FilterSelector from '../../components/camera/FilterSelector';
import FilterOverlay from '../../components/camera/FilterOverlay';
import TimerDisplay from '../../components/camera/TimerDisplay';
import CameraTopControls from '../../components/camera/CameraTopControls';

const { width, height } = Dimensions.get('window');

// Safe camera constants with fallbacks
const CAMERA_TYPE = {
  BACK: 'back',
  FRONT: 'front'
};

const FLASH_MODE = {
  OFF: 'off',
  ON: 'on',
  AUTO: 'auto',
  TORCH: 'torch'
};

// Recording duration options (like TikTok)
const DURATION_OPTIONS = [15, 30, 60]; // seconds
const DEFAULT_DURATION = 60;

// Enhanced filters with more options
const FILTERS = [
  { id: 'normal', name: 'Normal', intensity: 0 },
  { id: 'vivid', name: 'Vivid', intensity: 0.6 },
  { id: 'dramatic', name: 'Dramatic', intensity: 0.8 },
  { id: 'brilliant', name: 'Brilliant', intensity: 0.5 },
  { id: 'cool', name: 'Cool', intensity: 0.4 },
  { id: 'warm', name: 'Warm', intensity: 0.4 },
  { id: 'vintage', name: 'Vintage', intensity: 0.7 },
  { id: 'mono', name: 'B&W', intensity: 1.0 },
];

const EnhancedCameraScreen = () => {
  // Permissions
  const [hasPermission, setHasPermission] = useState(null);
  
  // Camera settings
  const [cameraType, setCameraType] = useState(CAMERA_TYPE.BACK);
  const [flash, setFlash] = useState(FLASH_MODE.OFF);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [zoom, setZoom] = useState(0);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [maxDuration, setMaxDuration] = useState(DEFAULT_DURATION);
  const [recordedSegments, setRecordedSegments] = useState([]);
  const [totalRecordedTime, setTotalRecordedTime] = useState(0);
  
  // UI state
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
  const [showSpeedControls, setShowSpeedControls] = useState(false);
  const [recordingSpeed, setRecordingSpeed] = useState(1.0);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  
  // Animations
  const recordingAnimation = useRef(new Animated.Value(0)).current;
  const speedAnimation = useRef(new Animated.Value(1)).current;
  const durationAnimation = useRef(new Animated.Value(0)).current;
  
  // Refs
  const cameraRef = useRef(null);
  const timerRef = useRef(null);
  
  const navigation = useNavigation();
  
  // Request all necessary permissions
  useEffect(() => {
    console.log('📸 EnhancedCameraScreen: Requesting permissions...');
    requestPermissions();
  }, []);
  
  const requestPermissions = async () => {
    try {
      console.log('📸 Requesting camera permissions...');
      
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: audioStatus } = await Audio.requestPermissionsAsync();
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      
      const allGranted = cameraStatus === 'granted' && 
                        audioStatus === 'granted' && 
                        mediaStatus === 'granted';
      
      console.log('📸 Permissions:', { cameraStatus, audioStatus, mediaStatus });
      setHasPermission(allGranted);
      
      if (!allGranted) {
        Alert.alert(
          'Permissions Required',
          'Camera, microphone, and media library access are required to record videos.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        console.log('✅ All permissions granted');
      }
    } catch (error) {
      console.error('❌ Permission request failed:', error);
      setHasPermission(false);
    }
  };
  
  // Handle back button
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
  
  // Cleanup on unmount
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
        duration: (maxDuration - totalRecordedTime) * 1000,
        useNativeDriver: false,
      }).start();
    } else {
      recordingAnimation.setValue(totalRecordedTime / maxDuration);
    }
  }, [isRecording, maxDuration, totalRecordedTime]);
  
  // Start recording with enhanced features
  const startRecording = async () => {
    if (!cameraRef.current || isRecording || !isCameraReady) {
      console.log('❌ Cannot start recording:', { 
        hasCamera: !!cameraRef.current, 
        isRecording, 
        isCameraReady 
      });
      return;
    }
    
    try {
      console.log('🎬 Starting recording...');
      
      // Haptic feedback
      if (Haptics && Haptics.impactAsync) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration((prevDuration) => {
          const newDuration = prevDuration + 1;
          const totalTime = totalRecordedTime + newDuration;
          
          if (totalTime >= maxDuration) {
            stopRecording();
            return newDuration;
          }
          return newDuration;
        });
      }, 1000);
      
      // Recording options with fallbacks
      const options = {
        quality: Camera.Constants?.VideoQuality ? Camera.Constants.VideoQuality['720p'] : '720p',
        maxDuration: (maxDuration - totalRecordedTime) * 1000, // Convert to ms
        mute: false,
      };
      
      console.log('🎬 Recording with options:', options);
      
      const videoRecordPromise = cameraRef.current.recordAsync(options);
      const recordingData = await videoRecordPromise;
      
      console.log('✅ Recording completed:', recordingData);
      
      // Add segment to recorded segments
      if (recordingData && recordingData.uri) {
        setRecordedSegments(prev => [...prev, {
          uri: recordingData.uri,
          duration: recordingDuration,
          timestamp: Date.now()
        }]);
        setTotalRecordedTime(prev => prev + recordingDuration);
      }
      
    } catch (error) {
      console.error('❌ Recording failed:', error);
      stopRecording();
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };
  
  // Stop recording
  const stopRecording = async () => {
    if (!cameraRef.current || !isRecording) return;
    
    try {
      console.log('⏹️ Stopping recording...');
      
      clearInterval(timerRef.current);
      setIsRecording(false);
      
      // Haptic feedback
      if (Haptics && Haptics.impactAsync) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      // Stop the camera recording
      cameraRef.current.stopRecording();
      
    } catch (error) {
      console.error('❌ Stop recording failed:', error);
    }
  };
  
  // Finish recording and process video
  const finishRecording = async () => {
    if (recordedSegments.length === 0 && totalRecordedTime === 0) {
      Alert.alert('No Recording', 'Please record some video first.');
      return;
    }
    
    try {
      console.log('✅ Finishing recording with segments:', recordedSegments.length);
      
      // For now, use the last recorded segment
      // In a real app, you'd merge all segments
      const finalVideo = recordedSegments[recordedSegments.length - 1];
      
      // Navigate to preview/edit screen
      navigation.navigate('VideoPreview', {
        videoUri: finalVideo?.uri,
        duration: totalRecordedTime,
        filter: selectedFilter,
        segments: recordedSegments,
        isFromGallery: false
      });
      
    } catch (error) {
      console.error('❌ Finish recording failed:', error);
      Alert.alert('Error', 'Failed to process video. Please try again.');
    }
  };
  
  // Clear all recordings
  const clearRecording = () => {
    setRecordedSegments([]);
    setTotalRecordedTime(0);
    setRecordingDuration(0);
    recordingAnimation.setValue(0);
  };
  
  // Toggle camera type
  const toggleCameraType = () => {
    const newType = cameraType === CAMERA_TYPE.BACK ? CAMERA_TYPE.FRONT : CAMERA_TYPE.BACK;
    console.log('🔄 Switching camera to:', newType);
    setCameraType(newType);
  };
  
  // Toggle flash
  const toggleFlash = () => {
    const newFlash = flash === FLASH_MODE.OFF ? FLASH_MODE.TORCH : FLASH_MODE.OFF;
    console.log('⚡ Switching flash to:', newFlash);
    setFlash(newFlash);
  };
  
  // Handle camera ready
  const onCameraReady = () => {
    setIsCameraReady(true);
    console.log('📸 Camera ready');
  };
  
  // Speed controls
  const handleSpeedChange = (speed) => {
    setRecordingSpeed(speed);
    
    Animated.spring(speedAnimation, {
      toValue: speed,
      useNativeDriver: false,
    }).start();
  };
  
  // Duration picker
  const handleDurationChange = (duration) => {
    setMaxDuration(duration);
    setShowDurationPicker(false);
  };
  
  // Render speed controls
  const renderSpeedControls = () => (
    <View style={styles.speedControls}>
      {[0.3, 0.5, 1.0, 2.0, 3.0].map(speed => (
        <TouchableOpacity
          key={speed}
          style={[
            styles.speedButton,
            recordingSpeed === speed && styles.activeSpeedButton
          ]}
          onPress={() => handleSpeedChange(speed)}
        >
          <Text style={[
            styles.speedText,
            recordingSpeed === speed && styles.activeSpeedText
          ]}>
            {speed}x
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
  
  // Render duration picker
  const renderDurationPicker = () => (
    <View style={styles.durationPicker}>
      {DURATION_OPTIONS.map(duration => (
        <TouchableOpacity
          key={duration}
          style={[
            styles.durationButton,
            maxDuration === duration && styles.activeDurationButton
          ]}
          onPress={() => handleDurationChange(duration)}
        >
          <Text style={[
            styles.durationText,
            maxDuration === duration && styles.activeDurationText
          ]}>
            {duration}s
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
  
  // Handle permission denied
  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#666" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          Please allow camera, microphone, and media library access to create videos.
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
        zoom={zoom}
      >
        {/* Filter Overlay */}
        <FilterOverlay filter={selectedFilter} />
        
        {/* Recording progress bar */}
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
        
        {/* Duration picker */}
        {showDurationPicker && renderDurationPicker()}
        
        {/* Speed controls */}
        {showSpeedControls && renderSpeedControls()}
        
        {/* Recording Timer */}
        <TimerDisplay 
          duration={recordingDuration} 
          isRecording={isRecording}
          maxDuration={maxDuration}
          totalRecorded={totalRecordedTime}
        />
        
        {/* Side Controls */}
        <View style={styles.sideControls}>
          {/* Speed control toggle */}
          <TouchableOpacity 
            style={styles.sideButton}
            onPress={() => setShowSpeedControls(!showSpeedControls)}
            disabled={isRecording}
          >
            <Text style={styles.sideButtonText}>Speed</Text>
          </TouchableOpacity>
          
          {/* Duration toggle */}
          <TouchableOpacity 
            style={styles.sideButton}
            onPress={() => setShowDurationPicker(!showDurationPicker)}
            disabled={isRecording}
          >
            <Text style={styles.sideButtonText}>{maxDuration}s</Text>
          </TouchableOpacity>
          
          {/* Filter selector */}
          <FilterSelector 
            filters={FILTERS}
            selectedFilter={selectedFilter}
            onSelectFilter={setSelectedFilter}
            disabled={isRecording}
          />
        </View>
        
        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {/* Clear/Undo button */}
          {totalRecordedTime > 0 && (
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={clearRecording}
              disabled={isRecording}
            >
              <Ionicons name="refresh-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          )}
          
          {/* Record Button */}
          <View style={styles.recordButtonContainer}>
            <RecordButton 
              isRecording={isRecording}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
              disabled={!isCameraReady}
              hasRecorded={totalRecordedTime > 0}
              progress={totalRecordedTime / maxDuration}
            />
          </View>
          
          {/* Next/Finish button */}
          {totalRecordedTime > 0 && (
            <TouchableOpacity 
              style={styles.nextButton}
              onPress={finishRecording}
              disabled={isRecording}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          )}
          
          {/* Gallery button */}
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => navigation.navigate('GalleryPickerScreen')}
            disabled={isRecording}
          >
            <Ionicons 
              name="images-outline" 
              size={24} 
              color={isRecording ? '#555' : '#FFF'} 
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
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 4,
    backgroundColor: '#FE2C55',
    zIndex: 10,
  },
  sideControls: {
    position: 'absolute',
    right: 16,
    top: '40%',
    alignItems: 'center',
  },
  sideButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 12,
  },
  sideButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  speedControls: {
    position: 'absolute',
    right: 80,
    top: '40%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    padding: 8,
  },
  speedButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 2,
    borderRadius: 12,
  },
  activeSpeedButton: {
    backgroundColor: '#FE2C55',
  },
  speedText: {
    color: '#FFF',
    fontSize: 12,
    textAlign: 'center',
  },
  activeSpeedText: {
    fontWeight: 'bold',
  },
  durationPicker: {
    position: 'absolute',
    top: 100,
    left: 16,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    padding: 8,
  },
  durationButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 12,
  },
  activeDurationButton: {
    backgroundColor: '#FE2C55',
  },
  durationText: {
    color: '#FFF',
    fontSize: 14,
  },
  activeDurationText: {
    fontWeight: 'bold',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  recordButtonContainer: {
    flex: 1,
    alignItems: 'center',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  nextButton: {
    backgroundColor: '#FE2C55',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginHorizontal: 10,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

// At the end of src/screens/create/EnhancedCameraScreen.js
// Make sure this line exists at the very bottom of your file:

export default EnhancedCameraScreen;