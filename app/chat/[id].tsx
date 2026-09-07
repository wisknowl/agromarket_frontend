import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  Alert,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Send,
  Mic,
  Play,
  Pause,
  Phone,
  Tag,
  Check,
  CheckCheck,
  ShieldCheck,
  X,
  Sparkles,
  ShoppingBag,
} from 'lucide-react-native';
import { conversations, agroYields } from '@/mocks/data';
import { Message, TradeOffer, OfferStatus } from '@/types';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';

const initialChatMessages: Record<string, Message[]> = {
  c1: [
    {
      id: 'm1',
      conversationId: 'c1',
      senderId: 'f1',
      receiverId: 'user',
      content: 'Hello Victoy! Are the fresh vine tomatoes in Foumbot available for bulk loading tomorrow?',
      type: 'TEXT',
      isRead: true,
      createdAt: '2026-09-07T09:30:00Z',
      timestamp: '09:30 AM',
    },
    {
      id: 'm2',
      conversationId: 'c1',
      senderId: 'user',
      receiverId: 'f1',
      content: '',
      type: 'VOICE',
      isRead: true,
      createdAt: '2026-09-07T09:35:00Z',
      timestamp: '09:35 AM',
      voiceNote: {
        durationSeconds: 18,
      },
    },
    {
      id: 'm3',
      conversationId: 'c1',
      senderId: 'f1',
      receiverId: 'user',
      content: 'Yes! Here is our special wholesale trade deal reserved for AgroPartners:',
      type: 'OFFER_CARD',
      isRead: true,
      createdAt: '2026-09-07T10:00:00Z',
      timestamp: '10:00 AM',
      tradeOffer: {
        id: 'off-1',
        yieldId: 'y1',
        yieldTitle: 'Fresh Foumbot Vine Tomatoes (Grade A)',
        yieldImage: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=60',
        unit: 'CRATE',
        quantity: 20,
        offeredPricePerUnit: 20000,
        originalPricePerUnit: 22000,
        totalAmount: 400000,
        status: 'PENDING',
        notes: 'Priority harvest batch loaded directly onto Canter truck at 6:00 AM.',
      },
    },
  ],
};

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [inputText, setInputText] = useState('');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [offerModalVisible, setOfferModalVisible] = useState(false);

  // Offer modal state
  const [selectedYield, setSelectedYield] = useState(agroYields[0]);
  const [offerQuantity, setOfferQuantity] = useState('10');
  const [offerPrice, setOfferPrice] = useState('20000');

  const conversation =
    conversations.find((c) => c.id === id || c.participantId === id) || conversations[0];

  const [messages, setMessages] = useState<Message[]>(
    initialChatMessages[conversation.id] || initialChatMessages.c1
  );

  const handleSendMessage = () => {
    if (inputText.trim() === '') return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId: conversation.id,
      senderId: 'user',
      receiverId: conversation.participantId || 'f1',
      content: inputText.trim(),
      type: 'TEXT',
      isRead: false,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  const handleSendVoiceNote = () => {
    const newMsg: Message = {
      id: `voice-${Date.now()}`,
      conversationId: conversation.id,
      senderId: 'user',
      receiverId: conversation.participantId || 'f1',
      content: '',
      type: 'VOICE',
      isRead: false,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      voiceNote: {
        durationSeconds: 12,
      },
    };

    setMessages((prev) => [...prev, newMsg]);
  };

  const handleCreateOffer = () => {
    const qty = parseFloat(offerQuantity) || 1;
    const price = parseFloat(offerPrice) || 1500;
    const total = qty * price;

    const offerMsg: Message = {
      id: `offer-${Date.now()}`,
      conversationId: conversation.id,
      senderId: 'user',
      receiverId: conversation.participantId || 'f1',
      content: 'I have proposed a wholesale trade offer:',
      type: 'OFFER_CARD',
      isRead: false,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tradeOffer: {
        id: `off-${Date.now()}`,
        yieldId: selectedYield.id,
        yieldTitle: selectedYield.title,
        yieldImage: selectedYield.image,
        unit: selectedYield.unit,
        quantity: qty,
        offeredPricePerUnit: price,
        originalPricePerUnit: selectedYield.pricePerUnit || selectedYield.price,
        totalAmount: total,
        status: 'PENDING',
        notes: 'AgroPartners proposed price deal with escrow payment guarantee.',
      },
    };

    setMessages((prev) => [...prev, offerMsg]);
    setOfferModalVisible(false);
  };

  const handleOfferAction = (msgId: string, action: OfferStatus) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId && m.tradeOffer) {
          return {
            ...m,
            tradeOffer: {
              ...m.tradeOffer,
              status: action,
            },
          };
        }
        return m;
      })
    );

    if (action === 'ACCEPTED') {
      Alert.alert('Offer Accepted! 🤝', 'Trade deal confirmed. Escrow checkout is ready.');
    }
  };

  const toggleVoicePlayback = (msgId: string) => {
    if (playingVoiceId === msgId) {
      setPlayingVoiceId(null);
    } else {
      setPlayingVoiceId(msgId);
    }
  };

  const handleNavigateToPublicProfile = () => {
    const targetUserId = conversation.participantId || conversation.farmerId || 'f1';
    router.push(`/profile/${targetUserId}` as any);
  };

  const renderMessageBubble = ({ item }: { item: Message }) => {
    const isMe = item.senderId === 'user';

    return (
      <View style={[styles.bubbleWrapper, isMe ? styles.myBubbleWrapper : styles.theirBubbleWrapper]}>
        <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
          {/* 1. Voice Note Message */}
          {item.type === 'VOICE' ? (
            <View style={styles.voiceNoteContainer}>
              <TouchableOpacity
                style={[
                  styles.voicePlayBtn,
                  isMe ? styles.myVoicePlayBtn : styles.theirVoicePlayBtn,
                ]}
                onPress={() => toggleVoicePlayback(item.id)}
              >
                {playingVoiceId === item.id ? (
                  <Pause size={18} color={isMe ? Colors.white : Colors.white} />
                ) : (
                  <Play size={18} color={isMe ? Colors.white : Colors.white} />
                )}
              </TouchableOpacity>
              <View style={styles.waveformBox}>
                <View style={styles.waveformBars}>
                  {[12, 22, 16, 28, 14, 24, 18, 10, 20, 16, 26, 12].map((height, i) => (
                    <View
                      key={i}
                      style={[
                        styles.waveformBar,
                        {
                          height,
                          backgroundColor: isMe
                            ? playingVoiceId === item.id
                              ? Colors.gold
                              : 'rgba(255,255,255,0.7)'
                            : playingVoiceId === item.id
                            ? Colors.cultivated
                            : Colors.text.muted,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.voiceDuration, isMe ? styles.myVoiceDuration : styles.theirVoiceDuration]}>
                  0:{item.voiceNote?.durationSeconds || 15}
                </Text>
              </View>
            </View>
          ) : item.type === 'OFFER_CARD' && item.tradeOffer ? (
            /* 2. Trade Offer / Bargaining Card */
            <View style={styles.offerCard}>
              <View style={styles.offerHeader}>
                <Tag size={18} color={Colors.gold} />
                <Text style={styles.offerTitle}>Trade & Bargain Proposal</Text>
                <View
                  style={[
                    styles.statusPill,
                    item.tradeOffer.status === 'ACCEPTED'
                      ? styles.acceptedPill
                      : item.tradeOffer.status === 'DECLINED'
                      ? styles.declinedPill
                      : styles.pendingPill,
                  ]}
                >
                  <Text style={styles.statusPillText}>{item.tradeOffer.status}</Text>
                </View>
              </View>

              <View style={styles.offerBody}>
                {item.tradeOffer.yieldImage && (
                  <Image
                    source={{ uri: item.tradeOffer.yieldImage }}
                    style={styles.offerYieldImage}
                  />
                )}
                <View style={styles.offerDetails}>
                  <Text style={styles.offerYieldTitle} numberOfLines={2}>
                    {item.tradeOffer.yieldTitle}
                  </Text>
                  <Text style={styles.offerQuantity}>
                    Qty: <Text style={{ fontFamily: Fonts.bodyBold }}>{item.tradeOffer.quantity} {item.tradeOffer.unit}s</Text>
                  </Text>
                  <Text style={styles.offerPrice}>
                    Offer: <Text style={styles.offerPriceNumber}>{item.tradeOffer.offeredPricePerUnit.toLocaleString()} FCFA</Text> /{item.tradeOffer.unit}
                  </Text>
                  <Text style={styles.offerTotal}>
                    Total: <Text style={styles.offerTotalNumber}>{item.tradeOffer.totalAmount.toLocaleString()} FCFA</Text>
                  </Text>
                </View>
              </View>

              {item.tradeOffer.notes && (
                <Text style={styles.offerNotes}>"{item.tradeOffer.notes}"</Text>
              )}

              {/* Offer Interactive Action Buttons */}
              {item.tradeOffer.status === 'PENDING' && (
                <View style={styles.offerActionsRow}>
                  <TouchableOpacity
                    style={styles.acceptOfferBtn}
                    onPress={() => handleOfferAction(item.id, 'ACCEPTED')}
                  >
                    <Check size={16} color={Colors.white} />
                    <Text style={styles.acceptOfferBtnText}>Accept Offer</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.declineOfferBtn}
                    onPress={() => handleOfferAction(item.id, 'DECLINED')}
                  >
                    <X size={16} color={Colors.clay} />
                    <Text style={styles.declineOfferBtnText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            /* 3. Regular Text Message */
            <Text style={[styles.bubbleText, isMe ? styles.myBubbleText : styles.theirBubbleText]}>
              {item.content}
            </Text>
          )}

          {/* Timestamp & Read Status */}
          <View style={styles.timestampRow}>
            <Text style={[styles.timestampText, isMe ? styles.myTimestamp : styles.theirTimestamp]}>
              {item.timestamp || '10:00 AM'}
            </Text>
            {isMe && (
              <CheckCheck
                size={14}
                color={item.isRead ? Colors.gold : 'rgba(255,255,255,0.6)'}
                style={{ marginLeft: 3 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Clean White Top Header (No green banner) */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.espresso} />
        </TouchableOpacity>

        {/* Profile Info (Clicking avatar or name opens user's public profile page) */}
        <TouchableOpacity
          style={styles.headerProfileRow}
          onPress={handleNavigateToPublicProfile}
          activeOpacity={0.75}
        >
          <View style={styles.headerAvatarWrapper}>
            <Image
              source={{
                uri:
                  conversation.participantAvatar ||
                  conversation.farmerAvatar ||
                  'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=500&auto=format&fit=crop&q=60',
              }}
              style={styles.headerAvatar}
            />
            {conversation.isOnline && <View style={styles.headerOnlineDot} />}
          </View>

          <View style={styles.headerInfoCol}>
            <View style={styles.headerNameRow}>
              <Text style={styles.headerName} numberOfLines={1}>
                {conversation.participantName || conversation.farmerName}
              </Text>
              {conversation.isVerified && (
                <ShieldCheck size={16} color={Colors.cultivated} style={{ marginLeft: 4 }} />
              )}
            </View>
            <View style={styles.headerPartnerBadge}>
              <Text style={styles.headerPartnerBadgeText}>🤝 AgroPartner • View Profile</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.callShortcutBtn}
          onPress={() => Alert.alert('Voice Call', `Calling ${conversation.participantName || 'Partner'} via secure AgroMarket line...`)}
        >
          <Phone size={18} color={Colors.espresso} />
        </TouchableOpacity>
      </View>

      {/* Keyboard Avoiding Container for Message List and Input Bar */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Message List */}
        <FlatList
          data={messages}
          renderItem={renderMessageBubble}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        {/* Bottom Input Bar with Safe Area Inset to prevent phone nav buttons overlay */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) + 6 }]}>
          <TouchableOpacity
            style={styles.offerShortcutBtn}
            onPress={() => setOfferModalVisible(true)}
            activeOpacity={0.8}
          >
            <Tag size={20} color={Colors.gold} />
          </TouchableOpacity>

          <TextInput
            style={styles.inputField}
            placeholder="Type a message or price offer..."
            placeholderTextColor={Colors.text.muted}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />

          {inputText.trim().length > 0 ? (
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}>
              <Send size={18} color={Colors.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.micBtn} onPress={handleSendVoiceNote}>
              <Mic size={18} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Make Trade Offer / Bargaining Modal */}
      <Modal
        visible={offerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOfferModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) + 16 }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Sparkles size={18} color={Colors.gold} />
                <Text style={styles.modalTitle}>Make Trade Offer / Bargain</Text>
              </View>
              <TouchableOpacity onPress={() => setOfferModalVisible(false)}>
                <X size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Send a binding wholesale proposal directly to your AgroPartner:
            </Text>

            {/* Produce Selector Preview */}
            <View style={styles.modalYieldPreview}>
              <Image source={{ uri: selectedYield.image }} style={styles.modalYieldImg} />
              <View style={{ flex: 1 }}>
                <Text style={styles.modalYieldTitle}>{selectedYield.title}</Text>
                <Text style={styles.modalYieldPrice}>
                  Standard: {selectedYield.pricePerUnit || selectedYield.price} FCFA/{selectedYield.unit}
                </Text>
              </View>
            </View>

            {/* Quantity Input */}
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Quantity ({selectedYield.unit}s):</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={offerQuantity}
                onChangeText={setOfferQuantity}
              />
            </View>

            {/* Proposed Price Input */}
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Proposed Price per {selectedYield.unit} (FCFA):</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={offerPrice}
                onChangeText={setOfferPrice}
              />
            </View>

            {/* Total Calculated Preview */}
            <View style={styles.totalPreviewBox}>
              <Text style={styles.totalPreviewLabel}>Total Offer Escrow Amount:</Text>
              <Text style={styles.totalPreviewAmount}>
                {((parseFloat(offerQuantity) || 0) * (parseFloat(offerPrice) || 0)).toLocaleString()} FCFA
              </Text>
            </View>

            <TouchableOpacity style={styles.submitOfferBtn} onPress={handleCreateOffer}>
              <Tag size={16} color={Colors.white} />
              <Text style={styles.submitOfferBtnText}>Send Offer to Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.parchmentDim,
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.parchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerProfileRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  headerAvatarWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.parchment,
  },
  headerOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerInfoCol: {
    flex: 1,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.espresso,
  },
  headerPartnerBadge: {
    marginTop: 2,
  },
  headerPartnerBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.cultivated,
  },
  callShortcutBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.parchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  bubbleWrapper: {
    marginBottom: 14,
    maxWidth: '85%',
  },
  myBubbleWrapper: {
    alignSelf: 'flex-end',
  },
  theirBubbleWrapper: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    padding: 14,
    ...Shadows.subtle,
  },
  myBubble: {
    backgroundColor: Colors.canopy,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: Colors.parchment,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  bubbleText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 21,
  },
  myBubbleText: {
    color: Colors.white,
  },
  theirBubbleText: {
    color: Colors.espresso,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 5,
  },
  timestampText: {
    fontFamily: Fonts.body,
    fontSize: 11,
  },
  myTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  theirTimestamp: {
    color: Colors.text.muted,
  },
  voiceNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    minWidth: 190,
  },
  voicePlayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myVoicePlayBtn: {
    backgroundColor: Colors.gold,
  },
  theirVoicePlayBtn: {
    backgroundColor: Colors.cultivated,
  },
  waveformBox: {
    flex: 1,
  },
  waveformBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 30,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
  },
  voiceDuration: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    marginTop: 2,
  },
  myVoiceDuration: {
    color: Colors.parchment,
  },
  theirVoiceDuration: {
    color: Colors.text.secondary,
  },
  offerCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: Radii.card,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  offerTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.espresso,
    flex: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  pendingPill: {
    backgroundColor: '#FEF3C7',
  },
  acceptedPill: {
    backgroundColor: '#D1FAE5',
  },
  declinedPill: {
    backgroundColor: '#FEE2E2',
  },
  statusPillText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.espresso,
  },
  offerBody: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  offerYieldImage: {
    width: 64,
    height: 64,
    borderRadius: Radii.sm,
    backgroundColor: Colors.parchment,
  },
  offerDetails: {
    flex: 1,
  },
  offerYieldTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.espresso,
  },
  offerQuantity: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 3,
  },
  offerPrice: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  offerPriceNumber: {
    color: Colors.soil,
    fontFamily: Fonts.bodyBold,
  },
  offerTotal: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.canopy,
    marginTop: 3,
  },
  offerTotalNumber: {
    fontFamily: Fonts.bodyBold,
    color: Colors.gold,
  },
  offerNotes: {
    fontFamily: Fonts.body,
    fontStyle: 'italic',
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 10,
  },
  offerActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  acceptOfferBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cultivated,
    paddingVertical: 9,
    borderRadius: Radii.pill,
    gap: 4,
  },
  acceptOfferBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.white,
  },
  declineOfferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
    gap: 4,
  },
  declineOfferBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.clay,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.parchmentDim,
    gap: 8,
  },
  offerShortcutBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEF7EE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE4BE',
  },
  inputField: {
    flex: 1,
    backgroundColor: Colors.parchment,
    borderRadius: Radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.espresso,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.canopy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.cultivated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(36,26,18,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    color: Colors.espresso,
  },
  modalSub: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 14,
  },
  modalYieldPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.parchment,
    padding: 12,
    borderRadius: Radii.card,
    gap: 12,
    marginBottom: 14,
  },
  modalYieldImg: {
    width: 50,
    height: 50,
    borderRadius: Radii.sm,
  },
  modalYieldTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.espresso,
  },
  modalYieldPrice: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  formRow: {
    marginBottom: 12,
  },
  formLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.espresso,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: Colors.parchment,
    borderRadius: Radii.input,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.espresso,
  },
  totalPreviewBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEF7EE',
    padding: 14,
    borderRadius: Radii.card,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#FDE4BE',
  },
  totalPreviewLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.espresso,
  },
  totalPreviewAmount: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
    color: Colors.gold,
  },
  submitOfferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.canopy,
    paddingVertical: 14,
    borderRadius: Radii.pill,
    gap: 6,
  },
  submitOfferBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.white,
  },
});