import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import CartItem from '@/components/CartItem';
import { useCartStore } from '@/store/cartStore';
import { useTranslation } from '@/constants/translations';
import Colors from '@/constants/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
        <ShoppingBag size={64} color={Colors.text.secondary} />
        <Text style={styles.emptyText}>{t.basket.emptyBasketTitle}</Text>
        <Text style={styles.emptySubtext}>{t.basket.emptyBasketSubtitle}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Free Delivery Gamified Progress Bar */}
      <View style={styles.freeDeliveryBanner}>
        <MaterialCommunityIcons
          name={isFreeDelivery ? 'truck-check' : 'truck-fast'}
          size={20}
          color={isFreeDelivery ? '#10B981' : '#F59E0B'}
        />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.deliveryProgressTitle}>
            {isFreeDelivery
              ? t.basket.freeDeliveryUnlocked
              : `Add ${10 - itemCount} more ${t.basket.freeDeliveryThreshold}`}
          </Text>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min((itemCount / 10) * 100, 100)}%` },
                isFreeDelivery && { backgroundColor: '#10B981' },
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
                <Text style={styles.summaryValue}>{subtotal} FCFA</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t.basket.deliveryFee}</Text>
                <Text style={[styles.summaryValue, isFreeDelivery && { color: '#10B981' }]}>
                  {isFreeDelivery ? 'FREE' : `${deliveryFee} FCFA`}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>{t.basket.totalAmount}</Text>
                <Text style={styles.totalValue}>{totalAmount} FCFA</Text>
              </View>
            </View>

            <View style={styles.actionsContainer}>
              <Pressable style={styles.clearButton} onPress={clearCart}>
                <Text style={styles.clearButtonText}>Clear Basket</Text>
              </Pressable>
              <Pressable
                style={styles.checkoutButton}
                onPress={() => router.push('/cart/checkout')}
              >
                <Text style={styles.checkoutButtonText}>{t.basket.goToCheckout}</Text>
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
    backgroundColor: Colors.background,
  },
  freeDeliveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  deliveryProgressTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 20,
  },
  footer: {
    marginTop: 16,
  },
  summaryContainer: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  checkoutButton: {
    flex: 2,
    backgroundColor: '#0D5C3A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginLeft: 8,
    elevation: 2,
  },
  checkoutButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});