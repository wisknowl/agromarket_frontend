import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ShoppingCart, MoreVertical, Heart, HeartOff } from 'lucide-react-native';
import { AgroYield } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import Colors from '@/constants/colors';
import { Post } from '@/types';
import { farmers } from '@/mocks/data';
import Popover, { PopoverPlacement } from 'react-native-popover-view';


interface YieldCardProps {
  item: AgroYield;
  popoverVisible: boolean;
  onOpenPopover: () => void;
  onClosePopover: () => void;
}

export default function YieldCard({ item, popoverVisible, onOpenPopover, onClosePopover }: YieldCardProps) {
  const router = useRouter();
  const { addToCart } = useCartStore();
  const { addYield, removeYield, isYieldFavorite } = useFavoritesStore();
  const isFavorite = isYieldFavorite(item.id);

  const moreButtonRef = React.useRef<View>(null);
  const cardRef = React.useRef<View>(null);
  const [displayArea, setDisplayArea] = React.useState<{ x: number; y: number; width: number; height: number } | undefined>();

  React.useEffect(() => {
    if (popoverVisible && cardRef.current) {
      cardRef.current.measureInWindow((x, y, width, height) => {
        setDisplayArea({ x, y, width, height });
      });
    }
  }, [popoverVisible]);

  const handlePress = () => {
    router.push(`/yield/${item.id}`);
  };

  const handleAddToCart = () => {
    addToCart(item, 1);
  };

  const toggleFavorite = () => {
    if (isFavorite) {
      removeYield(item.id);
    } else {
      addYield(item.id);
    }
  };
  const handleChatWithFarmer = () => {
  if (farmer?.id) {
    onClosePopover();
    router.push(`/chat/${farmer.id}`);
  }
};

  const farmer = farmers.find(f => f.id === item.farmerId);

  return (
    <View style={styles.container} ref={cardRef}>
      <Pressable onPress={handlePress}>
        <Image source={{ uri: item.image }} style={styles.image} />
      </Pressable>
      <View style={styles.content}>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{item.price} FCFA/{item.unit}</Text>
          {item.oldPrice && (
            <Text style={styles.oldPrice}>{item.oldPrice} FCFA</Text>
          )}
        </View>
        <Text style={styles.category}>
          {typeof item.category === 'object' ? item.category?.name : (item.category || 'Fresh Produce')}
        </Text>
      </View>
      <View style={styles.actions}>
        <View style={styles.ratingContainer}>
          {[1,2,3,4,5].map((star) => (
            <Text key={star} style={star <= Math.round(item.rating ?? 0) ? styles.starFilled : styles.starEmpty}>★</Text>
          ))}
          <Text style={styles.ratingText}>{item.rating?.toFixed(1) ?? '0.0'}</Text>
        </View>
        <View style={styles.actionButtonsRow}>
          <Pressable style={styles.cartButton} onPress={handleAddToCart}>
            <ShoppingCart size={13} color={Colors.text.light} />
          </Pressable>
          <Popover
            isVisible={popoverVisible}
            from={(
              <Pressable ref={moreButtonRef} style={styles.moreButton} onPress={onOpenPopover}>
                <MoreVertical size={18} color={Colors.text.secondary} />
              </Pressable>
            )}
            onRequestClose={onClosePopover}
            placement={PopoverPlacement.TOP}
            displayArea={displayArea}
            backgroundStyle={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
            arrowSize={{ width: 16, height: 8 }}
          >
            <View style={styles.modalContent}>
              <Pressable style={styles.modalRow} onPress={toggleFavorite}>
                <Heart
                  size={22}
                  color={isFavorite ? Colors.error : Colors.text.secondary}
                  fill={isFavorite ? Colors.error : 'none'}
                />
                <Text style={styles.modalText}>{isFavorite ? 'Remove from wish list' : 'Add to wish list'}</Text>
              </Pressable>
              <Pressable style={styles.modalRow} onPress={() => {/* handle don't like */}}>
                <HeartOff size={22} color={Colors.error} />
                <Text style={styles.modalText}>Don't like this product</Text>
              </Pressable>
              <Pressable style={styles.modalRow} onPress={handleChatWithFarmer}>
                <Image source={{ uri: farmer?.profilePhoto }} style={styles.farmerAvatar} />
                <Text style={styles.modalText}>Chat with Farmer</Text>
              </Pressable>
            </View>
          </Popover>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '48%',
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    position: 'relative', // Needed for local overlay
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  content: {
    padding: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  oldPrice: {
    fontSize: 13,
    color: Colors.text.secondary,
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  category: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    paddingTop: 0,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starFilled: {
    color: '#FFD700', // gold
    fontSize: 10,
    marginRight: 1,
  },
  starEmpty: {
    color: '#ccc',
    fontSize: 10,
    marginRight: 1,
  },
  ratingText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginLeft: 4,
    fontWeight: '600',
  },
  cartButton: {
    backgroundColor: Colors.primary,
    borderRadius: 6, 
    padding: 6,      
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,  
    width: 45, 
  },
  moreButton: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalContent: {
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    padding: 8,
    minWidth: 220,
    alignItems: 'center',
    elevation: 5,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    width: '100%',
  },
  modalText: {
    fontSize: 13,
    color: Colors.text.primary,
    marginLeft: 10,
    fontWeight: '500',
    width:'auto',
  },
  farmerAvatar: {
    width: 22,
    height: 22,
    borderRadius: 14,
    marginRight: 0,
  },
});