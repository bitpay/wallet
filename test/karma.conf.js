// Karma configuration
// Generated on Thu Mar 12 2015 18:13:33 GMT-0300 (ART)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '..',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      'bower_components/qrcode-generator/js/qrcode.js',
      'bower_components/qrcode-decoder-js/lib/qrcode-decoder.js',
      'bower_components/moment/min/moment-with-locales.js',
      'bower_components/angular/angular.js',
      'bower_components/angular-ui-router/release/angular-ui-router.js',
      'bower_components/angular-foundation/mm-foundation.js',
      'bower_components/angular-foundation/mm-foundation-tpls.js',
      'bower_components/angular-animate/angular-animate.js',
      'bower_components/angular-moment/angular-moment.js',
      'bower_components/ng-lodash/build/ng-lodash.js',
      'bower_components/angular-qrcode/qrcode.js',
      'bower_components/angular-gettext/dist/angular-gettext.js',
      'bower_components/angular-touch/angular-touch.js',
      'bower_components/angular-ui-switch/angular-ui-switch.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'src/js/**/*.js',
      'test/**/*.js'
    ],


    // list of files to exclude
    exclude: [
      'src/js/translations.js',
      'src/js/version.js',
      'test/karma.conf.js',
      'test/old/*'
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'src/js/**/*.js': ['coverage']
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', , 'coverage'],

    // optionally, configure the reporter
    coverageReporter: {
      dir: 'coverage/',
      reporters: [{
        type: 'html',
        subdir: 'report-html'
      }, {
        type: 'lcov',
        subdir: 'report-lcov'
      }, {
        type: 'text-summary'
      }]
    },

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
    browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
