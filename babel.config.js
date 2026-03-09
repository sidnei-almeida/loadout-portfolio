module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@services': './src/services',
          '@hooks': './src/hooks',
          '@navigation': './src/navigation',
          '@theme': './src/theme',
          '@types': './src/types',
          '@utils': './src/utils',
          '@contexts': './src/contexts',
          '@i18n': './src/i18n',
          '@i18n/*': './src/i18n/*',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
