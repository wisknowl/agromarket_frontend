import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Platform,
  ActivityIndicator,
  Modal,
  Dimensions,
  Animated,
  StatusBar,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions, FlashMode } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import Svg, { Circle } from 'react-native-svg';
import {
  X,
  FlipHorizontal,
  Zap,
  ZapOff,
  Timer as TimerIcon,
  Sparkles,
  Sliders,
  Grid,
  Music,
  Check,
  ChevronRight,
  ChevronLeft,
  ShoppingBag,
  MapPin,
  Tag,
  Type,
  RotateCcw,
  Layers,
  Flame,
  Volume2,
  VolumeX,
  Send,
  Camera as CameraIcon,
  Image as ImageIcon,
  Trash2,
  Bookmark,
  Sticker,
  Edit3,
} from 'lucide-react-native';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { useAuthStore } from '@/store/authStore';
import { createPostApi, uploadMediaApi } from '@/components/api/posts';
import { fetchFarmYieldsApi } from '@/components/api/yields';
import { fetchMyFarmsApi } from '@/modules/farms/api';
import { AgroYield, Farm } from '@/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type CameraMode = '10m' | '60s' | '15s' | 'Photo' | 'Text';
type FlowStep = 'camera' | 'media_preview' | 'post_details';

const SPEED_OPTIONS = ['0.3x', '0.5x', '1x', '2x', '3x'];
const TIMER_OPTIONS = [0, 3, 10]; // seconds
const FILTER_PRESETS = [
  { id: 'normal', name: 'Natural', color: 'transparent' },
  { id: 'vibrant', name: 'Vibrant', color: 'rgba(255, 170, 0, 0.12)' },
  { id: 'golden', name: 'Golden Hour', color: 'rgba(255, 130, 0, 0.18)' },
  { id: 'fresh', name: 'Crisp Green', color: 'rgba(46, 125, 50, 0.15)' },
  { id: 'soil', name: 'Deep Earth', color: 'rgba(109, 76, 65, 0.15)' },
];

const TEXT_BACKGROUNDS = [
  { id: 'bg1', color: '#1B4332', label: 'Forest' },
  { id: 'bg2', color: '#D97706', label: 'Amber' },
  { id: 'bg3', color: '#991B1B', label: 'Ruby' },
  { id: 'bg4', color: '#1E3A8A', label: 'Ocean' },
  { id: 'bg5', color: '#312E81', label: 'Indigo' },
  { id: 'bg6', color: '#262626', label: 'Charcoal' },
];

const SUGGESTED_HASHTAGS = [
  '#FreshHarvest',
  '#FoumbotTomatoes',
  '#CameroonAgri',
  '#OrganicFarming',
  '#DirectFromFarm',
  '#HighlandPotatoes',
  '#WholesaleProduce',
];

export default function CreatePostCameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const cameraRef = useRef<any>(null);

  // Flow Step: 1. camera -> 2. media_preview -> 3. post_details
  const [step, setStep] = useState<FlowStep>('camera');

  // Camera & Microphone permissions
  const [permission, requestPermission] = useCameraPermissions();
  const [microPermission, requestMicroPermission] = useMicrophonePermissions();

  // Auto request camera & microphone permissions immediately on mounting
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission().catch(() => {});
    }
    if (!microPermission?.granted) {
      requestMicroPermission().catch(() => {});
    }
  }, [permission, microPermission]);

  // Camera Settings
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [mode, setMode] = useState<CameraMode>('Photo');
  const [speedIndex, setSpeedIndex] = useState(2); // 1x
  const [timerSec, setTimerSec] = useState(0); // 0, 3, 10
  const [selectedFilter, setSelectedFilter] = useState(FILTER_PRESETS[0]);
  const [showFilterTray, setShowFilterTray] = useState(false);
  const [collageMode, setCollageMode] = useState(false);
  const [isEnhanceOn, setIsEnhanceOn] = useState(true);

  // Recording & Shutter State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isRecordingOnHold, setIsRecordingOnHold] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const recordingTimerRef = useRef<any>(null);
  const recordingPromiseRef = useRef<Promise<any> | null>(null);
  const shutterScale = useRef(new Animated.Value(1)).current;

  // Max duration limit based on mode
  const maxDurationLimit =
    mode === '15s' ? 15 : mode === '60s' ? 60 : mode === '10m' ? 600 : 15;

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Text Mode State
  const [textContent, setTextContent] = useState('');
  const [selectedTextBg, setSelectedTextBg] = useState(TEXT_BACKGROUNDS[0]);

  // Media Preview State (Step 2)
  const [capturedMediaUri, setCapturedMediaUri] = useState<string | null>(null);
  const [isVideoMedia, setIsVideoMedia] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [isPreviewMuted, setIsPreviewMuted] = useState(false);

  // Post Details State (Step 3)
  const [caption, setCaption] = useState('');
  const [farmsList, setFarmsList] = useState<Farm[]>(user?.farms || []);
  const [selectedFarmId, setSelectedFarmId] = useState<string>(
    user?.farms && user.farms.length > 0 ? user.farms[0].id : ''
  );
  const [farmYields, setFarmYields] = useState<AgroYield[]>([]);
  const [selectedYieldId, setSelectedYieldId] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSound, setSelectedSound] = useState('Original Farm Audio');

  // Load User's Farms from DB
  useEffect(() => {
    fetchMyFarmsApi()
      .then((farms) => {
        if (Array.isArray(farms) && farms.length > 0) {
          setFarmsList(farms);
          if (!selectedFarmId) {
            setSelectedFarmId(farms[0].id);
          }
        }
      })
      .catch((err) => console.warn('Could not load farms:', err));
  }, []);

  // Load Yields for selected Farm only
  useEffect(() => {
    if (selectedFarmId) {
      setSelectedYieldId(undefined); // Reset selected yield when switching farm
      fetchFarmYieldsApi(selectedFarmId)
        .then((yields: AgroYield[]) => setFarmYields(yields || []))
        .catch(() => setFarmYields([]));
    }
  }, [selectedFarmId]);

  // Handle Flip Camera
  const handleFlipCamera = () => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  // Handle Flash Cycle
  const handleCycleFlash = () => {
    setFlash((prev) => {
      if (prev === 'off') return 'on';
      if (prev === 'on') return 'auto';
      return 'off';
    });
  };

  // Handle Speed Cycle
  const handleCycleSpeed = () => {
    setSpeedIndex((prev) => (prev + 1) % SPEED_OPTIONS.length);
  };

  // Handle Timer Cycle
  const handleCycleTimer = () => {
    const nextIdx = (TIMER_OPTIONS.indexOf(timerSec) + 1) % TIMER_OPTIONS.length;
    setTimerSec(TIMER_OPTIONS[nextIdx]);
  };

  // Start / Resume Video Recording
  const startRecordingVideo = async (maxDur: number = maxDurationLimit) => {
    try {
      if (!microPermission?.granted) {
        await requestMicroPermission();
      }
      setIsRecording(true);
      setIsPaused(false);
      setIsVideoMedia(true);

      const startTime = Date.now() - recordDuration * 1000;
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordDuration(elapsed);
        if (elapsed >= maxDur) {
          finishRecordingVideo();
        }
      }, 250);

      if (cameraRef.current && cameraRef.current.recordAsync) {
        const promise = cameraRef.current.recordAsync({
          maxDuration: maxDur - recordDuration,
        });
        recordingPromiseRef.current = promise;
        promise
          .then((result: any) => {
            if (result?.uri) {
              setCapturedMediaUri(result.uri);
              setIsVideoMedia(true);
              setStep('media_preview');
            }
          })
          .catch((err: any) => {
            console.warn('recordAsync error:', err);
          });
      }
    } catch (e) {
      console.warn('startRecordingVideo error:', e);
    }
  };

  // Pause Video Recording
  const pauseRecordingVideo = async () => {
    setIsRecording(false);
    setIsPaused(true);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    try {
      if (cameraRef.current && cameraRef.current.stopRecording) {
        await cameraRef.current.stopRecording();
      }
    } catch (e) {
      console.warn('pauseRecordingVideo error:', e);
    }
  };

  // Finish Recording (Accept)
  const finishRecordingVideo = async () => {
    setIsRecording(false);
    setIsPaused(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    try {
      if (cameraRef.current && cameraRef.current.stopRecording) {
        await cameraRef.current.stopRecording();
      }
    } catch (e) {
      console.warn('finishRecordingVideo error:', e);
    }

    // Safety fallback for simulator / non-native mock
    setTimeout(() => {
      setCapturedMediaUri((prev) => {
        if (!prev) {
          setStep('media_preview');
          setIsVideoMedia(true);
          return 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1000';
        }
        return prev;
      });
    }, 1200);
  };

  // Discard Recording (Reset)
  const handleConfirmDiscard = () => {
    setShowDiscardModal(false);
    setIsRecording(false);
    setIsPaused(false);
    setRecordDuration(0);
    setCapturedMediaUri(null);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    try {
      if (cameraRef.current && cameraRef.current.stopRecording) {
        cameraRef.current.stopRecording().catch(() => {});
      }
    } catch (e) {}
  };

  // Holding on shutter -> Start recording video
  const handleLongPressShutter = () => {
    if (mode === 'Text') return;
    setIsRecordingOnHold(true);
    startRecordingVideo(maxDurationLimit);
  };

  // Release hold on shutter -> Stop recording video & advance to media preview
  const handlePressOutShutter = () => {
    if (isRecordingOnHold && isRecording) {
      setIsRecordingOnHold(false);
      finishRecordingVideo();
    }
  };

  // Handle Shutter Tap
  const handleShutterPress = async () => {
    if (isRecordingOnHold) return;

    if (timerSec > 0 && countdown === null) {
      setCountdown(timerSec);
      let c = timerSec;
      const interval = setInterval(() => {
        c -= 1;
        if (c <= 0) {
          clearInterval(interval);
          setCountdown(null);
          executeCapture();
        } else {
          setCountdown(c);
        }
      }, 1000);
      return;
    }

    executeCapture();
  };

  const executeCapture = async () => {
    Animated.sequence([
      Animated.timing(shutterScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(shutterScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    if (mode === 'Photo') {
      try {
        if (cameraRef.current) {
          const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
          if (photo?.uri) {
            setCapturedMediaUri(photo.uri);
            setIsVideoMedia(false);
            setStep('media_preview');
            return;
          }
        }
      } catch (err) {
        console.warn('Camera snap error, using fallback:', err);
      }

      setCapturedMediaUri('https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=1000');
      setIsVideoMedia(false);
      setStep('media_preview');
    } else if (mode === 'Text') {
      if (!textContent.trim()) return;
      setCapturedMediaUri(selectedTextBg.color);
      setCaption(textContent);
      setStep('media_preview');
    } else {
      // Video Modes (15s, 60s, 10m)
      if (isRecording) {
        pauseRecordingVideo();
      } else if (isPaused) {
        startRecordingVideo(maxDurationLimit);
      } else {
        startRecordingVideo(maxDurationLimit);
      }
    }
  };

  // Handle Gallery Pick
  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setCapturedMediaUri(asset.uri);
        setIsVideoMedia(asset.type === 'video');
        setStep('media_preview');
      }
    } catch (err) {
      console.warn('Gallery pick error:', err);
    }
  };

  // Discard & Draft Actions
  const handleDiscardMedia = () => {
    setShowDraftModal(false);
    setCapturedMediaUri(null);
    setTextContent('');
    setIsRecording(false);
    setIsVideoMedia(false);
    setStep('camera');
  };

  const handleSaveDraft = () => {
    setShowDraftModal(false);
    setStep('camera');
  };

  // Submit Final Post to PostgreSQL Backend
  const handlePublishPost = async () => {
    if (!caption.trim() && mode !== 'Text') return;
    try {
      setIsSubmitting(true);
      let media = capturedMediaUri;

      // If we have a local media file (file://, content://, or cache file), upload to backend first
      if (
        media &&
        (media.startsWith('file:') ||
          media.startsWith('content:') ||
          media.startsWith('ph:') ||
          media.startsWith('/'))
      ) {
        try {
          console.log(`📤 Uploading recorded/selected media (${isVideoMedia ? 'video' : 'photo'}) to backend...`);
          const uploadRes = await uploadMediaApi(media, isVideoMedia);
          if (uploadRes?.url) {
            console.log(`✅ Uploaded successfully to permanent backend storage: ${uploadRes.url}`);
            media = uploadRes.url;
          }
        } catch (uploadErr) {
          console.error('❌ Failed to upload media file to backend, using local media URI:', uploadErr);
        }
      }

      if (!media) {
        if (mode === 'Text') {
          media = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800';
        } else if (isVideoMedia) {
          media = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
        } else {
          media = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800';
        }
      }

      await createPostApi({
        content: caption || textContent || 'Fresh harvest update from the field!',
        mediaUrl: media,
        isVideo: isVideoMedia,
        farmId: selectedFarmId || undefined,
        linkedYieldId: selectedYieldId || undefined,
      });

      // Navigate back to AgroFeed to see the new live post
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Failed to create post:', err);
      router.replace('/(tabs)');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format Duration seconds into mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // ==========================================
  // STEP 3: POST DETAILS & ATTRIBUTION FORM
  // ==========================================
  if (step === 'post_details') {
    return (
      <View style={[styles.container, { backgroundColor: Colors.white }]}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

        {/* Top Navigation Bar */}
        <View style={[styles.reviewHeader, { paddingTop: Math.max(insets.top + (Platform.OS === 'ios' ? 6 : 10), 20), backgroundColor: Colors.white, borderBottomColor: Colors.parchmentDim }]}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => setStep('media_preview')}
            activeOpacity={0.7}
          >
            <ChevronLeft size={26} color={Colors.espresso} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: Colors.espresso, fontFamily: Fonts.displayBold }]}>Post Details</Text>
          <TouchableOpacity
            style={[styles.publishHeaderButton, (!caption.trim() && !textContent.trim()) && { opacity: 0.5 }]}
            onPress={handlePublishPost}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Text style={styles.publishHeaderText}>Post</Text>
                <Send size={15} color="#FFF" style={{ marginLeft: 4 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.reviewScrollContent, { paddingBottom: Math.max(insets.bottom + 90, 110) }]}>
          {/* Media Preview Card */}
          <TouchableOpacity
            style={[styles.previewContainer, { backgroundColor: Colors.parchment, borderColor: Colors.parchmentDim, borderWidth: 1 }]}
            onPress={() => setStep('media_preview')}
            activeOpacity={0.9}
          >
            {mode === 'Text' ? (
              <View style={[styles.previewTextCard, { backgroundColor: selectedTextBg.color }]}>
                <Text style={styles.previewTextDisplay}>{textContent || caption}</Text>
              </View>
            ) : isVideoMedia && capturedMediaUri ? (
              <Video
                source={{ uri: capturedMediaUri }}
                style={styles.previewImage}
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay
                isMuted
                useNativeControls={false}
              />
            ) : (
              <Image
                source={{ uri: capturedMediaUri || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800' }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.editMediaBadge}>
              <Edit3 size={13} color="#FFF" />
              <Text style={styles.editMediaText}>Edit Media</Text>
            </View>
          </TouchableOpacity>

          {/* Caption Input Box */}
          <View style={styles.captionSection}>
            <Text style={[styles.inputSectionLabel, { color: Colors.espresso, fontFamily: Fonts.bodySemiBold }]}>Story Caption & Thoughts</Text>
            <TextInput
              style={[styles.captionInput, { backgroundColor: Colors.parchment, color: Colors.espresso, borderColor: Colors.parchmentDim, borderWidth: 1 }]}
              placeholder="Describe your harvest, batch quality, or story..."
              placeholderTextColor={Colors.text.muted}
              value={caption}
              onChangeText={setCaption}
              multiline
              numberOfLines={4}
            />

            {/* Quick Hashtags */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hashtagRow}>
              {SUGGESTED_HASHTAGS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.hashtagPill, { backgroundColor: Colors.parchment, borderColor: Colors.parchmentDim, borderWidth: 1 }]}
                  onPress={() => setCaption((prev) => (prev ? `${prev} ${tag}` : tag))}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.hashtagText, { color: Colors.cultivated }]}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Farm Attribution */}
          {farmsList.length > 0 && (
            <View style={styles.formSection}>
              <View style={styles.sectionHeaderRow}>
                <MapPin size={18} color={Colors.cultivated} />
                <Text style={[styles.sectionHeading, { color: Colors.espresso, fontFamily: Fonts.bodySemiBold }]}>Attributed Farm</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.farmSelectorRow}>
                {farmsList.map((farm: any) => {
                  const isSelected = selectedFarmId === farm.id;
                  return (
                    <TouchableOpacity
                      key={farm.id}
                      style={[
                        styles.farmSelectChip,
                        { backgroundColor: Colors.parchment, borderColor: Colors.parchmentDim },
                        isSelected && { backgroundColor: Colors.canopy, borderColor: Colors.canopy },
                      ]}
                      onPress={() => setSelectedFarmId(farm.id)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.farmSelectChipText,
                          { color: Colors.espresso },
                          isSelected && { color: Colors.white, fontFamily: Fonts.bodySemiBold },
                        ]}
                      >
                        {farm.name}
                      </Text>
                      {isSelected && <Check size={14} color="#FFF" style={{ marginLeft: 4 }} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Tag Shoppable AgroYield */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeaderRow}>
              <ShoppingBag size={18} color={Colors.cultivated} />
              <Text style={[styles.sectionHeading, { color: Colors.espresso, fontFamily: Fonts.bodySemiBold }]}>Link Shoppable Harvest Produce (1-Tap Buy)</Text>
            </View>
            <Text style={[styles.sectionSubheading, { color: Colors.text.secondary }]}>
              Viewers can tap and buy this produce directly from your video/photo.
            </Text>

            {farmYields.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yieldSelectorRow}>
                <TouchableOpacity
                  style={[
                    styles.yieldChip,
                    { backgroundColor: Colors.parchment, borderColor: Colors.parchmentDim },
                    !selectedYieldId && { backgroundColor: Colors.cultivated, borderColor: Colors.cultivated },
                  ]}
                  onPress={() => setSelectedYieldId(undefined)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.yieldChipText,
                      { color: Colors.espresso },
                      !selectedYieldId && { color: Colors.white, fontFamily: Fonts.bodySemiBold },
                    ]}
                  >
                    No Product Linked
                  </Text>
                </TouchableOpacity>
                {farmYields.map((y) => {
                  const isSelected = selectedYieldId === y.id;
                  return (
                    <TouchableOpacity
                      key={y.id}
                      style={[
                        styles.yieldChip,
                        { backgroundColor: Colors.parchment, borderColor: Colors.parchmentDim },
                        isSelected && { backgroundColor: Colors.cultivated, borderColor: Colors.cultivated },
                      ]}
                      onPress={() => setSelectedYieldId(y.id)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.yieldChipText,
                          { color: Colors.espresso },
                          isSelected && { color: Colors.white, fontFamily: Fonts.bodySemiBold },
                        ]}
                      >
                        🛒 {y.title} ({y.price?.toLocaleString()} FCFA)
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={[styles.noYieldsCard, { backgroundColor: Colors.parchment, borderColor: Colors.parchmentDim, borderWidth: 1 }]}>
                <Text style={[styles.noYieldsText, { color: Colors.text.secondary }]}>
                  No active harvests in this farm yet. You can add produce anytime from your Farm Page.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Post Bar with Solid Background and Safe Insets */}
        <View style={[styles.reviewBottomBar, { backgroundColor: Colors.white, borderTopColor: Colors.parchmentDim, borderTopWidth: 1, paddingBottom: Math.max(insets.bottom + 10, 16), bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 10 }]}>
          <TouchableOpacity
            style={styles.bigPostButton}
            onPress={handlePublishPost}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.bigPostButtonText}>Publish to AgroFeed</Text>
                <Send size={18} color="#FFF" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ====================================================
  // STEP 2: FULL-SCREEN MEDIA PREVIEW & EDIT CANVAS
  // ====================================================
  if (step === 'media_preview') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

        {/* Full-Screen Media Display */}
        {mode === 'Text' ? (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: selectedTextBg.color, justifyContent: 'center', alignItems: 'center', padding: 28 }]}>
            <Text style={styles.fullScreenTextDisplay}>{textContent || caption}</Text>
          </View>
        ) : isVideoMedia && capturedMediaUri ? (
          <Video
            source={{ uri: capturedMediaUri }}
            style={StyleSheet.absoluteFillObject}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay
            isMuted={isPreviewMuted}
            useNativeControls={false}
          />
        ) : (
          <Image
            source={{ uri: capturedMediaUri || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=1000' }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        )}

        {/* Color Filter Overlay */}
        {selectedFilter.id !== 'normal' && mode !== 'Text' && (
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: selectedFilter.color, pointerEvents: 'none' },
            ]}
          />
        )}

        {/* Top Header: Retake / Reload on Left, Audio & Palette in Center */}
        <View style={[styles.topControls, { top: Math.max(insets.top + (Platform.OS === 'ios' ? 8 : 12), 24) }]}>
          {/* Retake / Reload Icon with Dropdown Prompt */}
          <TouchableOpacity
            style={styles.glassIconButton}
            onPress={() => setShowDraftModal(true)}
            activeOpacity={0.7}
          >
            <RotateCcw size={22} color="#FFF" />
          </TouchableOpacity>

          {/* Audio Pill */}
          <TouchableOpacity
            style={styles.soundPill}
            onPress={() => setSelectedSound((prev) => (prev === 'Original Farm Audio' ? 'Harvest Vibes #1' : 'Original Farm Audio'))}
            activeOpacity={0.8}
          >
            <Music size={14} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.soundPillText} numberOfLines={1}>
              {selectedSound}
            </Text>
          </TouchableOpacity>

          <View style={{ width: 40 }} />
        </View>

        {/* Text Background Selector (Under Audio Button at Top) */}
        {mode === 'Text' && (
          <View style={[styles.topTextBgRow, { top: Math.max(insets.top + 64, 72) }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topTextBgScroll}>
              {TEXT_BACKGROUNDS.map((bg) => (
                <TouchableOpacity
                  key={bg.id}
                  style={[
                    styles.textBgCircle,
                    { backgroundColor: bg.color },
                    selectedTextBg.id === bg.id && styles.textBgCircleActive,
                  ]}
                  onPress={() => setSelectedTextBg(bg)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Top-Right Vertical Edit Toolbar (TikTok Style) */}
        <View style={[styles.verticalToolset, { top: Math.max(insets.top + (Platform.OS === 'ios' ? 68 : 58), 64) }]}>
          {/* Text Tool */}
          <TouchableOpacity
            style={styles.toolItem}
            onPress={() => {
              if (mode !== 'Text') setMode('Text');
            }}
            activeOpacity={0.7}
          >
            <View style={styles.toolIconCircle}>
              <Type size={22} color="#FFF" />
            </View>
            <Text style={styles.toolLabel}>Text</Text>
          </TouchableOpacity>

          {/* Stickers */}
          <TouchableOpacity style={styles.toolItem} activeOpacity={0.7}>
            <View style={styles.toolIconCircle}>
              <Sticker size={22} color="#FFF" />
            </View>
            <Text style={styles.toolLabel}>Stickers</Text>
          </TouchableOpacity>

          {/* Filters */}
          <TouchableOpacity
            style={styles.toolItem}
            onPress={() => setShowFilterTray((prev) => !prev)}
            activeOpacity={0.7}
          >
            <View style={[styles.toolIconCircle, selectedFilter.id !== 'normal' && styles.toolIconCircleActive]}>
              <Sparkles size={22} color="#FFF" />
            </View>
            <Text style={styles.toolLabel}>Filters</Text>
          </TouchableOpacity>

          {/* Audio Mute / Sound Toggle */}
          {isVideoMedia && (
            <TouchableOpacity
              style={styles.toolItem}
              onPress={() => setIsPreviewMuted((prev) => !prev)}
              activeOpacity={0.7}
            >
              <View style={[styles.toolIconCircle, isPreviewMuted && styles.toolIconCircleActive]}>
                {isPreviewMuted ? <VolumeX size={22} color="#FFF" /> : <Volume2 size={22} color="#FFF" />}
              </View>
              <Text style={styles.toolLabel}>{isPreviewMuted ? 'Muted' : 'Audio'}</Text>
            </TouchableOpacity>
          )}

          {/* Enhance */}
          <TouchableOpacity
            style={styles.toolItem}
            onPress={() => setIsEnhanceOn((prev) => !prev)}
            activeOpacity={0.7}
          >
            <View style={[styles.toolIconCircle, isEnhanceOn && styles.toolIconCircleActive]}>
              <Flame size={22} color={isEnhanceOn ? Colors.gold : '#FFF'} />
            </View>
            <Text style={styles.toolLabel}>Enhance</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tray Overlay */}
        {showFilterTray && (
          <View style={[styles.filterTrayContainer, { bottom: Math.max(insets.bottom + 110, 125) }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTrayContent}>
              {FILTER_PRESETS.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.filterChip, selectedFilter.id === f.id && styles.filterChipActive]}
                  onPress={() => setSelectedFilter(f)}
                >
                  <Text style={[styles.filterChipText, selectedFilter.id === f.id && styles.filterChipTextActive]}>
                    {f.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Bottom Bar: Next Button Floating Cleanly Above Navigation Bar */}
        <View style={[styles.mediaPreviewBottomBar, { bottom: Math.max(insets.bottom + 18, 28) }]}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={styles.nextStepButton}
            onPress={() => setStep('post_details')}
            activeOpacity={0.85}
          >
            <Text style={styles.nextStepButtonText}>Next</Text>
            <ChevronRight size={20} color="#FFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Save as Draft or Discard Confirmation Action Sheet Modal */}
        <Modal
          visible={showDraftModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDraftModal(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowDraftModal(false)}>
            <View style={[styles.draftSheetContainer, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Discard edits?</Text>
              <Text style={styles.sheetSubtitle}>
                If you go back now, you will lose the modifications made to this harvest story.
              </Text>

              <TouchableOpacity
                style={styles.sheetActionButton}
                onPress={handleSaveDraft}
                activeOpacity={0.8}
              >
                <Bookmark size={20} color={Colors.cultivated} style={{ marginRight: 10 }} />
                <Text style={styles.sheetActionText}>Save as Draft</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetActionButton, styles.sheetActionDestructive]}
                onPress={handleDiscardMedia}
                activeOpacity={0.8}
              >
                <Trash2 size={20} color="#FF3B30" style={{ marginRight: 10 }} />
                <Text style={[styles.sheetActionText, { color: '#FF3B30' }]}>Discard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetCancelButton}
                onPress={() => setShowDraftModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.sheetCancelText}>Continue Editing</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </View>
    );
  }

  // ==========================================
  // STEP 1: CAMERA VIEWFINDER & CAPTURE SCREEN
  // ==========================================
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

      {/* Camera Viewfinder */}
      {permission?.granted ? (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          facing={facing}
          flash={flash}
          enableTorch={flash === 'on'}
          mode={mode === 'Photo' ? 'picture' : 'video'}
        />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, styles.cameraPlaceholder]}>
          <View style={styles.permissionPrompt}>
            <View style={styles.cameraIconBadge}>
              <CameraIcon size={38} color={Colors.gold} />
            </View>
            <Text style={styles.permissionTitle}>Camera Access Required</Text>
            <Text style={styles.permissionSub}>
              Enable camera access to capture harvest photos and record live farm stories.
            </Text>
            <TouchableOpacity
              style={styles.grantButton}
              onPress={requestPermission}
              activeOpacity={0.8}
            >
              <Text style={styles.grantButtonText}>Enable Camera</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Selected Color Filter Overlay */}
      {selectedFilter.id !== 'normal' && mode !== 'Text' && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: selectedFilter.color, pointerEvents: 'none' },
          ]}
        />
      )}

      {/* Text Mode Canvas */}
      {mode === 'Text' && (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: selectedTextBg.color, zIndex: 10 }]}>
          <View style={styles.textModeCanvas}>
            <TextInput
              style={styles.textModeInput}
              placeholder="Type your harvest announcement or farm story..."
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              multiline
              value={textContent}
              onChangeText={setTextContent}
              autoFocus
            />
          </View>
        </View>
      )}

      {/* Countdown Visual Overlay */}
      {countdown !== null && (
        <View style={styles.countdownOverlay}>
          <Text style={styles.countdownNumber}>{countdown}</Text>
        </View>
      )}

      {/* Top Floating Bar */}
      <View style={[styles.topControls, { top: Math.max(insets.top + (Platform.OS === 'ios' ? 8 : 12), 24) }]}>
        <TouchableOpacity
          style={styles.glassIconButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <X size={24} color="#FFF" />
        </TouchableOpacity>

        {/* Audio / Music Selector Pill */}
        <TouchableOpacity
          style={styles.soundPill}
          onPress={() => setSelectedSound((prev) => (prev === 'Original Farm Audio' ? 'Harvest Vibes #1' : 'Original Farm Audio'))}
          activeOpacity={0.8}
        >
          <Music size={14} color="#FFF" style={{ marginRight: 6 }} />
          <Text style={styles.soundPillText} numberOfLines={1}>
            {selectedSound}
          </Text>
        </TouchableOpacity>

        <View style={{ width: 40 }} />
      </View>

      {/* Background Color Palette Moved to the Top directly under Audio Pill */}
      {mode === 'Text' && (
        <View style={[styles.topTextBgRow, { top: Math.max(insets.top + 64, 72) }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topTextBgScroll}>
            {TEXT_BACKGROUNDS.map((bg) => (
              <TouchableOpacity
                key={bg.id}
                style={[
                  styles.textBgCircle,
                  { backgroundColor: bg.color },
                  selectedTextBg.id === bg.id && styles.textBgCircleActive,
                ]}
                onPress={() => setSelectedTextBg(bg)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Top-Right Vertical Toolset (TikTok Sidebar) */}
      <View style={[styles.verticalToolset, { top: Math.max(insets.top + (Platform.OS === 'ios' ? 64 : 54), 60) }]}>
        {/* Flip Camera */}
        <TouchableOpacity style={styles.toolItem} onPress={handleFlipCamera} activeOpacity={0.7}>
          <View style={styles.toolIconCircle}>
            <FlipHorizontal size={22} color="#FFF" />
          </View>
          <Text style={styles.toolLabel}>Flip</Text>
        </TouchableOpacity>

        {/* Flash */}
        <TouchableOpacity style={styles.toolItem} onPress={handleCycleFlash} activeOpacity={0.7}>
          <View style={[styles.toolIconCircle, flash !== 'off' && styles.toolIconCircleActive]}>
            {flash === 'off' ? <ZapOff size={22} color="#FFF" /> : <Zap size={22} color="#FFF" />}
          </View>
          <Text style={styles.toolLabel}>{flash.toUpperCase()}</Text>
        </TouchableOpacity>

        {/* Speed */}
        <TouchableOpacity style={styles.toolItem} onPress={handleCycleSpeed} activeOpacity={0.7}>
          <View style={[styles.toolIconCircle, speedIndex !== 2 && styles.toolIconCircleActive]}>
            <Sliders size={22} color="#FFF" />
          </View>
          <Text style={styles.toolLabel}>{SPEED_OPTIONS[speedIndex]}</Text>
        </TouchableOpacity>

        {/* Timer */}
        <TouchableOpacity style={styles.toolItem} onPress={handleCycleTimer} activeOpacity={0.7}>
          <View style={[styles.toolIconCircle, timerSec > 0 && styles.toolIconCircleActive]}>
            <TimerIcon size={22} color="#FFF" />
          </View>
          <Text style={styles.toolLabel}>{timerSec > 0 ? `${timerSec}s` : 'Timer'}</Text>
        </TouchableOpacity>

        {/* Filters */}
        <TouchableOpacity
          style={styles.toolItem}
          onPress={() => setShowFilterTray((prev) => !prev)}
          activeOpacity={0.7}
        >
          <View style={[styles.toolIconCircle, selectedFilter.id !== 'normal' && styles.toolIconCircleActive]}>
            <Sparkles size={22} color="#FFF" />
          </View>
          <Text style={styles.toolLabel}>Filters</Text>
        </TouchableOpacity>

        {/* Collage Mode */}
        <TouchableOpacity
          style={styles.toolItem}
          onPress={() => setCollageMode((prev) => !prev)}
          activeOpacity={0.7}
        >
          <View style={[styles.toolIconCircle, collageMode && styles.toolIconCircleActive]}>
            <Grid size={22} color="#FFF" />
          </View>
          <Text style={styles.toolLabel}>Collage</Text>
        </TouchableOpacity>

        {/* Enhance Produce */}
        <TouchableOpacity
          style={styles.toolItem}
          onPress={() => setIsEnhanceOn((prev) => !prev)}
          activeOpacity={0.7}
        >
          <View style={[styles.toolIconCircle, isEnhanceOn && styles.toolIconCircleActive]}>
            <Flame size={22} color={isEnhanceOn ? Colors.gold : '#FFF'} />
          </View>
          <Text style={styles.toolLabel}>Enhance</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Filter Tray Overlay */}
      {showFilterTray && (
        <View style={[styles.filterTrayContainer, { bottom: Math.max(insets.bottom + 150, 165) }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTrayContent}>
            {FILTER_PRESETS.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterChip, selectedFilter.id === f.id && styles.filterChipActive]}
                onPress={() => setSelectedFilter(f)}
              >
                <Text style={[styles.filterChipText, selectedFilter.id === f.id && styles.filterChipTextActive]}>
                  {f.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Bottom Controls Area */}
      <View style={[styles.bottomSection, { bottom: Math.max(insets.bottom + 18, 30) }]}>
        {/* Timer Badge directly Above the Shutter Button */}
        {(isRecording || isPaused || recordDuration > 0) && (
          <View style={styles.aboveShutterTimerBadge}>
            <View style={[styles.recordingRedDot, isPaused && styles.recordingRedDotPaused]} />
            <Text style={styles.recordingTimerText}>
              {formatSeconds(recordDuration)} / {formatSeconds(maxDurationLimit)}
            </Text>
          </View>
        )}

        {/* Horizontal Mode Switcher Carousel (visible when idle) */}
        {!isRecording && !isPaused && recordDuration === 0 && (
          <View style={styles.modeCarousel}>
            {(['10m', '60s', '15s', 'Photo', 'Text'] as CameraMode[]).map((m) => {
              const isSelected = mode === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={styles.modeItem}
                  onPress={() => {
                    setMode(m);
                    if (m === 'Text') setShowFilterTray(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modeItemText, isSelected && styles.modeItemTextActive]}>
                    {m}
                  </Text>
                  {isSelected && <View style={styles.modeIndicatorDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Shutter Bar with Dynamic TikTok Multi-Clip / Recording Controls */}
        <View style={styles.shutterRow}>
          {/* Left: Discard Button (when recording/paused) OR Effects Toggle (when idle) */}
          {(isRecording || isPaused || recordDuration > 0) ? (
            <TouchableOpacity
              style={styles.sideControlButton}
              onPress={() => setShowDiscardModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.discardIconCircle}>
                <RotateCcw size={22} color="#FFF" />
              </View>
              <Text style={styles.sideControlText}>Discard</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.sideControlButton}
              onPress={() => setShowFilterTray((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Sparkles size={26} color="#FFF" />
              <Text style={styles.sideControlText}>Effects</Text>
            </TouchableOpacity>
          )}

          {/* Center: The Big Circular Shutter with Circular SVG Red Progress Ring */}
          <View style={styles.shutterContainer}>
            {/* SVG Animated Circular Progress Ring */}
            {(isRecording || isPaused || recordDuration > 0) && (
              <View style={styles.shutterSvgWrapper} pointerEvents="none">
                <Svg width={90} height={90} viewBox="0 0 90 90">
                  {/* Background Track Circle */}
                  <Circle
                    cx={45}
                    cy={45}
                    r={40}
                    stroke="rgba(255, 255, 255, 0.25)"
                    strokeWidth={4.5}
                    fill="none"
                  />
                  {/* Active Red Progress Circle */}
                  <Circle
                    cx={45}
                    cy={45}
                    r={40}
                    stroke="#EF4444"
                    strokeWidth={4.5}
                    fill="none"
                    strokeDasharray={251.327}
                    strokeDashoffset={251.327 * (1 - Math.min(recordDuration / maxDurationLimit, 1))}
                    strokeLinecap="round"
                    transform="rotate(-90 45 45)"
                  />
                </Svg>
              </View>
            )}

            <Animated.View style={{ transform: [{ scale: shutterScale }] }}>
              <TouchableOpacity
                style={[
                  styles.shutterOuterRing,
                  (mode !== 'Photo' && mode !== 'Text') && styles.shutterOuterRingVideo,
                  isRecording && styles.shutterOuterRingRecording,
                  isPaused && styles.shutterOuterRingPaused,
                ]}
                onPress={handleShutterPress}
                onLongPress={handleLongPressShutter}
                delayLongPress={200}
                onPressOut={handlePressOutShutter}
                activeOpacity={0.9}
              >
                {mode === 'Text' ? (
                  <View style={styles.shutterTextInner}>
                    <Type size={30} color={Colors.espresso} />
                  </View>
                ) : mode === 'Photo' && !isRecording && !isPaused && recordDuration === 0 ? (
                  <View style={styles.shutterPhotoInner} />
                ) : isRecording ? (
                  <View style={styles.shutterVideoInnerRecording} />
                ) : (
                  <View style={styles.shutterVideoInner} />
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Right: Done Checkmark (when recording/paused) OR Upload (when idle) */}
          {(isRecording || isPaused || recordDuration > 0) ? (
            <TouchableOpacity
              style={styles.sideControlButton}
              onPress={finishRecordingVideo}
              activeOpacity={0.7}
            >
              <View style={styles.doneCheckCircle}>
                <Check size={26} color="#FFF" strokeWidth={3} />
              </View>
              <Text style={styles.sideControlText}>Done</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.gallerySquareButton}
              onPress={handlePickFromGallery}
              activeOpacity={0.7}
            >
              <View style={styles.galleryThumbnailContainer}>
                <ImageIcon size={22} color="#FFF" />
              </View>
              <Text style={styles.sideControlText}>Upload</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Discard Recording Confirmation Modal */}
      <Modal
        visible={showDiscardModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDiscardModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDiscardModal(false)}>
          <View style={[styles.draftSheetContainer, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Discard recording?</Text>
            <Text style={styles.sheetSubtitle}>
              If you discard now, you will lose the recorded clip.
            </Text>
            <TouchableOpacity
              style={[styles.sheetActionButton, styles.sheetActionDestructive]}
              onPress={handleConfirmDiscard}
              activeOpacity={0.8}
            >
              <Trash2 size={20} color="#FF3B30" style={{ marginRight: 10 }} />
              <Text style={[styles.sheetActionText, { color: '#FF3B30' }]}>Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sheetCancelButton}
              onPress={() => setShowDiscardModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.sheetCancelText}>Continue Recording</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionPrompt: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  cameraIconBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    marginBottom: 10,
  },
  permissionTitle: {
    color: '#FFF',
    fontSize: 20,
    fontFamily: Fonts.displayBold,
    marginTop: 12,
  },
  permissionSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontFamily: Fonts.bodyMedium,
    textAlign: 'center',
    marginTop: 6,
  },
  grantButton: {
    marginTop: 18,
    backgroundColor: Colors.cultivated,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  grantButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
  },
  topControls: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 30,
  },
  glassIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  soundPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    maxWidth: SCREEN_WIDTH * 0.55,
  },
  soundPillText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
  },
  topTextBgRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 25,
  },
  topTextBgScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  textBgCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  textBgCircleActive: {
    borderColor: '#FFF',
    transform: [{ scale: 1.2 }],
  },
  verticalToolset: {
    position: 'absolute',
    right: 12,
    alignItems: 'center',
    zIndex: 30,
  },
  toolItem: {
    alignItems: 'center',
    marginBottom: 16,
  },
  toolIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  toolIconCircleActive: {
    backgroundColor: Colors.cultivated,
    borderColor: Colors.cultivated,
  },
  toolLabel: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: Fonts.bodyMedium,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowRadius: 3,
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  countdownNumber: {
    color: Colors.gold,
    fontSize: 110,
    fontFamily: Fonts.displayBold,
  },
  aboveShutterTimerBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  recordingTimerBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 104 : 88,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 38, 38, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 35,
  },
  recordingRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  recordingRedDotPaused: {
    backgroundColor: Colors.gold,
  },
  recordingTimerText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: Fonts.monoBold,
    letterSpacing: 0.5,
  },
  filterTrayContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 35,
  },
  filterTrayContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterChipActive: {
    backgroundColor: Colors.cultivated,
    borderColor: Colors.cultivated,
  },
  filterChipText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: Fonts.bodyMedium,
  },
  filterChipTextActive: {
    fontFamily: Fonts.bodySemiBold,
  },
  bottomSection: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 30,
  },
  modeCarousel: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 16,
  },
  modeItem: {
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  modeItemText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
  },
  modeItemTextActive: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: Fonts.displayBold,
  },
  modeIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gold,
    marginTop: 4,
  },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  shutterContainer: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  shutterSvgWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 90,
    height: 90,
  },
  sideControlButton: {
    alignItems: 'center',
    width: 60,
  },
  sideControlText: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: Fonts.bodyMedium,
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 3,
  },
  discardIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneCheckCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.cultivated,
    borderWidth: 2,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.cultivated,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  shutterOuterRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3.5,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shutterOuterRingVideo: {
    borderColor: '#FF3B30',
  },
  shutterOuterRingRecording: {
    borderColor: 'transparent',
    transform: [{ scale: 1.05 }],
  },
  shutterOuterRingPaused: {
    borderColor: Colors.gold,
  },
  shutterPhotoInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FFF',
  },
  shutterVideoInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FF3B30',
  },
  shutterVideoInnerRecording: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
  },
  shutterTextInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetDiscardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    borderRadius: 14,
    marginBottom: 10,
  },
  gallerySquareButton: {
    alignItems: 'center',
    width: 60,
  },
  galleryThumbnailContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 2,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textModeCanvas: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  textModeInput: {
    color: '#FFF',
    fontSize: 24,
    fontFamily: Fonts.displayBold,
    textAlign: 'center',
    width: '100%',
  },
  fullScreenTextDisplay: {
    color: '#FFF',
    fontSize: 28,
    fontFamily: Fonts.displayBold,
    textAlign: 'center',
    lineHeight: 38,
  },
  mediaPreviewBottomBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 30,
  },
  nextStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cultivated,
    paddingHorizontal: 26,
    paddingVertical: 14,
    borderRadius: 26,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  nextStepButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: Fonts.displayBold,
  },
  // Modal Sheet Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  draftSheetContainer: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: Fonts.displayBold,
    textAlign: 'center',
  },
  sheetSubtitle: {
    color: '#8E8E93',
    fontSize: 13,
    fontFamily: Fonts.body,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sheetActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginBottom: 10,
  },
  sheetActionDestructive: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
  },
  sheetActionText: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
  },
  sheetCancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  sheetCancelText: {
    color: '#8E8E93',
    fontSize: 15,
    fontFamily: Fonts.bodyMedium,
  },
  // Post Details (Step 3) Styles
  reviewHeader: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerIconButton: {
    padding: 6,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 17,
    fontFamily: Fonts.displayBold,
  },
  publishHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cultivated,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
  },
  publishHeaderText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
  },
  reviewScrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  previewContainer: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.28,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1C1C1E',
    marginBottom: 16,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewTextCard: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  previewTextDisplay: {
    color: '#FFF',
    fontSize: 20,
    fontFamily: Fonts.displayBold,
    textAlign: 'center',
  },
  editMediaBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  editMediaText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: Fonts.bodyMedium,
  },
  captionSection: {
    marginBottom: 20,
  },
  inputSectionLabel: {
    color: '#E5E5EA',
    fontSize: 12.5,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 8,
  },
  captionInput: {
    backgroundColor: Colors.parchment,
    borderRadius: 12,
    padding: 14,
    color: Colors.espresso,
    fontSize: 13.5,
    fontFamily: Fonts.body,
    textAlignVertical: 'top',
    minHeight: 90,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  hashtagRow: {
    marginTop: 10,
  },
  hashtagPill: {
    backgroundColor: Colors.parchment,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  hashtagText: {
    color: Colors.cultivated,
    fontSize: 11.5,
    fontFamily: Fonts.bodyMedium,
  },
  formSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sectionHeading: {
    color: Colors.espresso,
    fontSize: 12,
    fontFamily: Fonts.bodyBold,
  },
  sectionSubheading: {
    color: Colors.text.secondary,
    fontSize: 10,
    fontFamily: Fonts.body,
    marginBottom: 10,
  },
  farmSelectorRow: {
    marginTop: 4,
  },
  farmSelectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.parchment,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  farmSelectChipActive: {
    backgroundColor: Colors.cultivated,
    borderColor: Colors.cultivated,
  },
  farmSelectChipText: {
    color: Colors.espresso,
    fontSize: 11,
    fontFamily: Fonts.bodyMedium,
  },
  farmSelectChipTextActive: {
    color: '#FFF',
    fontFamily: Fonts.bodySemiBold,
  },
  yieldSelectorRow: {
    marginTop: 4,
  },
  yieldChip: {
    backgroundColor: Colors.parchment,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  yieldChipActive: {
    backgroundColor: Colors.cultivated,
    borderColor: Colors.cultivated,
  },
  yieldChipText: {
    color: Colors.espresso,
    fontSize: 10,
    fontFamily: Fonts.bodyMedium,
  },
  yieldChipTextActive: {
    color: '#FFF',
    fontFamily: Fonts.bodySemiBold,
  },
  noYieldsCard: {
    backgroundColor: Colors.parchment,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.parchmentDim,
  },
  noYieldsText: {
    color: Colors.text.secondary,
    fontSize: 10,
    fontFamily: Fonts.body,
  },
  reviewBottomBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 16,
    left: 16,
    right: 16,
  },
  bigPostButton: {
    backgroundColor: Colors.cultivated,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
  },
  bigPostButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: Fonts.displayBold,
  },
});
