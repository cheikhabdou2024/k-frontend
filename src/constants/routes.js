// Navigation route names

// Auth Stack
export const AUTH = {
  SPLASH: 'Splash',
  ONBOARDING: 'Onboarding',
  INTERESTS: 'Interests',
};

// Main Tabs
export const TABS = {
  HOME: 'Home',
  DISCOVER: 'Discover',
  CREATE: 'Create',
  INBOX: 'Inbox',
  PROFILE: 'Profile',
};

// Home Stack
export const HOME = {
  FEED: 'Feed',
  COMMENTS: 'Comments',
  USER_PROFILE: 'UserProfile',
  HASHTAG: 'Hashtag',
  SOUND: 'Sound',
};

// Modals (can be accessed from multiple stacks)
export const MODALS = {
  COMMENTS: 'CommentsModal',
  SHARE: 'ShareModal',
};

// Export all routes as a flat object for convenience
export const ROUTES = {
  ...AUTH,
  ...TABS,
  ...HOME,
  ...MODALS,
};