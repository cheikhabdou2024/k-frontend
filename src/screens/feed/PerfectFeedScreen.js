// src/screens/feed/PerfectFeedScreen.js - UPDATED WITH SOUNDWAVE VISUALIZER
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Dimensions, 
  StatusBar, 
  ActivityIndicator, 
  Text,
  RefreshControl,
  Animated,
  PanResponder,
  BackHandler,
  AppState
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { TapGestureHandler, State } from 'react-native-gesture-handler';

// Components
import PerfectAdaptiveVideo from '../../components/video/PerfectAdaptiveVideo';
import VideoActionButtons from '../../components/feed/VideoActionButton';
import VideoInfo from '../../components/feed/VideoInfo';
import EnhancedFeedHeader, { FEED_TYPES } from '../../components/feed/EnhancedFeedHeader';
import MagicalHeartSystem from '../../components/interactions/MagicalHeartSystem';
import SoundWaveVisualizer from '../../components/interactions/SoundWaveVisualizer'; // NEW IMPORT

// Services & Utils
import FeedService from '../../services/FeedService';
import videoQueueManager from '../../utils/VideoQueueManager';

// Hooks 
import { useFeedLogic } from '../../hooks/useFeedLogic';

const { height, width } = Dimensions.get('window');
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Performance optimized configuration
const PERFECT_FEED_CONFIG = {
  // Rendering optimizations
  INITIAL_NUM_TO_RENDER: 1,
  MAX_TO_RENDER_PER_BATCH: 2,
  WINDOW_SIZE: 3,
  
  // Gesture settings
  SWIPE_THRESHOLD: 50,
  SWIPE_VELOCITY_THRESHOLD: 0.8,
  
  // Performance settings
  UPDATE_CELL_BATCH_PERIOD: 16, // 60fps
  REMOVE_CLIPPED_SUBVIEWS: true,
  
  // Animation settings
  TRANSITION_DURATION: 250,
  HAPTIC_FEEDBACK_ENABLED: true,
  
  // NEW: Sound wave settings
  SOUND_WAVE_TRIGGER_THRESHOLD: 0.7, // Show sound waves when volume > 70%
  SOUND_WAVE_SENSITIVITY: 'medium',
};

const PerfectFeedScreen = () => {
  // State management
  const [activeTab, setActiveTab] = useState(FEED_TYPES.FOR_YOU);
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMoreVideos, setHasMoreVideos] = useState(true);
  const [apiStatus, setApiStatus] = useState('loading');
  const [lastTapPosition, setLastTapPosition] = useState({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 });
  
  // NEW: Sound wave visualization state
  const [soundWaveStates, setSoundWaveStates] = useState({});
  const [currentVideoVolume, setCurrentVideoVolume] = useState(1.0);
  const [isCurrentVideoPlaying, setIsCurrentVideoPlaying] = useState(false);
  
  // Performance state
  const [renderingPerformance, setRenderingPerformance] = useState({
    fps: 60,
    dropFrames: 0,
    memoryUsage: 0
  });
  
  // Heart animation state
  const [heartAnimations, setHeartAnimations] = useState({});
  const [heartAnimationQueue, setHeartAnimationQueue] = useState([]);
  const [heartAnimationCounter, setHeartAnimationCounter] = useState(0);
  
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Refs for performance
  const flatListRef = useRef(null);
  const videoRefs = useRef({});
  const currentVideoRef = useRef(null);
  const performanceMonitorRef = useRef(null);
  const gestureStartTime = useRef(0);
  const lastTapTime = useRef(0);
  const doubleTapRef = useRef();
  
  // NEW: Sound wave refs
  const soundWaveRefs = useRef({});
  const volumeAnalysisInterval = useRef(null);
  
  // Animation refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const tabTransitionAnim = useRef(new Animated.Value(0)).current;

  // Enhanced pan responder for gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        const isHorizontalSwipe = Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30;
        const isVerticalSwipe = Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 30;
        
        return isHorizontalSwipe || isVerticalSwipe;
      },
      
      onPanResponderGrant: () => {
        gestureStartTime.current = Date.now();
        if (PERFECT_FEED_CONFIG.HAPTIC_FEEDBACK_ENABLED) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
      
      onPanResponderMove: (evt, gestureState) => {
        const progress = Math.min(Math.abs(gestureState.dx) / width, 1);
        tabTransitionAnim.setValue(progress);
      },
      
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, dy, vx, vy } = gestureState;
        
        Animated.spring(tabTransitionAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
        
        // Handle horizontal swipes (tab switching)
        if (Math.abs(dx) > PERFECT_FEED_CONFIG.SWIPE_THRESHOLD || Math.abs(vx) > PERFECT_FEED_CONFIG.SWIPE_VELOCITY_THRESHOLD) {
          if (Math.abs(dx) > Math.abs(dy)) {
            handleTabSwipe(dx > 0 ? 'right' : 'left');
            return;
          }
        }
        
        // Handle vertical swipes (video navigation)
        if (Math.abs(dy) > PERFECT_FEED_CONFIG.SWIPE_THRESHOLD || Math.abs(vy) > PERFECT_FEED_CONFIG.SWIPE_VELOCITY_THRESHOLD) {
          if (Math.abs(dy) > Math.abs(dx)) {
            handleVideoSwipe(dy > 0 ? 'down' : 'up');
          }
        }
      },
    })
  ).current;

  // Load videos on component mount
  useEffect(() => {
    loadInitialVideos();
    startPerformanceMonitoring();
    startVolumeAnalysis(); // NEW: Start volume analysis
    
    return () => {
      videoQueueManager.reset();
      stopPerformanceMonitoring();
      stopVolumeAnalysis(); // NEW: Stop volume analysis
    };
  }, []);

  // Update video queue when videos change
  useEffect(() => {
    if (videos.length > 0) {
      videoQueueManager.setVideoQueue(videos, currentIndex);
    }
  }, [videos, currentIndex]);

  // NEW: Start volume analysis for sound wave visualization
  const startVolumeAnalysis = () => {
    volumeAnalysisInterval.current = setInterval(() => {
      if (isCurrentVideoPlaying && currentVideoRef.current) {
        // Simulate volume analysis (in a real app, you'd get this from audio context)
        const mockVolume = 0.3 + Math.random() * 0.7; // Random volume between 0.3-1.0
        setCurrentVideoVolume(mockVolume);
        
        // Update sound wave state for current video
        const currentVideo = videos[currentIndex];
        if (currentVideo) {
          setSoundWaveStates(prev => ({
            ...prev,
            [currentVideo.id]: {
              isActive: mockVolume > PERFECT_FEED_CONFIG.SOUND_WAVE_TRIGGER_THRESHOLD,
              intensity: mockVolume > 0.8 ? 'high' : mockVolume > 0.5 ? 'medium' : 'low'
            }
          }));
        }
      }
    }, 100); // Update every 100ms for smooth visualization
  };

  // NEW: Stop volume analysis
  const stopVolumeAnalysis = () => {
    if (volumeAnalysisInterval.current) {
      clearInterval(volumeAnalysisInterval.current);
      volumeAnalysisInterval.current = null;
    }
  };

  // Handle app state changes
  useFocusEffect(
    useCallback(() => {
      const handleAppStateChange = (nextAppState) => {
        if (nextAppState === 'active') {
          playCurrentVideo();
          startVolumeAnalysis(); // NEW: Resume volume analysis
        } else {
          pauseAllVideos();
          stopVolumeAnalysis(); // NEW: Pause volume analysis
          
          // Reset sound wave states when app goes to background
          setSoundWaveStates({});
        }
      };

      const subscription = AppState.addEventListener('change', handleAppStateChange);
      
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        return false;
      });

      return () => {
        subscription?.remove();
        backHandler.remove();
      };
    }, [])
  );

  // Start performance monitoring
  const startPerformanceMonitoring = () => {
    let frameCount = 0;
    let lastTime = Date.now();
    
    performanceMonitorRef.current = setInterval(() => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastTime;
      const fps = Math.round((frameCount * 1000) / timeDiff);
      
      setRenderingPerformance(prev => ({
        ...prev,
        fps: Math.min(fps, 60),
        memoryUsage: videoQueueManager.getStats().memoryUsage
      }));
      
      frameCount = 0;
      lastTime = currentTime;
    }, 1000);
  };

  // Stop performance monitoring
  const stopPerformanceMonitoring = () => {
    if (performanceMonitorRef.current) {
      clearInterval(performanceMonitorRef.current);
    }
  };

  // Load initial videos with enhanced error handling
  const loadInitialVideos = async () => {
    try {
      setIsLoading(true);
      setApiStatus('loading');
      
      console.log('📱 Loading initial videos with PerfectFeedScreen...');
      
      const loadedVideos = await FeedService.loadVideos();
      
      const isApiData = loadedVideos.some(video => 
        video.videoUrl && (video.videoUrl.includes('pixabay') || video.videoUrl.includes('localhost'))
      );
      
      setVideos(loadedVideos);
      setApiStatus(isApiData ? 'api' : 'mock');
      
      console.log(`📱 Loaded ${loadedVideos.length} videos from ${isApiData ? 'API' : 'mock data'}`);
      
      if (loadedVideos.length > 0) {
        setTimeout(() => playCurrentVideo(), 500);
      }
      
    } catch (error) {
      console.error('📱 Error loading initial videos:', error);
      setApiStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tab swipe gestures
  const handleTabSwipe = (direction) => {
    const tabs = [FEED_TYPES.FOLLOWING, FEED_TYPES.FOR_YOU];
    const currentTabIndex = tabs.indexOf(activeTab);
    
    let newTabIndex;
    if (direction === 'left') {
      newTabIndex = (currentTabIndex + 1) % tabs.length;
    } else {
      newTabIndex = currentTabIndex === 0 ? tabs.length - 1 : currentTabIndex - 1;
    }
    
    const newTab = tabs[newTabIndex];
    if (newTab !== activeTab) {
      if (PERFECT_FEED_CONFIG.HAPTIC_FEEDBACK_ENABLED) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      handleTabChange(newTab);
    }
  };

  // Handle video swipe gestures
  const handleVideoSwipe = (direction) => {
    const newIndex = direction === 'up' 
      ? Math.min(currentIndex + 1, videos.length - 1)
      : Math.max(currentIndex - 1, 0);
    
    if (newIndex !== currentIndex) {
      if (PERFECT_FEED_CONFIG.HAPTIC_FEEDBACK_ENABLED) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      scrollToVideo(newIndex);
    }
  };

  // Handle tab change
  const handleTabChange = async (tab) => {
    if (tab === activeTab) return;
    
    setActiveTab(tab);
    
    try {
      const { videos: newVideos } = await FeedService.loadVideosByFeedType(tab.toLowerCase(), 1, 10);
      setVideos(newVideos);
      setCurrentIndex(0);
      
      // Reset sound wave states for new videos
      setSoundWaveStates({});
      
      if (flatListRef.current && newVideos.length > 0) {
        flatListRef.current.scrollToIndex({ 
          index: 0, 
          animated: true,
          viewPosition: 0,
        });
      }
    } catch (error) {
      console.error(`Error loading ${tab} videos:`, error);
    }
  };

  // Scroll to specific video
  const scrollToVideo = (index) => {
    if (flatListRef.current && index >= 0 && index < videos.length) {
      flatListRef.current.scrollToIndex({ 
        index, 
        animated: true,
        viewPosition: 0,
      });
    }
  };

  // Play current video
  const playCurrentVideo = () => {
    const currentVideo = videos[currentIndex];
    if (currentVideo && videoRefs.current[currentVideo.id]) {
      videoRefs.current[currentVideo.id].playAsync();
      setIsCurrentVideoPlaying(true);
      currentVideoRef.current = videoRefs.current[currentVideo.id];
    }
  };

  // Pause all videos
  const pauseAllVideos = () => {
    Object.values(videoRefs.current).forEach(videoRef => {
      if (videoRef) {
        videoRef.pauseAsync().catch(() => {});
      }
    });
    setIsCurrentVideoPlaying(false);
    currentVideoRef.current = null;
  };

  // Handle viewability changes
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
        videoQueueManager.updateCurrentIndex(newIndex);
        
        // Reset sound wave states and pause all videos
        setSoundWaveStates({});
        pauseAllVideos();
        
        // Play current video after a brief delay
        setTimeout(() => playCurrentVideo(), 100);
      }
    }
  }).current;

  // Viewability configuration optimized for performance
  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
    waitForInteraction: false,
  };

  // Enhanced double tap handler for MagicalHeartSystem
  const handleDoubleTap = (event) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      console.log('🎉 Double tap triggered!');
      
      const tapX = event.nativeEvent.absoluteX || event.nativeEvent.x || SCREEN_WIDTH / 2;
      const tapY = event.nativeEvent.absoluteY || event.nativeEvent.y || SCREEN_HEIGHT / 2;
      setLastTapPosition({ x: tapX, y: tapY });

      const newHeartAnimation = {
        id: `heart_${Date.now()}_${heartAnimationCounter}`,
        position: { x: tapX, y: tapY },
        intensity: 'heavy',
        timestamp: Date.now()
      };
      
      setHeartAnimationQueue(prev => [...prev, newHeartAnimation]);
      setHeartAnimationCounter(prev => prev + 1);
      
      if (PERFECT_FEED_CONFIG.HAPTIC_FEEDBACK_ENABLED) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      
      const currentVideo = videos[currentIndex];
      if (currentVideo) {
        console.log('❤️ Liking video:', currentVideo.id);
      }
    }
  };

  // Handle magical heart animation end
  const handleMagicalHeartAnimationEnd = (heartId) => {
    console.log('🎉 Magical heart animation ended:', heartId);
    setHeartAnimationQueue(prev => prev.filter(heart => heart.id !== heartId));
  };

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      const refreshedVideos = await FeedService.loadVideos(true);
      setVideos(refreshedVideos);
      setCurrentIndex(0);
      
      // Reset sound wave states
      setSoundWaveStates({});
      
      videoQueueManager.setVideoQueue(refreshedVideos, 0);
      
      if (flatListRef.current && refreshedVideos.length > 0) {
        flatListRef.current.scrollToIndex({ index: 0, animated: true });
      }
    } catch (error) {
      console.error('Error refreshing videos:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // NEW: Handle sound wave press (when user taps on sound waves)
  const handleSoundWavePress = (videoId) => {
    console.log('🎵 Sound wave pressed for video:', videoId);
    
    // Toggle sound wave intensity or trigger special effect
    setSoundWaveStates(prev => ({
      ...prev,
      [videoId]: {
        ...prev[videoId],
        intensity: prev[videoId]?.intensity === 'extreme' ? 'high' : 'extreme'
      }
    }));
    
    // Light haptic feedback
    if (PERFECT_FEED_CONFIG.HAPTIC_FEEDBACK_ENABLED) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // UPDATED: Render individual video item with SoundWaveVisualizer
  const renderVideoItem = useCallback(({ item, index }) => {
    const isActive = index === currentIndex;
    const soundWaveState = soundWaveStates[item.id];
    
    return (
      <View style={styles.videoItemContainer}>
        {/* Double Tap Gesture Handler */}
        <TapGestureHandler
          ref={doubleTapRef}
          onHandlerStateChange={handleDoubleTap}
          numberOfTaps={2}
          maxDurationMs={500}
        >
          <View style={styles.gestureContainer}>
            {/* Perfect Video Player */}
            <PerfectAdaptiveVideo
              key={item.id}
              videoRef={(ref) => { videoRefs.current[item.id] = ref; }}
              source={{ uri: item.videoUrl }}
              videoId={item.id}
              shouldPlay={isActive}
              isLooping={true}
              fillMode="smart"
              priority={isActive ? 'high' : 'normal'}
              preloadNext={() => videoQueueManager.getNextVideoForPreload()}
              onTransitionStart={() => console.log(`🎬 Video ${item.id} starting transition`)}
              onTransitionEnd={() => console.log(`✅ Video ${item.id} transition complete`)}
            />
          </View>
        </TapGestureHandler>
        
        {/* NEW: Sound Wave Visualizer */}
        {isActive && soundWaveState?.isActive && (
          <View style={styles.soundWaveContainer}>
            <SoundWaveVisualizer
              ref={(ref) => { soundWaveRefs.current[item.id] = ref; }}
              isActive={true}
              intensity={soundWaveState.intensity}
              size="medium"
              onWaveComplete={() => console.log('🌊 Wave animation complete')}
              showPulseRing={true}
              syncWithAudio={true}
              style={styles.soundWaveVisualizer}
            />
          </View>
        )}
        
        {/* Video Actions */}
        <VideoActionButtons
          video={item}
          isLiked={false}
          isBookmarked={false}
          onUserProfilePress={(userId) => console.log('Profile press:', userId)}
          onLikePress={() => {
            const newHeartAnimation = {
              id: `heart_${Date.now()}_${heartAnimationCounter}`,
              position: { x: width - 50, y: height / 2 },
              intensity: 'normal',
              timestamp: Date.now()
            };
            
            setHeartAnimationQueue(prev => [...prev, newHeartAnimation]);
            setHeartAnimationCounter(prev => prev + 1);
          }}
          onCommentPress={() => navigation.navigate('CommentsScreen', { videoId: item.id })}
          onBookmarkPress={() => console.log('Bookmark press:', item.id)}
          onSharePress={() => console.log('Share press:', item.id)}
        />
        
        {/* Video Info */}
        <VideoInfo
          video={item}
          onSoundPress={(soundId) => handleSoundWavePress(item.id)} // NEW: Connect to sound wave
          onUserPress={(userId) => console.log('User press:', userId)}
          onHashtagPress={(hashtag) => console.log('Hashtag press:', hashtag)}
          onLocationPress={(location) => console.log('Location press:', location)}
          isVisible={true}
        />
      </View>
    );
  }, [currentIndex, soundWaveStates, lastTapPosition, navigation, handleDoubleTap, heartAnimationCounter]);

  // Memoized item layout for better performance
  const getItemLayout = useCallback((data, index) => ({
    length: height,
    offset: height * index,
    index,
  }), []);

  // Handle scroll events
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { 
      useNativeDriver: false,
      listener: (event) => {
        // Additional scroll logic if needed
      }
    }
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FE2C55" />
        <Text style={styles.loadingText}>Loading Perfect Feed...</Text>
        {apiStatus === 'api' && (
          <Text style={styles.apiStatusText}>✅ Connected to API</Text>
        )}
        {apiStatus === 'mock' && (
          <Text style={styles.mockStatusText}>⚠️ Using offline content</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* Enhanced Header */}
      <EnhancedFeedHeader 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        insets={insets}
        isSwipeInProgress={false}
      />
      
      {/* Performance Indicator (Dev Only) */}
      {__DEV__ && (
        <View style={styles.performanceIndicator}>
          <Text style={styles.performanceText}>
            {renderingPerformance.fps}fps • {renderingPerformance.memoryUsage.toFixed(1)}MB • {apiStatus}
          </Text>
          {/* NEW: Sound wave debug info */}
          <Text style={styles.debugText}>
            Vol: {(currentVideoVolume * 100).toFixed(0)}% • Waves: {Object.keys(soundWaveStates).length}
          </Text>
        </View>
      )}
      
      {/* Video List */}
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScroll={handleScroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#FE2C55"
            colors={["#FE2C55"]}
            progressBackgroundColor="#000"
            progressViewOffset={insets.top + 50}
          />
        }
        // Performance optimizations
        removeClippedSubviews={PERFECT_FEED_CONFIG.REMOVE_CLIPPED_SUBVIEWS}
        maxToRenderPerBatch={PERFECT_FEED_CONFIG.MAX_TO_RENDER_PER_BATCH}
        windowSize={PERFECT_FEED_CONFIG.WINDOW_SIZE}
        initialNumToRender={PERFECT_FEED_CONFIG.INITIAL_NUM_TO_RENDER}
        updateCellsBatchingPeriod={PERFECT_FEED_CONFIG.UPDATE_CELL_BATCH_PERIOD}
        getItemLayout={getItemLayout}
        scrollEventThrottle={16}
        bounces={true}
      />

      {/* Magical Heart System */}
      {heartAnimationQueue.map((heartAnimation) => (
        <MagicalHeartSystem
          key={heartAnimation.id}
          isVisible={true}
          onAnimationEnd={() => handleMagicalHeartAnimationEnd(heartAnimation.id)}
          tapPosition={heartAnimation.position}
          intensity={heartAnimation.intensity}
          style={styles.magicalHeartSystem}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 20,
    fontWeight: '600',
    fontSize: 16,
  },
  apiStatusText: {
    color: '#4CAF50',
    marginTop: 8,
    fontSize: 14,
  },
  mockStatusText: {
    color: '#FF9800',
    marginTop: 8,
    fontSize: 14,
  },
  performanceIndicator: {
    position: 'absolute',
    top: 100,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1000,
  },
  performanceText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  // NEW: Debug text style
  debugText: {
    color: '#25F4EE',
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  videoItemContainer: {
    width,
    height,
  },
  gestureContainer: {
    flex: 1,
  },
  // NEW: Sound wave container styles
  soundWaveContainer: {
    position: 'absolute',
    bottom: 200, // Position above video info
    left: 20,
    zIndex: 15,
  },
  soundWaveVisualizer: {
    // Additional styling if needed
  },
  magicalHeartSystem: {
    zIndex: 999,
  },
});

export default PerfectFeedScreen;   //when we back, we'll add hapticsystem and transition components from claude , then create conversation to include them into perfectfeedscreen