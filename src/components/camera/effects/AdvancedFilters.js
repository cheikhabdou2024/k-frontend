// src/components/camera/effects/AdvancedFilters.js
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  Animated, 
  Dimensions,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// Basic TikTok-style filters
const BASIC_FILTERS = [
  {
    id: 'original',
    name: 'Original',
    icon: 'camera-outline',
    color: '#FFF',
    params: { brightness: 0, contrast: 0, saturation: 0 }
  },
  {
    id: 'beauty',
    name: 'Beauty',
    icon: 'sparkles',
    color: '#FFB6C1',
    params: { brightness: 10, contrast: 5, saturation: 8 }
  },
  {
    id: 'vintage',
    name: 'Vintage',
    icon: 'film-outline',
    color: '#D2691E',
    params: { brightness: -5, contrast: 15, saturation: -10 }
  },
  {
    id: 'cyberpunk',
    name: 'Cyber',
    icon: 'flash',
    color: '#00FFFF',
    params: { brightness: 5, contrast: 20, saturation: 25 }
  },
  {
    id: 'dreamy',
    name: 'Dreamy',
    icon: 'cloud-outline',
    color: '#FFE4E1',
    params: { brightness: 8, contrast: -5, saturation: 5 }
  },
  {
    id: 'dramatic',
    name: 'Drama',
    icon: 'thunderstorm',
    color: '#8B0000',
    params: { brightness: -10, contrast: 30, saturation: 15 }
  }
];

const AdvancedFilters = ({ 
  selectedFilter, 
  onFilterChange, 
  isRecording = false,
  style 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef(
    BASIC_FILTERS.reduce((acc, filter) => {
      acc[filter.id] = new Animated.Value(1);
      return acc;
    }, {})
  ).current;

  // Handle filter selection with enhanced feedback
  const handleFilterSelect = (filter) => {
    if (isRecording) return;
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Scale animation
    Animated.sequence([
      Animated.timing(scaleAnims[filter.id], {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnims[filter.id], {
        toValue: 1.2,
        tension: 100,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[filter.id], {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    onFilterChange && onFilterChange(filter);
  };

  // Toggle expanded view
  const toggleExpanded = () => {
    if (isRecording) return;
    
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);
    
    Animated.spring(slideAnim, {
      toValue,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
    
    Haptics.selectionAsync();
  };

  // Render filter item
  const renderFilterItem = (filter, index) => {
    const isSelected = selectedFilter?.id === filter.id;
    
    return (
      <TouchableOpacity
        key={filter.id}
        style={[
          styles.filterItem,
          isSelected && styles.selectedFilterItem
        ]}
        onPress={() => handleFilterSelect(filter)}
        disabled={isRecording}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.filterIconContainer,
            {
              transform: [{ scale: scaleAnims[filter.id] }],
              backgroundColor: isSelected ? filter.color : 'rgba(255,255,255,0.1)'
            }
          ]}
        >
          <Ionicons 
            name={filter.icon} 
            size={24} 
            color={isSelected ? '#000' : filter.color} 
          />
        </Animated.View>
        
        <Text style={[
          styles.filterName,
          isSelected && styles.selectedFilterName,
          { color: isSelected ? filter.color : '#FFF' }
        ]}>
          {filter.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Expand/Collapse Button */}
      <TouchableOpacity 
        style={styles.expandButton}
        onPress={toggleExpanded}
        disabled={isRecording}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)']}
          style={styles.expandButtonGradient}
        >
          <Ionicons 
            name={isExpanded ? "chevron-down" : "chevron-up"} 
            size={20} 
            color="#FFF" 
          />
          <Text style={styles.expandButtonText}>Filters</Text>
        </LinearGradient>
      </TouchableOpacity>
      
      {/* Filters Container */}
      <Animated.View 
        style={[
          styles.filtersContainer,
          {
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [60, 0],
              })
            }],
            opacity: slideAnim
          }
        ]}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.6)']}
          style={styles.filtersBackground}
        >
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScrollContent}
          >
            {BASIC_FILTERS.map((filter, index) => renderFilterItem(filter, index))}
          </ScrollView>
          
          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction}>
              <Ionicons name="shuffle" size={18} color="#FFF" />
              <Text style={styles.quickActionText}>Random</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction}>
              <Ionicons name="save-outline" size={18} color="#FFF" />
              <Text style={styles.quickActionText}>Save</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  expandButton: {
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 8,
  },
  expandButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  expandButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  filtersContainer: {
    paddingHorizontal: 16,
  },
  filtersBackground: {
    borderRadius: 20,
    padding: 16,
  },
  filtersScrollContent: {
    paddingHorizontal: 8,
  },
  filterItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    minWidth: 60,
  },
  selectedFilterItem: {
    transform: [{ scale: 1.1 }],
  },
  filterIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  filterName: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedFilterName: {
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  quickAction: {
    alignItems: 'center',
    padding: 8,
  },
  quickActionText: {
    color: '#FFF',
    fontSize: 10,
    marginTop: 4,
  },
});

export default AdvancedFilters;