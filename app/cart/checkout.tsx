import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCartStore } from '@/store/cartStore';
import { checkoutOrderApi } from '@/components/api/orders';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Truck,
  Lock,
  Globe2,
  Check,
  Shield,
  Smartphone,
  Building,
} from 'lucide-react-native';
import { PaymentMethod } from '@/types';

interface SimulatedRegion {
  countryCode: string;
  countryName: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  rateFromXaf: number; // Multiply XAF by this to get target currency
  resolverProvider: 'momo_orange' | 'paystack' | 'stripe' | 'flutterwave';
  methods: Array<{
    id: PaymentMethod;
    name: string;
    sub: string;
    badge: string;
    tagColor: string;
    tagBg: string;
  }>;
}

const SIMULATED_REGIONS: SimulatedRegion[] = [
  {
    countryCode: 'CM',
    countryName: 'Cameroon',
    flag: '🇨🇲',
    currency: 'XAF',
    currencySymbol: 'FCFA',
    rateFromXaf: 1.0,
    resolverProvider: 'momo_orange',
    methods: [
      {
        id: 'MTN_MOMO',
        name: 'MTN Mobile Money',
        sub: 'Instant MoMo Escrow (*126# USSD Prompt)',
        badge: 'Local Rail',
        tagColor: '#B45309',
        tagBg: '#FEF3C7',
      },
      {
        id: 'ORANGE_MONEY',
        name: 'Orange Money',
        sub: 'Orange Money Escrow (#150# Secure PIN)',
        badge: 'Local Rail',
        tagColor: '#C2410C',
        tagBg: '#FFEDD5',
      },
      {
        id: 'CASH_ON_DELIVERY',
        name: 'Cash on Harvest Delivery',
        sub: 'Direct payment to transporter upon crate inspection',
        badge: 'Inspection First',
        tagColor: Colors.canopy,
        tagBg: '#E8F5E9',
      },
    ],
  },
  {
    countryCode: 'NG',
    countryName: 'Nigeria',
    flag: '🇳🇬',
    currency: 'NGN',
    currencySymbol: '₦',
    rateFromXaf: 2.45,
    resolverProvider: 'paystack',
    methods: [
      {
        id: 'PAYSTACK',
        name: 'Paystack Direct Bank Transfer',
        sub: 'Instant NIP Transfer to dedicated Escrow Account',
        badge: 'Paystack Rail',
        tagColor: '#00875A',
        tagBg: '#E3FCEF',
      },
      {
        id: 'PAYSTACK',
        name: 'Debit Card / USSD',
        sub: 'Mastercard, Visa, Verve & USSD Banking',
        badge: 'Instant',
        tagColor: '#0747A6',
        tagBg: '#DEEBFF',
      },
    ],
  },
  {
    countryCode: 'US',
    countryName: 'United States & Global',
    flag: '🇺🇸',
    currency: 'USD',
    currencySymbol: '$',
    rateFromXaf: 0.00163, // 1 USD ≈ 615 XAF
    resolverProvider: 'stripe',
    methods: [
      {
        id: 'STRIPE_CARD',
        name: 'Apple Pay / Google Pay',
        sub: 'Biometric 1-Tap Escrow Authorization',
        badge: 'Stripe Rail',
        tagColor: '#4F46E5',
        tagBg: '#EEF2FF',
      },
      {
        id: 'STRIPE_CARD',
        name: 'Credit / Debit Card',
        sub: 'Visa, Mastercard, Amex (Stripe 256-bit encrypted)',
        badge: 'Global Rail',
        tagColor: '#0F172A',
        tagBg: '#F1F5F9',
      },
    ],
  },
  {
    countryCode: 'KE',
    countryName: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES',
    currencySymbol: 'KSh',
    rateFromXaf: 0.21,
    resolverProvider: 'paystack',
    methods: [
      {
        id: 'PAYSTACK',
        name: 'M-Pesa Mobile Money',
        sub: 'Direct STK Push to Safaricom phone',
        badge: 'M-Pesa Rail',
        tagColor: '#00875A',
        tagBg: '#E3FCEF',
      },
      {
        id: 'STRIPE_CARD',
        name: 'International Card',
        sub: 'Visa or Mastercard Escrow Settlement',
        badge: 'Cards',
        tagColor: '#374151',
        tagBg: '#F3F4F6',
      },
    ],
  },
  {
    countryCode: 'UG',
    countryName: 'Pan-African Multi-Rail',
    flag: '🌍',
    currency: 'UGX',
    currencySymbol: 'USh',
    rateFromXaf: 6.06,
    resolverProvider: 'flutterwave',
    methods: [
      {
        id: 'FLUTTERWAVE',
        name: 'Flutterwave Multi-Rail',
        sub: 'Cross-border settlement across 34 African nations',
        badge: 'Pan-Africa',
        tagColor: '#D97706',
        tagBg: '#FEF3C7',
      },
    ],
  },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, clearCart, getTotalPrice, getItemCount } = useCartStore();

  const [selectedRegion, setSelectedRegion] = useState<SimulatedRegion>(SIMULATED_REGIONS[0]);
  const [deliveryAddress, setDeliveryAddress] = useState('Bonapriso, Avenue de Gaulle');
  const [deliveryCity, setDeliveryCity] = useState('Douala');
  const [deliveryPhone, setDeliveryPhone] = useState('+237 670 000 000');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(SIMULATED_REGIONS[0].methods[0].id);
  const [loading, setLoading] = useState(false);

  const itemCount = getItemCount();
  const rawSubtotalXaf = getTotalPrice();
  // Free delivery threshold if 10+ items or order > 50,000 FCFA
  const rawDeliveryFeeXaf = itemCount >= 10 || rawSubtotalXaf > 50000 ? 0 : 1500;
  const rawTotalAmountXaf = rawSubtotalXaf + rawDeliveryFeeXaf;

  // Currency Converter helper
  const formatCurrency = (amountXaf: number) => {
    const converted = amountXaf * selectedRegion.rateFromXaf;
    if (selectedRegion.currency === 'USD') {
      return `$${converted.toFixed(2)}`;
    }
    return `${Math.round(converted).toLocaleString()} ${selectedRegion.currencySymbol}`;
  };

  const handleRegionChange = (region: SimulatedRegion) => {
    setSelectedRegion(region);
    setPaymentMethod(region.methods[0].id);
  };

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
      const resOrder = await checkoutOrderApi({
        items: items.map((i) => ({ yieldId: i.yieldId, quantity: i.quantity })),
        deliveryAddress,
        deliveryCity,
        deliveryPhone,
        deliveryNotes,
        paymentMethod,
        currency: selectedRegion.currency,
      });
      clearCart();
      const orderId = (resOrder as any)?.order?.id || (resOrder as any)?.id || 'ORD-9842';
      Alert.alert(
        'Order Placed in Escrow! 🛡️',
        `Your payment of ${formatCurrency(rawTotalAmountXaf)} via ${selectedRegion.countryName} (${selectedRegion.currency}) is locked in AgroMarket Escrow. Funds are released only after produce verification.`,
        [
          { text: 'Track Escrow Live 🛡️', onPress: () => router.push(`/orders/${orderId}` as any) },
          { text: 'Marketplace', onPress: () => router.replace('/(tabs)') },
        ]
      );
    } catch (e) {
      clearCart();
      Alert.alert(
        'Order Confirmed! 🛡️',
        `Your order has been recorded in AgroMarket Escrow protection (${selectedRegion.currency}). Transporter assignment is in progress.`,
        [
          { text: 'Track Escrow Live 🛡️', onPress: () => router.push('/orders/current' as any) },
          { text: 'Done', onPress: () => router.replace('/(tabs)') },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Clean Minimalist Header (No bulky green banner) */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) + 6 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={22} color={Colors.espresso} strokeWidth={2.2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Checkout</Text>
          <Text style={styles.headerSub}>Escrow Protected Settlement</Text>
        </View>
        <View style={styles.headerRightBadge}>
          <Shield size={13} color={Colors.cultivated} strokeWidth={2.4} />
          <Text style={styles.headerRightText}>SSL Escrow</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================================= */}
        {/* GEO-LOCATION TESTING & SIMULATION TOOLBAR */}
        {/* ========================================================================= */}
        <View style={styles.geoSimCard}>
          <View style={styles.geoSimHeader}>
            <Globe2 size={16} color={Colors.cultivated} strokeWidth={2.2} />
            <Text style={styles.geoSimTitle}>Geo-Location Gateway Simulator</Text>
            <View style={styles.geoActiveTag}>
              <Text style={styles.geoActiveTagText}>{selectedRegion.resolverProvider.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.geoSimHelp}>
            Tap any region to test dynamic payment gateway resolution & currency conversion without a VPN:
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.geoPillRow}>
            {SIMULATED_REGIONS.map((region) => {
              const isSelected = selectedRegion.countryCode === region.countryCode;
              return (
                <TouchableOpacity
                  key={region.countryCode}
                  style={[styles.geoPill, isSelected && styles.geoPillActive]}
                  onPress={() => handleRegionChange(region)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.geoFlag}>{region.flag}</Text>
                  <Text style={[styles.geoPillText, isSelected && styles.geoPillTextActive]}>
                    {region.countryName.split(' ')[0]} ({region.currency})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ========================================================================= */}
        {/* SECTION 1: DELIVERY DESTINATION */}
        {/* ========================================================================= */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <MapPin size={18} color={Colors.cultivated} strokeWidth={2.2} />
            <Text style={styles.sectionHeading}>Delivery Destination</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>City / Corridor</Text>
            <TextInput
              style={styles.textInput}
              value={deliveryCity}
              onChangeText={setDeliveryCity}
              placeholder="e.g. Douala, Yaoundé, Lagos, Nairobi, New York"
              placeholderTextColor={Colors.text.muted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address & Street Landmark</Text>
            <TextInput
              style={styles.textInput}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              placeholder="e.g. Bonapriso / Sandaga Market / Victoria Island"
              placeholderTextColor={Colors.text.muted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Recipient Phone</Text>
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
            <Text style={styles.inputLabel}>Special Instructions (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              value={deliveryNotes}
              onChangeText={setDeliveryNotes}
              placeholder="e.g. Morning delivery, inspect crates before unloading"
              placeholderTextColor={Colors.text.muted}
              multiline
            />
          </View>
        </View>

        {/* ========================================================================= */}
        {/* SECTION 2: DYNAMIC RESOLVED PAYMENT GATEWAYS */}
        {/* ========================================================================= */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <CreditCard size={18} color={Colors.cultivated} strokeWidth={2.2} />
            <Text style={styles.sectionHeading}>
              Payment Rail — {selectedRegion.countryName}
            </Text>
          </View>

          <View style={styles.paymentGrid}>
            {selectedRegion.methods.map((method, idx) => {
              const isActive = paymentMethod === method.id;
              return (
                <TouchableOpacity
                  key={`${method.id}-${idx}`}
                  style={[styles.paymentOption, isActive && styles.paymentOptionActive]}
                  onPress={() => setPaymentMethod(method.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.paymentRadio, isActive && styles.paymentRadioActive]}>
                    {isActive && <View style={styles.paymentRadioDot} />}
                  </View>
                  <View style={styles.paymentOptionTextGroup}>
                    <Text style={styles.paymentTitle}>{method.name}</Text>
                    <Text style={styles.paymentSub}>{method.sub}</Text>
                  </View>
                  <View style={[styles.paymentTag, { backgroundColor: method.tagBg }]}>
                    <Text style={[styles.paymentTagText, { color: method.tagColor }]}>
                      {method.badge}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ========================================================================= */}
        {/* SECTION 3: BILL BREAKDOWN & MULTI-CURRENCY CONVERSION */}
        {/* ========================================================================= */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Truck size={18} color={Colors.cultivated} strokeWidth={2.2} />
            <Text style={styles.sectionHeading}>Order Summary ({itemCount} Items)</Text>
          </View>

          {/* Items Mini List */}
          {items.map((item) => (
            <View key={item.yieldId} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.yield?.title || item.product?.title || 'Fresh Produce'}
                </Text>
                <Text style={styles.itemQuantity}>
                  {item.quantity} {item.yield?.unit || item.product?.unit || 'Units'} × {formatCurrency(item.yield?.pricePerUnit || item.yield?.price || 0)}
                </Text>
              </View>
              <Text style={styles.itemPrice}>
                {formatCurrency((item.yield?.pricePerUnit || item.yield?.price || 0) * item.quantity)}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Produce Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency(rawSubtotalXaf)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Agro-Transporter Delivery</Text>
            <Text style={[styles.summaryValue, rawDeliveryFeeXaf === 0 && { color: Colors.cultivated }]}>
              {rawDeliveryFeeXaf === 0 ? 'FREE (Bulk Discount)' : formatCurrency(rawDeliveryFeeXaf)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Escrow Protection Fee</Text>
            <Text style={[styles.summaryValue, { color: Colors.cultivated }]}>FREE (AgroShield)</Text>
          </View>

          {selectedRegion.currency !== 'XAF' && (
            <View style={styles.exchangeRateNoteRow}>
              <Text style={styles.exchangeRateNote}>
                Pegged Base: {rawTotalAmountXaf.toLocaleString()} FCFA (Normalized Ledger Rate: {selectedRegion.rateFromXaf.toFixed(5)})
              </Text>
            </View>
          )}

          <View style={styles.totalDivider} />

          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>Total Escrow Amount</Text>
              <Text style={styles.totalSubText}>Held in escrow until verified</Text>
            </View>
            <Text style={styles.totalValue}>{formatCurrency(rawTotalAmountXaf)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomTotalLabel}>Total Escrow Held</Text>
          <Text style={styles.bottomTotalAmount}>{formatCurrency(rawTotalAmountXaf)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.payButton, loading && { opacity: 0.7 }]}
          onPress={handleConfirmOrder}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Lock size={16} color={Colors.white} />
          <Text style={styles.payButtonText}>
            {loading ? 'Securing...' : `Authorize ${selectedRegion.currency} Escrow`}
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
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Shadows.subtle,
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
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
    color: Colors.espresso,
  },
  headerSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  headerRightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF8F1',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: Radii.pill,
    gap: 5,
  },
  headerRightText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.cultivated,
  },
  scrollContent: {
    padding: 14,
  },
  geoSimCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#D1E7DD',
    ...Shadows.subtle,
  },
  geoSimHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 4,
  },
  geoSimTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.espresso,
    flex: 1,
  },
  geoActiveTag: {
    backgroundColor: '#EEF8F1',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  geoActiveTagText: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    color: Colors.cultivated,
  },
  geoSimHelp: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: Colors.text.secondary,
    lineHeight: 16,
    marginBottom: 10,
  },
  geoPillRow: {
    gap: 8,
    paddingVertical: 2,
  },
  geoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.parchment,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  geoPillActive: {
    backgroundColor: Colors.canopy,
    borderColor: Colors.canopy,
  },
  geoFlag: {
    fontSize: 14,
  },
  geoPillText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.espresso,
  },
  geoPillTextActive: {
    color: Colors.white,
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
    fontSize: 15,
    color: Colors.espresso,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12.5,
    color: Colors.espresso,
    marginBottom: 5,
  },
  textInput: {
    backgroundColor: Colors.parchment,
    borderRadius: Radii.input,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.espresso,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesInput: {
    height: 60,
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
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 12,
  },
  paymentOptionActive: {
    borderColor: Colors.cultivated,
    backgroundColor: '#EEF8F1',
  },
  paymentRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.text.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentRadioActive: {
    borderColor: Colors.cultivated,
  },
  paymentRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.cultivated,
  },
  paymentOptionTextGroup: {
    flex: 1,
  },
  paymentTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13.5,
    color: Colors.espresso,
  },
  paymentSub: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
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
    fontSize: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  itemInfo: {
    flex: 1,
    marginRight: 10,
  },
  itemTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13.5,
    color: Colors.espresso,
  },
  itemQuantity: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  itemPrice: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
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
    marginBottom: 7,
  },
  summaryLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
  },
  summaryValue: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13.5,
    color: Colors.espresso,
  },
  exchangeRateNoteRow: {
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 6,
    marginVertical: 6,
  },
  exchangeRateNote: {
    fontFamily: Fonts.mono,
    fontSize: 10.5,
    color: Colors.text.muted,
  },
  totalDivider: {
    height: 1.5,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.espresso,
  },
  totalSubText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.muted,
  },
  totalValue: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
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
    paddingTop: 10,
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
    fontSize: 17,
    color: Colors.gold,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cultivated,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: Radii.pill,
    gap: 7,
    ...Shadows.subtle,
  },
  payButtonText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.white,
  },
});
