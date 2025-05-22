// src/services/mockDataService.js
// This service provides mock data while you're setting up your real backend endpoints

class MockDataService {
  constructor() {
    // Store mock comments in memory
    this.comments = new Map();
    this.users = new Map();
    this.nextCommentId = 1;
    this.nextUserId = 1;
    
    // Initialize with some mock data
    this.initializeMockData();
  }

  initializeMockData() {
    // Create mock users
    const mockUsers = [
      {
        id: 1,
        username: 'sarah_creator',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      },
      {
        id: 2,
        username: 'mike_viewer',
        avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
      },
      {
        id: 3,
        username: 'emily_fan',
        avatar: 'https://randomuser.me/api/portraits/women/46.jpg',
      },
      {
        id: 4,
        username: 'alex_commenter',
        avatar: 'https://randomuser.me/api/portraits/men/47.jpg',
      },
      {
        id: 5,
        username: 'current_user',
        avatar: 'https://randomuser.me/api/portraits/men/88.jpg',
      }
    ];

    mockUsers.forEach(user => {
      this.users.set(user.id, user);
    });

    // Create mock comments for different videos
    const mockComments = [
      {
        id: 1,
        content: 'This is absolutely amazing! 🔥 The editing is so smooth!',
        videoId: 1,
        userId: 1,
        likes: 42,
        isLiked: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        replies: [
          {
            id: 2,
            content: 'Thanks! Took me hours to get it right 😅',
            videoId: 1,
            userId: 5,
            parentId: 1,
            likes: 12,
            isLiked: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
          }
        ]
      },
      {
        id: 3,
        content: 'Love your content! Keep posting more videos like this 👏',
        videoId: 1,
        userId: 2,
        likes: 28,
        isLiked: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        replies: []
      },
      {
        id: 4,
        content: 'Can you do a tutorial on how to do this effect? Please! 🙏',
        videoId: 1,
        userId: 3,
        likes: 73,
        isLiked: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        replies: [
          {
            id: 5,
            content: 'Yes! Tutorial would be amazing!',
            videoId: 1,
            userId: 4,
            parentId: 4,
            likes: 15,
            isLiked: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
          },
          {
            id: 6,
            content: 'I second this! Would love to learn 📚',
            videoId: 1,
            userId: 2,
            parentId: 4,
            likes: 8,
            isLiked: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
          }
        ]
      },
      {
        id: 7,
        content: 'First! 🥇 Love being early to your videos',
        videoId: 1,
        userId: 4,
        likes: 5,
        isLiked: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        replies: []
      },
      {
        id: 8,
        content: 'This is so creative! How do you come up with these ideas? 💡',
        videoId: 1,
        userId: 1,
        likes: 19,
        isLiked: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        replies: []
      },
      {
        id: 9,
        content: '🎤 Voice comment',
        videoId: 1,
        userId: 3,
        likes: 7,
        isLiked: false,
        isAudio: true,
        audioUri: 'mock_audio_uri',
        createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        replies: []
      }
    ];

    // Store comments grouped by video ID
    mockComments.forEach(comment => {
      const videoComments = this.comments.get(comment.videoId) || [];
      videoComments.push(comment);
      this.comments.set(comment.videoId, videoComments);
    });

    this.nextCommentId = Math.max(...mockComments.map(c => c.id)) + 1;
    this.nextUserId = Math.max(...mockUsers.map(u => u.id)) + 1;
  }

  /**
   * Simulate API delay
   */
  delay(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get comments for a video with pagination
   */
  async getVideoComments(videoId, page = 1, limit = 20) {
    await this.delay(800); // Simulate network delay

    const allComments = this.comments.get(parseInt(videoId)) || [];
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedComments = allComments.slice(startIndex, endIndex);

    // Add user data to comments
    const commentsWithUsers = paginatedComments.map(comment => ({
      ...comment,
      user: this.users.get(comment.userId),
      replies: comment.replies?.map(reply => ({
        ...reply,
        user: this.users.get(reply.userId)
      })) || []
    }));

    return {
      comments: commentsWithUsers,
      pagination: {
        page,
        limit,
        total: allComments.length,
        totalPages: Math.ceil(allComments.length / limit),
        hasMore: endIndex < allComments.length
      }
    };
  }

  /**
   * Add a new comment
   */
  async addComment(videoId, content, userId = 5) {
    await this.delay(600);

    const newComment = {
      id: this.nextCommentId++,
      content,
      videoId: parseInt(videoId),
      userId,
      likes: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
      replies: []
    };

    const videoComments = this.comments.get(parseInt(videoId)) || [];
    videoComments.unshift(newComment); // Add to beginning
    this.comments.set(parseInt(videoId), videoComments);

    // Return comment with user data
    return {
      ...newComment,
      user: this.users.get(userId)
    };
  }

  /**
   * Add a reply to a comment
   */
  async addReply(videoId, parentCommentId, content, userId = 5) {
    await this.delay(600);

    const videoComments = this.comments.get(parseInt(videoId)) || [];
    const parentComment = videoComments.find(c => c.id === parseInt(parentCommentId));
    
    if (!parentComment) {
      throw new Error('Parent comment not found');
    }

    const newReply = {
      id: this.nextCommentId++,
      content,
      videoId: parseInt(videoId),
      userId,
      parentId: parseInt(parentCommentId),
      likes: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
    };

    parentComment.replies = parentComment.replies || [];
    parentComment.replies.push(newReply);

    // Return reply with user data
    return {
      ...newReply,
      user: this.users.get(userId)
    };
  }

  /**
   * Toggle like on a comment
   */
  async toggleCommentLike(videoId, commentId, userId = 5) {
    await this.delay(200);

    const videoComments = this.comments.get(parseInt(videoId)) || [];
    let comment = videoComments.find(c => c.id === parseInt(commentId));
    
    // Check if it's a reply
    if (!comment) {
      for (const parentComment of videoComments) {
        if (parentComment.replies) {
          comment = parentComment.replies.find(r => r.id === parseInt(commentId));
          if (comment) break;
        }
      }
    }

    if (!comment) {
      throw new Error('Comment not found');
    }

    comment.isLiked = !comment.isLiked;
    comment.likes = comment.isLiked ? 
      (comment.likes || 0) + 1 : 
      Math.max(0, (comment.likes || 0) - 1);

    return {
      liked: comment.isLiked,
      totalLikes: comment.likes
    };
  }

  /**
   * Get comment count for a video
   */
  async getCommentCount(videoId) {
    await this.delay(300);

    const videoComments = this.comments.get(parseInt(videoId)) || [];
    let totalCount = videoComments.length;
    
    // Add reply counts
    videoComments.forEach(comment => {
      if (comment.replies) {
        totalCount += comment.replies.length;
      }
    });

    return { count: totalCount };
  }

  /**
   * Delete a comment
   */
  async deleteComment(videoId, commentId, userId = 5) {
    await this.delay(400);

    const videoComments = this.comments.get(parseInt(videoId)) || [];
    const commentIndex = videoComments.findIndex(c => c.id === parseInt(commentId));
    
    if (commentIndex === -1) {
      throw new Error('Comment not found');
    }

    const comment = videoComments[commentIndex];
    if (comment.userId !== userId) {
      throw new Error('Unauthorized to delete this comment');
    }

    videoComments.splice(commentIndex, 1);
    this.comments.set(parseInt(videoId), videoComments);

    return { deleted: true };
  }

  /**
   * Pin/unpin a comment
   */
  async toggleCommentPin(videoId, commentId, userId = 5) {
    await this.delay(300);

    const videoComments = this.comments.get(parseInt(videoId)) || [];
    const comment = videoComments.find(c => c.id === parseInt(commentId));
    
    if (!comment) {
      throw new Error('Comment not found');
    }

    comment.isPinned = !comment.isPinned;

    return { pinned: comment.isPinned };
  }

  /**
   * Add an audio comment
   */
  async addAudioComment(videoId, audioUri, duration, userId = 5) {
    await this.delay(800);

    const newComment = {
      id: this.nextCommentId++,
      content: "🎤 Voice comment",
      videoId: parseInt(videoId),
      userId,
      likes: 0,
      isLiked: false,
      isAudio: true,
      audioUri,
      duration,
      createdAt: new Date().toISOString(),
      replies: []
    };

    const videoComments = this.comments.get(parseInt(videoId)) || [];
    videoComments.unshift(newComment);
    this.comments.set(parseInt(videoId), videoComments);

    return {
      ...newComment,
      user: this.users.get(userId)
    };
  }

  /**
   * Search comments
   */
  async searchComments(videoId, query) {
    await this.delay(600);

    const videoComments = this.comments.get(parseInt(videoId)) || [];
    const filteredComments = videoComments.filter(comment => 
      comment.content.toLowerCase().includes(query.toLowerCase())
    );

    return filteredComments.map(comment => ({
      ...comment,
      user: this.users.get(comment.userId)
    }));
  }

  /**
   * Get user's comments
   */
  async getUserComments(userId, page = 1, limit = 10) {
    await this.delay(500);

    const allComments = [];
    
    // Collect all comments from all videos
    for (const [videoId, comments] of this.comments.entries()) {
      comments.forEach(comment => {
        if (comment.userId === parseInt(userId)) {
          allComments.push({ ...comment, videoId });
        }
        // Check replies too
        if (comment.replies) {
          comment.replies.forEach(reply => {
            if (reply.userId === parseInt(userId)) {
              allComments.push({ ...reply, videoId, isReply: true });
            }
          });
        }
      });
    }

    // Sort by creation date
    allComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedComments = allComments.slice(startIndex, endIndex);

    return {
      comments: paginatedComments.map(comment => ({
        ...comment,
        user: this.users.get(comment.userId)
      })),
      pagination: {
        page,
        limit,
        total: allComments.length,
        totalPages: Math.ceil(allComments.length / limit),
        hasMore: endIndex < allComments.length
      }
    };
  }

  /**
   * Get trending comments (most liked)
   */
  async getTrendingComments(videoId, limit = 5) {
    await this.delay(400);

    const videoComments = this.comments.get(parseInt(videoId)) || [];
    const sortedComments = [...videoComments]
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, limit);

    return sortedComments.map(comment => ({
      ...comment,
      user: this.users.get(comment.userId)
    }));
  }
}

// Create and export a singleton instance
const mockDataService = new MockDataService();
export default mockDataService;