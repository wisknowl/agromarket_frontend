import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Menu,
  Plus,
  Store,
  Truck,
  Settings,
  X,
  Sparkles,
  ShieldCheck,
  Wallet,
  Crown,
  TrendingUp,
  ChevronDown,
  Check,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { useLocale } from '@/context/LocaleContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 360);

export default function ProfileHeaderMenu() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { language, setLanguage, supportedLanguages } = useLocale();

  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const openDrawer = () => {
    setLangDropdownOpen(false);
    setMenuVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        bounciness: 0,
        speed: 16,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = (callback?: () => void) => {
    setLangDropdownOpen(false);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: DRAWER_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMenuVisible(false);
      if (callback) callback();
    });
  };

  const handleNavigate = (route: string) => {
    closeDrawer(() => {
      router.push(route as any);
    });
  };

  const currentLangObj =
    supportedLanguages.find((l) => l.code === language) || supportedLanguages[0];

  return (
    <View>
      {/* Trigger Button in Profile Top Bar */}
      <TouchableOpacity
        style={styles.triggerBtn}
        onPress={openDrawer}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Open ecosystem management panel"
      >
        <Menu size={22} color={Colors.espresso} strokeWidth={2.2} />
      </TouchableOpacity>

      {/* Side Pane Drawer Modal (Right-to-Left Slide) */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={() => closeDrawer()}
      >
        <View style={styles.modalRoot}>
          {/* Backdrop Overlay */}
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => closeDrawer()} />
          </Animated.View>

          {/* Sliding Side Pane Drawer */}
          <Animated.View
            style={[
              styles.sidePane,
              {
                paddingTop: Math.max(insets.top, 16) + 8,
                paddingBottom: Math.max(insets.bottom, 16) + 12,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            {/* Drawer Header */}
            <View style={styles.drawerHeader}>
              <View style={styles.headerTitleGroup}>
                <Sparkles size={18} color={Colors.gold} strokeWidth={2.2} />
                <Text style={styles.drawerTitle}>Manage Ecosystem</Text>
              </View>

              <View style={styles.headerRightActions}>
                {/* Non-Modal Inline Language Switcher */}
                <View style={styles.langWrapper}>
                  <TouchableOpacity
                    style={styles.langPill}
                    onPress={() => setLangDropdownOpen(!langDropdownOpen)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Switch language"
                  >
                    <Text style={styles.langPillFlag}>{currentLangObj.flag}</Text>
                    <Text style={styles.langPillCode}>{currentLangObj.code.toUpperCase()}</Text>
                    <ChevronDown size={13} color={Colors.espresso} strokeWidth={2.4} />
                  </TouchableOpacity>

                  {langDropdownOpen && (
                    <View style={styles.langDropdownMenu}>
                      {supportedLanguages.map((lang) => {
                        const isSelected = language === lang.code;
                        return (
                          <TouchableOpacity
                            key={lang.code}
                            style={[
                              styles.langDropdownItem,
                              isSelected && styles.langDropdownItemActive,
                            ]}
                            onPress={async () => {
                              await setLanguage(lang.code);
                              setLangDropdownOpen(false);
                            }}
                            activeOpacity={0.75}
                          >
                            <Text style={styles.langItemFlag}>{lang.flag}</Text>
                            <Text
                              style={[
                                styles.langItemName,
                                isSelected && styles.langItemNameActive,
                              ]}
                            >
                              {lang.name}
                            </Text>
                            {isSelected && (
                              <Check size={13} color={Colors.cultivated} strokeWidth={3} />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* Close Button */}
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => closeDrawer()}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Close panel"
                >
                  <X size={18} color={Colors.espresso} strokeWidth={2.4} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Ecosystem Action Links */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              onTouchStart={() => {
                if (langDropdownOpen) setLangDropdownOpen(false);
              }}
            >
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigate('/wallet')}
                activeOpacity={0.75}
              >
                <View style={[styles.itemIconCircle, { backgroundColor: '#EEF8F1' }]}>
                  <Wallet size={18} color={Colors.cultivated} strokeWidth={2.4} />
                </View>
                <View style={styles.itemTextContainer}>
                  <Text style={styles.itemTitle}>AgroWallet & Escrow Vault 💳</Text>
                  <Text style={styles.itemSub}>Balance, escrow releases & patron passes</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigate('/orders')}
                activeOpacity={0.75}
              >
                <View style={[styles.itemIconCircle, { backgroundColor: '#EEF8F1' }]}>
                  <ShieldCheck size={18} color={Colors.cultivated} strokeWidth={2.4} />
                </View>
                <View style={styles.itemTextContainer}>
                  <Text style={styles.itemTitle}>Escrow Orders & Settlements 🛡️</Text>
                  <Text style={styles.itemSub}>Live MoMo verification & dispute release</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigate('/farmer/new')}
                activeOpacity={0.75}
              >
                <View style={[styles.itemIconCircle, { backgroundColor: '#EEF8F1' }]}>
                  <Plus size={18} color={Colors.cultivated} strokeWidth={2.5} />
                </View>
                <View style={styles.itemTextContainer}>
                  <Text style={styles.itemTitle}>Register New Farm</Text>
                  <Text style={styles.itemSub}>Crops, Livestock, Fish, Poultry</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigate('/farmer/manage')}
                activeOpacity={0.75}
              >
                <View style={[styles.itemIconCircle, { backgroundColor: '#FEF7EE' }]}>
                  <Store size={18} color={Colors.gold} strokeWidth={2.2} />
                </View>
                <View style={styles.itemTextContainer}>
                  <Text style={styles.itemTitle}>Become Buyam-Sellam</Text>
                  <Text style={styles.itemSub}>Wholesale trading & bulk aggregator</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigate('/become-farmer')}
                activeOpacity={0.75}
              >
                <View style={[styles.itemIconCircle, { backgroundColor: '#F0F9FF' }]}>
                  <Truck size={18} color="#0284c7" strokeWidth={2.2} />
                </View>
                <View style={styles.itemTextContainer}>
                  <Text style={styles.itemTitle}>Register as Transporter</Text>
                  <Text style={styles.itemSub}>Agro-logistics & cold freight fleet</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigate('/fintech/loans')}
                activeOpacity={0.75}
              >
                <View style={[styles.itemIconCircle, { backgroundColor: '#FAF5FF' }]}>
                  <TrendingUp size={18} color="#7c3aed" strokeWidth={2.2} />
                </View>
                <View style={styles.itemTextContainer}>
                  <Text style={styles.itemTitle}>AgroVestor Crowdlending 🚀</Text>
                  <Text style={styles.itemSub}>Yield collateral campaigns & credit scoring</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigate('/partners')}
                activeOpacity={0.75}
              >
                <View style={[styles.itemIconCircle, { backgroundColor: '#FEF7EE' }]}>
                  <Crown size={18} color={Colors.gold} strokeWidth={2.2} />
                </View>
                <View style={styles.itemTextContainer}>
                  <Text style={styles.itemTitle}>AgroPatron Feed ⭐</Text>
                  <Text style={styles.itemSub}>Exclusive updates from patronized farms</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigate('/settings/settings')}
                activeOpacity={0.75}
              >
                <View style={[styles.itemIconCircle, { backgroundColor: '#F4F4F5' }]}>
                  <Settings size={18} color={Colors.text.secondary} strokeWidth={2.2} />
                </View>
                <View style={styles.itemTextContainer}>
                  <Text style={styles.itemTitle}>Settings & Privacy</Text>
                  <Text style={styles.itemSub}>Account security, permissions & legal</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  triggerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF8F1',
    borderWidth: 1,
    borderColor: '#CCEBD5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalRoot: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(36, 26, 18, 0.45)',
  },
  sidePane: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    ...Shadows.card,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    zIndex: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    zIndex: 20,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  drawerTitle: {
    fontFamily: Fonts.displayItalic,
    fontSize: 16,
    color: Colors.canopy,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 30,
  },
  langWrapper: {
    position: 'relative',
    zIndex: 50,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF8F1',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: '#CCEBD5',
  },
  langPillFlag: {
    fontSize: 13,
  },
  langPillCode: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    color: Colors.espresso,
  },
  langDropdownMenu: {
    position: 'absolute',
    top: 32,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    paddingVertical: 4,
    minWidth: 140,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: '#CCEBD5',
    zIndex: 100,
  },
  langDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  langDropdownItemActive: {
    backgroundColor: '#EEF8F1',
  },
  langItemFlag: {
    fontSize: 14,
  },
  langItemName: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12.5,
    color: Colors.espresso,
    flex: 1,
  },
  langItemNameActive: {
    fontFamily: Fonts.bodyBold,
    color: Colors.cultivated,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF8F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#CCEBD5',
    marginVertical: 10,
  },
  scrollContent: {
    paddingBottom: 24,
    gap: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: Radii.card,
    gap: 12,
  },
  itemIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.espresso,
  },
  itemSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 1,
  },
});
