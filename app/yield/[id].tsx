import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Heart,
  MessageCircle,
  Share2,
  ShoppingBag,
  ArrowLeft,
  MapPin,
  ShieldCheck,
  Sparkles,
  Layers,
  ChevronRight,
  Plus,
  Minus,
  Star,
  Check,
  Store,
  Handshake,
  Award,
  Percent,
} from 'lucide-react-native';
import { fetchYieldByIdApi } from '@/components/api/yields';
import { fetchPartnerStatusApi, requestPartnerApi } from '@/modules/farms/api';
import { useLocale } from '@/context/LocaleContext';
import { useCartStore } from '@/store/cartStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import { Yield } from '@/types';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import BrandButton from '@/components/ui/BrandButton';
import Basket from '@/components/basket';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function YieldDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addToCart } = useCartStore();
  const { addYield, removeYield, isYieldFavorite } = useFavoritesStore();
  const { currentRegion } = useLocale();

  const [yieldItem, setYieldItem] = useState<Yield | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [isAgroPartner, setIsAgroPartner] = useState(false);

  const isFavorite = id ? isYieldFavorite(id) : false;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchYieldByIdApi(id)
      .then(async (data) => {
        setYieldItem(data);
        if (data.minOrderQuantity && data.minOrderQuantity > 1) {
          setQuantity(data.minOrderQuantity);
        }
        const farmerUserId = data?.farm?.userId || data?.farmer?.userId;
        if (farmerUserId) {
          const pStatus = await fetchPartnerStatusApi(farmerUserId);
          setIsAgroPartner(pStatus.isPartner);
        }
      })
      .catch((err) => {
        console.error('Failed to load produce details:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleTogglePartner = async () => {
    const farmerUserId = yieldItem?.farm?.userId || yieldItem?.farmer?.userId;
    if (!farmerUserId) return;
    try {
      const res = await requestPartnerApi(farmerUserId);
      setIsAgroPartner(res.isMutual);
      if (res.isMutual) {
        Alert.alert('AgroPartner Active! 🤝', 'Mutual partnership established! 20% wholesale discount is now applied to this produce.');
      } else {
        Alert.alert('Partner Request Sent! 🤝', 'Request sent to farmer. Wholesale rates will activate upon mutual confirmation.');
      }
    } catch {
      setIsAgroPartner(true);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={Colors.cultivated} />
        <Text style={styles.loadingText}>Loading harvest details...</Text>
      </View>
    );
  }

  if (!yieldItem) {
    return (
      <View style={styles.notFoundContainer}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.notFoundTitle}>Harvest Lot Not Found</Text>
        <Text style={styles.notFoundSub}>
          This produce may have been sold out or unlisted by the farmer.
        </Text>
        <BrandButton
          title="Return to Marketplace"
          variant="primary"
          size="md"
          onPress={() => router.back()}
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  const farm = yieldItem.farm;
  const farmer = yieldItem.farmer;
  const unitPrice = yieldItem.price || yieldItem.pricePerUnit || 0;
  const totalPrice = unitPrice * quantity;

  const mediaList =
    yieldItem.mediaUrls && yieldItem.mediaUrls.length > 0
      ? yieldItem.mediaUrls
      : yieldItem.image
        ? [yieldItem.image]
        : ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800'];

  const categoryName =
    typeof yieldItem.category === 'object'
      ? yieldItem.category?.name
      : yieldItem.category || 'Fresh Harvest';

  const toggleFavorite = () => {
    if (isFavorite) {
      removeYield(yieldItem.id);
    } else {
      addYield(yieldItem.id);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🌱 Check out ${yieldItem.title} on AgroMarket: ${unitPrice.toLocaleString()} FCFA/${yieldItem.unit} direct from ${farm?.name || 'verified cooperative'}!`,
        title: yieldItem.title,
      });
    } catch { }
  };

  const handleQuantityDelta = (delta: number) => {
    const next = quantity + delta;
    const minQty = yieldItem.minOrderQuantity || 1;
    if (next >= minQty) {
      setQuantity(next);
    }
  };

  const handleAddToCart = () => {
    addToCart(yieldItem, quantity);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  const handleViewFarm = () => {
    if (farm?.id) {
      router.push(`/farmer/${farm.id}`);
    } else if (farmer?.id) {
      router.push(`/farmer/${farmer.id}`);
    }
  };

  const handleContactFarmer = () => {
    const targetId = farm?.userId || farmer?.userId || farmer?.id;
    if (targetId) {
      router.push(`/chat/${targetId}`);
    } else {
      Alert.alert('Contact Farmer', 'Connecting to cooperative dispatch...');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Main Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 110, 130) }}
      >
        {/* Top Hero Banner & Media Carousel */}
        <View style={styles.heroContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const slide = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveMediaIndex(slide);
            }}
            scrollEventThrottle={16}
          >
            {mediaList.map((url, idx) => (
              <Image key={idx} source={{ uri: url }} style={styles.heroImage} resizeMode="cover" />
            ))}
          </ScrollView>

          {/* Vignette Overlay */}
          <View style={styles.heroOverlay} pointerEvents="none" />

          {/* Floating Top Header Buttons */}
          <View style={[styles.floatingHeader, { top: Math.max(insets.top + 8, 20) }]}>
            <TouchableOpacity style={styles.glassBtn} onPress={() => router.back()} activeOpacity={0.8}>
              <ArrowLeft size={22} color="#FFF" strokeWidth={2.5} />
            </TouchableOpacity>

            <View style={styles.headerRightActions}>
              <TouchableOpacity style={styles.glassBtn} onPress={handleShare} activeOpacity={0.8}>
                <Share2 size={20} color="#FFF" strokeWidth={2.2} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.glassBtn} onPress={toggleFavorite} activeOpacity={0.8}>
                <Heart
                  size={22}
                  color={isFavorite ? Colors.clay : '#FFF'}
                  fill={isFavorite ? Colors.clay : 'none'}
                  strokeWidth={2.2}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Media Pagination Dots */}
          {mediaList.length > 1 && (
            <View style={styles.paginationRow}>
              {mediaList.map((_, idx) => (
                <View
                  key={idx}
                  style={[styles.paginationDot, idx === activeMediaIndex && styles.paginationDotActive]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Content Card Body */}
        <View style={styles.bodyCard}>
          {/* Category & Freshness Badges */}
          <View style={styles.badgesRow}>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{categoryName}</Text>
            </View>
            {yieldItem.isOrganic && (
              <View style={styles.organicChip}>
                <Sparkles size={12} color={Colors.cultivated} />
                <Text style={styles.organicChipText}>100% Volcanic Organic</Text>
              </View>
            )}
            <View style={styles.verifiedChip}>
              <ShieldCheck size={12} color={Colors.gold} />
              <Text style={styles.verifiedChipText}>Escrow Protected</Text>
            </View>
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.produceTitle}>{yieldItem.title}</Text>
          {yieldItem.frenchTitle && (
            <Text style={styles.produceFrenchTitle}>{yieldItem.frenchTitle}</Text>
          )}

          {/* Location / Region Tag */}
          <View style={styles.locationRow}>
            <MapPin size={15} color={Colors.soil} />
            <Text style={styles.locationText}>
              {yieldItem.originRegion || `${farm?.city || 'Foumbot'}, ${farm?.region || 'West Region'}`}
            </Text>
          </View>

          {/* Pricing Block */}
          <View style={styles.priceContainer}>
            <View>
              <Text style={styles.priceLabel}>Retail Rate</Text>
              <View style={styles.priceValueRow}>
                <Text style={styles.priceAmount}>{unitPrice.toLocaleString()}</Text>
                <Text style={styles.priceUnit}>{currentRegion.currency} / {yieldItem.unit}</Text>
              </View>
            </View>
            {yieldItem.oldPrice && (
              <View style={styles.oldPriceBox}>
                <Text style={styles.oldPriceText}>{yieldItem.oldPrice.toLocaleString()} {currentRegion.currency}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    -{Math.round(((yieldItem.oldPrice - unitPrice) / yieldItem.oldPrice) * 100)}%
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Engine 4 Mutual AgroPartner Wholesale Pricing Card */}
          <View style={[styles.partnerPricingCard, isAgroPartner && styles.partnerPricingCardActive]}>
            <View style={styles.partnerPricingHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Handshake size={16} color={isAgroPartner ? Colors.gold : Colors.canopy} strokeWidth={2.2} />
                <Text style={styles.partnerPricingTitle}>
                  {isAgroPartner ? 'Mutual AgroPartner Rate (-20% Active)' : 'AgroPartner Wholesale Tier'}
                </Text>
              </View>
              <View style={[styles.partnerDiscountPill, isAgroPartner && { backgroundColor: Colors.gold }]}>
                <Text style={[styles.partnerDiscountPillText, isAgroPartner && { color: Colors.espresso }]}>
                  -20% OFF
                </Text>
              </View>
            </View>

            <View style={styles.partnerPriceRow}>
              <Text style={styles.partnerPriceNumber}>
                {Math.round(unitPrice * 0.8).toLocaleString()}
              </Text>
              <Text style={styles.partnerPriceUnit}>{currentRegion.currency} / {yieldItem.unit}</Text>
              {!isAgroPartner && (
                <TouchableOpacity
                  style={styles.partnerApplyBtn}
                  onPress={handleTogglePartner}
                  activeOpacity={0.8}
                >
                  <Text style={styles.partnerApplyBtnText}>Unlock 20%</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Wholesale Bulk Pricing Card */}
          {yieldItem.isWholesaleBulkAvailable && yieldItem.bulkPricePerUnit && (
            <View style={styles.wholesaleCard}>
              <View style={styles.wholesaleHeader}>
                <Layers size={18} color={Colors.cultivated} />
                <Text style={styles.wholesaleTitle}>Bulk Volume Tier</Text>
              </View>
              <Text style={styles.wholesaleText}>
                Order <Text style={{ fontFamily: Fonts.bodyBold }}>{yieldItem.bulkMinQuantity || 10}+ {yieldItem.unit}s</Text> at discount rate of{' '}
                <Text style={{ fontFamily: Fonts.monoBold, color: Colors.cultivated }}>
                  {yieldItem.bulkPricePerUnit.toLocaleString()} {currentRegion.currency} / {yieldItem.unit}
                </Text>
              </Text>
            </View>
          )}

          {/* Stock Availability Info */}
          <View style={styles.stockInfoRow}>
            <View style={styles.stockDot} />
            <Text style={styles.stockText}>
              <Text style={{ fontFamily: Fonts.bodyBold }}>{yieldItem.stockQuantity || 'Fresh in harvest'}</Text>{' '}
              {yieldItem.unit}s available on farm today
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Description Section */}
          <Text style={styles.sectionHeading}>Harvest Description & Soil Notes</Text>
          <Text style={styles.descriptionText}>
            {yieldItem.description ||
              'Freshly harvested directly from volcanic fertile soils. Handpicked and graded for direct delivery with guaranteed quality and optimal shelf-life.'}
          </Text>

          <View style={styles.divider} />

          {/* Farmer & Cooperative Source Card */}
          <Text style={styles.sectionHeading}>Producer & Farm Origin</Text>
          <TouchableOpacity style={styles.farmSourceCard} onPress={handleViewFarm} activeOpacity={0.85}>
            <Image
              source={{
                uri:
                  farm?.coverPhoto ||
                  farm?.avatarPhoto ||
                  farmer?.coverPhoto ||
                  'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=500',
              }}
              style={styles.farmAvatar}
            />
            <View style={styles.farmInfoCol}>
              <View style={styles.farmNameRow}>
                <Text style={styles.farmNameText} numberOfLines={1}>
                  {farm?.name || farmer?.farmName || 'Verified Cameroon Agro Cooperative'}
                </Text>
                <ShieldCheck size={16} color={Colors.cultivated} />
              </View>
              <Text style={styles.farmLocationText}>
                {farm?.city || farmer?.city || 'Foumbot'}, {farm?.region || farmer?.region || 'West Region'}
              </Text>
              <View style={styles.farmRatingRow}>
                <Star size={13} color={Colors.gold} fill={Colors.gold} />
                <Text style={styles.farmRatingNumber}>{(farm?.rating || 4.9).toFixed(1)}</Text>
                <Text style={styles.farmRatingCount}>({farm?.totalRatings || 142} ratings)</Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.text.muted} />
          </TouchableOpacity>

          {/* Quick Action Contact Button */}
          <View style={styles.farmActionsRow}>
            <TouchableOpacity style={styles.contactFarmerBtn} onPress={handleContactFarmer} activeOpacity={0.8}>
              <MessageCircle size={16} color={Colors.espresso} />
              <Text style={styles.contactFarmerBtnText}>Direct Chat with Farmer</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.visitFarmBtn} onPress={handleViewFarm} activeOpacity={0.8}>
              <Store size={16} color={Colors.cultivated} />
              <Text style={styles.visitFarmBtnText}>Visit Farm Page</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ========================================================= */}
      {/* SOLID BOTTOM PURCHASE BAR (NO TRANSPARENCY OVERFLOW)       */}
      {/* ========================================================= */}
      <View style={[styles.bottomStickyBar, { paddingBottom: Math.max(insets.bottom + 8, 14) }]}>
        {/* Quantity Controls */}
        <View style={styles.quantityControlsWrapper}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => handleQuantityDelta(-1)}
            activeOpacity={0.7}
          >
            <Minus size={16} color={Colors.espresso} />
          </TouchableOpacity>
          <Text style={styles.quantityValueText}>{quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => handleQuantityDelta(1)}
            activeOpacity={0.7}
          >
            <Plus size={16} color={Colors.espresso} />
          </TouchableOpacity>
        </View>

        {/* Add to Basket Action Button */}
        <TouchableOpacity
          style={[styles.addBasketButton, addedAnimation && styles.addBasketButtonActive]}
          onPress={handleAddToCart}
          activeOpacity={0.85}
        >
          {addedAnimation ? (
            <>
              <Check size={20} color={Colors.white} strokeWidth={2.5} />
              <Text style={styles.addBasketButtonText}>Added to Basket!</Text>
            </>
          ) : (
            <>
              <ShoppingBag size={20} color={Colors.white} strokeWidth={2.2} />
              <View style={styles.addBasketButtonTextCol}>
                <Text style={styles.addBasketButtonText}>Add to Basket</Text>
                <Text style={styles.addBasketSubText}>{totalPrice.toLocaleString()} FCFA</Text>
              </View>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Floating Basket Sheet for instant checkout */}
      <Basket onGoToCart={() => router.push('/cart')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  notFoundContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  notFoundTitle: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: Colors.canopy,
    marginBottom: 8,
  },
  notFoundSub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  heroContainer: {
    width: SCREEN_WIDTH,
    height: 380,
    backgroundColor: Colors.canopyDeep,
    position: 'relative',
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: 380,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(14, 37, 21, 0.25)',
  },
  floatingHeader: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: 10,
  },
  glassBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationRow: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  paginationDotActive: {
    width: 18,
    backgroundColor: Colors.gold,
  },
  bodyCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radii.card,
    borderTopRightRadius: Radii.card,
    marginTop: -24,
    paddingTop: 22,
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    backgroundColor: Colors.parchment,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  categoryChipText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.espresso,
  },
  organicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.2)',
  },
  organicChipText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.cultivated,
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.2)',
  },
  verifiedChipText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.gold,
  },
  produceTitle: {
    fontFamily: Fonts.display,
    fontSize: 24,
    color: Colors.canopy,
    lineHeight: 30,
    marginBottom: 4,
  },
  produceFrenchTitle: {
    fontFamily: Fonts.displayItalic,
    fontSize: 15,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 16,
  },
  locationText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.soil,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.parchment,
    padding: 14,
    borderRadius: Radii.card,
    marginBottom: 14,
  },
  priceLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  priceAmount: {
    fontFamily: Fonts.monoBold,
    fontSize: 24,
    color: Colors.cultivated,
  },
  priceUnit: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.espresso,
  },
  oldPriceBox: {
    alignItems: 'flex-end',
    gap: 2,
  },
  oldPriceText: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.text.muted,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: Colors.clay,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.pill,
  },
  discountText: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    color: Colors.white,
  },
  wholesaleCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: Radii.card,
    padding: 12,
    marginBottom: 14,
  },
  wholesaleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  wholesaleTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.canopy,
  },
  wholesaleText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  stockInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.cultivated,
  },
  stockText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.espresso,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.parchmentDim,
    marginVertical: 14,
  },
  sectionHeading: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.espresso,
    marginBottom: 8,
  },
  descriptionText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 22,
  },
  farmSourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.parchment,
    padding: 12,
    borderRadius: Radii.card,
    gap: 12,
    marginTop: 6,
  },
  farmAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: Colors.gold,
  },
  farmInfoCol: {
    flex: 1,
  },
  farmNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  farmNameText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.espresso,
  },
  farmLocationText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  farmRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  farmRatingNumber: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    color: Colors.espresso,
  },
  farmRatingCount: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.text.muted,
  },
  farmActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  contactFarmerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.parchment,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    paddingVertical: 9,
    borderRadius: Radii.pill,
  },
  contactFarmerBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.espresso,
  },
  visitFarmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(78, 139, 63, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(78, 139, 63, 0.25)',
    paddingVertical: 9,
    borderRadius: Radii.pill,
  },
  visitFarmBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.cultivated,
  },

  // SOLID BOTTOM STICKY PURCHASE BAR
  bottomStickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.parchmentDim,
    paddingTop: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 90,
    ...Shadows.card,
  },
  quantityControlsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.parchment,
    borderRadius: Radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    gap: 10,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  quantityValueText: {
    fontFamily: Fonts.monoBold,
    fontSize: 15,
    color: Colors.espresso,
    minWidth: 20,
    textAlign: 'center',
  },
  addBasketButton: {
    flex: 1,
    backgroundColor: Colors.cultivated,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radii.pill,
    ...Shadows.subtle,
  },
  addBasketButtonActive: {
    backgroundColor: '#15803d',
  },
  addBasketButtonTextCol: {
    alignItems: 'flex-start',
  },
  addBasketButtonText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.white,
  },
  addBasketSubText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
  },

  // Engine 4 Wholesale Styles
  partnerPricingCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: Radii.card,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  partnerPricingCardActive: {
    backgroundColor: Colors.canopy,
    borderColor: Colors.gold,
  },
  partnerPricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partnerPricingTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.espresso,
  },
  partnerDiscountPill: {
    backgroundColor: Colors.cultivated,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radii.pill,
  },
  partnerDiscountPillText: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    color: Colors.white,
  },
  partnerPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  partnerPriceNumber: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: Colors.cultivated,
  },
  partnerPriceUnit: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.text.secondary,
    flex: 1,
  },
  partnerApplyBtn: {
    backgroundColor: Colors.canopy,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  partnerApplyBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.gold,
  },
});