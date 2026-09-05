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
          {yieldItem.price.toLocaleString()} FCFA
          <Text style={styles.unit}> / {yieldItem.unit}</Text>
        </Text>
      </View>

      <TouchableOpacity
        style={styles.addBtn}
        onPress={handleQuickAdd}
        accessibilityLabel="Add to basket"
      >
        <ShoppingBag size={16} color={Colors.white} strokeWidth={2.2} />
        <Text style={styles.addBtnText}>Add</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: Radii.pill,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 8,
    maxWidth: 260,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  imageContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.parchmentDim,
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
    fontSize: 11,
    color: Colors.soil,
  },
  unit: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.text.secondary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cultivated,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radii.pill,
    gap: 4,
  },
  addBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.white,
  },
});
