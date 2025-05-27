// src/components/interactions/SoundWaveVisualizer.js
import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Configuration for sound waves
const WAVE_CONFIG = {
  // Visual settings
  WAVE_COUNT: 12,
  WAVE_HEIGHT_MIN: 8,
  WAVE_HEIGHT_MAX: 40,
  WAVE_WIDTH: 3,
  WAVE_SPACING: 6,
  
  // Animation settings
  ANIMATION_DURATION: 800,
  STAGGER_DELAY: 50,
  PULSE_INTERVAL: 100,
  
  // Colors
  ACTIVE_COLORS: ['#FE2C55', '#FF6B9D', '#25F4EE'],
  INACTIVE_COLORS: ['#444', '#666', '#333'],
  
  // Intensity levels
  INTENSITY_MULTIPLIERS: {
    low: 0.6,
    medium: 1.0,
    high: 1.4,
    extreme: 1.8
  }
};

const SoundWaveVisualizer = ({
  isActive = false,
  intensity = 'medium',
  style,
  size = 'medium',
  onWaveComplete,
  showPulseRing = true,
  syncWithAudio = false,
}) => {
  // State
  const [waveHeights, setWaveHeights] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Animation refs
  const waveAnims = useRef([]);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseRingAnim = useRef(new Animated.Value(0)).current;
  
  // Intervals
  const pulseInterval = useRef(null);
  const waveInterval = useRef(null);
  
  // Initialize wave animations
  useEffect(() => {
    initializeWaves();
    return () => {
      clearIntervals();
    };
  }, []);

  // Start/stop animations based on active state
  useEffect(() => {
    if (isActive) {
      startWaveAnimations();
    } else {
      stopWaveAnimations();
    }
  }, [isActive, intensity]);

  // Initialize wave animation values
  const initializeWaves = () => {
    const newWaveAnims = [];
    const newWaveHeights = [];
    
    for (let i = 0; i < WAVE_CONFIG.WAVE_COUNT; i++) {
      newWaveAnims.push(new Animated.Value(WAVE_CONFIG.WAVE_HEIGHT_MIN));
      newWaveHeights.push(WAVE_CONFIG.WAVE_HEIGHT_MIN);
    }
    
    waveAnims.current = newWaveAnims;
    setWaveHeights(newWaveHeights);
  };

  // Start wave animations
  const startWaveAnimations = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Start pulsing animation
    startPulseAnimation();
    
    // Start glow effect
    startGlowAnimation();
    
    // Start pulse ring if enabled
    if (showPulseRing) {
      startPulseRingAnimation();
    }
    
    // Start wave generation
    startWaveGeneration();
    
    // Haptic feedback
    if (WAVE_CONFIG.HAPTIC_ENABLED) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Stop wave animations
  const stopWaveAnimations = () => {
    if (!isAnimating) return;
    
    setIsAnimating(false);
    clearIntervals();
    
    // Fade out all waves
    const fadeOutAnimations = waveAnims.current.map((anim, index) => 
      Animated.timing(anim, {
        toValue: WAVE_CONFIG.WAVE_HEIGHT_MIN,
        duration: 300,
        useNativeDriver: false,
      })
    );
    
    Animated.parallel([
      ...fadeOutAnimations,
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(pulseRingAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  // Start pulse animation
  const startPulseAnimation = () => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: WAVE_CONFIG.PULSE_INTERVAL,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: WAVE_CONFIG.PULSE_INTERVAL,
          useNativeDriver: true,
        }),
      ])
    );
    
    pulseAnimation.start();
  };

  // Start glow animation
  const startGlowAnimation = () => {
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    
    glowAnimation.start();
  };

  // Start pulse ring animation
  const startPulseRingAnimation = () => {
    const pulseRingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseRingAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseRingAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ])
    );
    
    pulseRingAnimation.start();
  };

  // Start wave generation
  const startWaveGeneration = () => {
    waveInterval.current = setInterval(() => {
      generateWavePattern();
    }, WAVE_CONFIG.PULSE_INTERVAL);
  };

  // Generate wave pattern
  const generateWavePattern = () => {
    const intensityMultiplier = WAVE_CONFIG.INTENSITY_MULTIPLIERS[intensity] || 1;
    const baseHeight = WAVE_CONFIG.WAVE_HEIGHT_MIN;
    const maxHeight = WAVE_CONFIG.WAVE_HEIGHT_MAX * intensityMultiplier;
    
    // Generate random wave heights with some pattern
    const newHeights = waveAnims.current.map((anim, index) => {
      // Create wave pattern - center waves are generally higher
      const centerDistance = Math.abs(index - WAVE_CONFIG.WAVE_COUNT / 2);
      const centerFactor = 1 - (centerDistance / (WAVE_CONFIG.WAVE_COUNT / 2)) * 0.3;
      
      // Add randomness
      const randomFactor = 0.5 + Math.random() * 0.5;
      
      // Combine factors
      const heightFactor = centerFactor * randomFactor * intensityMultiplier;
      
      return baseHeight + (maxHeight - baseHeight) * heightFactor;
    });
    
    // Animate to new heights with staggered timing
    const animations = waveAnims.current.map((anim, index) =>
      Animated.timing(anim, {
        toValue: newHeights[index],
        duration: WAVE_CONFIG.ANIMATION_DURATION,
        useNativeDriver: false,
      })
    );
    
    // Start animations with stagger
    animations.forEach((animation, index) => {
      setTimeout(() => {
        animation.start();
      }, index * WAVE_CONFIG.STAGGER_DELAY);
    });
    
    setWaveHeights(newHeights);
  };

  // Clear intervals
  const clearIntervals = () => {
    if (pulseInterval.current) {
      clearInterval(pulseInterval.current);
      pulseInterval.current = null;
    }
    
    if (waveInterval.current) {
      clearInterval(waveInterval.current);
      waveInterval.current = null;
    }
  };

  // Get container size based on size prop
  const getContainerSize = () => {
    const sizeMap = {
      small: { width: 60, height: 30 },
      medium: { width: 80, height: 40 },
      large: { width: 120, height: 60 }
    };
    
    return sizeMap[size] || sizeMap.medium;
  };

  // Get wave colors based on active state
  const getWaveColors = () => {
    return isActive ? WAVE_CONFIG.ACTIVE_COLORS : WAVE_CONFIG.INACTIVE_COLORS;
  };

  // Render individual wave
  const renderWave = (index) => {
    const colors = getWaveColors();
    const colorIndex = index % colors.length;
    
    return (
      <Animated.View
        key={index}
        style={[
          styles.wave,
          {
            height: waveAnims.current[index],
            backgroundColor: colors[colorIndex],
            width: WAVE_CONFIG.WAVE_WIDTH,
            marginHorizontal: WAVE_CONFIG.WAVE_SPACING / 2,
            opacity: pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.6, 1],
            }),
            transform: [{
              scaleY: pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1.2],
              })
            }]
          }
        ]}
      />
    );
  };

  // Render pulse ring
  const renderPulseRing = () => {
    if (!showPulseRing) return null;
    
    const containerSize = getContainerSize();
    
    return (
      <Animated.View
        style={[
          styles.pulseRing,
          {
            width: containerSize.width + 20,
            height: containerSize.height + 20,
            borderRadius: (containerSize.width + 20) / 2,
            opacity: pulseRingAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0.6, 0],
            }),
            transform: [{
              scale: pulseRingAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1.4],
              })
            }]
          }
        ]}
      />
    );
  };

  const containerSize = getContainerSize();
  
  return (
    <View style={[styles.container, containerSize, style]}>
      {/* Pulse ring */}
      {renderPulseRing()}
      
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glowContainer,
          {
            opacity: glowAnim,
            transform: [{
              scale: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1.1],
              })
            }]
          }
        ]}
      >
        <LinearGradient
          colors={isActive ? ['rgba(254, 44, 85, 0.3)', 'rgba(37, 244, 238, 0.3)'] : ['transparent', 'transparent']}
          style={[styles.glowGradient, containerSize]}
        />
      </Animated.View>
      
      {/* Wave container */}
      <View style={styles.waveContainer}>
        {waveAnims.current.map((_, index) => renderWave(index))}
      </View>
      
      {/* Sound pulse indicator */}
      {isActive && (
        <Animated.View
          style={[
            styles.soundPulse,
            {
              opacity: pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 1],
              })
            }
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(254, 44, 85, 0.6)',
  },
  glowContainer: {
    position: 'absolute',
  },
  glowGradient: {
    borderRadius: 20,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: '100%',
  },
  wave: {
    borderRadius: 2,
    minHeight: 8,
    shadowColor: '#FE2C55',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  soundPulse: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#25F4EE',
    top: 2,
    right: 2,
  },
});

export default SoundWaveVisualizer;