// src/components/video/EnhancedAdaptiveVideo.js
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Text, Animated } from 'react-native';
import { Video } from 'expo-av';
import VideoSkeletonLoader from '../loading/VideoSkeletonLoader';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ENHANCED_CONFIG = {
  // Quality settings based on network
  QUALITY_SETTINGS: {
    poor: { quality: '480p', bufferSize: 5000 },
    fair: { quality: '720p', bufferSize: 10000 },
    good: { quality: '1080p', bufferSize: 15000 },
    excellent: { quality: '1080p', bufferSize: 20000 },
  },
  
  // Auto-retry settings
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_BASE: 1000, // Base delay in ms
  
  // Loading timeout
  LOADING_TIMEOUT: 15000, // 15 seconds
};

const AdaptiveVideo = ({
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
  networkQuality = 'good',
  loadingState = 'idle',
  loadingProgress = 0,
  onRetry,
  priority = 'medium',
  ...videoProps
}) => {
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [videoStyle, setVideoStyle] = useState(styles.defaultVideo);
  const [retryCount, setRetryCount] = useState(0);
  const [actualSource, setActualSource] = useState(source);
  const [showSkeleton, setShowSkeleton] = useState(true);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const loadingOpacity = useRef(new Animated.Value(1)).current;
  
  // Timeout refs
  const loadingTimeoutRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  // Monitor loading state changes
  useEffect(() => {
    handleLoadingStateChange(loadingState);
  }, [loadingState]);

  // Monitor source changes
  useEffect(() => {
    if (source?.uri !== actualSource?.uri) {
      resetVideoState();
      setActualSource(source);
    }
  }, [source]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, []);

  // Handle loading state changes
  const handleLoadingStateChange = (state) => {
    switch (state) {
      case 'loading':
      case 'preloading':
        setIsLoading(true);
        setHasError(false);
        setShowSkeleton(true);
        startLoadingTimeout();
        break;
        
      case 'loaded':
      case 'cached':
        setIsLoading(false);
        setHasError(false);
        animateVideoIn();
        clearTimeouts();
        break;
        
      case 'error':
        setIsLoading(false);
        setHasError(true);
        setShowSkeleton(false);
        clearTimeouts();
        handleAutoRetry();
        break;
        
      case 'retrying':
        setIsLoading(true);
        setHasError(false);
        setShowSkeleton(true);
        break;
    }
  };

  // Reset video state
  const resetVideoState = () => {
    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');
    setRetryCount(0);
    setShowSkeleton(true);
    
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.95);
    loadingOpacity.setValue(1);
    
    clearTimeouts();
  };

  // Start loading timeout
  const startLoadingTimeout = () => {
    clearTimeouts();
    
    loadingTimeoutRef.current = setTimeout(() => {
      if (isLoading) {
        handleLoadingTimeout();
      }
    }, ENHANCED_CONFIG.LOADING_TIMEOUT);
  };

  // Handle loading timeout
  const handleLoadingTimeout = () => {
    console.warn(`⏰ Loading timeout for video ${videoId}`);
    setHasError(true);
    setErrorMessage('Loading timeout');
    setIsLoading(false);
    handleAutoRetry();
  };

  // Clear all timeouts
  const clearTimeouts = () => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  };

  // Animate video appearance
  const animateVideoIn = () => {
    setShowSkeleton(false);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(loadingOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Handle auto retry
  const handleAutoRetry = () => {
    if (retryCount >= ENHANCED_CONFIG.MAX_RETRY_ATTEMPTS) {
      console.error(`❌ Max retry attempts reached for video ${videoId}`);
      return;
    }
    
    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);
    
    const retryDelay = ENHANCED_CONFIG.RETRY_DELAY_BASE * Math.pow(2, newRetryCount - 1);
    
    console.log(`🔄 Auto-retrying video ${videoId} (attempt ${newRetryCount}) in ${retryDelay}ms`);
    
    retryTimeoutRef.current = setTimeout(() => {
      setIsLoading(true);
      setHasError(false);
      setShowSkeleton(true);
      
      if (onRetry) {
        onRetry(videoId, newRetryCount);
      }
    }, retryDelay);
  };

  // Enhanced error handler
  const handleError = useCallback((error) => {
    console.error(`❌ Video error for ${videoId}:`, error);
    
    setHasError(true);
    setIsLoading(false);
    setShowSkeleton(false);
    
    // Determine error message
    let message = 'Failed to load video';
    if (error?.message) {
      if (error.message.includes('network')) {
        message = 'Network error';
      } else if (error.message.includes('format')) {
        message = 'Unsupported format';
      } else if (error.message.includes('timeout')) {
        message = 'Loading timeout';
      }
    }
    
    setErrorMessage(message);
    
    if (onError) onError(error);
    
    // Don't auto-retry for certain error types
    if (!error?.message?.includes('format')) {
      handleAutoRetry();
    }
  }, [videoId, onError, retryCount]);

  // Enhanced load start handler
  const handleLoadStart = useCallback(() => {
    console.log(`📹 Enhanced video ${videoId} started loading...`);
    setIsLoading(true);
    setHasError(false);
    startLoadingTimeout();
    
    if (onLoadStart) onLoadStart();
  }, [videoId, onLoadStart]);

  // Enhanced load complete handler
  const handleLoad = useCallback((status) => {
    console.log(`✅ Enhanced video ${videoId} loaded:`, {
      duration: status.durationMillis,
      dimensions: status.naturalSize,
      isLoaded: status.isLoaded
    });
    
    setIsLoading(false);
    setHasError(false);
    clearTimeouts();
    
    // Calculate video dimensions for adaptive sizing
    if (status.naturalSize) {
      const { width: videoWidth, height: videoHeight } = status.naturalSize;
      const adaptiveStyle = calculateAdaptiveStyle(videoWidth, videoHeight);
      setVideoStyle(adaptiveStyle);
    }
    
    // Animate video in
    animateVideoIn();
    
    if (onLoad) onLoad(status);
  }, [videoId, onLoad, fillMode]);

  // Calculate adaptive video style
  const calculateAdaptiveStyle = (videoWidth, videoHeight) => {
    if (!videoWidth || !videoHeight) return styles.defaultVideo;
    
    const videoAspectRatio = videoWidth / videoHeight;
    const screenAspectRatio = SCREEN_WIDTH / SCREEN_HEIGHT;
    
    let newStyle = {};
    
    switch (fillMode) {
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
        const scale = Math.max(
          SCREEN_WIDTH / videoWidth,
          SCREEN_HEIGHT / videoHeight
        );
        
        newStyle = {
          width: videoWidth * scale,
          height: videoHeight * scale,
        };
        break;
    }
    
    return newStyle;
  };

  // Get quality settings based on network
  const getQualitySettings = () => {
    return ENHANCED_CONFIG.QUALITY_SETTINGS[networkQuality] || 
           ENHANCED_CONFIG.QUALITY_SETTINGS.good;
  };

  // Handle source URL validation and cleanup
  const getValidatedSource = () => {
    if (!actualSource || !actualSource.uri) return actualSource;
    
    let uri = actualSource.uri.trim();
    
    // Add protocol if missing
    if (uri && !uri.startsWith('http://') && !uri.startsWith('https://')) {
      uri = `http://${uri}`;
    }
    
    return { ...actualSource, uri };
  };

  // Render loading overlay
  const renderLoadingOverlay = () => {
    if (!isLoading && !showSkeleton) return null;
    
    return (
      <Animated.View 
        style={[
          styles.loadingOverlay,
          { opacity: loadingOpacity }
        ]}
      >
        <VideoSkeletonLoader 
          isVisible={showSkeleton}
          variant="full"
          animationSpeed={1200}
        />
        
        {/* Loading progress indicator */}
        {loadingProgress > 0 && loadingProgress < 100 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${loadingProgress}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{loadingProgress}%</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  // Render error state
  const renderErrorState = () => {
    if (!hasError) return null;
    
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Video Unavailable</Text>
        <Text style={styles.errorMessage}>{errorMessage}</Text>
        
        {retryCount < ENHANCED_CONFIG.MAX_RETRY_ATTEMPTS && (
          <Text style={styles.retryText}>
            Retrying automatically... ({retryCount}/{ENHANCED_CONFIG.MAX_RETRY_ATTEMPTS})
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Video component */}
      {!hasError && (
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
            source={getValidatedSource()}
            style={[styles.mainVideo, videoStyle]}
            resizeMode="cover"
            shouldPlay={shouldPlay && !hasError && !isLoading}
            isLooping={isLooping}
            onLoad={handleLoad}
            onLoadStart={handleLoadStart}
            onError={handleError}
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            useNativeControls={false}
            progressUpdateIntervalMillis={250}
            {...videoProps}
          />
        </Animated.View>
      )}
      
      {/* Loading overlay */}
      {renderLoadingOverlay()}
      
      {/* Error state */}
      {renderErrorState()}
      
      {/* Network quality indicator (development only) */}
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            {networkQuality} | {loadingState} | {priority}
          </Text>
        </View>
      )}
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
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  defaultVideo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 15,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FE2C55',
    borderRadius: 2,
  },
  progressText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
  debugInfo: {
    position: 'absolute',
    top: 100,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 4,
    borderRadius: 4,
    zIndex: 20,
  },
  debugText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});

export default AdaptiveVideo;