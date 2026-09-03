import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  Pressable,
  Image,
  Easing,
  Dimensions,
} from 'react-native';
import { useCartStore } from '@/store/cartStore';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const FREE_DELIVERY_COUNT = 10;

interface BasketProps {
  onGoToCart?: () => void;
  lastAddedItem?: {
    yield: { image: string };
  };
}

export default function Basket({ onGoToCart, lastAddedItem }: BasketProps) {
  const [expanded, setExpanded] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(1)).current;
  const [removingId, setRemovingId] = useState<string | null>(null);
  const { items, getTotal, updateQuantity, removeFromCart } = useCartStore();
  const [staggerAnims, setStaggerAnims] = useState<Animated.Value[]>([]);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [showFlyImage, setShowFlyImage] = useState(false);
  const flyAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [flyImageUri, setFlyImageUri] = useState<string | null>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const totalItems = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
  const totalAmount = getTotal();
  const progress = Math.min(totalItems / FREE_DELIVERY_COUNT, 1);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    Animated.sequence([
      Animated.timing(badgeScale, { toValue: 1.3, duration: 120, useNativeDriver: true }),
      Animated.timing(badgeScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    triggerShake();
  }, [totalItems]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  useEffect(() => {
    if (expanded && items.length) {
      const anims = items.map(() => new Animated.Value(0));
      setStaggerAnims(anims);
      Animated.stagger(
        70,
        anims.map((anim) =>
          Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true })
        )
      ).start();
    }
  }, [expanded, items.length]);

  const handleQuantity = (id: string, delta: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    updateQuantity(id, newQty);
  };

  const handleExpand = () => {
    setExpanded(true);
    Animated.timing(animation, {
      toValue: 1,
      duration: 350,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    }).start();
  };

  const handleCollapse = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 350,
      useNativeDriver: false,
      easing: Easing.in(Easing.cubic),
    }).start(() => setExpanded(false));
  };

  const containerHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [76, 420],
  });
  const collapsedOpacity = animation.interpolate({
    inputRange: [0, 0.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const expandedOpacity = animation.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const handleDelete = (id: string) => {
    setRemovingId(id);
    const itemIndex = items.findIndex((i) => i.id === id);
    if (staggerAnims[itemIndex]) {
      Animated.timing(staggerAnims[itemIndex], {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        removeFromCart(id);
        setRemovingId(null);
      });
    } else {
      removeFromCart(id);
      setRemovingId(null);
    }
  };

  if (items.length === 0) return null;

  return (
    <>
      {expanded && (
        <Pressable
          style={styles.blurOverlay}
          pointerEvents="auto"
          onPress={handleCollapse}
        />
      )}

      <Animated.View style={[styles.container, { height: containerHeight }]}>
        <Animated.View
          style={{
            flex: 1,
            transform: [
              {
                translateX: shakeAnim.interpolate({
                  inputRange: [-1, 1],
                  outputRange: [-6, 6],
                }),
              },
            ],
          }}
        >
          {expanded && (
            <View style={styles.progressBarContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
              <Text style={styles.progressText}>
                {totalItems} / {FREE_DELIVERY_COUNT} for Direct Cooperative Delivery
              </Text>
            </View>
          )}

          {!expanded && (
            <Animated.View style={{ opacity: collapsedOpacity }}>
              <View style={styles.row}>
                <FlatList
                  horizontal
                  data={items}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={styles.itemRow}>
                      <Image
                        source={{ uri: item.yield.image }}
                        style={styles.itemImage}
                      />
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.quantity}</Text>
                      </View>
                    </View>
                  )}
                  showsHorizontalScrollIndicator={false}
                />
                <TouchableOpacity
                  style={styles.viewBasket}
                  onPress={handleExpand}
                >
                  <Text style={styles.viewBasketText}>Open Basket</Text>
                  <Animated.View style={{ transform: [{ scale: badgeScale }] }}>
                    <View style={styles.basketIconCircle}>
                      <ShoppingBag size={18} color={Colors.espresso} strokeWidth={2.2} />
                      <View style={styles.iconBadge}>
                        <Text style={styles.iconBadgeText}>{totalItems}</Text>
                      </View>
                    </View>
                  </Animated.View>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {expanded && (
            <Animated.View style={{ flex: 1, opacity: expandedOpacity }}>
              <View style={styles.expandedContent}>
                <FlatList
                  data={items}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item, index }) => (
                    <Animated.View
                      style={[
                        styles.expandedItemRow,
                        {
                          transform: [{ scale: staggerAnims[index] || 1 }],
                          opacity: staggerAnims[index] || 1,
                        },
                      ]}
                    >
                      <Image
                        source={{ uri: item.yield.image }}
                        style={styles.expandedItemImage}
                      />
                      <View style={styles.expandedItemInfo}>
                        <Text style={styles.expandedItemTitle} numberOfLines={1}>
                          {item.yield.title}
                        </Text>
                        <Text style={styles.expandedItemPrice}>
                          {item.yield.price} FCFA / {item.yield.unit}
                        </Text>
                      </View>
                      <View style={styles.quantityControls}>
                        <Pressable
                          style={styles.qtyBtn}
                          onPress={() => handleQuantity(item.id, -1)}
                        >
                          <Minus size={14} color={Colors.espresso} />
                        </Pressable>
                        <Text style={styles.quantityText}>{item.quantity}</Text>
                        <Pressable
                          style={styles.qtyBtn}
                          onPress={() => handleQuantity(item.id, 1)}
                        >
                          <Plus size={14} color={Colors.espresso} />
                        </Pressable>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDelete(item.id)}
                        style={{ marginLeft: 10 }}
                      >
                        <Trash2 size={18} color={Colors.clay} />
                      </TouchableOpacity>
                    </Animated.View>
                  )}
                />

                <View style={styles.bottomRow}>
                  <TouchableOpacity
                    style={styles.goToCartButton}
                    onPress={onGoToCart}
                  >
                    <ShoppingBag size={18} color={Colors.espresso} />
                    <Text style={styles.goToCartText}>
                      Proceed to Checkout ({totalAmount.toLocaleString()} FCFA)
                    </Text>
                    <ArrowRight size={16} color={Colors.espresso} />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          )}
        </Animated.View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.canopy,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 12,
    zIndex: 100,
    borderTopWidth: 1,
    borderTopColor: 'rgba(246, 238, 221, 0.2)',
    ...Shadows.card,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 37, 21, 0.6)',
    zIndex: 99,
  },
  progressBarContainer: {
    height: 22,
    backgroundColor: 'rgba(246, 238, 221, 0.15)',
    borderRadius: Radii.pill,
    marginBottom: 10,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.cultivated,
    borderRadius: Radii.pill,
  },
  progressText: {
    alignSelf: 'center',
    color: Colors.parchment,
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    zIndex: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemRow: {
    marginRight: 10,
    backgroundColor: Colors.white,
    borderRadius: Radii.chip,
    padding: 3,
    position: 'relative',
  },
  itemImage: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.gold,
    borderRadius: Radii.pill,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.espresso,
    fontSize: 10,
    fontFamily: Fonts.monoBold,
  },
  viewBasket: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(246, 238, 221, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
    marginLeft: 12,
    gap: 8,
  },
  viewBasketText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.parchment,
  },
  basketIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.soil,
    borderRadius: Radii.pill,
    paddingHorizontal: 4,
    minWidth: 14,
    alignItems: 'center',
  },
  iconBadgeText: {
    color: Colors.parchment,
    fontSize: 9,
    fontFamily: Fonts.monoBold,
  },
  expandedContent: {
    flex: 1,
  },
  expandedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 10,
  },
  expandedItemImage: {
    width: 46,
    height: 46,
    borderRadius: 8,
  },
  expandedItemInfo: {
    flex: 1,
    marginLeft: 10,
  },
  expandedItemTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.espresso,
  },
  expandedItemPrice: {
    fontFamily: Fonts.monoBold,
    color: Colors.soil,
    fontSize: 12,
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.parchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontFamily: Fonts.monoBold,
    fontSize: 14,
    color: Colors.espresso,
    minWidth: 18,
    textAlign: 'center',
  },
  bottomRow: {
    marginTop: 12,
  },
  goToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold,
    borderRadius: Radii.pill,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  goToCartText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.espresso,
  },
});
