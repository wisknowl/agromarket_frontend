import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { CartItem as CartItemType } from '@/types';
import { useCartStore } from '@/store/cartStore';
import Colors from '@/constants/colors';

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
        <Text style={styles.title}>{item.yield.title}</Text>
        <Text style={styles.price}>{item.yield.price} FCFA/{item.yield.unit}</Text>
        
        <View style={styles.quantityContainer}>
          <Pressable style={styles.quantityButton} onPress={handleDecrement}>
            <Minus size={16} color={Colors.text.primary} />
          </Pressable>
          
          <Text style={styles.quantity}>{item.quantity}</Text>
          
          <Pressable style={styles.quantityButton} onPress={handleIncrement}>
            <Plus size={16} color={Colors.text.primary} />
          </Pressable>
          
          <Text style={styles.subtotal}>
            {item.yield.price * item.quantity} FCFA
          </Text>
        </View>
      </View>
      
      <Pressable style={styles.removeButton} onPress={handleRemove}>
        <Trash2 size={20} color={Colors.error} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: Colors.border,
    borderRadius: 6,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  subtotal: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 'auto',
    color: Colors.primary,
  },
  removeButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
});