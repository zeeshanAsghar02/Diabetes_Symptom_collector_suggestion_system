module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@features': './src/features',
            '@hooks': './src/hooks',
            '@store': './src/store',
            '@services': './src/services',
            '@theme': './src/theme',
            '@utils': './src/utils',
            '@app-types': './src/types',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
