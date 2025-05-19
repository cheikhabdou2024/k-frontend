import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import * as Animatable from 'react-native-animatable';

// Feed types
export const FEED_TYPES = {
  FOR_YOU: 'for_you',
  FOLLOWING: 'following',
};

/**
 * Header component for the main feed screen showing For You / Following tabs
 */
const FeedHeader = ({ activeTab, onChangeTab }) => {
  return (
    <View style={styles.container}>
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
          {activeTab === FEED_TYPES.FOLLOWING && <View style={styles.activeIndicator} />}
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
          {activeTab === FEED_TYPES.FOR_YOU && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
    paddingVertical: 10,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  tabButton: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  activeIndicator: {
    height: 2,
    width: 20,
    backgroundColor: '#FFF',
    marginTop: 3,
    borderRadius: 1,
  },
});

export default FeedHeader;