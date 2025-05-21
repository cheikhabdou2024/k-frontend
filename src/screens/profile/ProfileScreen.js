// src/screens/profile/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  FlatList, 
  Dimensions, 
  ScrollView,
  RefreshControl,
  StatusBar 
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatCount } from '../../utils/formatters';
import ProfileHeader from '../../components/profile/ProfileHeader';
import VideoGrid from '../../components/profile/VideoGrid';

const { width } = Dimensions.get('window');
const VIDEO_THUMBNAIL_SIZE = width / 3;

// Mock data for current user profile
const CURRENT_USER = {
  id: 'u1',
  username: 'yourusername',
  name: 'Your Name',
  bio: 'Digital creator | Making awesome content 📱✨\nFollow for daily videos!',
  avatarUrl: 'https://randomuser.me/api/portraits/men/88.jpg',
  following: 128,
  followers: 1254,
  likes: 18950,
  isVerified: true,
  isCurrentUser: true,
};

// Mock data for user videos
const USER_VIDEOS = [
  {
    id: 'v1',
    thumbnailUrl: 'https://picsum.photos/id/237/300/400',
    views: 12500,
    isPrivate: false,
  },
  {
    id: 'v2',
    thumbnailUrl: 'https://picsum.photos/id/238/300/400',
    views: 5240,
    isPrivate: false,
  },
  {
    id: 'v3',
    thumbnailUrl: 'https://picsum.photos/id/239/300/400',
    views: 18700,
    isPrivate: false,
  },
  {
    id: 'v4',
    thumbnailUrl: 'https://picsum.photos/id/240/300/400',
    views: 3400,
    isPrivate: true,
  },
  {
    id: 'v5',
    thumbnailUrl: 'https://picsum.photos/id/241/300/400',
    views: 7600,
    isPrivate: false,
  },
  {
    id: 'v6',
    thumbnailUrl: 'https://picsum.photos/id/242/300/400',
    views: 9800,
    isPrivate: false,
  },
];

const ProfileScreen = ({ navigation, route }) => {
  const [user, setUser] = useState(CURRENT_USER);
  const [videos, setVideos] = useState([]);
  const [activeTab, setActiveTab] = useState('videos');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  
  const insets = useSafeAreaInsets();
  
  // Load user data and videos (would be an API call in a real app)
  useEffect(() => {
    // Check if viewing another user's profile or own profile
    const userId = route?.params?.userId;
    if (userId && userId !== CURRENT_USER.id) {
       const otherUser = {
      id: userId,
      username: 'creator123',
      name: 'Content Creator',
      bio: 'Travel lover 🌍 | Photographer 📸\nCheck out my latest videos!',
      avatarUrl: 'https://randomuser.me/api/portraits/women/42.jpg',
      following: 843,
      followers: 12500,
      likes: 98700,
      isVerified: true,
      isCurrentUser: false,
    };
      // In a real app, fetch user data from API
      setUser({
        ...CURRENT_USER,
        id: userId,
        isCurrentUser: false,
      });
    } else {
      setUser(CURRENT_USER);
    }
    
    // In a real app, fetch videos from API
    setVideos(USER_VIDEOS);
  }, [route?.params?.userId]);
  
  // Handle pull-to-refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    // In a real app, refetch data
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };
  
  // Toggle follow status
  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
    // In a real app, call API to follow/unfollow
  };
  
  // Handle opening the edit profile screen
 const handleEditProfile = () => {
  navigation.navigate('EditProfile', { user });
}; 
  
  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // Render header with back button and settings
  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={28} color="#FFF" />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>@{user.username}</Text>
      
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => console.log('Open Menu')}
      >
        <Ionicons name="ellipsis-horizontal" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
  
  // Render user info section
  // Profile info section
  const renderUserInfo = () => (
    <View style={styles.userInfoContainer}>
      {/* Profile image */}
      <View style={styles.profileTopSection}>
        <Image 
          source={{ uri: user.avatarUrl }} 
          style={styles.avatar}
        />
        
        {/* Stats row */}
        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statValue}>{formatCount(user.following)}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statValue}>{formatCount(user.followers)}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statValue}>{formatCount(user.likes)}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Name and bio */}
      <View style={styles.bioSection}>
        <View style={styles.nameRow}>
          <Text style={styles.displayName}>{user.name}</Text>
          {user.isVerified && (
            <Ionicons name="checkmark-circle" size={16} color="#20BDFF" style={styles.verifiedBadge} />
          )}
        </View>
        
        {user.bio ? (
          <Text style={styles.bioText}>{user.bio}</Text>
        ) : null}
      </View>
      
      {/* Action buttons */}
      <View style={styles.actionButtonsRow}>
        {user.isCurrentUser ? (
          <TouchableOpacity 
            style={styles.editButton}
            onPress={handleEditProfile}
          >
            <Text style={styles.editButtonText}>Edit profile</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.userActionButtons}>
            <TouchableOpacity 
              style={[
                styles.followButton,
                isFollowing && styles.followingButton
              ]}
              onPress={handleFollowToggle}
            >
              <Text style={[
                styles.followButtonText,
                isFollowing && styles.followingButtonText
              ]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.messageButton}
              onPress={() => console.log('Message user')}
            >
              <Ionicons name="paper-plane-outline" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  ); 
  
  // Render content tabs
  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity 
        style={[
          styles.tabButton, 
          activeTab === 'videos' && styles.activeTabButton
        ]}
        onPress={() => handleTabChange('videos')}
      >
        <Ionicons 
          name="grid-outline" 
          size={24} 
          color={activeTab === 'videos' ? '#FFF' : '#888'} 
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.tabButton, 
          activeTab === 'liked' && styles.activeTabButton
        ]}
        onPress={() => handleTabChange('liked')}
      >
        <Ionicons 
          name="heart-outline" 
          size={24} 
          color={activeTab === 'liked' ? '#FFF' : '#888'} 
        />
      </TouchableOpacity>
      
      {user.isCurrentUser && (
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'private' && styles.activeTabButton
          ]}
          onPress={() => handleTabChange('private')}
        >
          <Ionicons 
            name="lock-closed-outline" 
            size={24} 
            color={activeTab === 'private' ? '#FFF' : '#888'} 
          />
        </TouchableOpacity>
      )}
    </View>
  ); 
  
  // Render video grid
   const renderVideos = () => {
    const filteredVideos = videos.filter(video => {
      if (activeTab === 'private') return video.isPrivate;
      if (activeTab === 'videos') return !video.isPrivate;
      return true; // 'liked' tab shows all videos for demo
    });
    
    return (
      <VideoGrid
        videos={filteredVideos}
        activeTab={activeTab}
        onVideoPress={(video) => console.log('Navigate to video', video.id)}
        emptyText={
          activeTab === 'videos' ? 'No videos yet' :
          activeTab === 'liked' ? 'No liked videos' : 'No private videos'
        }
        emptyIcon={
          activeTab === 'videos' ? 'videocam-outline' :
          activeTab === 'liked' ? 'heart-outline' : 'lock-closed-outline'
        }
      />
    );
  };
  
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      {renderHeader()}
      
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#FE2C55"
            colors={["#FE2C55"]}
            progressBackgroundColor="#000"
          />
        }
      >
        {renderUserInfo()}
        {renderTabs()}
        {renderVideos()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 0.2,
    borderBottomColor: '#333',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
  userInfoContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  profileTopSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginRight: 20,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#BBB',
    fontSize: 12,
    marginTop: 2,
  },
  bioSection: {
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  bioText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    marginVertical: 6,
  },
  editButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
  },
  userActionButtons: {
    flexDirection: 'row',
    flex: 1,
  },
  followButton: {
    flex: 1,
    backgroundColor: '#FE2C55',
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333',
  },
  followButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#FFF',
  },
  messageButton: {
    width: 44,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 0.2,
    borderBottomColor: '#333',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFF',
  },
});

export default ProfileScreen;