/**
 * Configuração de deep linking
 */

export const linking = {
  prefixes: ['loadout://'],
  config: {
    screens: {
      Login: 'auth-callback',
      Main: {
        screens: {
          Dashboard: 'dashboard',
          Inventory: 'inventory',
          Simulator: 'simulator',
          Profile: 'profile',
        },
      },
    },
  },
};

