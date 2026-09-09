import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Award,
  Wallet,
  Building2,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Percent,
  Calendar,
  Layers,
  Leaf,
  Info,
  Check,
  RefreshCw,
  ShoppingBag,
  BarChart3,
  Target,
  ChevronDown,
  ChevronUp,
  Shield,
  Zap,
} from 'lucide-react-native';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { useAuthStore } from '@/store/authStore';
import {
  fetchFarmerCreditScoreApi,
  fetchLoanProductsApi,
  fetchMyLoanApplicationsApi,
  applyForLoanApi,
  CreditScoreResponse,
} from '@/components/api/fintech';
import { LoanProduct, LoanApplication } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabMode = 'products' | 'my_loans';

export default function LoansScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabMode>('products');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data states
  const [scoreData, setScoreData] = useState<CreditScoreResponse | null>(null);
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [myLoans, setMyLoans] = useState<LoanApplication[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<LoanProduct | null>(null);
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [showRadar, setShowRadar] = useState(true);

  // Form states
  const [requestedAmount, setRequestedAmount] = useState('500000');
  const [purpose, setPurpose] = useState('Purchasing hybrid tomato seeds, NPK 20-10-10 fertilizer and drip irrigation hoses for upcoming harvest season.');
  const [durationMonths, setDurationMonths] = useState(6);

  const loadFintechData = useCallback(async () => {
    try {
      const [scoreRes, productsRes, myLoansRes] = await Promise.all([
        fetchFarmerCreditScoreApi().catch(() => null),
        fetchLoanProductsApi().catch(() => []),
        fetchMyLoanApplicationsApi().catch(() => []),
      ]);

      if (scoreRes) setScoreData(scoreRes);
      if (productsRes && productsRes.length > 0) {
        setProducts(productsRes);
        if (!selectedProduct) {
          setSelectedProduct(productsRes[0]);
          setDurationMonths(productsRes[0].durationMonths || 6);
        }
      }
      if (myLoansRes) setMyLoans(myLoansRes);
    } catch (err) {
      console.warn('Failed to load fintech telemetry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedProduct]);

  useEffect(() => {
    loadFintechData();
  }, [loadFintechData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFintechData();
  };

  const handleSelectProduct = (prod: LoanProduct) => {
    setSelectedProduct(prod);
    setDurationMonths(prod.durationMonths || 6);
    if (parseFloat(requestedAmount) > Number(prod.maxAmount)) {
      setRequestedAmount(String(Number(prod.maxAmount)));
    } else if (parseFloat(requestedAmount) < Number(prod.minAmount)) {
      setRequestedAmount(String(Number(prod.minAmount)));
    }
  };

  const currentTier = scoreData?.tier || scoreData?.creditTier || currentUser?.farmerProfile?.creditTier || 'GOLD';
  const creditScore = scoreData?.ficoScore || scoreData?.creditScore || 780;
  const isColdStart = scoreData?.isColdStart ?? (scoreData?.completedOrders !== undefined ? scoreData.completedOrders < 3 : false);
  const autoEscrowDeductionRate = scoreData?.autoEscrowDeductionRate ?? (currentTier === 'GOLD' ? 0.10 : currentTier === 'SILVER' ? 0.15 : 0.20);
  const deductionPct = Math.round(autoEscrowDeductionRate * 100);

  const radar = scoreData?.normalizedRadar || {
    salesFulfillment: 85,
    listingFrequency: 75,
    reviewBayesian: 92,
    deliveryReliability: 98,
    networkReach: 65,
    engagementVelocity: 72,
    repaymentIntegrity: 100,
    kycCompliance: 100,
  };

  const weights = scoreData?.weightsApplied || (isColdStart ? {
    kycCompliance: 0.40,
    listingFrequency: 0.30,
    engagementVelocity: 0.20,
    networkReach: 0.10,
    salesFulfillment: 0.00,
    deliveryReliability: 0.00,
    reviewBayesian: 0.00,
    repaymentIntegrity: 0.00,
  } : {
    repaymentIntegrity: 0.25,
    salesFulfillment: 0.20,
    deliveryReliability: 0.15,
    reviewBayesian: 0.12,
    listingFrequency: 0.10,
    engagementVelocity: 0.08,
    networkReach: 0.05,
    kycCompliance: 0.05,
  });

  const BEHAVIORAL_METRICS = [
    { key: 'repaymentIntegrity' as const, label: 'Loan Repayment Integrity', code: 'M7', weight: `${Math.round((weights.repaymentIntegrity ?? 0.25) * 100)}%`, icon: '💳', desc: '100% on-time escrow recovery' },
    { key: 'salesFulfillment' as const, label: 'Sales Fulfillment Volume', code: 'M1', weight: `${Math.round((weights.salesFulfillment ?? 0.20) * 100)}%`, icon: '📦', desc: 'Completed escrow deliveries' },
    { key: 'deliveryReliability' as const, label: 'Dispute-Free Delivery Ratio', code: 'M4', weight: `${Math.round((weights.deliveryReliability ?? 0.15) * 100)}%`, icon: '🛡️', desc: 'Deliveries without buyer dispute' },
    { key: 'reviewBayesian' as const, label: 'Bayesian Customer Rating', code: 'M3', weight: `${Math.round((weights.reviewBayesian ?? 0.12) * 100)}%`, icon: '⭐', desc: 'Prior-weighted buyer satisfaction' },
    { key: 'listingFrequency' as const, label: 'Produce Varieties & Updates', code: 'M2', weight: `${Math.round((weights.listingFrequency ?? 0.10) * 100)}%`, icon: '🌿', desc: 'Active catalog regularity' },
    { key: 'engagementVelocity' as const, label: 'Story & Offer Engagement', code: 'M6', weight: `${Math.round((weights.engagementVelocity ?? 0.08) * 100)}%`, icon: '⚡', desc: 'Likes, comments, and P2P offers' },
    { key: 'networkReach' as const, label: 'Trade Follower Network', code: 'M5', weight: `${Math.round((weights.networkReach ?? 0.05) * 100)}%`, icon: '👥', desc: 'Verified buyers & transporters' },
    { key: 'kycCompliance' as const, label: 'Identity, GPS & Cooperative', code: 'M8', weight: `${Math.round((weights.kycCompliance ?? 0.05) * 100)}%`, icon: '📍', desc: 'National ID, farm GPS & cooperative' },
  ];

  // Maximum Borrowing Eligibility Map
  const tierLimits: Record<string, { maxFCFA: number; label: string }> = {
    BRONZE: { maxFCFA: 500000, label: 'Bronze Producer (Up to 500,000 FCFA / $800 USD)' },
    SILVER: { maxFCFA: 1600000, label: 'Silver Producer (Up to 1,600,000 FCFA / $2,500 USD)' },
    GOLD: { maxFCFA: 6500000, label: 'Gold Tier Master (Up to 6,500,000 FCFA / $10,000 USD)' },
    PLATINUM: { maxFCFA: 15000000, label: 'Platinum Cooperative (Up to 15,000,000 FCFA Commercial)' },
  };

  // Financial Calculations
  const numericAmount = parseFloat(requestedAmount) || 0;
  const interestRate = selectedProduct ? selectedProduct.interestRatePercent : 4.5;
  const totalInterest = Math.round(numericAmount * (interestRate / 100) * (durationMonths / 12));
  const totalRepayment = numericAmount + totalInterest;

  const handleApplyLoan = async () => {
    if (!selectedProduct) {
      Alert.alert('Select Product', 'Please select a financing package to proceed.');
      return;
    }
    if (!numericAmount || numericAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid loan amount.');
      return;
    }
    if (numericAmount > Number(selectedProduct.maxAmount)) {
      Alert.alert(
        'Amount Exceeds Package Limit',
        `The maximum limit for this package is ${Number(selectedProduct.maxAmount).toLocaleString()} FCFA.`
      );
      return;
    }
    if (!purpose.trim()) {
      Alert.alert('Purpose Required', 'Please specify the agricultural input purpose.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await applyForLoanApi({
        productId: selectedProduct.id,
        purpose: purpose.trim(),
        requestedAmount: numericAmount,
        durationMonths,
      });

      Alert.alert(
        'Application Submitted! 🌾',
        `Your request for ${numericAmount.toLocaleString()} FCFA has been submitted to ${
          typeof selectedProduct.institution === 'string'
            ? selectedProduct.institution
            : selectedProduct.institution?.name || 'Advans Cameroun / Njangi Rural Fund'
        }.\n\nAutomated 20% harvest escrow withholding will be active once approved.`,
        [
          {
            text: 'Track Application',
            onPress: () => {
              setActiveTab('my_loans');
              loadFintechData();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Application Notice', err.message || 'Could not submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (tierFilter === 'ALL') return true;
    return p.requiredCreditTier === tierFilter;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. MINIMAL CLEAN TOP NAV */}
      <View style={styles.cleanTopNav}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityLabel="Go Back"
        >
          <ArrowLeft size={24} color={Colors.espresso} strokeWidth={2.2} />
        </TouchableOpacity>

        <View style={styles.cleanTitleWrap}>
          <Text style={styles.cleanScreenTitle}>Agricultural Loans</Text>
          <Text style={styles.cleanScreenSub}>Financing & seasonal credit</Text>
        </View>

        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn} activeOpacity={0.7}>
          {refreshing ? (
            <ActivityIndicator size="small" color={Colors.cultivated} />
          ) : (
            <RefreshCw size={20} color={Colors.espresso} strokeWidth={2.2} />
          )}
        </TouchableOpacity>
      </View>

      {/* 2. DUAL-TAB SELECTOR */}
      <View style={styles.tabToggleRow}>
        <TouchableOpacity
          style={[styles.tabToggleBtn, activeTab === 'products' && styles.tabToggleBtnActive]}
          onPress={() => setActiveTab('products')}
          activeOpacity={0.8}
        >
          <Wallet
            size={18}
            color={activeTab === 'products' ? Colors.cultivated : Colors.text.secondary}
            strokeWidth={activeTab === 'products' ? 2.4 : 2}
          />
          <Text
            style={[
              styles.tabToggleText,
              activeTab === 'products' && styles.tabToggleTextActive,
            ]}
          >
            Available Credit Lines
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabToggleBtn, activeTab === 'my_loans' && styles.tabToggleBtnActive]}
          onPress={() => setActiveTab('my_loans')}
          activeOpacity={0.8}
        >
          <Layers
            size={18}
            color={activeTab === 'my_loans' ? Colors.cultivated : Colors.text.secondary}
            strokeWidth={activeTab === 'my_loans' ? 2.4 : 2}
          />
          <Text
            style={[
              styles.tabToggleText,
              activeTab === 'my_loans' && styles.tabToggleTextActive,
            ]}
          >
            My Loans ({myLoans.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: Math.max(insets.bottom + 40, 60) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.cultivated}
            colors={[Colors.cultivated]}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.cultivated} />
            <Text style={styles.loadingText}>Fetching credit scoring & partner underwriting...</Text>
          </View>
        ) : (
          <>
            {/* 4. HERO CREDIT SCORE GAUGE CARD */}
            <View style={styles.heroScoreCard}>
              <View style={styles.heroScoreTop}>
                <View style={styles.heroTierBadge}>
                  <Award size={16} color={Colors.gold} strokeWidth={2.4} />
                  <Text style={styles.heroTierText}>{currentTier} TIER PRODUCER</Text>
                </View>
                <Text style={styles.heroScoreRating}>
                  ★ {scoreData?.rating ? scoreData.rating.toFixed(1) : '4.9'} Coop Rating
                </Text>
              </View>

              <View style={styles.scoreNumberRow}>
                <Text style={styles.heroScoreNumber}>{creditScore}</Text>
                <View style={styles.scoreMaxCol}>
                  <Text style={styles.scoreMaxLabel}>/ 850 PTS</Text>
                  <Text style={styles.scoreQualityLabel}>EXCELLENT CREDIT</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.scoreProgressTrack}>
                <View
                  style={[
                    styles.scoreProgressFill,
                    { width: `${Math.min(Math.round((creditScore / 850) * 100), 100)}%` },
                  ]}
                />
              </View>

              {/* Max Limit Badge */}
              <View style={styles.maxLimitBanner}>
                <Building2 size={16} color={Colors.white} />
                <Text style={styles.maxLimitText}>
                  Max Borrowing Power:{' '}
                  <Text style={styles.maxLimitAmount}>
                    {(tierLimits[currentTier]?.maxFCFA || 5000000).toLocaleString()} FCFA
                  </Text>
                </Text>
              </View>

              {/* Preferential Auto-Escrow Deduction Info */}
              <View style={styles.deductionRow}>
                <Shield size={14} color={Colors.gold} />
                <Text style={styles.deductionText}>
                  Auto-Escrow Repayment Rate: <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.white }}>{deductionPct}%</Text> (Engine 3 Settlement)
                </Text>
              </View>

              <Text style={styles.heroScoreSub}>
                Calculated in real-time by Victory Eyong Tabi Credit Engine across {scoreData?.completedOrders ?? 142} completed harvest escrows.
              </Text>
            </View>

            {/* 4B. COLD-START PROGRESSIVE WEIGHTING BANNER */}
            {isColdStart && (
              <View style={styles.coldStartBanner}>
                <View style={styles.coldStartHeader}>
                  <Sparkles size={18} color="#B45309" strokeWidth={2.4} />
                  <Text style={styles.coldStartTitle}>Cold-Start Producer Protection Active</Text>
                </View>
                <Text style={styles.coldStartBody}>
                  Sales volume penalty is waived (0% weight). Your credit rating is calculated from verified Identity & Farm GPS (40%), Produce Varieties (30%), and Responsiveness (20%). Fulfill 3 escrow sales to graduate to standard scoring.
                </Text>
              </View>
            )}

            {/* 4C. BEHAVIORAL RADAR INDICATORS (THE 8 TABI METRICS) */}
            <View style={styles.radarCard}>
              <TouchableOpacity
                style={styles.radarHeaderRow}
                onPress={() => setShowRadar(!showRadar)}
                activeOpacity={0.8}
              >
                <View style={styles.radarHeaderLeft}>
                  <BarChart3 size={20} color={Colors.canopy} strokeWidth={2.2} />
                  <View>
                    <Text style={styles.radarTitle}>Behavioral Radar (8 Empirical Metrics)</Text>
                    <Text style={styles.radarSub}>Victory Eyong Tabi Underwriting Engine</Text>
                  </View>
                </View>
                {showRadar ? (
                  <ChevronUp size={20} color={Colors.espresso} />
                ) : (
                  <ChevronDown size={20} color={Colors.espresso} />
                )}
              </TouchableOpacity>

              {showRadar && (
                <View style={styles.metricsGrid}>
                  {BEHAVIORAL_METRICS.map((m) => {
                    const score = (radar as any)[m.key] ?? 70;
                    return (
                      <View key={m.key} style={styles.metricItem}>
                        <View style={styles.metricTopRow}>
                          <View style={styles.metricTitleGroup}>
                            <Text style={styles.metricIcon}>{m.icon}</Text>
                            <Text style={styles.metricLabel}>{m.label}</Text>
                            <View style={styles.metricCodeBadge}>
                              <Text style={styles.metricCodeText}>{m.code}</Text>
                            </View>
                          </View>
                          <View style={styles.metricScoreGroup}>
                            <Text style={styles.metricScoreVal}>{score}/100</Text>
                            <Text style={styles.metricWeightTag}>wt: {m.weight}</Text>
                          </View>
                        </View>

                        <View style={styles.metricTrack}>
                          <View
                            style={[
                              styles.metricFill,
                              {
                                width: `${score}%`,
                                backgroundColor:
                                  score >= 80
                                    ? Colors.cultivated
                                    : score >= 50
                                    ? Colors.gold
                                    : '#EF4444',
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.metricDesc}>{m.desc}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* 4D. ACTIONABLE ROADMAP TO NEXT TIER */}
            <View style={styles.roadmapCard}>
              <View style={styles.roadmapHeader}>
                <Target size={20} color={Colors.gold} strokeWidth={2.4} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.roadmapTitle}>
                    {currentTier === 'GOLD' || currentTier === 'PLATINUM'
                      ? 'Maximum Tier Unlocked — Institutional Credit Ready'
                      : `Roadmap to ${currentTier === 'BRONZE' ? 'Silver ($2,500)' : 'Gold ($10,000)'} Tier`}
                  </Text>
                  <Text style={styles.roadmapSub}>
                    {currentTier === 'GOLD' || currentTier === 'PLATINUM'
                      ? 'You qualify for up to $10,000 USD (6,500,000 FCFA) commercial line with 10% auto-escrow deduction.'
                      : `You are ~35 points away from unlocking higher borrowing power.`}
                  </Text>
                </View>
              </View>

              <View style={styles.roadmapList}>
                <View style={styles.roadmapItem}>
                  <CheckCircle2 size={16} color={Colors.cultivated} />
                  <Text style={styles.roadmapItemText}>
                    Fulfill 2 more harvest deliveries without buyer disputes (+18 pts)
                  </Text>
                </View>
                <View style={styles.roadmapItem}>
                  <CheckCircle2 size={16} color={Colors.cultivated} />
                  <Text style={styles.roadmapItemText}>
                    Maintain 100% on-time seasonal microloan escrow recovery (+25 pts)
                  </Text>
                </View>
                <View style={styles.roadmapItem}>
                  <CheckCircle2 size={16} color={Colors.cultivated} />
                  <Text style={styles.roadmapItemText}>
                    Upload verified cooperative registration certificate (+40 pts)
                  </Text>
                </View>
              </View>
            </View>


            {/* ============================================================ */}
            {/* VIEW 1: AVAILABLE CREDIT LINES & APPLY FORM */}
            {/* ============================================================ */}
            {activeTab === 'products' && (
              <View style={styles.sectionWrap}>
                {/* Section Header */}
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Partner Underwriting Catalog</Text>
                    <Text style={styles.sectionSub}>Pre-approved agricultural input lines</Text>
                  </View>
                </View>

                {/* Tier Filter Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tierScroll}>
                  {['ALL', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].map((tier) => (
                    <TouchableOpacity
                      key={tier}
                      style={[styles.tierFilterChip, tierFilter === tier && styles.tierFilterChipActive]}
                      onPress={() => setTierFilter(tier)}
                    >
                      <Text
                        style={[
                          styles.tierFilterChipText,
                          tierFilter === tier && styles.tierFilterChipTextActive,
                        ]}
                      >
                        {tier}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Products List */}
                <View style={styles.productsList}>
                  {filteredProducts.map((prod) => {
                    const isSelected = selectedProduct?.id === prod.id;
                    const institutionName =
                      typeof prod.institution === 'string'
                        ? prod.institution
                        : prod.institution?.name || 'Advans Cameroun Microfinance';

                    return (
                      <TouchableOpacity
                        key={prod.id}
                        style={[styles.productCard, isSelected && styles.productCardSelected]}
                        onPress={() => handleSelectProduct(prod)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.productCardHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.productTitle}>{prod.title}</Text>
                            {prod.frenchTitle && (
                              <Text style={styles.productFrenchTitle}>{prod.frenchTitle}</Text>
                            )}
                          </View>
                          <View style={styles.aprBadge}>
                            <Text style={styles.aprBadgeText}>{prod.interestRatePercent}% APR</Text>
                          </View>
                        </View>

                        <Text style={styles.productDescription}>{prod.description}</Text>

                        {/* Underwriter Row */}
                        <View style={styles.underwriterRow}>
                          <Building2 size={13} color={Colors.text.secondary} />
                          <Text style={styles.underwriterText}>Underwriter: {institutionName}</Text>
                        </View>

                        {/* Product Spec Badges */}
                        <View style={styles.specsRow}>
                          <View style={styles.specItem}>
                            <Text style={styles.specLabel}>Max Limit</Text>
                            <Text style={styles.specValue}>
                              {Number(prod.maxAmount).toLocaleString()} FCFA
                            </Text>
                          </View>
                          <View style={styles.specItem}>
                            <Text style={styles.specLabel}>Tenor</Text>
                            <Text style={styles.specValue}>{prod.durationMonths} Months</Text>
                          </View>
                          <View style={styles.specItem}>
                            <Text style={styles.specLabel}>Min Tier</Text>
                            <Text style={[styles.specValue, { color: Colors.cultivated }]}>
                              {prod.requiredCreditTier}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.cardSelectFooter}>
                          <View style={styles.selectRadioRow}>
                            <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                              {isSelected && <View style={styles.radioInnerDot} />}
                            </View>
                            <Text style={[styles.selectRadioText, isSelected && styles.selectRadioTextActive]}>
                              {isSelected ? 'Package Selected for Application' : 'Tap to Select Package'}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* ======================================================== */}
                {/* INTERACTIVE LOAN CALCULATOR & APPLICATION FORM */}
                {/* ======================================================== */}
                <View style={styles.formCard}>
                  <View style={styles.formCardHeader}>
                    <Leaf size={20} color={Colors.cultivated} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formCardTitle}>Loan Application & Repayment Estimator</Text>
                      <Text style={styles.formCardSub}>
                        Customized for: {selectedProduct?.title || 'Seasonal Advance'}
                      </Text>
                    </View>
                  </View>

                  {/* Preset Amount Chips */}
                  <Text style={styles.inputLabel}>Requested Financing Amount (FCFA)</Text>
                  <View style={styles.presetChipsRow}>
                    {['100000', '250000', '500000', '1000000', '2000000', '5000000'].map((amt) => (
                      <TouchableOpacity
                        key={amt}
                        style={[
                          styles.presetChip,
                          requestedAmount === amt && styles.presetChipActive,
                        ]}
                        onPress={() => setRequestedAmount(amt)}
                      >
                        <Text
                          style={[
                            styles.presetChipText,
                            requestedAmount === amt && styles.presetChipTextActive,
                          ]}
                        >
                          {Number(amt) >= 1000000
                            ? `${Number(amt) / 1000000}M`
                            : `${Number(amt) / 1000}k`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Amount Numeric Input */}
                  <TextInput
                    style={styles.amountInput}
                    value={requestedAmount}
                    onChangeText={setRequestedAmount}
                    keyboardType="numeric"
                    placeholder="Enter amount in FCFA"
                    placeholderTextColor={Colors.text.muted}
                  />

                  {/* Tenure Selector Chips */}
                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Loan Tenor (Months)</Text>
                  <View style={styles.tenorChipsRow}>
                    {[3, 6, 9, 12, 18].map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.tenorChip,
                          durationMonths === m && styles.tenorChipActive,
                        ]}
                        onPress={() => setDurationMonths(m)}
                      >
                        <Text
                          style={[
                            styles.tenorChipText,
                            durationMonths === m && styles.tenorChipTextActive,
                          ]}
                        >
                          {m} Mo
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Farming Purpose Input */}
                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Agricultural Input Purpose</Text>
                  <TextInput
                    style={styles.purposeInput}
                    value={purpose}
                    onChangeText={setPurpose}
                    multiline
                    numberOfLines={3}
                    placeholder="Describe inputs e.g. Seeds, Organic Fertilizer, Drip Irrigation Pipes"
                    placeholderTextColor={Colors.text.muted}
                  />

                  {/* Real-time Calculation Summary Card */}
                  <View style={styles.calcSummaryBox}>
                    <Text style={styles.calcSummaryTitle}>Settlement Schedule Preview</Text>

                    <View style={styles.calcRow}>
                      <Text style={styles.calcLabel}>Requested Principal</Text>
                      <Text style={styles.calcVal}>{numericAmount.toLocaleString()} FCFA</Text>
                    </View>

                    <View style={styles.calcRow}>
                      <Text style={styles.calcLabel}>Estimated Interest ({interestRate}% APR)</Text>
                      <Text style={styles.calcVal}>+ {totalInterest.toLocaleString()} FCFA</Text>
                    </View>

                    <View style={styles.calcDivider} />

                    <View style={styles.calcRow}>
                      <Text style={styles.calcTotalLabel}>Total Repayable</Text>
                      <Text style={styles.calcTotalVal}>{totalRepayment.toLocaleString()} FCFA</Text>
                    </View>

                    {/* Notice */}
                    <View style={styles.repaymentNoticePill}>
                      <CheckCircle2 size={15} color={Colors.cultivated} />
                      <Text style={styles.repaymentNoticeText}>
                        Repayment will be automatically deducted as{' '}
                        <Text style={{ fontFamily: Fonts.monoBold }}>20% of future harvest escrow sales</Text>.
                        Zero out-of-pocket cash debt collection.
                      </Text>
                    </View>
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[styles.submitLoanBtn, submitting && { opacity: 0.75 }]}
                    onPress={handleApplyLoan}
                    disabled={submitting}
                    activeOpacity={0.85}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Wallet size={18} color="#FFF" />
                        <Text style={styles.submitLoanBtnText}>
                          Submit Loan Request ({numericAmount.toLocaleString()} FCFA)
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ============================================================ */}
            {/* VIEW 2: MY LOANS & REPAYMENT PIPELINE */}
            {/* ============================================================ */}
            {activeTab === 'my_loans' && (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>My Loan Pipeline</Text>
                    <Text style={styles.sectionSub}>Active loans and repayment telemetry</Text>
                  </View>
                </View>

                {myLoans.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Wallet size={36} color={Colors.text.muted} />
                    <Text style={styles.emptyCardTitle}>No Loan Applications Yet</Text>
                    <Text style={styles.emptyCardSub}>
                      Submit an application from the "Available Credit Lines" tab to access planting season financing.
                    </Text>
                    <TouchableOpacity
                      style={styles.emptyActionBtn}
                      onPress={() => setActiveTab('products')}
                    >
                      <Text style={styles.emptyActionBtnText}>Browse Financing Packages</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  myLoans.map((loan) => {
                    const statusColors: Record<string, { bg: string; text: string; label: string }> = {
                      SUBMITTED: { bg: '#FEF3C7', text: '#92400E', label: 'SUBMITTED (UNDERWRITING)' },
                      UNDER_REVIEW: { bg: '#E0F2FE', text: '#0369A1', label: 'UNDER REVIEW' },
                      APPROVED: { bg: '#EEF8F1', text: Colors.cultivated, label: 'APPROVED (FUNDS READY)' },
                      DISBURSED: { bg: '#F3E8FF', text: '#6B21A8', label: 'DISBURSED (ACTIVE LOAN)' },
                      REPAID: { bg: '#DCFCE7', text: '#15803D', label: 'FULLY REPAID' },
                      REJECTED: { bg: '#FEE2E2', text: '#991B1B', label: 'REJECTED' },
                    };

                    const badge = statusColors[loan.status] || {
                      bg: Colors.parchment,
                      text: Colors.espresso,
                      label: loan.status,
                    };

                    return (
                      <View key={loan.id} style={styles.loanAppCard}>
                        <View style={styles.loanAppHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.loanAppProductTitle}>
                              {loan.product?.title || 'Seasonal Advance'}
                            </Text>
                            <Text style={styles.loanAppDate}>
                              Applied: {new Date(loan.createdAt).toLocaleDateString()}
                            </Text>
                          </View>
                          <View style={[styles.loanAppStatusBadge, { backgroundColor: badge.bg }]}>
                            <Text style={[styles.loanAppStatusText, { color: badge.text }]}>
                              {badge.label}
                            </Text>
                          </View>
                        </View>

                        {/* Amount Specs */}
                        <View style={styles.loanAppSpecsRow}>
                          <View style={styles.loanAppSpecCol}>
                            <Text style={styles.loanAppSpecLabel}>Requested</Text>
                            <Text style={styles.loanAppSpecVal}>
                              {Number(loan.requestedAmount).toLocaleString()} FCFA
                            </Text>
                          </View>
                          <View style={styles.loanAppSpecCol}>
                            <Text style={styles.loanAppSpecLabel}>Tenor</Text>
                            <Text style={styles.loanAppSpecVal}>{loan.durationMonths} Months</Text>
                          </View>
                          <View style={styles.loanAppSpecCol}>
                            <Text style={styles.loanAppSpecLabel}>Interest</Text>
                            <Text style={styles.loanAppSpecVal}>{loan.interestRate}% APR</Text>
                          </View>
                        </View>

                        {/* Purpose */}
                        <View style={styles.loanAppPurposeBox}>
                          <Text style={styles.loanAppPurposeLabel}>Input Purpose:</Text>
                          <Text style={styles.loanAppPurposeText}>{loan.purpose}</Text>
                        </View>

                        {/* Underwriter */}
                        <View style={styles.loanAppFooter}>
                          <Building2 size={12} color={Colors.text.secondary} />
                          <Text style={styles.loanAppUnderwriter}>
                            Underwriter:{' '}
                            {typeof loan.product?.institution === 'string'
                              ? loan.product.institution
                              : loan.product?.institution?.name || 'Advans Cameroun EMF'}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  cleanTopNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
  },
  backButton: {
    padding: 6,
    marginLeft: -4,
  },
  cleanTitleWrap: {
    flex: 1,
    marginLeft: 8,
  },
  cleanScreenTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 20,
    color: Colors.espresso,
  },
  cleanScreenSub: {
    fontFamily: Fonts.body,
    fontSize: 13.5,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  refreshBtn: {
    padding: 6,
  },
  tabToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
  },
  tabToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Radii.pill,
    backgroundColor: Colors.parchment,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  tabToggleBtnActive: {
    backgroundColor: '#EEF8F1',
    borderColor: Colors.cultivated,
  },
  tabToggleText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  tabToggleTextActive: {
    color: Colors.cultivated,
    fontFamily: Fonts.bodyBold,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  contentContainer: {
    padding: 16,
    gap: 18,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  loadingText: {
    fontFamily: Fonts.body,
    fontSize: 14.5,
    color: Colors.text.secondary,
  },
  heroScoreCard: {
    backgroundColor: Colors.canopy,
    borderRadius: Radii.card,
    padding: 20,
    ...Shadows.card,
  },
  heroScoreTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heroTierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(226, 166, 60, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
  },
  heroTierText: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    color: Colors.gold,
    letterSpacing: 0.5,
  },
  heroScoreRating: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.parchment,
  },
  scoreNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 12,
  },
  heroScoreNumber: {
    fontFamily: Fonts.displayBold,
    fontSize: 54,
    color: Colors.white,
    lineHeight: 58,
  },
  scoreMaxCol: {
    justifyContent: 'center',
  },
  scoreMaxLabel: {
    fontFamily: Fonts.monoBold,
    fontSize: 14,
    color: Colors.parchment,
  },
  scoreQualityLabel: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    color: Colors.gold,
    marginTop: 2,
  },
  scoreProgressTrack: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  scoreProgressFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 4,
  },
  maxLimitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  maxLimitText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.parchment,
  },
  maxLimitAmount: {
    fontFamily: Fonts.monoBold,
    fontSize: 15,
    color: Colors.gold,
  },
  heroScoreSub: {
    fontFamily: Fonts.body,
    fontSize: 13.5,
    color: 'rgba(246, 238, 221, 0.85)',
    lineHeight: 19,
  },
  sectionWrap: {
    gap: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
    color: Colors.espresso,
  },
  sectionSub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  tierScroll: {
    flexDirection: 'row',
  },
  tierFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    backgroundColor: Colors.parchment,
    borderWidth: 1.5,
    borderColor: Colors.parchmentDim,
    marginRight: 8,
  },
  tierFilterChipActive: {
    backgroundColor: Colors.cultivated,
    borderColor: Colors.cultivated,
  },
  tierFilterChipText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13.5,
    color: Colors.espresso,
  },
  tierFilterChipTextActive: {
    color: Colors.white,
  },
  productsList: {
    gap: 14,
  },
  productCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 18,
    borderWidth: 1.5,
    borderColor: Colors.parchmentDim,
    ...Shadows.subtle,
  },
  productCardSelected: {
    borderColor: Colors.cultivated,
    backgroundColor: '#FAFDFB',
  },
  productCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    color: Colors.espresso,
  },
  productFrenchTitle: {
    fontFamily: Fonts.body,
    fontSize: 13.5,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  aprBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  aprBadgeText: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    color: '#92400E',
  },
  productDescription: {
    fontFamily: Fonts.body,
    fontSize: 14.5,
    color: Colors.text.secondary,
    lineHeight: 21,
    marginBottom: 12,
  },
  underwriterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  underwriterText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13.5,
    color: Colors.text.secondary,
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.parchment,
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  specItem: {
    alignItems: 'center',
  },
  specLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  specValue: {
    fontFamily: Fonts.monoBold,
    fontSize: 14.5,
    color: Colors.espresso,
    marginTop: 3,
  },
  cardSelectFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.parchmentDim,
    paddingTop: 12,
  },
  selectRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.soil,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: Colors.cultivated,
  },
  radioInnerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.cultivated,
  },
  selectRadioText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  selectRadioTextActive: {
    fontFamily: Fonts.bodySemiBold,
    color: Colors.cultivated,
  },
  // Application Form Card
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 20,
    borderWidth: 1.5,
    borderColor: Colors.parchmentDim,
    ...Shadows.card,
  },
  formCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
  },
  formCardTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    color: Colors.espresso,
  },
  formCardSub: {
    fontFamily: Fonts.body,
    fontSize: 13.5,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  inputLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14.5,
    color: Colors.espresso,
    marginBottom: 8,
  },
  presetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    backgroundColor: Colors.parchment,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  presetChipActive: {
    backgroundColor: '#EEF8F1',
    borderColor: Colors.cultivated,
  },
  presetChipText: {
    fontFamily: Fonts.monoBold,
    fontSize: 13.5,
    color: Colors.espresso,
  },
  presetChipTextActive: {
    color: Colors.cultivated,
  },
  amountInput: {
    fontFamily: Fonts.monoBold,
    fontSize: 20,
    color: Colors.espresso,
    backgroundColor: Colors.parchment,
    borderRadius: Radii.sm,
    borderWidth: 1.5,
    borderColor: Colors.parchmentDim,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tenorChipsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tenorChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radii.pill,
    backgroundColor: Colors.parchment,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.parchmentDim,
  },
  tenorChipActive: {
    backgroundColor: Colors.cultivated,
    borderColor: Colors.cultivated,
  },
  tenorChipText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.espresso,
  },
  tenorChipTextActive: {
    color: Colors.white,
  },
  purposeInput: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.espresso,
    backgroundColor: Colors.parchment,
    borderRadius: Radii.sm,
    borderWidth: 1.5,
    borderColor: Colors.parchmentDim,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 85,
    textAlignVertical: 'top',
  },
  calcSummaryBox: {
    backgroundColor: Colors.parchment,
    borderRadius: 14,
    padding: 16,
    marginTop: 18,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  calcSummaryTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.espresso,
    marginBottom: 12,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calcLabel: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  calcVal: {
    fontFamily: Fonts.mono,
    fontSize: 14.5,
    color: Colors.espresso,
  },
  calcDivider: {
    height: 1,
    backgroundColor: Colors.parchmentDim,
    marginVertical: 8,
  },
  calcTotalLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.espresso,
  },
  calcTotalVal: {
    fontFamily: Fonts.monoBold,
    fontSize: 16,
    color: Colors.cultivated,
  },
  repaymentNoticePill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EEF8F1',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  repaymentNoticeText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 13.5,
    color: Colors.cultivated,
    lineHeight: 19,
  },
  submitLoanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.cultivated,
    paddingVertical: 16,
    borderRadius: Radii.pill,
    marginTop: 20,
    ...Shadows.subtle,
  },
  submitLoanBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.white,
  },
  // My Loans Pipeline Tab
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: Colors.parchment,
    borderRadius: Radii.card,
    borderWidth: 1.5,
    borderColor: Colors.parchmentDim,
    gap: 10,
  },
  emptyCardTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    color: Colors.espresso,
    marginTop: 6,
  },
  emptyCardSub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  emptyActionBtn: {
    marginTop: 10,
    backgroundColor: Colors.cultivated,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: Radii.pill,
  },
  emptyActionBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.white,
  },
  loanAppCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 18,
    borderWidth: 1.5,
    borderColor: Colors.parchmentDim,
    ...Shadows.subtle,
  },
  loanAppHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  loanAppProductTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16.5,
    color: Colors.espresso,
  },
  loanAppDate: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.muted,
    marginTop: 3,
  },
  loanAppStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  loanAppStatusText: {
    fontFamily: Fonts.monoBold,
    fontSize: 12,
  },
  loanAppSpecsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.parchment,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  loanAppSpecCol: {
    alignItems: 'center',
  },
  loanAppSpecLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  loanAppSpecVal: {
    fontFamily: Fonts.monoBold,
    fontSize: 14.5,
    color: Colors.espresso,
    marginTop: 3,
  },
  loanAppPurposeBox: {
    backgroundColor: Colors.parchment,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  loanAppPurposeLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 3,
  },
  loanAppPurposeText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.espresso,
    lineHeight: 20,
  },
  loanAppFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loanAppUnderwriter: {
    fontFamily: Fonts.body,
    fontSize: 13.5,
    color: Colors.text.secondary,
  },
  deductionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  deductionText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.parchment,
    flex: 1,
  },
  coldStartBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: Radii.card,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    ...Shadows.subtle,
  },
  coldStartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  coldStartTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14.5,
    color: '#92400E',
  },
  coldStartBody: {
    fontFamily: Fonts.body,
    fontSize: 12.5,
    color: '#78350F',
    lineHeight: 18,
  },
  radarCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: Colors.parchmentDim,
    ...Shadows.subtle,
  },
  radarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radarHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  radarTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.espresso,
  },
  radarSub: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  metricsGrid: {
    marginTop: 16,
    gap: 12,
  },
  metricItem: {
    backgroundColor: Colors.parchment,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  metricIcon: {
    fontSize: 14,
  },
  metricLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12.5,
    color: Colors.espresso,
  },
  metricCodeBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  metricCodeText: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    color: '#475569',
  },
  metricScoreGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricScoreVal: {
    fontFamily: Fonts.monoBold,
    fontSize: 12.5,
    color: Colors.espresso,
  },
  metricWeightTag: {
    fontFamily: Fonts.body,
    fontSize: 10.5,
    color: Colors.text.muted,
  },
  metricTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  metricFill: {
    height: '100%',
    borderRadius: 3,
  },
  metricDesc: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.muted,
  },
  roadmapCard: {
    backgroundColor: '#EEF8F1',
    borderRadius: Radii.card,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#C6E8D0',
    ...Shadows.subtle,
  },
  roadmapHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  roadmapTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14.5,
    color: Colors.canopy,
  },
  roadmapSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.espresso,
    marginTop: 2,
    lineHeight: 16,
  },
  roadmapList: {
    gap: 8,
  },
  roadmapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roadmapItemText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12.5,
    color: Colors.espresso,
    flex: 1,
  },
});


