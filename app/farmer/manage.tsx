import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/constants/translations';
import { yields as mockYields } from '@/mocks/data';
import Colors from '@/constants/colors';
import { FontAwesome5, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

export default function FarmerManageScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const farmerYields = mockYields.filter(
    (y) => y.farmerId === user?.farmerProfile?.id || y.farmerId === 'f1'
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D5C3A" />

      {/* Header Bar */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>{t.farmer.manageFarms}</Text>
        <Pressable onPress={() => router.push('/farmer/new')} style={styles.addBtn}>
          <Ionicons name="add-circle" size={28} color="#10B981" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Farm Profile Banner */}
        <View style={styles.farmCard}>
          <Image
            source={{
              uri:
                user?.farmerProfile?.coverPhoto ||
                'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1000&auto=format&fit=crop&q=60',
            }}
            style={styles.coverImage}
          />
          <View style={styles.farmInfoOverlay}>
            <View style={styles.farmBadgeRow}>
              <View style={styles.creditBadge}>
                <FontAwesome5 name="medal" size={14} color="#F59E0B" />
                <Text style={styles.creditBadgeText}>
                  {user?.farmerProfile?.creditTier || 'GOLD'} TIER (780 PTS)
                </Text>
              </View>
              <View style={styles.coopBadge}>
                <Text style={styles.coopBadgeText}>CAPLAME Foumbot</Text>
              </View>
            </View>
            <Text style={styles.farmName}>
              {user?.farmerProfile?.farmName || 'Green Valley Organic Farms'}
            </Text>
            <Text style={styles.farmLocation}>
              📍 {user?.farmerProfile?.city || 'Foumbot'}, {user?.farmerProfile?.region || 'West Region'} (8.5 Ha)
            </Text>
          </View>
        </View>

        {/* Live Performance & Njangi Credit Score Bar */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>142</Text>
            <Text style={styles.statLabel}>Fulfilled Orders</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>4.9 ★</Text>
            <Text style={styles.statLabel}>Quality Rating</Text>
          </View>
          <Pressable
            style={[styles.statBox, { borderColor: '#F59E0B', borderWidth: 1 }]}
            onPress={() => router.push('/fintech/loans')}
          >
            <Text style={[styles.statVal, { color: '#F59E0B' }]}>780</Text>
            <Text style={styles.statLabel}>Njangi Score →</Text>
          </Pressable>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionRow}>
          <Pressable
            style={styles.actionButtonPrimary}
            onPress={() => router.push('/farmer/new')}
          >
            <Ionicons name="leaf" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnText}>{t.farmer.newYield}</Text>
          </Pressable>
          <Pressable
            style={styles.actionButtonSecondary}
            onPress={() => router.push('/fintech/loans')}
          >
            <FontAwesome5 name="hand-holding-usd" size={16} color="#0D5C3A" style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnTextSec}>Seasonal Loan</Text>
          </Pressable>
        </View>

        {/* Active Harvest Yields List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Harvest Listings ({farmerYields.length})</Text>
        </View>

        {farmerYields.map((item) => (
          <View key={item.id} style={styles.yieldCard}>
            <Image source={{ uri: item.image || item.mediaUrls?.[0] }} style={styles.yieldThumb} />
            <View style={styles.yieldDetails}>
              <Text style={styles.yieldTitle}>{item.title}</Text>
              <Text style={styles.yieldPrice}>
                {item.price || item.pricePerUnit} FCFA / {item.unit}
              </Text>
              <Text style={styles.yieldStock}>
                Stock: {item.stockQuantity || 450} {item.unit} available
              </Text>
              {item.isWholesaleBulkAvailable && (
                <View style={styles.bulkTag}>
                  <Text style={styles.bulkTagText}>Wholesale Bulk Available</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#0D5C3A',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  addBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  farmCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    marginBottom: 20,
    elevation: 4,
  },
  coverImage: {
    width: '100%',
    height: 140,
    opacity: 0.65,
  },
  farmInfoOverlay: {
    padding: 16,
  },
  farmBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  creditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#F59E0B',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  creditBadgeText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
  },
  coopBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  coopBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  farmName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  farmLocation: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D5C3A',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButtonPrimary: {
    flex: 1,
    backgroundColor: '#0D5C3A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionButtonSecondary: {
    flex: 1,
    backgroundColor: '#E6F4EA',
    borderWidth: 1,
    borderColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  actionBtnTextSec: {
    color: '#0D5C3A',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  yieldCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    alignItems: 'center',
  },
  yieldThumb: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  yieldDetails: {
    flex: 1,
    marginLeft: 14,
  },
  yieldTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  yieldPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0D5C3A',
    marginTop: 2,
  },
  yieldStock: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  bulkTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  bulkTagText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '700',
  },
});
