// Karma configuration
// Generated on Fri Mar 21 2014 17:52:41 GMT-0300 (ART)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai'],


    // list of files / patterns to load in the browser
    files: [
      //Configs
      'config.js',

      'lib/angular/angular.min.js',
      'lib/angular-mocks/angular-mocks.js',
      'lib/moment/moment.js',
      'lib/ng-idle/angular-idle.min.js',
      'lib/angular-moment/angular-moment.js',
      'lib/qrcode-generator/js/qrcode.js',
      'lib/angular-qrcode/qrcode.js',
      'lib/angular-route/angular-route.min.js',
      'lib/angular-foundation/mm-foundation.min.js',
      'lib/angular-foundation/mm-foundation-tpls.min.js',
      'lib/angular-load/angular-load.min.js',
      'lib/angular-gravatar/build/md5.min.js',
      'lib/angular-gravatar/build/angular-gravatar.min.js',
      'lib/angular-gettext/dist/angular-gettext.min.js',
      'lib/inherits/inherits.js',
      'lib/lodash/dist/lodash.js',
      'lib/file-saver/FileSaver.js',
      'lib/socket.io-client/socket.io.js',
      'lib/sjcl.js',
      'lib/ios-imagefile-megapixel/megapix-image.js',
      'lib/qrcode-decoder-js/lib/qrcode-decoder.min.js',

      'lib/bitcore.js',
      'js/copayBundle.js',

      //App-specific Code
      'js/app.js',
      'js/log.js',
      'js/routes.js',
      'js/services/*.js',
      'js/directives.js',
      'js/filters.js',
      'js/controllers/*.js',
      'js/translations.js',
      'js/init.js',

      'test/mocks/FakeBlockchainSocket.js',
      'test/mocks/FakePayProServer.js',

      'test/mocha.conf.js',

      //test files
      'setup/karma.js',
      'test/unit/**/*.js',
      'test/*.js',
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
    browsers: ['Chrome', 'Firefox'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // if browser doesn't capture output in given timeout (ms), kill it
    captureTimeout: 60000
  });
};
