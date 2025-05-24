// src/services/uploadService.js
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import mime from 'react-native-mime-types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.1.8:3001/api';

class VideoUploadService {
  constructor() {
    this.uploadTasks = new Map();
  }

  /**
   * Get auth token from storage
   */
  async getAuthToken() {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      return token;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * Upload video to backend
   */
  async uploadVideo(videoUri, metadata, onProgress) {
    try {
      console.log('📤 Starting video upload:', {
        uri: videoUri,
        metadata
      });

      // Get auth token
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Not authenticated. Please login first.');
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      if (!fileInfo.exists) {
        throw new Error('Video file not found');
      }

      console.log('📁 File info:', {
        size: `${(fileInfo.size / 1024 / 1024).toFixed(2)} MB`,
        uri: fileInfo.uri
      });

      // Check file size (100MB limit)
      if (fileInfo.size > 100 * 1024 * 1024) {
        throw new Error('Video file is too large. Maximum size is 100MB');
      }

      // Determine MIME type
      const mimeType = mime.lookup(videoUri) || 'video/mp4';

      // Create form data
      const formData = new FormData();
      
      // Append video file
      formData.append('video', {
        uri: videoUri,
        type: mimeType,
        name: `video_${Date.now()}.${mime.extension(mimeType) || 'mp4'}`
      });

      // Append metadata
      formData.append('title', metadata.title || 'Untitled');
      formData.append('description', metadata.description || '');
      
      if (metadata.duration) {
        formData.append('duration', metadata.duration.toString());
      }
      
      if (metadata.width) {
        formData.append('width', metadata.width.toString());
      }
      
      if (metadata.height) {
        formData.append('height', metadata.height.toString());
      }

      // Create upload task
      const uploadId = `upload_${Date.now()}`;
      const cancelTokenSource = axios.CancelToken.source();
      
      this.uploadTasks.set(uploadId, {
        id: uploadId,
        cancelToken: cancelTokenSource,
        startTime: Date.now()
      });

      // Upload with progress tracking
      const response = await axios.post(
        `${API_BASE_URL}/upload/video`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            
            console.log(`📊 Upload progress: ${percentCompleted}%`);
            
            if (onProgress) {
              onProgress({
                loaded: progressEvent.loaded,
                total: progressEvent.total,
                percentage: percentCompleted
              });
            }
          },
          cancelToken: cancelTokenSource.token
        }
      );

      // Clean up upload task
      this.uploadTasks.delete(uploadId);

      console.log('✅ Upload successful:', response.data);

      return {
        success: true,
        video: response.data.video,
        uploadInfo: response.data.uploadInfo,
        uploadId
      };

    } catch (error) {
      console.error('❌ Upload failed:', error);

      if (axios.isCancel(error)) {
        throw new Error('Upload cancelled');
      }

      if (error.response) {
        // Server responded with error
        const errorMessage = error.response.data?.error || 'Upload failed';
        throw new Error(errorMessage);
      } else if (error.request) {
        // No response from server
        throw new Error('Network error. Please check your connection.');
      } else {
        // Other errors
        throw error;
      }
    }
  }

  /**
   * Cancel an ongoing upload
   */
  cancelUpload(uploadId) {
    const uploadTask = this.uploadTasks.get(uploadId);
    if (uploadTask) {
      uploadTask.cancelToken.cancel('Upload cancelled by user');
      this.uploadTasks.delete(uploadId);
      return true;
    }
    return false;
  }

  /**
   * Get all active uploads
   */
  getActiveUploads() {
    return Array.from(this.uploadTasks.values());
  }

  /**
   * Check upload service status
   */
  async checkUploadStatus() {
    try {
      const response = await axios.get(`${API_BASE_URL}/upload/status`);
      return response.data;
    } catch (error) {
      console.error('Failed to check upload status:', error);
      return {
        status: 'unknown',
        error: error.message
      };
    }
  }

  /**
   * Prepare video for upload (get metadata)
   */
  async prepareVideoForUpload(videoUri) {
    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      
      // Get basic metadata
      const metadata = {
        uri: videoUri,
        size: fileInfo.size,
        sizeFormatted: `${(fileInfo.size / 1024 / 1024).toFixed(2)} MB`,
        filename: videoUri.split('/').pop(),
        mimeType: mime.lookup(videoUri) || 'video/mp4'
      };

      // In a real app, you would extract video duration, dimensions, etc.
      // For now, we'll use placeholder values
      metadata.duration = 0;
      metadata.width = null;
      metadata.height = null;

      return metadata;
    } catch (error) {
      console.error('Failed to prepare video:', error);
      throw error;
    }
  }

  /**
   * Retry failed upload
   */
  async retryUpload(videoUri, metadata, onProgress) {
    // Simply call uploadVideo again
    return this.uploadVideo(videoUri, metadata, onProgress);
  }
}

// Export singleton instance
const videoUploadService = new VideoUploadService();
export default videoUploadService;