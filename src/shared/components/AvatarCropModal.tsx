import { MaterialCommunityIcons } from '@expo/vector-icons';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../presentation/theme/ThemeContext';
import { clampPan, coverScale, naturalSquareCrop } from '../utils/avatarCropGeometry';
import { compressJpegUriUnderMaxBytes } from '../utils/compressImageForUpload';

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.15;

type Props = {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
  /** Called with JPEG file URI after crop */
  onConfirm: (croppedUri: string) => void;
  /** Square viewport size in px (default scales with window) */
  cropViewportSize?: number;
};

export function AvatarCropModal({
  visible,
  uri,
  onClose,
  onConfirm,
  cropViewportSize,
}: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const [naturalW, setNaturalW] = useState(0);
  const [naturalH, setNaturalH] = useState(0);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [exporting, setExporting] = useState(false);

  const dragStart = useRef({ tx: 0, ty: 0 });
  const txRef = useRef(0);
  const tyRef = useRef(0);

  const cropSize = cropViewportSize ?? 300;

  const baseScale = useMemo(
    () => (naturalW && naturalH ? coverScale(naturalW, naturalH, cropSize) : 1),
    [naturalW, naturalH, cropSize],
  );
  const scale = baseScale * zoom;
  const dispW = naturalW * scale;
  const dispH = naturalH * scale;

  useEffect(() => {
    if (!visible || !uri) {
      setNaturalW(0);
      setNaturalH(0);
      setMetaError(null);
      setZoom(1);
      return;
    }
    setLoadingMeta(true);
    setMetaError(null);
    Image.getSize(
      uri,
      (w, h) => {
        setNaturalW(w);
        setNaturalH(h);
        setLoadingMeta(false);
      },
      () => {
        setMetaError('Could not read image.');
        setLoadingMeta(false);
      },
    );
  }, [visible, uri]);

  useEffect(() => {
    if (!naturalW || !naturalH) return;
    const s = coverScale(naturalW, naturalH, cropSize) * zoom;
    const dw = naturalW * s;
    const dh = naturalH * s;
    const c = clampPan((cropSize - dw) / 2, (cropSize - dh) / 2, dw, dh, cropSize);
    setTx(c.tx);
    setTy(c.ty);
  }, [naturalW, naturalH, cropSize, zoom]);

  useEffect(() => {
    txRef.current = tx;
    tyRef.current = ty;
  }, [tx, ty]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => naturalW > 0 && naturalH > 0,
        onMoveShouldSetPanResponder: () => naturalW > 0 && naturalH > 0,
        onPanResponderGrant: () => {
          dragStart.current = { tx: txRef.current, ty: tyRef.current };
        },
        onPanResponderMove: (_, g) => {
          const nextTx = dragStart.current.tx + g.dx;
          const nextTy = dragStart.current.ty + g.dy;
          const c = clampPan(nextTx, nextTy, dispW, dispH, cropSize);
          setTx(c.tx);
          setTy(c.ty);
        },
      }),
    [naturalW, naturalH, dispW, dispH, cropSize],
  );

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(MIN_ZOOM, Math.round((z - ZOOM_STEP) * 100) / 100));
  }, []);
  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(MAX_ZOOM, Math.round((z + ZOOM_STEP) * 100) / 100));
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!uri) return;
    if (!naturalW || !naturalH || metaError) {
      setExporting(true);
      try {
        const underLimit = await compressJpegUriUnderMaxBytes(uri);
        onConfirm(underLimit);
      } catch {
        onConfirm(uri);
      } finally {
        setExporting(false);
        onClose();
      }
      return;
    }
    setExporting(true);
    try {
      const { originX, originY, size } = naturalSquareCrop(
        naturalW,
        naturalH,
        cropSize,
        scale,
        tx,
        ty,
      );
      if (size < 1) {
        try {
          const underLimit = await compressJpegUriUnderMaxBytes(uri);
          onConfirm(underLimit);
        } catch {
          onConfirm(uri);
        }
        onClose();
        return;
      }
      const result = await manipulateAsync(
        uri,
        [
          {
            crop: {
              originX,
              originY,
              width: size,
              height: size,
            },
          },
          { resize: { width: 512 } },
        ],
        { compress: 0.88, format: SaveFormat.JPEG },
      );
      const underLimit = await compressJpegUriUnderMaxBytes(result.uri);
      onConfirm(underLimit);
      onClose();
    } catch {
      try {
        const underLimit = await compressJpegUriUnderMaxBytes(uri);
        onConfirm(underLimit);
      } catch {
        onConfirm(uri);
      }
      onClose();
    } finally {
      setExporting(false);
    }
  }, [
    uri,
    naturalW,
    naturalH,
    metaError,
    cropSize,
    scale,
    tx,
    ty,
    onConfirm,
    onClose,
  ]);

  const showViewport = naturalW > 0 && naturalH > 0 && !metaError;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.backdrop, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => [styles.headerBtn, pressed && styles.headerBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Cancel crop"
            >
              <Text style={styles.headerBtnTextMuted}>Cancel</Text>
            </Pressable>
            <Text style={styles.headerTitle} accessibilityRole="header">
              Crop photo
            </Text>
            <Pressable
              onPress={() => void handleConfirm()}
              disabled={exporting || !uri}
              hitSlop={12}
              style={({ pressed }) => [
                styles.headerBtn,
                pressed && !exporting && styles.headerBtnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Save cropped photo"
            >
              {exporting ? (
                <ActivityIndicator size="small" color={colors.brand} />
              ) : (
                <Text style={styles.headerBtnTextPrimary}>Done</Text>
              )}
            </Pressable>
          </View>

          <Text style={styles.hint}>Drag to reposition. Pinch is not required — use zoom.</Text>

          <View style={styles.viewportWrap}>
            {loadingMeta ? (
              <ActivityIndicator size="large" color={colors.brand} />
            ) : showViewport ? (
              <View
                style={[styles.viewport, { width: cropSize, height: cropSize }]}
                {...panResponder.panHandlers}
              >
                <View style={{ transform: [{ translateX: tx }, { translateY: ty }] }}>
                  <Image
                    source={{ uri: uri! }}
                    style={{ width: dispW, height: dispH }}
                    resizeMode="stretch"
                  />
                </View>
                <View style={styles.viewportFrame} pointerEvents="none" />
              </View>
            ) : (
              <Text style={styles.errText}>{metaError ?? 'Invalid image'}</Text>
            )}
          </View>

          <View style={styles.zoomRow}>
            <Pressable
              onPress={zoomOut}
              disabled={zoom <= MIN_ZOOM}
              style={({ pressed }) => [styles.zoomBtn, pressed && styles.zoomBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Zoom out"
            >
              <MaterialCommunityIcons name="minus" size={22} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.zoomLabel}>{Math.round(zoom * 100)}%</Text>
            <Pressable
              onPress={zoomIn}
              disabled={zoom >= MAX_ZOOM}
              style={({ pressed }) => [styles.zoomBtn, pressed && styles.zoomBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Zoom in"
            >
              <MaterialCommunityIcons name="plus" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>

          {Platform.OS === 'web' ? (
            <Text style={styles.webNote}>On web, cropping may be limited; Done uses the original file if needed.</Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: theme.radius.card + 4,
      borderTopRightRadius: theme.radius.card + 4,
      paddingHorizontal: theme.spacing.screenPaddingH,
      paddingBottom: 8,
      maxHeight: '92%',
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    headerBtn: {
      minWidth: 72,
      paddingVertical: 10,
    },
    headerBtnPressed: {
      opacity: 0.72,
    },
    headerBtnTextMuted: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fintSizes.md,
      color: colors.textMuted,
    },
    headerBtnTextPrimary: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.brand,
    },
    headerTitle: {
      fontFamily: theme.typography.semiBold,
      fontSize: theme.fintSizes.md,
      color: colors.textPrimary,
    },
    hint: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fontSizes.meta,
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: 16,
    },
    viewportWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 320,
    },
    viewport: {
      overflow: 'hidden',
      borderRadius: 4,
      backgroundColor: colors.surfaceSubtle,
    },
    viewportFrame: {
      ...StyleSheet.absoluteFillObject,
      borderWidth: 2,
      borderColor: colors.brand,
      borderRadius: 4,
    },
    errText: {
      fontFamily: theme.typography.regular,
      fontSize: theme.fintSizes.sm,
      color: colors.danger,
    },
    zoomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
      marginTop: 20,
      marginBottom: 8,
    },
    zoomBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    zoomBtnPressed: {
      opacity: 0.85,
    },
    zoomLabel: {
      fontFamily: theme.typography.medium,
      fontSize: theme.fintSizes.sm,
      color: colors.textMuted,
      minWidth: 52,
      textAlign: 'center',
      fontVariant: ['tabular-nums'],
    },
    webNote: {
      marginTop: 8,
      fontFamily: theme.typography.regular,
      fontSize: theme.fontSizes.meta,
      color: colors.textHint,
      textAlign: 'center',
    },
  });
}
