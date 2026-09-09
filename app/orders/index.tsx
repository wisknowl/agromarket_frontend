import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  StatusBar,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Package,
  Calendar,
  Layers,
} from 'lucide-react-native';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { fetchMyOrdersApi } from '@/components/api/orders';
import { useLocale } from '@/context/LocaleContext';

type OrderFilter = 'ALL' | 'ESCROW_LOCKED' | 'IN_TRANSIT' | 'SETTLED';

export default function OrdersListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentRegion } = useLocale();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<OrderFilter>('ALL');

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await fetchMyOrdersApi();
      if (Array.isArray(data) && data.length > 0) {
        setOrders(data);
      } else {
        // High-fidelity fallback simulated orders demonstrating Engine 3
        setOrders([
          {
            id: 'ORD-8412',
            status: 'ESCROW_LOCKED',
            currency: currentRegion.currency,
            totalAmount: 20000,
            createdAt: new Date().toISOString(),
            deliveryAddress: 'Bonapriso, Douala',
            items: [
              {
                id: 'i1',
                quantity: 5,
                unitPrice: 3500,
                totalPrice: 17500,
                yield: {
                  title: 'Ndop Plateau Heirloom Organic Tomatoes',
                  unit: 'CRATE',
                  mediaUrls: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800'],
                },
                farmer: { name: 'Tanyi Farms Cooperative' },
              },
            ],
          },
          {
            id: 'ORD-7991',
            status: 'IN_TRANSIT',
            currency: currentRegion.currency,
            totalAmount: 38000,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            deliveryAddress: 'Akwa Market, Douala',
            items: [
              {
                id: 'i2',
                quantity: 10,
                unitPrice: 3800,
                totalPrice: 38000,
                yield: {
                  title: 'Fresh White Yam Tubers (Volcanic Soil)',
                  unit: 'BAG',
                  mediaUrls: ['https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=800'],
                },
                farmer: { name: 'Foumbot Highland Growers' },
              },
            ],
          },
          {
            id: 'ORD-7230',
            status: 'SETTLED',
            currency: currentRegion.currency,
            totalAmount: 14500,
            createdAt: new Date(Date.now() - 259200000).toISOString(),
            deliveryAddress: 'Molyko, Buea',
            items: [
              {
                id: 'i3',
                quantity: 4,
                unitPrice: 3200,
                totalPrice: 12800,
                yield: {
                  title: 'Sweet Red Bell Peppers (Greenhouse)',
                  unit: 'CRATE',
                  mediaUrls: ['https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=800'],
                },
                farmer: { name: 'Buea Mountain Greens' },
              },
            ],
          },
        ]);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ESCROW_LOCKED':
        return {
          label: 'Escrow Locked',
          icon: Lock,
          bg: '#FEF3C7',
          color: '#B45309',
        };
      case 'IN_TRANSIT':
        return {
          label: 'In Transit',
          icon: Truck,
          bg: '#EFF6FF',
          color: '#1D4ED8',
        };
      case 'DELIVERED':
        return {
          label: 'Delivered',
          icon: Package,
          bg: '#ECFDF5',
          color: '#047857',
        };
      case 'SETTLED':
        return {
          label: 'Settled & Paid',
          icon: CheckCircle2,
          bg: '#F0FDF4',
          color: Colors.cultivated,
        };
      case 'DISPUTED':
        return {
          label: 'In Arbitration',
          icon: AlertTriangle,
          bg: '#FEF2F2',
          color: Colors.clay,
        };
      default:
        return {
          label: status,
          icon: ShieldCheck,
          bg: '#F3F4F6',
          color: Colors.text.secondary,
        };
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === 'ALL') return true;
    return o.status === filter;
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) + 6 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={22} color={Colors.espresso} strokeWidth={2.2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Escrow Orders & Settlements</Text>
          <Text style={styles.headerSub}>Engine 3 State Machine Tracking</Text>
        </View>
        <View style={styles.headerRightBadge}>
          <ShieldCheck size={14} color={Colors.cultivated} strokeWidth={2.4} />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(
          [
            { key: 'ALL', label: 'All Orders' },
            { key: 'ESCROW_LOCKED', label: 'Locked' },
            { key: 'IN_TRANSIT', label: 'In Transit' },
            { key: 'SETTLED', label: 'Settled' },
          ] as const
        ).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterPill, filter === tab.key && styles.filterPillActive]}
            onPress={() => setFilter(tab.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillText, filter === tab.key && styles.filterPillTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.cultivated} />
          <Text style={styles.loadingText}>Loading Escrow Deliveries...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 20) + 30 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.cultivated} />}
          renderItem={({ item }) => {
            const badge = getStatusBadge(item.status);
            const BadgeIcon = badge.icon;
            const firstItem = item.items?.[0];
            const produceTitle = firstItem?.yield?.title || 'Harvest Produce Lot';
            const produceImg =
              firstItem?.yield?.mediaUrls?.[0] ||
              'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800';

            return (
              <TouchableOpacity
                style={styles.orderCard}
                onPress={() => router.push(`/orders/${item.id}` as any)}
                activeOpacity={0.85}
              >
                {/* Order Top Bar */}
                <View style={styles.orderTopBar}>
                  <View style={styles.orderIdBox}>
                    <Text style={styles.orderIdText}>#{item.id}</Text>
                    <Text style={styles.orderDateText}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <BadgeIcon size={12} color={badge.color} strokeWidth={2.4} />
                    <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </View>

                {/* Produce Item Preview */}
                <View style={styles.produceRow}>
                  <Image source={{ uri: produceImg }} style={styles.produceThumb} />
                  <View style={styles.produceInfo}>
                    <Text style={styles.produceName} numberOfLines={1}>
                      {produceTitle}
                    </Text>
                    <Text style={styles.produceSub}>
                      {firstItem ? `${firstItem.quantity} ${firstItem.yield?.unit || 'Units'}` : 'Harvest order'}{' '}
                      • {firstItem?.farmer?.name || 'Local Farm'}
                    </Text>
                    <Text style={styles.deliveryDest} numberOfLines={1}>
                      📍 {item.deliveryAddress}
                    </Text>
                  </View>
                </View>

                {/* Card Bottom: Total & CTA */}
                <View style={styles.cardBottomRow}>
                  <View>
                    <Text style={styles.totalLabel}>Escrow Amount</Text>
                    <Text style={styles.totalAmount}>
                      {item.totalAmount?.toLocaleString()} {item.currency || currentRegion.currency}
                    </Text>
                  </View>

                  <View style={styles.trackCtaBtn}>
                    <Text style={styles.trackCtaText}>Track FSM State</Text>
                    <ChevronRight size={14} color={Colors.white} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: 16,
    color: Colors.espresso,
  },
  headerSub: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  headerRightBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: Colors.parchment,
  },
  filterPillActive: {
    backgroundColor: Colors.canopy,
  },
  filterPillText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.espresso,
  },
  filterPillTextActive: {
    fontFamily: Fonts.bodyBold,
    color: Colors.gold,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Shadows.subtle,
  },
  orderTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  orderIdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderIdText: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    color: Colors.espresso,
  },
  orderDateText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  statusBadgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
  },
  produceRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  produceThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: Colors.parchment,
  },
  produceInfo: {
    flex: 1,
  },
  produceName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13.5,
    color: Colors.espresso,
  },
  produceSub: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  deliveryDest: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  totalLabel: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.text.secondary,
  },
  totalAmount: {
    fontFamily: Fonts.monoBold,
    fontSize: 15,
    color: Colors.espresso,
  },
  trackCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.canopy,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.pill,
  },
  trackCtaText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.gold,
  },
});
