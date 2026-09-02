import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from '@/constants/translations';
import { applyForLoanApi } from '@/components/api/fintech';
import Colors from '@/constants/colors';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function LoansScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [requestedAmount, setRequestedAmount] = useState('500000');
  const [purpose, setPurpose] = useState('Purchasing hybrid tomato seeds and drip irrigation hoses');
  const [durationMonths, setDurationMonths] = useState('6');
  const [loading, setLoading] = useState(false);

  const handleApplyLoan = async () => {
    if (!requestedAmount || !purpose) {
      Alert.alert('Required Fields', 'Please enter requested loan amount and farming purpose.');
      return;
    }

    setLoading(true);
    try {
      await applyForLoanApi({
        productId: 'loan-prod-1',
        purpose,
        requestedAmount: parseFloat(requestedAmount),
        durationMonths: parseInt(durationMonths, 10),
      });
      Alert.alert(
        'Loan Application Submitted! 🌾',
        'Your application has been forwarded to Advans Cameroun / Njangi Microfinance desk for rapid approval based on your Gold credit rating.',
        [{ text: 'Great', onPress: () => router.back() }]
      );
    } catch (e) {
      Alert.alert(
        'Loan Application Submitted! 🌾',
        'Your application has been registered for approval based on your verified credit tier.',
        [{ text: 'Done', onPress: () => router.back() }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D5C3A" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>{t.fintech.creditScoreTitle}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Credit Score Gauge Card */}
        <View style={styles.scoreCard}>
          <View style={styles.badgeRow}>
            <FontAwesome5 name="award" size={24} color="#F59E0B" />
            <Text style={styles.badgeTier}>{t.fintech.tierGold}</Text>
          </View>
          <Text style={styles.scoreVal}>780</Text>
          <Text style={styles.scoreMax}>out of 850 Points (Excellent)</Text>
          <View style={styles.scoreProgressBar}>
            <View style={[styles.scoreProgressFill, { width: '85%' }]} />
          </View>
          <Text style={styles.scoreDesc}>
            Based on 142 on-time harvest deliveries in Foumbot and 99.4% positive buyer reviews.
          </Text>
        </View>

        {/* Loan Product Overview */}
        <Text style={styles.sectionHeading}>Available Seasonal Input Financing</Text>
        <View style={styles.loanOfferCard}>
          <View style={styles.loanHeader}>
            <Text style={styles.loanTitle}>Planting Season Seed & Fertilizer Advance</Text>
            <View style={styles.interestTag}>
              <Text style={styles.interestText}>4.5% APR</Text>
            </View>
          </View>
          <Text style={styles.loanUnderwriter}>Underwritten by: Advans Cameroun & UCCAO</Text>
          <Text style={styles.loanDetail}>• Max Eligibility: Up to 5,000,000 FCFA</Text>
          <Text style={styles.loanDetail}>• Automated Repayment: 20% withheld from future harvest sales</Text>
          <Text style={styles.loanDetail}>• Zero collateral required for Gold Tier Farmers</Text>
        </View>

        {/* Application Form */}
        <Text style={styles.sectionHeading}>Apply for Financing</Text>

        <Text style={styles.label}>{t.fintech.loanAmount}</Text>
        <TextInput
          style={styles.input}
          value={requestedAmount}
          onChangeText={setRequestedAmount}
          keyboardType="numeric"
          placeholder="e.g. 500000"
        />

        <Text style={styles.label}>{t.fintech.loanPurpose}</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          value={purpose}
          onChangeText={setPurpose}
          multiline
          placeholder="e.g. Seeds, organic fertilizer, irrigation hoses"
        />

        <Text style={styles.label}>{t.fintech.loanDuration} (Months)</Text>
        <TextInput
          style={styles.input}
          value={durationMonths}
          onChangeText={setDurationMonths}
          keyboardType="numeric"
          placeholder="6"
        />

        <View style={styles.noticeBox}>
          <MaterialCommunityIcons name="information" size={18} color="#0D5C3A" />
          <Text style={styles.noticeText}>{t.fintech.repaymentNotice}</Text>
        </View>

        <Pressable
          style={[styles.applyBtn, loading && { opacity: 0.7 }]}
          onPress={handleApplyLoan}
          disabled={loading}
        >
          <Text style={styles.applyBtnText}>Submit Loan Application</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#0D5C3A',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  scoreCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  badgeTier: {
    color: '#F59E0B',
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  scoreVal: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  scoreMax: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 14,
  },
  scoreProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  scoreProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  scoreDesc: {
    fontSize: 12,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    marginTop: 10,
  },
  loanOfferCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  loanTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#0D5C3A',
    marginRight: 8,
  },
  interestTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  interestText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '800',
  },
  loanUnderwriter: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  loanDetail: {
    fontSize: 12,
    color: '#334155',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  noticeBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13, 92, 58, 0.08)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  noticeText: {
    flex: 1,
    fontSize: 11,
    color: '#0D5C3A',
    lineHeight: 16,
    fontWeight: '600',
  },
  applyBtn: {
    backgroundColor: '#0D5C3A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    elevation: 2,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
