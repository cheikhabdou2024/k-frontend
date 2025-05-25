// src/components/profile/UserProfileOverlay.js
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  Image, 
  Animated, 
  Dimensions,
  FlatList,
  Modal
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const UserProfileOverlay = ({
  user,
  isVisible,
  onClose,
  onFollowPress,
  onMessagePress,
  onViewProfile,
  isFollowing = false,
  currentUserId,
}) => {
  // Animation refs
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  // State
  const [following, setFollowing] = useState(isFollowing);
  const [followerCount, setFollowerCount] = useState(user?.followers || 0);
  const [recentVideos, setRecentVideos] = useState([]);

  // Animate in/out based on visibility
  useEffect(() => {
    if (isVisible) {
      animateIn();
      loadRecentVideos();
    } else {
      animateOut();
    }
  }, [isVisible]);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT * 0.3,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  };

  const animateOut = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Load user's recent videos (mock data)
  const loadRecentVideos = () => {
    // In a real app, this would be an API call
    const mockVideos = [
      { id: '1', thumbnail: 'https://picsum.photos/150/200?random=1', views: 12500 },
      { id: '2', thumbnail: 'https://picsum.photos/150/200?random=2', views: 8900 },
      { id: '3', thumbnail: 'https://picsum.photos/150/200?random=3', views: 15600 },
      { id: '4', thumbnail: 'https://picsum.photos/150/200?random=4', views: 7200 },
    ];
    setRecentVideos(mockVideos);
  };

  // Handle follow button press
  const handleFollowPress = () => {
    if (user.id === currentUserId) return;
    
    const newFollowingState = !following;
    setFollowing(newFollowingState);
    setFollowerCount(prev => newFollowingState ? prev + 1 : Math.max(0, prev - 1));
    
    // Haptic feedback
    Haptics.impactAsync(
      newFollowingState 
        ? Haptics.ImpactFeedbackStyle.Medium 
        : Haptics.ImpactFeedbackStyle.Light
    );
    
    if (onFollowPress) {
      onFollowPress(user.id, newFollowingState);
    }
  };

  // Handle message button press
  const handleMessagePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onMessagePress) {
      onMessagePress(user.id);
    }
  };

  // Handle view full profile
  const handleViewProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onViewProfile) {
      onViewProfile(user.id);
    }
    onClose();
  };

  // Format count for display
  const formatCount = (count) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  // Render video thumbnail
  const renderVideoThumbnail = ({ item }) => (
    <TouchableOpacity style={styles.videoThumbnail} activeOpacity={0.8}>
      <Image source={{ uri: item.thumbnail }} style={styles.thumbnailImage} />
      <View style={styles.thumbnailOverlay}>
        <Ionicons name="play" size={16} color="#FFF" />
        <Text style={styles.viewsText}>{formatCount(item.views)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (!user) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View 
          style={[
            styles.backdrop,
            { opacity: backdropAnim }
          ]}
        >
          <TouchableOpacity 
            style={styles.backdropTouchable}
            onPress={onClose}
            activeOpacity={1}
          />
        </Animated.View>
        
        {/* Profile overlay */}
        <Animated.View 
          style={[
            styles.overlay,
            {
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleBar} />
          
          {/* Header section */}
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
              
              {/* Online indicator */}
              {user.isOnline && (
                <View style={styles.onlineIndicator} />
              )}
              
              {/* Verified badge */}
              {user.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={12} color="#FFF" />
                </View>
              )}
            </View>
            
            <View style={styles.userInfo}>
              <Text style={styles.username}>@{user.username}</Text>
              {user.name && (
                <Text style={styles.displayName}>{user.name}</Text>
              )}
              
              {/* Stats row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{formatCount(followerCount)}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{formatCount(user.following || 0)}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{formatCount(user.likes || 0)}</Text>
                  <Text style={styles.statLabel}>Likes</Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Bio section */}
          {user.bio && (
            <View style={styles.bioSection}>
              <Text style={styles.bioText}>{user.bio}</Text>
            </View>
          )}
          
          {/* Action buttons */}
          <View style={styles.actionButtons}>
            {user.id !== currentUserId ? (
              <>
                <TouchableOpacity 
                  style={[
                    styles.followButton,
                    following && styles.followingButton
                  ]}
                  onPress={handleFollowPress}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={following ? ['#4CAF50', '#45A049'] : ['#FE2C55', '#E91E63']}
                    style={styles.buttonGradient}
                  >
                    <Ionicons 
                      name={following ? "checkmark" : "person-add"} 
                      size={16} 
                      color="#FFF" 
                    />
                    <Text style={styles.buttonText}>
                      {following ? 'Following' : 'Follow'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.messageButton}
                  onPress={handleMessagePress}
                  activeOpacity={0.8}
                >
                  <Ionicons name="chatbubble-outline" size={16} color="#FFF" />
                  <Text style={styles.messageButtonText}>Message</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity 
                style={styles.editProfileButton}
                onPress={handleViewProfile}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={16} color="#FFF" />
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Recent videos section */}
          <View style={styles.videosSection}>
            <View style={styles.videosSectionHeader}>
              <Text style={styles.videosSectionTitle}>Recent Videos</Text>
              <TouchableOpacity onPress={handleViewProfile}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={recentVideos}
              renderItem={renderVideoThumbnail}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.videosContainer}
            />
          </View>
          
          {/* View full profile button */}
          <TouchableOpacity 
            style={styles.viewProfileButton}
            onPress={handleViewProfile}
            activeOpacity={0.8}
          >
            <Text style={styles.viewProfileText}>View Full Profile</Text>
            <Ionicons name="arrow-forward" size={16} color="#25F4EE" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdropTouchable: {
    flex: 1,
  },
  overlay: {
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    minHeight: SCREEN_HEIGHT * 0.6,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#555',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#333',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#000',
  },
  verifiedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#20BDFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  displayName: {
    color: '#CCC',
    fontSize: 16,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  statNumber: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  
  // Bio styles
  bioSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  bioText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Action buttons styles
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  followButton: {
    flex: 1,
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  followingButton: {
    // Styles handled by gradient colors
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  messageButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    flex: 1,
  },
  editProfileText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Videos section styles
  videosSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  videosSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  videosSectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewAllText: {
    color: '#25F4EE',
    fontSize: 14,
    fontWeight: '600',
  },
  videosContainer: {
    paddingRight: 20,
  },
  videoThumbnail: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewsText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  
  // View profile button styles
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#25F4EE',
  },
  viewProfileText: {
    color: '#25F4EE',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default UserProfileOverlay;