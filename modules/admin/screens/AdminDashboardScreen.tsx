import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ShieldAlert,
  ToggleLeft,
  Users,
  Store,
  DollarSign,
  Package,
  Gavel,
  Activity,
  LogOut,
} from 'lucide-react-native';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { useFeatureFlags } from '../../../core/feature-flags/useFeatureFlags';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';
import BrandButton from '@/components/ui/BrandButton';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const { flags, updateFlagRemote } = useFeatureFlags();
  const [activeTab, setActiveTab] = useState<'overview' | 'flags' | 'disputes'>('overview');

  const handleToggleFlag = async (key: keyof typeof flags, currentVal: boolean) => {
    await updateFlagRemote(key, !currentVal);
    Alert.alert('Feature Flag Updated', `${String(key)} is now ${!currentVal ? 'ENABLED' : 'DISABLED'}`);
  };

  const handleLogout = () => {
    logout();
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ShieldAlert size={24} color={Colors.gold} strokeWidth={2.2} />
          <Text style={styles.headerTitle}>Super Admin Control Panel</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={18} color={Colors.parchment} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Activity size={16} color={activeTab === 'overview' ? Colors.cultivated : Colors.text.secondary} />
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'flags' && styles.tabActive]}
          onPress={() => setActiveTab('flags')}
        >
          <ToggleLeft size={16} color={activeTab === 'flags' ? Colors.cultivated : Colors.text.secondary} />
          <Text style={[styles.tabText, activeTab === 'flags' && styles.tabTextActive]}>
            Kill-Switches
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'disputes' && styles.tabActive]}
          onPress={() => setActiveTab('disputes')}
        >
          <Gavel size={16} color={activeTab === 'disputes' ? Colors.cultivated : Colors.text.secondary} />
          <Text style={[styles.tabText, activeTab === 'disputes' && styles.tabTextActive]}>
            Disputes (1)
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <View style={styles.overviewContainer}>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderLeftColor: Colors.cultivated }]}>
                <Users size={22} color={Colors.cultivated} />
                <Text style={styles.statVal}>1,280</Text>
                <Text style={styles.statLbl}>Registered Users</Text>
              </View>

              <View style={[styles.statCard, { borderLeftColor: Colors.soil }]}>
                <Store size={22} color={Colors.soil} />
                <Text style={styles.statVal}>142</Text>
                <Text style={styles.statLbl}>Verified Farms</Text>
              </View>

              <View style={[styles.statCard, { borderLeftColor: Colors.gold }]}>
                <Package size={22} color={Colors.gold} />
                <Text style={styles.statVal}>640</Text>
                <Text style={styles.statLbl}>Escrow Orders</Text>
              </View>

              <View style={[styles.statCard, { borderLeftColor: Colors.clay }]}>
                <DollarSign size={22} color={Colors.clay} />
                <Text style={styles.statVal}>28.5M FCFA</Text>
                <Text style={styles.statLbl}>Gross GMV</Text>
              </View>
            </View>
          </View>
        )}

        {/* KILL-SWITCHES / REMOTE CONFIG TAB */}
        {activeTab === 'flags' && (
          <View style={styles.flagsContainer}>
            <Text style={styles.sectionHeader}>Single-Click Remote Module Control</Text>
            <Text style={styles.sectionSub}>
              Toggle any module or service instantly without rebuilding or re-submitting to the app store.
            </Text>

            <View style={styles.flagCard}>
              <View style={styles.flagInfo}>
                <Text style={styles.flagTitle}>AgroFeed (Reels & Stories)</Text>
                <Text style={styles.flagSub}>Enable or disable the social harvest reel stream</Text>
              </View>
              <Switch
                value={flags.agroFeedEnabled}
                onValueChange={() => handleToggleFlag('agroFeedEnabled', flags.agroFeedEnabled)}
                trackColor={{ false: Colors.parchmentDim, true: Colors.cultivated }}
              />
            </View>

            <View style={styles.flagCard}>
              <View style={styles.flagInfo}>
                <Text style={styles.flagTitle}>Agri-Fintech & Loans</Text>
                <Text style={styles.flagSub}>Allow farmers to apply for seasonal input microfinance</Text>
              </View>
              <Switch
                value={flags.fintechLoansEnabled}
                onValueChange={() => handleToggleFlag('fintechLoansEnabled', flags.fintechLoansEnabled)}
                trackColor={{ false: Colors.parchmentDim, true: Colors.cultivated }}
              />
            </View>

            <View style={styles.flagCard}>
              <View style={styles.flagInfo}>
                <Text style={styles.flagTitle}>Buyam-Sellam Wholesale Module</Text>
                <Text style={styles.flagSub}>Wholesale aggregation, bulk bidding & PO financing</Text>
              </View>
              <Switch
                value={flags.buyamSellamModuleEnabled}
                onValueChange={() => handleToggleFlag('buyamSellamModuleEnabled', flags.buyamSellamModuleEnabled)}
                trackColor={{ false: Colors.parchmentDim, true: Colors.cultivated }}
              />
            </View>

            <View style={styles.flagCard}>
              <View style={styles.flagInfo}>
                <Text style={styles.flagTitle}>Direct Harvest Marketplace</Text>
                <Text style={styles.flagSub}>Allow consumers to buy direct from farm yields</Text>
              </View>
              <Switch
                value={flags.directYieldsEnabled}
                onValueChange={() => handleToggleFlag('directYieldsEnabled', flags.directYieldsEnabled)}
                trackColor={{ false: Colors.parchmentDim, true: Colors.cultivated }}
              />
            </View>
          </View>
        )}

        {/* DISPUTES ARBITRATOR TAB */}
        {activeTab === 'disputes' && (
          <View style={styles.disputesContainer}>
            <Text style={styles.sectionHeader}>Escrow Dispute Resolution</Text>
            <View style={styles.disputeCard}>
              <View style={styles.disputeHeader}>
                <Text style={styles.disputeOrderNum}>Order #AGR-2026-8891</Text>
                <Text style={styles.disputeAmount}>35,000 FCFA</Text>
              </View>
              <Text style={styles.disputeParty}>Buyer: Roland T. (Douala)</Text>
              <Text style={styles.disputeParty}>Farmer: Foumbot Cooperative</Text>
              <Text style={styles.disputeReason}>
                Issue: Buyer claims 2 crates of tomatoes suffered transit squashing. Farmer claims carrier handled roughly.
              </Text>

              <View style={styles.arbitrationBtns}>
                <BrandButton
                  title="Release to Farmer"
                  variant="primary"
                  size="sm"
                  onPress={() => Alert.alert('Arbitration', 'Escrow released 100% to farmer.')}
                />
                <BrandButton
                  title="Refund Buyer"
                  variant="alert"
                  size="sm"
                  onPress={() => Alert.alert('Arbitration', 'Order refunded 100% to buyer.')}
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
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
    backgroundColor: Colors.canopyDeep,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: Fonts.displayItalic,
    fontSize: 16,
    color: Colors.parchment,
  },
  logoutBtn: {
    padding: 6,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
    backgroundColor: Colors.parchment,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.cultivated,
    backgroundColor: Colors.white,
  },
  tabText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  tabTextActive: {
    color: Colors.cultivated,
    fontFamily: Fonts.bodySemiBold,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  overviewContainer: {
    gap: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.parchment,
    padding: 14,
    borderRadius: Radii.card,
    borderLeftWidth: 4,
    ...Shadows.subtle,
  },
  statVal: {
    fontFamily: Fonts.monoBold,
    fontSize: 18,
    color: Colors.espresso,
    marginTop: 6,
  },
  statLbl: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  flagsContainer: {
    gap: 12,
  },
  sectionHeader: {
    fontFamily: Fonts.displayItalic,
    fontSize: 16,
    color: Colors.canopy,
  },
  sectionSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  flagCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.parchment,
    padding: 14,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  flagInfo: {
    flex: 1,
    paddingRight: 12,
  },
  flagTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.espresso,
  },
  flagSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  disputesContainer: {
    gap: 12,
  },
  disputeCard: {
    backgroundColor: Colors.parchment,
    padding: 16,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    gap: 6,
  },
  disputeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disputeOrderNum: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    color: Colors.canopy,
  },
  disputeAmount: {
    fontFamily: Fonts.monoBold,
    fontSize: 14,
    color: Colors.soil,
  },
  disputeParty: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.espresso,
  },
  disputeReason: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.clay,
    backgroundColor: 'rgba(181, 74, 52, 0.08)',
    padding: 8,
    borderRadius: Radii.sm,
    marginTop: 4,
  },
  arbitrationBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
});
