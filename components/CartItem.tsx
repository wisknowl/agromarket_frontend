import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { CartItem as CartItemType } from '@/types';
import { useCartStore } from '@/store/cartStore';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import PriceTag from './ui/PriceTag';

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCartStore();

  const handleIncrement = () => {
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    } else {
      removeFromCart(item.id);
    }
  };

  const handleRemove = () => {
    removeFromCart(item.id);
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: item.yield.image }} style={styles.image} />

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {item.yield.title}
        </Text>
        <PriceTag
          amount={item.yield.price}
          unit={item.yield.unit}
          size="sm"
          color={Colors.text.secondary}
        />

        <View style={styles.quantityContainer}>
          <Pressable style={styles.quantityButton} onPress={handleDecrement}>
            <Minus size={14} color={Colors.espresso} />
          </Pressable>

          <Text style={styles.quantity}>{item.quantity}</Text>

          <Pressable style={styles.quantityButton} onPress={handleIncrement}>
            <Plus size={14} color={Colors.espresso} />
          </Pressable>

          <Text style={styles.subtotal}>
            {(item.yield.price * item.quantity).toLocaleString()} FCFA
          </Text>
        </View>
      </View>

      <Pressable style={styles.removeButton} onPress={handleRemove}>
        <Trash2 size={18} color={Colors.clay} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    padding: 12,
    marginBottom: 12,
    ...Shadows.subtle,
  },
  image: {
    width: 76,
    height: 76,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: Colors.parchment,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.espresso,
    marginBottom: 2,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityButton: {
    backgroundColor: Colors.parchment,
    borderRadius: Radii.sm,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    fontFamily: Fonts.monoBold,
    fontSize: 14,
    color: Colors.espresso,
    marginHorizontal: 10,
    minWidth: 18,
    textAlign: 'center',
  },
  subtotal: {
    fontFamily: Fonts.monoBold,
    fontSize: 14,
    marginLeft: 'auto',
    color: Colors.canopy,
  },
  removeButton: {
    padding: 6,
    alignSelf: 'flex-start',
  },
});