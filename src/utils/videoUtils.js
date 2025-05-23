// src/utils/videoUtils.js
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const VIDEO_CONSTANTS = {
  CONTAINER_WIDTH: width,
  CONTAINER_HEIGHT: height,
  DOUBLE_TAP_DELAY: 300,
  PLAY_PAUSE_INDICATOR_DURATION: 1000,
  HEART_ANIMATION_DURATION: 1500,
  SOUND_ICON_ANIMATION_DURATION: 1000,
};

export const VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 60,
  minimumViewTime: 500,
  waitForInteraction: false,
};

/**
 * Calculate video aspect ratio and dimensions
 */
export const calculateVideoSize = (videoWidth, videoHeight, containerWidth, containerHeight) => {
  const videoAspectRatio = videoWidth / videoHeight;
  const containerAspectRatio = containerWidth / containerHeight;
  
  let finalWidth, finalHeight;
  
  if (videoAspectRatio > containerAspectRatio) {
    // Video is wider than container
    finalHeight = containerHeight;
    finalWidth = finalHeight * videoAspectRatio;
  } else {
    // Video is taller than container
    finalWidth = containerWidth;
    finalHeight = finalWidth / videoAspectRatio;
  }
  
  return { width: finalWidth, height: finalHeight };
};

/**
 * Format video duration for display
 */
export const formatVideoDuration = (durationMs) => {
  if (!durationMs) return '0:00';
  
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Calculate video progress percentage
 */
export const calculateProgress = (positionMs, durationMs) => {
  if (!positionMs || !durationMs) return 0;
  return Math.min(positionMs / durationMs, 1);
};

/**
 * Generate video thumbnail URL
 */
export const generateThumbnailUrl = (videoUrl, timeStamp = 1) => {
  // In a real app, you would use a service to generate thumbnails
  // For now, return a placeholder or the video URL itself
  return videoUrl;
};

/**
 * Validate video URL
 */
export const isValidVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
  const hasValidExtension = videoExtensions.some(ext => 
    url.toLowerCase().includes(ext)
  );
  
  return hasValidExtension || url.includes('video') || url.includes('mp4');
};

/**
 * Get video quality settings based on device performance
 */
export const getOptimalVideoQuality = () => {
  // In a real app, you would check device capabilities
  // For now, return standard quality settings
  return {
    maxResolution: '1080p',
    bitrate: 'adaptive',
    codec: 'h264'
  };
};


/**
 * Determine optimal video resize mode based on aspect ratios
 */
export const getOptimalResizeMode = (videoWidth, videoHeight, screenWidth, screenHeight) => {
  if (!videoWidth || !videoHeight) return 'cover';
  
  const videoAspectRatio = videoWidth / videoHeight;
  const screenAspectRatio = screenWidth / screenHeight;
  const ratioDifference = Math.abs(videoAspectRatio - screenAspectRatio);
  
  // Thresholds for different handling
  const SIMILAR_RATIO_THRESHOLD = 0.3;
  const EXTREME_RATIO_THRESHOLD = 1.0;
  
  if (ratioDifference < SIMILAR_RATIO_THRESHOLD) {
    return 'cover'; // Similar ratios - just fill
  } else if (ratioDifference > EXTREME_RATIO_THRESHOLD) {
    return 'smart'; // Very different - smart handling with background
  } else {
    return 'fit'; // Moderate difference - fit with letterboxing
  }
};

/**
 * Check if video needs background treatment
 */
export const needsBackgroundTreatment = (videoWidth, videoHeight, screenWidth, screenHeight) => {
  const videoAspectRatio = videoWidth / videoHeight;
  const screenAspectRatio = screenWidth / screenHeight;
  const ratioDifference = Math.abs(videoAspectRatio - screenAspectRatio);
  
  return ratioDifference > 0.4; // Show background if ratios are significantly different
};


/**
 * Get video category based on aspect ratio
 */
export const getVideoCategory = (videoWidth, videoHeight) => {
  if (!videoWidth || !videoHeight) return 'unknown';
  
  const aspectRatio = videoWidth / videoHeight;
  
  if (aspectRatio < 0.6) {
    return 'vertical'; // 9:16, 3:4 etc
  } else if (aspectRatio < 1.3) {
    return 'square'; // 1:1, 4:3 etc
  } else if (aspectRatio < 2.0) {
    return 'landscape'; // 16:9, 3:2 etc
  } else {
    return 'widescreen'; // 21:9, cinematic etc
  }
};

 
/**
 * Log video info for debugging
 */
export const logVideoInfo = (videoWidth, videoHeight, screenWidth, screenHeight) => {
  const category = getVideoCategory(videoWidth, videoHeight);
  const resizeMode = getOptimalResizeMode(videoWidth, videoHeight, screenWidth, screenHeight);
  const needsBg = needsBackgroundTreatment(videoWidth, videoHeight, screenWidth, screenHeight);
  
  console.log(`📹 Video Analysis:`, {
    dimensions: `${videoWidth}x${videoHeight}`,
    aspectRatio: (videoWidth / videoHeight).toFixed(2),
    category,
    resizeMode,
    needsBackground: needsBg
  });
};
// ===========================================