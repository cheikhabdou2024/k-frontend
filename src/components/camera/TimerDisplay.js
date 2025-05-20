import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Timer display component for recording duration
 */
const TimerDisplay = ({ duration, isRecording, maxDuration }) => {
  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Calculate remaining time
  const remainingTime = maxDuration - duration;
  
  // Don't render if not recording and duration is 0
  if (!isRecording && duration === 0) {
    return null;
  }
  
  return (
    <View style={styles.container}>
      <View style={[
        styles.timerContainer,
        isRecording && styles.recordingTimerContainer
      ]}>
        <Text style={styles.timerText}>
          {formatTime(duration)}
        </Text>
        
        {isRecording && (
          <View style={styles.recordingIndicator} />
        )}
      </View>
      
      {isRecording && (
        <Text style={styles.remainingText}>
          {remainingTime > 0 
            ? `${remainingTime}s remaining` 
            : 'Max duration reached'
          }
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 20,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  recordingTimerContainer: {
    backgroundColor: 'rgba(254, 44, 85, 0.7)',
  },
  timerText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recordingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    marginLeft: 8,
  },
  remainingText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default TimerDisplay;