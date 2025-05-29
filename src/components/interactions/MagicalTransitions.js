// src/components/interactions/MagicalTransitions.js - COMPLETELY FIXED
import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import hapticSystem from './EnhancedHapticSystem';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Transition configuration
export const TRANSITION_CONFIG = {
  TYPES: {
    SLIDE_UP: 'slide_up',
    SLIDE_DOWN: 'slide_down',
    SLIDE_LEFT: 'slide_left',
    SLIDE_RIGHT: 'slide_right',
    FADE: 'fade',
    SCALE: 'scale',
    ROTATE: 'rotate',
    MAGICAL: 'magical',
  },
  DURATION: 300,
  EASINGS: {
    SMOOTH: Easing.out(Easing.cubic),
    BOUNCE: Easing.out(Easing.back(1.5)),
    ELASTIC: Easing.out(Easing.elastic(1)),
    QUICK: Easing.out(Easing.quad),
  },
};

// COMPLETELY REWRITTEN: Simple, reliable page transition
export const MagicalPageTransition = ({
  children,
  transitionType = 'fade',
  duration = TRANSITION_CONFIG.DURATION,
  isVisible = true,
  onTransitionStart,
  onTransitionEnd,
  style,
  enableHaptic = true,
}) => {
  // ONLY use simple, native-driver compatible animations
  const opacity = useRef(new Animated.Value(isVisible ? 1 : 0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isVisible) {
      animateIn();
    } else {
      animateOut();
    }
  }, [isVisible]);

  const animateIn = () => {
    if (onTransitionStart) onTransitionStart();
    
    // Set initial state
    const initialValues = getInitialValues();
    
    opacity.setValue(initialValues.opacity);
    translateX.setValue(initialValues.translateX);
    translateY.setValue(initialValues.translateY);
    scale.setValue(initialValues.scale);

    if (enableHaptic) {
      hapticSystem.playPattern('SWIPE_VERTICAL');
    }

    // Animate to final state
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        easing: TRANSITION_CONFIG.EASINGS.QUICK,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration,
        easing: TRANSITION_CONFIG.EASINGS.QUICK,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        easing: TRANSITION_CONFIG.EASINGS.QUICK,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onTransitionEnd) onTransitionEnd();
    });
  };

  const animateOut = () => {
    if (onTransitionStart) onTransitionStart();
    
    const exitValues = getExitValues();
    
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: exitValues.opacity,
        duration: duration * 0.8,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: exitValues.translateX,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: exitValues.translateY,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: exitValues.scale,
        duration,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onTransitionEnd) onTransitionEnd();
    });
  };

  const getInitialValues = () => {
    switch (transitionType) {
      case TRANSITION_CONFIG.TYPES.SLIDE_UP:
        return { opacity: 0, translateX: 0, translateY: SCREEN_HEIGHT, scale: 1 };
      case TRANSITION_CONFIG.TYPES.SLIDE_DOWN:
        return { opacity: 0, translateX: 0, translateY: -SCREEN_HEIGHT, scale: 1 };
      case TRANSITION_CONFIG.TYPES.SLIDE_LEFT:
        return { opacity: 0, translateX: SCREEN_WIDTH, translateY: 0, scale: 1 };
      case TRANSITION_CONFIG.TYPES.SLIDE_RIGHT:
        return { opacity: 0, translateX: -SCREEN_WIDTH, translateY: 0, scale: 1 };
      case TRANSITION_CONFIG.TYPES.SCALE:
        return { opacity: 0, translateX: 0, translateY: 0, scale: 0.8 };
      case TRANSITION_CONFIG.TYPES.MAGICAL:
        return { opacity: 0, translateX: 0, translateY: 0, scale: 0.5 };
      default: // FADE
        return { opacity: 0, translateX: 0, translateY: 0, scale: 1 };
    }
  };

  const getExitValues = () => {
    switch (transitionType) {
      case TRANSITION_CONFIG.TYPES.SLIDE_UP:
        return { opacity: 1, translateX: 0, translateY: -SCREEN_HEIGHT, scale: 1 };
      case TRANSITION_CONFIG.TYPES.SLIDE_DOWN:
        return { opacity: 1, translateX: 0, translateY: SCREEN_HEIGHT, scale: 1 };
      case TRANSITION_CONFIG.TYPES.SLIDE_LEFT:
        return { opacity: 1, translateX: -SCREEN_WIDTH, translateY: 0, scale: 1 };
      case TRANSITION_CONFIG.TYPES.SLIDE_RIGHT:
        return { opacity: 1, translateX: SCREEN_WIDTH, translateY: 0, scale: 1 };
      case TRANSITION_CONFIG.TYPES.SCALE:
        return { opacity: 0, translateX: 0, translateY: 0, scale: 0.8 };
      case TRANSITION_CONFIG.TYPES.MAGICAL:
        return { opacity: 0, translateX: 0, translateY: 0, scale: 2 };
      default: // FADE
        return { opacity: 0, translateX: 0, translateY: 0, scale: 1 };
    }
  };

  return (
    <Animated.View
      style={[
        styles.transitionContainer,
        {
          opacity,
          transform: [
            { translateX },
            { translateY },
            { scale },
          ],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

// SIMPLIFIED: Video swipe transition without complex animations
export const VideoSwipeTransition = ({
  direction = 'up',
  progress = 0,
  nextVideoComponent,
  currentVideoComponent,
  onTransitionComplete,
  style,
}) => {
  // Simple opacity-based transition
  const currentOpacity = useRef(new Animated.Value(1)).current;
  const nextOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const progressValue = Math.max(0, Math.min(1, progress));
    
    // Simple cross-fade transition
    Animated.timing(currentOpacity, {
      toValue: 1 - progressValue,
      duration: 0,
      useNativeDriver: true,
    }).start();
    
    Animated.timing(nextOpacity, {
      toValue: progressValue,
      duration: 0,
      useNativeDriver: true,
    }).start();

    if (progressValue >= 1 && onTransitionComplete) {
      onTransitionComplete();
    }
  }, [progress]);

  return (
    <View style={[styles.swipeContainer, style]}>
      {/* Current video */}
      <Animated.View
        style={[
          styles.videoLayer,
          { opacity: currentOpacity }
        ]}
      >
        {currentVideoComponent}
      </Animated.View>
      
      {/* Next video */}
      <Animated.View
        style={[
          styles.videoLayer,
          { opacity: nextOpacity }
        ]}
      >
        {nextVideoComponent}
      </Animated.View>
    </View>
  );
};

// SIMPLIFIED: Particle transition effect
export const ParticleTransition = ({
  isActive = false,
  particleCount = 15, // Reduced for better performance
  colors = ['#FE2C55', '#25F4EE', '#FF6B9D'],
  onComplete,
}) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (isActive) {
      createParticles();
    }
  }, [isActive]);

  const createParticles = () => {
    const newParticles = Array.from({ length: particleCount }, (_, index) => {
      const particle = {
        id: index,
        x: Math.random() * SCREEN_WIDTH,
        y: Math.random() * SCREEN_HEIGHT,
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: new Animated.Value(0),
        scale: new Animated.Value(0),
        translateX: new Animated.Value(0),
        translateY: new Animated.Value(0),
      };

      // Simple animation sequence
      const delay = index * 30;
      
      // Entrance
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(particle.opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(particle.scale, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      }, delay);

      // Movement and exit
      setTimeout(() => {
        const moveX = (Math.random() - 0.5) * 100;
        const moveY = (Math.random() - 0.5) * 100;
        
        Animated.parallel([
          Animated.timing(particle.translateX, {
            toValue: moveX,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(particle.translateY, {
            toValue: moveY,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 800,
            delay: 700,
            useNativeDriver: true,
          }),
        ]).start();
      }, delay + 300);

      return particle;
    });

    setParticles(newParticles);

    // Cleanup
    setTimeout(() => {
      setParticles([]);
      if (onComplete) onComplete();
    }, 2500);
  };

  if (particles.length === 0) return null;

  return (
    <View style={styles.particleContainer} pointerEvents="none">
      {particles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              position: 'absolute',
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              borderRadius: particle.size / 2,
              opacity: particle.opacity,
              transform: [
                { scale: particle.scale },
                { translateX: particle.translateX },
                { translateY: particle.translateY },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

// SIMPLIFIED: Magical reveal transition
export const MagicalReveal = ({
  isRevealing = false,
  revealType = 'circle',
  duration = 800,
  children,
  onRevealComplete,
}) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRevealing) {
      startReveal();
    } else {
      hideReveal();
    }
  }, [isRevealing]);

  const startReveal = () => {
    scale.setValue(0);
    opacity.setValue(0);

    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1,
        duration: duration * 0.7,
        easing: TRANSITION_CONFIG.EASINGS.ELASTIC,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration * 0.3,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onRevealComplete) onRevealComplete();
    });
  };

  const hideReveal = () => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0,
        duration: duration * 0.4,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: duration * 0.3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  if (!isRevealing) return null;

  return (
    <View style={styles.revealContainer}>
      <Animated.View
        style={[
          styles.revealMask,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  transitionContainer: {
    flex: 1,
  },
  swipeContainer: {
    flex: 1,
    position: 'relative',
  },
  videoLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  particle: {
    shadowColor: '#FE2C55',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  revealContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    zIndex: 2000,
  },
  revealMask: {
    width: SCREEN_WIDTH * 2,
    height: SCREEN_WIDTH * 2,
    borderRadius: SCREEN_WIDTH,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});

export default {
  MagicalPageTransition,
  VideoSwipeTransition,
  ParticleTransition,
  MagicalReveal,
  TRANSITION_CONFIG,
};