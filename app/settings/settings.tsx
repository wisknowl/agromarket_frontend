import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/constants/translations';
import {
  LogOut,
  ArrowLeft,
  Eye,
  Lock,
  Globe,
  Users,
  ShieldCheck,
  Building2,
  Sparkles,
  Warehouse,
  Bookmark,
  Heart,
  Landmark,
  ChevronRight,
  X,
} from 'lucide-react-native';

type AudienceOption = 'EVERYONE' | 'PARTNERS' | 'ONLY_ME' | 'FINANCIAL_ONLY';

interface PrivacySettingItem {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  currentValue: AudienceOption;
  allowedOptions: AudienceOption[];
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout, user } = useAuthStore();
  const { t, language, setLanguage } = useTranslation();

  const [activePrivacyItem, setActivePrivacyItem] = useState<PrivacySettingItem | null>(null);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

  const [privacySettings, setPrivacySettings] = useState<Record<string, AudienceOption>>({
    posts: 'EVERYONE',
    farms: 'EVERYONE',
    saved: 'ONLY_ME',
    likes: 'PARTNERS',
    credit: 'FINANCIAL_ONLY',
  });

  const privacyItems: PrivacySettingItem[] = [
    {
      id: 'posts',
      title: 'Harvest Posts & Stories Tab',
      subtitle: 'Who can view your video stories and crop posts',
      icon: Sparkles,
      currentValue: privacySettings.posts,
      allowedOptions: ['EVERYONE', 'PARTNERS', 'ONLY_ME'],
    },
    {
      id: 'farms',
      title: 'Farms & Produce Catalog Tab',
      subtitle: 'Who can see your registered farms, hectares, and yields',
      icon: Warehouse,
      currentValue: privacySettings.farms,
      allowedOptions: ['EVERYONE', 'PARTNERS', 'ONLY_ME'],
    },
    {
      id: 'saved',
      title: 'Saved Harvests Tab',
      subtitle: 'Who can see the produce and deals you bookmarked',
      icon: Bookmark,
      currentValue: privacySettings.saved,
      allowedOptions: ['EVERYONE', 'PARTNERS', 'ONLY_ME'],
    },
    {
      id: 'likes',
      title: 'Liked Harvests Tab',
      subtitle: 'Who can see the posts and harvest updates you liked',
      icon: Heart,
      currentValue: privacySettings.likes,
      allowedOptions: ['EVERYONE', 'PARTNERS', 'ONLY_ME'],
    },
    {
      id: 'credit',
      title: 'Credit Score & Financial Tier',
      subtitle: 'Who can see your Njangi credit rating and loan status',
      icon: Landmark,
      currentValue: privacySettings.credit,
      allowedOptions: ['FINANCIAL_ONLY', 'PARTNERS', 'ONLY_ME', 'EVERYONE'],
    },
  ];

  const getAudienceLabel = (option: AudienceOption) => {
    switch (option) {
      case 'EVERYONE':
        return 'Everyone 🌐';
      case 'PARTNERS':
        return 'AgroPartners Only 🤝';
      case 'FINANCIAL_ONLY':
        return 'Financial Bodies Only 🏦';
      case 'ONLY_ME':
        return 'Only Me 🔒';
    }
  };

  const getAudienceDescription = (option: AudienceOption) => {
    switch (option) {
      case 'EVERYONE':
        return 'Visible to all public visitors, wholesalers, and buyers.';
      case 'PARTNERS':
        return 'Visible only to farmers and traders who follow you back.';
      case 'FINANCIAL_ONLY':
        return 'Visible strictly to verified EMF microfinance loan officers.';
      case 'ONLY_ME':
        return 'Hidden from everyone else. Only visible when you are logged in.';
    }
  };

  const openPrivacyModal = (item: PrivacySettingItem) => {
    setActivePrivacyItem(item);
    setPrivacyModalVisible(true);
  };

  const handleSelectAudience = (option: AudienceOption) => {
    if (activePrivacyItem) {
      setPrivacySettings((prev) => ({
        ...prev,
        [activePrivacyItem.id]: option,
      }));
    }
    setPrivacyModalVisible(false);
  };

  const handleLogout = () => {
    logout();
    router.replace('/auth/login');
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.espresso} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings and Privacy</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 30 }]}
      >
        {/* Section 1: Profile Tab Visibility & Privacy */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Eye size={18} color={Colors.cultivated} />
            <Text style={styles.sectionHeader}>Profile Tab Visibility & Privacy</Text>
          </View>
          <Text style={styles.sectionDesc}>
            Choose who can see each tab on your public profile:
          </Text>

          <View style={styles.settingsCard}>
            {privacyItems.map((item, index) => {
              const IconComp = item.icon;
              return (
                <React.Fragment key={item.id}>
                  <TouchableOpacity
                    style={styles.settingRow}
                    onPress={() => openPrivacyModal(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.settingIconWrapper}>
                      <IconComp size={18} color={Colors.canopy} />
                    </View>
                    <View style={styles.settingInfo}>
                      <Text style={styles.settingTitle}>{item.title}</Text>
                      <Text style={styles.settingSub}>{item.subtitle}</Text>
                      <View style={styles.audiencePill}>
                        <Text style={styles.audiencePillText}>
                          {getAudienceLabel(privacySettings[item.id])}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color={Colors.text.muted} />
                  </TouchableOpacity>
                  {index < privacyItems.length - 1 && <View style={styles.rowDivider} />}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* Section 2: Language Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Globe size={18} color={Colors.gold} />
            <Text style={styles.sectionHeader}>Language / Langue (Cameroon)</Text>
          </View>

          <View style={styles.langRow}>
            <TouchableOpacity
              style={[styles.langCard, language === 'en' && styles.langCardActive]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>
                🇨🇲 English (Cameroon)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langCard, language === 'fr' && styles.langCardActive]}
              onPress={() => setLanguage('fr')}
            >
              <Text style={[styles.langText, language === 'fr' && styles.langTextActive]}>
                🇨🇲 Français (Cameroun)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 3: Account Profile Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <ShieldCheck size={18} color={Colors.cultivated} />
            <Text style={styles.sectionHeader}>Account Identity</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Logged in as:</Text>
            <Text style={styles.infoValue}>{user?.name || 'AgroMarket Member'}</Text>
            <Text style={styles.infoRole}>Role: {user?.role || 'FARMER'}</Text>
          </View>
        </View>

        {/* Logout button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
          <LogOut size={18} color={Colors.clay} />
          <Text style={styles.logoutText}>Log Out of AgroMarket</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Audience Selector Bottom Sheet Modal */}
      <Modal
        visible={privacyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPrivacyModalVisible(false)}>
          <Pressable
            style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 20) + 16 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {activePrivacyItem?.title || 'Audience Permission'}
              </Text>
              <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
                <X size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetSubtitle}>
              Select who can view this tab when visiting your profile:
            </Text>

            {activePrivacyItem?.allowedOptions.map((opt) => {
              const isSelected = privacySettings[activePrivacyItem.id] === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.audienceOptionCard, isSelected && styles.audienceOptionCardActive]}
                  onPress={() => handleSelectAudience(opt)}
                >
                  <View style={styles.audienceOptionTextGroup}>
                    <Text style={[styles.audienceOptionTitle, isSelected && styles.audienceOptionTitleActive]}>
                      {getAudienceLabel(opt)}
                    </Text>
                    <Text style={styles.audienceOptionDesc}>
                      {getAudienceDescription(opt)}
                    </Text>
                  </View>
                  {isSelected && <View style={styles.selectedDot} />}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.parchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Fonts.displayItalic,
    fontSize: 20,
    color: Colors.espresso,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 22,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionHeader: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.espresso,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionDesc: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 10,
  },
  settingsCard: {
    backgroundColor: Colors.parchment,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  settingIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.espresso,
  },
  settingSub: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  audiencePill: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.pill,
    marginTop: 6,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  audiencePillText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.canopy,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.parchmentDim,
    marginLeft: 62,
  },
  langRow: {
    gap: 10,
    marginTop: 8,
  },
  langCard: {
    backgroundColor: Colors.parchment,
    borderRadius: Radii.card,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.parchmentDim,
  },
  langCardActive: {
    borderColor: Colors.cultivated,
    backgroundColor: '#EEF8F1',
  },
  langText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.espresso,
  },
  langTextActive: {
    fontFamily: Fonts.bodyBold,
    color: Colors.cultivated,
  },
  infoBox: {
    backgroundColor: Colors.parchment,
    borderRadius: Radii.card,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    marginTop: 8,
  },
  infoLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  infoValue: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.espresso,
    marginTop: 2,
  },
  infoRole: {
    fontFamily: Fonts.monoBold,
    fontSize: 12,
    color: Colors.cultivated,
    marginTop: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radii.pill,
    paddingVertical: 14,
    marginTop: 10,
    gap: 8,
  },
  logoutText: {
    fontFamily: Fonts.bodyBold,
    color: Colors.clay,
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(36,26,18,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.parchmentDim,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sheetTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    color: Colors.espresso,
  },
  sheetSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 14,
  },
  audienceOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.parchment,
    borderRadius: Radii.card,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 12,
  },
  audienceOptionCardActive: {
    borderColor: Colors.cultivated,
    backgroundColor: '#EEF8F1',
  },
  audienceOptionTextGroup: {
    flex: 1,
  },
  audienceOptionTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.espresso,
  },
  audienceOptionTitleActive: {
    color: Colors.cultivated,
  },
  audienceOptionDesc: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: Colors.text.secondary,
    marginTop: 2,
    lineHeight: 15,
  },
  selectedDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.cultivated,
  },
});
