import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const API_BASE_URL = 'http://10.110.7.226:5000/api';

const Login = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const navigation = useNavigation();

  // Reset form state when screen is focused
  useFocusEffect(
    useCallback(() => {
      setLogin('');
      setPassword('');
      setLoading(false);
      return () => {};
    }, [])
  );

  const handleLogin = async () => {
    if (!login.trim() || !password.trim()) {
      Alert.alert('Missing Information', 'Please fill in all fields.');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        login: login.trim(),
        password: password.trim()
      });

      const { token, role, userId, branch } = response.data;

      // Save user data
      await Promise.all([
        AsyncStorage.setItem('userToken', token),
        AsyncStorage.setItem('role', role),
        AsyncStorage.setItem('userId', userId.toString()),
        AsyncStorage.setItem('branch', branch.toString())
      ]);

      navigation.replace('FuelSalesManagement');
    } catch (error) {
      let message = 'An unexpected error occurred';
      
      if (error.response) {
        message = error.response.data.message || 'Invalid credentials';
      } else if (error.request) {
        message = 'Network error. Please check your connection';
      }
      
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#007547" />
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.container}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidView}
          >
            <View style={styles.formContainer}>
              <View style={styles.headerContainer}>
                <Text style={styles.welcomeText}>Welcome Back</Text>
                <Text style={styles.subtitleText}>Sign in to continue</Text>
              </View>

              <View style={styles.inputsContainer}>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={24} color="#666" />
                    <TextInput
                      style={styles.input}
                      placeholder="Username or Email"
                      placeholderTextColor="#666"
                      value={login}
                      onChangeText={setLogin}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      returnKeyType="next"
                      editable={!loading}
                    />
                  </View>
                </View>

                <View style={styles.inputWrapper}>
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={24} color="#666" />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#666"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={24}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.forgotPasswordContainer}
                onPress={() => Alert.alert('Password Reset', 'Please contact your administrator to reset your password.')}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#007547',
  },
  container: {
    flex: 1,
    backgroundColor: '#007547',
  },
  keyboardAvoidView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formContainer: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007547',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
  },
  inputsContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    color: '#333',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 8,
  },
  loginButton: {
    backgroundColor: '#007547',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: '#007547aa',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  forgotPasswordText: {
    color: '#007547',
    fontSize: 14,
    textDecorationLine: 'underline',
  }
});

export default Login;