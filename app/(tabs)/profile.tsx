import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, ScrollView, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import SettingsComponent from '@/components/settings';
import FarmsList from '@/components/FarmsList';
import Colors from '@/constants/colors';

const badge = require('@/assets/images/badge.png');

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('farms');
  // TODO: Replace with actual farm count logic
  const userHasFarm = user?.farms && user.farms.length > 0;

  const handleLogin = () => {
    router.push('/auth/login');
  };

  const handleRegister = () => {
    router.push('/auth/register');
  };

  const handleLogout = () => {
    logout();
  };
  const handleBecomeFarmer = () => {
    router.push('/become-farmer');
  };
  const handleManageFarms = () => {
    router.push('/farmer/manage');
  };
  const handleNewFarm = () => {
    router.push('/farmer/new');
  };
  const handleSettings = () => {
    router.push('/settings/settings');
  };

  const handleFintech = () => {
    router.push('/fintech/loans');
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>AgroLink</Text>
          <Text style={styles.logoSubtext}>Cameroon</Text>
        </View>
        
        <Text style={styles.authTitle}>Welcome to AgroLink</Text>
        <Text style={styles.authSubtitle}>
          Connect with farmers, discover fresh produce, and share agricultural stories
        </Text>
        
        <Pressable style={styles.primaryButton} onPress={handleLogin}>
          <Text style={styles.primaryButtonText}>Login</Text>
        </Pressable>
        
        <Pressable style={styles.secondaryButton} onPress={handleRegister}>
          <Text style={styles.secondaryButtonText}>Create Account</Text>
        </Pressable>
      </View>
    );
  }

  const tabData = [
    {
      key: 'farms',
      label: 'Farms',
      icon: (color: string) => (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M3 9.5L12 3l9 6.5V21a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z" />
          <Path d="M9 22V12h6v10" />
        </Svg>
      ),
    },
    {
      key: 'orders',
      label: 'Orders',
      icon: (color: string) => (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M6 6h15l-1.5 9H6z" />
          <Path d="M6 6V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
        </Svg>
      ),
    },
    {
      key: 'saves',
      label: 'Saves',
      icon: (color: string) => (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </Svg>
      ),
    },
    {
      key: 'likes',
      label: 'Likes',
      icon: (color: string) => (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.3l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
        </Svg>
      ),
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.header}>
          <Image 
            source={{ 
              uri: user?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dXNlcnxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60' 
            }} 
            style={styles.avatar} 
          />
          <Text style={styles.name}>{user?.name || 'AgroBazaar User'}</Text>
          <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>

          {/* Gold badge with credit score */}
          <Pressable style={styles.badgeContainer} onPress={handleFintech}>
            <Image
              source={badge}
              style={styles.goldBadge}
            />

            <Text style={styles.creditScoreText}>Njangi Credit: {user?.farmerProfile?.creditTier || 'Gold'} (Tap for Loans →)</Text>
          </Pressable>

          {/* Horizontal buttons under badge */}
          <View style={styles.horizontalButtons}>
            <Pressable style={styles.horizontalButton} onPress={handleSettings}>
              <Text style={styles.horizontalButtonText}>Settings</Text>
            </Pressable>
            <Pressable
              style={styles.horizontalButton}
              onPress={user?.isFarmer ? handleManageFarms : handleBecomeFarmer}
            >
              <Text style={styles.horizontalButtonText}>
                {user?.isFarmer ? 'Manage Farms' : 'Become a Farmer'}
              </Text>
            </Pressable>
          </View>

          {/* Interactive tab bar */}
          <View style={styles.tabBar}>
            {tabData.map(tab => (
              <Pressable
                key={tab.key}
                style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                {tab.icon(activeTab === tab.key ? Colors.primary : Colors.text.secondary)}
                <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Other profile content based on activeTab */}
        {/* {activeTab === 'farms' && <FarmsList />} */}
        {activeTab === 'farms' && !userHasFarm && (
          <View style={styles.emptyFarmContainer}>
            <Image source={require('@/assets/images/farm.jpeg')} style={styles.emptyFarmImage} />
            <Text style={styles.emptyFarmTitle}>No Farm Created yet</Text>
            <Text style={styles.emptyFarmSubtitle}>Create your farm now to start selling</Text>
          </View>
        )}
  
        {/* TODO: Add OrdersList, SavesList, LikesList for other tabs */}
      </ScrollView>

      {/* Floating + New Farm button */}
      {userHasFarm && (
        <TouchableOpacity style={styles.fab} onPress={handleNewFarm}>
          <Text style={styles.fabText}>+ New Farm</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingBlockStart: 8,
    paddingBlockEnd: 0,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  becomeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  becomeButtonText: {
    color: Colors.text.light,
    fontWeight: '600',
  },
  badgeContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  goldBadge: {
    width: 48,
    height: 48,
    marginBottom: 4,
  },
  creditScoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  horizontalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
    gap: 12,
  },
  horizontalButton: {
  borderRadius: 20,
  paddingVertical: 15,
  paddingHorizontal: 30,
  marginHorizontal: 6,
  borderWidth: 1,
  borderBottomWidth: 3,
  borderColor: Colors.primary, // or any color you want
  backgroundColor: 'transparent', // optional but good for clarity
}
,
  horizontalButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: Colors.primary,
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabText: {
    color: Colors.text.light,
    fontWeight: '700',
    fontSize: 16,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginTop: 0,
    marginBottom: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
    paddingVertical: 0,
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Colors.primary,
  },
  tabLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  authContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
  },
  logoSubtext: {
    fontSize: 18,
    color: Colors.text.secondary,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  authSubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 32,
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.light,
  },
  secondaryButton: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  emptyFarmContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  emptyFarmImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  emptyFarmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyFarmSubtitle: {
    fontSize: 15,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
});