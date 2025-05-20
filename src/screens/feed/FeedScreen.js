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
import { FEED_TYPES } from '../../components/feed/FeedHeader';
import FeedHeader from '../../components/feed/EnhancedFeedHeader';
import VideoCaption from '../../components/feed/EnhancedVideoCaption';
import VideoLoadingSpinner from '../../components/feed/VideoLoadingSpinner';
import HeartAnimation from '../../components/feed/EnhancedHeartAnimation';
import FeedScrollIndicator from '../../components/feed/FeedScrollIndicator';
import { formatCount } from '../../utils/formatters';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

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
  
  const navigation = useNavigation();
  
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
            if (status.isPlaying) {
              videoRef.pauseAsync();
            } else {
              videoRef.playAsync();
            }
          });
        }
      }, 300); // Wait for potential second tap
    }
    
    // Update last tap time
    lastTapTimeRef.current[videoId] = now;
  }, [handleLikeVideo]);

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
    // In a real app, navigate to user profile
    console.log('Navigate to user profile:', userId);
  };

  // Render a single video item
  const renderItem = ({ item, index }) => {
    const isActive = index === currentIndex;
    const isVideoLoading = videoLoading[item.id];
    const isHeartAnimationVisible = showHeartAnimation[item.id] || false;

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
          />
          
          {/* Gradient overlay for better text contrast */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.6)']}
            style={styles.gradientOverlay}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          
          {/* Loading Spinner */}
          <VideoLoadingSpinner 
            isVisible={isVideoLoading} 
            size="medium" 
          />
          
          {/* Heart Animation */}
          <HeartAnimation
            isVisible={isHeartAnimationVisible}
            onAnimationEnd={() => onHeartAnimationEnd(item.id)}
            size="large"
          />
          
          {/* User Info Overlay */}
          <View style={styles.userInfoContainer}>
            <View style={styles.userInfo}>
              <TouchableOpacity 
                style={styles.userProfileImageContainer}
                onPress={() => handleUserProfilePress(item.user.id)}
              >
                <Image
                  source={{ uri: item.user.avatarUrl }}
                  style={styles.userProfileImage}
                />
                
                <View style={styles.followButton}>
                  <Ionicons name="add" size={15} color="#FFF" />
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => handleUserProfilePress(item.user.id)}>
                <Text style={styles.username}>@{item.user.username}</Text>
              </TouchableOpacity>
              
              <VideoCaption
                caption={item.caption}
                onHashtag={handleHashtagPress}
                onUserMention={handleUserMentionPress}
                maxLines={2}
              />
              
              {/* Sound Info */}
              <TouchableOpacity 
                style={styles.soundInfo}
                onPress={() => handleSoundPress(item.sound.id)}
              >
                <Animatable.View
                  animation={soundIconAnimating && isActive ? "pulse" : undefined}
                  iterationCount={2}
                  duration={400}
                >
                  <Ionicons name="musical-notes" size={16} color="#FFF" />
                </Animatable.View>
                <Text style={styles.soundText}>
                  {item.sound.name}
                </Text>
                <Animatable.View
                  animation="rotate"
                  iterationCount="infinite"
                  duration={3000}
                  easing="linear"
                  style={styles.musicDisc}
                >
                  <Image
                    source={{ uri: item.user.avatarUrl }}
                    style={styles.musicDiscImage}
                  />
                </Animatable.View>
              </TouchableOpacity>
            </View>
            
            {/* Action Buttons */}
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
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleLikeVideo(item.id)}
              >
                <View style={[
                  styles.actionIconContainer,
                  item.isLiked && styles.likedIconContainer
                ]}>
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
                onPress={() => navigation.navigate('CommentsScreen', { videoId: item.id })}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="chatbubble-ellipses-outline" size={26} color="#FFF" />
                </View>
                <Text style={styles.actionText}>{formatCount(item.comments)}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleSharePress(item.id)}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="share-social-outline" size={26} color="#FFF" />
                </View>
                <Text style={styles.actionText}>{formatCount(item.shares)}</Text>
              </TouchableOpacity>
              
              <Animatable.View 
                animation="pulse" 
                iterationCount="infinite" 
                duration={2000}
                style={styles.musicDiscContainer}
              >
                <Image
                  source={{ uri: item.user.avatarUrl }}
                  style={styles.actionMusicDisc}
                />
              </Animatable.View>
            </View>
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
      
      {/* Feed Header */}
      <FeedHeader
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
            progressViewOffset={30} // Offset for header
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
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 90 : 60,
    zIndex: 2,
  },
  userInfo: {
    flex: 1,
    marginRight: 80,
    justifyContent: 'flex-end',
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
  soundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  soundText: {
    color: '#FFF',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginHorizontal: 8,
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
  actionButtons: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 15,
  },
  actionIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  likedIconContainer: {
    backgroundColor: 'rgba(254, 44, 85, 0.2)',
  },
  actionAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1.5,
  },
  musicDiscContainer: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    borderWidth: 8,
    borderColor: '#000',
    overflow: 'hidden',
  },
  actionMusicDisc: {
    width: 37,
    height: 37,
    borderRadius: 18.5,
  }
});

export default FeedScreen;