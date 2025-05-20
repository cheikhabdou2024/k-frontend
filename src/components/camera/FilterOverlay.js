import React, { useState, useEffect } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Image, 
  ActivityIndicator 
} from 'react-native';
import { Camera } from 'expo-camera';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

/**
 * Filter Overlay Component
 * Applies a visual filter to the camera preview
 */
const FilterOverlay = ({ filter }) => {
  // No filter for 'normal'
  if (filter.id === 'normal') {
    return null;
  }
  
  // Determine overlay color and opacity based on filter
  let overlayStyle = {};
  
  switch (filter.id) {
    case 'warm':
      overlayStyle = {
        backgroundColor: 'rgba(255, 180, 0, 0.1)',
      };
      break;
    case 'cool':
      overlayStyle = {
        backgroundColor: 'rgba(0, 120, 255, 0.1)',
      };
      break;
    case 'vintage':
      overlayStyle = {
        backgroundColor: 'rgba(160, 100, 40, 0.2)',
      };
      break;
    case 'mono':
      overlayStyle = {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        mixBlendMode: 'saturation',
      };
      break;
    case 'sepia':
      overlayStyle = {
        backgroundColor: 'rgba(112, 66, 20, 0.2)',
      };
      break;
    case 'vivid':
      overlayStyle = {
        backgroundColor: 'rgba(255, 0, 255, 0.05)',
      };
      break;
    default:
      break;
  }
  
  return (
    <View 
      style={[
        styles.filterOverlay,
        overlayStyle,
        { opacity: filter.intensity }
      ]} 
    />
  );
};

const styles = StyleSheet.create({
  filterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default FilterOverlay;