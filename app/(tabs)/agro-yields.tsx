import { useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Sparkles } from 'lucide-react-native';
import YieldCard from '@/components/YieldCard';
import { fetchYieldsApi, fetchCategoriesApi } from '@/components/api/yields';
import { AgroYield, Category } from '@/types';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import Basket from '@/components/basket';

const STATIC_CATEGORIES = ['All', 'Vegetables', 'Tubers & Roots', 'Poultry & Eggs', 'Fruits', 'Spices & Herbs'];

export default function AgroYieldsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [yieldsList, setYieldsList] = useState<AgroYield[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<string[]>(STATIC_CATEGORIES);

  const loadData = async () => {
    try {
      const [data, cats] = await Promise.all([
        fetchYieldsApi(),
        fetchCategoriesApi().catch(() => []),
      ]);
      if (data && Array.isArray(data)) {
        setYieldsList(data);
      }
      if (cats && cats.length > 0) {
        const catNames = ['All', ...cats.map((c: any) => c.name)];
        setCategories(Array.from(new Set(catNames)));
      }
    } catch (err) {
      console.warn('Failed to fetch marketplace yields:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredYields = yieldsList.filter((item) => {
    const catName = typeof item.category === 'object' ? item.category?.name : (item.category || '');
    const farmName = item.farm?.name || item.farmerName || '';
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      catName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.originRegion && item.originRegion.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'All' ||
      catName.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      item.title.toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const renderYieldItem = ({ item }: { item: AgroYield }) => (
    <YieldCard
      item={item}
      popoverVisible={openPopoverId === item.id}
      onOpenPopover={() => setOpenPopoverId(item.id)}
      onClosePopover={() => setOpenPopoverId(null)}
    />
  );

  const handleGoToCart = () => {
    router.push('/cart');
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={[styles.searchWrapper, { paddingTop: Math.max(insets.top + 4, 12) }]}>
        <View style={styles.searchContainer}>
          <Search size={18} color={Colors.text.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search crops, farms, Foumbot tomatoes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.text.muted}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchText}>Clear</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Category Filter Chips */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                style={[
                  styles.chip,
                  isSelected && styles.chipActive,
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading && yieldsList.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.cultivated} />
          <Text style={styles.loadingText}>Loading direct farm harvests...</Text>
        </View>
      ) : filteredYields.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.cultivated} />}
        >
          <Sparkles size={40} color={Colors.gold} strokeWidth={1.6} />
          <Text style={styles.emptyText}>No harvests found</Text>
          <Text style={styles.emptySubtext}>
            Try searching for fresh tomatoes, Irish potatoes, table eggs, or Penja pepper.
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          data={filteredYields}
          renderItem={renderYieldItem}
          keyExtractor={(item, index) => item.id || `yield-${index}`}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 90, 100), paddingTop: 6 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.cultivated} />
          }
        />
      )}

      <Basket onGoToCart={handleGoToCart} />
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radii.input,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1.5,
    borderColor: Colors.parchmentDim,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.espresso,
    height: '100%',
  },
  clearSearchText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.soil,
  },
  categoryContainer: {
    marginBottom: 8,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: Radii.chip,
    backgroundColor: Colors.parchment,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  chipActive: {
    backgroundColor: Colors.canopy,
    borderColor: Colors.canopy,
  },
  chipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.espresso,
  },
  chipTextActive: {
    fontFamily: Fonts.bodyBold,
    color: Colors.parchment,
  },
  emptyContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  emptyText: {
    fontFamily: Fonts.displayItalic,
    fontSize: 20,
    color: Colors.espresso,
    marginTop: 8,
  },
  emptySubtext: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
;