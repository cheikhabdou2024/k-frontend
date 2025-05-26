// src/components/feed/EnhancedFeedHeader.js - REFINED VERSION
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_WIDTH = SCREEN_WIDTH / 2;

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
  
  // Scale animations for press feedback
  const scaleAnims = useRef(
    TABS.reduce((acc, tab) => {
      acc[tab.key] = new Animated.Value(1);
      return acc;
    }, {})
  ).current;

  // Animated value for underline
  const underlineAnim = useRef(new Animated.Value(activeTab === 'FOR_YOU' ? 0 : 1)).current;

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

    // Animate tab opacities and scales
    TABS.forEach((tab, index) => {
      const isActive = index === activeTabIndex;
      
      Animated.parallel([
        Animated.timing(tabOpacityAnims[tab.key], {
          toValue: isActive ? 1 : 0.6,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnims[tab.key], {
          toValue: isActive ? 1.1 : 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        })
      ]).start();
    });

    Animated.spring(underlineAnim, {
      toValue: activeTab === 'FOR_YOU' ? 0 : 1,
      useNativeDriver: false,
    }).start();
  }, [activeTab, activeTabIndex]);

  // Handle tab press with enhanced feedback
  const handleTabPress = (tabKey) => {
    if (tabKey === activeTab) return;
    
    // Haptic feedback
    Haptics.selectionAsync();
    
    // Press animation
    const targetScale = scaleAnims[tabKey];
    Animated.sequence([
      Animated.timing(targetScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(targetScale, {
        toValue: 1.1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
    
    // Call parent handler
    onTabChange(tabKey);
  };

  // Calculate indicator transform
  const getIndicatorTransform = () => {
    return [{
      translateX: indicatorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, TAB_WIDTH],
      })
    }];
  };

  const underlineLeft = underlineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TAB_WIDTH],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Left icon with enhanced styling */}
      <TouchableOpacity 
        style={styles.iconButton}
        onPress={() => onTabChange(FEED_TYPES.EXPLORE)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['rgba(254, 44, 85, 0.1)', 'rgba(37, 244, 238, 0.1)']}
          style={styles.iconGradient}
        >
          <Ionicons name="tv-outline" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
      
      {/* Tab switcher with enhanced animations */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabsRow}>
          {TABS.map((tab, index) => (
            <TouchableOpacity 
              key={tab.key}
              style={styles.tabButton}
              onPress={() => handleTabPress(tab.key)}
              activeOpacity={0.7}
            >
              <Animated.View
                style={{
                  transform: [{ scale: scaleAnims[tab.key] }]
                }}
              >
                <Animated.Text 
                  style={[
                    styles.tabText,
                    {
                      opacity: tabOpacityAnims[tab.key],
                      color: tabOpacityAnims[tab.key].interpolate({
                        inputRange: [0.6, 1],
                        outputRange: ['rgba(255,255,255,0.6)', '#FFF'],
                      })
                    }
                  ]}
                >
                  {tab.label}
                </Animated.Text>
              </Animated.View>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Enhanced animated indicator */}
        <Animated.View 
          style={[
            styles.activeIndicator,
            {
              transform: getIndicatorTransform(),
            }
          ]} 
        >
          <LinearGradient
            colors={['#FE2C55', '#25F4EE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.indicatorGradient}
          />
        </Animated.View>
        
        {/* Underline indicator for tab active state */}
        <Animated.View
          style={[
            styles.underline,
            {
              left: underlineLeft,
              width: TAB_WIDTH,
            },
          ]}
        />
        
        {/* Swipe hint with pulsing animation */}
        {!isSwipeInProgress && (
          <Animated.View 
            style={[
              styles.swipeHint,
              {
                opacity: indicatorAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.3, 0.1, 0.3],
                })
              }
            ]}
          >
            <Text style={styles.swipeHintText}>← Swipe →</Text>
          </Animated.View>
        )}
      </View>
      
      {/* Right icon with search functionality */}
      <TouchableOpacity 
        style={styles.iconButton}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
          style={styles.iconGradient}
        >
          <Ionicons name="search" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
      
      {/* Live indicator (optional) */}
      <View style={styles.liveIndicator}>
        <Animated.View 
          style={[
            styles.liveDot,
            {
              opacity: indicatorAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              })
            }
          ]} 
        />
        <Text style={styles.liveText}>LIVE</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  iconGradient: {
    padding: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    position: 'relative',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 20,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 16,
  },
  tabText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 40,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  indicatorGradient: {
    flex: 1,
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
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  liveIndicator: {
    position: 'absolute',
    top: 50,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
    marginRight: 4,
  },
  liveText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
});

export default EnhancedFeedHeader;