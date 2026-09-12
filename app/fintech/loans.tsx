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
  Modal,
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
  X,
  Smartphone,
  CreditCard,
} from 'lucide-react-native';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { useAuthStore } from '@/store/authStore';
import {
  fetchFarmerCreditScoreApi,
  fetchLoanProductsApi,
  fetchMyLoanApplicationsApi,
  applyForLoanApi,
  fetchAgroVestorCampaignsApi,
  pledgeAgroVestorInvestmentApi,
  fetchMyAgroVestmentsApi,
  CreditScoreResponse,
  AgroVestorCampaign,
  AgroVestorInvestment,
} from '@/components/api/fintech';
import { LoanProduct, LoanApplication } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabMode = 'products' | 'agrovestor' | 'my_loans';

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

  // AgroVestor State
  const [campaigns, setCampaigns] = useState<AgroVestorCampaign[]>([]);
  const [myInvestments, setMyInvestments] = useState<AgroVestorInvestment[]>([]);
  const [investModalVisible, setInvestModalVisible] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<AgroVestorCampaign | null>(null);
  const [pledgeAmount, setPledgeAmount] = useState('25000');
  const [pledgeCategory, setPledgeCategory] = useState<'MOBILE_MONEY' | 'CARD' | 'BANK_TRANSFER' | 'AGROWALLET'>('MOBILE_MONEY');
  const [pledgeProvider, setPledgeProvider] = useState<'M_PESA' | 'AIRTEL' | 'MTN' | 'ORANGE' | 'WAVE'>('M_PESA');
  const [pledgePhone, setPledgePhone] = useState(currentUser?.phone || '+254 712 345 678');
  const [pledging, setPledging] = useState(false);

  // Form states
  const [requestedAmount, setRequestedAmount] = useState('500000');
  const [purpose, setPurpose] = useState('Purchasing hybrid tomato seeds, NPK 20-10-10 fertilizer and drip irrigation hoses for upcoming harvest season.');
  const [durationMonths, setDurationMonths] = useState(6);

  const loadFintechData = useCallback(async () => {
    try {
      const [scoreRes, productsRes, myLoansRes, campaignsRes, investmentsRes] = await Promise.all([
        fetchFarmerCreditScoreApi().catch(() => null),
        fetchLoanProductsApi().catch(() => []),
        fetchMyLoanApplicationsApi().catch(() => []),
        fetchAgroVestorCampaignsApi().catch(() => []),
        fetchMyAgroVestmentsApi().catch(() => []),
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
      if (campaignsRes) setCampaigns(campaignsRes);
      if (investmentsRes) setMyInvestments(investmentsRes);
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
    { key: 'networkReach' as const, label: 'AgroPatron & Trade Network', code: 'M5', weight: `${Math.round((weights.networkReach ?? 0.05) * 100)}%`, icon: '👥', desc: 'Verified patrons & transporters' },
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

  const openInvestModal = (camp: AgroVestorCampaign) => {
    setSelectedCampaign(camp);
    setPledgeAmount(String(camp.minPledge || 25000));
    setInvestModalVisible(true);
  };

  const handlePledgeInvestment = async () => {
    if (!selectedCampaign) return;
    const amt = parseFloat(pledgeAmount);
    if (isNaN(amt) || amt < selectedCampaign.minPledge) {
      Alert.alert('Invalid Amount', `Minimum investment for this campaign is ${selectedCampaign.minPledge.toLocaleString()} FCFA`);
      return;
    }
    try {
      setPledging(true);
      const provider = pledgeCategory === 'MOBILE_MONEY' ? pledgeProvider : pledgeCategory;
      const res = await pledgeAgroVestorInvestmentApi({
        campaignId: selectedCampaign.id,
        amount: amt,
        paymentMethod: pledgeCategory,
        paymentProvider: provider,
        currency: 'XAF',
      });
      Alert.alert(
        'AgroVestment Secured! 🚀🌾',
        `Your investment of ${amt.toLocaleString()} FCFA has been locked into Engine 3 Smart Escrow via ${provider.replace('_', ' ')}. Projected return: ${res.investment?.projectedReturnAmount?.toLocaleString()} FCFA (+${selectedCampaign.expectedRoiPercent}% in ${selectedCampaign.durationMonths} months).`,
        [
          {
            text: 'View Portfolio',
            onPress: () => {
              setInvestModalVisible(false);
              setActiveTab('my_loans');
              loadFintechData();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Investment Error', err.message || 'Could not complete investment pledge');
    } finally {
      setPledging(false);
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

      {/* 2. THREE-WAY TAB SELECTOR */}
      <View style={styles.tabToggleRow}>
        <TouchableOpacity
          style={[styles.tabToggleBtn, activeTab === 'products' && styles.tabToggleBtnActive]}
          onPress={() => setActiveTab('products')}
          activeOpacity={0.8}
        >
          <Wallet
            size={16}
            color={activeTab === 'products' ? Colors.cultivated : Colors.text.secondary}
            strokeWidth={activeTab === 'products' ? 2.4 : 2}
          />
          <Text
            style={[
              styles.tabToggleText,
              activeTab === 'products' && styles.tabToggleTextActive,
            ]}
          >
            Credit Lines
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabToggleBtn, activeTab === 'agrovestor' && styles.tabToggleBtnActive]}
          onPress={() => setActiveTab('agrovestor')}
          activeOpacity={0.8}
        >
          <TrendingUp
            size={16}
            color={activeTab === 'agrovestor' ? Colors.cultivated : Colors.text.secondary}
            strokeWidth={activeTab === 'agrovestor' ? 2.4 : 2}
          />
          <Text
            style={[
              styles.tabToggleText,
              activeTab === 'agrovestor' && styles.tabToggleTextActive,
            ]}
          >
            AgroVestor 🚀
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabToggleBtn, activeTab === 'my_loans' && styles.tabToggleBtnActive]}
          onPress={() => setActiveTab('my_loans')}
          activeOpacity={0.8}
        >
          <Layers
            size={16}
            color={activeTab === 'my_loans' ? Colors.cultivated : Colors.text.secondary}
            strokeWidth={activeTab === 'my_loans' ? 2.4 : 2}
          />
          <Text
            style={[
              styles.tabToggleText,
              activeTab === 'my_loans' && styles.tabToggleTextActive,
            ]}
          >
            Portfolio ({myLoans.length + myInvestments.length})
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
            {/* VIEW 2: AGROVESTOR P2P CROWDLENDING CAMPAIGNS */}
            {/* ============================================================ */}
            {activeTab === 'agrovestor' && (
              <View style={styles.sectionWrap}>
                {/* AgroVestor Explainer Banner */}
                <View style={styles.agrovestorHeroBanner}>
                  <View style={styles.agrovestorHeroHeader}>
                    <Sparkles size={20} color={Colors.gold} strokeWidth={2.4} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.agrovestorHeroTitle}>AgroVestor Crowdlending</Text>
                      <Text style={styles.agrovestorHeroSubtitle}>
                        Direct Farm Sponsorship Powered by Engine 1 Underwriting
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.agrovestorHeroBody}>
                    Invest in verified seasonal crop cycles. Every farm is audited with the 8 Victory Eyong Tabi Behavioral Credit Metrics. Capital is locked into Engine 3 Smart Escrow and disbursed strictly according to verified agricultural input milestones.
                  </Text>
                  <View style={styles.agrovestorHeroStatsRow}>
                    <View style={styles.agrovestorHeroStat}>
                      <Text style={styles.agrovestorHeroStatVal}>15% - 28%</Text>
                      <Text style={styles.agrovestorHeroStatLabel}>Target Seasonal ROI</Text>
                    </View>
                    <View style={styles.agrovestorHeroDivider} />
                    <View style={styles.agrovestorHeroStat}>
                      <Text style={styles.agrovestorHeroStatVal}>Engine 3</Text>
                      <Text style={styles.agrovestorHeroStatLabel}>Escrow Protection</Text>
                    </View>
                    <View style={styles.agrovestorHeroDivider} />
                    <View style={styles.agrovestorHeroStat}>
                      <Text style={styles.agrovestorHeroStatVal}>0%</Text>
                      <Text style={styles.agrovestorHeroStatLabel}>Unhedged Default</Text>
                    </View>
                  </View>
                </View>

                {/* Campaigns List Header */}
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Open Harvest Campaigns</Text>
                    <Text style={styles.sectionSub}>Select a verified farm to sponsor this season</Text>
                  </View>
                </View>

                {campaigns.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Leaf size={36} color={Colors.cultivated} />
                    <Text style={styles.emptyCardTitle}>No Open Campaigns Currently</Text>
                    <Text style={styles.emptyCardSub}>
                      All verified farm cycles are fully funded. New seasonal planting campaigns undergo credit assessment and will open soon.
                    </Text>
                  </View>
                ) : (
                  campaigns.map((camp) => {
                    const pct = Math.min(100, Math.round(((camp.fundedAmount || 0) / (camp.targetAmount || 1)) * 100));
                    return (
                      <View key={camp.id} style={styles.campaignCard}>
                        {/* Farm / Farmer Header */}
                        <View style={styles.campaignHeader}>
                          <View style={styles.campaignFarmerInfo}>
                            <View style={styles.campaignAvatar}>
                              <Text style={styles.campaignAvatarText}>
                                {camp.farmer?.name || camp.farmerName
                                  ? (camp.farmer?.name || camp.farmerName)![0].toUpperCase()
                                  : '🌿'}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <View style={styles.campaignFarmerNameRow}>
                                <Text style={styles.campaignFarmName}>{camp.farm?.name || camp.farmName || 'Verified Agro Enterprise'}</Text>
                                <ShieldCheck size={15} color={Colors.cultivated} />
                              </View>
                              <Text style={styles.campaignFarmerLocation}>
                                {camp.farmer?.name || camp.farmerName || 'Lead Producer'} • {camp.farm?.location || camp.region || 'Southwest / Littoral'}
                              </Text>
                            </View>
                          </View>

                          {/* Credit Tier & Score Badge */}
                          <View style={styles.campaignTierBadge}>
                            <Award size={13} color={Colors.gold} />
                            <Text style={styles.campaignTierText}>{camp.creditTier} ({camp.creditScore} pts)</Text>
                          </View>
                        </View>

                        {/* Title & Description */}
                        <Text style={styles.campaignTitle}>{camp.title}</Text>
                        <Text style={styles.campaignCropTag}>🌾 Crop: {camp.cropType}</Text>
                        <Text style={styles.campaignDesc} numberOfLines={3}>{camp.description}</Text>

                        {/* Funding Progress Bar */}
                        <View style={styles.campaignProgressSection}>
                          <View style={styles.campaignProgressLabels}>
                            <Text style={styles.campaignFundedText}>
                              {camp.fundedAmount.toLocaleString()} FCFA raised
                            </Text>
                            <Text style={styles.campaignTargetText}>
                              Goal: {camp.targetAmount.toLocaleString()} FCFA ({pct}%)
                            </Text>
                          </View>
                          <View style={styles.campaignProgressTrack}>
                            <View style={[styles.campaignProgressFill, { width: `${pct}%` }]} />
                          </View>
                        </View>

                        {/* Metrics specs */}
                        <View style={styles.campaignSpecsRow}>
                          <View style={styles.campaignSpecCol}>
                            <Text style={styles.campaignSpecLabel}>Est. Return</Text>
                            <Text style={[styles.campaignSpecVal, { color: Colors.cultivated }]}>
                              +{camp.expectedRoiPercent}% ROI
                            </Text>
                          </View>
                          <View style={styles.campaignSpecCol}>
                            <Text style={styles.campaignSpecLabel}>Cycle Tenor</Text>
                            <Text style={styles.campaignSpecVal}>{camp.durationMonths} Months</Text>
                          </View>
                          <View style={styles.campaignSpecCol}>
                            <Text style={styles.campaignSpecLabel}>Min Pledge</Text>
                            <Text style={styles.campaignSpecVal}>{camp.minPledge.toLocaleString()} FCFA</Text>
                          </View>
                          <View style={styles.campaignSpecCol}>
                            <Text style={styles.campaignSpecLabel}>AgroVestors</Text>
                            <Text style={styles.campaignSpecVal}>{camp.backersCount} Pledged</Text>
                          </View>
                        </View>

                        {/* Action CTA Button */}
                        <TouchableOpacity
                          style={styles.investCtaBtn}
                          onPress={() => openInvestModal(camp)}
                          activeOpacity={0.85}
                        >
                          <TrendingUp size={16} color="#FFFFFF" strokeWidth={2.4} />
                          <Text style={styles.investCtaBtnText}>AgroVest in this Harvest (from {camp.minPledge.toLocaleString()} FCFA)</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* ============================================================ */}
            {/* VIEW 3: MY LOANS & AGROVESTOR PORTFOLIO */}
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
                      Submit an application from the "Credit Lines" tab to access planting season financing.
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

                {/* ---------------- AGROVESTOR PORTFOLIO SECTION ---------------- */}
                <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
                  <View>
                    <Text style={styles.sectionTitle}>AgroVestor Harvest Portfolio</Text>
                    <Text style={styles.sectionSub}>Sponsorships & Escrow-Protected Investments</Text>
                  </View>
                </View>

                {myInvestments.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <TrendingUp size={36} color={Colors.text.muted} />
                    <Text style={styles.emptyCardTitle}>No Farm Investments Yet</Text>
                    <Text style={styles.emptyCardSub}>
                      Support verified farmers by pledging in the AgroVestor tab and earn seasonal returns on harvest sales.
                    </Text>
                    <TouchableOpacity
                      style={styles.emptyActionBtn}
                      onPress={() => setActiveTab('agrovestor')}
                    >
                      <Text style={styles.emptyActionBtnText}>Explore AgroVestor Campaigns</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  myInvestments.map((inv) => {
                    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
                      PLEDGED: { bg: '#FEF3C7', text: '#92400E', label: 'ESCROW PLEDGED' },
                      ESCROW_LOCKED: { bg: '#E0F2FE', text: '#0369A1', label: 'ESCROW LOCKED' },
                      DISBURSED_TO_FARMER: { bg: '#F3E8FF', text: '#6B21A8', label: 'INPUTS PROCURED' },
                      HARVEST_IN_PROGRESS: { bg: '#EEF8F1', text: Colors.cultivated, label: 'HARVEST GROWING' },
                      REPAID: { bg: '#DCFCE7', text: '#15803D', label: 'PAYOUT COMPLETED' },
                      CANCELLED: { bg: '#FEE2E2', text: '#991B1B', label: 'CANCELLED & REFUNDED' },
                    };
                    const badge = statusConfig[inv.status] || { bg: Colors.parchment, text: Colors.espresso, label: inv.status };
                    return (
                      <View key={inv.id} style={styles.investmentCard}>
                        <View style={styles.investmentHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.investmentTitle}>{inv.campaign?.title || inv.campaignTitle || 'Seasonal Harvest Support'}</Text>
                            <Text style={styles.investmentFarmSub}>
                              {inv.campaign?.farm?.name || inv.farmName || 'Verified Producer'} • {new Date(inv.createdAt || inv.investedAt || Date.now()).toLocaleDateString()}
                            </Text>
                          </View>
                          <View style={[styles.loanAppStatusBadge, { backgroundColor: badge.bg }]}>
                            <Text style={[styles.loanAppStatusText, { color: badge.text }]}>{badge.label}</Text>
                          </View>
                        </View>

                        <View style={styles.loanAppSpecsRow}>
                          <View style={styles.loanAppSpecCol}>
                            <Text style={styles.loanAppSpecLabel}>Pledged Capital</Text>
                            <Text style={styles.loanAppSpecVal}>{Number(inv.amount ?? inv.amountInvested ?? 0).toLocaleString()} FCFA</Text>
                          </View>
                          <View style={styles.loanAppSpecCol}>
                            <Text style={styles.loanAppSpecLabel}>Projected Return</Text>
                            <Text style={[styles.loanAppSpecVal, { color: Colors.cultivated }]}>
                              {Number(inv.projectedReturnAmount).toLocaleString()} FCFA
                            </Text>
                          </View>
                          <View style={styles.loanAppSpecCol}>
                            <Text style={styles.loanAppSpecLabel}>Channel</Text>
                            <Text style={styles.loanAppSpecVal}>{inv.paymentMethod.replace('_', ' ')}</Text>
                          </View>
                        </View>

                        <View style={styles.investmentFooter}>
                          <ShieldCheck size={14} color={Colors.cultivated} />
                          <Text style={styles.investmentEscrowTag}>
                            Secured under Engine 3 Smart Escrow Settlement
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

      {/* 5. AGROVESTOR PLEDGE MODAL */}
      <Modal
        visible={investModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInvestModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom + 20, 30) }]}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderTitleGroup}>
                <TrendingUp size={22} color={Colors.cultivated} strokeWidth={2.4} />
                <Text style={styles.modalTitle}>Back Harvest with AgroVestor</Text>
              </View>
              <TouchableOpacity
                onPress={() => setInvestModalVisible(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <X size={20} color={Colors.espresso} />
              </TouchableOpacity>
            </View>

            {selectedCampaign && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Campaign Context Pill */}
                <View style={styles.modalCampSummary}>
                  <Text style={styles.modalCampTitle}>{selectedCampaign.title}</Text>
                  <Text style={styles.modalCampSub}>
                    {selectedCampaign.farm?.name || selectedCampaign.farmName || 'Verified Producer'} • Tier: {selectedCampaign.creditTier} ({selectedCampaign.creditScore} pts)
                  </Text>
                  <View style={styles.modalRoiBadge}>
                    <Text style={styles.modalRoiBadgeText}>
                      +{selectedCampaign.expectedRoiPercent}% Projected Return in {selectedCampaign.durationMonths} Months
                    </Text>
                  </View>
                </View>

                {/* Amount Selection */}
                <Text style={styles.inputLabel}>Investment Pledge Amount (FCFA)</Text>
                <View style={styles.presetChipsRow}>
                  {[25000, 50000, 100000, 250000, 500000].map((preset) => (
                    <TouchableOpacity
                      key={preset}
                      style={[
                        styles.presetChip,
                        pledgeAmount === String(preset) && styles.presetChipActive,
                      ]}
                      onPress={() => setPledgeAmount(String(preset))}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          pledgeAmount === String(preset) && styles.presetChipTextActive,
                        ]}
                      >
                        {preset >= 1000000 ? `${preset / 1000000}M` : `${preset / 1000}k`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={styles.amountInput}
                  value={pledgeAmount}
                  onChangeText={setPledgeAmount}
                  keyboardType="numeric"
                  placeholder="Enter investment amount"
                  placeholderTextColor={Colors.text.muted}
                />

                {/* Multi-Channel Payment Method Selector */}
                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Payment & Escrow Disbursal Channel</Text>
                <View style={styles.paymentCategoryRow}>
                  <TouchableOpacity
                    style={[
                      styles.paymentCatChip,
                      pledgeCategory === 'MOBILE_MONEY' && styles.paymentCatChipActive,
                    ]}
                    onPress={() => setPledgeCategory('MOBILE_MONEY')}
                  >
                    <Smartphone size={15} color={pledgeCategory === 'MOBILE_MONEY' ? Colors.cultivated : Colors.text.secondary} />
                    <Text style={[styles.paymentCatText, pledgeCategory === 'MOBILE_MONEY' && styles.paymentCatTextActive]}>
                      Mobile Money
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.paymentCatChip,
                      pledgeCategory === 'CARD' && styles.paymentCatChipActive,
                    ]}
                    onPress={() => setPledgeCategory('CARD')}
                  >
                    <CreditCard size={15} color={pledgeCategory === 'CARD' ? Colors.cultivated : Colors.text.secondary} />
                    <Text style={[styles.paymentCatText, pledgeCategory === 'CARD' && styles.paymentCatTextActive]}>
                      Card (Visa/MC)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.paymentCatChip,
                      pledgeCategory === 'BANK_TRANSFER' && styles.paymentCatChipActive,
                    ]}
                    onPress={() => setPledgeCategory('BANK_TRANSFER')}
                  >
                    <Building2 size={15} color={pledgeCategory === 'BANK_TRANSFER' ? Colors.cultivated : Colors.text.secondary} />
                    <Text style={[styles.paymentCatText, pledgeCategory === 'BANK_TRANSFER' && styles.paymentCatTextActive]}>
                      Bank Wire
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.paymentCatChip,
                      pledgeCategory === 'AGROWALLET' && styles.paymentCatChipActive,
                    ]}
                    onPress={() => setPledgeCategory('AGROWALLET')}
                  >
                    <Wallet size={15} color={pledgeCategory === 'AGROWALLET' ? Colors.cultivated : Colors.text.secondary} />
                    <Text style={[styles.paymentCatText, pledgeCategory === 'AGROWALLET' && styles.paymentCatTextActive]}>
                      AgroWallet
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Sub-providers for Mobile Money across Africa */}
                {pledgeCategory === 'MOBILE_MONEY' && (
                  <View style={styles.momoProvidersRow}>
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
                          styles.providerChip,
                          pledgeProvider === prov.id && styles.providerChipActive,
                        ]}
                        onPress={() => setPledgeProvider(prov.id)}
                      >
                        <Text
                          style={[
                            styles.providerChipText,
                            pledgeProvider === prov.id && styles.providerChipTextActive,
                          ]}
                        >
                          {prov.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Account / Phone / Reference Input */}
                {pledgeCategory !== 'AGROWALLET' ? (
                  <>
                    <Text style={[styles.inputLabel, { marginTop: 8 }]}>
                      {pledgeCategory === 'MOBILE_MONEY'
                        ? 'Mobile Money Phone Number'
                        : pledgeCategory === 'CARD'
                        ? 'Cardholder Reference / Phone'
                        : 'Bank Account / IBAN Reference'}
                    </Text>
                    <TextInput
                      style={styles.amountInput}
                      value={pledgePhone}
                      onChangeText={setPledgePhone}
                      keyboardType={pledgeCategory === 'MOBILE_MONEY' ? 'phone-pad' : 'default'}
                      placeholder={
                        pledgeCategory === 'MOBILE_MONEY'
                          ? '+254 / +237 / +234 / +225 ...'
                          : pledgeCategory === 'CARD'
                          ? 'Name on card or account ref'
                          : 'Bank name & account or IBAN'
                      }
                      placeholderTextColor={Colors.text.muted}
                    />
                  </>
                ) : (
                  <View style={styles.walletNoticePill}>
                    <Wallet size={16} color={Colors.cultivated} />
                    <Text style={styles.walletNoticeText}>
                      Pledged capital will be reserved directly from your verified in-app AgroWallet.
                    </Text>
                  </View>
                )}

                {/* Projected Return Breakdown */}
                {(() => {
                  const amt = parseFloat(pledgeAmount) || 0;
                  const profit = Math.round(amt * ((selectedCampaign.expectedRoiPercent || 20) / 100));
                  const total = amt + profit;
                  return (
                    <View style={styles.calcSummaryBox}>
                      <Text style={styles.calcSummaryTitle}>Investment Return Projection</Text>
                      <View style={styles.calcRow}>
                        <Text style={styles.calcLabel}>Pledged Capital</Text>
                        <Text style={styles.calcVal}>{amt.toLocaleString()} FCFA</Text>
                      </View>
                      <View style={styles.calcRow}>
                        <Text style={styles.calcLabel}>
                          Projected Gain (+{selectedCampaign.expectedRoiPercent}%)
                        </Text>
                        <Text style={[styles.calcVal, { color: Colors.cultivated }]}>
                          + {profit.toLocaleString()} FCFA
                        </Text>
                      </View>
                      <View style={styles.calcDivider} />
                      <View style={styles.calcRow}>
                        <Text style={styles.calcTotalLabel}>Total Harvest Payout</Text>
                        <Text style={styles.calcTotalVal}>{total.toLocaleString()} FCFA</Text>
                      </View>
                      <View style={styles.repaymentNoticePill}>
                        <ShieldCheck size={16} color={Colors.cultivated} />
                        <Text style={styles.repaymentNoticeText}>
                          Capital is held in Engine 3 Smart Escrow. Funds are released strictly against verified seed, fertilizer, and harvest inspection checkpoints.
                        </Text>
                      </View>
                    </View>
                  );
                })()}

                {/* Action CTA */}
                <TouchableOpacity
                  style={[styles.submitLoanBtn, pledging && { opacity: 0.75 }]}
                  onPress={handlePledgeInvestment}
                  disabled={pledging}
                  activeOpacity={0.85}
                >
                  {pledging ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <TrendingUp size={18} color="#FFFFFF" />
                      <Text style={styles.submitLoanBtnText}>
                        AgroVest {(parseFloat(pledgeAmount) || 0).toLocaleString()} FCFA in Escrow 🚀
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
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
  // AgroVestor Styles
  agrovestorHeroBanner: {
    backgroundColor: Colors.canopy,
    borderRadius: Radii.card,
    padding: 18,
    marginBottom: 20,
    ...Shadows.subtle,
  },
  agrovestorHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  agrovestorHeroTitle: {
    fontFamily: Fonts.displayBold,
    fontSize: 17,
    color: Colors.white,
  },
  agrovestorHeroSubtitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.gold,
    marginTop: 1,
  },
  agrovestorHeroBody: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.parchment,
    lineHeight: 18,
    marginBottom: 16,
  },
  agrovestorHeroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  agrovestorHeroStat: {
    alignItems: 'center',
    flex: 1,
  },
  agrovestorHeroStatVal: {
    fontFamily: Fonts.displayBold,
    fontSize: 16,
    color: Colors.white,
  },
  agrovestorHeroStatLabel: {
    fontFamily: Fonts.body,
    fontSize: 10.5,
    color: Colors.parchment,
    marginTop: 2,
  },
  agrovestorHeroDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  campaignCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  campaignHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  campaignFarmerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  campaignAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF8F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  campaignAvatarText: {
    fontSize: 18,
  },
  campaignFarmerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  campaignFarmName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14.5,
    color: Colors.espresso,
  },
  campaignFarmerLocation: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  campaignTierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  campaignTierText: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    color: '#92400E',
  },
  campaignTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.espresso,
    marginBottom: 4,
  },
  campaignCropTag: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12.5,
    color: Colors.cultivated,
    marginBottom: 6,
  },
  campaignDesc: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  campaignProgressSection: {
    marginBottom: 14,
  },
  campaignProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  campaignFundedText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.canopy,
  },
  campaignTargetText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  campaignProgressTrack: {
    height: 8,
    backgroundColor: Colors.parchmentDim,
    borderRadius: 4,
    overflow: 'hidden',
  },
  campaignProgressFill: {
    height: '100%',
    backgroundColor: Colors.cultivated,
    borderRadius: 4,
  },
  campaignSpecsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.parchment,
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  campaignSpecCol: {
    alignItems: 'center',
    flex: 1,
  },
  campaignSpecLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  campaignSpecVal: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    color: Colors.espresso,
    marginTop: 2,
  },
  investCtaBtn: {
    backgroundColor: Colors.cultivated,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.subtle,
  },
  investCtaBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.white,
  },
  investmentCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  investmentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  investmentTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14.5,
    color: Colors.espresso,
  },
  investmentFarmSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  investmentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  investmentEscrowTag: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: Colors.cultivated,
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '90%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontFamily: Fonts.displayBold,
    fontSize: 18,
    color: Colors.espresso,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCampSummary: {
    backgroundColor: '#EEF8F1',
    borderRadius: Radii.card,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C6E8D0',
  },
  modalCampTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.canopy,
  },
  modalCampSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.espresso,
    marginTop: 2,
  },
  modalRoiBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.cultivated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
  },
  modalRoiBadgeText: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    color: Colors.white,
  },
  paymentCategoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  paymentCatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.parchment,
  },
  paymentCatChipActive: {
    borderColor: Colors.cultivated,
    backgroundColor: '#EEF8F1',
  },
  paymentCatText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  paymentCatTextActive: {
    color: Colors.canopy,
  },
  momoProvidersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  providerChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  providerChipActive: {
    borderColor: Colors.cultivated,
    backgroundColor: '#DCFCE7',
  },
  providerChipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  providerChipTextActive: {
    color: Colors.canopy,
    fontFamily: Fonts.bodyBold,
  },
  walletNoticePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF8F1',
    borderWidth: 1,
    borderColor: '#C6E8D0',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  walletNoticeText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.canopy,
  },
});


