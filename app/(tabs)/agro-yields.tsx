import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TextInput, Text, ScrollView, Pressable } from 'react-native';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react-native';
import YieldCard from '@/components/YieldCard';
import { agroYields } from '@/mocks/data';
import { AgroYield } from '@/types';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import Basket from '@/components/basket';

const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Tubers & Roots', 'Grains', 'Livestock'];

export default function AgroYieldsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const filteredYields = agroYields.filter((item) => {
    const catName = typeof item.category === 'object' ? item.category?.name : (item.category || '');
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      catName.toLowerCase().includes(searchQuery.toLowerCase());
    
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
      {/* Search Bar with 10px radius */}
      <View style={styles.searchWrapper}>
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
          {CATEGORIES.map((cat) => {
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

      {filteredYields.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No harvests found</Text>
          <Text style={styles.emptySubtext}>
            Try searching for plantains, Ndolé greens, cassava, or tomatoes
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredYields}
          renderItem={renderYieldItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingBottom: 90, paddingTop: 6 }}
          showsVerticalScrollIndicator={false}
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
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontFamily: Fonts.displayItalic,
    fontSize: 20,
    color: Colors.espresso,
    marginBottom: 6,
  },
  emptySubtext: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});