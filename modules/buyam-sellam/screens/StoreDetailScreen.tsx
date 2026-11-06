import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Share,
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
  Package,
  Store,
  Warehouse,
  Snowflake,
  ExternalLink,
  Settings,
} from 'lucide-react-native';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { useAuthStore } from '@/store/authStore';
import { fetchStoreByIdApi } from '@/components/api/wholesaler';
import YieldCard from '@/components/YieldCard';
import { resolveMediaUrl, formatXaf } from '@/utils/media';

export default function StoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'sites' | 'about'>('inventory');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchStoreByIdApi(id)
      .then((data) => {
        setStore(data);
      })
      .catch(() => {
        setStore(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const isOwner = Boolean(
    store?.isOwner || (user?.id && store?.userId && user.id === store.userId)
  );

  const handleShare = async () => {
    try {
      await Share.share({
        title: store?.name || 'AgroStore Depot',
        message: `Check out ${store?.name || 'this AgroStore'} on Agrom: https://agrom.market/store/${store?.slug || id}`,
      });
    } catch {
      // share cancelled
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading AgroStore Profile...</Text>
      </SafeAreaView>
    );
  }

  if (!store) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Store size={48} color={Colors.accent} />
        <Text style={styles.notFoundTitle}>Store Depot Not Found</Text>
        <Text style={styles.notFoundSubtitle}>
          The store or commercial depot you are looking for does not exist.
        </Text>
        <TouchableOpacity style={styles.returnBtn} onPress={() => router.back()}>
          <Text style={styles.returnBtnText}>← Return to Marketplace</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const storeYields = (store.yields || []).map((y: any) => ({
    ...y,
    price: Number(y.price !== undefined ? y.price : (y.pricePerUnit || 0)),
    pricePerUnit: Number(y.pricePerUnit !== undefined ? y.pricePerUnit : (y.price || 0)),
    image: resolveMediaUrl(y.image || y.mediaUrls?.[0]) || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800',
  }));

  const sitesList: any[] = Array.isArray(store.sites) ? store.sites : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {store.name}
        </Text>
        <View style={styles.headerRight}>
          {isOwner && (
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/agro-store')}>
              <Settings size={18} color={Colors.accent} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
            <Share2 size={18} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Cover */}
        <View style={styles.bannerContainer}>
          <Image
            source={{
              uri: resolveMediaUrl(store.coverPhoto || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1000'),
            }}
            style={styles.coverImage}
          />
          <View style={styles.bannerOverlay} />
          <View style={styles.bannerInfo}>
            <Text style={styles.storeName}>{store.name}</Text>
            <View style={styles.locationRow}>
              <MapPin size={13} color="#E2A63C" />
              <Text style={styles.locationText}>
                {store.marketZone ? `${store.marketZone}, ` : ''}{store.city}, {store.region}
              </Text>
            </View>
          </View>
        </View>

        {/* Linked Farm Banner */}
        {store.linkedFarm && (
          <TouchableOpacity
            style={styles.linkedFarmCard}
            onPress={() => router.push(`/farmer/${store.linkedFarm.slug || store.linkedFarm.id}`)}
          >
            <Warehouse size={18} color={Colors.primary} />
            <View style={styles.linkedFarmInfo}>
              <Text style={styles.linkedFarmTag}>DIRECT COOPERATIVE LINK</Text>
              <Text style={styles.linkedFarmTitle}>Aggregated from {store.linkedFarm.name}</Text>
            </View>
            <ExternalLink size={14} color={Colors.primary} />
          </TouchableOpacity>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Storage</Text>
            <Text style={styles.statVal}>{store.storageCapacityTons || 5} T</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Cooling</Text>
            <Text style={styles.statVal}>{store.hasColdStorage ? 'Cold ❄️' : 'Ambient'}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Lots</Text>
            <Text style={styles.statVal}>{storeYields.length}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Rating</Text>
            <Text style={styles.statVal}>5.0 ★</Text>
          </View>
        </View>

        {/* Tabs Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'inventory' && styles.tabItemActive]}
            onPress={() => setActiveTab('inventory')}
          >
            <Text style={[styles.tabText, activeTab === 'inventory' && styles.tabTextActive]}>
              Lots ({storeYields.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'sites' && styles.tabItemActive]}
            onPress={() => setActiveTab('sites')}
          >
            <Text style={[styles.tabText, activeTab === 'sites' && styles.tabTextActive]}>
              Depot Hubs ({sitesList.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'about' && styles.tabItemActive]}
            onPress={() => setActiveTab('about')}
          >
            <Text style={[styles.tabText, activeTab === 'about' && styles.tabTextActive]}>
              About
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'inventory' && (
          <View style={styles.tabContent}>
            {storeYields.length === 0 ? (
              <View style={styles.emptyCard}>
                <Package size={36} color={Colors.accent} />
                <Text style={styles.emptyTitle}>No Produce Stocked Yet</Text>
                <Text style={styles.emptySubtitle}>
                  This depot has not listed active wholesale lots yet.
                </Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {storeYields.map((y: any) => (
                  <YieldCard key={y.id} yieldItem={y} />
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'sites' && (
          <View style={styles.tabContent}>
            {sitesList.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptySubtitle}>No separate sheds registered. Operations run from the main market zone.</Text>
              </View>
            ) : (
              sitesList.map((site: any, idx: number) => (
                <View key={site.id || idx} style={styles.siteCard}>
                  <View style={styles.siteHeader}>
                    <Text style={styles.siteName}>{site.name || `Shed #${idx + 1}`}</Text>
                    <Text style={styles.siteType}>{site.facilityType || 'AMBIENT'}</Text>
                  </View>
                  <Text style={styles.siteDetail}>📍 {site.location || store.city}</Text>
                  <Text style={styles.siteDetail}>📦 Capacity: {site.capacityTons || 2.5} Tons</Text>
                  {site.operatingHours && (
                    <Text style={styles.siteDetail}>🕒 {site.operatingHours}</Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'about' && (
          <View style={styles.tabContent}>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>About This Depot</Text>
              <Text style={styles.infoDesc}>
                {store.description || 'Verified commercial agricultural depot hub for bulk aggregation and sales.'}
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Location & Pickup Point</Text>
              <Text style={styles.infoDetail}>Market Zone: {store.marketZone || 'Central Market'}</Text>
              <Text style={styles.infoDetail}>City: {store.city}, {store.region}</Text>
              {store.address && <Text style={styles.infoDetail}>Address: {store.address}</Text>}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: Fonts.body,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 12,
  },
  notFoundSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  returnBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radii.full,
    backgroundColor: Colors.accent,
  },
  returnBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2DCAA',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginHorizontal: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF9EE',
    borderWidth: 1,
    borderColor: '#F2DCAA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  bannerContainer: {
    height: 180,
    position: 'relative',
    backgroundColor: '#241A12',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  bannerInfo: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
  },
  storeName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#FFF9EE',
  },
  linkedFarmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF8F1',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#CCEBD5',
    gap: 10,
  },
  linkedFarmInfo: {
    flex: 1,
  },
  linkedFarmTag: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  linkedFarmTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#FFF9EE',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#F2DCAA',
    padding: 10,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  statVal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F2DCAA',
    marginHorizontal: 16,
    marginTop: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Colors.accent,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.text,
    fontWeight: '700',
  },
  tabContent: {
    padding: 16,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#FFF9EE',
    padding: 24,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: '#F2DCAA',
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  grid: {
    gap: 12,
  },
  siteCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F2DCAA',
    borderRadius: Radii.lg,
    padding: 12,
    marginBottom: 10,
  },
  siteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  siteName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  siteType: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accent,
    backgroundColor: '#FFF9EE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.sm,
  },
  siteDetail: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F2DCAA',
    borderRadius: Radii.lg,
    padding: 14,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  infoDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  infoDetail: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
});

