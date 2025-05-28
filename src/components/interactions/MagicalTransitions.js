// src/components/interactions/MagicalTransitions.js
import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import hapticSystem from './EnhancedHapticSystem';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Transition configuration
const TRANSITION_CONFIG = {
  // Transition types
  TYPES: {
    SLIDE_UP: 'slide_up',
    SLIDE_DOWN: 'slide_down',
    SLIDE_LEFT: 'slide_left',
    SLIDE_RIGHT: 'slide_right',
    FADE: 'fade',
    SCALE: 'scale',
    ROTATE: 'rotate',
    CUBE: 'cube',
    FLIP: 'flip',
    MAGICAL: 'magical',
  },
  
  // Timing
  DURATION: 300,
  STAGGER_DELAY: 50,
  
  // Easing curves
  EASINGS: {
    SMOOTH: Easing.out(Easing.cubic),
    BOUNCE: Easing.out(Easing.back(1.5)),
    ELASTIC: Easing.out(Easing.elastic(1)),
    QUICK: Easing.out(Easing.quad),
  },
  
  // Effects
  BLUR_INTENSITY: 10,
  SCALE_FACTOR: 1.1,
  ROTATION_DEGREES: 180,
};

// Magical page transition component
export const MagicalPageTransition = ({
  children,
  transitionType = 'slide_up',
  duration = TRANSITION_CONFIG.DURATION,
  isVisible = true,
  onTransitionStart,
  onTransitionEnd,
  style,
  enableHaptic = true,
}) => {
  // Animation values
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  
  // Effect values
  const blurRadius = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (isVisible) {
      animateIn();
    } else {
      animateOut();
    }
  }, [isVisible, transitionType]);
  
  const animateIn = () => {
    if (onTransitionStart) onTransitionStart();
    
    // Reset all values
    resetAnimationValues();
    
    // Set initial values based on transition type
    setInitialValues();
    
    // Haptic feedback
    if (enableHaptic) {
      hapticSystem.videoSwipe();
    }
    
    // Create transition animation
    const animations = createTransitionAnimations(true);
    
    Animated.parallel(animations).start(() => {
      if (onTransitionEnd) onTransitionEnd();
    });
  };
  
  const animateOut = () => {
    if (onTransitionStart) onTransitionStart();
    
    // Haptic feedback
    if (enableHaptic) {
      hapticSystem.playPattern('SWIPE_VERTICAL');
    }
    
    // Create transition animation
    const animations = createTransitionAnimations(false);
    
    Animated.parallel(animations).start(() => {
      if (onTransitionEnd) onTransitionEnd();
    });
  };
  
  const resetAnimationValues = () => {
    translateX.setValue(0);
    translateY.setValue(0);
    opacity.setValue(1);
    scale.setValue(1);
    rotate.setValue(0);
    blurRadius.setValue(0);
    overlayOpacity.setValue(0);
  };
  
  const setInitialValues = () => {
    switch (transitionType) {
      case TRANSITION_CONFIG.TYPES.SLIDE_UP:
        translateY.setValue(SCREEN_HEIGHT);
        break;
      case TRANSITION_CONFIG.TYPES.SLIDE_DOWN:
        translateY.setValue(-SCREEN_HEIGHT);
        break;
      case TRANSITION_CONFIG.TYPES.SLIDE_LEFT:
        translateX.setValue(SCREEN_WIDTH);
        break;
      case TRANSITION_CONFIG.TYPES.SLIDE_RIGHT:
        translateX.setValue(-SCREEN_WIDTH);
        break;
      case TRANSITION_CONFIG.TYPES.FADE:
        opacity.setValue(0);
        break;
      case TRANSITION_CONFIG.TYPES.SCALE:
        scale.setValue(0.8);
        opacity.setValue(0);
        break;
      case TRANSITION_CONFIG.TYPES.ROTATE:
        rotate.setValue(1);
        opacity.setValue(0);
        break;
      case TRANSITION_CONFIG.TYPES.MAGICAL:
        scale.setValue(0.5);
        opacity.setValue(0);
        rotate.setValue(0.5);
        blurRadius.setValue(TRANSITION_CONFIG.BLUR_INTENSITY);
        break;
    }
  };
  
  const createTransitionAnimations = (animatingIn) => {
    const targetValues = animatingIn ? getTargetValues() : getExitValues();
    const easing = getEasingForType();
    
    const animations = [];
    
    // Position animations
    if (targetValues.translateX !== undefined) {
      animations.push(
        Animated.timing(translateX, {
          toValue: targetValues.translateX,
          duration,
          easing,
          useNativeDriver: true,
        })
      );
    }
    
    if (targetValues.translateY !== undefined) {
      animations.push(
        Animated.timing(translateY, {
          toValue: targetValues.translateY,
          duration,
          easing,
          useNativeDriver: true,
        })
      );
    }
    
    // Opacity animation
    if (targetValues.opacity !== undefined) {
      animations.push(
        Animated.timing(opacity, {
          toValue: targetValues.opacity,
          duration,
          easing,
          useNativeDriver: true,
        })
      );
    }
    
    // Scale animation
    if (targetValues.scale !== undefined) {
      animations.push(
        Animated.spring(scale, {
          toValue: targetValues.scale,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        })
      );
    }
    
    // Rotation animation
    if (targetValues.rotate !== undefined) {
      animations.push(
        Animated.timing(rotate, {
          toValue: targetValues.rotate,
          duration,
          easing,
          useNativeDriver: true,
        })
      );
    }
    
    // Blur animation (for magical effect)
    if (targetValues.blurRadius !== undefined) {
      animations.push(
        Animated.timing(blurRadius, {
          toValue: targetValues.blurRadius,
          duration: duration * 0.7,
          easing: TRANSITION_CONFIG.EASINGS.QUICK,
          useNativeDriver: false,
        })
      );
    }
    
    // Overlay animation
    if (targetValues.overlayOpacity !== undefined) {
      animations.push(
        Animated.timing(overlayOpacity, {
          toValue: targetValues.overlayOpacity,
          duration: duration * 0.5,
          easing: TRANSITION_CONFIG.EASINGS.QUICK,
          useNativeDriver: true,
        })
      );
    }
    
    return animations;
  };
  
  const getTargetValues = () => {
    return {
      translateX: 0,
      translateY: 0,
      opacity: 1,
      scale: 1,
      rotate: 0,
      blurRadius: 0,
      overlayOpacity: 0,
    };
  };
  
  const getExitValues = () => {
    switch (transitionType) {
      case TRANSITION_CONFIG.TYPES.SLIDE_UP:
        return { translateY: -SCREEN_HEIGHT, opacity: 1 };
      case TRANSITION_CONFIG.TYPES.SLIDE_DOWN:
        return { translateY: SCREEN_HEIGHT, opacity: 1 };
      case TRANSITION_CONFIG.TYPES.SLIDE_LEFT:
        return { translateX: -SCREEN_WIDTH, opacity: 1 };
      case TRANSITION_CONFIG.TYPES.SLIDE_RIGHT:
        return { translateX: SCREEN_WIDTH, opacity: 1 };
      case TRANSITION_CONFIG.TYPES.FADE:
        return { opacity: 0 };
      case TRANSITION_CONFIG.TYPES.SCALE:
        return { scale: 0.8, opacity: 0 };
      case TRANSITION_CONFIG.TYPES.ROTATE:
        return { rotate: 1, opacity: 0 };
      case TRANSITION_CONFIG.TYPES.MAGICAL:
        return { 
          scale: 2, 
          opacity: 0, 
          rotate: 1, 
          blurRadius: TRANSITION_CONFIG.BLUR_INTENSITY 
        };
      default:
        return { opacity: 0 };
    }
  };
  
  const getEasingForType = () => {
    switch (transitionType) {
      case TRANSITION_CONFIG.TYPES.MAGICAL:
        return TRANSITION_CONFIG.EASINGS.ELASTIC;
      case TRANSITION_CONFIG.TYPES.SCALE:
        return TRANSITION_CONFIG.EASINGS.BOUNCE;
      case TRANSITION_CONFIG.TYPES.ROTATE:
        return TRANSITION_CONFIG.EASINGS.SMOOTH;
      default:
        return TRANSITION_CONFIG.EASINGS.QUICK;
    }
  };
  
  // Get rotation transform
  const getRotationTransform = () => {
    return rotate.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', `${TRANSITION_CONFIG.ROTATION_DEGREES}deg`],
    });
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
            { rotate: getRotationTransform() },
          ],
        },
        style,
      ]}
    >
      {/* Magical overlay for special effects */}
      {transitionType === TRANSITION_CONFIG.TYPES.MAGICAL && (
        <Animated.View
          style={[
            styles.magicalOverlay,
            { opacity: overlayOpacity }
          ]}
        >
          <LinearGradient
            colors={['rgba(254, 44, 85, 0.3)', 'rgba(37, 244, 238, 0.3)', 'transparent']}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      )}
      
      {children}
    </Animated.View>
  );
};

// Video swipe transition component
export const VideoSwipeTransition = ({
  direction = 'up',
  progress = 0,
  nextVideoComponent,
  currentVideoComponent,
  onTransitionComplete,
  style,
}) => {
  const translateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Animate based on progress
    Animated.parallel([
      Animated.timing(translateAnim, {
        toValue: progress,
        duration: 0, // Immediate update
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1 - (progress * 0.1), // Slight scale effect
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1 - (progress * 0.3), // Fade effect
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start();
  }, [progress]);
  
  // Calculate transforms based on direction
  const getCurrentVideoTransform = () => {
    const translateDistance = direction === 'up' || direction === 'down' 
      ? SCREEN_HEIGHT * progress * (direction === 'up' ? -1 : 1)
      : SCREEN_WIDTH * progress * (direction === 'left' ? -1 : 1);
    
    if (direction === 'up' || direction === 'down') {
      return [{ translateY: translateDistance }, { scale: scaleAnim }];
    } else {
      return [{ translateX: translateDistance }, { scale: scaleAnim }];
    }
  };
  
  const getNextVideoTransform = () => {
    const translateDistance = direction === 'up' || direction === 'down' 
      ? SCREEN_HEIGHT * (1 - progress) * (direction === 'up' ? 1 : -1)
      : SCREEN_WIDTH * (1 - progress) * (direction === 'left' ? 1 : -1);
    
    if (direction === 'up' || direction === 'down') {
      return [{ translateY: translateDistance }];
    } else {
      return [{ translateX: translateDistance }];
    }
  };
  
  return (
    <View style={[styles.swipeContainer, style]}>
      {/* Current video */}
      <Animated.View
        style={[
          styles.videoLayer,
          {
            opacity: opacityAnim,
            transform: getCurrentVideoTransform(),
          },
        ]}
      >
        {currentVideoComponent}
      </Animated.View>
      
      {/* Next video */}
      <Animated.View
        style={[
          styles.videoLayer,
          {
            opacity: progress,
            transform: getNextVideoTransform(),
          },
        ]}
      >
        {nextVideoComponent}
      </Animated.View>
      
      {/* Transition overlay */}
      <Animated.View
        style={[
          styles.transitionOverlay,
          {
            opacity: progress * 0.5,
          },
        ]}
      />
    </View>
  );
};

// Particle transition effect
export const ParticleTransition = ({
  isActive = false,
  particleCount = 20,
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
    const newParticles = Array.from({ length: particleCount }, (_, index) => ({
      id: index,
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT,
      size: 4 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      velocity: {
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200,
      },
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
    }));
    
    setParticles(newParticles);
    
    // Animate particles
    newParticles.forEach((particle, index) => {
      const delay = index * 50;
      
      // Entrance animation
      Animated.parallel([
        Animated.timing(particle.opacity, {
          toValue: 1,
          duration: 300,
          delay,
          useNativeDriver: true,
        }),
        Animated.spring(particle.scale, {
          toValue: 1,
          delay,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
      
      // Movement animation
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(particle.translateX, {
            toValue: particle.velocity.x,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(particle.translateY, {
            toValue: particle.velocity.y,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 1000,
            delay: 1000,
            useNativeDriver: true,
          }),
        ]).start();
      }, delay + 300);
    });
    
    // Complete after all animations
    setTimeout(() => {
      setParticles([]);
      if (onComplete) onComplete();
    }, 3500);
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

// Magical reveal transition
export const MagicalReveal = ({
  isRevealing = false,
  revealType = 'circle',
  duration = 800,
  children,
  onRevealComplete,
}) => {
  const revealAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  useEffect(() => {
    if (isRevealing) {
      startReveal();
    } else {
      hideReveal();
    }
  }, [isRevealing]);
  
  const startReveal = () => {
    Animated.parallel([
      Animated.timing(revealAnim, {
        toValue: 1,
        duration,
        easing: TRANSITION_CONFIG.EASINGS.ELASTIC,
        useNativeDriver: false,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: duration * 1.2,
        easing: TRANSITION_CONFIG.EASINGS.SMOOTH,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }),
    ]).start(() => {
      if (onRevealComplete) onRevealComplete();
    });
  };
  
  const hideReveal = () => {
    Animated.parallel([
      Animated.timing(revealAnim, {
        toValue: 0,
        duration: duration * 0.6,
        useNativeDriver: false,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: duration * 0.6,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const getMaskStyle = () => {
    const maxRadius = Math.sqrt(SCREEN_WIDTH ** 2 + SCREEN_HEIGHT ** 2);
    
    switch (revealType) {
      case 'circle':
        return {
          width: revealAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, maxRadius * 2],
          }),
          height: revealAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, maxRadius * 2],
          }),
          borderRadius: maxRadius,
        };
      case 'square':
        return {
          width: revealAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, SCREEN_WIDTH],
          }),
          height: revealAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, SCREEN_HEIGHT],
          }),
        };
      default:
        return {};
    }
  };
  
  return (
    <View style={styles.revealContainer}>
      <Animated.View
        style={[
          styles.revealMask,
          getMaskStyle(),
          {
            transform: [
              { scale: scaleAnim },
              { 
                rotate: rotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                })
              },
            ],
          },
        ]}
      >
        <View style={styles.revealContent}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Transition container styles
  transitionContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  magicalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  
  // Swipe transition styles
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
  transitionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 1,
  },
  
  // Particle styles
  particleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  particle: {
    position: 'absolute',
    shadowColor: '#FE2C55',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // Reveal styles
  revealContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  revealMask: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  revealContent: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});

export default {
  MagicalPageTransition,
  VideoSwipeTransition,
  ParticleTransition,
  MagicalReveal,
  TRANSITION_CONFIG,
};