import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../../api';
import { theme } from '../../presentation/theme/theme';
import type { RootStackParamList } from '../types';

const COMMENT_MAX = 2000;

type Props = NativeStackScreenProps<RootStackParamList, 'PostComments'>;

export function PostCommentsScreen({ route, navigation }: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const { postId } = route.params;
  const { isLoggedIn } = useSession();
  const [draft, setDraft] = useState('');
  const [localComments, setLocalComments] = useState<string[]>([]);

  const goBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [goBack]);

  const sendComment = useCallback(() => {
    if (!isLoggedIn) return;
    const t = draft.trim();
    if (!t) return;
    setLocalComments((prev) => [...prev, t]);
    setDraft('');
  }, [draft, isLoggedIn]);

  const canSend = isLoggedIn && draft.trim().length > 0;

  /** Bottom sheet height: 60% of window. */
  const sheetMaxHeight = windowHeight * 0.6;

  return (
    <View style={styles.overlay} testID={`post-comments-${postId}`}>
      <Pressable
        style={styles.backdrop}
        onPress={goBack}
        accessibilityRole="button"
        accessibilityLabel="Close comments"
      />
      <View style={styles.sheetWrap} pointerEvents="box-none">
        <SafeAreaView
          style={[styles.sheet, { height: sheetMaxHeight }]}
          edges={['bottom']}
        >
          <KeyboardAvoidingView style={styles.flex1}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
          >
            <View style={styles.sheetTopBar}>
              <View style={styles.dragHint} />
            </View>

            <View style={styles.header}>
              <Pressable
                onPress={goBack}
                hitSlop={14}
                accessibilityRole="button"
                accessibilityLabel="Close"
                style={styles.iconBtn}
              >
                <MaterialCommunityIcons name="close" size={24} color={theme.colors.textPrimary} />
              </Pressable>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Comments
              </Text>
              <View style={styles.headerRight} />
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {localComments.length === 0 ? (
                <Text style={styles.placeholder}>
                  No comments yet. Replies will show here when available.
                </Text>
              ) : (
                localComments.map((line, i) => (
                  <View key={`${i}-${line.slice(0, 12)}`} style={styles.commentBubble}>
                    <Text style={styles.commentText}>{line}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.composerOuter}>
              {!isLoggedIn ? (
                <Text style={styles.signInHint}>Sign in to add a comment.</Text>
              ) : null}
              <View style={styles.composerRow}>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.input}
                    placeholder="Add a comment…"
                    placeholderTextColor={theme.colors.textHint}
                    value={draft}
                    onChangeText={(t) => {
                      if (t.length <= COMMENT_MAX) setDraft(t);
                    }}
                    multiline
                    maxLength={COMMENT_MAX}
                    editable={isLoggedIn}
                    textAlignVertical="top"
                  />
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.sendBtn,
                    !canSend && styles.sendBtnDisabled,
                    pressed && canSend && styles.sendBtnPressed,
                  ]}
                  onPress={sendComment}
                  disabled={!canSend}
                  accessibilityRole="button"
                  accessibilityLabel="Send comment"
                >
                  <MaterialCommunityIcons
                    name="send"
                    size={22}
                    color={canSend ? theme.colors.onBrand : theme.colors.textHint}
                  />
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
  },
  sheetWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
  },
  sheet: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.card,
    borderTopRightRadius: theme.radius.card,
    overflow: 'hidden',
    // Shadow so sheet separates from dimmed feed
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 16,
  },
  flex1: {
    flex: 1,
  },
  sheetTopBar: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  dragHint: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.borderSubtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderSubtle,
  },
  iconBtn: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: theme.typography.semiBold,
    fontSize: theme.fintSizes.md,
    color: theme.colors.textPrimary,
  },
  headerRight: {
    minWidth: 44,
  },
  scroll: {
    flex: 1,
    minHeight: 120,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.screenPaddingH,
    paddingTop: 16,
    paddingBottom: 12,
    flexGrow: 1,
  },
  placeholder: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textMuted,
    lineHeight: 22,
  },
  commentBubble: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: theme.borderWidth.default,
    borderColor: theme.colors.borderSubtle,
  },
  commentText: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
  composerOuter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.borderSubtle,
    paddingHorizontal: theme.spacing.screenPaddingH,
    paddingTop: 10,
    backgroundColor: theme.colors.surface,
  },
  signInHint: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.xs,
    color: theme.colors.textMuted,
    marginBottom: 8,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  inputBox: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: theme.radius.input,
    borderWidth: theme.borderWidth.default,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    fontFamily: theme.typography.regular,
    fontSize: theme.fintSizes.sm,
    color: theme.colors.textPrimary,
    minHeight: 24,
    maxHeight: 100,
    padding: 0,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: theme.colors.borderSubtle,
  },
  sendBtnPressed: {
    opacity: 0.88,
  },
});
