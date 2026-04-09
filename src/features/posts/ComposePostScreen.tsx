import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { getInfoAsync } from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Exam } from '../../api/exam/types';
import { postApi, useExamsList, useLinkPreview, useSession } from '../../api';
import type { CreatePostImageInput } from '../../api/post/postApi';
import type { PostType } from '../../api/post/types';
import {
  inferPostImageMimeFromFilename,
  isAllowedPostImageMime,
  POST_IMAGE_MAX_BYTES,
  POST_MEDIA_MAX_IMAGES,
  validateMediaRule,
  validatePostHasTitleOrBody,
} from '../../api/post/postValidation';
import { composeBreadcrumbSegments, TOPIC_OPTIONS, type TopicOption } from '../../api/post/topicCatalog';
import { resolvePostMediaUrl } from '../../api/post/mediaUrl';
import type { TokenUser } from '../../api/types';
import { BrandToggle } from '../../presentation/components/BrandToggle';
import {
  type ThemeColors,
  useThemeColors,
} from '../../presentation/theme/ThemeContext';
import { theme } from '../../presentation/theme/theme';
import { requestHomeFeedRefresh } from '../../shared/homeFeedSync';
import { ComposeMediaSheet } from './components/ComposeMediaSheet';

async function getLocalFileByteSize(uri: string): Promise<number | undefined> {
  try {
    const info = await getInfoAsync(uri);
    if (info.exists && typeof info.size === 'number') return info.size;
  } catch {
    /* ignore */
  }
  return undefined;
}

async function getImageAssetByteSize(asset: ImagePicker.ImagePickerAsset): Promise<number | undefined> {
  if (typeof asset.fileSize === 'number' && asset.fileSize > 0) return asset.fileSize;
  return getLocalFileByteSize(asset.uri);
}

/** iOS (and some Android) library photos — we convert to JPEG before upload. */
function isHeicOrHeifAsset(asset: ImagePicker.ImagePickerAsset): boolean {
  const m = asset.mimeType?.toLowerCase().split(';')[0]?.trim() ?? '';
  if (m === 'image/heic' || m === 'image/heif' || m === 'image/heif-sequence') return true;
  const n = (asset.fileName ?? '').toLowerCase();
  return n.endsWith('.heic') || n.endsWith('.heif');
}

function jpegFileNameForConvertedHeic(
  asset: ImagePicker.ImagePickerAsset,
  fallbackIndex: number,
): string {
  const n = asset.fileName?.trim();
  if (n) {
    const withoutExt = n.replace(/\.(heic|heif)$/i, '');
    return `${withoutExt}.jpg`;
  }
  return `image_${fallbackIndex}.jpg`;
}

function resolvePickedImageMime(asset: ImagePicker.ImagePickerAsset): string | null {
  const raw = asset.mimeType?.trim();
  if (raw && isAllowedPostImageMime(raw)) {
    return raw.toLowerCase().split(';')[0]!.trim();
  }
  return inferPostImageMimeFromFilename(asset.fileName);
}

const TITLE_PLACEHOLDERS: Record<PostType, string> = {
  DOUBT: 'What’s your question?',
  TIP: 'What’s the tip?',
  WIN: 'What did you achieve?',
  EXPERIENCE: 'What’s this about?',
};

const BODY_PLACEHOLDERS: Record<PostType, string> = {
  DOUBT: 'Add context — where you’re stuck, what you tried…',
  TIP: 'Explain how it helps…',
  WIN: 'Share the story (optional)',
  EXPERIENCE: 'Describe your experience…',
};

function userDisplayName(u: TokenUser | undefined | null): string {
  if (!u) return 'Member';
  const parts = [u.first_name?.trim(), u.last_name?.trim()].filter(Boolean);
  if (parts.length) return parts.join(' ');
  return u.username ?? 'Member';
}

function normalizeTagInput(raw: string): string {
  return raw.trim().replace(/^#+/u, '');
}

function userInitials(u: TokenUser | undefined | null): string {
  if (!u) return '?';
  const f = u.first_name?.trim()?.[0];
  const l = u.last_name?.trim()?.[0];
  if (f && l) return `${f}${l}`.toUpperCase();
  const un = u.username?.trim();
  if (un && un.length >= 2) return un.slice(0, 2).toUpperCase();
  return (un?.[0] ?? '?').toUpperCase();
}

export function ComposePostScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createComposeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const linkInputRef = useRef<TextInput>(null);
  const bodyInputRef = useRef<TextInput>(null);
  const { accessToken, user } = useSession();

  const postType: PostType = 'DOUBT';
  const topic: TopicOption =
    TOPIC_OPTIONS.find((t) => t.topic_id === 2) ?? TOPIC_OPTIONS[0]!;
  const [exam, setExam] = useState<Exam | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkRowVisible, setLinkRowVisible] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [mediaSheetOpen, setMediaSheetOpen] = useState(false);
  const [attachmentImages, setAttachmentImages] = useState<CreatePostImageInput[]>([]);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagList, setTagList] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const tagInputRef = useRef<TextInput>(null);

  const { preview, loading: previewLoading, error: previewError, schedulePreview, clearPreview } =
    useLinkPreview();

  const { items: exams } = useExamsList({ pageSize: 40 });

  useEffect(() => {
    if (exam !== null) return;
    if (exams.length > 0) setExam(exams[0]!);
  }, [exams, exam]);

  const onBodyChange = useCallback((txt: string) => {
    setBody(txt);
  }, []);

  const onLinkChange = useCallback(
    (text: string) => {
      setLinkUrl(text);
      schedulePreview(text);
      if (text.trim().length === 0) clearPreview();
    },
    [schedulePreview, clearPreview],
  );

  const toggleLinkRow = useCallback(() => {
    setLinkRowVisible((v) => !v);
    if (!linkRowVisible) {
      setTimeout(() => linkInputRef.current?.focus(), 100);
    }
  }, [linkRowVisible]);

  const insertBullet = useCallback(() => {
    setBody((prev) => (prev.length === 0 ? '• ' : `${prev}\n• `));
  }, []);

  const removeTag = useCallback((t: string) => {
    setTagList((prev) => prev.filter((x) => x !== t));
  }, []);

  const addTagFromDraft = useCallback(() => {
    const t = normalizeTagInput(tagDraft);
    if (!t) return;
    if (tagList.includes(t)) {
      setTagDraft('');
      return;
    }
    setTagList((prev) => [...prev, t]);
    setTagDraft('');
  }, [tagDraft, tagList]);

  const openTagModal = useCallback(() => {
    setTagModalOpen(true);
    setTimeout(() => tagInputRef.current?.focus(), 250);
  }, []);

  const removeAttachmentAt = useCallback((index: number) => {
    setAttachmentImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleChoosePhotos = useCallback(async () => {
    setMediaSheetOpen(false);
    const remaining = POST_MEDIA_MAX_IMAGES - attachmentImages.length;
    if (remaining <= 0) {
      Alert.alert('Photos', `You can add up to ${POST_MEDIA_MAX_IMAGES} images per post.`);
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Photo library',
        'Allow photo access in Settings to attach images to your post.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.85,
    });
    if (result.canceled) return;

    const next: CreatePostImageInput[] = [];
    const skipReasons: string[] = [];
    for (let i = 0; i < result.assets.length && next.length < remaining; i++) {
      const asset = result.assets[i]!;
      const index = next.length;
      let uri = asset.uri;
      let mime: string | null = null;
      let name = asset.fileName ?? `image_${index}.jpg`;

      if (isHeicOrHeifAsset(asset)) {
        try {
          const converted = await manipulateAsync(asset.uri, [], {
            compress: 0.85,
            format: SaveFormat.JPEG,
          });
          uri = converted.uri;
          mime = 'image/jpeg';
          name = jpegFileNameForConvertedHeic(asset, index);
        } catch {
          skipReasons.push(
            `“${asset.fileName ?? 'Image'}”: could not convert HEIC/HEIF — try another photo.`,
          );
          continue;
        }
      } else {
        mime = resolvePickedImageMime(asset);
        if (!mime) {
          skipReasons.push(`“${asset.fileName ?? 'Image'}”: use JPEG, PNG, WebP, or GIF.`);
          continue;
        }
      }

      let bytes = await getLocalFileByteSize(uri);
      if (bytes == null && uri === asset.uri) {
        bytes = await getImageAssetByteSize(asset);
      }
      if (bytes != null && bytes > POST_IMAGE_MAX_BYTES) {
        skipReasons.push(
          `“${asset.fileName ?? name}”: each file must be at most 5 MB.`,
        );
        continue;
      }

      next.push({
        uri,
        name,
        type: mime!,
      });
    }
    if (skipReasons.length > 0) {
      Alert.alert('Some photos were skipped', skipReasons.join('\n'));
    }
    if (next.length === 0) return;
    setAttachmentImages((prev) => [...prev, ...next].slice(0, POST_MEDIA_MAX_IMAGES));
  }, [attachmentImages.length]);

  const handleChooseVideo = useCallback(async () => {
    setMediaSheetOpen(false);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Video',
        'Allow photo library access in Settings to pick a video.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsMultipleSelection: false,
      quality: 1,
    });
    if (result.canceled) return;
    Alert.alert(
      'Video',
      'Video attachments are not available yet. You can add photos from the same menu.',
    );
  }, []);

  const handleChoosePdf = useCallback(async () => {
    setMediaSheetOpen(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
    } catch {
      return;
    }
    Alert.alert(
      'PDF',
      'PDF attachments are not available yet. You can add photos from the same menu.',
    );
  }, []);

  const previewBreadcrumbParts = useMemo(
    () => composeBreadcrumbSegments(topic, exam),
    [topic, exam],
  );

  const previewDisplayName = anonymous ? 'Anonymous' : userDisplayName(user);
  const previewInitials = anonymous ? '?' : userInitials(user);

  const composerAvatarUri = useMemo(() => {
    const raw = user?.avatar_url?.trim();
    if (!raw) return null;
    return resolvePostMediaUrl(raw);
  }, [user?.avatar_url]);

  const previewAvatarUri = useMemo(() => {
    if (anonymous) return null;
    const raw = user?.avatar_url?.trim();
    if (!raw) return null;
    return resolvePostMediaUrl(raw);
  }, [anonymous, user?.avatar_url]);

  const canSubmit = useMemo(() => {
    if (!exam) return false;
    if (validatePostHasTitleOrBody(title, body)) return false;
    if (validateMediaRule(attachmentImages.length, linkUrl.trim())) return false;
    return true;
  }, [attachmentImages.length, body, exam, linkUrl, title]);

  const submit = useCallback(async () => {
    if (!exam || !canSubmit) return;
    const presenceErr = validatePostHasTitleOrBody(title, body);
    if (presenceErr) {
      Alert.alert('Post', presenceErr);
      return;
    }
    const trimmedLink = linkUrl.trim();
    const hasLink = trimmedLink.length > 0;
    const mediaErr = validateMediaRule(attachmentImages.length, trimmedLink);
    if (mediaErr) {
      Alert.alert('Photos or link', mediaErr);
      return;
    }

    const trimmedBody = body.trim();

    setSubmitting(true);
    try {
      await postApi.createPost({
        post_type: postType,
        topic_id: topic.topic_id,
        subject_id: topic.subject_id,
        exam_id: exam.id,
        title: title.trim(),
        content: trimmedBody,
        tags: tagList,
        link_url: hasLink ? trimmedLink : undefined,
        link_title: hasLink ? preview?.title : undefined,
        link_desc: hasLink ? preview?.description : undefined,
        link_img: hasLink && preview?.image ? resolvePostMediaUrl(preview.image) : undefined,
        is_anonymous: anonymous,
        images: attachmentImages.length > 0 ? attachmentImages : undefined,
      });
      setTitle('');
      setBody('');
      setLinkUrl('');
      setTagList([]);
      setTagDraft('');
      clearPreview();
      setAnonymous(false);
      setLinkRowVisible(false);
      setAttachmentImages([]);
      requestHomeFeedRefresh();
      navigation.navigate('Home' as never);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not publish.';
      Alert.alert('Publish failed', msg);
    } finally {
      setSubmitting(false);
    }
  }, [
    anonymous,
    body,
    canSubmit,
    clearPreview,
    exam,
    linkUrl,
    navigation,
    postType,
    preview?.description,
    preview?.image,
    preview?.title,
    tagList,
    title,
    topic.subject_id,
    topic.topic_id,
    attachmentImages,
  ]);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => navigation.navigate('Home' as never)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={({ pressed }) => [styles.headerIconBtn, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.headerCenter} pointerEvents="none">
          <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
            New post
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => setPreviewModalOpen(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Preview post"
            style={({ pressed }) => [styles.headerPreviewBtn, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name="eye-outline" size={20} color={colors.brand} />
            <Text style={styles.headerPreviewText} numberOfLines={1}>
              Preview
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void submit()}
            disabled={!canSubmit || submitting}
            style={({ pressed }) => [
              styles.headerPostBtn,
              canSubmit && styles.headerPostBtnPrimary,
              !canSubmit && styles.headerPostBtnDisabled,
              pressed && canSubmit && !submitting && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Post"
          >
            {submitting ? (
              <ActivityIndicator
                size="small"
                color={canSubmit ? colors.onBrand : colors.textHint}
              />
            ) : (
              <Text
                style={[
                  styles.headerPostText,
                  canSubmit && styles.headerPostTextPrimary,
                  (!canSubmit || submitting) && styles.headerPostTextDisabled,
                ]}
              >
                Post
              </Text>
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 12) + 88 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.authorBlock}>
          <View style={styles.avatarCircle}>
            {composerAvatarUri ? (
              <Image
                source={{ uri: composerAvatarUri }}
                style={styles.avatarImage}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
            ) : (
              <Text style={styles.avatarInitials}>{userInitials(user)}</Text>
            )}
          </View>
          <View style={styles.authorTextCol}>
            <Text style={styles.authorName} numberOfLines={1}>
              {userDisplayName(user)}
            </Text>
            <View style={styles.anonRow}>
              <BrandToggle
                value={anonymous}
                onValueChange={setAnonymous}
                accessibilityLabel="Post anonymously"
              />
              <Text style={styles.anonLabel}>Post anonymously</Text>
            </View>
          </View>
        </View>

        <TextInput
          style={styles.titleInput}
          placeholder={TITLE_PLACEHOLDERS[postType]}
          placeholderTextColor={colors.textHint}
          value={title}
          onChangeText={setTitle}
          maxFontSizeMultiplier={1.3}
        />
        <View style={styles.bodyWrap}>
          <TextInput
            ref={bodyInputRef}
            style={styles.bodyInput}
            multiline
            placeholder={BODY_PLACEHOLDERS[postType]}
            placeholderTextColor={colors.textHint}
            value={body}
            onChangeText={onBodyChange}
            textAlignVertical="top"
          />
        </View>

        {attachmentImages.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.attachStripContent}
            style={styles.attachStrip}
          >
            {attachmentImages.map((img, index) => (
              <View key={`${img.uri}-${index}`} style={styles.attachTile}>
                <Image source={{ uri: img.uri }} style={styles.attachThumb} resizeMode="cover" />
                <Pressable
                  onPress={() => removeAttachmentAt(index)}
                  style={styles.attachRemove}
                  hitSlop={6}
                  accessibilityLabel="Remove attachment"
                >
                  <MaterialCommunityIcons name="close-circle" size={22} color={colors.surface} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ) : null}

        {linkRowVisible ? (
          <>
            <Text style={styles.sectionLabelSmall}>Link (optional)</Text>
            <TextInput
              ref={linkInputRef}
              style={styles.singleLine}
              placeholder="https://…"
              placeholderTextColor={colors.textHint}
              value={linkUrl}
              onChangeText={onLinkChange}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {previewLoading ? (
              <ActivityIndicator style={styles.previewSpin} color={colors.brand} />
            ) : null}
            {previewError ? <Text style={styles.previewErr}>{previewError.message}</Text> : null}
            {preview && linkUrl.trim().length > 0 ? (
              <View style={styles.previewCard}>
                {preview.image ? (
                  <Image
                    source={{ uri: resolvePostMediaUrl(preview.image) }}
                    style={styles.previewImg}
                    resizeMode="cover"
                  />
                ) : null}
                <View style={styles.previewTextCol}>
                  <Text style={styles.previewTitle} numberOfLines={2}>
                    {preview.title || 'Link preview'}
                  </Text>
                  {preview.description ? (
                    <Text style={styles.previewDesc} numberOfLines={3}>
                      {preview.description}
                    </Text>
                  ) : null}
                  <Text style={styles.previewSrc} numberOfLines={1}>
                    {preview.source}
                  </Text>
                </View>
              </View>
            ) : null}
          </>
        ) : null}

        {!accessToken ? <Text style={styles.warn}>Sign in to publish posts.</Text> : null}
      </ScrollView>

      <View style={[styles.bottomToolbar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <Pressable style={styles.toolbarBtn} onPress={toggleLinkRow} accessibilityLabel="Add link">
          <MaterialCommunityIcons name="link-variant" size={24} color={colors.textPrimary} />
        </Pressable>
        <Pressable
          style={styles.toolbarBtn}
          onPress={() => setMediaSheetOpen(true)}
          accessibilityLabel="Add photos, video, or PDF"
        >
          <MaterialCommunityIcons name="image-multiple" size={24} color={colors.textPrimary} />
        </Pressable>
        <Pressable style={styles.toolbarBtn} onPress={insertBullet} accessibilityLabel="Bullet list">
          <MaterialCommunityIcons name="format-list-bulleted" size={24} color={colors.textPrimary} />
        </Pressable>
        <Pressable style={styles.toolbarBtn} onPress={openTagModal} accessibilityLabel="Add tags">
          <Text style={styles.toolbarHash}>#</Text>
        </Pressable>
        <View style={styles.toolbarSpacer} />
        <Text style={styles.toolbarCharCount} maxFontSizeMultiplier={1.2}>
          {body.length}
        </Text>
      </View>

      <ComposeMediaSheet
        colors={colors}
        visible={mediaSheetOpen}
        onClose={() => setMediaSheetOpen(false)}
        onChoosePhotos={handleChoosePhotos}
        onChooseVideo={handleChooseVideo}
        onChoosePdf={handleChoosePdf}
      />

      <Modal
        visible={tagModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setTagModalOpen(false)}
      >
        <View style={[styles.tagModalRoot, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.tagModalHeader}>
            <Text style={styles.tagModalTitle}>Tags</Text>
            <Pressable onPress={() => setTagModalOpen(false)} hitSlop={12} accessibilityLabel="Done tags">
              <Text style={styles.tagModalDone}>Done</Text>
            </Pressable>
          </View>
          <Text style={styles.tagModalHint}>Optional tags — add as many as you like.</Text>
          {tagList.length > 0 ? (
            <Text style={styles.tagModalCounter}>
              {tagList.length} tag{tagList.length === 1 ? '' : 's'}
            </Text>
          ) : null}
          <View style={styles.tagChipRow}>
            {tagList.map((t, i) => (
              <View key={`${t}-${i}`} style={styles.tagChipOn}>
                <Text style={styles.tagChipOnText}>#{t}</Text>
                <Pressable onPress={() => removeTag(t)} hitSlop={6} accessibilityLabel={`Remove ${t}`}>
                  <MaterialCommunityIcons name="close" size={16} color={colors.onBrand} />
                </Pressable>
              </View>
            ))}
          </View>
          <View style={styles.tagInputRow}>
            <TextInput
              ref={tagInputRef}
              style={styles.tagModalInput}
              placeholder="e.g. calculus"
              placeholderTextColor={colors.textHint}
              value={tagDraft}
              onChangeText={setTagDraft}
              onSubmitEditing={() => addTagFromDraft()}
              autoCapitalize="none"
            />
            <Pressable
              style={({ pressed }) => [styles.tagModalAddBtn, pressed && styles.pressed]}
              onPress={addTagFromDraft}
            >
              <Text style={styles.tagModalAddBtnText}>Add</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={previewModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPreviewModalOpen(false)}
      >
        <View style={[styles.previewModalRoot, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.previewModalHeader}>
            <Text style={styles.previewModalTitle}>Preview</Text>
            <Pressable onPress={() => setPreviewModalOpen(false)} hitSlop={12} accessibilityLabel="Close preview">
              <Text style={styles.previewModalDone}>Done</Text>
            </Pressable>
          </View>
          <ScrollView
            style={styles.previewModalScroll}
            contentContainerStyle={[styles.previewModalScrollContent, { paddingBottom: insets.bottom + 16 }]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.previewFeedCard}>
              <View style={styles.previewTopRow}>
                <View style={styles.previewAvatar}>
                  {previewAvatarUri ? (
                    <Image
                      source={{ uri: previewAvatarUri }}
                      style={styles.previewAvatarImage}
                      resizeMode="cover"
                      accessibilityIgnoresInvertColors
                    />
                  ) : (
                    <Text style={styles.previewAvatarText}>{previewInitials}</Text>
                  )}
                </View>
                <View style={styles.previewHeaderMain}>
                  <View style={styles.previewNameRow}>
                    <Text style={styles.previewDisplayName} numberOfLines={1}>
                      {previewDisplayName}
                    </Text>
                    <Text style={styles.previewTimeMeta}> · Preview</Text>
                    <View style={styles.previewHeaderSpacer} />
                    <View style={[styles.previewTypePill, { backgroundColor: colors.brandLight }]}>
                      <Text style={[styles.previewTypePillText, { color: colors.brand }]}>
                        {postType}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.previewTopicRow}>
                    {previewBreadcrumbParts.map((segment, i, arr) => (
                      <Fragment key={`${segment}-${i}`}>
                        {i > 0 ? <Text style={styles.previewTopicSep}> › </Text> : null}
                        <Text style={i === arr.length - 1 ? styles.previewTopicLast : styles.previewTopicPart}>
                          {segment}
                        </Text>
                      </Fragment>
                    ))}
                  </View>
                </View>
              </View>

              {title.trim().length > 0 || body.trim().length > 0 ? (
                <>
                  {title.trim().length > 0 ? (
                    <Text style={styles.previewPostTitle} numberOfLines={4}>
                      {title.trim()}
                    </Text>
                  ) : null}
                  {body.trim().length > 0 ? (
                    <Text style={styles.previewContentText}>{body.trim()}</Text>
                  ) : null}
                </>
              ) : (
                <Text style={styles.previewContentText}>Your post text will appear here.</Text>
              )}

              {tagList.length > 0 ? (
                <View style={styles.previewTagsRow}>
                  {tagList.map((t) => (
                    <Text key={t} style={styles.previewTagText}>
                      #{t}
                    </Text>
                  ))}
                </View>
              ) : null}

              {linkUrl.trim().length > 0 ? (
                <View style={styles.previewLinkCard}>
                  {preview?.image ? (
                    <Image
                      source={{ uri: resolvePostMediaUrl(preview.image) }}
                      style={styles.previewLinkThumb}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.previewLinkPlaceholder}>
                      <MaterialCommunityIcons name="link-variant" size={28} color={colors.textMuted} />
                    </View>
                  )}
                  <View style={styles.previewLinkTextCol}>
                    <Text style={styles.previewLinkTitle} numberOfLines={2}>
                      {preview?.title?.trim() || linkUrl.trim()}
                    </Text>
                    {preview?.description ? (
                      <Text style={styles.previewLinkDesc} numberOfLines={2}>
                        {preview.description}
                      </Text>
                    ) : null}
                    <Text style={styles.previewLinkUrl} numberOfLines={1}>
                      {linkUrl.trim()}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function createComposeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screenPaddingH,
    paddingBottom: 12,
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  headerLeft: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerIconBtn: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 0,
  },
  headerTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fontSizes.screenTitle,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  headerRight: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerPreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 6,
    flexShrink: 0,
  },
  headerPreviewText: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: colors.brand,
    flexShrink: 0,
  },
  headerPostBtn: {
    minWidth: 88,
    minHeight: 40,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: theme.borderWidth.cta,
    borderColor: colors.brand,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPostBtnPrimary: {
    backgroundColor: colors.brand,
    borderWidth: 1,
    borderColor: colors.buttonBorder,
  },
  headerPostBtnDisabled: {
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceSubtle,
  },
  headerPostText: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: colors.brand,
  },
  headerPostTextPrimary: {
    color: colors.onBrand,
  },
  headerPostTextDisabled: {
    color: colors.textHint,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.screenPaddingH,
    paddingTop: 10,
    flexGrow: 1,
  },
  titleInput: {
    marginBottom: 10,
    paddingVertical: 4,
    paddingHorizontal: 0,
    textAlign: 'left',
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.xl,
    color: colors.textPrimary,
  },
  sectionLabelSmall: {
    marginTop: 8,
    marginBottom: 8,
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.xs,
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.88,
  },
  authorBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarInitials: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: colors.brand,
  },
  authorTextCol: {
    flex: 1,
    minWidth: 0,
  },
  authorName: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.md,
    color: colors.textPrimary,
  },
  anonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  anonLabel: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: colors.textMuted,
  },
  attachStrip: {
    marginBottom: 12,
    maxHeight: 92,
  },
  attachStripContent: {
    gap: 10,
    paddingVertical: 2,
    alignItems: 'center',
  },
  attachTile: {
    width: 76,
    height: 76,
    borderRadius: theme.radius.card,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceSubtle,
  },
  attachThumb: {
    width: '100%',
    height: '100%',
  },
  attachRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyWrap: {
    marginBottom: 14,
    flexGrow: 1,
    minHeight: 200,
  },
  bodyInput: {
    minHeight: 240,
    margin: 0,
    paddingVertical: 6,
    paddingHorizontal: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    textAlign: 'left',
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.md,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  singleLine: {
    paddingVertical: 12,
    paddingHorizontal: 0,
    textAlign: 'left',
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
    backgroundColor: 'transparent',
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  previewSpin: {
    marginVertical: 8,
  },
  previewErr: {
    marginBottom: 8,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: colors.danger,
  },
  previewCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: theme.radius.card,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
  previewImg: {
    width: 96,
    height: 96,
    backgroundColor: colors.surfaceSubtle,
  },
  previewTextCol: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    minWidth: 0,
  },
  previewTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: colors.textPrimary,
  },
  previewDesc: {
    marginTop: 4,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: colors.textMuted,
  },
  previewSrc: {
    marginTop: 6,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: colors.brand,
  },
  warn: {
    textAlign: 'center',
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: colors.danger,
    marginBottom: 16,
  },
  bottomToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screenPaddingH,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 8,
  },
  toolbarSpacer: {
    flex: 1,
  },
  toolbarCharCount: {
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.xs,
    color: colors.textMuted,
    minWidth: 36,
    textAlign: 'right',
  },
  toolbarHash: {
    fontFamily: theme.typography.semiBold,
    fontSize: 22,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  tagModalRoot: {
    flex: 1,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: theme.spacing.screenPaddingH,
  },
  tagModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tagModalTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fontSizes.screenTitle,
    color: colors.textPrimary,
  },
  tagModalDone: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.md,
    color: colors.brand,
  },
  tagModalHint: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: colors.textMuted,
    marginBottom: 6,
  },
  tagModalCounter: {
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.xs,
    color: colors.textMuted,
    marginBottom: 12,
  },
  tagChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tagChipOn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: colors.brand,
  },
  tagChipOnText: {
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.xs,
    color: colors.onBrand,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tagModalInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: theme.radius.input,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.surface,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: colors.textPrimary,
  },
  tagModalAddBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radius.badge,
    backgroundColor: colors.brandLight,
    borderWidth: 1,
    borderColor: colors.brandBorder,
  },
  tagModalAddBtnText: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: colors.brand,
  },
  previewModalRoot: {
    flex: 1,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: theme.spacing.screenPaddingH,
  },
  previewModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  previewModalTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fontSizes.screenTitle,
    color: colors.textPrimary,
  },
  previewModalDone: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.md,
    color: colors.brand,
  },
  previewModalScroll: {
    flex: 1,
  },
  previewModalScrollContent: {
    paddingBottom: 24,
  },
  previewFeedCard: {
    backgroundColor: colors.surface,
    paddingVertical: theme.spacing.cardPaddingV,
    paddingHorizontal: theme.spacing.cardPaddingH,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  previewTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  previewAvatarText: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: colors.brand,
  },
  previewHeaderMain: {
    flex: 1,
    minWidth: 0,
  },
  previewNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  previewDisplayName: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: colors.textPrimary,
  },
  previewTimeMeta: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: colors.textMuted,
  },
  previewHeaderSpacer: {
    flex: 1,
    minWidth: 4,
  },
  previewTypePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.badge,
  },
  previewTypePillText: {
    fontFamily: theme.typography.semiBold,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  previewTopicRow: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  previewTopicSep: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: colors.textMuted,
  },
  previewTopicPart: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: colors.textMuted,
  },
  previewTopicLast: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.xs,
    color: colors.brand,
  },
  previewPostTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.lg,
    color: colors.textPrimary,
    lineHeight: 26,
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  previewContentText: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  previewTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
  },
  previewTagText: {
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.xs,
    color: colors.brand,
  },
  previewLinkCard: {
    flexDirection: 'row',
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: theme.radius.card,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSubtle,
  },
  previewLinkThumb: {
    width: 96,
    height: 96,
    backgroundColor: colors.surfaceSubtle,
  },
  previewLinkPlaceholder: {
    width: 96,
    height: 96,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewLinkTextCol: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    minWidth: 0,
  },
  previewLinkTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: colors.textPrimary,
  },
  previewLinkDesc: {
    marginTop: 4,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: colors.textMuted,
  },
  previewLinkUrl: {
    marginTop: 6,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: colors.brand,
  },
});
}
