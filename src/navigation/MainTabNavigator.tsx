import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../presentation/theme/theme';
import { useThemeColors } from '../presentation/theme/ThemeContext';
import type { MainTabParamList } from './types';
import { HomeFeedScreen } from './screens/HomeFeedScreen';
import { InboxScreen } from './screens/InboxScreen';
import { ComposePostScreen } from '../features/posts/ComposePostScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ProgressScreen } from './screens/ProgressScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const tabBarBottomPad = Math.max(insets.bottom, 4);
  const tabBarVisibleStyle = useMemo(
    () => ({
      backgroundColor: colors.surface,
      borderTopColor: colors.borderSubtle,
      paddingTop: 2,
      paddingBottom: tabBarBottomPad,
      minHeight: 48 + tabBarBottomPad,
    }),
    [colors.borderSubtle, colors.surface, tabBarBottomPad],
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTitleStyle: {
          fontFamily: theme.typography.semiBold,
          fontSize: theme.fontSizes.screenTitle,
          color: colors.textPrimary,
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: theme.typography.medium,
          fontSize: theme.fontSizes.navLabel,
          marginBottom: 0,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        /** Hide tab bar on Post (compose) only; restore when switching tabs */
        tabBarStyle:
          route.name === 'Post' ? { display: 'none' as const, height: 0 } : tabBarVisibleStyle,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeFeedScreen}
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          headerShown: false,
          /** Reddit-style: outline inactive, filled active */
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'home' : 'home-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'chart-timeline' : 'chart-timeline-variant'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Post"
        component={ComposePostScreen}
        options={{
          title: 'Post',
          headerShown: false,
          /** Center create: circular hit target */
          tabBarIcon: ({ focused }) => {
            const size = 40;
            return (
              <View
                style={{
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  backgroundColor: focused ? colors.brand : 'transparent',
                  borderWidth: focused ? 0 : 1.5,
                  borderColor: colors.borderSubtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={22}
                  color={focused ? colors.onBrand : colors.textMuted}
                />
              </View>
            );
          },
        }}
      />
      <Tab.Screen
        name="Inbox"
        component={InboxScreen}
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'bell' : 'bell-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'You',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'account-circle' : 'account-circle-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
