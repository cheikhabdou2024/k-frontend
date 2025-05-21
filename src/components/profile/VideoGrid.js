// src/components/profile/VideoGrid.js
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  Dimensions 
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { formatCount } from '../../utils/formatters';

const { width } = Dimensions.get('window');
const VIDEO_THUMBNAIL_SIZE = width / 3;

const VideoGrid = ({ 
  videos,
  activeTab,
  onVideoPress,
  emptyText,
  emptyIcon,
}) => {
  if (videos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons 
          name={emptyIcon || 'videocam-outline'} 
          size={48} 
          color="#444" 
        />
        <Text style={styles.emptyText}>{emptyText || 'No videos yet'}</Text>
      </View>
    );
  }
  
  return (
    <FlatList
      data={videos}
      renderItem={({ item }) => (
        <TouchableOpacity 
          style={styles.videoThumbnailContainer}
          onPress={() => onVideoPress(item)}
            activeOpacity={0.9}
        >
          <Image 
            source={{ uri: item.thumbnailUrl }}
            style={styles.videoThumbnail}
          />
          
          {/* Private indicator */}
          {item.isPrivate && (
            <View style={styles.privateIndicator}>
              <Ionicons name="lock-closed" size={10} color="#FFF" />
            </View>
          )}
          
          {/* Views counter */}
          {item.views > 0 && (
            <View style={styles.viewsContainer}>
              <Ionicons name="play" size={12} color="#FFF" />
              <Text style={styles.viewsText}>{formatCount(item.views)}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
      keyExtractor={item => item.id}
      numColumns={3}
      showsVerticalScrollIndicator={false}
      // columnWrapperStyle={styles.videoGridRow}// 
      initialNumToRender={9}
      maxToRenderPerBatch={9}
      windowSize={9}
    />
  );
};

const styles = StyleSheet.create({
 
  videoThumbnailContainer: {
    width: VIDEO_THUMBNAIL_SIZE,
    height: VIDEO_THUMBNAIL_SIZE * 1.3, // Taller for TikTok-style videos
    position: 'relative',
    backgroundColor: '#111',
     borderWidth: 0.5,
    borderColor: '#000',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  viewsContainer: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  viewsText: {
    color: '#FFF',
    fontSize: 12,
    marginLeft: 2,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  privateIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 4,
    borderRadius: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 10,
  },
});

export default VideoGrid;