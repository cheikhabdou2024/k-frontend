// src/services/api.js
const API_URL = 'http://192.168.1.8:3001/api';

// Generic fetch function with error handling
const fetchApi = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'An error occurred');
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Video-related API calls
export const videoService = {
  // Get all videos with pagination
  getVideos: async (page = 1, limit = 10) => {
    return fetchApi(`/videos?page=${page}&limit=${limit}`);
  },

  // Get a single video by ID
  getVideoById: async (id) => {
    return fetchApi(`/videos/${id}`);
  },

  // Get trending videos
  getTrendingVideos: async (limit = 10) => {
    return fetchApi(`/videos/trending?limit=${limit}`);
  },

  // Get videos from followed users (requires auth)
  getFollowingVideos: async (token, page = 1, limit = 10) => {
    return fetchApi(`/videos/following?page=${page}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// Auth-related API calls
export const authService = {
  login: async (email, password) => {
    return fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (username, email, password) => {
    return fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  },
};

// User-related API calls
export const userService = {
  getProfile: async (userId) => {
    return fetchApi(`/users/${userId}`);
  },

  getUserVideos: async (userId, page = 1, limit = 10) => {
    return fetchApi(`/users/${userId}/videos?page=${page}&limit=${limit}`);
  },
};

export default {
  videoService,
  authService,
  userService,
};