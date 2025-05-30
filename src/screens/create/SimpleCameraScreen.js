// src/screens/SimpleCameraScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  StatusBar, 
  Alert, 
  TouchableOpacity,
  Text,
  SafeAreaView
} from 'react-native';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Import our new components
import AdvancedFilters from '../../components/camera/effects/AdvancedFilters';
import BeautyMode from '../../components/camera/effects/BeautyMode';
import VoiceCommandProcessor from '../../components/voice/VoiceCommandProcessor';

// Import services
import effectsService from '../../services/EffectsService';
import voiceService from '../../services/VoiceService';

const SimpleCameraScreen = ({ navigation }) => {
  // Camera states - using simple string values instead of constants
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState('back'); // Simple string
  const [isRecording, setIsRecording] = useState(false);
  const [flashMode, setFlashMode] = useState('off'); // Simple string
  
  // Effects states
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [beautyMode, setBeautyMode] = useState({ enabled: false, effects: {} });
  const [voiceCommands, setVoiceCommands] = useState(false);
  
  // UI states
  const [showTestPanel, setShowTestPanel] = useState(false);
  
  // Refs
  const cameraRef = useRef(null);
  
  useEffect(() => {
    requestPermissions();
    initializeServices();
    
    return () => {
      cleanup();
    };
  }, []);

  // Request camera permissions
  const requestPermissions = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      const { status: audioStatus } = await Camera.requestMicrophonePermissionsAsync();
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      
      console.log('Permissions:', { status, audioStatus, mediaStatus });
      setHasPermission(status === 'granted' && audioStatus === 'granted');
    } catch (error) {
      console.error('Permission request failed:', error);
      setHasPermission(false);
    }
  };

  // Initialize services
  const initializeServices = async () => {
    try {
      console.log('Initializing services...');
      await voiceService.initialize();
      
      // Register voice commands for camera actions
      voiceService.registerCommand('start recording', () => startRecording(), {
        feedback: 'Starting recording'
      });
      voiceService.registerCommand('stop recording', () => stopRecording(), {
        feedback: 'Stopping recording'
      });
      voiceService.registerCommand('take photo', () => takePicture(), {
        feedback: 'Taking photo'
      });
      voiceService.registerCommand('switch camera', () => switchCamera(), {
        feedback: 'Switching camera'
      });
      voiceService.registerCommand('beauty mode', () => toggleBeautyMode(), {
        feedback: 'Toggling beauty mode'
      });
      
      console.log('Services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize services:', error);
    }
  };

  // Cleanup
  const cleanup = async () => {
    try {
      await voiceService.cleanup();
      effectsService.clearAllEffects();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  // Camera functions
  const takePicture = async () => {
    if (cameraRef.current && !isRecording) {
      try {
        console.log('Taking picture...');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          skipProcessing: false,
        });
        
        console.log('Photo taken:', photo.uri);
        
        // Apply effects to photo here (simulated)
        console.log('Photo effects applied:', {
          filter: selectedFilter?.id,
          beauty: beautyMode.enabled ? beautyMode.effects : null
        });
        
        // Save to gallery
        await MediaLibrary.saveToLibraryAsync(photo.uri);
        
        Alert.alert('Success', 'Photo saved to gallery!');
        
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture: ' + error.message);
      }
    }
  };

  const startRecording = async () => {
    if (cameraRef.current && !isRecording) {
      try {
        console.log('Starting recording...');
        setIsRecording(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        
        const video = await cameraRef.current.recordAsync({
          quality: '1080p',
          maxDuration: 60,
        });
        
        console.log('Video recorded:', video.uri);
        
        // Apply effects to video here (simulated)
        console.log('Video effects applied:', {
          filter: selectedFilter?.id,
          beauty: beautyMode.enabled ? beautyMode.effects : null
        });
        
        // Save to gallery
        await MediaLibrary.saveToLibraryAsync(video.uri);
        
        Alert.alert('Success', 'Video saved to gallery!');
        
      } catch (error) {
        console.error('Error recording video:', error);
        Alert.alert('Error', 'Failed to record video: ' + error.message);
      } finally {
        setIsRecording(false);
      }
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && isRecording) {
      try {
        console.log('Stopping recording...');
        await cameraRef.current.stopRecording();
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    }
  };

  const switchCamera = () => {
    console.log('Switching camera from:', cameraType);
    setCameraType(cameraType === 'back' ? 'front' : 'back');
    Haptics.selectionAsync();
  };

  // Effect handlers
  const handleFilterChange = (filter) => {
    console.log('Filter changed:', filter);
    setSelectedFilter(filter);
    effectsService.applyEffect('filter', filter);
  };

  const handleBeautyModeToggle = (enabled) => {
    console.log('Beauty mode toggled:', enabled);
    setBeautyMode(prev => ({ ...prev, enabled }));
    if (enabled) {
      effectsService.applyEffect('beauty', beautyMode.effects);
    } else {
      effectsService.removeEffect('beauty');
    }
  };

  const handleBeautyEffectChange = (effectId, value) => {
    console.log('Beauty effect changed:', effectId, value);
    setBeautyMode(prev => ({
      ...prev,
      effects: { ...prev.effects, [effectId]: value }
    }));
    
    if (beautyMode.enabled) {
      effectsService.updateEffect('beauty', { [effectId]: value });
    }
  };

  const toggleBeautyMode = () => {
    handleBeautyModeToggle(!beautyMode.enabled);
  };

  const handleVoiceCommand = (command) => {
    console.log('Voice command received:', command);
    
    // Execute the command
    switch (command.action) {
      case 'START_RECORDING':
        startRecording();
        break;
      case 'STOP_RECORDING':
        stopRecording();
        break;
      case 'TAKE_PHOTO':
        takePicture();
        break;
      case 'TOGGLE_BEAUTY':
        toggleBeautyMode();
        break;
      case 'SWITCH_CAMERA':
        switchCamera();
        break;
      default:
        console.log('Unknown voice command:', command.action);
    }
  };

  const toggleFlash = () => {
    console.log('Toggling flash from:', flashMode);
    setFlashMode(flashMode === 'off' ? 'on' : 'off');
    Haptics.selectionAsync();
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Requesting permissions...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>No access to camera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Camera */}
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={cameraType}
        flashMode={flashMode}
        ratio="16:9"
      >
        {/* Top Controls */}
        <SafeAreaView style={styles.topControls}>
          <View style={styles.topRow}>
            <TouchableOpacity 
              style={styles.topButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.topButton}
              onPress={toggleFlash}
              disabled={isRecording}
            >
              <Ionicons 
                name={flashMode === 'on' ? "flash" : "flash-off"} 
                size={24} 
                color="#FFF" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.topButton}
              onPress={() => setShowTestPanel(!showTestPanel)}
            >
              <Ionicons name="settings" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        
        {/* Test Panel */}
        {showTestPanel && (
          <View style={styles.testPanel}>
            <Text style={styles.testPanelTitle}>Advanced Features Test</Text>
            <Text style={styles.testInfo}>Camera: {cameraType}</Text>
            <Text style={styles.testInfo}>Flash: {flashMode}</Text>
            <Text style={styles.testInfo}>Filter: {selectedFilter?.name || 'None'}</Text>
            <Text style={styles.testInfo}>Beauty: {beautyMode.enabled ? 'On' : 'Off'}</Text>
            <Text style={styles.testInfo}>Voice: {voiceCommands ? 'On' : 'Off'}</Text>
            <Text style={styles.testInfo}>Recording: {isRecording ? 'Yes' : 'No'}</Text>
          </View>
        )}
        
        {/* Beauty Mode */}
        <View style={styles.beautyModeContainer}>
          <BeautyMode
            isEnabled={beautyMode.enabled}
            onToggle={handleBeautyModeToggle}
            onEffectChange={handleBeautyEffectChange}
            isRecording={isRecording}
          />
        </View>
        
        {/* Voice Commands */}
        <View style={styles.voiceContainer}>
          <VoiceCommandProcessor
            onCommand={handleVoiceCommand}
            isEnabled={voiceCommands}
            onToggle={setVoiceCommands}
            isRecording={isRecording}
          />
        </View>
        
        {/* Advanced Filters */}
        <AdvancedFilters
          selectedFilter={selectedFilter}
          onFilterChange={handleFilterChange}
          isRecording={isRecording}
        />
        
        {/* Camera Controls */}
        <View style={styles.controlsContainer}>
          {/* Photo Button */}
          <TouchableOpacity
            style={styles.photoButton}
            onPress={takePicture}
            disabled={isRecording}
          >
            <Ionicons name="camera" size={24} color="#FFF" />
          </TouchableOpacity>
          
          {/* Record Button */}
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordButtonActive
            ]}
            onPress={isRecording ? stopRecording : startRecording}
            onLongPress={startRecording}
          >
            <View style={[
              styles.recordButtonInner,
              isRecording && styles.recordButtonInnerActive
            ]} />
          </TouchableOpacity>
          
          {/* Switch Camera Button */}
          <TouchableOpacity
            style={styles.switchButton}
            onPress={switchCamera}
            disabled={isRecording}
          >
            <Ionicons name="camera-reverse" size={24} color="#FFF" />
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
  },
  permissionText: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  permissionButton: {
    backgroundColor: '#FE2C55',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 50,
    marginTop: 20,
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testPanel: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    padding: 16,
    zIndex: 90,
  },
  testPanelTitle: {
    color: '#25F4EE',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  testInfo: {
    color: '#FFF',
    fontSize: 12,
    marginBottom: 4,
  },
  beautyModeContainer: {
    position: 'absolute',
    top: 100,
    right: 16,
    zIndex: 20,
  },
  voiceContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 20,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 20,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  recordButtonActive: {
    backgroundColor: 'rgba(254,44,85,0.5)',
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FE2C55',
  },
  recordButtonInnerActive: {
    borderRadius: 8,
    width: 40,
    height: 40,
  },
  photoButton: {
    position: 'absolute',
    right: 60,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchButton: {
    position: 'absolute',
    left: 60,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SimpleCameraScreen;