import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Share,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MessageCircle,
  ShieldCheck,
  MapPin,
  Sparkles,
  Warehouse,
  Sprout,
  Share2,
  UserX,
  Crown,
  Play,
  Leaf,
  X,
  ShoppingBag,
} from 'lucide-react-native';
import { fetchPublicProfileApi, toggleFollowUserApi } from '@/components/api/auth';
import { fetchFeedPostsApi } from '@/components/api/posts';
import { fetchFarmYieldsApi, fetchYieldsApi } from '@/components/api/yields';
import { fetchFarmPatronStatusApi } from '@/components/api/fintech';
import AgroPatronModal from '@/components/AgroPatronModal';
import { Post, Yield, Farm, AgroYield } from '@/types';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import YieldCard from '@/components/YieldCard';
import FarmsList from '@/components/FarmsList';
import FarmerBadge from '@/components/ui/FarmerBadge';
import { resolveMediaUrl, isVideoMedia } from '@/utils/media';
import AgromPreloader from '@/components/AgromPreloader';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GRID_ITEM_SIZE = (SCREEN_WIDTH - 36) / 3;

export default function UserPublicProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [activeTab, setActiveTab] = useState<'produce' | 'posts' | 'farms'>('produce');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userYields, setUserYields] = useState<AgroYield[]>([]);
  const [userFarms, setUserFarms] = useState<Farm[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isPatron, setIsPatron] = useState(false);
  const [patronModalVisible, setPatronModalVisible] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  // Story Viewer Modal
  const [viewerVisible, setViewerVisible] = useState(false);
  const [activePostIndex, setActivePostIndex] = useState(0);

  const loadProfile = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await fetchPublicProfileApi(id);
      if (data) {
        setProfileData(data);
        setIsFollowing(Boolean(data.isFollowing));
        const farms: Farm[] = data.farms || [];
        setUserFarms(farms);

        // 1. Gather ONLY products belonging to this user's farms
        let collectedYields: AgroYield[] = [];
        if (farms.length > 0) {
          // Flatten yields already included in farm records
          for (const f of farms) {
            if (Array.isArray((f as any).yields) && (f as any).yields.length > 0) {
              collectedYields.push(...(f as any).yields);
            }
          }

          // If not embedded, fetch active yields across all user's farms
          if (collectedYields.length === 0) {
            const yieldsPromises = farms.map((f) => fetchFarmYieldsApi(f.id).catch(() => []));
            const yieldsResults = await Promise.all(yieldsPromises);
            collectedYields = yieldsResults.flat();
          }
        }
        setUserYields(collectedYields);

        // 2. Gather ONLY posts published by this user
        if (Array.isArray(data.posts) && data.posts.length > 0) {
          setUserPosts(
            data.posts.map((p: any) => ({
              ...p,
              farmerId: p.farmerId || p.userId || data.id,
              farmerName: data.name || 'Agro Producer',
              farmerAvatar:
                p.farm?.coverPhoto ||
                data.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
              media: p.mediaUrl,
              likes: p.likesCount ?? p.likes?.length ?? 0,
              comments: p.comments || [],
            }))
          );
        } else {
          const posts = await fetchFeedPostsApi({ userId: id });
          setUserPosts(posts || []);
        }

        // 3. Check AgroPatron Status
        fetchFarmPatronStatusApi(id)
          .then((st) => {
            if (st?.isPatron) setIsPatron(true);
          })
          .catch(() => {});
      } else {
        setProfileData(null);
      }
    } catch (e) {
      console.warn('Failed to load public profile:', e);
      setProfileData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const handleToggleFollow = async () => {
    if (!profileData?.id) return;
    setFollowLoading(true);
    try {
      const res = await toggleFollowUserApi(profileData.id);
      setIsFollowing(res?.isFollowing ?? !isFollowing);
    } catch (e) {
      console.error('Failed to toggle follow:', e);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleOpenChat = () => {
    if (profileData?.id) {
      router.push(`/chat/${profileData.id}` as any);
    }
  };

  const handleShare = async () => {
    if (!profileData) return;
    try {
      await Share.share({
        message: `Check out ${profileData.name}'s verified producer profile on AgroMarket!`,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const openPostViewer = (idx: number) => {
    setActivePostIndex(idx);
    setViewerVisible(true);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
        <AgromPreloader size="lg" theme="light" />
      </View>
    );
  }

  if (!profileData) {
    return (
      <View style={styles.notFoundContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top + 8, 16) }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
            <ArrowLeft size={20} color={Colors.espresso} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
        <View style={styles.notFoundContent}>
          <UserX size={56} color={Colors.text.muted} strokeWidth={1.5} />
          <Text style={styles.notFoundTitle}>Profile Not Found</Text>
          <Text style={styles.notFoundText}>
            This producer profile could not be found or has not been configured yet.
          </Text>
          <TouchableOpacity style={styles.backBtnPill} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={styles.backBtnPillText}>Return to Marketplace</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const bio =
    profileData.farmerProfile?.bio ||
    profileData.bio ||
    profileData.wholesalerProfile?.businessName ||
    'AgroMarket verified producer & trading partner.';

  const followerCount =
    profileData.farmerProfile?.totalFollowers ||
    profileData.followersCount ||
    profileData._count?.followers ||
    0;

  const followingCount =
    profileData.followingCount ||
    profileData._count?.following ||
    0;

  const agroVestorsCount =
    profileData.agroVestorsCount ||
    profileData.farmerProfile?.loanApplications?.length ||
    0;

  const creditScore = profileData.farmerProfile?.creditScore || 650;
  const creditTier = profileData.farmerProfile?.creditTier || 'GOLD';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Standalone Top Bar - Clean "Producer Profile" Header (No user's name as header) */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top + 8, 16) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <ArrowLeft size={20} color={Colors.espresso} strokeWidth={2.2} />
        </TouchableOpacity>

        <View style={styles.topBarTitleCenter}>
          <Text style={styles.topBarTitle}>Producer Profile</Text>
        </View>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.75}>
          <Share2 size={18} color={Colors.espresso} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 40 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.cultivated}
            colors={[Colors.cultivated]}
          />
        }
      >
        {/* Profile Info Row: Avatar on Left, Name, Email, Bio, Credit Badge on Right (Matches (tabs)/profile.tsx exactly) */}
        <View style={styles.profileInfoRow}>
          {/* Avatar on Left */}
          <View style={styles.avatarWrapper}>
            <Image
              source={{
                uri:
                  !avatarError && (profileData.avatarUrl || profileData.avatar)
                    ? resolveMediaUrl(profileData.avatarUrl || profileData.avatar)
                    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
              }}
              style={styles.avatar}
              onError={() => setAvatarError(true)}
            />
            {profileData.isVerified && <View style={styles.verifiedDot} />}
          </View>

          {/* Details on Right */}
          <View style={styles.profileDetailsCol}>
            <Text style={styles.name}>{profileData.name || 'Agro Producer'}</Text>
            <Text style={styles.email}>{profileData.email}</Text>

            {/* Bio under email */}
            {Boolean(bio) && (
              <Text style={styles.bioText} numberOfLines={3}>
                {bio}
              </Text>
            )}

            {/* Credit Score & Tier Badge under bio */}
            <View style={styles.creditBadgeRow}>
              <FarmerBadge
                tier={creditTier}
                label={`Credit Score: ${creditScore} • ${creditTier.replace('_', ' ')}`}
                size="sm"
              />
            </View>
          </View>
        </View>

        {/* Realtime Stats Bar (Farms, AgroPatrons, Patronized, AgroVestors - Exact styling from (tabs)/profile.tsx) */}
        <View style={styles.statsBar}>
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>{userFarms.length}</Text>
            <Text style={styles.statLabel}>Farms</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>{followerCount}</Text>
            <Text style={styles.statLabel}>AgroPatrons</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}>Patronized</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>{agroVestorsCount}</Text>
            <Text style={styles.statLabel}>AgroVestors</Text>
          </View>
        </View>

        {/* Visitor Action Bar: AgroPatron & Direct Message */}
        <View style={styles.visitorActionsRow}>
          <TouchableOpacity
            style={[styles.patronBtn, isPatron && styles.patronBtnActive]}
            onPress={() => setPatronModalVisible(true)}
            activeOpacity={0.85}
          >
            {isPatron ? (
              <>
                <Crown size={16} color="#B45309" strokeWidth={2.4} />
                <Text style={styles.patronBtnTextActive}>Active AgroPatron ⭐</Text>
              </>
            ) : (
              <>
                <Crown size={16} color={Colors.white} strokeWidth={2.4} />
                <Text style={styles.patronBtnText}>Become an AgroPatron ($2)</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.messageBtn} onPress={handleOpenChat} activeOpacity={0.85}>
            <MessageCircle size={16} color={Colors.espresso} strokeWidth={2.2} />
            <Text style={styles.messageBtnText}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Tabs (Produce, Posts, Farms - Wishlist removed) */}
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tabItem, activeTab === 'produce' && styles.tabItemActive]}
            onPress={() => setActiveTab('produce')}
          >
            <Sprout size={18} color={activeTab === 'produce' ? Colors.cultivated : 'rgba(36, 26, 18, 0.45)'} strokeWidth={2} />
            <Text style={[styles.tabLabel, activeTab === 'produce' && styles.tabLabelActive]}>
              Produce ({userYields.length})
            </Text>
            {activeTab === 'produce' && <View style={styles.tabIndicator} />}
          </Pressable>

          <Pressable
            style={[styles.tabItem, activeTab === 'posts' && styles.tabItemActive]}
            onPress={() => setActiveTab('posts')}
          >
            <Sparkles size={18} color={activeTab === 'posts' ? Colors.cultivated : 'rgba(36, 26, 18, 0.45)'} strokeWidth={2} />
            <Text style={[styles.tabLabel, activeTab === 'posts' && styles.tabLabelActive]}>
              Stories ({userPosts.length})
            </Text>
            {activeTab === 'posts' && <View style={styles.tabIndicator} />}
          </Pressable>

          <Pressable
            style={[styles.tabItem, activeTab === 'farms' && styles.tabItemActive]}
            onPress={() => setActiveTab('farms')}
          >
            <Warehouse size={18} color={activeTab === 'farms' ? Colors.cultivated : 'rgba(36, 26, 18, 0.45)'} strokeWidth={2} />
            <Text style={[styles.tabLabel, activeTab === 'farms' && styles.tabLabelActive]}>
              Farms ({userFarms.length})
            </Text>
            {activeTab === 'farms' && <View style={styles.tabIndicator} />}
          </Pressable>
        </View>

        {/* Tab 1: Produce Batches (Loads ONLY products of this user) */}
        {activeTab === 'produce' && (
          <View style={styles.tabContentArea}>
            {userYields.length === 0 ? (
              <View style={styles.emptyTabArea}>
                <Sprout size={36} color={Colors.cultivated} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No Produce Listed Yet</Text>
                <Text style={styles.emptySubtitle}>
                  This producer currently has no active harvest batches listed on the marketplace.
                </Text>
              </View>
            ) : (
              <View style={styles.yieldsGrid}>
                {userYields.map((item) => (
                  <YieldCard
                    key={item.id}
                    item={item}
                    popoverVisible={openPopoverId === item.id}
                    onOpenPopover={() => setOpenPopoverId(item.id)}
                    onClosePopover={() => setOpenPopoverId(null)}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Tab 2: Harvest Stories (Loads ONLY posts of this user) */}
        {activeTab === 'posts' && (
          <View style={styles.tabContentArea}>
            {userPosts.length === 0 ? (
              <View style={styles.emptyTabArea}>
                <Sparkles size={36} color={Colors.gold} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No Stories Published Yet</Text>
                <Text style={styles.emptySubtitle}>
                  This producer has not published any live harvest stories or field updates yet.
                </Text>
              </View>
            ) : (
              <View style={styles.postsGrid}>
                {userPosts.map((post: any, idx: number) => {
                  const mediaUri =
                    resolveMediaUrl(post.mediaUrl || post.media) ||
                    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500';
                  const isVideo = isVideoMedia(mediaUri, post.isVideo);
                  const likes = post.likesCount ?? post.likes ?? 0;

                  return (
                    <TouchableOpacity
                      key={post.id || `post-${idx}`}
                      style={styles.gridTile}
                      activeOpacity={0.85}
                      onPress={() => openPostViewer(idx)}
                    >
                      <Image source={{ uri: mediaUri }} style={styles.gridTileImage} resizeMode="cover" />
                      <View style={styles.gridTileOverlay} />
                      <View style={styles.gridTileBadge}>
                        {isVideo ? (
                          <Play size={10} color="#FFF" fill="#FFF" style={{ marginRight: 3 }} />
                        ) : (
                          <Leaf size={10} color="#4ADE80" fill="#4ADE80" style={{ marginRight: 3 }} />
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

        {/* Tab 3: Registered Farms (Loads ONLY farms of this user) */}
        {activeTab === 'farms' && (
          <View style={styles.tabContentArea}>
            {userFarms.length === 0 ? (
              <View style={styles.emptyTabArea}>
                <Warehouse size={36} color={Colors.soil} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No Farm Pages Found</Text>
                <Text style={styles.emptySubtitle}>
                  This member does not manage any public farm profiles.
                </Text>
              </View>
            ) : (
              <FarmsList farms={userFarms} isOwner={false} />
            )}
          </View>
        )}
      </ScrollView>

      {/* Story Viewer Modal for Public Posts */}
      {userPosts.length > 0 && (
        <Modal
          visible={viewerVisible}
          transparent={false}
          animationType="fade"
          onRequestClose={() => setViewerVisible(false)}
        >
          <View style={styles.viewerContainer}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />
            <TouchableOpacity
              style={[styles.viewerCloseBtn, { top: Math.max(insets.top + 6, 20) }]}
              onPress={() => setViewerVisible(false)}
              activeOpacity={0.8}
            >
              <X size={24} color="#FFF" />
            </TouchableOpacity>
            {userPosts[activePostIndex] && (
              <View style={{ flex: 1 }}>
                <Image
                  source={{
                    uri:
                      resolveMediaUrl(
                        userPosts[activePostIndex].mediaUrl || userPosts[activePostIndex].media
                      ) || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800',
                  }}
                  style={styles.viewerFullImage}
                  resizeMode="contain"
                />
                <View style={styles.viewerBottomOverlay}>
                  <Text style={styles.viewerCaption}>{userPosts[activePostIndex].content}</Text>
                  <Text style={styles.viewerDate}>
                    {new Date(userPosts[activePostIndex].createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Modal>
      )}

      {/* AgroPatron Support Modal */}
      {profileData && (
        <AgroPatronModal
          visible={patronModalVisible}
          onClose={() => setPatronModalVisible(false)}
          farmerId={profileData.id}
          farmerName={profileData.name}
          farmName={userFarms[0]?.name || `${profileData.name}'s Farm`}
          onSuccess={() => {
            setIsPatron(true);
            setPatronModalVisible(false);
          }}
        />
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
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  notFoundContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  notFoundTitle: {
    fontFamily: Fonts.displayItalic,
    fontSize: 22,
    color: Colors.canopy,
    marginTop: 16,
    marginBottom: 8,
  },
  notFoundText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  backBtnPill: {
    backgroundColor: Colors.cultivated,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radii.pill,
  },
  backBtnPillText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13.5,
    color: Colors.white,
  },

  // Standalone Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.parchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitleCenter: {
    flex: 1,
    alignItems: 'center',
  },
  topBarTitle: {
    fontFamily: Fonts.displayItalic,
    fontSize: 18,
    color: Colors.canopy,
  },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.parchment,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  // Profile Info Row (Exact dimensions from (tabs)/profile.tsx)
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: Colors.cultivated,
    backgroundColor: Colors.parchment,
    ...Shadows.subtle,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },
  verifiedDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.cultivated,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  profileDetailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontFamily: Fonts.displayItalic,
    fontSize: 22,
    color: Colors.canopy,
    marginBottom: 2,
  },
  email: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  bioText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.espresso,
    lineHeight: 18,
    marginBottom: 6,
  },
  creditBadgeRow: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },

  // Stats Bar (Exact colors and sizes from (tabs)/profile.tsx)
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF8F1',
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    borderRadius: Radii.card,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    ...Shadows.subtle,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: Fonts.monoBold,
    fontSize: 18,
    color: Colors.espresso,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: Colors.text.secondary,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.parchmentDim,
  },

  // Visitor Action Bar
  visitorActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  patronBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cultivated,
    paddingVertical: 12,
    borderRadius: Radii.pill,
    gap: 6,
    ...Shadows.subtle,
  },
  patronBtnActive: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  patronBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.white,
  },
  patronBtnTextActive: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: '#92400E',
  },
  messageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF8F1',
    paddingVertical: 12,
    borderRadius: Radii.pill,
    gap: 6,
    borderWidth: 1,
    borderColor: '#CCEBD5',
  },
  messageBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.espresso,
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
    marginBottom: 14,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    position: 'relative',
  },
  tabItemActive: {},
  tabLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12.5,
    color: 'rgba(36, 26, 18, 0.55)',
  },
  tabLabelActive: {
    fontFamily: Fonts.bodyBold,
    color: Colors.cultivated,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 14,
    right: 14,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: Colors.cultivated,
  },

  tabContentArea: {
    minHeight: 220,
  },

  // Produce Grid (2 Columns, matching agro-yields.tsx)
  yieldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },

  // Posts Grid (3 Columns, matching (tabs)/profile.tsx)
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  gridTile: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE * 1.35,
    position: 'relative',
    backgroundColor: '#000',
    borderRadius: 4,
    overflow: 'hidden',
  },
  gridTileImage: {
    width: '100%',
    height: '100%',
  },
  gridTileOverlay: {
    ...StyleSheet.absoluteFill as object,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  gridTileBadge: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gridTileLikesText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: '#FFF',
  },

  // Empty State
  emptyTabArea: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.espresso,
    marginTop: 10,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Full Story Viewer
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  viewerCloseBtn: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerFullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
  },
  viewerBottomOverlay: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 14,
    borderRadius: Radii.card,
  },
  viewerCaption: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: '#FFF',
    lineHeight: 20,
    marginBottom: 4,
  },
  viewerDate: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.gold,
  },
});
