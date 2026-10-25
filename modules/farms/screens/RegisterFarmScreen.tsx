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
  Fish,
  Home,
  Layers,
  MapPin,
  ShieldCheck,
  Check,
  Sparkles,
  ChevronRight,
  Upload,
  Plus,
  Trash2,
  Building2,
} from 'lucide-react-native';
import CattleIcon from '@/components/ui/CattleIcon';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import BrandButton from '@/components/ui/BrandButton';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Farm, FarmCategory } from '@/types';
import { createFarmApi } from '../api';

const CATEGORIES: Array<{ key: FarmCategory; label: string; icon: any; sub: string }> = [
  { key: 'CROPS', label: 'Crops & Vegetables', icon: Sprout, sub: 'Tomatoes, Maize, Potatoes, Greens' },
  { key: 'POULTRY', label: 'Poultry & Birds', icon: Egg, sub: 'Broilers, Layers, Free-Range Eggs' },
  { key: 'LIVESTOCK', label: 'Livestock & Cattle', icon: CattleIcon, sub: 'Cattle, Goats, Sheep, Pigs' },
  { key: 'AQUACULTURE', label: 'Fish & Aquaculture', icon: Fish, sub: 'Tilapia, Catfish, Fingerlings' },
  { key: 'GREENHOUSE', label: 'Greenhouse & Tech', icon: Home, sub: 'Hydroponics, Climate Controlled' },
  { key: 'MIXED', label: 'Mixed Farming', icon: Layers, sub: 'Integrated crops and animals' },
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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<FarmCategory>('CROPS');
  const [description, setDescription] = useState('');

  // Operational Parcels & Multi-Site State
  const [parcels, setParcels] = useState<Array<{
    id: string;
    name: string;
    region: string;
    city: string;
    division: string;
    location: string;
    sizeHectares: string;
  }>>([
    {
      id: 'site-1',
      name: 'Main Base / Headquarters',
      region: CAMEROON_REGIONS[0],
      city: '',
      division: '',
      location: '',
      sizeHectares: '2.5',
    },
  ]);

  const handleAddParcel = () => {
    const nextIdx = parcels.length + 1;
    setParcels((prev) => [
      ...prev,
      {
        id: `site-${Date.now()}`,
        name: `Operating Site ${nextIdx}`,
        region: prev[0]?.region || CAMEROON_REGIONS[0],
        city: '',
        division: '',
        location: '',
        sizeHectares: '1.0',
      },
    ]);
  };

  const handleRemoveParcel = (idToRemove: string) => {
    if (parcels.length <= 1) {
      setErrors((e) => ({ ...e, parcel: 'Your farm enterprise must have at least one operating site.' }));
      return;
    }
    setParcels((prev) => prev.filter((p) => p.id !== idToRemove));
  };

  const handleUpdateParcel = (id: string, field: string, value: string) => {
    setParcels((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
    if (errors[`city-${id}`] && field === 'city') {
      setErrors((e) => ({ ...e, [`city-${id}`]: '' }));
    }
  };

  const totalParcelsHectares = parcels.reduce(
    (sum, p) => sum + (parseFloat(p.sizeHectares) || 0),
    0
  );

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
        setErrors({ name: 'Farm name is required' });
        return;
      }
      setErrors({});
      setStep(2);
    } else if (step === 2) {
      const newErrors: { [key: string]: string } = {};
      parcels.forEach((p) => {
        if (!p.city.trim()) {
          newErrors[`city-${p.id}`] = 'City or town is required for this site';
        }
      });
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
      setStep(3);
    } else if (step === 3) {
      setErrors({});
      setStep(4);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const primaryParcel = parcels[0];
    const totalHectares = totalParcelsHectares || parseFloat(sizeHectares) || 2.5;
    const newFarmId = `farm-${Date.now()}`;
    const newFarm: Farm = {
      id: newFarmId,
      userId: user?.id || 'u1',
      name: name.trim(),
      category,
      description: description.trim() || 'Verified farm profile on AgroMarket platform.',
      region: primaryParcel.region.split(' (')[0],
      division: primaryParcel.division.trim() || 'Noun',
      city: primaryParcel.city.trim(),
      location: primaryParcel.location.trim() || `${primaryParcel.city.trim()}, ${primaryParcel.region.split(' (')[0]}`,
      sizeHectares: totalHectares,
      parcels: parcels.map((p, idx) => ({
        id: p.id,
        name: p.name.trim() || (idx === 0 ? 'Main Base / HQ' : `Site ${idx + 1}`),
        region: p.region.split(' (')[0],
        division: p.division.trim(),
        city: p.city.trim(),
        location: p.location.trim(),
        sizeHectares: parseFloat(p.sizeHectares) || 1.0,
        isHeadquarters: idx === 0,
      })),
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
      '🌾 AgroFarm Registered Successfully!',
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        style={{ flex: 1 }}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => (step > 1 ? setStep((step - 1) as any) : router.back())}
            style={styles.backButton}
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={22} color={Colors.espresso} strokeWidth={2.2} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Register AgroFarm</Text>
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
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
        >
          {/* STEP 1: Farm Identity & Category */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepTitleRow}>
                <Text style={styles.stepHeading}>Farm Identity & Category</Text>
              </View>

              <Text style={styles.inputLabel}>Farm Name</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="e.g., Mount Cameroon Organic Highlands"
                placeholderTextColor={Colors.text.muted}
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (errors.name) setErrors((e) => ({ ...e, name: '' }));
                }}
              />
              {errors.name && <Text style={styles.inlineError}>{errors.name}</Text>}

              <Text style={styles.inputLabel}>Farming Category</Text>
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
                          size={24}
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

              <Text style={styles.inputLabel}>Farm Description</Text>
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

          {/* STEP 2: Multi-Site Operational Plots & Geographic Footprint */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepTitleRow}>
                <Text style={styles.stepHeading}>Operating Sites & Locations</Text>
              </View>

              {parcels.map((parcel, idx) => {
                const isHQ = idx === 0;
                const cityError = errors[`city-${parcel.id}`];
                return (
                  <View key={parcel.id} style={styles.parcelCard}>
                    <View style={styles.parcelCardHeader}>
                      <View style={styles.parcelBadgeRow}>
                        <View style={[styles.parcelNumBadge, isHQ && styles.parcelNumBadgeHQ]}>
                          <Text style={[styles.parcelNumText, isHQ && styles.parcelNumTextHQ]}>
                            {isHQ ? 'Primary Base (HQ)' : `Site ${idx + 1}`}
                          </Text>
                        </View>
                      </View>
                      {!isHQ && (
                        <TouchableOpacity
                          onPress={() => handleRemoveParcel(parcel.id)}
                          style={styles.removeParcelBtn}
                        >
                          <Trash2 size={14} color="#dc2626" />
                          <Text style={styles.removeParcelText}>Remove</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <Text style={styles.inputLabel}>Site / Facility Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={
                        isHQ ? 'e.g., Main Hatchery & Headquarters' : 'e.g., Mutengene Broiler Pen'
                      }
                      placeholderTextColor={Colors.text.muted}
                      value={parcel.name}
                      onChangeText={(val) => handleUpdateParcel(parcel.id, 'name', val)}
                    />

                    <Text style={styles.inputLabel}>Agricultural Region</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.regionsScroll}>
                      {CAMEROON_REGIONS.map((r) => {
                        const isSel = parcel.region === r;
                        return (
                          <TouchableOpacity
                            key={r}
                            style={[styles.regionChip, isSel && styles.regionChipActive]}
                            onPress={() => handleUpdateParcel(parcel.id, 'region', r)}
                          >
                            <Text style={[styles.regionChipText, isSel && styles.regionChipTextActive]}>
                              {r}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    <View style={styles.twoColRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>City / Town</Text>
                        <TextInput
                          style={[styles.input, cityError && styles.inputError]}
                          placeholder="e.g., Buea"
                          placeholderTextColor={Colors.text.muted}
                          value={parcel.city}
                          onChangeText={(val) => handleUpdateParcel(parcel.id, 'city', val)}
                        />
                        {cityError && <Text style={styles.inlineError}>{cityError}</Text>}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Division / Sector</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g., Fako"
                          placeholderTextColor={Colors.text.muted}
                          value={parcel.division}
                          onChangeText={(val) => handleUpdateParcel(parcel.id, 'division', val)}
                        />
                      </View>
                    </View>

                    <View style={styles.twoColRow}>
                      <View style={{ flex: 1.5 }}>
                        <Text style={styles.inputLabel}>Access Road / Landmark</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g., Mile 4 Junction Road"
                          placeholderTextColor={Colors.text.muted}
                          value={parcel.location}
                          onChangeText={(val) => handleUpdateParcel(parcel.id, 'location', val)}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Plot Area (ha)</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="1.5"
                          placeholderTextColor={Colors.text.muted}
                          keyboardType="numeric"
                          value={parcel.sizeHectares}
                          onChangeText={(val) => handleUpdateParcel(parcel.id, 'sizeHectares', val)}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}

              {/* Add Site Button */}
              <TouchableOpacity
                style={styles.addParcelBtn}
                onPress={handleAddParcel}
                activeOpacity={0.85}
              >
                <Plus size={18} color={Colors.cultivated} strokeWidth={2.5} />
                <Text style={styles.addParcelBtnText}>Add Another Operating Site / Plot</Text>
              </TouchableOpacity>

              {/* Live Enterprise Footprint Summary Banner */}
              <View style={styles.footprintSummaryBanner}>
                <Building2 size={18} color={Colors.canopy} />
                <Text style={styles.footprintSummaryText}>
                  Enterprise Footprint: <Text style={{ fontFamily: Fonts.bodyBold }}>{parcels.length} Site(s)</Text> • Total Land Area: <Text style={{ fontFamily: Fonts.bodyBold }}>{totalParcelsHectares.toFixed(1)} ha</Text>
                </Text>
              </View>
            </View>
          )}

          {/* STEP 3: Capacity & Primary Produce */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepTitleRow}>
                <Text style={styles.stepHeading}>Operations & Capacity</Text>
              </View>

              {/* Total Enterprise Land Card */}
              <View style={styles.totalLandCard}>
                <View style={styles.totalLandLeft}>
                  <View style={styles.totalLandIconBox}>
                    <Layers size={22} color={Colors.cultivated} strokeWidth={2.4} />
                  </View>
                  <View>
                    <Text style={styles.totalLandTitle}>Total Operating Land</Text>
                    <Text style={styles.totalLandSub}>{parcels.length} {parcels.length === 1 ? 'Site' : 'Sites'} across Cameroon</Text>
                  </View>
                </View>
                <Text style={styles.totalLandValue}>{totalParcelsHectares > 0 ? totalParcelsHectares.toFixed(1) : '1.0'} ha</Text>
              </View>

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
                <Text style={styles.stepHeading}>Quality & Cover Photo</Text>
              </View>

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

        {/* Bottom Action Footer with Back Button on every step */}
        <View style={styles.footer}>
          {step === 1 ? (
            <BrandButton
              title="Continue to Step 2"
              onPress={handleNextStep}
              variant="primary"
            />
          ) : (
            <View style={styles.footerRow}>
              <TouchableOpacity
                style={styles.footerBackBtn}
                onPress={() => setStep((step - 1) as any)}
                activeOpacity={0.8}
              >
                <ArrowLeft size={18} color={Colors.espresso} strokeWidth={2.2} />
                <Text style={styles.footerBackBtnText}>Back</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <BrandButton
                  title={step < 4 ? 'Continue to Next Step' : (isSubmitting ? 'Registering...' : 'Complete & Register AgroFarm')}
                  onPress={step < 4 ? handleNextStep : handleSubmit}
                  variant="primary"
                />
              </View>
            </View>
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
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.parchmentDim,
    borderRadius: Radii.card,
    padding: 14,
    alignItems: 'flex-start',
    ...Shadows.subtle,
  },
  categoryCardActive: {
    backgroundColor: '#EEF8F1',
    borderColor: Colors.cultivated,
    borderWidth: 2,
  },
  catIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F7EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  catIconCircleActive: {
    backgroundColor: Colors.cultivated,
  },
  catLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13.5,
    color: Colors.espresso,
    marginBottom: 2,
  },
  catLabelActive: {
    color: Colors.cultivated,
  },
  catSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
    lineHeight: 15,
  },
  inlineError: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11.5,
    color: '#dc2626',
    marginTop: 4,
  },
  inputError: {
    borderColor: '#dc2626',
    borderWidth: 1.5,
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
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: Radii.pill,
    backgroundColor: Colors.parchment,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  footerBackBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.espresso,
  },

  // Multi-Site Parcel Styles
  parcelCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: Colors.parchmentDim,
    ...Shadows.subtle,
  },
  parcelCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchment,
  },
  parcelBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  parcelNumBadge: {
    backgroundColor: Colors.parchment,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  parcelNumBadgeHQ: {
    backgroundColor: '#fef3c7',
  },
  parcelNumText: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    color: Colors.espresso,
  },
  parcelNumTextHQ: {
    color: '#b45309',
  },
  removeParcelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    backgroundColor: '#fee2e2',
  },
  removeParcelText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: '#dc2626',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addParcelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radii.card,
    backgroundColor: '#eef8f1',
    borderWidth: 1.5,
    borderColor: '#c6e7ce',
    borderStyle: 'dashed',
    marginBottom: 14,
  },
  addParcelBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13.5,
    color: Colors.cultivated,
  },
  footprintSummaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.parchment,
    borderRadius: Radii.card,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    marginTop: 4,
  },
  footprintSummaryText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.espresso,
    flex: 1,
  },
  totalLandCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    marginBottom: 8,
    ...Shadows.subtle,
  },
  totalLandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  totalLandIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF8F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalLandTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.espresso,
  },
  totalLandSub: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  totalLandValue: {
    fontFamily: Fonts.monoBold,
    fontSize: 18,
    color: Colors.cultivated,
  },
});
