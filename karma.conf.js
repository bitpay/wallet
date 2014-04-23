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
      //3rd Party Code
      'lib/angular/angular.min.js',
      'lib/angular-route/angular-route.js',
      'lib/angular-mocks/angular-mocks.js',
      'lib/bitcore.js',
      'lib/socket.io.js',

      //App-specific Code
      'js/*.js',
      'js/**/*.js',

      //Test-Specific Code
      'lib/chai/chai.js',
      'test/lib/chai-should.js',
      'test/lib/chai-expect.js',

      //Mocha stuff
      'test/mocha.conf.js',

      //Configs
      'config.js',

      //test files
      'test/unit/**/*.js'
    ],


    // list of files to exclude
    exclude: [
      'js/models/**/*.js',
      ],


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
