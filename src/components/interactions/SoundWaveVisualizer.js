// src/components/interactions/SoundWaveVisualizer.js - FIXED VERSION
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
  
  // Animation refs - FIXED: Separate native and non-native animations
  const waveHeightAnims = useRef([]);
  const waveOpacityAnims = useRef([]); // NEW: Separate opacity animations for native driver
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

  // Initialize wave animation values - FIXED
  const initializeWaves = () => {
    const newWaveHeightAnims = [];
    const newWaveOpacityAnims = [];
    const newWaveHeights = [];
    
    for (let i = 0; i < WAVE_CONFIG.WAVE_COUNT; i++) {
      // Height animations - NOT using native driver (height not supported)
      newWaveHeightAnims.push(new Animated.Value(WAVE_CONFIG.WAVE_HEIGHT_MIN));
      // Opacity animations - CAN use native driver
      newWaveOpacityAnims.push(new Animated.Value(0.6));
      newWaveHeights.push(WAVE_CONFIG.WAVE_HEIGHT_MIN);
    }
    
    waveHeightAnims.current = newWaveHeightAnims;
    waveOpacityAnims.current = newWaveOpacityAnims;
    setWaveHeights(newWaveHeights);
  };

  // Start wave animations - FIXED
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
    if (Haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Stop wave animations - FIXED
  const stopWaveAnimations = () => {
    if (!isAnimating) return;
    
    setIsAnimating(false);
    clearIntervals();
    
    // Fade out all waves - FIXED: Separate native and non-native animations
    const heightAnimations = waveHeightAnims.current.map((anim) => 
      Animated.timing(anim, {
        toValue: WAVE_CONFIG.WAVE_HEIGHT_MIN,
        duration: 300,
        useNativeDriver: false, // Height animations cannot use native driver
      })
    );
    
    const opacityAnimations = waveOpacityAnims.current.map((anim) =>
      Animated.timing(anim, {
        toValue: 0.6,
        duration: 300,
        useNativeDriver: true, // Opacity CAN use native driver
      })
    );
    
    // Run animations separately to avoid conflicts
    Animated.parallel([
      ...heightAnimations,
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
    
    // Run opacity animations separately if needed
    if (opacityAnimations.length > 0) {
      Animated.parallel(opacityAnimations).start();
    }
  };

  // Start pulse animation - FIXED: Only native driver compatible properties
  const startPulseAnimation = () => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: WAVE_CONFIG.PULSE_INTERVAL,
          useNativeDriver: true, // Transform and opacity work with native driver
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

  // Start glow animation - FIXED
  const startGlowAnimation = () => {
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true, // Opacity works with native driver
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

  // Start pulse ring animation - FIXED
  const startPulseRingAnimation = () => {
    const pulseRingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseRingAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true, // Transform and opacity work with native driver
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

  // Generate wave pattern - FIXED: Separate height and opacity animations
  const generateWavePattern = () => {
    const intensityMultiplier = WAVE_CONFIG.INTENSITY_MULTIPLIERS[intensity] || 1;
    const baseHeight = WAVE_CONFIG.WAVE_HEIGHT_MIN;
    const maxHeight = WAVE_CONFIG.WAVE_HEIGHT_MAX * intensityMultiplier;
    
    // Generate random wave heights with pattern
    const newHeights = waveHeightAnims.current.map((anim, index) => {
      const centerDistance = Math.abs(index - WAVE_CONFIG.WAVE_COUNT / 2);
      const centerFactor = 1 - (centerDistance / (WAVE_CONFIG.WAVE_COUNT / 2)) * 0.3;
      const randomFactor = 0.5 + Math.random() * 0.5;
      const heightFactor = centerFactor * randomFactor * intensityMultiplier;
      
      return baseHeight + (maxHeight - baseHeight) * heightFactor;
    });
    
    // FIXED: Animate heights WITHOUT native driver
    const heightAnimations = waveHeightAnims.current.map((anim, index) =>
      Animated.timing(anim, {
        toValue: newHeights[index],
        duration: WAVE_CONFIG.ANIMATION_DURATION,
        useNativeDriver: false, // Height cannot use native driver
      })
    );
    
    // FIXED: Animate opacities WITH native driver (separate from height)
    const opacityAnimations = waveOpacityAnims.current.map((anim, index) => {
      const targetOpacity = 0.6 + (newHeights[index] / maxHeight) * 0.4;
      return Animated.timing(anim, {
        toValue: targetOpacity,
        duration: WAVE_CONFIG.ANIMATION_DURATION,
        useNativeDriver: true, // Opacity CAN use native driver
      });
    });
    
    // Start height animations with stagger
    heightAnimations.forEach((animation, index) => {
      setTimeout(() => {
        animation.start();
      }, index * WAVE_CONFIG.STAGGER_DELAY);
    });
    
    // Start opacity animations with stagger
    opacityAnimations.forEach((animation, index) => {
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

  // Render individual wave - FIXED: Use separate animations
  const renderWave = (index) => {
    const colors = getWaveColors();
    const colorIndex = index % colors.length;
    
    return (
      <Animated.View
        key={index}
        style={[
          styles.wave,
          {
            // FIXED: Height animation (no native driver)
            height: waveHeightAnims.current[index],
            backgroundColor: colors[colorIndex],
            width: WAVE_CONFIG.WAVE_WIDTH,
            marginHorizontal: WAVE_CONFIG.WAVE_SPACING / 2,
            // FIXED: Opacity animation (with native driver)
            opacity: waveOpacityAnims.current[index],
            // FIXED: Transform animation (with native driver)
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

  // Render pulse ring - FIXED: Only native driver compatible properties
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
            // FIXED: Only use native driver compatible properties
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
      
      {/* Glow effect - FIXED: Only native driver properties */}
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
        {waveHeightAnims.current.map((_, index) => renderWave(index))}
      </View>
      
      {/* Sound pulse indicator - FIXED: Only native driver properties */}
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