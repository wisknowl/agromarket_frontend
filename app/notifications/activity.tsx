import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Star,
  Sparkles,
} from 'lucide-react-native';

import {
  fetchNotificationsApi,
  markNotificationReadApi,
} from '@/components/api/notifications';
import { NotificationItem } from '@/types';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';

export default function ActivityNotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<'ALL' | 'LIKES' | 'COMMENTS' | 'REVIEWS'>('ALL');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchNotificationsApi('ACTIVITY');
      setNotifications(Array.isArray(data) ? data : []);
    } catch (e) {
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const filteredData = notifications.filter((item) => {
    if (filter === 'LIKES') return item.title.toLowerCase().includes('like');
    if (filter === 'COMMENTS') return item.title.toLowerCase().includes('comment');
    if (filter === 'REVIEWS') return item.title.toLowerCase().includes('review');
    return true;
  });

  const handleItemPress = (item: NotificationItem) => {
    markNotificationReadApi(item.id);
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
            activeOpacity={0.75}
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
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.cultivated]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {loading ? (
              <ActivityIndicator size="large" color={Colors.cultivated} />
            ) : (
              <>
                <Sparkles size={48} color={Colors.text.muted} />
                <Text style={styles.emptyTitle}>No Activities Yet</Text>
                <Text style={styles.emptySub}>
                  When buyers and farmers interact with your harvest posts and yields, you'll see them here.
                </Text>
              </>
            )}
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
    marginLeft: 12,
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
    backgroundColor: Colors.parchment,
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
  listContent: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
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
    gap: 5,
    marginBottom: 3,
  },
  actorName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.espresso,
  },
  actionType: {
    fontFamily: Fonts.body,
    fontSize: 14,
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
    fontSize: 14,
    color: Colors.espresso,
    lineHeight: 20,
    marginTop: 2,
    marginBottom: 4,
  },
  timestamp: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.muted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    color: Colors.espresso,
    marginTop: 12,
  },
  emptySub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: '80%',
    lineHeight: 20,
  },
});
