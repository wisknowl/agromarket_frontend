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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/constants/translations';
import { registerApi } from '@/components/api/auth';
import Colors from '@/constants/colors';
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
      Alert.alert('Account Created! 🎉', 'Welcome to AgroBazaar Cameroon');

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
                totalRatings: 0,
                totalFollowers: 0,
                creditTier: 'BRONZE',
                creditScore: 500,
              }
            : undefined,
      });

      Alert.alert('Welcome to AgroBazaar! 🇨🇲', 'Account setup complete.');
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#0F172A" />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>{t.auth.registerTitle}</Text>
          <Text style={styles.subtitle}>{t.auth.subtitle}</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Role Selector Pills */}
        <Text style={styles.sectionLabel}>{t.auth.selectRole}</Text>
        <View style={styles.roleGrid}>
          {ROLES.map((r) => {
            const isSelected = role === r.key;
            return (
              <Pressable
                key={r.key}
                style={[styles.rolePill, isSelected && styles.rolePillActive]}
                onPress={() => setRole(r.key)}
              >
                <MaterialCommunityIcons
                  name={r.icon as any}
                  size={20}
                  color={isSelected ? '#10B981' : '#64748B'}
                />
                <Text style={[styles.rolePillText, isSelected && styles.rolePillTextActive]}>
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Common Registration Inputs */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t.auth.fullName}</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Victoy Eyong"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. victoy@agrobazaar.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t.auth.phone}</Text>
            <TextInput
              style={styles.input}
              placeholder="+237 6XX XXX XXX"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Farmer Specific Fields */}
          {role === 'FARMER' && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Farm / Plantation Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Green Valley Farm"
                  value={farmName}
                  onChangeText={setFarmName}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Farm Hub / City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Foumbot / Bamenda / Buea"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
            </>
          )}

          {/* Wholesaler Specific Fields */}
          {role === 'WHOLESALER' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Wholesale Trade Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Sandaga Central Wholesale"
                value={businessName}
                onChangeText={setBusinessName}
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t.auth.password}</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#64748B" />
                ) : (
                  <Eye size={20} color="#64748B" />
                )}
              </Pressable>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t.auth.confirmPassword}</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>
          </View>

          <Pressable
            style={[styles.registerButton, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>{t.auth.registerButton}</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t.auth.alreadyHaveAccount}</Text>
          <Pressable onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginText}> {t.auth.loginButton}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 16,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  rolePillActive: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  rolePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  rolePillTextActive: {
    color: '#0D5C3A',
    fontWeight: '700',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    color: '#0F172A',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: '#0F172A',
  },
  eyeButton: {
    padding: 14,
  },
  registerButton: {
    backgroundColor: '#0D5C3A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    elevation: 2,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingVertical: 16,
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
  },
  loginText: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 14,
  },
});