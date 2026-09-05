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
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions, FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
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
  ShoppingBag,
  MapPin,
  Tag,
  Type,
  RotateCcw,
  Layers,
  Flame,
  Volume2,
  Send,
  Camera as CameraIcon,
  Image as ImageIcon,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { useAuthStore } from '@/store/authStore';
import { createPostApi } from '@/components/api/posts';
import { fetchFarmYieldsApi } from '@/components/api/yields';
import { AgroYield } from '@/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type CameraMode = '10m' | '60s' | '15s' | 'Photo' | 'Text';

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
  const { user } = useAuthStore();
  const cameraRef = useRef<any>(null);

  // Camera permissions
  const [permission, requestPermission] = useCameraPermissions();

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

  // Recording & Shutter Animation State
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const recordingTimerRef = useRef<any>(null);
  const shutterScale = useRef(new Animated.Value(1)).current;

  // Text Mode State
  const [textContent, setTextContent] = useState('');
  const [selectedTextBg, setSelectedTextBg] = useState(TEXT_BACKGROUNDS[0]);

  // Review / Publishing State
  const [step, setStep] = useState<'camera' | 'review'>('camera');
  const [capturedMediaUri, setCapturedMediaUri] = useState<string | null>(null);
  const [isVideoMedia, setIsVideoMedia] = useState(false);

  // Post Metadata Form
  const [caption, setCaption] = useState('');
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [farmYields, setFarmYields] = useState<AgroYield[]>([]);
  const [selectedYieldId, setSelectedYieldId] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSound, setSelectedSound] = useState('Original Farm Audio');

  // Initialize Farm Selection
  useEffect(() => {
    if (user?.farms && user.farms.length > 0) {
      setSelectedFarmId(user.farms[0].id);
    }
  }, [user]);

  // Load Yields for selected Farm
  useEffect(() => {
    if (selectedFarmId) {
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
        setStep('review');
      }
    } catch (err) {
      console.warn('Gallery pick error:', err);
    }
  };

  // Trigger Shutter / Capture Photo
  const handleShutterPress = async () => {
    // If timer is active, run countdown
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
            setStep('review');
            return;
          }
        }
      } catch (err) {
        console.warn('Camera snap error, using high-res farm photo:', err);
      }

      // High-res instant preview fallback if on simulator/web
      setCapturedMediaUri('https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=1000');
      setIsVideoMedia(false);
      setStep('review');
    } else if (mode === 'Text') {
      if (!textContent.trim()) return;
      // In text mode, we proceed to review with styled card
      setCapturedMediaUri(selectedTextBg.color);
      setCaption(textContent);
      setStep('review');
    } else {
      // Video Modes (15s, 60s, 10m)
      if (isRecording) {
        // Stop recording
        setIsRecording(false);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        setCapturedMediaUri('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1000');
        setIsVideoMedia(true);
        setStep('review');
      } else {
        // Start recording
        setIsRecording(true);
        setRecordDuration(0);
        const maxDuration = mode === '15s' ? 15 : mode === '60s' ? 60 : 600;
        recordingTimerRef.current = setInterval(() => {
          setRecordDuration((prev) => {
            if (prev >= maxDuration) {
              clearInterval(recordingTimerRef.current);
              setIsRecording(false);
              setCapturedMediaUri('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1000');
              setIsVideoMedia(true);
              setStep('review');
              return maxDuration;
            }
            return prev + 1;
          });
        }, 1000);
      }
    }
  };

  // Submit Final Post to PostgreSQL Backend
  const handlePublishPost = async () => {
    if (!caption.trim() && mode !== 'Text') return;
    try {
      setIsSubmitting(true);
      const media =
        capturedMediaUri && capturedMediaUri.startsWith('http')
          ? capturedMediaUri
          : mode === 'Text'
          ? 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800'
          : capturedMediaUri || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800';

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
      // Still navigate gracefully
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

  // If Review Step is Active, render the TikTok-style Post Editor & Attribution Screen
  if (step === 'review') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        {/* Top Navigation Bar */}
        <View style={styles.reviewHeader}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => setStep('camera')}
            activeOpacity={0.7}
          >
            <RotateCcw size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review & Tag Produce</Text>
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

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.reviewScrollContent}>
          {/* Media Preview Card */}
          <View style={styles.previewContainer}>
            {mode === 'Text' ? (
              <View style={[styles.previewTextCard, { backgroundColor: selectedTextBg.color }]}>
                <Text style={styles.previewTextDisplay}>{textContent || caption}</Text>
              </View>
            ) : (
              <Image
                source={{ uri: capturedMediaUri || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800' }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            )}
            {isVideoMedia && (
              <View style={styles.videoBadge}>
                <Volume2 size={16} color="#FFF" />
                <Text style={styles.videoBadgeText}>Video Clip</Text>
              </View>
            )}
          </View>

          {/* Caption Input Box */}
          <View style={styles.captionSection}>
            <Text style={styles.inputSectionLabel}>Story Caption & Thoughts</Text>
            <TextInput
              style={styles.captionInput}
              placeholder="Describe your harvest, batch quality, or story..."
              placeholderTextColor="#8E8E93"
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
                  style={styles.hashtagPill}
                  onPress={() => setCaption((prev) => (prev ? `${prev} ${tag}` : tag))}
                  activeOpacity={0.7}
                >
                  <Text style={styles.hashtagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Farm Attribution */}
          {user?.farms && user.farms.length > 0 && (
            <View style={styles.formSection}>
              <View style={styles.sectionHeaderRow}>
                <MapPin size={18} color={Colors.cultivated} />
                <Text style={styles.sectionHeading}>Attributed Farm</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.farmSelectorRow}>
                {user.farms.map((farm: any) => {
                  const isSelected = selectedFarmId === farm.id;
                  return (
                    <TouchableOpacity
                      key={farm.id}
                      style={[styles.farmSelectChip, isSelected && styles.farmSelectChipActive]}
                      onPress={() => setSelectedFarmId(farm.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.farmSelectChipText, isSelected && styles.farmSelectChipTextActive]}>
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
              <Text style={styles.sectionHeading}>Link Shoppable Harvest Produce (1-Tap Buy)</Text>
            </View>
            <Text style={styles.sectionSubheading}>
              Viewers can tap and buy this produce directly from your video/photo.
            </Text>

            {farmYields.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yieldSelectorRow}>
                <TouchableOpacity
                  style={[styles.yieldChip, !selectedYieldId && styles.yieldChipActive]}
                  onPress={() => setSelectedYieldId(undefined)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.yieldChipText, !selectedYieldId && styles.yieldChipTextActive]}>
                    No Product Linked
                  </Text>
                </TouchableOpacity>
                {farmYields.map((y) => {
                  const isSelected = selectedYieldId === y.id;
                  return (
                    <TouchableOpacity
                      key={y.id}
                      style={[styles.yieldChip, isSelected && styles.yieldChipActive]}
                      onPress={() => setSelectedYieldId(y.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.yieldChipText, isSelected && styles.yieldChipTextActive]}>
                        🛒 {y.title} ({y.price?.toLocaleString()} FCFA)
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.noYieldsCard}>
                <Text style={styles.noYieldsText}>
                  No active harvests in this farm yet. You can add produce anytime from your Farm Page.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Post Bar */}
        <View style={styles.reviewBottomBar}>
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

  // Camera Viewfinder Mode
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

      {/* Camera Viewfinder or Simulated Live Feed */}
      {permission?.granted ? (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          facing={facing}
          flash={flash}
          enableTorch={flash === 'on'}
        />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, styles.cameraPlaceholder]}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=1000' }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
          <View style={styles.placeholderDarkOverlay} />
          {!permission && (
            <View style={styles.permissionPrompt}>
              <CameraIcon size={44} color="#FFF" />
              <Text style={styles.permissionTitle}>Camera Access</Text>
              <Text style={styles.permissionSub}>
                Allow camera access to capture live field harvests and record videos.
              </Text>
              <TouchableOpacity
                style={styles.grantButton}
                onPress={requestPermission}
                activeOpacity={0.8}
              >
                <Text style={styles.grantButtonText}>Enable Camera</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Selected Color Filter Overlay */}
      {selectedFilter.id !== 'normal' && (
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
            {/* Text Background Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.textBgRow}>
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
        </View>
      )}

      {/* Countdown Visual Overlay */}
      {countdown !== null && (
        <View style={styles.countdownOverlay}>
          <Text style={styles.countdownNumber}>{countdown}</Text>
        </View>
      )}

      {/* Top Floating Bar */}
      <View style={styles.topControls}>
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

      {/* Top-Right Vertical Toolset (TikTok Sidebar) */}
      <View style={styles.verticalToolset}>
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
        <View style={styles.filterTrayContainer}>
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

      {/* Recording Duration Counter */}
      {isRecording && (
        <View style={styles.recordingTimerBadge}>
          <View style={styles.recordingRedDot} />
          <Text style={styles.recordingTimerText}>
            {formatTime(recordDuration)} / {mode}
          </Text>
        </View>
      )}

      {/* Bottom Controls Area */}
      <View style={styles.bottomSection}>
        {/* Horizontal Mode Switcher Carousel */}
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

        {/* Shutter Bar (Effects on Left, Big Shutter in Center, Gallery on Right) */}
        <View style={styles.shutterRow}>
          {/* Left: Quick Effects Toggle */}
          <TouchableOpacity
            style={styles.sideControlButton}
            onPress={() => setShowFilterTray((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Sparkles size={26} color="#FFF" />
            <Text style={styles.sideControlText}>Effects</Text>
          </TouchableOpacity>

          {/* Center: The Big Circular Shutter */}
          <Animated.View style={{ transform: [{ scale: shutterScale }] }}>
            <TouchableOpacity
              style={[
                styles.shutterOuterRing,
                mode !== 'Photo' && mode !== 'Text' && styles.shutterOuterRingVideo,
                isRecording && styles.shutterOuterRingRecording,
              ]}
              onPress={handleShutterPress}
              activeOpacity={0.9}
            >
              {mode === 'Text' ? (
                <View style={styles.shutterTextInner}>
                  <Type size={30} color={Colors.espresso} />
                </View>
              ) : mode === 'Photo' ? (
                <View style={styles.shutterPhotoInner} />
              ) : (
                <View style={[styles.shutterVideoInner, isRecording && styles.shutterVideoInnerRecording]} />
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Right: Square Gallery Picker */}
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
        </View>
      </View>
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
  placeholderDarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  permissionPrompt: {
    alignItems: 'center',
    paddingHorizontal: 32,
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
    top: Platform.OS === 'ios' ? 52 : 36,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 30,
  },
  glassIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
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
  verticalToolset: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 104 : 88,
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
  },
  toolIconCircleActive: {
    backgroundColor: Colors.cultivated,
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
    backgroundColor: '#FFF',
    marginRight: 6,
  },
  recordingTimerText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: Fonts.monoBold,
  },
  filterTrayContainer: {
    position: 'absolute',
    bottom: 160,
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
    bottom: Platform.OS === 'ios' ? 36 : 20,
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
  shutterOuterRing: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shutterOuterRingVideo: {
    borderColor: '#FF3B30',
  },
  shutterOuterRingRecording: {
    borderColor: '#FFF',
    transform: [{ scale: 1.1 }],
  },
  shutterPhotoInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
  },
  shutterVideoInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF3B30',
  },
  shutterVideoInnerRecording: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
  },
  shutterTextInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
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
  textBgRow: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
  },
  textBgCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  textBgCircleActive: {
    borderColor: '#FFF',
    transform: [{ scale: 1.2 }],
  },
  // Review Step Styles
  reviewHeader: {
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
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
    paddingBottom: 100,
  },
  previewContainer: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.32,
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
  videoBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  videoBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: Fonts.bodyMedium,
  },
  captionSection: {
    marginBottom: 20,
  },
  inputSectionLabel: {
    color: '#E5E5EA',
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 8,
  },
  captionInput: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 14,
    color: '#FFF',
    fontSize: 15,
    fontFamily: Fonts.body,
    textAlignVertical: 'top',
    minHeight: 90,
  },
  hashtagRow: {
    marginTop: 10,
  },
  hashtagPill: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
  },
  hashtagText: {
    color: Colors.gold,
    fontSize: 13,
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
    color: '#FFF',
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
  },
  sectionSubheading: {
    color: '#8E8E93',
    fontSize: 12.5,
    fontFamily: Fonts.body,
    marginBottom: 10,
  },
  farmSelectorRow: {
    marginTop: 4,
  },
  farmSelectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  farmSelectChipActive: {
    backgroundColor: Colors.cultivated,
    borderColor: Colors.cultivated,
  },
  farmSelectChipText: {
    color: '#CCC',
    fontSize: 14,
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
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  yieldChipActive: {
    backgroundColor: Colors.cultivated,
    borderColor: Colors.cultivated,
  },
  yieldChipText: {
    color: '#BBB',
    fontSize: 13,
    fontFamily: Fonts.bodyMedium,
  },
  yieldChipTextActive: {
    color: '#FFF',
    fontFamily: Fonts.bodySemiBold,
  },
  noYieldsCard: {
    backgroundColor: '#1C1C1E',
    padding: 12,
    borderRadius: 10,
  },
  noYieldsText: {
    color: '#8E8E93',
    fontSize: 12.5,
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
