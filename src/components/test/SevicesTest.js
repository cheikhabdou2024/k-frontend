// src/components/test/ServicesTest.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import effectsService from '../../services/EffectsService';
import voiceService from '../../services/VoiceService';

const ServicesTest = () => {
  const [effectsStats, setEffectsStats] = useState(null);
  const [voiceInitialized, setVoiceInitialized] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    // Initialize services
    initializeServices();
    
    // Set up listeners
    const effectsListener = effectsService.addListener((event) => {
      console.log('Effects event:', event);
      setEffectsStats(effectsService.getStats());
    });

    const voiceListener = voiceService.addListener((event) => {
      console.log('Voice event:', event);
      if (event.type === 'initialized') {
        setVoiceInitialized(true);
      }
    });

    return () => {
      effectsListener();
      voiceListener();
    };
  }, []);

  const initializeServices = async () => {
    try {
      const voiceReady = await voiceService.initialize();
      setVoiceInitialized(voiceReady);
      setEffectsStats(effectsService.getStats());
    } catch (error) {
      console.error('Failed to initialize services:', error);
    }
  };

  const testEffectsService = () => {
    // Test applying effects
    effectsService.applyEffect('test-filter', { 
      type: 'vintage', 
      intensity: 0.8 
    });
    
    effectsService.applyEffect('test-beauty', { 
      skinSmooth: 50, 
      eyeEnhance: 30 
    });
    
    Alert.alert('Success', 'Effects applied! Check console for events.');
  };

  const testVoiceService = async () => {
    if (!voiceInitialized) {
      Alert.alert('Error', 'Voice service not initialized');
      return;
    }

    try {
      if (isRecording) {
        const result = await voiceService.stopRecording();
        setIsRecording(false);
        if (result) {
          Alert.alert('Recording Stopped', `Duration: ${result.duration}ms`);
        }
      } else {
        const success = await voiceService.startRecording();
        if (success) {
          setIsRecording(true);
          Alert.alert('Recording Started', 'Say something...');
          
          // Auto-stop after 3 seconds for testing
          setTimeout(async () => {
            if (isRecording) {
              await voiceService.stopRecording();
              setIsRecording(false);
            }
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Voice test error:', error);
      Alert.alert('Error', 'Voice test failed');
    }
  };

  const testTextToSpeech = async () => {
    try {
      await voiceService.speak('Hello! This is a test of the text to speech system.');
      Alert.alert('Success', 'Text-to-speech test completed');
    } catch (error) {
      console.error('TTS test error:', error);
      Alert.alert('Error', 'Text-to-speech test failed');
    }
  };

  const clearEffects = () => {
    effectsService.clearAllEffects();
    Alert.alert('Success', 'All effects cleared');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Services Test</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Effects Service</Text>
        <Text style={styles.info}>
          Active Effects: {effectsStats?.activeCount || 0}
        </Text>
        <Text style={styles.info}>
          Total Applied: {effectsStats?.totalApplied || 0}
        </Text>
        
        <TouchableOpacity style={styles.button} onPress={testEffectsService}>
          <Text style={styles.buttonText}>Test Effects</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={clearEffects}>
          <Text style={styles.buttonText}>Clear Effects</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Voice Service</Text>
        <Text style={styles.info}>
          Status: {voiceInitialized ? 'Ready' : 'Not Ready'}
        </Text>
        <Text style={styles.info}>
          Recording: {isRecording ? 'Yes' : 'No'}
        </Text>
        
        <TouchableOpacity 
          style={[styles.button, !voiceInitialized && styles.buttonDisabled]} 
          onPress={testVoiceService}
          disabled={!voiceInitialized}
        >
          <Text style={styles.buttonText}>
            {isRecording ? 'Stop Recording' : 'Test Recording'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, !voiceInitialized && styles.buttonDisabled]} 
          onPress={testTextToSpeech}
          disabled={!voiceInitialized}
        >
          <Text style={styles.buttonText}>Test TTS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#25F4EE',
    marginBottom: 15,
  },
  info: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#FE2C55',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ServicesTest;