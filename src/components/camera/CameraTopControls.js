import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Top control bar for camera screen
 * Includes close, flip camera and flash buttons
 */
const CameraTopControls = ({ 
  onClose, 
  onFlip, 
  onFlash, 
  flashMode, 
  isRecording 
}) => {
  const insets = useSafeAreaInsets();
  
  // Determine flash icon based on flash mode
  const getFlashIcon = () => {
    if (typeof flashMode === 'string') {
      return flashMode === 'off' ? 'flash-off' : 'flash';
    }
    
    // Numeric value (old expo-camera versions)
    return flashMode === 0 ? 'flash-off' : 'flash';
  };
  
  return (
    <View style={[
      styles.container, 
      { paddingTop: insets.top + 10 }
    ]}>
      {/* Close button */}
      <TouchableOpacity 
        style={styles.iconButton}
        onPress={onClose}
        disabled={isRecording}
      >
        <Ionicons 
          name="close" 
          size={28} 
          color={isRecording ? '#555' : '#FFF'} 
        />
      </TouchableOpacity>
      
      <View style={styles.rightControls}>
        {/* Flash button */}
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={onFlash}
          disabled={isRecording}
        >
          <Ionicons 
            name={getFlashIcon()} 
            size={24} 
            color={isRecording ? '#555' : '#FFF'} 
          />
        </TouchableOpacity>
        
        {/* Flip camera button */}
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={onFlip}
          disabled={isRecording}
        >
          <Ionicons 
            name="camera-reverse-outline" 
            size={24} 
            color={isRecording ? '#555' : '#FFF'} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 10,
  },
  rightControls: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
});

export default CameraTopControls;