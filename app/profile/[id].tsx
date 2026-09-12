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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MessageCircle,
  UserPlus,
  UserCheck,
  ShieldCheck,
  MapPin,
  Sparkles,
  Warehouse,
  Bookmark,
  BookmarkCheck,
  Heart,
  Share2,
  UserX,
  Crown,
} from 'lucide-react-native';
import { fetchPublicProfileApi, toggleFollowUserApi } from '@/components/api/auth';
import { fetchFeedPostsApi } from '@/components/api/posts';
import { fetchFarmYieldsApi, fetchYieldsApi } from '@/components/api/yields';
import { fetchFarmPatronStatusApi } from '@/components/api/fintech';
import AgroPatronModal from '@/components/AgroPatronModal';
import { Post, Yield, Farm } from '@/types';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import PostCard from '@/components/PostCard';
import YieldCard from '@/components/YieldCard';
import FarmsList from '@/components/FarmsList';
import FarmerBadge from '@/components/ui/FarmerBadge';

export default function UserPublicProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [activeTab, setActiveTab] = useState<'posts' | 'farms' | 'produce' | 'wishlist'>('posts');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userYields, setUserYields] = useState<Yield[]>([]);
  const [userFarms, setUserFarms] = useState<Farm[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isPatron, setIsPatron] = useState(false);
  const [patronModalVisible, setPatronModalVisible] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await fetchPublicProfileApi(id);
      if (data) {
        setProfileData(data);
        setIsFollowing(Boolean(data.isFollowing));
        setUserFarms(data.farms || []);

        if (Array.isArray(data.posts) && data.posts.length > 0) {
          setUserPosts(
            data.posts.map((p: any) => ({
              ...p,
              farmerId: p.farmerId || p.userId || data.id,
              farmerName: p.farm?.name || data.name || 'Agro Farmer',
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

        if (data.farms && data.farms.length > 0) {
          const yields = await fetchFarmYieldsApi(data.farms[0].id);
          setUserYields(yields || []);
        } else {
          const yields = await fetchYieldsApi({ farmId: id });
          setUserYields(yields || []);
        }
      } else {
        setProfileData(null);
      }
    } catch (e) {
      console.warn('Failed to load profile:', e);
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

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ActivityIndicator size="large" color={Colors.cultivated} />
        <Text style={styles.loadingText}>Loading AgroMarket Profile...</Text>
      </View>
    );
  }

  if (!profileData) {
    return (
      <View style={styles.notFoundContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) + 8, width: '100%' }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color={Colors.espresso} />
          </TouchableOpacity>
        </View>
        <View style={styles.notFoundContent}>
          <UserX size={56} color={Colors.text.muted} />
          <Text style={styles.notFoundTitle}>Profile Not Found</Text>
          <Text style={styles.notFoundText}>
            This member profile could not be found or has not been configured yet.
          </Text>
          <TouchableOpacity
            style={styles.backBtnPill}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.backBtnPillText}>Return to Directory</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const bio =
    profileData.farmerProfile?.bio ||
    profileData.bio ||
    profileData.wholesalerProfile?.businessName ||
    'AgroMarket verified trading member.';

  const region =
    profileData.farmerProfile?.region ||
    profileData.farmerProfile?.city ||
    profileData.wholesalerProfile?.primaryMarketCity ||
    'Cameroon Agricultural Corridor';

  const followerCount =
    profileData.farmerProfile?.totalFollowers ||
    profileData.followersCount ||
    0;

  const followingCount = profileData.followingCount || 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Standalone Top Bar with Back Button */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={Colors.espresso} />
        </TouchableOpacity>

        <View style={styles.topBarTitleCenter}>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {profileData.name}
          </Text>
          <Text style={styles.topBarSub}>{region}</Text>
        </View>

        <TouchableOpacity style={styles.shareBtn} activeOpacity={0.7}>
          <Share2 size={18} color={Colors.espresso} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 30 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.cultivated]}
          />
        }
      >
        {/* Profile Card Info */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{
                  uri:
                    profileData.avatarUrl ||
                    profileData.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
                }}
                style={styles.avatar}
              />
              {profileData.isVerified && <View style={styles.verifiedDot} />}
            </View>

            <View style={styles.profileDetailsCol}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{profileData.name}</Text>
                {profileData.isVerified && (
                  <ShieldCheck size={18} color={Colors.cultivated} style={{ marginLeft: 4 }} />
                )}
              </View>

              <Text style={styles.email}>{profileData.email}</Text>

              {profileData.farmerProfile?.farmName && (
                <View style={styles.farmNameBadge}>
                  <Text style={styles.farmNameBadgeText}>
                    🚜 {profileData.farmerProfile.farmName}
                  </Text>
                </View>
              )}

              {profileData.farmerProfile?.creditTier && (
                <View style={styles.tierRow}>
                  <FarmerBadge
                    tier={profileData.farmerProfile.creditTier}
                    label={`Verified ${profileData.role || 'Farmer'}`}
                    size="sm"
                  />
                </View>
              )}
            </View>
          </View>

          {/* Bio Text */}
          <Text style={styles.bioText}>{bio}</Text>

          {/* Location Row */}
          <View style={styles.locationRow}>
            <MapPin size={14} color={Colors.text.secondary} />
            <Text style={styles.locationText}>{region}</Text>
          </View>

          {/* Stats Bar */}
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
              <Text style={styles.statLabel}>Patronized Farms</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statNumber}>{(profileData as any)?.agroVestorsCount ?? profileData.farmerProfile?.loanApplications?.length ?? 0}</Text>
              <Text style={styles.statLabel}>AgroVestors</Text>
            </View>
          </View>

          {/* Visitor Action Bar: AgroPatron & Message */}
          <View style={styles.visitorActionsRow}>
            <TouchableOpacity
              style={[styles.followBtn, isPatron && styles.patronBtnActive]}
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
                  <Text style={styles.followBtnText}>Become an AgroPatron ($2)</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.messageBtn}
              onPress={handleOpenChat}
              activeOpacity={0.85}
            >
              <MessageCircle size={16} color={Colors.white} strokeWidth={2.2} />
              <Text style={styles.messageBtnText}>Direct Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Public Visible Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'posts' && styles.tabItemActive]}
            onPress={() => setActiveTab('posts')}
          >
            <Sparkles size={18} color={activeTab === 'posts' ? Colors.cultivated : Colors.text.muted} />
            <Text style={[styles.tabLabel, activeTab === 'posts' && styles.tabLabelActive]}>
              Posts ({userPosts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'farms' && styles.tabItemActive]}
            onPress={() => setActiveTab('farms')}
          >
            <Warehouse size={18} color={activeTab === 'farms' ? Colors.cultivated : Colors.text.muted} />
            <Text style={[styles.tabLabel, activeTab === 'farms' && styles.tabLabelActive]}>
              Farms ({userFarms.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'produce' && styles.tabItemActive]}
            onPress={() => setActiveTab('produce')}
          >
            <Bookmark size={18} color={activeTab === 'produce' ? Colors.cultivated : Colors.text.muted} />
            <Text style={[styles.tabLabel, activeTab === 'produce' && styles.tabLabelActive]}>
              Produce ({userYields.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'wishlist' && styles.tabItemActive]}
            onPress={() => setActiveTab('wishlist')}
          >
            <BookmarkCheck size={18} color={activeTab === 'wishlist' ? Colors.cultivated : Colors.text.muted} />
            <Text style={[styles.tabLabel, activeTab === 'wishlist' && styles.tabLabelActive]}>
              Wishlist
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content Display */}
        <View style={styles.tabContentArea}>
          {activeTab === 'posts' && (
            userPosts.length === 0 ? (
              <View style={styles.emptyTabArea}>
                <Text style={styles.emptyTabText}>No posts shared yet by this producer.</Text>
              </View>
            ) : (
              <View style={styles.postsList}>
                {userPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </View>
            )
          )}

          {activeTab === 'farms' && (
            userFarms.length === 0 ? (
              <View style={styles.emptyTabArea}>
                <Text style={styles.emptyTabText}>No registered farms listed yet.</Text>
              </View>
            ) : (
              <View>
                <FarmsList farms={userFarms} isOwner={false} />
              </View>
            )
          )}

          {activeTab === 'produce' && (
            userYields.length === 0 ? (
              <View style={styles.emptyTabArea}>
                <Text style={styles.emptyTabText}>No active produce yields currently listed.</Text>
              </View>
            ) : (
              <View style={styles.yieldsGrid}>
                {userYields.map((yieldItem) => (
                  <View key={yieldItem.id} style={{ width: '48%', marginBottom: 12 }}>
                    <YieldCard
                      item={yieldItem}
                      popoverVisible={false}
                      onOpenPopover={() => {}}
                      onClosePopover={() => {}}
                    />
                  </View>
                ))}
              </View>
            )
          )}

          {activeTab === 'wishlist' && (
            <View style={styles.emptyTabArea}>
              <Text style={styles.emptyTabText}>Wishlist stories and harvests are kept private.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {profileData && (
        <AgroPatronModal
          visible={patronModalVisible}
          onClose={() => setPatronModalVisible(false)}
          farmerId={profileData.id}
          farmerName={profileData.name}
          farmName={userFarms[0]?.name || `${profileData.name}'s Farm`}
          onSuccess={() => {
            setIsPatron(true);
            loadProfile();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  notFoundContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  notFoundContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  notFoundTitle: {
    fontFamily: Fonts.displayItalic,
    fontSize: 20,
    color: Colors.espresso,
    marginTop: 8,
  },
  notFoundText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  backBtnPill: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: Radii.pill,
    backgroundColor: Colors.cultivated,
  },
  backBtnPillText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.white,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.parchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitleCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  topBarTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.espresso,
  },
  topBarSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  shareBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.parchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  profileHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.card,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    marginBottom: 16,
    ...Shadows.subtle,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.parchment,
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
    borderColor: '#FFFFFF',
  },
  profileDetailsCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
    color: Colors.espresso,
  },
  email: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  farmNameBadge: {
    backgroundColor: Colors.parchment,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  farmNameBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.canopy,
  },
  tierRow: {
    marginTop: 6,
  },
  bioText: {
    fontFamily: Fonts.body,
    fontSize: 13.5,
    color: Colors.espresso,
    lineHeight: 19,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 14,
  },
  locationText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.parchment,
    borderRadius: Radii.card,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  statNumber: {
    fontFamily: Fonts.monoBold,
    fontSize: 15.5,
    color: Colors.espresso,
    textAlign: 'center',
  },
  statLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
    lineHeight: 13,
  },
  statDivider: {
    width: 1,
    height: 18,
    backgroundColor: Colors.parchmentDim,
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
    backgroundColor: Colors.cultivated,
    paddingVertical: 11,
    borderRadius: Radii.pill,
    gap: 6,
  },
  followBtnActive: {
    backgroundColor: '#EEF8F1',
    borderWidth: 1.5,
    borderColor: Colors.cultivated,
  },
  followBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.white,
  },
  followBtnTextActive: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.cultivated,
  },
  messageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.canopy,
    paddingVertical: 11,
    borderRadius: Radii.pill,
    gap: 6,
  },
  messageBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.white,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
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
    gap: 5,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Colors.cultivated,
  },
  tabLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  tabLabelActive: {
    fontFamily: Fonts.bodyBold,
    color: Colors.cultivated,
  },
  tabContentArea: {
    minHeight: 200,
  },
  postsList: {
    gap: 14,
  },
  yieldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyTabArea: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTabText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
  },
  patronBtnActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1.5,
  },
  patronBtnTextActive: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13.5,
    color: '#92400E',
  },
});
