module.exports = {
  resolve: {
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      os: require.resolve("os-browserify/browser"),
      path :require.resolve("path-browserify"),
      assert: require.resolve("assert/"),
      "fs": false
    },
  }
};