import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/constants/translations';
import { registerApi } from '@/components/api/auth';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import BrandButton from '@/components/ui/BrandButton';
import MeetingLeafLogo from '@/components/MeetingLeafLogo';
import { UserRole } from '@/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ROLES: Array<{ key: UserRole; label: string; icon: string }> = [
  { key: 'BUYER', label: 'Consumer', icon: 'shopping' },
  { key: 'WHOLESALER', label: 'Buyam-Sellam', icon: 'storefront' },
  { key: 'FARMER', label: 'Farmer / Co-op', icon: 'sprout' },
  { key: 'AGRO_TRANSPORTER', label: 'Transporter', icon: 'truck-fast' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { t } = useTranslation();

  const [role, setRole] = useState<UserRole>('BUYER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Role-specific fields
  const [farmName, setFarmName] = useState('');
  const [city, setCity] = useState('');
  const [businessName, setBusinessName] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await registerApi({
        name,
        email,
        phone,
        password,
        role,
        farmName: role === 'FARMER' ? farmName || `${name}'s Farm` : undefined,
        city: role === 'FARMER' ? city || 'Foumbot' : undefined,
        businessName: role === 'WHOLESALER' ? businessName || `${name} Enterprises` : undefined,
      });

      login(res.user, res.token);
      Alert.alert('Account Created! 🎉', 'Welcome to agromarket Cameroon');

      if (role === 'FARMER') {
        router.replace('/farmer/manage');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      // Offline fallback
      login({
        id: `u-${Date.now()}`,
        name,
        email,
        phone,
        role,
        isFarmer: role === 'FARMER',
        farmerProfile:
          role === 'FARMER'
            ? {
                id: `f-${Date.now()}`,
                userId: `u-${Date.now()}`,
                farmName: farmName || `${name}'s Farm`,
                region: 'West Region',
                city: city || 'Foumbot',
                rating: 5.0,
                totalRatings: 1,
                totalFollowers: 0,
                creditTier: 'BRONZE',
                creditScore: 650,
              }
            : undefined,
      });

      if (role === 'FARMER') {
        router.replace('/farmer/manage');
      } else {
        router.replace('/(tabs)');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Bar */}
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color={Colors.espresso} />
          </Pressable>
          <MeetingLeafLogo size={32} showWordmark wordmarkColor={Colors.canopy} />
        </View>

        <Text style={styles.title}>Join agromarket</Text>
        <Text style={styles.subtitle}>
          Create an account to buy direct or sell harvests across Cameroon
        </Text>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>✕ {error}</Text>
          </View>
        ) : null}

        {/* Role Selector */}
        <Text style={styles.sectionLabel}>Select Account Type</Text>
        <View style={styles.roleGrid}>
          {ROLES.map((r) => {
            const isSelected = role === r.key;
            return (
              <Pressable
                key={r.key}
                style={[
                  styles.rolePill,
                  isSelected && styles.rolePillActive,
                ]}
                onPress={() => setRole(r.key)}
              >
                <MaterialCommunityIcons
                  name={r.icon as any}
                  size={18}
                  color={isSelected ? Colors.parchment : Colors.espresso}
                />
                <Text
                  style={[
                    styles.rolePillText,
                    isSelected && styles.rolePillTextActive,
                  ]}
                >
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Inputs */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Full Name / Organization</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Victorine Tamba"
            value={name}
            onChangeText={setName}
            placeholderTextColor={Colors.text.muted}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="victorine@example.cm"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={Colors.text.muted}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Mobile Phone (Orange / MTN MoMo)</Text>
          <TextInput
            style={styles.input}
            placeholder="+237 6XXXXXXXX"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor={Colors.text.muted}
          />
        </View>

        {/* Farmer Specific Fields */}
        {role === 'FARMER' && (
          <>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Farm / Cooperative Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Foumbot Organic Growers"
                value={farmName}
                onChangeText={setFarmName}
                placeholderTextColor={Colors.text.muted}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Production Region / City</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Foumbot, West Region"
                value={city}
                onChangeText={setCity}
                placeholderTextColor={Colors.text.muted}
              />
            </View>
          </>
        )}

        {/* Wholesaler Specific Fields */}
        {role === 'WHOLESALER' && (
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Trading / Market Enterprise Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Marché Sandaga Wholesale"
              value={businessName}
              onChangeText={setBusinessName}
              placeholderTextColor={Colors.text.muted}
            />
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Min 6 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor={Colors.text.muted}
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
            >
              {showPassword ? (
                <EyeOff size={18} color={Colors.text.muted} />
              ) : (
                <Eye size={18} color={Colors.text.muted} />
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor={Colors.text.muted}
          />
        </View>

        <BrandButton
          title="Create Account"
          variant="primary"
          size="lg"
          loading={loading}
          onPress={handleRegister}
          style={{ marginTop: 12, marginBottom: 16 }}
        />

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.loginLinkText}> Sign In</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 24,
    paddingTop: 48,
    backgroundColor: Colors.white,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.parchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Fonts.displayItalic,
    fontSize: 26,
    color: Colors.canopy,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  errorBanner: {
    backgroundColor: 'rgba(181, 74, 52, 0.1)',
    borderWidth: 1,
    borderColor: Colors.clay,
    borderRadius: Radii.input,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.clay,
  },
  sectionLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.espresso,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
    backgroundColor: Colors.parchment,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    gap: 6,
  },
  rolePillActive: {
    backgroundColor: Colors.canopy,
    borderColor: Colors.canopy,
  },
  rolePillText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.espresso,
  },
  rolePillTextActive: {
    fontFamily: Fonts.bodyBold,
    color: Colors.parchment,
  },
  formGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.espresso,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.parchmentDim,
    borderRadius: Radii.input,
    paddingHorizontal: 14,
    height: 48,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.espresso,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.parchmentDim,
    borderRadius: Radii.input,
    paddingHorizontal: 14,
    height: 48,
  },
  passwordInput: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.espresso,
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  footerText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  loginLinkText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.soil,
  },
});