import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';
import Colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/constants/translations';
import { LogOut, Globe, Shield, ArrowLeft } from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const { t, language, setLanguage } = useTranslation();

  const handleLogout = () => {
    logout();
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#0F172A" />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Language Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Language / Langue (Cameroon)</Text>
        <View style={styles.langRow}>
          <Pressable
            style={[styles.langCard, language === 'en' && styles.langCardActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>
              🇨🇲 English (Cameroon)
            </Text>
          </Pressable>
          <Pressable
            style={[styles.langCard, language === 'fr' && styles.langCardActive]}
            onPress={() => setLanguage('fr')}
          >
            <Text style={[styles.langText, language === 'fr' && styles.langTextActive]}>
              🇨🇲 Français (Cameroun)
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Account Info */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Account Profile</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Logged in as:</Text>
          <Text style={styles.infoValue}>{user?.name || 'Guest User'}</Text>
          <Text style={styles.infoRole}>Role: {user?.role || 'BUYER'}</Text>
        </View>
      </View>

      {/* Logout button */}
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Log Out of agromarket</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 20,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  langRow: {
    gap: 10,
  },
  langCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  langCardActive: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  langText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  langTextActive: {
    color: '#0D5C3A',
    fontWeight: '800',
  },
  infoBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  infoRole: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '700',
    marginTop: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 'auto',
    marginBottom: 30,
    gap: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
});
