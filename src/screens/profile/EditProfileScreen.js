// src/screens/profile/EditProfileScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

const EditProfileScreen = ({ navigation, route }) => {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [originalUser, setOriginalUser] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  const insets = useSafeAreaInsets();
  
  // Load user data
  useEffect(() => {
    // In a real app, fetch user data from API
    const userData = route.params?.user || {
      username: 'yourusername',
      name: 'Your Name',
      bio: 'Digital creator | Making awesome content 📱✨\nFollow for daily videos!',
      avatarUrl: 'https://randomuser.me/api/portraits/men/88.jpg',
    };
    
    setOriginalUser(userData);
    setUsername(userData.username);
    setName(userData.name || '');
    setBio(userData.bio || '');
    setAvatar(userData.avatarUrl);
  }, [route.params]);
  
  // Check if user made any changes
  useEffect(() => {
    if (!originalUser) return;
    
    const changed = 
      username !== originalUser.username ||
      name !== (originalUser.name || '') ||
      bio !== (originalUser.bio || '') ||
      (avatar !== originalUser.avatarUrl && avatar !== null);
    
    setHasChanges(changed);
  }, [username, name, bio, avatar, originalUser]);
  
  // Handle picking an image from gallery
  const handlePickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photo library to change your avatar.');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };
  
  // Handle saving profile changes
  const handleSaveChanges = () => {
    // Validate inputs
    if (!username.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }
    
    // In a real app, send updated data to API
    console.log('Profile updated:', { username, name, bio, avatar });
    
    // Navigate back
    navigation.goBack();
  };
  
  // Handle discarding changes
  const handleDiscardChanges = () => {
    if (!hasChanges) {
      navigation.goBack();
      return;
    }
    
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard all changes?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Discard', 
          style: 'destructive',
          onPress: () => navigation.goBack()
        },
      ]
    );
  };
  
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleDiscardChanges}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Edit Profile</Text>
        
        <TouchableOpacity 
          style={[
            styles.headerButton,
            !hasChanges && styles.disabledButton
          ]}
          onPress={handleSaveChanges}
          disabled={!hasChanges}
        >
          <Text style={[
            styles.saveText,
            !hasChanges && styles.disabledText
          ]}>Save</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: avatar }} 
            style={styles.avatar}
          />
          <TouchableOpacity 
            style={styles.changeAvatarButton}
            onPress={handlePickImage}
          >
            <Text style={styles.changeAvatarText}>Change photo</Text>
          </TouchableOpacity>
        </View>
        
        {/* Form fields */}
        <View style={styles.formContainer}>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor="#555"
              autoCapitalize="none"
              maxLength={30}
            />
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#555"
              maxLength={50}
            />
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Bio"
              placeholderTextColor="#555"
              multiline
              maxLength={80}
            />
            <Text style={styles.charCount}>{bio.length}/80</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  cancelText: {
    color: '#FFF',
    fontSize: 15,
  },
  saveText: {
    color: '#FE2C55',
    fontSize: 15,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#888',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  changeAvatarButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changeAvatarText: {
    color: '#FE2C55',
    fontSize: 16,
    fontWeight: '500',
  },
  formContainer: {
    marginTop: 10,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    color: '#BBB',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#111',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  bioInput: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  charCount: {
    color: '#777',
    fontSize: 12,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
});

export default EditProfileScreen; //WHEN WE BACK jump into step 4 claude//