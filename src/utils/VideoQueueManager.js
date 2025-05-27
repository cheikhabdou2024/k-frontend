// src/utils/VideoQueueManager.js
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

class VideoQueueManager {
  constructor() {
    this.queue = new Map(); // videoId -> video data
    this.preloadQueue = new Set(); // Videos currently preloading
    this.loadedVideos = new Map(); // videoId -> loaded video ref
    this.loadingPromises = new Map(); // videoId -> loading promise
    
    // Configuration
    this.config = {
      maxPreloadQueue: 3,
      maxLoadedVideos: 5,
      preloadDistance: 2, // How many videos ahead to preload
      memoryThreshold: 150, // MB
      cleanupInterval: 30000, // 30 seconds
    };
    
    // State tracking
    this.currentVideoIndex = 0;
    this.networkQuality = 'good';
    this.isAppActive = true;
    this.memoryUsage = 0;
    
    // Initialize
    this.setupNetworkMonitoring();
    this.setupAppStateMonitoring();
    this.startMemoryMonitoring();
  }

  /**
   * Setup network quality monitoring
   */
  setupNetworkMonitoring() {
    NetInfo.addEventListener(state => {
      // Determine network quality
      if (!state.isConnected) {
        this.networkQuality = 'offline';
      } else if (state.type === 'cellular') {
        switch (state.details?.cellularGeneration) {
          case '2g':
            this.networkQuality = 'poor';
            break;
          case '3g':
            this.networkQuality = 'fair';
            break;
          case '4g':
          case '5g':
            this.networkQuality = 'good';
            break;
          default:
            this.networkQuality = 'fair';
        }
      } else if (state.type === 'wifi') {
        this.networkQuality = 'excellent';
      }
      
      console.log('📶 Network quality changed:', this.networkQuality);
      this.adjustPreloadingBasedOnNetwork();
    });
  }

  /**
   * Setup app state monitoring
   */
  setupAppStateMonitoring() {
    AppState.addEventListener('change', (nextAppState) => {
      this.isAppActive = nextAppState === 'active';
      
      if (!this.isAppActive) {
        console.log('📱 App went to background, pausing preloading');
        this.pausePreloading();
      } else {
        console.log('📱 App became active, resuming preloading');
        this.resumePreloading();
      }
    });
  }

  /**
   * Start memory monitoring
   */
  startMemoryMonitoring() {
    setInterval(() => {
      this.checkMemoryUsage();
    }, this.config.cleanupInterval);
  }

  /**
   * Add videos to the queue
   */
  setVideoQueue(videos, currentIndex = 0) {
    console.log(`📼 Setting video queue with ${videos.length} videos, starting at ${currentIndex}`);
    
    this.queue.clear();
    videos.forEach((video, index) => {
      this.queue.set(video.id, { ...video, index });
    });
    
    this.currentVideoIndex = currentIndex;
    this.startPreloading();
  }

  /**
   * Update current video index and trigger preloading
   */
  updateCurrentIndex(newIndex) {
    if (newIndex !== this.currentVideoIndex) {
      console.log(`📹 Current video index changed: ${this.currentVideoIndex} → ${newIndex}`);
      this.currentVideoIndex = newIndex;
      this.startPreloading();
    }
  }

  /**
   * Start preloading videos based on current position
   */
  startPreloading() {
    if (!this.isAppActive || this.networkQuality === 'offline') {
      console.log('⏸️ Skipping preloading - app inactive or offline');
      return;
    }

    const videosToPreload = this.getVideosToPreload();
    
    videosToPreload.forEach(video => {
      if (!this.preloadQueue.has(video.id) && !this.loadedVideos.has(video.id)) {
        this.preloadVideo(video);
      }
    });
  }

  /**
   * Get videos that should be preloaded
   */
  getVideosToPreload() {
    const videos = [];
    const queueArray = Array.from(this.queue.values());
    
    // Preload next videos
    for (let i = 1; i <= this.config.preloadDistance; i++) {
      const nextIndex = this.currentVideoIndex + i;
      if (nextIndex < queueArray.length) {
        videos.push(queueArray[nextIndex]);
      }
    }
    
    // Preload previous video for smooth back navigation
    const prevIndex = this.currentVideoIndex - 1;
    if (prevIndex >= 0) {
      videos.push(queueArray[prevIndex]);
    }
    
    return videos;
  }

  /**
   * Preload a specific video
   */
  async preloadVideo(video) {
    if (this.preloadQueue.size >= this.config.maxPreloadQueue) {
      console.log('⏭️ Preload queue full, skipping:', video.id);
      return;
    }

    if (this.loadingPromises.has(video.id)) {
      console.log('⏳ Video already loading:', video.id);
      return this.loadingPromises.get(video.id);
    }

    console.log(`🔮 Starting preload for video: ${video.id}`);
    this.preloadQueue.add(video.id);

    const loadingPromise = this.createVideoLoadingPromise(video);
    this.loadingPromises.set(video.id, loadingPromise);

    try {
      const loadedVideo = await loadingPromise;
      this.onVideoPreloaded(video.id, loadedVideo);
      return loadedVideo;
    } catch (error) {
      this.onVideoPreloadError(video.id, error);
      throw error;
    } finally {
      this.preloadQueue.delete(video.id);
      this.loadingPromises.delete(video.id);
    }
  }

  /**
   * Create a promise for video loading (mock implementation)
   */
  createVideoLoadingPromise(video) {
    return new Promise((resolve, reject) => {
      // Simulate network delay based on quality
      const delay = this.getLoadingDelay();
      
      setTimeout(() => {
        // Simulate random failure (5% chance)
        if (Math.random() < 0.05) {
          reject(new Error('Network error during preload'));
          return;
        }
        
        // Mock loaded video object
        const loadedVideo = {
          id: video.id,
          uri: video.videoUrl,
          duration: Math.random() * 60000 + 10000, // 10-70 seconds
          dimensions: {
            width: 1080,
            height: 1920
          },
          loadedAt: Date.now(),
          memorySize: Math.random() * 20 + 5 // 5-25 MB
        };
        
        resolve(loadedVideo);
      }, delay);
    });
  }

  /**
   * Get loading delay based on network quality
   */
  getLoadingDelay() {
    switch (this.networkQuality) {
      case 'excellent': return 500 + Math.random() * 500;
      case 'good': return 1000 + Math.random() * 1000;
      case 'fair': return 2000 + Math.random() * 2000;
      case 'poor': return 4000 + Math.random() * 4000;
      default: return 1500;
    }
  }

  /**
   * Handle successful video preload
   */
  onVideoPreloaded(videoId, loadedVideo) {
    console.log(`✅ Video preloaded successfully: ${videoId}`);
    
    // Store loaded video
    this.loadedVideos.set(videoId, loadedVideo);
    
    // Update memory usage
    this.memoryUsage += loadedVideo.memorySize;
    
    // Cleanup if necessary
    if (this.loadedVideos.size > this.config.maxLoadedVideos) {
      this.cleanupOldVideos();
    }
  }

  /**
   * Handle video preload error
   */
  onVideoPreloadError(videoId, error) {
    console.error(`❌ Video preload failed: ${videoId}`, error);
    
    // Could implement retry logic here
    // For now, just log the error
  }

  /**
   * Check if video is preloaded
   */
  isVideoPreloaded(videoId) {
    return this.loadedVideos.has(videoId);
  }

  /**
   * Get preloaded video
   */
  getPreloadedVideo(videoId) {
    return this.loadedVideos.get(videoId);
  }

  /**
   * Clean up old/unused videos to free memory
   */
  cleanupOldVideos() {
    console.log('🧹 Cleaning up old preloaded videos');
    
    const currentTime = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    const videosToRemove = [];
    
    // Find old videos to remove
    for (const [videoId, video] of this.loadedVideos.entries()) {
      const age = currentTime - video.loadedAt;
      const videoIndex = this.queue.get(videoId)?.index;
      
      // Remove if video is old and far from current position
      if (age > maxAge && Math.abs(videoIndex - this.currentVideoIndex) > 3) {
        videosToRemove.push(videoId);
      }
    }
    
    // Remove oldest videos if still over limit
    if (this.loadedVideos.size > this.config.maxLoadedVideos) {
      const sortedVideos = Array.from(this.loadedVideos.entries())
        .sort((a, b) => a[1].loadedAt - b[1].loadedAt);
      
      const numToRemove = this.loadedVideos.size - this.config.maxLoadedVideos + 1;
      for (let i = 0; i < numToRemove && i < sortedVideos.length; i++) {
        videosToRemove.push(sortedVideos[i][0]);
      }
    }
    
    // Actually remove the videos
    videosToRemove.forEach(videoId => {
      const video = this.loadedVideos.get(videoId);
      if (video) {
        this.memoryUsage -= video.memorySize;
        this.loadedVideos.delete(videoId);
        console.log(`🗑️ Removed old video from memory: ${videoId}`);
      }
    });
    
    console.log(`🧹 Cleanup complete. Memory usage: ${this.memoryUsage.toFixed(1)}MB`);
  }

  /**
   * Check memory usage and cleanup if necessary
   */
  checkMemoryUsage() {
    if (this.memoryUsage > this.config.memoryThreshold) {
      console.warn(`⚠️ High memory usage detected: ${this.memoryUsage.toFixed(1)}MB`);
      this.cleanupOldVideos();
    }
  }

  /**
   * Adjust preloading behavior based on network quality
   */
  adjustPreloadingBasedOnNetwork() {
    switch (this.networkQuality) {
      case 'excellent':
        this.config.preloadDistance = 3;
        this.config.maxPreloadQueue = 4;
        break;
      case 'good':
        this.config.preloadDistance = 2;
        this.config.maxPreloadQueue = 3;
        break;
      case 'fair':
        this.config.preloadDistance = 1;
        this.config.maxPreloadQueue = 2;
        break;
      case 'poor':
        this.config.preloadDistance = 1;
        this.config.maxPreloadQueue = 1;
        break;
      case 'offline':
        this.config.preloadDistance = 0;
        this.config.maxPreloadQueue = 0;
        this.pausePreloading();
        break;
    }
    
    console.log(`📶 Adjusted preloading for ${this.networkQuality} network:`, {
      preloadDistance: this.config.preloadDistance,
      maxPreloadQueue: this.config.maxPreloadQueue
    });
  }

  /**
   * Pause all preloading
   */
  pausePreloading() {
    console.log('⏸️ Pausing all video preloading');
    
    // Cancel ongoing preloads
    this.preloadQueue.clear();
    this.loadingPromises.clear();
  }

  /**
   * Resume preloading
   */
  resumePreloading() {
    console.log('▶️ Resuming video preloading');
    this.startPreloading();
  }

  /**
   * Get preloading statistics
   */
  getStats() {
    return {
      queueSize: this.queue.size,
      preloadQueueSize: this.preloadQueue.size,
      loadedVideosCount: this.loadedVideos.size,
      memoryUsage: this.memoryUsage,
      networkQuality: this.networkQuality,
      isAppActive: this.isAppActive,
      currentVideoIndex: this.currentVideoIndex
    };
  }

  /**
   * Force cleanup (for manual memory management)
   */
  forceCleanup() {
    console.log('🔄 Force cleanup initiated');
    
    this.pausePreloading();
    this.loadedVideos.clear();
    this.memoryUsage = 0;
    
    // Restart preloading after cleanup
    setTimeout(() => {
      this.resumePreloading();
    }, 1000);
  }

  /**
   * Get next video for preloading (used by PerfectAdaptiveVideo)
   */
  getNextVideoForPreload() {
    const queueArray = Array.from(this.queue.values());
    const nextIndex = this.currentVideoIndex + 1;
    
    if (nextIndex < queueArray.length) {
      return queueArray[nextIndex];
    }
    
    return null;
  }

  /**
   * Preload specific video by ID
   */
  async preloadVideoById(videoId) {
    const video = this.queue.get(videoId);
    if (!video) {
      throw new Error(`Video not found in queue: ${videoId}`);
    }
    
    return this.preloadVideo(video);
  }

  /**
   * Remove video from all caches
   */
  removeVideo(videoId) {
    console.log(`🗑️ Removing video from all caches: ${videoId}`);
    
    // Remove from loaded videos
    const video = this.loadedVideos.get(videoId);
    if (video) {
      this.memoryUsage -= video.memorySize;
      this.loadedVideos.delete(videoId);
    }
    
    // Remove from preload queue
    this.preloadQueue.delete(videoId);
    
    // Cancel loading promise if exists
    this.loadingPromises.delete(videoId);
  }

  /**
   * Clear all caches and reset
   */
  reset() {
    console.log('🔄 Resetting VideoQueueManager');
    
    this.queue.clear();
    this.preloadQueue.clear();
    this.loadedVideos.clear();
    this.loadingPromises.clear();
    this.memoryUsage = 0;
    this.currentVideoIndex = 0;
  }

  /**
   * Destroy the queue manager
   */
  destroy() {
    console.log('💥 Destroying VideoQueueManager');
    
    this.reset();
    // Remove event listeners would go here in a real implementation
  }
}

// Create singleton instance
const videoQueueManager = new VideoQueueManager();

export default videoQueueManager;