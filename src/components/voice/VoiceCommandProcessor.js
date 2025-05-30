// src/components/voice/VoiceCommandProcessor.js
import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import voiceService from '../../services/VoiceService';

const VOICE_COMMANDS = {
  // Camera Controls
  'start recording': { action: 'START_RECORDING', feedback: 'Starting recording' },
  'stop recording': { action: 'STOP_RECORDING', feedback: 'Stopping recording' },
  'take photo': { action: 'TAKE_PHOTO', feedback: 'Taking photo' },
  'switch camera': { action: 'SWITCH_CAMERA', feedback: 'Switching camera' },
  'flip camera': { action: 'SWITCH_CAMERA', feedback: 'Flipping camera' },
  
  // Effects & Filters
  'beauty mode': { action: 'TOGGLE_BEAUTY', feedback: 'Beauty mode activated' },
  'no filter': { action: 'SET_FILTER', payload: 'original', feedback: 'Removing filter' },
  'vintage filter': { action: 'SET_FILTER', payload: 'vintage', feedback: 'Vintage filter applied' },
  'dramatic filter': { action: 'SET_FILTER', payload: 'dramatic', feedback: 'Dramatic filter applied' },
  
  // Fun Commands
  'say cheese': { action: 'COUNTDOWN_PHOTO', feedback: 'Get ready! 3, 2, 1!' },
  'lights camera action': { action: 'START_RECORDING', feedback: 'Action!' },
  'that\'s a wrap': { action: 'STOP_RECORDING', feedback: 'Cut! Great take!' },
};

const VoiceCommandProcessor = ({ 
  onCommand, 
  isEnabled = false,
  onToggle,
  isRecording = false,
  style 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [voiceServiceReady, setVoiceServiceReady] = useState(false);
  
  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Initialize voice service
  useEffect(() => {
    initializeVoiceService();
    
    return () => {
      cleanup();
    };
  }, []);

  // Initialize voice service
  const initializeVoiceService = async () => {
    try {
      const ready = await voiceService.initialize();
      setVoiceServiceReady(ready);
      
      if (ready) {
        // Register voice commands
        Object.entries(VOICE_COMMANDS).forEach(([trigger, config]) => {
          voiceService.registerCommand(trigger, () => {
            handleVoiceCommand(config);
          }, {
            feedback: config.feedback,
            confidence: 0.6
          });
        });
        
        // Listen to voice service events
        voiceService.addListener(handleVoiceServiceEvent);
      }
    } catch (error) {
      console.error('Failed to initialize voice service:', error);
    }
  };

  // Handle voice service events
  const handleVoiceServiceEvent = (event) => {
    switch (event.type) {
      case 'recording-started':
        setIsListening(true);
        break;
      case 'recording-stopped':
        setIsListening(false);
        if (event.recording) {
          processRecording(event.recording);
        }
        break;
      case 'command-executed':
        setLastCommand(event.transcription);
        setConfidence(0.9); // Mock confidence for executed commands
        break;
    }
  };

  // Process recording
  const processRecording = async (recordingData) => {
    try {
      const result = await voiceService.processVoiceCommand(recordingData.uri);
      if (result.success) {
        setLastCommand(result.transcription);
        setConfidence(0.8);
      } else {
        setLastCommand('Command not recognized');
        setConfidence(0.3);
      }
    } catch (error) {
      console.error('Failed to process recording:', error);
      setLastCommand('Processing error');
      setConfidence(0);
    }
  };

  // Handle voice command execution
  const handleVoiceCommand = (commandConfig) => {
    if (onCommand) {
      onCommand({
        action: commandConfig.action,
        payload: commandConfig.payload,
        feedback: commandConfig.feedback
      });
    }
  };

  // Cleanup
  const cleanup = async () => {
    if (isListening) {
      await voiceService.stopRecording();
    }
  };

  // Pulse animation when listening
  useEffect(() => {
    if (isListening) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      // Wave animation
      Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
      
      // Glow effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      waveAnim.setValue(0);
      glowAnim.setValue(0);
    }
  }, [isListening]);

  // Start voice recognition
  const startListening = async () => {
    if (!voiceServiceReady) {
      console.warn('Voice service not ready');
      return;
    }

    try {
      const success = await voiceService.startRecording({
        maxDuration: 5000, // 5 seconds max
        enableAnalysis: true
      });
      
      if (success) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        // Auto-stop after 5 seconds
        setTimeout(async () => {
          if (isListening) {
            await voiceService.stopRecording();
          }
        }, 5000);
      }
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
    }
  };

  // Stop voice recognition
  const stopListening = async () => {
    try {
      await voiceService.stopRecording();
    } catch (error) {
      console.error('Failed to stop voice recognition:', error);
    }
  };

  // Toggle voice commands
  const handleToggle = () => {
    if (isRecording) return;
    
    if (isListening) {
      stopListening();
    } else if (isEnabled) {
      startListening();
    } else {
      onToggle && onToggle(!isEnabled);
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Render voice waves animation
  const renderVoiceWaves = () => (
    <View style={styles.wavesContainer}>
      {[0, 1, 2, 3, 4].map(index => (
        <Animated.View
          key={index}
          style={[
            styles.wave,
            {
              opacity: waveAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
              transform: [{
                scale: waveAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.5 + index * 0.2],
                })
              }]
            }
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      {/* Voice Command Button */}
      <TouchableOpacity 
        style={[
          styles.voiceButton,
          isEnabled && styles.voiceButtonEnabled,
          isListening && styles.voiceButtonListening,
          !voiceServiceReady && styles.voiceButtonDisabled
        ]}
        onPress={handleToggle}
        disabled={isRecording || !voiceServiceReady}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.buttonContent,
            {
              transform: [{ scale: pulseAnim }],
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              })
            }
          ]}
        >
          {/* Voice waves when listening */}
          {isListening && renderVoiceWaves()}
          
          <Ionicons 
            name={isListening ? "mic" : "mic-outline"} 
            size={24} 
            color={
              !voiceServiceReady ? '#666' :
              isListening ? '#25F4EE' : 
              isEnabled ? '#FE2C55' : '#FFF'
            } 
          />
        </Animated.View>
        
        <Text style={[
          styles.buttonText,
          isEnabled && styles.buttonTextEnabled,
          isListening && styles.buttonTextListening,
          !voiceServiceReady && styles.buttonTextDisabled
        ]}>
          {
            !voiceServiceReady ? 'Voice Off' :
            isListening ? 'Listening...' : 
            isEnabled ? 'Voice' : 'Voice Off'
          }
        </Text>
      </TouchableOpacity>
      
      {/* Command Status */}
      {isEnabled && voiceServiceReady && (lastCommand || isListening) && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {isListening ? 'Say a command...' : lastCommand}
          </Text>
          
          {confidence > 0 && !isListening && (
            <View style={styles.confidenceBar}>
              <View 
                style={[
                  styles.confidenceFill,
                  { 
                    width: `${confidence * 100}%`,
                    backgroundColor: confidence > 0.8 ? '#4CAF50' : confidence > 0.6 ? '#FF9800' : '#F44336'
                  }
                ]} 
              />
            </View>
          )}
        </View>
      )}
      
      {/* Available Commands Help */}
      {isEnabled && voiceServiceReady && !isListening && (
        <View style={styles.helpContainer}>
          <Text style={styles.helpTitle}>Try saying:</Text>
          <Text style={styles.helpCommands}>
            "Start recording" • "Beauty mode" • "Switch camera" • "Say cheese"
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  voiceButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    position: 'relative',
    overflow: 'hidden',
  },
  voiceButtonEnabled: {
    backgroundColor: 'rgba(254,44,85,0.2)',
    borderColor: '#FE2C55',
  },
  voiceButtonListening: {
    backgroundColor: 'rgba(37,244,238,0.2)',
    borderColor: '#25F4EE',
  },
  voiceButtonDisabled: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  buttonContent: {
    alignItems: 'center',
    position: 'relative',
  },
  wavesContainer: {
    position: 'absolute',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wave: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#25F4EE',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  buttonTextEnabled: {
    color: '#FE2C55',
  },
  buttonTextListening: {
    color: '#25F4EE',
  },
  buttonTextDisabled: {
    color: '#666',
  },
  statusContainer: {
    marginTop: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 200,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    textAlign: 'center',
  },
  confidenceBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 2,
  },
  helpContainer: {
    marginTop: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    maxWidth: 280,
  },
  helpTitle: {
    color: '#25F4EE',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  helpCommands: {
    color: '#CCC',
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 12,
  },
});

export default VoiceCommandProcessor;