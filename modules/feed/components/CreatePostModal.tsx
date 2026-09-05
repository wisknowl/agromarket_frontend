import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Switch,
} from 'react-native';
import { X, Video, Image as ImageIcon, ShoppingBag, Sparkles } from 'lucide-react-native';
import Colors, { Radii } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import BrandButton from '@/components/ui/BrandButton';
import { agroYields } from '@/mocks/data';
import { AgroYield } from '@/types';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (postData: {
    content: string;
    mediaUrl: string;
    isVideo: boolean;
    linkedYieldId?: string;
  }) => void;
}

export default function CreatePostModal({
  visible,
  onClose,
  onSubmit,
}: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800');
  const [isVideo, setIsVideo] = useState(false);
  const [isShoppable, setIsShoppable] = useState(false);
  const [selectedYield, setSelectedYield] = useState<AgroYield | null>(null);

  const handleSubmit = () => {
    if (!content.trim()) return;

    onSubmit({
      content,
      mediaUrl,
      isVideo,
      linkedYieldId: isShoppable && selectedYield ? selectedYield.id : undefined,
    });

    setContent('');
    setIsShoppable(false);
    setSelectedYield(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Publish Harvest Story</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color={Colors.espresso} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <TextInput
              style={styles.textArea}
              placeholder="What are you harvesting or preparing on the farm today? Share tips or updates..."
              placeholderTextColor={Colors.text.secondary}
              multiline
              numberOfLines={4}
              value={content}
              onChangeText={setContent}
            />

            <Text style={styles.sectionLabel}>Media Type</Text>
            <View style={styles.mediaToggleRow}>
              <TouchableOpacity
                style={[styles.mediaTypeBtn, !isVideo && styles.mediaTypeBtnActive]}
                onPress={() => setIsVideo(false)}
              >
                <ImageIcon size={18} color={!isVideo ? Colors.cultivated : Colors.text.secondary} />
                <Text style={[styles.mediaTypeText, !isVideo && styles.mediaTypeTextActive]}>
                  Photo Post
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.mediaTypeBtn, isVideo && styles.mediaTypeBtnActive]}
                onPress={() => setIsVideo(true)}
              >
                <Video size={18} color={isVideo ? Colors.cultivated : Colors.text.secondary} />
                <Text style={[styles.mediaTypeText, isVideo && styles.mediaTypeTextActive]}>
                  Short Reel Video
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Shoppable Tagging Switch */}
            <View style={styles.switchRow}>
              <View style={styles.switchTextCol}>
                <View style={styles.iconTagRow}>
                  <ShoppingBag size={18} color={Colors.gold} />
                  <Text style={styles.switchTitle}>Tag a Shoppable Yield</Text>
                </View>
                <Text style={styles.switchSub}>
                  Allows buyers to add this fresh harvest directly to their basket
                </Text>
              </View>
              <Switch
                value={isShoppable}
                onValueChange={setIsShoppable}
                trackColor={{ false: Colors.parchmentDim, true: Colors.cultivated }}
              />
            </View>

            {isShoppable && (
              <View style={styles.yieldPickerSection}>
                <Text style={styles.pickerTitle}>Select from your catalog:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yieldsScroll}>
                  {agroYields.slice(0, 5).map((item) => {
                    const isSelected = selectedYield?.id === item.id;
                    const itemImage = item.image || (item.mediaUrls && item.mediaUrls[0]) || '';
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.yieldChip, isSelected && styles.yieldChipSelected]}
                        onPress={() => setSelectedYield(item)}
                      >
                        {itemImage ? (
                          <Image source={{ uri: itemImage }} style={styles.yieldThumb} />
                        ) : null}
                        <View>
                          <Text style={styles.yieldChipTitle}>{item.title}</Text>
                          <Text style={styles.yieldChipPrice}>{item.price} FCFA / {item.unit}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <BrandButton
              title="Post to AgroFeed"
              variant="primary"
              size="lg"
              onPress={handleSubmit}
              disabled={!content.trim()}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(36, 26, 18, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radii.card,
    borderTopRightRadius: Radii.card,
    maxHeight: '85%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: Fonts.displayItalic,
    fontSize: 18,
    color: Colors.canopy,
  },
  body: {
    marginBottom: 16,
  },
  textArea: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.espresso,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    borderRadius: Radii.sm,
    padding: 12,
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.espresso,
    marginBottom: 8,
  },
  mediaToggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  mediaTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    gap: 8,
  },
  mediaTypeBtnActive: {
    borderColor: Colors.cultivated,
    backgroundColor: 'rgba(78, 139, 63, 0.08)',
  },
  mediaTypeText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.text.secondary,
  },
  mediaTypeTextActive: {
    color: Colors.cultivated,
    fontFamily: Fonts.bodySemiBold,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.parchmentDim,
    marginVertical: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  switchTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  iconTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  switchTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.espresso,
  },
  switchSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text.secondary,
  },
  yieldPickerSection: {
    backgroundColor: Colors.parchment,
    padding: 12,
    borderRadius: Radii.sm,
    marginTop: 8,
  },
  pickerTitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.espresso,
    marginBottom: 8,
  },
  yieldsScroll: {
    flexDirection: 'row',
  },
  yieldChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 8,
    borderRadius: Radii.sm,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    gap: 8,
  },
  yieldChipSelected: {
    borderColor: Colors.cultivated,
    backgroundColor: '#f0fdf4',
  },
  yieldThumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  yieldChipTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.espresso,
  },
  yieldChipPrice: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    color: Colors.soil,
  },
  footer: {
    paddingTop: 8,
  },
});
