// src/components/debug/ApiTestComponent.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import apiService from '../../services/apiService';

const ApiTestComponent = () => {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const runApiTest = async (testName, apiCall) => {
    setLoading(true);
    setTestResults(prev => ({
      ...prev,
      [testName]: { status: 'testing', message: 'Testing...', data: null }
    }));

    try {
      const startTime = Date.now();
      const result = await apiCall();
      const duration = Date.now() - startTime;

      setTestResults(prev => ({
        ...prev,
        [testName]: {
          status: 'success',
          message: `Success (${duration}ms)`,
          data: result
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          status: 'error',
          message: error.message,
          data: null
        }
      }));
    }
    setLoading(false);
  };

  const testHealthCheck = () => {
    runApiTest('health', () => 
      fetch('http://localhost:3001/health').then(res => res.json())
    );
  };

  const testGetVideos = () => {
    runApiTest('videos', () => apiService.get('/videos'));
  };

  const testGetTrendingVideos = () => {
    runApiTest('trending', () => apiService.get('/videos/trending'));
  };

  const runAllTests = async () => {
    await testHealthCheck();
    await testGetVideos();
    await testGetTrendingVideos();
  };

  useEffect(() => {
    // Auto-run basic health check on mount
    testHealthCheck();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'testing': return '#FF9800';
      default: return '#999';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔧 API Connection Test</Text>
        <Text style={styles.subtitle}>Backend: http://localhost:3001</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={runAllTests}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? '🔄 Testing...' : '🚀 Run All Tests'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.testButtons}>
        <TouchableOpacity 
          style={styles.testButton}
          onPress={testHealthCheck}
          disabled={loading}
        >
          <Text style={styles.testButtonText}>Health Check</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.testButton}
          onPress={testGetVideos}
          disabled={loading}
        >
          <Text style={styles.testButtonText}>Get Videos</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.testButton}
          onPress={testGetTrendingVideos}
          disabled={loading}
        >
          <Text style={styles.testButtonText}>Get Trending</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.results}>
        <Text style={styles.resultsTitle}>📊 Test Results:</Text>
        
        {Object.entries(testResults).map(([testName, result]) => (
          <View key={testName} style={styles.testResult}>
            <View style={styles.testHeader}>
              <Text style={styles.testName}>{testName.toUpperCase()}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(result.status) }
              ]}>
                <Text style={styles.statusText}>{result.status}</Text>
              </View>
            </View>
            
            <Text style={styles.testMessage}>{result.message}</Text>
            
            {result.data && (
              <View style={styles.dataContainer}>
                <Text style={styles.dataLabel}>Response:</Text>
                <Text style={styles.dataText}>
                  {JSON.stringify(result.data, null, 2).substring(0, 200)}
                  {JSON.stringify(result.data).length > 200 ? '...' : ''}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>📝 Instructions:</Text>
        <Text style={styles.instructionText}>
          1. Make sure your backend is running on localhost:3001
        </Text>
        <Text style={styles.instructionText}>
          2. Check that Docker containers are up: docker-compose up
        </Text>
        <Text style={styles.instructionText}>
          3. Verify database has video data
        </Text>
        <Text style={styles.instructionText}>
          4. If tests fail, check the console logs
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
  },
  buttonRow: {
    marginBottom: 16,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#FE2C55',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  testButton: {
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 6,
    margin: 4,
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#FFF',
    fontSize: 12,
  },
  results: {
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  testResult: {
    backgroundColor: '#111',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  testMessage: {
    color: '#CCC',
    fontSize: 12,
    marginBottom: 4,
  },
  dataContainer: {
    marginTop: 8,
  },
  dataLabel: {
    color: '#888',
    fontSize: 10,
    marginBottom: 4,
  },
  dataText: {
    color: '#DDD',
    fontSize: 10,
    fontFamily: 'monospace',
    backgroundColor: '#222',
    padding: 8,
    borderRadius: 4,
  },
  instructions: {
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 8,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  instructionText: {
    color: '#CCC',
    fontSize: 12,
    marginBottom: 4,
  },
});

export default ApiTestComponent;