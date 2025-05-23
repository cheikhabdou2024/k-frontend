import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import create screens
import CreateScreen from '../screens/create/CreateScreen';
import CameraScreen from '../screens/create/EnhancedCameraScreen';
import GalleryPickerScreen from '../screens/create/EnhancedGalleryPickerScreen';
import VideoPreviewScreen from '../screens/create/VideoPreviewScreen';
import EnhancedCameraScreen from '../screens/create/EnhancedCameraScreen';
import EnhancedGalleryPickerScreen from '../screens/create/EnhancedGalleryPickerScreen';

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
        component={EnhancedCameraScreen}
        options={{
          gestureEnabled: false, // Disable swipe gesture to go back
        }}
      />
      <CreateStack.Screen name="GalleryPickerScreen" component={EnhancedGalleryPickerScreen} />
      <CreateStack.Screen 
        name="VideoPreview" 
        component={VideoPreviewScreen}
        options={{
          gestureEnabled: false, // Disable swipe gesture during editing
        }}
      />
    </CreateStack.Navigator>
  );
};

export default CreateNavigator;