import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Wallet,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Crown,
  Smartphone,
  CreditCard,
  Building2,
  Sparkles,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  X,
} from 'lucide-react-native';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { useAuthStore } from '@/store/authStore';
import { fetchMyPatronagesApi, fetchMyAgroVestmentsApi, AgroPatronSubscription, AgroVestorInvestment } from '@/components/api/fintech';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WalletTransaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'ESCROW_LOCK' | 'ESCROW_RELEASE' | 'AGROPATRON' | 'AGROVESTMENT';
  title: string;
  subtitle: string;
  amount: number;
  currency: string;
  status: 'COMPLETED' | 'PENDING' | 'ESCROW_HELD';
  timestamp: string;
  isPositive: boolean;
}

export default function AgroWalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Balances
  const [availableBalance, setAvailableBalance] = useState(350000);
  const [escrowLockedBalance, setEscrowLockedBalance] = useState(125000);
  const [currencyMode, setCurrencyMode] = useState<'XAF' | 'USD'>('XAF');

  // Patronages & Investments
  const [patronages, setPatronages] = useState<AgroPatronSubscription[]>([]);
  const [investments, setMyInvestments] = useState<AgroVestorInvestment[]>([]);

  // Deposit Modal State
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [depositAmount, setDepositAmount] = useState('25000');
  const [depositChannel, setDepositChannel] = useState<'MOBILE_MONEY' | 'CARD' | 'BANK_TRANSFER'>('MOBILE_MONEY');
  const [depositProvider, setDepositProvider] = useState<'M_PESA' | 'AIRTEL' | 'MTN' | 'ORANGE' | 'WAVE'>('MTN');
  const [depositAccountRef, setDepositAccountRef] = useState(user?.phone || '+237 6xx xxx xxx');
  const [depositing, setDepositing] = useState(false);

  // Transactions ledger
  const [transactions, setTransactions] = useState<WalletTransaction[]>([
    {
      id: 'tx-1',
      type: 'ESCROW_RELEASE',
      title: 'Harvest Payout Released',
      subtitle: 'Order #ESC-8924 • Engine 3 delivery validated',
      amount: 85000,
      currency: 'FCFA',
      status: 'COMPLETED',
      timestamp: 'Today, 14:20',
      isPositive: true,
    },
    {
      id: 'tx-2',
      type: 'AGROPATRON',
      title: 'AgroPatron Monthly Pass',
      subtitle: 'Foumbot Organic Farm • 8% discount active',
      amount: 1200,
      currency: 'FCFA',
      status: 'COMPLETED',
      timestamp: 'Yesterday, 09:15',
      isPositive: false,
    },
    {
      id: 'tx-3',
      type: 'ESCROW_LOCK',
      title: 'Engine 3 Smart Escrow Lock',
      subtitle: 'Purchase #ORD-7712 • Fresh Tomatoes & Plantains',
      amount: 40000,
      currency: 'FCFA',
      status: 'ESCROW_HELD',
      timestamp: '10 Sep 2026',
      isPositive: false,
    },
    {
      id: 'tx-4',
      type: 'AGROVESTMENT',
      title: 'AgroVestor Seasonal Pledge',
      subtitle: 'Bamenda Corn Seed Cycle • +22% Expected ROI',
      amount: 50000,
      currency: 'FCFA',
      status: 'ESCROW_HELD',
      timestamp: '08 Sep 2026',
      isPositive: false,
    },
    {
      id: 'tx-5',
      type: 'DEPOSIT',
      title: 'Wallet Top-Up via MTN MoMo',
      subtitle: 'Ref: MOMO-993812 • Pan-African Gateway',
      amount: 150000,
      currency: 'FCFA',
      status: 'COMPLETED',
      timestamp: '05 Sep 2026',
      isPositive: true,
    },
  ]);

  const loadWalletData = useCallback(async () => {
    try {
      setLoading(true);
      const [patronRes, invRes] = await Promise.all([
        fetchMyPatronagesApi().catch(() => []),
        fetchMyAgroVestmentsApi().catch(() => []),
      ]);
      setPatronages(Array.isArray(patronRes) ? patronRes : []);
      setMyInvestments(Array.isArray(invRes) ? invRes : []);
    } catch (err) {
      console.warn('Failed to load wallet telemetry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadWalletData();
  };

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid deposit amount.');
      return;
    }
    try {
      setDepositing(true);
      // Simulate API deposit lock into wallet
      await new Promise((resolve) => setTimeout(resolve, 800));

      const newTx: WalletTransaction = {
        id: `tx-${Date.now()}`,
        type: 'DEPOSIT',
        title: `Wallet Top-Up via ${depositChannel === 'MOBILE_MONEY' ? depositProvider : depositChannel}`,
        subtitle: `Ref: ${depositAccountRef}`,
        amount: amt,
        currency: 'FCFA',
        status: 'COMPLETED',
        timestamp: 'Just now',
        isPositive: true,
      };

      setAvailableBalance((prev) => prev + amt);
      setTransactions((prev) => [newTx, ...prev]);
      setDepositModalVisible(false);

      Alert.alert(
        'Deposit Confirmed! 🎉',
        `${amt.toLocaleString()} FCFA has been credited to your AgroWallet balance via ${
          depositChannel === 'MOBILE_MONEY' ? depositProvider.replace('_', ' ') : depositChannel
        }.`
      );
    } catch (err: any) {
      Alert.alert('Deposit Error', err.message || 'Could not complete wallet deposit.');
    } finally {
      setDepositing(false);
    }
  };

  const formatAmount = (fcfaAmount: number) => {
    if (currencyMode === 'USD') {
      const usd = (fcfaAmount / 600).toFixed(2);
      return `$${usd} USD`;
    }
    return `${fcfaAmount.toLocaleString()} FCFA`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. TOP NAVIGATION HEADER */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.navIconBtn}
          activeOpacity={0.75}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color={Colors.espresso} strokeWidth={2.2} />
        </TouchableOpacity>

        <View style={styles.topTitleBox}>
          <Text style={styles.topTitle}>AgroWallet</Text>
          <Text style={styles.topSub}>Smart Escrow & Digital Balance</Text>
        </View>

        <TouchableOpacity onPress={onRefresh} style={styles.navIconBtn} activeOpacity={0.75}>
          {refreshing ? (
            <ActivityIndicator size="small" color={Colors.cultivated} />
          ) : (
            <RefreshCw size={19} color={Colors.espresso} strokeWidth={2.2} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 40 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.cultivated]} />
        }
      >
        {/* 2. PREMIUM DIGITAL BALANCE CARD */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceCardHeader}>
            <View style={styles.escrowBadge}>
              <ShieldCheck size={14} color={Colors.cultivated} strokeWidth={2.5} />
              <Text style={styles.escrowBadgeText}>Engine 3 Smart Escrow Protected</Text>
            </View>

            {/* Currency Toggle */}
            <TouchableOpacity
              style={styles.currToggle}
              onPress={() => setCurrencyMode((c) => (c === 'XAF' ? 'USD' : 'XAF'))}
              activeOpacity={0.8}
            >
              <Text style={styles.currToggleText}>{currencyMode === 'XAF' ? '⇄ USD' : '⇄ FCFA'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.balanceLabel}>Available Liquid Balance</Text>
          <Text style={styles.balanceMain}>{formatAmount(availableBalance)}</Text>

          {/* Sub-vault breakdown */}
          <View style={styles.vaultRow}>
            <View style={styles.vaultCol}>
              <Text style={styles.vaultLabel}>Locked in Escrow</Text>
              <Text style={styles.vaultVal}>{formatAmount(escrowLockedBalance)}</Text>
            </View>
            <View style={styles.vaultDivider} />
            <View style={styles.vaultCol}>
              <Text style={styles.vaultLabel}>Projected Harvest ROI</Text>
              <Text style={[styles.vaultVal, { color: '#86efac' }]}>+{formatAmount(48000)}</Text>
            </View>
          </View>
        </View>

        {/* 3. QUICK ACTION BUTTONS */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setDepositModalVisible(true)}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#EEF8F1' }]}>
              <Plus size={20} color={Colors.cultivated} strokeWidth={2.4} />
            </View>
            <Text style={styles.actionLabel}>Top Up</Text>
            <Text style={styles.actionSub}>MoMo & Cards</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() =>
              Alert.alert(
                'Withdrawal Request',
                `Available ${availableBalance.toLocaleString()} FCFA can be instantly paid out to your verified Mobile Money or Bank account.`
              )
            }
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#FEF7EE' }]}>
              <ArrowUpRight size={20} color={Colors.gold} strokeWidth={2.4} />
            </View>
            <Text style={styles.actionLabel}>Withdraw</Text>
            <Text style={styles.actionSub}>To Phone/Bank</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/fintech/loans')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#F0F9FF' }]}>
              <TrendingUp size={20} color="#0284C7" strokeWidth={2.4} />
            </View>
            <Text style={styles.actionLabel}>AgroVest</Text>
            <Text style={styles.actionSub}>15-28% ROI</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/orders')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#FAF5FF' }]}>
              <ShieldCheck size={20} color="#7C3AED" strokeWidth={2.4} />
            </View>
            <Text style={styles.actionLabel}>Escrow Orders</Text>
            <Text style={styles.actionSub}>Inspect & Pay</Text>
          </TouchableOpacity>
        </View>

        {/* 4. AGROPATRON ACTIVE PASSES */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderTitleRow}>
            <Crown size={18} color={Colors.gold} strokeWidth={2.4} />
            <Text style={styles.sectionTitle}>My AgroPatron Passes</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/feed' as any)}>
            <Text style={styles.sectionActionText}>Explore Farms</Text>
          </TouchableOpacity>
        </View>

        {patronages.length === 0 ? (
          <View style={styles.emptyPatronCard}>
            <Crown size={32} color={Colors.text.muted} strokeWidth={2} />
            <Text style={styles.emptyPatronTitle}>No Active AgroPatron Passes</Text>
            <Text style={styles.emptyPatronSub}>
              Patronize verified farm pages for $2 (~1,200 FCFA) to unlock guaranteed 8% harvest discounts and 48h priority harvest access.
            </Text>
            <TouchableOpacity
              style={styles.explorePatronBtn}
              onPress={() => router.push('/feed' as any)}
              activeOpacity={0.85}
            >
              <Sparkles size={15} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.explorePatronBtnText}>Become an AgroPatron ($2)</Text>
            </TouchableOpacity>
          </View>
        ) : (
          patronages.map((sub) => (
            <View key={sub.id} style={styles.patronCard}>
              <View style={styles.patronCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.patronFarmName}>{sub.farmerName || 'Verified Producer'}</Text>
                  <Text style={styles.patronTierText}>⭐ {sub.plan} Pass Active</Text>
                </View>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>8% OFF HARVESTS</Text>
                </View>
              </View>
              <Text style={styles.patronExpireText}>
                Expires: {new Date(sub.expiresAt).toLocaleDateString()} • Auto-renew active
              </Text>
            </View>
          ))
        )}

        {/* 5. AGROVESTOR CROWDLENDING SUMMARY */}
        <View style={[styles.sectionHeaderRow, { marginTop: 22 }]}>
          <View style={styles.sectionHeaderTitleRow}>
            <TrendingUp size={18} color={Colors.cultivated} strokeWidth={2.4} />
            <Text style={styles.sectionTitle}>AgroVestor Escrow Portfolio</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/fintech/loans')}>
            <Text style={styles.sectionActionText}>View Campaigns</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.agrovestBanner}
          onPress={() => router.push('/fintech/loans')}
          activeOpacity={0.85}
        >
          <View style={styles.agrovestBannerLeft}>
            <View style={styles.agrovestIconBox}>
              <TrendingUp size={20} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.agrovestBannerTitle}>Sponsor Crop Cycles & Earn Returns</Text>
              <Text style={styles.agrovestBannerSub}>
                Crowdfund certified seeds & fertilizer. Principal protected in Engine 3 Smart Escrow.
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={Colors.cultivated} />
        </TouchableOpacity>

        {/* 6. SMART ESCROW & LEDGER TRANSACTIONS */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
          <View style={styles.sectionHeaderTitleRow}>
            <Clock size={18} color={Colors.espresso} strokeWidth={2.2} />
            <Text style={styles.sectionTitle}>Ledger & Escrow History</Text>
          </View>
        </View>

        {transactions.map((tx) => {
          const isPos = tx.isPositive;
          const statusColors: Record<string, { bg: string; text: string }> = {
            COMPLETED: { bg: '#DCFCE7', text: '#15803D' },
            PENDING: { bg: '#FEF3C7', text: '#92400E' },
            ESCROW_HELD: { bg: '#E0F2FE', text: '#0369A1' },
          };
          const badge = statusColors[tx.status] || { bg: Colors.parchment, text: Colors.espresso };

          return (
            <View key={tx.id} style={styles.txRow}>
              <View style={[styles.txIconCircle, { backgroundColor: isPos ? '#DCFCE7' : '#FEE2E2' }]}>
                {isPos ? (
                  <ArrowDownLeft size={18} color="#15803D" strokeWidth={2.4} />
                ) : (
                  <ArrowUpRight size={18} color="#B91C1C" strokeWidth={2.4} />
                )}
              </View>

              <View style={styles.txCenter}>
                <Text style={styles.txTitle}>{tx.title}</Text>
                <Text style={styles.txSub}>{tx.subtitle}</Text>
                <Text style={styles.txTime}>{tx.timestamp}</Text>
              </View>

              <View style={styles.txRight}>
                <Text style={[styles.txAmount, { color: isPos ? '#15803D' : Colors.espresso }]}>
                  {isPos ? '+' : '-'} {tx.amount.toLocaleString()} {tx.currency}
                </Text>
                <View style={[styles.txStatusPill, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.txStatusText, { color: badge.text }]}>
                    {tx.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* ============================================================ */}
      {/* DEPOSIT MODAL: PAN-AFRICAN & DIASPORA CHANNELS */}
      {/* ============================================================ */}
      <Modal
        visible={depositModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDepositModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Wallet size={20} color={Colors.cultivated} strokeWidth={2.4} />
                <Text style={styles.modalTitle}>Top Up AgroWallet</Text>
              </View>
              <TouchableOpacity onPress={() => setDepositModalVisible(false)}>
                <X size={20} color={Colors.espresso} />
              </TouchableOpacity>
            </View>

            {/* Presets */}
            <Text style={styles.modalLabel}>Select Amount</Text>
            <View style={styles.presetRow}>
              {[5000, 15000, 50000, 100000, 250000].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetChip,
                    depositAmount === String(preset) && styles.presetChipActive,
                  ]}
                  onPress={() => setDepositAmount(String(preset))}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      depositAmount === String(preset) && styles.presetChipTextActive,
                    ]}
                  >
                    {preset >= 1000 ? `${preset / 1000}k` : preset} FCFA
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.modalInput}
              value={depositAmount}
              onChangeText={setDepositAmount}
              keyboardType="numeric"
              placeholder="Custom amount in FCFA"
              placeholderTextColor={Colors.text.muted}
            />

            {/* Channels */}
            <Text style={[styles.modalLabel, { marginTop: 14 }]}>Deposit Channel</Text>
            <View style={styles.channelRow}>
              <TouchableOpacity
                style={[
                  styles.channelChip,
                  depositChannel === 'MOBILE_MONEY' && styles.channelChipActive,
                ]}
                onPress={() => setDepositChannel('MOBILE_MONEY')}
              >
                <Smartphone size={16} color={depositChannel === 'MOBILE_MONEY' ? Colors.cultivated : Colors.text.secondary} />
                <Text style={[styles.channelChipText, depositChannel === 'MOBILE_MONEY' && styles.channelChipTextActive]}>
                  Mobile Money
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.channelChip,
                  depositChannel === 'CARD' && styles.channelChipActive,
                ]}
                onPress={() => setDepositChannel('CARD')}
              >
                <CreditCard size={16} color={depositChannel === 'CARD' ? Colors.cultivated : Colors.text.secondary} />
                <Text style={[styles.channelChipText, depositChannel === 'CARD' && styles.channelChipTextActive]}>
                  Visa / MC
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.channelChip,
                  depositChannel === 'BANK_TRANSFER' && styles.channelChipActive,
                ]}
                onPress={() => setDepositChannel('BANK_TRANSFER')}
              >
                <Building2 size={16} color={depositChannel === 'BANK_TRANSFER' ? Colors.cultivated : Colors.text.secondary} />
                <Text style={[styles.channelChipText, depositChannel === 'BANK_TRANSFER' && styles.channelChipTextActive]}>
                  Bank Wire
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sub-providers for Pan-African Mobile Money */}
            {depositChannel === 'MOBILE_MONEY' && (
              <View style={styles.providerRow}>
                {(
                  [
                    { id: 'M_PESA', label: 'M-Pesa 🇰🇪🇹🇿' },
                    { id: 'AIRTEL', label: 'Airtel 🇳🇬🇺🇬' },
                    { id: 'MTN', label: 'MTN MoMo 🇬🇭🇨🇲' },
                    { id: 'ORANGE', label: 'Orange Money 🇸🇳🇨🇮' },
                    { id: 'WAVE', label: 'Wave 🇸🇳🇨🇮' },
                  ] as const
                ).map((prov) => (
                  <TouchableOpacity
                    key={prov.id}
                    style={[
                      styles.provChip,
                      depositProvider === prov.id && styles.provChipActive,
                    ]}
                    onPress={() => setDepositProvider(prov.id)}
                  >
                    <Text
                      style={[
                        styles.provChipText,
                        depositProvider === prov.id && styles.provChipTextActive,
                      ]}
                    >
                      {prov.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Account / Phone input */}
            <Text style={[styles.modalLabel, { marginTop: 10 }]}>
              {depositChannel === 'MOBILE_MONEY'
                ? 'Mobile Money Phone Number'
                : depositChannel === 'CARD'
                ? 'Card Reference / Phone'
                : 'Bank Account / Reference'}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={depositAccountRef}
              onChangeText={setDepositAccountRef}
              keyboardType={depositChannel === 'MOBILE_MONEY' ? 'phone-pad' : 'default'}
              placeholder="+254 / +237 / +234 / +225 ..."
              placeholderTextColor={Colors.text.muted}
            />

            {/* Submit CTA */}
            <TouchableOpacity
              style={[styles.modalCtaBtn, depositing && { opacity: 0.75 }]}
              onPress={handleDeposit}
              disabled={depositing}
              activeOpacity={0.85}
            >
              {depositing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <ShieldCheck size={18} color="#FFFFFF" strokeWidth={2.4} />
                  <Text style={styles.modalCtaBtnText}>
                    Credit {(parseFloat(depositAmount) || 0).toLocaleString()} FCFA to Wallet
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
    backgroundColor: '#FFFFFF',
  },
  navIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.parchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitleBox: {
    alignItems: 'center',
  },
  topTitle: {
    fontFamily: Fonts.displayItalic,
    fontSize: 18,
    color: Colors.canopy,
  },
  topSub: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  balanceCard: {
    backgroundColor: Colors.canopy,
    borderRadius: Radii.card,
    padding: 20,
    ...Shadows.card,
    marginBottom: 16,
  },
  balanceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  escrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  escrowBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: '#86efac',
  },
  currToggle: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  currToggleText: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  balanceLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  balanceMain: {
    fontFamily: Fonts.displayBold,
    fontSize: 32,
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  vaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  vaultCol: {
    flex: 1,
  },
  vaultDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 12,
  },
  vaultLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  vaultVal: {
    fontFamily: Fonts.monoBold,
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.parchment,
    borderRadius: Radii.card,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  actionIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.espresso,
  },
  actionSub: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.espresso,
  },
  sectionActionText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.cultivated,
  },
  emptyPatronCard: {
    alignItems: 'center',
    backgroundColor: Colors.parchment,
    borderRadius: Radii.card,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  emptyPatronTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.espresso,
    marginTop: 8,
  },
  emptyPatronSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 4,
    marginBottom: 12,
  },
  explorePatronBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.cultivated,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radii.pill,
  },
  explorePatronBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  patronCard: {
    backgroundColor: '#FEF9EE',
    borderRadius: Radii.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 8,
  },
  patronCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  patronFarmName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: '#92400E',
  },
  patronTierText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: '#B45309',
    marginTop: 1,
  },
  discountBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountBadgeText: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  patronExpireText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: '#B45309',
    marginTop: 8,
  },
  agrovestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF8F1',
    borderRadius: Radii.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C6E8D0',
  },
  agrovestBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  agrovestIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.cultivated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agrovestBannerTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13.5,
    color: Colors.canopy,
  },
  agrovestBannerSub: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: Colors.text.secondary,
    marginTop: 2,
    lineHeight: 16,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
  },
  txIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txCenter: {
    flex: 1,
  },
  txTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13.5,
    color: Colors.espresso,
  },
  txSub: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  txTime: {
    fontFamily: Fonts.body,
    fontSize: 10.5,
    color: Colors.text.muted,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  txAmount: {
    fontFamily: Fonts.monoBold,
    fontSize: 13.5,
  },
  txStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  txStatusText: {
    fontFamily: Fonts.monoBold,
    fontSize: 9.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(36, 26, 18, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    color: Colors.canopy,
  },
  modalLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12.5,
    color: Colors.espresso,
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.parchment,
  },
  presetChipActive: {
    borderColor: Colors.cultivated,
    backgroundColor: '#EEF8F1',
  },
  presetChipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11.5,
    color: Colors.text.secondary,
  },
  presetChipTextActive: {
    color: Colors.canopy,
    fontFamily: Fonts.bodyBold,
  },
  modalInput: {
    backgroundColor: Colors.parchment,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: Fonts.monoBold,
    fontSize: 15,
    color: Colors.espresso,
  },
  channelRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  channelChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.parchment,
  },
  channelChipActive: {
    borderColor: Colors.cultivated,
    backgroundColor: '#EEF8F1',
  },
  channelChipText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11.5,
    color: Colors.text.secondary,
  },
  channelChipTextActive: {
    color: Colors.canopy,
  },
  providerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  provChip: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  provChipActive: {
    borderColor: Colors.cultivated,
    backgroundColor: '#DCFCE7',
  },
  provChipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  provChipTextActive: {
    color: Colors.canopy,
    fontFamily: Fonts.bodyBold,
  },
  modalCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.cultivated,
    paddingVertical: 13,
    borderRadius: Radii.pill,
    marginTop: 16,
  },
  modalCtaBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
