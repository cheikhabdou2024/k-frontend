// src/components/profile/ProfileHeader.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { formatCount } from '../../utils/formatters';

const ProfileHeader = ({
  user,
  isFollowing,
  onFollowToggle,
  onEditProfile,
  onMessageUser,
}) => {
  return (
    <View style={styles.userInfoContainer}>
      {/* Avatar and stats */}
      <View style={styles.profileStats}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: user.avatarUrl }} 
            style={styles.avatar}
          />
        </View>
        
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
      
      {/* Bio section */}
      <View style={styles.bioContainer}>
        <View style={styles.usernameRow}>
          <Text style={styles.username}>{user.name || user.username}</Text>
          {user.isVerified && (
            <Ionicons name="checkmark-circle" size={16} color="#20BDFF" style={styles.verifiedIcon} />
          )}
        </View>
        
        {user.bio ? (
          <Text style={styles.bio}>{user.bio}</Text>
        ) : null}
      </View>
      
      {/* Action buttons */}
      <View style={styles.actionButtonsContainer}>
        {user.isCurrentUser ? (
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={onEditProfile}
          >
            <Text style={styles.editProfileButtonText}>Edit profile</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.userActionButtons}>
            <TouchableOpacity 
              style={[
                styles.followButton,
                isFollowing && styles.followingButton
              ]}
              onPress={onFollowToggle}
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
              onPress={onMessageUser}
            >
              <Ionicons name="paper-plane-outline" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  userInfoContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  avatarContainer: {
    marginRight: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#333',
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 12,
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
  bioContainer: {
    marginBottom: 15,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  bio: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  editProfileButton: {
    paddingVertical: 8,
    paddingHorizontal: 40,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#444',
  },
  editProfileButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  userActionButtons: {
    flexDirection: 'row',
  },
  followButton: {
    backgroundColor: '#FE2C55',
    paddingVertical: 8,
    paddingHorizontal: 40,
    borderRadius: 4,
    marginRight: 8,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#444',
  },
  followButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#FFF',
  },
  messageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileHeader;