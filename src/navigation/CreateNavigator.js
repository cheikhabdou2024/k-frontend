import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import create screens
import CreateScreen from '../screens/create/CreateScreen';
import CameraScreen from '../screens/create/CameraScreen';
import GalleryPickerScreen from '../screens/create/GalleryPickerScreen';

// Create a stack navigator for the create flow
const CreateStack = createStackNavigator();

/**
 * Create flow navigation stack
 * Manages screens related to content creation
 */
const CreateNavigator = () => {
  return (
    <CreateStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#000' },
      }}
    >
      <CreateStack.Screen name="CreateHome" component={CreateScreen} />
      <CreateStack.Screen 
        name="CameraScreen" 
        component={CameraScreen}
        options={{
          gestureEnabled: false, // Disable swipe gesture to go back
        }}
      />
      <CreateStack.Screen name="GalleryPickerScreen" component={GalleryPickerScreen} />
    </CreateStack.Navigator>
  );
};

export default CreateNavigator;