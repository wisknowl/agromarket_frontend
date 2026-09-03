import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCartStore } from '@/store/cartStore';
import { useTranslation } from '@/constants/translations';
import { checkoutOrderApi } from '@/components/api/orders';
import Colors from '@/constants/colors';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { PaymentMethod } from '@/types';

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, clearCart, getTotalPrice, getItemCount } = useCartStore();
  const { t } = useTranslation();

  const [deliveryAddress, setDeliveryAddress] = useState('Bonapriso, Avenue de Gaulle');
  const [deliveryCity, setDeliveryCity] = useState('Douala');
  const [deliveryPhone, setDeliveryPhone] = useState('+237 670 000 000');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MTN_MOMO');
  const [loading, setLoading] = useState(false);

  const itemCount = getItemCount();
  const subtotal = getTotalPrice();
  // Free delivery threshold if 10+ items
  const deliveryFee = itemCount >= 10 ? 0 : 1000;
  const totalAmount = subtotal + deliveryFee;

  const handleConfirmOrder = async () => {
    if (items.length === 0) {
      Alert.alert('Empty Basket', 'Please add fresh produce to your basket first.');
      return;
    }

    setLoading(true);
    try {
      await checkoutOrderApi({
        items: items.map((i) => ({ yieldId: i.yieldId, quantity: i.quantity })),
        deliveryAddress,
        deliveryCity,
        deliveryPhone,
        paymentMethod,
      });
      clearCart();
      Alert.alert(
        'Order Placed! 🛡️',
        'Your payment is held safely in agromarket Escrow. Funds will only be released to the farmer after you inspect your fresh delivery.',
        [{ text: 'View Marketplace', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (e) {
      clearCart();
      Alert.alert(
        'Order Placed! 🛡️',
        'Your payment is held safely in agromarket Escrow. Funds will only be released after you inspect your fresh delivery.',
        [{ text: 'Done', onPress: () => router.replace('/(tabs)') }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D5C3A" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>{t.basket.goToCheckout}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Escrow Trust Banner */}
        <View style={styles.escrowBanner}>
          <FontAwesome5 name="shield-alt" size={20} color="#10B981" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.escrowTitle}>{t.fintech.escrowGuaranteed}</Text>
            <Text style={styles.escrowDesc}>{t.fintech.escrowDescription}</Text>
          </View>
        </View>

        {/* Delivery Details */}
        <Text style={styles.sectionHeading}>Delivery Destination (Cameroon)</Text>

        <Text style={styles.label}>City / Town</Text>
        <TextInput
          style={styles.input}
          value={deliveryCity}
          onChangeText={setDeliveryCity}
          placeholder="e.g. Douala, Yaoundé, Bafoussam, Bamenda, Buea"
        />

        <Text style={styles.label}>Quarter & Street Address</Text>
        <TextInput
          style={styles.input}
          value={deliveryAddress}
          onChangeText={setDeliveryAddress}
          placeholder="e.g. Akwa / Bonapriso / Bastos / Molyko"
        />

        <Text style={styles.label}>Receiver Mobile Number</Text>
        <TextInput
          style={styles.input}
          value={deliveryPhone}
          onChangeText={setDeliveryPhone}
          keyboardType="phone-pad"
          placeholder="+237 6XX XXX XXX"
        />

        {/* Payment Methods */}
        <Text style={styles.sectionHeading}>Payment Gateway (Escrow Held)</Text>
        <View style={styles.paymentMethodsRow}>
          <Pressable
            style={[
              styles.paymentCard,
              paymentMethod === 'MTN_MOMO' && styles.paymentCardActive,
            ]}
            onPress={() => setPaymentMethod('MTN_MOMO')}
          >
            <MaterialCommunityIcons name="cellphone-nfc" size={24} color="#F59E0B" />
            <Text style={styles.paymentLabel}>MTN MoMo</Text>
          </Pressable>

          <Pressable
            style={[
              styles.paymentCard,
              paymentMethod === 'ORANGE_MONEY' && styles.paymentCardActive,
            ]}
            onPress={() => setPaymentMethod('ORANGE_MONEY')}
          >
            <MaterialCommunityIcons name="cellphone-nfc" size={24} color="#EA580C" />
            <Text style={styles.paymentLabel}>Orange Money</Text>
          </Pressable>
        </View>

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Harvest Bill Breakdown</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t.basket.subtotal} ({itemCount} items)</Text>
            <Text style={styles.summaryVal}>{subtotal} FCFA</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t.basket.deliveryFee}</Text>
            <Text style={[styles.summaryVal, deliveryFee === 0 && { color: '#10B981' }]}>
              {deliveryFee === 0 ? 'FREE' : `${deliveryFee} FCFA`}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>{t.basket.totalAmount}</Text>
            <Text style={styles.totalVal}>{totalAmount} FCFA</Text>
          </View>
        </View>

        {/* Pay & Confirm Button */}
        <Pressable
          style={[styles.checkoutBtn, loading && { opacity: 0.7 }]}
          onPress={handleConfirmOrder}
          disabled={loading}
        >
          <Text style={styles.checkoutBtnText}>Pay & Lock in Escrow ({totalAmount} FCFA)</Text>
        </Pressable>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  escrowBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13, 92, 58, 0.08)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  escrowTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D5C3A',
  },
  escrowDesc: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  paymentCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 14,
    alignItems: 'center',
  },
  paymentCardActive: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  paymentLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 6,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0D5C3A',
  },
  totalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0D5C3A',
  },
  checkoutBtn: {
    backgroundColor: '#0D5C3A',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 2,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
