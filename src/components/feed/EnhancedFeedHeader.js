// src/components/feed/EnhancedFeedHeader.js
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const FEED_TYPES = {
  EXPLORE: 'explore',
  FOLLOWING: 'following', 
  FOR_YOU: 'for_you',
};

const TABS = [
  { key: FEED_TYPES.FOLLOWING, label: 'Following' },
  { key: FEED_TYPES.FOR_YOU, label: 'For You' },
];

const EnhancedFeedHeader = ({ 
  activeTab, 
  onTabChange, 
  insets,
  swipeProgress = 0, // For animated transitions
  isSwipeInProgress = false,
}) => {
  // Animation values
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const tabOpacityAnims = useRef(
    TABS.reduce((acc, tab) => {
      acc[tab.key] = new Animated.Value(tab.key === activeTab ? 1 : 0.6);
      return acc;
    }, {})
  ).current;

  // Calculate tab positions
  const getTabIndex = (tabKey) => TABS.findIndex(tab => tab.key === tabKey);
  const activeTabIndex = getTabIndex(activeTab);

  // Animate indicator position when active tab changes
  useEffect(() => {
    const targetPosition = activeTabIndex;
    
    Animated.spring(indicatorAnim, {
      toValue: targetPosition,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    // Animate tab opacities
    TABS.forEach((tab, index) => {
      Animated.timing(tabOpacityAnims[tab.key], {
        toValue: index === activeTabIndex ? 1 : 0.6,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [activeTab, activeTabIndex]);

  // Handle tab press with haptic feedback
  const handleTabPress = (tabKey) => {
    if (tabKey === activeTab) return;
    
    // Haptic feedback
    Haptics.selectionAsync();
    
    // Call parent handler
    onTabChange(tabKey);
  };

  // Calculate indicator position with swipe progress
  const getIndicatorTransform = () => {
    if (isSwipeInProgress) {
      // During swipe, interpolate based on swipe progress
      const basePosition = activeTabIndex;
      const swipeOffset = swipeProgress * 0.5; // Adjust sensitivity
      
      return [{
        translateX: indicatorAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [
            (basePosition + swipeOffset) * (SCREEN_WIDTH * 0.25),
            (basePosition + swipeOffset + 1) * (SCREEN_WIDTH * 0.25)
          ],
        })
      }];
    }
    
    // Normal state - use animated value
    return [{
      translateX: indicatorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, SCREEN_WIDTH * 0.25],
      })
    }];
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Left icon */}
      <TouchableOpacity 
        style={styles.iconButton}
        onPress={() => onTabChange(FEED_TYPES.EXPLORE)}
      >
        <Ionicons name="tv-outline" size={24} color="#fff" />
      </TouchableOpacity>
      
      {/* Tab switcher */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabsRow}>
          {TABS.map((tab, index) => (
            <TouchableOpacity 
              key={tab.key}
              style={styles.tabButton}
              onPress={() => handleTabPress(tab.key)}
              activeOpacity={0.7}
            >
              <Animated.Text 
                style={[
                  styles.tabText,
                  {
                    opacity: tabOpacityAnims[tab.key],
                    transform: [{
                      scale: tabOpacityAnims[tab.key].interpolate({
                        inputRange: [0.6, 1],
                        outputRange: [0.95, 1],
                      })
                    }]
                  }
                ]}
              >
                {tab.label}
              </Animated.Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Animated indicator */}
        <Animated.View 
          style={[
            styles.activeIndicator,
            {
              transform: getIndicatorTransform(),
            }
          ]} 
        />
        
        {/* Swipe hint (subtle visual cue) */}
        {!isSwipeInProgress && (
          <View style={styles.swipeHint}>
            <Text style={styles.swipeHintText}>← Swipe →</Text>
          </View>
        )}
      </View>
      
      {/* Right icon */}
      <TouchableOpacity style={styles.iconButton}>
        <Ionicons name="search" size={24} color="#fff" />
      </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tabsContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 4,
  },
  tabText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 20,
    height: 3,
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
  swipeHint: {
    position: 'absolute',
    bottom: -20,
    alignItems: 'center',
  },
  swipeHintText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    fontWeight: '500',
  },
  iconButton: {
    padding: 8,
  },
});

export default EnhancedFeedHeader;