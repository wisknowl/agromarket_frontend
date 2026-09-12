import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import {
  Menu,
  Plus,
  Store,
  Truck,
  Landmark,
  Settings,
  X,
  Sparkles,
  Film,
  ShieldCheck,
  Wallet,
  Crown,
  TrendingUp,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';

export default function ProfileHeaderMenu() {
  const [menuVisible, setMenuVisible] = useState(false);
  const router = useRouter();

  const handleNavigate = (route: string) => {
    setMenuVisible(false);
    router.push(route as any);
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.triggerBtn}
        onPress={() => setMenuVisible(true)}
        accessibilityLabel="Open profile actions menu"
      >
        <Menu size={22} color={Colors.espresso} strokeWidth={2.2} />
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setMenuVisible(false)}>
          <Pressable style={styles.menuContainer} onPress={(e) => e.stopPropagation()}>
            <View style={styles.menuHeader}>
              <View style={styles.menuHeaderTitleRow}>
                <Sparkles size={18} color={Colors.gold} strokeWidth={2.2} />
                <Text style={styles.menuTitle}>Manage Ecosystem</Text>
              </View>
              <TouchableOpacity onPress={() => setMenuVisible(false)}>
                <X size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('/wallet')}
            >
              <View style={[styles.itemIconCircle, { backgroundColor: '#eef8f1' }]}>
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
            >
              <View style={[styles.itemIconCircle, { backgroundColor: '#eef8f1' }]}>
                <ShieldCheck size={18} color={Colors.cultivated} strokeWidth={2.4} />
              </View>
              <View style={styles.itemTextContainer}>
                <Text style={styles.itemTitle}>Escrow Orders & Settlements 🛡️</Text>
                <Text style={styles.itemSub}>Engine 3 state machine & payouts</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('/farmer/new')}
            >
              <View style={[styles.itemIconCircle, { backgroundColor: '#eef8f1' }]}>
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
            >
              <View style={[styles.itemIconCircle, { backgroundColor: '#fef7ee' }]}>
                <Store size={18} color={Colors.gold} strokeWidth={2.2} />
              </View>
              <View style={styles.itemTextContainer}>
                <Text style={styles.itemTitle}>Become Buyam-Sellam</Text>
                <Text style={styles.itemSub}>Wholesale trading & bulk supply</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('/become-farmer')}
            >
              <View style={[styles.itemIconCircle, { backgroundColor: '#f0f9ff' }]}>
                <Truck size={18} color="#0284c7" strokeWidth={2.2} />
              </View>
              <View style={styles.itemTextContainer}>
                <Text style={styles.itemTitle}>Register as Transporter</Text>
                <Text style={styles.itemSub}>Agro-logistics & carrier fleet</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('/fintech/loans')}
            >
              <View style={[styles.itemIconCircle, { backgroundColor: '#faf5ff' }]}>
                <TrendingUp size={18} color="#7c3aed" strokeWidth={2.2} />
              </View>
              <View style={styles.itemTextContainer}>
                <Text style={styles.itemTitle}>AgroVestor Crowdlending 🚀</Text>
                <Text style={styles.itemSub}>Credit scoring & 15-28% ROI campaigns</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('/partners')}
            >
              <View style={[styles.itemIconCircle, { backgroundColor: '#fef7ee' }]}>
                <Crown size={18} color={Colors.gold} strokeWidth={2.2} />
              </View>
              <View style={styles.itemTextContainer}>
                <Text style={styles.itemTitle}>AgroPatron Feed ⭐</Text>
                <Text style={styles.itemSub}>Stories from patronized farms</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('/settings/settings')}
            >
              <View style={[styles.itemIconCircle, { backgroundColor: '#f4f4f5' }]}>
                <Settings size={18} color={Colors.text.secondary} strokeWidth={2.2} />
              </View>
              <View style={styles.itemTextContainer}>
                <Text style={styles.itemTitle}>Settings and Privacy</Text>
                <Text style={styles.itemSub}>Tab visibility, language & security</Text>
              </View>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  triggerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.parchmentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(36, 26, 18, 0.45)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  menuContainer: {
    width: 290,
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 16,
    ...Shadows.card,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuTitle: {
    fontFamily: Fonts.displayItalic,
    fontSize: 16,
    color: Colors.canopy,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.parchmentDim,
    marginVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  itemIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  },
});
