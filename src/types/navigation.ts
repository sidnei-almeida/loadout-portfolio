import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Inventory: undefined;
  Simulator: undefined;
  Profile: undefined;
};

export type StackParamList = RootStackParamList & MainTabParamList;

