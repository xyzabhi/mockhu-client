import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import Octicons from '@expo/vector-icons/Octicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';
import { Platform, View } from 'react-native';
import { theme } from '../presentation/theme/theme';
import { useThemeColors } from '../presentation/theme/ThemeContext';
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

export function MainTabNavigator() {
  const colors = useThemeColors();

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
        tabBarInactiveTintColor: colors.textMuted,
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
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.textPrimary,
          tabBarIcon: ({ color, size }) => (
            <Octicons name="home-fill" size={size ?? TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          title: 'Progress',
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.textPrimary,
          tabBarIcon: ({ color, size }) => (
            <Octicons name="graph" size={size ?? TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Post"
        component={ComposePostScreen}
        options={{
          title: 'Post',
          headerShown: false,
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.textPrimary,
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
        options={{
          title: 'Inbox',
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.textPrimary,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size ?? TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'You',
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.textPrimary,
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="user-circle-o" size={size ?? TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
