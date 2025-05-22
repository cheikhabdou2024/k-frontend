// src/services/commentService.js
const API_BASE_URL = 'http://192.168.1.8:3001/api';

class CommentService {
  /**
   * Get comments for a specific video
   * @param {string|number} videoId - The video ID
   * @param {number} page - Page number for pagination
   * @param {number} limit - Number of comments per page
   * @returns {Promise<Object>} Comments data with pagination info
   */
  async getVideoComments(videoId, page = 1, limit = 20) {
    try {
      console.log(`Fetching comments for video ${videoId}, page ${page}`);
      
      const response = await fetch(
        `${API_BASE_URL}/videos/${videoId}/comments?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Comments fetched successfully:', data);
      
      return {
        comments: data,
        hasMore: data.length === limit,
        page,
        limit
      };
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  /**
   * Add a comment to a video
   * @param {string|number} videoId - The video ID
   * @param {string} content - Comment content
   * @param {string} authToken - User authentication token
   * @returns {Promise<Object>} Created comment data
   */
  async addComment(videoId, content, authToken) {
    try {
      console.log(`Adding comment to video ${videoId}`);
      
      const response = await fetch(`${API_BASE_URL}/videos/${videoId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Comment added successfully:', data);
      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  /**
   * Delete a comment
   * @param {string|number} commentId - The comment ID
   * @param {string} authToken - User authentication token
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteComment(commentId, authToken) {
    try {
      console.log(`Deleting comment ${commentId}`);
      
      const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Comment deleted successfully:', data);
      return data;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  /**
   * Get comment count for a video
   * @param {string|number} videoId - The video ID
   * @returns {Promise<Object>} Comment count data
   */
  async getCommentCount(videoId) {
    try {
      console.log(`Fetching comment count for video ${videoId}`);
      
      const response = await fetch(`${API_BASE_URL}/videos/${videoId}/comments/count`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Comment count fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('Error fetching comment count:', error);
      throw error;
    }
  }

  /**
   * Like or unlike a comment
   * @param {string|number} commentId - The comment ID
   * @param {string} authToken - User authentication token
   * @returns {Promise<Object>} Like status
   */
  async toggleCommentLike(commentId, authToken) {
    try {
      console.log(`Toggling like for comment ${commentId}`);
      
      const response = await fetch(`${API_BASE_URL}/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Comment like toggled successfully:', data);
      return data;
    } catch (error) {
      console.error('Error toggling comment like:', error);
      throw error;
    }
  }

  /**
   * Report a comment
   * @param {string|number} commentId - The comment ID
   * @param {string} reason - Report reason
   * @param {string} authToken - User authentication token
   * @returns {Promise<Object>} Report confirmation
   */
  async reportComment(commentId, reason, authToken) {
    try {
      console.log(`Reporting comment ${commentId} for: ${reason}`);
      
      const response = await fetch(`${API_BASE_URL}/comments/${commentId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Comment reported successfully:', data);
      return data;
    } catch (error) {
      console.error('Error reporting comment:', error);
      throw error;
    }
  }

  /**
   * Pin or unpin a comment (for video owners)
   * @param {string|number} commentId - The comment ID
   * @param {string} authToken - User authentication token
   * @returns {Promise<Object>} Pin status
   */
  async toggleCommentPin(commentId, authToken) {
    try {
      console.log(`Toggling pin status for comment ${commentId}`);
      
      const response = await fetch(`${API_BASE_URL}/comments/${commentId}/pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Comment pin toggled successfully:', data);
      return data;
    } catch (error) {
      console.error('Error toggling comment pin:', error);
      throw error;
    }
  }

  /**
   * Get replies to a specific comment
   * @param {string|number} commentId - The parent comment ID
   * @param {number} page - Page number for pagination
   * @param {number} limit - Number of replies per page
   * @returns {Promise<Object>} Replies data
   */
  async getCommentReplies(commentId, page = 1, limit = 10) {
    try {
      console.log(`Fetching replies for comment ${commentId}, page ${page}`);
      
      const response = await fetch(
        `${API_BASE_URL}/comments/${commentId}/replies?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Replies fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('Error fetching replies:', error);
      throw error;
    }
  }

  /**
   * Add a reply to a comment
   * @param {string|number} commentId - The parent comment ID
   * @param {string} content - Reply content
   * @param {string} authToken - User authentication token
   * @returns {Promise<Object>} Created reply data
   */
  async addReply(commentId, content, authToken) {
    try {
      console.log(`Adding reply to comment ${commentId}`);
      
      const response = await fetch(`${API_BASE_URL}/comments/${commentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Reply added successfully:', data);
      return data;
    } catch (error) {
      console.error('Error adding reply:', error);
      throw error;
    }
  }
}
// Create and export a singleton instance
const commentService = new CommentService();
export default commentService;
