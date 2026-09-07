import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Share2,
  MessageCircle,
  MapPin,
  ShieldCheck,
  Star,
  Layers,
  Sparkles,
  Plus,
  UserPlus,
  UserCheck,
  ShoppingBag,
  Tag,
  Check,
  X,
  Store,
  Package,
} from 'lucide-react-native';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useUIStore } from '@/store/uiStore';
import { fetchFarmByIdApi, createProduceApi } from '../api';
import { toggleFollowUserApi } from '@/components/api/auth';
import YieldCard from '@/components/YieldCard';
import PostCard from '@/components/PostCard';
import FarmerBadge from '@/components/ui/FarmerBadge';
import Basket from '@/components/basket';

const CATEGORIES = [
  { id: 'cat-veg', name: 'Vegetables & Greens' },
  { id: 'cat-roots', name: 'Roots & Tubers' },
  { id: 'cat-fruits', name: 'Fruits' },
  { id: 'cat-poultry', name: 'Poultry & Eggs' },
  { id: 'cat-grains', name: 'Grains & Cereals' },
  { id: 'cat-spices', name: 'Spices & Herbs' },
];

const UNITS = ['KG', 'CRATE', 'BAG_50KG', 'BAG_100KG', 'BUCKET', 'BUNCH', 'NET'];

export default function FarmDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const addToCart = useCartStore((s) => s.addToCart);
  const openCreatePostModal = useUIStore((s) => s.openCreatePostModal);

  const [farm, setFarm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'produce' | 'stories' | 'about'>('produce');
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

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

  const loadFarmData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await fetchFarmByIdApi(id);
      setFarm(data);
      if (data?.id) {
        useUIStore.getState().setActiveFarmId(data.id);
      }
      setIsFollowing(Boolean(data.isFollowingOwner));
    } catch (error) {
      console.error('Failed to load farm details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarmData();
  }, [id]);

  const isOwner = Boolean(
    farm?.isOwner || (user?.id && farm?.userId && user.id === farm.userId)
  );

  const handleToggleFollow = async () => {
    if (!farm?.userId) return;
    try {
      setFollowLoading(true);
      const res = await toggleFollowUserApi(farm.userId);
      setIsFollowing(res.isFollowing);
    } catch (error: any) {
      Alert.alert('Follow Error', error.message || 'Could not toggle follow');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleCreateProduce = async () => {
    if (!produceForm.title.trim() || !produceForm.pricePerUnit || !produceForm.stockQuantity) {
      Alert.alert('Missing Fields', 'Please provide a produce title, price, and stock quantity.');
      return;
    }

    try {
      setSavingProduce(true);
      const categoryObj = CATEGORIES.find((c) => c.name === produceForm.categoryName) || CATEGORIES[0];
      
      await createProduceApi({
        farmId: farm.id,
        categoryId: categoryObj.id,
        title: produceForm.title.trim(),
        description: produceForm.description.trim() || `Freshly harvested ${produceForm.title} from ${farm.name}`,
        originRegion: `${farm.city}, ${farm.region}`,
        pricePerUnit: parseFloat(produceForm.pricePerUnit),
        unit: produceForm.unit,
        stockQuantity: parseFloat(produceForm.stockQuantity),
        isOrganic: produceForm.isOrganic,
        isWholesaleBulkAvailable: produceForm.isWholesaleBulkAvailable,
        bulkMinQuantity: produceForm.bulkMinQuantity ? parseFloat(produceForm.bulkMinQuantity) : undefined,
        bulkPricePerUnit: produceForm.bulkPricePerUnit ? parseFloat(produceForm.bulkPricePerUnit) : undefined,
        mediaUrls: [produceForm.mediaUrl],
      });

      Alert.alert('Harvest Published! 🎉', `${produceForm.title} is now listed in your farm catalog and the global Harvests marketplace.`);
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
      loadFarmData();
    } catch (error: any) {
      Alert.alert('Publish Error', error.message || 'Failed to list produce');
    } finally {
      setSavingProduce(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.cultivated} />
        <Text style={styles.loadingText}>Loading Farm Page...</Text>
      </View>
    );
  }

  if (!farm) {
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <Text style={styles.notFoundTitle}>Farm Page Not Found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const farmYields = farm.yields || [];
  const farmPosts = farm.posts || [];
  const farmOwner = farm.user || {};

  const renderYieldItem = ({ item }: { item: any }) => (
    <YieldCard
      item={item}
      popoverVisible={openPopoverId === item.id}
      onOpenPopover={() => setOpenPopoverId(item.id)}
      onClosePopover={() => setOpenPopoverId(null)}
    />
  );

  return (
    <View style={styles.container}>
      {/* Top Floating Header */}
      <SafeAreaView style={styles.floatingHeaderSafeArea}>
        <View style={styles.floatingHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconCircle}>
            <ArrowLeft size={20} color={Colors.espresso} strokeWidth={2.2} />
          </TouchableOpacity>

          <View style={styles.headerRightBox}>
            {isOwner && (
              <View style={styles.ownerBadgePill}>
                <Sparkles size={13} color={Colors.white} />
                <Text style={styles.ownerBadgePillText}>Owner View</Text>
              </View>
            )}
            <TouchableOpacity style={styles.iconCircle}>
              <Share2 size={18} color={Colors.espresso} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 100, 120) }]}
      >
        {/* Cover Hero Banner */}
        <View style={styles.coverWrapper}>
          <Image
            source={{
              uri:
                farm.coverPhoto ||
                'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800',
            }}
            style={styles.coverImage}
          />
        </View>

        {/* Farm Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <Image
              source={{
                uri:
                  farm.avatarPhoto ||
                  farmOwner.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
              }}
              style={styles.avatar}
            />
            <View style={styles.avatarBadgeCol}>
              <FarmerBadge tier="GOLD" size="md" />
              {farm.isVerified && (
                <View style={styles.verifiedTag}>
                  <ShieldCheck size={13} color={Colors.cultivated} strokeWidth={2.5} />
                  <Text style={styles.verifiedTagText}>Verified Farm Page</Text>
                </View>
              )}
            </View>
          </View>

          <Text style={styles.farmTitle}>{farm.name}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MapPin size={14} color={Colors.text.secondary} />
              <Text style={styles.metaText}>{farm.city}, {farm.region}</Text>
            </View>
            <View style={styles.metaItem}>
              <Layers size={14} color={Colors.soil} />
              <Text style={styles.metaText}>{farm.sizeHectares || 1.0} Hectares</Text>
            </View>
            <View style={styles.metaItem}>
              <Store size={14} color={Colors.gold} />
              <Text style={styles.metaText}>{farm.category || 'CROPS'}</Text>
            </View>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statCol}>
              <Text style={styles.statNumber}>{farmYields.length}</Text>
              <Text style={styles.statLabel}>Direct Yields</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Star size={14} color={Colors.gold} fill={Colors.gold} />
                <Text style={styles.statNumber}>{farm.rating?.toFixed(1) || '5.0'}</Text>
              </View>
              <Text style={styles.statLabel}>Rating ({farm.totalRatings || 0})</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statNumber}>{farmOwner._count?.followers ?? 0}</Text>
              <Text style={styles.statLabel}>Owner Followers</Text>
            </View>
          </View>

          {/* Dynamic Role-Aware Actions */}
          <View style={styles.actionsContainer}>
            {isOwner ? (
              // OWNER WORKSPACE BUTTONS
              <View style={styles.ownerActionsRow}>
                <TouchableOpacity
                  style={styles.addProduceBtn}
                  onPress={() => setShowAddProduceModal(true)}
                  activeOpacity={0.85}
                >
                  <Plus size={18} color={Colors.white} strokeWidth={2.5} />
                  <Text style={styles.addProduceBtnText}>+ Add Harvest Produce</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.postStoryBtn}
                  onPress={openCreatePostModal}
                  activeOpacity={0.85}
                >
                  <Sparkles size={16} color={Colors.cultivated} />
                  <Text style={styles.postStoryBtnText}>Post Story</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // VISITOR / BUYER BUTTONS
              <View style={styles.visitorActionsRow}>
                <TouchableOpacity
                  style={[styles.followBtn, isFollowing && styles.followBtnActive]}
                  onPress={handleToggleFollow}
                  disabled={followLoading}
                  activeOpacity={0.85}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck size={17} color={Colors.cultivated} strokeWidth={2.2} />
                      <Text style={styles.followBtnTextActive}>Following</Text>
                    </>
                  ) : (
                    <>
                      <UserPlus size={17} color={Colors.white} strokeWidth={2.2} />
                      <Text style={styles.followBtnText}>Follow Farmer</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.messageBtn}
                  onPress={() => router.push(`/chat/${farmOwner.id || farm.id}` as any)}
                  activeOpacity={0.85}
                >
                  <MessageCircle size={17} color={Colors.espresso} strokeWidth={2.2} />
                  <Text style={styles.messageBtnText}>Message</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabsWrapper}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'produce' && styles.tabButtonActive]}
            onPress={() => setActiveTab('produce')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'produce' && styles.tabButtonTextActive]}>
              Produce ({farmYields.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'stories' && styles.tabButtonActive]}
            onPress={() => setActiveTab('stories')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'stories' && styles.tabButtonTextActive]}>
              Stories ({farmPosts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'about' && styles.tabButtonActive]}
            onPress={() => setActiveTab('about')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'about' && styles.tabButtonTextActive]}>
              About Farm
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: Produce Catalog */}
        {activeTab === 'produce' && (
          <View style={styles.tabContent}>
            {farmYields.length === 0 ? (
              <View style={styles.emptyBox}>
                <Package size={36} color={Colors.soil} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No Harvests Listed Yet</Text>
                <Text style={styles.emptySubtitle}>
                  {isOwner
                    ? 'Publish your fresh crops or livestock lots to receive direct orders from buyers.'
                    : 'This farm has not published any harvest lots currently available for order.'}
                </Text>
                {isOwner && (
                  <TouchableOpacity
                    style={styles.emptyAddBtn}
                    onPress={() => setShowAddProduceModal(true)}
                  >
                    <Plus size={16} color={Colors.white} />
                    <Text style={styles.emptyAddBtnText}>Add First Produce</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <FlatList
                data={farmYields}
                renderItem={renderYieldItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                scrollEnabled={false}
              />
            )}
          </View>
        )}

        {/* TAB 2: Farm Stories */}
        {activeTab === 'stories' && (
          <View style={styles.tabContent}>
            {farmPosts.length === 0 ? (
              <View style={styles.emptyBox}>
                <Sparkles size={36} color={Colors.gold} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No Stories Posted Yet</Text>
                <Text style={styles.emptySubtitle}>
                  {isOwner
                    ? 'Share harvest photos, soil updates, and field videos directly to the AgroFeed.'
                    : 'Check back soon for field updates and harvest video stories from this farm.'}
                </Text>
                {isOwner && (
                  <TouchableOpacity
                    style={styles.emptyAddBtn}
                    onPress={openCreatePostModal}
                  >
                    <Plus size={16} color={Colors.white} />
                    <Text style={styles.emptyAddBtnText}>Create Harvest Story</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.storiesContainer}>
                {farmPosts.map((post: any) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* TAB 3: About Farm */}
        {activeTab === 'about' && (
          <View style={styles.aboutContainer}>
            <Text style={styles.aboutHeading}>About this Farm Page</Text>
            <Text style={styles.aboutText}>
              {farm.description ||
                `Registered agricultural producer in ${farm.city}, ${farm.region}. Committed to quality, fair trade, and verified direct deliveries.`}
            </Text>

            <Text style={[styles.aboutHeading, { marginTop: 16 }]}>Primary Produce</Text>
            <View style={styles.tagsRow}>
              {(farm.primaryProduce && farm.primaryProduce.length > 0
                ? farm.primaryProduce
                : ['Organic Crops', 'Farm Produce']
              ).map((item: string, idx: number) => (
                <View key={idx} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>{item}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.aboutHeading, { marginTop: 16 }]}>Verified Certifications</Text>
            {(farm.certifications && farm.certifications.length > 0
              ? farm.certifications
              : ['Cameroon GAP Verified', 'Direct Producer Quality Assurance']
            ).map((cert: string, idx: number) => (
              <View key={idx} style={styles.certRow}>
                <ShieldCheck size={16} color={Colors.cultivated} />
                <Text style={styles.certText}>{cert}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* PRODUCE CREATION MODAL (OWNER ONLY) */}
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
              Publish fresh produce attached to <Text style={{ fontFamily: Fonts.bodyBold }}>{farm.name}</Text>. It will immediately appear in the marketplace.
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
                    onChangeText={(t) => setProduceForm((p) => ({ ...p, bulkPricePrice: t }))}
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

      {/* Floating Basket */}
      <Basket />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    gap: 12,
  },
  loadingText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFoundTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
    color: Colors.espresso,
    marginBottom: 16,
  },
  backBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.cultivated,
    borderRadius: Radii.pill,
  },
  backBtnText: {
    fontFamily: Fonts.bodySemiBold,
    color: Colors.white,
    fontSize: 14,
  },
  floatingHeaderSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  floatingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerRightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ownerBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.canopy,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    ...Shadows.subtle,
  },
  ownerBadgePillText: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    color: Colors.white,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  coverWrapper: {
    height: 200,
    backgroundColor: Colors.parchment,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileCard: {
    marginTop: -32,
    marginHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    ...Shadows.subtle,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: Colors.white,
    backgroundColor: Colors.parchment,
  },
  avatarBadgeCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eef8f1',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radii.pill,
  },
  verifiedTagText: {
    fontFamily: Fonts.monoBold,
    fontSize: 10.5,
    color: Colors.cultivated,
  },
  farmTitle: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: Colors.canopy,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12.5,
    color: Colors.text.secondary,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: Colors.parchment,
    borderRadius: Radii.sm,
    marginBottom: 14,
  },
  statCol: {
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: Fonts.monoBold,
    fontSize: 16,
    color: Colors.espresso,
  },
  statLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.parchmentDim,
  },
  actionsContainer: {
    marginTop: 4,
  },
  ownerActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addProduceBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.cultivated,
    paddingVertical: 12,
    borderRadius: Radii.pill,
  },
  addProduceBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13.5,
    color: Colors.white,
  },
  postStoryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#eef8f1',
    borderWidth: 1,
    borderColor: Colors.cultivated,
    paddingVertical: 12,
    borderRadius: Radii.pill,
  },
  postStoryBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.cultivated,
  },
  visitorActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  followBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.cultivated,
    paddingVertical: 12,
    borderRadius: Radii.pill,
  },
  followBtnActive: {
    backgroundColor: '#eef8f1',
    borderWidth: 1.5,
    borderColor: Colors.cultivated,
  },
  followBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13.5,
    color: Colors.white,
  },
  followBtnTextActive: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13.5,
    color: Colors.cultivated,
  },
  messageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.parchment,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    paddingVertical: 12,
    borderRadius: Radii.pill,
  },
  messageBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.espresso,
  },
  tabsWrapper: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
  },
  tabButton: {
    paddingVertical: 10,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: Colors.cultivated,
  },
  tabButtonText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13.5,
    color: Colors.text.secondary,
  },
  tabButtonTextActive: {
    fontFamily: Fonts.bodySemiBold,
    color: Colors.cultivated,
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  storiesContainer: {
    gap: 12,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: Colors.parchment,
    borderRadius: Radii.card,
    marginVertical: 12,
  },
  emptyTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.espresso,
    marginTop: 10,
  },
  emptySubtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.cultivated,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: Radii.pill,
    marginTop: 14,
  },
  emptyAddBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.white,
  },
  aboutContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  aboutHeading: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.espresso,
    marginBottom: 6,
  },
  aboutText: {
    fontFamily: Fonts.body,
    fontSize: 13.5,
    color: Colors.text.secondary,
    lineHeight: 21,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    backgroundColor: Colors.parchment,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radii.chip,
  },
  tagChipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.espresso,
  },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  certText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.soil,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
  },
  modalTitle: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: Colors.canopy,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  modalSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: 16,
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
