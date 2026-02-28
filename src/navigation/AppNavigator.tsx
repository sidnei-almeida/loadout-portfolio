import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '@contexts/AuthContext';
import { Loading } from '@components/common/Loading';
import { VideoBackground } from '@components/common/VideoBackground';
import { RefreshProgressModal } from '@components/common/RefreshProgressModal';
import { linking } from '@utils/linking';
import { HomeIcon, InventoryIcon, SimulatorIcon, ProfileIcon } from '@components/common/Icons';

import { LoginScreen } from '@screens/LoginScreen';
import { DashboardScreen } from '@screens/DashboardScreen';
import { InventoryScreen } from '@screens/InventoryScreen';
import { SimulatorScreen } from '@screens/SimulatorScreen';
import { ProfileScreen } from '@screens/ProfileScreen';

import type { RootStackParamList, MainTabParamList } from '@types/navigation';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const customTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: '#d4c291',
    background: 'transparent',
    card: 'transparent',
    text: '#FFFFFF',
    border: 'rgba(212, 194, 145, 0.3)',
    notification: '#d4c291',
  },
  typography: {
    weights: {
      light: '300',
      regular: '400',
      medium: '500',
      semiBold: '600',
      bold: '700',
      extraBold: '800',
    },
  },
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
  },
};

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  navigationWrapper: {
    flex: 1,
    zIndex: 1,
    backgroundColor: 'transparent',
  },
});

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#d4c291',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Rajdhani-Medium',
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarIcon: ({ focused }) => {
          const iconSize = 22;
          const iconColor = focused ? '#d4c291' : '#6B7280';

          switch (route.name) {
            case 'Dashboard':
              return <HomeIcon size={iconSize} color={iconColor} strokeWidth={focused ? 2.5 : 2} />;
            case 'Inventory':
              return <InventoryIcon size={iconSize} color={iconColor} strokeWidth={focused ? 2.5 : 2} />;
            case 'Simulator':
              return <SimulatorIcon size={iconSize} color={iconColor} strokeWidth={focused ? 2.5 : 2} />;
            case 'Profile':
              return <ProfileIcon size={iconSize} color={iconColor} strokeWidth={focused ? 2.5 : 2} />;
            default:
              return null;
          }
        },
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        },
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Inventory" component={InventoryScreen} options={{ tabBarLabel: 'Inventory' }} />
      <Tab.Screen name="Simulator" component={SimulatorScreen} options={{ tabBarLabel: 'Simulate' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const {
    isAuthenticated,
    isLoading,
    isPostLoginSyncing,
    postLoginSyncSteps,
    resetPostLoginSyncSteps,
    setPostLoginSyncing,
  } = useAuth();

  const currentStepIndex = postLoginSyncSteps.findIndex(step => step.status === 'processing');
  const currentStep = currentStepIndex >= 0 ? currentStepIndex : postLoginSyncSteps.length - 1;

  const handlePostLoginSyncComplete = () => {
    setPostLoginSyncing(false);
    resetPostLoginSyncSteps();
  };

  if (isLoading) {
    return <Loading fullScreen message="Loading..." />;
  }

  return (
    <View style={styles.appContainer}>
      <VideoBackground overlayOpacity={0.75} />

      {isPostLoginSyncing && (
        <RefreshProgressModal
          visible={isPostLoginSyncing}
          currentStep={currentStep}
          steps={postLoginSyncSteps}
          onComplete={handlePostLoginSyncComplete}
        />
      )}

      {!isPostLoginSyncing && (
        <View style={styles.navigationWrapper}>
          <NavigationContainer linking={linking} theme={customTheme}>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: 'transparent' },
                contentStyle: { backgroundColor: 'transparent' },
              }}
            >
              {isAuthenticated ? (
                <Stack.Screen name="Main" component={MainTabs} />
              ) : (
                <Stack.Screen name="Login" component={LoginScreen} />
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </View>
      )}
    </View>
  );
};
