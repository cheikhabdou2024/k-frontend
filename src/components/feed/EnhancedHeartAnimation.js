// src/components/feed/EnhancedHeartAnimation.js - IMPROVED VERSION
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Enhanced heart animation component for double-tap like feature
 * Features: Multiple hearts, random positioning, particle effects, improved timing
 */
const EnhancedHeartAnimation = ({ 
  isVisible, 
  onAnimationEnd, 
  size = 'large', 
  tapPosition = null, // { x, y } coordinates where user tapped
  intensity = 'normal' // 'light', 'normal', 'heavy'
}) => {
  // Animation values for multiple hearts
  const [hearts, setHearts] = useState([]);
  const [particles, setParticles] = useState([]);
  
  // Determine heart size and count based on props
  const getHeartConfig = () => {
    const sizeMap = {
      small: { heartSize: 50, heartCount: 2 },
      medium: { heartSize: 80, heartCount: 3 },
      large: { heartSize: 100, heartCount: 4 }
    };
    
    const intensityMap = {
      light: { multiplier: 0.7, particles: 8 },
      normal: { multiplier: 1, particles: 12 },
      heavy: { multiplier: 1.3, particles: 16 }
    };
    
    const baseConfig = sizeMap[size] || sizeMap.large;
    const intensityConfig = intensityMap[intensity] || intensityMap.normal;
    
    return {
      heartSize: baseConfig.heartSize * intensityConfig.multiplier,
      heartCount: Math.round(baseConfig.heartCount * intensityConfig.multiplier),
      particleCount: intensityConfig.particles
    };
  };

  // Create heart animations when visible
  useEffect(() => {
    if (isVisible) {
      createHeartAnimations();
    }
  }, [isVisible]);

  const createHeartAnimations = () => {
    const config = getHeartConfig();
    const centerX = tapPosition?.x || SCREEN_WIDTH / 2;
    const centerY = tapPosition?.y || SCREEN_HEIGHT / 2;
    
    // Create multiple hearts with different timings and positions
    const newHearts = Array.from({ length: config.heartCount }, (_, index) => {
      const randomOffset = 60; // Random spread around tap position
      const angle = (Math.PI * 2 * index) / config.heartCount;
      const spread = 30 + Math.random() * 40;
      
      return {
        id: `heart_${Date.now()}_${index}`,
        scaleAnim: new Animated.Value(0),
        opacityAnim: new Animated.Value(0),
        translateXAnim: new Animated.Value(0),
        translateYAnim: new Animated.Value(0),
        rotateAnim: new Animated.Value(0),
        initialX: centerX + Math.cos(angle) * spread,
        initialY: centerY + Math.sin(angle) * spread,
        size: config.heartSize * (0.8 + Math.random() * 0.4), // Varied sizes
        delay: index * 100, // Staggered timing
        color: getRandomHeartColor()
      };
    });

    // Create particle effects
    const newParticles = Array.from({ length: config.particleCount }, (_, index) => {
      const angle = (Math.PI * 2 * index) / config.particleCount;
      const distance = 50 + Math.random() * 100;
      
      return {
        id: `particle_${Date.now()}_${index}`,
        scaleAnim: new Animated.Value(0),
        opacityAnim: new Animated.Value(0),
        translateXAnim: new Animated.Value(0),
        translateYAnim: new Animated.Value(0),
        initialX: centerX + Math.cos(angle) * distance,
        initialY: centerY + Math.sin(angle) * distance,
        size: 8 + Math.random() * 12,
        delay: 50 + index * 20
      };
    });

    setHearts(newHearts);
    setParticles(newParticles);

    // Start heart animations
    newHearts.forEach((heart, index) => {
      Animated.sequence([
        Animated.delay(heart.delay),
        Animated.parallel([
          // Scale animation with bounce effect
          Animated.sequence([
            Animated.timing(heart.scaleAnim, {
              toValue: 1.2,
              duration: 200,
              easing: Easing.out(Easing.back(2)),
              useNativeDriver: true,
            }),
            Animated.timing(heart.scaleAnim, {
              toValue: 0.9,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(heart.scaleAnim, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.delay(300),
            Animated.timing(heart.scaleAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),
          
          // Opacity animation
          Animated.sequence([
            Animated.timing(heart.opacityAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.delay(500),
            Animated.timing(heart.opacityAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
          
          // Float up animation
          Animated.timing(heart.translateYAnim, {
            toValue: -100 - Math.random() * 50,
            duration: 1000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          
          // Slight horizontal drift
          Animated.timing(heart.translateXAnim, {
            toValue: (Math.random() - 0.5) * 60,
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          
          // Rotation animation
          Animated.timing(heart.rotateAnim, {
            toValue: (Math.random() - 0.5) * 2,
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ]).start();
    });

    // Start particle animations
    newParticles.forEach((particle) => {
      Animated.sequence([
        Animated.delay(particle.delay),
        Animated.parallel([
          Animated.sequence([
            Animated.timing(particle.scaleAnim, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.delay(200),
            Animated.timing(particle.scaleAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),
          
          Animated.sequence([
            Animated.timing(particle.opacityAnim, {
              toValue: 0.8,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.delay(100),
            Animated.timing(particle.opacityAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
          
          Animated.timing(particle.translateXAnim, {
            toValue: (Math.random() - 0.5) * 150,
            duration: 500,
            useNativeDriver: true,
          }),
          
          Animated.timing(particle.translateYAnim, {
            toValue: -50 - Math.random() * 100,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ]).start();
    });

    // Clean up after animation
    setTimeout(() => {
      setHearts([]);
      setParticles([]);
      if (onAnimationEnd) {
        onAnimationEnd();
      }
    }, 1200);
  };

  // Get random heart color
  const getRandomHeartColor = () => {
    const colors = ['#FE2C55', '#FF6B9D', '#FF8CC8', '#FFB3E6'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Get rotation transform
  const getRotateTransform = (rotateAnim) => {
    return rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });
  };

  if (!isVisible && hearts.length === 0) return null;
  
  return (
    <View style={styles.container} pointerEvents="none">
      {/* Render hearts */}
      {hearts.map((heart) => (
        <Animated.View
          key={heart.id}
          style={[
            styles.heartContainer,
            {
              left: heart.initialX - heart.size / 2,
              top: heart.initialY - heart.size / 2,
              width: heart.size,
              height: heart.size,
              transform: [
                { scale: heart.scaleAnim },
                { translateX: heart.translateXAnim },
                { translateY: heart.translateYAnim },
                { rotate: getRotateTransform(heart.rotateAnim) },
              ],
              opacity: heart.opacityAnim,
            }
          ]}
        >
          <Ionicons
            name="heart"
            size={heart.size}
            color={heart.color}
            style={styles.heartIcon}
          />
        </Animated.View>
      ))}
      
      {/* Render particles */}
      {particles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              left: particle.initialX - particle.size / 2,
              top: particle.initialY - particle.size / 2,
              width: particle.size,
              height: particle.size,
              borderRadius: particle.size / 2,
              transform: [
                { scale: particle.scaleAnim },
                { translateX: particle.translateXAnim },
                { translateY: particle.translateYAnim },
              ],
              opacity: particle.opacityAnim,
            }
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  heartContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#FE2C55',
  },
});

export default EnhancedHeartAnimation;