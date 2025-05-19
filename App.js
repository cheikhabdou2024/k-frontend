import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigation from './src/navigation';
import SplashScreen from './src/screens/auth/SplashScreen';
import OnboardingScreen from './src/screens/auth/OnboardingScreen';
import InterestsScreen from './src/screens/auth/InterestsScreen';
import FeedScreen from './src/screens/feed/FeedScreen';
import * as storage from './src/utils/storage';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [interestsCompleted, setInterestsCompleted] = useState(false);

  // Vérifier si l'onboarding a été complété
  useEffect(() => {
    const checkStatus = async () => {
      // Simuler un délai de chargement pour le SplashScreen
      setTimeout(async () => {
        const completed = await storage.isOnboardingCompleted();
        setOnboardingCompleted(completed);
        
        // Si l'onboarding est complété, vérifier si les intérêts ont été sélectionnés
        if (completed) {
          const interests = await storage.getInterests();
          setInterestsCompleted(interests.length > 0);
        }
        
        setIsLoading(false);
      }, 2000); // Afficher le SplashScreen pendant 2 secondes
    };

    checkStatus();
  }, []);

  const handleOnboardingComplete = () => {
    setOnboardingCompleted(true);
  };

  const handleInterestsComplete = () => {
    setInterestsCompleted(true);
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!onboardingCompleted) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  if (!interestsCompleted) {
    return <InterestsScreen onComplete={handleInterestsComplete} />;
  }

  // Maintenant que l'onboarding et les intérêts sont complétés, afficher l'écran principal
  return (
    <SafeAreaProvider>
       <Navigation />
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}