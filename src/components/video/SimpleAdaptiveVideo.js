// src/components/video/SimpleAdaptiveVideo.js
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Text } from 'react-native';
import { Video } from 'expo-av';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  fillMode = 'smart',
  ...videoProps
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [videoStyle, setVideoStyle] = useState(styles.defaultVideo);

  // Enhanced error handler
  const handleError = useCallback((error) => {
    console.error(`Video error for ${source?.uri}:`, error);
    setHasError(true);
    setIsLoading(false);
    if (onError) onError(error);
  }, [source, onError]);

  // Enhanced load start handler
  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    if (onLoadStart) onLoadStart();
  }, [onLoadStart]);

  // Enhanced load complete handler
  const handleLoad = useCallback((status) => {
    setIsLoading(false);
    
    // Calculate video dimensions
    if (status.naturalSize) {
      const { width: videoWidth, height: videoHeight } = status.naturalSize;
      
      const videoAspectRatio = videoWidth / videoHeight;
      const screenAspectRatio = SCREEN_WIDTH / SCREEN_HEIGHT;
      
      let newStyle = {};
      
      // Apply different sizing based on fillMode and aspect ratios
      switch (fillMode) {
        case 'cover':
          newStyle = {
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
          };
          break;
        case 'fit':
          if (videoAspectRatio > screenAspectRatio) {
            newStyle = {
              width: SCREEN_WIDTH,
              height: SCREEN_WIDTH / videoAspectRatio,
            };
          } else {
            newStyle = {
              height: SCREEN_HEIGHT,
              width: SCREEN_HEIGHT * videoAspectRatio,
            };
          }
          break;
        case 'smart':
        default:
          const scale = Math.max(
            SCREEN_WIDTH / videoWidth,
            SCREEN_HEIGHT / videoHeight
          );
          
          newStyle = {
            width: videoWidth * scale,
            height: videoHeight * scale,
          };
          break;
      }
      
      setVideoStyle(newStyle);
    }
    
    if (onLoad) onLoad(status);
  }, [fillMode, onLoad]);

  // Handle source URL cleanup
  const getValidatedSource = () => {
    if (!source || !source.uri) return source;
    
    // Ensure URI is correctly formatted
    let uri = source.uri.trim();
    
    // Add http:// if missing
    if (uri && !uri.startsWith('http://') && !uri.startsWith('https://')) {
      uri = `http://${uri}`;
    }
    
    return { ...source, uri };
  };

  return (
    <View style={[styles.container, style]}>
      {isLoading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FE2C55" />
        </View>
      )}
      
      {hasError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to load video</Text>
        </View>
      ) : (
        <Video
          ref={videoRef}
          source={getValidatedSource()}
          style={[styles.mainVideo, videoStyle]}
          resizeMode="cover"
          shouldPlay={shouldPlay && !hasError}
          isLooping={isLooping}
          onLoad={handleLoad}
          onLoadStart={handleLoadStart}
          onError={handleError}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          useNativeControls={false}
          {...videoProps}
        />
      )}
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
  mainVideo: {
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  defaultVideo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default SimpleAdaptiveVideo;