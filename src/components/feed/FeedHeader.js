// src/components/feed/FeedHeader.js
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export const FEED_TYPES = {
  EXPLORE: 'explore',
  FOLLOWING: 'following',
  FOR_YOU: 'for_you',
};

const FeedHeader = ({ activeTab, onTabChange, insets }) => {
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TouchableOpacity 
        style={styles.iconButton}
        onPress={() => onTabChange(FEED_TYPES.EXPLORE)}
      >
        <Ionicons name="tv-outline" size={24} color="#fff" />
      </TouchableOpacity>
      
      <View style={styles.tabsRow}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab !== FEED_TYPES.FOLLOWING && styles.inactiveTab]}
          onPress={() => onTabChange(FEED_TYPES.FOLLOWING)}
        >
          <Text style={[styles.tabText, activeTab !== FEED_TYPES.FOLLOWING && styles.inactiveTabText]}>
            Following
          </Text>
          {activeTab === FEED_TYPES.FOLLOWING && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab !== FEED_TYPES.FOR_YOU && styles.inactiveTab]}
          onPress={() => onTabChange(FEED_TYPES.FOR_YOU)}
        >
          <Text style={[styles.tabText, activeTab !== FEED_TYPES.FOR_YOU && styles.inactiveTabText]}>
            For You
          </Text>
          {activeTab === FEED_TYPES.FOR_YOU && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
      </View>
      
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
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    position: 'relative',
  },
  tabText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  inactiveTab: {},
  inactiveTabText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '30%',
    right: '30%',
    height: 2,
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
  iconButton: {
    padding: 8,
  },
});

export default FeedHeader;