// src/services/feedService.js
import { mockVideos } from '../constants/feedData';

class FeedService {
  /**
   * Simulate loading videos with delay
   */
  static async loadVideos(isRefreshing = false) {
    const delay = isRefreshing ? 1500 : 1000;
    
    return new Promise((resolve) => {
      setTimeout(() => {
        if (isRefreshing) {
          // Shuffle videos for refresh
          const refreshedVideos = [...mockVideos];
          refreshedVideos.sort(() => Math.random() - 0.5);
          resolve(refreshedVideos);
        } else {
          resolve(mockVideos);
        }
      }, delay);
    });
  }

  /**
   * Simulate loading videos by feed type
   */
  static async loadVideosByFeedType(feedType, page = 1, limit = 10) {
    const delay = 800;
    
    return new Promise((resolve) => {
      setTimeout(() => {
        let videos = [...mockVideos];
        
        // In a real app, you would filter/sort based on feedType
        switch (feedType) {
          case 'following':
            // Filter videos from followed users
            videos = videos.filter(video => 
              ['u1', 'u2'].includes(video.user.id)
            );
            break;
          case 'for_you':
            // Algorithm-based feed
            videos.sort(() => Math.random() - 0.5);
            break;
          case 'explore':
            // Trending/explore feed
            videos.sort((a, b) => b.likes - a.likes);
            break;
          default:
            break;
        }
        
        // Simulate pagination
        const startIndex = (page - 1) * limit;
        const paginatedVideos = videos.slice(startIndex, startIndex + limit);
        
        resolve({
          videos: paginatedVideos,
          hasMore: startIndex + limit < videos.length,
          page,
          totalCount: videos.length
        });
      }, delay);
    });
  }

  /**
   * Toggle like status for a video
   */
  static async toggleVideoLike(videoId, currentStatus) {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const newStatus = !currentStatus;
        resolve({
          isLiked: newStatus,
          likesChange: newStatus ? 1 : -1
        });
      }, 200);
    });
  }

  /**
   * Add video to bookmarks
   */
  static async toggleBookmark(videoId, currentStatus) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          isBookmarked: !currentStatus
        });
      }, 300);
    });
  }

  /**
   * Share video
   */
  static async shareVideo(videoId, shareType = 'general') {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          shareUrl: `https://app.example.com/video/${videoId}`,
          shareType
        });
      }, 500);
    });
  }

  /**
   * Report video
   */
  static async reportVideo(videoId, reason) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          reportId: `report_${Date.now()}`
        });
      }, 600);
    });
  }

  /**
   * Get video analytics (for content creators)
   */
  static async getVideoAnalytics(videoId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          views: Math.floor(Math.random() * 100000),
          likes: Math.floor(Math.random() * 5000),
          shares: Math.floor(Math.random() * 500),
          comments: Math.floor(Math.random() * 200),
          engagement: Math.random() * 10,
          demographics: {
            ageGroups: {
              '13-17': 25,
              '18-24': 35,
              '25-34': 20,
              '35-44': 15,
              '45+': 5
            },
            gender: {
              male: 45,
              female: 52,
              other: 3
            }
          }
        });
      }, 800);
    });
  }
}

export default FeedService;

// ===========================================
