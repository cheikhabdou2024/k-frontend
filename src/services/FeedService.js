// src/services/FeedService.js
import apiService from './apiService';
import { mockVideos } from '../constants/feedData';

class FeedService {
  /**
   * Load videos with fallback to mock data
   */
  static async loadVideos(isRefreshing = false) {
    try {
      console.log('🎬 Loading videos from API...');
      
      // Try to fetch from real API first
      const response = await apiService.get('/videos', {
        page: 1,
        limit: 10
      });
      
      if (response.videos && response.videos.length > 0) {
        console.log('✅ Successfully loaded videos from API:', response.videos.length);
        
        // Transform API data to match frontend format
        const transformedVideos = this.transformApiVideos(response.videos);
        
        if (isRefreshing) {
          // Shuffle for refresh effect
          return this.shuffleArray(transformedVideos);
        }
        
        return transformedVideos;
      }
      
      // Fallback to mock data if API returns empty
      console.log('⚠️ API returned empty videos, using mock data');
      return this.getMockVideos(isRefreshing);
      
    } catch (error) {
      console.error('❌ Failed to load videos from API:', error);
      console.log('🔄 Falling back to mock data');
      
      // Fallback to mock data on API failure
      return this.getMockVideos(isRefreshing);
    }
  }

  /**
   * Transform API video data to frontend format with enhanced URL handling
   */
  static transformApiVideos(apiVideos) {
    return apiVideos.map(video => {
      // Clean and format the video URL
      const videoUrl = this.sanitizeVideoUrl(video.url);
      
      return {
        id: video.id.toString(),
        videoUrl,
        thumbnailUrl: video.thumbnail || `https://picsum.photos/id/${200 + parseInt(video.id)}/300/400`,
        caption: video.description || video.title || 'Amazing video! 🔥',
        sound: { 
          id: `s${video.id}`, 
          name: video.soundName || 'Original Sound' 
        },
        likes: video.likeCount || Math.floor(Math.random() * 10000),
        comments: video.commentCount || Math.floor(Math.random() * 500),
        shares: Math.floor(Math.random() * 200),
        isLiked: video.likedByMe || false,
        location: video.location || null,
        views: video.views || 0,
        user: {
          id: video.author?.id?.toString() || video.userId?.toString() || `u${video.id}`,
          username: video.author?.username || `user${video.id}`,
          avatarUrl: video.author?.avatar === 'default-avatar.png' 
            ? `https://randomuser.me/api/portraits/${video.id % 2 ? 'women' : 'men'}/${(parseInt(video.id) % 50) + 1}.jpg`
            : video.author?.avatar || `https://randomuser.me/api/portraits/men/${video.id % 50}.jpg`,
          isVerified: Math.random() > 0.8, // 20% chance of verification
        }
      };
    });
  }

  /**
   * Sanitize and validate video URLs
   */
  static sanitizeVideoUrl(url) {
    if (!url) return '';

    // Trim the URL
    let cleanUrl = url.trim();
    
    // Add http:// prefix if missing
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `http://${cleanUrl}`;
    }
    
    // Format MinIO URLs correctly
    if (cleanUrl.includes('minio') || cleanUrl.includes('localhost')) {
      // Replace any double slashes (except after protocol)
      cleanUrl = cleanUrl.replace(/(https?:\/\/)|(\/\/)/g, (match, protocol) => {
        return protocol || '/';
      });
      
      // Make sure there are no missing slashes between segments
      cleanUrl = cleanUrl.replace(/([^:])\/+/g, '$1/');
    }
    
    // Fallback to mock videos if URL seems problematic
    if (!this.isValidVideoUrl(cleanUrl)) {
      console.warn('⚠️ Invalid video URL detected:', cleanUrl);
      const fallbackIndex = parseInt(Math.random() * mockVideos.length);
      return mockVideos[fallbackIndex]?.videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4';
    }
    
    return cleanUrl;
  }
  
  /**
   * Check if a URL is likely to be a valid video
   */
  static isValidVideoUrl(url) {
    if (!url) return false;
    
    // Check if URL has video-like extensions
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.3gp', '.flv'];
    const hasVideoExtension = videoExtensions.some(ext => url.toLowerCase().includes(ext));
    
    // Check if URL includes common video hosts
    const videoHosts = ['videos', 'video', 'media', 'assets.mixkit.co', 'pixabay', 'cdn', 'storage'];
    const hasVideoHost = videoHosts.some(host => url.toLowerCase().includes(host));
    
    return hasVideoExtension || hasVideoHost;
  }

  /**
   * Get mock videos (fallback)
   */
  static getMockVideos(isRefreshing = false) {
    const delay = isRefreshing ? 1500 : 1000;
    
    return new Promise((resolve) => {
      setTimeout(() => {
        if (isRefreshing) {
          const refreshedVideos = [...mockVideos];
          resolve(this.shuffleArray(refreshedVideos));
        } else {
          resolve(mockVideos);
        }
      }, delay);
    });
  }

  /**
   * Load videos by feed type
   */
  static async loadVideosByFeedType(feedType, page = 1, limit = 10) {
    try {
      console.log(`🎬 Loading ${feedType} videos from API...`);
      
      let endpoint = '/videos';
      const params = { page, limit };
      
      // Adjust endpoint based on feed type
      switch (feedType) {
        case 'following':
          endpoint = '/videos/following';
          break;
        case 'trending':
        case 'explore':
          endpoint = '/videos/trending';
          params.limit = limit || 20;
          break;
        case 'for_you':
        default:
          // Use default videos endpoint
          break;
      }
      
      const response = await apiService.get(endpoint, params);
      
      if (response.videos && Array.isArray(response.videos)) {
        const transformedVideos = this.transformApiVideos(response.videos);
        
        return {
          videos: transformedVideos,
          hasMore: response.pagination?.totalPages > page,
          page,
          totalCount: response.pagination?.total || transformedVideos.length
        };
      }
      
      // Fallback to mock data
      return this.getMockVideosByType(feedType, page, limit);
      
    } catch (error) {
      console.error(`❌ Failed to load ${feedType} videos:`, error);
      return this.getMockVideosByType(feedType, page, limit);
    }
  }

  /**
   * Mock videos by type (fallback)
   */
  static async getMockVideosByType(feedType, page = 1, limit = 10) {
    const delay = 800;
    
    return new Promise((resolve) => {
      setTimeout(() => {
        let videos = [...mockVideos];
        
        // Filter/sort based on feedType
        switch (feedType) {
          case 'following':
            videos = videos.filter(video => 
              ['u1', 'u2'].includes(video.user.id)
            );
            break;
          case 'for_you':
            videos = this.shuffleArray(videos);
            break;
          case 'explore':
          case 'trending':
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
    try {
      console.log(`❤️ Toggling like for video ${videoId}`);
      
      const response = await apiService.post(`/videos/${videoId}/like`);
      console.log('✅ Like toggled successfully:', response);
      
      return {
        isLiked: response.liked,
        likesChange: response.liked ? 1 : -1
      };
    } catch (error) {
      console.error('❌ Failed to toggle like:', error);
      
      // Fallback to mock behavior
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
  }

  /**
   * Toggle bookmark status
   */
  static async toggleBookmark(videoId, currentStatus) {
    try {
      console.log(`🔖 Toggling bookmark for video ${videoId}`);
      
      // Note: You might need to implement this endpoint on backend
      const response = await apiService.post(`/videos/${videoId}/bookmark`);
      
      return {
        isBookmarked: response.bookmarked
      };
    } catch (error) {
      console.error('❌ Failed to toggle bookmark:', error);
      
      // Fallback behavior
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            isBookmarked: !currentStatus
          });
        }, 300);
      });
    }
  }

  /**
   * Share video
   */
  static async shareVideo(videoId, shareType = 'general') {
    try {
      console.log(`📤 Sharing video ${videoId}`);
      
      // Mock share functionality for now
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            shareUrl: `https://app.example.com/video/${videoId}`,
            shareType
          });
        }, 500);
      });
    } catch (error) {
      console.error('❌ Failed to share video:', error);
      throw error;
    }
  }

  /**
   * Utility: Shuffle array
   */
  static shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
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
   * Get video analytics
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