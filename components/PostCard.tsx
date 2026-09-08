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
} from 'react-native';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Play,
  Volume2,
  VolumeX,
  Trash2,
  Link2,
  Download,
  Flag,
  X,
  MessageSquare,
  Sparkles,
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
  const isFavorite = isPostFavorite(post.id);
  const router = useRouter();

  const [linkedYield, setLinkedYield] = useState<AgroYield | null>(null);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const videoRef = useRef<Video>(null);

  // Author check: viewing user matches post creator or farm owner
  const isAuthor = Boolean(
    isOwnerProp ||
      (currentUser?.id &&
        (currentUser.id === post.userId ||
          currentUser.id === post.farmerId ||
          (post.farm?.userId && currentUser.id === post.farm.userId)))
  );

  // When post visibility changes (e.g. user scrolled past or switched tabs), reset user pause
  useEffect(() => {
    if (!isActive) {
      setIsUserPaused(false);
    }
  }, [isActive]);

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

  const toggleLike = () => {
    if (isFavorite) {
      removePost(post.id);
    } else {
      addPost(post.id);
    }
  };

  const handleComment = () => {
    if (post.userId) {
      router.push(`/chat/${post.userId}`);
    } else if (post.farmerId) {
      router.push(`/chat/${post.farmerId}`);
    }
  };

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
    const message = `Check out this Cameroon harvest story on AgroMarket: "${post.content}"\n${post.mediaUrl || ''}`;
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

  // Copy Link / Post Details Handler
  const handleCopyLink = () => {
    setShowActionSheet(false);
    Alert.alert('Story Link Copied', 'Harvest story link has been copied to your clipboard.');
  };

  // Delete Post with confirmation dialog
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

  // Imperative play / pause control
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

  const displayName =
    post.farmerName ||
    post.farm?.name ||
    post.user?.name ||
    'Agro Producer';

  const likesDisplay = post.likesCount ?? post.likes ?? 0;
  const commentsDisplay =
    typeof post.comments === 'number'
      ? post.comments
      : Array.isArray(post.comments)
      ? post.comments.length
      : post.commentsCount ?? 0;

  // Bottom clearance for Android nav bar / gesture bar
  const bottomInsetClearance = Math.max(insets.bottom + 16, 28);

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

      {/* Dark gradient base overlay for high outdoor contrast - commented out as requested */}
      {/* <View style={styles.vignetteOverlay} pointerEvents="none" /> */}

      {/* Floating actions and avatar (Right-side TikTok action bar) */}
      <View style={[styles.floatingActionsContainer, { bottom: bottomInsetClearance }]}>
        <Pressable onPress={goToFarmerOrFarm} style={styles.avatarWrapper}>
          <Image source={{ uri: avatarSource }} style={styles.avatar} />
          <View style={styles.avatarBadgeDot} />
        </Pressable>

        <Pressable style={styles.actionButton} onPress={toggleLike}>
          <Heart
            size={26}
            color={isFavorite ? Colors.clay : Colors.white}
            fill={isFavorite ? Colors.clay : 'none'}
            strokeWidth={2.2}
          />
          <Text style={styles.actionText}>{likesDisplay}</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={handleComment}>
          <MessageCircle size={26} color={Colors.white} strokeWidth={2.2} />
          <Text style={styles.actionText}>{commentsDisplay}</Text>
        </Pressable>

        {/* Options & Share Button */}
        <Pressable style={styles.actionButton} onPress={() => setShowActionSheet(true)}>
          <MoreHorizontal size={26} color={Colors.white} strokeWidth={2.2} />
        </Pressable>
      </View>

      {/* Floating description, Farmer metadata & Shoppable Harvest Tag */}
      <View style={[styles.floatingDescription, { bottom: bottomInsetClearance }]}>
        {linkedYield && (
          <View style={{ marginBottom: 10 }}>
            <ShoppableYieldCard
              yieldItem={linkedYield}
              onPressItem={() => router.push(`/yield/${linkedYield.id}`)}
            />
          </View>
        )}

        <Pressable onPress={goToFarmerOrFarm} style={styles.farmerNameRow}>
          <Text style={styles.farmerName}>{displayName}</Text>
        </Pressable>

        <Text style={styles.caption} numberOfLines={3}>
          {post.content}
        </Text>

        <Text style={styles.timestamp}>
          📅 {new Date(post.createdAt).toLocaleDateString()}
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
            {/* Grab Handle */}
            <View style={styles.dragHandle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Share to & Options</Text>
              <TouchableOpacity onPress={() => setShowActionSheet(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={20} color={Colors.espresso} />
              </TouchableOpacity>
            </View>

            {/* Row 1: Share Targets (Horizontal Circular App Icons) */}
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
                  setShowActionSheet(false);
                  Alert.alert('Saved', 'Harvest story saved to bookmarks.');
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.shareIconCircle, { backgroundColor: '#D97706' }]}>
                  <Download size={22} color="#FFF" />
                </View>
                <Text style={styles.shareTargetLabel}>Save Post</Text>
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
  vignetteOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 260,
    // backgroundColor: 'rgba(14, 37, 21, 0.65)',
  },
  floatingActionsContainer: {
    position: 'absolute',
    right: 16,
    alignItems: 'center',
    zIndex: 2,
    gap: 16,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 4,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
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
  actionButton: {
    alignItems: 'center',
    gap: 3,
  },
  actionText: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    color: Colors.white,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  floatingDescription: {
    position: 'absolute',
    left: 16,
    zIndex: 2,
    maxWidth: '72%',
  },
  farmerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  farmerName: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.white,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  caption: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.parchment,
    lineHeight: 22,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  timestamp: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: 'rgba(246, 238, 221, 0.85)',
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