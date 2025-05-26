import React, { useRef, useEffect } from 'react';
import { View, Animated, Easing, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const TikTokLoader = ({ size = 60 }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const ballOffset = size / 2.5;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.loader,
          { width: size, height: size, transform: [{ rotate }] },
        ]}
      >
        <View
          style={[
            styles.ball,
            {
              backgroundColor: '#FE2C55',
              left: 0,
              top: size / 2 - ballOffset / 2,
              width: ballOffset,
              height: ballOffset,
            },
          ]}
        />
        <View
          style={[
            styles.ball,
            {
              backgroundColor: '#fff',
              right: 0,
              top: size / 2 - ballOffset / 2,
              width: ballOffset,
              height: ballOffset,
            },
          ]}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loader: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ball: {
    position: 'absolute',
    borderRadius: 50,
  },
});

export default TikTokLoader;