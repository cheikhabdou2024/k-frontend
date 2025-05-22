// src/hooks/useVideoPlayer.js
import { useState, useRef, useCallback, useEffect } from 'react';
import { VIDEO_CONSTANTS } from '../utils/videoUtils';

export const useVideoPlayer = (videoId, isActive) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playbackStatus, setPlaybackStatus] = useState({});
  const [showPlayPauseIndicator, setShowPlayPauseIndicator] = useState(false);
  
  const videoRef = useRef(null);
  const indicatorTimeoutRef = useRef(null);

  // Auto-play when video becomes active
  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.playAsync();
    } else if (!isActive && videoRef.current) {
      videoRef.current.pauseAsync();
    }
  }, [isActive]);

  // Handle video load start
  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  // Handle video load success
  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Handle video load error
  const handleError = useCallback((error) => {
    setIsLoading(false);
    setError(error);
    console.error(`Video ${videoId} error:`, error);
  }, [videoId]);

  // Handle playback status updates
  const handlePlaybackStatusUpdate = useCallback((status) => {
    setPlaybackStatus(status);
    setIsPlaying(status.isPlaying || false);
  }, []);

  // Toggle play/pause
  const togglePlayPause = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      const status = await videoRef.current.getStatusAsync();
      const willPlay = !status.isPlaying;
      
      setShowPlayPauseIndicator(true);
      
      // Clear existing timeout
      if (indicatorTimeoutRef.current) {
        clearTimeout(indicatorTimeoutRef.current);
      }
      
      // Hide indicator after delay
      indicatorTimeoutRef.current = setTimeout(() => {
        setShowPlayPauseIndicator(false);
      }, VIDEO_CONSTANTS.PLAY_PAUSE_INDICATOR_DURATION);
      
      if (willPlay) {
        await videoRef.current.playAsync();
      } else {
        await videoRef.current.pauseAsync();
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  }, []);

  // Seek to position
  const seekTo = useCallback(async (positionMs) => {
    if (!videoRef.current) return;
    
    try {
      await videoRef.current.setPositionAsync(positionMs);
    } catch (error) {
      console.error('Error seeking video:', error);
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (indicatorTimeoutRef.current) {
        clearTimeout(indicatorTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    isPlaying,
    isLoading,
    error,
    playbackStatus,
    showPlayPauseIndicator,
    
    // Ref
    videoRef,
    
    // Handlers
    handleLoadStart,
    handleLoad,
    handleError,
    handlePlaybackStatusUpdate,
    togglePlayPause,
    seekTo,
  };
};