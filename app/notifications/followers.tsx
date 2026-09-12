import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Search,
  UserPlus,
  UserCheck,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  Film,
} from 'lucide-react-native';
import { fetchAgroPartnersApi, fetchNotificationsApi } from '@/components/api/notifications';
import { toggleFollowUserApi } from '@/components/api/auth';
import { AgroPartner, NotificationItem } from '@/types';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';

export default function FollowersHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'PARTNERS' | 'NEW_FOLLOWERS'>('PARTNERS');
  const [searchQuery, setSearchQuery] = useState('');
  const [partnersList, setPartnersList] = useState<AgroPartner[]>([]);
  const [followersList, setFollowersList] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followedBackIds, setFollowedBackIds] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [partners, notifs] = await Promise.all([
        fetchAgroPartnersApi(),
        fetchNotificationsApi('FOLLOW'),
      ]);
      setPartnersList(Array.isArray(partners) ? partners : []);
      setFollowersList(Array.isArray(notifs) ? notifs : []);
    } catch (e) {
      console.warn('Failed to load followers/partners:', e);
      setPartnersList([]);
      setFollowersList([]);
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

  const filteredPartners = partnersList.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.farmName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFollowBack = async (id: string, targetUserId?: string) => {
    if (targetUserId) {
      try {
        await toggleFollowUserApi(targetUserId);
      } catch (err) {
        console.error('Follow toggle error:', err);
      }
    }
    if (followedBackIds.includes(id)) {
      setFollowedBackIds((prev) => prev.filter((i) => i !== id));
    } else {
      setFollowedBackIds((prev) => [...prev, id]);
    }
  };


  const renderPartnerItem = ({ item }: { item: AgroPartner }) => (
    <View style={styles.partnerCard}>
      <TouchableOpacity
        style={styles.avatarWrapper}
        onPress={() => router.push(`/profile/${item.userId || item.id}` as any)}
      >
        <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        {item.hasNewStory && <View style={styles.storyRing} />}
      </TouchableOpacity>

      <View style={styles.partnerInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.partnerName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.isVerified && (
            <ShieldCheck size={15} color={Colors.cultivated} style={{ marginLeft: 4 }} />
          )}
        </View>

        {item.farmName && (
          <Text style={styles.farmName} numberOfLines={1}>
            {item.farmName}
          </Text>
        )}

        <View style={styles.badgeRow}>
          <View style={styles.partnerBadge}>
            <Text style={styles.partnerBadgeText}>🤝 AgroPartner</Text>
          </View>
          <Text style={styles.regionText}>• {item.region}</Text>
        </View>
      </View>

      <View style={styles.actionButtonsCol}>
        <TouchableOpacity
          style={styles.messageBtn}
          onPress={() => router.push(`/chat/${item.userId || item.id}` as any)}
          activeOpacity={0.75}
        >
          <MessageCircle size={15} color={Colors.white} />
          <Text style={styles.messageBtnText}>Chat</Text>
        </TouchableOpacity>

        {item.hasNewStory && (
          <TouchableOpacity
            style={styles.storyBtn}
            onPress={() => router.push('/partners')}
            activeOpacity={0.75}
          >
            <Film size={13} color={Colors.cultivated} />
            <Text style={styles.storyBtnText}>Story</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderFollowerNotificationItem = ({ item }: { item: any }) => {
    const isFollowedBack = followedBackIds.includes(item.id);
    return (
      <View style={styles.partnerCard}>
        <TouchableOpacity
          onPress={() => router.push(`/profile/${item.actorId || item.userId || item.targetId || item.id}` as any)}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: item.actorAvatar || item.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' }}
            style={styles.avatar}
          />
        </TouchableOpacity>
        <View style={styles.partnerInfo}>
          <Text style={styles.partnerName}>{item.actorName || item.title || 'Agro Partner'}</Text>
          <Text style={styles.farmName}>{item.message}</Text>
          <Text style={styles.timestampText}>{item.timestamp || (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '')}</Text>
        </View>

        <TouchableOpacity
          style={[styles.followBackBtn, isFollowedBack && styles.followingBtn]}
          onPress={() => toggleFollowBack(item.id, item.actorId || item.userId)}
          activeOpacity={0.75}
        >
          {isFollowedBack ? (
            <>
              <UserCheck size={14} color={Colors.cultivated} />
              <Text style={styles.followingBtnText}>AgroPatron ⭐</Text>
            </>
          ) : (
            <>
              <UserPlus size={14} color={Colors.white} />
              <Text style={styles.followBackBtnText}>Patronize Back ⭐</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header - Clean, White Standard Mobile Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.75}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={Colors.espresso} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>AgroPatrons & Community</Text>
          <Text style={styles.headerSubtitle}>Verified farm patrons & trade supporters</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={18} color={Colors.text.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patrons by farm, crop, or city..."
            placeholderTextColor={Colors.text.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'PARTNERS' && styles.activeTabBtn]}
          onPress={() => setActiveTab('PARTNERS')}
          activeOpacity={0.75}
        >
          <Text style={[styles.tabText, activeTab === 'PARTNERS' && styles.activeTabText]}>
            Active AgroPatrons ({partnersList.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'NEW_FOLLOWERS' && styles.activeTabBtn]}
          onPress={() => setActiveTab('NEW_FOLLOWERS')}
          activeOpacity={0.75}
        >
          <Text style={[styles.tabText, activeTab === 'NEW_FOLLOWERS' && styles.activeTabText]}>
            Recent Patrons ({followersList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Sparkles size={18} color={Colors.gold} />
        <Text style={styles.infoBannerText}>
          AgroPatrons unlock exclusive <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.cultivated }}>8% harvest discounts</Text>, 48h priority harvest access, and continuous farm diary updates!
        </Text>
      </View>

      {loading && !refreshing ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.cultivated} />
        </View>
      ) : activeTab === 'PARTNERS' ? (
        <FlatList
          data={filteredPartners}
          renderItem={renderPartnerItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.cultivated]} />
          }
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ fontFamily: Fonts.body, color: Colors.text.secondary }}>
                No active AgroPatrons found.
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={followersList}
          renderItem={renderFollowerNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.cultivated]} />
          }
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ fontFamily: Fonts.body, color: Colors.text.secondary }}>
                No recent patrons yet.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF9F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
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
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontFamily: Fonts.displayItalic,
    fontSize: 18,
    color: Colors.espresso,
  },
  headerSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.parchment,
    borderRadius: Radii.input,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.espresso,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabBtn: {
    borderBottomColor: Colors.cultivated,
  },
  tabText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.text.secondary,
  },
  activeTabText: {
    color: Colors.cultivated,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF7EE',
    borderWidth: 1,
    borderColor: '#FDE4BE',
    borderRadius: Radii.card,
    marginHorizontal: 14,
    marginVertical: 10,
    padding: 12,
    gap: 10,
  },
  infoBannerText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.espresso,
    lineHeight: 18,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 4,
  },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    ...Shadows.subtle,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.parchment,
  },
  storyRing: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: Colors.cultivated,
  },
  partnerInfo: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.espresso,
  },
  farmName: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 6,
  },
  partnerBadge: {
    backgroundColor: '#EEF8F1',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 4,
  },
  partnerBadgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.cultivated,
  },
  regionText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.muted,
  },
  timestampText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.muted,
    marginTop: 3,
  },
  actionButtonsCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  messageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cultivated,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
    gap: 5,
  },
  messageBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.white,
  },
  storyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF8F1',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radii.pill,
    gap: 4,
  },
  storyBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.cultivated,
  },
  followBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gold,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
    gap: 5,
  },
  followBackBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.white,
  },
  followingBtn: {
    backgroundColor: '#EEF8F1',
    borderWidth: 1,
    borderColor: Colors.cultivated,
  },
  followingBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.cultivated,
  },
});
