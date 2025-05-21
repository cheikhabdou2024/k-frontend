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
  BackHandler,
  Platform
} from 'react-native';
import { Video } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import VideoCaption from '../../components/feed/EnhancedVideoCaption';
import VideoLoadingSpinner from '../../components/feed/VideoLoadingSpinner';
import HeartAnimation from '../../components/feed/EnhancedHeartAnimation';
import FeedScrollIndicator from '../../components/feed/FeedScrollIndicator';
import { formatCount } from '../../utils/formatters';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from '../../components/video/progressBar';
import PlayPauseIndicator from '../../components/video/PlayPauseIndicator';

const { width, height } = Dimensions.get('window');

// Feed types 
export const FEED_TYPES = {
  EXPLORE: 'explore',
  FOLLOWING: 'following',
  FOR_YOU: 'for_you',
};

// Mock video data
const mockVideos = [
  {
    id: '29',
    videoUrl: 'https://cdn.pixabay.com/video/2023/07/28/173530-849610807_large.mp4',
    thumbnailUrl: '',
    caption: 'Another cool video! #viral #dance',
    sound: { id: 's2', name: 'Popular Song' },
    likes: 5678,
    comments: 432,
    shares: 123,
    isLiked: false,
    location: 'London 🇬🇧❤️',
    user: {
      id: 'u2',
      username: 'creator2',
      avatarUrl: 'https://randomuser.me/api/portraits/women/32.jpg',
    }
  },
  {
    id: '31',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4',
    thumbnailUrl: '',
    caption: 'Check out this amazing sunset! 🌅 #nature #sunset #views',
    sound: { id: 's3', name: 'Chill Vibes' },
    likes: 9245,
    comments: 278,
    shares: 112,
    isLiked: false,
    user: {
      id: 'u3',
      username: 'naturelover',
      avatarUrl: 'https://randomuser.me/api/portraits/women/45.jpg',
    }
  },
  {
    id: '14',
    videoUrl: 'https://cdn.pixabay.com/video/2023/02/09/149935-797511795_large.mp4',
    thumbnailUrl: '',
    caption: 'This is an awesome video! #fyp #trending',
    sound: { id: 's1', name: 'Original Sound' },
    likes: 1234,
    comments: 123,
    shares: 45,
    isLiked: false,
    user: {
      id: 'u1',
      username: 'creator1',
      avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
    }
  },
  {
    id: '17',
    videoUrl: 'https://cdn.pixabay.com/video/2023/07/28/173530-849610807_large.mp4',
    thumbnailUrl: '',
    caption: 'Another cool video! #viral #dance',
    sound: { id: 's2', name: 'Popular Song' },
    likes: 5678,
    comments: 432,
    shares: 123,
    isLiked: false,
    user: {
      id: 'u2',
      username: 'creator2',
      avatarUrl: 'https://randomuser.me/api/portraits/women/32.jpg',
    }
  },
  {
    id: '18',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4',
    thumbnailUrl: '',
    caption: 'Check out this amazing sunset! 🌅 #nature #sunset #views',
    sound: { id: 's3', name: 'Chill Vibes' },
    likes: 9245,
    comments: 278,
    shares: 112,
    isLiked: false,
    user: {
      id: 'u3',
      username: 'naturelover',
      avatarUrl: 'https://randomuser.me/api/portraits/women/45.jpg',
    }
  }
];

const FeedScreen = () => {
  const [activeTab, setActiveTab] = useState(FEED_TYPES.FOR_YOU);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [videos, setVideos] = useState([]);
  const [videoLoading, setVideoLoading] = useState({});
  const [showHeartAnimation, setShowHeartAnimation] = useState({});
  const [soundIconAnimating, setSoundIconAnimating] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState({});
  const [showPlayPauseIndicator, setShowPlayPauseIndicator] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [bookmark, setBookmark] = useState({});
  
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Animated value for scroll position
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Track last tap time for double tap detection
  const lastTapTimeRef = useRef({});
  const doubleTapTimeoutRef = useRef(null);

  const flatListRef = useRef(null);
  const videoRefs = useRef({});

  // Handle app foreground/background state
  useFocusEffect(
    React.useCallback(() => {
      // Play current video when screen gains focus
      const currentVideoRef = videoRefs.current[videos[currentIndex]?.id];
      if (currentVideoRef) {
        currentVideoRef.playAsync();
      }

      return () => {
        // Pause all videos when screen loses focus
        Object.values(videoRefs.current).forEach(videoRef => {
          if (videoRef) {
            videoRef.pauseAsync();
          }
        });
      };
    }, [currentIndex, videos])
  );

  // Load videos when component mounts
  useEffect(() => {
    loadVideos();
  }, []);

  // Load videos function (initial or refresh)
  const loadVideos = (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    // Simulate API call with random delay for more realistic behavior
    setTimeout(() => {
      if (isRefreshing) {
        // For refresh, let's add a new video at the top (in real app, fetch new videos)
        const refreshedVideos = [...mockVideos];
        // Shuffle the array to simulate new content
        refreshedVideos.sort(() => Math.random() - 0.5);
        setVideos(refreshedVideos);
        setRefreshing(false);
        
        // Reset to first video
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({ index: 0, animated: true });
        }
      } else {
        setVideos(mockVideos);
        setLoading(false);
      }
    }, isRefreshing ? 1500 : 1000); // Longer delay for refresh for UX
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
    
    // Animate sound icon for currently visible video
    if (videos[currentIndex]?.id === videoId) {
      setSoundIconAnimating(true);
      setTimeout(() => setSoundIconAnimating(false), 1000);
    }
  }, [currentIndex, videos]);

  // Handle playback errors
  const onVideoError = useCallback((videoId, error) => {
    console.error(`Error loading video ${videoId}:`, error);
    setVideoLoading(prev => ({ ...prev, [videoId]: false }));
  }, []);
  
  // Handle heart animation end
  const onHeartAnimationEnd = useCallback((videoId) => {
    setShowHeartAnimation(prev => ({ ...prev, [videoId]: false }));
  }, []);
  
  // Handle comments press
  const handleCommentPress = (videoId) => {
    navigation.navigate('CommentsScreen', { videoId });
  };

  // Handle bookmark press
  const handleBookmarkPress = (videoId) => {
    setBookmark(prev => ({ 
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
      // Double tap detected
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

  // Add a new function to track playback status:
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
    // In a real app, you would fetch different videos based on the tab
    // For now, just scroll back to top
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: 0, animated: true });
      setCurrentIndex(0);
    }
  };

  // Handle sound and avatar press (for music page navigation)
  const handleSoundPress = (soundId) => {
    // In a real app, navigate to sound details page
    console.log('Navigate to sound details:', soundId);
  };
  
  // Handle share action
  const handleSharePress = (videoId) => {
    // In a real app, open share sheet or modal
    console.log('Share video:', videoId);
  };
  
  // Handle hashtag press
  const handleHashtagPress = (hashtag) => {
    // In a real app, navigate to hashtag page
    console.log('Navigate to hashtag:', hashtag);
  };
  
  // Handle user mention press
  const handleUserMentionPress = (username) => {
    // In a real app, navigate to user profile
    console.log('Navigate to user profile:', username);
  };
  
  // Handle user profile press
  const handleUserProfilePress = (userId) => {
    // Navigate to profile tab, then to the specific profile
    navigation.navigate('Profile', { 
      screen: 'ProfileHome',
      params: { userId } 
    });
  };

  // Render top navigation tabs
  const renderTopTabs = () => (
    <View style={[styles.topTabsContainer, { paddingTop: insets.top }]}>
      <TouchableOpacity 
        style={styles.tabIconButton}
        onPress={() => handleTabChange(FEED_TYPES.EXPLORE)}
      >
        <Ionicons name="tv-outline" size={24} color="#fff" />
      </TouchableOpacity>
      
      <View style={styles.tabsRow}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab !== FEED_TYPES.FOLLOWING && styles.inactiveTab]}
          onPress={() => handleTabChange(FEED_TYPES.FOLLOWING)}
        >
          <Text style={[styles.tabText, activeTab !== FEED_TYPES.FOLLOWING && styles.inactiveTabText]}>
            Following
          </Text>
          {activeTab === FEED_TYPES.FOLLOWING && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab !== FEED_TYPES.FOR_YOU && styles.inactiveTab]}
          onPress={() => handleTabChange(FEED_TYPES.FOR_YOU)}
        >
          <Text style={[styles.tabText, activeTab !== FEED_TYPES.FOR_YOU && styles.inactiveTabText]}>
            For You
          </Text>
          {activeTab === FEED_TYPES.FOR_YOU && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.tabIconButton}>
        <Ionicons name="search" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  // Render a single video item
  const renderItem = ({ item, index }) => {
    const isActive = index === currentIndex;
    const isVideoLoading = videoLoading[item.id];
    const isHeartAnimationVisible = showHeartAnimation[item.id] || false;
    const isBookmarked = bookmark[item.id] || false;

    return (
      <View style={styles.videoContainer}>
        <TouchableOpacity
          activeOpacity={1}
          style={styles.videoWrapper}
          onPress={() => handleVideoTap(item.id)}
        >
          <Video
            ref={ref => { videoRefs.current[item.id] = ref; }}
            source={{ uri: item.videoUrl }}
            style={styles.video}
            resizeMode="cover"
            shouldPlay={isActive}
            isLooping
            useNativeControls={false}
            onLoadStart={() => onVideoLoadStart(item.id)}
            onLoad={() => onVideoLoad(item.id)}
            onError={(error) => onVideoError(item.id, error)}
            rate={1.0}
            volume={1.0}
            onPlaybackStatusUpdate={(status) => onPlaybackStatusUpdate(status, item.id)}
          />
          
          {/* Top gradient overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent']}
            style={styles.topGradient}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          
          {/* Bottom gradient overlay for better text contrast */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.6)']}
            style={styles.gradientOverlay}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          
          {/* Top navigation */}
          {renderTopTabs()}
          
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
            progress={item.id === videos[currentIndex]?.id && playbackStatus.positionMillis ? 
              playbackStatus.positionMillis / playbackStatus.durationMillis : 0}
            isVisible={isActive}
          />

          {/* Heart Animation */}
          <HeartAnimation
            isVisible={isHeartAnimationVisible}
            onAnimationEnd={() => onHeartAnimationEnd(item.id)}
            size="large"
          />
          
          {/* Action Buttons - Right Side */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleUserProfilePress(item.user.id)}
            >
              <View style={styles.actionIconContainer}>
                <Image
                  source={{ uri: item.user.avatarUrl }}
                  style={styles.actionAvatar}
                />
                <View style={styles.plusButtonSmall}>
                  <Ionicons name="add" size={10} color="#FFF" />
                </View>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleLikeVideo(item.id)}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons 
                  name={item.isLiked ? "heart" : "heart-outline"} 
                  size={28} 
                  color={item.isLiked ? "#FE2C55" : "#FFF"} 
                />
              </View>
              <Text style={styles.actionText}>{formatCount(item.likes)}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleCommentPress(item.id)}
            > 
              <View style={styles.actionIconContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={26} color="#FFF" />
              </View>
              <Text style={styles.actionText}>{formatCount(item.comments)}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleBookmarkPress(item.id)}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons 
                  name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                  size={26} 
                  color="#FFF" 
                />
              </View>
              <Text style={styles.actionText}>{formatCount(568)}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleSharePress(item.id)}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="arrow-redo-outline" size={26} color="#FFF" />
              </View>
              <Text style={styles.actionText}>{formatCount(201)}</Text>
            </TouchableOpacity>
            
            <Animatable.View 
              animation="rotate"
              iterationCount="infinite" 
              duration={3000}
              easing="linear"
              style={styles.musicDiscContainer}
            >
              <Image
                source={{ uri: item.user.avatarUrl }}
                style={styles.actionMusicDisc}
              />
            </Animatable.View>
          </View>
          
          {/* User Info Overlay */}
          <View style={styles.userInfoContainer}>
            {/* Username and caption */}
            <Text style={styles.videoUsername}>
              {item.user.username} <Text style={styles.fireEmoji}>🔥</Text> MR🔮✗ 🔥
            </Text>
            
            {/* Location info if available */}
            {item.location && (
              <Text style={styles.locationText}>
                {item.location} insta Id:- flyingarround6 @ 
                <Text style={styles.userHighlight}>Awara ...</Text>
              </Text>
            )}
            
            {/* Sound info */}
            <TouchableOpacity 
              style={styles.soundInfo}
              onPress={() => handleSoundPress(item.sound.id)}
            >
              <Ionicons name="musical-note" size={16} color="#FFF" />
              <Text style={styles.soundText}>
                Contains: love nwantiti (ah ah ah)...
              </Text>
            </TouchableOpacity>
            
            {/* Repost banner */}
            <TouchableOpacity style={styles.repostBanner}>
              <Ionicons name="repeat" size={20} color="#FFF" />
              <Text style={styles.repostText}>Repost to followers</Text>
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
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast" // Use fast deceleration for snappier feel
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
            progressViewOffset={insets.top + 50} // Offset for header
          />
        }
        // Optimize FlatList performance
        removeClippedSubviews={true}
        maxToRenderPerBatch={2}
        windowSize={3}
        initialNumToRender={1}
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
  topTabsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    position: 'relative',
  },
  tabText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  inactiveTab: {},
  inactiveTabText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '30%',
    right: '30%',
    height: 2,
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
  tabIconButton: {
    padding: 8,
  },
  videoContainer: {
    width,
    height,
  },
  videoWrapper: {
    flex: 1,
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
    height: 80,
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
    bottom: 100,
    left: 16,
    right: 90,
    zIndex: 10,
  },
  videoUsername: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  fireEmoji: {
    fontSize: 16,
  },
  userHighlight: {
    color: '#EEE',
    fontWeight: '500',
  },
  locationText: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  soundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  soundText: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  repostBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginTop: 8,
  },
  repostText: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  actionButtons: {
    position: 'absolute',
    right: 10,
    bottom: 120,
    alignItems: 'center',
    zIndex: 10,
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  actionAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  plusButtonSmall: {
    position: 'absolute',
    bottom: -4,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FE2C55',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1.5,
  },
  musicDiscContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 12,
    borderColor: '#000',
    overflow: 'hidden',
  },
  actionMusicDisc: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  followButton: {
    position: 'absolute',
    bottom: -8,
    left: 15,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FE2C55',
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  musicDisc: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: 4,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  musicDiscImage: {
    width: 12,
    height: 12,
  },
  userProfileImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#FFF',
    position: 'relative',
  },
  userProfileImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  }
});

export default FeedScreen;