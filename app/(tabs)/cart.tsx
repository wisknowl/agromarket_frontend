import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { ShoppingBag, Truck, ShieldCheck, ArrowRight, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import CartItem from '@/components/CartItem';
import { useCartStore } from '@/store/cartStore';
import { useTranslation } from '@/constants/translations';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { useLocale } from '@/context/LocaleContext';

export default function CartScreen() {
  const router = useRouter();
  const { items, getTotalPrice, getItemCount, clearCart } = useCartStore();
  const { t } = useTranslation();
  const { formatCurrency, currentRegion } = useLocale();

  const itemCount = getItemCount();
  const subtotal = getTotalPrice();
  // Gamified Eco-Delivery Perk: Free delivery when >= 3 items (matching web)
  const isFreeDelivery = itemCount >= 3;
  const deliveryFee = items.length === 0 ? 0 : isFreeDelivery ? 0 : 1500;
  const totalAmount = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <ShoppingBag size={42} color="#E2A63C" strokeWidth={1.8} />
          </View>
          <Text style={styles.emptyText}>Your Harvest Basket is Empty</Text>
          <Text style={styles.emptySubtext}>
            Fill your regional basket with fresh farm-direct harvests from AgroMarket or shoppable stories on AgroFeed.
          </Text>
          <Pressable
            style={styles.exploreButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.exploreButtonText}>Explore Fresh Harvests</Text>
            <ArrowRight size={16} color="#241A12" strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Regional Woven Basket Header */}
      <View style={styles.regionalHeader}>
        <View style={styles.regionalTopRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.regionalTitleRow}>
              <Text style={styles.regionalTitle}>
                {currentRegion?.code === 'CM' ? 'Cameroon Bamboo Basket' : `${currentRegion?.name || 'Regional'} Harvest Basket`}
              </Text>
              <View style={styles.regionBadge}>
                <Text style={styles.regionBadgeText}>
                  {currentRegion?.flag || '🇨🇲'} {currentRegion?.code || 'CEMAC'}
                </Text>
              </View>
            </View>
            <Text style={styles.regionalSubtitle}>
              Verified Eco-Logistics Corridor • Rapid Local Transport
            </Text>
          </View>
        </View>

        {/* Free Delivery Gamified Progress Banner */}
        <View style={styles.freeDeliveryBanner}>
          <Truck
            size={18}
            color="#C68F30"
            strokeWidth={2.2}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            {isFreeDelivery ? (
              <Text style={styles.deliveryProgressTitleActive}>
                🎉 Free Pooled Eco-Delivery Unlocked!
              </Text>
            ) : (
              <Text style={styles.deliveryProgressTitle}>
                Add <Text style={{ fontFamily: Fonts.bodyBold, color: '#B87D1E' }}>{Math.max(1, 3 - itemCount)} more unit(s)</Text> to unlock Free Eco-Delivery!
              </Text>
            )}
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min((itemCount / 3) * 100, 100)}%` },
                  isFreeDelivery && { backgroundColor: '#E2A63C' },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      <FlatList
        data={items}
        renderItem={({ item }) => <CartItem item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={() => (
          <View style={styles.footer}>
            {/* Smart Escrow Summary Card */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>Smart Escrow Checkout</Text>
                <View style={styles.escrowBadge}>
                  <ShieldCheck size={13} color="#C68F30" />
                  <Text style={styles.escrowBadgeText}>Smart Escrow Protected</Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Harvest Subtotal ({itemCount} units)
                </Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(subtotal)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Cold-Chain / Pooled Logistics</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    isFreeDelivery && { color: '#B87D1E', fontFamily: Fonts.bodyBold },
                  ]}
                >
                  {isFreeDelivery ? 'FREE (Eco-Pool)' : formatCurrency(deliveryFee)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total Escrow Lock</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(totalAmount)}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <Pressable style={styles.clearButton} onPress={clearCart}>
                <Trash2 size={16} color="#B54A34" />
                <Text style={styles.clearButtonText}>Clear</Text>
              </Pressable>

              <Pressable
                style={styles.checkoutButton}
                onPress={() => router.push('/cart/checkout')}
              >
                <ShieldCheck size={18} color="#241A12" />
                <Text style={styles.checkoutButtonText}>
                  Lock {formatCurrency(totalAmount)} in Smart Escrow
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF7',
  },
  regionalHeader: {
    backgroundColor: '#FFF9EE',
    borderBottomWidth: 1,
    borderBottomColor: '#F2DCAA',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 10,
  },
  regionalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  regionalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 2,
  },
  regionalTitle: {
    fontFamily: Fonts.displayItalic,
    fontSize: 18,
    fontWeight: '700',
    color: '#241A12',
  },
  regionBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F2DCAA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  regionBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: '#B87D1E',
  },
  regionalSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: '#5C5245',
  },
  freeDeliveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F2DCAA',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  deliveryProgressTitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: '#241A12',
    marginBottom: 4,
  },
  deliveryProgressTitleActive: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: '#B87D1E',
    marginBottom: 4,
  },
  progressBarBg: {
    height: 5,
    backgroundColor: '#FFF2D8',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E2A63C',
    borderRadius: 3,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#FAFAF7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCard: {
    backgroundColor: '#FFF9EE',
    borderWidth: 1,
    borderColor: '#F2DCAA',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    shadowColor: '#241A12',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF2D8',
    borderWidth: 1,
    borderColor: '#F2DCAA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontFamily: Fonts.displayItalic,
    fontSize: 20,
    fontWeight: '700',
    color: '#241A12',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: '#5C5245',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E2A63C',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
  },
  exploreButtonText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: '#241A12',
  },
  footer: {
    marginTop: 8,
    marginBottom: 30,
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F2DCAA',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#241A12',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2DCAA',
    marginBottom: 12,
  },
  summaryTitle: {
    fontFamily: Fonts.displayItalic,
    fontSize: 16,
    fontWeight: '700',
    color: '#241A12',
  },
  escrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF9EE',
    borderWidth: 1,
    borderColor: '#F2DCAA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  escrowBadgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: '#B87D1E',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: '#5C5245',
  },
  summaryValue: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    color: '#241A12',
  },
  divider: {
    height: 1,
    backgroundColor: '#F2DCAA',
    marginVertical: 10,
  },
  totalLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: '#241A12',
  },
  totalValue: {
    fontFamily: Fonts.monoBold,
    fontSize: 17,
    color: '#B87D1E',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F2DCAA',
  },
  clearButtonText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: '#B54A34',
  },
  checkoutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#E2A63C',
    borderWidth: 1,
    borderColor: '#C68F30',
    shadowColor: '#C68F30',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  checkoutButtonText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: '#241A12',
  },
});
