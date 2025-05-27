// src/screens/feed/EnhancedPerfectFeedScreen.js
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

// Enhanced Components
import PerfectAdaptiveVideo from '../../components/video/PerfectAdaptiveVideo';
import VideoActionButtons from '../../components/feed/VideoActionButton';
import VideoInfo from '../../components/feed/VideoInfo';
import EnhancedFeedHeader, { FEED_TYPES } from '../../components/feed/EnhancedFeedHeader';

// Magical Components (NEW)
import MagicalHeartSystem from '../../components/interactions/MagicalHeartSystem';
import SoundWaveVisualizer from '../../components/interactions/SoundWaveVisualizer';
import { MagicalButton, MagicalToast } from '../../components/interactions/MicroInteractions';
import { MagicalPageTransition, VideoSwipeTransition, ParticleTransition } from '../../components/interactions/MagicalTransitions';
import hapticSystem from '../../components/interactions/EnhancedHapticSystem';

// Services & Utils
import FeedService from '../../services/FeedService';
import videoQueueManager from '../../utils/VideoQueueManager';
import { useFeedLogic } from '../../hooks/useFeedLogic';

const { height, width } = Dimensions.get('window');

// Enhanced performance configuration
const MAGICAL_FEED_CONFIG = {
  // Rendering optimizations
  INITIAL_NUM_TO_RENDER: 1,
  MAX_TO_RENDER_PER_BATCH: 2,
  WINDOW_SIZE: 3,
  
  // Magical interaction settings
  HEART_BURST_THRESHOLD: 5, // Hearts after 5 rapid taps
  SOUND_WAVE_SYNC: true,
  HAPTIC_INTENSITY: 'medium',
  PARTICLE_DENSITY: 'normal',
  
  // Transition settings
  SWIPE_THRESHOLD: 50,
  SWIPE_VELOCITY_THRESHOLD: 0.8,
  TRANSITION_DURATION: 300,
  
  // Performance settings
  UPDATE_CELL_BATCH_PERIOD: 16, // 60fps
  REMOVE_CLIPPED_SUBVIEWS: true,
  ENABLE_MAGIC_EFFECTS: true,
};

const PerfectFeedScreen = () => {
  // Core state
  const [activeTab, setActiveTab] = useState(FEED_TYPES.FOR_YOU);
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Magical interaction state
  const [heartAnimations, setHeartAnimations] = useState({});
  const [soundWaveStates, setSoundWaveStates] = useState({});
  const [particleEffects, setParticleEffects] = useState({});
  const [toastMessage, setToastMessage] = useState(null);
  const [magicalMoments, setMagicalMoments] = useState({});
  
  // Transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState('up');
  
  // Performance state
  const [renderingPerformance, setRenderingPerformance] = useState({
    fps: 60,
    magicalEffectsCount: 0,
    memoryUsage: 0
  });
  
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Refs
  const flatListRef = useRef(null);
  const videoRefs = useRef({});
  const performanceMonitorRef = useRef(null);
  const tapCountRef = useRef({});
  const lastTapTimeRef = useRef({});
  
  // Animation refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const magicalOverlayAnim = useRef(new Animated.Value(0)).current;

  // Initialize haptic system
  useEffect(() => {
    hapticSystem.setEnabled(true);
    hapticSystem.setThrottleDelay(30); // Optimized for TikTok-style interactions
  }, []);

  // Enhanced pan responder with magical interactions
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > 20 || Math.abs(dy) > 20;
      },
      
      onPanResponderGrant: () => {
        // Enhanced haptic feedback
        hapticSystem.playPattern('TAP');
        
        // Start magical overlay effect
        Animated.timing(magicalOverlayAnim, {
          toValue: 0.1,
          duration: 100,
          useNativeDriver: true,
        }).start();
      },
      
      onPanResponderMove: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        const progress = Math.min(Math.abs(dy) / height, 1);
        
        // Update magical overlay based on swipe progress
        magicalOverlayAnim.setValue(progress * 0.3);
        
        // Trigger sound wave visualization during swipe
        if (Math.abs(dy) > 100) {
          const currentVideo = videos[currentIndex];
          if (currentVideo) {
            setSoundWaveStates(prev => ({
              ...prev,
              [currentVideo.id]: true
            }));
          }
        }
      },
      
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, dy, vx, vy } = gestureState;
        
        // Reset magical overlay
        Animated.timing(magicalOverlayAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
        
        // Enhanced swipe detection with haptic feedback
        if (Math.abs(dy) > MAGICAL_FEED_CONFIG.SWIPE_THRESHOLD || 
            Math.abs(vy) > MAGICAL_FEED_CONFIG.SWIPE_VELOCITY_THRESHOLD) {
          
          const direction = dy > 0 ? 'down' : 'up';
          setTransitionDirection(direction);
          
          // Magical swipe haptic
          hapticSystem.videoSwipe('vertical');
          
          // Handle video navigation with magical effects
          handleMagicalVideoSwipe(direction);
        }
        
        // Handle horizontal swipes for tab switching
        if (Math.abs(dx) > MAGICAL_FEED_CONFIG.SWIPE_THRESHOLD || 
            Math.abs(vx) > MAGICAL_FEED_CONFIG.SWIPE_VELOCITY_THRESHOLD) {
          
          const direction = dx > 0 ? 'right' : 'left';
          
          // Tab switch haptic
          hapticSystem.videoSwipe('horizontal');
          
          // Handle tab change with transition
          handleMagicalTabSwipe(direction);
        }
      },
    })
  ).current;

  // Load initial videos with enhanced loading
  const loadInitialVideos = async () => {
    try {
      setIsLoading(true);
      
      // Show magical loading effect
      showToast('Loading magical content...', 'info', 2000);
      
      const loadedVideos = await FeedService.loadVideos();
      setVideos(loadedVideos);
      
      // Initialize magical states for videos
      initializeMagicalStates(loadedVideos);
      
      // Start playing first video
      if (loadedVideos.length > 0) {
        setTimeout(() => {
          playCurrentVideo();
          // Start sound visualization for first video
          setSoundWaveStates(prev => ({
            ...prev,
            [loadedVideos[0].id]: true
          }));
        }, 500);
      }
      
    } catch (error) {
      console.error('Error loading videos:', error);
      showToast('Failed to load videos', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize magical states for videos
  const initializeMagicalStates = (videoList) => {
    const heartStates = {};
    const soundStates = {};
    const particleStates = {};
    const magicalStates = {};
    
    videoList.forEach(video => {
      heartStates[video.id] = false;
      soundStates[video.id] = false;
      particleStates[video.id] = false;
      magicalStates[video.id] = 0; // Magical moment counter
    });
    
    setHeartAnimations(heartStates);
    setSoundWaveStates(soundStates);
    setParticleEffects(particleStates);
    setMagicalMoments(magicalStates);
  };

  // Enhanced video swipe with magical effects
  const handleMagicalVideoSwipe = (direction) => {
    const newIndex = direction === 'up' 
      ? Math.min(currentIndex + 1, videos.length - 1)
      : Math.max(currentIndex - 1, 0);
    
    if (newIndex !== currentIndex) {
      setIsTransitioning(true);
      
      // Create magical transition effect
      if (MAGICAL_FEED_CONFIG.ENABLE_MAGIC_EFFECTS) {
        createMagicalTransition(newIndex, direction);
      }
      
      // Navigate to new video
      scrollToVideo(newIndex);
      
      // End transition after animation
      setTimeout(() => {
        setIsTransitioning(false);
      }, MAGICAL_FEED_CONFIG.TRANSITION_DURATION);
    }
  };

  // Handle magical tab swipe
  const handleMagicalTabSwipe = (direction) => {
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
      // Create magical tab transition
      createTabTransitionEffect();
      handleTabChange(newTab);
    }
  };

  // Create magical transition effects
  const createMagicalTransition = (newIndex, direction) => {
    const currentVideo = videos[currentIndex];
    const nextVideo = videos[newIndex];
    
    if (currentVideo && nextVideo) {
      // Trigger particle effect
      setParticleEffects(prev => ({
        ...prev,
        [currentVideo.id]: true
      }));
      
      // Stop sound wave for current video
      setSoundWaveStates(prev => ({
        ...prev,
        [currentVideo.id]: false
      }));
      
      // Start sound wave for next video after delay
      setTimeout(() => {
        setSoundWaveStates(prev => ({
          ...prev,
          [nextVideo.id]: true
        }));
      }, 200);
      
      // Clean up particle effect
      setTimeout(() => {
        setParticleEffects(prev => ({
          ...prev,
          [currentVideo.id]: false
        }));
      }, 1000);
    }
  };

  // Create tab transition effect
  const createTabTransitionEffect = () => {
    // Create sparkle effect across screen
    showToast(`Switching to ${activeTab === FEED_TYPES.FOR_YOU ? 'Following' : 'For You'}`, 'info', 1500);
    
    // Haptic pattern for tab switch
    hapticSystem.tikTokInteraction('follow');
  };

  // Enhanced double tap handler with magical effects
  const handleMagicalDoubleTap = (videoId, tapPosition) => {
    const currentTime = Date.now();
    const lastTapTime = lastTapTimeRef.current[videoId] || 0;
    const tapCount = tapCountRef.current[videoId] || 0;
    
    // Reset count if too much time passed
    if (currentTime - lastTapTime > 500) {
      tapCountRef.current[videoId] = 1;
    } else {
      tapCountRef.current[videoId] = tapCount + 1;
    }
    
    lastTapTimeRef.current[videoId] = currentTime;
    const newTapCount = tapCountRef.current[videoId];
    
    // Trigger different effects based on tap count
    if (newTapCount === 2) {
      // Double tap - show heart
      setHeartAnimations(prev => ({ ...prev, [videoId]: true }));
      hapticSystem.heartDoubleTap();
      
      // Increment magical moments
      setMagicalMoments(prev => ({
        ...prev,
        [videoId]: (prev[videoId] || 0) + 1
      }));
      
    } else if (newTapCount >= MAGICAL_FEED_CONFIG.HEART_BURST_THRESHOLD) {
      // Burst effect for rapid taps
      setHeartAnimations(prev => ({ ...prev, [videoId]: false }));
      
      setTimeout(() => {
        setHeartAnimations(prev => ({ ...prev, [videoId]: true }));
        hapticSystem.heartBurst();
        
        // Show magical toast
        showToast('✨ Magical moment!', 'success', 2000);
        
        // Trigger particle explosion
        setParticleEffects(prev => ({ ...prev, [videoId]: true }));
        
        setTimeout(() => {
          setParticleEffects(prev => ({ ...prev, [videoId]: false }));
        }, 2000);
      }, 100);
      
      // Reset tap count after burst
      tapCountRef.current[videoId] = 0;
    }
    
    // Auto-hide heart animation
    setTimeout(() => {
      setHeartAnimations(prev => ({ ...prev, [videoId]: false }));
    }, 1500);
  };

  // Enhanced sound wave management
  const toggleSoundWave = (videoId, isActive) => {
    setSoundWaveStates(prev => ({
      ...prev,
      [videoId]: isActive
    }));
    
    if (isActive) {
      hapticSystem.soundPulse();
    }
  };

  // Show toast notification
  const showToast = (message, type = 'info', duration = 3000) => {
    setToastMessage({ message, type, duration });
    
    setTimeout(() => {
      setToastMessage(null);
    }, duration);
  };

  // Handle tab change with magical effects
  const handleTabChange = async (tab) => {
    if (tab === activeTab) return;
    
    setActiveTab(tab);
    
    // Create magical transition
    Animated.sequence([
      Animated.timing(magicalOverlayAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(magicalOverlayAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    try {
      const { videos: newVideos } = await FeedService.loadVideosByFeedType(tab.toLowerCase(), 1, 10);
      setVideos(newVideos);
      setCurrentIndex(0);
      
      // Initialize magical states for new videos
      initializeMagicalStates(newVideos);
      
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
      showToast('Failed to load content', 'error');
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

  // Handle viewability changes with magical effects
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      if (newIndex !== currentIndex) {
        const oldVideo = videos[currentIndex];
        const newVideo = videos[newIndex];
        
        setCurrentIndex(newIndex);
        videoQueueManager.updateCurrentIndex(newIndex);
        
        // Stop old video effects
        if (oldVideo) {
          setSoundWaveStates(prev => ({
            ...prev,
            [oldVideo.id]: false
          }));
        }
        
        // Start new video effects
        if (newVideo) {
          setTimeout(() => {
            setSoundWaveStates(prev => ({
              ...prev,
              [newVideo.id]: true
            }));
            
            // Subtle haptic for auto-scroll
            hapticSystem.playPattern('SWIPE_VERTICAL');
          }, 300);
        }
        
        // Pause all videos then play current one
        Object.keys(videoRefs.current).forEach(key => {
          const videoRef = videoRefs.current[key];
          if (videoRef) {
            videoRef.pauseAsync();
          }
        });
        
        setTimeout(() => playCurrentVideo(), 100);
      }
    }
  }).current;

  // Enhanced refresh with magical loading
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Show magical refresh effect
    showToast('✨ Refreshing magical content...', 'info', 2000);
    hapticSystem.magic();
    
    try {
      const refreshedVideos = await FeedService.loadVideos(true);
      setVideos(refreshedVideos);
      setCurrentIndex(0);
      
      // Initialize magical states
      initializeMagicalStates(refreshedVideos);
      
      // Reset video queue
      videoQueueManager.setVideoQueue(refreshedVideos, 0);
      
      // Scroll to top with magical effect
      if (flatListRef.current && refreshedVideos.length > 0) {
        flatListRef.current.scrollToIndex({ index: 0, animated: true });
      }
      
      // Success feedback
      setTimeout(() => {
        showToast('✅ Fresh content loaded!', 'success', 2000);
        hapticSystem.success();
      }, 1000);
      
    } catch (error) {
      console.error('Error refreshing videos:', error);
      showToast('Failed to refresh content', 'error');
      hapticSystem.error();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Render enhanced video item with magical interactions
  const renderMagicalVideoItem = useCallback(({ item, index }) => {
    const isActive = index === currentIndex;
    const isHeartAnimationVisible = heartAnimations[item.id] || false;
    const isSoundWaveActive = soundWaveStates[item.id] || false;
    const hasParticleEffect = particleEffects[item.id] || false;
    const magicalMomentCount = magicalMoments[item.id] || 0;
    
    return (
      <MagicalPageTransition
        transitionType={isTransitioning ? 'magical' : 'fade'}
        isVisible={true}
        enableHaptic={true}
      >
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
            onTransitionStart={() => {
              console.log(`🎬 Video ${item.id} starting transition`);
              toggleSoundWave(item.id, true);
            }}
            onTransitionEnd={() => {
              console.log(`✅ Video ${item.id} transition complete`);
            }}
          />
          
          {/* Magical Heart System */}
          <MagicalHeartSystem
            isVisible={isHeartAnimationVisible}
            onAnimationEnd={() => {
              setHeartAnimations(prev => ({ ...prev, [item.id]: false }));
            }}
            tapPosition={{ x: width - 50, y: height / 2 }}
            intensity={magicalMomentCount >= 3 ? 'extreme' : 'normal'}
          />
          
          {/* Particle Transition Effect */}
          <ParticleTransition
            isActive={hasParticleEffect}
            particleCount={15}
            colors={['#FE2C55', '#25F4EE', '#FF6B9D', '#FFD700']}
            onComplete={() => {
              setParticleEffects(prev => ({ ...prev, [item.id]: false }));
            }}
          />
          
          {/* Enhanced Video Actions */}
          <VideoActionButtons
            video={item}
            isLiked={false}
            isBookmarked={false}
            onUserProfilePress={(userId) => {
              hapticSystem.playPattern('BUTTON_PRESS');
              console.log('Profile press:', userId);
            }}
            onLikePress={() => {
              handleMagicalDoubleTap(item.id, { x: width - 50, y: height / 2 });
            }}
            onCommentPress={() => {
              hapticSystem.tikTokInteraction('comment');
              navigation.navigate('CommentsScreen', { videoId: item.id });
            }}
            onBookmarkPress={() => {
              hapticSystem.tikTokInteraction('share');
              console.log('Bookmark press:', item.id);
            }}
            onSharePress={() => {
              hapticSystem.tikTokInteraction('share');
              showToast('✨ Shared with magical vibes!', 'success');
            }}
          />
          
          {/* Enhanced Video Info with Sound Wave */}
          <View style={styles.videoInfoContainer}>
            <VideoInfo
              video={item}
              onSoundPress={(soundId) => {
                toggleSoundWave(item.id, !isSoundWaveActive);
                hapticSystem.soundPulse();
              }}
              onUserPress={(userId) => {
                hapticSystem.playPattern('BUTTON_PRESS');
                console.log('User press:', userId);
              }}
              onHashtagPress={(hashtag) => {
                hapticSystem.playPattern('TAP');
                console.log('Hashtag press:', hashtag);
              }}
              onLocationPress={(location) => {
                hapticSystem.playPattern('TAP');
                console.log('Location press:', location);
              }}
              isVisible={true}
            />
            
            {/* Sound Wave Visualizer */}
            <View style={styles.soundWaveContainer}>
              <SoundWaveVisualizer
                isActive={isSoundWaveActive && isActive}
                intensity={magicalMomentCount > 5 ? 'high' : 'medium'}
                size="medium"
                showPulseRing={true}
                syncWithAudio={MAGICAL_FEED_CONFIG.SOUND_WAVE_SYNC}
              />
            </View>
          </View>
          
          {/* Magical Moment Counter */}
          {magicalMomentCount > 0 && (
            <View style={styles.magicalCounter}>
              <Text style={styles.magicalCounterText}>
                ✨ {magicalMomentCount}
              </Text>
            </View>
          )}
        </View>
      </MagicalPageTransition>
    );
  }, [currentIndex, heartAnimations, soundWaveStates, particleEffects, magicalMoments, isTransitioning, navigation]);

  // Load videos on mount
  useEffect(() => {
    loadInitialVideos();
    
    return () => {
      videoQueueManager.reset();
    };
  }, []);

  // Viewability configuration
  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
    waitForInteraction: false,
  };

  // Loading state with magical loader
  if (isLoading) {
    return (
      <MagicalPageTransition transitionType="magical" isVisible={true}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FE2C55" />
          <Text style={styles.loadingText}>Loading Magical Experience...</Text>
          <SoundWaveVisualizer
            isActive={true}
            intensity="medium"
            size="large"
            showPulseRing={true}
          />
        </View>
      </MagicalPageTransition>
    );
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* Magical Overlay */}
      <Animated.View
        style={[
          styles.magicalOverlay,
          {
            opacity: magicalOverlayAnim,
            backgroundColor: 'rgba(254, 44, 85, 0.1)',
          }
        ]}
        pointerEvents="none"
      />

      {/* Enhanced Header */}
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
            {renderingPerformance.fps}fps • ✨{renderingPerformance.magicalEffectsCount} effects
          </Text>
        </View>
      )}
      
      {/* Enhanced Video List */}
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderMagicalVideoItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#FE2C55"
            colors={["#FE2C55", "#25F4EE"]}
            progressBackgroundColor="#000"
            progressViewOffset={insets.top + 50}
          />
        }
        // Performance optimizations
        removeClippedSubviews={MAGICAL_FEED_CONFIG.REMOVE_CLIPPED_SUBVIEWS}
        maxToRenderPerBatch={MAGICAL_FEED_CONFIG.MAX_TO_RENDER_PER_BATCH}
        windowSize={MAGICAL_FEED_CONFIG.WINDOW_SIZE}
        initialNumToRender={MAGICAL_FEED_CONFIG.INITIAL_NUM_TO_RENDER}
        updateCellsBatchingPeriod={MAGICAL_FEED_CONFIG.UPDATE_CELL_BATCH_PERIOD}
        scrollEventThrottle={16}
        bounces={true}
      />
      
      {/* Magical Toast Notifications */}
      {toastMessage && (
        <MagicalToast
          message={toastMessage.message}
          type={toastMessage.type}
          duration={toastMessage.duration}
          onDismiss={() => setToastMessage(null)}
          position="top"
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
    marginBottom: 30,
    fontWeight: '600',
    fontSize: 16,
  },
  magicalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
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
  videoItemContainer: {
    width,
    height,
    position: 'relative',
  },
  videoInfoContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 90,
    zIndex: 10,
  },
  soundWaveContainer: {
    position: 'absolute',
    bottom: 10,
    left: 16,
    zIndex: 15,
  },
  magicalCounter: {
    position: 'absolute',
    top: 100,
    right: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 20,
  },
  magicalCounterText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default PerfectFeedScreen;