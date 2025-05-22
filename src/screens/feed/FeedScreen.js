import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Dimensions, 
  TouchableOpacity, 
  StatusBar, 
  ActivityIndicator, 
  Text, 
  Image,
  Animated,
  RefreshControl,
  Platform,
  Alert
} from 'react-native';
import { Video } from 'expo-av';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import VideoCaption from '../../components/feed/EnhancedVideoCaption';
import VideoLoadingSpinner from '../../components/feed/VideoLoadingSpinner';
import HeartAnimation from '../../components/feed/EnhancedHeartAnimation';
import FeedScrollIndicator from '../../components/feed/FeedScrollIndicator';
import EnhancedFeedHeader from '../../components/feed/EnhancedFeedHeader';
import SoundDisk from '../../components/feed/SoundDisk';
import { formatCount } from '../../utils/formatters';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/video/ProgressBar';
import PlayPauseIndicator from '../../components/video/PlayPauseIndicator';
import { videoService } from '../../services/api';
import CommentsScreen from './CommentsScreen';

const { width, height } = Dimensions.get('window');

// Feed types
export const FEED_TYPES = {
  FOR_YOU: 'for_you',
  FOLLOWING: 'following',
};

const FeedScreen = () => {
  const [activeTab, setActiveTab] = useState(FEED_TYPES.FOR_YOU);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [videos, setVideos] = useState([]);
  const [videoLoading, setVideoLoading] = useState({});
  const [showHeartAnimation, setShowHeartAnimation] = useState({});
  const [playbackStatus, setPlaybackStatus] = useState({});
  const [showPlayPauseIndicator, setShowPlayPauseIndicator] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [bookmarked, setBookmarked] = useState({});
  const [muted, setMuted] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  
  // Animated value for scroll position
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Track last tap time for double tap detection
  const lastTapTimeRef = useRef({});
  const doubleTapTimeoutRef = useRef(null);
  const flatListRef = useRef(null);
  const videoRefs = useRef({});

  // Load videos when component mounts
  useEffect(() => {
    loadVideos();
  }, []);

  // Handle app foreground/background state
  useFocusEffect(
    React.useCallback(() => {
      if (isFocused) {
        const currentVideoRef = videoRefs.current[videos[currentIndex]?.id];
        if (currentVideoRef) {
          currentVideoRef.playAsync();
        }
      }

      return () => {
        // Pause all videos when screen loses focus
        Object.values(videoRefs.current).forEach(videoRef => {
          if (videoRef) {
            videoRef.pauseAsync();
          }
        });
      };
    }, [currentIndex, videos, isFocused])
  );

  // Load videos function (initial or refresh)
  const loadVideos = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await videoService.getVideos(1, 10);
      
      if (response && response.videos) {
        setVideos(response.videos);
        setPagination(response.pagination || {
          total: response.videos.length,
          page: 1,
          limit: 10,
          totalPages: 1
        });
      }
    } catch (error) {
      console.error('Error loading videos:', error);
      Alert.alert('Error', 'Failed to load videos. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle load more videos when reaching end of list
  const loadMoreVideos = async () => {
    if (pagination.page >= pagination.totalPages) return;
    
    try {
      const nextPage = pagination.page + 1;
      const response = await videoService.getVideos(nextPage, pagination.limit);
      
      if (response && response.videos) {
        setVideos(prev => [...prev, ...response.videos]);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error loading more videos:', error);
    }
  };

  // Handle pull-to-refresh
  const handleRefresh = () => {
    loadVideos(true);
  };

  // Handle video loading state change
  const onVideoLoadStart = useCallback((videoId) => {
    setVideoLoading(prev => ({ ...prev, [videoId]: true }));
  }, []);

  // Handle video ready state
  const onVideoLoad = useCallback((videoId) => {
    setVideoLoading(prev => ({ ...prev, [videoId]: false }));
  }, []);

  // Handle playback errors
  const onVideoError = useCallback((videoId, error) => {
    console.error(`Error loading video ${videoId}:`, error);
    setVideoLoading(prev => ({ ...prev, [videoId]: false }));
  }, []);
  
  // Toggle mute state
  const toggleMute = useCallback(() => {
    setMuted(!muted);
    
    // Apply to current video
    const currentVideoRef = videoRefs.current[videos[currentIndex]?.id];
    if (currentVideoRef) {
      currentVideoRef.setIsMutedAsync(!muted);
    }
  }, [muted, currentIndex, videos]);
  
  // Handle heart animation end
  const onHeartAnimationEnd = useCallback((videoId) => {
    setShowHeartAnimation(prev => ({ ...prev, [videoId]: false }));
  }, []);
  
  // Handle comments press
 // In your FeedScreen.js, update the handleCommentPress function with debugging
const handleCommentPress = async (videoId) => {
  console.log('=== COMMENT BUTTON PRESSED ===');
  console.log('Video ID:', videoId);
  console.log('Navigation object:', navigation);
  
  try {
    // Pause current video before opening comments
    const currentVideoRef = videoRefs.current[videoId];
    if (currentVideoRef) {
      console.log('Pausing video...');
      await currentVideoRef.pauseAsync();
    }
    
    console.log('Navigating to CommentsScreen...');
    navigation.navigate('CommentsScreen', { 
      videoId,
      onClose: () => {
        console.log('Comments closed, resuming video...');
        // Resume video when comments are closed
        if (currentVideoRef && isFocused) {
          currentVideoRef.playAsync();
        }
      }
    });
    console.log('Navigation call completed');
  } catch (error) {
    console.error('Error in handleCommentPress:', error);
  }
};

  // Handle bookmark press
  const handleBookmarkPress = (videoId) => {
    setBookmarked(prev => ({ 
      ...prev, 
      [videoId]: !prev[videoId] 
    }));
  };
  
  // Handle like action
  const handleLikeVideo = useCallback((videoId, doubleTap = false) => {
    // Update videos array to toggle like status
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
    
    // If it's a double tap, show heart animation
    if (doubleTap) {
      setShowHeartAnimation(prev => ({ ...prev, [videoId]: true }));
    }
  }, []);
  
  // Handle single tap on video (for play/pause)
  const handleVideoTap = useCallback((videoId) => {
    const now = Date.now();
    const lastTap = lastTapTimeRef.current[videoId] || 0;
    const timeDiff = now - lastTap;
    
    // Clear any existing timeout for single tap actions
    if (doubleTapTimeoutRef.current) {
      clearTimeout(doubleTapTimeoutRef.current);
    }
    
    // Check if this is a double tap (time difference less than 300ms)
    if (timeDiff < 300) {
      // Double tap detected - like the video
      handleLikeVideo(videoId, true);
    } else {
      // Set a timeout for single tap action (play/pause)
      doubleTapTimeoutRef.current = setTimeout(() => {
        const videoRef = videoRefs.current[videoId];
        if (videoRef) {
          videoRef.getStatusAsync().then(status => {
            const newPlayingState = !status.isPlaying;
            setIsVideoPaused(!newPlayingState);
            setShowPlayPauseIndicator(true);
            
            // Hide indicator after a brief delay
            setTimeout(() => {
              setShowPlayPauseIndicator(false);
            }, 1000);
            
            if (newPlayingState) {
              videoRef.playAsync();
            } else {
              videoRef.pauseAsync();
            }
          });
        }
      }, 300); // Wait for potential second tap
    }
    
    // Update last tap time
    lastTapTimeRef.current[videoId] = now;
  }, [handleLikeVideo]);

  // Function to track playback status:
  const onPlaybackStatusUpdate = useCallback((status, videoId) => {
    if (videoId === videos[currentIndex]?.id) {
      setPlaybackStatus(status);
    }
  }, [currentIndex, videos]);

  // Handle scroll events to update animation values
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { 
      useNativeDriver: false
    }
  );

  // Handle video viewability change
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      setCurrentIndex(index);

      // Pause all videos then play the current one
      Object.keys(videoRefs.current).forEach(key => {
        const videoRef = videoRefs.current[key];
        if (videoRef) {
          videoRef.pauseAsync();
        }
      });

      const currentVideoRef = videoRefs.current[viewableItems[0].item.id];
      if (currentVideoRef) {
        // Apply current mute setting
        currentVideoRef.setIsMutedAsync(muted);
        currentVideoRef.playAsync();
      }
    }
  }).current;

  // Configuration for viewability
  const viewabilityConfig = {
    itemVisiblePercentThreshold: 60,
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setLoading(true);
    
    // Pause current video
    const currentVideoRef = videoRefs.current[videos[currentIndex]?.id];
    if (currentVideoRef) {
      currentVideoRef.pauseAsync();
    }
    
    // Load different videos based on the tab
    const fetchVideos = async () => {
      try {
        let response;
        if (tab === FEED_TYPES.FOLLOWING) {
          // In a real app, we would need auth token here
          // response = await videoService.getFollowingVideos(token);
          
          // For now, just fetch regular videos as a placeholder
          response = await videoService.getVideos(1, 10);
        } else {
          response = await videoService.getVideos(1, 10);
        }
        
        if (response && response.videos) {
          setVideos(response.videos);
          setPagination(response.pagination);
        }
      } catch (error) {
        console.error(`Error loading ${tab} videos:`, error);
        Alert.alert('Error', 'Failed to load videos. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideos();
  };

  // Handle sound press
  const handleSoundPress = (soundId) => {
    // In a real app, navigate to sound details page
    console.log('Navigate to sound details:', soundId);
  };
  
  // Handle share action
  const handleSharePress = (videoId) => {
    // In a real app, open share sheet or modal
    console.log('Share video:', videoId);
  };
  
  // Render a single video item
  const renderItem = ({ item, index }) => {
    const isActive = index === currentIndex;
    const isVideoLoading = videoLoading[item.id];
    const isHeartAnimationVisible = showHeartAnimation[item.id] || false;
    const isBookmarked = bookmarked[item.id] || false;

    return (
      <View style={styles.videoContainer}>
        {/* Video component */}
        <Video
          ref={ref => { videoRefs.current[item.id] = ref; }}
          source={{ uri: item.url }}
          style={styles.video}
          resizeMode="cover"
          shouldPlay={isActive && isFocused}
          isLooping
          isMuted={muted}
          useNativeControls={false}
          onLoadStart={() => onVideoLoadStart(item.id)}
          onLoad={() => onVideoLoad(item.id)}
          onError={(error) => onVideoError(item.id, error)}
          rate={1.0}
          onPlaybackStatusUpdate={(status) => onPlaybackStatusUpdate(status, item.id)}
        />
        
        {/* Video controls with gradients and overlays */}
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'transparent']}
          style={styles.topGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.6)']}
          style={styles.gradientOverlay}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        
        <TouchableOpacity
          activeOpacity={1}
          style={StyleSheet.absoluteFill}
          onPress={() => handleVideoTap(item.id)}
        >
          {/* Loading Spinner */}
          <VideoLoadingSpinner 
            isVisible={isVideoLoading} 
            size="medium" 
          />
          
          {/* PlayPause Indicator */}
          <PlayPauseIndicator 
            isPlaying={!isVideoPaused}
            isVisible={showPlayPauseIndicator && isActive} 
          />

          {/* Progress Bar */}
          <ProgressBar 
            progress={
              item.id === videos[currentIndex]?.id && 
              playbackStatus.positionMillis && 
              playbackStatus.durationMillis ? 
                playbackStatus.positionMillis / playbackStatus.durationMillis : 0
            }
            isVisible={isActive}
          />

          {/* Heart Animation */}
          <HeartAnimation
            isVisible={isHeartAnimationVisible}
            onAnimationEnd={() => onHeartAnimationEnd(item.id)}
            size="large"
          />
          
          {/* User Info Overlay */}
          <View style={styles.userInfoContainer}>
            {/* Username and caption */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile', {
                screen: 'ProfileHome',
                params: { userId: item.userId }
              })}
            >
              <Text style={styles.videoUsername}>@{item.author?.username || 'username'}</Text>
            </TouchableOpacity>
            
            {/* Caption */}
            <VideoCaption 
              caption={item.description || ''}
              username=""
              onHashtag={(hashtag) => console.log('Navigate to hashtag:', hashtag)}
              onUserMention={(username) => console.log('Navigate to user:', username)}
              maxLines={3}
            />
            
            {/* Sound info */}
            <TouchableOpacity 
              style={styles.soundInfo}
              onPress={() => handleSoundPress(item.soundId)}
            >
              <SoundDisk
                imageUrl={item.author?.avatar || 'https://randomuser.me/api/portraits/men/32.jpg'}
                soundName={item.title || 'Original Sound'}
                isActive={isActive}
                size="small"
              />
            </TouchableOpacity>
          </View>
          
          {/* Action Buttons - Right Side */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Profile', {
                screen: 'ProfileHome',
                params: { userId: item.userId }
              })}
            >
              <View style={styles.profileContainer}>
                <Image
                  source={{ uri: item.author?.avatar || 'https://randomuser.me/api/portraits/men/32.jpg' }}
                  style={styles.profileImage}
                />
                <View style={styles.followButton}>
                  <Ionicons name="add" size={12} color="#FFF" />
                </View>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleLikeVideo(item.id)}
            >
              <Animatable.View 
                animation={item.isLiked ? "pulse" : undefined}
                style={styles.iconContainer}
              >
                <Ionicons 
                  name={item.isLiked ? "heart" : "heart-outline"} 
                  size={30} 
                  color={item.isLiked ? "#FE2C55" : "#FFF"} 
                />
              </Animatable.View>
              <Text style={styles.actionText}>{formatCount(item.likes || 0)}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleCommentPress(item.id)}
            > 
              <View style={styles.iconContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={28} color="#FFF" />
              </View>
              <Text style={styles.actionText}>{formatCount(item.comments || 12)}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleBookmarkPress(item.id)}
            >
              <View style={styles.iconContainer}>
                <Ionicons 
                  name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                  size={28} 
                  color={isBookmarked ? "#25F4EE" : "#FFF"} 
                />
              </View>
              <Text style={styles.actionText}>Save</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleSharePress(item.id)}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="arrow-redo-outline" size={28} color="#FFF" />
              </View>
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
            
            {/* Mute/Unmute button */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={toggleMute}
            >
              <View style={styles.iconContainer}>
                <Ionicons 
                  name={muted ? "volume-mute" : "volume-medium"} 
                  size={28} 
                  color="#FFF" 
                />
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FE2C55" />
        <Text style={styles.loadingText}>Loading awesome videos...</Text>
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
      
      {/* Enhanced Feed Header */}
      <EnhancedFeedHeader
        activeTab={activeTab}
        onChangeTab={handleTabChange}
      />
      
      {/* Scroll Indicator */}
      <FeedScrollIndicator
        currentIndex={currentIndex}
        totalVideos={videos.length}
        scrollY={scrollY}
        height={height * 0.3}
      />
      
      {/* Video List */}
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
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
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FE2C55"
            colors={["#FE2C55"]}
            progressBackgroundColor="#000"
            progressViewOffset={insets.top + 50}
          />
        }
        onEndReached={loadMoreVideos}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={Platform.OS === 'android'}
        maxToRenderPerBatch={2}
        windowSize={3}
        initialNumToRender={1}
        updateCellsBatchingPeriod={100}
        bounces={true}
        bouncesZoom={false}
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
  },
  videoContainer: {
    width,
    height,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
    backgroundColor: '#000',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 1,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.6,
    zIndex: 1,
  },
  userInfoContainer: {
    position: 'absolute',
    bottom: 130,
    left: 16,
    right: 80,
    zIndex: 10,
  },
  videoUsername: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  soundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  actionButtons: {
    position: 'absolute',
    right: 12,
    bottom: 130,
    alignItems: 'center',
    zIndex: 10,
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 14,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  profileContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFF',
    marginBottom: 16, 
    position: 'relative',
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  followButton: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FE2C55',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FeedScreen;