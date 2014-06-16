// Karma configuration
// Generated on Fri Mar 21 2014 17:52:41 GMT-0300 (ART)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha'],


    // list of files / patterns to load in the browser
    files: [
      //Configs
      'config.js',

      'lib/angular/angular.min.js',
      'lib/angular-mocks/angular-mocks.js',
      'lib/moment/moment.js',
      'lib/angular-moment/angular-moment.js',
      'lib/qrcode-generator/js/qrcode.js',
      'lib/angular-qrcode/qrcode.js',
      'lib/angular-route/angular-route.min.js',
      'lib/angular-foundation/mm-foundation.min.js',
      'lib/angular-foundation/mm-foundation-tpls.min.js',
      'lib/peerjs/peer.js',
      'lib/bitcore/browser/bundle.js',
      'lib/crypto-js/rollups/sha256.js',
      'lib/crypto-js/rollups/pbkdf2.js',
      'lib/crypto-js/rollups/aes.js',
      'lib/file-saver/FileSaver.js',
      'lib/socket.io-client/socket.io.js',
      'lib/sjcl.js',
      'lib/ios-imagefile-megapixel/megapix-image.js',
      'lib/qrcode-decoder-js/lib/qrcode-decoder.min.js',
      'js/copayBundle.js',

      //Test-Specific Code
      'lib/chai/chai.js',
      'test/lib/chai-should.js',
      'test/lib/chai-expect.js',
      'test/mocks/FakeWallet.js',
      
      //Mocha stuff
      'test/mocha.conf.js',

      //App-specific Code
      'js/app.js',
      'js/routes.js',
      'js/directives.js',
      'js/filters.js',
      'js/services/*.js',
      'js/controllers/*.js',
      'js/init.js',


      //test files
      'test/unit/**/*.js'
    ],


    // list of files to exclude
    exclude: [],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {

    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // if browser doesn't capture output in given timeout (ms), kill it
    captureTimeout: 60000
  });
};
