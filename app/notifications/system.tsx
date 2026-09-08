import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header - Clean, White Standard Mobile Header */}
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
          <Text style={styles.headerTitle}>System Notices</Text>
          <Text style={styles.headerSubtitle}>Official AgroMarket alerts & escrow logs</Text>
        </View>
        <TouchableOpacity
          style={styles.markReadBtn}
          onPress={markAllRead}
          activeOpacity={0.75}
        >
          <Text style={styles.markReadText}>Mark read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 24 },
        ]}
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
    backgroundColor: '#FFFFFF',
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  markReadBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#EEF8F1',
    borderRadius: Radii.pill,
  },
  markReadText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.cultivated,
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
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
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
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 6,
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
