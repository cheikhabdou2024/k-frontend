// src/services/VoiceService.js
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system';

class VoiceService {
  constructor() {
    this.isRecording = false;
    this.recording = null;
    this.audioAnalyzer = null;
    this.voiceCommands = new Map();
    this.listeners = new Set();
    this.isInitialized = false;
    this.audioSettings = {
      android: {
        extension: '.m4a',
        outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
        audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
      },
      ios: {
        extension: '.m4a',
        outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
        audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
    };
  }

  // Initialize voice service
  async initialize() {
    if (this.isInitialized) return true;

    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Audio permission not granted');
        return false;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
      
      this.isInitialized = true;
      this.notifyListeners({ type: 'initialized' });
      return true;
    } catch (error) {
      console.error('Failed to initialize voice service:', error);
      return false;
    }
  }

  // Register voice command
  registerCommand(trigger, action, options = {}) {
    const command = {
      trigger: trigger.toLowerCase(),
      action,
      confidence: options.confidence || 0.7,
      feedback: options.feedback,
      parameters: options.parameters || {},
      enabled: true,
      ...options
    };

    this.voiceCommands.set(trigger.toLowerCase(), command);
    return command;
  }

  // Remove voice command
  removeCommand(trigger) {
    return this.voiceCommands.delete(trigger.toLowerCase());
  }

  // Get registered commands
  getCommands() {
    return Array.from(this.voiceCommands.values());
  }

  // Start voice recording
  async startRecording(options = {}) {
    if (this.isRecording) {
      console.warn('Already recording');
      return false;
    }

    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return false;
    }

    try {
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        ...this.audioSettings.ios, // Use iOS settings by default
        ...options
      });

      await recording.startAsync();
      
      this.recording = recording;
      this.isRecording = true;

      // Start audio analysis if enabled
      if (options.enableAnalysis) {
        this.startAudioAnalysis();
      }

      this.notifyListeners({ 
        type: 'recording-started',
        recording: this.recording 
      });

      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      return false;
    }
  }

  // Stop voice recording
  async stopRecording() {
    if (!this.isRecording || !this.recording) {
      console.warn('Not currently recording');
      return null;
    }

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      
      const recordingData = {
        uri,
        duration: await this.getRecordingDuration(uri),
        size: await this.getFileSize(uri),
        timestamp: Date.now()
      };

      this.isRecording = false;
      this.recording = null;

      // Stop audio analysis
      this.stopAudioAnalysis();

      this.notifyListeners({ 
        type: 'recording-stopped',
        recording: recordingData 
      });

      return recordingData;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      return null;
    }
  }

  // Process voice command from audio
  async processVoiceCommand(audioUri, options = {}) {
    try {
      // In a real implementation, you would:
      // 1. Send audio to speech-to-text service (Google Cloud Speech, AWS Transcribe, etc.)
      // 2. Get transcription
      // 3. Match against registered commands
      
      // For this demo, we'll simulate the process
      const transcription = await this.simulateTranscription(audioUri);
      const command = this.matchCommand(transcription);

      if (command) {
        await this.executeCommand(command, transcription);
        return { success: true, command, transcription };
      } else {
        return { success: false, transcription, error: 'No matching command found' };
      }
    } catch (error) {
      console.error('Failed to process voice command:', error);
      return { success: false, error: error.message };
    }
  }

  // Simulate transcription (replace with real service)
  async simulateTranscription(audioUri) {
    // This would normally call a real speech-to-text service
    const mockTranscriptions = [
      'start recording',
      'stop recording',
      'take photo',
      'switch camera',
      'beauty mode',
      'apply filter vintage',
      'say cheese',
      'lights camera action'
    ];
    
    // Add small delay to simulate processing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
  }

  // Match transcription to registered command
  matchCommand(transcription) {
    const normalizedText = transcription.toLowerCase().trim();
    
    // Direct match
    if (this.voiceCommands.has(normalizedText)) {
      return this.voiceCommands.get(normalizedText);
    }

    // Fuzzy matching
    let bestMatch = null;
    let bestScore = 0;

    for (const [trigger, command] of this.voiceCommands) {
      const score = this.calculateSimilarity(normalizedText, trigger);
      if (score > bestScore && score >= command.confidence) {
        bestScore = score;
        bestMatch = command;
      }
    }

    return bestMatch;
  }

  // Calculate text similarity (simple implementation)
  calculateSimilarity(text1, text2) {
    const words1 = text1.split(' ');
    const words2 = text2.split(' ');
    
    let matches = 0;
    words1.forEach(word1 => {
      if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
        matches++;
      }
    });

    return matches / Math.max(words1.length, words2.length);
  }

  // Execute matched command
  async executeCommand(command, transcription) {
    try {
      // Provide voice feedback
      if (command.feedback) {
        await this.speak(command.feedback);
      }

      // Execute the command action
      if (typeof command.action === 'function') {
        await command.action(transcription, command);
      }

      this.notifyListeners({
        type: 'command-executed',
        command,
        transcription
      });

      return true;
    } catch (error) {
      console.error('Failed to execute command:', error);
      return false;
    }
  }

  // Text-to-speech
  async speak(text, options = {}) {
    try {
      const speakOptions = {
        language: 'en-US',
        pitch: 1.0,
        rate: 1.0,
        ...options
      };

      await Speech.speak(text, speakOptions);
      
      this.notifyListeners({
        type: 'speech-started',
        text,
        options: speakOptions
      });

      return true;
    } catch (error) {
      console.error('Failed to speak:', error);
      return false;
    }
  }

  // Stop current speech
  async stopSpeaking() {
    try {
      await Speech.stop();
      this.notifyListeners({ type: 'speech-stopped' });
      return true;
    } catch (error) {
      console.error('Failed to stop speaking:', error);
      return false;
    }
  }

  // Start real-time audio analysis
  startAudioAnalysis() {
    // This would implement real-time audio analysis
    // For detecting volume levels, frequency analysis, etc.
    console.log('Starting audio analysis...');
  }

  // Stop audio analysis
  stopAudioAnalysis() {
    if (this.audioAnalyzer) {
      clearInterval(this.audioAnalyzer);
      this.audioAnalyzer = null;
    }
  }

  // Get recording duration
  async getRecordingDuration(uri) {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      const status = await sound.getStatusAsync();
      await sound.unloadAsync();
      return status.durationMillis || 0;
    } catch (error) {
      console.error('Failed to get recording duration:', error);
      return 0;
    }
  }

  // Get file size
  async getFileSize(uri) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return fileInfo.size || 0;
    } catch (error) {
      console.error('Failed to get file size:', error);
      return 0;
    }
  }

  // Add event listener
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners
  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in voice service listener:', error);
      }
    });
  }

  // Cleanup
  async cleanup() {
    if (this.isRecording) {
      await this.stopRecording();
    }
    
    await this.stopSpeaking();
    this.stopAudioAnalysis();
    this.listeners.clear();
    this.voiceCommands.clear();
    this.isInitialized = false;
  }
}

// Create singleton instance
const voiceService = new VoiceService();

export default voiceService;
export { VoiceService };