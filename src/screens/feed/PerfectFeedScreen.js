// src/screens/feed/PerfectFeedScreen.js
import React, { useState, useEffect, useRef, useMemo, useCallback, insets } from 'react';
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

// Components
import PerfectAdaptiveVideo from '../../components/video/PerfectAdaptiveVideo';
import VideoActionButtons from '../../components/feed/VideoActionButton';
import VideoInfo from '../../components/feed/VideoInfo';
import EnhancedFeedHeader, { FEED_TYPES } from '../../components/feed/EnhancedFeedHeader';
import EnhancedHeartAnimation from '../../components/feed/EnhancedHeartAnimation';

// Services & Utils
import FeedService from '../../services/FeedService';
import videoQueueManager from '../../utils/VideoQueueManager';

// Hooks 
import { useFeedLogic } from '../../hooks/useFeedLogic';

const { height, width } = Dimensions.get('window');

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
  
  // Performance state
  const [renderingPerformance, setRenderingPerformance] = useState({
    fps: 60,
    dropFrames: 0,
    memoryUsage: 0
  });
  
  // Heart animation state
  const [heartAnimations, setHeartAnimations] = useState({});
  const [lastTapPosition, setLastTapPosition] = useState(null);
  
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Refs for performance
  const flatListRef = useRef(null);
  const videoRefs = useRef({});
  const currentVideoRef = useRef(null);
  const performanceMonitorRef = useRef(null);
  const gestureStartTime = useRef(0);
  
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
        // Visual feedback during gesture
        const progress = Math.min(Math.abs(gestureState.dx) / width, 1);
        tabTransitionAnim.setValue(progress);
      },
      
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, dy, vx, vy } = gestureState;
        const gestureTime = Date.now() - gestureStartTime.current;
        
        // Reset transition animation
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
    
    return () => {
      videoQueueManager.reset();
      stopPerformanceMonitoring();
    };
  }, []);

  // Update video queue when videos change
  useEffect(() => {
    if (videos.length > 0) {
      videoQueueManager.setVideoQueue(videos, currentIndex);
    }
  }, [videos, currentIndex]);

  // Handle app state changes
  useFocusEffect(
    useCallback(() => {
      const handleAppStateChange = (nextAppState) => {
        if (nextAppState === 'active') {
          // Resume video and preloading
          playCurrentVideo();
        } else {
          // Pause all videos
          pauseAllVideos();
        }
      };

      const subscription = AppState.addEventListener('change', handleAppStateChange);
      
      // Handle Android back button
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        // Let the default behavior handle it
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
      
      // Determine if we got real API data
      const isApiData = loadedVideos.some(video => 
        video.videoUrl && (video.videoUrl.includes('pixabay') || video.videoUrl.includes('localhost'))
      );
      
      setVideos(loadedVideos);
      setApiStatus(isApiData ? 'api' : 'mock');
      
      console.log(`📱 Loaded ${loadedVideos.length} videos from ${isApiData ? 'API' : 'mock data'}`);
      
      // Start playing the first video
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
      
      // Reset to first video
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
    }
  };

  // Pause all videos
  const pauseAllVideos = () => {
    Object.values(videoRefs.current).forEach(videoRef => {
      if (videoRef) {
        videoRef.pauseAsync().catch(() => {}); // Ignore errors
      }
    });
  };

  // Handle viewability changes
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
        videoQueueManager.updateCurrentIndex(newIndex);
        
        // Pause all videos except the current one
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

  // Handle double tap for hearts
  const handleDoubleTap = (videoId, tapPosition) => {
    setLastTapPosition(tapPosition);
    setHeartAnimations(prev => ({ ...prev, [videoId]: true }));
    
    // Enhanced haptic feedback
    if (PERFECT_FEED_CONFIG.HAPTIC_FEEDBACK_ENABLED) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    
    // Auto-hide heart animation
    setTimeout(() => {
      setHeartAnimations(prev => ({ ...prev, [videoId]: false }));
    }, 1500);
  };

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      const refreshedVideos = await FeedService.loadVideos(true);
      setVideos(refreshedVideos);
      setCurrentIndex(0);
      
      // Reset video queue
      videoQueueManager.setVideoQueue(refreshedVideos, 0);
      
      // Scroll to top
      if (flatListRef.current && refreshedVideos.length > 0) {
        flatListRef.current.scrollToIndex({ index: 0, animated: true });
      }
    } catch (error) {
      console.error('Error refreshing videos:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Render individual video item
  const renderVideoItem = useCallback(({ item, index }) => {
    const isActive = index === currentIndex;
    const isHeartAnimationVisible = heartAnimations[item.id] || false;
    
    return (
      <View style={styles.videoItemContainer}>
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
        
        {/* Heart Animation */}
        <EnhancedHeartAnimation
          isVisible={isHeartAnimationVisible}
          onAnimationEnd={() => setHeartAnimations(prev => ({ ...prev, [item.id]: false }))}
          size="large"
          tapPosition={lastTapPosition}
          intensity="strong"
        />
        
        {/* Video Actions */}
        <VideoActionButtons
          video={item}
          isLiked={false} // You can manage this state
          isBookmarked={false} // You can manage this state
          onUserProfilePress={(userId) => console.log('Profile press:', userId)}
          onLikePress={() => handleDoubleTap(item.id, { x: width - 50, y: height / 2 })}
          onCommentPress={() => navigation.navigate('CommentsScreen', { videoId: item.id })}
          onBookmarkPress={() => console.log('Bookmark press:', item.id)}
          onSharePress={() => console.log('Share press:', item.id)}
        />
        
        {/* Video Info */}
        <VideoInfo
          video={item}
          onSoundPress={(soundId) => console.log('Sound press:', soundId)}
          onUserPress={(userId) => console.log('User press:', userId)}
          onHashtagPress={(hashtag) => console.log('Hashtag press:', hashtag)}
          onLocationPress={(location) => console.log('Location press:', location)}
          isVisible={true}
        />
      </View>
    );
  }, [currentIndex, heartAnimations, lastTapPosition, navigation]);

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
    top: insets?.top + 50 || 50,
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
  videoItemContainer: {
    width,
    height,
  },
});

export default PerfectFeedScreen;