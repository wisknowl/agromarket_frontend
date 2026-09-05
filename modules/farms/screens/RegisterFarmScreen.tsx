import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Sprout,
  Egg,
  Beef,
  Fish,
  Home,
  Layers,
  MapPin,
  ShieldCheck,
  Check,
  Sparkles,
  ChevronRight,
  Upload,
} from 'lucide-react-native';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import BrandButton from '@/components/ui/BrandButton';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Farm, FarmCategory } from '@/types';
import { createFarmApi } from '../api';

const CATEGORIES: Array<{ key: FarmCategory; label: string; icon: any; sub: string }> = [
  { key: 'CROPS', label: 'Crops & Vegetables', icon: Sprout, sub: 'Tomatoes, Maize, Potatoes, Plantains' },
  { key: 'POULTRY', label: 'Poultry & Birds', icon: Egg, sub: 'Broilers, Layers, Organic Eggs' },
  { key: 'LIVESTOCK', label: 'Livestock & Cattle', icon: Beef, sub: 'Cattle, Goats, Sheep, Pigs' },
  { key: 'AQUACULTURE', label: 'Fish & Aquaculture', icon: Fish, sub: 'Tilapia, Catfish, Fingerlings' },
  { key: 'GREENHOUSE', label: 'Greenhouse & Tech', icon: Home, sub: 'Hydroponics, Controlled climate' },
  { key: 'MIXED', label: 'Mixed Farming', icon: Layers, sub: 'Multi-crop & animal integration' },
];

const CAMEROON_REGIONS = [
  'West Region (Foumbot, Bafoussam)',
  'Northwest Region (Bamenda, Santa)',
  'Southwest Region (Buea, Kumba, Penja)',
  'Littoral Region (Douala, Loum, Manjo)',
  'Centre Region (Yaounde, Obala, Mbalmayo)',
  'South Region (Ebolowa, Kribi)',
  'East Region (Bertoua)',
  'Adamawa Region (Ngaoundere)',
  'North Region (Garoua)',
  'Far North Region (Maroua)',
];

const SAMPLE_COVERS = [
  'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&auto=format&fit=crop&q=80',
];

export default function RegisterFarmScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const setActiveFarmId = useUIStore((s) => s.setActiveFarmId);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<FarmCategory>('CROPS');
  const [description, setDescription] = useState('');

  const [region, setRegion] = useState(CAMEROON_REGIONS[0]);
  const [city, setCity] = useState('');
  const [division, setDivision] = useState('');
  const [location, setLocation] = useState('');

  const [sizeHectares, setSizeHectares] = useState('');
  const [produceInput, setProduceInput] = useState('');
  const [produceTags, setProduceTags] = useState<string[]>(['Tomatoes', 'Maize']);
  const [cooperative, setCooperative] = useState('');

  const [coverPhoto, setCoverPhoto] = useState(SAMPLE_COVERS[0]);
  const [isOrganic, setIsOrganic] = useState(true);
  const [isGapCertified, setIsGapCertified] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTag = () => {
    if (produceInput.trim() && !produceTags.includes(produceInput.trim())) {
      setProduceTags([...produceTags, produceInput.trim()]);
      setProduceInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setProduceTags(produceTags.filter((t) => t !== tagToRemove));
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!name.trim()) {
        Alert.alert('Required Field', 'Please enter your farm name.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!city.trim()) {
        Alert.alert('Required Field', 'Please enter your city/town.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const newFarmId = `farm-${Date.now()}`;
    const newFarm: Farm = {
      id: newFarmId,
      userId: user?.id || 'u1',
      name: name.trim(),
      category,
      description: description.trim() || 'Verified farm profile on AgroMarket platform.',
      region: region.split(' (')[0],
      division: division.trim() || 'Noun',
      city: city.trim(),
      location: location.trim() || `${city.trim()}, ${region.split(' (')[0]}`,
      sizeHectares: parseFloat(sizeHectares) || 2.5,
      coverPhoto,
      primaryProduce: produceTags,
      certifications: [
        ...(isOrganic ? ['100% Organic Certified'] : []),
        ...(isGapCertified ? ['Cameroon GAP Approved'] : []),
      ],
      isVerified: true,
      rating: 5.0,
      totalRatings: 1,
      yieldsCount: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      // Attempt live backend persistence
      await createFarmApi(newFarm);
    } catch (err) {
      console.log('Backend sync offline/fallback, saved to local state');
    }

    // Update current user state with new farm
    const existingFarms = user?.farms || [];
    const updatedFarms = [...existingFarms, newFarm];

    updateUser({
      role: 'FARMER',
      isFarmer: true,
      farms: updatedFarms,
      farmerProfile: user?.farmerProfile || {
        id: `f-${Date.now()}`,
        userId: user?.id || 'u1',
        farmName: newFarm.name,
        region: newFarm.region,
        city: newFarm.city,
        rating: 5.0,
        totalRatings: 1,
        totalFollowers: 10,
        creditTier: 'SILVER',
        creditScore: 650,
      },
    });

    setActiveFarmId(newFarmId);
    setIsSubmitting(false);

    Alert.alert(
      '🌾 Farm Registered Successfully!',
      `"${newFarm.name}" is now live in your farmer workspace. You can now add produce yields and post harvest videos.`,
      [
        {
          text: 'Open Farm Workspace',
          onPress: () => router.replace('/farmer/manage'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => (step > 1 ? setStep((step - 1) as any) : router.back())}
            style={styles.backButton}
          >
            <ArrowLeft size={22} color={Colors.espresso} strokeWidth={2.2} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Register New Farm</Text>
            <Text style={styles.headerSubtitle}>Step {step} of 4</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* STEP 1: Farm Identity & Category */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepTitleRow}>
                <Sparkles size={20} color={Colors.gold} strokeWidth={2.2} />
                <Text style={styles.stepHeading}>Farm Identity & Category</Text>
              </View>
              <Text style={styles.stepDesc}>
                Define your farm name and choose what you produce.
              </Text>

              <Text style={styles.inputLabel}>Farm / Production Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Mount Cameroon Organic Highlands"
                placeholderTextColor={Colors.text.muted}
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.inputLabel}>Select Farming Category *</Text>
              <View style={styles.categoriesGrid}>
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      style={[
                        styles.categoryCard,
                        isSelected && styles.categoryCardActive,
                      ]}
                      onPress={() => setCategory(cat.key)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.catIconCircle,
                          isSelected && styles.catIconCircleActive,
                        ]}
                      >
                        <Icon
                          size={20}
                          color={isSelected ? Colors.white : Colors.cultivated}
                          strokeWidth={2.2}
                        />
                      </View>
                      <Text
                        style={[
                          styles.catLabel,
                          isSelected && styles.catLabelActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                      <Text style={styles.catSub} numberOfLines={2}>
                        {cat.sub}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Farm Story / Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell buyers about your soil, farming ethics, and harvest methods..."
                placeholderTextColor={Colors.text.muted}
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />
            </View>
          )}

          {/* STEP 2: Geographical Location & GPS */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepTitleRow}>
                <MapPin size={20} color={Colors.cultivated} strokeWidth={2.2} />
                <Text style={styles.stepHeading}>Location & GPS Coordinates</Text>
              </View>
              <Text style={styles.stepDesc}>
                Help buyers and transporters calculate direct logistics routes to your farm.
              </Text>

              <Text style={styles.inputLabel}>Agricultural Region *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.regionsScroll}>
                {CAMEROON_REGIONS.map((r) => {
                  const isSel = region === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[styles.regionChip, isSel && styles.regionChipActive]}
                      onPress={() => setRegion(r)}
                    >
                      <Text style={[styles.regionChipText, isSel && styles.regionChipTextActive]}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.inputLabel}>City / Town / Village *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Foumbot, Buea, Bamenda, Obala"
                placeholderTextColor={Colors.text.muted}
                value={city}
                onChangeText={setCity}
              />

              <Text style={styles.inputLabel}>Division / Sector</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Noun Division, Fako Division, Mezam"
                placeholderTextColor={Colors.text.muted}
                value={division}
                onChangeText={setDivision}
              />

              <Text style={styles.inputLabel}>Farm Access Address / Road Landmark</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Mile 4 Valley Road, 2km after the cooperative junction"
                placeholderTextColor={Colors.text.muted}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          )}

          {/* STEP 3: Land Size & Primary Produce */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepTitleRow}>
                <Layers size={20} color={Colors.soil} strokeWidth={2.2} />
                <Text style={styles.stepHeading}>Operations & Capacity</Text>
              </View>
              <Text style={styles.stepDesc}>
                Specify your production land area and what you grow or raise.
              </Text>

              <Text style={styles.inputLabel}>Farm Size (in Hectares / Acres)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 3.5"
                placeholderTextColor={Colors.text.muted}
                keyboardType="numeric"
                value={sizeHectares}
                onChangeText={setSizeHectares}
              />

              <Text style={styles.inputLabel}>Primary Produce Items</Text>
              <View style={styles.tagInputRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="e.g., Tomatoes, Irish Potatoes, Broilers"
                  placeholderTextColor={Colors.text.muted}
                  value={produceInput}
                  onChangeText={setProduceInput}
                  onSubmitEditing={handleAddTag}
                />
                <TouchableOpacity style={styles.addTagBtn} onPress={handleAddTag}>
                  <Text style={styles.addTagBtnText}>Add</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tagsContainer}>
                {produceTags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.tagChip}
                    onPress={() => handleRemoveTag(tag)}
                  >
                    <Text style={styles.tagChipText}>{tag} ✕</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Cooperative / GIC Name (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., UCCAO, CAPLAME, Foumbot Tomato Union"
                placeholderTextColor={Colors.text.muted}
                value={cooperative}
                onChangeText={setCooperative}
              />
            </View>
          )}

          {/* STEP 4: Quality, Certifications & Photos */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepTitleRow}>
                <ShieldCheck size={20} color={Colors.cultivated} strokeWidth={2.2} />
                <Text style={styles.stepHeading}>Quality & Cover Photo</Text>
              </View>
              <Text style={styles.stepDesc}>
                Select badges and choose a high-resolution farm photo for your storefront.
              </Text>

              <Text style={styles.inputLabel}>Select Cover Photo</Text>
              <View style={styles.coversGrid}>
                {SAMPLE_COVERS.map((url, idx) => {
                  const isSelected = coverPhoto === url;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.coverCard, isSelected && styles.coverCardActive]}
                      onPress={() => setCoverPhoto(url)}
                    >
                      <Image source={{ uri: url }} style={styles.coverThumbnail} />
                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <Check size={14} color={Colors.white} strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Verified Standards</Text>
              <TouchableOpacity
                style={[styles.certRow, isOrganic && styles.certRowActive]}
                onPress={() => setIsOrganic(!isOrganic)}
              >
                <View style={styles.certCheck}>
                  {isOrganic && <Check size={12} color={Colors.white} strokeWidth={3} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.certTitle}>100% Organic & Chemical-Free</Text>
                  <Text style={styles.certSub}>Grown with natural manure and bio-fertilizers</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.certRow, isGapCertified && styles.certRowActive]}
                onPress={() => setIsGapCertified(!isGapCertified)}
              >
                <View style={styles.certCheck}>
                  {isGapCertified && <Check size={12} color={Colors.white} strokeWidth={3} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.certTitle}>Cameroon GAP (Good Agricultural Practices)</Text>
                  <Text style={styles.certSub}>Quality hygiene and verified harvest standards</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Bottom Action Button */}
        <View style={styles.footer}>
          {step < 4 ? (
            <BrandButton
              title="Continue to Next Step"
              onPress={handleNextStep}
              variant="primary"
            />
          ) : (
            <BrandButton
              title={isSubmitting ? 'Registering Farm...' : 'Complete & Register Farm'}
              onPress={handleSubmit}
              variant="primary"
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.parchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.displayItalic,
    fontSize: 18,
    color: Colors.canopy,
  },
  headerSubtitle: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.parchmentDim,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.cultivated,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  stepContainer: {
    gap: 12,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepHeading: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 18,
    color: Colors.espresso,
  },
  stepDesc: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  inputLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.espresso,
    marginTop: 6,
  },
  input: {
    backgroundColor: Colors.parchment,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    borderRadius: Radii.input,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.espresso,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: Colors.parchment,
    borderWidth: 1.5,
    borderColor: Colors.parchmentDim,
    borderRadius: Radii.card,
    padding: 12,
    alignItems: 'flex-start',
  },
  categoryCardActive: {
    backgroundColor: '#eef8f1',
    borderColor: Colors.cultivated,
  },
  catIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  catIconCircleActive: {
    backgroundColor: Colors.cultivated,
  },
  catLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.espresso,
    marginBottom: 2,
  },
  catLabelActive: {
    color: Colors.cultivated,
  },
  catSub: {
    fontFamily: Fonts.body,
    fontSize: 10.5,
    color: Colors.text.secondary,
  },
  regionsScroll: {
    marginBottom: 6,
  },
  regionChip: {
    backgroundColor: Colors.parchment,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    marginRight: 8,
  },
  regionChipActive: {
    backgroundColor: Colors.canopy,
    borderColor: Colors.canopy,
  },
  regionChipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.espresso,
  },
  regionChipTextActive: {
    color: Colors.white,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addTagBtn: {
    backgroundColor: Colors.cultivated,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radii.input,
  },
  addTagBtnText: {
    fontFamily: Fonts.bodySemiBold,
    color: Colors.white,
    fontSize: 13,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  tagChip: {
    backgroundColor: '#eef8f1',
    borderWidth: 1,
    borderColor: 'rgba(78, 139, 63, 0.3)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radii.chip,
  },
  tagChipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.cultivated,
  },
  coversGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 6,
  },
  coverCard: {
    width: '48%',
    height: 90,
    borderRadius: Radii.card,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  coverCardActive: {
    borderColor: Colors.cultivated,
  },
  coverThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  selectedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.cultivated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.parchment,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    borderRadius: Radii.card,
    padding: 12,
    gap: 12,
    marginBottom: 8,
  },
  certRowActive: {
    backgroundColor: '#eef8f1',
    borderColor: 'rgba(78, 139, 63, 0.4)',
  },
  certCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.cultivated,
    backgroundColor: Colors.cultivated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.espresso,
  },
  certSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.parchmentDim,
    backgroundColor: Colors.white,
  },
});
