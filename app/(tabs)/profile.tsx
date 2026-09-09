import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Dimensions,
  StatusBar,
  FlatList,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  Warehouse,
  ShoppingBag,
  Heart,
  Bookmark,
  Plus,
  Settings,
  ShieldCheck,
  CreditCard,
  Sparkles,
  MessageCircle,
  UserPlus,
  UserCheck,
  Grid,
  MapPin,
  Layers,
  ArrowLeft,
  Play,
  Film,
  Edit3,
  Camera,
  Upload,
  X,
  Check,
  Lock,
  Truck,
  CheckCircle2,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react-native';
import { fetchMyOrdersApi } from '@/components/api/orders';
import { useAuthStore } from '@/store/authStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import { fetchPublicProfileApi, toggleFollowUserApi, updateMyProfileApi } from '@/components/api/auth';
import { fetchFeedPostsApi, uploadMediaApi } from '@/components/api/posts';
import { Post } from '@/types';
import { agroYields as mockYields, users as mockUsers, farmers as mockFarmers, farms as mockFarms } from '@/mocks/data';
import PostCard from '@/components/PostCard';
import YieldCard from '@/components/YieldCard';
import FarmsList from '@/components/FarmsList';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import MeetingLeafLogo from '@/components/MeetingLeafLogo';
import BrandButton from '@/components/ui/BrandButton';
import FarmerBadge from '@/components/ui/FarmerBadge';
import ProfileHeaderMenu from '../../modules/farms/components/ProfileHeaderMenu';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ userId?: string }>();
  const { user: currentUser, isAuthenticated, logout, updateUser } = useAuthStore();
  const savedYieldIds = useFavoritesStore((s) => s.yields);

  const [activeTab, setActiveTab] = useState<'posts' | 'farms' | 'orders' | 'saved' | 'likes'>('posts');
  const [profileData, setProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [activeViewerIndex, setActiveViewerIndex] = useState(0);
  const [viewerHeight, setViewerHeight] = useState(Dimensions.get('window').height);
  const viewerFlatListRef = useRef<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Edit Profile State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Orders State
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const loadOrders = async () => {
    if (!isOwner) return;
    try {
      setLoadingOrders(true);
      const data = await fetchMyOrdersApi();
      if (Array.isArray(data) && data.length > 0) {
        setOrdersList(data);
      } else {
        setOrdersList([
          {
            id: 'ORD-8412',
            status: 'ESCROW_LOCKED',
            currency: 'XAF',
            totalAmount: 20000,
            createdAt: new Date().toISOString(),
            deliveryAddress: 'Bonapriso, Douala',
            items: [
              {
                id: 'i1',
                quantity: 5,
                unitPrice: 3500,
                totalPrice: 17500,
                yield: {
                  title: 'Ndop Plateau Heirloom Organic Tomatoes',
                  unit: 'CRATE',
                  mediaUrls: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800'],
                },
                farmer: { name: 'Tanyi Farms Cooperative' },
              },
            ],
          },
          {
            id: 'ORD-7991',
            status: 'IN_TRANSIT',
            currency: 'XAF',
            totalAmount: 38000,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            deliveryAddress: 'Akwa Market, Douala',
            items: [
              {
                id: 'i2',
                quantity: 10,
                unitPrice: 3800,
                totalPrice: 38000,
                yield: {
                  title: 'Fresh White Yam Tubers (Volcanic Soil)',
                  unit: 'BAG',
                  mediaUrls: ['https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=800'],
                },
                farmer: { name: 'Foumbot Highland Growers' },
              },
            ],
          },
        ]);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingOrders(false);
    }
  };

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
    waitForInteraction: false,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
    if (viewableItems && viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveViewerIndex(viewableItems[0].index);
    }
  }).current;

  const openPostViewer = (index: number) => {
    setActiveViewerIndex(index);
    setViewerVisible(true);
  };

  const handleDeletePost = (deletedPostId: string) => {
    setUserPosts((prev) => {
      const updated = prev.filter((p) => p.id !== deletedPostId);
      if (updated.length === 0) {
        setViewerVisible(false);
      }
      return updated;
    });
  };

  // Determine if viewing own profile or another user's profile
  const isOwner = Boolean(
    !params.userId || (currentUser?.id && params.userId === currentUser.id)
  );

  const targetUser = isOwner ? currentUser : profileData;
  const userHasFarm = Boolean(targetUser?.farms && targetUser.farms.length > 0);

  const loadTargetProfile = async () => {
    if (!isOwner && params.userId) {
      try {
        setLoadingProfile(true);
        const data = await fetchPublicProfileApi(params.userId);
        if (data) {
          setProfileData(data);
          setIsFollowing(Boolean(data.isFollowing));
        } else {
          // Mock data lookup fallback
          const foundFarmer = mockFarmers.find((f) => f.id === params.userId || f.userId === params.userId);
          const foundUser = mockUsers.find((u) => u.id === params.userId || u.farmerProfile?.id === params.userId);
          const fallbackUser = foundUser || {
            id: params.userId,
            name: foundFarmer ? foundFarmer.farmName : 'Victoy Eyong (Foumbot Farm)',
            email: 'partner@agromarket.com',
            phone: '+237 671 111 111',
            avatar: foundFarmer?.profilePhoto || 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=500&auto=format&fit=crop&q=60',
            role: 'FARMER',
            isVerified: true,
            farmerProfile: {
              id: foundFarmer?.id || 'f1',
              userId: params.userId,
              farmName: foundFarmer?.farmName || 'Green Valley Organic Farms',
              region: foundFarmer?.location || 'Foumbot, West Region',
              city: 'Foumbot',
              rating: foundFarmer?.rating || 4.9,
              totalRatings: 142,
              totalFollowers: foundFarmer?.followers || 320,
              bio: foundFarmer?.description || 'Specializing in fresh volcanic soil vegetables, vine tomatoes, and Penja pepper.',
            },
            farms: mockFarms,
          };
          setProfileData(fallbackUser);
          setIsFollowing(true);
        }
      } catch (err) {
        // Fallback to mock user
        const foundFarmer = mockFarmers.find((f) => f.id === params.userId || f.userId === params.userId);
        const foundUser = mockUsers.find((u) => u.id === params.userId || u.farmerProfile?.id === params.userId);
        const fallbackUser = foundUser || {
          id: params.userId,
          name: foundFarmer ? foundFarmer.farmName : 'Victoy Eyong (Foumbot Farm)',
          email: 'partner@agromarket.com',
          phone: '+237 671 111 111',
          avatar: foundFarmer?.profilePhoto || 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=500&auto=format&fit=crop&q=60',
          role: 'FARMER',
          isVerified: true,
          farmerProfile: {
            id: foundFarmer?.id || 'f1',
            userId: params.userId,
            farmName: foundFarmer?.farmName || 'Green Valley Organic Farms',
            region: foundFarmer?.location || 'Foumbot, West Region',
            city: 'Foumbot',
            rating: foundFarmer?.rating || 4.9,
            totalRatings: 142,
            totalFollowers: foundFarmer?.followers || 320,
            bio: foundFarmer?.description || 'Specializing in fresh volcanic soil vegetables, vine tomatoes, and Penja pepper.',
          },
          farms: mockFarms,
        };
        setProfileData(fallbackUser);
        setIsFollowing(true);
      } finally {
        setLoadingProfile(false);
      }
    }
  };

  const loadUserPosts = async () => {
    const uid = targetUser?.id || (isOwner ? currentUser?.id : params.userId);
    if (!uid) return;
    try {
      setLoadingPosts(true);
      const posts = await fetchFeedPostsApi({ userId: uid });
      if (posts) {
        setUserPosts(posts);
      }
    } catch (err) {
      console.warn('Failed to load user posts from backend:', err);
    } finally {
      setLoadingPosts(false);
      setRefreshing(false);
    }
    loadOrders();
  };

  useEffect(() => {
    loadTargetProfile();
    loadOrders();
  }, [params.userId, isOwner]);

  useEffect(() => {
    loadUserPosts();
  }, [targetUser?.id, isOwner]);

  useFocusEffect(
    useCallback(() => {
      loadUserPosts();
    }, [targetUser?.id, isOwner])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTargetProfile();
    loadUserPosts();
  };

  const handleToggleFollow = async () => {
    if (!targetUser?.id) return;
    try {
      setFollowLoading(true);
      const res = await toggleFollowUserApi(targetUser.id);
      setIsFollowing(res.isFollowing);
    } catch (error: any) {
      Alert.alert('Follow Error', error.message || 'Could not toggle follow');
    } finally {
      setFollowLoading(false);
    }
  };

  const openEditProfile = () => {
    setEditName(targetUser?.name || '');
    setEditPhone(targetUser?.phone || '');
    setEditBio(targetUser?.farmerProfile?.bio || targetUser?.bio || '');
    setEditAvatarUrl(targetUser?.avatarUrl || targetUser?.avatar || '');
    setEditModalVisible(true);
  };

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow photo gallery access to update your profile avatar.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setUploadingAvatar(true);
        const uploadRes = await uploadMediaApi(result.assets[0].uri, false);
        setEditAvatarUrl(uploadRes.url);
      }
    } catch (err: any) {
      Alert.alert('Upload Error', err.message || 'Could not upload image');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleTakePhotoAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow camera access to take a profile photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setUploadingAvatar(true);
        const uploadRes = await uploadMediaApi(result.assets[0].uri, false);
        setEditAvatarUrl(uploadRes.url);
      }
    } catch (err: any) {
      Alert.alert('Upload Error', err.message || 'Could not upload photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Full Name is required.');
      return;
    }
    try {
      setSavingProfile(true);
      const res = await updateMyProfileApi({
        name: editName.trim(),
        phone: editPhone.trim(),
        avatarUrl: editAvatarUrl,
        bio: editBio.trim(),
      });
      updateUser(res.user);
      setEditModalVisible(false);
      Alert.alert('Profile Updated', 'Your profile details have been successfully saved.');
      loadTargetProfile();
    } catch (err: any) {
      Alert.alert('Save Error', err.message || 'Could not update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogin = () => router.push('/auth/login');
  const handleRegister = () => router.push('/auth/register');
  const handleNewFarm = () => router.push('/farmer/new');
  const handleFintech = () => router.push('/fintech/loans');

  if (isOwner && !isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <View style={styles.logoBadgeContainer}>
          <MeetingLeafLogo
            size={72}
            showWordmark
            wordmarkColor={Colors.canopy}
            showTagline
            variant="fullColor"
          />
        </View>

        <Text style={styles.authTitle}>From farm to hand</Text>
        <Text style={styles.authSubtitle}>
          Connect with verified cooperatives, discover fresh harvests, and trade fairly across Cameroon
        </Text>

        <View style={styles.authButtonsWrapper}>
          <BrandButton
            title="Sign In"
            variant="primary"
            size="lg"
            onPress={handleLogin}
          />
          <BrandButton
            title="Create Account"
            variant="secondary"
            size="lg"
            onPress={handleRegister}
          />
        </View>
      </View>
    );
  }

  if (loadingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.cultivated} />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  // 5 Tab Definitions (Orders is owner-only)
  const allTabs = [
    {
      key: 'posts',
      label: 'Posts',
      icon: (color: string) => <Sparkles size={19} color={color} strokeWidth={2} />,
    },
    {
      key: 'farms',
      label: 'Farms',
      icon: (color: string) => <Warehouse size={19} color={color} strokeWidth={2} />,
    },
    ...(isOwner
      ? [
        {
          key: 'orders',
          label: 'Orders',
          icon: (color: string) => <ShoppingBag size={19} color={color} strokeWidth={2} />,
        },
      ]
      : []),
    {
      key: 'saved',
      label: 'Saved',
      icon: (color: string) => <Bookmark size={19} color={color} strokeWidth={2} />,
    },
    {
      key: 'likes',
      label: 'Likes',
      icon: (color: string) => <Heart size={19} color={color} strokeWidth={2} />,
    },
  ];

  const savedYieldsList = mockYields.filter((y) => savedYieldIds.includes(y.id));

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}
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
        {/* Header Section */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 16) }]}>
          {/* 1. Top Bar Navigation: Edit Profile on Top Left, 3-Bar Menu on Top Right */}
          <View style={styles.topNavBar}>
            {isOwner ? (
              <TouchableOpacity
                style={styles.topEditProfileBtn}
                onPress={openEditProfile}
                activeOpacity={0.8}
              >
                <Edit3 size={15} color={Colors.cultivated} strokeWidth={2.2} />
                <Text style={styles.topEditProfileBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ArrowLeft size={22} color={Colors.espresso} strokeWidth={2.2} />
              </TouchableOpacity>
            )}

            {isOwner && (
              <View style={styles.topRightMenuWrapper}>
                <ProfileHeaderMenu />
              </View>
            )}
          </View>

          {/* 2. Profile Info Row: Avatar on Left, Large Name, Email, Bio on Right */}
          <View style={styles.profileInfoRow}>
            {/* Avatar on Left */}
            <View style={styles.avatarWrapper}>
              <Image
                source={{
                  uri:
                    targetUser?.avatarUrl ||
                    targetUser?.avatar ||
                    'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=500&auto=format&fit=crop&q=60',
                }}
                style={styles.avatar}
              />
              {targetUser?.isVerified && <View style={styles.verifiedDot} />}
            </View>

            {/* Details on Right */}
            <View style={styles.profileDetailsCol}>
              <Text style={styles.name}>{targetUser?.name || 'AgroMarket Member'}</Text>
              <Text style={styles.email}>{targetUser?.email || 'user@agromarket.com'}</Text>

              {/* Bio under email */}
              {Boolean(targetUser?.farmerProfile?.bio || targetUser?.bio) ? (
                <Text style={styles.bioText} numberOfLines={3}>
                  {targetUser?.farmerProfile?.bio || targetUser?.bio}
                </Text>
              ) : isOwner ? (
                <TouchableOpacity onPress={openEditProfile} style={styles.addBioBtn}>
                  <Text style={styles.addBioText}>+ Add your farmer bio...</Text>
                </TouchableOpacity>
              ) : null}

              {/* Credit Tier / Role Badge */}
              {userHasFarm && (
                <Pressable style={styles.badgeContainer} onPress={isOwner ? handleFintech : undefined}>
                  <FarmerBadge
                    tier={targetUser?.farmerProfile?.creditTier || 'GOLD'}
                    label={`Verified Farmer • ${targetUser.farms.length} Farm${targetUser.farms.length > 1 ? 's' : ''}`}
                    size="sm"
                  />
                </Pressable>
              )}
            </View>
          </View>

          {/* 3. Stats Bar */}
          {/* 3. Stats Bar with AgroPartners */}
          <View style={styles.statsBar}>
            <View style={styles.statCol}>
              <Text style={styles.statNumber}>{targetUser?.farms?.length || 0}</Text>
              <Text style={styles.statLabel}>Farms</Text>
            </View>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statCol}
              onPress={() => router.push('/notifications/followers')}
            >
              <Text style={styles.statNumber}>{targetUser?._count?.followers ?? targetUser?.followersCount ?? 320}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statCol}
              onPress={() => router.push('/notifications/followers')}
            >
              <Text style={styles.statNumber}>{targetUser?._count?.following ?? targetUser?.followingCount ?? 45}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statCol}
              onPress={() => router.push('/partners')}
            >
              <Text style={styles.statNumber}>4</Text>
              <Text style={styles.statLabel}>Partners</Text>
            </TouchableOpacity>
          </View>

          {/* Owner Quick Escrow Vault & Deliveries Shortcut */}
          {isOwner && (
            <TouchableOpacity
              style={styles.escrowOrdersBanner}
              onPress={() => router.push('/orders')}
              activeOpacity={0.85}
            >
              <View style={styles.escrowOrdersLeft}>
                <View style={styles.escrowOrdersIconCircle}>
                  <ShieldCheck size={18} color={Colors.cultivated} strokeWidth={2.4} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.escrowOrdersTitle}>Escrow Orders & Deliveries 🛡️</Text>
                  <Text style={styles.escrowOrdersSub}>Track Engine 3 FSM states & live payouts</Text>
                </View>
              </View>
              <ChevronRight size={18} color={Colors.cultivated} />
            </TouchableOpacity>
          )}

          {/* 4. VISITOR ACTION BAR (Follow & Message) */}
          {!isOwner && (
            <View style={styles.visitorActionsRow}>
              <TouchableOpacity
                style={[styles.followBtn, isFollowing && styles.followBtnActive]}
                onPress={handleToggleFollow}
                disabled={followLoading}
                activeOpacity={0.85}
              >
                {isFollowing ? (
                  <>
                    <UserCheck size={16} color={Colors.cultivated} strokeWidth={2.2} />
                    <Text style={styles.followBtnTextActive}>Following</Text>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} color={Colors.white} strokeWidth={2.2} />
                    <Text style={styles.followBtnText}>Follow</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.messageBtn}
                onPress={() => router.push(`/chat/${targetUser.id}` as any)}
                activeOpacity={0.85}
              >
                <MessageCircle size={16} color={Colors.espresso} strokeWidth={2.2} />
                <Text style={styles.messageBtnText}>Message</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 5-Tab Bar */}
          <View style={styles.tabBar}>
            {allTabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  style={[styles.tabItem, isActive && styles.tabItemActive]}
                  onPress={() => setActiveTab(tab.key as any)}
                >
                  {tab.icon(isActive ? Colors.cultivated : 'rgba(36, 26, 18, 0.45)')}
                  <Text
                    style={[
                      styles.tabLabel,
                      isActive && styles.tabLabelActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                  {isActive && <View style={styles.tabIndicator} />}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* TAB 1: POSTS (3-Column TikTok/Instagram Grid) */}
        {activeTab === 'posts' && (
          <View style={styles.postsTabContent}>
            {loadingPosts && userPosts.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={Colors.cultivated} />
                <Text style={{ marginTop: 10, color: Colors.text.secondary, fontFamily: Fonts.bodyMedium, fontSize: 13 }}>
                  Loading stories from farm...
                </Text>
              </View>
            ) : userPosts.length === 0 ? (
              <View style={styles.emptyPostBox}>
                <Sparkles size={36} color={Colors.gold} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No Stories Published Yet</Text>
                <Text style={styles.emptySubtitle}>
                  {isOwner
                    ? 'Use the central + button to publish live field updates and harvest videos.'
                    : 'This user has not published any harvest updates yet.'}
                </Text>
                {isOwner && (
                  <BrandButton
                    title="+ Create Farm Story"
                    variant="cultivated"
                    size="sm"
                    onPress={() => router.push('/feed/create')}
                    style={{ marginTop: 14 }}
                  />
                )}
              </View>
            ) : (
              <View style={styles.postsGrid}>
                {userPosts.map((post: any, idx: number) => {
                  const isVideo = Boolean(
                    post.isVideo ||
                    (typeof post.mediaUrl === 'string' && (
                      post.mediaUrl.endsWith('.mp4') ||
                      post.mediaUrl.endsWith('.mov') ||
                      post.mediaUrl.endsWith('.mkv') ||
                      post.mediaUrl.includes('video') ||
                      post.mediaUrl.startsWith('file:') ||
                      post.mediaUrl.startsWith('content:')
                    ))
                  );
                  const mediaUri =
                    post.mediaUrl ||
                    post.media ||
                    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500';
                  const likes = post.likesCount ?? post.likes ?? 0;

                  return (
                    <TouchableOpacity
                      key={post.id || `post-${idx}`}
                      style={styles.gridTile}
                      activeOpacity={0.85}
                      onPress={() => openPostViewer(idx)}
                    >
                      <Image
                        source={{ uri: mediaUri }}
                        style={styles.gridTileImage}
                        resizeMode="cover"
                      />
                      <View style={styles.gridTileOverlay} />
                      <View style={styles.gridTileBadge}>
                        {isVideo ? (
                          <Play size={10} color="#FFF" fill="#FFF" style={{ marginRight: 3 }} />
                        ) : (
                          <Heart size={10} color="#FFF" fill="#FFF" style={{ marginRight: 3 }} />
                        )}
                        <Text style={styles.gridTileLikesText}>{likes}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* TAB 2: FARMS */}
        {activeTab === 'farms' && (
          <View style={styles.tabContent}>
            {!userHasFarm ? (
              <View style={styles.emptyFarmContainer}>
                <View style={styles.emptyIconCircle}>
                  <Warehouse size={36} color={Colors.soil} strokeWidth={1.8} />
                </View>
                <Text style={styles.emptyFarmTitle}>No Farm Page Created Yet</Text>
                <Text style={styles.emptyFarmSubtitle}>
                  {isOwner
                    ? 'Register your farm page to publish direct harvests and build your cooperative rating.'
                    : 'This user does not currently manage any public farm pages.'}
                </Text>
                {isOwner && (
                  <BrandButton
                    title="+ Create Your Farm"
                    variant="cultivated"
                    size="md"
                    onPress={handleNewFarm}
                    style={{ marginTop: 16 }}
                  />
                )}
              </View>
            ) : (
              <FarmsList farms={targetUser?.farms} isOwner={isOwner} />
            )}
          </View>
        )}

        {/* TAB 3: ORDERS (OWNER ONLY) */}
        {activeTab === 'orders' && isOwner && (
          <View style={styles.ordersTabContent}>
            {loadingOrders ? (
              <ActivityIndicator color={Colors.cultivated} style={{ marginVertical: 30 }} />
            ) : ordersList.length === 0 ? (
              <View style={styles.emptyBox}>
                <ShoppingBag size={36} color={Colors.cultivated} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No Active Orders</Text>
                <Text style={styles.emptySubtitle}>
                  Your escrow-protected harvest purchases and deliveries will appear here.
                </Text>
                <BrandButton
                  title="Explore Harvests Marketplace"
                  variant="secondary"
                  size="sm"
                  onPress={() => router.push('/(tabs)')}
                  style={{ marginTop: 14 }}
                />
              </View>
            ) : (
              <View style={styles.ordersListContainer}>
                {ordersList.map((order) => {
                  const firstItem = order.items?.[0];
                  const isLocked = order.status === 'ESCROW_LOCKED';
                  const isInTransit = order.status === 'IN_TRANSIT';
                  const isSettled = order.status === 'SETTLED';

                  return (
                    <TouchableOpacity
                      key={order.id}
                      style={styles.profileOrderCard}
                      onPress={() => router.push(`/orders/${order.id}` as any)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.profileOrderHeader}>
                        <Text style={styles.profileOrderId}>#{order.id}</Text>
                        <View
                          style={[
                            styles.profileOrderStatusBadge,
                            isLocked && { backgroundColor: '#FEF3C7' },
                            isInTransit && { backgroundColor: '#EFF6FF' },
                            isSettled && { backgroundColor: '#ECFDF5' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.profileOrderStatusText,
                              isLocked && { color: '#B45309' },
                              isInTransit && { color: '#1D4ED8' },
                              isSettled && { color: '#047857' },
                            ]}
                          >
                            {order.status?.replace('_', ' ')}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.profileOrderBody}>
                        <Image
                          source={{
                            uri:
                              firstItem?.yield?.mediaUrls?.[0] ||
                              'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800',
                          }}
                          style={styles.profileOrderThumb}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.profileOrderTitle} numberOfLines={1}>
                            {firstItem?.yield?.title || 'Harvest Order'}
                          </Text>
                          <Text style={styles.profileOrderSub}>
                            {firstItem ? `${firstItem.quantity} ${firstItem.yield?.unit || 'Units'}` : 'Harvest lot'} • {firstItem?.farmer?.name || 'Local Farm'}
                          </Text>
                          <Text style={styles.profileOrderTotal}>
                            {order.totalAmount?.toLocaleString()} {order.currency || 'XAF'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.profileOrderFooter}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <ShieldCheck size={13} color={Colors.cultivated} />
                          <Text style={styles.profileOrderEscrowLabel}>Engine 3 Smart Escrow</Text>
                        </View>
                        <View style={styles.profileOrderCta}>
                          <Text style={styles.profileOrderCtaText}>Track FSM State</Text>
                          <ChevronRight size={13} color={Colors.white} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* TAB 4: SAVED HARVESTS (BOOKMARKS) */}
        {activeTab === 'saved' && (
          <View style={styles.tabContent}>
            {savedYieldsList.length === 0 ? (
              <View style={styles.emptyBox}>
                <Bookmark size={36} color={Colors.soil} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No Saved Harvests</Text>
                <Text style={styles.emptySubtitle}>
                  Bookmark fresh produce lots in the marketplace to monitor prices and stock.
                </Text>
              </View>
            ) : (
              <View style={styles.savedGrid}>
                {savedYieldsList.map((item) => (
                  <YieldCard
                    key={item.id}
                    item={item}
                    popoverVisible={false}
                    onOpenPopover={() => { }}
                    onClosePopover={() => { }}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* TAB 5: LIKES */}
        {activeTab === 'likes' && (
          <View style={styles.tabContent}>
            <View style={styles.emptyBox}>
              <Heart size={36} color={Colors.clay} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>Liked Harvest Stories</Text>
              <Text style={styles.emptySubtitle}>
                Stories and harvest videos you have liked in the AgroFeed appear here.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating + New Farm button (Owner Only) */}
      {isOwner && userHasFarm && (
        <TouchableOpacity style={styles.fab} onPress={handleNewFarm}>
          <Plus size={18} color="#FFF" strokeWidth={2.5} />
          <Text style={styles.fabText}>New Farm</Text>
        </TouchableOpacity>
      )}

      {/* Full-Screen TikTok-Style Swipeable Post Viewer Modal */}
      <Modal
        visible={viewerVisible && userPosts.length > 0}
        animationType="slide"
        transparent={false}
        statusBarTranslucent={false}
        onRequestClose={() => setViewerVisible(false)}
      >
        <View
          style={[styles.fullscreenModalContainer, { backgroundColor: '#000', paddingBottom: insets.bottom }]}
          onLayout={(e) => {
            const { height } = e.nativeEvent.layout;
            if (height > 0) setViewerHeight(height);
          }}
        >
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <FlatList<Post>
            ref={viewerFlatListRef}
            data={userPosts}
            renderItem={({ item, index }: { item: Post; index: number }) => (
              <View style={{ height: viewerHeight, width: '100%' }}>
                <PostCard
                  post={item}
                  fullScreen
                  isActive={viewerVisible && index === activeViewerIndex}
                  onDeletePost={handleDeletePost}
                  isOwner={isOwner}
                />
              </View>
            )}
            keyExtractor={(item: Post, index: number) => item.id || `profile-post-${index}`}
            pagingEnabled
            snapToInterval={viewerHeight}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum
            showsVerticalScrollIndicator={false}
            bounces={false}
            initialScrollIndex={activeViewerIndex < userPosts.length ? activeViewerIndex : 0}
            getItemLayout={(_: any, index: number) => ({
              length: viewerHeight,
              offset: viewerHeight * index,
              index,
            })}
            viewabilityConfig={viewabilityConfig}
            onViewableItemsChanged={onViewableItemsChanged}
            windowSize={3}
            maxToRenderPerBatch={2}
            removeClippedSubviews={Platform.OS === 'android'}
          />

          {/* Top Floating Back Button */}
          <TouchableOpacity
            style={[styles.modalCloseButton, { top: Math.max(insets.top + 8, 20) }]}
            onPress={() => setViewerVisible(false)}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#FFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.editModalBackdrop}>
          <View style={[styles.editModalCard, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.editModalCloseBtn}>
                <X size={20} color={Colors.espresso} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
              {/* Avatar Uploader Section */}
              <View style={styles.avatarEditSection}>
                <View style={styles.avatarEditWrapper}>
                  <Image
                    source={{
                      uri:
                        editAvatarUrl ||
                        'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=500&auto=format&fit=crop&q=60',
                    }}
                    style={styles.avatarEditPreview}
                  />
                  {uploadingAvatar && (
                    <View style={styles.avatarUploadingOverlay}>
                      <ActivityIndicator size="small" color="#FFF" />
                    </View>
                  )}
                </View>

                <View style={styles.avatarPickersRow}>
                  <TouchableOpacity
                    style={styles.avatarPickerBtn}
                    onPress={handlePickAvatar}
                    disabled={uploadingAvatar}
                  >
                    <Upload size={14} color={Colors.espresso} />
                    <Text style={styles.avatarPickerBtnText}>Upload Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.avatarPickerBtn}
                    onPress={handleTakePhotoAvatar}
                    disabled={uploadingAvatar}
                  >
                    <Camera size={14} color={Colors.espresso} />
                    <Text style={styles.avatarPickerBtnText}>Camera</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Input: Full Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Full Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="e.g. John Doe"
                  placeholderTextColor={Colors.text.muted}
                />
              </View>

              {/* Input: Phone */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="e.g. +237671111111"
                  placeholderTextColor={Colors.text.muted}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Input: Bio / About */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Bio / Farmer Description</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder="Tell buyers and cooperatives about your agricultural background..."
                  placeholderTextColor={Colors.text.muted}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.editModalFooter}>
              <BrandButton
                title={savingProfile ? 'Saving...' : 'Save Changes'}
                variant="cultivated"
                size="md"
                onPress={handleSaveProfile}
                loading={savingProfile}
                style={{ width: '100%' }}
              />
            </View>
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
  authContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  authTitle: {
    fontFamily: Fonts.displayItalic,
    fontSize: 24,
    color: Colors.canopy,
    marginBottom: 8,
    textAlign: 'center',
  },
  authSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  authButtonsWrapper: {
    width: '100%',
    gap: 12,
  },
  header: {
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
  },
  topNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 14,
    minHeight: 38,
  },
  topEditProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.parchment,
    borderWidth: 1.5,
    borderColor: Colors.cultivated,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
  },
  topEditProfileBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13.5,
    color: Colors.cultivated,
  },
  backButton: {
    padding: 6,
    marginLeft: -4,
  },
  topRightMenuWrapper: {
    padding: 2,
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    gap: 16,
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2.5,
    borderColor: Colors.gold,
  },
  verifiedDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.cultivated,
    borderWidth: 2.5,
    borderColor: Colors.white,
  },
  profileDetailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontFamily: Fonts.bodyBold,
    fontSize: 22,
    color: Colors.espresso,
    lineHeight: 26,
    marginBottom: 2,
  },
  email: {
    fontFamily: Fonts.body,
    fontSize: 13.5,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  bioText: {
    fontFamily: Fonts.body,
    fontSize: 13.5,
    color: Colors.espresso,
    lineHeight: 19,
    marginBottom: 6,
  },
  addBioBtn: {
    paddingVertical: 2,
    marginBottom: 6,
  },
  addBioText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.cultivated,
    fontStyle: 'italic',
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    marginTop: 2,
    marginBottom: 2,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 12,
    backgroundColor: Colors.parchment,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    marginBottom: 12,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontFamily: Fonts.monoBold,
    fontSize: 16,
    color: Colors.espresso,
  },
  statLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.parchmentDim,
  },
  visitorActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 12,
  },
  followBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.cultivated,
    paddingVertical: 10,
    borderRadius: Radii.pill,
  },
  followBtnActive: {
    backgroundColor: '#eef8f1',
    borderWidth: 1.5,
    borderColor: Colors.cultivated,
  },
  followBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.white,
  },
  followBtnTextActive: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
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
    paddingVertical: 10,
    borderRadius: Radii.pill,
  },
  messageBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.espresso,
  },
  tabBar: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
    gap: 3,
  },
  tabItemActive: {},
  tabLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: 'rgba(36, 26, 18, 0.45)',
  },
  tabLabelActive: {
    fontFamily: Fonts.bodySemiBold,
    color: Colors.cultivated,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 12,
    right: 12,
    height: 2.5,
    backgroundColor: Colors.cultivated,
    borderRadius: Radii.pill,
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  postsTabContent: {
    paddingHorizontal: 0,
    paddingTop: 2,
  },
  emptyPostBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    backgroundColor: Colors.parchment,
    borderRadius: Radii.card,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1,
    paddingTop: 1,
  },
  gridTile: {
    width: Math.floor((Dimensions.get('window').width - 2) / 3),
    aspectRatio: 3 / 4,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: Colors.parchmentDim,
    position: 'relative',
  },
  gridTileImage: {
    width: '100%',
    height: '100%',
  },
  gridTileOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 38,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  gridTileBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridTileLikesText: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: Fonts.monoBold,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 2,
  },
  fullscreenModalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalCloseButton: {
    position: 'absolute',
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  postsList: {
    gap: 12,
  },
  savedGrid: {
    gap: 12,
  },
  emptyFarmContainer: {
    alignItems: 'center',
    padding: 32,
    marginTop: 20,
    backgroundColor: Colors.parchment,
    borderRadius: Radii.card,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...Shadows.subtle,
  },
  emptyFarmTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.espresso,
    marginBottom: 4,
  },
  emptyFarmSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
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
    maxWidth: 280,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: Colors.cultivated,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: Radii.pill,
    gap: 8,
    ...Shadows.card,
  },
  fabText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.white,
  },
  ownerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 14,
    paddingHorizontal: 24,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.parchment,
    borderWidth: 1.5,
    borderColor: Colors.cultivated,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radii.pill,
  },
  editProfileBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.cultivated,
  },
  editModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  editModalCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    ...Shadows.card,
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
  },
  editModalTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
    color: Colors.espresso,
  },
  editModalCloseBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: Colors.parchment,
  },
  avatarEditSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarEditWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: Colors.cultivated,
    marginBottom: 10,
  },
  avatarEditPreview: {
    width: '100%',
    height: '100%',
  },
  avatarUploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPickersRow: {
    flexDirection: 'row',
    gap: 10,
  },
  avatarPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.parchment,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  avatarPickerBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.espresso,
  },
  formGroup: {
    marginBottom: 14,
  },
  formLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 6,
  },
  formInput: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.espresso,
    backgroundColor: Colors.parchment,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    borderRadius: Radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  formTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  editModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.parchmentDim,
  },

  // Escrow Orders Shortcut & Tab Styles
  escrowOrdersBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: Radii.card,
    padding: 12,
    marginTop: 14,
  },
  escrowOrdersLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  escrowOrdersIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(46, 125, 50, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  escrowOrdersTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.espresso,
  },
  escrowOrdersSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  ordersTabContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  ordersListContainer: {
    gap: 12,
  },
  profileOrderCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Shadows.subtle,
  },
  profileOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileOrderId: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    color: Colors.espresso,
  },
  profileOrderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  profileOrderStatusText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
  },
  profileOrderBody: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  profileOrderThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.parchment,
  },
  profileOrderTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.espresso,
  },
  profileOrderSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  profileOrderTotal: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    color: Colors.cultivated,
    marginTop: 2,
  },
  profileOrderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  profileOrderEscrowLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    color: Colors.cultivated,
  },
  profileOrderCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.canopy,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  profileOrderCtaText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.gold,
  },
});