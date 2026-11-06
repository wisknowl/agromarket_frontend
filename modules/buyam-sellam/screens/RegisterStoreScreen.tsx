import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Store,
  Building2,
  MapPin,
  Check,
  CheckCircle2,
  Plus,
  Trash2,
  Camera,
  Link2,
  Sparkles,
} from 'lucide-react-native';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import BrandButton from '@/components/ui/BrandButton';
import { useAuthStore } from '@/store/authStore';
import { createStoreApi, checkStoreSlugApi } from '@/components/api/wholesaler';

const STORE_TYPES = [
  { key: 'WHOLESALE_DEPOT', label: 'Wholesale Depot', sub: 'High-volume crate aggregation & bulk sales' },
  { key: 'RETAIL_HUB', label: 'Urban Food Hub', sub: 'Consumer crates & neighborhood supply' },
  { key: 'COOPERATIVE_SHED', label: 'Cooperative Shed', sub: 'Farmer union collection & distribution' },
  { key: 'COLD_STORAGE', label: 'Cold Storage Terminal', sub: 'Refrigerated preservation for perishables' },
];

const CAMEROON_REGIONS = [
  'Littoral Region (Douala, Loum)',
  'Centre Region (Yaoundé, Obala)',
  'West Region (Foumbot, Bafoussam)',
  'Northwest Region (Bamenda, Santa)',
  'Southwest Region (Buea, Kumba, Penja)',
  'South Region (Ebolowa, Kribi)',
  'East Region (Bertoua)',
  'Adamawa Region (Ngaoundéré)',
  'North Region (Garoua)',
  'Far North Region (Maroua)',
];

const SAMPLE_COVERS = [
  'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
];

export default function RegisterStoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuthStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Step 1: Store & Depot Identity
  const [name, setName] = useState('');
  const [storeType, setStoreType] = useState('WHOLESALE_DEPOT');
  const [description, setDescription] = useState('');

  // Real-time Slug Availability State
  const [slugStatus, setSlugStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    slug: string;
    candidate: string;
  }>({
    checking: false,
    available: null,
    slug: '',
    candidate: '',
  });

  useEffect(() => {
    if (!name.trim()) {
      setSlugStatus({ checking: false, available: null, slug: '', candidate: '' });
      return;
    }

    setSlugStatus((prev) => ({ ...prev, checking: true }));
    const timer = setTimeout(async () => {
      try {
        const res = await checkStoreSlugApi(name.trim());
        setSlugStatus({
          checking: false,
          available: res.available,
          slug: res.slug,
          candidate: res.candidate,
        });
      } catch {
        setSlugStatus((prev) => ({ ...prev, checking: false }));
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [name]);

  // Step 2: Commercial Location & Market Hub
  const [region, setRegion] = useState(CAMEROON_REGIONS[0]);
  const [division, setDivision] = useState('Wouri');
  const [city, setCity] = useState('Douala');
  const [marketZone, setMarketZone] = useState('Marché Sandaga, Quai 4');
  const [address, setAddress] = useState('');

  // Step 3: Operating Depot Sites & Facilities (Multi-Site Flow)
  const [sites, setSites] = useState<
    Array<{
      id: string;
      name: string;
      location: string;
      capacityTons: string;
      facilityType: string;
      operatingHours: string;
    }>
  >([
    {
      id: 'site-1',
      name: 'Dock 4 Cold Room',
      location: 'Marché Sandaga - Quai 4 Cold Section',
      capacityTons: '8.0',
      facilityType: 'COLD_ROOM',
      operatingHours: '05:00 - 18:00 (Mon - Sat)',
    },
    {
      id: 'site-2',
      name: 'Exterior Dry Warehouse',
      location: 'Marché Sandaga - Hangar B Loading Shed',
      capacityTons: '15.0',
      facilityType: 'AMBIENT_SHED',
      operatingHours: '06:00 - 19:00 (Mon - Sat)',
    },
  ]);

  // Step 4: Storage Specs, Farm Linkage & Cover
  const [storageCapacityTons, setStorageCapacityTons] = useState('20.0');
  const [hasColdStorage, setHasColdStorage] = useState(true);
  const [tradeLicenseNumber, setTradeLicenseNumber] = useState('');
  const [linkedFarmId, setLinkedFarmId] = useState('');
  const [coverPhoto, setCoverPhoto] = useState(SAMPLE_COVERS[0]);
  const [submitting, setSubmitting] = useState(false);

  const userFarms = user?.farms || [];

  const handleAddSite = () => {
    setSites([
      ...sites,
      {
        id: `site-${Date.now()}`,
        name: `Depot Site ${sites.length + 1}`,
        location: `${city} • ${marketZone || 'Market Zone'}`,
        capacityTons: '5.0',
        facilityType: 'AMBIENT_SHED',
        operatingHours: '06:00 - 18:00 (Mon - Sat)',
      },
    ]);
  };

  const handleRemoveSite = (id: string) => {
    if (sites.length <= 1) {
      Alert.alert('Required', 'Your store must have at least one operating depot site.');
      return;
    }
    setSites(sites.filter((s) => s.id !== id));
  };

  const handleUpdateSite = (id: string, field: string, value: string) => {
    setSites(
      sites.map((s) => {
        if (s.id === id) {
          return { ...s, [field]: value };
        }
        return s;
      })
    );
  };

  const validateStep1 = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Store name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: { [key: string]: string } = {};
    if (!city.trim()) newErrors.city = 'City is required';
    if (!marketZone.trim()) newErrors.marketZone = 'Market zone or stall is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: { [key: string]: string } = {};
    if (sites.length === 0) newErrors.sites = 'At least one depot site is required';
    const hasEmptyName = sites.some((s) => !s.name.trim());
    if (hasEmptyName) newErrors.sites = 'All depot sites must have a name';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    setStep((s) => Math.min(4, s + 1) as any);
  };

  const handleBack = () => {
    setStep((s) => Math.max(1, s - 1) as any);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const newStore = await createStoreApi({
        name: name.trim(),
        storeType,
        description: description.trim() || undefined,
        region,
        division: division.trim() || undefined,
        city: city.trim(),
        marketZone: marketZone.trim(),
        address: address.trim() || undefined,
        storageCapacityTons: parseFloat(storageCapacityTons) || 5.0,
        hasColdStorage,
        tradeLicenseNumber: tradeLicenseNumber.trim() || undefined,
        linkedFarmId: linkedFarmId || undefined,
        sites: sites.map((s) => ({
          id: s.id,
          name: s.name.trim(),
          location: s.location.trim(),
          capacityTons: parseFloat(s.capacityTons) || 2.5,
          facilityType: s.facilityType,
          operatingHours: s.operatingHours.trim(),
        })),
        coverPhoto,
      });

      Alert.alert(
        'Store Registered! 🎉',
        `"${newStore?.name || name}" is now active in AgroMarket Store Management.`,
        [
          {
            text: 'Go to Store Management',
            onPress: () => router.replace('/agro-store' as any),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to register store');
    } finally {
      setSubmitting(false);
    }
  };

  // If in Guest Mode, prompt to sign in (matches Farm Wizard behavior)
  if (!isAuthenticated && !user) {
    return (
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 16), paddingHorizontal: 20, justifyContent: 'center' }]}>
        <View style={{ backgroundColor: '#FFF', borderRadius: 24, borderWidth: 1, borderColor: '#CCEBD5', padding: 24, alignItems: 'center' }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF9EE', borderWidth: 1, borderColor: '#F2DCAA', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Building2 size={32} color="#E2A63C" />
          </View>
          <Text style={{ fontSize: 18, fontFamily: Fonts.displayBold, color: '#173A20', textAlign: 'center', marginBottom: 8 }}>
            Sign in to Register your AgroStore
          </Text>
          <Text style={{ fontSize: 13, fontFamily: Fonts.bodyRegular, color: '#5C5245', textAlign: 'center', marginBottom: 20, lineHeight: 18 }}>
            Registering an AgroStore enterprise unlocks wholesale lot publishing, multi-depot inventory tracking, and Smart Escrow pickup settlement.
          </Text>
          <TouchableOpacity
            style={{ width: '100%', backgroundColor: Colors.cultivated, paddingVertical: 14, borderRadius: 30, alignItems: 'center', marginBottom: 10 }}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={{ color: '#FFF', fontFamily: Fonts.bodyBold, fontSize: 14 }}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ width: '100%', backgroundColor: '#EEF8F1', borderWidth: 1, borderColor: '#CCEBD5', paddingVertical: 14, borderRadius: 30, alignItems: 'center' }}
            onPress={() => router.back()}
          >
            <Text style={{ color: '#173A20', fontFamily: Fonts.bodyBold, fontSize: 14 }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* Top Header Bar */}
      <View style={styles.topNavRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={19} color={Colors.canopy} />
        </TouchableOpacity>
        <View style={styles.topNavCenter}>
          <Text style={styles.topNavTitle}>Register AgroStore</Text>
          <Text style={styles.topNavSub}>Step {step} of 4</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Stepper Progress Bar */}
      <View style={styles.stepperRow}>
        {[1, 2, 3, 4].map((s) => (
          <View
            key={s}
            style={[
              styles.stepBar,
              s <= step ? styles.stepBarActive : styles.stepBarInactive,
            ]}
          />
        ))}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* STEP 1: IDENTITY */}
          {step === 1 && (
            <View style={styles.card}>
              <Text style={styles.stepTitle}>1. Store & Depot Identity</Text>
              <Text style={styles.stepDesc}>
                Define your storefront identity, trading classification, and operational overview.
              </Text>

              <Text style={styles.inputLabel}>Store / Depot Name *</Text>
              <TextInput
                style={[styles.textInput, errors.name && styles.inputError]}
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                placeholder="e.g., Marché Sandaga Wholesale Depot"
                placeholderTextColor="#9C9284"
              />
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

              {/* Real-time Slug Availability Indicator */}
              {name.trim().length > 1 && (
                <View style={styles.slugIndicatorRow}>
                  {slugStatus.checking ? (
                    <Text style={styles.slugCheckingText}>Checking store handle availability...</Text>
                  ) : slugStatus.available === true ? (
                    <View style={styles.slugAvailableBadge}>
                      <CheckCircle2 size={13} color="#15803d" />
                      <Text style={styles.slugAvailableText}>Available: agrom.app/store/{slugStatus.slug}</Text>
                    </View>
                  ) : slugStatus.available === false ? (
                    <View style={styles.slugTakenBadge}>
                      <Text style={styles.slugTakenText}>
                        Taken. Suggested: agrom.app/store/{slugStatus.candidate}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}

              <Text style={styles.inputLabel}>Commercial Classification *</Text>
              <View style={styles.typesGrid}>
                {STORE_TYPES.map((type) => {
                  const isSelected = storeType === type.key;
                  return (
                    <TouchableOpacity
                      key={type.key}
                      style={[styles.typeCard, isSelected && styles.typeCardActive]}
                      onPress={() => setStoreType(type.key)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.typeIconBox, isSelected && styles.typeIconBoxActive]}>
                        <Building2 size={16} color={isSelected ? Colors.white : Colors.canopy} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.typeTitle, isSelected && styles.typeTitleActive]}>
                          {type.label}
                        </Text>
                        <Text style={styles.typeSub}>{type.sub}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Store Overview & Wholesale Terms</Text>
              <TextInput
                style={[styles.textInput, { height: 75, textAlignVertical: 'top' }]}
                value={description}
                onChangeText={setDescription}
                multiline
                placeholder="Describe warehouse facilities, daily trading capacity, cooperative crate acceptance..."
                placeholderTextColor="#9C9284"
              />
            </View>
          )}

          {/* STEP 2: LOCATION */}
          {step === 2 && (
            <View style={styles.card}>
              <Text style={styles.stepTitle}>2. Commercial Location & Market Hub</Text>
              <Text style={styles.stepDesc}>
                Specify where buyers and transport logistics partners pick up bulk wholesale inventory.
              </Text>

              <Text style={styles.inputLabel}>Primary Market City *</Text>
              <TextInput
                style={[styles.textInput, errors.city && styles.inputError]}
                value={city}
                onChangeText={(t) => {
                  setCity(t);
                  if (errors.city) setErrors({ ...errors, city: '' });
                }}
                placeholder="e.g., Douala, Yaoundé, Bafoussam"
                placeholderTextColor="#9C9284"
              />
              {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}

              <Text style={styles.inputLabel}>Market Zone / Dock Stall *</Text>
              <TextInput
                style={[styles.textInput, errors.marketZone && styles.inputError]}
                value={marketZone}
                onChangeText={(t) => {
                  setMarketZone(t);
                  if (errors.marketZone) setErrors({ ...errors, marketZone: '' });
                }}
                placeholder="e.g., Marché Sandaga - Quai 4, Marché Mokolo Hall 3"
                placeholderTextColor="#9C9284"
              />
              {errors.marketZone ? <Text style={styles.errorText}>{errors.marketZone}</Text> : null}

              <Text style={styles.inputLabel}>Division / County</Text>
              <TextInput
                style={styles.textInput}
                value={division}
                onChangeText={setDivision}
                placeholder="e.g., Wouri, Mfoundi, Noun"
                placeholderTextColor="#9C9284"
              />

              <Text style={styles.inputLabel}>Full Warehouse Address</Text>
              <TextInput
                style={styles.textInput}
                value={address}
                onChangeText={setAddress}
                placeholder="e.g., Boulevard de la Liberté, Shed #48"
                placeholderTextColor="#9C9284"
              />
            </View>
          )}

          {/* STEP 3: DEPOT SITES */}
          {step === 3 && (
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>3. Operating Depot Sites</Text>
                  <Text style={styles.stepDesc}>
                    Add your physical storage facilities (Cold Room, Ambient Warehouse).
                  </Text>
                </View>
                <TouchableOpacity style={styles.addSiteSmallBtn} onPress={handleAddSite}>
                  <Plus size={14} color={Colors.white} />
                  <Text style={styles.addSiteSmallBtnText}>+ Site</Text>
                </TouchableOpacity>
              </View>

              {errors.sites ? <Text style={styles.errorBanner}>{errors.sites}</Text> : null}

              {sites.map((site, index) => (
                <View key={site.id} style={styles.siteBox}>
                  <View style={styles.siteHeaderRow}>
                    <Text style={styles.siteIndexText}>Site #{index + 1}: {site.name}</Text>
                    {sites.length > 1 && (
                      <TouchableOpacity onPress={() => handleRemoveSite(site.id)}>
                        <Trash2 size={16} color="#B54A34" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text style={styles.inputLabel}>Site Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={site.name}
                    onChangeText={(t) => handleUpdateSite(site.id, 'name', t)}
                    placeholder="e.g., Dock 4 Cold Room or Exterior Dry Shed"
                    placeholderTextColor="#9C9284"
                  />

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Type</Text>
                      <TextInput
                        style={styles.textInput}
                        value={site.facilityType}
                        onChangeText={(t) => handleUpdateSite(site.id, 'facilityType', t)}
                        placeholder="COLD_ROOM"
                        placeholderTextColor="#9C9284"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Capacity (Tons)</Text>
                      <TextInput
                        style={styles.textInput}
                        value={site.capacityTons}
                        onChangeText={(t) => handleUpdateSite(site.id, 'capacityTons', t)}
                        keyboardType="numeric"
                        placeholder="8.0"
                        placeholderTextColor="#9C9284"
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* STEP 4: SPECS & REVIEW */}
          {step === 4 && (
            <View style={styles.card}>
              <Text style={styles.stepTitle}>4. Storage Specs, Provenance & Launch</Text>
              <Text style={styles.stepDesc}>
                Review store capacity, link to an existing AgroFarm, and finalize.
              </Text>

              <Text style={styles.inputLabel}>Total Storage Capacity (Tons)</Text>
              <TextInput
                style={styles.textInput}
                value={storageCapacityTons}
                onChangeText={setStorageCapacityTons}
                keyboardType="numeric"
                placeholder="20.0"
                placeholderTextColor="#9C9284"
              />

              <Text style={styles.inputLabel}>Trade License #</Text>
              <TextInput
                style={styles.textInput}
                value={tradeLicenseNumber}
                onChangeText={setTradeLicenseNumber}
                placeholder="e.g., RC/DLA/2026/B/1049"
                placeholderTextColor="#9C9284"
              />

              {/* Farm Linking Option */}
              <View style={styles.farmLinkBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Link2 size={15} color={Colors.cultivated} />
                  <Text style={styles.farmLinkTitle}>Link to AgroFarm (Optional)</Text>
                </View>
                <Text style={styles.farmLinkSub}>
                  Link to your farm for provenance, or leave as Standalone Merchant Depot.
                </Text>
                {userFarms.length > 0 ? (
                  <View style={styles.farmPillsRow}>
                    <TouchableOpacity
                      style={[styles.farmPill, !linkedFarmId && styles.farmPillActive]}
                      onPress={() => setLinkedFarmId('')}
                    >
                      <Text style={[styles.farmPillText, !linkedFarmId && styles.farmPillTextActive]}>
                        Standalone Depot
                      </Text>
                    </TouchableOpacity>
                    {userFarms.map((f: any) => (
                      <TouchableOpacity
                        key={f.id}
                        style={[styles.farmPill, linkedFarmId === f.id && styles.farmPillActive]}
                        onPress={() => setLinkedFarmId(f.id)}
                      >
                        <Text style={[styles.farmPillText, linkedFarmId === f.id && styles.farmPillTextActive]}>
                          🚜 {f.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noFarmText}>Standalone Merchant Depot</Text>
                )}
              </View>

              {/* Review Card */}
              <View style={styles.summaryBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={16} color={Colors.gold} />
                  <Text style={styles.summaryTitle}>Store Launch Summary</Text>
                </View>
                <Text style={styles.summaryText}>• Store: {name}</Text>
                <Text style={styles.summaryText}>• Market Hub: {city} • {marketZone}</Text>
                <Text style={styles.summaryText}>• Sites: {sites.map((s) => s.name).join(', ')}</Text>
                <Text style={styles.summaryText}>• Capacity: {storageCapacityTons} Tons</Text>
              </View>
            </View>
          )}

          {/* Navigation Buttons */}
          <View style={styles.btnRow}>
            {step > 1 ? (
              <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            {step < 4 ? (
              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>Continue →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Launch Store & Depots 🎉</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF8F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topNavCenter: {
    alignItems: 'center',
  },
  topNavTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.canopy,
  },
  topNavSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  stepperRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 8,
  },
  stepBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  stepBarActive: {
    backgroundColor: Colors.canopy,
  },
  stepBarInactive: {
    backgroundColor: '#EEF8F1',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFDF9',
    borderRadius: Radii.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F2DCAA',
    ...Shadows.subtle,
  },
  stepTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.espresso,
  },
  stepDesc: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 16,
    marginTop: 2,
    marginBottom: 14,
  },
  inputLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.espresso,
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCEBD5',
    borderRadius: Radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.espresso,
  },
  inputError: {
    borderColor: '#B54A34',
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: '#B54A34',
    marginTop: 4,
  },
  slugIndicatorRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  slugCheckingText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: '#9C9284',
  },
  slugAvailableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: Radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 5,
  },
  slugAvailableText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: '#15803d',
  },
  slugTakenBadge: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: Radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  slugTakenText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: '#b45309',
  },
  errorBanner: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: '#B54A34',
    backgroundColor: '#FDF3F1',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  typesGrid: {
    gap: 8,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: Radii.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCEBD5',
  },
  typeCardActive: {
    backgroundColor: '#EEF8F1',
    borderColor: Colors.cultivated,
  },
  typeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF8F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconBoxActive: {
    backgroundColor: Colors.canopy,
  },
  typeTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.espresso,
  },
  typeTitleActive: {
    color: Colors.canopy,
  },
  typeSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  addSiteSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.canopy,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addSiteSmallBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.white,
  },
  siteBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCEBD5',
    borderRadius: Radii.sm,
    padding: 12,
    marginBottom: 10,
  },
  siteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF8F1',
    paddingBottom: 6,
  },
  siteIndexText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.canopy,
  },
  farmLinkBox: {
    backgroundColor: '#EEF8F1',
    padding: 12,
    borderRadius: Radii.sm,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#CCEBD5',
  },
  farmLinkTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.canopy,
  },
  farmLinkSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
    marginVertical: 4,
  },
  farmPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  farmPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCEBD5',
  },
  farmPillActive: {
    backgroundColor: Colors.canopy,
    borderColor: Colors.canopy,
  },
  farmPillText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.espresso,
  },
  farmPillTextActive: {
    color: Colors.white,
    fontFamily: Fonts.bodyBold,
  },
  noFarmText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  summaryBox: {
    backgroundColor: '#FEF6E8',
    borderRadius: Radii.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F2DCAA',
    marginTop: 12,
    gap: 4,
  },
  summaryTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: '#7A4A2D',
    marginBottom: 4,
  },
  summaryText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.espresso,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  backBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: '#CCEBD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.espresso,
  },
  nextBtn: {
    flex: 1,
    backgroundColor: Colors.canopy,
    paddingVertical: 12,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.white,
  },
  submitBtn: {
    flex: 2,
    backgroundColor: '#E2A63C',
    paddingVertical: 12,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: '#241A12',
  },
});

