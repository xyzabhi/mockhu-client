import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
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
  const tabBarVisibleStyle = {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.borderSubtle,
    paddingTop: 4,
    paddingBottom: tabBarBottomPad,
    height: 52 + tabBarBottomPad,
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
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
          /** Center create: circular hit target (50% → full circle) */
          tabBarIcon: ({ focused }) => {
            const size = 40;
            return (
              <View
                style={{
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  backgroundColor: focused ? theme.colors.brand : 'transparent',
                  borderWidth: focused ? 0 : 1.5,
                  borderColor: theme.colors.borderSubtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={22}
                  color={focused ? theme.colors.onBrand : theme.colors.textMuted}
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
