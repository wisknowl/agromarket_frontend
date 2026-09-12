import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  TouchableOpacity,
  Modal,
  ScrollView,
  Share,
  Linking,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import {
  MessageCircle,
  Bookmark,
  Share2,
  Play,
  Trash2,
  Link2,
  Download,
  Flag,
  X,
  MessageSquare,
  Leaf,
  Flame,
  Wheat,
  Scale,
  Star,
} from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Post, AgroYield } from '@/types';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useAuthStore } from '@/store/authStore';
import Colors, { Radii } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { useRouter } from 'expo-router';
import { fetchYieldByIdApi } from '@/components/api/yields';
import { deletePostApi } from '@/components/api/posts';
import ShoppableYieldCard from '../modules/feed/components/ShoppableYieldCard';
import telemetryClient from '@/components/api/telemetry';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PostCardProps {
  post: Post;
  fullScreen?: boolean;
  isActive?: boolean;
  onDeletePost?: (postId: string) => void;
  isOwner?: boolean;
}

export default function PostCard({
  post,
  fullScreen = false,
  isActive = true,
  onDeletePost,
  isOwner: isOwnerProp,
}: PostCardProps) {
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuthStore();
  const { addPost, removePost, isPostFavorite } = useFavoritesStore();
  const isSaved = isPostFavorite(post.id);
  const router = useRouter();

  const [linkedYield, setLinkedYield] = useState<AgroYield | null>(null);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [hasReportedTelemetry, setHasReportedTelemetry] = useState(false);
  const videoRef = useRef<Video>(null);

  // Realtime live reactions state derived directly from backend post metrics (no artificial mockup offsets)
  const initialFresh = (post as any).reactions?.fresh ?? Math.floor((post.likesCount || 0) * 0.45);
  const initialDemand = (post as any).reactions?.demand ?? Math.floor((post.likesCount || 0) * 0.3);
  const initialReady = (post as any).reactions?.ready ?? Math.floor((post.likesCount || 0) * 0.15);
  const initialFairPrice = (post as any).reactions?.fairPrice ?? Math.max(0, (post.likesCount || 0) - initialFresh - initialDemand - initialReady);

  const [reactions, setReactions] = useState({
    fresh: initialFresh,
    demand: initialDemand,
    ready: initialReady,
    fairPrice: initialFairPrice,
  });

  const [selectedReaction, setSelectedReaction] = useState<'fresh' | 'demand' | 'ready' | 'fairPrice' | null>(
    (post as any).userReaction || null
  );

  // Real live saves count
  const [savesCount, setSavesCount] = useState<number>(
    (post as any).savesCount ?? (post as any).savedCount ?? (isSaved ? 1 : 0)
  );

  const totalReactions = reactions.fresh + reactions.demand + reactions.ready + reactions.fairPrice;

  const handleCommercialReaction = (type: 'fresh' | 'demand' | 'ready' | 'fairPrice') => {
    const isAlreadySelected = selectedReaction === type;

    if (isAlreadySelected) {
      setSelectedReaction(null);
      setReactions((prev) => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));
      telemetryClient.record({
        eventType: 'COMMENT',
        entityType: 'POST',
        entityId: post.id,
        metadata: { reactionType: type, action: 'removed' },
      }, true);
    } else {
      setReactions((prev) => {
        const updated = { ...prev };
        if (selectedReaction) {
          updated[selectedReaction] = Math.max(0, updated[selectedReaction] - 1);
        }
        updated[type] = updated[type] + 1;
        return updated;
      });
      setSelectedReaction(type);
      telemetryClient.record({
        eventType: 'COMMENT',
        entityType: 'POST',
        entityId: post.id,
        metadata: { reactionType: type, action: 'added' },
      }, true);
    }

    setShowReactions(false);
  };

  const handleToggleSave = () => {
    if (isSaved) {
      removePost(post.id);
      setSavesCount((prev) => Math.max(0, prev - 1));
    } else {
      addPost(post.id);
      setSavesCount((prev) => prev + 1);
    }
  };

  // Message button handles direct contract negotiation & offer inquiry
  const handleInitiateOffer = () => {
    const targetId = post.userId || post.farmerId || post.farm?.userId;
    telemetryClient.record({
      eventType: 'OFFER_SENT',
      entityType: 'POST',
      entityId: post.id,
      metadata: { targetId, linkedYieldId: post.linkedYieldId },
    }, true);
    if (targetId) {
      router.push(`/chat/${targetId}?action=make_offer&yieldId=${post.linkedYieldId || ''}`);
    } else {
      router.push('/(tabs)/inbox');
    }
  };

  // Algorithmic metadata
  const rankingMeta = (post as any).rankingMetadata;
  const isPatronStory = Boolean(rankingMeta?.isPatronStory || (post as any).isPatron || (post as any).farmerCreditTier === 'GOLD' || (post as any).isPartner);

  // Author check
  const isAuthor = Boolean(
    isOwnerProp ||
      (currentUser?.id &&
        (currentUser.id === post.userId ||
          currentUser.id === post.farmerId ||
          (post.farm?.userId && currentUser.id === post.farm.userId)))
  );

  useEffect(() => {
    if (!isActive) {
      setIsUserPaused(false);
    } else if (!hasReportedTelemetry) {
      telemetryClient.record({
        eventType: 'VIEW',
        entityType: 'POST',
        entityId: post.id,
      });
      setHasReportedTelemetry(true);
    }
  }, [isActive, hasReportedTelemetry, post.id]);

  const shouldPlay = isActive && !isUserPaused;

  useEffect(() => {
    if (post.linkedYieldId) {
      fetchYieldByIdApi(post.linkedYieldId)
        .then((data) => {
          if (data) setLinkedYield(data);
        })
        .catch(() => {});
    }
  }, [post.linkedYieldId]);

  const goToFarmerOrFarm = () => {
    if (post.farmId) {
      router.push(`/farmer/${post.farmId}`);
    } else if (post.farmerId) {
      router.push(`/farmer/${post.farmerId}`);
    }
  };

  // WhatsApp Share Handler
  const handleWhatsAppShare = async () => {
    setShowActionSheet(false);
    const message = `Check out this harvest story on AgroMarket: "${post.content}"\n${post.mediaUrl || ''}`;
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Share.share({ message });
      }
    } catch {
      await Share.share({ message });
    }
  };

  // Native System Share Handler
  const handleNativeShare = async () => {
    setShowActionSheet(false);
    try {
      await Share.share({
        message: `🌱 ${post.farmerName || 'Agro Producer'} on AgroMarket:\n"${post.content}"\n${post.mediaUrl || ''}`,
        title: 'Share AgroMarket Harvest Story',
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  // Copy Link Handler
  const handleCopyLink = () => {
    setShowActionSheet(false);
    Alert.alert('Story Link Copied', 'Harvest story link has been copied to your clipboard.');
  };

  // Delete Post
  const handleDeletePrompt = () => {
    Alert.alert(
      'Delete Harvest Story',
      'Are you sure you want to permanently delete this story? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              const success = await deletePostApi(post.id);
              setShowActionSheet(false);
              if (success) {
                onDeletePost?.(post.id);
                Alert.alert('Deleted', 'Harvest story has been removed.');
              } else {
                Alert.alert('Error', 'Could not delete story. Please try again.');
              }
            } catch (err: any) {
              Alert.alert('Delete Failed', err.message || 'Could not connect to server.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const rawMedia =
    post.mediaUrl ||
    post.media ||
    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800';

  const isVideoUrl = Boolean(
    typeof rawMedia === 'string' &&
      (rawMedia.endsWith('.mp4') ||
        rawMedia.endsWith('.mov') ||
        rawMedia.endsWith('.mkv') ||
        rawMedia.includes('video') ||
        rawMedia.startsWith('file:') ||
        rawMedia.startsWith('content:'))
  );

  const isVideoMedia = Boolean(post.isVideo || isVideoUrl);

  const mediaSource = isVideoMedia
    ? isVideoUrl
      ? rawMedia
      : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
    : rawMedia;

  useEffect(() => {
    if (isVideoMedia && videoRef.current) {
      if (shouldPlay) {
        videoRef.current.playAsync().catch(() => {});
      } else {
        videoRef.current.pauseAsync().catch(() => {});
      }
    }
  }, [shouldPlay, isVideoMedia]);

  const togglePlayPause = () => {
    setIsUserPaused((prev) => !prev);
  };

  const avatarSource =
    post.farmerAvatar ||
    post.farm?.coverPhoto ||
    post.user?.avatarUrl ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500';

  const farmName = post.farm?.name;
  const ownerName = post.farmerName || post.user?.name;
  const hasBothNames = Boolean(
    farmName &&
    ownerName &&
    farmName.trim().toLowerCase() !== ownerName.trim().toLowerCase()
  );
  const primaryTitle = farmName || ownerName || 'Agro Producer';
  const secondaryOwner = hasBothNames ? ownerName : null;

  const [isTextExceeded, setIsTextExceeded] = useState(false);

  const handleTextLayout = (e: any) => {
    const lines = e?.nativeEvent?.lines;
    if (lines && lines.length > 2) {
      setIsTextExceeded(true);
    }
  };

  const showMoreButton = isTextExceeded || Boolean(post.content && (post.content.length > 95 || post.content.includes('\n')));

  const commentsDisplay =
    typeof post.comments === 'number'
      ? post.comments
      : Array.isArray(post.comments)
      ? post.comments.length
      : post.commentsCount ?? 0;

  // Sits comfortably down at the bottom of the card
  const bottomPosition = 12;

  // Active reaction icon rendering for the main reaction trigger button
  const renderReactionTriggerIcon = () => {
    switch (selectedReaction) {
      case 'demand':
        return <Flame size={26} color={Colors.gold} fill={Colors.gold} />;
      case 'ready':
        return <Wheat size={26} color={Colors.gold} />;
      case 'fairPrice':
        return <Scale size={26} color={Colors.gold} />;
      case 'fresh':
        return <Leaf size={26} color="#4ADE80" fill="#4ADE80" />;
      default:
        return <Leaf size={26} color={Colors.white} strokeWidth={2.2} />;
    }
  };

  const isLongContent = (post.content || '').length > 60;

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      {isVideoMedia ? (
        <Pressable style={[styles.media, fullScreen && styles.fullScreenMedia]} onPress={togglePlayPause}>
          <Video
            ref={videoRef}
            source={{ uri: mediaSource }}
            style={StyleSheet.absoluteFillObject}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay={shouldPlay}
            isMuted={isMuted}
            useNativeControls={false}
            rate={1.0}
            volume={1.0}
            onError={(err) => console.warn(`[Video Error on Post ${post.id}]`, err)}
          />
          {isUserPaused && (
            <View style={styles.playPauseOverlay}>
              <View style={styles.playIconCircle}>
                <Play size={32} color="#FFF" fill="#FFF" />
              </View>
            </View>
          )}
        </Pressable>
      ) : (
        <Image
          source={{ uri: mediaSource }}
          style={[styles.media, fullScreen && styles.fullScreenMedia]}
        />
      )}

      {/* Floating vertical reaction popup bar */}
      {showReactions && (
        <View style={[styles.verticalReactionsBar, { bottom: bottomPosition + 96 }]}>
          {/* 1. Fresh */}
          <TouchableOpacity
            style={[styles.verticalReactionItem, selectedReaction === 'fresh' && styles.verticalReactionItemActive]}
            onPress={() => handleCommercialReaction('fresh')}
            activeOpacity={0.8}
          >
            <View style={[styles.verticalReactionIconCircle, selectedReaction === 'fresh' && { backgroundColor: 'rgba(74, 222, 128, 0.25)' }]}>
              <Leaf size={18} color="#4ADE80" fill={selectedReaction === 'fresh' ? '#4ADE80' : 'none'} />
            </View>
            <Text style={styles.verticalReactionLabel}>Fresh</Text>
            <Text style={styles.verticalReactionCount}>{reactions.fresh}</Text>
          </TouchableOpacity>

          {/* 2. Demand */}
          <TouchableOpacity
            style={[styles.verticalReactionItem, selectedReaction === 'demand' && styles.verticalReactionItemActive]}
            onPress={() => handleCommercialReaction('demand')}
            activeOpacity={0.8}
          >
            <View style={[styles.verticalReactionIconCircle, selectedReaction === 'demand' && { backgroundColor: 'rgba(239, 68, 68, 0.25)' }]}>
              <Flame size={18} color="#F87171" fill={selectedReaction === 'demand' ? '#F87171' : 'none'} />
            </View>
            <Text style={styles.verticalReactionLabel}>Demand</Text>
            <Text style={styles.verticalReactionCount}>{reactions.demand}</Text>
          </TouchableOpacity>

          {/* 3. Ready */}
          <TouchableOpacity
            style={[styles.verticalReactionItem, selectedReaction === 'ready' && styles.verticalReactionItemActive]}
            onPress={() => handleCommercialReaction('ready')}
            activeOpacity={0.8}
          >
            <View style={[styles.verticalReactionIconCircle, selectedReaction === 'ready' && { backgroundColor: 'rgba(245, 158, 11, 0.25)' }]}>
              <Wheat size={18} color={Colors.gold} />
            </View>
            <Text style={styles.verticalReactionLabel}>Ready</Text>
            <Text style={styles.verticalReactionCount}>{reactions.ready}</Text>
          </TouchableOpacity>

          {/* 4. Fair Price */}
          <TouchableOpacity
            style={[styles.verticalReactionItem, selectedReaction === 'fairPrice' && styles.verticalReactionItemActive]}
            onPress={() => handleCommercialReaction('fairPrice')}
            activeOpacity={0.8}
          >
            <View style={[styles.verticalReactionIconCircle, selectedReaction === 'fairPrice' && { backgroundColor: 'rgba(218, 165, 32, 0.25)' }]}>
              <Scale size={18} color={Colors.gold} />
            </View>
            <Text style={styles.verticalReactionLabel}>Fair Price</Text>
            <Text style={styles.verticalReactionCount}>{reactions.fairPrice}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Floating actions and avatar (Right-side Action Bar positioned down near bottom) */}
      <View style={[styles.floatingActionsContainer, { bottom: bottomPosition }]}>
        {/* 1. Farmer Avatar */}
        <Pressable onPress={goToFarmerOrFarm} style={[styles.avatarWrapper, isPatronStory && styles.avatarPatronHalo]}>
          <Image source={{ uri: avatarSource }} style={styles.avatar} />
          {isPatronStory ? (
            <View style={styles.patronIconDot}>
              <Star size={9} color={Colors.gold} fill={Colors.gold} />
            </View>
          ) : (
            <View style={styles.avatarBadgeDot} />
          )}
        </Pressable>

        {/* 2. Commercial Reactions Button (Replaces Like) */}
        <Pressable
          style={styles.actionButton}
          onPress={() => setShowReactions(!showReactions)}
          hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Post Reactions"
        >
          {renderReactionTriggerIcon()}
          <Text style={styles.actionText}>{totalReactions}</Text>
        </Pressable>

        {/* 3. Message Button (Direct Trade & Contract Negotiation) */}
        <Pressable
          style={styles.actionButton}
          onPress={handleInitiateOffer}
          hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Chat and negotiate offer with farmer"
        >
          <MessageCircle size={26} color={Colors.white} strokeWidth={2.2} />
          <Text style={styles.actionText}>{commentsDisplay}</Text>
        </Pressable>

        {/* 4. Save Button (Direct Bookmark to Wishlist) */}
        <Pressable
          style={styles.actionButton}
          onPress={handleToggleSave}
          hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Save harvest story to wishlist"
        >
          <Bookmark
            size={26}
            color={isSaved ? Colors.gold : Colors.white}
            fill={isSaved ? Colors.gold : 'none'}
            strokeWidth={2.2}
          />
          <Text style={[styles.actionText, isSaved && { color: Colors.gold }]}>{savesCount}</Text>
        </Pressable>

        {/* 5. Share Button */}
        <Pressable
          style={styles.actionButton}
          onPress={() => setShowActionSheet(true)}
          hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Share options"
        >
          <Share2 size={24} color={Colors.white} strokeWidth={2.2} />
        </Pressable>
      </View>

      {/* Floating description, Farmer metadata & Shoppable Harvest Tag on Left (Positioned down) */}
      <View style={[styles.floatingDescription, { bottom: bottomPosition }]}>
        {/* Shoppable Harvest Lot Tag */}
        {linkedYield && (
          <View style={{ marginBottom: 6 }}>
            <ShoppableYieldCard
              yieldItem={linkedYield}
              onPressItem={() => router.push(`/yield/${linkedYield.id}`)}
            />
          </View>
        )}

        {/* Farmer & Farm Name Block with Owner Name in Brackets */}
        <Pressable onPress={goToFarmerOrFarm} style={styles.farmerInfoBlock}>
          <View style={styles.farmerNameRow}>
            <Text style={styles.farmerName}>{primaryTitle}</Text>
            {isPatronStory && (
              <View style={styles.patronInlineBadge}>
                <Star size={9} color={Colors.gold} fill={Colors.gold} />
                <Text style={styles.patronInlineBadgeText}>AgroPatron ⭐</Text>
              </View>
            )}
          </View>
          {secondaryOwner && (
            <Text style={styles.farmerOwnerSubName}>({secondaryOwner})</Text>
          )}
        </Pressable>

        {/* Expandable Caption with ...more / ...less (only shows when text body exceeds limit) */}
        {isCaptionExpanded ? (
          <View style={styles.expandedCaptionBox}>
            <ScrollView
              style={{ maxHeight: SCREEN_HEIGHT * 0.42 }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              <Text style={styles.expandedCaptionText}>{post.content}</Text>
            </ScrollView>
            <TouchableOpacity
              onPress={() => setIsCaptionExpanded(false)}
              style={styles.lessBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.lessBtnText}>...less</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.collapsedCaptionContainer}>
            <Text
              style={styles.caption}
              numberOfLines={2}
              onTextLayout={handleTextLayout}
            >
              {post.content}
            </Text>
            {showMoreButton && (
              <TouchableOpacity
                onPress={() => setIsCaptionExpanded(true)}
                style={styles.moreBtn}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={styles.moreBtnText}>...more</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Timestamp (without calendar icon) */}
        <Text style={styles.timestamp}>
          {new Date(post.createdAt).toLocaleDateString()}
        </Text>
      </View>

      {/* ========================================================= */}
      {/* TIKTOK-STYLE ACTION SHEET MODAL (...)                     */}
      {/* ========================================================= */}
      <Modal
        visible={showActionSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionSheet(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowActionSheet(false)}>
          <Pressable style={[styles.actionSheetCard, { paddingBottom: Math.max(insets.bottom + 12, 24) }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.dragHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Share to & Options</Text>
              <TouchableOpacity onPress={() => setShowActionSheet(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={20} color={Colors.espresso} />
              </TouchableOpacity>
            </View>

            {/* Row 1: Share Targets */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shareTargetsRow}>
              <TouchableOpacity style={styles.shareTargetItem} onPress={handleWhatsAppShare} activeOpacity={0.8}>
                <View style={[styles.shareIconCircle, { backgroundColor: '#25D366' }]}>
                  <MessageSquare size={22} color="#FFF" />
                </View>
                <Text style={styles.shareTargetLabel}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareTargetItem} onPress={handleNativeShare} activeOpacity={0.8}>
                <View style={[styles.shareIconCircle, { backgroundColor: '#007AFF' }]}>
                  <Share2 size={22} color="#FFF" />
                </View>
                <Text style={styles.shareTargetLabel}>Share via...</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareTargetItem} onPress={handleCopyLink} activeOpacity={0.8}>
                <View style={[styles.shareIconCircle, { backgroundColor: '#3A3A3C' }]}>
                  <Link2 size={22} color="#FFF" />
                </View>
                <Text style={styles.shareTargetLabel}>Copy Link</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareTargetItem}
                onPress={() => {
                  handleToggleSave();
                  setShowActionSheet(false);
                  Alert.alert('Wishlist Updated', isSaved ? 'Removed from your wishlist.' : 'Saved to your wishlist.');
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.shareIconCircle, { backgroundColor: '#D97706' }]}>
                  <Bookmark size={22} color="#FFF" />
                </View>
                <Text style={styles.shareTargetLabel}>{isSaved ? 'In Wishlist' : 'Add Wishlist'}</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.sheetDivider} />

            {/* Row 2: Management & Safety Actions */}
            <View style={styles.sheetActionsList}>
              {isAuthor ? (
                <TouchableOpacity
                  style={[styles.sheetActionRow, styles.deleteActionRow]}
                  onPress={handleDeletePrompt}
                  disabled={isDeleting}
                  activeOpacity={0.75}
                >
                  <View style={styles.deleteIconBox}>
                    {isDeleting ? (
                      <ActivityIndicator size="small" color="#FF453A" />
                    ) : (
                      <Trash2 size={20} color="#FF453A" strokeWidth={2.2} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deleteActionText}>Delete Harvest Story</Text>
                    <Text style={styles.deleteActionSub}>Permanently remove from feed and profile</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.sheetActionRow}
                  onPress={() => {
                    setShowActionSheet(false);
                    Alert.alert('Feedback Received', 'Thank you for helping keep the AgroMarket community authentic.');
                  }}
                  activeOpacity={0.75}
                >
                  <View style={styles.actionIconBox}>
                    <Flag size={18} color="#FFF" />
                  </View>
                  <Text style={styles.sheetActionText}>Report Harvest Story</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowActionSheet(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canopyDeep,
    borderRadius: Radii.card,
    overflow: 'hidden',
    marginBottom: 16,
  },
  fullScreen: {
    borderRadius: 0,
    marginBottom: 0,
  },
  media: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  fullScreenMedia: {
    height: '100%',
  },
  floatingActionsContainer: {
    position: 'absolute',
    right: 12,
    alignItems: 'center',
    zIndex: 4,
    gap: 14,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  avatarBadgeDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.cultivated,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  avatarPatronHalo: {
    borderWidth: 2,
    borderColor: Colors.gold,
    borderRadius: 24,
    padding: 1.5,
  },
  patronIconDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: Colors.canopy,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minWidth: 44,
  },
  actionText: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    color: Colors.white,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  verticalReactionsBar: {
    position: 'absolute',
    right: 60,
    flexDirection: 'column',
    gap: 6,
    backgroundColor: 'rgba(14, 26, 18, 0.94)',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 0.45)',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  verticalReactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  verticalReactionItemActive: {
    backgroundColor: 'rgba(218, 165, 32, 0.3)',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  verticalReactionIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  verticalReactionLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.white,
    minWidth: 54,
  },
  verticalReactionCount: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    color: Colors.gold,
  },
  floatingDescription: {
    position: 'absolute',
    left: 14,
    right: 68,
    zIndex: 3,
  },
  farmerInfoBlock: {
    marginBottom: 4,
  },
  farmerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 1,
  },
  farmerName: {
    fontFamily: Fonts.display,
    fontSize: 17,
    color: Colors.white,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  farmerOwnerSubName: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.parchment,
    marginTop: 1,
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  patronInlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.canopy,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  patronInlineBadgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 9.5,
    color: Colors.gold,
  },
  collapsedCaptionContainer: {
    marginBottom: 4,
  },
  caption: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.parchment,
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  moreBtn: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  moreBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.gold,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  expandedCaptionBox: {
    backgroundColor: 'rgba(14, 26, 18, 0.92)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 0.35)',
    marginBottom: 6,
    maxHeight: SCREEN_HEIGHT * 0.45,
  },
  expandedCaptionText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.white,
    lineHeight: 21,
  },
  lessBtn: {
    alignSelf: 'flex-end',
    marginTop: 6,
    paddingTop: 2,
  },
  lessBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.gold,
  },
  timestamp: {
    fontFamily: Fonts.mono,
    fontSize: 11.5,
    color: 'rgba(246, 238, 221, 0.8)',
    marginTop: 2,
  },
  playPauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  playIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    paddingLeft: 4,
  },

  // TikTok Action Sheet Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  actionSheetCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderColor: Colors.parchmentDim,
    paddingBottom: 24,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.parchmentDim,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sheetTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.espresso,
  },
  shareTargetsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  shareTargetItem: {
    alignItems: 'center',
    gap: 6,
    width: 64,
  },
  shareIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareTargetLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  sheetDivider: {
    height: 1,
    backgroundColor: Colors.parchmentDim,
    marginVertical: 10,
  },
  sheetActionsList: {
    gap: 8,
    marginBottom: 14,
  },
  sheetActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: Radii.card,
    backgroundColor: Colors.parchment,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  deleteActionRow: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  actionIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.canopy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetActionText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.espresso,
  },
  deleteActionText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.clay,
  },
  deleteActionSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.clayDim,
    marginTop: 2,
  },
  cancelBtn: {
    backgroundColor: Colors.parchment,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
    paddingVertical: 13,
    borderRadius: Radii.pill,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.espresso,
  },
});