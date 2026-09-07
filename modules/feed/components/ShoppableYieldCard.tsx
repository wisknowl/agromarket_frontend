import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ShoppingBag, Sparkles } from 'lucide-react-native';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { AgroYield } from '@/types';
import { useCartStore } from '@/store/cartStore';

interface ShoppableYieldCardProps {
  yieldItem: AgroYield;
  onPressItem?: () => void;
}

export default function ShoppableYieldCard({ yieldItem, onPressItem }: ShoppableYieldCardProps) {
  const addToCart = useCartStore((state) => state.addToCart);

  const handleQuickAdd = (e: any) => {
    e.stopPropagation?.();
    addToCart(yieldItem, 1);
  };

  const rawPrice = yieldItem.price ?? (yieldItem as any).pricePerUnit ?? 0;
  const numericPrice = typeof rawPrice === 'number' ? rawPrice : Number(rawPrice) || 0;
  const unitLabel = yieldItem.unit || 'Unit';
  const imageUri = yieldItem.image || (yieldItem.mediaUrls && yieldItem.mediaUrls[0]) || '';

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
        <Text style={styles.title} numberOfLines={1}>
          {yieldItem.title}
        </Text>
        <Text style={styles.price}>
          {numericPrice.toLocaleString()} FCFA
          <Text style={styles.unit}> / {unitLabel}</Text>
        </Text>
      </View>

      <TouchableOpacity
        style={styles.addBtn}
        onPress={handleQuickAdd}
        accessibilityLabel="Add to basket"
      >
        <ShoppingBag size={13} color={Colors.espresso} strokeWidth={2.2} />
        <Text style={styles.addBtnText}>Add</Text>
      </TouchableOpacity>
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
    maxWidth: 260,
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
  addBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10.5,
    color: Colors.espresso,
  },
});
