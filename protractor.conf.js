const flags = [
  '--headless',
  // Sandbox causes Chrome to crash on Travis
  // https://github.com/travis-ci/travis-ci/issues/8836#issuecomment-359018652
  '--no-sandbox',
  '--disable-gpu'
];

exports.config = {
  allScriptsTimeout: 1000 * 60 * 5,
  jasmineNodeOpts: { defaultTimeoutInterval: 1000 * 60 * 5 },
  maxSessions: 4,
  specs: ['test/e2e/**/*.e2e-spec.ts'],
  // Available deviceNames for mobileEmulation: https://chromium.googlesource.com/chromium/src/+/master/third_party/WebKit/Source/devtools/front_end/emulated_devices/module.json
  multiCapabilities: [
    {
      name: '1280x800',
      browserName: 'chrome',
      chromeOptions: {
        mobileEmulation: {
          width: 1280,
          height: 800,
          pixelRatio: 2
        },
        args: flags
      }
    },
    {
      name: 'iPhoneX',
      browserName: 'chrome',
      chromeOptions: {
        mobileEmulation: {
          deviceName: 'iPhone X'
        },
        args: flags
      }
    },
    {
      name: 'Pixel2',
      browserName: 'chrome',
      chromeOptions: {
        mobileEmulation: {
          deviceName: 'Pixel 2'
        },
        args: flags
      }
    },
    {
      name: 'iPad',
      browserName: 'chrome',
      chromeOptions: {
        mobileEmulation: {
          deviceName: 'iPad'
        },
        args: flags
      }
    }
  ],
  directConnect: true,
  baseUrl: 'http://localhost:4200/',
  framework: 'jasmine',
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000,
    print: function() {}
  },
  useAllAngular2AppRoots: true,
  beforeLaunch: function() {
    require('connect')()
      .use(require('serve-static')('www'))
      .listen(4200);
  },
  onPrepare() {
    require('ts-node').register({
      project: 'test/e2e/tsconfig.e2e.json'
    });
    var jasmineReporters = require('jasmine-reporters');
    jasmine.getEnv().addReporter(
      new jasmineReporters.TerminalReporter({
        verbosity: 3,
        color: true,
        showStack: true
      })
    );
    jasmine.getEnv().addReporter(
      new jasmineReporters.JUnitXmlReporter({
        savePath: process.env.JUNIT_REPORT_PATH || './test/',
        outputFile: process.env.JUNIT_REPORT_NAME || 'junitresults.xml',
        consolidateAll: true
      })
    );
  },
  SELENIUM_PROMISE_MANAGER: false
};
