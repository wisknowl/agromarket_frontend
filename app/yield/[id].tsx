import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Heart, MessageCircle, Share2, ShoppingCart } from 'lucide-react-native';
import { agroYields, farmers } from '@/mocks/data';
import { useCartStore } from '@/store/cartStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import Colors from '@/constants/colors';

export default function YieldDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart } = useCartStore();
  const { addYield, removeYield, isYieldFavorite } = useFavoritesStore();
  
  const yieldItem = agroYields.find(item => item.id === id);
  const farmer = farmers.find(f => f.id === yieldItem?.farmerId);
  
  const isFavorite = isYieldFavorite(id as string);

  if (!yieldItem || !farmer) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Product not found</Text>
      </View>
    );
  }

  const handleAddToCart = () => {
    addToCart(yieldItem, 1);
  };

  const toggleFavorite = () => {
    if (isFavorite) {
      removeYield(id as string);
    } else {
      addYield(id as string);
    }
  };

  const handleContactFarmer = () => {
    // Navigate to chat with this farmer
    router.push(`/chat/${farmer.id}`);
  };

  const handleViewFarmer = () => {
    router.push(`/farmer/${farmer.id}`);
  };

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: yieldItem.image }} style={styles.image} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{yieldItem.title}</Text>
          <Pressable onPress={toggleFavorite} style={styles.favoriteButton}>
            <Heart 
              size={24} 
              color={isFavorite ? Colors.error : Colors.text.secondary} 
              fill={isFavorite ? Colors.error : 'none'} 
            />
          </Pressable>
        </View>
        
        <Text style={styles.price}>{yieldItem.price} FCFA/{yieldItem.unit}</Text>
        <Text style={styles.category}>
          {typeof yieldItem.category === 'object' ? yieldItem.category?.name : (yieldItem.category || 'Fresh Produce')}
        </Text>
        
        <View style={styles.divider} />
        
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{yieldItem.description}</Text>
        
        <View style={styles.divider} />
        
        <Text style={styles.sectionTitle}>Farmer</Text>
        <Pressable style={styles.farmerContainer} onPress={handleViewFarmer}>
          <Image source={{ uri: farmer.profilePhoto }} style={styles.farmerImage} />
          <View style={styles.farmerInfo}>
            <Text style={styles.farmerName}>{farmer.farmName}</Text>
            <Text style={styles.farmerLocation}>{farmer.location}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>★ {farmer.rating.toFixed(1)}</Text>
              <Text style={styles.followers}>{farmer.followers} followers</Text>
            </View>
          </View>
        </Pressable>
      </View>
      
      <View style={styles.actions}>
        <Pressable style={styles.contactButton} onPress={handleContactFarmer}>
          <MessageCircle size={20} color={Colors.primary} />
          <Text style={styles.contactButtonText}>Contact</Text>
        </Pressable>
        
        <Pressable style={styles.addToCartButton} onPress={handleAddToCart}>
          <ShoppingCart size={20} color={Colors.text.light} />
          <Text style={styles.addToCartButtonText}>Add to Cart</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  favoriteButton: {
    padding: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  category: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 24,
  },
  farmerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  farmerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  farmerInfo: {
    flex: 1,
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  farmerLocation: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
    marginRight: 12,
  },
  followers: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingVertical: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  addToCartButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginLeft: 8,
  },
  addToCartButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.light,
    marginLeft: 8,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
});