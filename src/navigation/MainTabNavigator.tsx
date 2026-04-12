import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import Octicons from '@expo/vector-icons/Octicons';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { normalizeTokenUserProfile, useSession } from '../api';
import { theme } from '../presentation/theme/theme';
import { useThemeColors } from '../presentation/theme/ThemeContext';
import { UserAvatar } from '../shared/components/UserAvatar';
import type { MainTabParamList } from './types';
import { HomeFeedScreen } from './screens/HomeFeedScreen';
import { InboxScreen } from './screens/InboxScreen';
import { ComposePostScreen } from '../features/posts/ComposePostScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { FloatingBottomTabBar } from './FloatingBottomTabBar';

const Tab = createBottomTabNavigator<MainTabParamList>();

/** Default icon size when the navigator does not pass `size`. */
const TAB_ICON_SIZE = 24;

/** Matches header side slots so the title stays visually centered (esp. Android). */
const HEADER_SIDE_SLOT = 48;

type MainTabNav = BottomTabNavigationProp<MainTabParamList, keyof MainTabParamList>;

function backToHomeHeaderOptions(
  colors: { textPrimary: string },
  navigation: MainTabNav,
) {
  return {
    headerLeft: () => (
      <View
        style={{
          width: HEADER_SIDE_SLOT,
          alignItems: 'flex-start',
          justifyContent: 'center',
          marginLeft: Platform.OS === 'ios' ? 4 : 0,
        }}
      >
        <Pressable
          onPress={() => navigation.navigate('Home')}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back to home"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>
    ),
    headerRight: () => (
      <View
        style={{ width: HEADER_SIDE_SLOT }}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    ),
  };
}

export function MainTabNavigator() {
  const colors = useThemeColors();
  const { user } = useSession();
  const profile = useMemo(
    () => (user ? normalizeTokenUserProfile(user) : null),
    [user],
  );
  const profileSeed = profile?.id?.trim() || profile?.username?.trim() || 'profile';

  const postFabStyle = useMemo(
    () => ({
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.brand,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginTop: -18,
      ...Platform.select({
        ios: {
          shadowColor: colors.brand,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.38,
          shadowRadius: 12,
        },
        android: { elevation: 12 },
        default: {},
      }),
    }),
    [colors.brand],
  );

  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingBottomTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        /** Android defaults to left; center matches iOS and balances with nav actions. */
        headerTitleAlign: 'center',
        /** Align native header chrome (title + icons) with body `textPrimary`. */
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontFamily: theme.typography.semiBold,
          fontSize: theme.fontSizes.screenTitle,
          color: colors.textPrimary,
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerShadowVisible: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.brand,
        /** Inactive tab icons match body text; active uses brand (same as links/CTAs). */
        tabBarInactiveTintColor: colors.textPrimary,
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeFeedScreen}
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Octicons name="home-fill" size={size ?? TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={({ navigation }) => ({
          title: 'Progress',
          ...backToHomeHeaderOptions(colors, navigation),
          tabBarIcon: ({ color, size }) => (
            <Octicons name="graph" size={size ?? TAB_ICON_SIZE} color={color} />
          ),
        })}
      />
      <Tab.Screen
        name="Post"
        component={ComposePostScreen}
        options={{
          title: 'Post',
          headerShown: false,
          tabBarIcon: () => (
            <View style={postFabStyle}>
              <MaterialIcons name="add" size={26} color={colors.onBrand} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Inbox"
        component={InboxScreen}
        options={({ navigation }) => ({
          title: 'Inbox',
          ...backToHomeHeaderOptions(colors, navigation),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size ?? TAB_ICON_SIZE} color={color} />
          ),
        })}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={{
                width: (size ?? TAB_ICON_SIZE) + 8,
                height: (size ?? TAB_ICON_SIZE) + 8,
                borderRadius: ((size ?? TAB_ICON_SIZE) + 8) / 2,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 2,
                borderWidth: 2,
                borderColor: focused ? colors.brand : colors.textPrimary,
                backgroundColor: colors.surface,
              }}
            >
              <UserAvatar
                seed={profileSeed}
                avatarUrl={profile?.avatar_url}
                avatarUrls={profile?.avatar_urls}
                size={(size ?? TAB_ICON_SIZE) - 2}
              />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
