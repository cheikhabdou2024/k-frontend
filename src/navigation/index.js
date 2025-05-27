// src/navigation/index.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import TabNavigator from './TabNavigator';
import CommentsScreen from '../screens/feed/CommentsScreen';
import { createStackNavigator } from '@react-navigation/stack';


const Stack = createStackNavigator();

const Navigation = () => {
 return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="Main" component={TabNavigator} />
        
        <Stack.Group
          screenOptions={{
            presentation: 'transparentModal',
            cardOverlayEnabled: true,
            cardStyleInterpolator: ({ current: { progress } }) => ({
              cardStyle: {
                opacity: progress.interpolate({
                  inputRange: [0, 0.5, 0.9, 1],
                  outputRange: [0, 0.25, 0.7, 1],
                }),
              },
              overlayStyle: {
                opacity: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.5],
                  extrapolate: 'clamp',
                }),
                backgroundColor: '#000',
              },
            }),
          }}
        >
          <Stack.Screen name="CommentsScreen" component={CommentsScreen} />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;