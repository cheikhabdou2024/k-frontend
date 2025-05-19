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
          cardStyle: { backgroundColor: '#000' },
        }}
      >
        <Stack.Screen name="Main" component={TabNavigator} />
        
        <Stack.Group
          screenOptions={{
            presentation: 'modal',
          }}
        >
          <Stack.Screen name="CommentsScreen" component={CommentsScreen} />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;