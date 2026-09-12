import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  StatusBar,
  Modal,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  ShieldAlert,
  Sparkles,
  UserPlus,
  Users,
  Mic,
  Tag,
  CheckCheck,
  ShieldCheck,
  ChevronDown,
  X,
  Globe,
  Lock,
} from 'lucide-react-native';
import { Conversation, AgroPartner } from '@/types';
import { fetchUserConversationsApi } from '@/components/api/chat';
import { fetchNotificationsApi, fetchAgroPartnersApi } from '@/components/api/notifications';
import { useAuthStore } from '@/store/authStore';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';

type PresenceMode = 'PARTNERS' | 'PUBLIC' | 'PRIVATE';

export default function InboxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'DEALS' | 'UNREAD'>('ALL');
  const [presenceModalVisible, setPresenceModalVisible] = useState(false);
  const [presenceMode, setPresenceMode] = useState<PresenceMode>('PARTNERS');

  const [conversationList, setConversationList] = useState<Conversation[]>([]);
  const [partnersList, setPartnersList] = useState<AgroPartner[]>([]);
  const [unreadSystemCount, setUnreadSystemCount] = useState(0);
  const [unreadActivityCount, setUnreadActivityCount] = useState(0);
  const [unreadFollowersCount, setUnreadFollowersCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = React.useCallback(async () => {
    if (!isAuthenticated) {
      setConversationList([]);
      setPartnersList([]);
      return;
    }
    try {
      setLoading(true);
      const [convData, allNotifs, partners] = await Promise.all([
        fetchUserConversationsApi(),
        fetchNotificationsApi(),
        fetchAgroPartnersApi(),
      ]);

      if (Array.isArray(convData)) {
        setConversationList(convData);
      }
      if (Array.isArray(partners)) {
        setPartnersList(partners);
      }
      if (Array.isArray(allNotifs)) {
        setUnreadSystemCount(
          allNotifs.filter(
            (n) => (n.category === 'SYSTEM' || n.category === 'FINTECH' || n.category === 'ORDER') && !n.isRead
          ).length
        );
        setUnreadActivityCount(allNotifs.filter((n) => n.category === 'ACTIVITY' && !n.isRead).length);
        setUnreadFollowersCount(allNotifs.filter((n) => n.category === 'FOLLOW' && !n.isRead).length);
      }
    } catch (err) {
      console.warn('Could not fetch inbox data from backend:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };


  const filteredConversations = conversationList.filter((conv) => {
    const matchesSearch =
      (conv.participantName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      ((conv as any).farmerName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (conv.lastMessage?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'DEALS') return (conv as any).hasActiveOffer || (conv as any).lastMessageType === 'OFFER_CARD';
    if (activeFilter === 'UNREAD') return (conv.unreadCount || 0) > 0;
    return true;
  });


  const renderConversationRow = ({ item }: { item: Conversation }) => {
    const isUnread = (item.unreadCount || 0) > 0;

    return (
      <TouchableOpacity
        style={[styles.convRow, isUnread && styles.unreadConvRow]}
        onPress={() => router.push(`/chat/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri:
                item.participantAvatar ||
                item.farmerAvatar ||
                'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=500&auto=format&fit=crop&q=60',
            }}
            style={styles.convAvatar}
          />
          {item.isOnline && <View style={styles.onlineBadge} />}
        </View>

        <View style={styles.convDetails}>
          <View style={styles.convTopRow}>
            <View style={styles.nameContainer}>
              <Text style={[styles.convName, isUnread && styles.unreadConvName]} numberOfLines={1}>
                {item.participantName || item.farmerName}
              </Text>
              {item.isVerified && (
                <ShieldCheck size={16} color={Colors.cultivated} style={{ marginLeft: 4 }} />
              )}
              {item.isAgroPartner && (
                <View style={styles.partnerBadge}>
                  <Text style={styles.partnerBadgeText}>🤝 Partner</Text>
                </View>
              )}
            </View>
            <Text style={[styles.convTime, isUnread && styles.unreadConvTime]}>
              {item.lastMessageTime || 'Just now'}
            </Text>
          </View>

          <View style={styles.convBottomRow}>
            {item.lastMessageType === 'OFFER_CARD' ? (
              <View style={styles.dealSnippet}>
                <Tag size={14} color={Colors.gold} />
                <Text style={styles.dealSnippetText} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              </View>
            ) : item.lastMessageType === 'VOICE' ? (
              <View style={styles.voiceSnippet}>
                <Mic size={14} color={Colors.cultivated} />
                <Text style={styles.voiceSnippetText} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              </View>
            ) : (
              <Text
                style={[styles.convSnippet, isUnread && styles.unreadConvSnippet]}
                numberOfLines={1}
              >
                {item.lastMessage}
              </Text>
            )}

            {isUnread && (
              <View style={styles.unreadBubble}>
                <Text style={styles.unreadBubbleText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Navigation Bar: Add Chat on Left, Centralized AgroInbox + Dropdown [ 🟢 ▾ ], Search on Right */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
        {/* Top Left: Add Chat / New Conversation */}
        <TouchableOpacity
          style={styles.actionIconBtn}
          onPress={() => router.push('/notifications/followers')}
          activeOpacity={0.75}
          accessibilityLabel="Add chat or new partner conversation"
        >
          <UserPlus size={21} color={Colors.canopy} />
        </TouchableOpacity>

        {/* Centralized Title with Round [ 🟢 ▾ ] Dropdown Indicator */}
        <TouchableOpacity
          style={styles.centralHeaderBtn}
          onPress={() => setPresenceModalVisible(true)}
          activeOpacity={0.75}
        >
          <Text style={styles.headerTitle}>AgroInbox</Text>
          <View style={styles.compactPresenceBtn}>
            <View
              style={[
                styles.presenceDot,
                presenceMode === 'PARTNERS'
                  ? styles.presencePartners
                  : presenceMode === 'PUBLIC'
                  ? styles.presencePublic
                  : styles.presencePrivate,
              ]}
            />
            <ChevronDown size={13} color={Colors.espresso} strokeWidth={2.4} />
          </View>
        </TouchableOpacity>

        {/* Top Right: Search Icon */}
        <TouchableOpacity
          style={styles.actionIconBtn}
          onPress={() => setSearchVisible((prev) => !prev)}
          activeOpacity={0.75}
        >
          <Search size={21} color={searchVisible ? Colors.cultivated : Colors.espresso} />
        </TouchableOpacity>
      </View>

      {/* Optional Search Input Bar */}
      {searchVisible && (
        <View style={styles.searchBarWrapper}>
          <Search size={16} color={Colors.text.muted} />
          <TextInput
            style={styles.searchTextInput}
            placeholder="Search conversations, farmers, produce..."
            placeholderTextColor={Colors.text.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={Colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 70 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.cultivated]} />
        }
      >

        {/* TikTok-Style 3-Hub Header Channels */}
        <View style={styles.hubContainer}>
          {/* Channel 1: System Notices */}
          <TouchableOpacity
            style={styles.hubCard}
            onPress={() => router.push('/notifications/system')}
            activeOpacity={0.75}
          >
            <View style={[styles.hubIconCircle, { backgroundColor: '#FEF7EE' }]}>
              <ShieldAlert size={22} color={Colors.gold} strokeWidth={2.2} />
              {unreadSystemCount > 0 && (
                <View style={styles.hubBadge}>
                  <Text style={styles.hubBadgeText}>{unreadSystemCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.hubLabel}>System Notices</Text>
            <Text style={styles.hubSub}>Policy & Escrow</Text>
          </TouchableOpacity>

          {/* Channel 2: Activities Hub */}
          <TouchableOpacity
            style={styles.hubCard}
            onPress={() => router.push('/notifications/activity')}
            activeOpacity={0.75}
          >
            <View style={[styles.hubIconCircle, { backgroundColor: '#EEF8F1' }]}>
              <Sparkles size={22} color={Colors.cultivated} strokeWidth={2.2} />
              {unreadActivityCount > 0 && (
                <View style={styles.hubBadge}>
                  <Text style={styles.hubBadgeText}>{unreadActivityCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.hubLabel}>Activities</Text>
            <Text style={styles.hubSub}>Likes & Comments</Text>
          </TouchableOpacity>

          {/* Channel 3: Followers & AgroPartners */}
          <TouchableOpacity
            style={styles.hubCard}
            onPress={() => router.push('/notifications/followers')}
            activeOpacity={0.75}
          >
            <View style={[styles.hubIconCircle, { backgroundColor: '#F0F9FF' }]}>
              <Users size={22} color="#0284C7" strokeWidth={2.2} />
              {unreadFollowersCount > 0 && (
                <View style={[styles.hubBadge, { backgroundColor: '#0284C7' }]}>
                  <Text style={styles.hubBadgeText}>{unreadFollowersCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.hubLabel}>AgroPatrons</Text>
            <Text style={styles.hubSub}>Patrons & Community</Text>
          </TouchableOpacity>
        </View>

        {/* Active AgroPatrons Horizontal Strip (Clean patron avatars only) */}
        <View style={styles.partnersStripSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Active AgroPatrons</Text>
            <TouchableOpacity onPress={() => router.push('/notifications/followers')}>
              <Text style={styles.viewAllText}>View All ({partnersList.length})</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.partnersStrip}>
            {partnersList.map((partner) => (

              <TouchableOpacity
                key={partner.id}
                style={styles.partnerItem}
                onPress={() => router.push('/partners')}
                activeOpacity={0.8}
              >
                <View style={styles.partnerAvatarWrapper}>
                  <Image source={{ uri: partner.avatarUrl }} style={styles.partnerAvatar} />
                  {partner.hasNewStory && <View style={styles.partnerStoryRing} />}
                  <View style={styles.partnerOnlineDot} />
                </View>
                <Text style={styles.partnerName} numberOfLines={1}>
                  {partner.name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterSection}>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'ALL' && styles.activeFilterChip]}
            onPress={() => setActiveFilter('ALL')}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'ALL' && styles.activeFilterChipText,
              ]}
            >
              All Messages
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'DEALS' && styles.activeFilterChip]}
            onPress={() => setActiveFilter('DEALS')}
          >
            <Tag size={14} color={activeFilter === 'DEALS' ? Colors.white : Colors.soil} />
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'DEALS' && styles.activeFilterChipText,
              ]}
            >
              Deals & Offers
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'UNREAD' && styles.activeFilterChip]}
            onPress={() => setActiveFilter('UNREAD')}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'UNREAD' && styles.activeFilterChipText,
              ]}
            >
              Unread
            </Text>
          </TouchableOpacity>
        </View>

        {/* Clean White Borderless Conversations List */}
        <View style={styles.conversationsList}>
          {filteredConversations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <UserPlus size={48} color={Colors.text.muted} />
              <Text style={styles.emptyTitle}>No Conversations Yet</Text>
              <Text style={styles.emptySub}>
                Connect with farmers, wholesalers, and transporters to start trading directly.
              </Text>
            </View>
          ) : (
            filteredConversations.map((conv) => (
              <React.Fragment key={conv.id}>
                {renderConversationRow({ item: conv })}
              </React.Fragment>
            ))
          )}
        </View>
      </ScrollView>

      {/* Online Visibility Bottom Sheet Popup (With Safe Area padding for phones nav buttons) */}
      <Modal
        visible={presenceModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPresenceModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPresenceModalVisible(false)}>
          <Pressable
            style={[
              styles.bottomSheet,
              { paddingBottom: Math.max(insets.bottom, 20) + 16 },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Who Can See You Online?</Text>
              <TouchableOpacity onPress={() => setPresenceModalVisible(false)}>
                <X size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetSubtitle}>
              Control your active status visibility across AgroMarket chat and farmer directories:
            </Text>

            {/* Option 1: AgroPartners Only */}
            <TouchableOpacity
              style={[
                styles.presenceOption,
                presenceMode === 'PARTNERS' && styles.presenceOptionActive,
              ]}
              onPress={() => {
                setPresenceMode('PARTNERS');
                setPresenceModalVisible(false);
              }}
            >
              <View style={[styles.presenceOptionIcon, { backgroundColor: '#EEF8F1' }]}>
                <Users size={20} color={Colors.cultivated} />
              </View>
              <View style={styles.presenceOptionInfo}>
                <Text style={styles.presenceOptionTitle}>AgroPartners Only 🤝</Text>
                <Text style={styles.presenceOptionDesc}>
                  Only mutual connections and trusted partners can see your active green status.
                </Text>
              </View>
              {presenceMode === 'PARTNERS' && <View style={styles.selectedRadioDot} />}
            </TouchableOpacity>

            {/* Option 2: Public / Everyone */}
            <TouchableOpacity
              style={[
                styles.presenceOption,
                presenceMode === 'PUBLIC' && styles.presenceOptionActive,
              ]}
              onPress={() => {
                setPresenceMode('PUBLIC');
                setPresenceModalVisible(false);
              }}
            >
              <View style={[styles.presenceOptionIcon, { backgroundColor: '#FEF7EE' }]}>
                <Globe size={20} color={Colors.gold} />
              </View>
              <View style={styles.presenceOptionInfo}>
                <Text style={styles.presenceOptionTitle}>Public (All Farmers & Buyers)</Text>
                <Text style={styles.presenceOptionDesc}>
                  Visible to everyone on the marketplace for fastest wholesale inquiries.
                </Text>
              </View>
              {presenceMode === 'PUBLIC' && <View style={styles.selectedRadioDot} />}
            </TouchableOpacity>

            {/* Option 3: Private / Hidden */}
            <TouchableOpacity
              style={[
                styles.presenceOption,
                presenceMode === 'PRIVATE' && styles.presenceOptionActive,
              ]}
              onPress={() => {
                setPresenceMode('PRIVATE');
                setPresenceModalVisible(false);
              }}
            >
              <View style={[styles.presenceOptionIcon, { backgroundColor: '#F4F4F5' }]}>
                <Lock size={20} color={Colors.text.muted} />
              </View>
              <View style={styles.presenceOptionInfo}>
                <Text style={styles.presenceOptionTitle}>Private / Appear Offline</Text>
                <Text style={styles.presenceOptionDesc}>
                  Hide your online status completely while continuing to send and receive messages.
                </Text>
              </View>
              {presenceMode === 'PRIVATE' && <View style={styles.selectedRadioDot} />}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  centralHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  headerTitle: {
    fontFamily: Fonts.displayItalic,
    fontSize: 22,
    color: Colors.canopy,
  },
  compactPresenceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.parchment,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    gap: 4,
  },
  presenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  presencePartners: {
    backgroundColor: Colors.cultivated,
  },
  presencePublic: {
    backgroundColor: Colors.gold,
  },
  presencePrivate: {
    backgroundColor: Colors.text.muted,
  },
  actionIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.parchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.parchment,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: Radii.input,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    gap: 8,
  },
  searchTextInput: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.espresso,
  },
  scrollContent: {
    paddingTop: 12,
  },
  hubContainer: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 14,
  },
  hubCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.card,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    ...Shadows.subtle,
  },
  hubIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  hubBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: Colors.clay,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radii.pill,
    minWidth: 18,
    alignItems: 'center',
  },
  hubBadgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.white,
  },
  hubLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.espresso,
  },
  hubSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  partnersStripSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.parchmentDim,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.espresso,
  },
  viewAllText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.cultivated,
  },
  partnersStrip: {
    paddingHorizontal: 12,
  },
  partnerItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 62,
  },
  partnerAvatarWrapper: {
    position: 'relative',
    marginBottom: 4,
  },
  partnerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.parchment,
  },
  partnerStoryRing: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: Colors.cultivated,
  },
  partnerOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  partnerName: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.espresso,
    textAlign: 'center',
  },
  filterSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
    backgroundColor: Colors.parchment,
    gap: 5,
  },
  activeFilterChip: {
    backgroundColor: Colors.cultivated,
  },
  filterChipText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.espresso,
  },
  activeFilterChipText: {
    color: Colors.white,
  },
  conversationsList: {
    backgroundColor: '#FFFFFF',
  },
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  unreadConvRow: {
    backgroundColor: '#FFFDF9',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  convAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.parchment,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  convDetails: {
    flex: 1,
  },
  convTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  convName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.espresso,
  },
  unreadConvName: {
    color: Colors.canopy,
  },
  partnerBadge: {
    backgroundColor: '#EEF8F1',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  partnerBadgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.cultivated,
  },
  convTime: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.muted,
  },
  unreadConvTime: {
    fontFamily: Fonts.bodyBold,
    color: Colors.gold,
  },
  convBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  convSnippet: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.secondary,
    flex: 1,
    marginRight: 8,
  },
  unreadConvSnippet: {
    fontFamily: Fonts.bodySemiBold,
    color: Colors.espresso,
  },
  dealSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginRight: 8,
  },
  dealSnippetText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.soil,
  },
  voiceSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginRight: 8,
  },
  voiceSnippetText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.cultivated,
  },
  unreadBubble: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radii.pill,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBubbleText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.espresso,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.parchmentDim,
    marginLeft: 82,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.espresso,
    marginTop: 12,
  },
  emptySub: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(36,26,18,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.parchmentDim,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sheetTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    color: Colors.espresso,
  },
  sheetSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  presenceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.parchment,
    borderRadius: Radii.card,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 12,
  },
  presenceOptionActive: {
    borderColor: Colors.cultivated,
    backgroundColor: '#EEF8F1',
  },
  presenceOptionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presenceOptionInfo: {
    flex: 1,
  },
  presenceOptionTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.espresso,
  },
  presenceOptionDesc: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
    lineHeight: 16,
  },
  selectedRadioDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.cultivated,
  },
});