// src/components/interactions/MagicalHeartSystem.js - IMPROVED VERSION
import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Configuration for magical hearts
const HEART_CONFIG = {
  // Heart generation
  MAX_HEARTS_PER_TAP: 6, // Reduced for better performance
  PARTICLE_COUNT: 8, // Reduced for better performance
  BURST_RADIUS: 50,
  
  // Animation timings - Made faster for rapid fire
  HEART_DURATION: 1500, // Reduced from 2000
  PARTICLE_DURATION: 1200, // Reduced from 1500
  STAGGER_DELAY: 0, // Reduced from 50
  
  // Physics
  GRAVITY: 0.4, // Reduced for floatier effect
  BOUNCE_DAMPING: 0.8,
  AIR_RESISTANCE: 0.99,
  
  // Visual effects
  HEART_SIZES: [16, 20, 24, 28], // Slightly smaller for performance
  COLORS: ['#FE2C55', '#FF6B9D', '#FF8CC8', '#FFB3E6'],
  GLOW_INTENSITY: 0.6,
  
  // Performance optimizations
  AUTO_CLEANUP_DELAY: 1000, // Auto cleanup after 2 seconds
  MAX_CONCURRENT_ANIMATIONS: 5, // Limit concurrent animations
};

const MagicalHeartSystem = ({ 
  isVisible, 
  onAnimationEnd, 
  tapPosition = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 },
  intensity = 'normal',
  style 
}) => {
  const [hearts, setHearts] = useState([]);
  const [particles, setParticles] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  // Refs for cleanup
  const animationTimeoutRef = useRef(null);
  const cleanupTimeoutRef = useRef(null);
  const heartsRef = useRef([]); // Keep track of active hearts
  
  // Enhanced heart generation based on intensity
  const getHeartCount = () => {
    switch (intensity) {
      case 'light': return 2;
      case 'normal': return 4;
      case 'heavy': return 6;
      case 'extreme': return HEART_CONFIG.MAX_HEARTS_PER_TAP;
      default: return 4;
    }
  };

  const getParticleCount = () => {
    switch (intensity) {
      case 'light': return 4;
      case 'normal': return 6;
      case 'heavy': return 8;
      case 'extreme': return HEART_CONFIG.PARTICLE_COUNT;
      default: return 6;
    }
  };

  // Start animation IMMEDIATELY when component mounts (no useEffect delay)
  useEffect(() => {
    if (isVisible && !hasStarted) {
      setHasStarted(true);
      // Start immediately - no setTimeout, no delay
      createMagicalExplosionImmediate();
    }
  }, [isVisible, hasStarted]);

  // Auto cleanup effect
  useEffect(() => {
    if (isAnimating) {
      // Set auto cleanup
      cleanupTimeoutRef.current = setTimeout(() => {
        cleanup();
      }, HEART_CONFIG.AUTO_CLEANUP_DELAY);
    }
    
    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
    };
  }, [isAnimating]);

  // INSTANT animation creation - no delays
  const createMagicalExplosionImmediate = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Create hearts with IMMEDIATE visibility
    const newHearts = createInstantHearts();
    const newParticles = createInstantParticles();
    
    // Set hearts and particles IMMEDIATELY
    setHearts(newHearts);
    setParticles(newParticles);
    heartsRef.current = newHearts;
    
    // Start animations with NO delays
    animateHeartsInstant(newHearts);
    animateParticlesInstant(newParticles);
    
    // Set cleanup timer
    animationTimeoutRef.current = setTimeout(() => {
      cleanup();
    }, HEART_CONFIG.HEART_DURATION);
  };

  // Cleanup function
  const cleanup = () => {
    setIsAnimating(false);
    setHearts([]);
    setParticles([]);
    setHasStarted(false);
    heartsRef.current = [];
    
    // Clear timeouts
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }
    
    // Notify parent
    if (onAnimationEnd) {
      onAnimationEnd();
    }
  };

  // Create hearts that appear INSTANTLY (no scale-up animation)
  const createInstantHearts = () => {
    const heartCount = getHeartCount();
    const hearts = [];
    
    for (let i = 0; i < heartCount; i++) {
      const angle = (Math.PI * 2 * i) / heartCount + (Math.random() - 0.5) * 0.8;
      const speed = 2 + Math.random() * 3;
      const size = HEART_CONFIG.HEART_SIZES[Math.floor(Math.random() * HEART_CONFIG.HEART_SIZES.length)];
      
      hearts.push({
        id: `heart_${Date.now()}_${i}`,
        x: tapPosition.x,
        y: tapPosition.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size,
        color: HEART_CONFIG.COLORS[Math.floor(Math.random() * HEART_CONFIG.COLORS.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        opacity: 1,
        scale: 1, // Start at full scale immediately
        glowIntensity: Math.random() * HEART_CONFIG.GLOW_INTENSITY,
        // Animation refs - START AT VISIBLE VALUES
        scaleAnim: new Animated.Value(1), // Start at 1, not 0
        opacityAnim: new Animated.Value(1), // Start at 1, not 0
        positionAnimX: new Animated.Value(tapPosition.x),
        positionAnimY: new Animated.Value(tapPosition.y),
        rotationAnim: new Animated.Value(0),
        glowAnim: new Animated.Value(0.3), // Start with some glow
      });
    }
    
    return hearts;
  };

  // Create particles that appear INSTANTLY
  const createInstantParticles = () => {
    const particleCount = getParticleCount();
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const distance = HEART_CONFIG.BURST_RADIUS + Math.random() * 20;
      
      particles.push({
        id: `particle_${Date.now()}_${i}`,
        x: tapPosition.x + Math.cos(angle) * distance,
        y: tapPosition.y + Math.sin(angle) * distance,
        size: 3 + Math.random() * 5,
        color: HEART_CONFIG.COLORS[Math.floor(Math.random() * HEART_CONFIG.COLORS.length)],
        // Animation refs - START AT VISIBLE VALUES
        scaleAnim: new Animated.Value(1), // Start at 1, not 0
        opacityAnim: new Animated.Value(0.8), // Start visible
        positionAnimX: new Animated.Value(tapPosition.x),
        positionAnimY: new Animated.Value(tapPosition.y),
      });
    }
    
    return particles;
  };

  // INSTANT heart animations - hearts appear immediately, then animate
  const animateHeartsInstant = (heartsArray) => {
    heartsArray.forEach((heart, index) => {
      // NO DELAY - hearts are already visible
      
      // Just animate opacity fade out after some time
      setTimeout(() => {
        Animated.timing(heart.opacityAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, HEART_CONFIG.HEART_DURATION - 600);
      
      // Start physics immediately with no delay
      const animatePhysics = () => {
        const startTime = Date.now();
        let animationFrame;
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = elapsed / HEART_CONFIG.HEART_DURATION;
          
          if (progress >= 1 || !heartsRef.current.includes(heart)) {
            return;
          }
          
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
          try {
            heart.positionAnimX.setValue(heart.x);
            heart.positionAnimY.setValue(heart.y);
            heart.rotationAnim.setValue(heart.rotation);
          } catch (error) {
            return;
          }
          
          // Continue animation
          animationFrame = requestAnimationFrame(animate);
        };
        
        // Start immediately - no delay
        animationFrame = requestAnimationFrame(animate);
      };
      
      animatePhysics();
      
      // Glow pulse effect (start immediately)
      Animated.loop(
        Animated.sequence([
          Animated.timing(heart.glowAnim, {
            toValue: 6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(heart.glowAnim, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  };

  // INSTANT particle animations
  const animateParticlesInstant = (particlesArray) => {
    particlesArray.forEach((particle, index) => {
      // Particles are already visible, just animate them out
      
      // Immediate scale and fade animation
      Animated.timing(particle.scaleAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
      
      Animated.timing(particle.opacityAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
      
      // Position animation - spread out immediately
      const finalX = particle.x + (Math.random() - 0.5) * 80;
      const finalY = particle.y - 40 - Math.random() * 80;
      
      Animated.timing(particle.positionAnimX, {
        toValue: finalX,
        duration: 800,
        useNativeDriver: true,
      }).start();
      
      Animated.timing(particle.positionAnimY, {
        toValue: finalY,
        duration: 800,
        useNativeDriver: true,
      }).start();
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
            width: heart.size * 1.8,
            height: heart.size * 1.8,
            borderRadius: heart.size * 0.9,
            backgroundColor: heart.color,
            opacity: heart.glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.1, 0.4],
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

  // Only render if we have content to show
  if (!isVisible && hearts.length === 0) return null;

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {/* Render hearts */}
      {hearts.map(renderHeart)}
      
      {/* Render particles */}
      {particles.map(renderParticle)}
      
      {/* Screen flash effect for extreme intensity */}
      {intensity === 'extreme' && hearts.length > 0 && (
        <Animated.View 
          style={[
            styles.screenFlash,
            { 
              opacity: 0.05 
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
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  heartIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  particle: {
    shadowColor: '#FE2C55',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
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