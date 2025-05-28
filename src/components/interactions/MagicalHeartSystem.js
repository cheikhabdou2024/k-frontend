// src/components/interactions/MagicalHeartSystem.js
import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Configuration for magical hearts
const HEART_CONFIG = {
  // Heart generation
  MAX_HEARTS_PER_TAP: 8,
  PARTICLE_COUNT: 12,
  BURST_RADIUS: 60,
  
  // Animation timings
  HEART_DURATION: 2000,
  PARTICLE_DURATION: 1500,
  STAGGER_DELAY: 50,
  
  // Physics
  GRAVITY: 0.5,
  BOUNCE_DAMPING: 0.7,
  AIR_RESISTANCE: 0.98,
  
  // Visual effects
  HEART_SIZES: [20, 24, 28, 32, 36],
  COLORS: ['#FE2C55', '#FF6B9D', '#FF8CC8', '#FFB3E6', '#FFC0E5'],
  GLOW_INTENSITY: 0.8,
};

const MagicalHeartSystem = ({ 
  isVisible, 
  onAnimationEnd, 
  tapPosition = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 },
  intensity = 'normal', // 'light', 'normal', 'heavy', 'extreme'
  style 
}) => {
  const [hearts, setHearts] = useState([]);
  const [particles, setParticles] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Enhanced heart generation based on intensity
  const getHeartCount = () => {
    switch (intensity) {
      case 'light': return 3;
      case 'normal': return 5;
      case 'heavy': return 7;
      case 'extreme': return HEART_CONFIG.MAX_HEARTS_PER_TAP;
      default: return 5;
    }
  };

  const getParticleCount = () => {
    switch (intensity) {
      case 'light': return 6;
      case 'normal': return 8;
      case 'heavy': return 10;
      case 'extreme': return HEART_CONFIG.PARTICLE_COUNT;
      default: return 8;
    }
  };

  // Create magical heart explosion
  useEffect(() => {
    if (isVisible && !isAnimating) {
      createMagicalExplosion();
    }
  }, [isVisible]);

  const createMagicalExplosion = () => {
    setIsAnimating(true);
    
    // Enhanced haptic feedback based on intensity
    const hapticIntensity = {
      light: Haptics.ImpactFeedbackStyle.Light,
      normal: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
      extreme: Haptics.ImpactFeedbackStyle.Heavy
    }[intensity] || Haptics.ImpactFeedbackStyle.Medium;
    
    Haptics.impactAsync(hapticIntensity);
    
    // Create hearts with physics
    const newHearts = createPhysicsHearts();
    const newParticles = createMagicalParticles();
    
    setHearts(newHearts);
    setParticles(newParticles);
    
    // Start animations
    animateHearts(newHearts);
    animateParticles(newParticles);
    
    // Cleanup after animation
    setTimeout(() => {
      setIsAnimating(false);
      setHearts([]);
      setParticles([]);
      if (onAnimationEnd) onAnimationEnd();
    }, HEART_CONFIG.HEART_DURATION);
  };

  // Create hearts with realistic physics
  const createPhysicsHearts = () => {
    const heartCount = getHeartCount();
    const hearts = [];
    
    for (let i = 0; i < heartCount; i++) {
      const angle = (Math.PI * 2 * i) / heartCount + (Math.random() - 0.5) * 0.5;
      const speed = 3 + Math.random() * 4;
      const size = HEART_CONFIG.HEART_SIZES[Math.floor(Math.random() * HEART_CONFIG.HEART_SIZES.length)];
      
      hearts.push({
        id: `heart_${Date.now()}_${i}`,
        x: tapPosition.x,
        y: tapPosition.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // Initial upward boost
        size,
        color: HEART_CONFIG.COLORS[Math.floor(Math.random() * HEART_CONFIG.COLORS.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        scale: 0,
        glowIntensity: Math.random() * HEART_CONFIG.GLOW_INTENSITY,
        // Animation refs
        scaleAnim: new Animated.Value(0),
        opacityAnim: new Animated.Value(1),
        positionAnimX: new Animated.Value(tapPosition.x),
        positionAnimY: new Animated.Value(tapPosition.y),
        rotationAnim: new Animated.Value(0),
        glowAnim: new Animated.Value(0),
      });
    }
    
    return hearts;
  };

  // Create magical particle effects
  const createMagicalParticles = () => {
    const particleCount = getParticleCount();
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const distance = HEART_CONFIG.BURST_RADIUS + Math.random() * 30;
      
      particles.push({
        id: `particle_${Date.now()}_${i}`,
        x: tapPosition.x + Math.cos(angle) * distance,
        y: tapPosition.y + Math.sin(angle) * distance,
        size: 4 + Math.random() * 8,
        color: HEART_CONFIG.COLORS[Math.floor(Math.random() * HEART_CONFIG.COLORS.length)],
        // Animation refs
        scaleAnim: new Animated.Value(0),
        opacityAnim: new Animated.Value(1),
        positionAnimX: new Animated.Value(tapPosition.x),
        positionAnimY: new Animated.Value(tapPosition.y),
      });
    }
    
    return particles;
  };

  // Animate hearts with realistic physics
  const animateHearts = (heartsArray) => {
    heartsArray.forEach((heart, index) => {
      const delay = index * HEART_CONFIG.STAGGER_DELAY;
      
      // Scale animation - pop in effect
      Animated.sequence([
        Animated.delay(delay),
        Animated.spring(heart.scaleAnim, {
          toValue: 1,
          tension: 150,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.delay(HEART_CONFIG.HEART_DURATION - 500),
        Animated.timing(heart.scaleAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Opacity animation
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(heart.opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(HEART_CONFIG.HEART_DURATION - 700),
        Animated.timing(heart.opacityAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Physics-based movement
      const animatePhysics = () => {
        const startTime = Date.now();
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = elapsed / HEART_CONFIG.HEART_DURATION;
          
          if (progress >= 1) return;
          
          // Apply gravity and air resistance
          heart.vy += HEART_CONFIG.GRAVITY;
          heart.vx *= HEART_CONFIG.AIR_RESISTANCE;
          heart.vy *= HEART_CONFIG.AIR_RESISTANCE;
          
          // Update position
          heart.x += heart.vx;
          heart.y += heart.vy;
          
          // Bounce off screen edges
          if (heart.x <= 0 || heart.x >= SCREEN_WIDTH) {
            heart.vx *= -HEART_CONFIG.BOUNCE_DAMPING;
            heart.x = Math.max(0, Math.min(SCREEN_WIDTH, heart.x));
          }
          
          if (heart.y >= SCREEN_HEIGHT - 100) {
            heart.vy *= -HEART_CONFIG.BOUNCE_DAMPING;
            heart.y = SCREEN_HEIGHT - 100;
          }
          
          // Update rotation
          heart.rotation += heart.rotationSpeed;
          
          // Apply animations
          heart.positionAnimX.setValue(heart.x);
          heart.positionAnimY.setValue(heart.y);
          heart.rotationAnim.setValue(heart.rotation);
          
          // Continue animation
          requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
      };
      
      setTimeout(animatePhysics, delay);
      
      // Glow pulse effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(heart.glowAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(heart.glowAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  };

  // Animate particles
  const animateParticles = (particlesArray) => {
    particlesArray.forEach((particle, index) => {
      const delay = index * 30;
      
      // Scale animation
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(particle.scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.delay(300),
        Animated.timing(particle.scaleAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Opacity animation
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(particle.opacityAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.delay(200),
        Animated.timing(particle.opacityAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Position animation - spread out
      const finalX = particle.x + (Math.random() - 0.5) * 100;
      const finalY = particle.y - 50 - Math.random() * 100;
      
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(particle.positionAnimX, {
          toValue: finalX,
          duration: HEART_CONFIG.PARTICLE_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
      
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(particle.positionAnimY, {
          toValue: finalY,
          duration: HEART_CONFIG.PARTICLE_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Render individual heart with glow effect
  const renderHeart = (heart) => (
    <Animated.View
      key={heart.id}
      style={[
        styles.heartContainer,
        {
          position: 'absolute',
          left: 0,
          top: 0,
          transform: [
            { translateX: heart.positionAnimX },
            { translateY: heart.positionAnimY },
            { scale: heart.scaleAnim },
            { 
              rotate: heart.rotationAnim.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
                extrapolate: 'clamp'
              })
            }
          ],
          opacity: heart.opacityAnim,
        }
      ]}
    >
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.heartGlow,
          {
            width: heart.size * 2,
            height: heart.size * 2,
            borderRadius: heart.size,
            backgroundColor: heart.color,
            opacity: heart.glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.2, 0.6],
              extrapolate: 'clamp'
            }),
          }
        ]}
      />
      
      {/* Main heart */}
      <Ionicons
        name="heart"
        size={heart.size}
        color={heart.color}
        style={styles.heartIcon}
      />
    </Animated.View>
  );

  // Render individual particle
  const renderParticle = (particle) => (
    <Animated.View
      key={particle.id}
      style={[
        styles.particle,
        {
          position: 'absolute',
          left: 0,
          top: 0,
          width: particle.size,
          height: particle.size,
          borderRadius: particle.size / 2,
          backgroundColor: particle.color,
          transform: [
            { translateX: particle.positionAnimX },
            { translateY: particle.positionAnimY },
            { scale: particle.scaleAnim }
          ],
          opacity: particle.opacityAnim,
        }
      ]}
    />
  );

  if (!isVisible && hearts.length === 0) return null;

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {/* Render hearts */}
      {hearts.map(renderHeart)}
      
      {/* Render particles */}
      {particles.map(renderParticle)}
      
      {/* Screen flash effect for extreme intensity */}
      {intensity === 'extreme' && (
        <Animated.View 
          style={[
            styles.screenFlash,
            { 
              opacity: hearts.length > 0 ? 0.1 : 0 
            }
          ]} 
        />
      )}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartGlow: {
    position: 'absolute',
    shadowColor: '#FE2C55',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  heartIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  particle: {
    shadowColor: '#FE2C55',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 5,
  },
  screenFlash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FE2C55',
    zIndex: -1,
  },
});

export default MagicalHeartSystem;