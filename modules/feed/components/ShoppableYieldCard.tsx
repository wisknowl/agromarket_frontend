import React, { useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { ShoppingBag, Sparkles, Clock, Bell, Sprout } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { AgroYield } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useCartAnimationStore } from '@/store/cartAnimationStore';
import { useAuthStore } from '@/store/authStore';
import { useLocale } from '@/context/LocaleContext';

interface ShoppableYieldCardProps {
  yieldItem: AgroYield;
  onPressItem?: () => void;
}

export default function ShoppableYieldCard({ yieldItem, onPressItem }: ShoppableYieldCardProps) {
  const { formatPrice } = useLocale();
  const addToCart = useCartStore((state) => state.addToCart);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const addBtnRef = useRef<any>(null);

  const isOwnProduce = Boolean(
    user &&
    (yieldItem.farmerId === user.id ||
      (yieldItem as any).farmer?.id === user.id ||
      (user.farms && user.farms.some((f: any) => f.id === yieldItem.farmId || f.id === (yieldItem as any).farm?.id)))
  );

  const isGrowing = yieldItem.lifecycleStatus === 'GROWING';
  const isOffCycle = yieldItem.lifecycleStatus === 'OFF_CYCLE';

  const imageUri = yieldItem.image || (yieldItem.mediaUrls && yieldItem.mediaUrls[0]) || '';

  const handleQuickAdd = (e: any) => {
    e.stopPropagation?.();
    addToCart(yieldItem, 1);
    useCartAnimationStore.getState().triggerBasketBounce();
  };

  const handleWaitlist = (e: any) => {
    e.stopPropagation?.();
    Alert.alert(
      'Harvest Waitlist',
      `You will be notified when ${yieldItem.title} begins its next harvest cycle (${yieldItem.nextCycleMonth || 'next season'})!`
    );
  };

  const handleManageOwnProduce = (e: any) => {
    e.stopPropagation?.();
    router.push('/(tabs)/farm' as any);
  };

  const rawPrice = yieldItem.price ?? (yieldItem as any).pricePerUnit ?? 0;
  const numericPrice = typeof rawPrice === 'number' ? rawPrice : Number(rawPrice) || 0;
  const unitLabel = yieldItem.unit || 'Unit';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={onPressItem}
    >
      <View style={styles.imageContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImg}>
            <Sparkles size={16} color={Colors.gold} />
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={styles.title} numberOfLines={1}>
            {yieldItem.title}
          </Text>
          {isGrowing && (
            <View style={styles.miniBadgeGrowing}>
              <Text style={styles.miniBadgeGrowingText}>Growing</Text>
            </View>
          )}
          {isOffCycle && (
            <View style={styles.miniBadgeOffCycle}>
              <Text style={styles.miniBadgeOffCycleText}>Off-Season</Text>
            </View>
          )}
        </View>
        <Text style={styles.price}>
          {formatPrice(numericPrice).primary}
          <Text style={styles.unit}> / {unitLabel}</Text>
        </Text>
        {isGrowing && yieldItem.expectedHarvestWindow ? (
          <Text style={styles.lifecycleSubText} numberOfLines={1}>
            Harvest: {yieldItem.expectedHarvestWindow}
          </Text>
        ) : isOffCycle && yieldItem.nextCycleMonth ? (
          <Text style={styles.lifecycleSubText} numberOfLines={1}>
            Next: {yieldItem.nextCycleMonth}
          </Text>
        ) : null}
      </View>

      {isOwnProduce ? (
        <TouchableOpacity
          style={[styles.addBtn, styles.btnOwn]}
          onPress={handleManageOwnProduce}
          accessibilityLabel="Manage your produce"
        >
          <Sprout size={12} color={Colors.canopy} strokeWidth={2.2} />
          <Text style={[styles.addBtnText, { color: Colors.canopy }]}>Your Crop</Text>
        </TouchableOpacity>
      ) : isOffCycle ? (
        <TouchableOpacity
          style={[styles.addBtn, styles.btnOffCycle]}
          onPress={handleWaitlist}
          accessibilityLabel="Join harvest waitlist"
        >
          <Bell size={12} color={Colors.espresso} strokeWidth={2.2} />
          <Text style={styles.addBtnText}>Waitlist</Text>
        </TouchableOpacity>
      ) : isGrowing ? (
        <TouchableOpacity
          ref={addBtnRef}
          style={[styles.addBtn, styles.btnGrowing]}
          onPress={handleQuickAdd}
          accessibilityLabel="Pre-order harvest"
        >
          <Clock size={12} color={Colors.espresso} strokeWidth={2.2} />
          <Text style={styles.addBtnText}>Pre-Order</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          ref={addBtnRef}
          style={styles.addBtn}
          onPress={handleQuickAdd}
          accessibilityLabel="Add to basket"
        >
          <ShoppingBag size={13} color={Colors.espresso} strokeWidth={2.2} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radii.pill,
    paddingVertical: 5,
    paddingHorizontal: 9,
    gap: 7,
    maxWidth: 280,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  imageContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.parchment,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.espresso,
  },
  price: {
    fontFamily: Fonts.monoBold,
    fontSize: 12.5,
    color: Colors.canopy,
  },
  unit: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.text.secondary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gold,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: Radii.pill,
    gap: 3,
  },
  btnGrowing: {
    backgroundColor: '#E2A63C',
  },
  btnOffCycle: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  btnOwn: {
    backgroundColor: '#EEF8F1',
    borderWidth: 1,
    borderColor: '#CCEBD5',
  },
  miniBadgeGrowing: {
    backgroundColor: '#FEF2D8',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
  },
  miniBadgeGrowingText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 8.5,
    color: '#B87D1E',
  },
  miniBadgeOffCycle: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
  },
  miniBadgeOffCycleText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 8.5,
    color: '#6B7280',
  },
  lifecycleSubText: {
    fontFamily: Fonts.body,
    fontSize: 9.5,
    color: Colors.text.secondary,
    marginTop: -1,
  },
  addBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10.5,
    color: Colors.espresso,
  },
});
