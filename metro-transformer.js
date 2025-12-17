const upstreamTransformer = require('@react-native/metro-babel-transformer');

module.exports.transform = function ({ src, filename, options }) {
  // Replace import.meta.url with a polyfill for React Native
  // This is needed because matrix-js-sdk uses import.meta for WASM modules
  // React Native doesn't support import.meta, so we replace it with a dummy value
  if (src.includes('import.meta')) {
    // Handle: new URL("./pkg/matrix_sdk_crypto_wasm_bg.wasm", import.meta.url)
    // This is the exact pattern from the error message
    // Match: new URL(any string, import.meta.url)
    src = src.replace(
      /new\s+URL\s*\(\s*(["'`])([^"'`]+)\1\s*,\s*import\.meta\.url\s*\)/g,
      "new URL('https://react-native/dummy.wasm', 'https://react-native')"
    );
    
    // Also handle without quotes (less common but possible)
    src = src.replace(
      /new\s+URL\s*\([^,)]+,\s*import\.meta\.url\s*\)/g,
      "new URL('https://react-native/dummy.wasm', 'https://react-native')"
    );
    
    // Replace import.meta.url with a dummy URL string (handle all other cases)
    src = src.replace(
      /import\.meta\.url/g,
      "'https://react-native'"
    );
    
    // Replace any other import.meta usage (fallback)
    src = src.replace(
      /import\.meta/g,
      "({ url: 'https://react-native' })"
    );
  }

  // Call the upstream transformer
  return upstreamTransformer.transform({ src, filename, options });
};

