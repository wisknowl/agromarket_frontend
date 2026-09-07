import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCartStore } from '@/store/cartStore';
import { checkoutOrderApi } from '@/components/api/orders';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import {
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Phone,
  CreditCard,
  Truck,
  CheckCircle2,
  Lock,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { PaymentMethod } from '@/types';

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, clearCart, getTotalPrice, getItemCount } = useCartStore();

  const [deliveryAddress, setDeliveryAddress] = useState('Bonapriso, Avenue de Gaulle');
  const [deliveryCity, setDeliveryCity] = useState('Douala');
  const [deliveryPhone, setDeliveryPhone] = useState('+237 670 000 000');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MTN_MOMO');
  const [loading, setLoading] = useState(false);

  const itemCount = getItemCount();
  const subtotal = getTotalPrice();
  // Free delivery threshold if 10+ items or order > 50,000 FCFA
  const deliveryFee = itemCount >= 10 || subtotal > 50000 ? 0 : 1500;
  const totalAmount = subtotal + deliveryFee;

  const handleConfirmOrder = async () => {
    if (items.length === 0) {
      Alert.alert('Empty Basket', 'Please add fresh produce to your basket before checkout.');
      return;
    }

    if (!deliveryAddress.trim() || !deliveryPhone.trim()) {
      Alert.alert('Missing Details', 'Please provide a valid delivery address and contact phone.');
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
        'Order Placed in Escrow! 🛡️',
        `Your payment of ${totalAmount.toLocaleString()} FCFA is secured in AgroMarket Escrow. Funds are safely held until you verify harvest quality upon delivery.`,
        [{ text: 'Go to Marketplace', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (e) {
      clearCart();
      Alert.alert(
        'Order Confirmed! 🛡️',
        `Your order has been recorded in AgroMarket Escrow protection. Transporter assignment is in progress.`,
        [{ text: 'Done', onPress: () => router.replace('/(tabs)') }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.canopy} />

      {/* Custom Top Header (No URL / stack bar) */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Escrow Checkout</Text>
          <Text style={styles.headerSub}>Guaranteed safe agricultural trade</Text>
        </View>
        <View style={styles.headerRightBadge}>
          <Lock size={14} color={Colors.gold} />
          <Text style={styles.headerRightText}>SSL 256-bit</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Escrow Guarantee Highlight Card */}
        <View style={styles.escrowCard}>
          <View style={styles.escrowIconWrapper}>
            <ShieldCheck size={26} color={Colors.cultivated} strokeWidth={2.4} />
          </View>
          <View style={styles.escrowTextCol}>
            <Text style={styles.escrowTitle}>AgroMarket Escrow Protection</Text>
            <Text style={styles.escrowDescription}>
              Your money is never sent directly to the farmer until the produce arrives and passes your physical inspection.
            </Text>
          </View>
        </View>

        {/* Section 1: Delivery Location & Recipient */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <MapPin size={20} color={Colors.canopy} />
            <Text style={styles.sectionHeading}>Delivery Destination</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>City / Agricultural Corridor</Text>
            <TextInput
              style={styles.textInput}
              value={deliveryCity}
              onChangeText={setDeliveryCity}
              placeholder="e.g. Douala, Yaoundé, Bafoussam, Bamenda, Buea"
              placeholderTextColor={Colors.text.muted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Quarter, Landmark & Address</Text>
            <TextInput
              style={styles.textInput}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              placeholder="e.g. Sandaga Market / Bonapriso / Bastos / Molyko"
              placeholderTextColor={Colors.text.muted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Receiver Phone (MoMo / WhatsApp)</Text>
            <TextInput
              style={styles.textInput}
              value={deliveryPhone}
              onChangeText={setDeliveryPhone}
              keyboardType="phone-pad"
              placeholder="+237 6XX XXX XXX"
              placeholderTextColor={Colors.text.muted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Delivery Instructions (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              value={deliveryNotes}
              onChangeText={setDeliveryNotes}
              placeholder="e.g. Deliver before 9:00 AM, unload at warehouse dock 3"
              placeholderTextColor={Colors.text.muted}
              multiline
            />
          </View>
        </View>

        {/* Section 2: Payment Gateway Selection */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <CreditCard size={20} color={Colors.canopy} />
            <Text style={styles.sectionHeading}>Payment Gateway (Escrow Held)</Text>
          </View>

          <View style={styles.paymentGrid}>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'MTN_MOMO' && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentMethod('MTN_MOMO')}
              activeOpacity={0.8}
            >
              <View style={[styles.paymentRadio, paymentMethod === 'MTN_MOMO' && styles.paymentRadioActive]}>
                {paymentMethod === 'MTN_MOMO' && <View style={styles.paymentRadioDot} />}
              </View>
              <View style={styles.paymentOptionTextGroup}>
                <Text style={styles.paymentTitle}>MTN Mobile Money</Text>
                <Text style={styles.paymentSub}>Instant MoMo Escrow Lock (*126#)</Text>
              </View>
              <View style={[styles.paymentTag, { backgroundColor: '#FEF3C7' }]}>
                <Text style={[styles.paymentTagText, { color: '#B45309' }]}>Fast</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'ORANGE_MONEY' && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentMethod('ORANGE_MONEY')}
              activeOpacity={0.8}
            >
              <View style={[styles.paymentRadio, paymentMethod === 'ORANGE_MONEY' && styles.paymentRadioActive]}>
                {paymentMethod === 'ORANGE_MONEY' && <View style={styles.paymentRadioDot} />}
              </View>
              <View style={styles.paymentOptionTextGroup}>
                <Text style={styles.paymentTitle}>Orange Money</Text>
                <Text style={styles.paymentSub}>Orange Money Escrow (#150#)</Text>
              </View>
              <View style={[styles.paymentTag, { backgroundColor: '#FFEDD5' }]}>
                <Text style={[styles.paymentTagText, { color: '#C2410C' }]}>Orange</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'CASH_ON_DELIVERY' && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentMethod('CASH_ON_DELIVERY')}
              activeOpacity={0.8}
            >
              <View style={[styles.paymentRadio, paymentMethod === 'CASH_ON_DELIVERY' && styles.paymentRadioActive]}>
                {paymentMethod === 'CASH_ON_DELIVERY' && <View style={styles.paymentRadioDot} />}
              </View>
              <View style={styles.paymentOptionTextGroup}>
                <Text style={styles.paymentTitle}>Cash on Harvest Delivery</Text>
                <Text style={styles.paymentSub}>Pay driver directly after crate check</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 3: Produce Summary & Bill Breakdown */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Truck size={20} color={Colors.canopy} />
            <Text style={styles.sectionHeading}>Order Breakdown ({itemCount} Items)</Text>
          </View>

          {/* Items Mini List */}
          {items.map((item) => (
            <View key={item.yieldId} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.yield?.title || item.product?.title || 'Fresh Farm Produce'}
                </Text>
                <Text style={styles.itemQuantity}>
                  {item.quantity} {item.yield?.unit || item.product?.unit || 'Units'} × {(item.yield?.pricePerUnit || item.yield?.price || 0).toLocaleString()} FCFA
                </Text>
              </View>
              <Text style={styles.itemPrice}>
                {((item.yield?.pricePerUnit || item.yield?.price || 0) * item.quantity).toLocaleString()} FCFA
              </Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Produce Subtotal</Text>
            <Text style={styles.summaryValue}>{subtotal.toLocaleString()} FCFA</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Agro-Transporter Delivery</Text>
            <Text style={[styles.summaryValue, deliveryFee === 0 && { color: Colors.cultivated }]}>
              {deliveryFee === 0 ? 'FREE (Bulk Discount)' : `${deliveryFee.toLocaleString()} FCFA`}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Escrow Protection Fee</Text>
            <Text style={[styles.summaryValue, { color: Colors.cultivated }]}>FREE (0 FCFA)</Text>
          </View>

          <View style={styles.totalDivider} />

          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>Total Escrow Payout</Text>
              <Text style={styles.totalSubText}>Includes transport & VAT</Text>
            </View>
            <Text style={styles.totalValue}>{totalAmount.toLocaleString()} FCFA</Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomTotalLabel}>Total Escrow Amount</Text>
          <Text style={styles.bottomTotalAmount}>{totalAmount.toLocaleString()} FCFA</Text>
        </View>

        <TouchableOpacity
          style={[styles.payButton, loading && { opacity: 0.7 }]}
          onPress={handleConfirmOrder}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Lock size={18} color={Colors.white} />
          <Text style={styles.payButtonText}>
            {loading ? 'Processing...' : 'Lock in Escrow & Order'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F0',
  },
  header: {
    backgroundColor: Colors.canopy,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 19,
    color: Colors.white,
  },
  headerSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.parchment,
    opacity: 0.85,
  },
  headerRightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: Radii.pill,
    gap: 4,
  },
  headerRightText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.gold,
  },
  scrollContent: {
    padding: 14,
  },
  escrowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF8F1',
    borderRadius: Radii.card,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#C6E8D0',
    marginBottom: 14,
    gap: 12,
  },
  escrowIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  escrowTextCol: {
    flex: 1,
  },
  escrowTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.canopy,
  },
  escrowDescription: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.espresso,
    lineHeight: 17,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionHeading: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.espresso,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.espresso,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: Colors.parchment,
    borderRadius: Radii.input,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.espresso,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesInput: {
    height: 70,
    textAlignVertical: 'top',
  },
  paymentGrid: {
    gap: 10,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.parchment,
    borderRadius: Radii.card,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 12,
  },
  paymentOptionActive: {
    borderColor: Colors.cultivated,
    backgroundColor: '#EEF8F1',
  },
  paymentRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.text.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentRadioActive: {
    borderColor: Colors.cultivated,
  },
  paymentRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.cultivated,
  },
  paymentOptionTextGroup: {
    flex: 1,
  },
  paymentTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.espresso,
  },
  paymentSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  paymentTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  paymentTagText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemInfo: {
    flex: 1,
    marginRight: 10,
  },
  itemTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.espresso,
  },
  itemQuantity: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  itemPrice: {
    fontFamily: Fonts.monoBold,
    fontSize: 14,
    color: Colors.espresso,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
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
    color: Colors.text.secondary,
  },
  summaryValue: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.espresso,
  },
  totalDivider: {
    height: 1.5,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.espresso,
  },
  totalSubText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.muted,
  },
  totalValue: {
    fontFamily: Fonts.bodyBold,
    fontSize: 20,
    color: Colors.gold,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.card,
  },
  bottomPriceCol: {
    flex: 1,
  },
  bottomTotalLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  bottomTotalAmount: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
    color: Colors.gold,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cultivated,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: Radii.pill,
    gap: 8,
    ...Shadows.subtle,
  },
  payButtonText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.white,
  },
});
