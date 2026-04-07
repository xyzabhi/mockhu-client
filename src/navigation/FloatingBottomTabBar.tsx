import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Platform, StyleSheet, View } from 'react-native';
import { useThemeColors } from '../presentation/theme/ThemeContext';

const H_MARGIN = 16;
const PILL_RADIUS = 26;

/**
 * Floating, elevated tab bar — rounded pill with shadow. Hidden on the Post (compose) screen.
 */
export function FloatingBottomTabBar(props: BottomTabBarProps) {
  const colors = useThemeColors();
  const focusedName = props.state.routes[props.state.index]?.name;

  if (focusedName === 'Post') {
    return null;
  }

  return (
    <View style={styles.outer}>
      <View
        style={[
          styles.pill,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderSubtle,
          },
        ]}
      >
        <BottomTabBar
          {...props}
          style={{
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: H_MARGIN,
    paddingTop: 12,
    paddingBottom: 4,
  },
  pill: {
    borderRadius: PILL_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
      default: {},
    }),
  },
});
