import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const KEYS = {
  ONBOARDING_COMPLETED: '@tiktok_clone:onboarding_completed',
  INTERESTS: '@tiktok_clone:interests',

};

/**
 * Mark onboarding as completed
 * @returns {Promise<void>}
 */
export const setOnboardingCompleted = async () => {
  try {
    await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETED, 'true');
  } catch (error) {
    console.error('Error setting onboarding status:', error);
  }
};

/**
 * Check if onboarding has been completed
 * @returns {Promise<boolean>} True if completed
 */
export const isOnboardingCompleted = async () => {
  try {
    const value = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETED);
    return value === 'true';
  } catch (error) {
    console.error('Error getting onboarding status:', error);
    return false;
  }
};

/**
 * Store user interests
 * @param {Array<string>} interests - List of interests
 * @returns {Promise<void>}
 */
export const setInterests = async (interests) => {
  try {
    await AsyncStorage.setItem(KEYS.INTERESTS, JSON.stringify(interests));
  } catch (error) {
    console.error('Error setting interests:', error);
  }
};

/**
 * Get stored user interests
 * @returns {Promise<Array<string>>} List of interests or empty array
 */
export const getInterests = async () => {
  try {
    const interests = await AsyncStorage.getItem(KEYS.INTERESTS);
    return interests ? JSON.parse(interests) : [];
  } catch (error) {
    console.error('Error getting interests:', error);
    return [];
  }
};