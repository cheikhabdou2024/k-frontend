import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Image, TouchableOpacity, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

/**
 * Enhanced sound animation component for TikTok-style rotating music disc
 */
const SoundDisk = ({ imageUrl, soundName, onPress, size = 'small', isActive = false }) => {
  // Animation value for rotation
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Determine size based on prop
  const diskSize = {
    tiny: 22,
    small: 32,
    medium: 40,
    large: 48
  }[size] || 32;
  
  // Start rotation animation when component mounts or becomes active
  useEffect(() => {
    let animation;
    
    if (isActive) {
      // Create infinite rotation animation
      animation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000, // 3 seconds per rotation
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      
      // Start animation
      animation.start();
    } else {
      // Reset animation when not active
      rotateAnim.setValue(0);
    }
    
    // Clean up animation when component unmounts
    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [isActive]);
  
  // Calculate rotation transform
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {soundName && (
        <View style={styles.soundInfoContainer}>
          <Ionicons name="musical-notes" size={14} color="#FFF" />
          <Text style={styles.soundName} numberOfLines={1} ellipsizeMode="tail">
            {soundName}
          </Text>
        </View>
      )}
      
      <Animated.View
        style={[
          styles.diskContainer,
          {
            width: diskSize,
            height: diskSize,
            transform: [{ rotate }],
          }
        ]}
      >
        <Image
          source={{ uri: imageUrl }}
          style={[
            styles.diskImage,
            { 
              width: diskSize - 6, 
              height: diskSize - 6,
              borderRadius: (diskSize - 6) / 2
            }
          ]}
        />
        <View style={[
          styles.diskCenter,
          { width: diskSize / 4, height: diskSize / 4, borderRadius: diskSize / 8 }
        ]} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  soundInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  soundName: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 5,
    maxWidth: 130,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  diskContainer: {
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  diskImage: {
    position: 'absolute',
  },
  diskCenter: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#333',
  }
});

export default SoundDisk;