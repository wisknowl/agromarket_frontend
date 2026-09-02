import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/constants/translations';
import { loginApi } from '@/components/api/auth';
import { users } from '@/mocks/data';
import Colors from '@/constants/colors';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { UserRole } from '@/types';

const LOGO = require('@/assets/images/agrobazaar_logo_new.png');
const { width, height } = Dimensions.get('window');

const ROLES: Array<{ key: UserRole; label: string; icon: string }> = [
  { key: 'BUYER', label: 'Consumer', icon: 'shopping' },
  { key: 'WHOLESALER', label: 'Buyam-Sellam', icon: 'storefront' },
  { key: 'FARMER', label: 'Farmer / Co-op', icon: 'sprout' },
  { key: 'AGRO_TRANSPORTER', label: 'Transporter', icon: 'truck-fast' },
  { key: 'FINANCIAL_OFFICER', label: 'Microfinance', icon: 'bank' },
];

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginAsGuest, selectedRole, setSelectedRole } = useAuthStore();
  const { t, language, setLanguage } = useTranslation();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleOpenLogin = (role?: UserRole) => {
    if (role) setSelectedRole(role);
    setError('');
    setShowLoginModal(true);
  };

  const handleLoginSubmit = async () => {
    if (!email || !password) {
      setError('Please fill in your email/phone and password');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // 1. Try real Backend API
      const result = await loginApi(email.trim(), password);
      login(result.user, result.token);
      setShowLoginModal(false);

      if (result.user.role === 'ADMIN') {
        router.replace('/admin-dashboard');
      } else {
        router.replace('/(tabs)');
      }
    } catch (apiErr: any) {
      // 2. Resilient fallback to Seed/Mock data
      const foundUser = users.find(
        (u) => (u.email === email.trim() || u.phone === email.trim()) && u.password === password
      );

      if (foundUser) {
        login({
          ...foundUser,
          role: foundUser.isFarmer ? 'FARMER' : foundUser.isAdmin ? 'ADMIN' : selectedRole,
        });
        setShowLoginModal(false);
        if (foundUser.isAdmin) {
          router.replace('/admin-dashboard');
        } else {
          router.replace('/(tabs)');
        }
      } else {
        setError(apiErr?.response?.data?.message || 'Invalid credentials. Check email/phone and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    loginAsGuest();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      {/* Background image */}
      <Image
        source={require('@/assets/images/bg1.jpg')}
        style={styles.bgImage}
        resizeMode="cover"
      />
      {/* Premium Dark Overlay */}
      <View style={styles.overlay} />

      {/* Language Switcher Bar */}
      <View style={styles.topLanguageBar}>
        <Pressable
          style={[styles.langChip, language === 'en' && styles.langChipActive]}
          onPress={() => setLanguage('en')}
        >
          <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>EN (Cameroon)</Text>
        </Pressable>
        <Pressable
          style={[styles.langChip, language === 'fr' && styles.langChipActive]}
          onPress={() => setLanguage('fr')}
        >
          <Text style={[styles.langText, language === 'fr' && styles.langTextActive]}>FR (Cameroun)</Text>
        </Pressable>
      </View>

      {/* Top center logo & branding */}
      <View style={styles.topCenter}>
        <View style={styles.logoRow}>
          <Image source={LOGO} style={styles.logo} />
        </View>
        <Text style={styles.logoText}>
          <Text style={{ color: '#10B981' }}>Agro</Text>
          <Text style={{ color: '#F59E0B' }}>Bazaar</Text>
        </Text>
        <Text style={styles.taglineMain}>{t.common.taglineMain}</Text>
        <Text style={styles.taglineSub}>{t.common.taglineSub}</Text>
      </View>

      {/* Actor Quick Switcher Cards */}
      <View style={styles.roleSelectionContainer}>
        <Text style={styles.roleHeaderTitle}>{t.auth.selectRole}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleScroll}>
          {ROLES.map((role) => {
            const isSelected = selectedRole === role.key;
            return (
              <Pressable
                key={role.key}
                style={[styles.roleCard, isSelected && styles.roleCardActive]}
                onPress={() => handleOpenLogin(role.key)}
              >
                <MaterialCommunityIcons
                  name={role.icon as any}
                  size={26}
                  color={isSelected ? '#10B981' : '#FFFFFF'}
                />
                <Text style={[styles.roleCardLabel, isSelected && styles.roleCardLabelActive]}>
                  {role.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Primary Action Buttons */}
      <View style={styles.bottomCenter}>
        <Pressable style={styles.loginButton} onPress={() => handleOpenLogin()}>
          <Text style={styles.loginButtonText}>{t.auth.loginButton}</Text>
        </Pressable>
        <Pressable onPress={handleGuest} style={styles.skipButton}>
          <Text style={styles.skipText}>{t.auth.skipToMarket}</Text>
        </Pressable>
      </View>

      {/* Register at bottom */}
      <View style={styles.bottomFooter}>
        <Text style={styles.footerText}>{t.auth.dontHaveAccount}</Text>
        <Pressable onPress={() => router.push('/auth/register')}>
          <Text style={styles.registerText}> {t.auth.registerButton}</Text>
        </Pressable>
      </View>

      {/* Multi-Role Login Modal */}
      <Modal
        visible={showLoginModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLoginModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {t.auth.loginTitle}
            </Text>
            <Text style={styles.modalSubtitle}>
              Logging in as: <Text style={{ fontWeight: '700', color: Colors.primary }}>{selectedRole}</Text>
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Email / Phone Input */}
            <View style={styles.inputWrapper}>
              <FontAwesome name="envelope" size={18} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="Email or Phone (+237...)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#888"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <FontAwesome name="lock" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                placeholder={t.auth.password}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#888"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <FontAwesome name={showPassword ? 'eye' : 'eye-slash'} size={18} color="#666" />
              </Pressable>
            </View>

            {/* Submit Button */}
            <Pressable
              style={[styles.modalLoginButton, loading && { opacity: 0.7 }]}
              onPress={handleLoginSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>{t.auth.loginButton}</Text>
              )}
            </Pressable>

            {/* Quick autofill demo pills for testing */}
            <View style={styles.quickDemoRow}>
              <Pressable
                style={styles.demoPill}
                onPress={() => {
                  setEmail('victoy@agrobazaar.com');
                  setPassword('password123');
                  setSelectedRole('FARMER');
                }}
              >
                <Text style={styles.demoPillText}>🌾 Farmer Demo</Text>
              </Pressable>
              <Pressable
                style={styles.demoPill}
                onPress={() => {
                  setEmail('ngozi@agrobazaar.com');
                  setPassword('password123');
                  setSelectedRole('WHOLESALER');
                }}
              >
                <Text style={styles.demoPillText}>🏬 Buyam-Sellam</Text>
              </Pressable>
            </View>

            <Pressable onPress={() => setShowLoginModal(false)} style={{ marginTop: 12 }}>
              <Text style={styles.cancelText}>{t.common.cancel}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  bgImage: {
    position: 'absolute',
    width,
    height,
    top: 0,
    left: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  topLanguageBar: {
    position: 'absolute',
    top: 48,
    right: 20,
    flexDirection: 'row',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 4,
  },
  langChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  langChipActive: {
    backgroundColor: '#10B981',
  },
  langText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  langTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  topCenter: {
    position: 'absolute',
    top: 96,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
    paddingHorizontal: 24,
  },
  logoRow: {
    marginBottom: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  logo: {
    width: 86,
    height: 86,
    borderRadius: 22,
  },
  logoText: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  taglineMain: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },
  taglineSub: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  roleSelectionContainer: {
    position: 'absolute',
    bottom: height * 0.28,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  roleHeaderTitle: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 24,
    marginBottom: 10,
  },
  roleScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  roleCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  roleCardActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  roleCardLabel: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  roleCardLabelActive: {
    color: '#10B981',
    fontWeight: '700',
  },
  bottomCenter: {
    position: 'absolute',
    bottom: height * 0.12,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
    paddingHorizontal: 24,
  },
  loginButton: {
    backgroundColor: '#0D5C3A',
    borderRadius: 16,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  skipButton: {
    paddingVertical: 6,
  },
  skipText: {
    color: '#E2E8F0',
    fontSize: 14,
    opacity: 0.9,
    textDecorationLine: 'underline',
  },
  bottomFooter: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  registerText: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  modalHandle: {
    width: 48,
    height: 5,
    backgroundColor: '#CBD5E1',
    borderRadius: 3,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputWithIcon: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0F172A',
  },
  eyeIcon: {
    padding: 6,
  },
  modalLoginButton: {
    backgroundColor: '#0D5C3A',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
    width: '100%',
  },
  quickDemoRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 6,
  },
  demoPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  demoPillText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  cancelText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
  },
});