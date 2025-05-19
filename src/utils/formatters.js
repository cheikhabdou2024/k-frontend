/**
 * Format number to display with K, M, B suffix for thousands/millions/billions
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export const formatCount = (num) => {
  if (!num && num !== 0) return '';
  
  if (num < 1000) {
    return num.toString();
  } else if (num < 1000000) {
    return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}K`;
  } else if (num < 1000000000) {
    return `${(num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1)}M`;
  } else {
    return `${(num / 1000000000).toFixed(num % 1000000000 === 0 ? 0 : 1)}B`;
  }
};

/**
 * Format date to relative time (e.g., "2h ago", "3d ago")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  
  // Convert to seconds
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 60) {
    return diffSec < 2 ? 'just now' : `${diffSec}s ago`;
  }
  
  // Convert to minutes
  const diffMin = Math.floor(diffSec / 60);
  
  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }
  
  // Convert to hours
  const diffHours = Math.floor(diffMin / 60);
  
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  
  // Convert to days
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  
  // Convert to weeks
  const diffWeeks = Math.floor(diffDays / 7);
  
  if (diffWeeks < 4) {
    return `${diffWeeks}w ago`;
  }
  
  // Convert to months
  const diffMonths = Math.floor(diffDays / 30);
  
  if (diffMonths < 12) {
    return `${diffMonths}mo ago`;
  }
  
  // Convert to years
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears}y ago`;
};

/**
 * Format time duration from seconds
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string (e.g., "01:30")
 */
export const formatDuration = (seconds) => {
  if (seconds === undefined || seconds === null) return '00:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format caption with clickable hashtags and mentions
 * @param {string} caption - Caption text
 * @returns {Array} Formatted caption segments with styling info
 */
export const formatCaption = (caption) => {
  if (!caption) return [];
  
  // Split by hashtags and mentions
  const parts = caption.split(/([@#][\w]+)/g);
  
  return parts.map((part) => {
    if (part.startsWith('#')) {
      return {
        text: part,
        type: 'hashtag',
      };
    } else if (part.startsWith('@')) {
      return {
        text: part,
        type: 'mention',
      };
    } else {
      return {
        text: part,
        type: 'text',
      };
    }
  });
};