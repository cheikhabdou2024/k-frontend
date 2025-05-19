import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar, Text } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import * as storage from '../../utils/storage';

const { width } = Dimensions.get('window');

// Available interest categories
const interestCategories = [
  {
    id: '1',
    title: 'Comedy',
    icon: '😂',
  },
  {
    id: '2',
    title: 'Dance',
    icon: '💃',
  },
  {
    id: '3',
    title: 'Music',
    icon: '🎵',
  },
  {
    id: '4',
    title: 'Food',
    icon: '🍔',
  },
  {
    id: '5',
    title: 'Beauty',
    icon: '💄',
  },
  {
    id: '6',
    title: 'Fashion',
    icon: '👗',
  },
  {
    id: '7',
    title: 'Sports',
    icon: '⚽',
  },
  {
    id: '8',
    title: 'DIY',
    icon: '🔨',
  },
  {
    id: '9',
    title: 'Animals',
    icon: '🐱',
  },
  {
    id: '10',
    title: 'Travel',
    icon: '✈️',
  },
  {
    id: '11',
    title: 'Tech',
    icon: '💻',
  },
  {
    id: '12',
    title: 'Gaming',
    icon: '🎮',
  },
];

const InterestsScreen = ({ onComplete }) => {
  const [selectedInterests, setSelectedInterests] = useState([]);

  // Toggle selection of an interest
  const toggleInterest = (interestId) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interestId)) {
        return prev.filter((id) => id !== interestId);
      } else {
        return [...prev, interestId];
      }
    });
  };

  // Save interests and continue
  const handleContinue = async () => {
    if (selectedInterests.length > 0) {
      // Save selected interests to storage
      await storage.setInterests(selectedInterests);
      if (onComplete) {
        onComplete();
      }
    }
  };

  // Skip interests selection
  const handleSkip = async () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      
      <View style={styles.header}>
        <Animatable.View animation="fadeInDown" duration={800}>
          <Text style={styles.title}>Choose Your Interests</Text>
          <Text style={styles.subtitle}>
            Select at least one category to personalize your experience
          </Text>
        </Animatable.View>
      </View>
      
      <Animatable.View 
        animation="fadeIn" 
        duration={1000} 
        style={styles.interestsContainer}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.interestsGrid}>
            {interestCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.interestItem,
                  selectedInterests.includes(category.id) && styles.selectedItem,
                ]}
                onPress={() => toggleInterest(category.id)}
                activeOpacity={0.8}
              >
                {selectedInterests.includes(category.id) ? (
                  <LinearGradient
                    colors={['#FE2C55', '#25F4EE']}
                    style={styles.selectedGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.itemIcon}>{category.icon}</Text>
                    <Text style={styles.selectedItemText}>{category.title}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.itemContent}>
                    <Text style={styles.itemIcon}>{category.icon}</Text>
                    <Text style={styles.itemText}>{category.title}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Animatable.View>
      
      <Animatable.View 
        animation="fadeInUp" 
        duration={800} 
        style={styles.footer}
      >
        <TouchableOpacity
          style={[
            styles.button,
            selectedInterests.length === 0 && styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={selectedInterests.length === 0}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </Animatable.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCC',
    lineHeight: 24,
  },
  interestsContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  interestItem: {
    width: (width - 50) / 2,
    height: 120,
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1F1F1F',
  },
  selectedItem: {
    borderWidth: 0,
  },
  selectedGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  itemContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  itemIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  itemText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedItemText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#FE2C55',
    paddingVertical: 15,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  disabledButton: {
    backgroundColor: '#444',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    color: '#CCC',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InterestsScreen;