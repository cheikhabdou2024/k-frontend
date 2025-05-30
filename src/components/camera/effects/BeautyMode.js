// src/components/camera/effects/BeautyMode.js
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  Animated,
  Slider
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';

const BEAUTY_EFFECTS = [
  {
    id: 'skinSmooth',
    name: 'Smooth',
    icon: 'sparkles',
    defaultValue: 30,
    max: 100,
    color: '#FFB6C1'
  },
  {
    id: 'eyeEnhance',
    name: 'Eyes',
    icon: 'eye-outline',
    defaultValue: 20,
    max: 80,
    color: '#87CEEB'
  },
  {
    id: 'lipEnhance',
    name: 'Lips',
    icon: 'heart',
    defaultValue: 15,
    max: 60,
    color: '#FF69B4'
  },
  {
    id: 'faceSlim',
    name: 'Slim',
    icon: 'person-outline',
    defaultValue: 10,
    max: 50,
    color: '#DDA0DD'
  }
];

const BeautyMode = ({ 
  isEnabled, 
  onToggle, 
  onEffectChange,
  isRecording = false,
  style 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [effects, setEffects] = useState(
    BEAUTY_EFFECTS.reduce((acc, effect) => {
      acc[effect.id] = effect.defaultValue;
      return acc;
    }, {})
  );
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Glow animation when enabled
  useEffect(() => {
    if (isEnabled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      glowAnim.setValue(0);
    }
  }, [isEnabled]);

  // Toggle beauty mode
  const handleToggle = () => {
    if (isRecording) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggle && onToggle(!isEnabled);
    
    if (!isEnabled) {
      setIsExpanded(true);
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  };

  // Handle effect value change
  const handleEffectChange = (effectId, value) => {
    setEffects(prev => ({ ...prev, [effectId]: value }));
    onEffectChange && onEffectChange(effectId, value);
  };

  // Toggle expanded view
  const toggleExpanded = () => {
    if (isRecording || !isEnabled) return;
    
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);
    
    Animated.spring(slideAnim, {
      toValue,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
    
    Haptics.selectionAsync();
  };

  // Render effect slider
  const renderEffectSlider = (effect) => (
    <View key={effect.id} style={styles.effectRow}>
      <View style={styles.effectHeader}>
        <Ionicons name={effect.icon} size={16} color={effect.color} />
        <Text style={styles.effectName}>{effect.name}</Text>
        <Text style={styles.effectValue}>{Math.round(effects[effect.id])}</Text>
      </View>
      
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={effect.max}
        value={effects[effect.id]}
        onValueChange={(value) => handleEffectChange(effect.id, value)}
        minimumTrackTintColor={effect.color}
        maximumTrackTintColor="rgba(255,255,255,0.2)"
        thumbStyle={{ backgroundColor: effect.color }}
        trackStyle={{ height: 4, borderRadius: 2 }}
        disabled={isRecording}
      />
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      {/* Beauty Mode Toggle */}
      <TouchableOpacity 
        style={[
          styles.beautyToggle,
          isEnabled && styles.beautyToggleActive
        ]}
        onPress={handleToggle}
        disabled={isRecording}
      >
        <Animated.View
          style={[
            styles.beautyIcon,
            {
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.6, 1],
              }),
              transform: [{
                scale: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.1],
                })
              }]
            }
          ]}
        >
          <Ionicons 
            name="sparkles" 
            size={24} 
            color={isEnabled ? '#FFB6C1' : '#FFF'} 
          />
        </Animated.View>
        
        <Text style={[
          styles.beautyText,
          isEnabled && styles.beautyTextActive
        ]}>
          Beauty
        </Text>
        
        {isEnabled && (
          <TouchableOpacity 
            style={styles.expandIcon}
            onPress={toggleExpanded}
          >
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#FFB6C1" 
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      
      {/* Beauty Effects Panel */}
      {isEnabled && (
        <Animated.View 
          style={[
            styles.effectsPanel,
            {
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                })
              }],
              opacity: slideAnim
            }
          ]}
        >
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Beauty Effects</Text>
            <View style={styles.presetButtons}>
              <TouchableOpacity 
                style={styles.presetButton}
                onPress={() => {
                  const naturalEffects = BEAUTY_EFFECTS.reduce((acc, effect) => {
                    acc[effect.id] = effect.defaultValue * 0.5;
                    return acc;
                  }, {});
                  setEffects(naturalEffects);
                }}
              >
                <Text style={styles.presetButtonText}>Natural</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.presetButton}
                onPress={() => {
                  const enhanceEffects = BEAUTY_EFFECTS.reduce((acc, effect) => {
                    acc[effect.id] = effect.defaultValue;
                    return acc;
                  }, {});
                  setEffects(enhanceEffects);
                }}
              >
                <Text style={styles.presetButtonText}>Enhance</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.presetButton}
                onPress={() => {
                  const glamourEffects = BEAUTY_EFFECTS.reduce((acc, effect) => {
                    acc[effect.id] = effect.max * 0.8;
                    return acc;
                  }, {});
                  setEffects(glamourEffects);
                }}
              >
                <Text style={styles.presetButtonText}>Glamour</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.effectsContainer}>
            {BEAUTY_EFFECTS.map(renderEffectSlider)}
          </View>
          
          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={() => {
                const resetEffects = BEAUTY_EFFECTS.reduce((acc, effect) => {
                  acc[effect.id] = 0;
                  return acc;
                }, {});
                setEffects(resetEffects);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Ionicons name="refresh-outline" size={16} color="#FFF" />
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.saveButton}>
              <Ionicons name="bookmark-outline" size={16} color="#FFB6C1" />
              <Text style={styles.saveButtonText}>Save Preset</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  beautyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  beautyToggleActive: {
    backgroundColor: 'rgba(255,182,193,0.2)',
    borderColor: '#FFB6C1',
  },
  beautyIcon: {
    marginRight: 6,
  },
  beautyText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  beautyTextActive: {
    color: '#FFB6C1',
  },
  expandIcon: {
    marginLeft: 6,
  },
  effectsPanel: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,182,193,0.3)',
    minWidth: 300,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  panelTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  presetButtons: {
    flexDirection: 'row',
  },
  presetButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
    backgroundColor: 'rgba(255,182,193,0.2)',
    borderRadius: 12,
  },
  presetButtonText: {
    color: '#FFB6C1',
    fontSize: 10,
  },
  effectsContainer: {
    marginBottom: 16,
  },
  effectRow: {
    marginBottom: 16,
  },
  effectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  effectName: {
    color: '#FFF',
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
  },
  effectValue: {
    color: '#FFB6C1',
    fontSize: 12,
    fontWeight: 'bold',
  },
  slider: {
    width: '100%',
    height: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  resetButtonText: {
    color: '#FFF',
    fontSize: 12,
    marginLeft: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  saveButtonText: {
    color: '#FFB6C1',
    fontSize: 12,
    marginLeft: 4,
  },
});

export default BeautyMode;