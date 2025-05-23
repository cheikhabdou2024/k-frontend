// src/components/video/AdaptiveVideoContainer.js
import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Video } from 'expo-av';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * TikTok-style adaptive video container that handles any resolution
 * - Preserves aspect ratio
 * - Fills screen intelligently
 * - Adds blur background for letterboxing when needed
 */
const AdaptiveVideoContainer = ({
  source,
  shouldPlay,
  isLooping = true,
  style,
  onLoad,
  onLoadStart,
  onError,
  onPlaybackStatusUpdate,
  videoRef,
  resizeMode = 'smart', // 'smart', 'cover', 'contain', 'stretch'
  showBlurBackground = true,
  ...videoProps
}) => {
  const [videoDimensions, setVideoDimensions] = useState(null);
  const [calculatedStyle, setCalculatedStyle] = useState({});
  const [needsBackground, setNeedsBackground] = useState(false);
  
  const backgroundVideoRef = useRef(null);

  /**
   * Calculate optimal video sizing based on video and screen dimensions
   */
  const calculateVideoLayout = (videoWidth, videoHeight) => {
    if (!videoWidth || !videoHeight) return {};

    const videoAspectRatio = videoWidth / videoHeight;
    const screenAspectRatio = SCREEN_WIDTH / SCREEN_HEIGHT;

    let finalWidth, finalHeight, scale = 1;
    let translateX = 0, translateY = 0;

    switch (resizeMode) {
      case 'cover':
        // Always fill screen completely (crop if needed)
        if (videoAspectRatio > screenAspectRatio) {
          // Video is wider - fit height, crop width
          finalHeight = SCREEN_HEIGHT;
          finalWidth = finalHeight * videoAspectRatio;
          translateX = -(finalWidth - SCREEN_WIDTH) / 2;
        } else {
          // Video is taller - fit width, crop height
          finalWidth = SCREEN_WIDTH;
          finalHeight = finalWidth / videoAspectRatio;
          translateY = -(finalHeight - SCREEN_HEIGHT) / 2;
        }
        setNeedsBackground(false);
        break;

      case 'contain':
        // Fit entire video on screen (letterbox if needed)
        if (videoAspectRatio > screenAspectRatio) {
          // Video is wider - fit width
          finalWidth = SCREEN_WIDTH;
          finalHeight = finalWidth / videoAspectRatio;
        } else {
          // Video is taller - fit height
          finalHeight = SCREEN_HEIGHT;
          finalWidth = finalHeight * videoAspectRatio;
        }
        setNeedsBackground(finalHeight < SCREEN_HEIGHT || finalWidth < SCREEN_WIDTH);
        break;

      case 'smart':
      default:
        // TikTok-style smart sizing
        const widthRatio = SCREEN_WIDTH / videoWidth;
        const heightRatio = SCREEN_HEIGHT / videoHeight;
        
        // Use the larger ratio to ensure the video covers the screen
        const optimalRatio = Math.max(widthRatio, heightRatio);
        
        finalWidth = videoWidth * optimalRatio;
        finalHeight = videoHeight * optimalRatio;
        
        // Center the video
        translateX = (SCREEN_WIDTH - finalWidth) / 2;
        translateY = (SCREEN_HEIGHT - finalHeight) / 2;
        
        // Only show background if there are gaps
        setNeedsBackground(
          finalHeight < SCREEN_HEIGHT * 0.95 || finalWidth < SCREEN_WIDTH * 0.95
        );
        break;

      case 'stretch':
        // Fill screen exactly (may distort)
        finalWidth = SCREEN_WIDTH;
        finalHeight = SCREEN_HEIGHT;
        setNeedsBackground(false);
        break;
    }

    return {
      width: finalWidth,
      height: finalHeight,
      transform: [
        { translateX },
        { translateY },
        { scale }
      ]
    };
  };

  /**
   * Handle video load and calculate dimensions
   */
  const handleVideoLoad = (status) => {
    if (status.naturalSize) {
      const { width: videoWidth, height: videoHeight } = status.naturalSize;
      
      console.log(`📐 Video dimensions: ${videoWidth}x${videoHeight}`);
      
      setVideoDimensions({ width: videoWidth, height: videoHeight });
      
      const layout = calculateVideoLayout(videoWidth, videoHeight);
      setCalculatedStyle(layout);
      
      console.log('📐 Calculated layout:', layout);
    }
    
    if (onLoad) {
      onLoad(status);
    }
  };

  /**
   * Render background video (blurred) for letterboxing effect
   */
  const renderBackgroundVideo = () => {
    if (!needsBackground || !showBlurBackground || !source) return null;

    return (
      <View style={styles.backgroundContainer}>
        <Video
          ref={backgroundVideoRef}
          source={source}
          style={styles.backgroundVideo}
          resizeMode="cover"
          shouldPlay={shouldPlay}
          isLooping={isLooping}
          isMuted={true} // Background video should be muted
          rate={1.0}
          volume={0}
        />
        <BlurView intensity={20} style={styles.blurOverlay} />
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Blurred background video */}
      {renderBackgroundVideo()}
      
      {/* Main video */}
      <Video
        ref={videoRef}
        source={source}
        style={[
          styles.mainVideo,
          calculatedStyle.width && calculatedStyle.height
            ? calculatedStyle
            : styles.defaultVideo
        ]}
        resizeMode="cover"
        shouldPlay={shouldPlay}
        isLooping={isLooping}
        onLoad={handleVideoLoad}
        onLoadStart={onLoadStart}
        onError={onError}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        useNativeControls={false}
        {...videoProps}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    top: 0,
    left: 0,
  },
  backgroundVideo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  blurOverlay: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    top: 0,
    left: 0,
  },
  mainVideo: {
    backgroundColor: 'transparent',
  },
  defaultVideo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});

export default AdaptiveVideoContainer;