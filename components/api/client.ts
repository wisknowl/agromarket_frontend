import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Base API URL configuration - automatically resolves Metro host IP
const getBaseUrl = () => {
  // 1. Explicit environment variable override (e.g., production deployment)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Web browser
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }

  // 3. Dynamic auto-detection from Metro packager host IP (Zero-config for any Wi-Fi/LAN)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any).manifest?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip) {
      return `http://${ip}:5000/api`;
    }
  }

  // 4. Fallback for Android emulator / local simulator
  return Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Error attaching auth token', e);
    }
    console.log(`📡 [API OUTGOING] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ [API REQUEST ERROR]', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ [API RESPONSE] ${response.config.method?.toUpperCase()} ${response.config.url} -> ${response.status}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.warn(`⚠️ [API SERVER ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url} -> ${error.response.status}`, error.response.data);
    } else if (error.request) {
      console.error(`❌ [API NETWORK ERROR] Cannot connect to backend at ${error.config?.baseURL || getBaseUrl()}`, error.message);
    } else {
      console.error('❌ [API CLIENT ERROR]', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
