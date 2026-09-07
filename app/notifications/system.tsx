import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Bell,
  FileText,
  DollarSign,
} from 'lucide-react-native';
import { systemNotifications } from '@/mocks/data';
import { NotificationItem } from '@/types';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';

export default function SystemNotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>(systemNotifications);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationPress = (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    );

    if (item.targetType === 'order' && item.targetId) {
      router.push('/(tabs)/cart');
    } else if (item.targetType === 'loan') {
      router.push('/fintech/loans');
    } else if (item.targetType === 'profile') {
      router.push('/(tabs)/profile');
    }
  };

  const getBadgeIcon = (badge?: string) => {
    switch (badge) {
      case 'ESCROW_RELEASED':
        return <DollarSign size={20} color={Colors.cultivated} strokeWidth={2.4} />;
      case 'LOAN_APPROVED':
        return <CreditCard size={20} color={Colors.gold} strokeWidth={2.4} />;
      case 'VERIFIED':
        return <ShieldCheck size={20} color={Colors.cultivated} strokeWidth={2.4} />;
      default:
        return <FileText size={20} color={Colors.espresso} strokeWidth={2.4} />;
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[styles.card, !item.isRead && styles.unreadCard]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.75}
    >
      <View style={[styles.iconContainer, !item.isRead && styles.unreadIconContainer]}>
        {getBadgeIcon(item.badge)}
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, !item.isRead && styles.unreadTitle]}>{item.title}</Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>System & Platform Notices</Text>
          <Text style={styles.headerSubtitle}>Official AgroMarket alerts & escrow logs</Text>
        </View>
        <TouchableOpacity style={styles.markReadBtn} onPress={markAllRead}>
          <Text style={styles.markReadText}>Mark read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bell size={48} color={Colors.text.muted} />
            <Text style={styles.emptyTitle}>No System Notices</Text>
            <Text style={styles.emptySub}>Platform policy and payment notices will appear here.</Text>
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
    justifyContent: 'space-between',
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
  markReadBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radii.pill,
  },
  markReadText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.gold,
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
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.parchment,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  unreadIconContainer: {
    backgroundColor: '#FEF7EE',
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.espresso,
    flex: 1,
  },
  unreadTitle: {
    color: Colors.canopy,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gold,
    marginLeft: 6,
  },
  message: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: 6,
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
