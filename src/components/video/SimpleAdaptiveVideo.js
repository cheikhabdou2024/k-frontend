// src/components/video/SimpleAdaptiveVideo.js
import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Video } from 'expo-av';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Simple adaptive video container that handles any resolution
 * TikTok-style without external dependencies
 */
const SimpleAdaptiveVideo = ({
  source,
  shouldPlay,
  isLooping = true,
  style,
  onLoad,
  onLoadStart,
  onError,
  onPlaybackStatusUpdate,
  videoRef,
  fillMode = 'smart', // 'smart', 'cover', 'fit'
  ...videoProps
}) => {
  const [videoStyle, setVideoStyle] = useState(styles.defaultVideo);
  const [backgroundStyle, setBackgroundStyle] = useState(null);

  /**
   * Calculate optimal video sizing
   */
  const calculateVideoLayout = (videoWidth, videoHeight) => {
    if (!videoWidth || !videoHeight) return;

    const videoAspectRatio = videoWidth / videoHeight;
    const screenAspectRatio = SCREEN_WIDTH / SCREEN_HEIGHT;

    let mainVideoStyle = {};
    let bgVideoStyle = null;

    switch (fillMode) {
      case 'cover':
        // Fill screen completely (TikTok default for most videos)
        mainVideoStyle = {
          width: SCREEN_WIDTH,
          height: SCREEN_HEIGHT,
        };
        break;

      case 'fit':
        // Fit entire video with black bars if needed
        if (videoAspectRatio > screenAspectRatio) {
          // Video is wider
          mainVideoStyle = {
            width: SCREEN_WIDTH,
            height: SCREEN_WIDTH / videoAspectRatio,
          };
        } else {
          // Video is taller or same ratio
          mainVideoStyle = {
            height: SCREEN_HEIGHT,
            width: SCREEN_HEIGHT * videoAspectRatio,
          };
        }
        break;

      case 'smart':
      default:
        // Smart mode: fill screen but show background for very different ratios
        const ratioThreshold = 0.3; // How different ratios can be before showing background
        const ratioDifference = Math.abs(videoAspectRatio - screenAspectRatio);
        
        if (ratioDifference < ratioThreshold) {
          // Similar aspect ratios - just fill the screen
          mainVideoStyle = {
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
          };
        } else {
          // Very different aspect ratios - use smart sizing
          const scale = Math.max(
            SCREEN_WIDTH / videoWidth,
            SCREEN_HEIGHT / videoHeight
          );
          
          const scaledWidth = videoWidth * scale;
          const scaledHeight = videoHeight * scale;
          
          mainVideoStyle = {
            width: scaledWidth,
            height: scaledHeight,
          };

          // Create a background video that covers the screen
          bgVideoStyle = {
            position: 'absolute',
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
            opacity: 0.3, // Dimmed background
          };
        }
        break;
    }

    setVideoStyle(mainVideoStyle);
    setBackgroundStyle(bgVideoStyle);
  };

  /**
   * Handle video load and calculate dimensions
   */
  const handleVideoLoad = (status) => {
    if (status.naturalSize) {
      const { width: videoWidth, height: videoHeight } = status.naturalSize;
      
      console.log(`📐 Video loaded: ${videoWidth}x${videoHeight} (${(videoWidth/videoHeight).toFixed(2)}:1)`);
      console.log(`📱 Screen: ${SCREEN_WIDTH}x${SCREEN_HEIGHT} (${(SCREEN_WIDTH/SCREEN_HEIGHT).toFixed(2)}:1)`);
      
      calculateVideoLayout(videoWidth, videoHeight);
    }
    
    if (onLoad) {
      onLoad(status);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Background video for letterboxing effect */}
      {backgroundStyle && (
        <Video
          source={source}
          style={[styles.backgroundVideo, backgroundStyle]}
          resizeMode="cover"
          shouldPlay={shouldPlay}
          isLooping={isLooping}
          isMuted={true}
          rate={1.0}
          volume={0}
        />
      )}
      
      {/* Main video */}
      <Video
        ref={videoRef}
        source={source}
        style={[styles.mainVideo, videoStyle]}
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
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  backgroundVideo: {
    zIndex: 1,
  },
  mainVideo: {
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  defaultVideo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});

export default SimpleAdaptiveVideo;