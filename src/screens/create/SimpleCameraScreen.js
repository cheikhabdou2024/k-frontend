// Create this as: src/screens/create/SimpleCameraScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const SimpleCameraScreen = () => {
  const navigation = useNavigation();

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Camera</Text>
        
        <View style={styles.placeholder} />
      </View>
      
      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.cameraPlaceholder}>
          <Ionicons name="camera-outline" size={64} color="#666" />
          <Text style={styles.placeholderTitle}>Camera Preview</Text>
          <Text style={styles.placeholderText}>
            Camera functionality will be added here
          </Text>
        </View>
        
        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity 
            style={styles.recordButton}
            onPress={() => console.log('Record pressed')}
          >
            <View style={styles.recordButtonInner} />
          </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  placeholderTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  placeholderText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomControls: {
    alignItems: 'center',
    paddingBottom: 50,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FE2C55',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
  },
});

export default SimpleCameraScreen;