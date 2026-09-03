import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/constants/translations';
import { loginApi } from '@/components/api/auth';
import { users } from '@/mocks/data';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import MeetingLeafLogo from '@/components/MeetingLeafLogo';
import BrandButton from '@/components/ui/BrandButton';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { UserRole } from '@/types';

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
      // 1. Real Backend API
      const result = await loginApi(email.trim(), password);
      login(result.user, result.token);
      setShowLoginModal(false);

      if (result.user.role === 'ADMIN') {
        router.replace('/admin-dashboard');
      } else {
        router.replace('/(tabs)');
      }
    } catch (apiErr: any) {
      // 2. Mock Fallback
      const foundUser = users.find(
        (u) =>
          (u.email.toLowerCase() === email.trim().toLowerCase() ||
            u.phone === email.trim()) &&
          u.password === password
      );

      if (foundUser) {
        login({
          ...foundUser,
          role: foundUser.isFarmer
            ? 'FARMER'
            : foundUser.isAdmin
            ? 'ADMIN'
            : selectedRole,
        });
        setShowLoginModal(false);
        if (foundUser.isAdmin) {
          router.replace('/admin-dashboard');
        } else {
          router.replace('/(tabs)');
        }
      } else {
        setError(
          apiErr?.response?.data?.message ||
            'Invalid credentials. Check email/phone and password.'
        );
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
      {/* 1. Full-bleed Background Image */}
      <Image
        source={require('@/assets/images/bg1.jpg')}
        style={styles.bgImage}
        resizeMode="cover"
      />
      {/* 2. Full-bleed Tint Overlay */}
      <View style={styles.overlay} />

      {/* 3. Safe Area Flex Layout (Zero element overlapping) */}
      <SafeAreaView style={styles.safeArea}>
        {/* Top Bar: Language Switcher */}
        <View style={styles.topBar}>
          <View style={styles.langSwitchWrapper}>
            <Pressable
              style={[styles.langChip, language === 'en' && styles.langChipActive]}
              onPress={() => setLanguage('en')}
            >
              <Text
                style={[
                  styles.langText,
                  language === 'en' && styles.langTextActive,
                ]}
              >
                EN
              </Text>
            </Pressable>
            <Pressable
              style={[styles.langChip, language === 'fr' && styles.langChipActive]}
              onPress={() => setLanguage('fr')}
            >
              <Text
                style={[
                  styles.langText,
                  language === 'fr' && styles.langTextActive,
                ]}
              >
                FR
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Center Section: Logo & Branding */}
        <View style={styles.centerSection}>
          <View style={styles.logoWrapper}>
            <MeetingLeafLogo
              size={64}
              showWordmark
              wordmarkColor={Colors.parchment}
              showTagline
              variant="fullColor"
            />
          </View>
          <Text style={styles.taglineMain}>{t.common.taglineMain}</Text>
          <Text style={styles.taglineSub}>{t.common.taglineSub}</Text>
        </View>

        {/* Bottom Section: Stacked Sequentially (No Overlap) */}
        <View style={styles.bottomSection}>
          {/* Role Picker */}
          <View style={styles.roleContainer}>
            <Text style={styles.roleHeaderTitle}>{t.auth.selectRole}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.roleScroll}
            >
              {ROLES.map((role) => {
                const isSelected = selectedRole === role.key;
                return (
                  <Pressable
                    key={role.key}
                    style={[
                      styles.roleCard,
                      isSelected && styles.roleCardActive,
                    ]}
                    onPress={() => handleOpenLogin(role.key)}
                  >
                    <View
                      style={[
                        styles.roleIconCircle,
                        isSelected && styles.roleIconCircleActive,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={role.icon as any}
                        size={20}
                        color={isSelected ? Colors.espresso : Colors.parchment}
                      />
                    </View>
                    <Text
                      style={[
                        styles.roleCardLabel,
                        isSelected && styles.roleCardLabelActive,
                      ]}
                    >
                      {role.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <BrandButton
              title={t.auth.loginButton}
              variant="primary"
              size="lg"
              onPress={() => handleOpenLogin()}
              style={styles.fullWidthButton}
            />
            <BrandButton
              title={t.auth.skipToMarket}
              variant="text"
              size="md"
              onPress={handleGuest}
              textStyle={{
                color: Colors.parchment,
                textDecorationLine: 'none',
                fontSize: 14,
              }}
            />
          </View>

          {/* Register Footer */}
          <View style={styles.bottomFooter}>
            <Text style={styles.footerText}>{t.auth.dontHaveAccount}</Text>
            <Pressable onPress={() => router.push('/auth/register')}>
              <Text style={styles.registerText}> {t.auth.registerButton}</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      {/* Multi-Role Login Modal with Pure White Card */}
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
            <Text style={styles.modalTitle}>{t.auth.loginTitle}</Text>
            <Text style={styles.modalSubtitle}>
              Role: <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.canopy }}>{selectedRole}</Text>
            </Text>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>✕ {error}</Text>
              </View>
            ) : null}

            {/* Email / Phone Input */}
            <View style={styles.inputWrapper}>
              <FontAwesome
                name="envelope"
                size={16}
                color={Colors.text.muted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="Email or Phone (+237...)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={Colors.text.muted}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <FontAwesome
                name="lock"
                size={18}
                color={Colors.text.muted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.inputWithIcon}
                placeholder={t.auth.password}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor={Colors.text.muted}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <FontAwesome
                  name={showPassword ? 'eye' : 'eye-slash'}
                  size={16}
                  color={Colors.text.muted}
                />
              </Pressable>
            </View>

            {/* Submit Button */}
            <BrandButton
              title={t.auth.loginButton}
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleLoginSubmit}
              style={{ marginTop: 8 }}
            />

            {/* Quick autofill demo pills for testing */}
            <View style={styles.quickDemoRow}>
              <Pressable
                style={styles.demoPill}
                onPress={() => {
                  setEmail('victoy@agromarket.com');
                  setPassword('password123');
                  setSelectedRole('FARMER');
                }}
              >
                <Text style={styles.demoPillText}>🌾 Farmer Demo</Text>
              </Pressable>
              <Pressable
                style={styles.demoPill}
                onPress={() => {
                  setEmail('ngozi@agromarket.com');
                  setPassword('password123');
                  setSelectedRole('WHOLESALER');
                }}
              >
                <Text style={styles.demoPillText}>🏬 Buyam-Sellam</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => setShowLoginModal(false)}
              style={{ marginTop: 14, alignSelf: 'center' }}
            >
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
    backgroundColor: Colors.canopyDeep,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 37, 21, 0.82)',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  langSwitchWrapper: {
    flexDirection: 'row',
    backgroundColor: 'rgba(23, 58, 32, 0.85)',
    borderRadius: Radii.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(246, 238, 221, 0.2)',
  },
  langChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  langChipActive: {
    backgroundColor: Colors.gold,
  },
  langText: {
    color: Colors.parchment,
    fontSize: 12,
    fontFamily: Fonts.bodyMedium,
  },
  langTextActive: {
    color: Colors.espresso,
    fontFamily: Fonts.bodyBold,
  },
  centerSection: {
    alignItems: 'center',
    paddingHorizontal: 12,
    marginVertical: 'auto',
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 10,
  },
  taglineMain: {
    fontFamily: Fonts.displayItalic,
    fontSize: 18,
    color: Colors.gold,
    textAlign: 'center',
    marginBottom: 4,
  },
  taglineSub: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.parchment,
    opacity: 0.85,
    textAlign: 'center',
    maxWidth: 280,
  },
  bottomSection: {
    width: '100%',
    gap: 14,
  },
  roleContainer: {
    width: '100%',
  },
  roleHeaderTitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.parchment,
    opacity: 0.9,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  roleScroll: {
    gap: 10,
    paddingRight: 10,
  },
  roleCard: {
    backgroundColor: 'rgba(23, 58, 32, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(246, 238, 221, 0.2)',
    borderRadius: Radii.card,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    minWidth: 105,
    gap: 6,
  },
  roleCardActive: {
    backgroundColor: Colors.canopy,
    borderColor: Colors.gold,
  },
  roleIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(246, 238, 221, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconCircleActive: {
    backgroundColor: Colors.gold,
  },
  roleCardLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.parchment,
  },
  roleCardLabelActive: {
    fontFamily: Fonts.bodyBold,
    color: Colors.gold,
  },
  actionsContainer: {
    width: '100%',
    gap: 6,
  },
  fullWidthButton: {
    width: '100%',
  },
  bottomFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  footerText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.parchment,
    opacity: 0.85,
  },
  registerText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.gold,
  },

  // Modal Styling
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(14, 37, 21, 0.65)',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.parchmentDim,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: Fonts.displayItalic,
    fontSize: 22,
    color: Colors.canopy,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: 'rgba(181, 74, 52, 0.1)',
    borderWidth: 1,
    borderColor: Colors.clay,
    borderRadius: Radii.input,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.clay,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.parchmentDim,
    borderRadius: Radii.input,
    paddingHorizontal: 14,
    marginBottom: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputWithIcon: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.espresso,
    height: '100%',
  },
  eyeIcon: {
    padding: 6,
  },
  quickDemoRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    justifyContent: 'center',
  },
  demoPill: {
    backgroundColor: Colors.parchment,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    borderRadius: Radii.pill,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  demoPillText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.espresso,
  },
  cancelText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.text.secondary,
  },
});