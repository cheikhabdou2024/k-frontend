import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Feed types
export const FEED_TYPES = {
  FOR_YOU: 'for_you',
  FOLLOWING: 'following',
};

/**
 * Enhanced header component for the main feed screen showing For You / Following tabs
 * with smoother animations and better styling
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
    outputRange: ['28%', '72%'], // Adjust based on layout
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="tv-outline" size={22} color="#FFF" />
        </TouchableOpacity>
        
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
                activeTab === FEED_TYPES.FOLLOWING ? styles.activeTabText : styles.inactiveTabText,
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
                activeTab === FEED_TYPES.FOR_YOU ? styles.activeTabText : styles.inactiveTabText,
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
        
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="search" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({ 
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 44,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 17,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFF',
    fontWeight: '700',
  },
  inactiveTabText: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  underlineIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 24,
    height: 3,
    backgroundColor: '#FFF',
    borderRadius: 3,
  },
});

export default EnhancedFeedHeader;