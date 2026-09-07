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
} from 'lucide-react-native';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import FarmSwitcher from '../components/FarmSwitcher';
import FarmCard from '../components/FarmCard';
import PriceTag from '@/components/ui/PriceTag';
import FarmerBadge from '@/components/ui/FarmerBadge';
import { fetchFarmByIdApi, fetchMyFarmsApi } from '../api';
import { Farm } from '@/types';

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

        {/* Quick Actions Bar */}
        <Text style={styles.sectionHeader}>Farm Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={openCreatePostModal}
          >
            <Video size={18} color={Colors.white} strokeWidth={2.2} />
            <Text style={styles.primaryActionBtnText}>Post Story</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionBtn}
            onPress={() => activeFarm?.id && router.push(`/farmer/${activeFarm.id}` as any)}
          >
            <ExternalLink size={16} color={Colors.espresso} strokeWidth={2.2} />
            <Text style={styles.secondaryActionBtnText}>Storefront</Text>
          </TouchableOpacity>
        </View>

        {/* Live Farm Produce Catalog */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Produce Produced on this Farm</Text>
          <Text style={styles.itemCountText}>{farmYields.length} items</Text>
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
});
