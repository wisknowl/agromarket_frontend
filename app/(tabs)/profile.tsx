import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
} from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import { fetchPublicProfileApi, toggleFollowUserApi } from '@/components/api/auth';
import { posts as mockPosts, agroYields as mockYields } from '@/mocks/data';
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
  const params = useLocalSearchParams<{ userId?: string }>();
  const { user: currentUser, isAuthenticated, logout } = useAuthStore();
  const savedYieldIds = useFavoritesStore((s) => s.yields);

  const [activeTab, setActiveTab] = useState<'posts' | 'farms' | 'orders' | 'saved' | 'likes'>('posts');
  const [profileData, setProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

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
        setProfileData(data);
        setIsFollowing(Boolean(data.isFollowing));
      } catch (err) {
        console.error('Failed to load public profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    }
  };

  useEffect(() => {
    loadTargetProfile();
  }, [params.userId, isOwner]);

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
      icon: (color: string) => <Sparkles size={18} color={color} strokeWidth={2} />,
    },
    {
      key: 'farms',
      label: 'Farms',
      icon: (color: string) => <Warehouse size={18} color={color} strokeWidth={2} />,
    },
    ...(isOwner
      ? [
          {
            key: 'orders',
            label: 'Orders',
            icon: (color: string) => <ShoppingBag size={18} color={color} strokeWidth={2} />,
          },
        ]
      : []),
    {
      key: 'saved',
      label: 'Saved',
      icon: (color: string) => <Bookmark size={18} color={color} strokeWidth={2} />,
    },
    {
      key: 'likes',
      label: 'Likes',
      icon: (color: string) => <Heart size={18} color={color} strokeWidth={2} />,
    },
  ];

  const userPosts = targetUser?.posts || mockPosts.filter((p) => p.farmerId === targetUser?.id || p.farmerId === 'f1');
  const savedYieldsList = mockYields.filter((y) => savedYieldIds.includes(y.id));

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          {/* Top Bar Navigation */}
          {!isOwner ? (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={22} color={Colors.espresso} strokeWidth={2.2} />
            </TouchableOpacity>
          ) : (
            <View style={styles.topRightMenuWrapper}>
              <ProfileHeaderMenu />
            </View>
          )}

          {/* Avatar with Verified Dot */}
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

          {/* Identity & Role */}
          <Text style={styles.name}>{targetUser?.name || 'AgroMarket Member'}</Text>
          <Text style={styles.email}>{targetUser?.email || 'user@agromarket.com'}</Text>

          {/* Credit Tier / Role Badge */}
          {userHasFarm && (
            <Pressable style={styles.badgeContainer} onPress={isOwner ? handleFintech : undefined}>
              <FarmerBadge
                tier={targetUser?.farmerProfile?.creditTier || 'GOLD'}
                label={`Verified Farmer • ${targetUser.farms.length} Farm${targetUser.farms.length > 1 ? 's' : ''}`}
                size="md"
              />
            </Pressable>
          )}

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statCol}>
              <Text style={styles.statNumber}>{targetUser?.farms?.length || 0}</Text>
              <Text style={styles.statLabel}>Farms</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statNumber}>{targetUser?._count?.followers ?? targetUser?.followersCount ?? 320}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statNumber}>{targetUser?._count?.following ?? targetUser?.followingCount ?? 45}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          {/* VISITOR ACTION BAR (Follow & Message) */}
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

        {/* TAB 1: POSTS */}
        {activeTab === 'posts' && (
          <View style={styles.tabContent}>
            {userPosts.length === 0 ? (
              <View style={styles.emptyBox}>
                <Sparkles size={36} color={Colors.gold} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No Stories Published Yet</Text>
                <Text style={styles.emptySubtitle}>
                  {isOwner
                    ? 'Use the central + button to publish field updates and video stories.'
                    : 'This user has not published any harvest updates yet.'}
                </Text>
              </View>
            ) : (
              <View style={styles.postsList}>
                {userPosts.map((post: any) => (
                  <PostCard key={post.id} post={post} />
                ))}
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
                    variant="primary"
                    size="md"
                    onPress={handleNewFarm}
                    style={{ marginTop: 16 }}
                  />
                )}
              </View>
            ) : (
              <FarmsList />
            )}
          </View>
        )}

        {/* TAB 3: ORDERS (OWNER ONLY) */}
        {activeTab === 'orders' && isOwner && (
          <View style={styles.tabContent}>
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
                onPress={() => router.push('/(tabs)/agro-yields')}
                style={{ marginTop: 14 }}
              />
            </View>
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
                    onOpenPopover={() => {}}
                    onClosePopover={() => {}}
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
          <Plus size={18} color={Colors.espresso} strokeWidth={2.5} />
          <Text style={styles.fabText}>New Farm</Text>
        </TouchableOpacity>
      )}
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
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 14,
    left: 16,
    zIndex: 10,
    padding: 6,
  },
  topRightMenuWrapper: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2.5,
    borderColor: Colors.gold,
  },
  verifiedDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.cultivated,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  name: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
    color: Colors.espresso,
    marginBottom: 2,
  },
  email: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  badgeContainer: {
    marginBottom: 12,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 10,
    backgroundColor: Colors.parchment,
    borderRadius: Radii.card,
    marginBottom: 12,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontFamily: Fonts.monoBold,
    fontSize: 15,
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
    fontSize: 11,
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
    backgroundColor: Colors.gold,
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
    color: Colors.espresso,
  },
});