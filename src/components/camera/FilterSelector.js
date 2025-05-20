import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Dimensions
} from 'react-native';

const { width } = Dimensions.get('window');
const FILTER_ITEM_WIDTH = 70;

/**
 * Filter selector component for camera screen
 * Displays a horizontal list of available filters
 */
const FilterSelector = ({ 
  filters, 
  selectedFilter, 
  onSelectFilter,
  disabled = false
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterItem,
              selectedFilter.id === filter.id && styles.selectedFilterItem
            ]}
            onPress={() => onSelectFilter(filter)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text 
              style={[
                styles.filterName,
                selectedFilter.id === filter.id && styles.selectedFilterName,
                disabled && styles.disabledFilterName
              ]}
            >
              {filter.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 50,
    width: FILTER_ITEM_WIDTH,
  },
  scrollContent: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  filterItem: {
    marginHorizontal: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectedFilterItem: {
    backgroundColor: 'rgba(254, 44, 85, 0.7)',
    borderColor: '#FE2C55',
  },
  filterName: {
    color: '#FFF',
    fontSize: 12,
    textAlign: 'center',
  },
  selectedFilterName: {
    fontWeight: 'bold',
  },
  disabledFilterName: {
    color: '#999',
  },
});

export default FilterSelector;