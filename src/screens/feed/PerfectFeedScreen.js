// src/screens/feed/PerfectFeedScreen.js - ULTRA SIMPLIFIED (NO ANIMATION CONFLICTS)
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
import SoundWaveVisualizer from '../../components/interactions/SoundWaveVisualizer';

// SIMPLIFIED: Import only safe transitions
import {
  ParticleTransition,
  MagicalReveal,
  TRANSITION_CONFIG
} from '../../components/interactions/MagicalTransitions';

// Services & Utils
import FeedService from '../../services/FeedService';
import videoQueueManager from '../../utils/VideoQueueManager';

// Hooks 
import { useFeedLogic } from '../../hooks/useFeedLogic';

const { height, width } = Dimensions.get('window');
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// SIMPLIFIED: Configuration without complex transitions
const PERFECT_FEED_CONFIG = {
  // Rendering optimizations
  INITIAL_NUM_TO_RENDER: 1,
  MAX_TO_RENDER_PER_BATCH: 2,
  WINDOW_SIZE: 3,
  
  // Gesture settings
  SWIPE_THRESHOLD: 50,
  SWIPE_VELOCITY_THRESHOLD: 0.8,
  
  // Performance settings
  UPDATE_CELL_BATCH_PERIOD: 16,
  REMOVE_CLIPPED_SUBVIEWS: true,
  
  // Animation settings
  TRANSITION_DURATION: 250,
  HAPTIC_FEEDBACK_ENABLED: true,
  
  // Sound wave settings
  SOUND_WAVE_TRIGGER_THRESHOLD: 0.7,
  SOUND_WAVE_SENSITIVITY: 'medium',
  
  // SIMPLIFIED: Safe effects only
  ENABLE_PARTICLE_EFFECTS: true,
  ENABLE_MAGICAL_REVEAL: false, // Disabled to avoid conflicts
};

const PerfectFeedScreen = () => {
  // Core state
  const [activeTab, setActiveTab] = useState(FEED_TYPES.FOR_YOU);
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiStatus, setApiStatus] = useState('loading');
  const [lastTapPosition, setLastTapPosition] = useState({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 });
  
  // Sound wave state
  const [soundWaveStates, setSoundWaveStates] = useState({});
  const [currentVideoVolume, setCurrentVideoVolume] = useState(1.0);
  const [isCurrentVideoPlaying, setIsCurrentVideoPlaying] = useState(false);
  
  // SIMPLIFIED: Only essential transition states
  const [showParticleEffect, setShowParticleEffect] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Performance state
  const [renderingPerformance, setRenderingPerformance] = useState({
    fps: 60,
    memoryUsage: 0
  });
  
  // Heart animation state
  const [heartAnimationQueue, setHeartAnimationQueue] = useState([]);
  const [heartAnimationCounter, setHeartAnimationCounter] = useState(0);
  
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Essential refs
  const flatListRef = useRef(null);
  const videoRefs = useRef({});
  const currentVideoRef = useRef(null);
  const performanceMonitorRef = useRef(null);
  const doubleTapRef = useRef();
  
  // Sound wave refs
  const soundWaveRefs = useRef({});
  const volumeAnalysisInterval = useRef(null);
  
  // SIMPLIFIED: Only safe animations
  const scrollY = useRef(new Animated.Value(0)).current;

  // SIMPLIFIED: Basic pan responder without complex transitions
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        const isHorizontalSwipe = Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30;
        const isVerticalSwipe = Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 30;
        
        return (isHorizontalSwipe || isVerticalSwipe) && !isTransitioning;
      },
      
      onPanResponderGrant: () => {
        if (PERFECT_FEED_CONFIG.HAPTIC_FEEDBACK_ENABLED) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
      
      onPanResponderRelease: (evt, gestureState) => {
        if (isTransitioning) return;
        
        const { dx, dy, vx, vy } = gestureState;
        
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

  // Initialize
  useEffect(() => {
    loadInitialVideos();
    startPerformanceMonitoring();
    startVolumeAnalysis();
    
    return () => {
      videoQueueManager.reset();
      stopPerformanceMonitoring();
      stopVolumeAnalysis();
    };
  }, []);

  useEffect(() => {
    if (videos.length > 0) {
      videoQueueManager.setVideoQueue(videos, currentIndex);
    }
  }, [videos, currentIndex]);

  // Volume analysis
  const startVolumeAnalysis = () => {
    volumeAnalysisInterval.current = setInterval(() => {
      if (isCurrentVideoPlaying && currentVideoRef.current && !isTransitioning) {
        const mockVolume = 0.3 + Math.random() * 0.7;
        setCurrentVideoVolume(mockVolume);
        
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
    }, 100);
  };

  const stopVolumeAnalysis = () => {
    if (volumeAnalysisInterval.current) {
      clearInterval(volumeAnalysisInterval.current);
      volumeAnalysisInterval.current = null;
    }
  };

  // App state handling
  useFocusEffect(
    useCallback(() => {
      const handleAppStateChange = (nextAppState) => {
        if (nextAppState === 'active') {
          if (!isTransitioning) {
            playCurrentVideo();
            startVolumeAnalysis();
          }
        } else {
          pauseAllVideos();
          stopVolumeAnalysis();
          setSoundWaveStates({});
        }
      };

      const subscription = AppState.addEventListener('change', handleAppStateChange);
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => false);

      return () => {
        subscription?.remove();
        backHandler.remove();
      };
    }, [isTransitioning])
  );

  // Performance monitoring
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

  const stopPerformanceMonitoring = () => {
    if (performanceMonitorRef.current) {
      clearInterval(performanceMonitorRef.current);
    }
  };

  // Load videos
  const loadInitialVideos = async () => {
    try {
      setIsLoading(true);
      setApiStatus('loading');
      
      console.log('📱 Loading initial videos...');
      
      const loadedVideos = await FeedService.loadVideos();
      
      const isApiData = loadedVideos.some(video => 
        video.videoUrl && (video.videoUrl.includes('pixabay') || video.videoUrl.includes('localhost'))
      );
      
      setVideos(loadedVideos);
      setApiStatus(isApiData ? 'api' : 'mock');
      
      console.log(`📱 Loaded ${loadedVideos.length} videos from ${isApiData ? 'API' : 'mock data'}`);
      
      if (loadedVideos.length > 0) {
        setTimeout(() => {
          if (!isTransitioning) {
            playCurrentVideo();
          }
        }, 500);
      }
      
    } catch (error) {
      console.error('📱 Error loading videos:', error);
      setApiStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // SIMPLIFIED: Basic tab swipe
  const handleTabSwipe = (direction) => {
    if (isTransitioning) return;
    
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
      
      // Show particle effect
      if (PERFECT_FEED_CONFIG.ENABLE_PARTICLE_EFFECTS) {
        setShowParticleEffect(true);
      }
      
      handleTabChange(newTab);
    }
  };

  // SIMPLIFIED: Basic video swipe
  const handleVideoSwipe = (direction) => {
    if (isTransitioning) return;
    
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

  // Tab change
  const handleTabChange = async (tab) => {
    if (tab === activeTab || isTransitioning) return;
    
    setIsTransitioning(true);
    setActiveTab(tab);
    
    try {
      const { videos: newVideos } = await FeedService.loadVideosByFeedType(tab.toLowerCase(), 1, 10);
      setVideos(newVideos);
      setCurrentIndex(0);
      setSoundWaveStates({});
      
      if (flatListRef.current && newVideos.length > 0) {
        flatListRef.current.scrollToIndex({ 
          index: 0, 
          animated: true,
          viewPosition: 0,
        });
      }
      
      setTimeout(() => {
        setIsTransitioning(false);
        setShowParticleEffect(false);
      }, PERFECT_FEED_CONFIG.TRANSITION_DURATION);
      
    } catch (error) {
      console.error(`Error loading ${tab} videos:`, error);
      setIsTransitioning(false);
      setShowParticleEffect(false);
    }
  };

  // Scroll to video
  const scrollToVideo = (index) => {
    if (flatListRef.current && index >= 0 && index < videos.length) {
      flatListRef.current.scrollToIndex({ 
        index, 
        animated: true,
        viewPosition: 0,
      });
    }
  };

  // Video playback
  const playCurrentVideo = () => {
    const currentVideo = videos[currentIndex];
    if (currentVideo && videoRefs.current[currentVideo.id] && !isTransitioning) {
      videoRefs.current[currentVideo.id].playAsync();
      setIsCurrentVideoPlaying(true);
      currentVideoRef.current = videoRefs.current[currentVideo.id];
    }
  };

  const pauseAllVideos = () => {
    Object.values(videoRefs.current).forEach(videoRef => {
      if (videoRef) {
        videoRef.pauseAsync().catch(() => {});
      }
    });
    setIsCurrentVideoPlaying(false);
    currentVideoRef.current = null;
  };

  // Viewability handling
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0 && !isTransitioning) {
      const newIndex = viewableItems[0].index;
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
        videoQueueManager.updateCurrentIndex(newIndex);
        
        setSoundWaveStates({});
        pauseAllVideos();
        
        setTimeout(() => {
          if (!isTransitioning) {
            playCurrentVideo();
          }
        }, 100);
      }
    }
  }).current;

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
    waitForInteraction: false,
  };

  // Double tap handler
  const handleDoubleTap = (event) => {
    if (event.nativeEvent.state === State.ACTIVE && !isTransitioning) {
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
      
      // Trigger particle effect
      if (PERFECT_FEED_CONFIG.ENABLE_PARTICLE_EFFECTS) {
        setShowParticleEffect(true);
        setTimeout(() => setShowParticleEffect(false), 3000);
      }
      
      const currentVideo = videos[currentIndex];
      if (currentVideo) {
        console.log('❤️ Liking video:', currentVideo.id);
      }
    }
  };

  // Heart animation end
  const handleMagicalHeartAnimationEnd = (heartId) => {
    console.log('🎉 Heart animation ended:', heartId);
    setHeartAnimationQueue(prev => prev.filter(heart => heart.id !== heartId));
  };

  // Pull to refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      const refreshedVideos = await FeedService.loadVideos(true);
      setVideos(refreshedVideos);
      setCurrentIndex(0);
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

  // Sound wave press
  const handleSoundWavePress = (videoId) => {
    if (isTransitioning) return;
    
    console.log('🎵 Sound wave pressed for video:', videoId);
    
    setSoundWaveStates(prev => ({
      ...prev,
      [videoId]: {
        ...prev[videoId],
        intensity: prev[videoId]?.intensity === 'extreme' ? 'high' : 'extreme'
      }
    }));
    
    if (PERFECT_FEED_CONFIG.HAPTIC_FEEDBACK_ENABLED) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Particle effect completion
  const handleParticleComplete = () => {
    console.log('🎆 Particle effect completed');
    setShowParticleEffect(false);
  };

  // SIMPLIFIED: Render video item without complex transitions
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
          enabled={!isTransitioning}
        >
          <View style={styles.gestureContainer}>
            {/* Perfect Video Player */}
            <PerfectAdaptiveVideo
              key={item.id}
              videoRef={(ref) => { videoRefs.current[item.id] = ref; }}
              source={{ uri: item.videoUrl }}
              videoId={item.id}
              shouldPlay={isActive && !isTransitioning}
              isLooping={true}
              fillMode="smart"
              priority={isActive ? 'high' : 'normal'}
              preloadNext={() => videoQueueManager.getNextVideoForPreload()}
              onTransitionStart={() => console.log(`🎬 Video ${item.id} starting`)}
              onTransitionEnd={() => console.log(`✅ Video ${item.id} ready`)}
            />
          </View>
        </TapGestureHandler>
        
        {/* Sound Wave Visualizer */}
        {isActive && soundWaveState?.isActive && !isTransitioning && (
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
            if (isTransitioning) return;
            
            const newHeartAnimation = {
              id: `heart_${Date.now()}_${heartAnimationCounter}`,
              position: { x: width - 50, y: height / 2 },
              intensity: 'normal',
              timestamp: Date.now()
            };
            
            setHeartAnimationQueue(prev => [...prev, newHeartAnimation]);
            setHeartAnimationCounter(prev => prev + 1);
          }}
          onCommentPress={() => {
            if (!isTransitioning) {
              navigation.navigate('CommentsScreen', { videoId: item.id });
            }
          }}
          onBookmarkPress={() => console.log('Bookmark press:', item.id)}
          onSharePress={() => console.log('Share press:', item.id)}
        />
        
        {/* Video Info */}
        <VideoInfo
          video={item}
          onSoundPress={(soundId) => handleSoundWavePress(item.id)}
          onUserPress={(userId) => console.log('User press:', userId)}
          onHashtagPress={(hashtag) => console.log('Hashtag press:', hashtag)}
          onLocationPress={(location) => console.log('Location press:', location)}
          isVisible={!isTransitioning}
        />
      </View>
    );
  }, [currentIndex, soundWaveStates, lastTapPosition, navigation, handleDoubleTap, heartAnimationCounter, isTransitioning]);

  // Item layout
  const getItemLayout = useCallback((data, index) => ({
    length: height,
    offset: height * index,
    index,
  }), []);

  // SIMPLIFIED: Scroll handling
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { 
      useNativeDriver: false,
      listener: (event) => {
        if (isTransitioning) return;
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
        {apiStatus === 'error' && (
          <Text style={styles.errorStatusText}>❌ Connection failed</Text>
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

      {/* Header */}
      <EnhancedFeedHeader 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        insets={insets}
        isSwipeInProgress={isTransitioning}
      />
      
      {/* Performance Indicator (Dev Only) */}
      {__DEV__ && (
        <View style={styles.performanceIndicator}>
          <Text style={styles.performanceText}>
            {renderingPerformance.fps}fps • {renderingPerformance.memoryUsage.toFixed(1)}MB • {apiStatus}
          </Text>
          <Text style={styles.debugText}>
            Vol: {(currentVideoVolume * 100).toFixed(0)}% • Waves: {Object.keys(soundWaveStates).length}
          </Text>
          <Text style={styles.transitionDebugText}>
            Transitioning: {isTransitioning ? '🎭' : '✅'}
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
        scrollEnabled={!isTransitioning}
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

      {/* SAFE: Particle Transition Effect Only */}
      {showParticleEffect && PERFECT_FEED_CONFIG.ENABLE_PARTICLE_EFFECTS && (
        <ParticleTransition
          isActive={showParticleEffect}
          particleCount={15}
          colors={['#FE2C55', '#25F4EE', '#FF6B9D', '#FFD700']}
          onComplete={handleParticleComplete}
        />
      )}
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
  errorStatusText: {
    color: '#FF3B30',
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
  debugText: {
    color: '#25F4EE',
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  transitionDebugText: {
    color: '#FE2C55',
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
  soundWaveContainer: {
    position: 'absolute',
    bottom: 200,
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

export default PerfectFeedScreen;