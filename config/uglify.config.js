// https://www.npmjs.com/package/uglify-es
module.exports = {
  parse: {
    html5_comments: false
  },
  /**
   * mangle: uglify 2's mangle option
   */
  mangle: true,
  /**
   * compress: uglify 2's compress option
   */
  compress: {
    toplevel: true,
    pure_getters: true,
    drop_console: true,
    drop_debugger: true,
    evaluate: true
  },
  output: {
    beautify: false
  }
};
