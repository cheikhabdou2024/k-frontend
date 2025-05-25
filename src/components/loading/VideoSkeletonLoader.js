// src/components/loading/VideoSkeletonLoader.js
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const VideoSkeletonLoader = ({ 
  isVisible = true,
  variant = 'full', // 'full', 'compact', 'minimal'
  animationSpeed = 1500,
}) => {
  // Animation values
  const shimmerAnim = useRef(new Animated.Value(-1)).current;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Start animations when component mounts
  useEffect(() => {
    if (isVisible) {
      startAnimations();
    } else {
      stopAnimations();
    }
  }, [isVisible]);

  const startAnimations = () => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Shimmer animation
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: animationSpeed,
        easing: Easing.ease,
        useNativeDriver: true,
      })
    );

    // Pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    shimmerAnimation.start();
    pulseAnimation.start();
  };

  const stopAnimations = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const getShimmerTransform = () => ({
    transform: [
      {
        translateX: shimmerAnim.interpolate({
          inputRange: [-1, 1],
          outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
        }),
      },
    ],
  });

  // Skeleton components
  const SkeletonBox = ({ width, height, style, isCircle = false }) => (
    <View style={[
      styles.skeletonBox,
      {
        width,
        height,
        borderRadius: isCircle ? width / 2 : 8,
      },
      style
    ]}>
      <Animated.View style={[styles.shimmerOverlay, getShimmerTransform()]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
          style={styles.shimmerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>
    </View>
  );

  const SkeletonLine = ({ width, height = 12, style }) => (
    <SkeletonBox width={width} height={height} style={style} />
  );

  // Render different variants
  const renderFullSkeleton = () => (
    <View style={styles.fullContainer}>
      {/* Video area skeleton */}
      <View style={styles.videoAreaSkeleton}>
        <SkeletonBox 
          width={SCREEN_WIDTH} 
          height={SCREEN_HEIGHT * 0.6} 
          style={styles.mainVideoSkeleton}
        />
        
        {/* Loading pulse overlay */}
        <Animated.View style={[
          styles.loadingPulse,
          { opacity: pulseAnim }
        ]} />
      </View>

      {/* Right side action buttons skeleton */}
      <View style={styles.actionButtonsSkeleton}>
        <SkeletonBox width={48} height={48} isCircle style={styles.actionButton} />
        <SkeletonBox width={48} height={48} style={styles.actionButton} />
        <SkeletonBox width={48} height={48} style={styles.actionButton} />
        <SkeletonBox width={48} height={48} style={styles.actionButton} />
        <SkeletonBox width={48} height={48} isCircle style={styles.actionButton} />
      </View>

      {/* Bottom info skeleton */}
      <View style={styles.bottomInfoSkeleton}>
        {/* User info */}
        <View style={styles.userInfoSkeleton}>
          <SkeletonLine width={120} height={16} style={styles.usernameLine} />
          <SkeletonLine width={200} height={14} style={styles.captionLine} />
          <SkeletonLine width={150} height={12} style={styles.soundLine} />
        </View>
      </View>

      {/* Top header skeleton */}
      <View style={styles.headerSkeleton}>
        <SkeletonBox width={24} height={24} style={styles.headerIcon} />
        <View style={styles.tabsSkeleton}>
          <SkeletonLine width={80} height={16} />
          <SkeletonLine width={80} height={16} style={{ marginLeft: 20 }} />
        </View>
        <SkeletonBox width={24} height={24} style={styles.headerIcon} />
      </View>
    </View>
  );

  const renderCompactSkeleton = () => (
    <View style={styles.compactContainer}>
      <SkeletonBox 
        width={SCREEN_WIDTH} 
        height={SCREEN_HEIGHT * 0.4} 
        style={styles.compactVideoSkeleton}
      />
      
      <View style={styles.compactInfo}>
        <SkeletonLine width={100} height={14} />
        <SkeletonLine width={150} height={12} style={{ marginTop: 8 }} />
      </View>
    </View>
  );

  const renderMinimalSkeleton = () => (
    <View style={styles.minimalContainer}>
      <Animated.View style={[
        styles.minimalPulse,
        { opacity: pulseAnim }
      ]} />
      <SkeletonLine width={60} height={4} style={styles.minimalLine} />
    </View>
  );

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {variant === 'full' && renderFullSkeleton()}
      {variant === 'compact' && renderCompactSkeleton()}
      {variant === 'minimal' && renderMinimalSkeleton()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 100,
  },
  
  // Full skeleton styles
  fullContainer: {
    flex: 1,
  },
  videoAreaSkeleton: {
    flex: 1,
    position: 'relative',
  },
  mainVideoSkeleton: {
    backgroundColor: '#111',
  },
  loadingPulse: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  
  // Action buttons skeleton
  actionButtonsSkeleton: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#222',
    marginBottom: 16,
  },
  
  // Bottom info skeleton
  bottomInfoSkeleton: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 80,
  },
  userInfoSkeleton: {
    // Spacing for user info lines
  },
  usernameLine: {
    backgroundColor: '#222',
    marginBottom: 8,
  },
  captionLine: {
    backgroundColor: '#222',
    marginBottom: 8,
  },
  soundLine: {
    backgroundColor: '#222',
  },
  
  // Header skeleton
  headerSkeleton: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerIcon: {
    backgroundColor: '#222',
  },
  tabsSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Compact skeleton styles
  compactContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactVideoSkeleton: {
    backgroundColor: '#111',
    borderRadius: 12,
  },
  compactInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  
  // Minimal skeleton styles
  minimalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  minimalPulse: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  minimalLine: {
    backgroundColor: '#222',
  },
  
  // Shared skeleton styles
  skeletonBox: {
    backgroundColor: '#222',
    overflow: 'hidden',
    position: 'relative',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shimmerGradient: {
    flex: 1,
    width: SCREEN_WIDTH * 0.5,
  },
});

export default VideoSkeletonLoader;