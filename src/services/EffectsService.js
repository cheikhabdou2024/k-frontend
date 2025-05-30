// src/services/EffectsService.js
class EffectsService {
  constructor() {
    this.activeEffects = new Map();
    this.effectHistory = [];
    this.presets = new Map();
    this.listeners = new Set();
  }

  // Register effect listener
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in effects service listener:', error);
      }
    });
  }

  // Apply effect
  applyEffect(effectId, effectData, options = {}) {
    const effect = {
      id: effectId,
      data: effectData,
      timestamp: Date.now(),
      duration: options.duration || null,
      intensity: options.intensity || 1,
      isActive: true,
      ...options
    };

    this.activeEffects.set(effectId, effect);
    this.effectHistory.push({ ...effect, action: 'applied' });

    // Auto-remove effect after duration
    if (effect.duration) {
      setTimeout(() => {
        this.removeEffect(effectId);
      }, effect.duration);
    }

    this.notifyListeners({
      type: 'effect-applied',
      effect,
      activeEffects: Array.from(this.activeEffects.values())
    });

    return effect;
  }

  // Remove effect
  removeEffect(effectId) {
    const effect = this.activeEffects.get(effectId);
    if (effect) {
      this.activeEffects.delete(effectId);
      this.effectHistory.push({ ...effect, action: 'removed', removedAt: Date.now() });

      this.notifyListeners({
        type: 'effect-removed',
        effectId,
        effect,
        activeEffects: Array.from(this.activeEffects.values())
      });

      return true;
    }
    return false;
  }

  // Update effect
  updateEffect(effectId, updates) {
    const effect = this.activeEffects.get(effectId);
    if (effect) {
      const updatedEffect = { ...effect, ...updates, updatedAt: Date.now() };
      this.activeEffects.set(effectId, updatedEffect);

      this.notifyListeners({
        type: 'effect-updated',
        effectId,
        effect: updatedEffect,
        updates
      });

      return updatedEffect;
    }
    return null;
  }

  // Get active effects
  getActiveEffects() {
    return Array.from(this.activeEffects.values());
  }

  // Get effect by ID
  getEffect(effectId) {
    return this.activeEffects.get(effectId);
  }

  // Clear all effects
  clearAllEffects() {
    const clearedEffects = Array.from(this.activeEffects.values());
    this.activeEffects.clear();

    this.notifyListeners({
      type: 'all-effects-cleared',
      clearedEffects
    });
  }

  // Save preset
  savePreset(name, effects = null) {
    const preset = {
      name,
      effects: effects || Array.from(this.activeEffects.values()),
      createdAt: Date.now(),
      id: `preset_${Date.now()}`
    };

    this.presets.set(preset.id, preset);
    return preset;
  }

  // Load preset
  loadPreset(presetId) {
    const preset = this.presets.get(presetId);
    if (preset) {
      this.clearAllEffects();
      preset.effects.forEach(effect => {
        this.applyEffect(effect.id, effect.data, effect);
      });

      this.notifyListeners({
        type: 'preset-loaded',
        preset,
        activeEffects: Array.from(this.activeEffects.values())
      });
    }
    return preset;
  }

  // Get presets
  getPresets() {
    return Array.from(this.presets.values());
  }

  // Get effect statistics
  getStats() {
    return {
      activeCount: this.activeEffects.size,
      totalApplied: this.effectHistory.filter(e => e.action === 'applied').length,
      totalRemoved: this.effectHistory.filter(e => e.action === 'removed').length,
      presetsCount: this.presets.size,
      mostUsedEffects: this.getMostUsedEffects(),
      averageEffectDuration: this.getAverageEffectDuration()
    };
  }

  // Get most used effects
  getMostUsedEffects() {
    const effectCounts = {};
    this.effectHistory.forEach(effect => {
      if (effect.action === 'applied') {
        effectCounts[effect.id] = (effectCounts[effect.id] || 0) + 1;
      }
    });

    return Object.entries(effectCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([id, count]) => ({ id, count }));
  }

  // Get average effect duration
  getAverageEffectDuration() {
    const durationEffects = this.effectHistory.filter(e => 
      e.action === 'removed' && e.removedAt && e.timestamp
    );

    if (durationEffects.length === 0) return 0;

    const totalDuration = durationEffects.reduce((sum, effect) => 
      sum + (effect.removedAt - effect.timestamp), 0
    );

    return totalDuration / durationEffects.length;
  }

  // Export effects configuration
  exportEffects() {
    return {
      activeEffects: Array.from(this.activeEffects.entries()),
      presets: Array.from(this.presets.entries()),
      history: this.effectHistory.slice(-100), // Last 100 events
      exportedAt: Date.now()
    };
  }

  // Import effects configuration
  importEffects(exportedData) {
    try {
      if (exportedData.activeEffects) {
        this.activeEffects = new Map(exportedData.activeEffects);
      }
      
      if (exportedData.presets) {
        this.presets = new Map(exportedData.presets);
      }

      if (exportedData.history) {
        this.effectHistory = [...this.effectHistory, ...exportedData.history];
      }

      this.notifyListeners({
        type: 'effects-imported',
        importedData: exportedData
      });

      return true;
    } catch (error) {
      console.error('Failed to import effects:', error);
      return false;
    }
  }
}

// Create singleton instance
const effectsService = new EffectsService();

export default effectsService;
export { EffectsService };