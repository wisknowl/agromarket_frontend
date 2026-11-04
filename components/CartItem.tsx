import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { CartItem as CartItemType } from '@/types';
import { useCartStore } from '@/store/cartStore';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import PriceTag from './ui/PriceTag';
import { useLocale } from '@/context/LocaleContext';
import { resolveMediaUrl, FALLBACK_POST_IMAGE } from '@/utils/media';

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { formatCurrency } = useLocale();
  const { updateQuantity, removeFromCart } = useCartStore();

  const minQty = item.yield.minOrderQuantity || 1;

  const handleIncrement = () => {
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > minQty) {
      updateQuantity(item.id, item.quantity - 1);
    } else {
      removeFromCart(item.id);
    }
  };

  const handleRemove = () => {
    removeFromCart(item.id);
  };

  const imageUrl = resolveMediaUrl(item.yield.image) || FALLBACK_POST_IMAGE;

  return (
    <View style={styles.container}>
      <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />

      <View style={styles.content}>
        <View>
          <Text style={styles.title} numberOfLines={1}>
            {item.yield.title}
          </Text>
          {item.yield.originRegion ? (
            <Text style={styles.origin} numberOfLines={1}>
              {item.yield.originRegion}
            </Text>
          ) : null}
          {item.yield.dispatchSiteName ? (
            <View style={styles.dispatchBadge}>
              <Text style={styles.dispatchBadgeText} numberOfLines={1}>
                🏢 Dispatch: {item.yield.dispatchSiteName}
              </Text>
            </View>
          ) : null}
        </View>

        <PriceTag
          amount={item.yield.price}
          unit={item.yield.unit}
          size="sm"
          color="#5C5245"
        />

        <View style={styles.quantityContainer}>
          <View style={styles.counterPill}>
            <Pressable style={styles.quantityButton} onPress={handleDecrement}>
              <Minus size={13} color="#241A12" strokeWidth={2.5} />
            </Pressable>

            <Text style={styles.quantity}>{item.quantity}</Text>

            <Pressable style={styles.quantityButton} onPress={handleIncrement}>
              <Plus size={13} color="#241A12" strokeWidth={2.5} />
            </Pressable>
          </View>

          <Text style={styles.subtotal}>
            {formatCurrency(item.yield.price * item.quantity)}
          </Text>
        </View>
      </View>

      <Pressable style={styles.removeButton} onPress={handleRemove}>
        <Trash2 size={16} color="#B54A34" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F2DCAA',
    padding: 12,
    marginBottom: 12,
    shadowColor: '#241A12',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  image: {
    width: 76,
    height: 76,
    borderRadius: 14,
    marginRight: 12,
    backgroundColor: '#FFF9EE',
    borderWidth: 1,
    borderColor: '#F2DCAA',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: '#241A12',
    marginBottom: 1,
  },
  origin: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: '#5C5245',
    marginBottom: 2,
  },
  dispatchBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF6E8',
    borderColor: '#F2DCAA',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  dispatchBadgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    color: '#7A4A2D',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  counterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9EE',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F2DCAA',
    padding: 2,
  },
  quantityButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F2DCAA',
  },
  quantity: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    color: '#241A12',
    marginHorizontal: 8,
    minWidth: 18,
    textAlign: 'center',
  },
  subtotal: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    marginLeft: 'auto',
    color: '#B87D1E',
  },
  removeButton: {
    padding: 6,
    alignSelf: 'flex-start',
  },
});
