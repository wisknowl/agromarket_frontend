import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Star,
  Sparkles,
} from 'lucide-react-native';
import { activityNotifications } from '@/mocks/data';
import { NotificationItem } from '@/types';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';

export default function ActivityNotificationsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<'ALL' | 'LIKES' | 'COMMENTS' | 'REVIEWS'>('ALL');
  const [notifications, setNotifications] = useState<NotificationItem[]>(activityNotifications);

  const filteredData = notifications.filter((item) => {
    if (filter === 'LIKES') return item.title.toLowerCase().includes('like');
    if (filter === 'COMMENTS') return item.title.toLowerCase().includes('comment');
    if (filter === 'REVIEWS') return item.title.toLowerCase().includes('review');
    return true;
  });

  const handleItemPress = (item: NotificationItem) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    );

    if (item.targetType === 'post') {
      // Navigate to harvest story feed / modal
      router.push('/(tabs)');
    } else if (item.targetType === 'yield' && item.targetId) {
      router.push(`/yield/${item.targetId}` as any);
    }
  };

  const getActivityIcon = (title: string) => {
    if (title.toLowerCase().includes('like')) {
      return (
        <View style={[styles.miniBadge, { backgroundColor: '#FEE2E2' }]}>
          <Heart size={12} color="#EF4444" fill="#EF4444" />
        </View>
      );
    }
    if (title.toLowerCase().includes('comment')) {
      return (
        <View style={[styles.miniBadge, { backgroundColor: '#E0F2FE' }]}>
          <MessageCircle size={12} color="#0284C7" />
        </View>
      );
    }
    return (
      <View style={[styles.miniBadge, { backgroundColor: '#FEF3C7' }]}>
        <Star size={12} color={Colors.gold} fill={Colors.gold} />
      </View>
    );
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[styles.card, !item.isRead && styles.unreadCard]}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.75}
    >
      <View style={styles.avatarWrapper}>
        <Image
          source={{ uri: item.avatarUrl || 'https://randomuser.me/api/portraits/lego/1.jpg' }}
          style={styles.avatar}
        />
        {getActivityIcon(item.title)}
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.actorName}>{item.actorName || 'A user'}</Text>
          <Text style={styles.actionType}>{item.title}</Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Activity & Interactions</Text>
          <Text style={styles.headerSubtitle}>Likes, comments & harvest reviews</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['ALL', 'LIKES', 'COMMENTS', 'REVIEWS'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterChip, filter === tab && styles.activeFilterChip]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.filterChipText, filter === tab && styles.activeFilterChipText]}>
              {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Sparkles size={48} color={Colors.text.muted} />
            <Text style={styles.emptyTitle}>No Activities Yet</Text>
            <Text style={styles.emptySub}>
              When buyers and farmers interact with your harvest posts and yields, you'll see them here.
            </Text>
          </View>
        }
      />
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
    backgroundColor: Colors.parchment,
  },
  activeFilterChip: {
    backgroundColor: Colors.cultivated,
  },
  filterChipText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.espresso,
  },
  activeFilterChipText: {
    color: Colors.white,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  unreadCard: {
    borderColor: Colors.gold,
    backgroundColor: '#FFFDF9',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.parchment,
  },
  miniBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 2,
  },
  actorName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.espresso,
  },
  actionType: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gold,
    marginLeft: 'auto',
  },
  message: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.espresso,
    lineHeight: 17,
    marginTop: 2,
    marginBottom: 4,
  },
  timestamp: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.muted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
    maxWidth: '80%',
  },
});
