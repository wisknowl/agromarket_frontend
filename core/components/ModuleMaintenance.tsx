import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors, { Radii } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { Wrench } from 'lucide-react-native';
import BrandButton from '@/components/ui/BrandButton';
import { useRouter } from 'expo-router';

interface ModuleMaintenanceProps {
  moduleName: string;
  description?: string;
}

export default function ModuleMaintenance({
  moduleName,
  description = 'This service is currently undergoing scheduled platform maintenance and will be available shortly.',
}: ModuleMaintenanceProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Wrench size={36} color={Colors.clay} strokeWidth={2.2} />
      </View>
      <Text style={styles.title}>{moduleName} Upgrading</Text>
      <Text style={styles.description}>{description}</Text>
      <BrandButton
        title="Return to AgroFeed"
        variant="primary"
        size="md"
        onPress={() => router.replace('/(tabs)')}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.parchment,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(181, 74, 52, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: Fonts.displayItalic,
    fontSize: 22,
    color: Colors.canopy,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    minWidth: 200,
  },
});
