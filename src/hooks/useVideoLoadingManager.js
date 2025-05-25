// src/hooks/useVideoLoadingManager.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useVideoPreloader } from './useVideoPreLoader';

const LOADING_CONFIG = {
  // Loading timeouts
  LOADING_TIMEOUT_MS: 10000, // 10 seconds timeout
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  
  // Performance settings
  PRELOAD_TRIGGER_THRESHOLD: 0.8, // Start preloading when 80% through current video
  AUTO_PLAY_DELAY_MS: 300,
  
  // Network quality settings
  NETWORK_QUALITY_CHECK_INTERVAL: 5000,
  MIN_BANDWIDTH_MBPS: 1, // Minimum bandwidth for smooth playback
  
  // Loading states
  LOADING_STATES: {
    IDLE: 'idle',
    LOADING: 'loading',
    LOADED: 'loaded',
    ERROR: 'error',
    RETRYING: 'retrying',
    PRELOADING: 'preloading',
    CACHED: 'cached',
  }
};

export const useVideoLoadingManager = (videos, currentIndex) => {
  // State management
  const [videoStates, setVideoStates] = useState({});
  const [loadingProgress, setLoadingProgress] = useState({});
  const [networkQuality, setNetworkQuality] = useState('good');
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [loadingErrors, setLoadingErrors] = useState({});
  const [retryAttempts, setRetryAttempts] = useState({});
  
  // Refs
  const loadingTimeouts = useRef(new Map());
  const retryTimeouts = useRef(new Map());
  const lastCurrentIndex = useRef(currentIndex);
  const appState = useRef(AppState.currentState);
  
  // Use video preloader hook
  const {
    preloadStatus,
    preloadProgress,
    getCachedVideoPath,
    isVideoCached,
    preloadVideo,
    cacheInfo,
  } = useVideoPreloader(videos, currentIndex);

  // Initialize component
  useEffect(() => {
    initializeVideoStates();
    setupNetworkMonitoring();
    setupAppStateListener();
    
    return () => {
      cleanupTimeouts();
    };
  }, []);

  // Monitor current index changes
  useEffect(() => {
    if (currentIndex !== lastCurrentIndex.current) {
      handleVideoIndexChange(lastCurrentIndex.current, currentIndex);
      lastCurrentIndex.current = currentIndex;
    }
  }, [currentIndex]);

  // Update video states when preload status changes
  useEffect(() => {
    Object.keys(preloadStatus).forEach(videoId => {
      const status = preloadStatus[videoId];
      if (status === 'cached') {
        setVideoStates(prev => ({
          ...prev,
          [videoId]: LOADING_CONFIG.LOADING_STATES.CACHED
        }));
      } else if (status === 'preloading') {
        setVideoStates(prev => ({
          ...prev,
          [videoId]: LOADING_CONFIG.LOADING_STATES.PRELOADING
        }));
      }
    });
  }, [preloadStatus]);

  // Initialize video states
  const initializeVideoStates = () => {
    if (!videos || videos.length === 0) return;
    
    const initialStates = {};
    const initialProgress = {};
    
    videos.forEach(video => {
      initialStates[video.id] = LOADING_CONFIG.LOADING_STATES.IDLE;
      initialProgress[video.id] = 0;
    });
    
    setVideoStates(initialStates);
    setLoadingProgress(initialProgress);
  };

  // Setup network monitoring
  const setupNetworkMonitoring = () => {
    const checkNetworkQuality = async () => {
      try {
        const netInfo = await NetInfo.fetch();
        
        if (!netInfo.isConnected) {
          setNetworkQuality('offline');
          return;
        }
        
        // Estimate network quality based on connection type
        let quality = 'good';
        if (netInfo.type === 'cellular') {
          switch (netInfo.details?.cellularGeneration) {
            case '2g':
              quality = 'poor';
              break;
            case '3g':
              quality = 'fair';
              break;
            case '4g':
            case '5g':
              quality = 'good';
              break;
            default:
              quality = 'fair';
          }
        } else if (netInfo.type === 'wifi') {
          // For WiFi, assume good quality unless we detect issues
          quality = 'good';
        }
        
        setNetworkQuality(quality);
        
        // Adjust auto-play based on network quality
        setAutoPlayEnabled(quality !== 'poor');
        
      } catch (error) {
        console.error('Failed to check network quality:', error);
        setNetworkQuality('unknown');
      }
    };
    
    // Initial check
    checkNetworkQuality();
    
    // Periodic checks
    const interval = setInterval(checkNetworkQuality, LOADING_CONFIG.NETWORK_QUALITY_CHECK_INTERVAL);
    
    return () => clearInterval(interval);
  };

  // Setup app state listener
  const setupAppStateListener = () => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App became active - resume loading
        resumeVideoLoading();
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background - pause loading
        pauseVideoLoading();
      }
      appState.current = nextAppState;
    });

    return () => subscription?.remove();
  };

  // Handle video index change
  const handleVideoIndexChange = (prevIndex, newIndex) => {
    console.log(`📱 Video index changed: ${prevIndex} → ${newIndex}`);
    
    // Update loading priorities
    updateLoadingPriorities(newIndex);
    
    // Start loading current video if not already loaded
    if (videos[newIndex]) {
      startVideoLoading(videos[newIndex].id, 'high');
    }
  };

  // Update loading priorities based on current index
  const updateLoadingPriorities = (currentIdx) => {
    if (!videos || videos.length === 0) return;
    
    // High priority: current video
    if (videos[currentIdx]) {
      startVideoLoading(videos[currentIdx].id, 'high');
    }
    
    // Medium priority: next video
    if (videos[currentIdx + 1]) {
      startVideoLoading(videos[currentIdx + 1].id, 'medium');
    }
    
    // Low priority: previous video
    if (videos[currentIdx - 1]) {
      startVideoLoading(videos[currentIdx - 1].id, 'low');
    }
  };

  // Start loading a specific video
  const startVideoLoading = useCallback(async (videoId, priority = 'medium') => {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;
    
    const currentState = videoStates[videoId];
    
    // Skip if already loaded or loading
    if (currentState === LOADING_CONFIG.LOADING_STATES.LOADED || 
        currentState === LOADING_CONFIG.LOADING_STATES.LOADING) {
      return;
    }
    
    // Check if video is cached
    const isCached = await isVideoCached(video.videoUrl);
    if (isCached) {
      setVideoStates(prev => ({
        ...prev,
        [videoId]: LOADING_CONFIG.LOADING_STATES.CACHED
      }));
      return;
    }
    
    console.log(`📥 Starting video loading: ${videoId} (${priority} priority)`);
    
    setVideoStates(prev => ({
      ...prev,
      [videoId]: LOADING_CONFIG.LOADING_STATES.LOADING
    }));
    
    setLoadingProgress(prev => ({
      ...prev,
      [videoId]: 0
    }));
    
    // Set loading timeout
    const timeoutId = setTimeout(() => {
      handleLoadingTimeout(videoId);
    }, LOADING_CONFIG.LOADING_TIMEOUT_MS);
    
    loadingTimeouts.current.set(videoId, timeoutId);
    
    // Start preloading if network allows
    if (networkQuality !== 'poor' && networkQuality !== 'offline') {
      try {
        await preloadVideo(video, priority);
      } catch (error) {
        handleLoadingError(videoId, error);
      }
    }
  }, [videos, videoStates, networkQuality, isVideoCached, preloadVideo]);

  // Handle loading timeout
  const handleLoadingTimeout = (videoId) => {
    console.warn(`⏰ Loading timeout for video: ${videoId}`);
    
    setVideoStates(prev => ({
      ...prev,
      [videoId]: LOADING_CONFIG.LOADING_STATES.ERROR
    }));
    
    setLoadingErrors(prev => ({
      ...prev,
      [videoId]: 'Loading timeout'
    }));
    
    // Attempt retry
    retryVideoLoading(videoId);
  };

  // Handle loading error
  const handleLoadingError = (videoId, error) => {
    console.error(`❌ Loading error for video ${videoId}:`, error);
    
    setVideoStates(prev => ({
      ...prev,
      [videoId]: LOADING_CONFIG.LOADING_STATES.ERROR
    }));
    
    setLoadingErrors(prev => ({
      ...prev,
      [videoId]: error.message || 'Loading failed'
    }));
    
    // Clear loading timeout
    const timeoutId = loadingTimeouts.current.get(videoId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      loadingTimeouts.current.delete(videoId);
    }
    
    // Attempt retry
    retryVideoLoading(videoId);
  };

  // Retry video loading
  const retryVideoLoading = (videoId) => {
    const currentAttempts = retryAttempts[videoId] || 0;
    
    if (currentAttempts >= LOADING_CONFIG.RETRY_ATTEMPTS) {
      console.error(`❌ Max retry attempts reached for video: ${videoId}`);
      return;
    }
    
    const newAttempts = currentAttempts + 1;
    setRetryAttempts(prev => ({
      ...prev,
      [videoId]: newAttempts
    }));
    
    setVideoStates(prev => ({
      ...prev,
      [videoId]: LOADING_CONFIG.LOADING_STATES.RETRYING
    }));
    
    console.log(`🔄 Retrying video loading: ${videoId} (attempt ${newAttempts})`);
    
    // Delay before retry
    const retryDelay = LOADING_CONFIG.RETRY_DELAY_MS * newAttempts;
    const timeoutId = setTimeout(() => {
      startVideoLoading(videoId, 'high');
      retryTimeouts.current.delete(videoId);
    }, retryDelay);
    
    retryTimeouts.current.set(videoId, timeoutId);
  };

  // Handle successful video load
  const handleVideoLoadSuccess = useCallback((videoId, loadData) => {
    console.log(`✅ Video loaded successfully: ${videoId}`);
    
    setVideoStates(prev => ({
      ...prev,
      [videoId]: LOADING_CONFIG.LOADING_STATES.LOADED
    }));
    
    setLoadingProgress(prev => ({
      ...prev,
      [videoId]: 100
    }));
    
    // Clear error state
    setLoadingErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[videoId];
      return newErrors;
    });
    
    // Reset retry attempts
    setRetryAttempts(prev => {
      const newAttempts = { ...prev };
      delete newAttempts[videoId];
      return newAttempts;
    });
    
    // Clear timeouts
    const timeoutId = loadingTimeouts.current.get(videoId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      loadingTimeouts.current.delete(videoId);
    }
  }, []);

  // Handle video load progress
  const handleVideoLoadProgress = useCallback((videoId, progress) => {
    setLoadingProgress(prev => ({
      ...prev,
      [videoId]: Math.round(progress)
    }));
  }, []);

  // Pause video loading
  const pauseVideoLoading = () => {
    console.log('⏸️ Pausing video loading');
    // Implementation would pause ongoing downloads
  };

  // Resume video loading
  const resumeVideoLoading = () => {
    console.log('▶️ Resuming video loading');
    // Re-trigger loading for current index
    updateLoadingPriorities(currentIndex);
  };

  // Cleanup timeouts
  const cleanupTimeouts = () => {
    // Clear loading timeouts
    for (const timeoutId of loadingTimeouts.current.values()) {
      clearTimeout(timeoutId);
    }
    loadingTimeouts.current.clear();
    
    // Clear retry timeouts
    for (const timeoutId of retryTimeouts.current.values()) {
      clearTimeout(timeoutId);
    }
    retryTimeouts.current.clear();
  };

  // Get loading state for a video
  const getVideoLoadingState = (videoId) => {
    return videoStates[videoId] || LOADING_CONFIG.LOADING_STATES.IDLE;
  };

  // Check if video is ready to play
  const isVideoReadyToPlay = (videoId) => {
    const state = getVideoLoadingState(videoId);
    return state === LOADING_CONFIG.LOADING_STATES.LOADED || 
           state === LOADING_CONFIG.LOADING_STATES.CACHED;
  };

  // Get video URI (cached or original)
  const getVideoUri = useCallback(async (video) => {
    try {
      return await getCachedVideoPath(video.videoUrl);
    } catch (error) {
      console.warn('Failed to get cached video path:', error);
      return video.videoUrl;
    }
  }, [getCachedVideoPath]);

  // Public API
  return {
    // State
    videoStates,
    loadingProgress: { ...loadingProgress, ...preloadProgress },
    networkQuality,
    autoPlayEnabled,
    loadingErrors,
    retryAttempts,
    cacheInfo,
    
    // Functions
    startVideoLoading,
    handleVideoLoadSuccess,
    handleVideoLoadProgress,
    handleLoadingError,
    retryVideoLoading,
    getVideoLoadingState,
    isVideoReadyToPlay,
    getVideoUri,
    pauseVideoLoading,
    resumeVideoLoading,
    
    // Utilities
    isLoading: (videoId) => getVideoLoadingState(videoId) === LOADING_CONFIG.LOADING_STATES.LOADING,
    isLoaded: (videoId) => isVideoReadyToPlay(videoId),
    hasError: (videoId) => getVideoLoadingState(videoId) === LOADING_CONFIG.LOADING_STATES.ERROR,
    isRetrying: (videoId) => getVideoLoadingState(videoId) === LOADING_CONFIG.LOADING_STATES.RETRYING,
    
    // Constants
    LOADING_STATES: LOADING_CONFIG.LOADING_STATES,
  };
};