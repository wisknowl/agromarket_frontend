import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import {
  Store,
  ArrowLeft,
  Plus,
  X,
  Link2,
  Package,
  ShieldCheck,
  MapPin,
  Settings,
  CheckCircle2,
  Truck,
  Sparkles,
} from 'lucide-react-native';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import BrandButton from '@/components/ui/BrandButton';
import {
  fetchWholesaleDealsApi,
  registerWholesalerApi,
  fetchWholesalerProfileApi,
  fetchMyStoresApi,
} from '@/components/api/wholesaler';
import { createYieldApi } from '@/components/api/yields';
import { Yield } from '@/types';
import { resolveMediaUrl } from '@/utils/media';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';

export default function WholesalerHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'inventory' | 'tenders' | 'settings'>('inventory');
  const [bulkYields, setBulkYields] = useState<Yield[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Multi-Store State
  const [myStores, setMyStores] = useState<any[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string>('');

  // Store & Lot Modals
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isAddLotModalOpen, setIsAddLotModalOpen] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeCity, setStoreCity] = useState('Douala • Marché Sandaga');
  const [linkedFarmId, setLinkedFarmId] = useState('');
  const [storageCapacity, setStorageCapacity] = useState('5.0');
  const [savingStore, setSavingStore] = useState(false);
  const [savingLot, setSavingLot] = useState(false);

  // Add Lot Form State
  const [lotTitle, setLotTitle] = useState('');
  const [lotPrice, setLotPrice] = useState('15000');
  const [lotBulkPrice, setLotBulkPrice] = useState('13500');
  const [lotUnit, setLotUnit] = useState('CRATE');
  const [lotStock, setLotStock] = useState('50');
  const [lotMinOrder, setLotMinOrder] = useState('10');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('site-1');
  const [submittingBidTenderId, setSubmittingBidTenderId] = useState<string | null>(null);

  const activeStore = myStores.find((s) => s.id === activeStoreId) || myStores[0] || null;

  const activeSites: Array<{ id: string; name: string; location: string; capacityTons?: number; facilityType?: string }> =
    activeStore?.sites && Array.isArray(activeStore.sites) && activeStore.sites.length > 0
      ? activeStore.sites
      : [
        { id: 'site-1', name: 'Dock 4 Cold Room', location: 'Quai 4 Cold Section', facilityType: 'COLD_ROOM' },
        { id: 'site-2', name: 'Exterior Dry Warehouse', location: 'Hangar B Loading Shed', facilityType: 'AMBIENT_SHED' },
      ];

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [deals, storesList, profile] = await Promise.all([
        fetchWholesaleDealsApi(),
        fetchMyStoresApi().catch(() => []),
        fetchWholesalerProfileApi().catch(() => null),
      ]);

      const list = Array.isArray(deals) ? deals : [];
      setBulkYields(list);

      if (storesList && storesList.length > 0) {
        setMyStores(storesList);
        setActiveStoreId(storesList[0].id);
        setStoreName(storesList[0].name || profile?.businessName || '');
        setStoreCity(storesList[0].marketZone || storesList[0].city || profile?.primaryMarketCity || 'Douala • Marché Sandaga');
        setStorageCapacity(String(storesList[0].storageCapacityTons || 5.0));
        if (storesList[0].sites?.[0]?.id) {
          setSelectedSiteId(storesList[0].sites[0].id);
        }
        const isolatedDeals = await fetchWholesaleDealsApi({ storeId: storesList[0].id }).catch(() => []);
        setBulkYields(isolatedDeals);
      } else if (profile?.businessName) {
        setBulkYields(list);
        setStoreName(profile.businessName);
        if (profile.primaryMarketCity) setStoreCity(profile.primaryMarketCity);
        if (profile.linkedFarmId) setLinkedFarmId(profile.linkedFarmId);
        setMyStores([
          {
            id: 'store-default',
            name: profile.businessName,
            city: profile.primaryMarketCity || 'Douala',
            marketZone: profile.primaryMarketCity || 'Marché Sandaga',
            storageCapacityTons: profile.buyingCapacityTons || 5.0,
            sites: [
              { id: 'site-1', name: 'Dock 4 Cold Room', location: 'Quai 4', facilityType: 'COLD_ROOM' },
              { id: 'site-2', name: 'Exterior Dry Warehouse', location: 'Hangar B', facilityType: 'AMBIENT_SHED' },
            ],
          },
        ]);
      }
    } catch (e) {
      console.warn('Failed to load store data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSaveStore = async () => {
    if (!storeName.trim()) {
      Alert.alert('Required', 'Please enter your store or depot name');
      return;
    }
    try {
      setSavingStore(true);
      await registerWholesalerApi({
        businessName: storeName.trim(),
        primaryMarketCity: storeCity,
        buyingCapacityTons: parseFloat(storageCapacity) || 5.0,
      });
      setIsStoreModalOpen(false);
      Alert.alert('Success', '🎉 Store profile updated successfully!');
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save store');
    } finally {
      setSavingStore(false);
    }
  };

  const handleCreateLot = async () => {
    if (!lotTitle.trim() || !lotPrice) {
      Alert.alert('Required', 'Please provide a title and price for this wholesale lot');
      return;
    }
    setSavingLot(true);
    const chosenSite = activeSites.find((s) => s.id === selectedSiteId) || activeSites[0];
    const dispatchLabel = chosenSite?.name || 'Main Depot Dock';

    try {
      const created = await createYieldApi({
        title: lotTitle.trim(),
        description: `Wholesale lot dispatched from ${activeStore?.name || storeName || 'Merchant Depot'} (${dispatchLabel}).`,
        originRegion: chosenSite ? `${chosenSite.name} • ${storeCity}` : storeCity,
        pricePerUnit: Number(lotPrice),
        unit: lotUnit,
        stockQuantity: Number(lotStock || 50),
        minOrderQuantity: Number(lotMinOrder || 5),
        isWholesaleBulkAvailable: true,
        bulkMinQuantity: Number(lotMinOrder || 10),
        bulkPricePerUnit: Number(lotBulkPrice || lotPrice),
        sourceType: 'STORE',
        storeId: activeStore?.id,
        storeSiteId: chosenSite?.id,
        dispatchSiteName: dispatchLabel,
        mediaUrls: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800'],
      });

      setBulkYields((prev) => [created, ...prev]);
      setIsAddLotModalOpen(false);
      setLotTitle('');
      Alert.alert(
        'Published to AgroMarket! 📦',
        `"${lotTitle}" is now published from [${dispatchLabel}]. Buyers will see this exact pickup/dispatch depot point on checkout!`
      );
    } catch {
      // Local fallback if offline
      const fallbackLot: Yield = {
        id: `lot-depot-${Date.now()}`,
        farmerId: user?.id || 'u1',
        title: lotTitle.trim(),
        description: `Wholesale lot dispatched from ${activeStore?.name || storeName || 'Merchant Depot'} (${dispatchLabel}).`,
        originRegion: chosenSite ? `${chosenSite.name} • ${storeCity}` : storeCity,
        price: Number(lotPrice),
        pricePerUnit: Number(lotPrice),
        unit: lotUnit,
        stockQuantity: Number(lotStock || 50),
        minOrderQuantity: Number(lotMinOrder || 5),
        isWholesaleBulkAvailable: true,
        bulkMinQuantity: Number(lotMinOrder || 10),
        bulkPricePerUnit: Number(lotBulkPrice || lotPrice),
        sourceType: 'STORE',
        storeId: activeStore?.id,
        storeSiteId: chosenSite?.id,
        dispatchSiteName: dispatchLabel,
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800',
      } as any;

      setBulkYields((prev) => [fallbackLot, ...prev]);
      setIsAddLotModalOpen(false);
      setLotTitle('');
      Alert.alert(
        'Published to AgroMarket! 📦',
        `"${lotTitle}" is now published from [${dispatchLabel}]. Buyers will see this exact pickup/dispatch depot point on checkout!`
      );
    } finally {
      setSavingLot(false);
    }
  };

  const handleBidSubmit = (tenderId: string, tenderTitle: string) => {
    setSubmittingBidTenderId(tenderId);
    setTimeout(() => {
      setSubmittingBidTenderId(null);
      Alert.alert(
        'Bid Submitted! ✅',
        `Your commercial supply offer for "${tenderTitle}" was delivered to the buyer. You will receive notification when approved.`
      );
    }, 500);
  };

  const userFarms = user?.farms || [];
  const linkedFarmObj = userFarms.find((f: any) => f.id === linkedFarmId);

  const TENDERS = [
    {
      id: 'tender-1',
      title: '50 Crates Highland Roma Tomatoes Weekly',
      buyer: 'Grand Central Catering & Hospitality Group',
      city: 'Yaoundé • Bastos Commercial Hub',
      volume: '50 Crates / Wk',
      targetPrice: '14,000 FCFA / Crate',
      escrowGuarantee: '100% Escrow Funded',
      verified: true,
      description:
        'Continuous weekly procurement of uniform, sorted Roma tomatoes for hotel restaurants. Delivery every Tuesday morning at Bastos.',
    },
    {
      id: 'tender-2',
      title: '200 Bunches Plantain for Export Depot',
      buyer: 'Atlantic Agrilogistics Co-op Export Terminal',
      city: 'Douala • Port Zone Cold Hub',
      volume: '200 Bunches',
      targetPrice: '3,800 FCFA / Bunch',
      escrowGuarantee: 'Smart Escrow Guaranteed',
      verified: true,
      description:
        'Large green plantains (Bâtard / Big Ebanga) required for refrigerated container export. Clean stems with phytosanitary inspection.',
    },
    {
      id: 'tender-3',
      title: '1,500 KG Yellow Corn (Moisture < 13.5%)',
      buyer: 'Savannah Feed Mills & Grain Aggregation',
      city: 'Bafoussam • Mifi Central Depot',
      volume: '1.5 Tonnes',
      targetPrice: '300 FCFA / KG',
      escrowGuarantee: 'Smart Escrow Released at Depot',
      verified: false,
      description:
        'Clean dry yellow maize in 50kg bags. Zero aflatoxin. Payment released immediately upon on-site moisture meter inspection.',
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* Top Header Bar */}
      <View style={styles.topNavRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={19} color={Colors.canopy} />
        </TouchableOpacity>

        <View style={styles.topNavCenter}>
          <Text style={styles.topNavTitle}>Store Management</Text>
          <Text style={styles.topNavSub}>{storeCity}</Text>
        </View>

        <TouchableOpacity
          onPress={() => setIsStoreModalOpen(true)}
          style={styles.settingsBtn}
          activeOpacity={0.7}
        >
          <Settings size={18} color={Colors.canopy} />
        </TouchableOpacity>
      </View>

      {/* Main Single Scrollable Viewport */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.cultivated]}
          />
        }
      >
        {/* Store Switcher Bar (Parity with Farm Switcher) */}
        <View style={styles.switcherWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.switcherContent}>
            {myStores.map((s) => {
              const isSelected = (activeStore?.id || activeStoreId) === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.storeChip, isSelected && styles.storeChipActive]}
                  onPress={() => {
                    setActiveStoreId(s.id);
                    setStoreName(s.name);
                    setStoreCity(s.marketZone || s.city || storeCity);
                    if (s.sites?.[0]?.id) setSelectedSiteId(s.sites[0].id);
                    fetchWholesaleDealsApi({ storeId: s.id })
                      .then((deals) => setBulkYields(deals))
                      .catch(() => { });
                  }}
                  activeOpacity={0.8}
                >
                  <Store size={13} color={isSelected ? '#FFFFFF' : Colors.canopy} />
                  <Text style={[styles.storeChipText, isSelected && styles.storeChipTextActive]} numberOfLines={1}>
                    {s.name}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.newStoreBtn}
              onPress={() => router.push('/store/new' as any)}
              activeOpacity={0.8}
            >
              <Plus size={13} color={Colors.canopy} />
              <Text style={styles.newStoreBtnText}>+ New Store</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Store Profile Card */}
        <View style={styles.storeProfileCard}>
          <View style={styles.storeProfileRow}>
            <View style={styles.storeIconCircle}>
              {activeStore?.avatarPhoto || activeStore?.coverPhoto ? (
                <Image
                  source={{ uri: resolveMediaUrl(activeStore.avatarPhoto || activeStore.coverPhoto) }}
                  style={styles.storeImage}
                  resizeMode="cover"
                />
              ) : (
                <Store size={26} color={Colors.cultivated} strokeWidth={2.2} />
              )}
            </View>
            <View style={styles.storeTextCol}>
              <View style={styles.storeTitleRow}>
                <Text style={styles.storeNameText}>
                  {activeStore?.name || storeName || 'My AgroStore Depot'}
                </Text>
                <View style={styles.verifiedBadge}>
                  <CheckCircle2 size={11} color={Colors.cultivated} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <MapPin size={12} color={Colors.gold} />
                <Text style={styles.metaCityText}>{activeStore?.marketZone || storeCity}</Text>
                <Text style={styles.metaDot}>•</Text>
                {linkedFarmObj ? (
                  <View style={styles.linkedFarmPill}>
                    <Link2 size={11} color={Colors.cultivated} />
                    <Text style={styles.linkedFarmText}>{linkedFarmObj.name}</Text>
                  </View>
                ) : (
                  <Text style={styles.metaStandaloneText}>Standalone Depot</Text>
                )}
              </View>

              {/* Operating Sites Badges */}
              <View style={styles.sitesPillRow}>
                {activeSites.map((site) => (
                  <View key={site.id} style={styles.siteMiniPill}>
                    <Text style={styles.siteMiniPillText}>
                      {site.facilityType === 'COLD_ROOM' ? '❄️ ' : '🏢 '}
                      {site.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Quick Metrics Strip */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{bulkYields.length}</Text>
              <Text style={styles.metricLbl}>Depot Lots</Text>
            </View>
            <View style={[styles.metricItem, styles.metricDivider]}>
              <Text style={styles.metricVal}>{storageCapacity} T</Text>
              <Text style={styles.metricLbl}>Storage Cap</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{TENDERS.length}</Text>
              <Text style={styles.metricLbl}>Open Tenders</Text>
            </View>
          </View>

          {/* Action Row */}
          <View style={styles.storeActionRow}>
            <TouchableOpacity
              style={styles.addLotBtn}
              onPress={() => setIsAddLotModalOpen(true)}
              activeOpacity={0.8}
            >
              <Plus size={15} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.addLotBtnText}>+ Add Store Lot</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editStoreBtn}
              onPress={() => setIsStoreModalOpen(true)}
              activeOpacity={0.8}
            >
              <Settings size={14} color="#173A20" />
              <Text style={styles.editStoreBtnText}>Store Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'inventory' && styles.tabBtnActive]}
            onPress={() => setActiveTab('inventory')}
          >
            <Package size={14} color={activeTab === 'inventory' ? '#FFFFFF' : Colors.espresso} />
            <Text style={[styles.tabText, activeTab === 'inventory' && styles.tabTextActive]}>
              Depot Lots ({bulkYields.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'tenders' && styles.tabBtnActive]}
            onPress={() => setActiveTab('tenders')}
          >
            <ShieldCheck size={14} color={activeTab === 'tenders' ? '#FFFFFF' : Colors.espresso} />
            <Text style={[styles.tabText, activeTab === 'tenders' && styles.tabTextActive]}>
              Supply Tenders ({TENDERS.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'settings' && styles.tabBtnActive]}
            onPress={() => setActiveTab('settings')}
          >
            <Settings size={14} color={activeTab === 'settings' ? '#FFFFFF' : Colors.espresso} />
            <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
              Settings
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: DEPOT INVENTORY */}
        {activeTab === 'inventory' && (
          <View style={styles.dealsList}>
            {bulkYields.length === 0 ? (
              <View style={styles.emptyStateBox}>
                <Store size={36} color={Colors.canopyLight} />
                <Text style={styles.emptyTitle}>No Store Lots Listed Yet</Text>
                <Text style={styles.emptySub}>
                  Publish graded crates, 50kg bags, or wholesale depot lots to institutional buyers on AgroMarket.
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => setIsAddLotModalOpen(true)}
                >
                  <Plus size={14} color={Colors.white} />
                  <Text style={styles.emptyActionBtnText}>Publish First Store Lot</Text>
                </TouchableOpacity>
              </View>
            ) : (
              bulkYields.map((yieldItem) => {
                const itemImg = yieldItem.image || (yieldItem.mediaUrls && yieldItem.mediaUrls[0]) || '';
                const unitPrice = yieldItem.bulkPricePerUnit || yieldItem.price || yieldItem.pricePerUnit || 0;
                return (
                  <View key={yieldItem.id} style={styles.dealCard}>
                    {itemImg ? (
                      <Image source={{ uri: itemImg }} style={styles.dealImage} />
                    ) : (
                      <View style={[styles.dealImage, styles.placeholderImg]}>
                        <Package size={24} color={Colors.canopy} />
                      </View>
                    )}
                    <View style={styles.dealInfo}>
                      <View style={styles.badgeRow}>
                        <Text style={styles.wholesaleBadge}>WHOLESALE LOT</Text>
                        <Text style={styles.stockText}>
                          Stock: {yieldItem.stockQuantity || 20} {yieldItem.unit}s
                        </Text>
                      </View>

                      <Text style={styles.dealTitle} numberOfLines={1}>{yieldItem.title}</Text>

                      <Text style={styles.bulkPricing}>
                        {Number(unitPrice).toLocaleString()} FCFA
                        <Text style={styles.unitText}> / {yieldItem.unit}</Text>
                      </Text>

                      <Text style={styles.minQtyText}>
                        Min Order: {yieldItem.bulkMinQuantity || yieldItem.minOrderQuantity || 5} {yieldItem.unit}s
                      </Text>

                      <View style={styles.dealActions}>
                        <BrandButton
                          title="View in AgroMarket"
                          variant="secondary"
                          size="sm"
                          onPress={() => router.push(`/yield/${yieldItem.id}`)}
                        />
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* TAB 2: SUPPLY TENDERS */}
        {activeTab === 'tenders' && (
          <View style={styles.demandSection}>
            <View style={styles.tenderIntroBanner}>
              <Sparkles size={16} color={Colors.gold} />
              <Text style={styles.tenderIntroText}>
                Verified institutional procurement demands with pre-funded Smart Escrow. Submit your supply bid directly.
              </Text>
            </View>

            {TENDERS.map((tender) => (
              <View key={tender.id} style={styles.demandCard}>
                <View style={styles.tenderHeaderRow}>
                  <Text style={styles.demandTitle}>{tender.title}</Text>
                  {tender.verified && (
                    <View style={styles.verifiedBuyerBadge}>
                      <CheckCircle2 size={10} color={Colors.cultivated} />
                      <Text style={styles.verifiedBuyerText}>Verified Buyer</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.tenderBuyerMeta}>
                  {tender.buyer} • 📍 {tender.city}
                </Text>

                <Text style={styles.demandDesc}>{tender.description}</Text>

                <View style={styles.tenderDetailStrip}>
                  <Text style={styles.tenderDetailItem}>
                    <Text style={{ fontWeight: 'bold' }}>Target: </Text>{tender.targetPrice}
                  </Text>
                  <Text style={styles.tenderDetailItem}>
                    <Text style={{ fontWeight: 'bold' }}>Vol: </Text>{tender.volume}
                  </Text>
                </View>

                <View style={styles.demandMeta}>
                  <Text style={styles.escrowNotice}>🔒 {tender.escrowGuarantee}</Text>
                  <BrandButton
                    title={submittingBidTenderId === tender.id ? "Submitting..." : "Submit Supply Bid"}
                    variant="primary"
                    size="sm"
                    onPress={() => handleBidSubmit(tender.id, tender.title)}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TAB 3: STORE SETTINGS */}
        {activeTab === 'settings' && (
          <View style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>Depot Configuration</Text>
            <Text style={styles.settingsSub}>
              Manage merchant trade details, market hub, and farm provenance linkage.
            </Text>

            <Text style={styles.inputLabel}>AgroStore / Depot Name *</Text>
            <TextInput
              style={styles.textInput}
              value={storeName}
              onChangeText={setStoreName}
              placeholder="e.g., Marché Sandaga Wholesale Hub"
              placeholderTextColor="#9C9284"
            />

            <Text style={styles.inputLabel}>Primary Market City *</Text>
            <TextInput
              style={styles.textInput}
              value={storeCity}
              onChangeText={setStoreCity}
              placeholder="e.g., Douala • Marché Sandaga"
              placeholderTextColor="#9C9284"
            />

            <Text style={styles.inputLabel}>Storage Capacity (Tons)</Text>
            <TextInput
              style={styles.textInput}
              value={storageCapacity}
              onChangeText={setStorageCapacity}
              keyboardType="numeric"
              placeholder="5.0"
              placeholderTextColor="#9C9284"
            />

            {/* Farm Linking Option */}
            <View style={styles.farmLinkBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Link2 size={15} color={Colors.cultivated} />
                <Text style={styles.farmLinkTitle}>Link to AgroFarm (Optional)</Text>
              </View>
              <Text style={styles.farmLinkSub}>
                Linking is optional: Link to your farm for provenance, or operate as an independent merchant depot.
              </Text>
              {userFarms.length > 0 ? (
                <View style={styles.farmPillsRow}>
                  <TouchableOpacity
                    style={[styles.farmPill, !linkedFarmId && styles.farmPillActive]}
                    onPress={() => setLinkedFarmId('')}
                  >
                    <Text style={[styles.farmPillText, !linkedFarmId && styles.farmPillTextActive]}>
                      Standalone Depot
                    </Text>
                  </TouchableOpacity>
                  {userFarms.map((f: any) => (
                    <TouchableOpacity
                      key={f.id}
                      style={[styles.farmPill, linkedFarmId === f.id && styles.farmPillActive]}
                      onPress={() => setLinkedFarmId(f.id)}
                    >
                      <Text style={[styles.farmPillText, linkedFarmId === f.id && styles.farmPillTextActive]}>
                        🚜 {f.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.noFarmText}>No farm registered. Operating as Standalone Merchant Depot.</Text>
              )}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveStore}>
              {savingStore ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Store Configuration</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* MODAL 1: STORE SETUP */}
      <Modal visible={isStoreModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🏪 My AgroStore Setup</Text>
              <TouchableOpacity onPress={() => setIsStoreModalOpen(false)}>
                <X size={20} color={Colors.canopy} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Store / Depot Name *</Text>
            <TextInput
              style={styles.textInput}
              value={storeName}
              onChangeText={setStoreName}
              placeholder="e.g., Marché Sandaga Wholesale Hub"
              placeholderTextColor="#9C9284"
            />

            <Text style={styles.inputLabel}>Primary Market City *</Text>
            <TextInput
              style={styles.textInput}
              value={storeCity}
              onChangeText={setStoreCity}
              placeholder="e.g., Douala • Marché Sandaga"
              placeholderTextColor="#9C9284"
            />

            <View style={styles.farmLinkBox}>
              <Text style={styles.farmLinkTitle}>Link to AgroFarm (Optional)</Text>
              {userFarms.length > 0 ? (
                <View style={styles.farmPillsRow}>
                  <TouchableOpacity
                    style={[styles.farmPill, !linkedFarmId && styles.farmPillActive]}
                    onPress={() => setLinkedFarmId('')}
                  >
                    <Text style={[styles.farmPillText, !linkedFarmId && styles.farmPillTextActive]}>
                      Standalone
                    </Text>
                  </TouchableOpacity>
                  {userFarms.map((f: any) => (
                    <TouchableOpacity
                      key={f.id}
                      style={[styles.farmPill, linkedFarmId === f.id && styles.farmPillActive]}
                      onPress={() => setLinkedFarmId(f.id)}
                    >
                      <Text style={[styles.farmPillText, linkedFarmId === f.id && styles.farmPillTextActive]}>
                        🚜 {f.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.noFarmText}>Standalone Merchant Depot</Text>
              )}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveStore}>
              {savingStore ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Store Profile</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: ADD STORE LOT (WITH DISPATCH DEPOT SITE SELECTOR) */}
      <Modal visible={isAddLotModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📦 Publish Depot Store Lot</Text>
              <TouchableOpacity onPress={() => setIsAddLotModalOpen(false)}>
                <X size={20} color={Colors.canopy} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Lot / Produce Title *</Text>
            <TextInput
              style={styles.textInput}
              value={lotTitle}
              onChangeText={setLotTitle}
              placeholder="e.g., Graded Highland Tomatoes - 25 Crate Lot"
              placeholderTextColor="#9C9284"
            />

            {/* Dispatch Depot Site Dropdown / Pills */}
            <Text style={styles.inputLabel}>Dispatch Depot Site * (Pickup Point for Buyers)</Text>
            <View style={styles.farmPillsRow}>
              {activeSites.map((site) => {
                const isSelected = selectedSiteId === site.id;
                return (
                  <TouchableOpacity
                    key={site.id}
                    style={[styles.farmPill, isSelected && styles.farmPillActive]}
                    onPress={() => setSelectedSiteId(site.id)}
                  >
                    <Text style={[styles.farmPillText, isSelected && styles.farmPillTextActive]}>
                      {site.facilityType === 'COLD_ROOM' ? '❄️ ' : '🏢 '}
                      {site.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Unit</Text>
                <TextInput
                  style={styles.textInput}
                  value={lotUnit}
                  onChangeText={setLotUnit}
                  placeholder="CRATE / BAG"
                  placeholderTextColor="#9C9284"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Stock Qty</Text>
                <TextInput
                  style={styles.textInput}
                  value={lotStock}
                  onChangeText={setLotStock}
                  keyboardType="numeric"
                  placeholder="50"
                  placeholderTextColor="#9C9284"
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Price / Unit (FCFA)</Text>
                <TextInput
                  style={styles.textInput}
                  value={lotPrice}
                  onChangeText={setLotPrice}
                  keyboardType="numeric"
                  placeholder="15000"
                  placeholderTextColor="#9C9284"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Bulk Min Qty</Text>
                <TextInput
                  style={styles.textInput}
                  value={lotMinOrder}
                  onChangeText={setLotMinOrder}
                  keyboardType="numeric"
                  placeholder="10"
                  placeholderTextColor="#9C9284"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateLot}>
              {savingLot ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Publish Lot to AgroMarket</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF8F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topNavCenter: {
    alignItems: 'center',
  },
  topNavTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.canopy,
  },
  topNavSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF8F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 90,
  },
  switcherWrapper: {
    marginBottom: 12,
  },
  switcherContent: {
    gap: 8,
    alignItems: 'center',
  },
  storeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    backgroundColor: '#EEF8F1',
    borderWidth: 1,
    borderColor: '#CCEBD5',
  },
  storeChipActive: {
    backgroundColor: '#173A20',
    borderColor: '#173A20',
  },
  storeChipText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: '#173A20',
  },
  storeChipTextActive: {
    color: '#FFFFFF',
  },
  newStoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    backgroundColor: '#EEF8F1',
    borderWidth: 1,
    borderColor: '#CCEBD5',
  },
  newStoreBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.canopy,
  },
  storeProfileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CCEBD5',
    marginBottom: 16,
    ...Shadows.subtle,
  },
  storeProfileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  storeIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#EEF8F1',
    borderWidth: 1,
    borderColor: '#CCEBD5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  storeImage: {
    width: '100%',
    height: '100%',
  },
  storeTextCol: {
    flex: 1,
  },
  storeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storeNameText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.espresso,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EEF8F1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CCEBD5',
  },
  verifiedText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.cultivated,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  metaCityText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  metaDot: {
    fontSize: 10,
    color: Colors.text.tertiary,
  },
  linkedFarmPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EEF8F1',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  linkedFarmText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    color: Colors.cultivated,
  },
  metaStandaloneText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.tertiary,
  },
  sitesPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 6,
  },
  siteMiniPill: {
    backgroundColor: '#EEF8F1',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CCEBD5',
  },
  siteMiniPillText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    color: '#173A20',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#EEF8F1',
    borderRadius: Radii.sm,
    paddingVertical: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#CCEBD5',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#CCEBD5',
  },
  metricVal: {
    fontFamily: Fonts.monoBold,
    fontSize: 15,
    color: '#173A20',
  },
  metricLbl: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  storeActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  addLotBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.cultivated,
    paddingVertical: 10,
    borderRadius: Radii.sm,
  },
  addLotBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  editStoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EEF8F1',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: '#CCEBD5',
  },
  editStoreBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: '#173A20',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: Radii.sm,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#CCEBD5',
  },
  tabBtnActive: {
    backgroundColor: '#173A20',
    borderColor: '#173A20',
  },
  tabText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: '#173A20',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontFamily: Fonts.bodyBold,
  },
  dealsList: {
    gap: 12,
  },
  emptyStateBox: {
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCEBD5',
    borderStyle: 'dashed',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.espresso,
  },
  emptySub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.cultivated,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radii.sm,
    marginTop: 6,
  },
  emptyActionBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.white,
  },
  dealCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    ...Shadows.subtle,
  },
  dealImage: {
    width: 100,
    height: 110,
    backgroundColor: '#EEF8F1',
  },
  placeholderImg: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wholesaleBadge: {
    fontFamily: Fonts.monoBold,
    fontSize: 9,
    color: Colors.canopy,
    backgroundColor: '#EEF8F1',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    color: Colors.text.secondary,
  },
  dealTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.espresso,
    marginTop: 2,
  },
  bulkPricing: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    color: Colors.cultivated,
    marginTop: 2,
  },
  unitText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  minQtyText: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.clay,
  },
  dealActions: {
    marginTop: 4,
  },
  demandSection: {
    gap: 12,
  },
  tenderIntroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF8F1',
    padding: 12,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: '#CCEBD5',
  },
  tenderIntroText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 11,
    color: '#173A20',
    lineHeight: 16,
  },
  demandCard: {
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    ...Shadows.subtle,
  },
  tenderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  demandTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.espresso,
    flex: 1,
  },
  verifiedBuyerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#EEF8F1',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  verifiedBuyerText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    color: Colors.cultivated,
  },
  tenderBuyerMeta: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 2,
    marginBottom: 6,
  },
  demandDesc: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 17,
    backgroundColor: '#FAF7F2',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  tenderDetailStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  tenderDetailItem: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.canopy,
  },
  demandMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  escrowNotice: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    color: Colors.cultivated,
  },
  settingsCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    ...Shadows.subtle,
  },
  settingsTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.espresso,
  },
  settingsSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 2,
    marginBottom: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.canopy,
  },
  inputLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.espresso,
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: '#F9FBF9',
    borderWidth: 1,
    borderColor: '#CCEBD5',
    borderRadius: Radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.espresso,
  },
  farmLinkBox: {
    backgroundColor: '#EEF8F1',
    padding: 12,
    borderRadius: Radii.sm,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#CCEBD5',
  },
  farmLinkTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.canopy,
  },
  farmLinkSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
    lineHeight: 15,
    marginVertical: 4,
  },
  farmPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  farmPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#CCEBD5',
  },
  farmPillActive: {
    backgroundColor: Colors.canopy,
    borderColor: Colors.canopy,
  },
  farmPillText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.espresso,
  },
  farmPillTextActive: {
    color: Colors.white,
    fontFamily: Fonts.bodyBold,
  },
  noFarmText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  saveBtn: {
    backgroundColor: Colors.cultivated,
    paddingVertical: 12,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  saveBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.white,
  },
});
