// src/components/debug/UploadTestComponent.js
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert 
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import videoUploadService from '../../services/uploadService';
import AsyncStorage from '@react-native-async-storage/async-storage';





const UploadTestComponent = () => {
   const [testResults, setTestResults] = useState({});
   const [loading, setLoading] = useState(false);
  // Test MinIO connection
  const testMinioConnection = async () => {
    setLoading(true);
    try {
      console.log('🔍 Testing MinIO connection...');
      const status = await videoUploadService.checkUploadStatus();

      setTestResults(prev => ({
        ...prev,
        minio: {
          status: status.storage === 'connected' ? 'success' : 'error',
          message: status.storage === 'connected' 
            ? '✅ MinIO is connected!' 
            : '❌ MinIO is not connected',
          data: status
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        minio: {
          status: 'error',
          message: `❌ Connection test failed: ${error.message}`,
          data: null
        }
      }));
    }
    setLoading(false);
  };

  // Test authentication
  const testAuthentication = async () => {
    setLoading(true);
    try {
      console.log('🔐 Testing authentication...');
      
      // First, let's set a test token (in real app, this comes from login)
      await AsyncStorage.setItem('@auth_token', 'test_token_123');
      
      const token = await videoUploadService.getAuthToken();
      
      setTestResults(prev => ({
        ...prev,
        auth: {
          status: token ? 'success' : 'error',
          message: token 
            ? '✅ Auth token found!' 
            : '❌ No auth token found',
          data: { hasToken: !!token }
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        auth: {
          status: 'error',
          message: `❌ Auth test failed: ${error.message}`,
          data: null
        }
      }));
    }
    setLoading(false);
  };

  // Test file preparation
  const testFilePrepare = async () => {
    setLoading(true);
    try {
      console.log('📁 Testing file preparation...');
      
      // Create a test "video" URI (in real app, this comes from camera/gallery)
      const testVideoUri = 'file:///path/to/test/video.mp4';
      
      // This will fail with fake URI, but shows the function works
      const metadata = await videoUploadService.prepareVideoForUpload(testVideoUri)
        .catch(err => ({
          error: true,
          message: 'Expected error with test URI',
          functionWorks: true
        }));
      
      setTestResults(prev => ({
        ...prev,
        prepare: {
          status: metadata.functionWorks ? 'success' : 'error',
          message: metadata.functionWorks 
            ? '✅ Prepare function is working!' 
            : '❌ Prepare function failed',
          data: metadata
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        prepare: {
          status: 'error',
          message: `❌ Prepare test failed: ${error.message}`,
          data: null
        }
      }));
    }
    setLoading(false);
  };

  // Run all tests
  const runAllTests = async () => {
    setTestResults({});
    await testMinioConnection();
    await testAuthentication();
    await testFilePrepare();
  };

  // Show setup instructions
  const showSetupInstructions = () => {
    Alert.alert(
      '📋 Upload Setup Instructions',
      `1. Start Docker and MinIO:
   cd backend && docker-compose up -d minio

2. Access MinIO console:
   http://localhost:9001
   User: minio, Pass: minio123

3. Create 'videos' bucket if not exists

4. Start backend server:
   cd backend && npm run dev

5. Update API URL in uploadService.js to match your IP

6. You're ready to upload!`,
      [{ text: 'OK' }]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      default: return '#999';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚀 Video Upload Test</Text>
        <TouchableOpacity onPress={showSetupInstructions}>
          <Ionicons name="help-circle-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Setup Check</Text>
        <View style={styles.checkList}>
          <Text style={styles.checkItem}>✓ Docker Desktop running?</Text>
          <Text style={styles.checkItem}>✓ MinIO container started?</Text>
          <Text style={styles.checkItem}>✓ Backend server running?</Text>
          <Text style={styles.checkItem}>✓ Videos bucket created?</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.button, styles.primaryButton]}
        onPress={runAllTests}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? '🔄 Testing...' : '🧪 Run All Tests'}
        </Text>
      </TouchableOpacity>

      <View style={styles.testButtons}>
        <TouchableOpacity 
          style={styles.testButton}
          onPress={testMinioConnection}
          disabled={loading}
        >
          <Text style={styles.testButtonText}>Test MinIO</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.testButton}
          onPress={testAuthentication}
          disabled={loading}
        >
          <Text style={styles.testButtonText}>Test Auth</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.testButton}
          onPress={testFilePrepare}
          disabled={loading}
        >
          <Text style={styles.testButtonText}>Test Prepare</Text>
        </TouchableOpacity>
      </View>

      {/* Test Results */}
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
                <Text style={styles.dataLabel}>Details:</Text>
                <Text style={styles.dataText}>
                  {JSON.stringify(result.data, null, 2)}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {loading && (
        <ActivityIndicator size="large" color="#FE2C55" style={styles.loader} />
      )}

      <View style={styles.info}>
        <Text style={styles.infoTitle}>📝 How to Use:</Text>
        <Text style={styles.infoText}>
          1. Run all tests to check your setup{'\n'}
          2. Fix any red (error) results{'\n'}
          3. Once all green, try uploading a video!{'\n'}
          4. Check MinIO console to see uploaded files
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  checkList: {
    backgroundColor: '#111',
    padding: 12,
    borderRadius: 8,
  },
  checkItem: {
    color: '#4CAF50',
    fontSize: 14,
    marginBottom: 4,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
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
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  testButton: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
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
  loader: {
    marginVertical: 20,
  },
  info: {
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  infoText: {
    color: '#CCC',
    fontSize: 12,
    lineHeight: 20,
  },
});

export default UploadTestComponent;