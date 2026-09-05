import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MapPin, ShieldCheck, Star, Sprout, ChevronRight, Layers } from 'lucide-react-native';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { Farm } from '@/types';
import { useRouter } from 'expo-router';

interface FarmCardProps {
  farm: Farm;
  onPress?: () => void;
  showManageButton?: boolean;
}

export default function FarmCard({
  farm,
  onPress,
  showManageButton = false,
}: FarmCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/farmer/${farm.id}` as any);
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category?.toUpperCase()) {
      case 'CROPS':
        return { bg: '#eef8f1', text: Colors.cultivated, label: '🌱 Crops & Vegetables' };
      case 'POULTRY':
        return { bg: '#fef7ee', text: Colors.gold, label: '🐔 Poultry & Eggs' };
      case 'LIVESTOCK':
        return { bg: '#fdf2f2', text: Colors.clay, label: '🐄 Livestock & Cattle' };
      case 'AQUACULTURE':
        return { bg: '#f0f9ff', text: '#0284c7', label: '🐟 Aquaculture & Fish' };
      case 'GREENHOUSE':
        return { bg: '#f5f3ff', text: '#7c3aed', label: '🏡 Greenhouse' };
      default:
        return { bg: '#f4f4f5', text: Colors.espresso, label: '🌾 Mixed Farming' };
    }
  };

  const catStyle = getCategoryColor(farm.category);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`View ${farm.name}`}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={{
            uri:
              farm.coverPhoto ||
              'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80',
          }}
          style={styles.coverImage}
        />
        <View style={[styles.categoryBadge, { backgroundColor: catStyle.bg }]}>
          <Text style={[styles.categoryBadgeText, { color: catStyle.text }]}>
            {catStyle.label}
          </Text>
        </View>

        {farm.isVerified && (
          <View style={styles.verifiedBadge}>
            <ShieldCheck size={14} color={Colors.white} strokeWidth={2.5} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.farmName} numberOfLines={1}>
            {farm.name}
          </Text>
          <View style={styles.ratingBox}>
            <Star size={13} color={Colors.gold} fill={Colors.gold} />
            <Text style={styles.ratingText}>{farm.rating?.toFixed(1) || '4.9'}</Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <MapPin size={13} color={Colors.text.secondary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {farm.city}, {farm.region}
          </Text>
        </View>

        {farm.primaryProduce && farm.primaryProduce.length > 0 && (
          <View style={styles.tagsRow}>
            {farm.primaryProduce.slice(0, 3).map((item, idx) => (
              <View key={idx} style={styles.produceTag}>
                <Text style={styles.produceTagText}>{item}</Text>
              </View>
            ))}
            {farm.primaryProduce.length > 3 && (
              <View style={[styles.produceTag, styles.moreTag]}>
                <Text style={styles.moreTagText}>+{farm.primaryProduce.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.footerRow}>
          <View style={styles.sizeInfo}>
            <Layers size={13} color={Colors.soil} />
            <Text style={styles.sizeText}>
              {farm.sizeHectares ? `${farm.sizeHectares} Hectares` : 'Family Farm'}
            </Text>
          </View>

          {showManageButton ? (
            <TouchableOpacity
              style={styles.manageBtn}
              onPress={() => router.push('/farmer/manage')}
            >
              <Text style={styles.manageBtnText}>Manage</Text>
              <ChevronRight size={14} color={Colors.cultivated} />
            </TouchableOpacity>
          ) : (
            <View style={styles.viewLink}>
              <Text style={styles.viewLinkText}>View Farm</Text>
              <ChevronRight size={14} color={Colors.cultivated} />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    overflow: 'hidden',
    marginBottom: 14,
    ...Shadows.subtle,
  },
  imageWrapper: {
    height: 130,
    position: 'relative',
    backgroundColor: Colors.parchment,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radii.pill,
  },
  categoryBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10.5,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.canopy,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radii.pill,
  },
  verifiedText: {
    fontFamily: Fonts.mono,
    fontSize: 10.5,
    color: Colors.white,
  },
  contentContainer: {
    padding: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  farmName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.espresso,
    flex: 1,
    marginRight: 8,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontFamily: Fonts.monoBold,
    fontSize: 12,
    color: Colors.espresso,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  produceTag: {
    backgroundColor: Colors.parchment,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: Radii.chip,
  },
  produceTagText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.espresso,
  },
  moreTag: {
    backgroundColor: Colors.parchmentDim,
  },
  moreTagText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10.5,
    color: Colors.text.secondary,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.parchmentDim,
  },
  sizeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sizeText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11.5,
    color: Colors.soil,
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  manageBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.cultivated,
  },
  viewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewLinkText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.cultivated,
  },
});
