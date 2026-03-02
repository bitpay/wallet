// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
  config.set({
    webpack: {
      node: { fs: 'empty', net: 'empty', tls: 'empty', dns: 'empty' }
    },
    basePath: '..',
    browserDisconnectTolerance: 2,
    browserNoActivityTimeout: 60 * 1000,
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-spec-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    files: [],
    preprocessors: {},
    mime: {
      'text/x-typescript': ['ts', 'tsx']
    },
    coverageIstanbulReporter: {
      dir: require('path').join(__dirname, 'coverage'),
      reports: ['html', 'lcovonly'],
      fixWebpackSourcePaths: true
    },

    reporters:
      config.angularCli && config.angularCli.codeCoverage
        ? ['spec', 'coverage-istanbul']
        : ['spec', 'kjhtml'],
    specReporter: {
      suppressSkipped: true // do not print information about skipped tests
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['ChromeHeadlessCI'],
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        // Sandbox causes Chrome to crash on Travis
        // https://github.com/travis-ci/travis-ci/issues/8836#issuecomment-359018652
        flags: ['--no-sandbox']
      }
    },
    singleRun: false
  });
};
