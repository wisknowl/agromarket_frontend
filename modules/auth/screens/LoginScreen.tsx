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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Mail, Phone, Sparkles, User as UserIcon, Shield } from 'lucide-react-native';
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
      console.log(`[AUTH] Sending login request for ${identifier.trim()} to backend...`);
      const response = await loginApi(identifier.trim(), password);
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
              size={64}
              showWordmark
              wordmarkColor={Colors.canopy}
              showTagline
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
              <Mail size={18} color={Colors.soil} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="user@agromarket.com or +237..."
                placeholderTextColor={Colors.text.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={identifier}
                onChangeText={setIdentifier}
              />
            </View>

            {/* Password Field */}
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color={Colors.soil} style={styles.inputIcon} />
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
            <View style={{ marginTop: 14 }}>
              <BrandButton
                title={loading ? 'Verifying with Database...' : 'Sign In'}
                onPress={handleLogin}
                variant="primary"
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
                <TouchableOpacity
                  style={styles.demoChip}
                  onPress={() => handleFillDemo('user@agromarket.com', 'password123')}
                >
                  <UserIcon size={13} color={Colors.cultivated} />
                  <Text style={styles.demoChipText}>Farmer: user@agromarket.com</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.demoChip}
                  onPress={() => handleFillDemo('admin@agromarket.com', 'admin123')}
                >
                  <Shield size={13} color={Colors.canopy} />
                  <Text style={styles.demoChipText}>Admin: admin@agromarket.com</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>New to AgroMarket? </Text>
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
    paddingVertical: 24,
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
    borderColor: Colors.parchmentDim,
    padding: 20,
    ...Shadows.subtle,
  },
  formTitle: {
    fontFamily: Fonts.displayItalic,
    fontSize: 22,
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
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
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
    marginTop: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.parchment,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    borderRadius: Radii.input,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  inputIcon: {
    marginRight: 8,
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
    borderTopColor: Colors.parchmentDim,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  demoHeaderText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
  },
  demoChipsRow: {
    gap: 6,
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef8f1',
    borderWidth: 1,
    borderColor: 'rgba(78, 139, 63, 0.3)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radii.chip,
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
    marginTop: 20,
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
