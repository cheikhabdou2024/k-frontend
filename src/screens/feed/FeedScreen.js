// src/screens/feed/FeedScreen.js - Final Integration Version
import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Dimensions, 
  StatusBar, 
  ActivityIndicator, 
  Text,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

// Components
import VideoItem from '../../components/feed/VideoItem';
import FeedHeader, { FEED_TYPES } from '../../components/feed/FeedHeader';

// Hooks
import { useFeedLogic } from '../../hooks/useFeedLogic';

// Services - Updated to use real API
import FeedService from '../../services/FeedService';

// Utils
import { VIEWABILITY_CONFIG } from '../../utils/videoUtils';

const { height } = Dimensions.get('window');

const FeedScreen = () => {
  const [activeTab, setActiveTab] = useState(FEED_TYPES.FOR_YOU);
  const [videos, setVideos] = useState([]);
  const [hasMoreVideos, setHasMoreVideos] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [apiStatus, setApiStatus] = useState('loading'); // 'loading', 'api', 'mock'
  
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
      console.log('📱 FeedScreen: Loading initial videos...');
      
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

  // Handle tab change
  const handleTabChange = (tab) => {
    console.log(`📱 FeedScreen: Tab changed to ${tab}`);
    setActiveTab(tab);
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
            : 'Loading awesome videos...'
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
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderLoadingFooter}
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
        getItemLayout={(data, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
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
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default FeedScreen;