import { useMemo } from 'react';
import { Image, StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { theme } from '../../presentation/theme/theme';
import { type ThemeColors, useThemeColors } from '../../presentation/theme/ThemeContext';

const BRAND_LOGO = require('../../../assets/brand_logo.png');

const _logoSrc = Image.resolveAssetSource(BRAND_LOGO);
/** Width ÷ height of `brand_logo.png` — use so the frame matches the asset (no side gutters). */
export const BRAND_LOGO_ASPECT =
  _logoSrc.width > 0 && _logoSrc.height > 0 ? _logoSrc.width / _logoSrc.height : 1;

export type BrandLogoProps = {
  /** Merged onto the bordered frame; defaults to 64×64 and card radius. */
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
};

/**
 * Mockhu mark — asset in a **1px black** rounded frame; frame size follows image aspect ratio.
 */
export function BrandLogo({
  style,
  imageStyle,
  accessibilityLabel = 'Mockhu',
}: BrandLogoProps) {
  const colors = useThemeColors();
  const frameStyles = useMemo(() => createFrameStyles(colors), [colors]);

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[frameStyles.frame, styles.defaultSize, style]}
    >
      <Image
        source={BRAND_LOGO}
        style={[styles.image, imageStyle]}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

function createFrameStyles(colors: ThemeColors) {
  return StyleSheet.create({
    frame: {
      borderWidth: 1,
      borderColor: '#000000',
      backgroundColor: colors.surface,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}

const styles = StyleSheet.create({
  defaultSize: {
    height: 64,
    aspectRatio: BRAND_LOGO_ASPECT,
    borderRadius: theme.radius.card,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
