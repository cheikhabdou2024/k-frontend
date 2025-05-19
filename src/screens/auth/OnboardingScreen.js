import React, { useState, useRef } from 'react';
import { View, StyleSheet, FlatList, Dimensions, TouchableOpacity, Image, StatusBar, Text } from 'react-native';
import * as Animatable from 'react-native-animatable';
import * as storage from '../../utils/storage';

const { width, height } = Dimensions.get('window');

// Onboarding data
const slides = [
  {
    id: '1',
    title: 'Bienvenue à K',
    description: 'La plateforme ultime pour créer et partager de courtes vidéos avec le monde.',
    image: require('../../../assets/images/onboarding1.png'),
  },
  {
    id: '2',
    title: 'Créez des vidéos étonnantes',
    description: 'Utilisez des fonctionnalités d\'appareil photo puissantes, des effets, des filtres et de la musique pour creer un contenu epoustouflant.',
    image: require('../../../assets/images/onboarding2.png'),
  },
  {
    id: '3',
    title: 'Connectez-vous avec la communauté',
    description: 'Suivez les créateurs, interagissez avec le contenu et découvrez les tendances du monde entier.',
    image: require('../../../assets/images/onboarding3.png'),
  },
  {
    id: '4',
    title: 'Devenir viral',
    description: 'Partagez votre créativité avec un public mondial et développez votre audience.',
    image: require('../../../assets/images/onboarding4.png'),
  },
];

const OnboardingScreen = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef();

  // Handle next slide
  const goToNextSlide = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      completeOnboarding();
    }
  };

  // Handle when user scrolls
  const handleViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  // Mark onboarding as completed
  const completeOnboarding = async () => {
    await storage.setOnboardingCompleted();
    if (onComplete) {
      onComplete();
    }
  };

  // Skip onboarding
  const handleSkip = async () => {
    await storage.setOnboardingCompleted();
    if (onComplete) {
      onComplete();
    }
  };

  // Render individual slide
  const renderSlide = ({ item }) => {
    return (
      <View style={styles.slide}>
        <Animatable.View 
          animation="fadeIn" 
          duration={1000} 
          style={styles.imageContainer}
        >
          <Image
            source={item.image}
            style={styles.image}
            resizeMode="contain"
          />
        </Animatable.View>
        
        <Animatable.View 
          animation="fadeInUp" 
          duration={800} 
          delay={300}
        >
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </Animatable.View>
      </View>
    );
  };

  // Render pagination dots
  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              { opacity: index === currentIndex ? 1 : 0.3 },
            ]}
          />
        ))}
      </View>
    );
  };

  // Calculate button text based on current slide
  const getButtonText = () => {
    return currentIndex === slides.length - 1 ? 'Get Started' : 'Next';
  };

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      
      {/* Skip button */}
      <TouchableOpacity 
        style={styles.skipButton} 
        onPress={handleSkip}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
      
      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
      />
      
      {/* Pagination dots */}
      {renderPagination()}
      
      {/* Next/Get Started button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={goToNextSlide}
        >
          <Text style={styles.buttonText}>{getButtonText()}</Text>
          {currentIndex !== slides.length - 1 && (
            <Animatable.View animation="slideInLeft" duration={400}>
              <Image 
                source={require('../../../assets/images/arrow-right.png')} 
                style={styles.buttonIcon}
              />
            </Animatable.View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  skipText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  slide: {
    width,
    height,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  imageContainer: {
    width: width * 0.8,
    height: height * 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#CCC',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FE2C55',
    marginHorizontal: 5,
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  button: {
    backgroundColor: '#FE2C55',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.7,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginRight: 10,
  },
  buttonIcon: {
    width: 20,
    height: 20,
    tintColor: '#FFF',
  },
});

export default OnboardingScreen;