import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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
  POST_TYPES,
  TAG_PART,
  validateMediaRule,
  validatePostContent,
  validateTags,
} from '../../api/post/postValidation';
import {
  composeBreadcrumbSegments,
  TOPIC_OPTIONS,
  type TopicOption,
} from '../../api/post/topicCatalog';
import { resolvePostMediaUrl } from '../../api/post/mediaUrl';
import type { TokenUser } from '../../api/types';
import { theme } from '../../presentation/theme/theme';

const CONTENT_MAX = 2000;

const PLACEHOLDERS: Record<PostType, string> = {
  DOUBT: 'What are you stuck on? Be specific and clear.',
  TIP: 'Share a tip that worked for you…',
  WIN: 'Celebrate a win — what happened?',
  EXPERIENCE: 'Describe your experience…',
};

const SUGGESTED_TAG_POOL = [
  'eigenvalues',
  'linearalgebra',
  'visualintuition',
  'matrices',
  'jee2026',
  'shortcut',
];

function userDisplayName(u: TokenUser | undefined | null): string {
  if (!u) return 'Member';
  const parts = [u.first_name?.trim(), u.last_name?.trim()].filter(Boolean);
  if (parts.length) return parts.join(' ');
  return u.username ?? 'Member';
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

function normalizeTagInput(raw: string): string {
  return raw.trim().replace(/^#+/u, '').toLowerCase();
}

export function ComposePostScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const scrollRef = useRef<ScrollView>(null);
  const linkInputRef = useRef<TextInput>(null);
  const { accessToken, user } = useSession();

  const [postType, setPostType] = useState<PostType>('DOUBT');
  const [topic, setTopic] = useState<TopicOption>(
    () => TOPIC_OPTIONS.find((t) => t.topic_id === 2) ?? TOPIC_OPTIONS[0]!,
  );
  const [exam, setExam] = useState<Exam | null>(null);
  const [topicExamModal, setTopicExamModal] = useState(false);
  const [content, setContent] = useState('');
  const [tagList, setTagList] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkRowVisible, setLinkRowVisible] = useState(false);
  const [images, setImages] = useState<CreatePostImageInput[]>([]);
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { preview, loading: previewLoading, error: previewError, schedulePreview, clearPreview } =
    useLinkPreview();

  const {
    items: exams,
    loading: examsLoading,
    loadMore: loadMoreExams,
    hasMore: examsHasMore,
  } = useExamsList({ pageSize: 40 });

  const onLinkChange = useCallback(
    (text: string) => {
      setLinkUrl(text);
      schedulePreview(text);
      if (text.trim().length === 0) clearPreview();
    },
    [schedulePreview, clearPreview],
  );

  const addPhotos = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photos', 'Allow photo access to attach images.');
      return;
    }
    const remaining = 4 - images.length;
    if (remaining <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: Platform.OS === 'ios',
      selectionLimit: remaining,
    });
    if (result.canceled) return;
    const next = [...images];
    for (const a of result.assets ?? []) {
      if (next.length >= 4) break;
      next.push({
        uri: a.uri,
        name: a.fileName ?? 'photo.jpg',
        type: a.mimeType ?? 'image/jpeg',
      });
    }
    setImages(next);
    setLinkUrl('');
    clearPreview();
    setLinkRowVisible(false);
  }, [images, clearPreview]);

  const removeImage = useCallback((uri: string) => {
    setImages((prev) => prev.filter((i) => i.uri !== uri));
  }, []);

  const removeTag = useCallback((t: string) => {
    setTagList((prev) => prev.filter((x) => x !== t));
  }, []);

  const addTagFromDraft = useCallback(() => {
    const t = normalizeTagInput(tagDraft);
    if (!t) return;
    if (tagList.length >= 3) {
      Alert.alert('Tags', 'You can add up to 3 tags.');
      return;
    }
    if (!TAG_PART.test(t)) {
      Alert.alert('Tags', 'Use letters, numbers, and underscores only (max 30 characters).');
      return;
    }
    if (tagList.includes(t)) {
      setTagDraft('');
      return;
    }
    setTagList((prev) => [...prev, t]);
    setTagDraft('');
  }, [tagDraft, tagList]);

  const addSuggestedTag = useCallback((t: string) => {
    if (tagList.length >= 3 || tagList.includes(t)) return;
    if (!TAG_PART.test(t)) return;
    setTagList((prev) => [...prev, t]);
  }, [tagList]);

  const toggleLinkRow = useCallback(() => {
    if (images.length > 0) {
      Alert.alert('Photos', 'Remove photos to add a link.');
      return;
    }
    setLinkRowVisible((v) => !v);
    if (!linkRowVisible) {
      setTimeout(() => linkInputRef.current?.focus(), 100);
    }
  }, [images.length, linkRowVisible]);

  const insertBullet = useCallback(() => {
    setContent((c) => (c.length === 0 ? '• ' : `${c}\n• `));
  }, []);

  const breadcrumbParts = useMemo(() => composeBreadcrumbSegments(topic, exam), [topic, exam]);

  const canSubmit = useMemo(() => {
    if (!exam) return false;
    if (validatePostContent(content)) return false;
    if (validateTags(tagList)) return false;
    if (validateMediaRule(images.length, linkUrl.trim())) return false;
    return true;
  }, [content, tagList, exam, images.length, linkUrl]);

  const submit = useCallback(async () => {
    if (!exam || !canSubmit) return;
    const cErr = validatePostContent(content);
    if (cErr) {
      Alert.alert('Content', cErr);
      return;
    }
    const tagErr = validateTags(tagList);
    if (tagErr) {
      Alert.alert('Tags', tagErr);
      return;
    }
    const mErr = validateMediaRule(images.length, linkUrl.trim());
    if (mErr) {
      Alert.alert('Photos or link', mErr);
      return;
    }

    const trimmedLink = linkUrl.trim();
    const hasLink = trimmedLink.length > 0;

    setSubmitting(true);
    try {
      await postApi.createPost({
        post_type: postType,
        topic_id: topic.topic_id,
        subject_id: topic.subject_id,
        exam_id: exam.id,
        content: content.trim(),
        tags: tagList,
        images: images.length > 0 ? images : undefined,
        link_url: hasLink ? trimmedLink : undefined,
        link_title: hasLink ? preview?.title : undefined,
        link_desc: hasLink ? preview?.description : undefined,
        link_img: hasLink && preview?.image ? resolvePostMediaUrl(preview.image) : undefined,
        is_anonymous: anonymous,
      });
      Alert.alert('Posted', 'Your post is live.', [
        {
          text: 'OK',
          onPress: () => {
            setContent('');
            setTagList([]);
            setTagDraft('');
            setLinkUrl('');
            setImages([]);
            clearPreview();
            setAnonymous(false);
            setLinkRowVisible(false);
            navigation.navigate('Home' as never);
          },
        },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not publish.';
      Alert.alert('Publish failed', msg);
    } finally {
      setSubmitting(false);
    }
  }, [
    anonymous,
    canSubmit,
    clearPreview,
    content,
    exam,
    images,
    linkUrl,
    navigation,
    postType,
    preview?.description,
    preview?.image,
    preview?.title,
    tagList,
    topic.subject_id,
    topic.topic_id,
  ]);

  const suggestedFiltered = useMemo(
    () => SUGGESTED_TAG_POOL.filter((t) => !tagList.includes(t)),
    [tagList],
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => navigation.navigate('Home' as never)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Text style={styles.headerCancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle} accessibilityRole="header">
          New post
        </Text>
        <Pressable
          onPress={() => void submit()}
          disabled={!canSubmit || submitting}
          style={({ pressed }) => [
            styles.headerPostBtn,
            (!canSubmit || submitting) && styles.headerPostBtnDisabled,
            pressed && canSubmit && !submitting && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Post"
        >
          {submitting ? (
            <ActivityIndicator size="small" color={theme.colors.brand} />
          ) : (
            <Text style={[styles.headerPostText, (!canSubmit || submitting) && styles.headerPostTextDisabled]}>
              Post
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 12) + 88 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>What are you sharing?</Text>
        <View style={styles.typeRow}>
          {POST_TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setPostType(t)}
              style={({ pressed }) => [
                styles.typeChip,
                postType === t && styles.typeChipOn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.typeChipText, postType === t && styles.typeChipTextOn]}>{t}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.breadcrumbBar}>
          <MaterialCommunityIcons name="format-list-bulleted" size={20} color={theme.colors.textMuted} />
          <View style={styles.breadcrumbTextWrap}>
            {breadcrumbParts.map((segment, i, arr) => (
              <Fragment key={`${segment}-${i}`}>
                {i > 0 ? <Text style={styles.breadcrumbSep}> › </Text> : null}
                <Text
                  style={i === arr.length - 1 ? styles.breadcrumbLast : styles.breadcrumbPart}
                  numberOfLines={1}
                >
                  {segment}
                </Text>
              </Fragment>
            ))}
          </View>
          <Pressable onPress={() => setTopicExamModal(true)} hitSlop={8} accessibilityRole="button">
            <Text style={styles.changeLink}>Change</Text>
          </Pressable>
        </View>

        <View style={styles.authorBlock}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{userInitials(user)}</Text>
          </View>
          <View style={styles.authorTextCol}>
            <Text style={styles.authorName} numberOfLines={1}>
              {userDisplayName(user)}
            </Text>
            <View style={styles.anonRow}>
              <Switch value={anonymous} onValueChange={setAnonymous} />
              <Text style={styles.anonLabel}>Post anonymously</Text>
            </View>
          </View>
        </View>

        <View style={styles.bodyWrap}>
          <TextInput
            style={styles.bodyInput}
            multiline
            placeholder={PLACEHOLDERS[postType]}
            placeholderTextColor={theme.colors.textHint}
            value={content}
            onChangeText={(txt) => {
              if (txt.length <= CONTENT_MAX) setContent(txt);
            }}
            textAlignVertical="top"
          />
          <Text style={styles.charCountInBody}>
            {content.length} / {CONTENT_MAX}
          </Text>
        </View>

        <View style={styles.mediaRow}>
          {images.map((img) => (
            <View key={img.uri} style={styles.photoWrap}>
              <Image source={{ uri: img.uri }} style={styles.photoThumb} />
              <Pressable style={styles.photoRemove} onPress={() => removeImage(img.uri)} hitSlop={6}>
                <MaterialCommunityIcons name="close-circle" size={22} color={theme.colors.danger} />
              </Pressable>
            </View>
          ))}
          {images.length < 4 ? (
            <Pressable
              style={({ pressed }) => [styles.addPhoto, pressed && styles.pressed]}
              onPress={() => void addPhotos()}
              disabled={linkUrl.trim().length > 0}
            >
              <MaterialCommunityIcons name="plus" size={24} color={theme.colors.brand} />
              <Text style={styles.addPhotoLabel}>Add — {images.length}/4</Text>
            </Pressable>
          ) : null}
        </View>
        {linkUrl.trim().length > 0 ? (
          <Text style={styles.hint}>Clear the link to add photos.</Text>
        ) : null}

        {linkRowVisible && images.length === 0 ? (
          <>
            <Text style={styles.sectionLabelSmall}>Link (optional)</Text>
            <TextInput
              ref={linkInputRef}
              style={styles.singleLine}
              placeholder="https://…"
              placeholderTextColor={theme.colors.textHint}
              value={linkUrl}
              onChangeText={onLinkChange}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {previewLoading ? (
              <ActivityIndicator style={styles.previewSpin} color={theme.colors.brand} />
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

        <View style={styles.tagsHeaderRow}>
          <Text style={styles.sectionLabel}>Tags</Text>
          <Text style={styles.tagsCounter}>
            {tagList.length} / 3
          </Text>
        </View>
        <View style={styles.tagChipsRow}>
          {tagList.map((t) => (
            <View key={t} style={styles.tagChipOn}>
              <Text style={styles.tagChipOnText}>#{t}</Text>
              <Pressable onPress={() => removeTag(t)} hitSlop={6} accessibilityLabel={`Remove ${t}`}>
                <MaterialCommunityIcons name="close" size={16} color={theme.colors.onBrand} />
              </Pressable>
            </View>
          ))}
        </View>
        <View style={styles.tagInputRow}>
          <TextInput
            style={styles.tagInput}
            placeholder="Type a tag…"
            placeholderTextColor={theme.colors.textHint}
            value={tagDraft}
            onChangeText={setTagDraft}
            onSubmitEditing={() => addTagFromDraft()}
            autoCapitalize="none"
            editable={tagList.length < 3}
          />
          <Pressable
            style={({ pressed }) => [styles.addTagBtn, pressed && styles.pressed]}
            onPress={addTagFromDraft}
            disabled={tagList.length >= 3}
          >
            <Text style={styles.addTagBtnText}>Add</Text>
          </Pressable>
        </View>
        <Text style={styles.suggestedLabel}>Suggested</Text>
        <View style={styles.suggestedRow}>
          {suggestedFiltered.map((t) => (
            <Pressable
              key={t}
              style={({ pressed }) => [styles.suggestedChip, pressed && styles.pressed]}
              onPress={() => addSuggestedTag(t)}
            >
              <Text style={styles.suggestedChipText}>#{t}</Text>
            </Pressable>
          ))}
        </View>

        {!accessToken ? <Text style={styles.warn}>Sign in to publish posts.</Text> : null}
      </ScrollView>

      <View style={[styles.bottomToolbar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <Pressable
          style={styles.toolbarBtn}
          onPress={() => void addPhotos()}
          disabled={linkUrl.trim().length > 0}
          accessibilityLabel="Add image"
        >
          <MaterialCommunityIcons
            name="image-outline"
            size={22}
            color={linkUrl.trim().length > 0 ? theme.colors.textHint : theme.colors.brand}
          />
          <Text style={styles.toolbarCount}>{images.length}/4</Text>
        </Pressable>
        <Pressable style={styles.toolbarBtn} onPress={toggleLinkRow} accessibilityLabel="Add link">
          <MaterialCommunityIcons
            name="link-variant"
            size={22}
            color={images.length > 0 ? theme.colors.textHint : theme.colors.brand}
          />
        </Pressable>
        <Pressable style={styles.toolbarBtn} onPress={insertBullet} accessibilityLabel="Bullet list">
          <MaterialCommunityIcons name="format-list-bulleted" size={22} color={theme.colors.brand} />
        </Pressable>
        <View style={styles.toolbarSpacer} />
        <Pressable
          style={styles.toolbarBtn}
          onPress={() => Alert.alert('Save draft', 'Draft saving will be available in a future update.')}
          accessibilityLabel="Save draft"
        >
          <MaterialCommunityIcons name="bookmark-outline" size={22} color={theme.colors.textMuted} />
        </Pressable>
        <Text style={styles.toolbarCharCount} maxFontSizeMultiplier={1.2}>
          {content.length} / {CONTENT_MAX}
        </Text>
      </View>

      <Modal visible={topicExamModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalRoot, { paddingTop: insets.top + 12 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Topic & exam</Text>
            <Pressable onPress={() => setTopicExamModal(false)} hitSlop={12}>
              <Text style={styles.modalDone}>Done</Text>
            </Pressable>
          </View>
          <Text style={styles.modalSectionLabel}>Topic</Text>
          <View style={styles.typeRow}>
            {TOPIC_OPTIONS.map((opt) => (
              <Pressable
                key={opt.topic_id}
                onPress={() => setTopic(opt)}
                style={({ pressed }) => [
                  styles.typeChip,
                  topic.topic_id === opt.topic_id && styles.typeChipOn,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[styles.typeChipText, topic.topic_id === opt.topic_id && styles.typeChipTextOn]}
                  numberOfLines={1}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.modalSectionLabel, { marginTop: 16 }]}>Exam</Text>
          {examsLoading && exams.length === 0 ? (
            <ActivityIndicator size="large" color={theme.colors.brand} style={{ marginTop: 24 }} />
          ) : (
            <FlatList
              data={exams}
              keyExtractor={(item) => String(item.id)}
              style={styles.examList}
              onEndReached={() => {
                if (examsHasMore) void loadMoreExams();
              }}
              onEndReachedThreshold={0.4}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [styles.examRow, pressed && styles.pressed]}
                  onPress={() => setExam(item)}
                >
                  <Text style={styles.examRowText}>{item.name}</Text>
                  {exam?.id === item.id ? (
                    <MaterialCommunityIcons name="check" size={20} color={theme.colors.brand} />
                  ) : null}
                </Pressable>
              )}
            />
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.screenPaddingH,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.surface,
  },
  headerCancel: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.md,
    color: theme.colors.textPrimary,
  },
  headerTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fontSizes.screenTitle,
    color: theme.colors.textPrimary,
  },
  headerPostBtn: {
    minWidth: 72,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radius.badge,
    borderWidth: theme.borderWidth.cta,
    borderColor: theme.colors.brand,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPostBtnDisabled: {
    borderColor: theme.colors.borderSubtle,
  },
  headerPostText: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.brand,
  },
  headerPostTextDisabled: {
    color: theme.colors.textHint,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.screenPaddingH,
    paddingTop: 16,
  },
  sectionLabel: {
    marginBottom: 10,
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fontSizes.sectionLabel,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionLabelSmall: {
    marginTop: 8,
    marginBottom: 8,
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  typeChip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.surface,
  },
  typeChipOn: {
    borderColor: theme.colors.brand,
    backgroundColor: theme.colors.brand,
  },
  typeChipText: {
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
  },
  typeChipTextOn: {
    color: theme.colors.onBrand,
  },
  pressed: {
    opacity: 0.88,
  },
  breadcrumbBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.surfaceSubtle,
    marginBottom: 16,
  },
  breadcrumbTextWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    minWidth: 0,
  },
  breadcrumbSep: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
  },
  breadcrumbPart: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
  },
  breadcrumbLast: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.brand,
    flexShrink: 1,
  },
  changeLink: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.brand,
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
    backgroundColor: theme.colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.brand,
  },
  authorTextCol: {
    flex: 1,
    minWidth: 0,
  },
  authorName: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.md,
    color: theme.colors.textPrimary,
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
    color: theme.colors.textMuted,
  },
  bodyWrap: {
    position: 'relative',
    marginBottom: 14,
  },
  bodyInput: {
    minHeight: 160,
    padding: 14,
    paddingBottom: 32,
    borderRadius: theme.radius.input,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.surface,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
  charCountInBody: {
    position: 'absolute',
    right: 12,
    bottom: 10,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textHint,
  },
  mediaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  photoWrap: {
    position: 'relative',
  },
  photoThumb: {
    width: 88,
    height: 88,
    borderRadius: theme.radius.badge,
    backgroundColor: theme.colors.borderSubtle,
  },
  photoRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  addPhoto: {
    width: 88,
    minHeight: 88,
    borderRadius: theme.radius.badge,
    borderWidth: 1,
    borderColor: theme.colors.brandBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: 8,
    gap: 4,
  },
  addPhotoLabel: {
    fontFamily: theme.typography.medium,
    fontSize: 10,
    color: theme.colors.brand,
    textAlign: 'center',
  },
  hint: {
    marginBottom: 8,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
  },
  singleLine: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: theme.radius.input,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.surface,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  previewSpin: {
    marginVertical: 8,
  },
  previewErr: {
    marginBottom: 8,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.danger,
  },
  previewCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radius.card,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    marginBottom: 12,
  },
  previewImg: {
    width: 96,
    height: 96,
    backgroundColor: theme.colors.surfaceSubtle,
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
    color: theme.colors.textPrimary,
  },
  previewDesc: {
    marginTop: 4,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
  },
  previewSrc: {
    marginTop: 6,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.brand,
  },
  tagsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 10,
  },
  tagsCounter: {
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
  },
  tagChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  tagChipOn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brand,
  },
  tagChipOnText: {
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.onBrand,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: theme.radius.input,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.surface,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textPrimary,
  },
  addTagBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radius.badge,
    backgroundColor: theme.colors.brandLight,
    borderWidth: 1,
    borderColor: theme.colors.brandBorder,
  },
  addTagBtnText: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.brand,
  },
  suggestedLabel: {
    marginBottom: 8,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
  },
  suggestedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  suggestedChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.surface,
  },
  suggestedChipText: {
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
  },
  warn: {
    textAlign: 'center',
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.danger,
    marginBottom: 16,
  },
  bottomToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screenPaddingH,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.surface,
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  toolbarCount: {
    fontFamily: theme.typography.medium,
    fontSize: 11,
    color: theme.colors.brand,
  },
  toolbarSpacer: {
    flex: 1,
  },
  toolbarCharCount: {
    fontFamily: theme.typography.medium,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
    minWidth: 36,
    textAlign: 'right',
  },
  modalRoot: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: theme.spacing.screenPaddingH,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fontSizes.screenTitle,
    color: theme.colors.textPrimary,
  },
  modalDone: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.md,
    color: theme.colors.brand,
  },
  modalSectionLabel: {
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fontSizes.sectionHead,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  examList: {
    flex: 1,
  },
  examRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderSubtle,
  },
  examRowText: {
    flex: 1,
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textPrimary,
  },
});
