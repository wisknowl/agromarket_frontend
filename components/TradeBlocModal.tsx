import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import {
  Globe2,
  X,
  Check,
} from 'lucide-react-native';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { useLocale, TradeBlocId } from '@/context/LocaleContext';

interface TradeBlocModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function TradeBlocModal({ visible, onClose }: TradeBlocModalProps) {
  const {
    activeBloc,
    supportedBlocs,
    setTradeBloc,
  } = useLocale();

  const handleSelectBloc = async (blocId: TradeBlocId) => {
    await setTradeBloc(blocId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.iconCircle}>
                <Globe2 size={18} color={Colors.cultivated} strokeWidth={2.4} />
              </View>
              <View>
                <Text style={styles.sheetTitle}>Region & Currency</Text>
                <Text style={styles.sheetSubtitle}>
                  Select your trading corridor and local payment rails
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={18} color={Colors.espresso} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {supportedBlocs.map((bloc) => {
              const isSelected = bloc.id === activeBloc;
              return (
                <TouchableOpacity
                  key={bloc.id}
                  style={[styles.blocCard, isSelected && styles.blocCardSelected]}
                  onPress={() => handleSelectBloc(bloc.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.blocCardHeader}>
                    <Text style={styles.blocCardFlag}>{bloc.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={styles.titleRow}>
                        <Text style={[styles.blocCardTitle, isSelected && styles.blocCardTitleSelected]}>
                          {bloc.shortName || bloc.name}
                        </Text>
                        <View style={[styles.currencyBadge, isSelected && styles.currencyBadgeSelected]}>
                          <Text style={[styles.currencyBadgeText, isSelected && styles.currencyBadgeTextSelected]}>
                            {bloc.currencySymbol} ({bloc.primaryCurrency})
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.blocCardCountries} numberOfLines={2}>
                        {bloc.memberCountries.map((c) => c.name).join(' · ')}
                      </Text>
                    </View>
                    {isSelected ? (
                      <View style={styles.checkedCircle}>
                        <Check size={14} color={Colors.white} strokeWidth={3} />
                      </View>
                    ) : (
                      <View style={styles.uncheckedCircle} />
                    )}
                  </View>

                  <View style={styles.blocRailsRow}>
                    {bloc.methods.map((method, idx) => (
                      <View key={idx} style={[styles.railTag, { backgroundColor: method.tagBg }]}>
                        <Text style={[styles.railTagText, { color: method.tagColor }]}>
                          {method.name.split(' (')[0]}
                        </Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    backgroundColor: '#FBF9F5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '82%',
    paddingBottom: 24,
    ...Shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF8F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.espresso,
  },
  sheetSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.parchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 10,
  },
  blocCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.card,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  blocCardSelected: {
    borderColor: Colors.cultivated,
    backgroundColor: '#F6FCF7',
  },
  blocCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  blocCardFlag: {
    fontSize: 24,
    marginTop: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  blocCardTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.espresso,
    flexShrink: 1,
  },
  blocCardTitleSelected: {
    color: Colors.cultivated,
  },
  currencyBadge: {
    backgroundColor: Colors.parchment,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: Radii.pill,
  },
  currencyBadgeSelected: {
    backgroundColor: Colors.cultivated,
  },
  currencyBadgeText: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    color: Colors.espresso,
  },
  currencyBadgeTextSelected: {
    color: Colors.white,
  },
  blocCardCountries: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: Colors.text.secondary,
    marginTop: 4,
    lineHeight: 16,
  },
  checkedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.cultivated,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    marginTop: 2,
  },
  uncheckedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginLeft: 4,
    marginTop: 2,
  },
  blocRailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.parchmentDim,
    flexWrap: 'wrap',
  },
  railTag: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  railTagText: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
  },
});
