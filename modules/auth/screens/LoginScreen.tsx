import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Mail, Sparkles, User as UserIcon, Shield } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { loginApi } from '@/components/api/auth';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import MeetingLeafLogo from '@/components/MeetingLeafLogo';
import BrandButton from '@/components/ui/BrandButton';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginAsGuest } = useAuthStore();

  const [identifier, setIdentifier] = useState('user@agromarket.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter your email/phone and password.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      const normalizedIdentifier = identifier.includes('@')
        ? identifier.trim().toLowerCase()
        : identifier.trim();
      console.log(`[AUTH] Sending login request for ${normalizedIdentifier} to backend...`);
      const response = await loginApi(normalizedIdentifier, password);
      console.log('✅ [AUTH] Login successful! Backend response:', response.user.email);

      // Save live PostgreSQL user and JWT token in AuthStore
      login(response.user, response.token);

      if (response.user.role === 'ADMIN' || response.user.isAdmin) {
        router.replace('/admin-dashboard');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      console.error('❌ [AUTH] Login error:', err?.response?.data || err.message);
      setErrorMessage(
        err?.response?.data?.message ||
        'Invalid credentials. Please verify your email/phone and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setIdentifier(demoEmail);
    setPassword(demoPass);
    setErrorMessage('');
  };

  const handleGuest = () => {
    loginAsGuest();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Header */}
          <View style={styles.brandHeader}>
            <MeetingLeafLogo
              size={60}
              showWordmark
              wordmarkColor={Colors.canopy}
              variant="fullColor"
            />
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>
              Sign in to manage your farms, orders, and direct harvests
            </Text>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Email / Phone Field */}
            <Text style={styles.inputLabel}>Email or Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color={Colors.cultivated} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="user@agromarket.com or +237..."
                placeholderTextColor={Colors.text.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={identifier}
                onChangeText={setIdentifier}
              />
            </View>

            {/* Password Field */}
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color={Colors.cultivated} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { paddingRight: 40 }]}
                placeholder="••••••••"
                placeholderTextColor={Colors.text.muted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={18} color={Colors.text.secondary} />
                ) : (
                  <Eye size={18} color={Colors.text.secondary} />
                )}
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <View style={{ marginTop: 16 }}>
              <BrandButton
                title={loading ? 'Verifying with Database...' : 'Sign In'}
                onPress={handleLogin}
                variant="cultivated"
                size="lg"
                disabled={loading}
              />
            </View>

            {/* Test Credentials Quick-Chips */}
            <View style={styles.demoSection}>
              <View style={styles.demoHeader}>
                <Sparkles size={14} color={Colors.gold} />
                <Text style={styles.demoHeaderText}>Quick Test Credentials (Database Synced)</Text>
              </View>
              <View style={styles.demoChipsRow}>
                {/* Farmer 1: Victoy Eyong */}
                <TouchableOpacity
                  style={styles.demoChip}
                  onPress={() => handleFillDemo('user@agromarket.com', 'password123')}
                  activeOpacity={0.8}
                >
                  <UserIcon size={13} color={Colors.cultivated} />
                  <Text style={styles.demoChipText}>Victoy Eyong: user@agromarket.com</Text>
                </TouchableOpacity>

                {/* Farmer 2: Mbah Paul Fru */}
                <TouchableOpacity
                  style={styles.demoChip}
                  onPress={() => handleFillDemo('mbah@agromarket.com', 'password123')}
                  activeOpacity={0.8}
                >
                  <UserIcon size={13} color={Colors.cultivated} />
                  <Text style={styles.demoChipText}>Mbah Paul Fru: mbah@agromarket.com</Text>
                </TouchableOpacity>

                {/* Buyer / User with No Farm: Sarah Manga */}
                <TouchableOpacity
                  style={styles.demoChip}
                  onPress={() => handleFillDemo('sarah@agromarket.com', 'password123')}
                  activeOpacity={0.8}
                >
                  <UserIcon size={13} color={Colors.cultivated} />
                  <Text style={styles.demoChipText}>Sarah Manga (No Farm): sarah@agromarket.com</Text>
                </TouchableOpacity>

                {/* Administrator */}
                <TouchableOpacity
                  style={[
                    styles.demoChip,
                    { backgroundColor: '#F3E8FF', borderColor: 'rgba(124, 58, 237, 0.3)' },
                  ]}
                  onPress={() => handleFillDemo('admin@agromarket.com', 'admin123')}
                  activeOpacity={0.8}
                >
                  <Shield size={13} color="#7C3AED" />
                  <Text style={[styles.demoChipText, { color: '#7C3AED' }]}>
                    Chief Eyong (Admin): admin@agromarket.com
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>New to Agrom? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={styles.footerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.guestButton} onPress={handleGuest}>
            <Text style={styles.guestButtonText}>Browse Marketplace as Guest →</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  formCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: '#CCEBD5',
    padding: 22,
    ...Shadows.subtle,
  },
  formTitle: {
    fontFamily: Fonts.displayItalic,
    fontSize: 23,
    color: Colors.canopy,
    marginBottom: 4,
  },
  formSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: Radii.sm,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12.5,
    color: Colors.clay,
  },
  inputLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.espresso,
    marginBottom: 6,
    marginTop: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF8F1',
    borderWidth: 1,
    borderColor: '#CCEBD5',
    borderRadius: Radii.input,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.espresso,
  },
  eyeBtn: {
    padding: 6,
  },
  demoSection: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#CCEBD5',
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  demoHeaderText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
  },
  demoChipsRow: {
    gap: 7,
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF8F1',
    borderWidth: 1,
    borderColor: '#CCEBD5',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    gap: 6,
  },
  demoChipText: {
    fontFamily: Fonts.mono,
    fontSize: 11.5,
    color: Colors.cultivated,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 8,
  },
  footerText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
  },
  footerLink: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.cultivated,
  },
  guestButton: {
    paddingVertical: 8,
  },
  guestButtonText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12.5,
    color: Colors.text.secondary,
  },
});
