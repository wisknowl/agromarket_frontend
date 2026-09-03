import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  LogOut,
  Warehouse,
  ShoppingBag,
  Heart,
  Bookmark,
  Plus,
  Settings,
  ShieldCheck,
  CreditCard,
} from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import SettingsComponent from '@/components/settings';
import FarmsList from '@/components/FarmsList';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import MeetingLeafLogo from '@/components/MeetingLeafLogo';
import BrandButton from '@/components/ui/BrandButton';
import FarmerBadge from '@/components/ui/FarmerBadge';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('farms');
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
        <View style={styles.logoBadgeContainer}>
          <MeetingLeafLogo
            size={72}
            showWordmark
            wordmarkColor={Colors.canopy}
            showTagline
            variant="fullColor"
          />
        </View>

        <Text style={styles.authTitle}>From farm to hand</Text>
        <Text style={styles.authSubtitle}>
          Connect with verified cooperatives, discover fresh harvests, and trade fairly across Cameroon
        </Text>

        <View style={styles.authButtonsWrapper}>
          <BrandButton
            title="Sign In"
            variant="primary"
            size="lg"
            onPress={handleLogin}
          />
          <BrandButton
            title="Create Account"
            variant="secondary"
            size="lg"
            onPress={handleRegister}
          />
        </View>
      </View>
    );
  }

  const tabData = [
    {
      key: 'farms',
      label: 'Farms',
      icon: (color: string) => <Warehouse size={20} color={color} strokeWidth={2} />,
    },
    {
      key: 'orders',
      label: 'Orders',
      icon: (color: string) => <ShoppingBag size={20} color={color} strokeWidth={2} />,
    },
    {
      key: 'saves',
      label: 'Saved',
      icon: (color: string) => <Bookmark size={20} color={color} strokeWidth={2} />,
    },
    {
      key: 'likes',
      label: 'Likes',
      icon: (color: string) => <Heart size={20} color={color} strokeWidth={2} />,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{
                uri:
                  user?.avatar ||
                  'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=500&auto=format&fit=crop&q=60',
              }}
              style={styles.avatar}
            />
            <View style={styles.verifiedDot} />
          </View>

          <Text style={styles.name}>{user?.name || 'agromarket Member'}</Text>
          <Text style={styles.email}>{user?.email || 'user@agromarket.cm'}</Text>

          {/* Credit Score & Tier Badge */}
          <Pressable style={styles.badgeContainer} onPress={handleFintech}>
            <FarmerBadge
              tier={user?.farmerProfile?.creditTier || 'GOLD'}
              label={`Njangi Credit: ${user?.farmerProfile?.creditTier || 'Gold'} Tier (Tap for Loans →)`}
              size="md"
            />
          </Pressable>

          {/* Horizontal Action Buttons */}
          <View style={styles.horizontalButtons}>
            <BrandButton
              title="Settings"
              variant="secondary"
              size="sm"
              onPress={handleSettings}
              icon={<Settings size={14} color={Colors.cultivated} />}
            />
            <BrandButton
              title={user?.isFarmer ? 'Manage Farms' : 'Become a Farmer'}
              variant="primary"
              size="sm"
              onPress={user?.isFarmer ? handleManageFarms : handleBecomeFarmer}
            />
          </View>

          {/* Sub-tab bar */}
          <View style={styles.tabBar}>
            {tabData.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  style={[styles.tabItem, isActive && styles.tabItemActive]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  {tab.icon(isActive ? Colors.cultivated : 'rgba(36, 26, 18, 0.45)')}
                  <Text
                    style={[
                      styles.tabLabel,
                      isActive && styles.tabLabelActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                  {isActive && <View style={styles.tabIndicator} />}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Tab content */}
        {activeTab === 'farms' && !userHasFarm && (
          <View style={styles.emptyFarmContainer}>
            <View style={styles.emptyIconCircle}>
              <Warehouse size={36} color={Colors.soil} strokeWidth={1.8} />
            </View>
            <Text style={styles.emptyFarmTitle}>No Farm Profile Yet</Text>
            <Text style={styles.emptyFarmSubtitle}>
              Register your farm to publish direct harvests and build your cooperative credit rating.
            </Text>
            <BrandButton
              title="+ Create Your Farm"
              variant="primary"
              size="md"
              onPress={handleNewFarm}
              style={{ marginTop: 16 }}
            />
          </View>
        )}

        {activeTab === 'farms' && userHasFarm && <FarmsList />}
      </ScrollView>

      {/* Floating + New Farm button */}
      {userHasFarm && (
        <TouchableOpacity style={styles.fab} onPress={handleNewFarm}>
          <Plus size={18} color={Colors.espresso} strokeWidth={2.5} />
          <Text style={styles.fabText}>New Farm</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  authContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  authTitle: {
    fontFamily: Fonts.displayItalic,
    fontSize: 24,
    color: Colors.canopy,
    marginBottom: 8,
    textAlign: 'center',
  },
  authSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  authButtonsWrapper: {
    width: '100%',
    gap: 12,
  },
  header: {
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2.5,
    borderColor: Colors.gold,
  },
  verifiedDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.cultivated,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  name: {
    fontFamily: Fonts.bodyBold,
    fontSize: 19,
    color: Colors.espresso,
    marginBottom: 2,
  },
  email: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  badgeContainer: {
    marginVertical: 6,
  },
  horizontalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
    gap: 10,
  },
  tabBar: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: Colors.parchmentDim,
    paddingTop: 10,
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    position: 'relative',
    gap: 4,
  },
  tabItemActive: {},
  tabLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: 'rgba(36, 26, 18, 0.45)',
  },
  tabLabelActive: {
    fontFamily: Fonts.bodyBold,
    color: Colors.cultivated,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -10,
    left: 8,
    right: 8,
    height: 3,
    backgroundColor: Colors.cultivated,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  emptyFarmContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.parchment,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyFarmTitle: {
    fontFamily: Fonts.displayItalic,
    fontSize: 20,
    color: Colors.espresso,
    marginBottom: 6,
  },
  emptyFarmSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gold,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: Radii.pill,
    gap: 6,
    ...Shadows.card,
  },
  fabText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.espresso,
  },
});