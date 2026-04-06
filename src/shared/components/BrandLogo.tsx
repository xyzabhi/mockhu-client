import { Image, StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { theme } from '../../presentation/theme/theme';

const BRAND_LOGO = require('../../../assets/brand_logo.png');

export type BrandLogoProps = {
  /** Merged onto the bordered frame; defaults to 64×64 and card radius. */
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
};

/**
 * Mockhu mark — single asset with a 1px black frame (brand lockup).
 */
export function BrandLogo({
  style,
  imageStyle,
  accessibilityLabel = 'Mockhu',
}: BrandLogoProps) {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[styles.frame, styles.defaultSize, style]}
    >
      <Image
        source={BRAND_LOGO}
        style={[styles.image, imageStyle]}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderWidth: 1,
    borderColor: '#000000',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultSize: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.card,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
