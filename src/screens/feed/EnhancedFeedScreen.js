// src/screens/feed/EnhancedFeedScreen.js - IMPROVED VERSION
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
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

// Components
import VideoItem from '../../components/feed/VideoItem';
import EnhancedFeedHeader, { FEED_TYPES } from '../../components/feed/EnhancedFeedHeader';

// Hooks 
import { useFeedLogic } from '../../hooks/useFeedLogic';

// Services
import FeedService from '../../services/FeedService';

// Utils
import { VIEWABILITY_CONFIG } from '../../utils/videoUtils';

const { height, width } = Dimensions.get('window');

const EnhancedFeedScreen = () => {
  const [activeTab, setActiveTab] = useState(FEED_TYPES.FOR_YOU);
  const [videos, setVideos] = useState([]);
  const [hasMoreVideos, setHasMoreVideos] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [apiStatus, setApiStatus] = useState('loading');
  const [isTabSwitching, setIsTabSwitching] = useState(false);
  
  // Gesture handling
  const [gestureState, setGestureState] = useState({
    isScrolling: false,
    lastSwipeTime: 0,
    swipeDirection: null,
  });

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Animation refs
  const tabSwitchAnimRef = useRef(new Animated.Value(0)).current;
  const gestureAnim = useRef(new Animated.Value(0)).current;

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

  // Enhanced Pan Responder for gesture handling
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Only capture horizontal swipes for tab switching
        const isHorizontalSwipe = Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30;
        return isHorizontalSwipe && !gestureState.isScrolling;
      },
      
      onPanResponderGrant: (evt, gestureState) => {
        const now = Date.now();
        if (now - gestureState.lastSwipeTime < 500) return; // Prevent rapid swipes
        
        setGestureState(prev => ({ ...prev, lastSwipeTime: now }));
        gestureAnim.setValue(0);
      },
      
      onPanResponderMove: (evt, gestureState) => {
        if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
          gestureAnim.setValue(gestureState.dx / width);
        }
      },
      
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, vx } = gestureState;
        const shouldSwitch = Math.abs(dx) > width * 0.25 || Math.abs(vx) > 0.5;
        
        if (shouldSwitch) {
          const direction = dx > 0 ? 'right' : 'left';
          handleTabSwipeGesture(direction);
        }
        
        // Reset animation
        Animated.spring(gestureAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // Handle tab swipe gestures
  const handleTabSwipeGesture = (direction) => {
    const tabs = [FEED_TYPES.FOLLOWING, FEED_TYPES.FOR_YOU];
    const currentIndex = tabs.indexOf(activeTab);
    
    let newIndex;
    if (direction === 'left') {
      newIndex = (currentIndex + 1) % tabs.length;
    } else {
      newIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
    }
    
    const newTab = tabs[newIndex];
    if (newTab !== activeTab) {
      setIsTabSwitching(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Animate tab transition
      Animated.sequence([
        Animated.timing(tabSwitchAnimRef, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(tabSwitchAnimRef, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsTabSwitching(false);
      });
      
      handleTabChange(newTab);
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

  // Load initial videos
  const loadInitialVideos = async () => {
    try {
      setLoading(true);
      setApiStatus('loading');
      console.log('📱 Loading initial videos...');
      
      const loadedVideos = await FeedService.loadVideos();
      
      const isApiData = loadedVideos.some(video => 
        video.videoUrl && video.videoUrl.includes('pixabay')
      );
      
      setVideos(loadedVideos);
      setCurrentPage(1);
      setApiStatus(isApiData ? 'api' : 'mock');
      
      console.log(`📱 Loaded ${loadedVideos.length} videos from ${isApiData ? 'API' : 'mock'}`);
      
    } catch (error) {
      console.error('📱 Error loading initial videos:', error);
      setApiStatus('mock');
    } finally {
      setLoading(false);
    }
  };

  // Load videos by tab
  const loadVideosByTab = async (feedType) => {
    try {
      console.log(`📱 Loading ${feedType} videos...`);
      
      const { videos: loadedVideos, hasMore } = await FeedService.loadVideosByFeedType(
        feedType.toLowerCase(), 
        1, 
        10
      );
      
      setVideos(loadedVideos);
      setHasMoreVideos(hasMore);
      setCurrentPage(1);
      
      // Reset to first video with smooth animation
      if (flatListRef.current && loadedVideos.length > 0) {
        flatListRef.current.scrollToIndex({ 
          index: 0, 
          animated: true,
          viewPosition: 0,
        });
      }
      
    } catch (error) {
      console.error(`📱 Error loading ${feedType} videos:`, error);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    console.log(`📱 Tab changed to ${tab}`);
    setActiveTab(tab);
  };

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      console.log('📱 Refreshing videos...');
      
      const loadedVideos = await FeedService.loadVideos(true);
      setVideos(loadedVideos);
      setCurrentPage(1);
      setHasMoreVideos(true);
      
      // Reset to first video
      if (flatListRef.current && loadedVideos.length > 0) {
        flatListRef.current.scrollToIndex({ index: 0, animated: true });
      }
      
    } catch (error) {
      console.error('📱 Error refreshing videos:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Enhanced like handler
  const handleLikeVideoWithAPI = async (videoId, doubleTap = false) => {
    try {
      // Optimistic update
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
      
      // Call animation handler
      handleLikeVideo(videoId, doubleTap);
      
      // API call
      const video = videos.find(v => v.id === videoId);
      if (video) {
        await FeedService.toggleVideoLike(videoId, video.isLiked);
      }
    } catch (error) {
      console.error('❌ Error liking video:', error);
      // Revert on error
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

  // Handle load more videos
  const handleLoadMore = async () => {
    if (!hasMoreVideos || loading || refreshing) return;
    
    try {
      const nextPage = currentPage + 1;
      const { videos: moreVideos, hasMore } = await FeedService.loadVideosByFeedType(
        activeTab.toLowerCase(),
        nextPage,
        5
      );
      
      setVideos(prevVideos => [...prevVideos, ...moreVideos]);
      setHasMoreVideos(hasMore);
      setCurrentPage(nextPage);
      
    } catch (error) {
      console.error('📱 Error loading more videos:', error);
    }
  };

  // Enhanced bookmark handler
  const handleBookmarkWithAPI = async (videoId) => {
    try {
      const currentStatus = bookmark[videoId] || false;
      handleBookmarkPress(videoId);
      await FeedService.toggleBookmark(videoId, currentStatus);
    } catch (error) {
      console.error('❌ Error bookmarking video:', error);
      handleBookmarkPress(videoId); // Revert
    }
  };

  // Render video item with enhanced animations
  const renderItem = ({ item, index }) => (
    <Animated.View 
      style={[
        styles.videoItemContainer,
        {
          opacity: tabSwitchAnimRef.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.7],
          }),
          transform: [
            {
              scale: tabSwitchAnimRef.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.95],
              })
            },
            {
              translateX: gestureAnim.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [-50, 0, 50],
              })
            }
          ]
        }
      ]}
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
        onSharePress={handleSharePress}
        onSoundPress={handleSoundPress}
        onHeartAnimationEnd={onHeartAnimationEnd}
        onSwipeUp={() => {
          if (currentIndex < videos.length - 1) {
            flatListRef.current?.scrollToIndex({ 
              index: currentIndex + 1, 
              animated: true 
            });
          }
        }}
        onSwipeDown={() => {
          if (currentIndex > 0) {
            flatListRef.current?.scrollToIndex({ 
              index: currentIndex - 1, 
              animated: true 
            });
          }
        }}
      />
    </Animated.View>
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FE2C55" />
        <Text style={styles.loadingText}>
          {apiStatus === 'loading' 
            ? 'Connecting to API...' 
            : 'Loading Videos...'
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
        isSwipeInProgress={isTabSwitching}
      />
      
      {/* API Status Indicator */}
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
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={true}
        maxToRenderPerBatch={2}
        windowSize={3}
        initialNumToRender={1}
        bounces={true}
        scrollEventThrottle={16}
        getItemLayout={(data, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
      />

      {/* Tab switching feedback */}
      {isTabSwitching && (
        <Animated.View style={[
          styles.swipeFeedbackOverlay,
          {
            opacity: tabSwitchAnimRef.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
          }
        ]}>
          <Text style={styles.swipeFeedbackText}>Switching tabs...</Text>
        </Animated.View>
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
  videoItemContainer: {
    width,
    height,
  },
  swipeFeedbackOverlay: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  swipeFeedbackText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
});

export default EnhancedFeedScreen;