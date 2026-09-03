import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ShoppingBag, MoreVertical, Heart, HeartOff, Star } from 'lucide-react-native';
import { AgroYield } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { farmers } from '@/mocks/data';
import Popover, { PopoverPlacement } from 'react-native-popover-view';
import PriceTag from './ui/PriceTag';
import FarmerBadge from './ui/FarmerBadge';

interface YieldCardProps {
  item: AgroYield;
  popoverVisible: boolean;
  onOpenPopover: () => void;
  onClosePopover: () => void;
}

export default function YieldCard({
  item,
  popoverVisible,
  onOpenPopover,
  onClosePopover,
}: YieldCardProps) {
  const router = useRouter();
  const { addToCart } = useCartStore();
  const { addYield, removeYield, isYieldFavorite } = useFavoritesStore();
  const isFavorite = isYieldFavorite(item.id);

  const moreButtonRef = React.useRef<View>(null);
  const cardRef = React.useRef<View>(null);
  const [displayArea, setDisplayArea] = React.useState<
    { x: number; y: number; width: number; height: number } | undefined
  >();

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

  const farmer = farmers.find((f) => f.id === item.farmerId);

  return (
    <View style={styles.container} ref={cardRef}>
      <Pressable onPress={handlePress} style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.image} />
        {farmer?.creditScore && farmer.creditScore >= 700 ? (
          <View style={styles.floatingBadge}>
            <FarmerBadge tier="GOLD" label="Gold" size="sm" />
          </View>
        ) : null}
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title || (typeof item.category === 'object' ? item.category?.name : item.category)}
        </Text>

        <View style={styles.priceRow}>
          <PriceTag
            amount={item.price}
            unit={item.unit}
            size="md"
            color={Colors.canopy}
          />
          {item.oldPrice && (
            <Text style={styles.oldPrice}>{item.oldPrice} FCFA</Text>
          )}
        </View>

        <Text style={styles.locationText} numberOfLines={1}>
          📍 {farmer?.location || 'Cameroon'}
        </Text>
      </View>

      <View style={styles.actions}>
        <View style={styles.ratingContainer}>
          <Star size={13} color={Colors.gold} fill={Colors.gold} />
          <Text style={styles.ratingText}>
            {item.rating?.toFixed(1) ?? '4.8'}
          </Text>
        </View>

        <View style={styles.actionButtonsRow}>
          <Pressable style={styles.cartButton} onPress={handleAddToCart}>
            <ShoppingBag size={14} color={Colors.espresso} strokeWidth={2.2} />
          </Pressable>

          <Popover
            isVisible={popoverVisible}
            from={
              <Pressable
                ref={moreButtonRef}
                style={styles.moreButton}
                onPress={onOpenPopover}
              >
                <MoreVertical size={18} color={Colors.text.secondary} />
              </Pressable>
            }
            onRequestClose={onClosePopover}
            placement={PopoverPlacement.TOP}
            displayArea={displayArea}
            backgroundStyle={{ backgroundColor: 'rgba(23, 58, 32, 0.25)' }}
            arrowSize={{ width: 14, height: 7 }}
          >
            <View style={styles.modalContent}>
              <Pressable style={styles.modalRow} onPress={toggleFavorite}>
                <Heart
                  size={18}
                  color={isFavorite ? Colors.clay : Colors.text.secondary}
                  fill={isFavorite ? Colors.clay : 'none'}
                />
                <Text style={styles.modalText}>
                  {isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
                </Text>
              </Pressable>

              <Pressable style={styles.modalRow} onPress={handleChatWithFarmer}>
                {farmer?.profilePhoto ? (
                  <Image
                    source={{ uri: farmer.profilePhoto }}
                    style={styles.farmerAvatar}
                  />
                ) : (
                  <View style={styles.farmerAvatarPlaceholder} />
                )}
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
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    overflow: 'hidden',
    marginBottom: 16,
    ...Shadows.subtle,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 140,
    backgroundColor: Colors.parchment,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  floatingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  content: {
    padding: 10,
    paddingBottom: 6,
  },
  title: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.espresso,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  oldPrice: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.text.muted,
    textDecorationLine: 'line-through',
  },
  locationText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontFamily: Fonts.monoBold,
    fontSize: 12,
    color: Colors.espresso,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cartButton: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.pill,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreButton: {
    padding: 4,
  },
  modalContent: {
    backgroundColor: Colors.white,
    padding: 8,
    minWidth: 190,
    borderRadius: Radii.card,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 10,
  },
  modalText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.espresso,
  },
  farmerAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  farmerAvatarPlaceholder: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.cultivated,
  },
});