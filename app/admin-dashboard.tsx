import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

const ADMIN_GREEN = '#14532d';
const ADMIN_ACCENT = '#22d3ee';
const ADMIN_BG = '#f1f5f9';

const stats = [
  { label: 'Users', value: 128, icon: 'people', color: '#22d3ee' },
  { label: 'Farmers', value: 32, icon: 'eco', color: '#a3e635' },
  { label: 'Orders', value: 245, icon: 'shopping-cart', color: '#facc15' },
  { label: 'Revenue', value: '₦1.2M', icon: 'attach-money', color: '#f472b6' },
];

const navItems = [
  { label: 'Dashboard', icon: 'dashboard' as const },
  { label: 'Users', icon: 'people' as const },
  { label: 'Farmers', icon: 'eco' as const },
  { label: 'Orders', icon: 'shopping-cart' as const },
  { label: 'Yields', icon: 'local-florist' as const },
  { label: 'Settings', icon: 'settings' as const },
];

const AdminDashboard = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const toggleSidebar = () => setSidebarVisible((v) => !v);
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    setSidebarVisible(false);
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleSidebar} style={styles.menuBtn} accessibilityLabel="Toggle sidebar">
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
        {/* <Text style={styles.logo}>agromarket <Text style={{color: ADMIN_ACCENT}}>Admin</Text></Text> */}
        <View style={styles.userInfo}>
          <FontAwesome5 name="user-shield" size={20} color={ADMIN_ACCENT} />
          <Text style={styles.userName}>Super Admin</Text>
        </View>
      </View>

      {/* Sidebar Overlay */}
      <Modal
        visible={sidebarVisible}
        animationType="slide"
        transparent
        onRequestClose={toggleSidebar}
      >
        <Pressable style={styles.overlay} onPress={toggleSidebar} />
        <View style={styles.sidebarOverlay}>
          {navItems.map((item, idx) => (
            <TouchableOpacity key={item.label} style={styles.navItem}>
              <MaterialIcons name={item.icon} size={22} color="#fff" style={{marginRight: 12}} />
              <Text style={styles.navText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
          {/* Logout Button */}
          <TouchableOpacity style={[styles.navItem, styles.logoutBtn]} onPress={handleLogout}>
            <MaterialIcons name="logout" size={22} color="#fff" style={{marginRight: 12}} />
            <Text style={styles.navText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Dashboard Overview</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={[styles.statCard, {borderLeftColor: stat.color}]}> 
              <MaterialIcons name={stat.icon as any} size={28} color={stat.color} style={{marginBottom: 8}} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
        {/* Charts Section (placeholders, add chart library for real data) */}
        <View style={styles.chartsSection}>
          <Text style={styles.chartsTitle}>Analytics</Text>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>User Growth</Text>
            <LineChart
              data={{
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                  {
                    data: [20, 45, 28, 80, 99, 43],
                    color: () => ADMIN_GREEN,
                  },
                ],
              }}
              width={Dimensions.get('window').width - 64}
              height={180}
              chartConfig={{
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                color: () => ADMIN_GREEN,
                labelColor: () => '#64748b',
                propsForDots: { r: '3', strokeWidth: '2', stroke: ADMIN_ACCENT },
                propsForBackgroundLines: { stroke: '#e5e7eb' },
              }}
              bezier
              style={{ borderRadius: 8 }}
              withInnerLines={false}
              withOuterLines={false}
              withHorizontalLabels={true}
              withVerticalLabels={true}
            />
          </View>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Order Trends</Text>
            <BarChart
              data={{
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                  {
                    data: [30, 60, 45, 70, 85, 55],
                  },
                ],
              }}
              width={Dimensions.get('window').width - 64}
              height={180}
              yAxisLabel={''}
              yAxisSuffix={''}
              chartConfig={{
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                color: () => ADMIN_ACCENT,
                labelColor: () => '#64748b',
                propsForBackgroundLines: { stroke: '#e5e7eb' },
                fillShadowGradient: ADMIN_ACCENT,
                fillShadowGradientOpacity: 0.7,
              }}
              style={{ borderRadius: 8 }}
              withInnerLines={false}
              withHorizontalLabels={true}
              withVerticalLabels={true}
              showBarTops={false}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
  

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ADMIN_BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ADMIN_GREEN,
    paddingHorizontal: 18,
    paddingVertical: 16,
    elevation: 4,
  },
  menuBtn: {
    marginRight: 12,
    padding: 4,
  },
  logo: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#134e2a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  userName: {
    color: ADMIN_ACCENT,
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 15,
  },
  mainRow: {
    flex: 1,
    flexDirection: 'row',
  },
  // Sidebar overlay (floating)
  sidebarOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 180,
    backgroundColor: ADMIN_GREEN,
    paddingTop: 48,
    paddingHorizontal: 0,
    alignItems: 'flex-start',
    elevation: 8,
    zIndex: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
    zIndex: 10,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    minWidth: 140,
    width: 160,
    alignSelf: 'stretch',
  },
  chartsSection: {
    flexDirection: 'column',

    marginTop: 12,
    marginBottom: 24,
  },
  chartsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: ADMIN_GREEN,
    marginBottom: 12,
  },
  chartsRow: {
    // No longer needed, charts are stacked vertically
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    alignItems: 'center',
    elevation: 2,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: ADMIN_GREEN,
    marginBottom: 8,
  },
  chartPlaceholder: {
    width: 120,
    height: 80,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartPlaceholderText: {
    color: '#64748b',
    fontSize: 13,
    fontStyle: 'italic',
  },
  navText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  content: {
    flexGrow: 1,
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 18,
    color: ADMIN_GREEN,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    width: '48%',
    alignItems: 'center',
    borderLeftWidth: 6,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: ADMIN_GREEN,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  logoutBtn: {
    marginTop: 18,
    backgroundColor: '#ef4444',
  },
});


export default AdminDashboard;
