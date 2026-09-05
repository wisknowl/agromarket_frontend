import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  Store,
} from 'lucide-react-native';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import BrandButton from '@/components/ui/BrandButton';
import { agroYields } from '@/mocks/data';
import { useRouter } from 'expo-router';

export default function WholesalerHubScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'bulkDeals' | 'demands' | 'partners'>('bulkDeals');

  const bulkYields = agroYields.filter((item) => item.isWholesaleBulkAvailable);

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View style={styles.iconCircle}>
            <Store size={26} color={Colors.gold} strokeWidth={2.2} />
          </View>
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>Buyam-Sellam Trading Hub</Text>
            <Text style={styles.heroSub}>
              Aggregated bulk purchasing directly from farm cooperatives
            </Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricBadge}>
            <Text style={styles.metricVal}>42 Tons</Text>
            <Text style={styles.metricLbl}>Active Volume</Text>
          </View>
          <View style={styles.metricBadge}>
            <Text style={styles.metricVal}>-25%</Text>
            <Text style={styles.metricLbl}>Bulk Margin</Text>
          </View>
          <View style={styles.metricBadge}>
            <Text style={styles.metricVal}>Escrow</Text>
            <Text style={styles.metricLbl}>Secured PO</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'bulkDeals' && styles.tabBtnActive]}
          onPress={() => setActiveTab('bulkDeals')}
        >
          <Text style={[styles.tabText, activeTab === 'bulkDeals' && styles.tabTextActive]}>
            Bulk Harvests
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'demands' && styles.tabBtnActive]}
          onPress={() => setActiveTab('demands')}
        >
          <Text style={[styles.tabText, activeTab === 'demands' && styles.tabTextActive]}>
            Supply Demands
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'partners' && styles.tabBtnActive]}
          onPress={() => setActiveTab('partners')}
        >
          <Text style={[styles.tabText, activeTab === 'partners' && styles.tabTextActive]}>
            Verified Co-ops
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {activeTab === 'bulkDeals' && (
          <View style={styles.dealsList}>
            {bulkYields.map((yieldItem) => {
              const itemImg = yieldItem.image || (yieldItem.mediaUrls && yieldItem.mediaUrls[0]) || '';
              return (
                <View key={yieldItem.id} style={styles.dealCard}>
                  {itemImg ? (
                    <Image source={{ uri: itemImg }} style={styles.dealImage} />
                  ) : null}
                  <View style={styles.dealInfo}>
                    <View style={styles.badgeRow}>
                      <Text style={styles.wholesaleBadge}>BULK WHOLESALE</Text>
                      <Text style={styles.originText}>📍 {yieldItem.originRegion || 'Cameroon'}</Text>
                    </View>
                    <Text style={styles.dealTitle}>{yieldItem.title}</Text>
                    <Text style={styles.bulkPricing}>
                      {yieldItem.bulkPricePerUnit ? yieldItem.bulkPricePerUnit.toLocaleString() : (yieldItem.price * 0.8).toLocaleString()} FCFA
                      <Text style={styles.unitText}> / {yieldItem.unit}</Text>
                    </Text>
                    <Text style={styles.minQtyText}>
                      Min Order: {yieldItem.bulkMinQuantity || 10} {yieldItem.unit}s
                    </Text>
                    <View style={styles.dealActions}>
                      <BrandButton
                        title="Bargain / Order Bulk"
                        variant="primary"
                        size="sm"
                        onPress={() => router.push(`/yield/${yieldItem.id}`)}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'demands' && (
          <View style={styles.demandSection}>
            <View style={styles.demandCard}>
              <Text style={styles.demandTitle}>Douala Sandaga Market Consortium</Text>
              <Text style={styles.demandDesc}>
                Seeking 5 Tons of Fresh Irish Potatoes (Santa/Bambili origin) for bi-weekly delivery.
              </Text>
              <View style={styles.demandMeta}>
                <Text style={styles.demandBudget}>Budget: 3,500,000 FCFA</Text>
                <BrandButton title="Submit Bid" variant="secondary" size="sm" />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  heroCard: {
    backgroundColor: Colors.canopyDeep,
    padding: 18,
    margin: 16,
    borderRadius: Radii.card,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontFamily: Fonts.displayItalic,
    fontSize: 18,
    color: Colors.parchment,
  },
  heroSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: 'rgba(246, 238, 221, 0.75)',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 10,
    borderRadius: Radii.sm,
  },
  metricBadge: {
    alignItems: 'center',
  },
  metricVal: {
    fontFamily: Fonts.monoBold,
    fontSize: 14,
    color: Colors.gold,
  },
  metricLbl: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.parchmentDim,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
  },
  tabBtn: {
    paddingVertical: 12,
    marginRight: 20,
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.cultivated,
  },
  tabText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.text.secondary,
  },
  tabTextActive: {
    color: Colors.cultivated,
    fontFamily: Fonts.bodySemiBold,
  },
  scrollArea: {
    flex: 1,
    padding: 16,
  },
  dealsList: {
    gap: 14,
  },
  dealCard: {
    flexDirection: 'row',
    backgroundColor: Colors.parchment,
    borderRadius: Radii.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  dealImage: {
    width: 110,
    height: 120,
  },
  dealInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wholesaleBadge: {
    fontFamily: Fonts.monoBold,
    fontSize: 9,
    color: Colors.soil,
    backgroundColor: 'rgba(122, 74, 45, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  originText: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.text.secondary,
  },
  dealTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.espresso,
  },
  bulkPricing: {
    fontFamily: Fonts.monoBold,
    fontSize: 14,
    color: Colors.canopy,
  },
  unitText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  minQtyText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.clay,
  },
  dealActions: {
    marginTop: 4,
  },
  demandSection: {
    gap: 12,
  },
  demandCard: {
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    ...Shadows.subtle,
  },
  demandTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.espresso,
    marginBottom: 4,
  },
  demandDesc: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  demandMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  demandBudget: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    color: Colors.cultivated,
  },
});
