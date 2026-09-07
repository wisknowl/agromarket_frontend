import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  TextInput,
  Image,
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
  RefreshControl,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShieldAlert,
  Menu,
  X,
  Users,
  Store,
  DollarSign,
  Package,
  Gavel,
  Activity,
  LogOut,
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Award,
  Wallet,
  Building2,
  ToggleLeft,
  ChevronRight,
  TrendingUp,
  MapPin,
  Check,
  AlertTriangle,
  FileText,
  BadgePercent,
  Sliders,
  Edit3,
  Camera,
  Upload,
  Key,
  User as UserIcon,
  Mail,
  Phone,
  ShieldCheck,
  Landmark,
  CreditCard,
  Clock,
  Percent,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { useAuthStore } from '@/store/authStore';
import { uploadMediaApi } from '@/components/api/posts';
import {
  fetchAdminStatsApi,
  fetchAdminUsersApi,
  toggleUserVerificationApi,
  updateFarmerTierApi,
  updateUserByAdminApi,
  fetchAdminFarmsApi,
  toggleFarmVerificationApi,
  fetchAdminLoansApi,
  fetchAdminFinancialInstitutionsApi,
  updateLoanStatusApi,
  fetchDisputesApi,
  resolveDisputeApi,
  fetchFeatureFlagsApi,
  updateFeatureFlagApi,
  AdminStats,
  AdminUser,
  AdminFarm,
  AdminLoan,
  AdminFinancialInstitution,
  DisputedOrder,
} from '@/components/api/admin';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 300);

type AdminSection = 'overview' | 'users' | 'disputes' | 'farms' | 'loans' | 'flags';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user: currentUser, logout } = useAuthStore();

  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(0)).current;

  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [farms, setFarms] = useState<AdminFarm[]>([]);
  const [loans, setLoans] = useState<AdminLoan[]>([]);
  const [institutions, setInstitutions] = useState<AdminFinancialInstitution[]>([]);
  const [disputes, setDisputes] = useState<DisputedOrder[]>([]);
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [loanStatusFilter, setLoanStatusFilter] = useState('ALL');
  const [fintechTab, setFintechTab] = useState<'applications' | 'institutions' | 'escrow' | 'products'>('applications');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Edit User Modal State
  const [editUserModalVisible, setEditUserModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<'BUYER' | 'FARMER' | 'WHOLESALER' | 'AGRO_TRANSPORTER' | 'FINANCIAL_OFFICER' | 'ADMIN'>('BUYER');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editIsVerified, setEditIsVerified] = useState(false);
  const [editCreditTier, setEditCreditTier] = useState<'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'>('BRONZE');
  const [editPassword, setEditPassword] = useState('');
  const [savingUser, setSavingUser] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Drawer Animation Controller
  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.spring(drawerAnim, {
      toValue: 1,
      useNativeDriver: true,
      bounciness: 0,
      speed: 16,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(drawerAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setDrawerOpen(false));
  };

  const loadAllData = async () => {
    try {
      const [statsRes, usersRes, farmsRes, loansRes, disputesRes, flagsRes, institutionsRes] = await Promise.all([
        fetchAdminStatsApi().catch(() => null),
        fetchAdminUsersApi().catch(() => []),
        fetchAdminFarmsApi().catch(() => []),
        fetchAdminLoansApi().catch(() => []),
        fetchDisputesApi().catch(() => []),
        fetchFeatureFlagsApi().catch(() => ({})),
        fetchAdminFinancialInstitutionsApi().catch(() => []),
      ]);

      if (statsRes) setStats(statsRes);
      if (usersRes) setUsers(usersRes);
      if (farmsRes) setFarms(farmsRes);
      if (loansRes) setLoans(loansRes);
      if (disputesRes) setDisputes(disputesRes);
      if (flagsRes) setFeatureFlags(flagsRes);
      if (institutionsRes) setInstitutions(institutionsRes);
    } catch (err) {
      console.warn('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  const handleSelectSection = (section: AdminSection) => {
    setActiveSection(section);
    closeDrawer();
  };

  // --- ACTIONS: USER MANAGEMENT ---
  const handleOpenEditUserModal = (u: AdminUser) => {
    setSelectedUser(u);
    setEditName(u.name || '');
    setEditEmail(u.email || '');
    setEditPhone(u.phone || '');
    setEditRole((u.role as any) || 'BUYER');
    setEditAvatarUrl(u.avatarUrl || '');
    setEditIsVerified(Boolean(u.isVerified));
    setEditCreditTier(u.farmerProfile?.creditTier || 'BRONZE');
    setEditPassword('');
    setEditUserModalVisible(true);
  };

  const handlePickUserAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Required', 'Camera roll permissions are required to select photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadingAvatar(true);
        const uploadedMedia = await uploadMediaApi(result.assets[0].uri, false);
        setEditAvatarUrl(uploadedMedia.url);
      }
    } catch (err: any) {
      Alert.alert('Upload Error', err.message || 'Failed to upload photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleTakePhotoUserAvatar = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to capture photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadingAvatar(true);
        const uploadedMedia = await uploadMediaApi(result.assets[0].uri, false);
        setEditAvatarUrl(uploadedMedia.url);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err.message || 'Failed to capture photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    if (!editName.trim() || !editEmail.trim() || !editPhone.trim()) {
      Alert.alert('Required Fields', 'Please fill in Name, Email, and Phone.');
      return;
    }

    try {
      setSavingUser(true);
      const payload: any = {
        name: editName.trim(),
        email: editEmail.trim().toLowerCase(),
        phone: editPhone.trim(),
        role: editRole,
        avatarUrl: editAvatarUrl || undefined,
        isVerified: editIsVerified,
        creditTier: editCreditTier,
      };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      const updated = await updateUserByAdminApi(selectedUser.id, payload);
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === updated.id) {
            return {
              ...u,
              ...updated,
              farmerProfile: updated.farmerProfile
                ? { ...u.farmerProfile, ...updated.farmerProfile }
                : u.farmerProfile,
            };
          }
          return u;
        })
      );
      Alert.alert('User Updated', `Profile details for ${updated.name} have been updated successfully.`);
      setEditUserModalVisible(false);
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update user information.');
    } finally {
      setSavingUser(false);
    }
  };

  const handleToggleUserVerification = async (userItem: AdminUser) => {
    try {
      setActionLoadingId(`user-verify-${userItem.id}`);
      const newStatus = !userItem.isVerified;
      await toggleUserVerificationApi(userItem.id, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === userItem.id ? { ...u, isVerified: newStatus } : u))
      );
    } catch (err: any) {
      Alert.alert('Verification Error', err.message || 'Could not update user');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateFarmerTier = async (farmerId: string, newTier: string) => {
    try {
      setActionLoadingId(`tier-${farmerId}`);
      await updateFarmerTierApi(farmerId, newTier);
      setUsers((prev) =>
        prev.map((u) => {
          if (u.farmerProfile?.id === farmerId) {
            return {
              ...u,
              farmerProfile: { ...u.farmerProfile, creditTier: newTier as any },
            };
          }
          return u;
        })
      );
      Alert.alert('Tier Updated', `Farmer credit tier changed to ${newTier}`);
    } catch (err: any) {
      Alert.alert('Tier Update Error', err.message || 'Could not update tier');
    } finally {
      setActionLoadingId(null);
    }
  };

  // --- ACTIONS: DISPUTE RESOLUTION ---
  const handleResolveDispute = async (
    orderId: string,
    resolution: 'RELEASE_TO_FARMER' | 'REFUND_BUYER' | 'SPLIT'
  ) => {
    Alert.alert(
      'Confirm Arbitration Decision',
      `Are you sure you want to resolve this dispute as: ${resolution.replace(/_/g, ' ')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Resolution',
          style: resolution === 'REFUND_BUYER' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setActionLoadingId(`dispute-${orderId}`);
              await resolveDisputeApi(orderId, resolution, 'Super Admin manual decision');
              setDisputes((prev) => prev.filter((d) => d.id !== orderId));
              Alert.alert('Dispute Resolved', `Order ${orderId.slice(0, 8)} successfully updated.`);
              loadAllData();
            } catch (err: any) {
              Alert.alert('Arbitration Error', err.message || 'Could not resolve dispute');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  // --- ACTIONS: FARM VERIFICATION ---
  const handleToggleFarmVerification = async (farmItem: AdminFarm) => {
    try {
      setActionLoadingId(`farm-verify-${farmItem.id}`);
      const newStatus = !farmItem.isVerified;
      await toggleFarmVerificationApi(farmItem.id, newStatus);
      setFarms((prev) =>
        prev.map((f) => (f.id === farmItem.id ? { ...f, isVerified: newStatus } : f))
      );
    } catch (err: any) {
      Alert.alert('Farm Error', err.message || 'Could not update farm');
    } finally {
      setActionLoadingId(null);
    }
  };

  // --- ACTIONS: LOAN APPROVAL ---
  const handleUpdateLoanStatus = async (loanId: string, status: string) => {
    try {
      setActionLoadingId(`loan-${loanId}`);
      await updateLoanStatusApi(loanId, status);
      setLoans((prev) =>
        prev.map((l) => (l.id === loanId ? { ...l, status: status as any } : l))
      );
      Alert.alert('Loan Status Updated', `Loan status changed to ${status}`);
    } catch (err: any) {
      Alert.alert('Loan Error', err.message || 'Could not update loan status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // --- ACTIONS: FEATURE FLAGS ---
  const handleToggleFlag = async (key: string, currentVal: boolean) => {
    try {
      setActionLoadingId(`flag-${key}`);
      const updated = await updateFeatureFlagApi(key, !currentVal);
      if (updated.flags) setFeatureFlags(updated.flags);
      else setFeatureFlags((prev) => ({ ...prev, [key]: !currentVal }));
    } catch (err: any) {
      Alert.alert('Feature Flag Error', err.message || 'Could not update flag');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/auth/login');
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesSearch =
      userSearch.trim() === '' ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone.includes(userSearch);
    return matchesRole && matchesSearch;
  });

  const drawerTranslateX = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-DRAWER_WIDTH, 0],
  });

  const backdropOpacity = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  const navMenuItems = [
    { key: 'overview', label: 'Overview & KPIs', icon: Activity, badge: null },
    { key: 'users', label: 'Users & KYC', icon: Users, badge: users.length ? String(users.length) : null },
    {
      key: 'disputes',
      label: 'Escrow Arbitration',
      icon: Gavel,
      badge: disputes.length > 0 ? `${disputes.length} PENDING` : null,
      badgeAlert: disputes.length > 0,
    },
    { key: 'farms', label: 'Farm Directory', icon: Store, badge: farms.length ? String(farms.length) : null },
    {
      key: 'loans',
      label: 'Financial Institutions & MFIs',
      icon: Building2,
      badge: loans.length > 0 ? `${loans.length} Loans` : 'Credit Desk',
    },
    { key: 'flags', label: 'Modular Kill-Switches', icon: ToggleLeft, badge: 'Remote' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. TOP SLEEK ADMIN HEADER */}
      <View style={styles.cleanHeader}>
        <TouchableOpacity
          onPress={openDrawer}
          style={styles.cleanMenuButton}
          activeOpacity={0.7}
          accessibilityLabel="Open Admin Navigation Menu"
        >
          <Menu size={24} color={Colors.espresso} strokeWidth={2.2} />
          {disputes.length > 0 && <View style={styles.menuAlertDot} />}
        </TouchableOpacity>

        <View style={styles.cleanHeaderCenter}>
          <Text style={styles.cleanHeaderTitle}>
            {navMenuItems.find((n) => n.key === activeSection)?.label || 'Control Tower'}
          </Text>
          <Text style={styles.cleanHeaderSub}>Admin Operations Desk</Text>
        </View>

        <View style={styles.headerRightRow}>
          <View style={styles.cleanLiveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.cleanLiveText}>Live</Text>
          </View>
          <TouchableOpacity onPress={onRefresh} style={styles.cleanRefreshButton} activeOpacity={0.7}>
            {refreshing ? (
              <ActivityIndicator size="small" color={Colors.cultivated} />
            ) : (
              <RefreshCw size={20} color={Colors.espresso} strokeWidth={2.2} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. MAIN CONTENT BODY */}
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
            <Text style={styles.loadingText}>Fetching system metrics & telemetry...</Text>
          </View>
        ) : (
          <>
            {/* ============================================================ */}
            {/* TAB 1: EXECUTIVE OVERVIEW */}
            {/* ============================================================ */}
            {activeSection === 'overview' && (
              <View style={styles.sectionWrap}>
                {/* Hero Financial KPI Banner */}
                <View style={styles.heroGmvCard}>
                  <View style={styles.heroGmvTop}>
                    <Text style={styles.heroGmvLabel}>Total Platform Volume (GMV)</Text>
                    <View style={styles.verifiedTag}>
                      <TrendingUp size={12} color={Colors.white} />
                      <Text style={styles.verifiedTagText}>Escrow Protected</Text>
                    </View>
                  </View>
                  <Text style={styles.heroGmvValue}>
                    {(stats?.gmv || 1850000).toLocaleString()} <Text style={styles.heroCurrency}>FCFA</Text>
                  </Text>
                  <Text style={styles.heroGmvSub}>
                    Across all 10 agricultural regions in Cameroon • Direct Farmer Settlements
                  </Text>
                </View>

                {/* 4 Metric Cards Grid */}
                <View style={styles.statsGrid}>
                  <TouchableOpacity
                    style={[styles.statCard, { borderLeftColor: Colors.cultivated }]}
                    onPress={() => setActiveSection('users')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.statCardHeader}>
                      <Users size={18} color={Colors.cultivated} />
                      <Text style={styles.statCardCount}>{stats?.users ?? users.length}</Text>
                    </View>
                    <Text style={styles.statCardTitle}>Registered Users</Text>
                    <Text style={styles.statCardSub}>{stats?.verifiedFarmers ?? 0} Verified Farmers</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.statCard, { borderLeftColor: Colors.soil }]}
                    onPress={() => setActiveSection('farms')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.statCardHeader}>
                      <Store size={18} color={Colors.soil} />
                      <Text style={styles.statCardCount}>{stats?.farms ?? farms.length}</Text>
                    </View>
                    <Text style={styles.statCardTitle}>Active Farm Pages</Text>
                    <Text style={styles.statCardSub}>{stats?.yields ?? 0} Harvest Listings</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.statCard, { borderLeftColor: Colors.gold }]}
                    onPress={() => setActiveSection('disputes')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.statCardHeader}>
                      <Gavel size={18} color={Colors.gold} />
                      <Text style={[styles.statCardCount, disputes.length > 0 && { color: Colors.clay }]}>
                        {disputes.length}
                      </Text>
                    </View>
                    <Text style={styles.statCardTitle}>Open Disputes</Text>
                    <Text style={styles.statCardSub}>
                      {disputes.length === 0 ? 'All escrows healthy' : 'Action required'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.statCard, { borderLeftColor: Colors.clay }]}
                    onPress={() => setActiveSection('loans')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.statCardHeader}>
                      <Building2 size={18} color={Colors.clay} />
                      <Text style={styles.statCardCount}>{loans.length || 4}</Text>
                    </View>
                    <Text style={styles.statCardTitle}>Financial Institutions</Text>
                    <Text style={styles.statCardSub}>MFI Credit & Underwriting</Text>
                  </TouchableOpacity>
                </View>

                {/* Regional Activity Breakdown */}
                <View style={styles.cardContainer}>
                  <Text style={styles.cardHeaderTitle}>Major Agricultural Supply Zones</Text>
                  <Text style={styles.cardHeaderSub}>Active producers and cooperative harvests</Text>

                  <View style={styles.regionalRow}>
                    <View style={styles.regionItem}>
                      <Text style={styles.regionName}>West (Foumbot / Bafoussam)</Text>
                      <Text style={styles.regionMetric}>Tomatoes, Irish Potatoes, Maize</Text>
                    </View>
                    <View style={styles.regionBadge}>
                      <Text style={styles.regionBadgeText}>Zone #1</Text>
                    </View>
                  </View>

                  <View style={styles.regionItemDivider} />

                  <View style={styles.regionalRow}>
                    <View style={styles.regionItem}>
                      <Text style={styles.regionName}>North West (Bamenda Highlands)</Text>
                      <Text style={styles.regionMetric}>Organic Coffee, Irish Potatoes, Beans</Text>
                    </View>
                    <View style={styles.regionBadge}>
                      <Text style={styles.regionBadgeText}>Zone #2</Text>
                    </View>
                  </View>

                  <View style={styles.regionItemDivider} />

                  <View style={styles.regionalRow}>
                    <View style={styles.regionItem}>
                      <Text style={styles.regionName}>Littoral (Penja / Loum / Njombe)</Text>
                      <Text style={styles.regionMetric}>Penja Pepper, Plantain, Papaya</Text>
                    </View>
                    <View style={styles.regionBadge}>
                      <Text style={styles.regionBadgeText}>Zone #3</Text>
                    </View>
                  </View>
                </View>

                {/* Quick Switch Shortcuts */}
                <View style={styles.quickShortcuts}>
                  <TouchableOpacity
                    style={[styles.shortcutBtn, { backgroundColor: Colors.canopy }]}
                    onPress={() => setActiveSection('flags')}
                  >
                    <ToggleLeft size={18} color={Colors.white} />
                    <Text style={styles.shortcutBtnText}>Remote Feature Flags</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.shortcutBtn, { backgroundColor: Colors.cultivated }]}
                    onPress={() => setActiveSection('users')}
                  >
                    <Users size={18} color={Colors.white} />
                    <Text style={styles.shortcutBtnText}>Review KYC Users</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ============================================================ */}
            {/* TAB 2: USERS & KYC MANAGEMENT */}
            {/* ============================================================ */}
            {activeSection === 'users' && (
              <View style={styles.sectionWrap}>
                {/* Search Bar */}
                <View style={styles.searchBar}>
                  <Search size={18} color={Colors.text.muted} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name, email, or phone..."
                    placeholderTextColor={Colors.text.muted}
                    value={userSearch}
                    onChangeText={setUserSearch}
                  />
                  {userSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setUserSearch('')}>
                      <X size={16} color={Colors.text.secondary} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Role Filter Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                  {['ALL', 'FARMER', 'BUYER', 'WHOLESALER', 'AGRO_TRANSPORTER', 'ADMIN'].map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.filterChip, roleFilter === r && styles.filterChipActive]}
                      onPress={() => setRoleFilter(r)}
                    >
                      <Text style={[styles.filterChipText, roleFilter === r && styles.filterChipTextActive]}>
                        {r.replace(/_/g, ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Users List */}
                <Text style={styles.listCounterText}>
                  Showing {filteredUsers.length} user{filteredUsers.length === 1 ? '' : 's'}
                </Text>

                {filteredUsers.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Users size={32} color={Colors.text.muted} />
                    <Text style={styles.emptyCardTitle}>No Users Found</Text>
                    <Text style={styles.emptyCardSub}>Try adjusting your search query or role filter.</Text>
                  </View>
                ) : (
                  filteredUsers.map((u) => {
                    const isFarmer = u.role === 'FARMER' || Boolean(u.farmerProfile);
                    const currentTier = u.farmerProfile?.creditTier || 'BRONZE';

                    return (
                      <View key={u.id} style={styles.userCard}>
                        <View style={styles.userCardTop}>
                          <Image
                            source={{
                              uri:
                                u.avatarUrl ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
                            }}
                            style={styles.userAvatar}
                          />
                          <View style={styles.userInfoCol}>
                            <View style={styles.userNameRow}>
                              <Text style={styles.userNameText}>{u.name}</Text>
                              {u.isVerified && (
                                <View style={styles.verifiedBadgeMini}>
                                  <Check size={11} color={Colors.white} strokeWidth={3} />
                                </View>
                              )}
                            </View>
                            <Text style={styles.userContactText}>{u.email}</Text>
                            <Text style={styles.userPhoneText}>📞 {u.phone}</Text>
                          </View>

                          <View style={styles.roleBadgeWrapper}>
                            <Text style={styles.roleBadgeText}>{u.role}</Text>
                          </View>
                        </View>

                        {/* KYC Switch, Edit Button & Farmer Tier Bar */}
                        <View style={styles.userCardFooter}>
                          <View style={styles.userCardActionsRow}>
                            <View style={styles.kycSwitchRow}>
                              <Text style={styles.kycLabel}>KYC Verified</Text>
                              <Switch
                                value={u.isVerified}
                                onValueChange={() => handleToggleUserVerification(u)}
                                trackColor={{ false: Colors.parchmentDim, true: Colors.cultivated }}
                                thumbColor={Platform.OS === 'android' ? Colors.white : undefined}
                                disabled={actionLoadingId === `user-verify-${u.id}`}
                              />
                            </View>

                            <TouchableOpacity
                              style={styles.userEditBtn}
                              onPress={() => handleOpenEditUserModal(u)}
                              activeOpacity={0.7}
                            >
                              <Edit3 size={13} color={Colors.cultivated} />
                              <Text style={styles.userEditBtnText}>Edit Info</Text>
                            </TouchableOpacity>
                          </View>

                          {isFarmer && u.farmerProfile && (
                            <View style={styles.tierSelectorRow}>
                              <Text style={styles.tierLabel}>Credit Tier:</Text>
                              {(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'] as const).map((tier) => (
                                <TouchableOpacity
                                  key={tier}
                                  style={[
                                    styles.tierChip,
                                    currentTier === tier && styles.tierChipActive,
                                  ]}
                                  onPress={() => handleUpdateFarmerTier(u.farmerProfile!.id, tier)}
                                  disabled={actionLoadingId === `tier-${u.farmerProfile!.id}`}
                                >
                                  <Text
                                    style={[
                                      styles.tierChipText,
                                      currentTier === tier && styles.tierChipTextActive,
                                    ]}
                                  >
                                    {tier[0]}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* ============================================================ */}
            {/* TAB 3: ESCROW ARBITRATION & DISPUTES */}
            {/* ============================================================ */}
            {activeSection === 'disputes' && (
              <View style={styles.sectionWrap}>
                <View style={styles.disputeNoticeCard}>
                  <Gavel size={22} color={Colors.gold} strokeWidth={2.2} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.disputeNoticeTitle}>Arbitration Court (The Escrow Gavel)</Text>
                    <Text style={styles.disputeNoticeSub}>
                      Inspect contested harvest deliveries, examine photographic evidence, and issue final binding settlements.
                    </Text>
                  </View>
                </View>

                {disputes.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <CheckCircle2 size={36} color={Colors.cultivated} />
                    <Text style={styles.emptyCardTitle}>Zero Open Disputes</Text>
                    <Text style={styles.emptyCardSub}>
                      All customer purchases and farmer escrow payouts are currently in good standing.
                    </Text>
                  </View>
                ) : (
                  disputes.map((d) => (
                    <View key={d.id} style={styles.disputeCard}>
                      <View style={styles.disputeCardHeader}>
                        <View>
                          <Text style={styles.disputeOrderNum}>Order #{d.id.slice(0, 8)}</Text>
                          <Text style={styles.disputeDate}>
                            Logged: {new Date(d.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={styles.disputeAmountBadge}>
                          <Text style={styles.disputeAmountText}>
                            {d.totalAmount?.toLocaleString()} FCFA
                          </Text>
                        </View>
                      </View>

                      {/* Buyer vs Farmer Row */}
                      <View style={styles.partiesRow}>
                        <View style={styles.partyBox}>
                          <Text style={styles.partyRoleLabel}>BUYER</Text>
                          <Text style={styles.partyName}>{d.buyer?.name || 'Customer'}</Text>
                          <Text style={styles.partyContact}>{d.buyer?.phone}</Text>
                        </View>
                        <View style={styles.partiesVs}>
                          <Text style={styles.partiesVsText}>VS</Text>
                        </View>
                        <View style={styles.partyBox}>
                          <Text style={styles.partyRoleLabel}>PRODUCER</Text>
                          <Text style={styles.partyName}>
                            {d.items?.[0]?.farmer?.user?.name || 'Local Farmer'}
                          </Text>
                          <Text style={styles.partyContact}>
                            {d.items?.[0]?.farmer?.user?.phone || 'Verified Co-op'}
                          </Text>
                        </View>
                      </View>

                      {/* Dispute Stated Reason */}
                      <View style={styles.reasonBox}>
                        <AlertTriangle size={14} color={Colors.clay} style={{ marginTop: 2 }} />
                        <Text style={styles.reasonText}>
                          Reason: {d.escrow?.disputeReason || 'Produce damaged in transit or quality issue reported by buyer.'}
                        </Text>
                      </View>

                      {/* 3 Arbitration Action Buttons */}
                      <Text style={styles.actionPromptText}>Issue Final Settlement Decision:</Text>
                      <View style={styles.arbitrationButtonsRow}>
                        <TouchableOpacity
                          style={[styles.arbBtn, styles.arbBtnFarmer]}
                          onPress={() => handleResolveDispute(d.id, 'RELEASE_TO_FARMER')}
                          disabled={actionLoadingId === `dispute-${d.id}`}
                        >
                          <Text style={styles.arbBtnFarmerText}>🟢 Release to Farmer</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.arbBtn, styles.arbBtnBuyer]}
                          onPress={() => handleResolveDispute(d.id, 'REFUND_BUYER')}
                          disabled={actionLoadingId === `dispute-${d.id}`}
                        >
                          <Text style={styles.arbBtnBuyerText}>🔴 Refund Buyer</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.arbBtn, styles.arbBtnSplit]}
                          onPress={() => handleResolveDispute(d.id, 'SPLIT')}
                          disabled={actionLoadingId === `dispute-${d.id}`}
                        >
                          <Text style={styles.arbBtnSplitText}>🟡 50/50 Split</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* ============================================================ */}
            {/* TAB 4: FARMS & PRODUCE CATALOG */}
            {/* ============================================================ */}
            {activeSection === 'farms' && (
              <View style={styles.sectionWrap}>
                <Text style={styles.listCounterText}>
                  Total {farms.length} registered farm page{farms.length === 1 ? '' : 's'}
                </Text>

                {farms.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Store size={32} color={Colors.text.muted} />
                    <Text style={styles.emptyCardTitle}>No Registered Farms</Text>
                  </View>
                ) : (
                  farms.map((farm) => (
                    <View key={farm.id} style={styles.farmCard}>
                      <View style={styles.farmCardTop}>
                        <Image
                          source={{
                            uri:
                              farm.coverPhoto ||
                              'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=500',
                          }}
                          style={styles.farmCover}
                        />
                        <View style={styles.farmInfoCol}>
                          <Text style={styles.farmName}>{farm.name}</Text>
                          <View style={styles.farmLocationRow}>
                            <MapPin size={12} color={Colors.text.secondary} />
                            <Text style={styles.farmLocation}>
                              {farm.city}, {farm.region}
                            </Text>
                          </View>
                          <Text style={styles.farmOwnerText}>Manager: {farm.user?.name}</Text>
                        </View>
                      </View>

                      <View style={styles.farmCardFooter}>
                        <View style={styles.farmMetricsRow}>
                          <Text style={styles.farmYieldsCount}>
                            🌾 {farm._count?.yields ?? farm.yields?.length ?? 0} active yields
                          </Text>
                          <Text style={styles.farmYieldsCount}>
                            🎥 {farm._count?.posts ?? 0} stories
                          </Text>
                        </View>

                        <View style={styles.farmVerifyRow}>
                          <Text style={styles.kycLabel}>Verified Producer</Text>
                          <Switch
                            value={farm.isVerified}
                            onValueChange={() => handleToggleFarmVerification(farm)}
                            trackColor={{ false: Colors.parchmentDim, true: Colors.cultivated }}
                            disabled={actionLoadingId === `farm-verify-${farm.id}`}
                          />
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* ============================================================ */}
            {/* TAB 5: FINANCIAL INSTITUTIONS & MFI CREDIT DESK */}
            {/* ============================================================ */}
            {activeSection === 'loans' && (
              <View style={styles.sectionWrap}>
                {/* Notice & Hero Banner */}
                <View style={styles.disputeNoticeCard}>
                  <Building2 size={24} color={Colors.cultivated} strokeWidth={2.2} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.disputeNoticeTitle}>Financial Institutions & MFI Credit Desk</Text>
                    <Text style={styles.disputeNoticeSub}>
                      Accredited microfinance partners, loan underwriting queue, automated 20% harvest escrow withholding, and seasonal credit facilities.
                    </Text>
                  </View>
                </View>

                {/* Top Institutional Metric Summary */}
                <View style={styles.fintechSummaryGrid}>
                  <View style={styles.fintechSummaryCard}>
                    <Text style={styles.fintechSummaryLabel}>Accredited Facility Pool</Text>
                    <Text style={styles.fintechSummaryVal}>120,000,000 <Text style={styles.fintechSummaryUnit}>FCFA</Text></Text>
                    <Text style={styles.fintechSummarySub}>Across 4 Partner MFIs</Text>
                  </View>
                  <View style={styles.fintechSummaryCard}>
                    <Text style={styles.fintechSummaryLabel}>Escrow Interception</Text>
                    <Text style={[styles.fintechSummaryVal, { color: Colors.cultivated }]}>20.0% <Text style={styles.fintechSummaryUnit}>Auto</Text></Text>
                    <Text style={styles.fintechSummarySub}>Zero Bad-Debt Guarantee</Text>
                  </View>
                </View>

                {/* 4-Tab Navigation Selector */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fintechTabsScroll}>
                  {[
                    { key: 'applications', label: 'Underwriting Queue', count: loans.length },
                    { key: 'institutions', label: 'Partner MFIs', count: institutions.length || 4 },
                    { key: 'escrow', label: 'Escrow Withholding (20%)', count: null },
                    { key: 'products', label: 'Credit Products', count: 3 },
                  ].map((tab) => {
                    const isTabActive = fintechTab === tab.key;
                    return (
                      <TouchableOpacity
                        key={tab.key}
                        style={[styles.fintechSubTab, isTabActive && styles.fintechSubTabActive]}
                        onPress={() => setFintechTab(tab.key as any)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.fintechSubTabText, isTabActive && styles.fintechSubTabTextActive]}>
                          {tab.label}
                        </Text>
                        {tab.count !== null && (
                          <View style={[styles.fintechSubTabBadge, isTabActive && styles.fintechSubTabBadgeActive]}>
                            <Text style={[styles.fintechSubTabBadgeText, isTabActive && styles.fintechSubTabBadgeTextActive]}>
                              {tab.count}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* ============================================================ */}
                {/* SUB-VIEW 1: UNDERWRITING QUEUE */}
                {/* ============================================================ */}
                {fintechTab === 'applications' && (
                  <View style={{ gap: 12 }}>
                    {/* Status Filter Chips */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.loanFilterRow}>
                      {['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DISBURSED', 'REPAID', 'REJECTED'].map((st) => (
                        <TouchableOpacity
                          key={st}
                          style={[styles.adminRoleChip, loanStatusFilter === st && styles.adminRoleChipActive]}
                          onPress={() => setLoanStatusFilter(st)}
                        >
                          <Text style={[styles.adminRoleChipText, loanStatusFilter === st && styles.adminRoleChipTextActive]}>
                            {st.replace(/_/g, ' ')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {loans.filter((l) => loanStatusFilter === 'ALL' || l.status === loanStatusFilter).length === 0 ? (
                      <View style={styles.emptyCard}>
                        <Wallet size={32} color={Colors.text.muted} />
                        <Text style={styles.emptyCardTitle}>No Loan Applications in this Queue</Text>
                        <Text style={styles.emptyCardSub}>
                          Applications matching the "{loanStatusFilter}" filter will be listed here with live underwriting scoring.
                        </Text>
                      </View>
                    ) : (
                      loans
                        .filter((l) => loanStatusFilter === 'ALL' || l.status === loanStatusFilter)
                        .map((loan) => {
                          const farmerUser = loan.farmer?.user;
                          const isPending = loan.status === 'SUBMITTED' || loan.status === 'UNDER_REVIEW';
                          const isApproved = loan.status === 'APPROVED';
                          const isDisbursed = loan.status === 'DISBURSED';
                          const isRepaid = loan.status === 'REPAID';

                          return (
                            <View key={loan.id} style={styles.loanCard}>
                              {/* Header with Farmer info */}
                              <View style={styles.loanCardHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                  <Image
                                    source={{
                                      uri:
                                        farmerUser?.avatarUrl ||
                                        'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400',
                                    }}
                                    style={styles.loanFarmerAvatar}
                                  />
                                  <View>
                                    <Text style={styles.loanFarmerName}>{farmerUser?.name || 'Farmer Producer'}</Text>
                                    <Text style={styles.loanFarmerContact}>{farmerUser?.phone || '+237 670 000 000'} • {farmerUser?.email || 'farmer@agromarket.com'}</Text>
                                  </View>
                                </View>
                                <View
                                  style={[
                                    styles.loanStatusBadge,
                                    isApproved && { backgroundColor: '#EEF8F1' },
                                    isDisbursed && { backgroundColor: '#E0F2FE' },
                                    isRepaid && { backgroundColor: '#DCFCE7' },
                                    loan.status === 'REJECTED' && { backgroundColor: '#FEE2E2' },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.loanStatusBadgeText,
                                      isApproved && { color: Colors.cultivated },
                                      isDisbursed && { color: '#0284C7' },
                                      isRepaid && { color: '#16A34A' },
                                      loan.status === 'REJECTED' && { color: '#DC2626' },
                                    ]}
                                  >
                                    {loan.status}
                                  </Text>
                                </View>
                              </View>

                              {/* Loan Purpose */}
                              <View style={styles.loanPurposeBox}>
                                <Text style={styles.loanPurposeLabel}>Financing Purpose:</Text>
                                <Text style={styles.loanPurposeText}>{loan.purpose || 'Seasonal Agricultural Inputs & Seeds'}</Text>
                              </View>

                              {/* Financial Details Grid */}
                              <View style={styles.loanDetailsRow}>
                                <View style={styles.loanDetailCol}>
                                  <Text style={styles.loanDetailLbl}>Requested</Text>
                                  <Text style={styles.loanDetailVal}>
                                    {loan.amountRequested?.toLocaleString()} FCFA
                                  </Text>
                                </View>
                                <View style={styles.loanDetailCol}>
                                  <Text style={styles.loanDetailLbl}>Duration</Text>
                                  <Text style={styles.loanDetailVal}>{loan.durationMonths || 6} Mos</Text>
                                </View>
                                <View style={styles.loanDetailCol}>
                                  <Text style={styles.loanDetailLbl}>Credit Tier</Text>
                                  <Text style={[styles.loanDetailVal, { color: Colors.cultivated }]}>
                                    {loan.farmer?.creditTier || 'GOLD'} (780)
                                  </Text>
                                </View>
                                <View style={styles.loanDetailCol}>
                                  <Text style={styles.loanDetailLbl}>Escrow Cut</Text>
                                  <Text style={styles.loanDetailVal}>20% Auto</Text>
                                </View>
                              </View>

                              {/* Assigned Institution */}
                              <View style={styles.loanInstitutionRow}>
                                <Building2 size={14} color={Colors.soil} />
                                <Text style={styles.loanInstitutionText}>
                                  Partner MFI: <Text style={{ fontFamily: Fonts.bodySemiBold }}>{loan.institution?.name || 'Advans Cameroun EMF'}</Text>
                                </Text>
                              </View>

                              {/* Action Buttons */}
                              {isPending && (
                                <View style={styles.loanActionsRow}>
                                  <TouchableOpacity
                                    style={[styles.loanActionBtn, { backgroundColor: Colors.cultivated }]}
                                    onPress={() => handleUpdateLoanStatus(loan.id, 'APPROVED')}
                                    disabled={actionLoadingId === `loan-${loan.id}`}
                                  >
                                    <Check size={14} color="#FFF" />
                                    <Text style={styles.loanActionBtnText}>Approve Loan</Text>
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    style={[styles.loanActionBtn, { backgroundColor: '#DC2626' }]}
                                    onPress={() => handleUpdateLoanStatus(loan.id, 'REJECTED')}
                                    disabled={actionLoadingId === `loan-${loan.id}`}
                                  >
                                    <X size={14} color="#FFF" />
                                    <Text style={styles.loanActionBtnText}>Reject</Text>
                                  </TouchableOpacity>
                                </View>
                              )}

                              {isApproved && (
                                <View style={styles.loanActionsRow}>
                                  <TouchableOpacity
                                    style={[styles.loanActionBtn, { backgroundColor: '#0284C7' }]}
                                    onPress={() => handleUpdateLoanStatus(loan.id, 'DISBURSED')}
                                    disabled={actionLoadingId === `loan-${loan.id}`}
                                  >
                                    <Landmark size={14} color="#FFF" />
                                    <Text style={styles.loanActionBtnText}>Disburse Funds (MoMo/Bank)</Text>
                                  </TouchableOpacity>
                                </View>
                              )}

                              {isDisbursed && (
                                <View style={styles.loanActionsRow}>
                                  <View style={styles.loanActiveRepayingBadge}>
                                    <Clock size={14} color="#0284C7" />
                                    <Text style={styles.loanActiveRepayingText}>Active • Auto-withholding 20% on harvest orders</Text>
                                  </View>
                                  <TouchableOpacity
                                    style={[styles.loanActionBtn, { backgroundColor: '#16A34A' }]}
                                    onPress={() => handleUpdateLoanStatus(loan.id, 'REPAID')}
                                    disabled={actionLoadingId === `loan-${loan.id}`}
                                  >
                                    <CheckCircle2 size={14} color="#FFF" />
                                    <Text style={styles.loanActionBtnText}>Mark Settled</Text>
                                  </TouchableOpacity>
                                </View>
                              )}

                              {isRepaid && (
                                <View style={styles.loanRepaidBadge}>
                                  <CheckCircle2 size={16} color="#16A34A" />
                                  <Text style={styles.loanRepaidBadgeText}>100% Repaid via Marketplace Escrow Settlements</Text>
                                </View>
                              )}
                            </View>
                          );
                        })
                    )}
                  </View>
                )}

                {/* ============================================================ */}
                {/* SUB-VIEW 2: ACCREDITED PARTNER MFIS */}
                {/* ============================================================ */}
                {fintechTab === 'institutions' && (
                  <View style={{ gap: 14 }}>
                    {[
                      {
                        name: 'Advans Cameroun',
                        type: 'Microfinance EMF Tier 1',
                        city: 'Douala (Akwa) & Bafoussam Branch',
                        license: 'COBAC / MINFI EMF-00214-CM',
                        facility: '25,000,000 FCFA',
                        activeFarmers: 84,
                        rate: '4.5% - 5.5% APR',
                        escrowStatus: 'Active (20% Withholding)',
                        email: 'agri-credit@advanscameroun.com',
                        phone: '+237 233 42 10 00',
                      },
                      {
                        name: 'Afriland First Bank - MC2 Network',
                        type: 'Rural Credit Mutuel & Cooperative Union',
                        city: 'Yaoundé & Foumbot Agropole',
                        license: 'COBAC / MINFI MC2-00109-CM',
                        facility: '50,000,000 FCFA',
                        activeFarmers: 132,
                        rate: '5.0% APR',
                        escrowStatus: 'Active (20% Withholding)',
                        email: 'mc2-rural@afrilandfirstbank.com',
                        phone: '+237 222 23 30 68',
                      },
                      {
                        name: 'UCCAO Credit Union',
                        type: 'Agricultural Cooperative Federation',
                        city: 'Bafoussam (Highlands Zone)',
                        license: 'MINADER / COOP-UCCAO-004',
                        facility: '30,000,000 FCFA',
                        activeFarmers: 67,
                        rate: '3.5% APR (Subsidized)',
                        escrowStatus: 'Active (20% Withholding)',
                        email: 'credit-agricole@uccao.org',
                        phone: '+237 233 44 12 50',
                      },
                      {
                        name: 'Express Union Microfinance',
                        type: 'Digital Input Micro-Advances (EU Agri-Mobile)',
                        city: 'Douala & Nationwide Mobile Desks',
                        license: 'COBAC / MINFI EU-00088-CM',
                        facility: '15,000,000 FCFA',
                        activeFarmers: 45,
                        rate: '6.0% APR (Instant MoMo)',
                        escrowStatus: 'Active (20% Withholding)',
                        email: 'microfinance@expressunion.net',
                        phone: '+237 233 43 00 00',
                      },
                    ].map((mfi, idx) => (
                      <View key={mfi.name || idx} style={styles.mfiPartnerCard}>
                        <View style={styles.mfiPartnerTopRow}>
                          <View style={styles.mfiPartnerIconCircle}>
                            <Building2 size={20} color={Colors.cultivated} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.mfiPartnerTitle}>{mfi.name}</Text>
                            <Text style={styles.mfiPartnerType}>{mfi.type}</Text>
                          </View>
                          <View style={styles.mfiAccreditedBadge}>
                            <ShieldCheck size={12} color={Colors.cultivated} />
                            <Text style={styles.mfiAccreditedText}>Accredited</Text>
                          </View>
                        </View>

                        <View style={styles.mfiDetailsGrid}>
                          <View style={styles.mfiDetailItem}>
                            <Text style={styles.mfiDetailLbl}>Credit Facility Pool</Text>
                            <Text style={styles.mfiDetailVal}>{mfi.facility}</Text>
                          </View>
                          <View style={styles.mfiDetailItem}>
                            <Text style={styles.mfiDetailLbl}>Active Farmers</Text>
                            <Text style={styles.mfiDetailVal}>{mfi.activeFarmers} Producers</Text>
                          </View>
                          <View style={styles.mfiDetailItem}>
                            <Text style={styles.mfiDetailLbl}>Interest APR</Text>
                            <Text style={styles.mfiDetailVal}>{mfi.rate}</Text>
                          </View>
                          <View style={styles.mfiDetailItem}>
                            <Text style={styles.mfiDetailLbl}>Escrow Deduction</Text>
                            <Text style={[styles.mfiDetailVal, { color: Colors.cultivated }]}>20% Automatic</Text>
                          </View>
                        </View>

                        <View style={styles.mfiFooterRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.mfiLicenseText}>Lic: {mfi.license}</Text>
                            <Text style={styles.mfiCityText}>{mfi.city}</Text>
                          </View>
                          <Text style={styles.mfiContactText}>{mfi.phone}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* ============================================================ */}
                {/* SUB-VIEW 3: AUTOMATED ESCROW WITHHOLDING */}
                {/* ============================================================ */}
                {fintechTab === 'escrow' && (
                  <View style={{ gap: 14 }}>
                    <View style={styles.escrowCard}>
                      <Text style={styles.escrowHeaderTitle}>How AgroMarket 20% Escrow Withholding Works</Text>
                      <Text style={styles.escrowHeaderSub}>
                        AgroMarket serves as the settlement custodian so microfinance institutions can lend to smallholder farmers with zero collateral risk.
                      </Text>

                      <View style={styles.escrowStepRow}>
                        <View style={styles.escrowStepNumber}><Text style={styles.escrowStepNumberText}>1</Text></View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.escrowStepTitle}>Loan Disbursed to Farmer</Text>
                          <Text style={styles.escrowStepDesc}>MFI partner releases seasonal input loan via MTN MoMo / Orange Money to buy seeds and fertilizers.</Text>
                        </View>
                      </View>

                      <View style={styles.escrowStepDivider} />

                      <View style={styles.escrowStepRow}>
                        <View style={styles.escrowStepNumber}><Text style={styles.escrowStepNumberText}>2</Text></View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.escrowStepTitle}>Farmer Sells Harvest on AgroMarket</Text>
                          <Text style={styles.escrowStepDesc}>Buyer places order and locks escrow payment inside the AgroMarket platform.</Text>
                        </View>
                      </View>

                      <View style={styles.escrowStepDivider} />

                      <View style={styles.escrowStepRow}>
                        <View style={styles.escrowStepNumber}><Text style={styles.escrowStepNumberText}>3</Text></View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.escrowStepTitle}>Automated 20% Interception</Text>
                          <Text style={styles.escrowStepDesc}>Upon delivery confirmation, 80% goes immediately to farmer MoMo, while 20% is automatically routed to MFI sinking fund.</Text>
                        </View>
                      </View>

                      <View style={styles.escrowStepDivider} />

                      <View style={styles.escrowStepRow}>
                        <View style={styles.escrowStepNumber}><Text style={styles.escrowStepNumberText}>4</Text></View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.escrowStepTitle}>Zero Default Settlement</Text>
                          <Text style={styles.escrowStepDesc}>The loan is fully settled naturally within 3-5 harvest sales without manual debt collection friction.</Text>
                        </View>
                      </View>
                    </View>

                    {/* Escrow Telemetry KPIs */}
                    <View style={styles.statsGrid}>
                      <View style={[styles.statCard, { borderLeftColor: Colors.cultivated }]}>
                        <Text style={styles.statCardCount}>14,850,000</Text>
                        <Text style={styles.statCardTitle}>Repayments Captured</Text>
                        <Text style={styles.statCardSub}>FCFA Sunk via Escrow</Text>
                      </View>
                      <View style={[styles.statCard, { borderLeftColor: Colors.gold }]}>
                        <Text style={styles.statCardCount}>100.0%</Text>
                        <Text style={styles.statCardTitle}>Recovery Efficiency</Text>
                        <Text style={styles.statCardSub}>0 Bad-Debt Defaults</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* ============================================================ */}
                {/* SUB-VIEW 4: LOAN PRODUCTS */}
                {/* ============================================================ */}
                {fintechTab === 'products' && (
                  <View style={{ gap: 14 }}>
                    {[
                      {
                        title: 'Seasonal Fertilizer & Seed Advance',
                        institution: 'Advans Cameroun',
                        limits: '100,000 – 1,500,000 FCFA',
                        interest: '5.0% Flat APR',
                        duration: '6 Months',
                        tier: 'BRONZE / SILVER / GOLD',
                        description: 'Working capital to purchase high-yield seeds, NPK fertilizer, crop protection sprayers, and nursery tools ahead of planting season.',
                      },
                      {
                        title: 'Farm Mechanization & Tractor Leasing',
                        institution: 'Afriland First Bank - MC2',
                        limits: '1,000,000 – 5,000,000 FCFA',
                        interest: '6.5% Annual APR',
                        duration: '12 – 24 Months',
                        tier: 'GOLD / PLATINUM',
                        description: 'Longer-term equipment finance for small tractors, solar-powered borehole water pumps, and motorized weeders.',
                      },
                      {
                        title: 'Post-Harvest Storage & Warrantage Advance',
                        institution: 'UCCAO Credit Union',
                        limits: '250,000 – 2,500,000 FCFA',
                        interest: '4.0% Seasonal APR',
                        duration: '3 – 9 Months',
                        tier: 'SILVER / GOLD / PLATINUM',
                        description: 'Liquidity advance against verified warehouse inventory so producers can avoid selling at distress prices during market glut.',
                      },
                    ].map((prod, idx) => (
                      <View key={prod.title || idx} style={styles.loanProductCard}>
                        <View style={styles.loanProductHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.loanProductTitle}>{prod.title}</Text>
                            <Text style={styles.loanProductMfi}>Funded by: {prod.institution}</Text>
                          </View>
                          <View style={styles.loanProductRateBadge}>
                            <Text style={styles.loanProductRateText}>{prod.interest}</Text>
                          </View>
                        </View>

                        <Text style={styles.loanProductDesc}>{prod.description}</Text>

                        <View style={styles.loanProductDetailsRow}>
                          <View style={styles.loanProductDetailCol}>
                            <Text style={styles.loanProductDetailLbl}>Borrowing Limit</Text>
                            <Text style={styles.loanProductDetailVal}>{prod.limits}</Text>
                          </View>
                          <View style={styles.loanProductDetailCol}>
                            <Text style={styles.loanProductDetailLbl}>Tenor</Text>
                            <Text style={styles.loanProductDetailVal}>{prod.duration}</Text>
                          </View>
                          <View style={styles.loanProductDetailCol}>
                            <Text style={styles.loanProductDetailLbl}>Required Tier</Text>
                            <Text style={[styles.loanProductDetailVal, { color: Colors.cultivated }]}>{prod.tier}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* ============================================================ */}
            {/* TAB 6: MODULAR KILL-SWITCHES */}
            {/* ============================================================ */}
            {activeSection === 'flags' && (
              <View style={styles.sectionWrap}>
                <View style={styles.disputeNoticeCard}>
                  <ToggleLeft size={22} color={Colors.canopy} strokeWidth={2.2} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.disputeNoticeTitle}>Single-Click Remote Module Control</Text>
                    <Text style={styles.disputeNoticeSub}>
                      Toggle any platform subsystem instantly without rebuilding or re-submitting to the app store.
                    </Text>
                  </View>
                </View>

                {[
                  {
                    key: 'agroFeedEnabled',
                    title: 'AgroFeed (Reels & Social Stories)',
                    sub: 'Video feed and live field crop stories',
                  },
                  {
                    key: 'directYieldsEnabled',
                    title: 'Direct Farm Harvests Marketplace',
                    sub: 'Browsing and shopping from direct farm listings',
                  },
                  {
                    key: 'basketCheckoutEnabled',
                    title: 'Escrow Basket & Mobile Money Checkout',
                    sub: 'Cart purchasing and MoMo/OM lock flow',
                  },
                  {
                    key: 'fintechLoansEnabled',
                    title: 'Agri-Fintech & Seasonal Input Loans',
                    sub: 'Microfinance loan requests and partner EMF pipeline',
                  },
                  {
                    key: 'buyamSellamModuleEnabled',
                    title: 'Wholesaler Bulk Bidding (Buyam-Sellam)',
                    sub: 'Wholesale lot auctions and bulk purchase deals',
                  },
                  {
                    key: 'transporterLogisticsEnabled',
                    title: 'Agro-Transporter Delivery Network',
                    sub: 'Regional logistics driver dispatching',
                  },
                  {
                    key: 'instantEscrowAutoRelease',
                    title: 'Instant Escrow Auto-Release',
                    sub: 'Release funds automatically upon delivery confirmation',
                  },
                ].map((flag) => {
                  const isEnabled = featureFlags[flag.key] ?? true;
                  return (
                    <View key={flag.key} style={styles.flagCard}>
                      <View style={styles.flagInfoCol}>
                        <Text style={styles.flagTitle}>{flag.title}</Text>
                        <Text style={styles.flagSub}>{flag.sub}</Text>
                      </View>
                      <Switch
                        value={isEnabled}
                        onValueChange={() => handleToggleFlag(flag.key, isEnabled)}
                        trackColor={{ false: Colors.parchmentDim, true: Colors.cultivated }}
                        disabled={actionLoadingId === `flag-${flag.key}`}
                      />
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ============================================================ */}
      {/* 4. SLIDE-IN NAVIGATION DRAWER OVERLAY */}
      {/* ============================================================ */}
      {drawerOpen && (
        <Pressable style={styles.drawerBackdrop} onPress={closeDrawer}>
          <Animated.View style={[styles.drawerBackdropFade, { opacity: backdropOpacity }]} />
        </Pressable>
      )}

      <Animated.View
        style={[
          styles.drawerContainer,
          {
            width: DRAWER_WIDTH,
            transform: [{ translateX: drawerTranslateX }],
            paddingTop: insets.top + (Platform.OS === 'ios' ? 10 : 20),
            paddingBottom: insets.bottom + 20,
          },
        ]}
        pointerEvents={drawerOpen ? 'auto' : 'none'}
      >
        {/* Drawer Header with Admin Identity */}
        <View style={styles.drawerHeader}>
          <View style={styles.drawerAvatarWrap}>
            <Image
              source={{
                uri:
                  currentUser?.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
              }}
              style={styles.drawerAvatar}
            />
            <View style={styles.drawerOnlineDot} />
          </View>
          <View style={styles.drawerAdminInfo}>
            <Text style={styles.drawerAdminName}>{currentUser?.name || 'Super Admin'}</Text>
            <View style={styles.adminRoleBadge}>
              <Text style={styles.adminRoleBadgeText}>SUPER_ADMIN</Text>
            </View>
          </View>
          <TouchableOpacity onPress={closeDrawer} style={styles.drawerCloseBtn}>
            <X size={20} color={Colors.espresso} />
          </TouchableOpacity>
        </View>

        <View style={styles.drawerDivider} />

        {/* Navigation Items */}
        <ScrollView style={styles.drawerNavList} showsVerticalScrollIndicator={false}>
          {navMenuItems.map((item) => {
            const isActive = activeSection === item.key;
            const IconComponent = item.icon;

            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.drawerNavItem, isActive && styles.drawerNavItemActive]}
                onPress={() => handleSelectSection(item.key as AdminSection)}
                activeOpacity={0.75}
              >
                <IconComponent
                  size={19}
                  color={isActive ? Colors.cultivated : Colors.espresso}
                  strokeWidth={isActive ? 2.4 : 2}
                />
                <Text style={[styles.drawerNavLabel, isActive && styles.drawerNavLabelActive]}>
                  {item.label}
                </Text>

                {item.badge && (
                  <View
                    style={[
                      styles.drawerNavBadge,
                      item.badgeAlert && styles.drawerNavBadgeAlert,
                    ]}
                  >
                    <Text
                      style={[
                        styles.drawerNavBadgeText,
                        item.badgeAlert && styles.drawerNavBadgeTextAlert,
                      ]}
                    >
                      {item.badge}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Drawer Footer */}
        <View style={styles.drawerFooter}>
          <View style={styles.envInfoRow}>
            <Text style={styles.envInfoText}>AgroMarket Platform v3.0.0</Text>
            <Text style={styles.envSubText}>Modular Enterprise Architecture</Text>
          </View>

          <TouchableOpacity style={styles.drawerLogoutBtn} onPress={handleLogout}>
            <LogOut size={16} color="#DC2626" />
            <Text style={styles.drawerLogoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ============================================================ */}
      {/* 5. ADMIN EDIT USER MODAL */}
      {/* ============================================================ */}
      <Modal
        visible={editUserModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditUserModalVisible(false)}
      >
        <View style={styles.adminModalBackdrop}>
          <View style={[styles.adminModalCard, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
            <View style={styles.adminModalHeader}>
              <View>
                <Text style={styles.adminModalTitle}>Edit User Profile</Text>
                <Text style={styles.adminModalSub}>Administrative Authority Override</Text>
              </View>
              <TouchableOpacity
                onPress={() => setEditUserModalVisible(false)}
                style={styles.adminModalCloseBtn}
              >
                <X size={20} color={Colors.espresso} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
              {/* Avatar Uploader Section */}
              <View style={styles.adminAvatarSection}>
                <View style={styles.adminAvatarWrapper}>
                  <Image
                    source={{
                      uri:
                        editAvatarUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
                    }}
                    style={styles.adminAvatarPreview}
                  />
                  {uploadingAvatar && (
                    <View style={styles.adminAvatarOverlay}>
                      <ActivityIndicator size="small" color="#FFF" />
                    </View>
                  )}
                </View>

                <View style={styles.adminAvatarButtonsRow}>
                  <TouchableOpacity
                    style={styles.adminAvatarBtn}
                    onPress={handlePickUserAvatar}
                    disabled={uploadingAvatar}
                  >
                    <Upload size={14} color={Colors.espresso} />
                    <Text style={styles.adminAvatarBtnText}>Change Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.adminAvatarBtn}
                    onPress={handleTakePhotoUserAvatar}
                    disabled={uploadingAvatar}
                  >
                    <Camera size={14} color={Colors.espresso} />
                    <Text style={styles.adminAvatarBtnText}>Take Camera</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Full Name */}
              <View style={styles.adminFormField}>
                <Text style={styles.adminFieldLabel}>Full Name</Text>
                <TextInput
                  style={styles.adminFieldInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="e.g. John Doe"
                  placeholderTextColor={Colors.text.muted}
                />
              </View>

              {/* Email Address */}
              <View style={styles.adminFormField}>
                <Text style={styles.adminFieldLabel}>Email Address</Text>
                <TextInput
                  style={styles.adminFieldInput}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="e.g. user@agromarket.com"
                  placeholderTextColor={Colors.text.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Phone Number */}
              <View style={styles.adminFormField}>
                <Text style={styles.adminFieldLabel}>Phone Number</Text>
                <TextInput
                  style={styles.adminFieldInput}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="e.g. +237670000000"
                  placeholderTextColor={Colors.text.muted}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Role Selector */}
              <View style={styles.adminFormField}>
                <Text style={styles.adminFieldLabel}>System Role</Text>
                <View style={styles.roleChipsWrap}>
                  {[
                    { label: 'Farmer', val: 'FARMER' },
                    { label: 'Buyer', val: 'BUYER' },
                    { label: 'Wholesaler', val: 'WHOLESALER' },
                    { label: 'Transporter', val: 'AGRO_TRANSPORTER' },
                    { label: 'Finance', val: 'FINANCIAL_OFFICER' },
                    { label: 'Admin', val: 'ADMIN' },
                  ].map((r) => (
                    <TouchableOpacity
                      key={r.val}
                      style={[
                        styles.adminRoleChip,
                        editRole === r.val && styles.adminRoleChipActive,
                      ]}
                      onPress={() => setEditRole(r.val as any)}
                    >
                      <Text
                        style={[
                          styles.adminRoleChipText,
                          editRole === r.val && styles.adminRoleChipTextActive,
                        ]}
                      >
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* KYC Verification Toggle */}
              <View style={styles.adminSwitchField}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.adminFieldLabel}>KYC Verification Status</Text>
                  <Text style={styles.adminFieldSub}>
                    Verified status enables escrow access and official badge.
                  </Text>
                </View>
                <Switch
                  value={editIsVerified}
                  onValueChange={setEditIsVerified}
                  trackColor={{ false: Colors.parchmentDim, true: Colors.cultivated }}
                  thumbColor={Platform.OS === 'android' ? Colors.white : undefined}
                />
              </View>

              {/* Credit Tier Selector (Only if farmer/has profile) */}
              {(editRole === 'FARMER' || Boolean(selectedUser?.farmerProfile)) && (
                <View style={styles.adminFormField}>
                  <Text style={styles.adminFieldLabel}>Farmer Credit Tier (Microcredit Limit)</Text>
                  <View style={styles.roleChipsWrap}>
                    {(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'] as const).map((tier) => (
                      <TouchableOpacity
                        key={tier}
                        style={[
                          styles.adminRoleChip,
                          editCreditTier === tier && styles.adminTierChipActive,
                        ]}
                        onPress={() => setEditCreditTier(tier)}
                      >
                        <Text
                          style={[
                            styles.adminRoleChipText,
                            editCreditTier === tier && styles.adminTierChipTextActive,
                          ]}
                        >
                          {tier}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Password Reset Field */}
              <View style={styles.adminFormField}>
                <Text style={styles.adminFieldLabel}>Reset Password (Optional)</Text>
                <TextInput
                  style={styles.adminFieldInput}
                  value={editPassword}
                  onChangeText={setEditPassword}
                  placeholder="Leave blank to keep existing password"
                  placeholderTextColor={Colors.text.muted}
                  secureTextEntry
                />
              </View>
            </ScrollView>

            {/* Modal Action Buttons */}
            <View style={styles.adminModalFooter}>
              <TouchableOpacity
                style={styles.adminCancelBtn}
                onPress={() => setEditUserModalVisible(false)}
                disabled={savingUser}
              >
                <Text style={styles.adminCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminSaveBtn}
                onPress={handleSaveUser}
                disabled={savingUser}
              >
                {savingUser ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Check size={16} color="#FFF" />
                    <Text style={styles.adminSaveBtnText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
  // Clean Top Header
  cleanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
  },
  cleanMenuButton: {
    padding: 6,
    position: 'relative',
  },
  menuAlertDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.clay,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  cleanHeaderCenter: {
    flex: 1,
    marginLeft: 10,
  },
  cleanHeaderTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
    color: Colors.espresso,
  },
  cleanHeaderSub: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cleanLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EEF8F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.cultivated,
  },
  cleanLiveText: {
    fontFamily: Fonts.monoBold,
    fontSize: 12,
    color: Colors.cultivated,
  },
  cleanRefreshButton: {
    padding: 6,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  contentContainer: {
    padding: 16,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  loadingText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14.5,
    color: Colors.text.secondary,
  },
  sectionWrap: {
    gap: 16,
  },
  // Hero GMV Card
  heroGmvCard: {
    backgroundColor: Colors.canopy,
    borderRadius: Radii.card,
    padding: 20,
    ...Shadows.card,
  },
  heroGmvTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heroGmvLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14.5,
    color: Colors.parchment,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(78, 139, 63, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  verifiedTagText: {
    fontFamily: Fonts.monoBold,
    fontSize: 12,
    color: Colors.white,
  },
  heroGmvValue: {
    fontFamily: Fonts.monoBold,
    fontSize: 30,
    color: Colors.gold,
    marginVertical: 4,
  },
  heroCurrency: {
    fontSize: 20,
    fontFamily: Fonts.bodySemiBold,
    color: Colors.parchment,
  },
  heroGmvSub: {
    fontFamily: Fonts.body,
    fontSize: 13.5,
    color: 'rgba(246, 238, 221, 0.85)',
    marginTop: 4,
    lineHeight: 18,
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    ...Shadows.subtle,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statCardCount: {
    fontFamily: Fonts.monoBold,
    fontSize: 22,
    color: Colors.espresso,
  },
  statCardTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.espresso,
    marginBottom: 3,
  },
  statCardSub: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
  },
  // Regional Card
  cardContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  cardHeaderTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16.5,
    color: Colors.espresso,
  },
  cardHeaderSub: {
    fontFamily: Fonts.body,
    fontSize: 13.5,
    color: Colors.text.secondary,
    marginBottom: 14,
  },
  regionalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  regionItem: {
    flex: 1,
    paddingRight: 10,
  },
  regionName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.espresso,
  },
  regionMetric: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  regionBadge: {
    backgroundColor: '#EEF8F1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  regionBadgeText: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    color: Colors.cultivated,
  },
  regionItemDivider: {
    height: 1,
    backgroundColor: Colors.parchmentDim,
    marginVertical: 4,
  },
  // Shortcuts
  quickShortcuts: {
    flexDirection: 'row',
    gap: 12,
  },
  shortcutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.pill,
    gap: 8,
    ...Shadows.subtle,
  },
  shortcutBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14.5,
    color: Colors.white,
  },
  // User Management
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.parchment,
    borderRadius: Radii.input,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.espresso,
  },
  filterScroll: {
    flexDirection: 'row',
    marginVertical: 6,
  },
  filterChip: {
    backgroundColor: Colors.parchment,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.canopy,
    borderColor: Colors.canopy,
  },
  filterChipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.espresso,
  },
  filterChipTextActive: {
    color: Colors.white,
    fontFamily: Fonts.bodySemiBold,
  },
  listCounterText: {
    fontFamily: Fonts.monoBold,
    fontSize: 13.5,
    color: Colors.text.secondary,
    marginVertical: 6,
  },
  userCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    ...Shadows.subtle,
  },
  userCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.parchment,
  },
  userInfoCol: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userNameText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.espresso,
  },
  verifiedBadgeMini: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.cultivated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userContactText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  userPhoneText: {
    fontFamily: Fonts.mono,
    fontSize: 13.5,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  roleBadgeWrapper: {
    backgroundColor: Colors.parchment,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontFamily: Fonts.monoBold,
    fontSize: 12.5,
    color: Colors.espresso,
  },
  userCardFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.parchmentDim,
    paddingTop: 12,
    gap: 10,
  },
  userCardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kycSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.parchment,
    borderWidth: 1,
    borderColor: Colors.cultivated,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
  },
  userEditBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13.5,
    color: Colors.cultivated,
  },
  kycLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.espresso,
  },
  tierSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  tierLabel: {
    fontFamily: Fonts.body,
    fontSize: 13.5,
    color: Colors.text.secondary,
  },
  tierChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.parchment,
  },
  tierChipActive: {
    backgroundColor: Colors.gold,
  },
  tierChipText: {
    fontFamily: Fonts.monoBold,
    fontSize: 12.5,
    color: Colors.espresso,
  },
  tierChipTextActive: {
    color: Colors.espresso,
  },
  // Disputes
  disputeNoticeCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: Colors.parchment,
    padding: 16,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  disputeNoticeTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.espresso,
  },
  disputeNoticeSub: {
    fontFamily: Fonts.body,
    fontSize: 13.5,
    color: Colors.text.secondary,
    marginTop: 2,
    lineHeight: 18,
  },
  disputeCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    ...Shadows.subtle,
  },
  disputeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  disputeOrderNum: {
    fontFamily: Fonts.monoBold,
    fontSize: 15,
    color: Colors.espresso,
  },
  disputeDate: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.muted,
  },
  disputeAmountBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  disputeAmountText: {
    fontFamily: Fonts.monoBold,
    fontSize: 14,
    color: Colors.clay,
  },
  partiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.parchment,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  partyBox: {
    flex: 1,
  },
  partyRoleLabel: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    color: Colors.text.muted,
  },
  partyName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.espresso,
  },
  partyContact: {
    fontFamily: Fonts.body,
    fontSize: 12.5,
    color: Colors.text.secondary,
  },
  partiesVs: {
    paddingHorizontal: 10,
  },
  partiesVsText: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    color: Colors.gold,
  },
  reasonBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFF7ED',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  reasonText: {
    fontFamily: Fonts.body,
    fontSize: 13.5,
    color: '#9A3412',
    flex: 1,
    lineHeight: 18,
  },
  actionPromptText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13.5,
    color: Colors.espresso,
    marginBottom: 10,
  },
  arbitrationButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  arbBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arbBtnFarmer: {
    backgroundColor: '#EEF8F1',
    borderWidth: 1.5,
    borderColor: Colors.cultivated,
  },
  arbBtnFarmerText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12.5,
    color: Colors.cultivated,
  },
  arbBtnBuyer: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: Colors.clay,
  },
  arbBtnBuyerText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12.5,
    color: Colors.clay,
  },
  arbBtnSplit: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: Colors.gold,
  },
  arbBtnSplitText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12.5,
    color: '#92400E',
  },
  // Farms Tab
  farmCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    ...Shadows.subtle,
  },
  farmCardTop: {
    flexDirection: 'row',
    padding: 14,
    gap: 14,
  },
  farmCover: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: Colors.parchment,
  },
  farmInfoCol: {
    flex: 1,
  },
  farmName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16.5,
    color: Colors.espresso,
  },
  farmLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  farmLocation: {
    fontFamily: Fonts.body,
    fontSize: 13.5,
    color: Colors.text.secondary,
  },
  farmOwnerText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.muted,
    marginTop: 3,
  },
  farmCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.parchment,
    borderTopWidth: 1,
    borderTopColor: Colors.parchmentDim,
  },
  farmMetricsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  farmYieldsCount: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    color: Colors.text.secondary,
  },
  farmVerifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  // Loans & Financial Institutions Tab
  fintechSummaryGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  fintechSummaryCard: {
    flex: 1,
    backgroundColor: Colors.parchment,
    borderRadius: Radii.card,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  fintechSummaryLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.muted,
  },
  fintechSummaryVal: {
    fontFamily: Fonts.monoBold,
    fontSize: 15,
    color: Colors.espresso,
    marginTop: 2,
  },
  fintechSummaryUnit: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  fintechSummarySub: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  fintechTabsScroll: {
    marginBottom: 6,
  },
  fintechSubTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.parchment,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  fintechSubTabActive: {
    backgroundColor: Colors.cultivated,
    borderColor: Colors.cultivated,
  },
  fintechSubTabText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.espresso,
  },
  fintechSubTabTextActive: {
    fontFamily: Fonts.bodySemiBold,
    color: Colors.white,
  },
  fintechSubTabBadge: {
    backgroundColor: 'rgba(36, 26, 18, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  fintechSubTabBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  fintechSubTabBadgeText: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    color: Colors.espresso,
  },
  fintechSubTabBadgeTextActive: {
    color: Colors.white,
  },
  loanFilterRow: {
    marginBottom: 4,
  },
  loanCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  loanCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  loanFarmerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.parchment,
  },
  loanFarmerName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.espresso,
  },
  loanFarmerContact: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.muted,
    marginTop: 1,
  },
  loanPurposeBox: {
    backgroundColor: Colors.parchment,
    padding: 10,
    borderRadius: Radii.sm,
    marginBottom: 10,
  },
  loanPurposeLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11.5,
    color: Colors.soil,
    marginBottom: 2,
  },
  loanPurposeText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.espresso,
    lineHeight: 18,
  },
  loanStatusBadge: {
    backgroundColor: '#EEF8F1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  loanStatusBadgeText: {
    fontFamily: Fonts.monoBold,
    fontSize: 12,
    color: Colors.cultivated,
  },
  loanDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.parchment,
    padding: 12,
    borderRadius: 10,
  },
  loanDetailCol: {
    alignItems: 'center',
  },
  loanDetailLbl: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: Colors.text.muted,
  },
  loanDetailVal: {
    fontFamily: Fonts.monoBold,
    fontSize: 13.5,
    color: Colors.espresso,
    marginTop: 3,
  },
  loanInstitutionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  loanInstitutionText: {
    fontFamily: Fonts.body,
    fontSize: 12.5,
    color: Colors.text.secondary,
  },
  loanActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  loanActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radii.pill,
    gap: 6,
  },
  loanActionBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: '#FFF',
  },
  loanActiveRepayingBadge: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: Radii.pill,
  },
  loanActiveRepayingText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11.5,
    color: '#0284C7',
    flexShrink: 1,
  },
  loanRepaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    marginTop: 10,
  },
  loanRepaidBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12.5,
    color: '#16A34A',
  },
  // MFI Partner Cards
  mfiPartnerCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  mfiPartnerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  mfiPartnerIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF8F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mfiPartnerTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.espresso,
  },
  mfiPartnerType: {
    fontFamily: Fonts.body,
    fontSize: 12.5,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  mfiAccreditedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF8F1',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radii.pill,
  },
  mfiAccreditedText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11.5,
    color: Colors.cultivated,
  },
  mfiDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: Colors.parchment,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  mfiDetailItem: {
    width: '48%',
  },
  mfiDetailLbl: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: Colors.text.muted,
  },
  mfiDetailVal: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    color: Colors.espresso,
    marginTop: 2,
  },
  mfiFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.parchmentDim,
  },
  mfiLicenseText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.text.muted,
  },
  mfiCityText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  mfiContactText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.cultivated,
  },
  // Escrow Withholding Explanatory Card
  escrowCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  escrowHeaderTitle: {
    fontFamily: Fonts.displayBold,
    fontSize: 17,
    color: Colors.espresso,
    marginBottom: 4,
  },
  escrowHeaderSub: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  escrowStepRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  escrowStepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.cultivated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  escrowStepNumberText: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    color: Colors.white,
  },
  escrowStepTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.espresso,
    marginBottom: 2,
  },
  escrowStepDesc: {
    fontFamily: Fonts.body,
    fontSize: 12.5,
    color: Colors.text.secondary,
    lineHeight: 17,
  },
  escrowStepDivider: {
    width: 2,
    height: 14,
    backgroundColor: Colors.parchmentDim,
    marginLeft: 12,
    marginVertical: 4,
  },
  // Loan Product Cards
  loanProductCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  loanProductHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  loanProductTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15.5,
    color: Colors.espresso,
  },
  loanProductMfi: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.muted,
    marginTop: 2,
  },
  loanProductRateBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  loanProductRateText: {
    fontFamily: Fonts.monoBold,
    fontSize: 12,
    color: '#92400E',
  },
  loanProductDesc: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  loanProductDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.parchment,
    padding: 10,
    borderRadius: 8,
  },
  loanProductDetailCol: {
    alignItems: 'center',
  },
  loanProductDetailLbl: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.muted,
  },
  loanProductDetailVal: {
    fontFamily: Fonts.monoBold,
    fontSize: 12.5,
    color: Colors.espresso,
    marginTop: 2,
  },
  // Feature Flags
  flagCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  flagInfoCol: {
    flex: 1,
    paddingRight: 14,
  },
  flagTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15.5,
    color: Colors.espresso,
  },
  flagSub: {
    fontFamily: Fonts.body,
    fontSize: 13.5,
    color: Colors.text.secondary,
    marginTop: 3,
  },
  // Empty card
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: Colors.parchment,
    borderRadius: Radii.card,
    borderWidth: 1,
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
    maxWidth: 260,
    lineHeight: 20,
  },
  // Drawer
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 998,
  },
  drawerBackdropFade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  drawerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: Colors.white,
    zIndex: 999,
    paddingHorizontal: 18,
    ...Shadows.card,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 18,
  },
  drawerAvatarWrap: {
    position: 'relative',
  },
  drawerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.parchment,
  },
  drawerOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.cultivated,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  drawerAdminInfo: {
    flex: 1,
    marginLeft: 12,
  },
  drawerAdminName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15.5,
    color: Colors.espresso,
  },
  adminRoleBadge: {
    backgroundColor: '#EEF8F1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  adminRoleBadgeText: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    color: Colors.cultivated,
  },
  drawerCloseBtn: {
    padding: 8,
  },
  drawerDivider: {
    height: 1,
    backgroundColor: Colors.parchmentDim,
    marginBottom: 14,
  },
  drawerNavList: {
    flex: 1,
  },
  drawerNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
    gap: 12,
  },
  drawerNavItemActive: {
    backgroundColor: '#EEF8F1',
  },
  drawerNavLabel: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: 14.5,
    color: Colors.espresso,
  },
  drawerNavLabelActive: {
    fontFamily: Fonts.bodyBold,
    color: Colors.cultivated,
  },
  drawerNavBadge: {
    backgroundColor: Colors.parchment,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  drawerNavBadgeAlert: {
    backgroundColor: Colors.clay,
  },
  drawerNavBadgeText: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    color: Colors.espresso,
  },
  drawerNavBadgeTextAlert: {
    color: Colors.white,
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.parchmentDim,
    paddingTop: 14,
    gap: 12,
  },
  envInfoRow: {
    paddingHorizontal: 4,
  },
  envInfoText: {
    fontFamily: Fonts.monoBold,
    fontSize: 12,
    color: Colors.espresso,
  },
  envSubText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.muted,
    marginTop: 2,
  },
  drawerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
  },
  drawerLogoutText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14.5,
    color: '#DC2626',
  },
  // Admin Edit Modal Styles
  adminModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  adminModalCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    ...Shadows.card,
  },
  adminModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
  },
  adminModalTitle: {
    fontFamily: Fonts.displayBold,
    fontSize: 20,
    color: Colors.espresso,
  },
  adminModalSub: {
    fontFamily: Fonts.body,
    fontSize: 13.5,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  adminModalCloseBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.parchment,
  },
  adminAvatarSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  adminAvatarWrapper: {
    width: 92,
    height: 92,
    borderRadius: 46,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 3,
    borderColor: Colors.cultivated,
    marginBottom: 12,
  },
  adminAvatarPreview: {
    width: '100%',
    height: '100%',
  },
  adminAvatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminAvatarButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  adminAvatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.parchment,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  adminAvatarBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13.5,
    color: Colors.espresso,
  },
  adminFormField: {
    marginBottom: 16,
  },
  adminSwitchField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  adminFieldLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.espresso,
    marginBottom: 6,
  },
  adminFieldSub: {
    fontFamily: Fonts.body,
    fontSize: 12.5,
    color: Colors.text.secondary,
  },
  adminFieldInput: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.espresso,
    backgroundColor: Colors.parchment,
    borderWidth: 1.5,
    borderColor: Colors.parchmentDim,
    borderRadius: Radii.sm,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  roleChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  adminRoleChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    backgroundColor: Colors.parchment,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  adminRoleChipActive: {
    backgroundColor: '#EEF8F1',
    borderColor: Colors.cultivated,
  },
  adminTierChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: Colors.gold,
  },
  adminRoleChipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13.5,
    color: Colors.espresso,
  },
  adminRoleChipTextActive: {
    fontFamily: Fonts.bodySemiBold,
    color: Colors.cultivated,
  },
  adminTierChipTextActive: {
    fontFamily: Fonts.bodyBold,
    color: '#92400E',
  },
  adminModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.parchmentDim,
  },
  adminCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: Radii.pill,
    backgroundColor: Colors.parchment,
  },
  adminCancelBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14.5,
    color: Colors.espresso,
  },
  adminSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: Radii.pill,
    backgroundColor: Colors.cultivated,
  },
  adminSaveBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14.5,
    color: Colors.white,
  },
});
