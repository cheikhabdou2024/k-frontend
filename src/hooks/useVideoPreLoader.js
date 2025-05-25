// src/hooks/useVideoPreloader.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import * as FileSystem from 'expo-file-system';

const PRELOAD_CONFIG = {
  // How many videos to preload ahead
  PRELOAD_AHEAD_COUNT: 2,
  PRELOAD_BEHIND_COUNT: 1,
  
  // Cache settings
  MAX_CACHE_SIZE_MB: 100, // 100MB cache limit
  CACHE_EXPIRY_HOURS: 24,
  
  // Network settings
  PRELOAD_ON_CELLULAR: false, // Only preload on WiFi by default
  PRELOAD_CHUNK_SIZE: 1024 * 1024, // 1MB chunks
  
  // Performance settings
  MAX_CONCURRENT_PRELOADS: 2,
  PRELOAD_DELAY_MS: 500, // Delay before starting preload
};

export const useVideoPreloader = (videos, currentIndex) => {
  // State management
  const [preloadStatus, setPreloadStatus] = useState({});
  const [cacheInfo, setCacheInfo] = useState({});
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState({});
  
  // Refs
  const preloadQueue = useRef([]);
  const activePreloads = useRef(new Map());
  const preloadTimeouts = useRef(new Map());
  const appStateRef = useRef(AppState.currentState);

  // Cache directory
  const cacheDir = `${FileSystem.documentDirectory}video_cache/`;

  // Initialize cache directory
  useEffect(() => {
    initializeCacheDirectory();
    setupAppStateListener();
    return () => {
      cancelAllPreloads();
    };
  }, []);

  // Setup app state listener to pause preloading in background
  const setupAppStateListener = () => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - resume preloading
        resumePreloading();
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background - pause preloading
        pausePreloading();
      }
      appStateRef.current = nextAppState;
    });

    return () => subscription?.remove();
  };

  // Initialize cache directory
  const initializeCacheDirectory = async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
        console.log('📁 Video cache directory created');
      }
      
      // Clean expired cache on startup
      await cleanExpiredCache();
      
      // Get current cache info
      await updateCacheInfo();
    } catch (error) {
      console.error('❌ Failed to initialize cache directory:', error);
    }
  };

  // Update cache information
  const updateCacheInfo = async () => {
    try {
      const files = await FileSystem.readDirectoryAsync(cacheDir);
      let totalSize = 0;
      const fileInfo = {};

      for (const file of files) {
        const filePath = `${cacheDir}${file}`;
        const info = await FileSystem.getInfoAsync(filePath);
        if (info.exists) {
          totalSize += info.size || 0;
          fileInfo[file] = {
            size: info.size,
            modificationTime: info.modificationTime,
          };
        }
      }

      setCacheInfo({
        totalFiles: files.length,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        files: fileInfo,
      });
    } catch (error) {
      console.error('❌ Failed to update cache info:', error);
    }
  };

  // Clean expired cache files
  const cleanExpiredCache = async () => {
    try {
      const files = await FileSystem.readDirectoryAsync(cacheDir);
      const now = Date.now();
      const expiryTime = PRELOAD_CONFIG.CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = `${cacheDir}${file}`;
        const info = await FileSystem.getInfoAsync(filePath);
        
        if (info.exists && info.modificationTime) {
          const fileAge = now - info.modificationTime;
          if (fileAge > expiryTime) {
            await FileSystem.deleteAsync(filePath);
            console.log(`🗑️ Deleted expired cache file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to clean expired cache:', error);
    }
  };

  // Generate cache key for video
  const getCacheKey = (videoUrl) => {
    // Create a simple hash of the URL
    const hash = videoUrl.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `video_${Math.abs(hash)}.mp4`;
  };

  // Check if video is cached
  const isVideoCached = async (videoUrl) => {
    try {
      const cacheKey = getCacheKey(videoUrl);
      const cachePath = `${cacheDir}${cacheKey}`;
      const info = await FileSystem.getInfoAsync(cachePath);
      return info.exists;
    } catch (error) {
      return false;
    }
  };

  // Get cached video path
  const getCachedVideoPath = async (videoUrl) => {
    const isCached = await isVideoCached(videoUrl);
    if (isCached) {
      const cacheKey = getCacheKey(videoUrl);
      return `${cacheDir}${cacheKey}`;
    }
    return videoUrl; // Return original URL if not cached
  };

  // Preload a single video
  const preloadVideo = async (video, priority = 'normal') => {
    if (!video || !video.videoUrl) return;

    const videoId = video.id;
    const videoUrl = video.videoUrl;
    const cacheKey = getCacheKey(videoUrl);
    const cachePath = `${cacheDir}${cacheKey}`;

    // Check if already cached
    if (await isVideoCached(videoUrl)) {
      console.log(`✅ Video ${videoId} already cached`);
      setPreloadStatus(prev => ({
        ...prev,
        [videoId]: 'cached'
      }));
      return;
    }

    // Check if already preloading
    if (activePreloads.current.has(videoId)) {
      console.log(`⏳ Video ${videoId} already preloading`);
      return;
    }

    // Check cache size limit
    const currentCacheSizeMB = parseFloat(cacheInfo.totalSizeMB || 0);
    if (currentCacheSizeMB > PRELOAD_CONFIG.MAX_CACHE_SIZE_MB) {
      console.log(`💾 Cache size limit reached, cleaning old files...`);
      await cleanOldCacheFiles();
    }

    try {
      console.log(`📥 Starting preload for video ${videoId} (${priority} priority)`);
      
      setPreloadStatus(prev => ({
        ...prev,
        [videoId]: 'preloading'
      }));

      setPreloadProgress(prev => ({
        ...prev,
        [videoId]: 0
      }));

      // Create download resumable
      const downloadResumable = FileSystem.createDownloadResumable(
        videoUrl,
        cachePath,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          setPreloadProgress(prev => ({
            ...prev,
            [videoId]: Math.round(progress * 100)
          }));
        }
      );

      // Store the download reference
      activePreloads.current.set(videoId, downloadResumable);

      // Start download
      const result = await downloadResumable.downloadAsync();
      
      if (result && result.uri) {
        console.log(`✅ Video ${videoId} preloaded successfully`);
        setPreloadStatus(prev => ({
          ...prev,
          [videoId]: 'cached'
        }));
        
        // Update cache info
        await updateCacheInfo();
      }

    } catch (error) {
      console.error(`❌ Failed to preload video ${videoId}:`, error);
      setPreloadStatus(prev => ({
        ...prev,
        [videoId]: 'failed'
      }));
    } finally {
      // Clean up
      activePreloads.current.delete(videoId);
      setPreloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[videoId];
        return newProgress;
      });
    }
  };

  // Clean old cache files to make space
  const cleanOldCacheFiles = async () => {
    try {
      const files = await FileSystem.readDirectoryAsync(cacheDir);
      const fileInfoList = [];

      // Get file info with modification times
      for (const file of files) {
        const filePath = `${cacheDir}${file}`;
        const info = await FileSystem.getInfoAsync(filePath);
        if (info.exists) {
          fileInfoList.push({
            name: file,
            path: filePath,
            modificationTime: info.modificationTime || 0,
            size: info.size || 0,
          });
        }
      }

      // Sort by modification time (oldest first)
      fileInfoList.sort((a, b) => a.modificationTime - b.modificationTime);

      // Delete oldest files until we're under the limit
      const targetSizeMB = PRELOAD_CONFIG.MAX_CACHE_SIZE_MB * 0.8; // Target 80% of limit
      let currentSizeMB = fileInfoList.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024);

      for (const file of fileInfoList) {
        if (currentSizeMB <= targetSizeMB) break;
        
        await FileSystem.deleteAsync(file.path);
        currentSizeMB -= file.size / (1024 * 1024);
        console.log(`🗑️ Deleted old cache file: ${file.name}`);
      }

      await updateCacheInfo();
    } catch (error) {
      console.error('❌ Failed to clean old cache files:', error);
    }
  };

  // Update preload queue based on current index
  const updatePreloadQueue = useCallback(() => {
    if (!videos || videos.length === 0) return;

    const newQueue = [];
    
    // Add videos ahead
    for (let i = 1; i <= PRELOAD_CONFIG.PRELOAD_AHEAD_COUNT; i++) {
      const index = currentIndex + i;
      if (index < videos.length) {
        newQueue.push({
          video: videos[index],
          priority: i === 1 ? 'high' : 'normal'
        });
      }
    }

    // Add videos behind
    for (let i = 1; i <= PRELOAD_CONFIG.PRELOAD_BEHIND_COUNT; i++) {
      const index = currentIndex - i;
      if (index >= 0) {
        newQueue.push({
          video: videos[index],
          priority: 'low'
        });
      }
    }

    preloadQueue.current = newQueue;
    processPreloadQueue();
  }, [videos, currentIndex]);

  // Process the preload queue
  const processPreloadQueue = async () => {
    if (isPreloading) return;
    if (preloadQueue.current.length === 0) return;
    if (activePreloads.current.size >= PRELOAD_CONFIG.MAX_CONCURRENT_PRELOADS) return;

    setIsPreloading(true);

    // Process high priority items first
    const sortedQueue = [...preloadQueue.current].sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    for (const item of sortedQueue) {
      if (activePreloads.current.size >= PRELOAD_CONFIG.MAX_CONCURRENT_PRELOADS) {
        break;
      }

      const { video, priority } = item;
      const videoId = video.id;

      // Skip if already cached or preloading
      if (preloadStatus[videoId] === 'cached' || activePreloads.current.has(videoId)) {
        continue;
      }

      // Add delay for non-high priority items
      if (priority !== 'high') {
        await new Promise(resolve => setTimeout(resolve, PRELOAD_CONFIG.PRELOAD_DELAY_MS));
      }

      // Start preloading
      preloadVideo(video, priority);
    }

    setIsPreloading(false);
  };

  // Pause all preloading
  const pausePreloading = () => {
    console.log('⏸️ Pausing video preloading');
    for (const [videoId, downloadResumable] of activePreloads.current) {
      downloadResumable.pauseAsync();
    }
  };

  // Resume preloading
  const resumePreloading = () => {
    console.log('▶️ Resuming video preloading');
    for (const [videoId, downloadResumable] of activePreloads.current) {
      downloadResumable.resumeAsync();
    }
  };

  // Cancel all preloads
  const cancelAllPreloads = () => {
    console.log('❌ Cancelling all video preloads');
    
    // Cancel all timeouts
    for (const timeout of preloadTimeouts.current.values()) {
      clearTimeout(timeout);
    }
    preloadTimeouts.current.clear();

    // Cancel all active downloads
    for (const [videoId, downloadResumable] of activePreloads.current) {
      downloadResumable.cancelAsync();
    }
    activePreloads.current.clear();
    
    setIsPreloading(false);
  };

  // Clear entire cache
  const clearCache = async () => {
    try {
      console.log('🗑️ Clearing video cache');
      cancelAllPreloads();
      
      const files = await FileSystem.readDirectoryAsync(cacheDir);
      for (const file of files) {
        await FileSystem.deleteAsync(`${cacheDir}${file}`);
      }
      
      setPreloadStatus({});
      setPreloadProgress({});
      await updateCacheInfo();
      
      console.log('✅ Cache cleared successfully');
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
    }
  };

  // Update preload queue when currentIndex changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updatePreloadQueue();
    }, 100); // Small delay to avoid rapid updates

    preloadTimeouts.current.set('updateQueue', timeoutId);
    
    return () => {
      clearTimeout(timeoutId);
      preloadTimeouts.current.delete('updateQueue');
    };
  }, [currentIndex, videos]);

  // Public API
  return {
    // State
    preloadStatus,
    preloadProgress,
    cacheInfo,
    isPreloading,
    
    // Functions
    getCachedVideoPath,
    isVideoCached,
    preloadVideo,
    clearCache,
    pausePreloading,
    resumePreloading,
    
    // Stats
    activePreloadsCount: activePreloads.current.size,
    queueLength: preloadQueue.current.length,
  };
};