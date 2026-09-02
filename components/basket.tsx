import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Animated, Pressable, Image, Easing, Dimensions } from 'react-native';
import { useCartStore } from '@/store/cartStore';
import Colors from '@/constants/colors';
import { ShoppingBag, ChevronDown, Plus, Minus, Trash2 } from 'lucide-react-native';
import Svg, { Path, Line } from 'react-native-svg';

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
  const animation = useRef(new Animated.Value(0)).current; // 0 = collapsed, 1 = expanded
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

  // Shared shake animation function
  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  // Badge pulse and shake when items are added
  useEffect(() => {
    Animated.sequence([
      Animated.timing(badgeScale, { toValue: 1.3, duration: 120, useNativeDriver: true }),
      Animated.timing(badgeScale, { toValue: 1, duration: 120, useNativeDriver: true })
    ]).start();
    triggerShake();
  }, [totalItems]);

  // Shake every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      triggerShake();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Staggered item reveal
  useEffect(() => {
    if (expanded && items.length) {
      const anims = items.map(() => new Animated.Value(0));
      setStaggerAnims(anims);
      Animated.stagger(80, anims.map(anim =>
        Animated.timing(anim, { toValue: 1, duration: 350, useNativeDriver: true })
      )).start();
    }
  }, [expanded, items.length]);

  // Add-to-basket fly animation (demo: triggers if lastAddedItem prop changes)
  useEffect(() => {
  console.log('lastAddedItem:', lastAddedItem);
  if (lastAddedItem && !expanded) {
    setFlyImageUri(lastAddedItem.yield.image);
    setShowFlyImage(true);
    flyAnim.setValue({ x: 0, y: 0 });
    Animated.timing(flyAnim, {
      toValue: { x: SCREEN_WIDTH - 80, y: -60 },
      duration: 600,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.quad),
    }).start(() => setShowFlyImage(false));
  }
}, [lastAddedItem]);

  const handleQuantity = (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
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

  // Interpolate height for animation
  const containerHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [80, 400],
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
    Animated.timing(staggerAnims[items.findIndex(i => i.id === id)], {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      removeFromCart(id);
      setRemovingId(null);
    });
  };

  // Collapse basket on screen change/unmount
  useEffect(() => {
    return () => {
      setExpanded(false);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <>
      {/* Background Blur/Dim - now Pressable to collapse basket */}
      {expanded && (
        <Pressable style={styles.blurOverlay} pointerEvents="auto" onPress={handleCollapse} />
      )}
      {/* Add-to-basket fly image */}
      {showFlyImage && flyImageUri && (
        <Animated.Image
          source={{ uri: flyImageUri }}
          style={{
            position: 'absolute',
            left: 20,
            bottom: 80,
            width: 40,
            height: 40,
            borderRadius: 8,
            zIndex: 200,
            transform: flyAnim.getTranslateTransform(),
          }}
        />
      )}
      {/* Outer Animated.View for height only (JS driver) */}
      <Animated.View style={[styles.container, { height: containerHeight }]}> 
        {/* Basket Handle - black, semi-circle, full width, now animated */}
        <Animated.View
          style={[
            styles.basketHandleContainer,
            {
              transform: [{
                translateX: shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] })
              }],
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.basketHandle} />
        </Animated.View>
        {/* Inner Animated.View for shake only (native driver) */}
        <Animated.View style={{ flex: 1, transform: [{
          translateX: shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] })
        }] }}>
          {/* Basket grid background */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {/* Main grid: straight lines */}
            {/* Vertical lines */}
            {Array.from({ length: 12 }).map((_, i) => (
              <View
                key={`v-${i}`}
                style={{
                  position: 'absolute',
                  left: `${(i / 11) * 100}%`,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  backgroundColor: 'rgba(255,255,255,0.18)',
                }}
              />
            ))}
            {/* Horizontal lines */}
            {Array.from({ length: 8 }).map((_, i) => (
              <View
                key={`h-${i}`}
                style={{
                  position: 'absolute',
                  top: `${(i / 7) * 100}%`,
                  left: 0,
                  right: 0,
                  height: 2,
                  backgroundColor: 'rgba(255,255,255,0.18)',
                }}
              />
            ))}

            {/* Overlay grid: extra straight horizontal and vertical lines for woven effect */}
            {/* Extra vertical lines (overlay) */}
            {Array.from({ length: 8 }).map((_, i) => (
              <View
                key={`overlay-v-${i}`}
                style={{
                  position: 'absolute',
                  left: `${(i / 7) * 100}%`,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  backgroundColor: 'rgba(255,255,255,0.28)',
                  zIndex: 999,
                }}
              />
            ))}
            {/* Extra horizontal lines (overlay) */}
            {Array.from({ length: 5 }).map((_, i) => (
              <View
                key={`overlay-h-${i}`}
                style={{
                  position: 'absolute',
                  top: `${(i / 4) * 100}%`,
                  left: 0,
                  right: 0,
                  height: 1,
                  backgroundColor: 'rgba(255,255,255,0.28)',
                  zIndex: 999,
                }}
              />
            ))}
          </View>
          {expanded && (
            <View style={styles.progressBarContainer}>
              <Animated.View style={[
                styles.progressBar,
                { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), height: 18, zIndex: 1 }
              ]} />
              <Animated.Text
                style={[
                  styles.progressText,
                  {
                    color: progressAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [Colors.primary, Colors.primary, '#fff'],
                    }),
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    zIndex: 2,
                    fontWeight: 'bold',
                    fontSize: 12,
                  },
                ]}
              >
                {totalItems} / {FREE_DELIVERY_COUNT} for Free Delivery
              </Animated.Text>
            </View>
          )}
          {!expanded && (
            <Animated.View style={{ opacity: collapsedOpacity }}>
              <View style={styles.row}>
                <FlatList
                  horizontal
                  data={items}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <View style={styles.itemRow}>
                      <Image source={{ uri: item.yield.image }} style={styles.itemImage} />
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.quantity}</Text>
                      </View>
                    </View>
                  )}
                  showsHorizontalScrollIndicator={false}
                />
                <TouchableOpacity style={styles.viewBasket} onPress={handleExpand}>
                  <Text style={styles.viewBasketText}>View Basket</Text>
                  <Animated.View style={{ transform: [{ scale: badgeScale }] }}>
                    <ShoppingBag size={24} color={Colors.primary} />
                    <View style={styles.iconBadge}>
                      <Text style={styles.iconBadgeText}>{totalItems}</Text>
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
                  keyExtractor={item => item.id}
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
                      <Image source={{ uri: item.yield.image }} style={styles.expandedItemImage} />
                      <View style={styles.expandedItemInfo}>
                        <Text style={styles.expandedItemTitle}>{item.yield.title}</Text>
                        <Text style={styles.expandedItemDesc}>{item.yield.description}</Text>
                      </View>
                      <View style={styles.quantityControls}>
                        <Pressable onPress={() => handleQuantity(item.id, -1)}>
                          <Minus size={20} color={Colors.primary} />
                        </Pressable>
                        <Text style={styles.quantityText}>{item.quantity}</Text>
                        <Pressable onPress={() => handleQuantity(item.id, 1)}>
                          <Plus size={20} color={Colors.primary} />
                        </Pressable>
                      </View>
                      <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginLeft: 8 }}>
                        <Trash2 size={24} color={Colors.error} />
                      </TouchableOpacity>
                    </Animated.View>
                  )}
                />
                <View style={[styles.bottomRow, { justifyContent: 'center' }]}> 
                  <TouchableOpacity 
                    style={[styles.goToCartButton, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minWidth: 180 }]} 
                    onPress={onGoToCart}
                  >
                    <ShoppingBag size={22} color={'#fff'} style={{ marginRight: 8 }} />
                    <Text style={styles.goToCartText}>
                      Go to Cart <Text style={{ fontWeight: 'normal' }}>({totalAmount} FCFA)</Text>
                    </Text>
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
    backgroundColor: '#1fd656',
    // backgroundColor: '#56c596',
    // backgroundColor: '#56c596',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 10,
    padding: 10,
    zIndex: 100,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
    zIndex: 99,
  },
  progressBarContainer: {
    height: 'auto',
    backgroundColor: Colors.card,
    borderRadius: 8,
    marginBottom: 6,
    justifyContent: 'center',
  },
  progressBar: {
    position: 'relative',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  progressText: {
    alignSelf: 'center',
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 10,
    zIndex: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemRow: {
    marginRight: 12,
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 8,
    position: 'relative',
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
    minWidth: 16,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewBasket: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  viewBasketText: {
    fontWeight: 'bold',
    marginRight: 6,
    color: Colors.primary,
  },
  iconBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.secondary,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
    minWidth: 16,
    alignItems: 'center',
  },
  iconBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  expandedContent: {
    flex: 1,
  },
  expandedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 8,
  },
  expandedItemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 8,
  },
  expandedItemInfo: {
    flex: 1,
    marginLeft: 8,
  },
  expandedItemTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: Colors.primary,
  },
  expandedItemDesc: {
    color: Colors.text.secondary,
    fontSize: 13,
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  quantityText: {
    marginHorizontal: 8,
    fontWeight: 'bold',
    fontSize: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  goToCartButton: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 8,
  },
  goToCartText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  totalAmount: {
    fontWeight: 'bold',
    fontSize: 18,
    color: Colors.primary,
  },
  basketHandleContainer: {
    position: 'absolute',
    top: -32,
    left: 0,
    right: 0,
    height: 32,
    alignItems: 'center',
    zIndex: 101,
    width: '100%',
    justifyContent: 'flex-start',
  },
  basketHandle: {
    width: 80,
    height: 40,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 5,
    borderColor: '#111', // black border for holo effect
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    alignSelf: 'center',
  },
});
