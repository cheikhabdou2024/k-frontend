// src/components/interactions/MicroInteractions.js
import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Configuration for micro-interactions
const MICRO_CONFIG = {
  // Button press animations
  PRESS_SCALE: 0.95,
  PRESS_DURATION: 100,
  RELEASE_DURATION: 150,
  
  // Success animations
  SUCCESS_SCALE: 1.2,
  SUCCESS_DURATION: 300,
  
  // Ripple effects
  RIPPLE_MAX_SCALE: 2.5,
  RIPPLE_DURATION: 600,
  
  // Loading animations
  LOADING_ROTATION_DURATION: 1000,
  LOADING_PULSE_DURATION: 800,
  
  // Bounce effects
  BOUNCE_HEIGHT: 20,
  BOUNCE_DURATION: 400,
  
  // Shake effects
  SHAKE_DISTANCE: 10,
  SHAKE_DURATION: 500,
  
  // Colors
  SUCCESS_COLOR: '#4CAF50',
  ERROR_COLOR: '#F44336',
  PRIMARY_COLOR: '#FE2C55',
  SECONDARY_COLOR: '#25F4EE',
};

// Enhanced Button with micro-interactions
export const MagicalButton = ({
  children,
  onPress,
  style,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  success = false,
  error = false,
  hapticFeedback = true,
  rippleEffect = true,
  glowEffect = false,
  ...props
}) => {
  // Animation refs
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  
  // State
  const [isPressed, setIsPressed] = useState(false);
  
  // Success animation
  useEffect(() => {
    if (success) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: MICRO_CONFIG.SUCCESS_SCALE,
          duration: MICRO_CONFIG.SUCCESS_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: MICRO_CONFIG.SUCCESS_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
      
      if (hapticFeedback) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, [success]);
  
  // Error animation (shake)
  useEffect(() => {
    if (error) {
      const shakeAnimation = Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: MICRO_CONFIG.SHAKE_DISTANCE,
          duration: MICRO_CONFIG.SHAKE_DURATION / 8,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: -MICRO_CONFIG.SHAKE_DISTANCE,
          duration: MICRO_CONFIG.SHAKE_DURATION / 4,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: MICRO_CONFIG.SHAKE_DISTANCE / 2,
          duration: MICRO_CONFIG.SHAKE_DURATION / 4,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: -MICRO_CONFIG.SHAKE_DISTANCE / 2,
          duration: MICRO_CONFIG.SHAKE_DURATION / 4,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: MICRO_CONFIG.SHAKE_DURATION / 8,
          useNativeDriver: true,
        }),
      ]);
      
      shakeAnimation.start();
      
      if (hapticFeedback) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  }, [error]);
  
  // Loading animation
  useEffect(() => {
    if (loading) {
      const loadingRotation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: MICRO_CONFIG.LOADING_ROTATION_DURATION,
          useNativeDriver: true,
        })
      );
      loadingRotation.start();
      
      return () => loadingRotation.stop();
    } else {
      rotateAnim.setValue(0);
    }
  }, [loading]);
  
  // Glow effect
  useEffect(() => {
    if (glowEffect && !disabled) {
      const glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      glowLoop.start();
      
      return () => glowLoop.stop();
    }
  }, [glowEffect, disabled]);
  
  const handlePressIn = () => {
    if (disabled || loading) return;
    
    setIsPressed(true);
    
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: MICRO_CONFIG.PRESS_SCALE,
        duration: MICRO_CONFIG.PRESS_DURATION,
        useNativeDriver: true,
      }),
      rippleEffect && Animated.timing(rippleAnim, {
        toValue: 1,
        duration: MICRO_CONFIG.RIPPLE_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
    
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };
  
  const handlePressOut = () => {
    if (disabled || loading) return;
    
    setIsPressed(false);
    
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      rippleEffect && Animated.timing(rippleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    if (onPress) {
      onPress();
    }
  };
  
  // Get button colors based on variant and state
  const getButtonColors = () => {
    if (disabled) return ['#666', '#444'];
    if (error) return [MICRO_CONFIG.ERROR_COLOR, '#D32F2F'];
    if (success) return [MICRO_CONFIG.SUCCESS_COLOR, '#388E3C'];
    
    switch (variant) {
      case 'primary':
        return [MICRO_CONFIG.PRIMARY_COLOR, '#E91E63'];
      case 'secondary':
        return [MICRO_CONFIG.SECONDARY_COLOR, '#00BCD4'];
      default:
        return ['#333', '#555'];
    }
  };
  
  // Get button size
  const getButtonSize = () => {
    const sizeMap = {
      small: { paddingHorizontal: 12, paddingVertical: 8, fontSize: 12 },
      medium: { paddingHorizontal: 16, paddingVertical: 12, fontSize: 14 },
      large: { paddingHorizontal: 20, paddingVertical: 16, fontSize: 16 },
    };
    
    return sizeMap[size] || sizeMap.medium;
  };
  
  const buttonColors = getButtonColors();
  const buttonSize = getButtonSize();
  
  return (
    <Animated.View
      style={[
        styles.buttonContainer,
        {
          transform: [
            { scale: scaleAnim },
            { translateX: bounceAnim }
          ]
        },
        style
      ]}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
      {...props}
    >
      {/* Glow effect */}
      {glowEffect && (
        <Animated.View
          style={[
            styles.glowEffect,
            {
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.8],
              })
            }
          ]}
        >
          <LinearGradient
            colors={[...buttonColors, 'transparent']}
            style={styles.glowGradient}
          />
        </Animated.View>
      )}
      
      {/* Ripple effect */}
      {rippleEffect && (
        <Animated.View
          style={[
            styles.rippleEffect,
            {
              opacity: rippleAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0.6, 0],
              }),
              transform: [{
                scale: rippleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, MICRO_CONFIG.RIPPLE_MAX_SCALE],
                })
              }]
            }
          ]}
        />
      )}
      
      {/* Button content */}
      <LinearGradient
        colors={buttonColors}
        style={[styles.buttonGradient, buttonSize]}
      >
        {loading ? (
          <Animated.View
            style={{
              transform: [{
                rotate: rotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                })
              }]
            }}
          >
            <Ionicons name="refresh" size={buttonSize.fontSize + 4} color="#FFF" />
          </Animated.View>
        ) : success ? (
          <Ionicons name="checkmark" size={buttonSize.fontSize + 4} color="#FFF" />
        ) : error ? (
          <Ionicons name="close" size={buttonSize.fontSize + 4} color="#FFF" />
        ) : (
          children
        )}
      </LinearGradient>
    </Animated.View>
  );
};

// Magical floating action button
export const MagicalFAB = ({
  icon = 'add',
  onPress,
  style,
  color = MICRO_CONFIG.PRIMARY_COLOR,
  size = 56,
  bounce = true,
  glow = true,
  hapticFeedback = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Auto bounce effect
  useEffect(() => {
    if (bounce) {
      const bounceLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      bounceLoop.start();
      
      return () => bounceLoop.stop();
    }
  }, [bounce]);
  
  // Glow effect
  useEffect(() => {
    if (glow) {
      const glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      glowLoop.start();
      
      return () => glowLoop.stop();
    }
  }, [glow]);
  
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 6,
      }),
    ]).start();
    
    // Rotation effect
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      rotateAnim.setValue(0);
    });
    
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    
    if (onPress) onPress();
  };
  
  return (
    <Animated.View
      style={[
        styles.fabContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [
            { scale: scaleAnim },
            { translateY: bounceAnim },
            { 
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '180deg'],
              })
            }
          ]
        },
        style
      ]}
      onTouchEnd={handlePress}
    >
      {/* Glow effect */}
      {glow && (
        <Animated.View
          style={[
            styles.fabGlow,
            {
              width: size + 20,
              height: size + 20,
              borderRadius: (size + 20) / 2,
              opacity: glowAnim
            }
          ]}
        />
      )}
      
      {/* FAB content */}
      <LinearGradient
        colors={[color, color + 'CC']}
        style={[styles.fabGradient, { borderRadius: size / 2 }]}
      >
        <Ionicons name={icon} size={size * 0.4} color="#FFF" />
      </LinearGradient>
    </Animated.View>
  );
};

// Magical progress indicator
export const MagicalProgress = ({
  progress = 0,
  size = 100,
  strokeWidth = 8,
  color = MICRO_CONFIG.PRIMARY_COLOR,
  backgroundColor = '#333',
  showPercentage = true,
  animated = true,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (animated) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 1000,
        useNativeDriver: false,
      }).start();
      
      // Pulse effect when progress changes
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      progressAnim.setValue(progress);
    }
  }, [progress, animated]);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  return (
    <View style={[styles.progressContainer, { width: size, height: size }]}>
      {/* Background circle */}
      <View
        style={[
          styles.progressBackground,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: backgroundColor,
          }
        ]}
      />
      
      {/* Progress circle */}
      <Animated.View
        style={[
          styles.progressForeground,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: color,
            transform: [
              { scale: pulseAnim },
              { rotate: '-90deg' }
            ]
          }
        ]}
      />
      
      {/* Percentage text */}
      {showPercentage && (
        <View style={styles.progressTextContainer}>
          <Text style={[styles.progressText, { fontSize: size * 0.15 }]}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
      )}
    </View>
  );
};

// Magical toast notification
export const MagicalToast = ({
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
  position = 'top',
}) => {
  const translateAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
    
    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => {
        dismissToast();
      }, duration);
    }
  }, []);
  
  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(translateAnim, {
        toValue: position === 'top' ? -100 : 100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  };
  
  const getToastColors = () => {
    switch (type) {
      case 'success':
        return ['#4CAF50', '#388E3C'];
      case 'error':
        return ['#F44336', '#D32F2F'];
      case 'warning':
        return ['#FF9800', '#F57C00'];
      default:
        return ['#2196F3', '#1976D2'];
    }
  };
  
  const getToastIcon = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      default:
        return 'information-circle';
    }
  };
  
  const colors = getToastColors();
  const icon = getToastIcon();
  
  return (
    <Animated.View
      style={[
        styles.toastContainer,
        position === 'top' ? styles.toastTop : styles.toastBottom,
        {
          opacity: opacityAnim,
          transform: [
            { translateY: translateAnim },
            { scale: scaleAnim }
          ]
        }
      ]}
    >
      <LinearGradient
        colors={colors}
        style={styles.toastGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Ionicons name={icon} size={20} color="#FFF" style={styles.toastIcon} />
        <Text style={styles.toastText}>{message}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Button styles
  buttonContainer: {
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 25,
  },
  glowGradient: {
    flex: 1,
    borderRadius: 25,
  },
  rippleEffect: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 50,
    height: 50,
    marginTop: -25,
    marginLeft: -25,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonGradient: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  
  // FAB styles
  fabContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(254, 44, 85, 0.3)',
  },
  fabGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // Progress styles
  progressContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressBackground: {
    position: 'absolute',
  },
  progressForeground: {
    position: 'absolute',
  },
  progressTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  
  // Toast styles
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastTop: {
    top: 60,
  },
  toastBottom: {
    bottom: 100,
  },
  toastGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  toastIcon: {
    marginRight: 12,
  },
  toastText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});

export default {
  MagicalButton,
  MagicalFAB,
  MagicalProgress,
  MagicalToast,
};