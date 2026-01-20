const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    extraNodeModules: {
      // Polyfills for Node.js built-in modules
      crypto: require.resolve('react-native-quick-crypto'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer'),
      // Text encoding polyfills
      'text-encoding': require.resolve('text-encoding-polyfill'),
      // Mock WASM module to prevent import.meta errors
      '@matrix-org/matrix-sdk-crypto-wasm': require.resolve('./mocks/matrix-sdk-crypto-wasm.js'),
    },
    // Exclude WASM files from source extensions - treat them as assets or ignore
    sourceExts: defaultConfig.resolver.sourceExts.filter(ext => ext !== 'wasm'),
    assetExts: [...defaultConfig.resolver.assetExts, 'wasm'],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
    // Transform import.meta to work in React Native
    babelTransformerPath: require.resolve('./metro-transformer.js'),
  },
};

module.exports = mergeConfig(defaultConfig, config);
