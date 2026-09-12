import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Crown,
  Sparkles,
  Percent,
  Clock,
  BookOpen,
  Smartphone,
  CreditCard,
  Wallet,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react-native';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { patronizeFarmApi, AgroPatronSubscription } from './api/fintech';

interface AgroPatronModalProps {
  visible: boolean;
  onClose: () => void;
  farmerId: string;
  farmerName: string;
  farmName: string;
  avatarUrl?: string;
  onSuccess?: (subscription: AgroPatronSubscription) => void;
}

export default function AgroPatronModal({
  visible,
  onClose,
  farmerId,
  farmerName,
  farmName,
  onSuccess,
}: AgroPatronModalProps) {
  const insets = useSafeAreaInsets();

  const [plan, setPlan] = useState<'MONTHLY' | 'SEASONAL'>('MONTHLY');
  const [channelCategory, setChannelCategory] = useState<'MOBILE_MONEY' | 'CARD' | 'AGROWALLET'>('MOBILE_MONEY');
  const [momoProvider, setMomoProvider] = useState<'M_PESA' | 'AIRTEL' | 'MTN' | 'ORANGE' | 'WAVE'>('M_PESA');
  const [accountInput, setAccountInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isMonthly = plan === 'MONTHLY';
  const priceXaf = isMonthly ? 1200 : 3600;
  const priceUsd = isMonthly ? '$2.00' : '$6.00';

  const handleActivatePatron = async () => {
    try {
      setSubmitting(true);
      const provider = channelCategory === 'MOBILE_MONEY' ? momoProvider : channelCategory;
      const res = await patronizeFarmApi({
        farmerId,
        plan,
        amount: priceXaf,
        currency: 'XAF',
        paymentMethod: channelCategory,
        paymentProvider: provider,
        phoneNumber: accountInput || undefined,
      });

      Alert.alert(
        'AgroPatron Pass Activated! 👑🌾',
        `You are now an official AgroPatron of ${farmName}! 8% harvest discounts and priority early allocations have been unlocked for your account.`,
        [
          {
            text: 'OK',
            onPress: () => {
              onClose();
              if (onSuccess && res.subscription) {
                onSuccess(res.subscription);
              }
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Activation Notice', err.message || 'Could not activate patron pass');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom + 20, 30) }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.crownCircle}>
                <Crown size={22} color={Colors.gold} strokeWidth={2.4} />
              </View>
              <View>
                <Text style={styles.modalTitle}>Become an AgroPatron</Text>
                <Text style={styles.modalSub}>Micro-Patronage & Harvest VIP Pass</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color={Colors.espresso} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Target Farm Card */}
            <View style={styles.farmCard}>
              <View style={styles.farmInfo}>
                <Text style={styles.farmNameText}>{farmName}</Text>
                <Text style={styles.farmerSub}>Managed by {farmerName}</Text>
              </View>
              <View style={styles.patronPricePill}>
                <Text style={styles.pricePillText}>{priceUsd}</Text>
                <Text style={styles.pricePillSub}>~{priceXaf.toLocaleString()} FCFA</Text>
              </View>
            </View>

            {/* Plan Selector */}
            <Text style={styles.sectionLabel}>Select Patronage Plan</Text>
            <View style={styles.planSelectorRow}>
              <TouchableOpacity
                style={[styles.planCard, plan === 'MONTHLY' && styles.planCardActive]}
                onPress={() => setPlan('MONTHLY')}
                activeOpacity={0.8}
              >
                <View style={styles.planTopRow}>
                  <Text style={[styles.planTitle, plan === 'MONTHLY' && styles.planTitleActive]}>
                    Monthly Pass
                  </Text>
                  <Text style={[styles.planPrice, plan === 'MONTHLY' && styles.planPriceActive]}>
                    $2 / mo
                  </Text>
                </View>
                <Text style={styles.planDesc}>30-Day recurring harvest support</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.planCard, plan === 'SEASONAL' && styles.planCardActive]}
                onPress={() => setPlan('SEASONAL')}
                activeOpacity={0.8}
              >
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>CROP CYCLE</Text>
                </View>
                <View style={styles.planTopRow}>
                  <Text style={[styles.planTitle, plan === 'SEASONAL' && styles.planTitleActive]}>
                    Seasonal Pass
                  </Text>
                  <Text style={[styles.planPrice, plan === 'SEASONAL' && styles.planPriceActive]}>
                    $6 / season
                  </Text>
                </View>
                <Text style={styles.planDesc}>Full 4-Month crop harvest pass</Text>
              </TouchableOpacity>
            </View>

            {/* Guaranteed Perks Checklist */}
            <View style={styles.perksBox}>
              <Text style={styles.perksTitle}>Your AgroPatron Perks Include:</Text>

              <View style={styles.perkItem}>
                <Percent size={16} color={Colors.cultivated} strokeWidth={2.4} />
                <Text style={styles.perkText}>
                  <Text style={styles.perkBold}>8% Direct Harvest Discount</Text> on all produce ordered from this farm
                </Text>
              </View>

              <View style={styles.perkItem}>
                <Clock size={16} color={Colors.cultivated} strokeWidth={2.4} />
                <Text style={styles.perkText}>
                  <Text style={styles.perkBold}>48-Hour Priority Early Access</Text> to harvest lots before public marketplace drop
                </Text>
              </View>

              <View style={styles.perkItem}>
                <BookOpen size={16} color={Colors.cultivated} strokeWidth={2.4} />
                <Text style={styles.perkText}>
                  <Text style={styles.perkBold}>Private Farm Diary & Stories</Text> with direct grower updates and seed tracking
                </Text>
              </View>

              <View style={styles.perkItem}>
                <Crown size={16} color={Colors.gold} strokeWidth={2.4} />
                <Text style={styles.perkText}>
                  <Text style={styles.perkBold}>Official AgroPatron Badge</Text> displayed across reviews, chat, and comments
                </Text>
              </View>
            </View>

            {/* Payment Channel Selector */}
            <Text style={[styles.sectionLabel, { marginTop: 14 }]}>Payment Channel</Text>
            <View style={styles.channelRow}>
              <TouchableOpacity
                style={[styles.channelChip, channelCategory === 'MOBILE_MONEY' && styles.channelChipActive]}
                onPress={() => setChannelCategory('MOBILE_MONEY')}
              >
                <Smartphone size={16} color={channelCategory === 'MOBILE_MONEY' ? Colors.canopy : Colors.text.secondary} />
                <Text style={[styles.channelChipText, channelCategory === 'MOBILE_MONEY' && styles.channelChipTextActive]}>
                  Mobile Money
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.channelChip, channelCategory === 'CARD' && styles.channelChipActive]}
                onPress={() => setChannelCategory('CARD')}
              >
                <CreditCard size={16} color={channelCategory === 'CARD' ? Colors.canopy : Colors.text.secondary} />
                <Text style={[styles.channelChipText, channelCategory === 'CARD' && styles.channelChipTextActive]}>
                  Card (Diaspora)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.channelChip, channelCategory === 'AGROWALLET' && styles.channelChipActive]}
                onPress={() => setChannelCategory('AGROWALLET')}
              >
                <Wallet size={16} color={channelCategory === 'AGROWALLET' ? Colors.canopy : Colors.text.secondary} />
                <Text style={[styles.channelChipText, channelCategory === 'AGROWALLET' && styles.channelChipTextActive]}>
                  AgroWallet
                </Text>
              </TouchableOpacity>
            </View>

            {/* Mobile Money Provider Picker */}
            {channelCategory === 'MOBILE_MONEY' && (
              <View style={styles.momoProvidersRow}>
                {[
                  { id: 'M_PESA', label: 'M-Pesa 🇰🇪🇹🇿' },
                  { id: 'AIRTEL', label: 'Airtel 🇳🇬🇺🇬' },
                  { id: 'MTN', label: 'MTN MoMo 🇬🇭🇨🇲' },
                  { id: 'ORANGE', label: 'Orange 🇸🇳🇨🇮' },
                  { id: 'WAVE', label: 'Wave 🇸🇳🇨🇮' },
                ].map((prov) => (
                  <TouchableOpacity
                    key={prov.id}
                    style={[styles.providerChip, momoProvider === prov.id && styles.providerChipActive]}
                    onPress={() => setMomoProvider(prov.id as any)}
                  >
                    <Text style={[styles.providerText, momoProvider === prov.id && styles.providerTextActive]}>
                      {prov.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Account / Phone Identifier Input */}
            <Text style={[styles.sectionLabel, { marginTop: 12 }]}>
              {channelCategory === 'CARD'
                ? 'Cardholder Name & Number'
                : channelCategory === 'AGROWALLET'
                ? 'Account Username'
                : 'Account Phone Number (International)'}
            </Text>
            <TextInput
              style={styles.accountInput}
              value={accountInput}
              onChangeText={setAccountInput}
              keyboardType={channelCategory === 'CARD' ? 'default' : 'phone-pad'}
              placeholder={
                channelCategory === 'CARD'
                  ? 'e.g. John Doe • 4111 2222 ...'
                  : channelCategory === 'AGROWALLET'
                  ? 'e.g. my_agromarket_handle'
                  : 'e.g. +254 7xx..., +234 8xx..., +237 6xx...'
              }
              placeholderTextColor={Colors.text.muted}
            />

            {/* Boost Notice */}
            <View style={styles.boostNotice}>
              <Sparkles size={16} color={Colors.cultivated} />
              <Text style={styles.boostNoticeText}>
                100% of your $2 patronage goes directly to {farmerName} to support seed inputs and farm operations. Your patronage boosts their platform ranking.
              </Text>
            </View>

            {/* Submit CTA */}
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.75 }]}
              onPress={handleActivatePatron}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Crown size={18} color="#FFFFFF" strokeWidth={2.4} />
                  <Text style={styles.submitBtnText}>
                    Activate Patron Pass ({priceUsd} / ~{priceXaf.toLocaleString()} FCFA)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '92%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  crownCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  modalTitle: {
    fontFamily: Fonts.displayBold,
    fontSize: 18,
    color: Colors.espresso,
  },
  modalSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  farmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.parchment,
    borderRadius: Radii.card,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  farmInfo: {
    flex: 1,
  },
  farmNameText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.espresso,
  },
  farmerSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  patronPricePill: {
    backgroundColor: '#EEF8F1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C6E8D0',
  },
  pricePillText: {
    fontFamily: Fonts.monoBold,
    fontSize: 16,
    color: Colors.canopy,
  },
  pricePillSub: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.cultivated,
  },
  sectionLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.espresso,
    marginBottom: 8,
  },
  planSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  planCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    position: 'relative',
  },
  planCardActive: {
    borderColor: Colors.cultivated,
    backgroundColor: '#EEF8F1',
  },
  popularBadge: {
    position: 'absolute',
    top: -9,
    right: 10,
    backgroundColor: Colors.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  popularBadgeText: {
    fontFamily: Fonts.monoBold,
    fontSize: 9,
    color: '#78350F',
  },
  planTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13.5,
    color: Colors.espresso,
  },
  planTitleActive: {
    color: Colors.canopy,
  },
  planPrice: {
    fontFamily: Fonts.monoBold,
    fontSize: 13.5,
    color: Colors.espresso,
  },
  planPriceActive: {
    color: Colors.canopy,
  },
  planDesc: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  perksBox: {
    backgroundColor: '#FAF5FF',
    borderRadius: Radii.card,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    gap: 10,
  },
  perksTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: '#6B21A8',
    marginBottom: 2,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  perkText: {
    fontFamily: Fonts.body,
    fontSize: 12.5,
    color: Colors.espresso,
    flex: 1,
    lineHeight: 17,
  },
  perkBold: {
    fontFamily: Fonts.bodySemiBold,
    color: Colors.espresso,
  },
  channelRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  channelChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.parchment,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  channelChipActive: {
    borderColor: Colors.cultivated,
    backgroundColor: '#EEF8F1',
  },
  channelChipText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  channelChipTextActive: {
    color: Colors.canopy,
  },
  momoProvidersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  providerChip: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.parchment,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  providerChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  providerText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11.5,
    color: Colors.espresso,
  },
  providerTextActive: {
    fontFamily: Fonts.bodyBold,
    color: '#92400E',
  },
  accountInput: {
    backgroundColor: Colors.parchment,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.espresso,
    marginBottom: 14,
  },
  boostNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF8F1',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  boostNoticeText: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: Colors.canopy,
    flex: 1,
    lineHeight: 16,
  },
  submitBtn: {
    backgroundColor: Colors.cultivated,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.subtle,
  },
  submitBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.white,
  },
});
