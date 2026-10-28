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
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  Flame,
  Sun,
  Zap,
  RotateCw,
  Clock,
  Tag,
  CheckCircle2,
  Sliders,
  TrendingDown,
  Eye,
  EyeOff,
  AlertCircle,
  AlertTriangle,
  Edit3,
  Camera,
  Trash2,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import FarmSwitcher from '../components/FarmSwitcher';
import FarmCard from '../components/FarmCard';
import PriceTag from '@/components/ui/PriceTag';
import FarmerBadge from '@/components/ui/FarmerBadge';
import {
  fetchFarmByIdApi,
  fetchMyFarmsApi,
  createProduceApi,
  patchProduceStockApi,
  updateProduceApi,
  deleteProduceApi,
  updateFarmApi,
  deleteFarmApi,
} from '../api';
import { uploadMediaApi } from '@/components/api/posts';
import { resolveMediaUrl } from '@/utils/media';
import { Farm, FarmParcel } from '@/types';
import AgromPreloader from '@/components/AgromPreloader';


export const CAMEROON_REGIONS = [
  'Centre (Yaoundé)',
  'Littoral (Douala)',
  'West (Bafoussam/Foumbot)',
  'South West (Buea/Limbe)',
  'North West (Bamenda)',
  'Adamawa (Ngaoundéré)',
  'North (Garoua)',
  'Far North (Maroua)',
  'East (Bertoua)',
  'South (Ebolowa/Kribi)',
];

export interface AgroCategoryDef {
  id: string;
  name: string;
  emoji: string;
}

export const CATEGORIES: AgroCategoryDef[] = [
  { id: 'cat-veg', name: 'Vegetables & Greens', emoji: '🥬' },
  { id: 'cat-tub', name: 'Tubers & Roots', emoji: '🥔' },
  { id: 'cat-plt', name: 'Plantains & Bananas', emoji: '🍌' },
  { id: 'cat-fru', name: 'Fruits & Citrus', emoji: '🍊' },
  { id: 'cat-cer', name: 'Grains & Cereals', emoji: '🌽' },
  { id: 'cat-leg', name: 'Legumes & Seeds', emoji: '🥜' },
  { id: 'cat-oil', name: 'Oils & Fats', emoji: '🛢️' },
  { id: 'cat-spi', name: 'Spices & Herbs', emoji: '🌶️' },
  { id: 'cat-egg', name: 'Poultry & Eggs', emoji: '🥚' },
  { id: 'cat-liv', name: 'Livestock & Cattle', emoji: '🐂' },
  { id: 'cat-aqu', name: 'Aquaculture & Fish', emoji: '🐟' },
];

export interface AgroUnitDef {
  id: string;
  label: string;
}

export const UNITS: AgroUnitDef[] = [
  { id: 'KG', label: 'KG' },
  { id: 'CRATE', label: 'Crate' },
  { id: 'BAG_50KG', label: '50kg Bag' },
  { id: 'BAG_100KG', label: '100kg Bag' },
  { id: 'BAG_25KG', label: '25kg Bag' },
  { id: 'BUCKET', label: 'Bucket' },
  { id: 'BASIN', label: 'Basin' },
  { id: 'BUNCH', label: 'Bunch' },
  { id: 'PIECE', label: 'Piece' },
  { id: 'TON', label: 'Tonne' },
  { id: 'LITER', label: 'Liter' },
  { id: 'CARTON', label: 'Carton' },
  { id: 'NET', label: 'Net' },
  { id: 'CUSTOM', label: '+ Custom' },
];

export interface AgroSeasonDef {
  id: string;
  label: string;
  badge: string;
}

export const SEASONS: AgroSeasonDef[] = [
  { id: 'PEAK_HARVEST', label: 'Peak Harvest', badge: '🔥' },
  { id: 'EARLY_HARVEST', label: 'Early Season', badge: '🌱' },
  { id: 'OFF_SEASON', label: 'Off-Season', badge: '⚡' },
  { id: 'YEAR_ROUND', label: 'Year-Round', badge: '🔄' },
];

export const SHELF_LIFE_OPTIONS = [
  { days: '3', label: '3 Days (Fast Perishable)' },
  { days: '7', label: '7 Days' },
  { days: '14', label: '14 Days' },
  { days: '30', label: '30+ Days (Storable)' },
];

export default function FarmManagementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  // Active Farm Operational Sites (Parcels)
  const activeParcels: FarmParcel[] = (activeFarm?.parcels && Array.isArray(activeFarm.parcels) && activeFarm.parcels.length > 0)
    ? activeFarm.parcels
    : (activeFarm ? [{
        id: `${activeFarm.id}-hq`,
        name: `${activeFarm.name} (Main Base / HQ)`,
        region: activeFarm.region || 'West Region',
        city: activeFarm.city || 'Foumbot',
        division: activeFarm.division || '',
        location: activeFarm.location || '',
        sizeHectares: activeFarm.sizeHectares || 1.0,
        isHeadquarters: true,
      }] : []);

  // Multi-Site / Parcel Addition State
  const [showAddSiteModal, setShowAddSiteModal] = useState(false);
  const [savingSite, setSavingSite] = useState(false);
  const [newSiteForm, setNewSiteForm] = useState({
    name: '',
    region: 'West (Bafoussam/Foumbot)',
    division: '',
    city: '',
    location: '',
    sizeHectares: '1.0',
  });

  // Produce Creation Modal State
  const [showAddProduceModal, setShowAddProduceModal] = useState(false);
  const [savingProduce, setSavingProduce] = useState(false);
  const [produceForm, setProduceForm] = useState({
    title: '',
    description: '',
    categoryName: 'Vegetables & Greens',
    selectedParcelId: '',
    pricePerUnit: '',
    unit: 'KG',
    customUnit: '',
    seasonality: 'PEAK_HARVEST',
    shelfLifeDays: '7',
    minOrderQuantity: '1',
    stockQuantity: '',
    isOrganic: true,
    isWholesaleBulkAvailable: false,
    bulkMinQuantity: '',
    bulkPricePerUnit: '',
    mediaUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800',
  });

  // Edit Produce Modal State
  const [showEditProduceModal, setShowEditProduceModal] = useState(false);
  const [editingProduceItem, setEditingProduceItem] = useState<any>(null);
  const [savingEditProduce, setSavingEditProduce] = useState(false);
  const [deletingProduce, setDeletingProduce] = useState(false);
  const [uploadingProducePhoto, setUploadingProducePhoto] = useState(false);
  const [editProduceForm, setEditProduceForm] = useState({
    title: '',
    description: '',
    categoryName: 'Vegetables & Greens',
    selectedParcelId: '',
    pricePerUnit: '',
    unit: 'KG',
    customUnit: '',
    seasonality: 'PEAK_HARVEST',
    shelfLifeDays: '7',
    minOrderQuantity: '1',
    stockQuantity: '',
    isOrganic: true,
    isWholesaleBulkAvailable: false,
    bulkMinQuantity: '',
    bulkPricePerUnit: '',
    mediaUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800',
    isAvailable: true,
  });

  const handleAddSite = async () => {
    if (!newSiteForm.name.trim() || !newSiteForm.city.trim()) {
      Alert.alert('Required Fields', 'Please enter a site name (e.g. Buea Hatchery) and town/city.');
      return;
    }
    if (!activeFarm?.id) {
      Alert.alert('Error', 'No active farm selected.');
      return;
    }

    try {
      setSavingSite(true);
      const newParcel: FarmParcel = {
        id: `site-${Date.now()}`,
        name: newSiteForm.name.trim(),
        region: newSiteForm.region.split(' (')[0],
        division: newSiteForm.division.trim() || 'Noun',
        city: newSiteForm.city.trim(),
        location: newSiteForm.location.trim() || `${newSiteForm.city.trim()}, ${newSiteForm.region.split(' (')[0]}`,
        sizeHectares: parseFloat(newSiteForm.sizeHectares) || 1.0,
        isHeadquarters: false,
      };

      const updatedParcels = [...activeParcels, newParcel];
      const updatedFarm = await updateFarmApi(activeFarm.id, {
        parcels: updatedParcels,
      });

      const updatedTotalSize = updatedFarm.sizeHectares || ((activeFarm.sizeHectares || 0) + (newParcel.sizeHectares || 0));

      setFarmData({
        ...activeFarm,
        ...updatedFarm,
        parcels: updatedParcels,
        sizeHectares: updatedTotalSize,
      });

      setFarmsList((prev) =>
        prev.map((f) =>
          f.id === activeFarm.id
            ? { ...f, parcels: updatedParcels, sizeHectares: updatedTotalSize }
            : f
        )
      );

      Alert.alert(
        'Operating Site Registered! 📍',
        `"${newSiteForm.name}" has been added to ${activeFarm.name}. Total enterprise footprint is now ${updatedTotalSize} Hectares.`
      );
      setShowAddSiteModal(false);
      setNewSiteForm({
        name: '',
        region: 'West (Bafoussam/Foumbot)',
        division: '',
        city: '',
        location: '',
        sizeHectares: '1.0',
      });
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not register new operating site.');
    } finally {
      setSavingSite(false);
    }
  };

  // Edit Farm Profile State & Handlers
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [isDeletingFarm, setIsDeletingFarm] = useState(false);
  // 2-Step Cascading Farm Deletion & Migration State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteAction, setDeleteAction] = useState<'transfer' | 'delete'>('transfer');
  const [deleteTargetFarmId, setDeleteTargetFarmId] = useState<string>('');
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleteSingleFarmAgreed, setDeleteSingleFarmAgreed] = useState(false);
  const [activeCoverError, setActiveCoverError] = useState(false);
  const [editCoverError, setEditCoverError] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    coverPhoto: '',
    primaryProduce: [] as string[],
  });
  const [editTagInput, setEditTagInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const handleOpenEditProfile = () => {
    if (!activeFarm) return;
    setEditForm({
      name: activeFarm.name || '',
      description: activeFarm.description || '',
      coverPhoto: activeFarm.coverPhoto || '',
      primaryProduce: activeFarm.primaryProduce ? [...activeFarm.primaryProduce] : [],
    });
    setEditCoverError(false);
    setEditTagInput('');
    setShowEditProfileModal(true);
  };

  const handlePickEditCover = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo gallery access to change your farm storefront banner.');
        return;
      }

      // Note: On Android, UCrop activity crashes during/after cropping with 16:9 aspect ratios.
      // Setting allowsEditing to false on Android prevents the native crash while UI auto-covers to 16:9.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: Platform.OS === 'ios',
        aspect: [16, 9],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        setEditForm((prev) => ({ ...prev, coverPhoto: localUri }));
        setEditCoverError(false);
        setUploadingCover(true);
        try {
          const uploadRes = await uploadMediaApi(localUri, false);
          if (uploadRes?.url) {
            setEditForm((prev) => ({ ...prev, coverPhoto: uploadRes.url }));
          }
        } catch (uploadErr) {
          console.warn('Cover upload failed, using local URI fallback', uploadErr);
        } finally {
          setUploadingCover(false);
        }
      }
    } catch (e) {
      console.warn('Image picker error', e);
      Alert.alert('Upload Error', 'Could not open image picker.');
    }
  };

  const handleAddEditTag = () => {
    if (editTagInput.trim() && !editForm.primaryProduce.includes(editTagInput.trim())) {
      setEditForm((prev) => ({
        ...prev,
        primaryProduce: [...prev.primaryProduce, editTagInput.trim()],
      }));
      setEditTagInput('');
    }
  };

  const handleRemoveEditTag = (tagToRemove: string) => {
    setEditForm((prev) => ({
      ...prev,
      primaryProduce: prev.primaryProduce.filter((t) => t !== tagToRemove),
    }));
  };

  const handleSaveFarmProfile = async () => {
    if (!activeFarm || !editForm.name.trim()) {
      Alert.alert('Required', 'Farm name cannot be empty.');
      return;
    }
    setSavingProfile(true);
    try {
      let finalCover = editForm.coverPhoto;
      if (
        finalCover &&
        (finalCover.startsWith('file:') ||
          finalCover.startsWith('content:') ||
          finalCover.startsWith('ph:') ||
          finalCover.startsWith('blob:'))
      ) {
        try {
          const uploadRes = await uploadMediaApi(finalCover, false);
          if (uploadRes?.url) {
            finalCover = uploadRes.url;
          }
        } catch (uploadErr) {
          console.warn('Cover upload before save failed', uploadErr);
        }
      }

      const updated = await updateFarmApi(activeFarm.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        coverPhoto: finalCover,
        primaryProduce: editForm.primaryProduce,
      });

      const updatedFarmObj = {
        ...activeFarm,
        ...updated,
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        coverPhoto: finalCover,
        primaryProduce: editForm.primaryProduce,
      };

      setFarmData(updatedFarmObj);
      setActiveCoverError(false);
      setFarmsList((prev) =>
        prev.map((f) => (f.id === activeFarm.id ? { ...f, ...updatedFarmObj } : f))
      );

      const updatedUserFarms = (user?.farms || []).map((f) =>
        f.id === activeFarm.id ? { ...f, ...updatedFarmObj } : f
      );
      updateUser({ farms: updatedUserFarms });

      setShowEditProfileModal(false);
      Alert.alert('Farm Updated! 🌾', 'Your farm storefront details, banner, and specialties have been updated.');
    } catch (err) {
      console.error('Failed to update farm profile', err);
      Alert.alert('Update Failed', 'Could not save farm profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleOpenDeleteModal = (farmIdToDelete?: string) => {
    const targetId = farmIdToDelete || activeFarm?.id;
    const targetFarm = farmsList.find((f) => f.id === targetId) || activeFarm;
    if (!targetFarm) return;

    const otherFarms = farmsList.filter((f) => f.id !== targetFarm.id);
    setDeleteStep(1);
    setDeleteConfirmName('');
    setDeleteSingleFarmAgreed(false);
    if (otherFarms.length > 0) {
      setDeleteAction('transfer');
      setDeleteTargetFarmId(otherFarms[0].id);
    } else {
      setDeleteAction('delete');
      setDeleteTargetFarmId('');
    }
    setShowEditProfileModal(false);
    setDeleteModalVisible(true);
  };

  const handleDeleteFarm = (farmIdToDelete?: string) => {
    handleOpenDeleteModal(farmIdToDelete);
  };

  const handleExecuteDeleteFarm = async () => {
    if (!activeFarm) return;
    if (deleteConfirmName.trim().toLowerCase() !== activeFarm.name.trim().toLowerCase()) {
      Alert.alert('Verification Required', 'Please type the exact farm enterprise name as shown to confirm deletion.');
      return;
    }

    const otherFarms = farmsList.filter((f) => f.id !== activeFarm.id);
    const targetFarmId = otherFarms.length > 0 && deleteAction === 'transfer' ? deleteTargetFarmId : undefined;

    setIsDeletingFarm(true);
    try {
      await deleteFarmApi(activeFarm.id, targetFarmId);
      const remainingFarms = farmsList.filter((f) => f.id !== activeFarm.id);
      setFarmsList(remainingFarms);
      updateUser({ farms: remainingFarms });

      if (activeFarm.id === selectedFarmId) {
        const nextFarm = remainingFarms[0] || null;
        setSelectedFarmId(nextFarm ? nextFarm.id : null);
        setActiveFarmId(nextFarm ? nextFarm.id : null);
        setFarmData(nextFarm);
        setActiveCoverError(false);
      }

      setDeleteModalVisible(false);
      Alert.alert(
        'Farm Enterprise Removed 🌾',
        deleteAction === 'transfer' && targetFarmId
          ? `"${activeFarm.name}" was successfully removed. All active produce batches and harvest stories were transferred to your other farm.`
          : `"${activeFarm.name}" and its associated produce listings and stories have been permanently deleted.`
      );
    } catch (err: any) {
      console.error('Failed to delete farm:', err);
      Alert.alert(
        'Deletion Blocked',
        err.response?.data?.message || err.message || 'Could not delete farm enterprise. Active customer orders must be fulfilled before this farm can be removed.'
      );
    } finally {
      setIsDeletingFarm(false);
    }
  };


  // Quick-Stock & Inventory Management State
  const [selectedStockYield, setSelectedStockYield] = useState<any>(null);
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [stockActionTab, setStockActionTab] = useState<'REPLENISH' | 'SPOILAGE'>('REPLENISH');
  const [stockInputDelta, setStockInputDelta] = useState('');
  const [isAvailableToggle, setIsAvailableToggle] = useState(true);
  const [updatingStock, setUpdatingStock] = useState(false);

  const openStockModal = (yieldItem: any) => {
    setSelectedStockYield(yieldItem);
    setStockInputDelta('');
    setStockActionTab('REPLENISH');
    setIsAvailableToggle(yieldItem.isAvailable !== false);
    setStockModalVisible(true);
  };

  const handleSaveStock = async () => {
    if (!selectedStockYield) return;
    const deltaNum = stockInputDelta ? parseFloat(stockInputDelta) : 0;
    if (isNaN(deltaNum) || deltaNum < 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid positive quantity.');
      return;
    }
    const currentStock = selectedStockYield.stockQuantity || 0;
    const effectiveDelta = stockActionTab === 'REPLENISH' ? deltaNum : -deltaNum;
    const targetStock = Math.max(0, currentStock + effectiveDelta);

    if (stockActionTab === 'SPOILAGE' && deltaNum > currentStock) {
      Alert.alert(
        'Exceeds Current Stock',
        `You cannot write off ${deltaNum} ${selectedStockYield.unit} because only ${currentStock} ${selectedStockYield.unit} are currently in stock.`
      );
      return;
    }

    try {
      setUpdatingStock(true);
      await patchProduceStockApi(selectedStockYield.id, {
        delta: effectiveDelta,
        isAvailable: isAvailableToggle,
      });

      // Optimistically update farmData.yields
      if (farmData && farmData.yields) {
        setFarmData({
          ...farmData,
          yields: farmData.yields.map((y: any) =>
            y.id === selectedStockYield.id
              ? { ...y, stockQuantity: targetStock, isAvailable: isAvailableToggle }
              : y
          ),
        });
      }

      Alert.alert(
        'Inventory Updated! 🌾',
        `"${selectedStockYield.title}" updated: ${targetStock} ${selectedStockYield.unit} in stock (${isAvailableToggle ? 'Live on Marketplace' : 'Paused'}).`
      );
      setStockModalVisible(false);
    } catch (err: any) {
      Alert.alert('Update Failed', err?.response?.data?.message || err.message || 'Could not update harvest inventory.');
    } finally {
      setUpdatingStock(false);
    }
  };

  const openEditProduceModal = (yieldItem: any) => {
    setEditingProduceItem(yieldItem);
    const catName = yieldItem.category?.name || 'Vegetables & Greens';
    const parcelMatch = activeParcels.find((p: any) =>
      yieldItem.originRegion && yieldItem.originRegion.includes(p.name)
    );
    setEditProduceForm({
      title: yieldItem.title || '',
      description: yieldItem.description || '',
      categoryName: catName,
      selectedParcelId: parcelMatch?.id || activeParcels[0]?.id || '',
      pricePerUnit: String(yieldItem.price ?? yieldItem.pricePerUnit ?? ''),
      unit: yieldItem.unit || 'KG',
      customUnit: yieldItem.customUnit || '',
      seasonality: yieldItem.seasonality || 'PEAK_HARVEST',
      shelfLifeDays: yieldItem.shelfLifeDays ? String(yieldItem.shelfLifeDays) : '7',
      minOrderQuantity: String(yieldItem.minOrderQuantity ?? 1),
      stockQuantity: String(yieldItem.stockQuantity ?? 0),
      isOrganic: Boolean(yieldItem.isOrganic),
      isWholesaleBulkAvailable: Boolean(yieldItem.isWholesaleBulkAvailable),
      bulkMinQuantity: yieldItem.bulkMinQuantity ? String(yieldItem.bulkMinQuantity) : '',
      bulkPricePerUnit: yieldItem.bulkPricePerUnit ? String(yieldItem.bulkPricePerUnit) : '',
      mediaUrl:
        yieldItem.image ||
        yieldItem.mediaUrls?.[0] ||
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800',
      isAvailable: yieldItem.isAvailable !== false,
    });
    setShowEditProduceModal(true);
  };

  const handlePickProducePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow photo gallery access to upload a produce photo.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: Platform.OS === 'ios',
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        setUploadingProducePhoto(true);
        const uploadRes = await uploadMediaApi(res.assets[0].uri, false);
        setEditProduceForm((prev: any) => ({ ...prev, mediaUrl: uploadRes.url }));
      }
    } catch (err: any) {
      Alert.alert('Upload Error', err.message || 'Could not upload produce image');
    } finally {
      setUploadingProducePhoto(false);
    }
  };

  const handleSaveEditProduce = async () => {
    if (!editingProduceItem?.id) return;
    if (!editProduceForm.title.trim() || !editProduceForm.pricePerUnit) {
      Alert.alert('Missing Required Fields', 'Please specify a produce name and price.');
      return;
    }
    try {
      setSavingEditProduce(true);
      const categoryObj = CATEGORIES.find((c) => c.name === editProduceForm.categoryName) || CATEGORIES[0];
      const chosenParcel = activeParcels.find((p: any) => p.id === editProduceForm.selectedParcelId) || activeParcels[0];
      const originDisplay = chosenParcel
        ? `${chosenParcel.name} (${chosenParcel.city}, ${chosenParcel.region})`
        : `${activeFarm.city || 'Cameroon'}, ${activeFarm.region || ''}`.trim();

      const updated = await updateProduceApi(editingProduceItem.id, {
        title: editProduceForm.title.trim(),
        description: editProduceForm.description.trim(),
        categoryId: categoryObj.id,
        categoryName: categoryObj.name,
        pricePerUnit: parseFloat(editProduceForm.pricePerUnit),
        unit: editProduceForm.unit === 'CUSTOM' ? 'KG' : editProduceForm.unit,
        originRegion: originDisplay,
        stockQuantity: parseFloat(editProduceForm.stockQuantity || '0'),
        minOrderQuantity: parseFloat(editProduceForm.minOrderQuantity || '1'),
        isOrganic: editProduceForm.isOrganic,
        isWholesaleBulkAvailable: editProduceForm.isWholesaleBulkAvailable,
        bulkMinQuantity: editProduceForm.bulkMinQuantity ? parseFloat(editProduceForm.bulkMinQuantity) : undefined,
        bulkPricePerUnit: editProduceForm.bulkPricePerUnit ? parseFloat(editProduceForm.bulkPricePerUnit) : undefined,
        isAvailable: editProduceForm.isAvailable,
        mediaUrls: [editProduceForm.mediaUrl],
      });

      // Update local state optimistically
      if (farmData && farmData.yields) {
        setFarmData({
          ...farmData,
          yields: farmData.yields.map((y: any) =>
            y.id === editingProduceItem.id
              ? {
                  ...y,
                  ...updated.yield,
                  title: editProduceForm.title.trim(),
                  description: editProduceForm.description.trim(),
                  price: parseFloat(editProduceForm.pricePerUnit),
                  pricePerUnit: parseFloat(editProduceForm.pricePerUnit),
                  stockQuantity: parseFloat(editProduceForm.stockQuantity || '0'),
                  unit: editProduceForm.unit === 'CUSTOM' ? 'KG' : editProduceForm.unit,
                  isOrganic: editProduceForm.isOrganic,
                  isAvailable: editProduceForm.isAvailable,
                  image: editProduceForm.mediaUrl,
                  mediaUrls: [editProduceForm.mediaUrl],
                }
              : y
          ),
        });
      }

      setShowEditProduceModal(false);
      Alert.alert('Produce Updated! 🌾', `"${editProduceForm.title}" has been successfully updated.`);
    } catch (err: any) {
      Alert.alert('Save Failed', err?.response?.data?.message || err.message || 'Could not update produce listing.');
    } finally {
      setSavingEditProduce(false);
    }
  };

  const handleDeleteProduce = (yieldItem: any) => {
    const itemToDelete = yieldItem || editingProduceItem;
    if (!itemToDelete?.id) return;

    Alert.alert(
      'Delete Produce Listing? 🗑️',
      `Are you sure you want to delete "${itemToDelete.title}"? This produce listing will be removed from ${activeFarm?.name || 'this farm'} and the marketplace.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Listing',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingProduce(true);
              await deleteProduceApi(itemToDelete.id);
              if (farmData && farmData.yields) {
                setFarmData({
                  ...farmData,
                  yields: farmData.yields.filter((y: any) => y.id !== itemToDelete.id),
                });
              }
              setShowEditProduceModal(false);
              setStockModalVisible(false);
              Alert.alert('Produce Removed', `"${itemToDelete.title}" has been deleted.`);
            } catch (err: any) {
              Alert.alert('Delete Failed', err?.response?.data?.message || err.message || 'Could not delete produce.');
            } finally {
              setDeletingProduce(false);
            }
          },
        },
      ]
    );
  };

  const handleCreateProduce = async () => {
    if (!produceForm.title.trim() || !produceForm.pricePerUnit || !produceForm.stockQuantity) {
      Alert.alert('Missing Required Fields', 'Please specify a produce name, price in FCFA, and harvest stock quantity.');
      return;
    }

    if (produceForm.unit === 'CUSTOM' && !produceForm.customUnit.trim()) {
      Alert.alert('Custom Unit Required', 'Please specify your local unit measure (e.g. Tas, Panier, Botte, Debe).');
      return;
    }

    if (!activeFarm?.id) {
      Alert.alert('Farm Error', 'No active farm selected to attach produce.');
      return;
    }

    try {
      setSavingProduce(true);
      const categoryObj = CATEGORIES.find((c) => c.name === produceForm.categoryName) || CATEGORIES[0];
      const effectiveUnitLabel = produceForm.unit === 'CUSTOM' ? produceForm.customUnit.trim() : produceForm.unit;
      
      const chosenParcel = activeParcels.find((p: any) => p.id === produceForm.selectedParcelId) || activeParcels[0];
      const originDisplay = chosenParcel
        ? `${chosenParcel.name} (${chosenParcel.city}, ${chosenParcel.region})`
        : `${activeFarm.city || 'Cameroon'}, ${activeFarm.region || ''}`.trim();

      await createProduceApi({
        farmId: activeFarm.id,
        categoryId: categoryObj.id,
        categoryName: categoryObj.name,
        title: produceForm.title.trim(),
        description: produceForm.description.trim() || `Freshly harvested ${produceForm.title.trim()} from ${chosenParcel?.name || activeFarm.name}.`,
        originRegion: originDisplay,
        pricePerUnit: parseFloat(produceForm.pricePerUnit),
        unit: produceForm.unit === 'CUSTOM' ? 'KG' : produceForm.unit,
        customUnit: produceForm.unit === 'CUSTOM' ? produceForm.customUnit.trim() : undefined,
        seasonality: produceForm.seasonality,
        shelfLifeDays: produceForm.shelfLifeDays ? parseInt(produceForm.shelfLifeDays, 10) : undefined,
        stockQuantity: parseFloat(produceForm.stockQuantity),
        minOrderQuantity: produceForm.minOrderQuantity ? parseFloat(produceForm.minOrderQuantity) : 1,
        isOrganic: produceForm.isOrganic,
        isWholesaleBulkAvailable: produceForm.isWholesaleBulkAvailable,
        bulkMinQuantity: produceForm.bulkMinQuantity ? parseFloat(produceForm.bulkMinQuantity) : undefined,
        bulkPricePerUnit: produceForm.bulkPricePerUnit ? parseFloat(produceForm.bulkPricePerUnit) : undefined,
        mediaUrls: [produceForm.mediaUrl],
      });

      Alert.alert(
        'AgroProduce Listed! 🎉',
        `"${produceForm.title}" is published under ${activeFarm.name} at ${produceForm.pricePerUnit} FCFA per ${effectiveUnitLabel}.`
      );
      setShowAddProduceModal(false);
      setProduceForm({
        title: '',
        description: '',
        categoryName: 'Vegetables & Greens',
        selectedParcelId: '',
        pricePerUnit: '',
        unit: 'KG',
        customUnit: '',
        seasonality: 'PEAK_HARVEST',
        shelfLifeDays: '7',
        minOrderQuantity: '1',
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

  if (loading && farmsList.length === 0) {
    return (
      <AgromPreloader
        fullScreen
        size="lg"
        theme="light"
      />
    );
  }

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
            <Text style={styles.primaryActionBtnText}>Register AgroFarm</Text>
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
                !activeCoverError && activeFarm?.coverPhoto
                  ? resolveMediaUrl(activeFarm.coverPhoto)
                  : 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800',
            }}
            style={styles.coverImage}
            onError={() => setActiveCoverError(true)}
          />
          <View style={styles.activeFarmHeaderActions}>
            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={handleOpenEditProfile}
              activeOpacity={0.85}
              accessibilityLabel="Edit Farm Profile"
            >
              <Edit3 size={13} color={Colors.white} />
              <Text style={styles.editProfileBtnText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteFarmHeaderBtn}
              onPress={() => handleDeleteFarm(activeFarm?.id)}
              activeOpacity={0.85}
              accessibilityLabel="Delete Farm"
            >
              <Trash2 size={13} color={Colors.white} />
            </TouchableOpacity>
          </View>

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
              {activeParcels.length > 0 && (
                <View style={styles.parcelsCountBadge}>
                  <Text style={styles.parcelsCountBadgeText}>
                    📍 {activeParcels.length} {activeParcels.length === 1 ? 'Site' : 'Sites'} ({activeFarm?.sizeHectares || 1.0} Ha)
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Analytics Highlights - High Visibility Numbers & Icons, No Redundant Text */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard} accessibilityLabel={`${farmYields.length} Active Yields`}>
            <View style={[styles.statIconBadge, { backgroundColor: '#EEF8F1' }]}>
              <Package size={22} color={Colors.cultivated} strokeWidth={2.4} />
            </View>
            <Text style={styles.statValue}>{farmYields.length}</Text>
          </View>

          <View style={styles.statCard} accessibilityLabel={`${activeFarm?.sizeHectares || 3.5} Hectares Cultivated Land`}>
            <View style={[styles.statIconBadge, { backgroundColor: '#FDF2E9' }]}>
              <Layers size={22} color={Colors.soil} strokeWidth={2.4} />
            </View>
            <Text style={styles.statValue}>{activeFarm?.sizeHectares || 3.5}ha</Text>
          </View>

          <View style={styles.statCard} accessibilityLabel={`${activeFarm?.rating?.toFixed(1) || '4.9'} Star Buyer Rating`}>
            <View style={[styles.statIconBadge, { backgroundColor: '#FEF7EE' }]}>
              <Star size={22} color={Colors.gold} fill={Colors.gold} strokeWidth={1.5} />
            </View>
            <Text style={styles.statValue}>{activeFarm?.rating?.toFixed(1) || '4.9'}</Text>
          </View>

          <View style={styles.statCard} accessibilityLabel="Credit Score 780">
            <View style={[styles.statIconBadge, { backgroundColor: '#FAF5FF' }]}>
              <TrendingUp size={22} color="#7C3AED" strokeWidth={2.4} />
            </View>
            <Text style={styles.statValue}>780</Text>
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
            {/* 📦 1. List Harvest Batch (Cultivated Green commercial action) */}
            <TouchableOpacity
              style={styles.hubActionCardPrimary}
              onPress={() => setShowAddProduceModal(true)}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="List Harvest Batch"
            >
              <View style={styles.hubActionIconCirclePrimary}>
                <Package size={22} color={Colors.white} strokeWidth={2.3} />
              </View>
              <Text style={styles.hubActionTitlePrimary}>List Harvest</Text>
            </TouchableOpacity>

            {/* 🎬 2. Record Field Story (Harvest Gold storytelling action) */}
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
            </TouchableOpacity>
          </View>

          {/* 📊 3. Credit Score & Loans */}
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
              <Text style={styles.ledgerCardTitle}>Credit Score & Loans</Text>
              <View style={styles.ledgerBadge}>
                <Text style={styles.ledgerBadgeText}>{user?.farmerProfile?.creditTier || 'GOLD'}</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#7C3AED" strokeWidth={2.5} />
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

        {/* Live Farm Produce Catalog Header with Add Produce Button */}
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
            <Text style={styles.addProduceHeaderBtnText}>Add Produce</Text>
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
          farmYields.map((yieldItem: any) => {
            const stockQty = yieldItem.stockQuantity ?? 0;
            const isOutOfStock = stockQty <= 0;
            const isPaused = yieldItem.isAvailable === false;
            return (
              <View
                key={yieldItem.id}
                style={styles.yieldCardRow}
              >
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                  activeOpacity={0.88}
                  onPress={() => openEditProduceModal(yieldItem)}
                >
                  <Image
                    source={{
                      uri:
                        yieldItem.image ||
                        yieldItem.mediaUrls?.[0] ||
                        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500',
                    }}
                    style={styles.yieldThumb}
                  />
                  <View style={styles.yieldMainCol}>
                    <View style={styles.yieldTitleTop}>
                      <Text style={styles.yieldItemTitle} numberOfLines={1}>
                        {yieldItem.title}
                      </Text>
                      {yieldItem.isOrganic && (
                        <View style={styles.miniOrganicBadge}>
                          <Sparkles size={10} color={Colors.cultivated} />
                          <Text style={styles.miniOrganicText}>Organic</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.yieldSubtitle} numberOfLines={1}>
                      {yieldItem.originRegion || activeFarm?.city || 'Cameroon'}
                    </Text>

                    <View style={styles.yieldBottomRow}>
                      <PriceTag
                        amount={yieldItem.price ?? yieldItem.pricePerUnit ?? 0}
                        unit={yieldItem.unit}
                        size="sm"
                      />
                      <View
                        style={[
                          styles.stockStatusPill,
                          isPaused
                            ? styles.stockStatusPillPaused
                            : isOutOfStock
                            ? styles.stockStatusPillOut
                            : styles.stockStatusPillActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.stockStatusPillText,
                            isPaused
                              ? styles.stockStatusPillTextPaused
                              : isOutOfStock
                              ? styles.stockStatusPillTextOut
                              : styles.stockStatusPillTextActive,
                          ]}
                        >
                          {isPaused
                            ? '⏸ Paused'
                            : isOutOfStock
                            ? '⚠️ Out of Stock'
                            : `📦 ${stockQty} ${yieldItem.unit}`}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>

                <View style={styles.yieldCardActionsCol}>
                  <TouchableOpacity
                    style={styles.yieldEditActionBtn}
                    onPress={() => openEditProduceModal(yieldItem)}
                    activeOpacity={0.8}
                    accessibilityLabel="Edit Produce"
                  >
                    <Edit3 size={12} color={Colors.cultivated} strokeWidth={2.4} />
                    <Text style={styles.yieldEditActionText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.yieldStockActionBtn}
                    onPress={() => openStockModal(yieldItem)}
                    activeOpacity={0.8}
                    accessibilityLabel="Manage Stock"
                  >
                    <Sliders size={12} color={Colors.espresso} strokeWidth={2.4} />
                    <Text style={styles.yieldStockActionText}>Stock</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.yieldDeleteActionBtn}
                    onPress={() => handleDeleteProduce(yieldItem)}
                    activeOpacity={0.8}
                    accessibilityLabel="Delete Produce"
                  >
                    <Trash2 size={12} color="#DC2626" strokeWidth={2.2} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {/* Operating Sites & Plots Footprint */}
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MapPin size={18} color={Colors.cultivated} />
            <Text style={styles.sectionHeader}>
              Operating Sites & Plots ({activeParcels.length})
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addSiteSmallBtn}
            onPress={() => setShowAddSiteModal(true)}
            activeOpacity={0.8}
          >
            <Plus size={14} color={Colors.cultivated} strokeWidth={2.5} />
            <Text style={styles.addSiteSmallBtnText}>Add Site</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.parcelsListContainer}>
          {activeParcels.map((parcel: any, idx: number) => (
            <View key={parcel.id || idx} style={styles.parcelCard}>
              <View style={styles.parcelCardLeft}>
                <View style={[styles.parcelIconBox, parcel.isHeadquarters && styles.parcelIconBoxHq]}>
                  <MapPin size={16} color={parcel.isHeadquarters ? Colors.cultivated : Colors.soil} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.parcelName} numberOfLines={1}>
                      {parcel.name}
                    </Text>
                    {parcel.isHeadquarters ? (
                      <View style={styles.hqBadge}>
                        <Text style={styles.hqBadgeText}>HQ Base</Text>
                      </View>
                    ) : (
                      <View style={styles.branchBadge}>
                        <Text style={styles.branchBadgeText}>Branch Plot</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.parcelLocation}>
                    {parcel.city}, {parcel.region} {parcel.division ? `(${parcel.division})` : ''}
                  </Text>
                  {parcel.location ? (
                    <Text style={styles.parcelLandmark} numberOfLines={1}>
                      📍 {parcel.location}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.parcelSizeBox}>
                <Text style={styles.parcelSizeVal}>{parcel.sizeHectares || 1.0}</Text>
                <Text style={styles.parcelSizeUnit}>Ha</Text>
              </View>
            </View>
          ))}
        </View>

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

      {/* AGROPRODUCE CREATION MODAL */}
      <Modal
        visible={showAddProduceModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddProduceModal(false)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top', 'left', 'right']}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderTitleRow}>
              <View style={styles.modalHeaderIconBadge}>
                <Sprout size={18} color={Colors.cultivated} />
              </View>
              <View>
                <Text style={styles.modalTitle}>AgroProduce</Text>
                <Text style={styles.modalHeaderSub}>{activeFarm?.name || 'List Harvest'}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowAddProduceModal(false)}
              accessibilityLabel="Close"
            >
              <X size={20} color={Colors.espresso} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
          >
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* 0. Harvest / Dispatch Operating Site Selector */}
              <View style={styles.siteSelectorWrapper}>
                <View style={styles.siteSelectorTitleRow}>
                  <MapPin size={15} color={Colors.cultivated} />
                  <Text style={[styles.inputLabel, { marginBottom: 0 }]}>Harvest / Dispatch Operating Site *</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.siteChipsScroll}>
                  {activeParcels.map((parcel: any) => {
                    const isSelected = (produceForm.selectedParcelId || activeParcels[0]?.id) === parcel.id;
                    return (
                      <TouchableOpacity
                        key={parcel.id}
                        style={[styles.siteSelectCard, isSelected && styles.siteSelectCardActive]}
                        onPress={() => setProduceForm((p) => ({ ...p, selectedParcelId: parcel.id }))}
                      >
                        <View style={styles.siteSelectCardTop}>
                          <Text style={[styles.siteSelectCardName, isSelected && styles.siteSelectCardNameActive]} numberOfLines={1}>
                            {parcel.name || parcel.city}
                          </Text>
                          {parcel.isHeadquarters && (
                            <View style={styles.hqPillMini}>
                              <Text style={styles.hqPillMiniText}>HQ</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.siteSelectCardSub, isSelected && styles.siteSelectCardSubActive]}>
                          {parcel.city} • {parcel.sizeHectares || 1.0} Ha
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    style={styles.addSiteChipBtn}
                    onPress={() => setShowAddSiteModal(true)}
                  >
                    <Plus size={14} color={Colors.cultivated} />
                    <Text style={styles.addSiteChipBtnText}>Add Plot</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>

              {/* 1. Produce Title */}
              <Text style={styles.inputLabel}>Produce Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Fresh Foumbot Vine Tomatoes, Penja Pepper..."
                placeholderTextColor={Colors.text.muted}
                value={produceForm.title}
                onChangeText={(t) => setProduceForm((p) => ({ ...p, title: t }))}
              />

              {/* 2. Category Selector */}
              <Text style={styles.inputLabel}>Agricultural Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {CATEGORIES.map((cat) => {
                  const isSelected = produceForm.categoryName === cat.name;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.choiceChip,
                        isSelected && styles.choiceChipActive,
                      ]}
                      onPress={() => setProduceForm((p) => ({ ...p, categoryName: cat.name }))}
                    >
                      <Text style={styles.catEmoji}>{cat.emoji}</Text>
                      <Text style={[styles.choiceChipText, isSelected && styles.choiceChipTextActive]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* 3. Seasonality Selector */}
              <Text style={styles.inputLabel}>Harvest Season *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {SEASONS.map((season) => {
                  const isSelected = produceForm.seasonality === season.id;
                  return (
                    <TouchableOpacity
                      key={season.id}
                      style={[
                        styles.seasonChip,
                        isSelected && styles.seasonChipActive,
                      ]}
                      onPress={() => setProduceForm((p) => ({ ...p, seasonality: season.id }))}
                    >
                      <Text style={styles.seasonBadge}>{season.badge}</Text>
                      <Text style={[styles.seasonChipTitle, isSelected && styles.seasonChipTitleActive]}>
                        {season.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* 4. Full-Width Dedicated Price Row */}
              <Text style={styles.inputLabel}>Harvest Price (FCFA) *</Text>
              <View style={styles.priceInputWrapper}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="e.g. 1500"
                  placeholderTextColor={Colors.text.muted}
                  keyboardType="numeric"
                  value={produceForm.pricePerUnit}
                  onChangeText={(t) => setProduceForm((p) => ({ ...p, pricePerUnit: t }))}
                />
                <View style={styles.priceCurrencyTag}>
                  <Text style={styles.priceCurrencyTagText}>FCFA</Text>
                </View>
              </View>

              {/* 5. Unit Selector (PLACED DIRECTLY UNDER THE PRICE) */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>
                Produce Unit of Measure *
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScrollRow}>
                {UNITS.map((u) => {
                  const isSelected = produceForm.unit === u.id;
                  return (
                    <TouchableOpacity
                      key={u.id}
                      style={[styles.fullUnitCard, isSelected && styles.fullUnitCardActive]}
                      onPress={() => setProduceForm((p) => ({ ...p, unit: u.id }))}
                    >
                      <Text style={[styles.fullUnitTitle, isSelected && styles.fullUnitTitleActive]}>
                        {u.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Custom Unit Input if selected */}
              {produceForm.unit === 'CUSTOM' && (
                <View style={styles.customUnitContainer}>
                  <Text style={styles.customUnitLabel}>
                    Custom Measure *
                  </Text>
                  <TextInput
                    style={styles.customUnitInput}
                    placeholder="e.g. Tas, Panier, Botte, Debe, Filet..."
                    placeholderTextColor={Colors.text.muted}
                    value={produceForm.customUnit}
                    onChangeText={(t) => setProduceForm((p) => ({ ...p, customUnit: t }))}
                    autoCapitalize="words"
                  />
                </View>
              )}

              {/* Live Price Preview Tag */}
              <View style={styles.livePricePreview}>
                <Tag size={13} color={Colors.cultivated} />
                <Text style={styles.livePricePreviewText}>
                  Listing: <Text style={{ fontFamily: Fonts.monoBold, color: Colors.espresso }}>
                    {produceForm.pricePerUnit ? `${Number(produceForm.pricePerUnit).toLocaleString()} FCFA` : '--- FCFA'}
                  </Text>
                  {' / '}
                  <Text style={{ fontFamily: Fonts.bodySemiBold, color: Colors.cultivated }}>
                    {produceForm.unit === 'CUSTOM'
                      ? (produceForm.customUnit || 'Custom Unit')
                      : (UNITS.find((u) => u.id === produceForm.unit)?.label || produceForm.unit)}
                  </Text>
                </Text>
              </View>

              {/* 6. Stock Quantity & Minimum Order Quantity */}
              <View style={styles.twoColRow}>
                <View style={{ flex: 1.2 }}>
                  <Text style={styles.inputLabel}>Available Stock *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder={`e.g. 100 (${produceForm.unit === 'CUSTOM' ? produceForm.customUnit || 'units' : produceForm.unit})`}
                    placeholderTextColor={Colors.text.muted}
                    keyboardType="numeric"
                    value={produceForm.stockQuantity}
                    onChangeText={(t) => setProduceForm((p) => ({ ...p, stockQuantity: t }))}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Min Order (MOQ)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 1"
                    placeholderTextColor={Colors.text.muted}
                    keyboardType="numeric"
                    value={produceForm.minOrderQuantity}
                    onChangeText={(t) => setProduceForm((p) => ({ ...p, minOrderQuantity: t }))}
                  />
                </View>
              </View>

              {/* 7. Estimated Shelf-Life / Freshness */}
              <Text style={styles.inputLabel}>Shelf-Life after Harvest</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {SHELF_LIFE_OPTIONS.map((opt) => {
                  const isSelected = produceForm.shelfLifeDays === opt.days;
                  return (
                    <TouchableOpacity
                      key={opt.days}
                      style={[
                        styles.shelfLifeChip,
                        isSelected && styles.shelfLifeChipActive,
                      ]}
                      onPress={() => setProduceForm((p) => ({ ...p, shelfLifeDays: opt.days }))}
                    >
                      <Clock size={13} color={isSelected ? Colors.cultivated : Colors.text.secondary} />
                      <Text style={[styles.shelfLifeText, isSelected && styles.shelfLifeTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* 8. Wholesale / Buyam-Sellam Bulk Pricing */}
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
                  <Text style={styles.toggleTitle}>Wholesale / Bulk Pricing</Text>
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

              {/* 9. Certified Organic / Cameroon GAP Verification */}
              <TouchableOpacity
                style={[styles.toggleRow, { marginTop: 10 }]}
                onPress={() => setProduceForm((p) => ({ ...p, isOrganic: !p.isOrganic }))}
              >
                <View style={[styles.checkbox, produceForm.isOrganic && styles.checkboxActive]}>
                  {produceForm.isOrganic && (
                    <Check size={14} color={Colors.white} strokeWidth={3} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>Certified Organic / GAP</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>

            {/* Pinned Bottom Action Bar - Protected from phone navbar & gesture bar */}
            <View style={[styles.modalFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, savingProduce && { opacity: 0.7 }]}
                onPress={handleCreateProduce}
                disabled={savingProduce}
              >
                {savingProduce ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <View style={styles.modalSubmitContent}>
                    <Sprout size={18} color={Colors.white} />
                    <Text style={styles.modalSubmitBtnText}>Publish to Marketplace</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* QUICK-STOCK & INVENTORY MANAGEMENT MODAL */}
      <Modal
        visible={stockModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setStockModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top', 'left', 'right']}>
          {/* Stock Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderTitleRow}>
              <View style={[styles.modalHeaderIconBadge, { backgroundColor: '#eef8f1' }]}>
                <Sliders size={18} color={Colors.cultivated} />
              </View>
              <View>
                <Text style={styles.modalTitle}>Manage Inventory</Text>
                <Text style={styles.modalHeaderSub} numberOfLines={1}>
                  {selectedStockYield?.title || 'Harvest Batch'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setStockModalVisible(false)}
              accessibilityLabel="Close"
            >
              <X size={20} color={Colors.espresso} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
          >
            <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
              {/* Snapshot Card */}
              {selectedStockYield && (
                <View style={styles.stockSummaryCard}>
                  <Image
                    source={{
                      uri:
                        selectedStockYield.image ||
                        selectedStockYield.mediaUrls?.[0] ||
                        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500',
                    }}
                    style={styles.stockSummaryThumb}
                  />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.stockSummaryTitle} numberOfLines={1}>
                      {selectedStockYield.title}
                    </Text>
                    <Text style={styles.stockSummarySubtitle}>
                      {selectedStockYield.unit} packaging • {selectedStockYield.originRegion || activeFarm?.city || 'Cameroon'}
                    </Text>
                    <View style={styles.stockSummaryBadgeRow}>
                      <View style={styles.currentStockPill}>
                        <Package size={13} color={Colors.canopy} />
                        <Text style={styles.currentStockPillText}>
                          Current: {selectedStockYield.stockQuantity || 0} {selectedStockYield.unit}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.liveStatusPill,
                          isAvailableToggle ? styles.liveStatusActive : styles.liveStatusPaused,
                        ]}
                      >
                        <Text
                          style={[
                            styles.liveStatusText,
                            isAvailableToggle ? styles.liveStatusTextActive : styles.liveStatusTextPaused,
                          ]}
                        >
                          {isAvailableToggle ? '🟢 Live on Market' : '⏸ Paused'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Action Mode Segmented Controls */}
              <Text style={[styles.inputLabel, { marginTop: 18 }]}>Select Inventory Action</Text>
              <View style={styles.stockModeSegment}>
                <TouchableOpacity
                  style={[
                    styles.stockModeTab,
                    stockActionTab === 'REPLENISH' && styles.stockModeTabActiveGreen,
                  ]}
                  onPress={() => {
                    setStockActionTab('REPLENISH');
                    setStockInputDelta('');
                  }}
                  activeOpacity={0.8}
                >
                  <TrendingUp
                    size={16}
                    color={stockActionTab === 'REPLENISH' ? Colors.cultivated : Colors.text.secondary}
                  />
                  <Text
                    style={[
                      styles.stockModeTabText,
                      stockActionTab === 'REPLENISH' && styles.stockModeTabTextActiveGreen,
                    ]}
                  >
                    + Replenish Harvest
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.stockModeTab,
                    stockActionTab === 'SPOILAGE' && styles.stockModeTabActiveRed,
                  ]}
                  onPress={() => {
                    setStockActionTab('SPOILAGE');
                    setStockInputDelta('');
                  }}
                  activeOpacity={0.8}
                >
                  <TrendingDown
                    size={16}
                    color={stockActionTab === 'SPOILAGE' ? '#dc2626' : Colors.text.secondary}
                  />
                  <Text
                    style={[
                      styles.stockModeTabText,
                      stockActionTab === 'SPOILAGE' && styles.stockModeTabTextActiveRed,
                    ]}
                  >
                    - Write Off Spoilage
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Explanatory Info Card */}
              <View
                style={[
                  styles.stockActionInfoBox,
                  stockActionTab === 'REPLENISH'
                    ? styles.stockActionInfoGreen
                    : styles.stockActionInfoRed,
                ]}
              >
                <Text style={styles.stockActionInfoTitle}>
                  {stockActionTab === 'REPLENISH'
                    ? '🌱 Morning Harvest Replenishment'
                    : '⚠️ Spoilage & Damaged Produce Deduction'}
                </Text>
                <Text style={styles.stockActionInfoDesc}>
                  {stockActionTab === 'REPLENISH'
                    ? `Add freshly harvested ${selectedStockYield?.unit || 'units'} directly to your available inventory on the marketplace.`
                    : `Deduct bruised, overripe, or rotten ${selectedStockYield?.unit || 'units'} so buyers only order what is physically ready for delivery.`}
                </Text>
              </View>

              {/* Quick Preset Increment Chips */}
              <Text style={styles.inputLabel}>
                {stockActionTab === 'REPLENISH' ? 'Quick Add Presets' : 'Quick Deduct Presets'}
              </Text>
              <View style={styles.presetChipRow}>
                {(stockActionTab === 'REPLENISH'
                  ? ['5', '10', '25', '50', '100']
                  : ['2', '5', '10', '20']
                ).map((val) => {
                  const isCurrent = stockInputDelta === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.presetChip,
                        isCurrent &&
                          (stockActionTab === 'REPLENISH'
                            ? styles.presetChipActiveGreen
                            : styles.presetChipActiveRed),
                      ]}
                      onPress={() => setStockInputDelta(val)}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          isCurrent &&
                            (stockActionTab === 'REPLENISH'
                              ? styles.presetChipTextActiveGreen
                              : styles.presetChipTextActiveRed),
                        ]}
                      >
                        {stockActionTab === 'REPLENISH' ? `+${val}` : `-${val}`} {selectedStockYield?.unit}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom Input */}
              <Text style={styles.inputLabel}>
                Custom {stockActionTab === 'REPLENISH' ? 'Quantity to Add' : 'Quantity to Deduct'} ({selectedStockYield?.unit})
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder={`e.g. 15`}
                placeholderTextColor={Colors.text.muted}
                keyboardType="numeric"
                value={stockInputDelta}
                onChangeText={setStockInputDelta}
              />

              {/* Live Calculation Preview */}
              {selectedStockYield && (
                <View style={styles.projectedCard}>
                  <Text style={styles.projectedCardLabel}>Projected New Available Stock:</Text>
                  <View style={styles.projectedValuesRow}>
                    <Text style={styles.projectedOldVal}>
                      {selectedStockYield.stockQuantity || 0} {selectedStockYield.unit}
                    </Text>
                    <Text style={styles.projectedArrow}>➔</Text>
                    <Text style={styles.projectedNewVal}>
                      {Math.max(
                        0,
                        (selectedStockYield.stockQuantity || 0) +
                          (stockActionTab === 'REPLENISH'
                            ? parseFloat(stockInputDelta || '0') || 0
                            : -(parseFloat(stockInputDelta || '0') || 0))
                      )}{' '}
                      {selectedStockYield.unit}
                    </Text>
                  </View>
                </View>
              )}

              {/* Availability Switch */}
              <View style={styles.availabilityRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.availabilityTitle}>Marketplace Listing Status</Text>
                  <Text style={styles.availabilitySubtitle}>
                    {isAvailableToggle
                      ? 'Listing is LIVE. Buyers can browse, chat, and checkout this harvest.'
                      : 'Listing is PAUSED. Produce is hidden from buyer searches until you re-activate.'}
                  </Text>
                </View>
                <Switch
                  value={isAvailableToggle}
                  onValueChange={setIsAvailableToggle}
                  trackColor={{ false: Colors.parchmentDim, true: Colors.cultivated }}
                  thumbColor={Colors.white}
                />
              </View>
            </ScrollView>

            {/* Modal Bottom Footer */}
            {/* Modal Bottom Footer */}
            <View style={[styles.modalFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, updatingStock && { opacity: 0.7 }]}
                onPress={handleSaveStock}
                disabled={updatingStock}
              >
                {updatingStock ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <View style={styles.modalSubmitContent}>
                    <CheckCircle2 size={18} color={Colors.white} />
                    <Text style={styles.modalSubmitBtnText}>Save Inventory Changes</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editProduceFromStockBtn}
                onPress={() => {
                  const item = selectedStockYield;
                  setStockModalVisible(false);
                  openEditProduceModal(item);
                }}
              >
                <Edit3 size={14} color={Colors.cultivated} />
                <Text style={styles.editProduceFromStockText}>Edit Full Produce Details (Price, Photo, Info) →</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* EDIT PRODUCE MODAL */}
      <Modal
        visible={showEditProduceModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditProduceModal(false)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top', 'left', 'right']}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderTitleRow}>
              <View style={[styles.modalHeaderIconBadge, { backgroundColor: '#eef8f1' }]}>
                <Edit3 size={18} color={Colors.cultivated} />
              </View>
              <View>
                <Text style={styles.modalTitle}>Modify Produce Batch</Text>
                <Text style={styles.modalHeaderSub} numberOfLines={1}>
                  {editingProduceItem?.title || 'Edit Listing'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowEditProduceModal(false)}
              accessibilityLabel="Close"
            >
              <X size={20} color={Colors.espresso} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
          >
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Photo Preview & Change Photo */}
              <Text style={styles.inputLabel}>Produce Photo</Text>
              <View style={styles.editProducePhotoWrapper}>
                <Image
                  source={{ uri: editProduceForm.mediaUrl }}
                  style={styles.editProducePhoto}
                />
                <TouchableOpacity
                  style={styles.changeProducePhotoBtn}
                  onPress={handlePickProducePhoto}
                  disabled={uploadingProducePhoto}
                >
                  {uploadingProducePhoto ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Camera size={14} color={Colors.white} />
                      <Text style={styles.changeProducePhotoText}>Change Photo</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Harvest Operating Site Selector */}
              <View style={styles.siteSelectorWrapper}>
                <View style={styles.siteSelectorTitleRow}>
                  <MapPin size={15} color={Colors.cultivated} />
                  <Text style={[styles.inputLabel, { marginBottom: 0 }]}>Harvest Operating Site</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.siteChipsScroll}>
                  {activeParcels.map((parcel: any) => {
                    const isSelected = (editProduceForm.selectedParcelId || activeParcels[0]?.id) === parcel.id;
                    return (
                      <TouchableOpacity
                        key={parcel.id}
                        style={[styles.siteSelectCard, isSelected && styles.siteSelectCardActive]}
                        onPress={() => setEditProduceForm((p: any) => ({ ...p, selectedParcelId: parcel.id }))}
                      >
                        <View style={styles.siteSelectCardTop}>
                          <Text style={[styles.siteSelectCardName, isSelected && styles.siteSelectCardNameActive]} numberOfLines={1}>
                            {parcel.name || parcel.city}
                          </Text>
                          {parcel.isHeadquarters && (
                            <View style={styles.hqPillMini}>
                              <Text style={styles.hqPillMiniText}>HQ</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.siteSelectCardSub, isSelected && styles.siteSelectCardSubActive]}>
                          {parcel.city} • {parcel.sizeHectares || 1.0} Ha
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Title */}
              <Text style={styles.inputLabel}>Produce Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Fresh Foumbot Vine Tomatoes..."
                placeholderTextColor={Colors.text.muted}
                value={editProduceForm.title}
                onChangeText={(t) => setEditProduceForm((p: any) => ({ ...p, title: t }))}
              />

              {/* Category */}
              <Text style={styles.inputLabel}>Agricultural Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {CATEGORIES.map((cat) => {
                  const isSelected = editProduceForm.categoryName === cat.name;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.choiceChip, isSelected && styles.choiceChipActive]}
                      onPress={() => setEditProduceForm((p: any) => ({ ...p, categoryName: cat.name }))}
                    >
                      <Text style={styles.catEmoji}>{cat.emoji}</Text>
                      <Text style={[styles.choiceChipText, isSelected && styles.choiceChipTextActive]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Price and Unit */}
              <View style={styles.twoColRow}>
                <View style={{ flex: 1.2 }}>
                  <Text style={styles.inputLabel}>Price (FCFA) *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 1500"
                    placeholderTextColor={Colors.text.muted}
                    keyboardType="numeric"
                    value={editProduceForm.pricePerUnit}
                    onChangeText={(t) => setEditProduceForm((p: any) => ({ ...p, pricePerUnit: t }))}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Unit Measure</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.miniUnitScroll}>
                    {UNITS.slice(0, 7).map((u) => {
                      const isSelected = editProduceForm.unit === u.id;
                      return (
                        <TouchableOpacity
                          key={u.id}
                          style={[styles.unitChip, isSelected && styles.unitChipActive]}
                          onPress={() => setEditProduceForm((p: any) => ({ ...p, unit: u.id }))}
                        >
                          <Text style={[styles.unitChipText, isSelected && styles.unitChipTextActive]}>
                            {u.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>

              {/* Stock and MOQ */}
              <View style={styles.twoColRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Available Stock ({editProduceForm.unit})</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 50"
                    placeholderTextColor={Colors.text.muted}
                    keyboardType="numeric"
                    value={editProduceForm.stockQuantity}
                    onChangeText={(t) => setEditProduceForm((p: any) => ({ ...p, stockQuantity: t }))}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Min Order (MOQ)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 1"
                    placeholderTextColor={Colors.text.muted}
                    keyboardType="numeric"
                    value={editProduceForm.minOrderQuantity}
                    onChangeText={(t) => setEditProduceForm((p: any) => ({ ...p, minOrderQuantity: t }))}
                  />
                </View>
              </View>

              {/* Description */}
              <Text style={styles.inputLabel}>Farmer Notes & Description</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaInput]}
                placeholder="Describe freshness, harvest time, packaging, sweetness, and grading..."
                placeholderTextColor={Colors.text.muted}
                multiline
                numberOfLines={3}
                value={editProduceForm.description}
                onChangeText={(t) => setEditProduceForm((p: any) => ({ ...p, description: t }))}
              />

              {/* Wholesale / Bulk Pricing */}
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() =>
                  setEditProduceForm((p: any) => ({
                    ...p,
                    isWholesaleBulkAvailable: !p.isWholesaleBulkAvailable,
                  }))
                }
              >
                <View
                  style={[
                    styles.checkbox,
                    editProduceForm.isWholesaleBulkAvailable && styles.checkboxActive,
                  ]}
                >
                  {editProduceForm.isWholesaleBulkAvailable && (
                    <Check size={14} color={Colors.white} strokeWidth={3} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>Wholesale / Bulk Pricing</Text>
                </View>
              </TouchableOpacity>

              {editProduceForm.isWholesaleBulkAvailable && (
                <View style={styles.twoColRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Min Bulk Qty</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 10"
                      placeholderTextColor={Colors.text.muted}
                      keyboardType="numeric"
                      value={editProduceForm.bulkMinQuantity}
                      onChangeText={(t) => setEditProduceForm((p: any) => ({ ...p, bulkMinQuantity: t }))}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Bulk Price (FCFA)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 1200"
                      placeholderTextColor={Colors.text.muted}
                      keyboardType="numeric"
                      value={editProduceForm.bulkPricePerUnit}
                      onChangeText={(t) => setEditProduceForm((p: any) => ({ ...p, bulkPricePerUnit: t }))}
                    />
                  </View>
                </View>
              )}

              {/* Organic toggle */}
              <TouchableOpacity
                style={[styles.toggleRow, { marginTop: 10 }]}
                onPress={() => setEditProduceForm((p: any) => ({ ...p, isOrganic: !p.isOrganic }))}
              >
                <View style={[styles.checkbox, editProduceForm.isOrganic && styles.checkboxActive]}>
                  {editProduceForm.isOrganic && (
                    <Check size={14} color={Colors.white} strokeWidth={3} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>Certified Organic / GAP</Text>
                </View>
              </TouchableOpacity>

              {/* Availability Switch */}
              <View style={[styles.availabilityRow, { marginTop: 16 }]}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.availabilityTitle}>Marketplace Listing Status</Text>
                  <Text style={styles.availabilitySubtitle}>
                    {editProduceForm.isAvailable
                      ? 'Listing is LIVE. Buyers can browse and order.'
                      : 'Listing is PAUSED. Produce is hidden from buyer searches.'}
                  </Text>
                </View>
                <Switch
                  value={editProduceForm.isAvailable}
                  onValueChange={(v) => setEditProduceForm((p: any) => ({ ...p, isAvailable: v }))}
                  trackColor={{ false: Colors.parchmentDim, true: Colors.cultivated }}
                  thumbColor={Colors.white}
                />
              </View>

              {/* Danger Zone: Delete Listing */}
              <View style={styles.dangerZoneBox}>
                <Text style={styles.dangerZoneTitle}>Delete Listing</Text>
                <Text style={styles.dangerZoneDesc}>
                  Permanently remove this harvest batch from this farm and the AgroMarket catalog.
                </Text>
                <TouchableOpacity
                  style={styles.deleteProduceOutlineBtn}
                  onPress={() => handleDeleteProduce(editingProduceItem)}
                  disabled={deletingProduce}
                >
                  {deletingProduce ? (
                    <ActivityIndicator size="small" color="#dc2626" />
                  ) : (
                    <>
                      <Trash2 size={15} color="#dc2626" />
                      <Text style={styles.deleteProduceOutlineText}>Delete This Produce Batch</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, savingEditProduce && { opacity: 0.7 }]}
                onPress={handleSaveEditProduce}
                disabled={savingEditProduce}
              >
                {savingEditProduce ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <View style={styles.modalSubmitContent}>
                    <CheckCircle2 size={18} color={Colors.white} />
                    <Text style={styles.modalSubmitBtnText}>Save Produce Changes</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* ADD OPERATIONAL SITE / PARCEL MODAL */}
      <Modal
        visible={showAddSiteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddSiteModal(false)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top', 'left', 'right']}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderTitleRow}>
              <View style={styles.modalHeaderIconBadge}>
                <MapPin size={18} color={Colors.cultivated} />
              </View>
              <View>
                <Text style={styles.modalTitle}>Add Operating Site</Text>
                <Text style={styles.modalHeaderSub}>{activeFarm?.name || 'Expand Farm Footprint'}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowAddSiteModal(false)}
              accessibilityLabel="Close"
            >
              <X size={20} color={Colors.espresso} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
          >
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.inputLabel}>Site / Plot Nickname *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Buea Hatchery, Mutengene Broiler Pen, Limbe Depot"
                placeholderTextColor={Colors.text.muted}
                value={newSiteForm.name}
                onChangeText={(t) => setNewSiteForm((s) => ({ ...s, name: t }))}
              />

              <Text style={styles.inputLabel}>Region *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {CAMEROON_REGIONS.map((reg) => {
                  const isSelected = newSiteForm.region === reg;
                  return (
                    <TouchableOpacity
                      key={reg}
                      style={[styles.choiceChip, isSelected && styles.choiceChipActive]}
                      onPress={() => setNewSiteForm((s) => ({ ...s, region: reg }))}
                    >
                      <Text style={[styles.choiceChipText, isSelected && styles.choiceChipTextActive]}>
                        {reg}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.twoColRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>City / Town *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Buea, Tiko, Foumbot"
                    placeholderTextColor={Colors.text.muted}
                    value={newSiteForm.city}
                    onChangeText={(t) => setNewSiteForm((s) => ({ ...s, city: t }))}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Division / Department</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Fako, Noun, Wouri"
                    placeholderTextColor={Colors.text.muted}
                    value={newSiteForm.division}
                    onChangeText={(t) => setNewSiteForm((s) => ({ ...s, division: t }))}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Specific Landmark / Quarter</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Mile 16, Behind Mile 4 Market, Along Kumba Road"
                placeholderTextColor={Colors.text.muted}
                value={newSiteForm.location}
                onChangeText={(t) => setNewSiteForm((s) => ({ ...s, location: t }))}
              />

              <Text style={styles.inputLabel}>Operating Land / Plot Size (Hectares) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 2.5"
                placeholderTextColor={Colors.text.muted}
                keyboardType="numeric"
                value={newSiteForm.sizeHectares}
                onChangeText={(t) => setNewSiteForm((s) => ({ ...s, sizeHectares: t }))}
              />

              <View style={styles.siteExplainerCard}>
                <MapPin size={16} color={Colors.cultivated} />
                <Text style={styles.siteExplainerText}>
                  This operating site will be linked to <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.espresso }}>{activeFarm?.name}</Text>. When listing produce, you can select this plot as the dispatch origin. Its acreage will automatically increase your overall enterprise footprint.
                </Text>
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, savingSite && { opacity: 0.7 }]}
                onPress={handleAddSite}
                disabled={savingSite}
              >
                {savingSite ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <View style={styles.modalSubmitContent}>
                    <Plus size={18} color={Colors.white} />
                    <Text style={styles.modalSubmitBtnText}>Register Operating Site</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* EDIT FARM STOREFRONT PROFILE MODAL */}
      <Modal
        visible={showEditProfileModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top', 'left', 'right']}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderTitleRow}>
              <View style={styles.modalHeaderIconBadge}>
                <Edit3 size={18} color={Colors.cultivated} />
              </View>
              <View>
                <Text style={styles.modalTitle}>Edit Farm Storefront</Text>
                <Text style={styles.modalHeaderSub}>{activeFarm?.name || 'Update Profile'}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowEditProfileModal(false)}
              accessibilityLabel="Close"
            >
              <X size={20} color={Colors.espresso} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
          >
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Cover Banner with 16:9 Aspect Crop */}
              <Text style={styles.inputLabel}>Storefront Cover Banner (16:9 Standard)</Text>
              <View style={styles.editBannerContainer}>
                <Image
                  source={{
                    uri:
                      !editCoverError && editForm.coverPhoto
                        ? resolveMediaUrl(editForm.coverPhoto)
                        : 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800',
                  }}
                  style={styles.editBannerImage}
                  onError={() => setEditCoverError(true)}
                />
                <TouchableOpacity
                  style={styles.editBannerChangeBtn}
                  onPress={handlePickEditCover}
                  disabled={uploadingCover}
                  activeOpacity={0.85}
                  accessibilityLabel="Change Cover Photo"
                >
                  {uploadingCover ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Camera size={15} color={Colors.white} />
                      <Text style={styles.editBannerChangeBtnText}>Change Photo (16:9)</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Farm Name */}
              <Text style={styles.inputLabel}>Farm Enterprise Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Mount Cameroon Highlands Farm"
                placeholderTextColor={Colors.text.muted}
                value={editForm.name}
                onChangeText={(t) => setEditForm((prev) => ({ ...prev, name: t }))}
              />

              {/* Farm Description */}
              <Text style={styles.inputLabel}>Farm Story & Ethics</Text>
              <TextInput
                style={[styles.textInput, { height: 90, textAlignVertical: 'top' }]}
                placeholder="Tell buyers about your soil, organic standards, and farming journey..."
                placeholderTextColor={Colors.text.muted}
                multiline
                numberOfLines={3}
                value={editForm.description}
                onChangeText={(t) => setEditForm((prev) => ({ ...prev, description: t }))}
              />

              {/* Specialties / Glance Tags Management */}
              <Text style={styles.inputLabel}>Produce Specialties (Glance Tags)</Text>
              <View style={styles.editTagInputRow}>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder="e.g. Foumbot Tomatoes, Penja Pepper"
                  placeholderTextColor={Colors.text.muted}
                  value={editTagInput}
                  onChangeText={setEditTagInput}
                  onSubmitEditing={handleAddEditTag}
                />
                <TouchableOpacity style={styles.editAddTagBtn} onPress={handleAddEditTag}>
                  <Plus size={16} color={Colors.white} />
                  <Text style={styles.editAddTagBtnText}>Add</Text>
                </TouchableOpacity>
              </View>

              {/* Tags List */}
              <View style={styles.editTagsContainer}>
                {editForm.primaryProduce.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.editTagChip}
                    onPress={() => handleRemoveEditTag(tag)}
                  >
                    <Text style={styles.editTagChipText}>{tag} ✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {editForm.primaryProduce.length === 0 && (
                <Text style={styles.editNoTagsText}>
                  No manual tags added. Your public card will automatically display tags based on your active listed produce.
                </Text>
              )}

              {/* Danger Zone: Delete Farm */}
              <View style={styles.dangerZone}>
                <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
                <Text style={styles.dangerZoneSubtitle}>
                  Permanently remove this farm enterprise from your AgroMarket portfolio. Any active produce listed under this farm will be detached.
                </Text>
                <TouchableOpacity
                  style={styles.deleteFarmBtn}
                  onPress={() => handleDeleteFarm(activeFarm?.id)}
                  disabled={isDeletingFarm}
                  activeOpacity={0.85}
                  accessibilityLabel="Delete Farm Enterprise"
                >
                  {isDeletingFarm ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Trash2 size={16} color={Colors.white} />
                      <Text style={styles.deleteFarmBtnText}>Delete Farm Enterprise</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

            </ScrollView>

            <View style={[styles.modalFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, savingProfile && { opacity: 0.7 }]}
                onPress={handleSaveFarmProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <View style={styles.modalSubmitContent}>
                    <CheckCircle2 size={18} color={Colors.white} />
                    <Text style={styles.modalSubmitBtnText}>Save Profile Changes</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* 2-STEP CASCADING DELETION & MIGRATION MODAL */}
      <Modal
        visible={deleteModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          if (!isDeletingFarm) setDeleteModalVisible(false);
        }}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <View style={[styles.modalHeaderIconBadge, { backgroundColor: '#FEE2E2' }]}>
                  {deleteStep === 1 ? (
                    <AlertTriangle size={18} color="#DC2626" />
                  ) : (
                    <Trash2 size={18} color="#DC2626" />
                  )}
                </View>
                <View>
                  <Text style={[styles.modalTitle, { color: '#991B1B' }]}>
                    {deleteStep === 1 ? 'Delete Farm Enterprise' : 'Final Destruction Confirmation'}
                  </Text>
                  <Text style={styles.modalHeaderSub}>
                    {deleteStep === 1 ? 'Step 1 of 2: Impact Assessment' : 'Step 2 of 2: Type Farm Name to Confirm'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => {
                  if (!isDeletingFarm) setDeleteModalVisible(false);
                }}
                disabled={isDeletingFarm}
              >
                <X size={18} color={Colors.espresso} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
              showsVerticalScrollIndicator={true}
            >
              {deleteStep === 1 ? (
                <>
                  {/* Warning Header Banner */}
                  <View style={styles.delWarnCard}>
                    <View style={styles.delWarnHeader}>
                      <AlertTriangle size={20} color="#DC2626" />
                      <Text style={styles.delWarnTitle}>Critical Enterprise Deletion</Text>
                    </View>
                    <Text style={styles.delWarnText}>
                      You are preparing to delete <Text style={{ fontFamily: Fonts.bodyBold, color: '#991B1B' }}>"{activeFarm?.name}"</Text>.
                      This enterprise profile and storefront will be removed from AgroMarket.
                    </Text>
                  </View>

                  {/* Associated Assets Found Card */}
                  <Text style={styles.delSectionTitle}>Associated Farm Assets Found</Text>
                  <View style={styles.delAssetsCard}>
                    <View style={styles.delAssetRow}>
                      <View style={[styles.delAssetIconBox, { backgroundColor: '#EEF8F1' }]}>
                        <Package size={17} color={Colors.cultivated} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.delAssetCountText}>
                          {farmYields.length} Active produce batches
                        </Text>
                        <Text style={styles.delAssetSubText}>Listed in AgroMarket catalog</Text>
                      </View>
                    </View>

                    <View style={styles.delAssetDivider} />

                    <View style={styles.delAssetRow}>
                      <View style={[styles.delAssetIconBox, { backgroundColor: '#FEF3C7' }]}>
                        <Video size={17} color="#D97706" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.delAssetCountText}>
                          {farmData?.posts?.length ?? (activeFarm?.posts?.length ?? 1)} Published harvest stories
                        </Text>
                        <Text style={styles.delAssetSubText}>Live on AgroFeed with buyer links</Text>
                      </View>
                    </View>

                    <View style={styles.delAssetDivider} />

                    <View style={styles.delAssetRow}>
                      <View style={[styles.delAssetIconBox, { backgroundColor: '#F3E8FF' }]}>
                        <Star size={17} color="#7C3AED" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.delAssetCountText}>
                          {activeFarm?.reviewsCount || farmData?.reviews?.length || 0} Customer reviews & ratings
                        </Text>
                        <Text style={styles.delAssetSubText}>Verified community trust score</Text>
                      </View>
                    </View>
                  </View>

                  {/* Safety Escrow Check Notice */}
                  <View style={styles.delEscrowNotice}>
                    <ShieldCheck size={16} color="#047857" />
                    <Text style={styles.delEscrowNoticeText}>
                      Safety Rule: Deletion will be strictly blocked if this farm has active escrow orders in progress or pending delivery.
                    </Text>
                  </View>

                  {/* MULTI-FARM CASE (farmsList.length > 1) */}
                  {farmsList.filter((f) => f.id !== activeFarm?.id).length > 0 ? (
                    <View style={{ marginTop: 18 }}>
                      <Text style={styles.delSectionTitle}>Asset Migration Option</Text>
                      <Text style={styles.delSectionSubtitle}>
                        You have other active farms. You can seamlessly transfer all produce batches and stories instead of losing them:
                      </Text>

                      {/* Option 1: Transfer (Recommended) */}
                      <TouchableOpacity
                        style={[
                          styles.delOptionCard,
                          deleteAction === 'transfer' && styles.delOptionCardSelected,
                        ]}
                        onPress={() => setDeleteAction('transfer')}
                        activeOpacity={0.8}
                      >
                        <View style={styles.delOptionRadioRow}>
                          <View style={[styles.delRadioCircle, deleteAction === 'transfer' && styles.delRadioCircleActive]}>
                            {deleteAction === 'transfer' && <View style={styles.delRadioInnerDot} />}
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={styles.delOptionBadgeRow}>
                              <Text style={styles.delOptionTitle}>Transfer produce & stories to another farm</Text>
                              <View style={styles.recommendedBadge}>
                                <Text style={styles.recommendedBadgeText}>Recommended</Text>
                              </View>
                            </View>
                            <Text style={styles.delOptionDesc}>
                              All active marketplace listings and AgroFeed stories will be reassigned so you don't lose sales or followers.
                            </Text>
                          </View>
                        </View>

                        {/* If transfer is selected, show farm picker */}
                        {deleteAction === 'transfer' && (
                          <View style={styles.delFarmPickerBox}>
                            <Text style={styles.delFarmPickerLabel}>Select Destination Farm:</Text>
                            {farmsList
                              .filter((f) => f.id !== activeFarm?.id)
                              .map((otherFarm) => {
                                const isTarget = deleteTargetFarmId === otherFarm.id;
                                return (
                                  <TouchableOpacity
                                    key={otherFarm.id}
                                    style={[
                                      styles.delFarmChoiceCard,
                                      isTarget && styles.delFarmChoiceCardActive,
                                    ]}
                                    onPress={() => setDeleteTargetFarmId(otherFarm.id)}
                                    activeOpacity={0.85}
                                  >
                                    <View style={styles.delFarmChoiceInfo}>
                                      <Text style={styles.delFarmChoiceName}>{otherFarm.name}</Text>
                                      <Text style={styles.delFarmChoiceLoc}>
                                        📍 {otherFarm.city || otherFarm.region || 'Cameroon'}
                                      </Text>
                                    </View>
                                    <View style={[styles.delChoiceCheck, isTarget && styles.delChoiceCheckActive]}>
                                      {isTarget && <Check size={14} color={Colors.white} />}
                                    </View>
                                  </TouchableOpacity>
                                );
                              })}
                          </View>
                        )}
                      </TouchableOpacity>

                      {/* Option 2: Delete All */}
                      <TouchableOpacity
                        style={[
                          styles.delOptionCard,
                          deleteAction === 'delete' && styles.delOptionCardSelectedDanger,
                        ]}
                        onPress={() => setDeleteAction('delete')}
                        activeOpacity={0.8}
                      >
                        <View style={styles.delOptionRadioRow}>
                          <View style={[styles.delRadioCircle, deleteAction === 'delete' && styles.delRadioCircleActiveDanger]}>
                            {deleteAction === 'delete' && <View style={[styles.delRadioInnerDot, { backgroundColor: '#DC2626' }]} />}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.delOptionTitle, deleteAction === 'delete' && { color: '#991B1B' }]}>
                              Permanently delete all produce & stories
                            </Text>
                            <Text style={styles.delOptionDesc}>
                              All produce batches will be removed from AgroMarket, and all harvest stories, comments, and likes will be permanently erased.
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    /* SINGLE FARM CASE (farmsList.length <= 1) */
                    <View style={{ marginTop: 18 }}>
                      <Text style={styles.delSectionTitle}>Recommended Alternatives</Text>
                      <Text style={styles.delSectionSubtitle}>
                        This is your only registered farm. Before deleting it, consider these safer alternatives:
                      </Text>

                      {/* Alternative 1: Edit Profile */}
                      <View style={styles.delAltCard}>
                        <View style={styles.delAltHeader}>
                          <Edit3 size={18} color={Colors.cultivated} />
                          <Text style={styles.delAltTitle}>Rebrand or Edit Profile Instead</Text>
                        </View>
                        <Text style={styles.delAltDesc}>
                          Need to change your farm name, location, or crop specialties? Editing your profile keeps your produce listings, review score, and harvest stories intact.
                        </Text>
                        <TouchableOpacity
                          style={styles.delAltBtn}
                          onPress={() => {
                            setDeleteModalVisible(false);
                            handleOpenEditProfile();
                          }}
                        >
                          <Text style={styles.delAltBtnText}>✏️ Edit Farm Profile</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Alternative 2: Register New Farm First */}
                      <View style={styles.delAltCard}>
                        <View style={styles.delAltHeader}>
                          <Plus size={18} color="#D97706" />
                          <Text style={styles.delAltTitle}>Create New Farm First to Migrate</Text>
                        </View>
                        <Text style={styles.delAltDesc}>
                          Register your new farm enterprise first, then come back to migrate your existing produce and harvest stories seamlessly.
                        </Text>
                        <TouchableOpacity
                          style={[styles.delAltBtn, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}
                          onPress={() => {
                            setDeleteModalVisible(false);
                            router.push('/farmer/new');
                          }}
                        >
                          <Text style={[styles.delAltBtnText, { color: '#92400E' }]}>+ Register New Farm First</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Destruction Acknowledgement Checkbox */}
                      <TouchableOpacity
                        style={[
                          styles.delAckBox,
                          deleteSingleFarmAgreed && styles.delAckBoxActive,
                        ]}
                        onPress={() => setDeleteSingleFarmAgreed(!deleteSingleFarmAgreed)}
                        activeOpacity={0.85}
                      >
                        <View style={[styles.delAckCheckbox, deleteSingleFarmAgreed && styles.delAckCheckboxActive]}>
                          {deleteSingleFarmAgreed && <Check size={14} color={Colors.white} />}
                        </View>
                        <Text style={styles.delAckText}>
                          I understand that all produce batches and harvest stories will be permanently deleted and cannot be recovered.
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              ) : (
                /* STEP 2: DESTRUCTIVE CONFIRMATION SCREEN */
                <>
                  <View style={styles.delStep2Hero}>
                    <View style={styles.delStep2IconCircle}>
                      <Trash2 size={28} color="#DC2626" />
                    </View>
                    <Text style={styles.delStep2Title}>Permanent Action Required</Text>
                    <Text style={styles.delStep2Sub}>
                      Please read carefully before confirming the deletion of your farm enterprise.
                    </Text>
                  </View>

                  {/* Chosen Action Summary Box */}
                  <View style={styles.delSummaryCard}>
                    <Text style={styles.delSummaryHeading}>Action Summary:</Text>
                    {deleteAction === 'transfer' && deleteTargetFarmId ? (
                      <View style={styles.delSummaryRow}>
                        <CheckCircle2 size={18} color={Colors.cultivated} />
                        <Text style={styles.delSummaryText}>
                          Produce batches and stories will be migrated to{' '}
                          <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.espresso }}>
                            "{farmsList.find((f) => f.id === deleteTargetFarmId)?.name || 'selected farm'}"
                          </Text>
                          .
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.delSummaryRow}>
                        <AlertCircle size={18} color="#DC2626" />
                        <Text style={[styles.delSummaryText, { color: '#991B1B' }]}>
                          ALL {farmYields.length} produce batches and {farmData?.posts?.length ?? 1} stories tied to this farm will be permanently erased.
                        </Text>
                      </View>
                    )}

                    <View style={styles.delSummaryRow}>
                      <Trash2 size={18} color="#DC2626" />
                      <Text style={[styles.delSummaryText, { color: '#991B1B' }]}>
                        Farm profile "{activeFarm?.name}" will be completely deleted.
                      </Text>
                    </View>
                  </View>

                  {/* Verification Input Box */}
                  <View style={styles.delConfirmInputBox}>
                    <Text style={styles.delConfirmPrompt}>
                      To proceed, type the exact farm name <Text style={{ fontFamily: Fonts.bodyBold, color: '#991B1B' }}>"{activeFarm?.name}"</Text> below:
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        styles.delConfirmInput,
                        deleteConfirmName.trim().toLowerCase() === activeFarm?.name?.trim().toLowerCase() && styles.delConfirmInputValid,
                      ]}
                      placeholder={activeFarm?.name || 'Type farm name'}
                      placeholderTextColor={Colors.text.muted}
                      value={deleteConfirmName}
                      onChangeText={setDeleteConfirmName}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {deleteConfirmName.length > 0 && deleteConfirmName.trim().toLowerCase() !== activeFarm?.name?.trim().toLowerCase() && (
                      <Text style={styles.delInputMismatch}>Names do not match yet.</Text>
                    )}
                  </View>
                </>
              )}
            </ScrollView>

            {/* Bottom Actions Bar */}
            <View style={[styles.delModalFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              {deleteStep === 1 ? (
                <View style={styles.delFooterRow}>
                  <TouchableOpacity
                    style={styles.delCancelBtn}
                    onPress={() => setDeleteModalVisible(false)}
                    disabled={isDeletingFarm}
                  >
                    <Text style={styles.delCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.delNextBtn,
                      (farmsList.filter((f) => f.id !== activeFarm?.id).length === 0 && !deleteSingleFarmAgreed) && {
                        opacity: 0.45,
                      },
                    ]}
                    onPress={() => setDeleteStep(2)}
                    disabled={farmsList.filter((f) => f.id !== activeFarm?.id).length === 0 && !deleteSingleFarmAgreed}
                  >
                    <Text style={styles.delNextBtnText}>Continue to Confirmation →</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.delFooterRow}>
                  <TouchableOpacity
                    style={styles.delCancelBtn}
                    onPress={() => setDeleteStep(1)}
                    disabled={isDeletingFarm}
                  >
                    <Text style={styles.delCancelBtnText}>← Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.delExecuteBtn,
                      (deleteConfirmName.trim().toLowerCase() !== activeFarm?.name?.trim().toLowerCase() || isDeletingFarm) && {
                        opacity: 0.4,
                      },
                    ]}
                    onPress={handleExecuteDeleteFarm}
                    disabled={deleteConfirmName.trim().toLowerCase() !== activeFarm?.name?.trim().toLowerCase() || isDeletingFarm}
                  >
                    {isDeletingFarm ? (
                      <ActivityIndicator color={Colors.white} size="small" />
                    ) : (
                      <>
                        <Trash2 size={16} color={Colors.white} />
                        <Text style={styles.delExecuteBtnText}>Permanently Delete Farm</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
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
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    borderRadius: Radii.card,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  statIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: Fonts.monoBold,
    fontSize: 17,
    color: Colors.espresso,
    marginTop: 6,
    includeFontPadding: false,
    textAlign: 'center',
  },
  statLabel: {
    display: 'none',
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
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    borderRadius: Radii.card,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  hubActionIconCirclePrimary: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cultivated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: Colors.cultivated,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  hubActionTitlePrimary: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13.5,
    color: Colors.canopy,
    textAlign: 'center',
  },
  hubActionSubPrimary: {
    display: 'none',
  },
  hubActionCardStory: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    borderRadius: Radii.card,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  hubActionIconCircleStory: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  hubActionTitleStory: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13.5,
    color: Colors.espresso,
    textAlign: 'center',
  },
  hubActionSubStory: {
    display: 'none',
  },
  hubActionCardLedger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    borderRadius: Radii.card,
    paddingVertical: 12,
    paddingHorizontal: 14,
    ...Shadows.subtle,
  },
  ledgerCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  hubActionIconCircleLedger: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  ledgerCardTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13.5,
    color: Colors.espresso,
  },
  ledgerBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ledgerBadgeText: {
    fontFamily: Fonts.monoBold,
    fontSize: 9.5,
    color: '#7C3AED',
  },
  ledgerCardSub: {
    display: 'none',
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
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
    backgroundColor: Colors.white,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalHeaderIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eef8f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: Fonts.displayItalic,
    fontSize: 19,
    color: Colors.canopy,
  },
  modalHeaderSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: Colors.parchment,
  },
  modalBody: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalBodyContent: {
    padding: 18,
    paddingBottom: 24,
  },
  inputLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13.5,
    color: Colors.espresso,
    marginBottom: 6,
    marginTop: 14,
  },
  textInput: {
    backgroundColor: Colors.parchment,
    borderRadius: Radii.input,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.espresso,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  catEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  choiceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.parchment,
    paddingVertical: 10,
    paddingHorizontal: 16,
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
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13.5,
    color: Colors.espresso,
  },
  choiceChipTextActive: {
    color: Colors.cultivated,
  },
  seasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.parchment,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radii.pill,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    gap: 6,
  },
  seasonChipActive: {
    backgroundColor: '#fef3c7',
    borderColor: Colors.gold,
  },
  seasonBadge: {
    fontSize: 15,
  },
  seasonChipTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13.5,
    color: Colors.espresso,
  },
  seasonChipTitleActive: {
    color: '#92400e',
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.parchment,
    borderRadius: Radii.input,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    overflow: 'hidden',
  },
  priceInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: Fonts.monoBold,
    fontSize: 16,
    color: Colors.espresso,
  },
  priceCurrencyTag: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.parchmentDim,
    borderLeftWidth: 1,
    borderLeftColor: Colors.parchmentDim,
  },
  priceCurrencyTagText: {
    fontFamily: Fonts.monoBold,
    fontSize: 12,
    color: Colors.espresso,
  },
  unitScrollRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  fullUnitCard: {
    backgroundColor: Colors.parchment,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: Radii.pill,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullUnitCardActive: {
    backgroundColor: Colors.canopy,
    borderColor: Colors.canopy,
  },
  fullUnitTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13.5,
    color: Colors.espresso,
  },
  fullUnitTitleActive: {
    color: Colors.white,
  },
  customUnitContainer: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: Radii.card,
    padding: 12,
    marginTop: 8,
  },
  customUnitLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.espresso,
    marginBottom: 6,
  },
  customUnitInput: {
    backgroundColor: Colors.white,
    borderRadius: Radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.espresso,
    borderWidth: 1,
    borderColor: '#94a3b8',
  },
  customUnitHelper: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  livePricePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: Radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
  },
  livePricePreviewText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.espresso,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  shelfLifeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.parchment,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  shelfLifeChipActive: {
    backgroundColor: '#eef8f1',
    borderColor: Colors.cultivated,
  },
  shelfLifeText: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: Colors.text.secondary,
  },
  shelfLifeTextActive: {
    fontFamily: Fonts.bodySemiBold,
    color: Colors.cultivated,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 16,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
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
  modalFooter: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.parchmentDim,
    paddingHorizontal: 20,
    paddingTop: 12,
    ...Shadows.subtle,
  },
  modalSubmitBtn: {
    backgroundColor: Colors.cultivated,
    paddingVertical: 14,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  modalSubmitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalSubmitBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.white,
  },

  // Produce Catalog Rows
  yieldCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    ...Shadows.subtle,
  },
  yieldThumb: {
    width: 64,
    height: 64,
    borderRadius: Radii.sm,
    backgroundColor: Colors.parchment,
    marginRight: 12,
    resizeMode: 'cover',
  },
  yieldMainCol: {
    flex: 1,
    justifyContent: 'center',
  },
  yieldTitleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  yieldItemTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14.5,
    color: Colors.espresso,
    flexShrink: 1,
  },
  miniOrganicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#eef8f1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.pill,
  },
  miniOrganicText: {
    fontFamily: Fonts.monoBold,
    fontSize: 9.5,
    color: Colors.cultivated,
  },
  yieldSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
    marginBottom: 4,
  },
  yieldBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: Radii.pill,
  },
  stockStatusPillActive: {
    backgroundColor: '#eef8f1',
  },
  stockStatusPillPaused: {
    backgroundColor: '#fef3c7',
  },
  stockStatusPillOut: {
    backgroundColor: '#fee2e2',
  },
  stockStatusPillText: {
    fontFamily: Fonts.monoBold,
    fontSize: 10.5,
  },
  stockStatusPillTextActive: {
    color: Colors.cultivated,
  },
  stockStatusPillTextPaused: {
    color: '#b45309',
  },
  stockStatusPillTextOut: {
    color: '#dc2626',
  },
  yieldCardActionsCol: {
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  yieldEditActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: Radii.sm,
    backgroundColor: '#EEF8F1',
    borderWidth: 1,
    borderColor: '#CCEBD5',
    gap: 3,
    minWidth: 54,
  },
  yieldEditActionText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10.5,
    color: Colors.cultivated,
  },
  yieldStockActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: Radii.sm,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 3,
    minWidth: 54,
  },
  yieldStockActionText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10.5,
    color: Colors.espresso,
  },
  yieldDeleteActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  editProduceFromStockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginTop: 6,
  },
  editProduceFromStockText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.cultivated,
  },
  editProducePhotoWrapper: {
    width: '100%',
    height: 160,
    borderRadius: Radii.card,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 14,
    backgroundColor: '#F3F4F6',
  },
  editProducePhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changeProducePhotoBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(23, 58, 32, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
  },
  changeProducePhotoText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.white,
  },
  miniUnitScroll: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  unitChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radii.sm,
    backgroundColor: Colors.parchment,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    marginRight: 6,
  },
  unitChipActive: {
    backgroundColor: '#eef8f1',
    borderColor: Colors.cultivated,
  },
  unitChipText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  unitChipTextActive: {
    fontFamily: Fonts.bodyBold,
    color: Colors.cultivated,
  },
  dangerZoneBox: {
    marginTop: 24,
    padding: 14,
    borderRadius: Radii.card,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 6,
  },
  dangerZoneTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: '#DC2626',
  },
  dangerZoneDesc: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: '#991B1B',
    lineHeight: 16,
  },
  deleteProduceOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radii.pill,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    backgroundColor: Colors.white,
    marginTop: 4,
  },
  deleteProduceOutlineText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12.5,
    color: '#DC2626',
  },

  // Stock Modal Styles
  stockSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.parchment,
    borderRadius: Radii.card,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    marginBottom: 8,
  },
  stockSummaryThumb: {
    width: 60,
    height: 60,
    borderRadius: Radii.sm,
    marginRight: 12,
    resizeMode: 'cover',
  },
  stockSummaryTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14.5,
    color: Colors.espresso,
  },
  stockSummarySubtitle: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: Colors.text.secondary,
  },
  stockSummaryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  currentStockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  currentStockPillText: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    color: Colors.canopy,
  },
  liveStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  liveStatusActive: {
    backgroundColor: '#eef8f1',
  },
  liveStatusPaused: {
    backgroundColor: '#fef3c7',
  },
  liveStatusText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10.5,
  },
  liveStatusTextActive: {
    color: Colors.cultivated,
  },
  liveStatusTextPaused: {
    color: '#b45309',
  },
  stockModeSegment: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  stockModeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radii.card,
    backgroundColor: Colors.parchment,
    borderWidth: 1.5,
    borderColor: Colors.parchmentDim,
  },
  stockModeTabActiveGreen: {
    backgroundColor: '#eef8f1',
    borderColor: Colors.cultivated,
  },
  stockModeTabActiveRed: {
    backgroundColor: '#fee2e2',
    borderColor: '#dc2626',
  },
  stockModeTabText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12.5,
    color: Colors.text.secondary,
  },
  stockModeTabTextActiveGreen: {
    color: Colors.cultivated,
  },
  stockModeTabTextActiveRed: {
    color: '#dc2626',
  },
  stockActionInfoBox: {
    padding: 12,
    borderRadius: Radii.card,
    marginBottom: 16,
    borderWidth: 1,
  },
  stockActionInfoGreen: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  stockActionInfoRed: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  stockActionInfoTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12.5,
    color: Colors.espresso,
    marginBottom: 3,
  },
  stockActionInfoDesc: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  presetChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    backgroundColor: Colors.parchment,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  presetChipActiveGreen: {
    backgroundColor: '#eef8f1',
    borderColor: Colors.cultivated,
  },
  presetChipActiveRed: {
    backgroundColor: '#fee2e2',
    borderColor: '#dc2626',
  },
  presetChipText: {
    fontFamily: Fonts.monoBold,
    fontSize: 12,
    color: Colors.espresso,
  },
  presetChipTextActiveGreen: {
    color: Colors.cultivated,
  },
  presetChipTextActiveRed: {
    color: '#dc2626',
  },
  projectedCard: {
    backgroundColor: '#f8fafc',
    borderRadius: Radii.card,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    padding: 14,
    marginVertical: 14,
    alignItems: 'center',
  },
  projectedCardLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11.5,
    color: Colors.text.secondary,
    marginBottom: 6,
  },
  projectedValuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  projectedOldVal: {
    fontFamily: Fonts.mono,
    fontSize: 15,
    color: Colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  projectedArrow: {
    fontSize: 16,
    color: Colors.text.muted,
  },
  projectedNewVal: {
    fontFamily: Fonts.monoBold,
    fontSize: 18,
    color: Colors.cultivated,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.parchment,
    borderRadius: Radii.card,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    marginTop: 6,
    marginBottom: 16,
  },
  availabilityTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13.5,
    color: Colors.espresso,
  },
  availabilitySubtitle: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 2,
    lineHeight: 15,
  },
  // Parcels & Multi-Site Styles
  parcelsCountBadge: {
    marginLeft: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  parcelsCountBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.white,
  },
  addSiteSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eef8f1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.cultivated,
  },
  addSiteSmallBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11.5,
    color: Colors.cultivated,
  },
  parcelsListContainer: {
    gap: 10,
    marginBottom: 20,
  },
  parcelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    ...Shadows.subtle,
  },
  parcelCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  parcelIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.parchment,
    justifyContent: 'center',
    alignItems: 'center',
  },
  parcelIconBoxHq: {
    backgroundColor: '#eef8f1',
  },
  parcelName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13.5,
    color: Colors.espresso,
    flexShrink: 1,
  },
  hqBadge: {
    backgroundColor: '#eef8f1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.pill,
  },
  hqBadgeText: {
    fontFamily: Fonts.monoBold,
    fontSize: 9.5,
    color: Colors.cultivated,
  },
  branchBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.pill,
  },
  branchBadgeText: {
    fontFamily: Fonts.monoBold,
    fontSize: 9.5,
    color: Colors.text.secondary,
  },
  parcelLocation: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11.5,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  parcelLandmark: {
    fontFamily: Fonts.body,
    fontSize: 10.5,
    color: Colors.text.muted,
    marginTop: 2,
  },
  parcelSizeBox: {
    alignItems: 'flex-end',
    backgroundColor: Colors.parchment,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  parcelSizeVal: {
    fontFamily: Fonts.monoBold,
    fontSize: 14,
    color: Colors.cultivated,
  },
  parcelSizeUnit: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    color: Colors.text.secondary,
  },
  // Produce modal site selector styles
  siteSelectorWrapper: {
    backgroundColor: Colors.parchment,
    borderRadius: Radii.card,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  siteSelectorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  siteChipsScroll: {
    flexDirection: 'row',
  },
  siteSelectCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    borderWidth: 1.5,
    borderColor: Colors.parchmentDim,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    minWidth: 120,
  },
  siteSelectCardActive: {
    borderColor: Colors.cultivated,
    backgroundColor: '#eef8f1',
  },
  siteSelectCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  siteSelectCardName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.espresso,
  },
  siteSelectCardNameActive: {
    color: Colors.cultivated,
  },
  hqPillMini: {
    backgroundColor: Colors.cultivated,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: Radii.pill,
  },
  hqPillMiniText: {
    fontFamily: Fonts.monoBold,
    fontSize: 8.5,
    color: Colors.white,
  },
  siteSelectCardSub: {
    fontFamily: Fonts.body,
    fontSize: 10.5,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  siteSelectCardSubActive: {
    color: Colors.cultivated,
  },
  addSiteChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.cultivated,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  addSiteChipBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.cultivated,
  },
  siteExplainerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#eef8f1',
    borderRadius: Radii.card,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#ccebd5',
  },
  siteExplainerText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: Colors.canopy,
    lineHeight: 16,
  },
  activeFarmHeaderActions: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(23, 58, 32, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(246, 238, 221, 0.3)',
    ...Shadows.subtle,
  },
  deleteFarmHeaderBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(220, 38, 38, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Shadows.subtle,
  },
  editProfileBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.white,
  },

  editBannerContainer: {
    width: '100%',
    height: 160,
    borderRadius: Radii.card,
    overflow: 'hidden',
    backgroundColor: Colors.parchmentDim,
    position: 'relative',
    marginTop: 4,
    borderWidth: 1.5,
    borderColor: Colors.parchmentDim,
  },
  editBannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  editBannerChangeBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(23, 58, 32, 0.88)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(246, 238, 221, 0.3)',
    ...Shadows.subtle,
  },
  editBannerChangeBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12.5,
    color: Colors.white,
  },
  editTagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  editAddTagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.cultivated,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radii.input,
  },
  editAddTagBtnText: {
    fontFamily: Fonts.bodySemiBold,
    color: Colors.white,
    fontSize: 13,
  },
  editTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  editTagChip: {
    backgroundColor: '#EEF8F1',
    borderWidth: 1,
    borderColor: 'rgba(78, 139, 63, 0.3)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.chip,
  },
  editTagChipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12.5,
    color: Colors.cultivated,
  },
  editNoTagsText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 16,
  },
  dangerZone: {
    marginTop: 24,
    marginBottom: 8,
    padding: 16,
    borderRadius: Radii.card,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dangerZoneTitle: {
    fontFamily: Fonts.displayBold,
    fontSize: 14,
    color: '#991B1B',
    marginBottom: 4,
  },
  dangerZoneSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: '#B91C1C',
    lineHeight: 17,
    marginBottom: 12,
  },
  deleteFarmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radii.pill,
  },
  deleteFarmBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13.5,
    color: Colors.white,
  },

  // Deletion Modal Styles
  delWarnCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radii.card,
    padding: 14,
    marginBottom: 16,
  },
  delWarnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  delWarnTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14.5,
    color: '#991B1B',
  },
  delWarnText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 19,
  },
  delSectionTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.espresso,
    marginBottom: 4,
  },
  delSectionSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12.5,
    color: Colors.text.secondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  delAssetsCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    borderRadius: Radii.card,
    padding: 14,
    marginBottom: 14,
    ...Shadows.subtle,
  },
  delAssetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  delAssetIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delAssetCountText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13.5,
    color: Colors.espresso,
  },
  delAssetSubText: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  delAssetDivider: {
    height: 1,
    backgroundColor: Colors.parchmentDim,
    marginVertical: 10,
  },
  delEscrowNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF8F1',
    borderRadius: Radii.input,
    padding: 10,
    borderWidth: 1,
    borderColor: '#CCEBD5',
    marginBottom: 14,
  },
  delEscrowNoticeText: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: 11.5,
    color: '#047857',
    lineHeight: 16,
  },
  delOptionCard: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.parchmentDim,
    borderRadius: Radii.card,
    padding: 14,
    marginBottom: 12,
    ...Shadows.subtle,
  },
  delOptionCardSelected: {
    borderColor: Colors.cultivated,
    backgroundColor: '#F7FCF8',
  },
  delOptionCardSelectedDanger: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  delOptionRadioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  delRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.text.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  delRadioCircleActive: {
    borderColor: Colors.cultivated,
  },
  delRadioCircleActiveDanger: {
    borderColor: '#DC2626',
  },
  delRadioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.cultivated,
  },
  delOptionBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 3,
  },
  delOptionTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13.5,
    color: Colors.espresso,
  },
  recommendedBadge: {
    backgroundColor: '#EEF8F1',
    borderWidth: 1,
    borderColor: '#CCEBD5',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: Radii.pill,
  },
  recommendedBadgeText: {
    fontFamily: Fonts.monoBold,
    fontSize: 9.5,
    color: '#047857',
  },
  delOptionDesc: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 17,
  },
  delFarmPickerBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  delFarmPickerLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.espresso,
    marginBottom: 8,
  },
  delFarmChoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.parchment,
    borderRadius: Radii.input,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    marginBottom: 6,
  },
  delFarmChoiceCardActive: {
    backgroundColor: '#EEF8F1',
    borderColor: Colors.cultivated,
  },
  delFarmChoiceInfo: {
    flex: 1,
  },
  delFarmChoiceName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.espresso,
  },
  delFarmChoiceLoc: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  delChoiceCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.text.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delChoiceCheckActive: {
    backgroundColor: Colors.cultivated,
    borderColor: Colors.cultivated,
  },
  delAltCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 10,
  },
  delAltHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  delAltTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13.5,
    color: Colors.espresso,
  },
  delAltDesc: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 17,
    marginBottom: 10,
  },
  delAltBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF8F1',
    borderWidth: 1,
    borderColor: '#CCEBD5',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.pill,
  },
  delAltBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: '#047857',
  },
  delAckBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radii.input,
    padding: 12,
    marginTop: 8,
  },
  delAckBoxActive: {
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
  },
  delAckCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  delAckCheckboxActive: {
    backgroundColor: '#DC2626',
  },
  delAckText: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 17,
  },
  delStep2Hero: {
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 14,
  },
  delStep2IconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  delStep2Title: {
    fontFamily: Fonts.displayItalic,
    fontSize: 20,
    color: '#991B1B',
    marginBottom: 4,
  },
  delStep2Sub: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  delSummaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 18,
    gap: 10,
  },
  delSummaryHeading: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.espresso,
    marginBottom: 2,
  },
  delSummaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  delSummaryText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 12.5,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  delConfirmInputBox: {
    marginBottom: 14,
  },
  delConfirmPrompt: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.espresso,
    marginBottom: 8,
    lineHeight: 19,
  },
  delConfirmInput: {
    borderColor: '#DC2626',
    borderWidth: 1.5,
  },
  delConfirmInputValid: {
    borderColor: Colors.cultivated,
    borderWidth: 1.5,
    backgroundColor: '#F7FCF8',
  },
  delInputMismatch: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: '#DC2626',
    marginTop: 4,
  },
  delModalFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.parchmentDim,
    backgroundColor: Colors.white,
  },
  delFooterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  delCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Radii.pill,
    backgroundColor: Colors.parchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delCancelBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13.5,
    color: Colors.espresso,
  },
  delNextBtn: {
    flex: 1.6,
    paddingVertical: 13,
    borderRadius: Radii.pill,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  delNextBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13.5,
    color: Colors.white,
  },
  delExecuteBtn: {
    flex: 1.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: Radii.pill,
    backgroundColor: '#DC2626',
  },
  delExecuteBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13.5,
    color: Colors.white,
  },
});

