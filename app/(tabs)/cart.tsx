import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { ShoppingBag, Truck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import CartItem from '@/components/CartItem';
import { useCartStore } from '@/store/cartStore';
import { useTranslation } from '@/constants/translations';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import BrandButton from '@/components/ui/BrandButton';

export default function CartScreen() {
  const router = useRouter();
  const { items, getTotalPrice, getItemCount, clearCart } = useCartStore();
  const { t } = useTranslation();

  const itemCount = getItemCount();
  const subtotal = getTotalPrice();
  const isFreeDelivery = itemCount >= 10;
  const deliveryFee = isFreeDelivery ? 0 : 1000;
  const totalAmount = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <ShoppingBag size={48} color={Colors.soil} strokeWidth={1.8} />
        </View>
        <Text style={styles.emptyText}>{t.basket.emptyBasketTitle}</Text>
        <Text style={styles.emptySubtext}>{t.basket.emptyBasketSubtitle}</Text>
        <BrandButton
          title="Browse Harvests"
          variant="primary"
          size="md"
          onPress={() => router.replace('/(tabs)')}
          style={{ marginTop: 20 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Free Delivery Gamified Progress Bar */}
      <View style={styles.freeDeliveryBanner}>
        <Truck
          size={20}
          color={isFreeDelivery ? Colors.cultivated : Colors.gold}
          strokeWidth={2.2}
        />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.deliveryProgressTitle}>
            {isFreeDelivery
              ? t.basket.freeDeliveryUnlocked
              : `Add ${10 - itemCount} more for free cooperative delivery`}
          </Text>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min((itemCount / 10) * 100, 100)}%` },
                isFreeDelivery && { backgroundColor: Colors.cultivated },
              ]}
            />
          </View>
        </View>
      </View>

      <FlatList
        data={items}
        renderItem={({ item }) => <CartItem item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={() => (
          <View style={styles.footer}>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {t.basket.subtotal} ({itemCount} items)
                </Text>
                <Text style={styles.summaryValue}>
                  {subtotal.toLocaleString()} FCFA
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t.basket.deliveryFee}</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    isFreeDelivery && { color: Colors.cultivated },
                  ]}
                >
                  {isFreeDelivery ? 'FREE' : `${deliveryFee.toLocaleString()} FCFA`}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>{t.basket.totalAmount}</Text>
                <Text style={styles.totalValue}>
                  {totalAmount.toLocaleString()} FCFA
                </Text>
              </View>
            </View>

            <View style={styles.actionsContainer}>
              <BrandButton
                title="Clear"
                variant="alert"
                size="md"
                onPress={clearCart}
                style={{ flex: 1 }}
              />
              <BrandButton
                title={t.basket.goToCheckout}
                variant="primary"
                size="md"
                onPress={() => router.push('/cart/checkout')}
                style={{ flex: 2 }}
              />
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
    backgroundColor: Colors.white,
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.parchment,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontFamily: Fonts.displayItalic,
    fontSize: 22,
    color: Colors.espresso,
    marginBottom: 6,
  },
  emptySubtext: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  freeDeliveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.parchment,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
  },
  deliveryProgressTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.espresso,
    marginBottom: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(36, 26, 18, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 3,
  },
  footer: {
    marginTop: 12,
    marginBottom: 40,
  },
  summaryContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    padding: 16,
    marginBottom: 16,
    ...Shadows.subtle,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  summaryValue: {
    fontFamily: Fonts.monoBold,
    fontSize: 14,
    color: Colors.espresso,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.parchmentDim,
    marginVertical: 10,
  },
  totalLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.espresso,
  },
  totalValue: {
    fontFamily: Fonts.monoBold,
    fontSize: 18,
    color: Colors.canopy,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
});