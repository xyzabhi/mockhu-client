import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../presentation/theme/theme';
import type { MainTabParamList } from './types';
import { HomeFeedScreen } from './screens/HomeFeedScreen';
import { InboxScreen } from './screens/InboxScreen';
import { ComposePostScreen } from '../features/posts/ComposePostScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ProgressScreen } from './screens/ProgressScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  const tabBarBottomPad = Math.max(insets.bottom, 6);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleStyle: {
          fontFamily: theme.typography.semiBold,
          fontSize: theme.fontSizes.screenTitle,
          color: theme.colors.textPrimary,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerShadowVisible: false,
        tabBarActiveTintColor: theme.colors.brand,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: theme.typography.medium,
          fontSize: theme.fontSizes.navLabel,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.borderSubtle,
          paddingTop: 4,
          paddingBottom: tabBarBottomPad,
          height: 52 + tabBarBottomPad,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeFeedScreen}
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-variant-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-timeline-variant" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Post"
        component={ComposePostScreen}
        options={{
          title: 'Post',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="square-edit-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Inbox"
        component={InboxScreen}
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="inbox-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
