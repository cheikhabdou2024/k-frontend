import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';

// Feed types
export const FEED_TYPES = {
  FOR_YOU: 'for_you',
  FOLLOWING: 'following',
};

/**
 * Enhanced header component for the main feed screen showing For You / Following tabs
 * Includes animations and better styling to match the actual TikTok app
 */
const EnhancedFeedHeader = ({ activeTab, onChangeTab }) => {
  const insets = useSafeAreaInsets();
  const underlineAnimation = new Animated.Value(activeTab === FEED_TYPES.FOLLOWING ? 0 : 1);
  
  // Animate the underline when tab changes
  useEffect(() => {
    Animated.timing(underlineAnimation, {
      toValue: activeTab === FEED_TYPES.FOLLOWING ? 0 : 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [activeTab]);
  
  // Calculate animated position for the underline
  const underlinePosition = underlineAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['30%', '70%'], // Adjust based on your layout
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.tabsContainer}>
        {/* Following Tab */}
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => onChangeTab(FEED_TYPES.FOLLOWING)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === FEED_TYPES.FOLLOWING && styles.activeTabText,
            ]}
          >
            Following
          </Text>
        </TouchableOpacity>
        
        {/* For You Tab */}
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => onChangeTab(FEED_TYPES.FOR_YOU)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === FEED_TYPES.FOR_YOU && styles.activeTabText,
            ]}
          >
            For You
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Animated underline indicator */}
      <Animated.View 
        style={[
          styles.underlineIndicator,
          { left: underlinePosition }
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '65%',
    height: 44,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 17,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFF',
    fontWeight: '700',
  },
  underlineIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '6%',
    height: 3,
    backgroundColor: '#FFF',
    borderRadius: 3,
  },
});

export default EnhancedFeedHeader;  