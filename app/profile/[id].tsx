import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Dimensions,
  StatusBar,
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
  Heart,
  Share2,
  Lock,
} from 'lucide-react-native';
import {
  users as mockUsers,
  farmers as mockFarmers,
  farms as mockFarms,
  posts as mockPosts,
  agroYields as mockYields,
} from '@/mocks/data';
import { fetchPublicProfileApi, toggleFollowUserApi } from '@/components/api/auth';
import { fetchFeedPostsApi } from '@/components/api/posts';
import { Post, AgroYield, Farm } from '@/types';
import PostCard from '@/components/PostCard';
import YieldCard from '@/components/YieldCard';
import FarmsList from '@/components/FarmsList';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import FarmerBadge from '@/components/ui/FarmerBadge';

export default function PublicProfileViewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [activeTab, setActiveTab] = useState<'posts' | 'farms' | 'saved' | 'likes'>('posts');
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userYields, setUserYields] = useState<AgroYield[]>([]);
  const [userFarms, setUserFarms] = useState<Farm[]>([]);
  const [isFollowing, setIsFollowing] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    if (!id) return;
    setLoading(true);

    try {
      // 1. Try real backend API
      const data = await fetchPublicProfileApi(id);
      if (data) {
        setProfileData(data);
        setIsFollowing(Boolean(data.isFollowing));
      } else {
        resolveMockProfile(id);
      }
    } catch (e) {
      resolveMockProfile(id);
    } finally {
      setLoading(false);
    }
  };

  const resolveMockProfile = (targetId: string) => {
    // 1. Check in users
    const foundUser = mockUsers.find(
      (u) =>
        u.id === targetId ||
        u.farmerProfile?.id === targetId ||
        u.farmerProfile?.userId === targetId ||
        u.wholesalerProfile?.id === targetId ||
        u.transporterProfile?.id === targetId
    );

    // 2. Check in farmers
    const foundFarmer = mockFarmers.find(
      (f) => f.id === targetId || f.userId === targetId
    );

    // 3. Resolve matched profile
    const resolvedUser = foundUser || {
      id: targetId,
      name: foundFarmer ? foundFarmer.farmName : 'Victoy Eyong',
      email: 'farmer@agromarket.com',
      phone: '+237 671 111 111',
      avatar:
        foundFarmer?.profilePhoto ||
        'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=500&auto=format&fit=crop&q=60',
      role: 'FARMER',
      isVerified: true,
      farmerProfile: {
        id: foundFarmer?.id || 'f1',
        userId: targetId,
        farmName: foundFarmer?.farmName || 'Green Valley Organic Farms',
        region: foundFarmer?.location || 'Foumbot, West Region',
        city: 'Foumbot',
        rating: foundFarmer?.rating || 4.9,
        totalRatings: 142,
        totalFollowers: foundFarmer?.followers || 320,
        creditTier: 'GOLD',
        creditScore: 780,
        bio:
          foundFarmer?.description ||
          'Specializing in fresh volcanic soil vegetables, vine tomatoes, and Penja pepper in Foumbot valley.',
      },
    };

    setProfileData(resolvedUser);
    setIsFollowing(true);

    // 4. Resolve exact farms
    const resolvedFarms = mockFarms.filter(
      (f) => f.userId === resolvedUser.id || f.id === targetId
    );
    setUserFarms(resolvedFarms.length > 0 ? resolvedFarms : [mockFarms[0]]);

    // 5. Resolve exact posts created by this user
    const farmerIdMatch = resolvedUser.farmerProfile?.id || resolvedUser.id;
    const resolvedPosts = mockPosts.filter(
      (p) =>
        p.farmerId === farmerIdMatch ||
        p.farmerId === resolvedUser.id ||
        p.userId === resolvedUser.id
    );
    setUserPosts(resolvedPosts.length > 0 ? resolvedPosts : [mockPosts[0]]);

    // 6. Resolve exact produce yields
    const resolvedYields = mockYields.filter(
      (y) => y.farmerId === farmerIdMatch || y.farmerId === resolvedUser.id
    );
    setUserYields(resolvedYields.length > 0 ? resolvedYields : [mockYields[0]]);
  };

  const handleToggleFollow = async () => {
    if (!profileData?.id) return;
    setFollowLoading(true);
    try {
      await toggleFollowUserApi(profileData.id);
      setIsFollowing((prev) => !prev);
    } catch (e) {
      setIsFollowing((prev) => !prev);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleOpenChat = () => {
    router.push('/chat/c1');
  };

  if (loading || !profileData) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ActivityIndicator size="large" color={Colors.cultivated} />
        <Text style={styles.loadingText}>Loading AgroMarket Profile...</Text>
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
    320;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Standalone Top Bar with Back Button (No bottom TabBar) */}
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
                    'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=500&auto=format&fit=crop&q=60',
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
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statNumber}>45</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statNumber}>4</Text>
              <Text style={styles.statLabel}>Partners</Text>
            </View>
          </View>

          {/* Visitor Action Bar: Follow / Following & Message */}
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
                  <Text style={styles.followBtnTextActive}>AgroPartner 🤝</Text>
                </>
              ) : (
                <>
                  <UserPlus size={16} color={Colors.white} strokeWidth={2.2} />
                  <Text style={styles.followBtnText}>Follow & Connect</Text>
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

        {/* Public Visible Tabs (Filtered: No Orders Tab, No Owner Controls) */}
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
            style={[styles.tabItem, activeTab === 'saved' && styles.tabItemActive]}
            onPress={() => setActiveTab('saved')}
          >
            <Bookmark size={18} color={activeTab === 'saved' ? Colors.cultivated : Colors.text.muted} />
            <Text style={[styles.tabLabel, activeTab === 'saved' && styles.tabLabelActive]}>
              Produce
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'likes' && styles.tabItemActive]}
            onPress={() => setActiveTab('likes')}
          >
            <Heart size={18} color={activeTab === 'likes' ? Colors.cultivated : Colors.text.muted} />
            <Text style={[styles.tabLabel, activeTab === 'likes' && styles.tabLabelActive]}>
              Likes
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content Display */}
        <View style={styles.tabContentArea}>
          {activeTab === 'posts' && (
            <View style={styles.postsList}>
              {userPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </View>
          )}

          {activeTab === 'farms' && (
            <View>
              <FarmsList farms={userFarms} isOwner={false} />
            </View>
          )}

          {activeTab === 'saved' && (
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
          )}

          {activeTab === 'likes' && (
            <View style={styles.postsList}>
              {userPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
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
    marginTop: 1,
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
});
