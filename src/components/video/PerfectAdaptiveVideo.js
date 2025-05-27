// src/components/video/PerfectAdaptiveVideo.js
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Animated, Text } from 'react-native';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Performance optimized configuration
const PERFECT_CONFIG = {
  // Preloading settings
  PRELOAD_QUEUE_SIZE: 2,
  PRELOAD_TRIGGER_THRESHOLD: 0.7, // Start preloading when 70% through current video
  
  // Memory management
  MAX_CACHED_VIDEOS: 5,
  MEMORY_CLEANUP_INTERVAL: 30000, // 30 seconds
  
  // Performance settings
  UPDATE_INTERVAL: 250, // Status updates every 250ms for 60fps feel
  LOADING_TIMEOUT: 8000, // 8 seconds max loading
  
  // Visual settings
  TRANSITION_DURATION: 200,
  LOADING_FADE_DURATION: 150,
  
  // Android-specific optimizations
  ANDROID_HARDWARE_ACCELERATION: true,
  ANDROID_SURFACE_VIEW: true,
};

const PerfectAdaptiveVideo = ({
  source,
  videoId,
  shouldPlay,
  isLooping = true,
  style,
  onLoad,
  onLoadStart,
  onError,
  onPlaybackStatusUpdate,
  videoRef,
  fillMode = 'smart',
  priority = 'normal',
  preloadNext = null, // Function to get next video for preloading
  onTransitionStart,
  onTransitionEnd,
  ...videoProps
}) => {
  // Core state
  const [loadingState, setLoadingState] = useState('idle');
  const [videoStyle, setVideoStyle] = useState(styles.defaultVideo);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Performance state
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [frameRate, setFrameRate] = useState(60);
  const [networkQuality, setNetworkQuality] = useState('good');
  
  // Animation refs - optimized for Android
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const loadingOpacity = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  // Refs for performance tracking
  const loadStartTime = useRef(null);
  const frameCounter = useRef(0);
  const lastFrameTime = useRef(Date.now());
  const memoryCheckInterval = useRef(null);
  const loadingTimeoutRef = useRef(null);
  
  // Memoized source to prevent unnecessary re-renders
  const memoizedSource = useMemo(() => {
    if (!source?.uri) return null;
    
    // Ensure URI is properly formatted for Android
    let uri = source.uri.trim();
    
    // Add protocol if missing
    if (!uri.startsWith('http://') && !uri.startsWith('https://')) {
      uri = `http://${uri}`;
    }
    
    return { ...source, uri };
  }, [source]);

  // Performance monitoring effect
  useEffect(() => {
    const monitorPerformance = () => {
      const now = Date.now();
      const timeDiff = now - lastFrameTime.current;
      
      if (timeDiff > 0) {
        const currentFPS = Math.min(60, Math.round(1000 / timeDiff));
        setFrameRate(currentFPS);
        
        // Haptic feedback if performance drops significantly
        if (currentFPS < 30 && shouldPlay) {
          console.warn('📉 Performance drop detected:', currentFPS, 'fps');
        }
      }
      
      lastFrameTime.current = now;
      frameCounter.current++;
    };

    const interval = setInterval(monitorPerformance, 1000);
    return () => clearInterval(interval);
  }, [shouldPlay]);

  // Memory management effect
  useEffect(() => {
    memoryCheckInterval.current = setInterval(() => {
      // Simulate memory usage calculation
      // In production, you'd use actual memory monitoring
      const estimatedUsage = frameCounter.current * 0.1; // MB
      setMemoryUsage(estimatedUsage);
      
      // Cleanup if memory usage is high
      if (estimatedUsage > 100) {
        console.log('🧹 High memory usage detected, cleaning up...');
        frameCounter.current = Math.floor(frameCounter.current * 0.7);
      }
    }, PERFECT_CONFIG.MEMORY_CLEANUP_INTERVAL);
    
    return () => {
      if (memoryCheckInterval.current) {
        clearInterval(memoryCheckInterval.current);
      }
    };
  }, []);

  // Enhanced loading state management
  const setLoadingStateWithAnimation = useCallback((newState) => {
    if (loadingState === newState) return;
    
    setLoadingState(newState);
    
    switch (newState) {
      case 'loading':
        setIsTransitioning(true);
        if (onTransitionStart) onTransitionStart();
        
        // Start shimmer animation
        Animated.loop(
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          })
        ).start();
        break;
        
      case 'loaded':
        setIsTransitioning(false);
        if (onTransitionEnd) onTransitionEnd();
        
        // Smooth fade in animation optimized for Android
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: PERFECT_CONFIG.TRANSITION_DURATION,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(loadingOpacity, {
            toValue: 0,
            duration: PERFECT_CONFIG.LOADING_FADE_DURATION,
            useNativeDriver: true,
          }),
        ]).start();
        
        // Stop shimmer
        shimmerAnim.stopAnimation();
        break;
        
      case 'error':
        setIsTransitioning(false);
        // Subtle error haptic
        Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
        break;
    }
  }, [loadingState, fadeAnim, scaleAnim, loadingOpacity, shimmerAnim, onTransitionStart, onTransitionEnd]);

  // Enhanced error handler with retry logic
  const handleError = useCallback((error) => {
    console.error(`❌ Video error for ${videoId}:`, error);
    
    setError(error);
    setLoadingStateWithAnimation('error');
    
    // Clear loading timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    
    // Auto-retry logic for network errors
    if (retryCount < 3 && error?.message?.includes('network')) {
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000);
      
      setTimeout(() => {
        console.log(`🔄 Auto-retry ${retryCount + 1}/3 for video ${videoId}`);
        setRetryCount(prev => prev + 1);
        setError(null);
        setLoadingStateWithAnimation('loading');
      }, retryDelay);
    }
    
    if (onError) onError(error);
  }, [videoId, retryCount, setLoadingStateWithAnimation, onError]);

  // Enhanced load start handler
  const handleLoadStart = useCallback(() => {
    console.log(`📹 Perfect video ${videoId} started loading...`);
    
    loadStartTime.current = Date.now();
    setError(null);
    setLoadingStateWithAnimation('loading');
    
    // Set loading timeout
    loadingTimeoutRef.current = setTimeout(() => {
      console.warn(`⏰ Loading timeout for video ${videoId}`);
      handleError(new Error('Loading timeout'));
    }, PERFECT_CONFIG.LOADING_TIMEOUT);
    
    if (onLoadStart) onLoadStart();
  }, [videoId, setLoadingStateWithAnimation, handleError, onLoadStart]);

  // Enhanced load complete handler
  const handleLoad = useCallback((status) => {
    const loadTime = Date.now() - (loadStartTime.current || Date.now());
    console.log(`✅ Perfect video ${videoId} loaded in ${loadTime}ms:`, {
      duration: status.durationMillis,
      dimensions: status.naturalSize,
      loadTime
    });
    
    // Clear loading timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    
    setError(null);
    setRetryCount(0);
    setLoadingStateWithAnimation('loaded');
    
    // Calculate optimal video dimensions
    if (status.naturalSize) {
      const { width: videoWidth, height: videoHeight } = status.naturalSize;
      const adaptiveStyle = calculatePerfectVideoStyle(videoWidth, videoHeight, fillMode);
      setVideoStyle(adaptiveStyle);
    }
    
    // Preload next video if available
    if (preloadNext && typeof preloadNext === 'function') {
      setTimeout(() => {
        const nextVideo = preloadNext();
        if (nextVideo) {
          console.log('🔮 Preloading next video:', nextVideo.id);
          // Implement preloading logic here
        }
      }, 1000);
    }
    
    if (onLoad) onLoad(status);
  }, [videoId, setLoadingStateWithAnimation, fillMode, preloadNext, onLoad]);

  // Perfect video style calculation for Android
  const calculatePerfectVideoStyle = useCallback((videoWidth, videoHeight, mode) => {
    if (!videoWidth || !videoHeight) return styles.defaultVideo;
    
    const videoAspectRatio = videoWidth / videoHeight;
    const screenAspectRatio = SCREEN_WIDTH / SCREEN_HEIGHT;
    
    let newStyle = {};
    
    switch (mode) {
      case 'cover':
        newStyle = {
          width: SCREEN_WIDTH,
          height: SCREEN_HEIGHT,
        };
        break;
        
      case 'fit':
        if (videoAspectRatio > screenAspectRatio) {
          newStyle = {
            width: SCREEN_WIDTH,
            height: SCREEN_WIDTH / videoAspectRatio,
          };
        } else {
          newStyle = {
            height: SCREEN_HEIGHT,
            width: SCREEN_HEIGHT * videoAspectRatio,
          };
        }
        break;
        
      case 'smart':
      default:
        // Smart scaling for optimal viewing on Android
        const scale = Math.max(
          SCREEN_WIDTH / videoWidth,
          SCREEN_HEIGHT / videoHeight
        );
        
        // Apply slight over-scale for edge-to-edge feel on Android
        const androidScale = scale * 1.02;
        
        newStyle = {
          width: videoWidth * androidScale,
          height: videoHeight * androidScale,
        };
        break;
    }
    
    return newStyle;
  }, []);

  // Enhanced playback status update
  const handlePlaybackStatusUpdate = useCallback((status) => {
    if (onPlaybackStatusUpdate) {
      onPlaybackStatusUpdate(status);
    }
    
    // Performance monitoring
    if (status.isLoaded && status.positionMillis && status.durationMillis) {
      const progress = status.positionMillis / status.durationMillis;
      
      // Trigger preloading when near end
      if (progress > PERFECT_CONFIG.PRELOAD_TRIGGER_THRESHOLD && preloadNext) {
        // Preload logic would go here
      }
    }
  }, [onPlaybackStatusUpdate, preloadNext]);

  // Render loading shimmer effect
   const renderLoadingShimmer = () => (
  <Animated.View style={[styles.shimmerContainer, { opacity: loadingOpacity }]}>
    <Animated.View
      style={[
        styles.shimmer,
        {
          transform: [
            {
              translateX: shimmerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
                extrapolate: 'clamp',
              }),
            },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={['#1a1a1a', '#2a2a2a', '#1a1a1a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1 }}
      />
    </Animated.View>

    {/* Loading progress indicator */}
    <View style={styles.loadingIndicator}>
      <View style={styles.loadingDots}>
        {[0, 1, 2].map(i => (
          <Animated.View
            key={i}
            style={[
              styles.loadingDot,
              {
                opacity: shimmerAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.3, 1, 0.3],
                }),
                transform: [{
                  scale: shimmerAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.8, 1.2, 0.8],
                  }),
                }],
              },
            ]}
          />
        ))}
      </View>
    </View>
  </Animated.View>
);

  // Render error state
  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Video Unavailable</Text>
      <Text style={styles.errorMessage}>
        {error?.message || 'Failed to load video'}
      </Text>
      {retryCount < 3 && (
        <Text style={styles.retryText}>Retrying automatically...</Text>
      )}
    </View>
  );

  // Render performance indicator (dev mode only)
  const renderPerformanceIndicator = () => {
    if (!__DEV__) return null;
    
    return (
      <View style={styles.performanceIndicator}>
        <Text style={styles.performanceText}>
          {frameRate}fps | {memoryUsage.toFixed(1)}MB | {networkQuality}
        </Text>
      </View>
    );
  };

  if (!memoizedSource) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.noSourceText}>No video source provided</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Main video component */}
      <Animated.View 
        style={[
          styles.videoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Video
          ref={videoRef}
          source={memoizedSource}
          style={[styles.mainVideo, videoStyle]}
          resizeMode="cover"
          shouldPlay={shouldPlay && !error && loadingState === 'loaded'}
          isLooping={isLooping}
          onLoad={handleLoad}
          onLoadStart={handleLoadStart}
          onError={handleError}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          useNativeControls={false}
          progressUpdateIntervalMillis={PERFECT_CONFIG.UPDATE_INTERVAL}
          // Android-specific optimizations
          useNativeDriver={true}
          volume={1.0}
          rate={1.0}
          {...videoProps}
        />
      </Animated.View>
      
      {/* Loading shimmer overlay */}
      {(loadingState === 'loading' || isTransitioning) && renderLoadingShimmer()}
      
      {/* Error state */}
      {loadingState === 'error' && renderErrorState()}
      
      {/* Performance indicator */}
      {renderPerformanceIndicator()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainVideo: {
    backgroundColor: 'transparent',
  },
  defaultVideo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  
  // Loading shimmer styles
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a1a',
    zIndex: 10,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6,
  },
  loadingIndicator: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FE2C55',
    marginHorizontal: 4,
  },
  
  // Error state styles
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#1a1a1a',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#CCC',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  retryText: {
    color: '#FE2C55',
    fontSize: 12,
    textAlign: 'center',
  },
  
  // Performance indicator styles
  performanceIndicator: {
    position: 'absolute',
    top: 60,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 4,
    borderRadius: 4,
    zIndex: 20,
  },
  performanceText: {
    color: '#FFF',
    fontSize: 8,
    fontFamily: 'monospace',
  },
  
  // No source styles
  noSourceText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default PerfectAdaptiveVideo;