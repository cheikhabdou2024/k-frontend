import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar, 
  Dimensions, 
  Image 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const CreateScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  
  // Handle camera button press
  const handleCameraPress = () => {
    console.log('📸 Opening camera...');
    navigation.navigate('CameraScreen');
  };
  
  // Handle gallery button press
  const handleGalleryPress = () => {
    console.log('📱 Opening gallery...');
    navigation.navigate('GalleryPickerScreen');
  };
  
  // Handle templates button press (for future implementation)
  const handleTemplatesPress = () => {
    console.log('📋 Templates pressed');
    // To be implemented in future sprints
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Create</Text>
        
        <View style={styles.closeButton} /> 
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {/* Main buttons */}
        <View style={styles.buttonsContainer}>
          {/* Camera Button */}
          <TouchableOpacity 
            style={styles.mainButton}
            onPress={handleCameraPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FE2C55', '#25F4EE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Ionicons name="camera" size={40} color="#FFF" />
              <Text style={styles.buttonText}>Camera</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          {/* Gallery Button */}
          <TouchableOpacity 
            style={styles.mainButton}
            onPress={handleGalleryPress}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="images" size={40} color="#FFF" />
              <Text style={styles.buttonText}>Gallery</Text>
            </View>
          </TouchableOpacity>
          
          {/* Templates Button */}
          <TouchableOpacity 
            style={styles.mainButton}
            onPress={handleTemplatesPress}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="grid" size={40} color="#FFF" />
              <Text style={styles.buttonText}>Templates</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionTitle}>Create your video</Text>
          <Text style={styles.instructionText}>
            Tap Camera to record a new video, or Gallery to select from your existing videos
          </Text>
        </View>
      </View>
      
      {/* Demo video thumbnails */}
      <View style={styles.demoContainer}>
        <Text style={styles.demoTitle}>Recent trends</Text>
        <View style={styles.demoThumbnails}>
          {[1, 2, 3, 4].map((num) => (
            <View key={num} style={styles.demoThumbnail}>
              <Image 
                source={{ uri: `https://picsum.photos/id/${230 + num}/300/500` }} 
                style={styles.thumbnailImage}
              />
              <View style={styles.thumbnailOverlay}>
                <Text style={styles.thumbnailText}>Try this trend</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
  },
  mainButton: {
    width: width / 3.5,
    height: width / 3.5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFF',
    marginTop: 10,
    fontSize: 14,
    fontWeight: 'bold',
  },
  instructionsContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  instructionTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instructionText: {
    color: '#CCC',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  demoContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  demoTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  demoThumbnails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  demoThumbnail: {
    width: width / 4.5,
    height: width / 3,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 4,
  },
  thumbnailText: {
    color: '#FFF',
    fontSize: 10,
    textAlign: 'center',
  },
});

export default CreateScreen;