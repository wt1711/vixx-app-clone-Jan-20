/**
 * Mock for @matrix-org/matrix-sdk-crypto-wasm
 * React Native doesn't support WASM, so we provide a mock that throws
 * when initialized, forcing matrix-js-sdk to use JavaScript crypto instead
 */

// Export a mock that will fail gracefully
module.exports = {
  init: async () => {
    throw new Error('WASM crypto not supported in React Native. Use JavaScript crypto instead.');
  },
  default: {
    init: async () => {
      throw new Error('WASM crypto not supported in React Native. Use JavaScript crypto instead.');
    },
  },
};

