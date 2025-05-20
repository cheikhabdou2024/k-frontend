import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Custom record button component for camera screen
 * Shows different states for recording/not recording
 */
const RecordButton = ({ 
  isRecording, 
  onStartRecording, 
  onStopRecording,
  disabled = false 
}) => {
  const handlePress = () => {
    if (disabled) return;
    
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };
  
  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.container}
      activeOpacity={0.8}
      disabled={disabled}
    >
      {isRecording ? (
        // Recording state - square shape
        <View style={styles.stopButton}>
          <View style={styles.stopIcon} />
        </View>
      ) : (
        // Not recording state - circle with gradient
        <LinearGradient
          colors={disabled ? ['#555', '#333'] : ['#FE2C55', '#25F4EE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContainer}
        >
          <View style={styles.innerCircle}>
            <View style={styles.recordIcon} />
          </View>
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FE2C55',
  },
  stopButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#FE2C55',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FFF',
  },
});

export default RecordButton;