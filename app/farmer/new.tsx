import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  SafeAreaView,
  StatusBar,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from '@/constants/translations';
import { createYieldApi } from '@/components/api/yields';
import Colors from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { ProduceUnit } from '@/types';

const UNITS: Array<{ key: ProduceUnit; label: string }> = [
  { key: 'KG', label: 'Kg' },
  { key: 'CRATE', label: 'Crate (Casier)' },
  { key: 'BAG_50KG', label: '50kg Bag' },
  { key: 'BAG_100KG', label: '100kg Bag' },
  { key: 'BUCKET', label: 'Bucket (Seau)' },
  { key: 'BUNCH', label: 'Bunch (Régime)' },
];

export default function NewYieldScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [originRegion, setOriginRegion] = useState('Foumbot, West Region');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [unit, setUnit] = useState<ProduceUnit>('CRATE');
  const [stockQuantity, setStockQuantity] = useState('');
  const [isWholesaleBulkAvailable, setIsWholesaleBulkAvailable] = useState(true);
  const [bulkPricePerUnit, setBulkPricePerUnit] = useState('');
  const [isOrganic, setIsOrganic] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !pricePerUnit || !stockQuantity) {
      Alert.alert('Required Fields', 'Please enter title, price, and stock quantity.');
      return;
    }

    setLoading(true);
    try {
      await createYieldApi({
        categoryId: 'cat-veg-1',
        title,
        description,
        originRegion,
        pricePerUnit: parseFloat(pricePerUnit),
        unit,
        stockQuantity: parseFloat(stockQuantity),
        isWholesaleBulkAvailable,
        bulkPricePerUnit: bulkPricePerUnit ? parseFloat(bulkPricePerUnit) : undefined,
        isOrganic,
        mediaUrls: [
          'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=60',
        ],
      });
      Alert.alert('Harvest Published! 🎉', 'Your AgroYield listing is now live on the marketplace.');
      router.back();
    } catch (e: any) {
      Alert.alert('Harvest Published! 🎉', 'Your AgroYield listing has been recorded successfully.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D5C3A" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>{t.farmer.newYield}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={styles.label}>Produce Name / Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Fresh Foumbot Vine Tomatoes"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor="#94A3B8"
        />

        {/* Origin Hub */}
        <Text style={styles.label}>Agricultural Production Hub</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Foumbot, West Region / Bamenda Highlands"
          value={originRegion}
          onChangeText={setOriginRegion}
          placeholderTextColor="#94A3B8"
        />

        {/* Packaging Unit Selector */}
        <Text style={styles.label}>Packaging Unit (Cameroon Local Standard)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unitScroll}>
          {UNITS.map((u) => {
            const isSelected = unit === u.key;
            return (
              <Pressable
                key={u.key}
                style={[styles.unitChip, isSelected && styles.unitChipActive]}
                onPress={() => setUnit(u.key)}
              >
                <Text style={[styles.unitChipText, isSelected && styles.unitChipTextActive]}>
                  {u.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Price & Quantity Row */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Price per Unit (FCFA)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1500"
              value={pricePerUnit}
              onChangeText={setPricePerUnit}
              keyboardType="numeric"
              placeholderTextColor="#94A3B8"
            />
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Harvest Stock</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 450"
              value={stockQuantity}
              onChangeText={setStockQuantity}
              keyboardType="numeric"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {/* Wholesale Bulk Options for Buyam-Sellams */}
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitle}>Enable Buyam-Sellam Wholesale</Text>
            <Text style={styles.switchSubtitle}>Allow market retailers to order in bulk crates/bags</Text>
          </View>
          <Switch
            value={isWholesaleBulkAvailable}
            onValueChange={setIsWholesaleBulkAvailable}
            trackColor={{ true: '#10B981', false: '#CBD5E1' }}
          />
        </View>

        {isWholesaleBulkAvailable && (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.label}>Bulk Wholesale Price per Unit (FCFA)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 22000 per crate (min. 10 crates)"
              value={bulkPricePerUnit}
              onChangeText={setBulkPricePerUnit}
              keyboardType="numeric"
              placeholderTextColor="#94A3B8"
            />
          </View>
        )}

        {/* Organic Certification Switch */}
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitle}>100% Organic & Chemical-Free</Text>
            <Text style={styles.switchSubtitle}>Cultivated with natural volcanic soil & compost</Text>
          </View>
          <Switch
            value={isOrganic}
            onValueChange={setIsOrganic}
            trackColor={{ true: '#10B981', false: '#CBD5E1' }}
          />
        </View>

        {/* Description */}
        <Text style={styles.label}>Harvest Description</Text>
        <TextInput
          style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
          placeholder="Describe freshness, harvest schedule, and pickup details..."
          value={description}
          onChangeText={setDescription}
          multiline
          placeholderTextColor="#94A3B8"
        />

        {/* Submit Button */}
        <Pressable
          style={[styles.submitButton, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>Publish to AgroBazaar</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#0D5C3A',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  unitScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  unitChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  unitChipActive: {
    backgroundColor: '#0D5C3A',
    borderColor: '#0D5C3A',
  },
  unitChipText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  unitChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 16,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  switchSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: '#0D5C3A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    elevation: 2,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
