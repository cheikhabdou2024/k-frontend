import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, Dimensions, TouchableOpacity, StatusBar, ActivityIndicator, Text, Image } from 'react-native';
import { Video } from 'expo-av';
import * as Animatable from 'react-native-animatable';
import FeedHeader, { FEED_TYPES } from '../../components/feed/FeedHeader';
import VideoCaption from '../../components/feed/VideoCaption';
import { formatCount } from '../../utils/formatters';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';


const { width, height } = Dimensions.get('window');

// Mock video data
const mockVideos = [
  {
    id: '1',
    videoUrl: 'https://cdn.pixabay.com/video/2023/02/09/149935-797511795_large.mp4',
    thumbnailUrl: '',
    caption: 'This is an awesome video! #fyp #trending',
    sound: { id: 's1', name: 'Original Sound' },
    likes: 1234,
    comments: 123,
    shares: 45,
    user: {
      id: 'u1',
      username: 'creator1',
      avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
    }
  },
  {
    id: '2',
    videoUrl: 'https://cdn.pixabay.com/video/2023/07/28/173530-849610807_large.mp4',
    thumbnailUrl: '',
    caption: 'Another cool video! #viral #dance',
    sound: { id: 's2', name: 'Popular Song' },
    likes: 5678,
    comments: 432,
    shares: 123,
    user: {
      id: 'u2',
      username: 'creator2',
      avatarUrl: 'https://randomuser.me/api/portraits/women/32.jpg',
    }
  },
];

const FeedScreen = () => {
  const [activeTab, setActiveTab] = useState(FEED_TYPES.FOR_YOU);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const navigation = useNavigation();

  const flatListRef = useRef(null);
  const videoRefs = useRef({});

  // Load videos when component mounts
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setVideos(mockVideos);
      setLoading(false);
    }, 1000);
  }, []);

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
    itemVisiblePercentThreshold: 50,
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // In a real app, you would fetch different videos based on the tab
  };

  // Render a single video item
  const renderItem = ({ item, index }) => {
    const isActive = index === currentIndex;

    return (
      <View style={styles.videoContainer}>
        <TouchableOpacity
          activeOpacity={1}
          style={styles.videoWrapper}
          onPress={() => {
            // Toggle play/pause
            const videoRef = videoRefs.current[item.id];
            if (videoRef) {
              videoRef.getStatusAsync().then(status => {
                if (status.isPlaying) {
                  videoRef.pauseAsync();
                } else {
                  videoRef.playAsync();
                }
              });
            }
          }}
        >
          <Video
            ref={ref => { videoRefs.current[item.id] = ref; }}
            source={{ uri: item.videoUrl }}
            style={styles.video}
            resizeMode="cover"
            shouldPlay={isActive}
            isLooping
            useNativeControls={false}
          />
          
          {/* User Info Overlay */}
          <View style={styles.userInfoContainer}>
            <View style={styles.userInfo}>
              <TouchableOpacity style={styles.userProfileImageContainer}>
                <Image
                  source={{ uri: item.user.avatarUrl }}
                  style={styles.userProfileImage}
                />
              </TouchableOpacity>
              
              <Text style={styles.username}>@{item.user.username}</Text>
              
              <VideoCaption
                caption={item.caption}
                onHashtag={(hashtag) => console.log('Hashtag pressed:', hashtag)}
                onUserMention={(mention) => console.log('User mention pressed:', mention)}
              />
              
              {/* Sound Info */}
              <View style={styles.soundInfo}>
                <Text style={styles.soundText}>
                  {item.sound.name}
                </Text>
              </View>
            </View>
           {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton}>
                <View style={styles.actionIconContainer}>
                  <Ionicons name="heart-outline" size={28} color="#FFF" />

                </View>
                <Text style={styles.actionText}>{formatCount(item.likes)}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}
               onPress={() => navigation.navigate('CommentsScreen', { videoId: item.id })}>
                <View style={styles.actionIconContainer}>
                  <Ionicons name="chatbubble-ellipses-outline" size={26} color="#FFF" />
                </View>
                    <Text style={styles.actionText}>{formatCount(item.comments)}</Text>

              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <View style={styles.actionIconContainer}>
                    <Ionicons name="share-outline" size={26} color="#FFF" />
                </View>  

                <Text style={styles.actionText}>{formatCount(item.shares)}</Text>
              </TouchableOpacity>
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
        viewabilityConfig={viewabilityConfig}
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
  },
  userInfoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 40,
  },
  userInfo: {
    flex: 1,
    marginRight: 80,
  },
  userProfileImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  userProfileImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
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
  actionIcon: {
    fontSize: 24,
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
  },
});

export default FeedScreen;