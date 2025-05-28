// src/components/interactions/EnhancedHapticSystem.js
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Haptic patterns configuration
const HAPTIC_PATTERNS = {
  // Basic interactions
  TAP: {
    ios: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    android: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    duration: 50,
  },
  
  BUTTON_PRESS: {
    ios: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    android: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    duration: 100,
  },
  
  // Heart/Like interactions
  HEART_SINGLE: {
    ios: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    android: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    duration: 150,
  },
  
  HEART_DOUBLE: {
    ios: async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 100);
    },
    android: async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 100);
    },
    duration: 300,
  },
  
  HEART_BURST: {
    ios: async () => {
      // Create a burst pattern
      const delays = [0, 50, 100, 150, 200];
      const intensities = [
        Haptics.ImpactFeedbackStyle.Heavy,
        Haptics.ImpactFeedbackStyle.Medium,
        Haptics.ImpactFeedbackStyle.Light,
        Haptics.ImpactFeedbackStyle.Medium,
        Haptics.ImpactFeedbackStyle.Light,
      ];
      
      delays.forEach((delay, index) => {
        setTimeout(() => {
          Haptics.impactAsync(intensities[index]);
        }, delay);
      });
    },
    android: async () => {
      // Similar pattern for Android
      const delays = [0, 50, 100, 150, 200];
      delays.forEach((delay) => {
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, delay);
      });
    },
    duration: 500,
  },
  
  // Navigation interactions
  SWIPE_VERTICAL: {
    ios: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    android: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    duration: 75,
  },
  
  SWIPE_HORIZONTAL: {
    ios: () => Haptics.selectionAsync(),
    android: () => Haptics.selectionAsync(),
    duration: 100,
  },
  
  PAGE_CHANGE: {
    ios: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    android: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    duration: 120,
  },
  
  // Success/Error feedback
  SUCCESS: {
    ios: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    android: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    duration: 200,
  },
  
  ERROR: {
    ios: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    android: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    duration: 250,
  },
  
  WARNING: {
    ios: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
    android: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
    duration: 200,
  },
  
  // Special TikTok-style patterns
  RECORD_START: {
    ios: async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 100);
    },
    android: async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 100);
    },
    duration: 200,
  },
  
  RECORD_STOP: {
    ios: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
    android: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
    duration: 150,
  },
  
  SOUND_WAVE: {
    ios: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    android: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    duration: 50,
  },
  
  MAGIC_INTERACTION: {
    ios: async () => {
      // Create a magical feeling pattern
      const pattern = [
        { intensity: Haptics.ImpactFeedbackStyle.Light, delay: 0 },
        { intensity: Haptics.ImpactFeedbackStyle.Medium, delay: 80 },
        { intensity: Haptics.ImpactFeedbackStyle.Heavy, delay: 160 },
        { intensity: Haptics.ImpactFeedbackStyle.Medium, delay: 240 },
        { intensity: Haptics.ImpactFeedbackStyle.Light, delay: 320 },
      ];
      
      pattern.forEach(({ intensity, delay }) => {
        setTimeout(() => {
          Haptics.impactAsync(intensity);
        }, delay);
      });
    },
    android: async () => {
      // Simplified for Android
      const delays = [0, 80, 160, 240, 320];
      delays.forEach((delay) => {
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, delay);
      });
    },
    duration: 400,
  },
  
  // Comment interactions
  COMMENT_POST: {
    ios: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    android: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    duration: 100,
  },
  
  COMMENT_LIKE: {
    ios: () => Haptics.selectionAsync(),
    android: () => Haptics.selectionAsync(),
    duration: 75,
  },
};

class EnhancedHapticSystem {
  constructor() {
    this.isEnabled = true;
    this.lastHapticTime = 0;
    this.throttleDelay = 50; // Minimum delay between haptics
    this.activeHaptics = new Set(); // Track active haptic patterns
  }
  
  /**
   * Enable or disable haptic feedback
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }
  
  /**
   * Check if haptics are available on the device
   */
  async isAvailable() {
    try {
      // This is a simple check - in a real app you might want more sophisticated detection
      return Platform.OS === 'ios' || Platform.OS === 'android';
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Play a haptic pattern
   */
  async playPattern(patternName, options = {}) {
    if (!this.isEnabled) return;
    
    const pattern = HAPTIC_PATTERNS[patternName];
    if (!pattern) {
      console.warn(`Haptic pattern '${patternName}' not found`);
      return;
    }
    
    // Throttle haptics to prevent overwhelming the user
    const now = Date.now();
    if (now - this.lastHapticTime < this.throttleDelay && !options.force) {
      return;
    }
    
    this.lastHapticTime = now;
    
    try {
      // Get the appropriate function for the platform
      const hapticFunction = Platform.OS === 'ios' ? pattern.ios : pattern.android;
      
      if (hapticFunction) {
        // Track active haptic
        this.activeHaptics.add(patternName);
        
        await hapticFunction();
        
        // Remove from active after duration
        setTimeout(() => {
          this.activeHaptics.delete(patternName);
        }, pattern.duration || 100);
      }
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  }
  
  /**
   * Play a custom haptic sequence
   */
  async playCustomSequence(sequence) {
    if (!this.isEnabled) return;
    
    for (const step of sequence) {
      const { pattern, delay = 0 } = step;
      
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      if (typeof pattern === 'string') {
        await this.playPattern(pattern, { force: true });
      } else if (typeof pattern === 'function') {
        await pattern();
      }
    }
  }
  
  /**
   * Create a rhythmic haptic pattern
   */
  async playRhythm(beats, intensity = 'BUTTON_PRESS') {
    if (!this.isEnabled) return;
    
    const beatDuration = 200; // ms per beat
    
    for (let i = 0; i < beats.length; i++) {
      if (beats[i] === 1) {
        await this.playPattern(intensity, { force: true });
      }
      
      if (i < beats.length - 1) {
        await new Promise(resolve => setTimeout(resolve, beatDuration));
      }
    }
  }
  
  /**
   * Stop all active haptics (if possible)
   */
  stopAll() {
    this.activeHaptics.clear();
    // Note: Expo Haptics doesn't provide a stop method
    // This is more of a state management function
  }
  
  /**
   * Get available haptic patterns
   */
  getAvailablePatterns() {
    return Object.keys(HAPTIC_PATTERNS);
  }
  
  /**
   * Check if a pattern is currently active
   */
  isPatternActive(patternName) {
    return this.activeHaptics.has(patternName);
  }
  
  /**
   * Set throttle delay between haptics
   */
  setThrottleDelay(delay) {
    this.throttleDelay = Math.max(10, delay); // Minimum 10ms
  }
  
  // Convenience methods for common interactions
  
  /**
   * TikTok-style heart double tap
   */
  async heartDoubleTap() {
    await this.playPattern('HEART_DOUBLE');
  }
  
  /**
   * Heart burst effect for multiple likes
   */
  async heartBurst() {
    await this.playPattern('HEART_BURST');
  }
  
  /**
   * Video swipe feedback
   */
  async videoSwipe(direction = 'vertical') {
    const pattern = direction === 'horizontal' ? 'SWIPE_HORIZONTAL' : 'SWIPE_VERTICAL';
    await this.playPattern(pattern);
  }
  
  /**
   * Recording interaction
   */
  async recordingStart() {
    await this.playPattern('RECORD_START');
  }
  
  async recordingStop() {
    await this.playPattern('RECORD_STOP');
  }
  
  /**
   * Success action (like posting a video)
   */
  async success() {
    await this.playPattern('SUCCESS');
  }
  
  /**
   * Error feedback
   */
  async error() {
    await this.playPattern('ERROR');
  }
  
  /**
   * Magical interaction for special effects
   */
  async magic() {
    await this.playPattern('MAGIC_INTERACTION');
  }
  
  /**
   * Sound wave pulse (for visualizers)
   */
  async soundPulse() {
    await this.playPattern('SOUND_WAVE');
  }
  
  /**
   * TikTok-style rhythmic patterns
   */
  async tikTokBeat() {
    // Classic TikTok beat pattern
    const tikTokRhythm = [1, 0, 1, 1, 0, 1, 0, 0];
    await this.playRhythm(tikTokRhythm, 'BUTTON_PRESS');
  }
  
  /**
   * Create a custom TikTok-style interaction sequence
   */
  async tikTokInteraction(type = 'like') {
    switch (type) {
      case 'like':
        await this.playCustomSequence([
          { pattern: 'TAP', delay: 0 },
          { pattern: 'HEART_SINGLE', delay: 100 },
        ]);
        break;
        
      case 'double_like':
        await this.playCustomSequence([
          { pattern: 'TAP', delay: 0 },
          { pattern: 'TAP', delay: 150 },
          { pattern: 'HEART_BURST', delay: 50 },
        ]);
        break;
        
      case 'comment':
        await this.playPattern('COMMENT_POST');
        break;
        
      case 'share':
        await this.playCustomSequence([
          { pattern: 'BUTTON_PRESS', delay: 0 },
          { pattern: 'SUCCESS', delay: 200 },
        ]);
        break;
        
      case 'follow':
        await this.playCustomSequence([
          { pattern: 'BUTTON_PRESS', delay: 0 },
          { pattern: 'MAGIC_INTERACTION', delay: 100 },
        ]);
        break;
        
      default:
        await this.playPattern('BUTTON_PRESS');
    }
  }
}

// Create singleton instance
const hapticSystem = new EnhancedHapticSystem();

// Export both the class and the instance
export default hapticSystem;
export { EnhancedHapticSystem, HAPTIC_PATTERNS };