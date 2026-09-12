import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  Sprout,
  Video,
  ExternalLink,
  ShieldCheck,
  Star,
  MapPin,
  TrendingUp,
  Package,
  Layers,
  Sparkles,
  ChevronRight,
  X,
  Check,
} from 'lucide-react-native';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import FarmSwitcher from '../components/FarmSwitcher';
import FarmCard from '../components/FarmCard';
import PriceTag from '@/components/ui/PriceTag';
import FarmerBadge from '@/components/ui/FarmerBadge';
import { fetchFarmByIdApi, fetchMyFarmsApi, createProduceApi } from '../api';
import { Farm } from '@/types';

const CATEGORIES = [
  { id: 'cat-veg', name: 'Vegetables & Greens' },
  { id: 'cat-tub', name: 'Tubers & Roots' },
  { id: 'cat-egg', name: 'Poultry & Eggs' },
  { id: 'cat-fru', name: 'Fruits & Citrus' },
  { id: 'cat-spi', name: 'Spices & Herbs' },
  { id: 'cat-cer', name: 'Grains & Cereals' },
];

const UNITS = ['KG', 'CRATE', 'BAG_50KG', 'BAG_100KG', 'BUCKET', 'BUNCH', 'NET'];

export default function FarmManagementScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const openCreatePostModal = useUIStore((s) => s.openCreatePostModal);
  const activeFarmId = useUIStore((s) => s.activeFarmId);
  const setActiveFarmId = useUIStore((s) => s.setActiveFarmId);

  const [farmsList, setFarmsList] = useState<Farm[]>(user?.farms || []);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(
    activeFarmId || (user?.farms && user.farms.length > 0 ? user.farms[0].id : null)
  );
  const [farmData, setFarmData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Fetch user's registered farms from DB
  const loadMyFarms = useCallback(async () => {
    try {
      const data = await fetchMyFarmsApi();
      if (Array.isArray(data) && data.length > 0) {
        setFarmsList(data);
        updateUser({ farms: data });
        if (!selectedFarmId || !data.some((f) => f.id === selectedFarmId)) {
          setSelectedFarmId(data[0].id);
          setActiveFarmId(data[0].id);
        }
      }
    } catch (err) {
      console.warn('Failed to load my farms list:', err);
    }
  }, [selectedFarmId]);

  useEffect(() => {
    loadMyFarms();
  }, []);

  // 2. Fetch active selected farm details & yields whenever selectedFarmId changes
  const loadSelectedFarmDetails = useCallback(async (farmId: string) => {
    if (!farmId) return;
    try {
      setLoading(true);
      const data = await fetchFarmByIdApi(farmId);
      setFarmData(data);
    } catch (err) {
      console.warn('Failed to fetch selected farm details:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFarmId) {
      setActiveFarmId(selectedFarmId);
      loadSelectedFarmDetails(selectedFarmId);
    }
  }, [selectedFarmId, loadSelectedFarmDetails]);

  const handleSelectFarm = (farmId: string) => {
    setSelectedFarmId(farmId);
    setActiveFarmId(farmId);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyFarms();
    if (selectedFarmId) {
      await loadSelectedFarmDetails(selectedFarmId);
    }
    setRefreshing(false);
  };

  const currentFarmInList = farmsList.find((f) => f.id === selectedFarmId) || farmsList[0] || null;
  const activeFarm = farmData || currentFarmInList;
  const farmYields = farmData?.yields || [];

  // Produce Creation Modal State
  const [showAddProduceModal, setShowAddProduceModal] = useState(false);
  const [savingProduce, setSavingProduce] = useState(false);
  const [produceForm, setProduceForm] = useState({
    title: '',
    description: '',
    categoryName: 'Vegetables & Greens',
    pricePerUnit: '',
    unit: 'KG',
    stockQuantity: '',
    isOrganic: true,
    isWholesaleBulkAvailable: false,
    bulkMinQuantity: '',
    bulkPricePerUnit: '',
    mediaUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800',
  });

  const handleCreateProduce = async () => {
    if (!produceForm.title.trim() || !produceForm.pricePerUnit || !produceForm.stockQuantity) {
      Alert.alert('Missing Fields', 'Please provide a produce title, price, and stock quantity.');
      return;
    }

    if (!activeFarm?.id) {
      Alert.alert('Farm Error', 'No active farm selected to attach produce.');
      return;
    }

    try {
      setSavingProduce(true);
      const categoryObj = CATEGORIES.find((c) => c.name === produceForm.categoryName) || CATEGORIES[0];
      
      await createProduceApi({
        farmId: activeFarm.id,
        categoryId: categoryObj.id,
        title: produceForm.title.trim(),
        description: produceForm.description.trim() || `Freshly harvested ${produceForm.title} from ${activeFarm.name}`,
        originRegion: `${activeFarm.city}, ${activeFarm.region}`,
        pricePerUnit: parseFloat(produceForm.pricePerUnit),
        unit: produceForm.unit,
        stockQuantity: parseFloat(produceForm.stockQuantity),
        isOrganic: produceForm.isOrganic,
        isWholesaleBulkAvailable: produceForm.isWholesaleBulkAvailable,
        bulkMinQuantity: produceForm.bulkMinQuantity ? parseFloat(produceForm.bulkMinQuantity) : undefined,
        bulkPricePerUnit: produceForm.bulkPricePerUnit ? parseFloat(produceForm.bulkPricePerUnit) : undefined,
        mediaUrls: [produceForm.mediaUrl],
      });

      Alert.alert('Harvest Published! 🎉', `${produceForm.title} is now listed in your farm catalog and the global marketplace.`);
      setShowAddProduceModal(false);
      setProduceForm({
        title: '',
        description: '',
        categoryName: 'Vegetables & Greens',
        pricePerUnit: '',
        unit: 'KG',
        stockQuantity: '',
        isOrganic: true,
        isWholesaleBulkAvailable: false,
        bulkMinQuantity: '',
        bulkPricePerUnit: '',
        mediaUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800',
      });
      loadSelectedFarmDetails(activeFarm.id);
    } catch (error: any) {
      Alert.alert('Publish Error', error.message || 'Failed to list produce');
    } finally {
      setSavingProduce(false);
    }
  };

  if (!activeFarm && farmsList.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={22} color={Colors.espresso} strokeWidth={2.2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Farm Management</Text>
          <TouchableOpacity
            onPress={() => router.push('/farmer/new')}
            style={styles.addFarmButton}
          >
            <Plus size={18} color={Colors.cultivated} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Sprout size={48} color={Colors.cultivated} />
          <Text style={{ fontFamily: Fonts.displayBold, fontSize: 18, color: Colors.espresso, marginTop: 12 }}>
            No Registered Farm Yet
          </Text>
          <Text style={{ fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.text.secondary, textAlign: 'center', marginTop: 8 }}>
            Create your first farm page to start listing produce and publishing harvest stories.
          </Text>
          <TouchableOpacity
            style={[styles.primaryActionBtn, { marginTop: 20, paddingHorizontal: 24 }]}
            onPress={() => router.push('/farmer/new')}
          >
            <Plus size={18} color={Colors.white} />
            <Text style={styles.primaryActionBtnText}>Register New Farm</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={22} color={Colors.espresso} strokeWidth={2.2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Farm Management</Text>
        <TouchableOpacity
          onPress={() => router.push('/farmer/new')}
          style={styles.addFarmButton}
        >
          <Plus size={18} color={Colors.cultivated} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
        {/* Farm Switcher for Multi-Farm Owners */}
        {farmsList.length > 0 && (
          <FarmSwitcher
            farms={farmsList}
            selectedFarmId={selectedFarmId}
            onSelectFarm={handleSelectFarm}
            onAddFarm={() => router.push('/farmer/new')}
          />
        )}

        {/* Active Farm Banner Card */}
        <View style={styles.activeFarmCard}>
          <Image
            source={{
              uri:
                activeFarm?.coverPhoto ||
                'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800',
            }}
            style={styles.coverImage}
          />
          <View style={styles.farmDetailsOverlay}>
            <View style={styles.tierRow}>
              <FarmerBadge
                tier={user?.farmerProfile?.creditTier || 'GOLD'}
                size="md"
              />
              <View style={styles.verifiedTag}>
                <ShieldCheck size={14} color={Colors.white} strokeWidth={2.5} />
                <Text style={styles.verifiedTagText}>Verified Producer</Text>
              </View>
            </View>

            <Text style={styles.farmTitle}>{activeFarm?.name}</Text>
            <View style={styles.farmLocationRow}>
              <MapPin size={13} color={Colors.parchment} />
              <Text style={styles.farmLocationText}>
                {activeFarm?.city}, {activeFarm?.region}
              </Text>
            </View>
          </View>
        </View>

        {/* Analytics Highlights */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Package size={18} color={Colors.cultivated} />
            <Text style={styles.statValue}>{farmYields.length}</Text>
            <Text style={styles.statLabel}>Active Yields</Text>
          </View>

          <View style={styles.statCard}>
            <Layers size={18} color={Colors.soil} />
            <Text style={styles.statValue}>{activeFarm?.sizeHectares || 3.5} ha</Text>
            <Text style={styles.statLabel}>Cultivated Land</Text>
          </View>

          <View style={styles.statCard}>
            <Star size={18} color={Colors.gold} fill={Colors.gold} />
            <Text style={styles.statValue}>{activeFarm?.rating?.toFixed(1) || '4.9'}</Text>
            <Text style={styles.statLabel}>Buyer Rating</Text>
          </View>

          <View style={styles.statCard}>
            <TrendingUp size={18} color="#7c3aed" />
            <Text style={styles.statValue}>780</Text>
            <Text style={styles.statLabel}>Credit Score</Text>
          </View>
        </View>

        {/* Farm Management Hub Actions */}
        <View style={styles.hubHeaderRow}>
          <Text style={styles.sectionHeader}>Farm Management Actions</Text>
          <View style={styles.workspaceTag}>
            <Text style={styles.workspaceTagText}>WORKSPACE</Text>
          </View>
        </View>

        <View style={styles.hubActionsContainer}>
          {/* Action Row 1: Dual Creation Cards */}
          <View style={styles.hubDualRow}>
            {/* 📦 1. List Harvest Batch */}
            <TouchableOpacity
              style={styles.hubActionCardPrimary}
              onPress={() => setShowAddProduceModal(true)}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="List New Harvest Batch"
            >
              <View style={styles.hubActionIconCirclePrimary}>
                <Package size={22} color={Colors.white} strokeWidth={2.3} />
              </View>
              <Text style={styles.hubActionTitlePrimary}>+ List Harvest Batch</Text>
              <Text style={styles.hubActionSubPrimary}>Add stock, price & units</Text>
            </TouchableOpacity>

            {/* 🎬 2. Record Field Story */}
            <TouchableOpacity
              style={styles.hubActionCardStory}
              onPress={openCreatePostModal}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Record Field Story"
            >
              <View style={styles.hubActionIconCircleStory}>
                <Video size={22} color={Colors.white} strokeWidth={2.2} />
              </View>
              <Text style={styles.hubActionTitleStory}>Record Field Story</Text>
              <Text style={styles.hubActionSubStory}>Publish video reel to AgroFeed</Text>
            </TouchableOpacity>
          </View>

          {/* 📊 3. Credit Score & Escrow Ledger */}
          <TouchableOpacity
            style={styles.hubActionCardLedger}
            onPress={() => router.push('/fintech/loans')}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="View Credit Score & Loan Limits"
          >
            <View style={styles.ledgerCardLeft}>
              <View style={styles.hubActionIconCircleLedger}>
                <TrendingUp size={20} color={Colors.white} strokeWidth={2.4} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.ledgerCardTitle}>Credit Score & Loans 📊</Text>
                  <View style={styles.ledgerBadge}>
                    <Text style={styles.ledgerBadgeText}>{user?.farmerProfile?.creditTier || 'GOLD'}</Text>
                  </View>
                </View>
                <Text style={styles.ledgerCardSub}>
                  View Engine 1 Radar & 10–20% auto-escrow loan limits
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#7c3aed" strokeWidth={2.5} />
          </TouchableOpacity>

          {/* 🏪 4. Buyer Storefront Link */}
          <TouchableOpacity
            style={styles.hubStorefrontLink}
            onPress={() => activeFarm?.id && router.push(`/farmer/${activeFarm.id}` as any)}
            activeOpacity={0.85}
          >
            <ExternalLink size={15} color={Colors.espresso} strokeWidth={2} />
            <Text style={styles.hubStorefrontText}>Preview Public Buyer Storefront →</Text>
          </TouchableOpacity>
        </View>

        {/* Live Farm Produce Catalog Header with + Add Produce Button */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionHeader}>Produce Produced on this Farm</Text>
            <Text style={styles.itemCountText}>{farmYields.length} items listed</Text>
          </View>
          <TouchableOpacity
            style={styles.addProduceHeaderBtn}
            onPress={() => setShowAddProduceModal(true)}
            activeOpacity={0.85}
          >
            <Plus size={14} color={Colors.white} strokeWidth={2.5} />
            <Text style={styles.addProduceHeaderBtnText}>+ Add Produce</Text>
          </TouchableOpacity>
        </View>

        {loading && farmYields.length === 0 ? (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={Colors.cultivated} />
            <Text style={{ marginTop: 8, fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.text.secondary }}>
              Loading farm harvests...
            </Text>
          </View>
        ) : farmYields.length === 0 ? (
          <View style={{ padding: 16, backgroundColor: Colors.surface, borderRadius: Radii.card, alignItems: 'center' }}>
            <Text style={{ fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.text.secondary }}>
              No active produce listed under {activeFarm?.name || 'this farm'} yet.
            </Text>
          </View>
        ) : (
          farmYields.map((yieldItem: any) => (
            <View key={yieldItem.id} style={styles.yieldRow}>
              <Image
                source={{
                  uri:
                    yieldItem.image ||
                    yieldItem.mediaUrls?.[0] ||
                    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500',
                }}
                style={styles.yieldImage}
              />
              <View style={styles.yieldInfo}>
                <Text style={styles.yieldTitle} numberOfLines={1}>
                  {yieldItem.title}
                </Text>
                <Text style={styles.yieldCategory}>
                  {yieldItem.originRegion || 'Organic Harvest'}
                </Text>
                <PriceTag
                  amount={yieldItem.price ?? yieldItem.pricePerUnit ?? 0}
                  unit={yieldItem.unit}
                  size="sm"
                />
              </View>
              <View style={styles.yieldStatusBadge}>
                <Text style={styles.yieldStatusText}>In Stock</Text>
              </View>
            </View>
          ))
        )}

        {/* Registered Farms Portfolio */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Your Farm Portfolio ({farmsList.length})</Text>
        </View>

        {farmsList.map((farm) => (
          <FarmCard
            key={farm.id}
            farm={farm}
            showManageButton={false}
            onPress={() => handleSelectFarm(farm.id)}
          />
        ))}
      </ScrollView>

      {/* PRODUCE CREATION MODAL */}
      <Modal
        visible={showAddProduceModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddProduceModal(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>List Harvest Produce</Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowAddProduceModal(false)}
            >
              <X size={20} color={Colors.espresso} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalSubtitle}>
              Publish fresh produce attached to <Text style={{ fontFamily: Fonts.bodyBold }}>{activeFarm?.name || 'your farm'}</Text>. It will immediately appear in the marketplace.
            </Text>

            {/* Produce Title */}
            <Text style={styles.inputLabel}>Produce Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Fresh Foumbot Vine Tomatoes"
              placeholderTextColor={Colors.text.muted}
              value={produceForm.title}
              onChangeText={(t) => setProduceForm((p) => ({ ...p, title: t }))}
            />

            {/* Category Selector */}
            <Text style={styles.inputLabel}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.choiceChip,
                    produceForm.categoryName === cat.name && styles.choiceChipActive,
                  ]}
                  onPress={() => setProduceForm((p) => ({ ...p, categoryName: cat.name }))}
                >
                  <Text
                    style={[
                      styles.choiceChipText,
                      produceForm.categoryName === cat.name && styles.choiceChipTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Price & Unit Row */}
            <View style={styles.twoColRow}>
              <View style={{ flex: 1.2 }}>
                <Text style={styles.inputLabel}>Price in FCFA *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 1500"
                  placeholderTextColor={Colors.text.muted}
                  keyboardType="numeric"
                  value={produceForm.pricePerUnit}
                  onChangeText={(t) => setProduceForm((p) => ({ ...p, pricePerUnit: t }))}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Unit *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
                  {UNITS.map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[styles.unitChip, produceForm.unit === u && styles.unitChipActive]}
                      onPress={() => setProduceForm((p) => ({ ...p, unit: u }))}
                    >
                      <Text
                        style={[
                          styles.unitChipText,
                          produceForm.unit === u && styles.unitChipTextActive,
                        ]}
                      >
                        {u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Available Stock Quantity */}
            <Text style={styles.inputLabel}>Available Harvest Quantity *</Text>
            <TextInput
              style={styles.textInput}
              placeholder={`e.g. 100 (${produceForm.unit})`}
              placeholderTextColor={Colors.text.muted}
              keyboardType="numeric"
              value={produceForm.stockQuantity}
              onChangeText={(t) => setProduceForm((p) => ({ ...p, stockQuantity: t }))}
            />

            {/* Wholesale Toggle */}
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() =>
                setProduceForm((p) => ({
                  ...p,
                  isWholesaleBulkAvailable: !p.isWholesaleBulkAvailable,
                }))
              }
            >
              <View
                style={[
                  styles.checkbox,
                  produceForm.isWholesaleBulkAvailable && styles.checkboxActive,
                ]}
              >
                {produceForm.isWholesaleBulkAvailable && (
                  <Check size={14} color={Colors.white} strokeWidth={3} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Enable Wholesale / Bulk Pricing</Text>
                <Text style={styles.toggleSubtitle}>Allow Buyam-Sellam & bulk buyers to order large volumes at a discount</Text>
              </View>
            </TouchableOpacity>

            {produceForm.isWholesaleBulkAvailable && (
              <View style={styles.twoColRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Min Bulk Qty</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 10"
                    placeholderTextColor={Colors.text.muted}
                    keyboardType="numeric"
                    value={produceForm.bulkMinQuantity}
                    onChangeText={(t) => setProduceForm((p) => ({ ...p, bulkMinQuantity: t }))}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Bulk Price (FCFA)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 1200"
                    placeholderTextColor={Colors.text.muted}
                    keyboardType="numeric"
                    value={produceForm.bulkPricePerUnit}
                    onChangeText={(t) => setProduceForm((p) => ({ ...p, bulkPricePerUnit: t }))}
                  />
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.modalSubmitBtn, savingProduce && { opacity: 0.7 }]}
              onPress={handleCreateProduce}
              disabled={savingProduce}
            >
              {savingProduce ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Publish to Marketplace</Text>
              )}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.parchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.displayItalic,
    fontSize: 18,
    color: Colors.canopy,
  },
  addFarmButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef8f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  activeFarmCard: {
    borderRadius: Radii.card,
    overflow: 'hidden',
    height: 170,
    position: 'relative',
    marginBottom: 14,
    ...Shadows.subtle,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  farmDetailsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    backgroundColor: 'rgba(23, 58, 32, 0.75)',
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radii.pill,
    gap: 4,
  },
  verifiedTagText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.white,
  },
  farmTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 17,
    color: Colors.white,
    marginBottom: 2,
  },
  farmLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  farmLocationText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.parchment,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.parchment,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    borderRadius: Radii.card,
    padding: 10,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: Fonts.monoBold,
    fontSize: 14,
    color: Colors.espresso,
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  sectionHeader: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.espresso,
    marginVertical: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 8,
  },
  itemCountText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cultivated,
    paddingVertical: 12,
    borderRadius: Radii.pill,
    gap: 8,
  },
  primaryActionBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.white,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.parchment,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    paddingVertical: 12,
    borderRadius: Radii.pill,
    gap: 8,
  },
  secondaryActionBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.espresso,
  },
  yieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    borderRadius: Radii.card,
    padding: 10,
    marginBottom: 10,
    gap: 12,
  },
  yieldImage: {
    width: 60,
    height: 60,
    borderRadius: Radii.sm,
    backgroundColor: Colors.parchment,
  },
  yieldInfo: {
    flex: 1,
  },
  yieldTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.espresso,
    marginBottom: 2,
  },
  yieldCategory: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  yieldStatusBadge: {
    backgroundColor: '#eef8f1',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radii.pill,
  },
  yieldStatusText: {
    fontFamily: Fonts.mono,
    fontSize: 10.5,
    color: Colors.cultivated,
  },

  // Hub Actions Styles
  hubHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
  },
  workspaceTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  workspaceTagText: {
    fontFamily: Fonts.monoBold,
    fontSize: 9.5,
    color: Colors.cultivated,
    letterSpacing: 0.6,
  },
  hubActionsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  hubDualRow: {
    flexDirection: 'row',
    gap: 10,
  },
  hubActionCardPrimary: {
    flex: 1,
    backgroundColor: '#eef8f1',
    borderWidth: 1.5,
    borderColor: Colors.cultivated,
    borderRadius: Radii.card,
    padding: 14,
    ...Shadows.subtle,
  },
  hubActionIconCirclePrimary: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.cultivated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: Colors.cultivated,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  hubActionTitlePrimary: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13.5,
    color: Colors.canopy,
  },
  hubActionSubPrimary: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  hubActionCardStory: {
    flex: 1,
    backgroundColor: '#fef7ee',
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: Radii.card,
    padding: 14,
    ...Shadows.subtle,
  },
  hubActionIconCircleStory: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  hubActionTitleStory: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13.5,
    color: Colors.espresso,
  },
  hubActionSubStory: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  hubActionCardLedger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    borderColor: '#C084FC',
    borderRadius: Radii.card,
    padding: 12,
    ...Shadows.subtle,
  },
  ledgerCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  hubActionIconCircleLedger: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  ledgerCardTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13.5,
    color: '#4C1D95',
  },
  ledgerBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  ledgerBadgeText: {
    fontFamily: Fonts.monoBold,
    fontSize: 9,
    color: '#7C3AED',
  },
  ledgerCardSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  hubStorefrontLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    backgroundColor: Colors.parchment,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  hubStorefrontText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12.5,
    color: Colors.espresso,
  },
  addProduceHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.cultivated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
  },
  addProduceHeaderBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11.5,
    color: Colors.white,
  },

  // Modal Styles
  modalSafeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
  },
  modalTitle: {
    fontFamily: Fonts.displayItalic,
    fontSize: 18,
    color: Colors.canopy,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  inputLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.espresso,
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: Colors.parchment,
    borderRadius: Radii.input,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.espresso,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  choiceChip: {
    backgroundColor: Colors.parchment,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  choiceChipActive: {
    backgroundColor: '#eef8f1',
    borderColor: Colors.cultivated,
  },
  choiceChipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  choiceChipTextActive: {
    fontFamily: Fonts.bodySemiBold,
    color: Colors.cultivated,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  unitScroll: {
    flexDirection: 'row',
  },
  unitChip: {
    backgroundColor: Colors.parchment,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radii.sm,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  unitChipActive: {
    backgroundColor: Colors.canopy,
    borderColor: Colors.canopy,
  },
  unitChipText: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    color: Colors.espresso,
  },
  unitChipTextActive: {
    color: Colors.white,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 16,
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.parchmentDim,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: Colors.cultivated,
    borderColor: Colors.cultivated,
  },
  toggleTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13.5,
    color: Colors.espresso,
  },
  toggleSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  modalSubmitBtn: {
    backgroundColor: Colors.cultivated,
    paddingVertical: 14,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    ...Shadows.subtle,
  },
  modalSubmitBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.white,
  },
});
