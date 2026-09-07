import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
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
import { agroPartners, followerNotifications } from '@/mocks/data';
import { AgroPartner } from '@/types';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';

export default function FollowersHubScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'PARTNERS' | 'NEW_FOLLOWERS'>('PARTNERS');
  const [searchQuery, setSearchQuery] = useState('');
  const [partnersList, setPartnersList] = useState<AgroPartner[]>(agroPartners);
  const [followedBackIds, setFollowedBackIds] = useState<string[]>([]);

  const filteredPartners = partnersList.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.farmName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFollowBack = (id: string, name: string) => {
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
            <ShieldCheck size={14} color={Colors.cultivated} style={{ marginLeft: 4 }} />
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
          onPress={() => router.push('/chat/c1')}
        >
          <MessageCircle size={15} color={Colors.white} />
          <Text style={styles.messageBtnText}>Chat</Text>
        </TouchableOpacity>

        {item.hasNewStory && (
          <TouchableOpacity
            style={styles.storyBtn}
            onPress={() => router.push('/partners')}
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
          onPress={() => router.push(`/profile/${item.targetId || 'f1'}` as any)}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: item.avatarUrl || 'https://randomuser.me/api/portraits/lego/1.jpg' }}
            style={styles.avatar}
          />
        </TouchableOpacity>
        <View style={styles.partnerInfo}>
          <Text style={styles.partnerName}>{item.actorName || item.title}</Text>
          <Text style={styles.farmName}>{item.message}</Text>
          <Text style={styles.timestampText}>{item.timestamp}</Text>
        </View>

        <TouchableOpacity
          style={[styles.followBackBtn, isFollowedBack && styles.followingBtn]}
          onPress={() => toggleFollowBack(item.id, item.actorName)}
        >
          {isFollowedBack ? (
            <>
              <UserCheck size={14} color={Colors.cultivated} />
              <Text style={styles.followingBtnText}>Partners 🤝</Text>
            </>
          ) : (
            <>
              <UserPlus size={14} color={Colors.white} />
              <Text style={styles.followBackBtnText}>Follow Back</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>AgroPartners & Followers</Text>
          <Text style={styles.headerSubtitle}>Mutual agricultural trade connections</Text>
        </View>
        <TouchableOpacity
          style={styles.streamShortcut}
          onPress={() => router.push('/partners')}
        >
          <Film size={16} color={Colors.gold} />
          <Text style={styles.streamShortcutText}>Stream</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={18} color={Colors.text.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search partners by farm, crop, or city..."
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
        >
          <Text style={[styles.tabText, activeTab === 'PARTNERS' && styles.activeTabText]}>
            Mutual AgroPartners ({partnersList.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'NEW_FOLLOWERS' && styles.activeTabBtn]}
          onPress={() => setActiveTab('NEW_FOLLOWERS')}
        >
          <Text style={[styles.tabText, activeTab === 'NEW_FOLLOWERS' && styles.activeTabText]}>
            New Followers ({followerNotifications.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Sparkles size={16} color={Colors.gold} />
        <Text style={styles.infoBannerText}>
          When you and another producer/buyer follow each other, you unlock **AgroPartners** trade privileges and priority offers!
        </Text>
      </View>

      {activeTab === 'PARTNERS' ? (
        <FlatList
          data={filteredPartners}
          renderItem={renderPartnerItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={followerNotifications}
          renderItem={renderFollowerNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
    backgroundColor: Colors.canopy,
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontFamily: Fonts.displayItalic,
    fontSize: 17,
    color: Colors.white,
  },
  headerSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.parchment,
    opacity: 0.8,
  },
  streamShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radii.pill,
    gap: 4,
  },
  streamShortcutText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.gold,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    backgroundColor: Colors.white,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.parchment,
    borderRadius: Radii.input,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.espresso,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabBtn: {
    borderBottomColor: Colors.cultivated,
  },
  tabText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
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
    margin: 12,
    padding: 10,
    gap: 8,
  },
  infoBannerText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.espresso,
    lineHeight: 15,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.parchment,
  },
  storyRing: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: Colors.cultivated,
  },
  partnerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.espresso,
  },
  farmName: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  partnerBadge: {
    backgroundColor: '#EEF8F1',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  partnerBadgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.cultivated,
  },
  regionText: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.text.muted,
  },
  timestampText: {
    fontFamily: Fonts.body,
    fontSize: 10,
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
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    gap: 4,
  },
  messageBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.white,
  },
  storyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF8F1',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radii.pill,
    gap: 4,
  },
  storyBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    color: Colors.cultivated,
  },
  followBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gold,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    gap: 4,
  },
  followBackBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.white,
  },
  followingBtn: {
    backgroundColor: '#EEF8F1',
    borderWidth: 1,
    borderColor: Colors.cultivated,
  },
  followingBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.cultivated,
  },
});
