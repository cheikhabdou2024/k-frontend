// src/components/interactions/EnhancedMagicalHeartSystem.js
import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Perfect TikTok-style configuration
const TIKTOK_HEART_CONFIG = {
  // Heart generation - exactly like TikTok
  MAIN_HEART_SIZE: 80, // Main heart size (medium, like TikTok)
  PARTICLE_HEARTS_COUNT: 6, // Small hearts around main heart
  PARTICLE_HEART_SIZE: 16, // Size of small particle hearts
  BURST_RADIUS: 60, // How far particles spread
  
  // TikTok-style timing - INSTANT appearance
  HEART_APPEAR_DURATION: 0, // Instant appearance (no scale-up)
  HEART_VISIBLE_DURATION: 800, // How long heart stays visible
  HEART_FADE_DURATION: 400, // Fade out duration
  PARTICLE_DURATION: 1200, // Particle animation duration
  
  // Physics - TikTok-like movement
  GRAVITY: 0.3,
  FLOAT_STRENGTH: -1.5, // Upward movement
  ROTATION_SPEED: 2, // Gentle rotation
  
  // Visual effects
  COLORS: ['#FE2C55', '#FF1744', '#E91E63', '#FF4081'],
  GLOW_INTENSITY: 0.8,
  SCALE_BOUNCE: 1.2, // Slight bounce effect
  
  // Performance
  AUTO_CLEANUP_DELAY: 1500,
};

const MagicalHeartSystem = ({ 
  isVisible, 
  onAnimationEnd, 
  tapPosition = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 },
  intensity = 'normal',
  style,
  // NEW: Props for heart icon animation
  heartIconPosition = null, // Position of the heart icon in action buttons
  onLikeCountChange = null, // Callback when like count should increase
  showIconAnimation = false, // Whether to animate the heart icon too
}) => {
  const [hearts, setHearts] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Refs for cleanup
  const animationTimeoutRef = useRef(null);
  const heartsRef = useRef([]);
  
  // Start animation IMMEDIATELY when visible
  useEffect(() => {
    if (isVisible && !isAnimating) {
      console.log('💖 TikTok Heart Animation Starting!');
      createTikTokHeartExplosion();
    }
  }, [isVisible]);

  // Auto cleanup
  useEffect(() => {
    if (isAnimating) {
      animationTimeoutRef.current = setTimeout(() => {
        cleanup();
      }, TIKTOK_HEART_CONFIG.AUTO_CLEANUP_DELAY);
    }
    
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [isAnimating]);

  // Create TikTok-style heart explosion
  const createTikTokHeartExplosion = async () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // REMOVED: Strong haptic feedback like TikTok
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // Trigger like count increase immediately
    if (onLikeCountChange) {
      onLikeCountChange();
    }
    
    // Create main heart + particles INSTANTLY
    const newHearts = createInstantTikTokHearts();
    setHearts(newHearts);
    heartsRef.current = newHearts;
    
    // Start animations immediately
    animateTikTokHearts(newHearts);
    
    // If we have heart icon position, create a particle that flies to it
    if (showIconAnimation && heartIconPosition) {
      createHeartIconAnimation(newHearts);
    }
  };

  // Create hearts that appear INSTANTLY (like TikTok)
  const createInstantTikTokHearts = () => {
    const heartsArray = [];
    const baseColor = TIKTOK_HEART_CONFIG.COLORS[0]; // Main TikTok red
    
    // Main center heart (the big one)
    heartsArray.push({
      id: `main_heart_${Date.now()}`,
      type: 'main',
      x: tapPosition.x,
      y: tapPosition.y,
      size: TIKTOK_HEART_CONFIG.MAIN_HEART_SIZE,
      color: baseColor,
      // Start at full visibility - NO scale animation
      scaleAnim: new Animated.Value(1),
      opacityAnim: new Animated.Value(1),
      positionAnimX: new Animated.Value(tapPosition.x),
      positionAnimY: new Animated.Value(tapPosition.y),
      rotationAnim: new Animated.Value(0),
      glowAnim: new Animated.Value(1),
    });
    
    // Particle hearts around the main heart
    for (let i = 0; i < TIKTOK_HEART_CONFIG.PARTICLE_HEARTS_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / TIKTOK_HEART_CONFIG.PARTICLE_HEARTS_COUNT;
      const distance = TIKTOK_HEART_CONFIG.BURST_RADIUS * (0.7 + Math.random() * 0.6);
      
      const particleX = tapPosition.x + Math.cos(angle) * distance;
      const particleY = tapPosition.y + Math.sin(angle) * distance;
      
      heartsArray.push({
        id: `particle_${Date.now()}_${i}`,
        type: 'particle',
        x: particleX,
        y: particleY,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2 + TIKTOK_HEART_CONFIG.FLOAT_STRENGTH,
        size: TIKTOK_HEART_CONFIG.PARTICLE_HEART_SIZE + Math.random() * 8,
        color: TIKTOK_HEART_CONFIG.COLORS[Math.floor(Math.random() * TIKTOK_HEART_CONFIG.COLORS.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * TIKTOK_HEART_CONFIG.ROTATION_SPEED,
        // Start fully visible
        scaleAnim: new Animated.Value(1),
        opacityAnim: new Animated.Value(0.9),
        positionAnimX: new Animated.Value(tapPosition.x),
        positionAnimY: new Animated.Value(tapPosition.y),
        rotationAnim: new Animated.Value(0),
        glowAnim: new Animated.Value(0.6),
      });
    }
    
    return heartsArray;
  };

  // Animate hearts with TikTok-style behavior
  const animateTikTokHearts = (heartsArray) => {
    heartsArray.forEach((heart, index) => {
      if (heart.type === 'main') {
        // Main heart animation - bounce and fade
        animateMainHeart(heart);
      } else {
        // Particle hearts - float and spread
        animateParticleHeart(heart, index);
      }
    });
  };

  // Animate the main central heart
  const animateMainHeart = (heart) => {
    // Slight bounce effect
    Animated.sequence([
      Animated.timing(heart.scaleAnim, {
        toValue: TIKTOK_HEART_CONFIG.SCALE_BOUNCE,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(heart.scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(heart.glowAnim, {
          toValue: 1.5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(heart.glowAnim, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      { iterations: 2 }
    ).start();
    
    // Fade out after visible duration
    setTimeout(() => {
      Animated.timing(heart.opacityAnim, {
        toValue: 0,
        duration: TIKTOK_HEART_CONFIG.HEART_FADE_DURATION,
        useNativeDriver: true,
      }).start();
    }, TIKTOK_HEART_CONFIG.HEART_VISIBLE_DURATION);
  };

  // Animate particle hearts
  const animateParticleHeart = (heart, index) => {
    // Staggered appearance for particles
    const delay = index * 50;
    
    setTimeout(() => {
      // Float animation with physics
      const startTime = Date.now();
      let animationFrame;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / TIKTOK_HEART_CONFIG.PARTICLE_DURATION;
        
        if (progress >= 1 || !heartsRef.current.includes(heart)) {
          return;
        }
        
        // Apply physics
        heart.vy += TIKTOK_HEART_CONFIG.GRAVITY;
        heart.x += heart.vx;
        heart.y += heart.vy;
        heart.rotation += heart.rotationSpeed;
        
        // Update animations
        try {
          heart.positionAnimX.setValue(heart.x);
          heart.positionAnimY.setValue(heart.y);
          heart.rotationAnim.setValue(heart.rotation);
        } catch (error) {
          return;
        }
        
        animationFrame = requestAnimationFrame(animate);
      };
      
      animationFrame = requestAnimationFrame(animate);
      
      // Fade out particles
      Animated.timing(heart.opacityAnim, {
        toValue: 0,
        duration: TIKTOK_HEART_CONFIG.PARTICLE_DURATION,
        useNativeDriver: true,
      }).start();
      
      // Scale down particles as they fade
      Animated.timing(heart.scaleAnim, {
        toValue: 0.3,
        duration: TIKTOK_HEART_CONFIG.PARTICLE_DURATION,
        useNativeDriver: true,
      }).start();
      
    }, delay);
  };

  // NEW: Create animation that flies to heart icon
  const createHeartIconAnimation = (heartsArray) => {
    if (!heartIconPosition) return;
    
    // Create a special heart that flies to the heart icon
    const flyingHeart = {
      id: `flying_heart_${Date.now()}`,
      type: 'flying',
      x: tapPosition.x,
      y: tapPosition.y,
      targetX: heartIconPosition.x,
      targetY: heartIconPosition.y,
      size: 24,
      color: TIKTOK_HEART_CONFIG.COLORS[0],
      scaleAnim: new Animated.Value(1),
      opacityAnim: new Animated.Value(1),
      positionAnimX: new Animated.Value(tapPosition.x),
      positionAnimY: new Animated.Value(tapPosition.y),
    };
    
    // Add to hearts array
    heartsArray.push(flyingHeart);
    setHearts([...heartsArray]);
    
    // Animate flying to heart icon with easing
    const flyDuration = 600;
    
    Animated.parallel([
      Animated.timing(flyingHeart.positionAnimX, {
        toValue: heartIconPosition.x,
        duration: flyDuration,
        useNativeDriver: true,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), // Smooth curve
      }),
      Animated.timing(flyingHeart.positionAnimY, {
        toValue: heartIconPosition.y,
        duration: flyDuration,
        useNativeDriver: true,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      }),
      // Scale down as it flies
      Animated.timing(flyingHeart.scaleAnim, {
        toValue: 0.8,
        duration: flyDuration * 0.8,
        useNativeDriver: true,
      }),
      // Fade out at the end
      Animated.sequence([
        Animated.delay(flyDuration * 0.7),
        Animated.timing(flyingHeart.opacityAnim, {
          toValue: 0,
          duration: flyDuration * 0.3,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  // Cleanup function
  const cleanup = () => {
    console.log('💖 TikTok Heart Animation Cleanup');
    setIsAnimating(false);
    setHearts([]);
    heartsRef.current = [];
    
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    
    if (onAnimationEnd) {
      onAnimationEnd();
    }
  };

  // Render main heart with TikTok styling
  const renderMainHeart = (heart) => (
    <Animated.View
      key={heart.id}
      style={[
        styles.heartContainer,
        {
          position: 'absolute',
          left: heart.x - heart.size / 2,
          top: heart.y - heart.size / 2,
          transform: [
            { scale: heart.scaleAnim },
            { 
              rotate: heart.rotationAnim.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              })
            }
          ],
          opacity: heart.opacityAnim,
        }
      ]}
    >
      {/* TikTok-style glow effect */}
      <Animated.View
        style={[
          styles.heartGlow,
          {
            width: heart.size * 1.5,
            height: heart.size * 1.5,
            borderRadius: heart.size * 0.75,
            backgroundColor: heart.color,
            opacity: heart.glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.2, 0.6],
            }),
          }
        ]}
      />
      
      {/* Main heart icon */}
      <Ionicons
        name="heart"
        size={heart.size}
        color={heart.color}
        style={styles.heartIcon}
      />
      
      {/* Extra sparkle effect for main heart */}
      <Animated.View
        style={[
          styles.sparkle,
          {
            opacity: heart.glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.8],
            }),
            transform: [
              {
                scale: heart.glowAnim.interpolate({
                  inputRange: [0.8, 1.5],
                  outputRange: [0.5, 1.2],
                })
              }
            ]
          }
        ]}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0)']}
          style={styles.sparkleGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
    </Animated.View>
  );

  // Render flying heart (to heart icon)
  const renderFlyingHeart = (heart) => (
    <Animated.View
      key={heart.id}
      style={[
        styles.flyingHeartContainer,
        {
          position: 'absolute',
          left: 0,
          top: 0,
          transform: [
            { translateX: heart.positionAnimX },
            { translateY: heart.positionAnimY },
            { scale: heart.scaleAnim },
          ],
          opacity: heart.opacityAnim,
        }
      ]}
    >
      <Ionicons
        name="heart"
        size={heart.size}
        color={heart.color}
        style={styles.flyingHeartIcon}
      />
    </Animated.View>
  );
  
  // Render particle heart
  const renderParticleHeart = (heart) => (
    <Animated.View
      key={heart.id}
      style={[
        styles.particleContainer,
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
              })
            }
          ],
          opacity: heart.opacityAnim,
        }
      ]}
    >
      {/* Particle glow */}
      <Animated.View
        style={[
          styles.particleGlow,
          {
            width: heart.size * 1.3,
            height: heart.size * 1.3,
            borderRadius: heart.size * 0.65,
            backgroundColor: heart.color,
            opacity: heart.glowAnim,
          }
        ]}
      />
      
      {/* Particle heart */}
      <Ionicons
        name="heart"
        size={heart.size}
        color={heart.color}
        style={styles.particleIcon}
      />
    </Animated.View>
  );

  // Only render if we have hearts to show
  if (!isVisible && hearts.length === 0) return null;

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {hearts.map(heart => {
        if (heart.type === 'main') {
          return renderMainHeart(heart);
        } else if (heart.type === 'flying') {
          return renderFlyingHeart(heart);
        } else {
          return renderParticleHeart(heart);
        }
      })}
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
    shadowRadius: 12,
    elevation: 12,
  },
  heartIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    zIndex: 2,
  },
  sparkle: {
    position: 'absolute',
    width: 20,
    height: 20,
    top: -10,
    right: -5,
  },
  sparkleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  particleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  particleGlow: {
    position: 'absolute',
    shadowColor: '#FE2C55',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  particleIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  // Flying heart styles
  flyingHeartContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  flyingHeartIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});

export default MagicalHeartSystem;