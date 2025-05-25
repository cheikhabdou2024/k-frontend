// src/screens/feed/FeedScreen.js - Final Integration Version
import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useVideoPreloader } from '../../hooks/useVideoPreLoader';
import { useVideoLoadingManager } from '../../hooks/useVideoLoadingManager';




// Components
import VideoItem from '../../components/feed/VideoItem';
import EnhancedFeedHeader , { FEED_TYPES } from '../../components/feed/EnhancedFeedHeader';

// Hooks 
import { useFeedLogic } from '../../hooks/useFeedLogic';
import { useEnhancedSwipeGestures } from '../../hooks/useEnhancedSwipeGestures';

// Services - Updated to use real API
import FeedService from '../../services/FeedService';

// Utils
import { VIEWABILITY_CONFIG } from '../../utils/videoUtils';

const { height, width } = Dimensions.get('window');

const EnhancedFeedScreen = () => {
  const [activeTab, setActiveTab] = useState(FEED_TYPES.FOR_YOU);
  const [videos, setVideos] = useState([]);
  const [hasMoreVideos, setHasMoreVideos] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [apiStatus, setApiStatus] = useState('loading'); // 'loading', 'api', 'mock'
  const [isTabSwitching, setIsTabSwitching] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  
  // Refs
  const tabSwitchAnimRef = useRef(new Animated.Value(0)).current;
  const lastSwipeTime = useRef(0);


  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Use custom hook for feed logic
  const {
    currentIndex,
    loading,
    refreshing,
    videoLoading,
    showHeartAnimation,
    playbackStatus,
    showPlayPauseIndicator,
    isVideoPaused,
    bookmark,
    flatListRef,
    videoRefs,
    scrollY,
    onVideoLoadStart,
    onVideoLoad,
    onVideoError,
    onHeartAnimationEnd,
    handleLikeVideo,
    handleVideoTap,
    onPlaybackStatusUpdate,
    handleScroll,
    onViewableItemsChanged,
    handleCommentPress,
    handleBookmarkPress,
    handleUserProfilePress,
    handleSharePress,
    handleSoundPress,
    setLoading,
    setRefreshing,
  } = useFeedLogic(videos, navigation);
   
 // NEW: Video optimization hooks
  const preloaderAPI = useVideoPreloader(videos, currentIndex);
  const loadingAPI = useVideoLoadingManager(videos, currentIndex);


  // Enhanced swipe gesture handlers
  const swipeGestureHandlers = useEnhancedSwipeGestures({
    onSwipeUp: (swipeData) => {
      console.log('🔼 Swipe Up - Next Video');
      scrollToNextVideo();
    },
    
    onSwipeDown: (swipeData) => {
      console.log('🔽 Swipe Down - Previous Video');
      scrollToPreviousVideo();
    },
    
    onSwipeLeft: (swipeData) => {
      console.log('👈 Swipe Left - Next Tab');
      switchToNextTab();
    },
    
    onSwipeRight: (swipeData) => {
      console.log('👉 Swipe Right - Previous Tab');
      switchToPreviousTab();
    },
    
    onSwipeStart: (position) => {
      setSwipeProgress(0);
    },
    
    onSwipeEnd: (data) => {
      setSwipeProgress(0);
      setIsTabSwitching(false);
    },
    
    disabled: isTabSwitching || loading,
  });

  // Tab switching logic
  const switchToNextTab = () => {
    const tabs = [FEED_TYPES.FOLLOWING, FEED_TYPES.FOR_YOU];
    const currentIndex = tabs.indexOf(activeTab);
    const nextIndex = (currentIndex + 1) % tabs.length;
    const nextTab = tabs[nextIndex];
    
    if (nextTab !== activeTab) {
      animateTabSwitch(nextTab);
    }
  };

  const switchToPreviousTab = () => {
    const tabs = [FEED_TYPES.FOLLOWING, FEED_TYPES.FOR_YOU];
    const currentIndex = tabs.indexOf(activeTab);
    const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
    const prevTab = tabs[prevIndex];
    
    if (prevTab !== activeTab) {
      animateTabSwitch(prevTab);
    }
  };

  const animateTabSwitch = (newTab) => {
    // Prevent rapid tab switching
    const now = Date.now();
    if (now - lastSwipeTime.current < 500) return;
    lastSwipeTime.current = now;
    
    setIsTabSwitching(true);
    
    // Haptic feedback for tab switch
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Animate tab transition
    Animated.sequence([
      Animated.timing(tabSwitchAnimRef, {
        toValue: 0.5,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(tabSwitchAnimRef, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsTabSwitching(false);
    });
    
    // Switch tab
    handleTabChange(newTab);
  };

  // Video navigation with smooth scrolling
  const scrollToNextVideo = () => {
    if (!flatListRef.current || videos.length === 0) return;
    
    const nextIndex = Math.min(currentIndex + 1, videos.length - 1);
    if (nextIndex !== currentIndex) {
      flatListRef.current.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }
  };

  const scrollToPreviousVideo = () => {
    if (!flatListRef.current || videos.length === 0) return;
    
    const prevIndex = Math.max(currentIndex - 1, 0);
    if (prevIndex !== currentIndex) {
      flatListRef.current.scrollToIndex({
        index: prevIndex,
        animated: true,
      });
    }
  };






  // Load videos when component mounts
  useEffect(() => {
    loadInitialVideos();
  }, []);

  // Reload videos when tab changes
  useEffect(() => {
    if (videos.length > 0) {
      loadVideosByTab(activeTab);
    }
  }, [activeTab]);

  // Load initial videos with API status tracking
  const loadInitialVideos = async () => {
    try {
      setLoading(true);
      setApiStatus('loading');
      console.log('📱 Enhanced FeedScreen: Chargement des videos initiales');
      
      const loadedVideos = await FeedService.loadVideos();
      
      // Check if we got real API data or mock data
      const isApiData = loadedVideos.some(video => 
        video.videoUrl && video.videoUrl.includes('pixabay')
      );
      
      setVideos(loadedVideos);
      setCurrentPage(1);
      setApiStatus(isApiData ? 'api' : 'mock');
      
      console.log(`📱 FeedScreen: Loaded ${loadedVideos.length} videos from ${isApiData ? 'API' : 'mock'}`);
      
    } catch (error) {
      console.error('📱 FeedScreen: Error loading initial videos:', error);
      setApiStatus('mock');
    } finally {
      setLoading(false);
    }
  };

  // Load videos by tab with API status tracking
  const loadVideosByTab = async (feedType) => {
    try {
      console.log(`📱 FeedScreen: Loading ${feedType} videos...`);
      
      const { videos: loadedVideos, hasMore } = await FeedService.loadVideosByFeedType(
        feedType.toLowerCase(), 
        1, 
        10
      );
      
      setVideos(loadedVideos);
      setHasMoreVideos(hasMore);
      setCurrentPage(1);
      
      // Reset to first video
      if (flatListRef.current && loadedVideos.length > 0) {
        flatListRef.current.scrollToIndex({ index: 0, animated: true });
      }
      
      console.log(`📱 FeedScreen: Loaded ${loadedVideos.length} ${feedType} videos`);
      
    } catch (error) {
      console.error(`📱 FeedScreen: Error loading ${feedType} videos:`, error);
    }
  };


  // Handle tab change
  const handleTabChange = (tab) => {
    console.log(`📱 FeedScreen: Tab changed to ${tab}`);
    setActiveTab(tab);
  };


  // Handle pull-to-refresh
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      console.log('📱 FeedScreen: Refreshing videos...');
      
      const loadedVideos = await FeedService.loadVideos(true);
      setVideos(loadedVideos);
      setCurrentPage(1);
      setHasMoreVideos(true);
      
      // Reset to first video
      if (flatListRef.current && loadedVideos.length > 0) {
        flatListRef.current.scrollToIndex({ index: 0, animated: true });
      }
      
      console.log(`📱 FeedScreen: Refreshed with ${loadedVideos.length} videos`);
      
    } catch (error) {
      console.error('📱 FeedScreen: Error refreshing videos:', error);
    } finally {
      setRefreshing(false);
    }
  };

  

  // Handle like video with API call
  const handleLikeVideoWithAPI = async (videoId, doubleTap = false) => {
    try {
      console.log(`📱 FeedScreen: Liking video ${videoId}`);
      
      // Optimistically update UI
      setVideos(prevVideos => 
        prevVideos.map(video => {
          if (video.id === videoId) {
            const newLikeStatus = !video.isLiked;
            return {
              ...video,
              isLiked: newLikeStatus,
              likes: newLikeStatus 
                ? video.likes + 1 
                : Math.max(0, video.likes - 1)
            };
          }
          return video;
        })
      );
      
      // Call the hook's like handler for animations
      handleLikeVideo(videoId, doubleTap);
      
      // Make API call
      const video = videos.find(v => v.id === videoId);
      if (video) {
        await FeedService.toggleVideoLike(videoId, video.isLiked);
        console.log(`✅ Successfully liked video ${videoId}`);
      }
    } catch (error) {
      console.error('❌ Error liking video:', error);
      // Revert optimistic update on error
      setVideos(prevVideos => 
        prevVideos.map(video => {
          if (video.id === videoId) {
            return {
              ...video,
              isLiked: !video.isLiked,
              likes: video.isLiked 
                ? video.likes + 1 
                : Math.max(0, video.likes - 1)
            };
          }
          return video;
        })
      );
    }
  };

  // Handle load more videos (infinite scroll)
  const handleLoadMore = async () => {
    if (!hasMoreVideos || loading || refreshing) return;
    
    try {
      console.log('📱 FeedScreen: Loading more videos...');
      
      const nextPage = currentPage + 1;
      const { videos: moreVideos, hasMore } = await FeedService.loadVideosByFeedType(
        activeTab.toLowerCase(),
        nextPage,
        5 // Load fewer videos for pagination
      );
      
      setVideos(prevVideos => [...prevVideos, ...moreVideos]);
      setHasMoreVideos(hasMore);
      setCurrentPage(nextPage);
      
      console.log(`📱 FeedScreen: Loaded ${moreVideos.length} more videos`);
      
    } catch (error) {
      console.error('📱 FeedScreen: Error loading more videos:', error);
    }
  };

  // Enhanced bookmark handler with API
  const handleBookmarkWithAPI = async (videoId) => {
    try {
      console.log(`📱 FeedScreen: Bookmarking video ${videoId}`);
      
      const currentStatus = bookmark[videoId] || false;
      
      // Optimistically update UI
      handleBookmarkPress(videoId);
      
      // Make API call
      await FeedService.toggleBookmark(videoId, currentStatus);
      console.log(`✅ Successfully bookmarked video ${videoId}`);
      
    } catch (error) {
      console.error('❌ Error bookmarking video:', error);
      // Revert on error
      handleBookmarkPress(videoId);
    }
  };

  // Enhanced share handler with API
  const handleShareWithAPI = async (videoId) => {
    try {
      console.log(`📱 FeedScreen: Sharing video ${videoId}`);
      
      const result = await FeedService.shareVideo(videoId);
      if (result.success) {
        console.log('✅ Share URL:', result.shareUrl);
        // Here you could show a share sheet or copy to clipboard
      }
    } catch (error) {
      console.error('❌ Error sharing video:', error);
    }
  };

  // Render a single video item
  const renderItem = ({ item, index }) => (
    <Animated.View 
      style={{
        opacity: tabSwitchAnimRef.interpolate({
          inputRange: [0, 0.5],
          outputRange: [1, 0.8],
        }),
        transform: [{
          scale: tabSwitchAnimRef.interpolate({
            inputRange: [0, 0.5],
            outputRange: [1, 0.98],
          })
        }]
      }}
    >
    <VideoItem
      item={item}
      index={index}
      currentIndex={currentIndex}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      insets={insets}
      videoLoading={videoLoading}
      showHeartAnimation={showHeartAnimation}
      showPlayPauseIndicator={showPlayPauseIndicator}
      isVideoPaused={isVideoPaused}
      playbackStatus={playbackStatus}
      bookmark={bookmark}
      videoRefs={videoRefs}
      onVideoTap={handleVideoTap}
      onVideoLoadStart={onVideoLoadStart}
      onVideoLoad={onVideoLoad}
      onVideoError={onVideoError}
      onPlaybackStatusUpdate={onPlaybackStatusUpdate}
      onUserProfilePress={handleUserProfilePress}
      onLikeVideo={handleLikeVideoWithAPI}
      onCommentPress={handleCommentPress}
      onBookmarkPress={handleBookmarkWithAPI}
      onSharePress={handleShareWithAPI}
      onSoundPress={handleSoundPress}
      onHeartAnimationEnd={onHeartAnimationEnd}
    />
    </Animated.View>
  );

  // Render loading footer for infinite scroll
  const renderLoadingFooter = () => {
    if (!hasMoreVideos) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#FE2C55" />
      </View>
    );
  };

  // Render loading state with API status
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FE2C55" />
        <Text style={styles.loadingText}>
          {apiStatus === 'loading' 
            ? 'Connecting to API...' 
            : 'Chargement Des Videos'
          }
        </Text>
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
    <View style={styles.container}>
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
        swipeProgress={swipeProgress}
        isSwipeInProgress={isTabSwitching}
      />
      
      {/* Status indicator */}
      {apiStatus === 'api' && (
        <View style={styles.apiIndicator}>
          <Text style={styles.apiIndicatorText}>🔗 Live API</Text>
        </View>
      )}
      
      {/* Video List */}
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
        onScroll={handleScroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FE2C55"
            colors={["#FE2C55"]}
            progressBackgroundColor="#000"
            progressViewOffset={insets.top + 50}
          />
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={2}
        windowSize={3}
        initialNumToRender={1}
        bounces={true}
        bouncesZoom={false}
        scrollEventThrottle={16}
        getItemLayout={(data, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
      />

        {/* Swipe feedback overlay */}
      {isTabSwitching && (
        <View style={styles.swipeFeedbackOverlay}>
          <Animated.View 
            style={[
              styles.swipeFeedbackIndicator,
              {
                opacity: tabSwitchAnimRef.interpolate({
                  inputRange: [0, 0.5],
                  outputRange: [0, 1],
                }),
                transform: [{
                  scale: tabSwitchAnimRef.interpolate({
                    inputRange: [0, 0.5],
                    outputRange: [0.8, 1],
                  })
                }]
              }
            ]}
          >
            <Text style={styles.swipeFeedbackText}>Switching tabs...</Text>
          </Animated.View>
        </View>
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
  apiIndicator: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1000,
  },
  apiIndicatorText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  swipeFeedbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 999,
  },
  swipeFeedbackIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  swipeFeedbackText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default EnhancedFeedScreen;