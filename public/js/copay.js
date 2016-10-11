'use strict';

var modules = [
  'angularMoment',
  'monospaced.qrcode',
  'gettext',
  'ionic',
  'ionic-toast',
  'angular-clipboard',
  'ngLodash',
  'ngCsv',
  'angular-md5',
  'bwcModule',
  'pbkdf2Module',
  'copayApp.filters',
  'copayApp.services',
  'copayApp.controllers',
  'copayApp.directives',
  'copayApp.addons'
];

var copayApp = window.copayApp = angular.module('copayApp', modules);

angular.module('copayApp.filters', []);
angular.module('copayApp.services', []);
angular.module('copayApp.controllers', []);
angular.module('copayApp.directives', []);
angular.module('copayApp.addons', []);

'use strict';

var unsupported, isaosp;

if (window && window.navigator) {
  var rxaosp = window.navigator.userAgent.match(/Android.*AppleWebKit\/([\d.]+)/);
  isaosp = (rxaosp && rxaosp[1] < 537);
  if (!window.cordova && isaosp)
    unsupported = true;
  if (unsupported) {
    window.location = '#/unsupported';
  }
}

//Setting up route
angular.module('copayApp').config(function(historicLogProvider, $provide, $logProvider, $stateProvider, $urlRouterProvider, $compileProvider, $ionicConfigProvider) {
    $urlRouterProvider.otherwise('/starting');

    // NO CACHE
    //$ionicConfigProvider.views.maxCache(0);

    // TABS BOTTOM
    $ionicConfigProvider.tabs.position('bottom');

    // NAV TITTLE CENTERED
    $ionicConfigProvider.navBar.alignTitle('center');

    // NAV BUTTONS ALIGMENT
    $ionicConfigProvider.navBar.positionPrimaryButtons('left');
    $ionicConfigProvider.navBar.positionSecondaryButtons('right');

    // NAV BACK-BUTTON TEXT/ICON
    $ionicConfigProvider.backButton.icon('icon ion-ios-arrow-thin-left').text('');
    $ionicConfigProvider.backButton.previousTitleText(false);

    $logProvider.debugEnabled(true);
    $provide.decorator('$log', ['$delegate', 'platformInfo',
      function($delegate, platformInfo) {
        var historicLog = historicLogProvider.$get();

        ['debug', 'info', 'warn', 'error', 'log'].forEach(function(level) {
          if (platformInfo.isDevel && level == 'error') return;

          var orig = $delegate[level];
          $delegate[level] = function() {
            if (level == 'error')
              console.log(arguments);

            var args = Array.prototype.slice.call(arguments);

            args = args.map(function(v) {
              try {
                if (typeof v == 'undefined') v = 'undefined';
                if (!v) v = 'null';
                if (typeof v == 'object') {
                  if (v.message)
                    v = v.message;
                  else
                    v = JSON.stringify(v);
                }
                // Trim output in mobile
                if (platformInfo.isCordova) {
                  v = v.toString();
                  if (v.length > 3000) {
                    v = v.substr(0, 2997) + '...';
                  }
                }
              } catch (e) {
                console.log('Error at log decorator:', e);
                v = 'undefined';
              }
              return v;
            });

            try {
              if (platformInfo.isCordova)
                console.log(args.join(' '));

              historicLog.add(level, args.join(' '));
              orig.apply(null, args);
            } catch (e) {
              console.log('ERROR (at log decorator):', e, args[0]);
            }
          };
        });
        return $delegate;
      }
    ]);

    // whitelist 'chrome-extension:' for chromeApp to work with image URLs processed by Angular
    // link: http://stackoverflow.com/questions/15606751/angular-changes-urls-to-unsafe-in-extension-page?lq=1
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|ftp|file|blob|chrome-extension):|data:image\/)/);

    $stateProvider

    /*
     *
     * Other pages
     *
     */

      .state('unsupported', {
      url: '/unsupported',
      templateUrl: 'views/unsupported.html'
    })

    .state('starting', {
      url: '/starting',
      template: '<ion-view id="starting"><ion-content>{{starting}}</ion-content></ion-view>',
      controller: function($scope, $log, gettextCatalog) {
        $log.info('Starting...');
        $scope.starting = gettextCatalog.getString('Starting...');
      }
    })

    /*
     *
     * URI
     *
     */

    .state('uri', {
        url: '/uri/:url',
        controller: function($stateParams, $log, openURLService, profileService) {
          profileService.whenAvailable(function() {
            $log.info('DEEP LINK from Browser:' + $stateParams.url);
            openURLService.handleURL({
              url: $stateParams.url
            });
          })
        }
      })
      .state('uripayment', {
        url: '/uri-payment/:url',
        templateUrl: 'views/paymentUri.html'
      })
      .state('uriglidera', {
        url: '/uri-glidera/:url',
        controller: 'glideraUriController',
        templateUrl: 'views/glideraUri.html'
      })
      .state('uricoinbase', {
        url: '/uri-coinbase/:url',
        templateUrl: 'views/coinbaseUri.html'
      })

    /*
     *
     * Wallet
     *
     */

    .state('tabs.details', {
        url: '/details/{walletId}/{fromOnboarding}',
        views: {
          'tab-home': {
            controller: 'walletDetailsController',
            templateUrl: 'views/walletDetails.html'
          }
        },
        params: {
          txid: null,
          txpId: null,
        },
      })
      .state('tabs.activity', {
        url: '/activity',
        views: {
          'tab-home': {
            controller: 'activityController',
            templateUrl: 'views/activity.html',
          }
        }
      })
      .state('tabs.proposals', {
        url: '/proposals',
        views: {
          'tab-home': {
            controller: 'proposalsController',
            templateUrl: 'views/proposals.html',
          }
        }
      })

    /*
     *
     * Tabs
     *
     */

    .state('tabs', {
        url: '/tabs',
        abstract: true,
        controller: 'tabsController',
        templateUrl: 'views/tabs.html'
      })
      .state('tabs.home', {
        url: '/home/:fromOnboarding',
        views: {
          'tab-home': {
            controller: 'tabHomeController',
            templateUrl: 'views/tab-home.html',
          }
        }
      })
      .state('tabs.receive', {
        url: '/receive',
        views: {
          'tab-receive': {
            controller: 'tabReceiveController',
            templateUrl: 'views/tab-receive.html',
          }
        }
      })
      .state('tabs.send', {
        url: '/send',
        views: {
          'tab-send': {
            controller: 'tabSendController',
            templateUrl: 'views/tab-send.html',
          }
        }
      })
      .state('tabs.settings', {
        url: '/settings',
        views: {
          'tab-settings': {
            controller: 'tabSettingsController',
            templateUrl: 'views/tab-settings.html',
          }
        }
      })

    /*
     *
     * Send
     *
     */

    .state('tabs.send.amount', {
        url: '/amount/:isWallet/:toAddress/:toName/:toEmail',
        views: {
          'tab-send@tabs': {
            controller: 'amountController',
            templateUrl: 'views/amount.html'
          }
        }
      })
      .state('tabs.send.confirm', {
        url: '/confirm/:isWallet/:toAddress/:toName/:toAmount/:toEmail/:description/:paypro',
        views: {
          'tab-send@tabs': {
            controller: 'confirmController',
            templateUrl: 'views/confirm.html'
          }
        }
      })
      .state('tabs.send.addressbook', {
        url: '/addressbook/add/:fromSendTab/:addressbookEntry',
        views: {
          'tab-send@tabs': {
            templateUrl: 'views/addressbook.add.html',
            controller: 'addressbookAddController'
          }
        }
      })

    /*
     *
     * Add
     *
     */

    .state('tabs.add', {
        url: '/add',
        views: {
          'tab-home@tabs': {
            templateUrl: 'views/add.html'
          }
        }
      })
      .state('tabs.add.join', {
        url: '/join/:url',
        views: {
          'tab-home@tabs': {
            templateUrl: 'views/join.html'
          },
        }
      })
      .state('tabs.add.import', {
        url: '/import',
        views: {
          'tab-home@tabs': {
            templateUrl: 'views/import.html'
          },
        },
      })
      .state('tabs.add.create-personal', {
        url: '/create-personal',
        views: {
          'tab-home@tabs': {
            templateUrl: 'views/tab-create-personal.html'
          },
        }
      })
      .state('tabs.add.create-shared', {
        url: '/create-shared',
        views: {
          'tab-home@tabs': {
            templateUrl: 'views/tab-create-shared.html'
          },
        }
      })

    /*
     *
     * Global Settings
     *
     */

    .state('tabs.language', {
        url: '/language',
        views: {
          'tab-settings@tabs': {
            controller: 'preferencesLanguageController',
            templateUrl: 'views/preferencesLanguage.html'
          }
        }
      })
      .state('tabs.unit', {
        url: '/unit',
        views: {
          'tab-settings@tabs': {
            controller: 'preferencesUnitController',
            templateUrl: 'views/preferencesUnit.html'
          }
        }
      })
      .state('tabs.fee', {
        url: '/fee',
        views: {
          'tab-settings@tabs': {
            controller: 'preferencesFeeController',
            templateUrl: 'views/preferencesFee.html'
          }
        }
      })
      .state('tabs.altCurrency', {
        url: '/altCurrency',
        views: {
          'tab-settings@tabs': {
            controller: 'preferencesAltCurrencyController',
            templateUrl: 'views/preferencesAltCurrency.html'
          }
        }
      })
      .state('tabs.about', {
        url: '/about',
        views: {
          'tab-settings@tabs': {
            controller: 'preferencesAbout',
            templateUrl: 'views/preferencesAbout.html'
          }
        }
      })
      .state('tabs.about.logs', {
        url: '/logs',
        views: {
          'tab-settings@tabs': {
            controller: 'preferencesLogs',
            templateUrl: 'views/preferencesLogs.html'
          }
        }
      })
      .state('tabs.about.termsOfUse', {
        url: '/termsOfUse',
        views: {
          'tab-settings@tabs': {
            controller: 'termOfUseController',
            templateUrl: 'views/termsOfUse.html',
          }
        }
      })
      .state('tabs.about.translators', {
        url: '/translators',
        views: {
          'tab-settings@tabs': {
            controller: 'translatorsController',
            templateUrl: 'views/translators.html'
          }
        }
      })

    /*
     *
     * Wallet preferences
     *
     */

    .state('tabs.preferences', {
        url: '/preferences/:walletId',
        views: {
          'tab-settings@tabs': {
            controller: 'preferencesController',
            templateUrl: 'views/preferences.html'
          }
        }
      })
      .state('tabs.preferences.preferencesAlias', {
        url: '/preferencesAlias',
        views: {
          'tab-settings@tabs': {
            controller: 'preferencesAliasController',
            templateUrl: 'views/preferencesAlias.html'
          }
        }
      })
      .state('tabs.preferences.preferencesColor', {
        url: '/preferencesColor',
        views: {
          'tab-settings@tabs': {
            controller: 'preferencesColorController',
            templateUrl: 'views/preferencesColor.html'
          }
        }
      })
      .state('tabs.preferences.preferencesEmail', {
        url: '/preferencesEmail',
        views: {
          'tab-settings@tabs': {
            controller: 'preferencesEmailController',
            templateUrl: 'views/preferencesEmail.html'
          }
        }
      })
      .state('tabs.preferences.backupWarning', {
        url: '/backupWarning/:from',
        views: {
          'tab-settings@tabs': {
            templateUrl: 'views/backupWarning.html'
          }
        }
      })
      .state('tabs.preferences.backup', {
        url: '/backup',
        views: {
          'tab-settings@tabs': {
            controller: 'backupController',
            templateUrl: 'views/backup.html'
          }
        }
      })
      .state('tabs.preferences.preferencesAdvanced', {
        url: '/preferencesAdvanced',
        views: {
          'tab-settings@tabs': {
            controller: 'preferencesAdvancedController',
            templateUrl: 'views/preferencesAdvanced.html'
          }
        }
      })
      .state('tabs.preferences.information', {
        url: '/information',
        views: {
          'tab-settings@tabs': {
            controller: 'preferencesInformation',
            templateUrl: 'views/preferencesInformation.html'
          }
        }
      })
      .state('tabs.preferences.export', {
        url: '/export',
        views: {
          'tab-settings@tabs': {
            controller: 'exportController',
            templateUrl: 'views/export.html'
          }
        }
      })
      .state('tabs.preferences.preferencesBwsUrl', {
        url: '/preferencesBwsUrl',
        views: {
          'tab-settings@tabs': {
            controller: 'preferencesBwsUrlController',
            templateUrl: 'views/preferencesBwsUrl.html'
          }
        }
      })
      .state('tabs.preferences.preferencesHistory', {
        url: '/preferencesHistory',
        views: {
          'tab-settings@tabs': {
            controller: 'preferencesHistory',
            templateUrl: 'views/preferencesHistory.html'
          }
        }
      })
      .state('tabs.preferences.deleteWords', {
        url: '/deleteWords',
        views: {
          'tab-settings@tabs': {
            controller: 'preferencesDeleteWordsController',
            templateUrl: 'views/preferencesDeleteWords.html'
          }
        }
      })
      .state('tabs.preferences.delete', {
        url: '/delete',
        views: {
          'tab-settings@tabs': {
            controller: 'preferencesDeleteWalletController',
            templateUrl: 'views/preferencesDeleteWallet.html'
          }
        }
      })
      .state('tabs.preferences.paperWallet', {
        url: '/paperWallet',
        views: {
          'tab-settings@tabs': {
            controller: 'paperWalletController',
            templateUrl: 'views/paperWallet.html'
          }
        }
      })

    /*
     *
     * Addressbook
     *
     */


    .state('tabs.addressbook', {
        url: '/addressbook',
        views: {
          'tab-settings@tabs': {
            templateUrl: 'views/addressbook.html',
            controller: 'addressbookListController'
          }
        }
      })
      .state('tabs.addressbook.add', {
        url: '/add',
        views: {
          'tab-settings@tabs': {
            templateUrl: 'views/addressbook.add.html',
            controller: 'addressbookAddController'
          }
        }
      })
      .state('tabs.addressbook.view', {
        url: '/view/:address',
        views: {
          'tab-settings@tabs': {
            templateUrl: 'views/addressbook.view.html',
            controller: 'addressbookViewController'
          }
        }
      })

    /*
     *
     * Copayers
     *
     */

    .state('tabs.copayers', {
      url: '/copayers/:walletId',
      views: {
        'tab-home': {
          templateUrl: 'views/copayers.html',
          controller: 'copayersController'
        }
      }
    })

    /*
     *
     * Back flow from receive
     *
     */

    .state('tabs.receive.backupWarning', {
        url: '/backupWarning/:from/:walletId',
        views: {
          'tab-receive@tabs': {
            templateUrl: 'views/backupWarning.html'
          }
        }
      })
      .state('tabs.receive.backup', {
        url: '/backup/:walletId',
        views: {
          'tab-receive@tabs': {
            controller: 'backupController',
            templateUrl: 'views/backup.html'
          }
        }
      })

    /*
     *
     * Onboarding
     *
     */

    .state('onboarding', {
        url: '/onboarding',
        abstract: true,
        template: '<ion-nav-view name="onboarding"></ion-nav-view>'
      })
      .state('onboarding.welcome', {
        url: '/welcome',
        views: {
          'onboarding': {
            templateUrl: 'views/onboarding/welcome.html'
          }
        }
      })
      .state('onboarding.tour', {
        url: '/tour',
        views: {
          'onboarding': {
            templateUrl: 'views/onboarding/tour.html'
          }
        }
      })
      .state('onboarding.collectEmail', {
        url: '/collectEmail/:walletId',
        views: {
          'onboarding': {
            templateUrl: 'views/onboarding/collectEmail.html'
          }
        }
      })
      .state('onboarding.notifications', {
        url: '/notifications/:walletId',
        views: {
          'onboarding': {
            templateUrl: 'views/onboarding/notifications.html'
          }
        }
      })
      .state('onboarding.backupRequest', {
        url: '/backupRequest/:walletId',
        views: {
          'onboarding': {
            templateUrl: 'views/onboarding/backupRequest.html'
          }
        }
      })
      .state('onboarding.backupWarning', {
        url: '/backupWarning/:from/:walletId',
        views: {
          'onboarding': {
            templateUrl: 'views/backupWarning.html'
          }
        }
      })
      .state('onboarding.backup', {
        url: '/backup/:walletId',
        views: {
          'onboarding': {
            templateUrl: 'views/backup.html',
            controller: 'backupController'
          }
        }
      })
      .state('onboarding.disclaimer', {
        url: '/disclaimer',
        views: {
          'onboarding': {
            templateUrl: 'views/onboarding/disclaimer.html'
          }
        }
      })
      .state('onboarding.terms', {
        url: '/terms',
        views: {
          'onboarding': {
            templateUrl: 'views/onboarding/terms.html'
          }
        }
      })
      .state('onboarding.import', {
        url: '/import',
        views: {
          'onboarding': {
            templateUrl: 'views/import.html'
          },
        },
        params: {
          code: null,
          fromOnboarding: null
        },
      })


    /*
     *
     * Buy or Sell Bitcoin
     *
     */

    .state('tabs.buyandsell', {
      url: '/buyandsell',
      views: {
        'tab-home': {
          templateUrl: 'views/buyandsell.html'
        }
      }
    })

    /*
     *
     * Glidera
     *
     *
     */

    .state('tabs.buyandsell.glidera', {
        url: '/glidera',
        views: {
          'tab-home@tabs': {
            controller: 'glideraController',
            controllerAs: 'glidera',
            templateUrl: 'views/glidera.html'
          }
        }
      })
      .state('tabs.buyandsell.glidera.buy', {
        url: '/buy',
        views: {
          'tab-home@tabs': {
            controller: 'buyGlideraController',
            controllerAs: 'buy',
            templateUrl: 'views/buyGlidera.html'
          }
        }
      })
      .state('tabs.buyandsell.glidera.sell', {
        url: '/sell',
        views: {
          'tab-home@tabs': {
            controller: 'sellGlideraController',
            controllerAs: 'sell',
            templateUrl: 'views/sellGlidera.html'
          }
        }
      })
      .state('tabs.buyandsell.glidera.preferences', {
        url: '/preferences',
        views: {
          'tab-home@tabs': {
            controller: 'preferencesGlideraController',
            templateUrl: 'views/preferencesGlidera.html'
          }
        }
      })

    /*
     *
     * Coinbase
     *
     */

    .state('coinbase', {
        url: '/coinbase',
        templateUrl: 'views/coinbase.html'
      })
      .state('preferencesCoinbase', {
        url: '/preferencesCoinbase',
        templateUrl: 'views/preferencesCoinbase.html'
      })
      .state('buyCoinbase', {
        url: '/buycoinbase',
        templateUrl: 'views/buyCoinbase.html'
      })
      .state('sellCoinbase', {
        url: '/sellcoinbase',
        templateUrl: 'views/sellCoinbase.html'
      })

    /*
     *
     * Gift Cards
     *
     */

    .state('tabs.giftcards', {
      url: '/giftcards',
      abstract: true
    })

    /*
     *
     * Amazon.com Gift Card
     *
     */

    .state('tabs.giftcards.amazon', {
        url: '/amazon',
        views: {
          'tab-home@tabs': {
            controller: 'amazonController',
            templateUrl: 'views/amazon.html'
          }
        }
      })
      .state('tabs.giftcards.amazon.buy', {
        url: '/buy',
        views: {
          'tab-home@tabs': {
            controller: 'buyAmazonController',
            controllerAs: 'buy',
            templateUrl: 'views/buyAmazon.html'
          }
        }
      })

    /*
     *
     * BitPay Card
     *
     */

    .state('bitpayCard', {
        url: '/bitpayCard',
        abstract: true,
        template: '<ion-nav-view name="bitpayCard"></ion-nav-view>'
      })
      .state('bitpayCard.main', {
        url: '/main',
        views: {
          'bitpayCard': {
            templateUrl: 'views/bitpayCard.html'
          }
        }
      })
      .state('bitpayCard.preferences', {
        url: '/preferences',
        views: {
          'bitpayCard': {
            templateUrl: 'views/preferencesBitpayCard.html'
          }
        }
      });
  })
  .run(function($rootScope, $state, $location, $log, $timeout, $ionicHistory, $ionicPlatform, lodash, platformInfo, profileService, uxLanguage, gettextCatalog, openURLService, storageService) {

    uxLanguage.init();
    openURLService.init();

    $ionicPlatform.ready(function() {
      if (platformInfo.isCordova) {

        if (screen.width < 768)
          screen.lockOrientation('portrait');

        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
          cordova.plugins.Keyboard.disableScroll(true);
        }

        window.addEventListener('native.keyboardshow', function() {
          document.querySelector('div.tabs').style.display = 'none';
          angular.element(document.querySelector('ion-content.has-tabs')).css('bottom', 0);
        });

        window.addEventListener('native.keyboardhide', function() {
          var tabs = document.querySelectorAll('div.tabs');
          angular.element(tabs[0]).css('display', '');
        });

        $ionicPlatform.registerBackButtonAction(function(e) {

          //from root tabs view
          var fromWelcome = $ionicHistory.currentStateName().match(/welcome/) ? true : false;
          var matchHome = $ionicHistory.currentStateName().match(/home/) ? true : false;
          var matchReceive = $ionicHistory.currentStateName().match(/receive/) ? true : false;
          var matchSend = $ionicHistory.currentStateName().match(/send/) ? true : false;
          var matchSettings = $ionicHistory.currentStateName().match(/settings/) ? true : false;
          var fromTabs = matchHome | matchReceive | matchSend | matchSettings;

          //onboarding with no back views
          var matchCollectEmail = $ionicHistory.currentStateName().match(/collectEmail/) ? true : false;
          var matchBackupRequest = $ionicHistory.currentStateName().match(/backupRequest/) ? true : false;
          var matchDisclaimer = $ionicHistory.currentStateName().match(/disclaimer/) ? true : false;
          var matchNotifications = $ionicHistory.currentStateName().match(/notifications/) ? true : false;

          var fromOnboarding = matchCollectEmail | matchBackupRequest | matchDisclaimer | matchNotifications;

          if (fromOnboarding) {
            e.preventDefault();
            return;
          }

          if ($ionicHistory.backView() && !fromTabs) {
            $ionicHistory.goBack();
          } else
          if ($rootScope.backButtonPressedOnceToExit || fromWelcome) {
            ionic.Platform.exitApp();
          } else {
            $rootScope.backButtonPressedOnceToExit = true;
            window.plugins.toast.showShortBottom(gettextCatalog.getString('Press again to exit'));
            $timeout(function() {
              $rootScope.backButtonPressedOnceToExit = false;
            }, 3000);
          }
          e.preventDefault();
        }, 101);

        $ionicPlatform.on('pause', function() {
          // Nothing to do
        });

        $ionicPlatform.on('resume', function() {
          // Nothing tot do
        });

        $ionicPlatform.on('menubutton', function() {
          window.location = '#/preferences';
        });

        setTimeout(function() {
          navigator.splashscreen.hide();
        }, 500);
      }


      $log.info('Init profile...');
      // Try to open local profile
      profileService.loadAndBindProfile(function(err) {
        if (err) {
          if (err.message && err.message.match('NOPROFILE')) {
            $log.debug('No profile... redirecting');
            $state.go('onboarding.welcome');
          } else if (err.message && err.message.match('NONAGREEDDISCLAIMER')) {
            $log.debug('Display disclaimer... redirecting');
            storageService.getLastState(function(err, state) {
              if (err && !state) {
                $log.error(err);
                $state.go('onboarding.disclaimer');
              }
              else {
                var state = JSON.parse(state);
                $state.go(state.name, state.toParams);
              }
            })
          } else {
            throw new Error(err); // TODO
          }
        } else {
          profileService.storeProfileIfDirty();
          $log.debug('Profile loaded ... Starting UX.');

          $state.go('tabs.home');
        }
      });
    });

    if (platformInfo.isNW) {
      var gui = require('nw.gui');
      var win = gui.Window.get();
      var nativeMenuBar = new gui.Menu({
        type: "menubar"
      });
      try {
        nativeMenuBar.createMacBuiltin("Copay");
      } catch (e) {
        $log.debug('This is not OSX');
      }
      win.menu = nativeMenuBar;
    }

    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
      $log.debug('Route change from:', fromState.name || '-', ' to:', toState.name);
      $log.debug('            toParams:' + JSON.stringify(toParams || {}));
      $log.debug('            fromParams:' + JSON.stringify(fromParams || {}));
      var state = {};
      state.name = toState.name;
      state.toParams = toParams;
      if (state.name != 'starting') storageService.setLastState(JSON.stringify(state), function() {});
    });
  });

'use strict';

angular.module('copayApp.directives')
  .directive('copyToClipboard', function(platformInfo, nodeWebkitService, gettextCatalog, ionicToast, clipboard) {
    return {
      restrict: 'A',
      scope: {
        copyToClipboard: '=copyToClipboard'
      },
      link: function(scope, elem, attrs, ctrl) {
        var isCordova = platformInfo.isCordova;
        var isChromeApp = platformInfo.isChromeApp;
        var isNW = platformInfo.isNW;
        elem.bind('mouseover', function() {
          elem.css('cursor', 'pointer');
        });

        var msg = gettextCatalog.getString('Copied to clipboard');
        elem.bind('click', function() {
          var data = scope.copyToClipboard;
          if (isCordova) {
            window.cordova.plugins.clipboard.copy(data);
            window.plugins.toast.showShortCenter(msg);
          } else if (isNW) {
            nodeWebkitService.writeToClipboard(data);
            scope.$apply(function() {
              ionicToast.show(msg, 'bottom', false, 1000);
            });
          } else if (clipboard.supported) {
            clipboard.copyText(data);
            scope.$apply(function() {
              ionicToast.show(msg, 'bottom', false, 1000);
            });
          }
        });
      }
    }
  });


'use strict';
angular.module('copayApp.directives')
  .directive('validAddress', ['$rootScope', 'bitcore',
    function($rootScope, bitcore) {
      return {
        require: 'ngModel',
        link: function(scope, elem, attrs, ctrl) {
          var URI = bitcore.URI;
          var Address = bitcore.Address
          var validator = function(value) {

            // Regular url
            if (/^https?:\/\//.test(value)) {
              ctrl.$setValidity('validAddress', true);
              return value;
            }

            // Bip21 uri
            if (/^bitcoin:/.test(value)) {
              var uri, isAddressValidLivenet, isAddressValidTestnet;
              var isUriValid = URI.isValid(value);
              if (isUriValid) {
                uri = new URI(value);
                isAddressValidLivenet = Address.isValid(uri.address.toString(), 'livenet')
                isAddressValidTestnet = Address.isValid(uri.address.toString(), 'testnet')
              }
              ctrl.$setValidity('validAddress', isUriValid && (isAddressValidLivenet || isAddressValidTestnet));
              return value;
            }

            if (typeof value == 'undefined') {
              ctrl.$pristine = true;
              return;
            }

            // Regular Address
            var regularAddressLivenet = Address.isValid(value, 'livenet');
            var regularAddressTestnet = Address.isValid(value, 'testnet');
            ctrl.$setValidity('validAddress', (regularAddressLivenet || regularAddressTestnet));
            return value;
          };


          ctrl.$parsers.unshift(validator);
          ctrl.$formatters.unshift(validator);
        }
      };
    }
  ])
  .directive('validAmount', ['configService',
    function(configService) {

      return {
        require: 'ngModel',
        link: function(scope, element, attrs, ctrl) {
          var val = function(value) {
            var settings = configService.getSync().wallet.settings;
            var vNum = Number((value * settings.unitToSatoshi).toFixed(0));
            if (typeof value == 'undefined' || value == 0) {
              ctrl.$pristine = true;
            }



            if (typeof vNum == "number" && vNum > 0) {
              if (vNum > Number.MAX_SAFE_INTEGER) {
                ctrl.$setValidity('validAmount', false);
              } else {
                var decimals = Number(settings.unitDecimals);
                var sep_index = ('' + value).indexOf('.');
                var str_value = ('' + value).substring(sep_index + 1);
                if (sep_index >= 0 && str_value.length > decimals) {
                  ctrl.$setValidity('validAmount', false);
                  return;
                } else {
                  ctrl.$setValidity('validAmount', true);
                }
              }
            } else {
              ctrl.$setValidity('validAmount', false);
            }
            return value;
          }
          ctrl.$parsers.unshift(val);
          ctrl.$formatters.unshift(val);
        }
      };
    }
  ])
  .directive('walletSecret', function(bitcore) {
    return {
      require: 'ngModel',
      link: function(scope, elem, attrs, ctrl) {
        var validator = function(value) {
          if (value.length > 0) {
            var m = value.match(/^[0-9A-HJ-NP-Za-km-z]{70,80}$/);
            ctrl.$setValidity('walletSecret', m ? true : false);
          }
          return value;
        };

        ctrl.$parsers.unshift(validator);
      }
    };
  })
  .directive('ngFileSelect', function() {
    return {
      link: function($scope, el) {
        el.bind('change', function(e) {
          $scope.formData.file = (e.srcElement || e.target).files[0];
          $scope.getFile();
        });
      }
    }
  })
  .directive('contact', ['addressbookService', 'lodash',
    function(addressbookService, lodash) {
      return {
        restrict: 'E',
        link: function(scope, element, attrs) {
          var addr = attrs.address;
          addressbookService.get(addr, function(err, ab) {
            if (ab) {
              var name = lodash.isObject(ab) ? ab.name : ab;
              element.append(name);
            } else {
              element.append(addr);
            }
          });
        }
      };
    }
  ])
  .directive('ignoreMouseWheel', function($rootScope, $timeout) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        element.bind('mousewheel', function(event) {
          element[0].blur();
          $timeout(function() {
            element[0].focus();
          }, 1);
        });
      }
    }
  })
  .directive('wallets', function($log, profileService, walletService, lodash) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/wallets.html',
      scope: {
        wallets: '=wallets'
      },
      link: function(scope, element, attrs) {
        scope.$on("$ionicSlides.sliderInitialized", function(event, data) {
          scope.slider = data.slider;
          scope.$emit('Wallet/Changed', scope.wallets ? scope.wallets[0] : null);
        });

        scope.$on("$ionicSlides.slideChangeEnd", function(event, data) {
          scope.$emit('Wallet/Changed', scope.wallets ? scope.wallets[data.slider.activeIndex] : null);
        });
      }
    }
  })
  .directive('accept', function() {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/acceptSlide.html',
      scope: {},
      link: function(scope, element, attrs) {
        scope.$on("$ionicSlides.sliderInitialized", function(event, data) {
          scope.slider = data.slider;
        });

        scope.$on("$ionicSlides.slideChangeEnd", function(event, data) {
          if (data.slider.activeIndex == 0) {
            scope.slider.slideNext();
            scope.$emit('accepted');
          }
        });
      }
    }
  });

'use strict';

angular.module('copayApp.directives')
  .directive('gravatar', function(md5) {
    return {
      restrict: 'AE',
      replace: true,
      scope: {
        name: '@',
        height: '@',
        width: '@',
        email: '@'
      },
      link: function(scope, el, attr) {
        scope.emailHash = md5.createHash(scope.email || '');
      },
      template: '<img class="gravatar" alt="{{ name }}" height="{{ height }}"  width="{{ width }}" src="https://secure.gravatar.com/avatar/{{ emailHash }}.jpg?s={{ width }}&d=mm">'
    }
  });


'use strict';

angular.module('copayApp.directives')
  .directive('qrScanner', function($rootScope, $timeout, $ionicModal, gettextCatalog, platformInfo) {

    var isCordova = platformInfo.isCordova;
    var isWP = platformInfo.isWP;
    var isIOS = platformInfo.isIOS;

    var controller = function($scope) {

      var onSuccess = function(result) {
        $timeout(function() {
          window.plugins.spinnerDialog.hide();
        }, 100);
        if (isWP && result.cancelled) return;

        $timeout(function() {
          var data = isIOS ? result : result.text;
          $scope.onScan({
            data: data
          });
        }, 1000);
      };

      var onError = function(error) {
        $timeout(function() {
          window.plugins.spinnerDialog.hide();
        }, 100);
      };

      $scope.cordovaOpenScanner = function() {
        window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Preparing camera...'), true);
        $timeout(function() {
          if (isIOS) {
            cloudSky.zBar.scan({}, onSuccess, onError);
          } else {
            cordova.plugins.barcodeScanner.scan(onSuccess, onError);
          }
          if ($scope.beforeScan) {
            $scope.beforeScan();
          }
        }, 100);
      };

      $scope.modalOpenScanner = function() {
        $ionicModal.fromTemplateUrl('views/modals/scanner.html', {
          scope: $scope,
          animation: 'slide-in-up'
        }).then(function(modal) {
          $scope.scannerModal = modal;
          $scope.scannerModal.show();
        });
      };

      $scope.openScanner = function() {
        if (isCordova) {
          $scope.cordovaOpenScanner();
        } else {
          $scope.modalOpenScanner();
        }
      };
      $scope.setFn({theScanFn: $scope.openScanner});
    };

    return {
      restrict: 'E',
      scope: {
        onScan: "&",
        setFn: "&",
        beforeScan: "&"
      },
      controller: controller,
      replace: true,
      template: '<a on-tap="openScanner()"><i class="icon ion-qr-scanner"></i></a>'
    }
  });

'use strict';

angular.module('copayApp.filters', [])
  .filter('amTimeAgo', ['amMoment',
    function(amMoment) {
      return function(input) {
        return amMoment.preprocessDate(input).fromNow();
      };
    }
  ])
  .filter('paged', function() {
    return function(elements) {
      if (elements) {
        return elements.filter(Boolean);
      }

      return false;
    };
  })
  .filter('removeEmpty', function() {
    return function(elements) {
      elements = elements || [];
      // Hide empty change addresses from other copayers
      return elements.filter(function(e) {
        return !e.isChange || e.balance > 0;
      });
    }
  })
  .filter('formatFiatAmount', ['$filter', '$locale', 'configService',
    function(filter, locale, configService) {
      var numberFilter = filter('number');
      var formats = locale.NUMBER_FORMATS;
      var config = configService.getSync().wallet.settings;
      return function(amount) {
        if (!config) return amount;

        var fractionSize = 2;
        var value = numberFilter(amount, fractionSize);
        var sep = value.indexOf(formats.DECIMAL_SEP);
        var group = value.indexOf(formats.GROUP_SEP);

        if (amount >= 0) {
          if (group > 0) {
            if (sep < 0) {
              return value;
            }
            var intValue = value.substring(0, sep);
            var floatValue = parseFloat(value.substring(sep));
            floatValue = floatValue.toFixed(2);
            floatValue = floatValue.toString().substring(1);
            var finalValue = intValue + floatValue;
            return finalValue;
          } else {
            value = parseFloat(value);
            return value.toFixed(2);
          }
        }
        return 0;
      };
    }
  ])
  .filter('orderObjectBy', function() {
    return function(items, field, reverse) {
      var filtered = [];
      angular.forEach(items, function(item) {
        filtered.push(item);
      });
      filtered.sort(function(a, b) {
        return (a[field] > b[field] ? 1 : -1);
      });
      if (reverse) filtered.reverse();
      return filtered;
    };
  });

'use strict';

/**
 * Profile
 *
 * credential: array of OBJECTS
 */
function Profile() {
  this.version = '1.0.0';
};

Profile.create = function(opts) {
  opts = opts || {};

  var x = new Profile();
  x.createdOn = Date.now();
  x.credentials = opts.credentials || [];
  x.disclaimerAccepted = false;
  x.checked = {};
  return x;
};

Profile.fromObj = function(obj) {
  var x = new Profile();

  x.createdOn = obj.createdOn;
  x.credentials = obj.credentials;
  x.disclaimerAccepted = obj.disclaimerAccepted;
  x.checked = obj.checked || {};
  x.checkedUA = obj.checkedUA || {};

  if (x.credentials[0] && typeof x.credentials[0] != 'object')
    throw ("credentials should be an object");

  return x;
};

Profile.fromString = function(str) {
  return Profile.fromObj(JSON.parse(str));
};

Profile.prototype.toObj = function() {
  delete this.dirty;
  return JSON.stringify(this);
};


Profile.prototype.hasWallet = function(walletId) {
  for (var i in this.credentials) {
    var c = this.credentials[i];
    if (c.walletId == walletId) return true;
  };
  return false;
};

Profile.prototype.isChecked = function(ua, walletId) {
  return !!(this.checkedUA == ua && this.checked[walletId]);
};


Profile.prototype.isDeviceChecked = function(ua) {
  return this.checkedUA == ua;
};


Profile.prototype.setChecked = function(ua, walletId) {
  if (this.checkedUA != ua) {
    this.checkedUA = ua;
    this.checked = {};
  }
  this.checked[walletId] = true;
  this.dirty = true;
};


Profile.prototype.addWallet = function(credentials) {
  if (!credentials.walletId)
    throw 'credentials must have .walletId';

  if (this.hasWallet(credentials.walletId))
    return false;

  this.credentials.push(credentials);
  this.dirty = true;
  return true;
};

Profile.prototype.updateWallet = function(credentials) {
  if (!credentials.walletId)
    throw 'credentials must have .walletId';

  if (!this.hasWallet(credentials.walletId))
    return false;

  this.credentials = this.credentials.map(function(c) {
    if(c.walletId != credentials.walletId ) {
      return c;
    } else {
      return credentials
    }
  });

  this.dirty = true;
  return true;
};

Profile.prototype.deleteWallet = function(walletId) {
  if (!this.hasWallet(walletId))
    return false;

  this.credentials = this.credentials.filter(function(c) {
    return c.walletId != walletId;
  });

  this.dirty = true;
  return true;
};

'use strict';

angular.module('copayApp.services').service('addonManager', function (lodash) {
  var addons = [];

  this.registerAddon = function (addonSpec) {
    addons.push(addonSpec);
  };

  this.addonMenuItems = function () {
    return lodash.map(addons, function (addonSpec) {
      return addonSpec.menuItem;
    });
  };

  this.addonViews = function () {
    return lodash.map(addons, function (addonSpec) {
      return addonSpec.view;
    });
  };

  this.formatPendingTxp = function (txp) {
    lodash.each(addons, function (addon) {
      if (addon.formatPendingTxp) {
        addon.formatPendingTxp(txp);
      }
    });
  };

  this.txTemplateUrl = function() {
    var addon = lodash.find(addons, 'txTemplateUrl');
    return addon ? addon.txTemplateUrl() : null;
  }
});

'use strict';

angular.module('copayApp.services').factory('addressbookService', function(bitcore, storageService, lodash) {
  var root = {};

  root.get = function(addr, cb) {
    storageService.getAddressbook('testnet', function(err, ab) {
      if (err) return cb(err);
      if (ab) ab = JSON.parse(ab);
      if (ab && ab[addr]) return cb(null, ab[addr]);

      storageService.getAddressbook('livenet', function(err, ab) {
        if (err) return cb(err);
        if (ab) ab = JSON.parse(ab);
        if (ab && ab[addr]) return cb(null, ab[addr]);
        return cb();
      });
    });
  };

  root.list = function(cb) {
    storageService.getAddressbook('testnet', function(err, ab) {
      if (err) return cb('Could not get the Addressbook');

      if (ab) ab = JSON.parse(ab);

      ab = ab || {};
      storageService.getAddressbook('livenet', function(err, ab2) {
        if (ab2) ab2 = JSON.parse(ab2);

        ab2 = ab2 || {};
        return cb(err, lodash.defaults(ab2, ab));
      });
    });
  };

  root.add = function(entry, cb) {
    var network = (new bitcore.Address(entry.address)).network.name;
    storageService.getAddressbook(network, function(err, ab) {
      if (err) return cb(err);
      if (ab) ab = JSON.parse(ab);
      ab = ab || {};
      if (lodash.isArray(ab)) ab = {}; // No array
      if (ab[entry.address]) return cb('Entry already exist');
      ab[entry.address] = entry;
      storageService.setAddressbook(network, JSON.stringify(ab), function(err, ab) {
        if (err) return cb('Error adding new entry');
        root.list(function(err, ab) {
          return cb(err, ab);
        });
      });
    });
  };

  root.remove = function(addr, cb) {
    var network = (new bitcore.Address(addr)).network.name;
    storageService.getAddressbook(network, function(err, ab) {
      if (err) return cb(err);
      if (ab) ab = JSON.parse(ab);
      ab = ab || {};
      if (lodash.isEmpty(ab)) return cb('Addressbook is empty');
      if (!ab[addr]) return cb('Entry does not exist');
      delete ab[addr];
      storageService.setAddressbook(network, JSON.stringify(ab), function(err) {
        if (err) return cb('Error deleting entry');
        root.list(function(err, ab) {
          return cb(err, ab);
        });
      });
    });
  };

  root.removeAll = function() {
    storageService.removeAddressbook('livenet', function(err) {
      storageService.removeAddressbook('testnet', function(err) {
        if (err) return cb('Error deleting addressbook');
        return cb();
      });
    });
  };

  return root;
});

'use strict';
'use strict';
angular.module('copayApp.services')
  .factory('addressService', function(storageService, profileService, $log, $timeout, lodash, bwcError, gettextCatalog) {
    var root = {};
    return root;
  });

'use strict';
angular.module('copayApp.services').factory('amazonService', function($http, $log, lodash, moment, storageService, configService, platformInfo) {
  var root = {};
  var credentials = {};

  var _setCredentials = function() {
    /*
     * Development: 'testnet'
     * Production: 'livenet'
     */
    credentials.NETWORK = 'livenet';

    if (credentials.NETWORK == 'testnet') {
      credentials.BITPAY_API_URL = "https://test.bitpay.com";
    } else {
      credentials.BITPAY_API_URL = "https://bitpay.com";
    };
  };

  var _getBitPay = function(endpoint) {
    _setCredentials();
    return {
      method: 'GET',
      url: credentials.BITPAY_API_URL + endpoint,
      headers: {
        'content-type': 'application/json'
      }
    };
  };

  var _postBitPay = function(endpoint, data) {
    _setCredentials();
    return {
      method: 'POST',
      url: credentials.BITPAY_API_URL + endpoint,
      headers: {
        'content-type': 'application/json'
      },
      data: data
    };
  };

  root.getEnvironment = function() {
    _setCredentials();
    return credentials.NETWORK;
  };

  root.savePendingGiftCard = function(gc, opts, cb) {
    var network = root.getEnvironment();
    storageService.getAmazonGiftCards(network, function(err, oldGiftCards) {
      if (lodash.isString(oldGiftCards)) {
        oldGiftCards = JSON.parse(oldGiftCards);
      }
      if (lodash.isString(gc)) {
        gc = JSON.parse(gc);
      }
      var inv = oldGiftCards || {};
      inv[gc.invoiceId] = gc;
      if (opts && (opts.error || opts.status)) {
        inv[gc.invoiceId] = lodash.assign(inv[gc.invoiceId], opts);
      }
      if (opts && opts.remove) {
        delete(inv[gc.invoiceId]);
      }
      inv = JSON.stringify(inv);

      storageService.setAmazonGiftCards(network, inv, function(err) {
        return cb(err);
      });
    });

    // Show pending task from the UI
    storageService.setNextStep('AmazonGiftCards', true, function(err) {});
  };

  root.getPendingGiftCards = function(cb) {
    var network = root.getEnvironment();
    storageService.getAmazonGiftCards(network, function(err, giftCards) {
      var _gcds = giftCards ? JSON.parse(giftCards) : null;
      return cb(err, _gcds);
    });
  };

  root.createBitPayInvoice = function(data, cb) {

    var dataSrc = {
      currency: data.currency,
      amount: data.amount,
      clientId: data.uuid
    };

    $http(_postBitPay('/amazon-gift/pay', dataSrc)).then(function(data) {
      $log.info('BitPay Create Invoice: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('BitPay Create Invoice: ERROR ' + data.data.message);
      return cb(data.data);
    });
  };

  root.getBitPayInvoice = function(id, cb) {
    $http(_getBitPay('/invoices/' + id)).then(function(data) {
      $log.info('BitPay Get Invoice: SUCCESS');
      return cb(null, data.data.data);
    }, function(data) {
      $log.error('BitPay Get Invoice: ERROR ' + data.data.error);
      return cb(data.data.error);
    });
  };

  root.createGiftCard = function(data, cb) {

    var dataSrc = {
      "clientId": data.uuid,
      "invoiceId": data.invoiceId,
      "accessKey": data.accessKey
    };

    $http(_postBitPay('/amazon-gift/redeem', dataSrc)).then(function(data) {
      var status = data.data.status == 'new' ? 'PENDING' : (data.data.status == 'paid') ? 'PENDING' : data.data.status;
      data.data.status = status;
      $log.info('Amazon.com Gift Card Create/Update: ' + status);
      return cb(null, data.data);
    }, function(data) {
      $log.error('Amazon.com Gift Card Create/Update: ' + data.data.message);
      return cb(data.data);
    });
  };

  root.cancelGiftCard = function(data, cb) {

    var dataSrc = {
      "clientId": data.uuid,
      "invoiceId": data.invoiceId,
      "accessKey": data.accessKey
    };

    $http(_postBitPay('/amazon-gift/cancel', dataSrc)).then(function(data) {
      $log.info('Amazon.com Gift Card Cancel: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Amazon.com Gift Card Cancel: ' + data.data.message);
      return cb(data.data);
    });
  };

  return root;

});

'use strict';
angular.module('copayApp.services')
  .factory('applicationService', function($rootScope, $timeout, $ionicHistory, platformInfo, $state) {
    var root = {};

    var isChromeApp = platformInfo.isChromeApp;
    var isNW = platformInfo.isNW;

    root.restart = function() {
      var hashIndex = window.location.href.indexOf('#/');
      if (platformInfo.isCordova) {
        window.location = window.location.href.substr(0, hashIndex);
        $timeout(function() {
          $rootScope.$digest();
        }, 1);

      } else {
        // Go home reloading the application
        if (isChromeApp) {
          chrome.runtime.reload();
        } else if (isNW) {
          $ionicHistory.removeBackView();
          $state.go('tabs.home');
          $timeout(function() {
            var win = require('nw.gui').Window.get();
            win.reload(3);
            //or
            win.reloadDev();
          }, 100);
        } else {
          window.location = window.location.href.substr(0, hashIndex);
        }
      }
    };

    return root;
  });

'use strict';
angular.module('copayApp.services')
  .factory('backupService', function backupServiceFactory($log, $timeout, $stateParams, profileService, sjcl) {

    var root = {};

    var _download = function(ew, filename, cb) {
      var NewBlob = function(data, datatype) {
        var out;

        try {
          out = new Blob([data], {
            type: datatype
          });
          $log.debug("case 1");
        } catch (e) {
          window.BlobBuilder = window.BlobBuilder ||
            window.WebKitBlobBuilder ||
            window.MozBlobBuilder ||
            window.MSBlobBuilder;

          if (e.name == 'TypeError' && window.BlobBuilder) {
            var bb = new BlobBuilder();
            bb.append(data);
            out = bb.getBlob(datatype);
            $log.debug("case 2");
          } else if (e.name == "InvalidStateError") {
            // InvalidStateError (tested on FF13 WinXP)
            out = new Blob([data], {
              type: datatype
            });
            $log.debug("case 3");
          } else {
            // We're screwed, blob constructor unsupported entirely
            $log.debug("Error");
          }
        }
        return out;
      };

      var a = angular.element('<a></a>');
      var blob = new NewBlob(ew, 'text/plain;charset=utf-8');
      a.attr('href', window.URL.createObjectURL(blob));
      a.attr('download', filename);
      a[0].click();
      return cb();
    };

    root.addMetadata = function(b, opts) {

      b = JSON.parse(b);
      if (opts.addressBook) b.addressBook = opts.addressBook;
      return JSON.stringify(b);
    }

    root.walletExport = function(password, opts) {
      if (!password) {
        return null;
      }
      var wallet = profileService.getWallet($stateParams.walletId);
      try {
        opts = opts || {};
        var b = wallet.export(opts);
        if (opts.addressBook) b = root.addMetadata(b, opts);

        var e = sjcl.encrypt(password, b, {
          iter: 10000
        });
        return e;
      } catch (err) {
        $log.debug('Error exporting wallet: ', err);
        return null;
      };
    };

    root.walletDownload = function(password, opts, cb) {
      var wallet = profileService.getWallet($stateParams.walletId);
      var ew = root.walletExport(password, opts);
      if (!ew) return cb('Could not create backup');

      var walletName = (wallet.alias || '') + (wallet.alias ? '-' : '') + wallet.credentials.walletName;
      if (opts.noSign) walletName = walletName + '-noSign'
      var filename = walletName + '-Copaybackup.aes.json';
      _download(ew, filename, cb)
    };
    return root;
  });

'use strict';
angular.module('copayApp.services')
  .factory('bitcore', function bitcoreFactory(bwcService) {
    var bitcore = bwcService.getBitcore();
    return bitcore;
  });

'use strict';

angular.module('copayApp.services').factory('bitpayCardService', function($http, $log, lodash, storageService) {
  var root = {};
  var credentials = {};
  var bpSession = {};

  var _setCredentials = function() {
    /*
     * Development: 'testnet'
     * Production: 'livenet'
     */
    credentials.NETWORK = 'livenet';
    if (credentials.NETWORK == 'testnet') {
      credentials.BITPAY_API_URL = 'https://test.bitpay.com';
    }
    else {
      credentials.BITPAY_API_URL = 'https://bitpay.com';
    };
  };

  var _setError = function(msg, e) {
    $log.error(msg);
    return e;
  };

  var _getUser = function(cb) {
    _setCredentials();
    storageService.getBitpayCard(credentials.NETWORK, function(err, user) {
      if (err) return cb(err);
      if (lodash.isString(user)) {
        user = JSON.parse(user);
      }
      return cb(null, user);
    });
  };

  var _setUser = function(user, cb) {
    _setCredentials();
    user = JSON.stringify(user);
    storageService.setBitpayCard(credentials.NETWORK, user, function(err) {
      return cb(err);
    });
    // Show pending task from the UI
    storageService.setNextStep('BitpayCard', true, function(err) {});
  };

  var _getSession = function(cb) {
    _setCredentials();
    $http({
      method: 'GET',
      url: credentials.BITPAY_API_URL + '/visa-api/session',
      headers: {
        'content-type': 'application/json'
      }
    }).then(function(data) {
      $log.info('BitPay Get Session: SUCCESS');
      bpSession = data.data.data;
      return cb(null, bpSession);
    }, function(data) {
      return cb(_setError('BitPay Card Error: Get Session', data));
    });
  };

  var _getBitPay = function(endpoint) {
    _setCredentials();
    return {
      method: 'GET',
      url: credentials.BITPAY_API_URL + endpoint,
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': bpSession.csrfToken
      }
    };
  };

  var _postBitPay = function(endpoint, data) {
    _setCredentials();
    return {
      method: 'POST',
      url: credentials.BITPAY_API_URL + endpoint,
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': bpSession.csrfToken
      },
      data: data
    };
  };

  root.getEnvironment = function() {
    _setCredentials();
    return credentials.NETWORK;
  };

  root.topUp = function(data, cb) {
    var dataSrc = {
      amount: data.amount,
      currency: data.currency
    };
    $http(_postBitPay('/visa-api/topUp', dataSrc)).then(function(data) {
      $log.info('BitPay TopUp: SUCCESS');
      return cb(null, data.data.data.invoice);
    }, function(data) {
      return cb(_setError('BitPay Card Error: TopUp', data));
    });
  };

  root.transactionHistory = function(dateRange, cb) {
    var params;
    if (!dateRange.startDate) {
      params = '';
    } else {
      params = '/?startDate=' + dateRange.startDate + '&endDate=' + dateRange.endDate;
    }
    $http(_getBitPay('/visa-api/transactionHistory' + params)).then(function(data) {
      $log.info('BitPay Get Transaction History: SUCCESS');
      return cb(null, data.data.data);
    }, function(data) {
      return cb(_setError('BitPay Card Error: Get Transaction History', data));
    });
  };

  root.invoiceHistory = function(cb) {
    $http(_getBitPay('/visa-api/invoiceHistory')).then(function(data) {
      $log.info('BitPay Get Invoice History: SUCCESS');
      return cb(null, data.data.data);
    }, function(data) {
      return cb(_setError('BitPay Card Error: Get Invoice History', data));
    });
  };

  root.getInvoice = function(id, cb) {
    $http(_getBitPay('/invoices/' + id)).then(function(data) {
      $log.info('BitPay Get Invoice: SUCCESS');
      return cb(null, data.data.data);
    }, function(data) {
      return cb(_setError('BitPay Card Error: Get Invoice', data));
    });
  };

  root.authenticate = function(userData, cb) {
    _setUser(userData, function(err) {
      $http(_postBitPay('/visa-api/authenticate', userData)).then(function(data) {
        $log.info('BitPay Authenticate: SUCCESS');
          _getSession(function(err, session) {
            if (err) return cb(err);
            return cb(null, session);
          });
      }, function(data) {
        if (data && data.data && data.data.error.twoFactorPending) {
          $log.error('BitPay Card needs 2FA Authentication');
          _getSession(function(err, session) {
            if (err) return cb(err);
            return cb(null, session);
          });
        } else {
          return cb(data);
        }
      });
    });
  };

  root.authenticate2FA = function(userData, cb) {
    $http(_postBitPay('/visa-api/verify-two-factor', userData)).then(function(data) {
      $log.info('BitPay 2FA: SUCCESS');
      return cb(null, data);
    }, function(data) {
      return cb(_setError('BitPay Card Error: 2FA', data));
    });
  };

  root.isAuthenticated = function(cb) {
    _getSession(function(err, session) {
      if (err) return cb(err);
      if (!session.isAuthenticated) {
        _getUser(function(err, user) {
          if (err) return cb(err);
          if (lodash.isEmpty(user)) return cb(null, session);
          root.authenticate(user, function(err, session) {
            if (err) return cb(err);
            return cb(null, session);
          });
        });
      } else {
        return cb(null, session);
      }
    });
  };

  root.logout = function(cb) {
    _setCredentials();
    storageService.removeBitpayCard(credentials.NETWORK, function(err) {
      $http(_getBitPay('/visa-api/logout')).then(function(data) {
        $log.info('BitPay Logout: SUCCESS');
        return cb(data);
      }, function(data) {
        return cb(_setError('BitPay Card Error: Logout ', data));
      });
    });
  };

  /*
   * CONSTANTS
   */

  root.bpTranCodes = {
    '00611': {
      merchant: {
        name: 'BitPay',
        city: 'Atlanta',
        state: 'GA'
      },
      category: 'bp001',
      description: 'Top-Up'
    },
    '602': {
      merchant: {
        name: 'ATM Withdrawal Fee',
      },
      category: 'bp002',
      description: ''
    },
    '606': {
      merchant: {
        name: 'International ATM Fee',
      },
      category: 'bp002',
      description: ''
    },
    '00240': {
      merchant: {
        name: 'ACH Debit Fee',
      },
      category: 'bp002',
      description: ''
    },
    '5032': {
      merchant: {
        name: 'ACH Debit',
      },
      category: 'bp002',
      description: ''
    },
    '37': {
      merchant: {
        name: 'ACH / Payroll Deposit',
      },
      category: 'bp002',
      description: ''
    }
  };

  root.iconMap = {
    742: 'medical',
    763: 'plant',
    780: 'plant',
    1520: 'repair',
    1711: 'repair',
    1731: 'repair',
    1740: 'repair',
    1750: 'repair',
    1761: 'repair',
    1771: 'repair',
    1799: 'repair',
    2741: 'books',
    2791: 'books',
    2842: 'clean',
    3000: 'airplane',
    3001: 'airplane',
    3002: 'airplane',
    3003: 'airplane',
    3004: 'airplane',
    3005: 'airplane',
    3006: 'airplane',
    3007: 'airplane',
    3008: 'airplane',
    3009: 'airplane',
    3010: 'airplane',
    3011: 'airplane',
    3012: 'airplane',
    3013: 'airplane',
    3014: 'airplane',
    3015: 'airplane',
    3016: 'airplane',
    3017: 'airplane',
    3018: 'airplane',
    3019: 'airplane',
    3020: 'airplane',
    3021: 'airplane',
    3022: 'airplane',
    3023: 'airplane',
    3024: 'airplane',
    3025: 'airplane',
    3026: 'airplane',
    3027: 'airplane',
    3028: 'airplane',
    3029: 'airplane',
    3030: 'airplane',
    3031: 'airplane',
    3032: 'airplane',
    3033: 'airplane',
    3034: 'airplane',
    3035: 'airplane',
    3036: 'airplane',
    3037: 'airplane',
    3038: 'airplane',
    3039: 'airplane',
    3040: 'airplane',
    3041: 'airplane',
    3042: 'airplane',
    3043: 'airplane',
    3044: 'airplane',
    3045: 'airplane',
    3046: 'airplane',
    3047: 'airplane',
    3048: 'airplane',
    3049: 'airplane',
    3050: 'airplane',
    3051: 'airplane',
    3052: 'airplane',
    3053: 'airplane',
    3054: 'airplane',
    3055: 'airplane',
    3056: 'airplane',
    3057: 'airplane',
    3058: 'airplane',
    3059: 'airplane',
    3060: 'airplane',
    3061: 'airplane',
    3062: 'airplane',
    3063: 'airplane',
    3064: 'airplane',
    3065: 'airplane',
    3066: 'airplane',
    3067: 'airplane',
    3068: 'airplane',
    3069: 'airplane',
    3070: 'airplane',
    3071: 'airplane',
    3072: 'airplane',
    3073: 'airplane',
    3074: 'airplane',
    3075: 'airplane',
    3076: 'airplane',
    3077: 'airplane',
    3078: 'airplane',
    3079: 'airplane',
    3080: 'airplane',
    3081: 'airplane',
    3082: 'airplane',
    3083: 'airplane',
    3084: 'airplane',
    3085: 'airplane',
    3086: 'airplane',
    3087: 'airplane',
    3088: 'airplane',
    3089: 'airplane',
    3090: 'airplane',
    3091: 'airplane',
    3092: 'airplane',
    3093: 'airplane',
    3094: 'airplane',
    3095: 'airplane',
    3096: 'airplane',
    3097: 'airplane',
    3098: 'airplane',
    3099: 'airplane',
    3100: 'airplane',
    3101: 'airplane',
    3102: 'airplane',
    3103: 'airplane',
    3104: 'airplane',
    3105: 'airplane',
    3106: 'airplane',
    3107: 'airplane',
    3108: 'airplane',
    3109: 'airplane',
    3110: 'airplane',
    3111: 'airplane',
    3112: 'airplane',
    3113: 'airplane',
    3114: 'airplane',
    3115: 'airplane',
    3116: 'airplane',
    3117: 'airplane',
    3118: 'airplane',
    3119: 'airplane',
    3120: 'airplane',
    3121: 'airplane',
    3122: 'airplane',
    3123: 'airplane',
    3124: 'airplane',
    3125: 'airplane',
    3126: 'airplane',
    3127: 'airplane',
    3128: 'airplane',
    3129: 'airplane',
    3130: 'airplane',
    3131: 'airplane',
    3132: 'airplane',
    3133: 'airplane',
    3134: 'airplane',
    3135: 'airplane',
    3136: 'airplane',
    3137: 'airplane',
    3138: 'airplane',
    3139: 'airplane',
    3140: 'airplane',
    3141: 'airplane',
    3142: 'airplane',
    3143: 'airplane',
    3144: 'airplane',
    3145: 'airplane',
    3146: 'airplane',
    3147: 'airplane',
    3148: 'airplane',
    3149: 'airplane',
    3150: 'airplane',
    3151: 'airplane',
    3152: 'airplane',
    3153: 'airplane',
    3154: 'airplane',
    3155: 'airplane',
    3156: 'airplane',
    3157: 'airplane',
    3158: 'airplane',
    3159: 'airplane',
    3160: 'airplane',
    3161: 'airplane',
    3162: 'airplane',
    3163: 'airplane',
    3164: 'airplane',
    3165: 'airplane',
    3166: 'airplane',
    3167: 'airplane',
    3168: 'airplane',
    3169: 'airplane',
    3170: 'airplane',
    3171: 'airplane',
    3172: 'airplane',
    3173: 'airplane',
    3174: 'airplane',
    3175: 'airplane',
    3176: 'airplane',
    3177: 'airplane',
    3178: 'airplane',
    3179: 'airplane',
    3180: 'airplane',
    3181: 'airplane',
    3182: 'airplane',
    3183: 'airplane',
    3184: 'airplane',
    3185: 'airplane',
    3186: 'airplane',
    3187: 'airplane',
    3188: 'airplane',
    3189: 'airplane',
    3190: 'airplane',
    3191: 'airplane',
    3192: 'airplane',
    3193: 'airplane',
    3194: 'airplane',
    3195: 'airplane',
    3196: 'airplane',
    3197: 'airplane',
    3198: 'airplane',
    3199: 'airplane',
    3200: 'airplane',
    3201: 'airplane',
    3202: 'airplane',
    3203: 'airplane',
    3204: 'airplane',
    3205: 'airplane',
    3206: 'airplane',
    3207: 'airplane',
    3208: 'airplane',
    3209: 'airplane',
    3210: 'airplane',
    3211: 'airplane',
    3212: 'airplane',
    3213: 'airplane',
    3214: 'airplane',
    3215: 'airplane',
    3216: 'airplane',
    3217: 'airplane',
    3218: 'airplane',
    3219: 'airplane',
    3220: 'airplane',
    3221: 'airplane',
    3222: 'airplane',
    3223: 'airplane',
    3224: 'airplane',
    3225: 'airplane',
    3226: 'airplane',
    3227: 'airplane',
    3228: 'airplane',
    3229: 'airplane',
    3230: 'airplane',
    3231: 'airplane',
    3232: 'airplane',
    3233: 'airplane',
    3234: 'airplane',
    3235: 'airplane',
    3236: 'airplane',
    3237: 'airplane',
    3238: 'airplane',
    3239: 'airplane',
    3240: 'airplane',
    3241: 'airplane',
    3242: 'airplane',
    3243: 'airplane',
    3244: 'airplane',
    3245: 'airplane',
    3246: 'airplane',
    3247: 'airplane',
    3248: 'airplane',
    3249: 'airplane',
    3250: 'airplane',
    3251: 'airplane',
    3252: 'airplane',
    3253: 'airplane',
    3254: 'airplane',
    3255: 'airplane',
    3256: 'airplane',
    3257: 'airplane',
    3258: 'airplane',
    3259: 'airplane',
    3260: 'airplane',
    3261: 'airplane',
    3262: 'airplane',
    3263: 'airplane',
    3264: 'airplane',
    3265: 'airplane',
    3266: 'airplane',
    3267: 'airplane',
    3268: 'airplane',
    3269: 'airplane',
    3270: 'airplane',
    3271: 'airplane',
    3272: 'airplane',
    3273: 'airplane',
    3274: 'airplane',
    3275: 'airplane',
    3276: 'airplane',
    3277: 'airplane',
    3278: 'airplane',
    3279: 'airplane',
    3280: 'airplane',
    3281: 'airplane',
    3282: 'airplane',
    3283: 'airplane',
    3284: 'airplane',
    3285: 'airplane',
    3286: 'airplane',
    3287: 'airplane',
    3288: 'airplane',
    3289: 'airplane',
    3290: 'airplane',
    3291: 'airplane',
    3292: 'airplane',
    3293: 'airplane',
    3294: 'airplane',
    3295: 'airplane',
    3296: 'airplane',
    3297: 'airplane',
    3298: 'airplane',
    3299: 'airplane',
    3351: 'car',
    3352: 'car',
    3353: 'car',
    3354: 'car',
    3355: 'car',
    3356: 'car',
    3357: 'car',
    3358: 'car',
    3359: 'car',
    3360: 'car',
    3361: 'car',
    3362: 'car',
    3363: 'car',
    3364: 'car',
    3365: 'car',
    3366: 'car',
    3367: 'car',
    3368: 'car',
    3369: 'car',
    3370: 'car',
    3371: 'car',
    3372: 'car',
    3373: 'car',
    3374: 'car',
    3375: 'car',
    3376: 'car',
    3377: 'car',
    3378: 'car',
    3379: 'car',
    3380: 'car',
    3381: 'car',
    3382: 'car',
    3383: 'car',
    3384: 'car',
    3385: 'car',
    3386: 'car',
    3387: 'car',
    3388: 'car',
    3389: 'car',
    3390: 'car',
    3391: 'car',
    3392: 'car',
    3393: 'car',
    3394: 'car',
    3395: 'car',
    3396: 'car',
    3397: 'car',
    3398: 'car',
    3399: 'car',
    3400: 'car',
    3401: 'car',
    3402: 'car',
    3403: 'car',
    3404: 'car',
    3405: 'car',
    3406: 'car',
    3407: 'car',
    3408: 'car',
    3409: 'car',
    3410: 'car',
    3411: 'car',
    3412: 'car',
    3413: 'car',
    3414: 'car',
    3415: 'car',
    3416: 'car',
    3417: 'car',
    3418: 'car',
    3419: 'car',
    3420: 'car',
    3421: 'car',
    3422: 'car',
    3423: 'car',
    3424: 'car',
    3425: 'car',
    3426: 'car',
    3427: 'car',
    3428: 'car',
    3429: 'car',
    3430: 'car',
    3431: 'car',
    3432: 'car',
    3433: 'car',
    3434: 'car',
    3435: 'car',
    3436: 'car',
    3437: 'car',
    3438: 'car',
    3439: 'car',
    3440: 'car',
    3441: 'car',
    3501: 'hotel',
    3502: 'hotel',
    3503: 'hotel',
    3504: 'hotel',
    3505: 'hotel',
    3506: 'hotel',
    3507: 'hotel',
    3508: 'hotel',
    3509: 'hotel',
    3510: 'hotel',
    3511: 'hotel',
    3512: 'hotel',
    3513: 'hotel',
    3514: 'hotel',
    3515: 'hotel',
    3516: 'hotel',
    3517: 'hotel',
    3518: 'hotel',
    3519: 'hotel',
    3520: 'hotel',
    3521: 'hotel',
    3522: 'hotel',
    3523: 'hotel',
    3524: 'hotel',
    3525: 'hotel',
    3526: 'hotel',
    3527: 'hotel',
    3528: 'hotel',
    3529: 'hotel',
    3530: 'hotel',
    3531: 'hotel',
    3532: 'hotel',
    3533: 'hotel',
    3534: 'hotel',
    3535: 'hotel',
    3536: 'hotel',
    3537: 'hotel',
    3538: 'hotel',
    3539: 'hotel',
    3540: 'hotel',
    3541: 'hotel',
    3542: 'hotel',
    3543: 'hotel',
    3544: 'hotel',
    3545: 'hotel',
    3546: 'hotel',
    3547: 'hotel',
    3548: 'hotel',
    3549: 'hotel',
    3550: 'hotel',
    3551: 'hotel',
    3552: 'hotel',
    3553: 'hotel',
    3554: 'hotel',
    3555: 'hotel',
    3556: 'hotel',
    3557: 'hotel',
    3558: 'hotel',
    3559: 'hotel',
    3560: 'hotel',
    3561: 'hotel',
    3562: 'hotel',
    3563: 'hotel',
    3564: 'hotel',
    3565: 'hotel',
    3566: 'hotel',
    3567: 'hotel',
    3568: 'hotel',
    3569: 'hotel',
    3570: 'hotel',
    3571: 'hotel',
    3572: 'hotel',
    3573: 'hotel',
    3574: 'hotel',
    3575: 'hotel',
    3576: 'hotel',
    3577: 'hotel',
    3578: 'hotel',
    3579: 'hotel',
    3580: 'hotel',
    3581: 'hotel',
    3582: 'hotel',
    3583: 'hotel',
    3584: 'hotel',
    3585: 'hotel',
    3586: 'hotel',
    3587: 'hotel',
    3588: 'hotel',
    3589: 'hotel',
    3590: 'hotel',
    3591: 'hotel',
    3592: 'hotel',
    3593: 'hotel',
    3594: 'hotel',
    3595: 'hotel',
    3596: 'hotel',
    3597: 'hotel',
    3598: 'hotel',
    3599: 'hotel',
    3600: 'hotel',
    3601: 'hotel',
    3602: 'hotel',
    3603: 'hotel',
    3604: 'hotel',
    3605: 'hotel',
    3606: 'hotel',
    3607: 'hotel',
    3608: 'hotel',
    3609: 'hotel',
    3610: 'hotel',
    3611: 'hotel',
    3612: 'hotel',
    3613: 'hotel',
    3614: 'hotel',
    3615: 'hotel',
    3616: 'hotel',
    3617: 'hotel',
    3618: 'hotel',
    3619: 'hotel',
    3620: 'hotel',
    3621: 'hotel',
    3622: 'hotel',
    3623: 'hotel',
    3624: 'hotel',
    3625: 'hotel',
    3626: 'hotel',
    3627: 'hotel',
    3628: 'hotel',
    3629: 'hotel',
    3630: 'hotel',
    3631: 'hotel',
    3632: 'hotel',
    3633: 'hotel',
    3634: 'hotel',
    3635: 'hotel',
    3636: 'hotel',
    3637: 'hotel',
    3638: 'hotel',
    3639: 'hotel',
    3640: 'hotel',
    3641: 'hotel',
    3642: 'hotel',
    3643: 'hotel',
    3644: 'hotel',
    3645: 'hotel',
    3646: 'hotel',
    3647: 'hotel',
    3648: 'hotel',
    3649: 'hotel',
    3650: 'hotel',
    3651: 'hotel',
    3652: 'hotel',
    3653: 'hotel',
    3654: 'hotel',
    3655: 'hotel',
    3656: 'hotel',
    3657: 'hotel',
    3658: 'hotel',
    3659: 'hotel',
    3660: 'hotel',
    3661: 'hotel',
    3662: 'hotel',
    3663: 'hotel',
    3664: 'hotel',
    3665: 'hotel',
    3666: 'hotel',
    3667: 'hotel',
    3668: 'hotel',
    3669: 'hotel',
    3670: 'hotel',
    3671: 'hotel',
    3672: 'hotel',
    3673: 'hotel',
    3674: 'hotel',
    3675: 'hotel',
    3676: 'hotel',
    3677: 'hotel',
    3678: 'hotel',
    3679: 'hotel',
    3680: 'hotel',
    3681: 'hotel',
    3682: 'hotel',
    3683: 'hotel',
    3684: 'hotel',
    3685: 'hotel',
    3686: 'hotel',
    3687: 'hotel',
    3688: 'hotel',
    3689: 'hotel',
    3690: 'hotel',
    3691: 'hotel',
    3692: 'hotel',
    3693: 'hotel',
    3694: 'hotel',
    3695: 'hotel',
    3696: 'hotel',
    3697: 'hotel',
    3698: 'hotel',
    3699: 'hotel',
    3700: 'hotel',
    3701: 'hotel',
    3702: 'hotel',
    3703: 'hotel',
    3704: 'hotel',
    3705: 'hotel',
    3706: 'hotel',
    3707: 'hotel',
    3708: 'hotel',
    3709: 'hotel',
    3710: 'hotel',
    3711: 'hotel',
    3712: 'hotel',
    3713: 'hotel',
    3714: 'hotel',
    3715: 'hotel',
    3716: 'hotel',
    3717: 'hotel',
    3718: 'hotel',
    3719: 'hotel',
    3720: 'hotel',
    3721: 'hotel',
    3722: 'hotel',
    3723: 'hotel',
    3724: 'hotel',
    3725: 'hotel',
    3726: 'hotel',
    3727: 'hotel',
    3728: 'hotel',
    3729: 'hotel',
    3730: 'hotel',
    3731: 'hotel',
    3732: 'hotel',
    3733: 'hotel',
    3734: 'hotel',
    3735: 'hotel',
    3736: 'hotel',
    3737: 'hotel',
    3738: 'hotel',
    3739: 'hotel',
    3740: 'hotel',
    3741: 'hotel',
    3742: 'hotel',
    3743: 'hotel',
    3744: 'hotel',
    3745: 'hotel',
    3746: 'hotel',
    3747: 'hotel',
    3748: 'hotel',
    3749: 'hotel',
    3750: 'hotel',
    3751: 'hotel',
    3752: 'hotel',
    3753: 'hotel',
    3754: 'hotel',
    3755: 'hotel',
    3756: 'hotel',
    3757: 'hotel',
    3758: 'hotel',
    3759: 'hotel',
    3760: 'hotel',
    3761: 'hotel',
    3762: 'hotel',
    3763: 'hotel',
    3764: 'hotel',
    3765: 'hotel',
    3766: 'hotel',
    3767: 'hotel',
    3768: 'hotel',
    3769: 'hotel',
    3770: 'hotel',
    3771: 'hotel',
    3772: 'hotel',
    3773: 'hotel',
    3774: 'hotel',
    3775: 'hotel',
    3776: 'hotel',
    3777: 'hotel',
    3778: 'hotel',
    3779: 'hotel',
    3780: 'hotel',
    3781: 'hotel',
    3782: 'hotel',
    3783: 'hotel',
    3784: 'hotel',
    3785: 'hotel',
    3786: 'hotel',
    3787: 'hotel',
    3788: 'hotel',
    3789: 'hotel',
    3790: 'hotel',
    3816: 'hotel',
    3835: 'hotel',
    4011: 'car',
    4111: 'car',
    4112: 'car',
    4119: 'car',
    4121: 'car',
    4131: 'car',
    4214: 'car',
    4215: 'bus',
    4225: 'default',
    4411: 'boat',
    4457: 'boat',
    4468: 'boat',
    4511: 'airplane',
    4582: 'airplane',
    4722: 'airplane',
    4723: 'airplane',
    4784: 'car',
    4789: 'car',
    4812: 'car',
    4814: 'telephone',
    4815: 'telephone',
    4816: 'computer',
    4821: 'money',
    4829: 'money',
    4899: 'television',
    4900: 'gas',
    5013: 'car',
    5021: 'default',
    5039: 'repair',
    5044: 'computer',
    5045: 'computer',
    5046: 'default',
    5047: 'medical',
    5051: 'default',
    5065: 'default',
    5072: 'default',
    5074: 'default',
    5085: 'default',
    5094: 'diamond-ring',
    5099: 'default',
    5111: 'default',
    5122: 'medical',
    5131: 'default',
    5137: 'shirt',
    5139: 'shoes',
    5169: 'gas',
    5172: 'gas',
    5192: 'books',
    5193: 'plant',
    5198: 'repair',
    5199: 'repair',
    5200: 'repair',
    5211: 'repair',
    5231: 'repair',
    5251: 'default',
    5261: 'plant',
    5271: 'bus',
    5300: 'purchase',
    5309: 'purchase',
    5310: 'purchase',
    5311: 'purchase',
    5331: 'purchase',
    5399: 'purchase',
    5411: 'food',
    5422: 'food',
    5441: 'food',
    5451: 'food',
    5462: 'food',
    5499: 'food',
    5511: 'car',
    5521: 'car',
    5531: 'car',
    5532: 'car',
    5533: 'car',
    5541: 'gas',
    5542: 'gas',
    5551: 'boat',
    5561: 'motorcycle',
    5571: 'motorcycle',
    5592: 'default',
    5598: 'default',
    5599: 'car',
    5611: 'shirt',
    5621: 'shirt',
    5631: 'shirt',
    5641: 'shirt',
    5651: 'shirt',
    5655: 'shirt',
    5661: 'shoes',
    5681: 'default',
    5691: 'shirt',
    5697: 'default',
    5698: 'default',
    5699: 'default',
    5712: 'default',
    5713: 'default',
    5714: 'default',
    5718: 'default',
    5719: 'default',
    5722: 'default',
    5732: 'computer',
    5733: 'music',
    5734: 'computer',
    5735: 'music',
    5811: 'food',
    5812: 'food',
    5813: 'cocktail',
    5814: 'food',
    5815: 'books',
    5816: 'computer',
    5817: 'default',
    5818: 'default',
    5832: 'default',
    5912: 'medical',
    5921: 'cocktail',
    5931: 'default',
    5932: 'default',
    5933: 'default',
    5935: 'default',
    5937: 'default',
    5940: 'bicycle',
    5941: 'bicycle',
    5942: 'books',
    5943: 'default',
    5944: 'clock',
    5945: 'toy',
    5946: 'camera',
    5947: 'default',
    5948: 'default',
    5949: 'default',
    5950: 'default',
    5960: 'default',
    5961: 'mail',
    5962: 'telephone',
    5963: 'default',
    5964: 'telephone',
    5965: 'telephone',
    5966: 'telephone',
    5967: 'telephone',
    5968: 'telephone',
    5969: 'telephone',
    5970: 'art',
    5971: 'art',
    5972: 'coins',
    5973: 'default',
    5975: 'default',
    5976: 'default',
    5977: 'default',
    5978: 'default',
    5983: 'gas',
    5992: 'plant',
    5993: 'default',
    5994: 'newspaper',
    5995: 'pet',
    5996: 'cocktail',
    5997: 'purchase',
    5998: 'tent',
    5999: 'money',
    6010: 'money',
    6011: 'money',
    6012: 'money',
    6051: 'money',
    6211: 'money',
    6300: 'money',
    6381: 'money',
    6399: 'repair',
    6513: 'repair',
    7011: 'hotel',
    7012: 'hotel',
    7032: 'park',
    7033: 'park',
    7210: 'shirt',
    7211: 'shirt',
    7216: 'shirt',
    7217: 'default',
    7221: 'camera',
    7230: 'scissors',
    7251: 'shoe',
    7261: 'sadface',
    7273: 'smiley-face',
    7276: 'money',
    7277: 'people',
    7278: 'people',
    7296: 'shirt',
    7297: 'smiley-face',
    7298: 'smiley-face',
    7299: 'default',
    7311: 'default',
    7321: 'default',
    7332: 'computer',
    7333: 'camera',
    7338: 'computer',
    7339: 'people',
    7342: 'bug',
    7349: 'default',
    7361: 'people',
    7372: 'computer',
    7375: 'computer',
    7379: 'computer',
    7392: 'people',
    7393: 'search',
    7394: 'default',
    7395: 'car',
    7399: 'car',
    7511: 'truck',
    7512: 'car',
    7513: 'truck',
    7519: 'truck',
    7523: 'car',
    7531: 'car',
    7534: 'car',
    7535: 'car',
    7538: 'car',
    7542: 'car',
    7549: 'truck',
    7622: 'television',
    7623: 'default',
    7629: 'default',
    7631: 'watch',
    7641: 'furniture',
    7692: 'default',
    7699: 'default',
    7800: 'money',
    7801: 'money',
    7802: 'money',
    7829: 'money',
    7832: 'film',
    7841: 'film',
    7911: 'music',
    7922: 'ticket',
    7929: 'ticket',
    7932: 'music',
    7933: 'bowling',
    7941: 'football',
    7991: 'people',
    7992: 'golf',
    7993: 'game',
    7994: 'game',
    7995: 'coins',
    7996: 'ticket',
    7997: 'money',
    7998: 'ticket',
    7999: 'people',
    8011: 'medical',
    8021: 'medical',
    8031: 'medical',
    8041: 'medical',
    8042: 'medical',
    8043: 'medical',
    8044: 'medical',
    8049: 'medical',
    8050: 'medical',
    8062: 'medical',
    8071: 'medical',
    8099: 'medical',
    8111: 'law',
    8211: 'books',
    8220: 'books',
    8241: 'books',
    8244: 'books',
    8249: 'books',
    8299: 'people',
    8351: 'people',
    8398: 'people',
    8641: 'people',
    8651: 'people',
    8661: 'people',
    8675: 'car',
    8699: 'people',
    8734: 'medical',
    8911: 'tree',
    8931: 'books',
    8999: 'suitcase',
    9211: 'law',
    9222: 'law',
    9223: 'law',
    9311: 'law',
    9399: 'default',
    9402: 'mail',
    9405: 'default',
    9700: 'default',
    9701: 'default',
    9702: 'default',
    9950: 'default',
    'bp001': 'bitcoin-topup',
    'bp002': 'default'
  };

  return root;

});

'use strict';
angular.module('copayApp.services')
  .factory('bwcError', function bwcErrorService($log, gettextCatalog) {
    var root = {};

    root.msg = function(err, prefix) {
      if (!err)
        return 'Unknown error';

      var name;

      if (err.name) {
        if (err.name == 'Error')
          name = err.message
        else
          name = err.name.replace(/^bwc.Error/g, '');
      } else
        name = err;

      var body = '';
      prefix = prefix || '';

      if (name) {
        switch (name) {
          case 'INVALID_BACKUP':
            body = gettextCatalog.getString('Wallet Recovery Phrase is invalid');
            break;
          case 'WALLET_DOES_NOT_EXIST':
            body = gettextCatalog.getString('Wallet not registered at the wallet service. Recreate it from "Create Wallet" using "Advanced Options" to set your recovery phrase');
            break;
          case 'MISSING_PRIVATE_KEY':
            body = gettextCatalog.getString('Missing private keys to sign');
            break;
          case 'ENCRYPTED_PRIVATE_KEY':
            body = gettextCatalog.getString('Private key is encrypted, cannot sign');
            break;
          case 'SERVER_COMPROMISED':
            body = gettextCatalog.getString('Server response could not be verified');
            break;
          case 'COULD_NOT_BUILD_TRANSACTION':
            body = gettextCatalog.getString('Could not build transaction');
            break;
          case 'INSUFFICIENT_FUNDS':
            body = gettextCatalog.getString('Insufficient funds');
            break;
          case 'CONNECTION_ERROR':
            body = gettextCatalog.getString('Network connection error');
            break;
          case 'NOT_FOUND':
            body = gettextCatalog.getString('Wallet service not found');
            break;
          case 'ECONNRESET_ERROR':
            body = gettextCatalog.getString('Connection reset by peer');
            break;
          case 'BAD_RESPONSE_CODE':
            body = gettextCatalog.getString('The request could not be understood by the server');
            break;
          case 'WALLET_ALREADY_EXISTS':
            body = gettextCatalog.getString('Wallet already exists');
            break;
          case 'COPAYER_IN_WALLET':
            body = gettextCatalog.getString('Copayer already in this wallet');
            break;
          case 'WALLET_FULL':
            body = gettextCatalog.getString('Wallet is full');
            break;
          case 'WALLET_NOT_FOUND':
            body = gettextCatalog.getString('Wallet not found');
            break;
          case 'INSUFFICIENT_FUNDS_FOR_FEE':
            body = gettextCatalog.getString('Insufficient funds for fee');
            break;
          case 'LOCKED_FUNDS':
            body = gettextCatalog.getString('Funds are locked by pending spend proposals');
            break;
          case 'COPAYER_VOTED':
            body = gettextCatalog.getString('Copayer already voted on this spend proposal');
            break;
          case 'NOT_AUTHORIZED':
            body = gettextCatalog.getString('Not authorized');
            break;
          case 'TX_ALREADY_BROADCASTED':
            body = gettextCatalog.getString('Transaction already broadcasted');
            break;
          case 'TX_CANNOT_CREATE':
            body = gettextCatalog.getString('Locktime in effect. Please wait to create a new spend proposal');
            break;
          case 'TX_CANNOT_REMOVE':
            body = gettextCatalog.getString('Locktime in effect. Please wait to remove this spend proposal');
            break;
          case 'TX_NOT_ACCEPTED':
            body = gettextCatalog.getString('Spend proposal is not accepted');
            break;
          case 'TX_NOT_FOUND':
            body = gettextCatalog.getString('Spend proposal not found');
            break;
          case 'TX_NOT_PENDING':
            body = gettextCatalog.getString('The spend proposal is not pending');
            break;
          case 'UPGRADE_NEEDED':
            body = gettextCatalog.getString('Please upgrade Copay to perform this action');
            break;
          case 'BAD_SIGNATURES':
            body = gettextCatalog.getString('Signatures rejected by server');
            break;
          case 'COPAYER_DATA_MISMATCH':
            body = gettextCatalog.getString('Copayer data mismatch');
            break;
          case 'DUST_AMOUNT':
            body = gettextCatalog.getString('Amount below minimum allowed');
            break;
          case 'INCORRECT_ADDRESS_NETWORK':
            body = gettextCatalog.getString('Incorrect address network');
            break;
          case 'COPAYER_REGISTERED':
            body = gettextCatalog.getString('Key already associated with an existing wallet');
            break;
          case 'INVALID_ADDRESS':
            body = gettextCatalog.getString('Invalid address');
            break;
          case 'MAIN_ADDRESS_GAP_REACHED':
            body = gettextCatalog.getString('Empty addresses limit reached. New addresses cannot be generated.');
            break;
          case 'WALLET_LOCKED':
            body = gettextCatalog.getString('Wallet is locked');
            break;
          case 'WALLET_NOT_COMPLETE':
            body = gettextCatalog.getString('Wallet is not complete');
            break;
          case 'WALLET_NEEDS_BACKUP':
            body = gettextCatalog.getString('Wallet needs backup');
            break;
          case 'MISSING_PARAMETER':
            body = gettextCatalog.getString('Missing parameter');
            break;
          case 'NO_PASSWORD_GIVEN':
            body = gettextCatalog.getString('Spending Password needed');
            break;
          case 'PASSWORD_INCORRECT':
            body = gettextCatalog.getString('Wrong spending password');
            break;
          case 'EXCEEDED_DAILY_LIMIT':
            body = gettextCatalog.getString('Exceeded daily limit of $500 per user');
            break;
          case 'ERROR':
            body = (err.message || err.error);
            break;

          default:
            $log.warn('Unknown error type:', name);
            body = err.message || name;
            break;
        }
      } else if (err.message) {
        body = err.message;
      } else {
        body = err;
      }

      var msg = prefix + (body ? (prefix ? ': ' : '') + body : '');
      return msg;
    };

    root.cb = function(err, prefix, cb) {
      return cb(root.msg(err, prefix));
    };

    return root;
  });

'use strict';

angular.module('copayApp.services').factory('coinbaseService', function($http, $log, platformInfo, lodash, storageService, configService) {
  var root = {};
  var credentials = {};
  var isCordova = platformInfo.isCordova;

  root.setCredentials = function(network) {
    credentials.SCOPE = ''
      + 'wallet:accounts:read,'
      + 'wallet:addresses:read,'
      + 'wallet:addresses:create,'
      + 'wallet:user:read,'
      + 'wallet:user:email,'
      + 'wallet:buys:read,'
      + 'wallet:buys:create,'
      + 'wallet:sells:read,'
      + 'wallet:sells:create,'
      + 'wallet:transactions:read,'
      + 'wallet:transactions:send,'
      + 'wallet:payment-methods:read';

    if (isCordova) {
      credentials.REDIRECT_URI = 'copay://coinbase';
    } else {
      credentials.REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';
    }

    if (network == 'testnet') {
      credentials.HOST = 'https://sandbox.coinbase.com';
      credentials.API = 'https://api.sandbox.coinbase.com';
      credentials.CLIENT_ID = '6cdcc82d5d46654c46880e93ab3d2a43c639776347dd88022904bd78cd067841';
      credentials.CLIENT_SECRET = '228cb6308951f4b6f41ba010c7d7981b2721a493c40c50fd2425132dcaccce59';
    }
    else {
      credentials.HOST = 'https://coinbase.com';
      credentials.API = 'https://api.coinbase.com';
      credentials.CLIENT_ID = window.coinbase_client_id;
      credentials.CLIENT_SECRET = window.coinbase_client_secret;
    };
  };

  root.getOauthCodeUrl = function() {
    return credentials.HOST
      + '/oauth/authorize?response_type=code&client_id='
      + credentials.CLIENT_ID
      + '&redirect_uri='
      + credentials.REDIRECT_URI
      + '&state=SECURE_RANDOM&scope='
      + credentials.SCOPE
      + '&meta[send_limit_amount]=1000&meta[send_limit_currency]=USD&meta[send_limit_period]=day';
  };

  root.getToken = function(code, cb) {
    var req = {
      method: 'POST',
      url: credentials.API + '/oauth/token',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: {
        grant_type : 'authorization_code',
        code: code,
        client_id : credentials.CLIENT_ID,
        client_secret: credentials.CLIENT_SECRET,
        redirect_uri: credentials.REDIRECT_URI
      }
    };

    $http(req).then(function(data) {
      $log.info('Coinbase Authorization Access Token: SUCCESS');
      // Show pending task from the UI
      storageService.setNextStep('BuyAndSell', true, function(err) {});
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Authorization Access Token: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.refreshToken = function(refreshToken, cb) {
    var req = {
      method: 'POST',
      url: credentials.API + '/oauth/token',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: {
        grant_type : 'refresh_token',
        client_id : credentials.CLIENT_ID,
        client_secret: credentials.CLIENT_SECRET,
        redirect_uri: credentials.REDIRECT_URI,
        refresh_token: refreshToken
      }
    };

    $http(req).then(function(data) {
      $log.info('Coinbase Refresh Access Token: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Refresh Access Token: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  var _get = function(endpoint, token) {
    return {
      method: 'GET',
      url: credentials.API + '/v2' + endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    };
  };

  root.getAccounts = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/accounts', token)).then(function(data) {
      $log.info('Coinbase Get Accounts: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Get Accounts: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.getAccount = function(token, accountId, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/accounts/' + accountId, token)).then(function(data) {
      $log.info('Coinbase Get Account: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Get Account: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.getAuthorizationInformation = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/auth', token)).then(function(data) {
      $log.info('Coinbase Autorization Information: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Autorization Information: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.getCurrentUser = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user', token)).then(function(data) {
      $log.info('Coinbase Get Current User: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Get Current User: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.getTransaction = function(token, accountId, transactionId, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/accounts/' + accountId + '/transactions/' + transactionId, token)).then(function(data) {
      $log.info('Coinbase Transaction: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Transaction: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.getTransactions = function(token, accountId, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/accounts/' + accountId + '/transactions', token)).then(function(data) {
      $log.info('Coinbase Transactions: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Transactions: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.paginationTransactions = function(token, Url, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get(Url.replace('/v2', ''), token)).then(function(data) {
      $log.info('Coinbase Pagination Transactions: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Pagination Transactions: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.sellPrice = function(token, currency, cb) {
    $http(_get('/prices/sell?currency=' + currency, token)).then(function(data) {
      $log.info('Coinbase Sell Price: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Sell Price: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.buyPrice = function(token, currency, cb) {
    $http(_get('/prices/buy?currency=' + currency, token)).then(function(data) {
      $log.info('Coinbase Buy Price: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Buy Price: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.getPaymentMethods = function(token, cb) {
    $http(_get('/payment-methods', token)).then(function(data) {
      $log.info('Coinbase Get Payment Methods: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Get Payment Methods: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.getPaymentMethod = function(token, paymentMethodId, cb) {
    $http(_get('/payment-methods/' + paymentMethodId, token)).then(function(data) {
      $log.info('Coinbase Get Payment Method: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Get Payment Method: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  var _post = function(endpoint, token, data) {
    return {
      method: 'POST',
      url: credentials.API + '/v2' + endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      data: data
    };
  };

  root.sellRequest = function(token, accountId, data, cb) {
    var data = {
      amount: data.amount,
      currency: data.currency,
      payment_method: data.payment_method || null,
      commit: data.commit || false
    };
    $http(_post('/accounts/' + accountId + '/sells', token, data)).then(function(data) {
      $log.info('Coinbase Sell Request: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Sell Request: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.sellCommit = function(token, accountId, sellId, cb) {
    $http(_post('/accounts/' + accountId + '/sells/' + sellId + '/commit', token)).then(function(data) {
      $log.info('Coinbase Sell Commit: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Sell Commit: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.buyRequest = function(token, accountId, data, cb) {
    var data = {
      amount: data.amount,
      currency: data.currency,
      payment_method: data.payment_method || null,
      commit: false
    };
    $http(_post('/accounts/' + accountId + '/buys', token, data)).then(function(data) {
      $log.info('Coinbase Buy Request: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Buy Request: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.buyCommit = function(token, accountId, buyId, cb) {
    $http(_post('/accounts/' + accountId + '/buys/' + buyId + '/commit', token)).then(function(data) {
      $log.info('Coinbase Buy Commit: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Buy Commit: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.createAddress = function(token, accountId, data, cb) {
    var data = {
      name: data.name
    };
    $http(_post('/accounts/' + accountId + '/addresses', token, data)).then(function(data) {
      $log.info('Coinbase Create Address: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Create Address: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.sendTo = function(token, accountId, data, cb) {
    var data = {
      type: 'send',
      to: data.to,
      amount: data.amount,
      currency: data.currency,
      description: data.description
    };
    $http(_post('/accounts/' + accountId + '/transactions', token, data)).then(function(data) {
      $log.info('Coinbase Create Address: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Create Address: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  // Pending transactions

  root.savePendingTransaction = function(ctx, opts, cb) {
    var network = configService.getSync().coinbase.testnet ? 'testnet' : 'livenet';
    storageService.getCoinbaseTxs(network, function(err, oldTxs) {
      if (lodash.isString(oldTxs)) {
        oldTxs = JSON.parse(oldTxs);
      }
      if (lodash.isString(ctx)) {
        ctx = JSON.parse(ctx);
      }
      var tx = oldTxs || {};
      tx[ctx.id] = ctx;
      if (opts && (opts.error || opts.status)) {
        tx[ctx.id] = lodash.assign(tx[ctx.id], opts);
      }
      if (opts && opts.remove) {
        delete(tx[ctx.id]);
      }
      tx = JSON.stringify(tx);

      storageService.setCoinbaseTxs(network, tx, function(err) {
        return cb(err);
      });
    });
  };

  root.getPendingTransactions = function(cb) {
    var network = configService.getSync().coinbase.testnet ? 'testnet' : 'livenet';
    storageService.getCoinbaseTxs(network, function(err, txs) {
      var _txs = txs ? JSON.parse(txs) : {};
      return cb(err, _txs);
    });
  };

  root.logout = function(network, cb) {
    storageService.removeCoinbaseToken(network, function() {
      storageService.removeCoinbaseRefreshToken(network, function() {
        return cb();
      });
    });
  };

  return root;

});

'use strict';

angular.module('copayApp.services').factory('configService', function(storageService, lodash, $log, $timeout, $rootScope) {
  var root = {};

  var defaultConfig = {
    // wallet limits
    limits: {
      totalCopayers: 6,
      mPlusN: 100,
    },

    // Bitcore wallet service URL
    bws: {
      url: 'https://bws.bitpay.com/bws/api',
    },

    // wallet default config
    wallet: {
      requiredCopayers: 2,
      totalCopayers: 3,
      spendUnconfirmed: false,
      reconnectDelay: 5000,
      idleDurationMin: 4,
      settings: {
        unitName: 'bits',
        unitToSatoshi: 100,
        unitDecimals: 2,
        unitCode: 'bit',
        alternativeName: 'US Dollar',
        alternativeIsoCode: 'USD',
      }
    },

    // External services
    glidera: {
      enabled: true,
      testnet: false
    },

    coinbase: {
      enabled: true,
      testnet: false
    },

    rates: {
      url: 'https://insight.bitpay.com:443/api/rates',
    },

    release: {
      url: 'https://api.github.com/repos/bitpay/copay/releases/latest'
    },

    pushNotifications: {
      enabled: true,
      config: {
        android: {
          senderID: '1036948132229',
          icon: 'push',
          iconColor: '#2F4053'
        },
        ios: {
          alert: 'true',
          badge: 'true',
          sound: 'true',
        },
        windows: {},
      }
    },
  };

  var configCache = null;


  root.getSync = function() {
    if (!configCache)
      throw new Error('configService#getSync called when cache is not initialized');

    return configCache;
  };

  root._queue = [];
  root.whenAvailable = function(cb) {
    if (!configCache) {
      root._queue.push(cb);
      return;
    }
    return cb(configCache);
  };


  root.get = function(cb) {

    storageService.getConfig(function(err, localConfig) {
      if (localConfig) {
        configCache = JSON.parse(localConfig);

        //these ifs are to avoid migration problems
        if (!configCache.bws) {
          configCache.bws = defaultConfig.bws;
        }
        if (!configCache.wallet) {
          configCache.wallet = defaultConfig.wallet;
        }
        if (!configCache.wallet.settings.unitCode) {
          configCache.wallet.settings.unitCode = defaultConfig.wallet.settings.unitCode;
        }
        if (!configCache.glidera) {
          configCache.glidera = defaultConfig.glidera;
        }
        if (!configCache.coinbase) {
          configCache.coinbase = defaultConfig.coinbase;
        }
        if (!configCache.pushNotifications) {
          configCache.pushNotifications = defaultConfig.pushNotifications;
        }

      } else {
        configCache = lodash.clone(defaultConfig);
      };

      configCache.bwsFor = configCache.bwsFor || {};
      configCache.colorFor = configCache.colorFor || {};
      configCache.aliasFor = configCache.aliasFor || {};
      configCache.emailFor = configCache.emailFor || {};

      // Coinbase
      // Disabled for testnet
      configCache.coinbase.testnet = false;

      $log.debug('Preferences read:', configCache)

      lodash.each(root._queue, function(x) {
        $timeout(function() {
          return x(configCache);
        }, 1);
      });
      root._queue = [];

      return cb(err, configCache);
    });
  };

  root.set = function(newOpts, cb) {
    var config = lodash.cloneDeep(defaultConfig);
    storageService.getConfig(function(err, oldOpts) {
      oldOpts = oldOpts || {};

      if (lodash.isString(oldOpts)) {
        oldOpts = JSON.parse(oldOpts);
      }
      if (lodash.isString(config)) {
        config = JSON.parse(config);
      }
      if (lodash.isString(newOpts)) {
        newOpts = JSON.parse(newOpts);
      }

      lodash.merge(config, oldOpts, newOpts);
      configCache = config;

      $rootScope.$emit('Local/SettingsUpdated');

      storageService.storeConfig(JSON.stringify(config), cb);
    });
  };

  root.reset = function(cb) {
    configCache = lodash.clone(defaultConfig);
    storageService.removeConfig(cb);
  };

  root.getDefaults = function() {
    return lodash.clone(defaultConfig);
  };


  return root;
});


'use strict';

angular.module('copayApp.services').factory('confirmDialog', function($log, $timeout, profileService, configService, gettextCatalog, platformInfo) {
  var root = {};


  var acceptMsg = gettextCatalog.getString('Accept');
  var cancelMsg = gettextCatalog.getString('Cancel');
  var confirmMsg = gettextCatalog.getString('Confirm');

  root.show = function(msg, cb) {
    if (platformInfo.isCordova) { 
      navigator.notification.confirm(
        msg,
        function(buttonIndex) {
          if (buttonIndex == 1) {
            $timeout(function() {
              return cb(true);
            }, 1);
          } else {
            return cb(false);
          }
        },
        confirmMsg, [acceptMsg, cancelMsg]
      );
    } else if (platformInfo.isChromeApp) {
      // No feedback, alert/confirm not supported.
      return cb(true);
    } else {
      return cb(confirm(msg));
    }
  };

  return root;
});


'use strict';

angular.module('copayApp.services').factory('derivationPathHelper', function(lodash) {
  var root = {};

  root.default = "m/44'/0'/0'";
  root.defaultTestnet = "m/44'/1'/0'";

  root.parse = function(str) {
    var arr = str.split('/');

    var ret = {};

    if (arr[0] != 'm')
      return false;

    switch (arr[1]) {
      case "44'":
        ret.derivationStrategy = 'BIP44';
        break;
      case "45'":
        return {
          derivationStrategy: 'BIP45',
          networkName: 'livenet',
          account: 0,
        }
        break;
      case "48'":
        ret.derivationStrategy = 'BIP48';
        break;
      default:
        return false;
    };

    switch (arr[2]) {
      case "0'":
        ret.networkName = 'livenet';
        break;
      case "1'":
        ret.networkName = 'testnet';
        break;
      default:
        return false;
    };

    var match = arr[3].match(/(\d+)'/);
    if (!match)
      return false;
    ret.account = +match[1]

    return ret;
  };

  return root;
});

'use strict';

angular.module('copayApp.services').service('externalLinkService', function(platformInfo, nodeWebkitService) {

  this.open = function(url, target) {
    if (platformInfo.isNW) {
      nodeWebkitService.openExternalLink(url);
    } else {
      target = target || '_blank';
      var ref = window.open(url, target, 'location=no');
    }
  };

});

'use strict';

angular.module('copayApp.services').factory('feeService', function($log, $stateParams, bwcService, walletService, configService, gettext, lodash, txFormatService) {
  var root = {};

  // Constant fee options to translate
  root.feeOpts = {
    priority: gettext('Priority'),
    normal: gettext('Normal'),
    economy: gettext('Economy'),
    superEconomy: gettext('Super Economy')
  };

  root.getCurrentFeeLevel = function() {
    return configService.getSync().wallet.settings.feeLevel || 'normal';
  };

  root.getCurrentFeeValue = function(cb) {
    console.log('[feeService.js.18:getCurrentFeeValue:] TODO TODO TODO'); //TODO
    // TODO TODO TODO
    var wallet = profileService.getWallet($stateParams.walletId);
    var feeLevel = root.getCurrentFeeLevel();

    wallet.getFeeLevels(wallet.credentials.network, function(err, levels) {
      if (err)
        return cb({
          message: 'Could not get dynamic fee'
        });

      var feeLevelValue = lodash.find(levels, {
        level: feeLevel
      });
      if (!feeLevelValue || !feeLevelValue.feePerKB)
        return cb({
          message: 'Could not get dynamic fee for level: ' + feeLevel
        });

      var fee = feeLevelValue.feePerKB;
      $log.debug('Dynamic fee: ' + feeLevel + ' ' + fee + ' SAT');
      return cb(null, fee);
    });
  };

  root.getFeeLevels = function(cb) {
    var walletClient = bwcService.getClient();

    var unitName = configService.getSync().wallet.settings.unitName;

    walletClient.getFeeLevels('livenet', function(errLivenet, levelsLivenet) {
      walletClient.getFeeLevels('testnet', function(errTestnet, levelsTestnet) {
        if (errLivenet || errTestnet) $log.debug('Could not get dynamic fee');
        else {
          for (var i = 0; i < 4; i++) {
            levelsLivenet[i]['feePerKBUnit'] = txFormatService.formatAmount(levelsLivenet[i].feePerKB) + ' ' + unitName;
            levelsTestnet[i]['feePerKBUnit'] = txFormatService.formatAmount(levelsTestnet[i].feePerKB) + ' ' + unitName;
          }
        }

        return cb({
          'livenet': levelsLivenet,
          'testnet': levelsTestnet
        });
      });
    });
  };

  return root;
});

'use strict';

angular.module('copayApp.services')
  .factory('fileStorageService', function(lodash, $log) {
    var root = {},
      _fs, _dir;

    root.init = function(cb) {
      if (_dir) return cb(null, _fs, _dir);

      function onFileSystemSuccess(fileSystem) {
        console.log('File system started: ', fileSystem.name, fileSystem.root.name);
        _fs = fileSystem;
        root.getDir(function(err, newDir) {
          if (err || !newDir.nativeURL) return cb(err);
          _dir = newDir
          $log.debug("Got main dir:", _dir.nativeURL);
          return cb(null, _fs, _dir);
        });
      }

      function fail(evt) {
        var msg = 'Could not init file system: ' + evt.target.error.code;
        console.log(msg);
        return cb(msg);
      };

      window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFileSystemSuccess, fail);
    };

    root.get = function(k, cb) {
      root.init(function(err, fs, dir) {
        if (err) return cb(err);
        dir.getFile(k, {
          create: false,
        }, function(fileEntry) {
          if (!fileEntry) return cb();
          fileEntry.file(function(file) {
            var reader = new FileReader();

            reader.onloadend = function(e) {
              return cb(null, this.result)
            }

            reader.readAsText(file);
          });
        }, function(err) {
          // Not found
          if (err.code == 1) return cb();
          else return cb(err);
        });
      })
    };

    var writelock = {};

    root.set = function(k, v, cb, delay) {

      delay = delay || 100;

      if (writelock[k]) {
        return setTimeout(function() {
          console.log('## Writelock for:' + k + ' Retrying in ' + delay);
          return root.set(k, v, cb, delay + 100);
        }, delay);
      }

      writelock[k] = true;
      root.init(function(err, fs, dir) {
        if (err) {
          writelock[k] = false;
          return cb(err);
        }
        dir.getFile(k, {
          create: true,
        }, function(fileEntry) {
          // Create a FileWriter object for our FileEntry (log.txt).
          fileEntry.createWriter(function(fileWriter) {

            fileWriter.onwriteend = function(e) {
              console.log('Write completed:' + k);
              writelock[k] = false;
              return cb();
            };

            fileWriter.onerror = function(e) {
              var err = e.error ? e.error : JSON.stringify(e);
              console.log('Write failed: ' + err);
              writelock[k] = false;
              return cb('Fail to write:' + err);
            };

            if (lodash.isObject(v))
              v = JSON.stringify(v);

            if (!lodash.isString(v)) {
              v = v.toString();
            }

            $log.debug('Writing:', k, v);
            fileWriter.write(v);

          }, cb);
        });
      });
    };


    // See https://github.com/apache/cordova-plugin-file/#where-to-store-files
    root.getDir = function(cb) {
      if (!cordova.file) {
        return cb('Could not write on device storage');
      }

      var url = cordova.file.dataDirectory;
      // This could be needed for windows
      // if (cordova.file === undefined) {
      //   url = 'ms-appdata:///local/';
      window.resolveLocalFileSystemURL(url, function(dir) {
        return cb(null, dir);
      }, function(err) {
        $log.warn(err);
        return cb(err || 'Could not resolve filesystem:' + url);
      });
    };

    root.remove = function(k, cb) {
      root.init(function(err, fs, dir) {
        if (err) return cb(err);
        dir.getFile(k, {
          create: false,
        }, function(fileEntry) {
          // Create a FileWriter object for our FileEntry (log.txt).
          fileEntry.remove(function() {
            console.log('File removed.');
            return cb();
          }, cb);
        }, cb);
      });
    };

    /**
     * Same as setItem, but fails if an item already exists
     */
    root.create = function(name, value, callback) {
      root.get(name,
        function(err, data) {
          if (data) {
            return callback('EEXISTS');
          } else {
            return root.set(name, value, callback);
          }
        });
    };

    return root;
  });

'use strict';

angular.module('copayApp.services').factory('fingerprintService', function($log, gettextCatalog, configService, platformInfo) {
  var root = {};

  var _isAvailable = false;

  if (platformInfo.isCordova && !platformInfo.isWP) {
    window.plugins.touchid = window.plugins.touchid || {};
    window.plugins.touchid.isAvailable(
      function(msg) {
        _isAvailable = 'IOS';
      },
      function(msg) {
        FingerprintAuth.isAvailable(function(result) {

          if (result.isAvailable) 
            _isAvailable = 'ANDROID';

        }, function() {
          _isAvailable = false;
        });
      });
  };

  var requestFinger = function(cb) {
    try {
      FingerprintAuth.show({
          clientId: 'Copay',
          clientSecret: 'hVu1NvCZOyUuGgr46bFL',
        },
        function(result) {
          if (result.withFingerprint) {
            $log.debug('Finger OK');
            return cb();
          } else if (result.withPassword) {
            $log.debug("Finger: Authenticated with backup password");
            return cb();
          }
        },
        function(msg) {
          $log.debug('Finger Failed:' + JSON.stringify(msg));
          return cb(gettextCatalog.getString('Finger Scan Failed') + ': ' + msg.localizedDescription);
        }
      );
    } catch (e) {
      $log.warn('Finger Scan Failed:' + JSON.stringify(e));
      return cb(gettextCatalog.getString('Finger Scan Failed'));
    };
  };


  var requestTouchId = function(cb) {
    try {
      window.plugins.touchid.verifyFingerprint(
        gettextCatalog.getString('Scan your fingerprint please'),
        function(msg) {
          $log.debug('Touch ID OK');
          return cb();
        },
        function(msg) {
          $log.debug('Touch ID Failed:' + JSON.stringify(msg));
          return cb(gettextCatalog.getString('Touch ID Failed') + ': ' + msg.localizedDescription);
        }
      );
    } catch (e) {
      $log.debug('Touch ID Failed:' + JSON.stringify(e));
      return cb(gettextCatalog.getString('Touch ID Failed'));
    };
  };

  var isNeeded = function(client) {
    if (!_isAvailable) return false;

    var config = configService.getSync();
    config.touchIdFor = config.touchIdFor || {};

    return config.touchIdFor[client.credentials.walletId];
  };

  root.isAvailable = function(client) {
    return _isAvailable;
  };

  root.check = function(client, cb) {
    if (isNeeded(client)) {
      $log.debug('FingerPrint Service:', _isAvailable); 
      if (_isAvailable == 'IOS')
        return requestTouchId(cb);
      else
        return requestFinger(cb);
    } else {
      return cb();
    }
  };

  return root;
});

'use strict';

angular.module('copayApp.services').factory('glideraService', function($http, $log, $window, platformInfo, storageService) {
  var root = {};
  var credentials = {};
  var isCordova = platformInfo.isCordova;

  var _setCredentials = function() {
    if (!$window.externalServices || !$window.externalServices.glidera) {
      return;
    }

    var glidera = $window.externalServices.glidera;

    /*
     * Development: 'testnet'
     * Production: 'livenet'
     */
    credentials.NETWORK = 'livenet';

    if (credentials.NETWORK == 'testnet') {
      credentials.HOST = glidera.sandbox.host;
      if (isCordova) {
        credentials.REDIRECT_URI = glidera.sandbox.mobile.redirect_uri;
        credentials.CLIENT_ID = glidera.sandbox.mobile.client_id;
        credentials.CLIENT_SECRET = glidera.sandbox.mobile.client_secret;
      } else {
        credentials.REDIRECT_URI = glidera.sandbox.desktop.redirect_uri;
        credentials.CLIENT_ID = glidera.sandbox.desktop.client_id;
        credentials.CLIENT_SECRET = glidera.sandbox.desktop.client_secret;
      }
    } else {
      credentials.HOST = glidera.production.host;
      if (isCordova) {
        credentials.REDIRECT_URI = glidera.production.mobile.redirect_uri;
        credentials.CLIENT_ID = glidera.production.mobile.client_id;
        credentials.CLIENT_SECRET = glidera.production.mobile.client_secret;
      } else {
        credentials.REDIRECT_URI = glidera.production.desktop.redirect_uri;
        credentials.CLIENT_ID = glidera.production.desktop.client_id;
        credentials.CLIENT_SECRET = glidera.production.desktop.client_secret;
      }
    };
  };

  root.getEnvironment = function() {
    _setCredentials();
    return credentials.NETWORK;
  };

  root.getOauthCodeUrl = function() {
    _setCredentials();
    return credentials.HOST + '/oauth2/auth?response_type=code&client_id=' + credentials.CLIENT_ID + '&redirect_uri=' + credentials.REDIRECT_URI;
  };

  root.removeToken = function(cb) {
    _setCredentials();
    storageService.removeGlideraToken(credentials.NETWORK, function() {
      return cb();
    });
  };

  root.getToken = function(code, cb) {
    _setCredentials();
    var req = {
      method: 'POST',
      url: credentials.HOST + '/api/v1/oauth/token',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: {
        grant_type: 'authorization_code',
        code: code,
        client_id: credentials.CLIENT_ID,
        client_secret: credentials.CLIENT_SECRET,
        redirect_uri: credentials.REDIRECT_URI
      }
    };

    $http(req).then(function(data) {
      $log.info('Glidera Authorization Access Token: SUCCESS');
      // Show pending task from the UI
      storageService.setNextStep('BuyAndSell', true, function(err) {});
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Authorization Access Token: ERROR ' + data.statusText);
      return cb('Glidera Authorization Access Token: ERROR ' + data.statusText);
    });
  };

  var _get = function(endpoint, token) {
    _setCredentials();
    return {
      method: 'GET',
      url: credentials.HOST + '/api/v1' + endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    };
  };

  root.getAccessTokenPermissions = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/oauth/token', token)).then(function(data) {
      $log.info('Glidera Access Token Permissions: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Access Token Permissions: ERROR ' + data.statusText);
      return cb('Glidera Access Token Permissions: ERROR ' + data.statusText);
    });
  };

  root.getEmail = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/email', token)).then(function(data) {
      $log.info('Glidera Get Email: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Get Email: ERROR ' + data.statusText);
      return cb('Glidera Get Email: ERROR ' + data.statusText);
    });
  };

  root.getPersonalInfo = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/personalinfo', token)).then(function(data) {
      $log.info('Glidera Get Personal Info: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Get Personal Info: ERROR ' + data.statusText);
      return cb('Glidera Get Personal Info: ERROR ' + data.statusText);
    });
  };

  root.getStatus = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/status', token)).then(function(data) {
      $log.info('Glidera User Status: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera User Status: ERROR ' + data.statusText);
      return cb('Glidera User Status: ERROR ' + data.statusText);
    });
  };

  root.getLimits = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/limits', token)).then(function(data) {
      $log.info('Glidera Transaction Limits: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Transaction Limits: ERROR ' + data.statusText);
      return cb('Glidera Transaction Limits: ERROR ' + data.statusText);
    });
  };

  root.getTransactions = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/transaction', token)).then(function(data) {
      $log.info('Glidera Transactions: SUCCESS');
      return cb(null, data.data.transactions);
    }, function(data) {
      $log.error('Glidera Transactions: ERROR ' + data.statusText);
      return cb('Glidera Transactions: ERROR ' + data.statusText);
    });
  };

  root.getTransaction = function(token, txid, cb) {
    if (!token) return cb('Invalid Token');
    if (!txid) return cb('TxId required');
    $http(_get('/transaction/' + txid, token)).then(function(data) {
      $log.info('Glidera Transaction: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Transaction: ERROR ' + data.statusText);
      return cb('Glidera Transaction: ERROR ' + data.statusText);
    });
  };

  root.getSellAddress = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/create_sell_address', token)).then(function(data) {
      $log.info('Glidera Create Sell Address: SUCCESS');
      return cb(null, data.data.sellAddress);
    }, function(data) {
      $log.error('Glidera Create Sell Address: ERROR ' + data.statusText);
      return cb('Glidera Create Sell Address: ERROR ' + data.statusText);
    });
  };

  root.get2faCode = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/authentication/get2faCode', token)).then(function(data) {
      $log.info('Glidera Sent 2FA code by SMS: SUCCESS');
      return cb(null, data.status == 200 ? true : false);
    }, function(data) {
      $log.error('Glidera Sent 2FA code by SMS: ERROR ' + data.statusText);
      return cb('Glidera Sent 2FA code by SMS: ERROR ' + data.statusText);
    });
  };

  var _post = function(endpoint, token, twoFaCode, data) {
    _setCredentials();
    return {
      method: 'POST',
      url: credentials.HOST + '/api/v1' + endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token,
        '2FA_CODE': twoFaCode
      },
      data: data
    };
  };

  root.sellPrice = function(token, price, cb) {
    var data = {
      qty: price.qty,
      fiat: price.fiat
    };
    $http(_post('/prices/sell', token, null, data)).then(function(data) {
      $log.info('Glidera Sell Price: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Sell Price: ERROR ' + data.statusText);
      return cb('Glidera Sell Price: ERROR ' + data.statusText);
    });
  };

  root.sell = function(token, twoFaCode, data, cb) {
    var data = {
      refundAddress: data.refundAddress,
      signedTransaction: data.signedTransaction,
      priceUuid: data.priceUuid,
      useCurrentPrice: data.useCurrentPrice,
      ip: data.ip
    };
    $http(_post('/sell', token, twoFaCode, data)).then(function(data) {
      $log.info('Glidera Sell: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Sell Request: ERROR ' + data.statusText);
      return cb('Glidera Sell Request: ERROR ' + data.statusText);
    });
  };

  root.buyPrice = function(token, price, cb) {
    var data = {
      qty: price.qty,
      fiat: price.fiat
    };
    $http(_post('/prices/buy', token, null, data)).then(function(data) {
      $log.info('Glidera Buy Price: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Buy Price: ERROR ' + data.statusText);
      return cb('Glidera Buy Price: ERROR ' + data.statusText);
    });
  };

  root.buy = function(token, twoFaCode, data, cb) {
    var data = {
      destinationAddress: data.destinationAddress,
      qty: data.qty,
      priceUuid: data.priceUuid,
      useCurrentPrice: data.useCurrentPrice,
      ip: data.ip
    };
    $http(_post('/buy', token, twoFaCode, data)).then(function(data) {
      $log.info('Glidera Buy: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Buy Request: ERROR ' + data.statusText);
      return cb('Glidera Buy Request: ERROR ' + data.statusText);
    });
  };

  root.init = function(accessToken, cb) {
    _setCredentials();
    $log.debug('Init Glidera...');

    var glidera = {
      token: null,
      permissions: null
    }

    var getToken = function(cb) {
      if (accessToken) {
        cb(null, accessToken);
      } else {
        storageService.getGlideraToken(credentials.NETWORK, cb);
      }
    };

    getToken(function(err, accessToken) {
      if (err || !accessToken) return cb();
      else {
        root.getAccessTokenPermissions(accessToken, function(err, p) {
          if (err) {
            return cb(err);
          } else {
            glidera.token = accessToken;
            glidera.permissions = p;
            return cb(null, glidera);
          }
        });
      }
    });
  };

  return root;

});

'use strict';
var logs = [];
angular.module('copayApp.services')
  .factory('historicLog', function historicLog() {
    var root = {};

    root.add = function(level, msg) {
      logs.push({
        level: level,
        msg: msg,
      });
    };

    root.get = function() {
      return logs;
    };

    return root;
  });

'use strict';

angular.module('copayApp.services')
  .factory('hwWallet', function($log,  bwcService) {
    var root = {};

    // Ledger magic number to get xPub without user confirmation
    root.ENTROPY_INDEX_PATH = "0xb11e/";
    root.UNISIG_ROOTPATH = 44;
    root.MULTISIG_ROOTPATH = 48;
    root.LIVENET_PATH = 0;

    root._err = function(data) {
      var msg = 'Hardware Wallet Error: ' + (data.error || data.message || 'unknown');
      $log.warn(msg);
      return msg;
    };


    root.getRootPath = function(device, isMultisig, account) {
      if (!isMultisig) return root.UNISIG_ROOTPATH;

      // Compat
      if (device == 'ledger' && account ==0) return root.UNISIG_ROOTPATH;

      return root.MULTISIG_ROOTPATH;
    };

    root.getAddressPath = function(device, isMultisig, account) {
      return root.getRootPath(device,isMultisig,account) + "'/" + root.LIVENET_PATH + "'/" + account + "'";
    }

    root.getEntropyPath = function(device, isMultisig, account) {
      var path;

      // Old ledger wallet compat
      if (device == 'ledger' && account == 0)
        return root.ENTROPY_INDEX_PATH  + "0'";

      return root.ENTROPY_INDEX_PATH + root.getRootPath(device,isMultisig,account) + "'/" + account + "'";
    };

    root.pubKeyToEntropySource = function(xPubKey) {
      var b = bwcService.getBitcore();
      var x = b.HDPublicKey(xPubKey);
      return x.publicKey.toString();
    };

    return root;
  });

'use strict';

angular.module('copayApp.services').factory('incomingData', function($log, $ionicModal, $state, $window, $timeout, bitcore) {

  var root = {};

  root.redir = function(data) {
    $log.debug('Processing incoming data:'  +data);

    function sanitizeUri(data) {
      // Fixes when a region uses comma to separate decimals
      var regex = /[\?\&]amount=(\d+([\,\.]\d+)?)/i;
      var match = regex.exec(data);
      if (!match || match.length === 0) {
        return data;
      }
      var value = match[0].replace(',', '.');
      var newUri = data.replace(regex, value);

      // mobile devices, uris like copay://glidera
      newUri.replace('://', ':');

      return newUri;
    };

    // data extensions for Payment Protocol with non-backwards-compatible request
    if ((/^bitcoin:\?r=[\w+]/).exec(data)) {
      data = decodeURIComponent(data.replace('bitcoin:?r=', ''));
      $state.go('tabs.send');
      $timeout(function() {
        $state.transitionTo('tabs.send.confirm', {paypro: data});
      }, 100);
      return true;
    }


    data = sanitizeUri(data);

    // BIP21
    if (bitcore.URI.isValid(data)) {
      var parsed = new bitcore.URI(data);

      var addr = parsed.address ? parsed.address.toString() : '';
      var message = parsed.message;

      var amount = parsed.amount ?  parsed.amount : '';

      $state.go('tabs.send');
      $timeout(function() {
        if (parsed.r) {
          $state.transitionTo('tabs.send.confirm', {paypro: parsed.r});
        } else {
          if (amount) {
            $state.transitionTo('tabs.send.confirm', {toAmount: amount, toAddress: addr, description:message});
          } else {
            $state.transitionTo('tabs.send.amount', {toAddress: addr});
          }
        }
      }, 100);
      return true;

    // Plain URL
    } else if (/^https?:\/\//.test(data)) {
      $state.go('tabs.send');
      $timeout(function() {
        $state.transitionTo('tabs.send.confirm', {paypro: data});
      }, 100);
      return true;

    // Plain Address
    } else if (bitcore.Address.isValid(data, 'livenet')) {
      $state.go('tabs.send');
      $timeout(function() {
        $state.transitionTo('tabs.send.amount', {toAddress: data});
      }, 100);
      return true;
    } else if (bitcore.Address.isValid(data, 'testnet')) {
      $state.go('tabs.send');
      $timeout(function() {
        $state.transitionTo('tabs.send.amount', {toAddress: data});
      }, 100);
      return true;

    // Protocol
    } else if (data && data.indexOf($window.appConfig.name + '://glidera')==0) {
      return $state.go('uriglidera', {url: data});
    } else if (data && data.indexOf($window.appConfig.name + '://coinbase')==0) {
      return $state.go('uricoinbase', {url: data});

    // Join
    } else if (data && data.match(/^copay:[0-9A-HJ-NP-Za-km-z]{70,80}$/)) {
      $state.go('tabs.home');
      $timeout(function() {
        $state.transitionTo('tabs.add.join', {url: data});
      }, 100);
      return true;

    // Old join
    } else if (data && data.match(/^[0-9A-HJ-NP-Za-km-z]{70,80}$/)) {
      $state.go('tabs.home');
      $timeout(function() {
        $state.transitionTo('tabs.add.join', {url: data});
      }, 100);
      return true;
    }

    return false;

  };

  return root;
});

'use strict';
angular.module('copayApp.services')
  .factory('latestReleaseService', function latestReleaseServiceFactory($log, $http, configService) {

    var root = {};

    root.checkLatestRelease = function(cb) {
      var releaseURL = configService.getDefaults().release.url;

      requestLatestRelease(releaseURL, function(err, release) {
        if (err) return cb(err);
        var currentVersion = window.version;
        var latestVersion = release.data.tag_name;

        if (!verifyTagFormat(currentVersion))
          return cb('Cannot verify the format of version tag: ' + currentVersion);
        if (!verifyTagFormat(latestVersion))
          return cb('Cannot verify the format of latest release tag: ' + latestVersion);

        var current = formatTagNumber(currentVersion);
        var latest = formatTagNumber(latestVersion);

        if (latest.major < current.major || (latest.major == current.major && latest.minor <= current.minor))
          return cb(null, false);

        $log.debug('A new version of Copay is available: ' + latestVersion);
        return cb(null, true);
      });

      function verifyTagFormat(tag) {
        var regex = /^v?\d+\.\d+\.\d+$/i;
        return regex.exec(tag);
      };

      function formatTagNumber(tag) {
        var formattedNumber = tag.replace(/^v/i, '').split('.');
        return {
          major: +formattedNumber[0],
          minor: +formattedNumber[1],
          patch: +formattedNumber[2]
        };
      };
    };

    function requestLatestRelease(releaseURL, cb) {
      $log.debug('Retrieving latest relsease information...');

      var request = {
        url: releaseURL,
        method: 'GET',
        json: true
      };

      $http(request).then(function(release) {
        $log.debug('Latest release: ' + release.data.name);
        return cb(null, release);
      }, function(err) {
        return cb('Cannot get the release information: ' + err);
      });
    };

    return root;
  });

'use strict';

angular.module('copayApp.services')
  .factory('ledger', function($log, bwcService, gettext, hwWallet) {
    var root = {};
    var LEDGER_CHROME_ID = "kkdpmhnladdopljabkgpacgpliggeeaf";

    root.callbacks = {};
    root.hasSession = function() {
      root._message({
        command: "has_session"
      });
    }

    root.getEntropySource = function(isMultisig, account, callback) {
      root.getXPubKey(hwWallet.getEntropyPath('ledger', isMultisig, account), function(data) {
        if (!data.success)
          return callback(hwWallet._err(data));

        return callback(null,  hwWallet.pubKeyToEntropySource(data.xpubkey));
      });
    };

    root.getXPubKey = function(path, callback) {
      $log.debug('Ledger deriving xPub path:', path);
      root.callbacks["get_xpubkey"] = callback;
      root._messageAfterSession({
        command: "get_xpubkey",
        path: path
      })
    };


    root.getInfoForNewWallet = function(isMultisig, account, callback) {
      var opts = {};
      root.getEntropySource(isMultisig, account, function(err, entropySource) {
        if (err) return callback(err);

        opts.entropySource = entropySource;
        root.getXPubKey(hwWallet.getAddressPath('ledger', isMultisig, account), function(data) {
          if (!data.success) {
            $log.warn(data.message);
            return callback(data);
          }
          opts.extendedPublicKey = data.xpubkey;
          opts.externalSource = 'ledger';
          opts.account = account;

          // Old ledger compat
          opts.derivationStrategy = account ? 'BIP48' : 'BIP44';
          return callback(null, opts);
        });
      });
    };

    root._signP2SH = function(txp, account, isMultisig, callback) {
      root.callbacks["sign_p2sh"] = callback;
      var redeemScripts = [];
      var paths = [];
      var tx = bwcService.getUtils().buildTx(txp);
      for (var i = 0; i < tx.inputs.length; i++) {
        redeemScripts.push(new ByteString(tx.inputs[i].redeemScript.toBuffer().toString('hex'), GP.HEX).toString());
        paths.push(hwWallet.getAddressPath('ledger', isMultisig, account) + txp.inputs[i].path.substring(1));
      }
      var splitTransaction = root._splitTransaction(new ByteString(tx.toString(), GP.HEX));
      var inputs = [];
      for (var i = 0; i < splitTransaction.inputs.length; i++) {
        var input = splitTransaction.inputs[i];
        inputs.push([
          root._reverseBytestring(input.prevout.bytes(0, 32)).toString(),
          root._reverseBytestring(input.prevout.bytes(32)).toString()
        ]);
      }
      $log.debug('Ledger signing  paths:', paths);
      root._messageAfterSession({
        command: "sign_p2sh",
        inputs: inputs,
        scripts: redeemScripts,
        outputs_number: splitTransaction.outputs.length,
        outputs_script: splitTransaction.outputScript.toString(),
        paths: paths
      });
    };

    root.signTx = function(txp, account, callback) {

      // TODO Compat
      var isMultisig = true;
      if (txp.addressType == 'P2PKH') {
        var msg = 'P2PKH wallets are not supported with ledger';
        $log.error(msg);
        return callback(msg);
      } else {
        root._signP2SH(txp, account, isMultisig, callback);
      }
    }

    root._message = function(data) {
      chrome.runtime.sendMessage(
        LEDGER_CHROME_ID, {
          request: data
        },
        function(response) {
          root._callback(response);
        }
      );
    }

    root._messageAfterSession = function(data) {
      root._after_session = data;
      root._message({
        command: "launch"
      });
      root._should_poll_session = true;
      root._do_poll_session();
    }

    root._do_poll_session = function() {
      root.hasSession();
      if (root._should_poll_session) {
        setTimeout(root._do_poll_session, 500);
      }
    }

    root._callback = function(data) {
      if (typeof data == "object") {
        if (data.command == "has_session" && data.success) {
          root._message(root._after_session);
          root._after_session = null;
          root._should_poll_session = false;
        } else if (typeof root.callbacks[data.command] == "function") {
          root.callbacks[data.command](data);
        }
      } else {
        root._should_poll_session = false;
        Object.keys(root.callbacks).forEach(function(key) {
          root.callbacks[key]({
            success: false,
            message: gettext("The Ledger Chrome application is not installed"),
          });
        });
      }
    }

    root._splitTransaction = function(transaction) {
      var result = {};
      var inputs = [];
      var outputs = [];
      var offset = 0;
      var version = transaction.bytes(offset, 4);
      offset += 4;
      var varint = root._getVarint(transaction, offset);
      var numberInputs = varint[0];
      offset += varint[1];
      for (var i = 0; i < numberInputs; i++) {
        var input = {};
        input['prevout'] = transaction.bytes(offset, 36);
        offset += 36;
        varint = root._getVarint(transaction, offset);
        offset += varint[1];
        input['script'] = transaction.bytes(offset, varint[0]);
        offset += varint[0];
        input['sequence'] = transaction.bytes(offset, 4);
        offset += 4;
        inputs.push(input);
      }
      varint = root._getVarint(transaction, offset);
      var numberOutputs = varint[0];
      offset += varint[1];
      var outputStartOffset = offset;
      for (var i = 0; i < numberOutputs; i++) {
        var output = {};
        output['amount'] = transaction.bytes(offset, 8);
        offset += 8;
        varint = root._getVarint(transaction, offset);
        offset += varint[1];
        output['script'] = transaction.bytes(offset, varint[0]);
        offset += varint[0];
        outputs.push(output);
      }
      var locktime = transaction.bytes(offset, 4);
      result['version'] = version;
      result['inputs'] = inputs;
      result['outputs'] = outputs;
      result['locktime'] = locktime;
      result['outputScript'] = transaction.bytes(outputStartOffset, offset - outputStartOffset);
      return result;
    }

    root._getVarint = function(data, offset) {
      if (data.byteAt(offset) < 0xfd) {
        return [data.byteAt(offset), 1];
      }
      if (data.byteAt(offset) == 0xfd) {
        return [((data.byteAt(offset + 2) << 8) + data.byteAt(offset + 1)), 3];
      }
      if (data.byteAt(offset) == 0xfe) {
        return [((data.byteAt(offset + 4) << 24) + (data.byteAt(offset + 3) << 16) +
          (data.byteAt(offset + 2) << 8) + data.byteAt(offset + 1)), 5];
      }
    }

    root._reverseBytestring = function(x) {
      var res = "";
      for (var i = x.length - 1; i >= 0; i--) {
        res += Convert.toHexByte(x.byteAt(i));
      }
      return new ByteString(res, GP.HEX);
    }

    return root;
  });

var Convert = {};

/**
 * Convert a binary string to his hexadecimal representation
 * @param {String} src binary string
 * @static
 * @returns {String} hexadecimal representation
 */
Convert.stringToHex = function(src) {
  var r = "";
  var hexes = new Array("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f");
  for (var i = 0; i < src.length; i++) {
    r += hexes[src.charCodeAt(i) >> 4] + hexes[src.charCodeAt(i) & 0xf];
  }
  return r;
}

/**
 * Convert an hexadecimal string to its binary representation
 * @param {String} src hexadecimal string
 * @static
 * @return {Array} byte array
 * @throws {InvalidString} if the string isn't properly formatted
 */
Convert.hexToBin = function(src) {
  var result = "";
  var digits = "0123456789ABCDEF";
  if ((src.length % 2) != 0) {
    throw "Invalid string";
  }
  src = src.toUpperCase();
  for (var i = 0; i < src.length; i += 2) {
    var x1 = digits.indexOf(src.charAt(i));
    if (x1 < 0) {
      return "";
    }
    var x2 = digits.indexOf(src.charAt(i + 1));
    if (x2 < 0) {
      return "";
    }
    result += String.fromCharCode((x1 << 4) + x2);
  }
  return result;
}

/**
 * Convert a double digit hexadecimal number to an integer
 * @static
 * @param {String} data buffer containing the digit to parse
 * @param {Number} offset offset to the digit (default is 0)
 * @returns {Number} converted digit
 */
Convert.readHexDigit = function(data, offset) {
  var digits = '0123456789ABCDEF';
  if (typeof offset == "undefined") {
    offset = 0;
  }
  return (digits.indexOf(data.substring(offset, offset + 1).toUpperCase()) << 4) + (digits.indexOf(data.substring(offset + 1, offset + 2).toUpperCase()));
}

/**
 * Convert a number to a two digits hexadecimal string (deprecated)
 * @static
 * @param {Number} number number to convert
 * @returns {String} converted number
 */
Convert.toHexDigit = function(number) {
  var digits = '0123456789abcdef';
  return digits.charAt(number >> 4) + digits.charAt(number & 0x0F);
}

/**
 * Convert a number to a two digits hexadecimal string (similar to toHexDigit)
 * @static
 * @param {Number} number number to convert
 * @returns {String} converted number
 */
Convert.toHexByte = function(number) {
  return Convert.toHexDigit(number);
}

/**
 * Convert a BCD number to a two digits hexadecimal string
 * @static
 * @param {Number} number number to convert
 * @returns {String} converted number
 */
Convert.toHexByteBCD = function(numberBCD) {
  var number = ((numberBCD / 10) * 16) + (numberBCD % 10);
  return Convert.toHexDigit(number);
}


/**
 * Convert a number to an hexadecimal short number
 * @static
 * @param {Number} number number to convert
 * @returns {String} converted number
 */
Convert.toHexShort = function(number) {
  return Convert.toHexDigit((number >> 8) & 0xff) + Convert.toHexDigit(number & 0xff);
}

/**
 * Convert a number to an hexadecimal int number
 * @static
 * @param {Number} number number to convert
 * @returns {String} converted number
 */
Convert.toHexInt = function(number) {
  return Convert.toHexDigit((number >> 24) & 0xff) + Convert.toHexDigit((number >> 16) & 0xff) +
    Convert.toHexDigit((number >> 8) & 0xff) + Convert.toHexDigit(number & 0xff);
}


var GP = {};
GP.ASCII = 1;
GP.HEX = 5;

/**
 * @class GPScript ByteString implementation
 * @param {String} value initial value
 * @param {HEX|ASCII} encoding encoding to use
 * @property {Number} length length of the ByteString
 * @constructs
 */
var ByteString = function(value, encoding) {
  this.encoding = encoding;
  this.hasBuffer = (typeof Buffer != 'undefined');
  if (this.hasBuffer && (value instanceof Buffer)) {
    this.value = value;
    this.encoding = GP.HEX;
  } else {
    switch (encoding) {
      case GP.HEX:
        if (!this.hasBuffer) {
          this.value = Convert.hexToBin(value);
        } else {
          this.value = new Buffer(value, 'hex');
        }
        break;

      case GP.ASCII:
        if (!this.hasBuffer) {
          this.value = value;
        } else {
          this.value = new Buffer(value, 'ascii');
        }
        break;

      default:
        throw "Invalid arguments";
    }
  }
  this.length = this.value.length;
}

/**
 * Retrieve the byte value at the given index
 * @param {Number} index index
 * @returns {Number} byte value
 */
ByteString.prototype.byteAt = function(index) {
  if (arguments.length < 1) {
    throw "Argument missing";
  }
  if (typeof index != "number") {
    throw "Invalid index";
  }
  if ((index < 0) || (index >= this.value.length)) {
    throw "Invalid index offset";
  }
  if (!this.hasBuffer) {
    return Convert.readHexDigit(Convert.stringToHex(this.value.substring(index, index + 1)));
  } else {
    return this.value[index];
  }
}

/**
 * Retrieve a subset of the ByteString
 * @param {Number} offset offset to start at
 * @param {Number} [count] size of the target ByteString (default : use the remaining length)
 * @returns {ByteString} subset of the original ByteString
 */
ByteString.prototype.bytes = function(offset, count) {
  var result;
  if (arguments.length < 1) {
    throw "Argument missing";
  }
  if (typeof offset != "number") {
    throw "Invalid offset";
  }
  //if ((offset < 0) || (offset >= this.value.length)) {
  if (offset < 0) {
    throw "Invalid offset";
  }
  if (typeof count == "number") {
    if (count < 0) {
      throw "Invalid count";
    }
    if (!this.hasBuffer) {
      result = new ByteString(this.value.substring(offset, offset + count), GP.ASCII);
    } else {
      result = new Buffer(count);
      this.value.copy(result, 0, offset, offset + count);
    }
  } else
  if (typeof count == "undefined") {
    if (!this.hasBuffer) {
      result = new ByteString(this.value.substring(offset), GP.ASCII);
    } else {
      result = new Buffer(this.value.length - offset);
      this.value.copy(result, 0, offset, this.value.length);
    }
  } else {
    throw "Invalid count";
  }
  if (!this.hasBuffer) {
    result.encoding = this.encoding;
    return result;
  } else {
    return new ByteString(result, GP.HEX);
  }
}

/**
 * Appends two ByteString
 * @param {ByteString} target ByteString to append
 * @returns {ByteString} result of the concatenation
 */
ByteString.prototype.concat = function(target) {
  if (arguments.length < 1) {
    throw "Not enough arguments";
  }
  if (!(target instanceof ByteString)) {
    throw "Invalid argument";
  }
  if (!this.hasBuffer) {
    var result = this.value + target.value;
    var x = new ByteString(result, GP.ASCII);
    x.encoding = this.encoding;
    return x;
  } else {
    var result = Buffer.concat([this.value, target.value]);
    return new ByteString(result, GP.HEX);
  }
}

/**
 * Check if two ByteString are equal
 * @param {ByteString} target ByteString to check against
 * @returns {Boolean} true if the two ByteString are equal
 */
ByteString.prototype.equals = function(target) {
  if (arguments.length < 1) {
    throw "Not enough arguments";
  }
  if (!(target instanceof ByteString)) {
    throw "Invalid argument";
  }
  if (!this.hasBuffer) {
    return (this.value == target.value);
  } else {
    return Buffer.equals(this.value, target.value);
  }
}


/**
 * Convert the ByteString to a String using the given encoding
 * @param {HEX|ASCII|UTF8|BASE64|CN} encoding encoding to use
 * @return {String} converted content
 */
ByteString.prototype.toString = function(encoding) {
  var targetEncoding = this.encoding;
  if (arguments.length >= 1) {
    if (typeof encoding != "number") {
      throw "Invalid encoding";
    }
    switch (encoding) {
      case GP.HEX:
      case GP.ASCII:
        targetEncoding = encoding;
        break;

      default:
        throw "Unsupported arguments";
    }
    targetEncoding = encoding;
  }
  switch (targetEncoding) {
    case GP.HEX:
      if (!this.hasBuffer) {
        return Convert.stringToHex(this.value);
      } else {
        return this.value.toString('hex');
      }
    case GP.ASCII:
      if (!this.hasBuffer) {
        return this.value;
      } else {
        return this.value.toString();
      }
    default:
      throw "Unsupported";
  }
}

ByteString.prototype.toStringIE = function(encoding) {
  return this.toString(encoding);
}

ByteString.prototype.toBuffer = function() {
  return this.value;
}

'use strict';

angular.module('copayApp.services')
  .factory('localStorageService', function(platformInfo, $timeout, $log) {
    var isNW = platformInfo.isNW;
    var isChromeApp = platformInfo.isChromeApp;
    var root = {};
    var ls = ((typeof window.localStorage !== "undefined") ? window.localStorage : null);

    if (isChromeApp && !isNW && !ls) {
      $log.info('Using CHROME storage');
      ls = chrome.storage.local;
    }


    if (!ls)
      throw new Error('localstorage not available');

    root.get = function(k, cb) {
      if (isChromeApp || isNW) {
        chrome.storage.local.get(k,
          function(data) {
            //TODO check for errors
            return cb(null, data[k]);
          });
      } else {
        return cb(null, ls.getItem(k));
      }
    };

    /**
     * Same as setItem, but fails if an item already exists
     */
    root.create = function(name, value, callback) {
      root.get(name,
        function(err, data) {
          if (data) {
            return callback('EEXISTS');
          } else {
            return root.set(name, value, callback);
          }
        });
    };

    root.set = function(k, v, cb) {
      if (isChromeApp || isNW) {
        var obj = {};
        obj[k] = v;

        chrome.storage.local.set(obj, cb);
      } else {
        ls.setItem(k, v);
        return cb();
      }

    };

    root.remove = function(k, cb) {
      if (isChromeApp || isNW) {
        chrome.storage.local.remove(k, cb);
      } else {
        ls.removeItem(k);
        return cb();
      }

    };


    if (isNW) {
      $log.info('Overwritting localstorage with chrome storage for NW.JS');

      var ts = ls.getItem('migrationToChromeStorage');
      var p = ls.getItem('profile');

      // Need migration?
      if (!ts && p) {
        $log.info('### MIGRATING DATA! TO CHROME STORAGE');

        var j = 0;
        for (var i = 0; i < localStorage.length; i++) {
          var k = ls.key(i);
          var v = ls.getItem(k);

          $log.debug('   Key: ' + k);
          root.set(k, v, function() {
            j++;
            if (j == localStorage.length) {
              $log.info('### MIGRATION DONE');
              ls.setItem('migrationToChromeStorage', Date.now())
              ls = chrome.storage.local;
            }
          })
        }
      } else if (p) {
        $log.info('# Data already migrated to Chrome storage on ' + ts);
      }
    }


    return root;
  });

'use strict';
angular.module('copayApp.services')
  .factory('logHeader', function($window, $log, platformInfo) {
    $log.info($window.appConfig.nameCase + ' v' + window.version + ' #' + window.commitHash);
    $log.info('Client: '+ JSON.stringify(platformInfo) );
    return {};
  });

'use strict';

angular.module('copayApp.services').service('nodeWebkitService', function() {

  this.readFromClipboard = function() {
    var gui = require('nw.gui');
    var clipboard = gui.Clipboard.get();
    return clipboard.get();
  };

  this.writeToClipboard = function(text) {
    var gui = require('nw.gui');
    var clipboard = gui.Clipboard.get();
    return clipboard.set(text);
  };

  this.openExternalLink = function(url) {
    var gui = require('nw.gui');
    return gui.Shell.openExternal(url);
  };

});

'use strict';

angular.module('copayApp.services').factory('ongoingProcess', function($log, $timeout, $filter, lodash, $ionicLoading, gettext, platformInfo) {
  var root = {};
  var isCordova = platformInfo.isCordova;

  var ongoingProcess = {};

  var processNames = {
    'broadcastingTx': gettext('Broadcasting transaction'),
    'calculatingFee': gettext('Calculating fee'),
    'connectingCoinbase': gettext('Connecting to Coinbase...'),
    'connectingGlidera': gettext('Connecting to Glidera...'),
    'connectingledger': gettext('Waiting for Ledger...'),
    'connectingtrezor': gettext('Waiting for Trezor...'),
    'creatingTx': gettext('Creating transaction'),
    'creatingWallet': gettext('Creating Wallet...'),
    'deletingWallet': gettext('Deleting Wallet...'),
    'extractingWalletInfo': gettext('Extracting Wallet Information...'),
    'fetchingPayPro': gettext('Fetching Payment Information'),
    'generatingCSV': gettext('Generating .csv file...'),
    'gettingFeeLevels': gettext('Getting fee levels...'),
    'importingWallet': gettext('Importing Wallet...'),
    'joiningWallet': gettext('Joining Wallet...'),
    'recreating': gettext('Recreating Wallet...'),
    'rejectTx': gettext('Rejecting payment proposal'),
    'removeTx': gettext('Deleting payment proposal'),
    'retrivingInputs': gettext('Retrieving inputs information'),
    'scanning': gettext('Scanning Wallet funds...'),
    'sendingTx': gettext('Sending transaction'),
    'signingTx': gettext('Signing transaction'),
    'sweepingWallet': gettext('Sweeping Wallet...'),
    'validatingWallet': gettext('Validating wallet integrity...'),
    'validatingWords': gettext('Validating recovery phrase...'),
    'loadingTxInfo': gettext('Loading transaction info...'),
  };

  root.clear = function() {
    ongoingProcess = {};
    if (isCordova) {
      window.plugins.spinnerDialog.hide();
    } else {
      $ionicLoading.hide();
    }
  };

  root.get = function(processName) {
    return ongoingProcess[processName];
  };

  root.set = function(processName, isOn) {
    $log.debug('ongoingProcess', processName, isOn);
    root[processName] = isOn;
    ongoingProcess[processName] = isOn;

    var name;
    root.any = lodash.any(ongoingProcess, function(isOn, processName) {
      if (isOn)
        name = name || processName;
      return isOn;
    });
    // The first one
    root.onGoingProcessName = name;

    var showName = $filter('translate')(processNames[name] || name);

    if (root.onGoingProcessName) {
      if (isCordova) {
        window.plugins.spinnerDialog.show(null, showName, true);
      } else {

        var tmpl = '<div class="item-icon-left">' + showName + '<ion-spinner class="spinner-stable" icon="lines"></ion-spinner></div>';
        $ionicLoading.show({
          template: tmpl
        });
      }
    } else {
      if (isCordova) {
        window.plugins.spinnerDialog.hide();
      } else {
        $ionicLoading.hide();
      }
    }
  };

  return root;
});

'use strict';

angular.module('copayApp.services').factory('openURLService', function($rootScope, $ionicHistory, $document, $log, $state, platformInfo, lodash, profileService, incomingData) {
  var root = {};

  var handleOpenURL = function(args) {
    $log.info('Handling Open URL: ' + JSON.stringify(args));
    // Stop it from caching the first view as one to return when the app opens
    $ionicHistory.nextViewOptions({
      historyRoot: true,
      disableBack: true,
      disableAnimation: true
    });
    var url = args.url;
    if (!url) {
      $log.error('No url provided');
      return;
    };

    if (url) {
      if ('cordova' in window) {
        window.cordova.removeDocumentEventHandler('handleopenurl');
        window.cordova.addStickyDocumentEventHandler('handleopenurl');
      }
      document.removeEventListener('handleopenurl', handleOpenURL);
    }

    document.addEventListener('handleopenurl', handleOpenURL, false);

    if (!incomingData.redir(url)) {
      $log.warn('Unknown URL! : ' + url);
    }
  };

  var handleResume = function() {
    $log.debug('Handle Resume @ openURL...');
    document.addEventListener('handleopenurl', handleOpenURL, false);
  };

  root.init = function() {
    $log.debug('Initializing openURL');
    document.addEventListener('handleopenurl', handleOpenURL, false);
    document.addEventListener('resume', handleResume, false);

    if (platformInfo.isChromeApp) {
      $log.debug('Registering Chrome message listener');
      chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
          if (request.url) {
            handleOpenURL(request.url);
          }
        });
    } else if (platformInfo.isNW) {
      var gui = require('nw.gui');

      // This event is sent to an existent instance of Copay (only for standalone apps)
      gui.App.on('open', function(pathData) {
        if (pathData.indexOf('bitcoin:') != -1) {
          $log.debug('Bitcoin URL found');
          handleOpenURL({
            url: pathData.substring(pathData.indexOf('bitcoin:'))
          });
        } else if (pathData.indexOf('copay:') != -1) {
          $log.debug('Copay URL found');
          handleOpenURL({
            url: pathData.substring(pathData.indexOf('copay:'))
          });
        }
      });

      // Used at the startup of Copay
      var argv = gui.App.argv;
      if (argv && argv[0]) {
        handleOpenURL({
          url: argv[0]
        });
      }
    } else if (platformInfo.isDevel) {
      var base = window.location.origin + '/';
      var url = base + '#/uri/%s';

      if (navigator.registerProtocolHandler) {
        $log.debug('Registering Browser handlers base:' + base);
        navigator.registerProtocolHandler('bitcoin', url, 'Copay Bitcoin Handler');
        navigator.registerProtocolHandler('web+copay', url, 'Copay Wallet Handler');
      }
    }
  };

  root.registerHandler = function(x) {
    $log.debug('Registering URL Handler: ' + x.name);
    root.registeredUriHandlers.push(x);
  };

  root.handleURL = function(args) {
    profileService.whenAvailable(function() {
      // Wait ux to settle
      setTimeout(function() {
        handleOpenURL(args);
      }, 1000);
    });
  };

return root;
});

'use strict';

angular.module('copayApp.services').factory('platformInfo', function($window) {

  var ua = navigator ? navigator.userAgent : null;

  if (!ua) {
    console.log('Could not determine navigator. Using fixed string');
    ua = 'dummy user-agent';
  }

  // Fixes IOS WebKit UA
  ua = ua.replace(/\(\d+\)$/, '');

  var isNodeWebkit = function() {
    var isNode = (typeof process !== "undefined" && typeof require !== "undefined");
    if (isNode) {
      try {
        return (typeof require('nw.gui') !== "undefined");
      } catch (e) {
        return false;
      }
    }
  };


  // Detect mobile devices
  var ret = {
    isAndroid: !!ua.match(/Android/i),
    isIOS: /iPad|iPhone|iPod/.test(ua) && !$window.MSStream,
    isWP: !!ua.match(/IEMobile/i),
    isSafari: Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0,
    ua: ua,
    isCordova: !!$window.cordova,
    isNW: isNodeWebkit(),
  };

  ret.isMobile = ret.isAndroid || ret.isIOS || ret.isWP;
  ret.isChromeApp = $window.chrome && chrome.runtime && chrome.runtime.id && !ret.isNW;
  ret.isDevel = !ret.isMobile && !ret.isChromeApp && !ret.isNW;

  return ret;
});

'use strict';

angular.module('copayApp.services').service('popupService', function($log, $ionicPopup, platformInfo, gettextCatalog) {

  var isCordova = platformInfo.isCordova;

  /*************** Ionic ****************/

  var _ionicAlert = function(title, message, cb) {
    if (!cb) cb = function() {};
    $ionicPopup.alert({
      title: title,
      subTitle: message,
      okType: 'button-clear button-positive'
    }).then(cb);
  };

  var _ionicConfirm = function(title, message, okText, cancelText, cb) {
    $ionicPopup.confirm({
      title: title,
      subTitle: message,
      cancelText: cancelText,
      cancelType: 'button-clear button-positive',
      okText: okText,
      okType: 'button-clear button-positive'
    }).then(function(res) {
      return cb(res);
    });
  };

  var _ionicPrompt = function(title, message, opts, cb) {
    opts = opts || {};
    $ionicPopup.prompt({
      title: title,
      subTitle: message,
      inputType: opts.inputType,
      inputPlaceholder: opts.inputPlaceholder,
      defaultText: opts.defaultText
    }).then(function(res) {
      return cb(res);
    });
  };

  /*************** Cordova ****************/

  var _cordovaAlert = function(title, message, cb) {
    if (!cb) cb = function() {};
    navigator.notification.alert(message, cb, title);
  };

  var _cordovaConfirm = function(title, message, okText, cancelText, cb) {
    var onConfirm = function(buttonIndex) {
      if (buttonIndex == 1) return cb(true);
      else return cb(false);
    }
    okText = okText || gettextCatalog.getString('OK');
    cancelText = cancelText || gettextCatalog.getString('Cancel');
    navigator.notification.confirm(message, onConfirm, title, [okText, cancelText]);
  };

  var _cordovaPrompt = function(title, message, opts, cb) {
    var onPrompt = function(results) {
      if (results.buttonIndex == 1) return cb(results.input1);
      else return cb();
    }
    navigator.notification.prompt(message, onPrompt, title, null, opts.defaultText);
  };

  /**
   * Show a simple alert popup
   *
   * @param {String} Title (optional)
   * @param {String} Message
   * @param {Callback} Function (optional)
   */

  this.showAlert = function(title, msg, cb) {
    var message = (msg && msg.message) ? msg.message : msg;
    $log.warn(title + ": " + message);

    if (isCordova)
      _cordovaAlert(title, message, cb);
    else
      _ionicAlert(title, message, cb);
  };

  /**
   * Show a simple confirm popup
   *
   * @param {String} Title (optional)
   * @param {String} Message
   * @param {String} okText (optional)
   * @param {String} cancelText (optional)
   * @param {Callback} Function
   * @returns {Callback} OK: true, Cancel: false
   */

  this.showConfirm = function(title, message, okText, cancelText, cb) {
    $log.warn(title + ": " + message);

    if (isCordova)
      _cordovaConfirm(title, message, okText, cancelText, cb);
    else
      _ionicConfirm(title, message, okText, cancelText, cb);
  };

  /**
   * Show a simple prompt popup
   *
   * @param {String} Title (optional)
   * @param {String} Message
   * @param {Object} Object{ inputType, inputPlaceholder, defaultText } (optional)
   * @param {Callback} Function
   * @returns {Callback} Return the value of the input if user presses OK
   */

  this.showPrompt = function(title, message, opts, cb) {
    $log.warn(title + ": " + message);

    if (isCordova)
      _cordovaPrompt(title, message, opts, cb);
    else
      _ionicPrompt(title, message, opts, cb);
  };


});

'use strict';
angular.module('copayApp.services')
  .factory('profileService', function profileServiceFactory($rootScope, $timeout, $filter, $log, sjcl, lodash, storageService, bwcService, configService, pushNotificationsService, gettext, gettextCatalog, bwcError, uxLanguage, platformInfo, txFormatService, $state) {


    var isChromeApp = platformInfo.isChromeApp;
    var isCordova = platformInfo.isCordova;
    var isWP = platformInfo.isWP;
    var isIOS = platformInfo.isIOS;

    var root = {};
    var errors = bwcService.getErrors();
    var usePushNotifications = isCordova && !isWP;

    var UPDATE_PERIOD = 15;

    root.profile = null;

    Object.defineProperty(root, "focusedClient", {
      get: function() {
        throw "focusedClient is not used any more"
      },
      set: function() {
        throw "focusedClient is not used any more"
      }
    });


    root.wallet = {}; // decorated version of client

    root.updateWalletSettings = function(wallet) {
      var defaults = configService.getDefaults();
      configService.whenAvailable(function(config) {
        wallet.usingCustomBWS = config.bwsFor && config.bwsFor[wallet.id] && (config.bwsFor[wallet.id] != defaults.bws.url);
        wallet.name = (config.aliasFor && config.aliasFor[wallet.id]) || wallet.credentials.walletName;
        wallet.color = (config.colorFor && config.colorFor[wallet.id]) || '#4A90E2';
        wallet.email = config.emailFor && config.emailFor[wallet.id];
      });
    }

    root.setBackupNeededModalFlag = function(walletId) {
      storageService.setBackupNeededModalFlag(walletId, true, function(err) {
        if (err) $log.error(err);
        $log.debug('Backup warning modal flag stored');
        root.wallet[walletId].showBackupNeededModal = false;
      });
    };

    function _showBackupNeededModal(wallet, cb) {
      storageService.getBackupNeededModalFlag(wallet.credentials.walletId, function(err, val) {
        if (err) $log.error(err);
        if (val) return cb(false);
        return cb(true);
      });
    };

    root.setBackupFlag = function(walletId) {
      storageService.setBackupFlag(walletId, function(err) {
        if (err) $log.error(err);
        $log.debug('Backup flag stored');
        root.wallet[walletId].needsBackup = false;
      });
    };

    function _requiresBackup(wallet) {
      if (wallet.isPrivKeyExternal()) return false;
      if (!wallet.credentials.mnemonic) return false;
      if (wallet.credentials.network == 'testnet') return false;

      return true;
    };

    function _needsBackup(wallet, cb) {
      if (!_requiresBackup(wallet))
        return cb(false);

      storageService.getBackupFlag(wallet.credentials.walletId, function(err, val) {
        if (err) $log.error(err);
        if (val) return cb(false);
        return cb(true);
      });
    };

    function _balanceIsHidden(wallet, cb) {
      storageService.getHideBalanceFlag(wallet.credentials.walletId, function(err, shouldHideBalance) {
        if (err) $log.error(err);
        var hideBalance = (shouldHideBalance == 'true') ? true : false;
        return cb(hideBalance);
      });
    };
    // Adds a wallet client to profileService
    root.bindWalletClient = function(wallet, opts) {
      var opts = opts || {};
      var walletId = wallet.credentials.walletId;

      if ((root.wallet[walletId] && root.wallet[walletId].started) && !opts.force) {
        return false;
      }

      // INIT WALLET VIEWMODEL
      wallet.id = walletId;
      wallet.started = true;
      wallet.doNotVerifyPayPro = isChromeApp;
      wallet.network = wallet.credentials.network;
      wallet.copayerId = wallet.credentials.copayerId;
      wallet.m = wallet.credentials.m;
      wallet.n = wallet.credentials.n;

      root.updateWalletSettings(wallet);
      root.wallet[walletId] = wallet;

      _needsBackup(wallet, function(val) {
        wallet.needsBackup = val;
      });

      _balanceIsHidden(wallet, function(val) {
        wallet.balanceHidden = val;
      });

      _showBackupNeededModal(wallet, function(val) {
        if (wallet.needsBackup) wallet.showBackupNeededModal = val;
        else wallet.showBackupNeededModal = false;
      });

      wallet.removeAllListeners();

      wallet.on('report', function(n) {
        $log.info('BWC Report:' + n);
      });

      wallet.on('notification', function(n) {
        $log.debug('BWC Notification:', n);

        // notification?

        // TODO (put this in wallet ViewModel)
        if (wallet.cachedStatus)
          wallet.cachedStatus.isValid = false;

        if (wallet.completeHistory)
          wallet.completeHistory.isValid = false;

        if (wallet.cachedActivity)
          wallet.cachedActivity.isValid = false;

        if (wallet.cachedTxps)
          wallet.cachedTxps.isValid = false;



        $rootScope.$emit('bwsEvent', wallet.id, n.type, n);
      });

      wallet.on('walletCompleted', function() {
        $log.debug('Wallet completed');

        root.updateCredentials(JSON.parse(wallet.export()), function() {
          $rootScope.$emit('Local/WalletCompleted', walletId);
        });
      });

      wallet.initialize({
        notificationIncludeOwn: true,
      }, function(err) {
        if (err) {
          $log.error('Could not init notifications err:', err);
          return;
        }
        wallet.setNotificationsInterval(UPDATE_PERIOD);
        wallet.openWallet(function(err) {
          if (wallet.status !== true)
            $log.log('Wallet + ' + walletId + ' status:' + wallet.status)
        });
      });

      $rootScope.$on('Local/SettingsUpdated', function(e, walletId) {
        if (!walletId || walletId == wallet.id) {
          $log.debug('Updating settings for wallet:' + wallet.id);
          root.updateWalletSettings(wallet);
        }
      });

      return true;
    };

    var validationLock = false;

    root.runValidation = function(client, delay, retryDelay) {

      delay = delay || 500;
      retryDelay = retryDelay || 50;

      if (validationLock) {
        return $timeout(function() {
          $log.debug('ValidatingWallet Locked: Retrying in: ' + retryDelay);
          return root.runValidation(client, delay, retryDelay);
        }, retryDelay);
      }
      validationLock = true;

      // IOS devices are already checked
      var skipDeviceValidation = isIOS || root.profile.isDeviceChecked(platformInfo.ua);
      var walletId = client.credentials.walletId;

      $log.debug('ValidatingWallet: ' + walletId + ' skip Device:' + skipDeviceValidation);
      $timeout(function() {
        client.validateKeyDerivation({
          skipDeviceValidation: skipDeviceValidation,
        }, function(err, isOK) {
          validationLock = false;

          $log.debug('ValidatingWallet End:  ' + walletId + ' isOK:' + isOK);
          if (isOK) {
            root.profile.setChecked(platformInfo.ua, walletId);
          } else {
            $log.warn('Key Derivation failed for wallet:' + walletId);
            storageService.clearLastAddress(walletId, function() {});
          }

          root.storeProfileIfDirty();
        });
      }, delay);
    };

    // Used when reading wallets from the profile
    root.bindWallet = function(credentials, cb) {
      if (!credentials.walletId || !credentials.m)
        return cb('bindWallet should receive credentials JSON');

      // Create the client
      var getBWSURL = function(walletId) {
        var config = configService.getSync();
        var defaults = configService.getDefaults();
        return ((config.bwsFor && config.bwsFor[walletId]) || defaults.bws.url);
      };


      var client = bwcService.getClient(JSON.stringify(credentials), {
        bwsurl: getBWSURL(credentials.walletId),
      });

      var skipKeyValidation = root.profile.isChecked(platformInfo.ua, credentials.walletId);
      if (!skipKeyValidation)
        root.runValidation(client, 500);

      $log.info('Binding wallet:' + credentials.walletId + ' Validating?:' + !skipKeyValidation);
      return cb(null, root.bindWalletClient(client));
    };

    root.bindProfile = function(profile, cb) {
      root.profile = profile;

      configService.get(function(err) {
        $log.debug('Preferences read');
        if (err) return cb(err);

        function bindWallets(cb) {
          var l = root.profile.credentials.length;
          var i = 0,
            totalBound = 0;

          if (!l) return cb();

          lodash.each(root.profile.credentials, function(credentials) {
            root.bindWallet(credentials, function(err, bound) {
              i++;
              totalBound += bound;
              if (i == l) {
                $log.info('Bound ' + totalBound + ' out of ' + l + ' wallets');
                return cb();
              }
            });
          });
        }

        bindWallets(function() {
          root.isBound = true;

          lodash.each(root._queue, function(x) {
            $timeout(function() {
              return x();
            }, 1);
          });
          root._queue = [];



          root.isDisclaimerAccepted(function(val) {
            if (!val) {
              return cb(new Error('NONAGREEDDISCLAIMER: Non agreed disclaimer'));
            }
            return cb();
          });
        });
      });
    };

    root._queue = [];
    root.whenAvailable = function(cb) {
      if (!root.isBound) {
        root._queue.push(cb);
        return;
      }
      return cb();
    };

    root.pushNotificationsInit = function() {
      var defaults = configService.getDefaults();
      var push = pushNotificationsService.init(root.wallet);

      push.on('notification', function(data) {
        if (!data.additionalData.foreground) {
          $log.debug('Push notification event: ', data.message);

          $timeout(function() {
            var wallets = root.getWallets();
            var walletToFind = data.additionalData.walletId;

            var walletFound = lodash.find(wallets, function(w) {
              return (lodash.isEqual(walletToFind, sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(w.id))));
            });

            if (!walletFound) return $log.debug('Wallet not found');
          }, 100);
        }
      });
    };

    root.loadAndBindProfile = function(cb) {
      storageService.getProfile(function(err, profile) {
        if (err) {
          $rootScope.$emit('Local/DeviceError', err);
          return cb(err);
        }
        if (!profile) {
          // Migration??
          storageService.tryToMigrate(function(err, migratedProfile) {
            if (err) return cb(err);
            if (!migratedProfile)
              return cb(new Error('NOPROFILE: No profile'));

            profile = migratedProfile;
            return root.bindProfile(profile, cb);
          })
        } else {
          $log.debug('Profile read');
          return root.bindProfile(profile, cb);
        }
      });
    };

    var seedWallet = function(opts, cb) {
      opts = opts || {};
      var walletClient = bwcService.getClient(null, opts);
      var network = opts.networkName || 'livenet';

      if (opts.mnemonic) {
        try {
          opts.mnemonic = root._normalizeMnemonic(opts.mnemonic);
          walletClient.seedFromMnemonic(opts.mnemonic, {
            network: network,
            passphrase: opts.passphrase,
            account: opts.account || 0,
            derivationStrategy: opts.derivationStrategy || 'BIP44',
          });

        } catch (ex) {
          $log.info(ex);
          return cb(gettext('Could not create: Invalid wallet recovery phrase'));
        }
      } else if (opts.extendedPrivateKey) {
        try {
          walletClient.seedFromExtendedPrivateKey(opts.extendedPrivateKey);
        } catch (ex) {
          $log.warn(ex);
          return cb(gettext('Could not create using the specified extended private key'));
        }
      } else if (opts.extendedPublicKey) {
        try {
          walletClient.seedFromExtendedPublicKey(opts.extendedPublicKey, opts.externalSource, opts.entropySource, {
            account: opts.account || 0,
            derivationStrategy: opts.derivationStrategy || 'BIP44',
          });
        } catch (ex) {
          $log.warn("Creating wallet from Extended Public Key Arg:", ex, opts);
          return cb(gettext('Could not create using the specified extended public key'));
        }
      } else {
        var lang = uxLanguage.getCurrentLanguage();
        try {
          walletClient.seedFromRandomWithMnemonic({
            network: network,
            passphrase: opts.passphrase,
            language: lang,
            account: 0,
          });
        } catch (e) {
          $log.info('Error creating recovery phrase: ' + e.message);
          if (e.message.indexOf('language') > 0) {
            $log.info('Using default language for recovery phrase');
            walletClient.seedFromRandomWithMnemonic({
              network: network,
              passphrase: opts.passphrase,
              account: 0,
            });
          } else {
            return cb(e);
          }
        }
      }
      return cb(null, walletClient);
    };

    // Creates a wallet on BWC/BWS
    var doCreateWallet = function(opts, cb) {
      $log.debug('Creating Wallet:', opts);
      $timeout(function() {
        seedWallet(opts, function(err, walletClient) {
          if (err) return cb(err);

          var name = opts.name || gettextCatalog.getString('Personal Wallet');
          var myName = opts.myName || gettextCatalog.getString('me');

          walletClient.createWallet(name, myName, opts.m, opts.n, {
            network: opts.networkName,
            singleAddress: opts.singleAddress,
            walletPrivKey: opts.walletPrivKey,
          }, function(err, secret) {
            if (err) return bwcError.cb(err, gettext('Error creating wallet'), cb);
            return cb(null, walletClient, secret);
          });
        });
      }, 50);
    };

    // create and store a wallet
    root.createWallet = function(opts, cb) {
      doCreateWallet(opts, function(err, walletClient, secret) {
        if (err) return cb(err);

        addAndBindWalletClient(walletClient, {
          bwsurl: opts.bwsurl
        }, cb);
      });
    };

    // joins and stores a wallet
    root.joinWallet = function(opts, cb) {
      var walletClient = bwcService.getClient();
      $log.debug('Joining Wallet:', opts);

      try {
        var walletData = bwcService.parseSecret(opts.secret);

        // check if exist
        if (lodash.find(root.profile.credentials, {
            'walletId': walletData.walletId
          })) {
          return cb(gettext('Cannot join the same wallet more that once'));
        }
      } catch (ex) {
        $log.debug(ex);
        return cb(gettext('Bad wallet invitation'));
      }
      opts.networkName = walletData.network;
      $log.debug('Joining Wallet:', opts);

      seedWallet(opts, function(err, walletClient) {
        if (err) return cb(err);

        walletClient.joinWallet(opts.secret, opts.myName || 'me', {}, function(err) {
          if (err) return bwcError.cb(err, gettext('Could not join wallet'), cb);
          addAndBindWalletClient(walletClient, {
            bwsurl: opts.bwsurl
          }, cb);
        });
      });
    };

    root.getWallet = function(walletId) {
      return root.wallet[walletId];
    };


    root.deleteWalletClient = function(client, cb) {
      var walletId = client.credentials.walletId;

      pushNotificationsService.unsubscribe(root.getWallet(walletId), function(err) {
        if (err) $log.warn('Unsubscription error: ' + err.message);
        else $log.debug('Unsubscribed from push notifications service');
      });

      $log.debug('Deleting Wallet:', client.credentials.walletName);
      client.removeAllListeners();

      root.profile.deleteWallet(walletId);

      delete root.wallet[walletId];

      storageService.removeAllWalletData(walletId, function(err) {
        if (err) $log.warn(err);
      });

      storageService.storeProfile(root.profile, function(err) {
        if (err) return cb(err);
        return cb();
      });
    };

    root.setMetaData = function(walletClient, addressBook, cb) {
      storageService.getAddressbook(walletClient.credentials.network, function(err, localAddressBook) {
        var localAddressBook1 = {};
        try {
          localAddressBook1 = JSON.parse(localAddressBook);
        } catch (ex) {
          $log.warn(ex);
        }
        var mergeAddressBook = lodash.merge(addressBook, localAddressBook1);
        storageService.setAddressbook(walletClient.credentials.network, JSON.stringify(addressBook), function(err) {
          if (err) return cb(err);
          return cb(null);
        });
      });
    }

    // Adds and bind a new client to the profile
    var addAndBindWalletClient = function(client, opts, cb) {
      if (!client || !client.credentials)
        return cb(gettext('Could not access wallet'));

      var walletId = client.credentials.walletId

      if (!root.profile.addWallet(JSON.parse(client.export())))
        return cb(gettext('Wallet already in Copay'));


      var skipKeyValidation = root.profile.isChecked(platformInfo.ua, walletId);
      if (!skipKeyValidation)
        root.runValidation(client);

      root.bindWalletClient(client);

      var saveBwsUrl = function(cb) {
        var defaults = configService.getDefaults();
        var bwsFor = {};
        bwsFor[walletId] = opts.bwsurl || defaults.bws.url;

        // Dont save the default
        if (bwsFor[walletId] == defaults.bws.url)
          return cb();

        configService.set({
          bwsFor: bwsFor,
        }, function(err) {
          if (err) $log.warn(err);
          return cb();
        });
      };

      saveBwsUrl(function() {
        storageService.storeProfile(root.profile, function(err) {
          var config = configService.getSync();
          if (config.pushNotifications.enabled)
            pushNotificationsService.enableNotifications(root.wallet);
          return cb(err, client);
        });
      });
    };

    root.storeProfileIfDirty = function(cb) {
      if (root.profile.dirty) {
        storageService.storeProfile(root.profile, function(err) {
          $log.debug('Saved modified Profile');
          if (cb) return cb(err);
        });
      } else {
        if (cb) return cb();
      };
    };

    root.importWallet = function(str, opts, cb) {

      var walletClient = bwcService.getClient(null, opts);

      $log.debug('Importing Wallet:', opts);
      try {
        walletClient.import(str, {
          compressed: opts.compressed,
          password: opts.password
        });
      } catch (err) {
        return cb(gettext('Could not import. Check input file and spending password'));
      }

      str = JSON.parse(str);

      var addressBook = str.addressBook || {};

      addAndBindWalletClient(walletClient, {
        bwsurl: opts.bwsurl
      }, function(err, walletId) {
        if (err) return cb(err);
        root.setMetaData(walletClient, addressBook, function(error) {
          if (error) $log.warn(error);
          return cb(err, walletClient);
        });
      });
    };

    root.importExtendedPrivateKey = function(xPrivKey, opts, cb) {
      var walletClient = bwcService.getClient(null, opts);
      $log.debug('Importing Wallet xPrivKey');

      walletClient.importFromExtendedPrivateKey(xPrivKey, opts, function(err) {
        if (err) {
          if (err instanceof errors.NOT_AUTHORIZED)
            return cb(err);

          return bwcError.cb(err, gettext('Could not import'), cb);
        }

        addAndBindWalletClient(walletClient, {
          bwsurl: opts.bwsurl
        }, cb);
      });
    };

    root._normalizeMnemonic = function(words) {
      var isJA = words.indexOf('\u3000') > -1;
      var wordList = words.split(/[\u3000\s]+/);

      return wordList.join(isJA ? '\u3000' : ' ');
    };

    root.importMnemonic = function(words, opts, cb) {
      var walletClient = bwcService.getClient(null, opts);

      $log.debug('Importing Wallet Mnemonic');

      words = root._normalizeMnemonic(words);
      walletClient.importFromMnemonic(words, {
        network: opts.networkName,
        passphrase: opts.passphrase,
        account: opts.account || 0,
      }, function(err) {
        if (err) {
          if (err instanceof errors.NOT_AUTHORIZED)
            return cb(err);

          return bwcError.cb(err, gettext('Could not import'), cb);
        }

        addAndBindWalletClient(walletClient, {
          bwsurl: opts.bwsurl
        }, cb);
      });
    };

    root.importExtendedPublicKey = function(opts, cb) {
      var walletClient = bwcService.getClient(null, opts);
      $log.debug('Importing Wallet XPubKey');

      walletClient.importFromExtendedPublicKey(opts.extendedPublicKey, opts.externalSource, opts.entropySource, {
        account: opts.account || 0,
        derivationStrategy: opts.derivationStrategy || 'BIP44',
      }, function(err) {
        if (err) {

          // in HW wallets, req key is always the same. They can't addAccess.
          if (err instanceof errors.NOT_AUTHORIZED)
            err.name = 'WALLET_DOES_NOT_EXIST';

          return bwcError.cb(err, gettext('Could not import'), cb);
        }

        addAndBindWalletClient(walletClient, {
          bwsurl: opts.bwsurl
        }, cb);
      });
    };

    root.createProfile = function(cb) {
      $log.info('Creating profile');
      var defaults = configService.getDefaults();

      configService.get(function(err) {
        if (err) $log.debug(err);

        var p = Profile.create();
        storageService.storeNewProfile(p, function(err) {
          if (err) return cb(err);
          root.bindProfile(p, function(err) {
            // ignore NONAGREEDDISCLAIMER
            if (err && err.toString().match('NONAGREEDDISCLAIMER')) return cb();
            return cb(err);
          });
        });
      });
    };

    root.createDefaultWallet = function(cb) {
      var opts = {};
      opts.m = 1;
      opts.n = 1;
      opts.network = 'livenet';
      root.createWallet(opts, cb);
    };

    root.setDisclaimerAccepted = function(cb) {
      root.profile.disclaimerAccepted = true;
      storageService.storeProfile(root.profile, function(err) {
        return cb(err);
      });
    };

    root.isDisclaimerAccepted = function(cb) {
      var disclaimerAccepted = root.profile && root.profile.disclaimerAccepted;
      if (disclaimerAccepted)
        return cb(true);

      // OLD flag
      storageService.getCopayDisclaimerFlag(function(err, val) {
        if (val) {
          root.profile.disclaimerAccepted = true;
          return cb(true);
        } else {
          return cb();
        }
      });
    };

    root.updateCredentials = function(credentials, cb) {
      root.profile.updateWallet(credentials);
      storageService.storeProfile(root.profile, cb);
    };

    root.getWallets = function(opts) {

      if (opts && !lodash.isObject(opts))
        throw "bad argument";

      opts = opts || {};

      var ret = lodash.values(root.wallet);

      if (opts.network) {
        ret = lodash.filter(ret, function(x) {
          return (x.credentials.network == opts.network);
        });
      }

      if (opts.n) {
        ret = lodash.filter(ret, function(w) {
          return (w.credentials.n == opts.n);
        });
      }

      if (opts.onlyComplete) {
        ret = lodash.filter(ret, function(w) {
          return w.isComplete();
        });
      } else {}

      return lodash.sortBy(ret, [

        function(x) {
          return x.isComplete();
        }, 'createdOn'
      ]);
    };

    root.toggleHideBalanceFlag = function(walletId, cb) {
      root.wallet[walletId].balanceHidden = !root.wallet[walletId].balanceHidden;
      storageService.setHideBalanceFlag(walletId, root.wallet[walletId].balanceHidden.toString(), cb);
    };

    root.getNotifications = function(opts, cb) {
      opts = opts || {};

      var TIME_STAMP = 60 * 60 * 24 * 7;
      var MAX = 100;

      var typeFilter1 = {
        'NewBlock': 1,
        'BalanceUpdated': 1,
        'NewOutgoingTxByThirdParty': 1,
        'NewAddress': 1,
        'TxProposalFinallyAccepted': 1,
        'TxProposalFinallyRejected': 1,
      };

      var typeFilter2 = {
        'TxProposalAcceptedBy': 1,
        'TxProposalRejectedBy': 1,
        'NewTxProposal': 1,
      }

      var w = root.getWallets();
      if (lodash.isEmpty(w)) return cb();

      var l = w.length,
        j = 0,
        notifications = [];


      function isActivityCached(wallet) {
        return wallet.cachedActivity && wallet.cachedActivity.isValid;
      };


      function updateNotifications(wallet, cb2) {
        if (isActivityCached(wallet) && !opts.force) return cb2();

        wallet.getNotifications({
          timeSpan: TIME_STAMP,
          includeOwn: true,
        }, function(err, n) {
          if (err) return cb2(err);

          wallet.cachedActivity = {
            n: n.slice(-MAX),
            isValid: true,
          };

          return cb2();
        });
      };

      function process(notifications) {
        if (!notifications) return [];

        var shown = lodash.sortBy(notifications, 'createdOn').reverse();

        shown = shown.splice(0, opts.limit || MAX);

        lodash.each(shown, function(x) {
          x.txpId = x.data ? x.data.txProposalId : null;
          x.txid = x.data ? x.data.txid : null;
          x.types = [x.type];

          if (x.data && x.data.amount)
            x.amountStr = txFormatService.formatAmountStr(x.data.amount);

          x.action = function() {
            // TODO?
            // $state.go('tabs.details', {
            //   walletId: x.walletId,
            //   txpId: x.txpId,
            //   txid: x.txid,
            // });
          };
        });

        var finale = shown; // GROUPING DISABLED!

        // var finale = [],
        // prev;
        //
        //
        // // Item grouping... DISABLED.
        //
        // // REMOVE (if we want 1-to-1 notification) ????
        // lodash.each(shown, function(x) {
        //   if (prev && prev.walletId === x.walletId && prev.txpId && prev.txpId === x.txpId && prev.creatorId && prev.creatorId === x.creatorId) {
        //     prev.types.push(x.type);
        //     prev.data = lodash.assign(prev.data, x.data);
        //     prev.txid = prev.txid || x.txid;
        //     prev.amountStr = prev.amountStr || x.amountStr;
        //     prev.creatorName = prev.creatorName || x.creatorName;
        //   } else {
        //     finale.push(x);
        //     prev = x;
        //   }
        // });
        //

        var u = bwcService.getUtils();
        lodash.each(finale, function(x) {
          if (x.data && x.data.message && x.wallet && x.wallet.credentials.sharedEncryptingKey) {
            // TODO TODO TODO => BWC
            x.message = u.decryptMessage(x.data.message, x.wallet.credentials.sharedEncryptingKey);
          }
        });

        return finale;
      };

      lodash.each(w, function(wallet) {
        updateNotifications(wallet, function(err) {
          j++;
          if (err) {
            $log.warn('Error updating notifications:' + err);
          } else {

            var n;

            n = lodash.filter(wallet.cachedActivity.n, function(x) {
              return !typeFilter1[x.type];
            });

            if (wallet.m == 1) {
              n = lodash.filter(n, function(x) {
                return !typeFilter2[x.type];
              });
            }

            var idToName = {};
            if (wallet.cachedStatus) {
              lodash.each(wallet.cachedStatus.wallet.copayers, function(c) {
                idToName[c.id] = c.name;
              });
            }

            lodash.each(n, function(x) {
              x.wallet = wallet;
              if (x.creatorId && wallet.cachedStatus) {
                x.creatorName = idToName[x.creatorId];
              };
            });

            notifications.push(n);
          }
          if (j == l) {
            notifications = lodash.sortBy(notifications, 'createdOn');
            notifications = lodash.compact(lodash.flatten(notifications)).slice(0, MAX);
            return cb(null, process(notifications));
          };
        });
      });
    };


    root.getTxps = function(opts, cb) {
      var MAX = 100;
      opts = opts || {};

      var w = root.getWallets();
      if (lodash.isEmpty(w)) return cb();

      var txps = [];

      lodash.each(w, function(x) {
        if (x.pendingTxps)
          txps = txps.concat(x.pendingTxps);
      });
      txps = lodash.sortBy(txps, 'pendingForUs', 'createdOn');
      txps = lodash.compact(lodash.flatten(txps)).slice(0, MAX);
      var n = txps.length;
      return cb(null, txps, n);
    };

    return root;
  });

'use strict';
angular.module('copayApp.services')
  .factory('pushNotificationsService', function($log, platformInfo, storageService, configService, lodash) {
    var root = {};
    var isCordova = platformInfo.isCordova;
    var isWP = platformInfo.isWP;
    var isIOS = platformInfo.isIOS;
    var isAndroid = platformInfo.isAndroid;

    var usePushNotifications = isCordova && !isWP;

    root.init = function(walletsClients) {
      var defaults = configService.getDefaults();
      var push = PushNotification.init(defaults.pushNotifications.config);

      push.on('registration', function(data) {
        if (root.token) return;
        $log.debug('Starting push notification registration');
        root.token = data.registrationId;
        var config = configService.getSync();
        if (config.pushNotifications.enabled) root.enableNotifications(walletsClients);
      });

      return push;
    }

    root.enableNotifications = function(walletsClients) {
      if (!usePushNotifications) return;

      var config = configService.getSync();
      if (!config.pushNotifications.enabled) return;

      if (!root.token) {
        $log.warn('No token available for this device. Cannot set push notifications');
        return;
      }

      lodash.forEach(walletsClients, function(walletClient) {
        var opts = {};
        opts.type = isIOS ? "ios" : isAndroid ? "android" : null;
        opts.token = root.token;
        root.subscribe(opts, walletClient, function(err, response) {
          if (err) $log.warn('Subscription error: ' + err.message + ': ' + JSON.stringify(opts));
          else $log.debug('Subscribed to push notifications service: ' + JSON.stringify(response));
        });
      });
    }

    root.disableNotifications = function(walletsClients) {
      if (!usePushNotifications) return;

      lodash.forEach(walletsClients, function(walletClient) {
        root.unsubscribe(walletClient, function(err) {
          if (err) $log.warn('Unsubscription error: ' + err.message);
          else $log.debug('Unsubscribed from push notifications service');
        });
      });
    }

    root.subscribe = function(opts, walletClient, cb) {
      if (!usePushNotifications) return cb();

      var config = configService.getSync();
      if (!config.pushNotifications.enabled) return;

      walletClient.pushNotificationsSubscribe(opts, function(err, resp) {
        if (err) return cb(err);
        return cb(null, resp);
      });
    }

    root.unsubscribe = function(walletClient, cb) {
      if (!usePushNotifications) return cb();

      walletClient.pushNotificationsUnsubscribe(function(err) {
        if (err) return cb(err);
        return cb(null);
      });
    }

    return root;

  });

'use strict';

//var util = require('util');
//var _ = require('lodash');
//var log = require('../util/log');
//var preconditions = require('preconditions').singleton();
//var request = require('request');

/*
  This class lets interfaces with BitPay's exchange rate API.
*/

var RateService = function(opts) {
  var self = this;

  opts = opts || {};
  self.httprequest = opts.httprequest; // || request;
  self.lodash = opts.lodash;

  self.SAT_TO_BTC = 1 / 1e8;
  self.BTC_TO_SAT = 1e8;
  self.UNAVAILABLE_ERROR = 'Service is not available - check for service.isAvailable() or use service.whenAvailable()';
  self.UNSUPPORTED_CURRENCY_ERROR = 'Currency not supported';

  self._url = opts.url || 'https://insight.bitpay.com:443/api/rates';

  self._isAvailable = false;
  self._rates = {};
  self._alternatives = [];
  self._queued = [];

  self._fetchCurrencies();
};


var _instance;
RateService.singleton = function(opts) {
  if (!_instance) {
    _instance = new RateService(opts);
  }
  return _instance;
};

RateService.prototype._fetchCurrencies = function() {
  var self = this;

  var backoffSeconds = 5;
  var updateFrequencySeconds = 5 * 60;
  var rateServiceUrl = 'https://bitpay.com/api/rates';

  var retrieve = function() {
    //log.info('Fetching exchange rates');
    self.httprequest.get(rateServiceUrl).success(function(res) {
      self.lodash.each(res, function(currency) {
        self._rates[currency.code] = currency.rate;
        self._alternatives.push({
          name: currency.name,
          isoCode: currency.code,
          rate: currency.rate
        });
      });
      self._isAvailable = true;
      self.lodash.each(self._queued, function(callback) {
        setTimeout(callback, 1);
      });
      setTimeout(retrieve, updateFrequencySeconds * 1000);
    }).error(function(err) {
      //log.debug('Error fetching exchange rates', err);
      setTimeout(function() {
        backoffSeconds *= 1.5;
        retrieve();
      }, backoffSeconds * 1000);
      return;
    });

  };

  retrieve();
};

RateService.prototype.getRate = function(code) {
  return this._rates[code];
};

RateService.prototype.getHistoricRate = function(code, date, cb) {
  var self = this;

  self.httprequest.get(self._url + '/' + code + '?ts=' + date)
    .success(function(body) {
      return cb(null, body.rate)
    })
    .error(function(err) {
      return cb(err)
    });

};

RateService.prototype.getHistoricRates = function(code, dates, cb) {
  var self = this;

  var tsList = dates.join(',');

  self.httprequest.get(self._url + '/' + code + '?ts=' + tsList)
    .success(function(body) {
      if (!self.lodash.isArray(body)) {
        body = [{
          ts: dates[0],
          rate: body.rate
        }];
      }
      return cb(null, body);
    })
    .error(function(err) {
      return cb(err)
    });
};

RateService.prototype.getAlternatives = function() {
  return this._alternatives;
};

RateService.prototype.isAvailable = function() {
  return this._isAvailable;
};

RateService.prototype.whenAvailable = function(callback) {
  if (this.isAvailable()) {
    setTimeout(callback, 1);
  } else {
    this._queued.push(callback);
  }
};

RateService.prototype.toFiat = function(satoshis, code) {
  if (!this.isAvailable()) {
    return null;
  }

  return satoshis * this.SAT_TO_BTC * this.getRate(code);
};

RateService.prototype.toFiatHistoric = function(satoshis, code, date, cb) {
  var self = this;

  self.getHistoricRate(code, date, function(err, rate) {
    if (err) return cb(err);
    return cb(null, satoshis * self.SAT_TO_BTC * rate);
  });
};

RateService.prototype.fromFiat = function(amount, code) {
  if (!this.isAvailable()) {
    return null;
  }
  return amount / this.getRate(code) * this.BTC_TO_SAT;
};

RateService.prototype.listAlternatives = function() {
  var self = this;
  if (!this.isAvailable()) {
    return [];
  }

  return self.lodash.map(this.getAlternatives(), function(item) {
    return {
      name: item.name,
      isoCode: item.isoCode
    }
  });
};

angular.module('copayApp.services').factory('rateService', function($http, lodash) {
  // var cfg = _.extend(config.rates, {
  //   httprequest: $http
  // });

  var cfg = {
    httprequest: $http,
    lodash: lodash
  };
  return RateService.singleton(cfg);
});


'use strict';
angular.module('copayApp.services')
  .factory('sjcl', function bitcoreFactory(bwcService) {
    var sjcl = bwcService.getSJCL();
    return sjcl;
  });

'use strict';
angular.module('copayApp.services')
  .factory('storageService', function(logHeader, fileStorageService, localStorageService, sjcl, $log, lodash, platformInfo) {

    var root = {};

    // File storage is not supported for writing according to
    // https://github.com/apache/cordova-plugin-file/#supported-platforms
    var shouldUseFileStorage = platformInfo.isCordova && !platformInfo.isWP;
    $log.debug('Using file storage:', shouldUseFileStorage);


    var storage = shouldUseFileStorage ? fileStorageService : localStorageService;

    var getUUID = function(cb) {
      // TO SIMULATE MOBILE
      //return cb('hola');
      if (!window || !window.plugins || !window.plugins.uniqueDeviceID)
        return cb(null);

      window.plugins.uniqueDeviceID.get(
        function(uuid) {
          return cb(uuid);
        }, cb);
    };

    var decryptOnMobile = function(text, cb) {
      var json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        $log.warn('Could not open profile:' + text);

        var i = text.lastIndexOf('}{');
        if (i > 0) {
          text = text.substr(i + 1);
          $log.warn('trying last part only:' + text);
          try {
            json = JSON.parse(text);
            $log.warn('Worked... saving.');
            storage.set('profile', text, function() {});
          } catch (e) {
            $log.warn('Could not open profile (2nd try):' + e);
          };
        };

      };

      if (!json) return cb('Could not access storage')

      if (!json.iter || !json.ct) {
        $log.debug('Profile is not encrypted');
        return cb(null, text);
      }

      $log.debug('Profile is encrypted');
      getUUID(function(uuid) {
        $log.debug('Device UUID:' + uuid);
        if (!uuid)
          return cb('Could not decrypt storage: could not get device ID');

        try {
          text = sjcl.decrypt(uuid, text);

          $log.info('Migrating to unencrypted profile');
          return storage.set('profile', text, function(err) {
            return cb(err, text);
          });
        } catch (e) {
          $log.warn('Decrypt error: ', e);
          return cb('Could not decrypt storage: device ID mismatch');
        };
        return cb(null, text);
      });
    };



    root.tryToMigrate = function(cb) {
      if (!shouldUseFileStorage) return cb();

      localStorageService.get('profile', function(err, str) {
        if (err) return cb(err);
        if (!str) return cb();

        $log.info('Starting Migration profile to File storage...');

        fileStorageService.create('profile', str, function(err) {
          if (err) cb(err);
          $log.info('Profile Migrated successfully');

          localStorageService.get('config', function(err, c) {
            if (err) return cb(err);
            if (!c) return root.getProfile(cb);

            fileStorageService.create('config', c, function(err) {

              if (err) {
                $log.info('Error migrating config: ignoring', err);
                return root.getProfile(cb);
              }
              $log.info('Config Migrated successfully');
              return root.getProfile(cb);
            });
          });
        });
      });
    };

    root.storeNewProfile = function(profile, cb) {
      storage.create('profile', profile.toObj(), cb);
    };

    root.storeProfile = function(profile, cb) {
      storage.set('profile', profile.toObj(), cb);
    };

    root.getProfile = function(cb) {
      storage.get('profile', function(err, str) {
        if (err || !str)
          return cb(err);

        decryptOnMobile(str, function(err, str) {
          if (err) return cb(err);
          var p, err;
          try {
            p = Profile.fromString(str);
          } catch (e) {
            $log.debug('Could not read profile:', e);
            err = new Error('Could not read profile:' + p);
          }
          return cb(err, p);
        });
      });
    };

    root.deleteProfile = function(cb) {
      storage.remove('profile', cb);
    };

    root.storeFocusedWalletId = function(id, cb) {
      storage.set('focusedWalletId', id || '', cb);
    };

    root.getFocusedWalletId = function(cb) {
      storage.get('focusedWalletId', cb);
    };

    root.getLastAddress = function(walletId, cb) {
      storage.get('lastAddress-' + walletId, cb);
    };

    root.storeLastAddress = function(walletId, address, cb) {
      storage.set('lastAddress-' + walletId, address, cb);
    };

    root.clearLastAddress = function(walletId, cb) {
      storage.remove('lastAddress-' + walletId, cb);
    };

    root.setBackupFlag = function(walletId, cb) {
      storage.set('backup-' + walletId, Date.now(), cb);
    };

    root.getBackupFlag = function(walletId, cb) {
      storage.get('backup-' + walletId, cb);
    };

    root.clearBackupFlag = function(walletId, cb) {
      storage.remove('backup-' + walletId, cb);
    };

    root.setCleanAndScanAddresses = function(walletId, cb) {
      storage.set('CleanAndScanAddresses', walletId, cb);
    };

    root.getCleanAndScanAddresses = function(cb) {
      storage.get('CleanAndScanAddresses', cb);
    };

    root.removeCleanAndScanAddresses = function(cb) {
      storage.remove('CleanAndScanAddresses', cb);
    };

    root.getConfig = function(cb) {
      storage.get('config', cb);
    };

    root.storeConfig = function(val, cb) {
      $log.debug('Storing Preferences', val);
      storage.set('config', val, cb);
    };

    root.clearConfig = function(cb) {
      storage.remove('config', cb);
    };

    root.setHideBalanceFlag = function(walletId, val, cb) {
      storage.set('hideBalance-' + walletId, val, cb);
    };

    root.getHideBalanceFlag = function(walletId, cb) {
      storage.get('hideBalance-' + walletId, cb);
    };

    //for compatibility
    root.getCopayDisclaimerFlag = function(cb) {
      storage.get('agreeDisclaimer', cb);
    };

    root.setRemotePrefsStoredFlag = function(cb) {
      storage.set('remotePrefStored', true, cb);
    };

    root.getRemotePrefsStoredFlag = function(cb) {
      storage.get('remotePrefStored', cb);
    };

    root.setGlideraToken = function(network, token, cb) {
      storage.set('glideraToken-' + network, token, cb);
    };

    root.getGlideraToken = function(network, cb) {
      storage.get('glideraToken-' + network, cb);
    };

    root.removeGlideraToken = function(network, cb) {
      storage.remove('glideraToken-' + network, cb);
    };

    root.setCoinbaseRefreshToken = function(network, token, cb) {
      storage.set('coinbaseRefreshToken-' + network, token, cb);
    };

    root.getCoinbaseRefreshToken = function(network, cb) {
      storage.get('coinbaseRefreshToken-' + network, cb);
    };

    root.removeCoinbaseRefreshToken = function(network, cb) {
      storage.remove('coinbaseRefreshToken-' + network, cb);
    };

    root.setCoinbaseToken = function(network, token, cb) {
      storage.set('coinbaseToken-' + network, token, cb);
    };

    root.getCoinbaseToken = function(network, cb) {
      storage.get('coinbaseToken-' + network, cb);
    };

    root.removeCoinbaseToken = function(network, cb) {
      storage.remove('coinbaseToken-' + network, cb);
    };

    root.setAddressbook = function(network, addressbook, cb) {
      storage.set('addressbook-' + network, addressbook, cb);
    };

    root.getAddressbook = function(network, cb) {
      storage.get('addressbook-' + network, cb);
    };

    root.removeAddressbook = function(network, cb) {
      storage.remove('addressbook-' + network, cb);
    };

    root.setNextStep = function(service, status, cb) {
      storage.set('nextStep-' + service, status, cb);
    };

    root.getNextStep = function(service, cb) {
      storage.get('nextStep-' + service, cb);
    };

    root.removeNextStep = function(service, cb) {
      storage.remove('nextStep-' + service, cb);
    };

    root.setLastState = function(state, toParams, cb) {
      storage.set('lastState', state, toParams, cb);
    };

    root.getLastState = function(cb) {
      storage.get('lastState', cb);
    };

    root.checkQuota = function() {
      var block = '';
      // 50MB
      for (var i = 0; i < 1024 * 1024; ++i) {
        block += '12345678901234567890123456789012345678901234567890';
      }
      storage.set('test', block, function(err) {
        $log.error('CheckQuota Return:' + err);
      });
    };

    root.setTxHistory = function(txs, walletId, cb) {
      try {
        storage.set('txsHistory-' + walletId, txs, cb);
      } catch (e) {
        $log.error('Error saving tx History. Size:' + txs.length);
        $log.error(e);
        return cb(e);
      }
    }

    root.getTxHistory = function(walletId, cb) {
      storage.get('txsHistory-' + walletId, cb);
    }

    root.removeTxHistory = function(walletId, cb) {
      storage.remove('txsHistory-' + walletId, cb);
    }

    root.setCoinbaseTxs = function(network, ctx, cb) {
      storage.set('coinbaseTxs-' + network, ctx, cb);
    };

    root.getCoinbaseTxs = function(network, cb) {
      storage.get('coinbaseTxs-' + network, cb);
    };

    root.removeCoinbaseTxs = function(network, cb) {
      storage.remove('coinbaseTxs-' + network, cb);
    };

    root.setBitpayCard = function(network, data, cb) {
      storage.set('bitpayCard-' + network, data, cb);
    };

    root.getBitpayCard = function(network, cb) {
      storage.get('bitpayCard-' + network, cb);
    };

    root.removeBitpayCard = function(network, cb) {
      storage.remove('bitpayCard-' + network, cb);
    };

    root.removeAllWalletData = function(walletId, cb) {
      root.clearLastAddress(walletId, function(err) {
        if (err) return cb(err);
        root.removeTxHistory(walletId, function(err) {
          if (err) return cb(err);
          root.clearBackupFlag(walletId, function(err) {
            return cb(err);
          });
        });
      });
    };

    root.setScanTipsAccepted = function(val, cb) {
      storage.set('scanTips', val, cb);
    };

    root.getScanTipsAccepted = function(cb) {
      storage.get('scanTips', cb);
    };

    root.setReceiveTipsAccepted = function(val, cb) {
      storage.set('receiveTips', val, cb);
    };

    root.getReceiveTipsAccepted = function(cb) {
      storage.get('receiveTips', cb);
    };

    root.setBackupNeededModalFlag = function(walletId, val, cb) {
      storage.set('showBackupNeededModal-' + walletId, val, cb);
    };

    root.getBackupNeededModalFlag = function(walletId, cb) {
      storage.get('showBackupNeededModal-' + walletId, cb);
    };

    root.setAmazonGiftCards = function(network, gcs, cb) {
      storage.set('amazonGiftCards-' + network, gcs, cb);
    };

    root.getAmazonGiftCards = function(network, cb) {
      storage.get('amazonGiftCards-' + network, cb);
    };

    root.removeAmazonGiftCards = function(network, cb) {
      storage.remove('amazonGiftCards-' + network, cb);
    };

    return root;
  });

'use strict';

angular.module('copayApp.services')
  .factory('trezor', function($log, $timeout, gettext, lodash, bitcore, hwWallet) {
    var root = {};

    var SETTLE_TIME = 3000;
    root.callbacks = {};

    root.getEntropySource = function(isMultisig, account, callback) {
      root.getXPubKey(hwWallet.getEntropyPath('trezor', isMultisig, account), function(data) {
        if (!data.success)
          return callback(hwWallet._err(data));

        return callback(null, hwWallet.pubKeyToEntropySource(data.xpubkey));
      });
    };


    root.getXPubKey = function(path, callback) {
      $log.debug('TREZOR deriving xPub path:', path);
      TrezorConnect.getXPubKey(path, callback);
    };


    root.getInfoForNewWallet = function(isMultisig, account, callback) {
      var opts = {};
      root.getEntropySource(isMultisig, account, function(err, data) {
        if (err) return callback(err);
        opts.entropySource = data;
        $log.debug('Waiting TREZOR to settle...');
        $timeout(function() {

          root.getXPubKey(hwWallet.getAddressPath('trezor', isMultisig, account), function(data) {
            if (!data.success)
              return callback(hwWallet._err(data));

            opts.extendedPublicKey = data.xpubkey;
            opts.externalSource = 'trezor';
            opts.account = account;

            if (isMultisig)
              opts.derivationStrategy = 'BIP48';

            return callback(null, opts);
          });
        }, SETTLE_TIME);
      });
    };

    root._orderPubKeys = function(xPub, np) {
      var xPubKeys = lodash.clone(xPub);
      var path = lodash.clone(np);
      path.unshift('m');
      path = path.join('/');

      var keys = lodash.map(xPubKeys, function(x) {
        var pub = (new bitcore.HDPublicKey(x)).derive(path).publicKey;
        return {
          xpub: x,
          pub: pub.toString('hex'),
        };
      });

      var sorted = lodash.sortBy(keys, function(x) {
        return x.pub;
      });

      return lodash.pluck(sorted, 'xpub');
    };

    root.signTx = function(xPubKeys, txp, account, callback) {

      var inputs = [],
        outputs = [];
      var tmpOutputs = [];


      if (txp.type && txp.type != 'simple') {
        return callback('Only TXPs type SIMPLE are supported in TREZOR');
      } else if (txp.outputs) {
        if (txp.outputs.length > 1)
          return callback('Only single output TXPs are supported in TREZOR');
      } else {
          return callback('Unknown TXP at TREZOR');
      }

      if (txp.outputs) {

        if (!txp.toAddress)
          txp.toAddress = txp.outputs[0].toAddress;

        if (!txp.amount)
          txp.amount = txp.outputs[0].amount;
      }

      if (!txp.toAddress || !txp.amount)
        return callback('No address or amount at TREZOR signing');


      var toScriptType = 'PAYTOADDRESS';
      if (txp.toAddress.charAt(0) == '2' || txp.toAddress.charAt(0) == '3')
        toScriptType = 'PAYTOSCRIPTHASH';


      // Add to
      tmpOutputs.push({
        address: txp.toAddress,
        amount: txp.amount,
        script_type: toScriptType,
      });



      if (txp.addressType == 'P2PKH') {

        $log.debug("Trezor signing uni-sig p2pkh. Account:", account);

        var inAmount = 0;
        inputs = lodash.map(txp.inputs, function(i) {
          $log.debug("Trezor TX input path:", i.path);
          var pathArr = i.path.split('/');
          var n = [hwWallet.UNISIG_ROOTPATH | 0x80000000, 0 | 0x80000000, account | 0x80000000, parseInt(pathArr[1]), parseInt(pathArr[2])];
          inAmount += i.satoshis;
          return {
            address_n: n,
            prev_index: i.vout,
            prev_hash: i.txid,
          };
        });

        var change = inAmount - txp.fee - txp.amount;
        if (change > 0) {
          $log.debug("Trezor TX change path:", txp.changeAddress.path);
          var pathArr = txp.changeAddress.path.split('/');
          var n = [hwWallet.UNISIG_ROOTPATH | 0x80000000, 0 | 0x80000000, account | 0x80000000, parseInt(pathArr[1]), parseInt(pathArr[2])];

          tmpOutputs.push({
            address_n: n,
            amount: change,
            script_type: 'PAYTOADDRESS'
          });
        }

      } else {

        // P2SH Wallet, multisig wallet
        var inAmount = 0;
        $log.debug("Trezor signing multi-sig p2sh. Account:", account);

        var sigs = xPubKeys.map(function(v) {
          return '';
        });


        inputs = lodash.map(txp.inputs, function(i) {
          $log.debug("Trezor TX input path:", i.path);
          var pathArr = i.path.split('/');
          var n = [hwWallet.MULTISIG_ROOTPATH | 0x80000000, 0 | 0x80000000, account | 0x80000000, parseInt(pathArr[1]), parseInt(pathArr[2])];
          var np = n.slice(3);

          inAmount += i.satoshis;

          var orderedPubKeys = root._orderPubKeys(xPubKeys, np);
          var pubkeys = lodash(orderedPubKeys.map(function(v) {
            return {
              node: v,
              address_n: np,
            };
          }));

          return {
            address_n: n,
            prev_index: i.vout,
            prev_hash: i.txid,
            script_type: 'SPENDMULTISIG',
            multisig: {
              pubkeys: pubkeys,
              signatures: sigs,
              m: txp.requiredSignatures,
            }
          };
        });

        var change = inAmount - txp.fee - txp.amount;
        if (change > 0) {
          $log.debug("Trezor TX change path:", txp.changeAddress.path);
          var pathArr = txp.changeAddress.path.split('/');
          var n = [hwWallet.MULTISIG_ROOTPATH | 0x80000000, 0 | 0x80000000, account | 0x80000000, parseInt(pathArr[1]), parseInt(pathArr[2])];
          var np = n.slice(3);

          var orderedPubKeys = root._orderPubKeys(xPubKeys, np);
          var pubkeys = lodash(orderedPubKeys.map(function(v) {
            return {
              node: v,
              address_n: np,
            };
          }));

          tmpOutputs.push({
            address_n: n,
            amount: change,
            script_type: 'PAYTOMULTISIG',
            multisig: {
              pubkeys: pubkeys,
              signatures: sigs,
              m: txp.requiredSignatures,
            }
          });
        }
      }

      // Shuffle outputs for improved privacy
      if (tmpOutputs.length > 1) {
        outputs = new Array(tmpOutputs.length);
        lodash.each(txp.outputOrder, function(order) {
          outputs[order] = tmpOutputs.shift();
        });

        if (tmpOutputs.length)
          return cb("Error creating transaction: tmpOutput order");
      } else {
        outputs = tmpOutputs;
      }

      // Prevents: Uncaught DataCloneError: Failed to execute 'postMessage' on 'Window': An object could not be cloned.
      inputs = JSON.parse(JSON.stringify(inputs));
      outputs = JSON.parse(JSON.stringify(outputs));

      $log.debug('Signing with TREZOR', inputs, outputs);
      TrezorConnect.signTx(inputs, outputs, function(res) {
        if (!res.success)
          return callback(hwWallet._err(res));

        callback(null, res);
      });
    };

    return root;
  });

'use strict';

angular.module('copayApp.services').factory('txFormatService', function(bwcService, rateService, configService, lodash) {
  var root = {};

  root.Utils = bwcService.getUtils();


  root.formatAmount = function(satoshis, fullPrecision) {
    var config = configService.getSync().wallet.settings;
    if (config.unitCode == 'sat') return satoshis;

    //TODO : now only works for english, specify opts to change thousand separator and decimal separator
    var opts = {
      fullPrecision: !!fullPrecision
    };
    return this.Utils.formatAmount(satoshis, config.unitCode, opts);
  };

  root.formatAmountStr = function(satoshis) {
    if (!satoshis) return;
    var config = configService.getSync().wallet.settings;
    return root.formatAmount(satoshis) + ' ' + config.unitName;
  };

  root.formatToUSD = function(satoshis, cb) {
    if (!satoshis) return;
    var val = function() {
      var v1 = rateService.toFiat(satoshis, 'USD');
      if (!v1) return null;

      return v1.toFixed(2);
    };

    // Async version
    if (cb) {
      rateService.whenAvailable(function() {
        return cb(val());
      });
    } else {
      if (!rateService.isAvailable()) return null;
      return val();
    };
  };

  root.formatAlternativeStr = function(satoshis, cb) {
    if (!satoshis) return;
    var config = configService.getSync().wallet.settings;

    var val = function() {
      var v1 = rateService.toFiat(satoshis, config.alternativeIsoCode);
      if (!v1) return null;

      return v1.toFixed(2) + ' ' + config.alternativeIsoCode;
    };

    // Async version
    if (cb) {
      rateService.whenAvailable(function() {
        return cb(val());
      });
    } else {
      if (!rateService.isAvailable()) return null;
      return val();
    };
  };

  root.processTx = function(tx) {
    if (!tx || tx.action == 'invalid')
      return tx;

    // New transaction output format
    if (tx.outputs && tx.outputs.length) {

      var outputsNr = tx.outputs.length;

      if (tx.action != 'received') {
        if (outputsNr > 1) {
          tx.recipientCount = outputsNr;
          tx.hasMultiplesOutputs = true;
        }
        tx.amount = lodash.reduce(tx.outputs, function(total, o) {
          o.amountStr = root.formatAmountStr(o.amount);
          o.alternativeAmountStr = root.formatAlternativeStr(o.amount);
          return total + o.amount;
        }, 0);
      }
      tx.toAddress = tx.outputs[0].toAddress;
    }

    tx.amountStr = root.formatAmountStr(tx.amount);
    tx.alternativeAmountStr = root.formatAlternativeStr(tx.amount);
    tx.feeStr = root.formatAmountStr(tx.fee || tx.fees);

    return tx;
  };

  root.formatPendingTxps = function(txps) {
    $scope.pendingTxProposalsCountForUs = 0;
    var now = Math.floor(Date.now() / 1000);

    /* To test multiple outputs...
    var txp = {
      message: 'test multi-output',
      fee: 1000,
      createdOn: new Date() / 1000,
      outputs: []
    };
    function addOutput(n) {
      txp.outputs.push({
        amount: 600,
        toAddress: '2N8bhEwbKtMvR2jqMRcTCQqzHP6zXGToXcK',
        message: 'output #' + (Number(n) + 1)
      });
    };
    lodash.times(150, addOutput);
    txps.push(txp);
    */

    lodash.each(txps, function(tx) {

      tx = txFormatService.processTx(tx);

      // no future transactions...
      if (tx.createdOn > now)
        tx.createdOn = now;

      tx.wallet = profileService.getWallet(tx.walletId);
      if (!tx.wallet) {
        $log.error("no wallet at txp?");
        return;
      }

      var action = lodash.find(tx.actions, {
        copayerId: tx.wallet.copayerId
      });

      if (!action && tx.status == 'pending') {
        tx.pendingForUs = true;
      }

      if (action && action.type == 'accept') {
        tx.statusForUs = 'accepted';
      } else if (action && action.type == 'reject') {
        tx.statusForUs = 'rejected';
      } else {
        tx.statusForUs = 'pending';
      }

      if (!tx.deleteLockTime)
        tx.canBeRemoved = true;
    });

    return txps;
  };

  return root;
});

'use strict';

angular.module('copayApp.services').factory('txpModalService', function(configService, profileService, $rootScope, $ionicModal) {

  var root = {};


  var glideraActive = true; // TODO TODO TODO
  // isGlidera flag is a security measure so glidera status is not
  // only determined by the tx.message


  root.open = function(tx) {
    var wallet = tx.wallet ? tx.wallet : profileService.getWallet(tx.walletId);
    var config = configService.getSync().wallet;
    var scope = $rootScope.$new(true);
    scope.tx = tx;
    if (!scope.tx.toAddress) scope.tx.toAddress = tx.outputs[0].toAddress;
    scope.wallet = wallet;
    scope.copayers = wallet ? wallet.copayers : null;
    scope.isGlidera = glideraActive;
    scope.currentSpendUnconfirmed = config.spendUnconfirmed;
    // scope.tx.hasMultiplesOutputs = true;  // Uncomment to test multiple outputs

    $ionicModal.fromTemplateUrl('views/modals/txp-details.html', {
      scope: scope
    }).then(function(modal) {
      scope.txpDetailsModal = modal;
      scope.txpDetailsModal.show();
    });
  };

  return root;
});

'use strict';
angular.module('copayApp.services')
  .factory('uxLanguage', function languageService($log, lodash, gettextCatalog, amMoment, configService) {
    var root = {};

    root.currentLanguage = null;

    root.availableLanguages = [{
      name: 'English',
      isoCode: 'en',
    }, {
      name: 'Český',
      isoCode: 'cs',
    }, {
      name: 'Français',
      isoCode: 'fr',
    }, {
      name: 'Italiano',
      isoCode: 'it',
    }, {
      name: 'Deutsch',
      isoCode: 'de',
    }, {
      name: 'Español',
      isoCode: 'es',
    }, {
      name: '日本語',
      isoCode: 'ja',
      useIdeograms: true,
    }, {
      name: '中文（简体）',
      isoCode: 'zh',
      useIdeograms: true,
    }, {
      name: 'Polski',
      isoCode: 'pl',
    }, {
      name: 'Pусский',
      isoCode: 'ru',
    }];


    root._detect = function(cb) {

      var userLang, androidLang;
      if (navigator && navigator.globalization) {

        navigator.globalization.getPreferredLanguage(function(preferedLanguage) {
          // works for iOS and Android 4.x
          userLang = preferedLanguage.value;
          userLang = userLang ? (userLang.split('-', 1)[0] || 'en') : 'en';
          // Set only available languages
          userLang = root.isAvailableLanguage(userLang);
          return cb(userLang);
        });
      } else {
        // Auto-detect browser language
        userLang = navigator.userLanguage || navigator.language;
        userLang = userLang ? (userLang.split('-', 1)[0] || 'en') : 'en';
        // Set only available languages
        userLang = root.isAvailableLanguage(userLang);
        return cb(userLang);
      }
    };

    root.isAvailableLanguage = function(userLang) {
      return lodash.find(root.availableLanguages, {
        'isoCode': userLang
      }) ? userLang : 'en';
    };

    root._set = function(lang) {
      $log.debug('Setting default language: ' + lang);
      gettextCatalog.setCurrentLanguage(lang);
      root.currentLanguage = lang;

      if (lang == 'zh') lang = lang + '-CN'; // Fix for Chinese Simplified
      amMoment.changeLocale(lang);
    };

    root.getCurrentLanguage = function() {
      return root.currentLanguage;
    };

    root.getCurrentLanguageName = function() {
      return root.getName(root.currentLanguage);
    };

    root.getCurrentLanguageInfo = function() {
      return lodash.find(root.availableLanguages, {
        'isoCode': root.currentLanguage
      });
    };

    root.getLanguages = function() {
      return root.availableLanguages;
    };

    root.init = function(cb) {
      configService.whenAvailable(function(config) {
        var userLang = config.wallet.settings.defaultLanguage;

        if (userLang && userLang != root.currentLanguage) {
          root._set(userLang);
        } else {
          root._detect(function(lang) {
            root._set(lang);
          });
        }
        if (cb) return cb();
      });
    };

    root.getName = function(lang) {
      return lodash.result(lodash.find(root.availableLanguages, {
        'isoCode': lang
      }), 'name');
    };

    return root;
  });

'use strict';

angular.module('copayApp.services').factory('walletService', function($log, $timeout, lodash, trezor, ledger, storageService, configService, rateService, uxLanguage, $filter, gettextCatalog, bwcError, $ionicPopup, fingerprintService, ongoingProcess, gettext, $rootScope, txFormatService, $ionicModal, $state, bwcService, bitcore, popupService) {
  // `wallet` is a decorated version of client.

  var root = {};

  root.WALLET_STATUS_MAX_TRIES = 7;
  root.WALLET_STATUS_DELAY_BETWEEN_TRIES = 1.4 * 1000;
  root.SOFT_CONFIRMATION_LIMIT = 12;
  root.SAFE_CONFIRMATIONS = 6;

  var errors = bwcService.getErrors();

  // UI Related
  root.openStatusModal = function(type, txp, cb) {
    var scope = $rootScope.$new(true);
    scope.type = type;
    scope.tx = txFormatService.processTx(txp);
    scope.color = txp.color;
    scope.cb = cb;

    $ionicModal.fromTemplateUrl('views/modals/tx-status.html', {
      scope: scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      scope.txStatusModal = modal;
      scope.txStatusModal.show();
    });
  };

  // // RECEIVE
  // // Check address
  // root.isUsed(wallet.walletId, balance.byAddress, function(err, used) {
  //   if (used) {
  //     $log.debug('Address used. Creating new');
  //     $rootScope.$emit('Local/AddressIsUsed');
  //   }
  // });
  //

  var _signWithLedger = function(wallet, txp, cb) {
    $log.info('Requesting Ledger Chrome app to sign the transaction');

    ledger.signTx(txp, wallet.credentials.account, function(result) {
      $log.debug('Ledger response', result);
      if (!result.success)
        return cb(result.message || result.error);

      txp.signatures = lodash.map(result.signatures, function(s) {
        return s.substring(0, s.length - 2);
      });
      return wallet.signTxProposal(txp, cb);
    });
  };

  var _signWithTrezor = function(wallet, txp, cb) {
    $log.info('Requesting Trezor  to sign the transaction');

    var xPubKeys = lodash.pluck(wallet.credentials.publicKeyRing, 'xPubKey');
    trezor.signTx(xPubKeys, txp, wallet.credentials.account, function(err, result) {
      if (err) return cb(err);

      $log.debug('Trezor response', result);
      txp.signatures = result.signatures;
      return wallet.signTxProposal(txp, cb);
    });
  };

  // TODO
  // This handles errors from BWS/index which normally
  // trigger from async events (like updates).
  // Debounce function avoids multiple popups
  var _handleError = function(err) {
    $log.warn('wallet ERROR: ', err);

    $log.warn('TODO');
    return; // TODO!!!
    if (err instanceof errors.NOT_AUTHORIZED) {

      console.log('[walletService.js.93] TODO NOT AUTH'); //TODO
      // TODO  TODO  TODO  TODO  TODO  TODO  TODO  TODO  TODO  TODO  TODO  TODO  TODO  TODO
      wallet.notAuthorized = true;
      $state.go('tabs.home');
    } else if (err instanceof errors.NOT_FOUND) {
      popupService.showAlert(gettextCatalog.getString('Could not access Wallet Service: Not found'));
    } else {
      var msg = ""
      $rootScope.$emit('Local/ClientError', (err.error ? err.error : err));
      popupService.showAlert(bwcError.msg(err, gettextCatalog.getString('Error at Wallet Service')));
    }
  };
  root.handleError = lodash.debounce(_handleError, 1000);


  root.invalidateCache = function(wallet) {
    if (wallet.cachedStatus)
      wallet.cachedStatus.isValid = false;

    if (wallet.completeHistory)
      wallet.completeHistory.isValid = false;

    if (wallet.cachedActivity)
      wallet.cachedActivity.isValid = false;

    if (wallet.cachedTxps)
      wallet.cachedTxps.isValid = false;
  };

  root.getStatus = function(wallet, opts, cb) {
    opts = opts || {};


    function processPendingTxps(status) {
      var txps = status.pendingTxps;
      var now = Math.floor(Date.now() / 1000);

      /* To test multiple outputs...
      var txp = {
        message: 'test multi-output',
        fee: 1000,
        createdOn: new Date() / 1000,
        outputs: []
      };
      function addOutput(n) {
        txp.outputs.push({
          amount: 600,
          toAddress: '2N8bhEwbKtMvR2jqMRcTCQqzHP6zXGToXcK',
          message: 'output #' + (Number(n) + 1)
        });
      };
      lodash.times(150, addOutput);
      txps.push(txp);
      */

      lodash.each(txps, function(tx) {

        tx = txFormatService.processTx(tx);

        // no future transactions...
        if (tx.createdOn > now)
          tx.createdOn = now;

        tx.wallet = wallet;

        if (!tx.wallet) {
          $log.error("no wallet at txp?");
          return;
        }

        var action = lodash.find(tx.actions, {
          copayerId: tx.wallet.copayerId
        });

        if (!action && tx.status == 'pending') {
          tx.pendingForUs = true;
        }

        if (action && action.type == 'accept') {
          tx.statusForUs = 'accepted';
        } else if (action && action.type == 'reject') {
          tx.statusForUs = 'rejected';
        } else {
          tx.statusForUs = 'pending';
        }

        if (!tx.deleteLockTime)
          tx.canBeRemoved = true;
      });

      wallet.pendingTxps = txps;
    };


    function get(cb) {
      wallet.getStatus({
        twoStep: true
      }, function(err, ret) {
        if (err) {
          if (err instanceof errors.NOT_AUTHORIZED) {
            return cb('WALLET_NOT_REGISTERED');
          }
          return cb(bwcError.msg(err, gettext('Could not update Wallet')));
        }
        return cb(null, ret);
      });
    };

    function cacheBalance(wallet, balance) {
      if (!balance) return;

      var config = configService.getSync().wallet;

      var cache = wallet.cachedStatus;

      // Address with Balance
      cache.balanceByAddress = balance.byAddress;

      // Spend unconfirmed funds
      if (config.spendUnconfirmed) {
        cache.totalBalanceSat = balance.totalAmount;
        cache.lockedBalanceSat = balance.lockedAmount;
        cache.availableBalanceSat = balance.availableAmount;
        cache.totalBytesToSendMax = balance.totalBytesToSendMax;
        cache.pendingAmount = null;
      } else {
        cache.totalBalanceSat = balance.totalConfirmedAmount;
        cache.lockedBalanceSat = balance.lockedConfirmedAmount;
        cache.availableBalanceSat = balance.availableConfirmedAmount;
        cache.totalBytesToSendMax = balance.totalBytesToSendConfirmedMax;
        cache.pendingAmount = balance.totalAmount - balance.totalConfirmedAmount;
      }

      // Selected unit
      cache.unitToSatoshi = config.settings.unitToSatoshi;
      cache.satToUnit = 1 / cache.unitToSatoshi;
      cache.unitName = config.settings.unitName;

      //STR
      cache.totalBalanceStr = txFormatService.formatAmount(cache.totalBalanceSat) + ' ' + cache.unitName;
      cache.lockedBalanceStr = txFormatService.formatAmount(cache.lockedBalanceSat) + ' ' + cache.unitName;
      cache.availableBalanceStr = txFormatService.formatAmount(cache.availableBalanceSat) + ' ' + cache.unitName;

      if (cache.pendingAmount) {
        cache.pendingAmountStr = txFormatService.formatAmount(cache.pendingAmount) + ' ' + cache.unitName;
      } else {
        cache.pendingAmountStr = null;
      }

      cache.alternativeName = config.settings.alternativeName;
      cache.alternativeIsoCode = config.settings.alternativeIsoCode;

      rateService.whenAvailable(function() {

        var totalBalanceAlternative = rateService.toFiat(cache.totalBalanceSat, cache.alternativeIsoCode);
        var lockedBalanceAlternative = rateService.toFiat(cache.lockedBalanceSat, cache.alternativeIsoCode);
        var alternativeConversionRate = rateService.toFiat(100000000, cache.alternativeIsoCode);

        cache.totalBalanceAlternative = $filter('formatFiatAmount')(totalBalanceAlternative);
        cache.lockedBalanceAlternative = $filter('formatFiatAmount')(lockedBalanceAlternative);
        cache.alternativeConversionRate = $filter('formatFiatAmount')(alternativeConversionRate);

        cache.alternativeBalanceAvailable = true;
        cache.isRateAvailable = true;
      });
    };

    function isStatusCached() {
      return wallet.cachedStatus && wallet.cachedStatus.isValid;
    };

    function cacheStatus(status) {
      wallet.cachedStatus = status ||  {};
      var cache = wallet.cachedStatus;
      cache.statusUpdatedOn = Date.now();
      cache.isValid = true;
      cache.email = status.preferences ? status.preferences.email : null;
      cacheBalance(wallet, status.balance);
    };

    function walletStatusHash(status) {
      return status ? status.balance.totalAmount : wallet.totalBalanceSat;
    };

    function _getStatus(initStatusHash, tries, cb) {
      if (isStatusCached() && !opts.force) {
        $log.debug('Wallet status cache hit:' + wallet.id);
        cacheStatus(wallet.cachedStatus);
        processPendingTxps(wallet.cachedStatus);
        return cb(null, wallet.cachedStatus);
      };

      tries = tries || 0;

      $log.debug('Updating Status:', wallet.credentials.walletName, tries);
      get(function(err, status) {
        if (err) return cb(err);

        var currentStatusHash = walletStatusHash(status);
        $log.debug('Status update. hash:' + currentStatusHash + ' Try:' + tries);
        if (opts.untilItChanges &&
          initStatusHash == currentStatusHash &&
          tries < root.WALLET_STATUS_MAX_TRIES &&
          walletId == wallet.credentials.walletId) {
          return $timeout(function() {
            $log.debug('Retrying update... ' + walletId + ' Try:' + tries)
            return _getStatus(initStatusHash, ++tries, cb);
          }, root.WALLET_STATUS_DELAY_BETWEEN_TRIES * tries);
        }

        processPendingTxps(status);

        $log.debug('Got Wallet Status for:' + wallet.credentials.walletName);

        cacheStatus(status);

        return cb(null, status);
      });
    };

    _getStatus(walletStatusHash(), 0, cb);
  };

  var getSavedTxs = function(walletId, cb) {
    storageService.getTxHistory(walletId, function(err, txs) {
      if (err) return cb(err);

      var localTxs = [];

      if (!txs) {
        return cb(null, localTxs);
      }

      try {
        localTxs = JSON.parse(txs);
      } catch (ex) {
        $log.warn(ex);
      }
      return cb(null, lodash.compact(localTxs));
    });
  };

  var getTxsFromServer = function(wallet, skip, endingTxid, limit, cb) {
    var res = [];

    wallet.getTxHistory({
      skip: skip,
      limit: limit
    }, function(err, txsFromServer) {
      if (err) return cb(err);

      if (!txsFromServer.length)
        return cb();

      var res = lodash.takeWhile(txsFromServer, function(tx) {
        return tx.txid != endingTxid;
      });

      return cb(null, res, res.length == limit);
    });
  };

  var removeAndMarkSoftConfirmedTx = function(txs) {
    return lodash.filter(txs, function(tx) {
      if (tx.confirmations >= root.SOFT_CONFIRMATION_LIMIT)
        return tx;
      tx.recent = true;
    });
  }

  var processNewTxs = function(wallet, txs) {
    var config = configService.getSync().wallet.settings;
    var now = Math.floor(Date.now() / 1000);
    var txHistoryUnique = {};
    var ret = [];
    wallet.hasUnsafeConfirmed = false;

    lodash.each(txs, function(tx) {
      tx = txFormatService.processTx(tx);

      // no future transactions...
      if (tx.time > now)
        tx.time = now;

      if (tx.confirmations >= root.SAFE_CONFIRMATIONS) {
        tx.safeConfirmed = root.SAFE_CONFIRMATIONS + '+';
      } else {
        tx.safeConfirmed = false;
        wallet.hasUnsafeConfirmed = true;
      }

      if (tx.note) {
        delete tx.note.encryptedEditedByName;
        delete tx.note.encryptedBody;
      }

      if (!txHistoryUnique[tx.txid]) {
        ret.push(tx);
        txHistoryUnique[tx.txid] = true;
      } else {
        $log.debug('Ignoring duplicate TX in history: ' + tx.txid)
      }
    });

    return ret;
  };

  var updateLocalTxHistory = function(wallet, progressFn, cb) {
    var FIRST_LIMIT = 5;
    var LIMIT = 50;
    var requestLimit = FIRST_LIMIT;
    var walletId = wallet.credentials.walletId;
    var config = configService.getSync().wallet.settings;

    progressFn = progressFn || function() {};

    var fixTxsUnit = function(txs) {
      if (!txs || !txs[0] || !txs[0].amountStr) return;

      var cacheUnit = txs[0].amountStr.split(' ')[1];

      if (cacheUnit == config.unitName)
        return;

      var name = ' ' + config.unitName;

      $log.debug('Fixing Tx Cache Unit to:' + name)
      lodash.each(txs, function(tx) {

        tx.amountStr = txFormatService.formatAmount(tx.amount) + name;
        tx.feeStr = txFormatService.formatAmount(tx.fees) + name;
      });
    };

    getSavedTxs(walletId, function(err, txsFromLocal) {
      if (err) return cb(err);

      fixTxsUnit(txsFromLocal);

      var confirmedTxs = removeAndMarkSoftConfirmedTx(txsFromLocal);
      var endingTxid = confirmedTxs[0] ? confirmedTxs[0].txid : null;
      var endingTs = confirmedTxs[0] ? confirmedTxs[0].time : null;


      // First update
      wallet.completeHistory = txsFromLocal;

      function getNewTxs(newTxs, skip, cb) {
        getTxsFromServer(wallet, skip, endingTxid, requestLimit, function(err, res, shouldContinue) {
          if (err) return cb(err);

          newTxs = newTxs.concat(processNewTxs(wallet, lodash.compact(res)));

          progressFn(newTxs);

          skip = skip + requestLimit;

          $log.debug('Syncing TXs. Got:' + newTxs.length + ' Skip:' + skip, ' EndingTxid:', endingTxid, ' Continue:', shouldContinue);

          if (!shouldContinue) {
            $log.debug('Finished Sync: New / soft confirmed Txs: ' + newTxs.length);
            return cb(null, newTxs);
          }

          requestLimit = LIMIT;
          getNewTxs(newTxs, skip, cb);
        });
      };

      getNewTxs([], 0, function(err, txs) {
        if (err) return cb(err);

        var newHistory = lodash.uniq(lodash.compact(txs.concat(confirmedTxs)), function(x) {
          return x.txid;
        });


        function updateNotes(cb2) {
          if (!endingTs) return cb2();

          $log.debug('Syncing notes from: ' + endingTs);
          wallet.getTxNotes({
            minTs: endingTs
          }, function(err, notes) {
            if (err) {
              $log.warn(err);
              return cb2();
            };
            lodash.each(notes, function(note) {
              $log.debug('Note for ' + note.txid);
              lodash.each(newHistory, function(tx) {
                if (tx.txid == note.txid) {
                  $log.debug('...updating note for ' + note.txid);
                  tx.note = note;
                }
              });
            });
            return cb2();
          });
        }

        updateNotes(function() {
          var historyToSave = JSON.stringify(newHistory);

          lodash.each(txs, function(tx) {
            tx.recent = true;
          })

          $log.debug('Tx History synced. Total Txs: ' + newHistory.length);

          // Final update
          if (walletId == wallet.credentials.walletId) {
            wallet.completeHistory = newHistory;
          }

          return storageService.setTxHistory(historyToSave, walletId, function() {
            $log.debug('Tx History saved.');

            return cb();
          });
        });
      });
    });
  };

  root.getTxNote = function(wallet, txid, cb) {
    wallet.getTxNote({
      txid: txid
    }, function(err, note) {
      if (err || !note) return cb(true);
      return cb(null, note);
    });
  };

  root.getTxp = function(wallet, txpid, cb) {
    wallet.getTx(txpid, function(err, txp) {
      if (err) return cb(err);
      return cb(null, txp);
    });
  };

  root.getTx = function(wallet, txid, cb) {
    var tx;

    if (wallet.completeHistory && wallet.completeHistory.isValid) {
      tx = lodash.find(wallet.completeHistory, {
        txid: txid
      });

      finish();
    } else {
      root.getTxHistory(wallet, {}, function(err, txHistory) {
        if (err) return cb(err);

        tx = lodash.find(txHistory, {
          txid: txid
        });

        finish();
      });
    }

    function finish() {
      if (tx) return cb(null, tx);
      else return cb();
    };
  };

  root.getTxHistory = function(wallet, opts, cb) {
    opts = opts || {};

    var walletId = wallet.credentials.walletId;

    if (!wallet.isComplete()) return cb();

    function isHistoryCached() {
      return wallet.completeHistory && wallet.completeHistory.isValid;
    };

    if (isHistoryCached() && !opts.force) return cb(null, wallet.completeHistory);

    $log.debug('Updating Transaction History');

    updateLocalTxHistory(wallet, opts.progressFn, function(err) {
      if (err) return cb(err);

      wallet.completeHistory.isValid = true;
      return cb(err, wallet.completeHistory);
    });
  };

  root.isEncrypted = function(wallet) {
    if (lodash.isEmpty(wallet)) return;
    var isEncrypted = wallet.isPrivKeyEncrypted();
    if (isEncrypted) $log.debug('Wallet is encrypted');
    return isEncrypted;
  };

  root.createTx = function(wallet, txp, cb) {
    if (lodash.isEmpty(txp) || lodash.isEmpty(wallet))
      return cb('MISSING_PARAMETER');

    if (txp.sendMax) {
      wallet.createTxProposal(txp, function(err, createdTxp) {
        if (err) return cb(err);
        else return cb(null, createdTxp);
      });
    } else {
      wallet.createTxProposal(txp, function(err, createdTxp) {
        if (err) return cb(err);
        else {
          $log.debug('Transaction created');
          return cb(null, createdTxp);
        }
      });
    }
  };

  root.publishTx = function(wallet, txp, cb) {
    if (lodash.isEmpty(txp) || lodash.isEmpty(wallet))
      return cb('MISSING_PARAMETER');

    wallet.publishTxProposal({
      txp: txp
    }, function(err, publishedTx) {
      if (err) return cb(err);
      else {
        $log.debug('Transaction published');
        return cb(null, publishedTx);
      }
    });
  };

  root.signTx = function(wallet, txp, password, cb) {
    if (!wallet || !txp || !cb)
      return cb('MISSING_PARAMETER');

    if (wallet.isPrivKeyExternal()) {
      switch (wallet.getPrivKeyExternalSourceName()) {
        case 'ledger':
          return _signWithLedger(wallet, txp, cb);
        case 'trezor':
          return _signWithTrezor(wallet, txp, cb);
        default:
          var msg = 'Unsupported External Key:' + wallet.getPrivKeyExternalSourceName();
          $log.error(msg);
          return cb(msg);
      }
    } else {

      try {
        wallet.signTxProposal(txp, password, function(err, signedTxp) {
          $log.debug('Transaction signed err:' + err);
          return cb(err, signedTxp);
        });
      } catch (e) {
        $log.warn('Error at signTxProposal:', e);
        return cb(e);
      }
    }
  };

  root.broadcastTx = function(wallet, txp, cb) {
    if (lodash.isEmpty(txp) || lodash.isEmpty(wallet))
      return cb('MISSING_PARAMETER');

    if (txp.status != 'accepted')
      return cb('TX_NOT_ACCEPTED');

    wallet.broadcastTxProposal(txp, function(err, broadcastedTxp, memo) {
      if (err)
        return cb(err);

      $log.debug('Transaction broadcasted');
      if (memo) $log.info(memo);

      return cb(null, broadcastedTxp);
    });
  };

  root.rejectTx = function(wallet, txp, cb) {
    if (lodash.isEmpty(txp) || lodash.isEmpty(wallet))
      return cb('MISSING_PARAMETER');

    wallet.rejectTxProposal(txp, null, function(err, rejectedTxp) {
      $log.debug('Transaction rejected');
      return cb(err, rejectedTxp);
    });
  };

  root.removeTx = function(wallet, txp, cb) {
    if (lodash.isEmpty(txp) || lodash.isEmpty(wallet))
      return cb('MISSING_PARAMETER');

    wallet.removeTxProposal(txp, function(err) {
      $log.debug('Transaction removed');

      root.invalidateCache(wallet);
      $rootScope.$emit('Local/TxAction', wallet.id);

      return cb(err);
    });
  };

  root.updateRemotePreferences = function(clients, prefs, cb) {
    prefs = prefs || {};

    if (!lodash.isArray(clients))
      clients = [clients];

    function updateRemotePreferencesFor(clients, prefs, cb) {
      var wallet = clients.shift();
      if (!wallet) return cb();
      $log.debug('Saving remote preferences', wallet.credentials.walletName, prefs);

      wallet.savePreferences(prefs, function(err) {
        // we ignore errors here
        if (err) $log.warn(err);

        updateRemotePreferencesFor(clients, prefs, cb);
      });
    };

    // Update this JIC.
    var config = configService.getSync().wallet.settings;

    //prefs.email  (may come from arguments)
    prefs.language = uxLanguage.getCurrentLanguage();
    prefs.unit = config.unitCode;

    updateRemotePreferencesFor(clients, prefs, function(err) {
      if (err) return cb(err);

      lodash.each(clients, function(c) {
        c.preferences = lodash.assign(prefs, c.preferences);
      });
      return cb();
    });
  };

  root.recreate = function(wallet, cb) {
    $log.debug('Recreating wallet:', wallet.id);
    ongoingProcess.set('recreating', true);
    wallet.recreateWallet(function(err) {
      wallet.notAuthorized = false;
      ongoingProcess.set('recreating', false);
      return cb(err);
    });
  };

  root.startScan = function(wallet, cb) {
    cb = cb || function() {};

    $log.debug('Scanning wallet ' + wallet.id);
    if (!wallet.isComplete()) return;

    wallet.updating = true;
    ongoingProcess.set('scanning', true);
    wallet.startScan({
      includeCopayerBranches: true,
    }, function(err) {
      wallet.updating = false;
      ongoingProcess.set('scanning', false);
      return cb(err);
    });
  };


  root.expireAddress = function(wallet, cb) {
    $log.debug('Cleaning Address ' + wallet.id);
    storageService.clearLastAddress(wallet.id, function(err) {
      return cb(err);
    });
  };

  root.isUsed = function(wallet, byAddress, cb) {
    storageService.getLastAddress(wallet.id, function(err, addr) {
      var used = lodash.find(byAddress, {
        address: addr
      });
      return cb(null, used);
    });
  };

  var createAddress = function(wallet, cb) {
    $log.debug('Creating address for wallet:', wallet.id);

    wallet.createAddress({}, function(err, addr) {
      if (err) {
        var prefix = gettextCatalog.getString('Could not create address');
        if (err.error && err.error.match(/locked/gi)) {
          $log.debug(err.error);
          return $timeout(function() {
            createAddress(wallet, cb);
          }, 5000);
        } else if (err.message && err.message == 'MAIN_ADDRESS_GAP_REACHED') {
          $log.warn(err.message);
          prefix = null;
          wallet.getMainAddresses({
            reverse: true,
            limit: 1
          }, function(err, addr) {
            if (err) return cb(err);
            return cb(null, addr[0].address);
          });
        }
        return bwcError.cb(err, prefix, cb);
      }
      return cb(null, addr.address);
    });
  };

  root.getAddress = function(wallet, forceNew, cb) {

    storageService.getLastAddress(wallet.id, function(err, addr) {
      if (err) return cb(err);

      if (!forceNew && addr) return cb(null, addr);

      createAddress(wallet, function(err, _addr) {
        if (err) return cb(err, addr);
        storageService.storeLastAddress(wallet.id, _addr, function() {
          if (err) return cb(err);
          return cb(null, _addr);
        });
      });
    });
  };


  root.isReady = function(wallet, cb) {
    if (!wallet.isComplete())
      return cb('WALLET_NOT_COMPLETE');

    if (wallet.needsBackup)
      return cb('WALLET_NEEDS_BACKUP');
    return cb();
  };


  // An alert dialog
  var askPassword = function(name, title, cb) {
    var scope = $rootScope.$new(true);
    scope.data = [];
    var pass = $ionicPopup.show({
      template: '<input type="password" ng-model="data.pass">',
      title: title,
      subTitle: name,
      scope: scope,
      buttons: [{
        text: 'Cancel'
      }, {
        text: '<b>OK</b>',
        type: 'button-positive',
        onTap: function(e) {
          if (!scope.data.pass) {
            //don't allow the user to close unless he enters wifi password
            e.preventDefault();
            return;

          }

          return scope.data.pass;
        }
      }]
    });
    pass.then(function(res) {
      return cb(res);
    });
  };


  root.encrypt = function(wallet, cb) {
    askPassword(wallet.name, gettext('Enter new spending password'), function(password) {
      if (!password) return cb('no password');
      askPassword(wallet.name, gettext('Confirm you new spending password'), function(password2) {
        if (!password2 || password != password2)
          return cb('password mismatch');

        wallet.encryptPrivateKey(password);
        return cb();
      });
    });
  };


  root.decrypt = function(wallet, cb) {
    $log.debug('Disabling private key encryption for' + wallet.name);
    askPassword(wallet.name, gettext('Enter Spending Password'), function(password) {
      if (!password) return cb('no password');

      try {
        wallet.decryptPrivateKey(password);
      } catch (e) {
        return cb(e);
      }
      return cb();
    });
  };

  root.handleEncryptedWallet = function(wallet, cb) {
    if (!root.isEncrypted(wallet)) return cb();

    askPassword(wallet.name, gettext('Enter Spending Password'), function(password) {
      if (!password) return cb('no password');
      if (!wallet.checkPassword(password)) return cb('wrong password');


      return cb(null, password);
    });
  };


  root.reject = function(wallet, txp, cb) {
    ongoingProcess.set('rejectTx', true);
    root.rejectTx(wallet, txp, function(err, txpr) {
      root.invalidateCache(wallet);
      ongoingProcess.set('rejectTx', false);

      if (err) return cb(err);

      $rootScope.$emit('Local/TxAction', wallet.id);
      return cb(null, txpr);
    });
  };


  root.onlyPublish = function(wallet, txp, cb) {
    ongoingProcess.set('sendingTx', true);
    root.publishTx(wallet, txp, function(err, publishedTxp) {
      root.invalidateCache(wallet);

      ongoingProcess.set('sendingTx', false);
      if (err) return cb(err);

      var type = root.getViewStatus(wallet, createdTxp);
      root.openStatusModal(type, createdTxp, function() {
        $rootScope.$emit('Local/TxAction', wallet.id);
        return;
      });
      return cb(null, publishedTxp);
    });
  };


  root.prepare = function(wallet, cb) {
    fingerprintService.check(wallet, function(err) {
      if (err) return cb(err);

      root.handleEncryptedWallet(wallet, function(err, password) {
        if (err) return cb(err);

        return cb(null, password);
      });
    });
  };

  root.publishAndSign = function(wallet, txp, cb) {

    var publishFn = root.publishTx;

    // Already published?
    if (txp.status == 'pending') {
      publishFn = function(wallet, txp, cb) {
        return cb(null, txp);
      };
    }

    root.prepare(wallet, function(err, password) {
      if (err) return cb('Prepare error: ' + err);

      ongoingProcess.set('sendingTx', true);
      publishFn(wallet, txp, function(err, publishedTxp) {
        ongoingProcess.set('sendingTx', false);
        if (err) return cb('Send Error: ' + err);

        ongoingProcess.set('signingTx', true);
        root.signTx(wallet, publishedTxp, password, function(err, signedTxp) {
          ongoingProcess.set('signingTx', false);
          root.invalidateCache(wallet);


          if (err) {
            $log.warn('sign error:' + err);
            // TODO?
            var msg = err.message ?
              err.message :
              gettext('The payment was created but could not be completed. Please try again from home screen');

            $rootScope.$emit('Local/TxAction', wallet.id);
            return cb(msg);
          }

          if (signedTxp.status == 'accepted') {
            ongoingProcess.set('broadcastingTx', true);
            root.broadcastTx(wallet, signedTxp, function(err, broadcastedTxp) {
              ongoingProcess.set('broadcastingTx', false);
              if (err) return cb('sign error' + err);

              $rootScope.$emit('Local/TxAction', wallet.id);
              var type = root.getViewStatus(wallet, broadcastedTxp);
              root.openStatusModal(type, broadcastedTxp, function() {});

              return cb(null, broadcastedTxp)
            });
          } else {
            $rootScope.$emit('Local/TxAction', wallet.id);

            var type = root.getViewStatus(wallet, signedTxp);
            root.openStatusModal(type, signedTxp, function() {});
            return cb(null, signedTxp);
          }
        });
      });
    });
  };

  root.getEncodedWalletInfo = function(wallet, cb) {

    var derivationPath = wallet.credentials.getBaseAddressDerivationPath();
    var encodingType = {
      mnemonic: 1,
      xpriv: 2,
      xpub: 3
    };
    var info;

    // not supported yet
    if (wallet.credentials.derivationStrategy != 'BIP44' || !wallet.canSign())
      return null;

    root.getKeys(wallet, function(err, keys) {
      if (err || !keys) return cb(err);

      if (keys.mnemonic) {
        info = {
          type: encodingType.mnemonic,
          data: keys.mnemonic,
        }
      } else {
        info = {
          type: encodingType.xpriv,
          data: keys.xPrivKey
        }
      }
      return cb(null, info.type + '|' + info.data + '|' + wallet.credentials.network.toLowerCase() + '|' + derivationPath + '|' + (wallet.credentials.mnemonicHasPassphrase));

    });
  };

  root.setTouchId = function(wallet, enabled, cb) {

    var opts = {
      touchIdFor: {}
    };
    opts.touchIdFor[wallet.id] = enabled;

    fingerprintService.check(wallet, function(err) {
      if (err) {
        opts.touchIdFor[wallet.id] = !enabled;
        $log.debug('Error with fingerprint:' + err);
        return cb(err);
      }
      configService.set(opts, cb);
    });
  };

  root.getKeys = function(wallet, cb) {
    root.prepare(wallet, function(err, password) {
      if (err) return cb(err);
      var keys;

      try {
        keys = wallet.getKeys(password);
      } catch (e) {
        return cb(e);
      }

      return cb(null, keys);
    });
  };

  root.getViewStatus = function(wallet, txp) {
    var status = txp.status;
    var type;
    var INMEDIATE_SECS = 10;

    if (status == 'broadcasted') {
      type = 'broadcasted';
    } else {

      var n = txp.actions.length;
      var action = lodash.find(txp.actions, {
        copayerId: wallet.credentials.copayerId
      });

      if (!action) {
        type = 'created';
      } else if (action.type == 'accept') {
        // created and accepted at the same time?
        if (n == 1 && action.createdOn - txp.createdOn < INMEDIATE_SECS) {
          type = 'created';
        } else {
          type = 'accepted';
        }
      } else if (action.type == 'reject') {
        type = 'rejected';
      } else {
        throw new Error('Unknown type:' + type);
      }
    }
    return type;
  };


  return root;
});

'use strict';

angular.module('copayApp.controllers').controller('activityController',
  function($timeout, $scope, $log, $ionicModal, lodash, txpModalService, profileService, walletService, ongoingProcess, popupService, gettextCatalog) {
    $scope.openTxpModal = txpModalService.open;
    $scope.fetchingNotifications = true;

    $scope.$on("$ionicView.enter", function(event, data){
      profileService.getNotifications(50, function(err, n) {
        if (err) {
          $log.error(err);
          return;
        }
        $scope.fetchingNotifications = false;
        $scope.notifications = n;

        profileService.getTxps({}, function(err, txps, n) {
          if (err) $log.error(err);
          $scope.txps = txps;
          $timeout(function() {
            $scope.$apply();
          });
        });
      });
    });

    $scope.openNotificationModal = function(n) {
      if (n.txid) {
        openTxModal(n);
      } else {
        var txp = lodash.find($scope.txps, {
          id: n.txpId
        });
        if (txp) txpModalService.open(txp);
        else {
          ongoingProcess.set('loadingTxInfo', true);
          walletService.getTxp(n.wallet, n.txpId, function(err, txp) {
            var _txp = txp;
            ongoingProcess.set('loadingTxInfo', false);
            if (err) {
              $log.warn('No txp found');
              return popupService.showAlert(null, gettextCatalog.getString('Transaction not found'));
            }
            txpModalService.open(_txp);
          });
        }
      }
    };

    var openTxModal = function(n) {
      var wallet = profileService.getWallet(n.walletId);

      ongoingProcess.set('loadingTxInfo', true);
      walletService.getTx(wallet, n.txid, function(err, tx) {
        ongoingProcess.set('loadingTxInfo', false);

        if (err) {
          $log.error(err);
          return popupService.showAlert(gettextCatalog.getString('Error'), err);
        }

        if (!tx) {
          $log.warn('No tx found');
          return popupService.showAlert(null, gettextCatalog.getString('Transaction not found'));
        }

        $scope.wallet = wallet;
        $scope.btx = lodash.cloneDeep(tx);
        $ionicModal.fromTemplateUrl('views/modals/tx-details.html', {
          scope: $scope
        }).then(function(modal) {
          $scope.txDetailsModal = modal;
          $scope.txDetailsModal.show();
        });

        walletService.getTxNote(wallet, n.txid, function(err, note) {
          if (err) $log.debug('Could not fetch transaction note');
          $scope.btx.note = note;
        });
      });
    };
  });

'use strict';

angular.module('copayApp.controllers').controller('addressbookListController', function($scope, $log, $timeout, addressbookService, lodash, popupService) {

  var contacts;

  var initAddressbook = function() {
    addressbookService.list(function(err, ab) {
      if (err) $log.error(err);

      $scope.isEmptyList = lodash.isEmpty(ab);

      contacts = [];
      lodash.each(ab, function(v, k) {
        contacts.push({
          name: lodash.isObject(v) ? v.name : v,
          address: k,
          email: lodash.isObject(v) ? v.email : null
        });
      });

      $scope.addressbook = lodash.clone(contacts);
      $timeout(function() {
        $scope.$apply();
      }, 100);
    });
  };

  $scope.findAddressbook = function(search) {
    if (!search || search.length < 2) {
      $scope.addressbook = contacts;
      $timeout(function() {
        $scope.$apply();
      }, 10);
      return;
    }

    var result = lodash.filter(contacts, function(item) {
      var val = item.name;
      return lodash.includes(val.toLowerCase(), search.toLowerCase());
    });

    $scope.addressbook = result;
  };

  $scope.remove = function(addr) {
    $timeout(function() {
      addressbookService.remove(addr, function(err, ab) {
        if (err) {
          popupService.showAlert(err);
          return;
        }
        initAddressbook();
        $scope.$digest();
      });
    }, 100);
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data){
    initAddressbook();
  });

});

'use strict';

angular.module('copayApp.controllers').controller('addressbookAddController', function($scope, $state, $stateParams, $timeout, $ionicHistory, addressbookService, popupService) {

  $scope.fromSendTab = $stateParams.fromSendTab;

  $scope.addressbookEntry = {
    'address': $stateParams.addressbookEntry || '',
    'name': '',
    'email': ''
  };

  $scope.onQrCodeScanned = function(data, addressbookForm) {
    $timeout(function() {
      var form = addressbookForm;
      if (data && form) {
        data = data.replace('bitcoin:', '');
        form.address.$setViewValue(data);
        form.address.$isValid = true;
        form.address.$render();
      }
      $scope.$digest();
    }, 100);
  };

  $scope.add = function(addressbook) {
    $timeout(function() {
      addressbookService.add(addressbook, function(err, ab) {
        if (err) {
          popupService.showAlert(err);
          return;
        }
        if ($scope.fromSendTab) $scope.goHome();
        else $ionicHistory.goBack();
      });
    }, 100);
  };

  $scope.goHome = function() {
    $ionicHistory.removeBackView();
    $state.go('tabs.home');
  };

});

'use strict';

angular.module('copayApp.controllers').controller('addressbookViewController', function($scope, $state, $timeout, $stateParams, lodash, addressbookService, popupService, $ionicHistory) {

  var address = $stateParams.address;

  if (!address) {
    $state.go('tabs.addressbook');
    return;
  }

  addressbookService.get(address, function(err, obj) {
    if (err) {
      popupService.showAlert(err);
      return;
    }
    if (!lodash.isObject(obj)) {
      var name = obj;
      obj = {
        'name': name,
        'address': address,
        'email': ''
      };
    }
    $scope.addressbookEntry = obj;
  });

  $scope.sendTo = function() {
    $ionicHistory.removeBackView();
    $state.go('tabs.send');
    $timeout(function() {
      $state.transitionTo('tabs.send.amount', {
        toAddress: $scope.addressbookEntry.address,
        toName: $scope.addressbookEntry.name,
        toEmail: $scope.addressbookEntry.email
      });
    }, 100);
  };

});

'use strict';

angular.module('copayApp.controllers').controller('amazonController',
  function($scope, $timeout, $ionicModal, $log, lodash, bwcError, amazonService, platformInfo, externalLinkService, popupService) {

    $scope.network = amazonService.getEnvironment();

    $scope.openExternalLink = function(url, target) {
      externalLinkService.open(url, target);
    };

    var initAmazon = function() {
      amazonService.getPendingGiftCards(function(err, gcds) {
        if (err) {
          popupService.showAlert(err);
          return;
        }
        $scope.giftCards = lodash.isEmpty(gcds) ? null : gcds;
        $timeout(function() {
          $scope.$digest();
        });
      });
      $scope.updatePendingGiftCards();
    };

    $scope.updatePendingGiftCards = lodash.debounce(function() {

      amazonService.getPendingGiftCards(function(err, gcds) {
        lodash.forEach(gcds, function(dataFromStorage) {
          if (dataFromStorage.status == 'PENDING') {
            $log.debug("creating gift card");
            amazonService.createGiftCard(dataFromStorage, function(err, giftCard) {
              if (err) {
                popupService.showAlert(bwcError.msg(err));
                return;
              }
              if (giftCard.status != 'PENDING') {
                var newData = {};

                lodash.merge(newData, dataFromStorage, giftCard);

                if (newData.status == 'expired') {
                  amazonService.savePendingGiftCard(newData, {
                    remove: true
                  }, function(err) {
                    return;
                  });
                }

                amazonService.savePendingGiftCard(newData, null, function(err) {
                  $log.debug("Saving new gift card");
                  amazonService.getPendingGiftCards(function(err, gcds) {
                    if (err) {
                      popupService.showAlert(err);
                      return;
                    }
                    $scope.giftCards = gcds;
                    $timeout(function() {
                      $scope.$digest();
                    });
                  });
                });
              } else $log.debug("pending gift card not available yet");
            });
          }
        });
      });

    }, 1000);

    $scope.openCardModal = function(card) {
      $scope.card = card;

      $ionicModal.fromTemplateUrl('views/modals/amazon-card-details.html', {
        scope: $scope
      }).then(function(modal) {
        $scope.amazonCardDetailsModal = modal;
        $scope.amazonCardDetailsModal.show();
      });

      $scope.$on('UpdateAmazonList', function(event) {
        initAmazon();
      });
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data){
      initAmazon();
    });
  });

'use strict';

angular.module('copayApp.controllers').controller('amountController', function($rootScope, $scope, $filter, $timeout, $ionicScrollDelegate, gettextCatalog, platformInfo, lodash, configService, rateService, $stateParams, $window, $state, $log, txFormatService) {

  var unitToSatoshi;
  var satToUnit;
  var unitDecimals;
  var satToBtc;
  var self = $scope.self;
  var SMALL_FONT_SIZE_LIMIT = 13;
  var LENGTH_EXPRESSION_LIMIT = 19;

  $scope.isWallet = $stateParams.isWallet;
  $scope.toAddress = $stateParams.toAddress;
  $scope.toName = $stateParams.toName;
  $scope.toEmail = $stateParams.toEmail;

  $scope.$on('$ionicView.leave', function() {
    angular.element($window).off('keydown');
  });

  $scope.$on("$ionicView.enter", function(event, data) {

    if (!$stateParams.toAddress) {
      $log.error('Bad params at amount')
      throw ('bad params');
    }

    var reNr = /^[1234567890\.]$/;
    var reOp = /^[\*\+\-\/]$/;

    var disableKeys = angular.element($window).on('keydown', function(e) {
      if (e.which === 8) { // you can add others here inside brackets.
        e.preventDefault();
        $scope.removeDigit();
      }

      if (e.key && e.key.match(reNr))
        $scope.pushDigit(e.key);

      else if (e.key && e.key.match(reOp))
        $scope.pushOperator(e.key);

      else if (e.key && e.key == 'Enter')
        $scope.finish();

      $timeout(function() {
        $scope.$apply();
      }, 10);

    });

    var config = configService.getSync().wallet.settings;
    $scope.unitName = config.unitName;
    $scope.alternativeIsoCode = config.alternativeIsoCode;
    $scope.specificAmount = $scope.specificAlternativeAmount = '';
    $scope.isCordova = platformInfo.isCordova;
    unitToSatoshi = config.unitToSatoshi;
    satToUnit = 1 / unitToSatoshi;
    satToBtc = 1 / 100000000;
    unitDecimals = config.unitDecimals;

    // in SAT ALWAYS
    if ($stateParams.toAmount) {
      $scope.amount = (($stateParams.toAmount) * satToUnit).toFixed(unitDecimals);
    }

    processAmount($scope.amount);

    $timeout(function() {
      $ionicScrollDelegate.resize();
    }, 100);
  });

  $scope.toggleAlternative = function() {
    $scope.showAlternativeAmount = !$scope.showAlternativeAmount;

    if ($scope.amount && isExpression($scope.amount)) {
      var amount = evaluate(format($scope.amount));
      $scope.globalResult = '= ' + processResult(amount);
    }
  };

  function checkFontSize() {
    if ($scope.amount && $scope.amount.length >= SMALL_FONT_SIZE_LIMIT) $scope.smallFont = true;
    else $scope.smallFont = false;
  };

  $scope.pushDigit = function(digit) {
    if ($scope.amount && $scope.amount.length >= LENGTH_EXPRESSION_LIMIT) return;

    $scope.amount = ($scope.amount + digit).replace('..', '.');
    checkFontSize();
    processAmount($scope.amount);
  };

  $scope.pushOperator = function(operator) {
    console.log('[amount.js.90:operator:]', operator); //TODO
    if (!$scope.amount || $scope.amount.length == 0) return;
    $scope.amount = _pushOperator($scope.amount);

    function _pushOperator(val) {
      if (!isOperator(lodash.last(val))) {
        return val + operator;
      } else {
        return val.slice(0, -1) + operator;
      }
    };
  };

  function isOperator(val) {
    var regex = /[\/\-\+\x\*]/;
    return regex.test(val);
  };

  function isExpression(val) {
    var regex = /^\.?\d+(\.?\d+)?([\/\-\+\*x]\d?\.?\d+)+$/;

    return regex.test(val);
  };

  $scope.removeDigit = function() {
    $scope.amount = $scope.amount.slice(0, -1);
    processAmount($scope.amount);
    checkFontSize();
  };

  $scope.resetAmount = function() {
    $scope.amount = $scope.alternativeResult = $scope.amountResult = $scope.globalResult = '';
    checkFontSize();
  };

  function processAmount(val) {
    if (!val) {
      $scope.resetAmount();
      return;
    }

    var formatedValue = format(val);
    var result = evaluate(formatedValue);

    if (lodash.isNumber(result)) {
      $scope.globalResult = isExpression(val) ? '= ' + processResult(result) : '';
      $scope.amountResult = $filter('formatFiatAmount')(toFiat(result));
      $scope.alternativeResult = txFormatService.formatAmount(fromFiat(result) * unitToSatoshi, true);
    }
  };

  function processResult(val) {
    if ($scope.showAlternativeAmount)
      return $filter('formatFiatAmount')(val);
    else
      return txFormatService.formatAmount(val.toFixed(unitDecimals) * unitToSatoshi, true);
  };

  function fromFiat(val) {
    return parseFloat((rateService.fromFiat(val, $scope.alternativeIsoCode) * satToUnit).toFixed(unitDecimals), 10);
  };

  function toFiat(val) {
    return parseFloat((rateService.toFiat(val * unitToSatoshi, $scope.alternativeIsoCode)).toFixed(2), 10);
  };

  function evaluate(val) {
    var result;
    try {
      result = $scope.$eval(val);
    } catch (e) {
      return 0;
    }
    if (!lodash.isFinite(result)) return 0;
    return result;
  };

  function format(val) {
    var result = val.toString();

    if (isOperator(lodash.last(val)))
      result = result.slice(0, -1);

    return result.replace('x', '*');
  };

  $scope.finish = function() {
    var _amount = evaluate(format($scope.amount));
    var amount = $scope.showAlternativeAmount ? fromFiat(_amount).toFixed(unitDecimals) : _amount.toFixed(unitDecimals);

    $state.transitionTo('tabs.send.confirm', {
      isWallet: $scope.isWallet,
      toAmount: amount * unitToSatoshi,
      toAddress: $scope.toAddress,
      toName: $scope.toName,
      toEmail: $scope.toEmail
    });
  };
});

'use strict';

angular.module('copayApp.controllers').controller('backController', function($scope, $state, $stateParams, platformInfo) {

  var isCordova = platformInfo.isCordova;
  var isWP = platformInfo.isWP;
  var usePushNotifications = isCordova && !isWP;

  $scope.importGoBack = function() {
    if ($stateParams.fromOnboarding) $state.go('onboarding.welcome');
    else $state.go('tabs.add');
  };

  $scope.onboardingMailSkip = function() {
    if (!usePushNotifications) $state.go('onboarding.backupRequest');
    else $state.go('onboarding.notifications');
  }

});

'use strict';

angular.module('copayApp.controllers').controller('backupController',
  function($scope, $timeout, $log, $state, $stateParams, $ionicHistory, lodash, profileService, bwcService, walletService, ongoingProcess, popupService, gettextCatalog, $ionicModal) {
    var wallet = profileService.getWallet($stateParams.walletId);
    $scope.viewTitle = wallet.name || wallet.credentials.walletName;
    $scope.n = wallet.n;
    var keys;

    $scope.credentialsEncrypted = wallet.isPrivKeyEncrypted();

    var isDeletedSeed = function() {
      if (!wallet.credentials.mnemonic && !wallet.credentials.mnemonicEncrypted)
        return true;

      return false;
    };

    var shuffledWords = function(words) {
      var sort = lodash.sortBy(words);

      return lodash.map(sort, function(w) {
        return {
          word: w,
          selected: false
        };
      });
    };

    $scope.initFlow = function() {
      if (!keys) return;

      var words = keys.mnemonic;
      $scope.data = {};

      $scope.mnemonicWords = words.split(/[\u3000\s]+/);
      $scope.shuffledMnemonicWords = shuffledWords($scope.mnemonicWords);
      $scope.mnemonicHasPassphrase = wallet.mnemonicHasPassphrase();
      $scope.useIdeograms = words.indexOf("\u3000") >= 0;
      $scope.data.passphrase = null;
      $scope.customWords = [];
      $scope.step = 1;
      $scope.selectComplete = false;
      $scope.backupError = false;

      words = lodash.repeat('x', 300);
      $timeout(function() {
        $scope.$apply();
      }, 10);
    };

    var backupError = function(err) {
      ongoingProcess.set('validatingWords', false);
      $log.debug('Failed to verify backup: ', err);
      $scope.backupError = true;

      $timeout(function() {
        $scope.$apply();
      }, 1);
    };

    function openConfirmBackupModal() {
      $ionicModal.fromTemplateUrl('views/includes/confirmBackupPopup.html', {
        scope: $scope,
        backdropClickToClose: false,
        hardwareBackButtonClose: false
      }).then(function(modal) {
        $scope.confirmBackupModal = modal;
        $scope.confirmBackupModal.show();
      });
    };

    var showBackupResult = function() {
      if ($scope.backupError) {
        var title = gettextCatalog.getString('uh oh...');
        var message = gettextCatalog.getString("It's importante that you write your backup phrase down correctly. If something happens to your wallet, you'll need this backup to recover your money Please review your backup and try again");
        popupService.showAlert(title, message, function() {
          $scope.goToStep(1);
        })
      } else {
        openConfirmBackupModal();
      }
    };

    $scope.closeBackupResultModal = function() {
      $scope.confirmBackupModal.hide();
      $scope.confirmBackupModal.remove();

      profileService.isDisclaimerAccepted(function(val) {
        if (val) {
          $ionicHistory.removeBackView();
          $state.go('tabs.home');
        }
        else $state.go('onboarding.disclaimer');
      });
    };

    var confirm = function(cb) {
      $scope.backupError = false;

      var customWordList = lodash.pluck($scope.customWords, 'word');

      if (!lodash.isEqual($scope.mnemonicWords, customWordList)) {
        return cb('Mnemonic string mismatch');
      }

      $timeout(function() {
        if ($scope.mnemonicHasPassphrase) {
          var walletClient = bwcService.getClient();
          var separator = $scope.useIdeograms ? '\u3000' : ' ';
          var customSentence = customWordList.join(separator);
          var passphrase = $scope.data.passphrase || '';

          try {
            walletClient.seedFromMnemonic(customSentence, {
              network: wallet.credentials.network,
              passphrase: passphrase,
              account: wallet.credentials.account
            });
          } catch (err) {
            walletClient.credentials.xPrivKey = lodash.repeat('x', 64);
            return cb(err);
          }

          if (walletClient.credentials.xPrivKey.substr(walletClient.credentials.xPrivKey) != keys.xPrivKey) {
            delete walletClient.credentials;
            return cb('Private key mismatch');
          }
        }

        profileService.setBackupFlag(wallet.credentials.walletId);
        return cb();
      }, 1);
    };

    var finalStep = function() {
      ongoingProcess.set('validatingWords', true);
      confirm(function(err) {
        ongoingProcess.set('validatingWords', false);
        if (err) {
          backupError(err);
        }
        $timeout(function() {
          showBackupResult();
          return;
        }, 1);
      });
    };

    $scope.goToStep = function(n) {
      if (n == 1)
        $scope.initFlow();
      if (n == 2)
        $scope.step = 2;
      if (n == 3) {
        if (!$scope.mnemonicHasPassphrase)
          finalStep();
        else
          $scope.step = 3;
      }
      if (n == 4)
        finalStep();
    };

    $scope.addButton = function(index, item) {
      var newWord = {
        word: item.word,
        prevIndex: index
      };
      $scope.customWords.push(newWord);
      $scope.shuffledMnemonicWords[index].selected = true;
      $scope.shouldContinue();
    };

    $scope.removeButton = function(index, item) {
      if ($scope.loading) return;
      $scope.customWords.splice(index, 1);
      $scope.shuffledMnemonicWords[item.prevIndex].selected = false;
      $scope.shouldContinue();
    };

    $scope.shouldContinue = function() {
      if ($scope.customWords.length == $scope.shuffledMnemonicWords.length)
        $scope.selectComplete = true;
      else
        $scope.selectComplete = false;
    };

    $scope.$on("$ionicView.enter", function(event, data) {
      $scope.deleted = isDeletedSeed();
      if ($scope.deleted) {
        $log.debug('no mnemonics');
        return;
      }

      walletService.getKeys(wallet, function(err, k) {
        if (err || !k) {
          $log.error('Could not get keys: ', err);
          $state.go('wallet.preferences');
          return;
        }
        $scope.credentialsEncrypted = false;
        keys = k;
        $scope.initFlow();
      });
    });

  });

'use strict';

angular.module('copayApp.controllers').controller('bitpayCardController', function($scope, $timeout, $log, lodash, bitpayCardService, configService, profileService, walletService, ongoingProcess, pbkdf2Service, moment, popupService, gettextCatalog, bwcError) {

  var self = this;
  var wallet;

  $scope.$on('Wallet/Changed', function(event, w) {
    if (lodash.isEmpty(w)) {
      $log.debug('No wallet provided');
      return;
    }
    wallet = w;
    $log.debug('Wallet changed: ' + w.name);
  });

  var processTransactions = function(invoices, history) {
    for (var i = 0; i < invoices.length; i++) {
      var matched = false;
      for (var j = 0; j < history.length; j++) {
        if (history[j].description[0].indexOf(invoices[i].id) > -1) {
          matched = true;
        }
      }
      if (!matched && ['paid', 'confirmed', 'complete'].indexOf(invoices[i].status) > -1) {

        history.unshift({
          timestamp: invoices[i].invoiceTime,
          description: invoices[i].itemDesc,
          amount: invoices[i].price,
          type: '00611 = Client Funded Deposit',
          pending: true,
          status: invoices[i].status
        });
      }
    }
    return history;
  };

  var setDateRange = function(preset) {
    var startDate, endDate;
    preset = preset || 'last30Days';
    switch(preset) {
      case 'last30Days':
        startDate = moment().subtract(30, 'days').toISOString();
        endDate = moment().toISOString();
        break;
      case 'lastMonth':
        startDate = moment().startOf('month').subtract(1, 'month').toISOString();
        endDate = moment().startOf('month').toISOString();
        break;
      case 'all':
        startDate = null;
        endDate = null;
        break;
      default:
        return;
    }
    return {
      startDate: startDate,
      endDate: endDate
    };
  };

  this.update = function() {
    var dateRange = setDateRange($scope.dateRange);
    self.loadingSession = true;
    bitpayCardService.isAuthenticated(function(err, bpSession) {
      self.loadingSession = false;
      if (err) {
        return;
      }

      self.bitpayCardAuthenticated = bpSession.isAuthenticated;
      self.bitpayCardTwoFactorPending = bpSession.twoFactorPending ? true : false;

      if (self.bitpayCardTwoFactorPending) return;

      if (self.bitpayCardAuthenticated) {
        $scope.loadingHistory = true;
        bitpayCardService.invoiceHistory(function(err, invoices) {
          if (err) $log.error(err);
          bitpayCardService.transactionHistory(dateRange, function(err, history) {
            $scope.loadingHistory = false;
            if (err) {
              popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Could not get transactions'));
              return;
            }

            self.bitpayCardTransactionHistory = processTransactions(invoices, history.transactionList);
            self.bitpayCardCurrentBalance = history.currentCardBalance;
          });
        });
      }
      $timeout(function() {
        $scope.$apply();
      });
    });
  };

  this.init = function() {
    $scope.dateRange = 'last30Days';

    $scope.network = bitpayCardService.getEnvironment();
    $scope.wallets = profileService.getWallets({
      network: $scope.network,
      onlyComplete: true
    });

    self.update();

    wallet = $scope.wallets[0];

    if (wallet && wallet.credentials.n > 1)
      self.isMultisigWallet = true;
  };

  this.sendFunds = function() {
    if (lodash.isEmpty(wallet)) return;

    if (!wallet.canSign() && !wallet.isPrivKeyExternal()) {
      $log.info('No signing proposal: No private key');
      popupService.showAlert(gettextCatalog.getString('Error'), bwcError.msg('MISSING_PRIVATE_KEY'));
      return;
    }

    var dataSrc = {
      amount: $scope.fiat,
      currency: 'USD'
    };
    var outputs = [];
    var config = configService.getSync();
    var configWallet = config.wallet;
    var walletSettings = configWallet.settings;


    ongoingProcess.set('Processing Transaction...', true);
    $timeout(function() {

      bitpayCardService.topUp(dataSrc, function(err, invoiceId) {
        if (err) {
          ongoingProcess.set('Processing Transaction...', false);
          popupService.showAlert(gettextCatalog.getString('Error'), bwcError.msg(err));
          return;
        }

        bitpayCardService.getInvoice(invoiceId, function(err, data) {
          var address, comment, amount;

          address = data.bitcoinAddress;
          amount = parseInt((data.btcPrice * 100000000).toFixed(0));
          comment = data.itemDesc;

          outputs.push({
            'toAddress': address,
            'amount': amount,
            'message': comment
          });

          var txp = {
            toAddress: address,
            amount: amount,
            outputs: outputs,
            message: comment,
            payProUrl: null,
            excludeUnconfirmedUtxos: configWallet.spendUnconfirmed ? false : true,
            feeLevel: walletSettings.feeLevel || 'normal'
          };

          walletService.createTx(wallet, txp, function(err, createdTxp) {
            ongoingProcess.set('Processing Transaction...', false);
            if (err) {
              popupService.showAlert(gettextCatalog.getString('Error'), bwcError.msg(err));
              return;
            }
            walletService.publishAndSign(wallet, createdTxp, function(err, tx) {
              if (err) {
                popupService.showAlert(gettextCatalog.getString('Error'), bwcError.msg(err));
                return;
              }
              self.update();
              $scope.addFunds = false;
              $timeout(function() {
                $scope.$digest();
              });
            });
          });
        });
      });
    }, 100);
  };

  this.authenticate = function() {

    var data = {
      emailAddress : $scope.email,
      hashedPassword : pbkdf2Service.pbkdf2Sync($scope.password, '..............', 200, 64).toString('hex')
    };

    // POST /authenticate
    // emailAddress:
    // hashedPassword:
    self.authenticating = true;
    bitpayCardService.authenticate(data, function(err, auth) {
      self.authenticating = false;
      if (err && err.data && err.data.error && !err.data.error.twoFactorPending) {
        popupService.showAlert(gettextCatalog.getString('Error'), err.statusText || err.data.error || 'Authentiation error');
        return;
      }

      self.update();
      $timeout(function() {
        $scope.$apply();
      }, 100);
    });
  };

  this.authenticate2FA = function() {

    var data = {
      twoFactorCode : $scope.twoFactorCode
    };

    self.authenticating = true;
    bitpayCardService.authenticate2FA(data, function(err, auth) {
      self.authenticating = false;
      if (err) {
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Authentiation error'));
        return;
      }

      self.update();
      $timeout(function() {
        $scope.$apply();
      }, 100);
    });
  };

  this.getMerchantInfo = function(tx) {
    var bpTranCodes = bitpayCardService.bpTranCodes;
    lodash.keys(bpTranCodes).forEach(function(code) {
      if (tx.type.indexOf(code) === 0) {
        lodash.assign(tx, bpTranCodes[code]);
      }
    });
  };

  this.getIconName = function(tx) {
    var icon = tx.mcc || tx.category || null;
    if (!icon) return 'default';
    return bitpayCardService.iconMap[icon];
  };

  this.processDescription = function(tx) {
    if (lodash.isArray(tx.description)) {
      return tx.description[0];
    }
    return tx.description;
  };

});


'use strict';

angular.module('copayApp.controllers').controller('buyAmazonController',
  function($scope, $log, $timeout, $state, lodash, profileService, bwcError, gettextCatalog, configService, walletService, amazonService, ongoingProcess, platformInfo, externalLinkService, popupService) {

    var self = this;
    var network = amazonService.getEnvironment();
    var wallet;

    $scope.$on('Wallet/Changed', function(event, w) {
      if (lodash.isEmpty(w)) {
        $log.debug('No wallet provided');
        return;
      }
      wallet = w;
      $log.debug('Wallet changed: ' + w.name);
    });

    $scope.openExternalLink = function(url, target) {
      externalLinkService.open(url, target);
    };

    this.confirm = function() {
      var message = gettextCatalog.getString('Amazon.com Gift Card purchase for ${{amount}} USD', {amount: $scope.formData.fiat});
      var ok = gettextCatalog.getString('Buy');
      popupService.showConfirm(null, message, ok, null, function(res) {
        if (res) self.createTx();
      });
    };

    this.createTx = function() {
      self.errorInfo = null;

      if (lodash.isEmpty(wallet)) return;

      if (!wallet.canSign() && !wallet.isPrivKeyExternal()) {
        $log.info('No signing proposal: No private key');
        popupService.showAlert(gettextCatalog.getString('Error'), bwcError.msg('MISSING_PRIVATE_KEY'));
        return;
      }

      var dataSrc = {
        currency: 'USD',
        amount: $scope.formData.fiat,
        uuid: wallet.id
      };
      var outputs = [];
      var config = configService.getSync();
      var configWallet = config.wallet;
      var walletSettings = configWallet.settings;


      ongoingProcess.set('Processing Transaction...', true);
      $timeout(function() {
        amazonService.createBitPayInvoice(dataSrc, function(err, dataInvoice) {
          if (err) {
            ongoingProcess.set('Processing Transaction...', false);
            popupService.showAlert(gettextCatalog.getString('Error'), bwcError.msg(err));
            return;
          }

          amazonService.getBitPayInvoice(dataInvoice.invoiceId, function(err, invoice) {
            if (err) {
              ongoingProcess.set('Processing Transaction...', false);
              popupService.showAlert(gettextCatalog.getString('Error'), bwcError.msg(err));
              return;
            }

            $log.debug('Fetch PayPro Request...', invoice.paymentUrls.BIP73);

            wallet.fetchPayPro({
              payProUrl: invoice.paymentUrls.BIP73,
            }, function(err, paypro) {

              if (err) {
                ongoingProcess.set('Processing Transaction...', false);
                $log.warn('Could not fetch payment request:', err);
                var msg = err.toString();
                if (msg.match('HTTP')) {
                  msg = gettextCatalog.getString('Could not fetch payment information');
                }
                popupService.showAlert(gettextCatalog.getString('Error'), msg);
                return;
              }

              if (!paypro.verified) {
                ongoingProcess.set('Processing Transaction...', false);
                $log.warn('Failed to verify payment protocol signatures');
                popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Payment Protocol Invalid'));
                $timeout(function() {
                  $scope.$digest();
                });
                return;
              }

              var address, comment, amount, url;

              address = paypro.toAddress;
              amount = paypro.amount;
              url = paypro.url;
              comment = 'Amazon.com Gift Card';

              outputs.push({
                'toAddress': address,
                'amount': amount,
                'message': comment
              });

              var txp = {
                toAddress: address,
                amount: amount,
                outputs: outputs,
                message: comment,
                payProUrl: url,
                excludeUnconfirmedUtxos: configWallet.spendUnconfirmed ? false : true,
                feeLevel: walletSettings.feeLevel || 'normal'
              };

              walletService.createTx(wallet, txp, function(err, createdTxp) {
                ongoingProcess.set('Processing Transaction...', false);
                if (err) {
                  popupService.showAlert(gettextCatalog.getString('Error'), bwcError.msg(err));
                  return;
                }
                walletService.publishAndSign(wallet, createdTxp, function(err, tx) {
                  if (err) {
                    ongoingProcess.set('Processing Transaction...', false);
                    popupService.showAlert(gettextCatalog.getString('Error'), bwcError.msg(err));
                    walletService.removeTx(wallet, tx, function(err) {
                      if (err) $log.debug(err);
                    });
                    $timeout(function() {
                      $scope.$digest();
                    });
                    return;
                  }
                  var count = 0;
                  ongoingProcess.set('Processing Transaction...', true);

                  dataSrc.accessKey = dataInvoice.accessKey;
                  dataSrc.invoiceId = invoice.id;
                  dataSrc.invoiceUrl = invoice.url;
                  dataSrc.invoiceTime = invoice.invoiceTime;

                  self.debounceCreate(count, dataSrc);
                });
              });
            });
          });
        });
      }, 100);
    };

    self.debounceCreate = lodash.throttle(function(count, dataSrc) {
      self.debounceCreateGiftCard(count, dataSrc);
    }, 8000, {
      'leading': true
    });

    self.debounceCreateGiftCard = function(count, dataSrc) {

      amazonService.createGiftCard(dataSrc, function(err, giftCard) {
        $log.debug("creating gift card " + count);
        if (err) {
          giftCard = {};
          giftCard.status = 'FAILURE';
          ongoingProcess.set('Processing Transaction...', false);
          popupService.showAlert(gettextCatalog.getString('Error'), bwcError.msg(err));
          self.errorInfo = dataSrc;
          $timeout(function() {
            $scope.$digest();
          });
        }

        if (giftCard.status == 'PENDING' && count < 3) {
          $log.debug("pending gift card not available yet");
          self.debounceCreate(count + 1, dataSrc, dataSrc);
          return;
        }

        var now = moment().unix() * 1000;

        var newData = giftCard;
        newData['invoiceId'] = dataSrc.invoiceId;
        newData['accessKey'] = dataSrc.accessKey;
        newData['invoiceUrl'] = dataSrc.invoiceUrl;
        newData['amount'] = dataSrc.amount;
        newData['date'] = dataSrc.invoiceTime || now;
        newData['uuid'] = dataSrc.uuid;

        if (newData.status == 'expired') {
          amazonService.savePendingGiftCard(newData, {
            remove: true
          }, function(err) {
            return;
          });
        }

        amazonService.savePendingGiftCard(newData, null, function(err) {
          ongoingProcess.set('Processing Transaction...', false);
          $log.debug("Saving new gift card with status: " + newData.status);

          self.giftCard = newData;
          if (newData.status == 'PENDING') $state.transitionTo('tabs.giftcards.amazon');
          $timeout(function() {
            $scope.$digest();
          });
        });
      });
    };

    $scope.$on("$ionicView.enter", function(event, data){
      $scope.formData = { fiat: null };
      $scope.wallets = profileService.getWallets({
        network: network,
        onlyComplete: true
      });
    });

  });

'use strict';

angular.module('copayApp.controllers').controller('buyCoinbaseController',
  function($scope, $log, $ionicModal, $timeout, lodash, profileService, coinbaseService, addressService, ongoingProcess) {
    var self = this;

    this.init = function(testnet) {
      self.allWallets = profileService.getWallets(testnet ? 'testnet' : 'livenet');

      var client = profileService.focusedClient;
      if (client) {
        $timeout(function() {
          self.selectedWalletId = client.credentials.walletId;
          self.selectedWalletName = client.credentials.walletName;
          $scope.$apply();
        }, 100);
      }
    };

    this.getPaymentMethods = function(token) {
      coinbaseService.getPaymentMethods(token, function(err, p) {
        if (err) {
          self.error = err;
          return;
        }
        self.paymentMethods = [];
        lodash.each(p.data, function(pm) {
          if (pm.allow_buy) {
            self.paymentMethods.push(pm);
          }
          if (pm.allow_buy && pm.primary_buy) {
            $scope.selectedPaymentMethod = pm;
          }
        });
      });
    };

    this.getPrice = function(token) {
      var currency = 'USD';
      coinbaseService.buyPrice(token, currency, function(err, b) {
        if (err) return;
        self.buyPrice = b.data || null;
      });
    };

    $scope.openWalletsModal = function(wallets) {
      self.error = null;

      $scope.type = 'BUY';
      $scope.wallets = wallets;
      $scope.noColor = true;
      $scope.self = self;

      $ionicModal.fromTemplateUrl('views/modals/wallets.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.walletsModal = modal;
        $scope.walletsModal.show();
      });

      $scope.$on('walletSelected', function(ev, walletId) {
        $timeout(function() {
          var client = profileService.getClient(walletId);
          self.selectedWalletId = walletId;
          self.selectedWalletName = client.credentials.walletName;
          $scope.$apply();
        }, 100);
        $scope.walletsModal.hide();
      });
    };

    this.buyRequest = function(token, account) {
      self.error = null;
      var accountId = account.id;
      var amount = $scope.amount ? $scope.amount : $scope.fiat;
      var currency = $scope.amount ? 'BTC' : 'USD';
      if (!amount) return;
      var dataSrc = {
        amount: amount,
        currency: currency,
        payment_method: $scope.selectedPaymentMethod.id || null
      };
      ongoingProcess.set('Sending request...', true);
      coinbaseService.buyRequest(token, accountId, dataSrc, function(err, data) {
        ongoingProcess.set('Sending request...', false);
        if (err) {
          self.error = err;
          return;
        }
        self.buyInfo = data.data;
      });
    };

    this.confirmBuy = function(token, account, buy) {
      self.error = null;
      var accountId = account.id;
      var buyId = buy.id;
      ongoingProcess.set('Buying Bitcoin...', true);
      coinbaseService.buyCommit(token, accountId, buyId, function(err, b) {
        ongoingProcess.set('Buying Bitcoin...', false);
        if (err) {
          self.error = err;
          return;
        } else {
          var tx = b.data.transaction;
          if (!tx) return;

          ongoingProcess.set('Fetching transaction...', true);
          coinbaseService.getTransaction(token, accountId, tx.id, function(err, updatedTx) {
            ongoingProcess.set('Fetching transaction...', false);
            if (err) $log.debug(err);
            addressService.getAddress(self.selectedWalletId, false, function(err, addr) {
              if (err) {
                self.error = {
                  errors: [{
                    message: 'Could not create address'
                  }]
                };
                return;
              }
              updatedTx.data['toAddr'] = addr;
              coinbaseService.savePendingTransaction(updatedTx.data, {}, function(err) {
                if (err) $log.debug(err);
                if (updatedTx.data.status == 'completed') {
                  self.sendToCopay(token, account, updatedTx.data);
                } else {
                  self.success = updatedTx.data;
                  $timeout(function() {
                    $scope.$emit('Local/CoinbaseTx');
                  }, 1000);
                }
              });
            });
          });
        }
      });
    };

    this.sendToCopay = function(token, account, tx) {
      self.error = null;
      var accountId = account.id;

      ongoingProcess.set('Sending funds to Copay...', true);
      var data = {
        to: tx.toAddr,
        amount: tx.amount.amount,
        currency: tx.amount.currency,
        description: 'Copay Wallet: ' + self.selectedWalletName
      };
      coinbaseService.sendTo(token, accountId, data, function(err, res) {
        ongoingProcess.set('Sending funds to Copay...', false);
        if (err) {
          self.error = err;
        } else {
          self.receiveInfo = res.data;
          if (!res.data.id) return;
          coinbaseService.getTransaction(token, accountId, res.data.id, function(err, sendTx) {
            coinbaseService.savePendingTransaction(tx, {
              remove: true
            }, function(err) {
              coinbaseService.savePendingTransaction(sendTx.data, {}, function(err) {
                $timeout(function() {
                  $scope.$emit('Local/CoinbaseTx');
                }, 1000);
              });
            });
          });
        }

      });
    };


  });

'use strict';

angular.module('copayApp.controllers').controller('buyGlideraController',
  function($scope, $timeout, $log, profileService, walletService, glideraService, bwcError, lodash, ongoingProcess, popupService, gettextCatalog) {

    var wallet;
    var self = this;
    this.show2faCodeInput = null;
    this.success = null;
    $scope.network = glideraService.getEnvironment();

    $scope.$on('Wallet/Changed', function(event, w) {
      if (lodash.isEmpty(w)) {
        $log.debug('No wallet provided');
        return;
      }
      wallet = w;
      $log.debug('Wallet changed: ' + w.name);
    });

    $scope.update = function(opts) {
      if (!$scope.token || !$scope.permissions) return;
      $log.debug('Updating Glidera Account...');
      var accessToken = $scope.token;
      var permissions = $scope.permissions;

      opts = opts || {};

      glideraService.getStatus(accessToken, function(err, data) {
        $scope.status = data;
      });

      glideraService.getLimits(accessToken, function(err, limits) {
        $scope.limits = limits;
      });

      if (permissions.transaction_history) {
        glideraService.getTransactions(accessToken, function(err, data) {
          $scope.txs = data;
        });
      }

      if (permissions.view_email_address && opts.fullUpdate) {
        glideraService.getEmail(accessToken, function(err, data) {
          $scope.email = data.email;
        });
      }
      if (permissions.personal_info && opts.fullUpdate) {
        glideraService.getPersonalInfo(accessToken, function(err, data) {
          $scope.personalInfo = data;
        });
      }
    };

    this.getBuyPrice = function(token, price) {
      var self = this;
      if (!price || (price && !price.qty && !price.fiat)) {
        this.buyPrice = null;
        return;
      }
      this.gettingBuyPrice = true;
      glideraService.buyPrice(token, price, function(err, buyPrice) {
        self.gettingBuyPrice = false;
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Could not get exchange information. Please, try again'));
          return;
        }
        self.buyPrice = buyPrice;
      });
    };

    this.get2faCode = function(token) {
      var self = this;
      ongoingProcess.set('Sending 2FA code...', true);
      $timeout(function() {
        glideraService.get2faCode(token, function(err, sent) {
          ongoingProcess.set('Sending 2FA code...', false);
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Could not send confirmation code to your phone'));
            return;
          }
          self.show2faCodeInput = sent;
        });
      }, 100);
    };

    this.sendRequest = function(token, permissions, twoFaCode) {
      var self = this;
      ongoingProcess.set('Buying Bitcoin...', true);
      $timeout(function() {
        walletService.getAddress(wallet, false, function(err, walletAddr) {
          if (err) {
            ongoingProcess.set('Buying Bitcoin...', false);
            popupService.showAlert(gettextCatalog.getString('Error'), bwcError.cb(err, 'Could not create address'));
            return;
          }
          var data = {
            destinationAddress: walletAddr,
            qty: self.buyPrice.qty,
            priceUuid: self.buyPrice.priceUuid,
            useCurrentPrice: false,
            ip: null
          };
          glideraService.buy(token, twoFaCode, data, function(err, data) {
            ongoingProcess.set('Buying Bitcoin...', false);
            if (err) {
              popupService.showAlert(gettextCatalog.getString('Error'), err);
              return;
            }
            self.success = data;
            $timeout(function() {
              $scope.$digest();
            });
          });
        });
      }, 100);
    };

    $scope.$on("$ionicView.enter", function(event, data){
      $scope.token = null;
      $scope.permissions = null;
      $scope.email = null;
      $scope.personalInfo = null;
      $scope.txs = null;
      $scope.status = null;
      $scope.limits = null;

      ongoingProcess.set('connectingGlidera', true);
      glideraService.init($scope.token, function(err, glidera) {
        ongoingProcess.set('connectingGlidera');
        if (err || !glidera) {
          if (err) popupService.showAlert(gettextCatalog.getString('Error'), err);
          return;
        }
        $scope.token = glidera.token;
        $scope.permissions = glidera.permissions;
        $scope.update({fullUpdate: true});
      });

      $scope.wallets = profileService.getWallets({
        network: $scope.network,
        n: 1,
        onlyComplete: true
      });
    });

  });

'use strict';

angular.module('copayApp.controllers').controller('coinbaseController',
  function($rootScope, $scope, $timeout, $ionicModal, profileService, configService, storageService, coinbaseService, lodash, platformInfo, ongoingProcess) {

    var isNW = platformInfo.isNW;

    if (platformInfo.isCordova && StatusBar.isVisible) {
      StatusBar.backgroundColorByHexString("#4B6178");
    }

    this.openAuthenticateWindow = function() {
      var oauthUrl = this.getAuthenticateUrl();
      if (!isNW) {
        $rootScope.openExternalLink(oauthUrl, '_system');
      } else {
        var self = this;
        var gui = require('nw.gui');
        var win = gui.Window.open(oauthUrl, {
          focus: true,
          position: 'center'
        });
        win.on('loaded', function() {
          var title = win.title;
          if (title.indexOf('Coinbase') == -1) {
            $scope.code = title;
            self.submitOauthCode(title);
            win.close();
          }
        });
      }
    }

    this.getAuthenticateUrl = function() {
      return coinbaseService.getOauthCodeUrl();
    };

    this.submitOauthCode = function(code) {
      var self = this;
      var coinbaseTestnet = configService.getSync().coinbase.testnet;
      var network = coinbaseTestnet ? 'testnet' : 'livenet';
      ongoingProcess.set('connectingCoinbase', true);
      this.error = null;
      $timeout(function() {
        coinbaseService.getToken(code, function(err, data) {
          ongoingProcess.set('connectingCoinbase', false);
          if (err) {
            self.error = err;
            $timeout(function() {
              $scope.$apply();
            }, 100);
          } else if (data && data.access_token && data.refresh_token) {
            storageService.setCoinbaseToken(network, data.access_token, function() {
              storageService.setCoinbaseRefreshToken(network, data.refresh_token, function() {
                $scope.$emit('Local/CoinbaseUpdated', data.access_token);
                $timeout(function() {
                  $scope.$apply();
                }, 100);
              });
            });
          }
        });
      }, 100);
    };

    this.openTxModal = function(tx) {
      $scope.tx = tx;

      $ionicModal.fromTemplateUrl('views/modals/coinbase-tx-details.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.coinbaseTxDetailsModal = modal;
        $scope.coinbaseTxDetailsModal.show();
      });
    };

  });

'use strict';
angular.module('copayApp.controllers').controller('coinbaseUriController',
  function($scope, $stateParams, $timeout, profileService, configService, coinbaseService, storageService, $state, ongoingProcess) {

    this.submitOauthCode = function(code) {
      var self = this;
      var coinbaseTestnet = configService.getSync().coinbase.testnet;
      var network = coinbaseTestnet ? 'testnet' : 'livenet';
      ongoingProcess.set('connectingCoinbase', true);
      this.error = null;
      $timeout(function() {
        coinbaseService.getToken(code, function(err, data) {
          ongoingProcess.set('connectingCoinbase', false);
          if (err) {
            self.error = err;
            $timeout(function() {
              $scope.$apply();
            }, 100);
          } else if (data && data.access_token && data.refresh_token) {
            storageService.setCoinbaseToken(network, data.access_token, function() {
              storageService.setCoinbaseRefreshToken(network, data.refresh_token, function() {
                $scope.$emit('Local/CoinbaseUpdated', data.access_token);
                $timeout(function() {
                  $state.go('coinbase');
                  $scope.$apply();
                }, 100);
              });
            });
          }
        });
      }, 100);
    };

    this.checkCode = function() {
      if ($stateParams.url) {
        var match = $stateParams.url.match(/code=(.+)&/);
        if (match && match[1]) {
          this.code = match[1];
          return this.submitOauthCode(this.code);
        }
      }
      $log.error('Bad state: ' + JSON.stringify($stateParams));
    }
  });

'use strict';

angular.module('copayApp.controllers').controller('confirmController', function($rootScope, $scope, $filter, $timeout, $ionicScrollDelegate, gettextCatalog, walletService, platformInfo, lodash, configService, rateService, $stateParams, $window, $state, $log, profileService, bitcore, $ionicPopup, gettext, txFormatService, ongoingProcess, $ionicModal, popupService) {
  var cachedTxp = {};
  var isChromeApp = platformInfo.isChromeApp;

  $scope.isWallet = $stateParams.isWallet;
  $scope.toAmount = $stateParams.toAmount;
  $scope.toAddress = $stateParams.toAddress;
  $scope.toName = $stateParams.toName;
  $scope.toEmail = $stateParams.toEmail;
  $scope.description = $stateParams.description;
  $scope.paypro = $stateParams.paypro;

  $scope.$on("$ionicView.enter", function(event, data) {
    initConfirm();
  });

  var initConfirm = function() {
    if ($scope.paypro) {
      return setFromPayPro($scope.paypro, function(err) {
        if (err && !isChromeApp) {
          popupService.showAlert(gettext('Could not fetch payment'));
        }
      });
    }
    // TODO (URL , etc)
    if (!$scope.toAddress || !$scope.toAmount) {
      $log.error('Bad params at amount')
      throw ('bad params');
    }
    $scope.isCordova = platformInfo.isCordova;
    $scope.data = {};

    var config = configService.getSync().wallet;
    $scope.feeLevel = config.settings ? config.settings.feeLevel : '';

    $scope.toAmount = parseInt($scope.toAmount);
    $scope.amountStr = txFormatService.formatAmountStr($scope.toAmount);

    var networkName = (new bitcore.Address($scope.toAddress)).network.name;
    $scope.network = networkName;

    $scope.notAvailable = false;
    var wallets = profileService.getWallets({
      onlyComplete: true,
      network: networkName,
    });

    var filteredWallets = [];
    var index = 0;

    lodash.each(wallets, function(w) {
      walletService.getStatus(w, {}, function(err, status) {
        if (err || !status) {
          $log.error(err);
        } else {
          if (!status.availableBalanceSat) $log.debug('No balance available in: ' + w.name);
          if (status.availableBalanceSat > $scope.toAmount) filteredWallets.push(w);
        }

        if (++index == wallets.length) {
          if (!lodash.isEmpty(filteredWallets)) {
            $scope.wallets = lodash.clone(filteredWallets);
            $scope.notAvailable = false;
          } else {
            $scope.notAvailable = true;
            $log.warn('No wallet available to make the payment');
          }
        }
      });
    });

    txFormatService.formatAlternativeStr($scope.toAmount, function(v) {
      $scope.alternativeAmountStr = v;
    });

    $timeout(function() {
      $scope.$apply();
    }, 100);
  };

  $scope.$on('accepted', function(event) {
    $scope.approve();
  });

  $scope.$on('Wallet/Changed', function(event, wallet) {
    if (lodash.isEmpty(wallet)) {
      $log.debug('No wallet provided');
      return;
    }
    $log.debug('Wallet changed: ' + wallet.name);
    setWallet(wallet, true);
  });


  $scope.showDescriptionPopup = function() {
    var message = gettextCatalog.getString('Add description');
    var opts = {
      defaultText: $scope.description
    };

    popupService.showPrompt(null, message, opts, function(res) {
      if (res) $scope.description = res;
      $timeout(function() {
        $scope.$apply();
      }, 100);
    });
  };

  var setFromPayPro = function(uri, cb) {
    if (!cb) cb = function() {};

    var wallet = profileService.getWallets({
      onlyComplete: true
    })[0];

    if (!wallet) return cb();

    if (isChromeApp) {
      popupService.showAlert(gettextCatalog.getString('Payment Protocol not supported on Chrome App'));
      return cb(true);
    }

    $log.debug('Fetch PayPro Request...', uri);

    ongoingProcess.set('fetchingPayPro', true);
    wallet.fetchPayPro({
      payProUrl: uri,
    }, function(err, paypro) {

      ongoingProcess.set('fetchingPayPro', false);

      if (err) {
        $log.warn('Could not fetch payment request:', err);
        var msg = err.toString();
        if (msg.match('HTTP')) {
          msg = gettextCatalog.getString('Could not fetch payment information');
        }
        popupService.showAlert(msg);
        return cb(true);
      }

      if (!paypro.verified) {
        $log.warn('Failed to verify payment protocol signatures');
        popupService.showAlert(gettextCatalog.getString('Payment Protocol Invalid'));
        return cb(true);
      }

      $scope.toAmount = paypro.amount;
      $scope.toAddress = paypro.toAddress;
      $scope.description = paypro.memo;
      $scope.paypro = null;

      $scope._paypro = paypro;

      return initConfirm();
    });
  };

  function setWallet(wallet, delayed) {
    var stop;
    $scope.wallet = wallet;
    $scope.fee = $scope.txp = null;

    $timeout(function() {
      $ionicScrollDelegate.resize();
      $scope.$apply();
    }, 10);

    if (stop) {
      $timeout.cancel(stop);
      stop = null;
    }

    if (cachedTxp[wallet.id]) {
      apply(cachedTxp[wallet.id]);
    } else {
      stop = $timeout(function() {
        createTx(wallet, true, function(err, txp) {
          if (err) return;
          cachedTxp[wallet.id] = txp;
          apply(txp);
        });
      }, delayed ? 2000 : 1);
    }
  };

  var setSendError = function(msg) {
    popupService.showAlert(gettextCatalog.getString('Error at confirm:'), msg);
  };

  function apply(txp) {
    $scope.fee = txFormatService.formatAmountStr(txp.fee);
    $scope.txp = txp;
    $scope.$apply();
  };

  var createTx = function(wallet, dryRun, cb) {
    var config = configService.getSync().wallet;
    var currentSpendUnconfirmed = config.spendUnconfirmed;
    var outputs = [];

    var paypro = $scope.paypro;
    var toAddress = $scope.toAddress;
    var toAmount = $scope.toAmount;
    var description = $scope.description;

    // ToDo: use a credential's (or fc's) function for this
    if (description && !wallet.credentials.sharedEncryptingKey) {
      var msg = 'Could not add message to imported wallet without shared encrypting key';
      $log.warn(msg);
      return setSendError(msg);
    }

    if (toAmount > Number.MAX_SAFE_INTEGER) {
      var msg = 'Amount too big';
      $log.warn(msg);
      return setSendError(msg);
    };

    outputs.push({
      'toAddress': toAddress,
      'amount': toAmount,
      'message': description
    });

    var txp = {};

    // TODO
    if (!lodash.isEmpty($scope.sendMaxInfo)) {
      txp.sendMax = true;
      txp.inputs = $scope.sendMaxInfo.inputs;
      txp.fee = $scope.sendMaxInfo.fee;
    }

    txp.outputs = outputs;
    txp.message = description;
    txp.payProUrl = paypro;
    txp.excludeUnconfirmedUtxos = config.spendUnconfirmed ? false : true;
    txp.feeLevel = config.settings.feeLevel || 'normal';
    txp.dryRun = dryRun;

    walletService.createTx(wallet, txp, function(err, ctxp) {
      if (err) {
        return setSendError(err);
      }
      return cb(null, ctxp);
    });
  };

  $scope.openPPModal = function() {
    $ionicModal.fromTemplateUrl('views/modals/paypro.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.payproModal = modal;
      $scope.payproModal.show();
    });
  };

  $scope.approve = function() {
    var wallet = $scope.wallet;
    if (!wallet) {
      return setSendError(gettextCatalog.getString('No wallet selected'));
    };


    if (!wallet.canSign() && !wallet.isPrivKeyExternal()) {
      $log.info('No signing proposal: No private key');

      return walletService.onlyPublish(wallet, txp, function(err, txp) {
        if (err) return setSendError(err);
      });
    }
    ongoingProcess.set('creatingTx', true);
    createTx(wallet, false, function(err, txp) {
      ongoingProcess.set('creatingTx', false);
      if (err) return;

      var config = configService.getSync();
      var spendingPassEnabled = walletService.isEncrypted(wallet);
      var touchIdEnabled = config.touchIdFor && !config.touchIdFor[wallet.id];
      var isCordova = $scope.isCordova;
      var bigAmount = parseFloat(txFormatService.formatToUSD(txp.amount)) > 20;
      var message = gettextCatalog.getString('Sending {{amountStr}} from your {{name}} wallet', {
        amountStr: $scope.amountStr,
        name: wallet.name
      });
      var okText = gettextCatalog.getString('Confirm');
      var cancelText = gettextCatalog.getString('Cancel');

      if (!spendingPassEnabled && !touchIdEnabled) {
        if (isCordova && bigAmount) {
          popupService.showConfirm(null, message, okText, cancelText, function(ok) {
            if (!ok) return;
            publishAndSign(wallet, txp);
          });
        }
        else {
          popupService.showConfirm(null, message, okText, cancelText, function(ok) {
            if (!ok) return;
            publishAndSign(wallet, txp);
          });
        }
      }
      else publishAndSign(wallet, txp);
    });
  };

  function publishAndSign(wallet, txp) {
    walletService.publishAndSign(wallet, txp, function(err, txp) {
      if (err) return setSendError(err);
    });
  };

  $scope.cancel = function() {
    $state.go('tabs.send');
  };
});

'use strict';

angular.module('copayApp.controllers').controller('copayersController',
  function($scope, $log, $timeout, $stateParams, $state, $rootScope, $ionicHistory, lodash, profileService, walletService, popupService, platformInfo, gettextCatalog, ongoingProcess) {

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      init();
    });

    var init = function() {
      $scope.isCordova = platformInfo.isCordova;
      $scope.wallet = profileService.getWallet($stateParams.walletId);
      updateWallet();
    };

    $rootScope.$on('bwsEvent', function() {
      updateWallet();
    });

    var updateWallet = function() {
      $log.debug('Updating wallet:' + $scope.wallet.name)
      walletService.getStatus($scope.wallet, {}, function(err, status) {
        if (err) {
          $log.error(err); //TODO
          return;
        }
        $scope.wallet.status = status;
        $scope.copayers = $scope.wallet.status.wallet.copayers;
        $scope.secret = $scope.wallet.status.wallet.secret;
        $timeout(function() {
          $scope.$apply();
        });
        if (status.wallet.status == 'complete') {
          $scope.wallet.openWallet(function(err, status) {
            if (err) $log.error(err);
            $scope.goHome();
          });
        }
      });
    };

    $scope.showDeletePopup = function() {
      popupService.showConfirm(gettextCatalog.getString('Confirm'), gettextCatalog.getString('Are you sure you want to delete this wallet?'), null, null, function(res) {
        if (res) deleteWallet();
      });
    };

    function deleteWallet() {
      ongoingProcess.set('deletingWallet', true);
      profileService.deleteWalletClient($scope.wallet, function(err) {
        ongoingProcess.set('deletingWallet', false);
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), err.message || err);
        } else {
          $scope.goHome();
        }
      });
    };

    $scope.copySecret = function() {
      if ($scope.isCordova) {
        window.cordova.plugins.clipboard.copy($scope.secret);
        window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
      }
    };

    $scope.shareSecret = function() {
      if ($scope.isCordova) {
        var message = gettextCatalog.getString('Join my Copay wallet. Here is the invitation code: {{secret}} You can download Copay for your phone or desktop at https://copay.io', {
          secret: $scope.secret
        });
        window.plugins.socialsharing.share(message, gettextCatalog.getString('Invitation to share a Copay Wallet'), null, null);
      }
    };

    $scope.goHome = function() {
      $ionicHistory.removeBackView();
      $state.go('tabs.home');
    };

  });

'use strict';

angular.module('copayApp.controllers').controller('createController',
  function($scope, $rootScope, $timeout, $log, lodash, $state, $ionicScrollDelegate, $ionicHistory, profileService, configService, gettext, gettextCatalog, ledger, trezor, platformInfo, derivationPathHelper, ongoingProcess, walletService, storageService, popupService) {

    var isChromeApp = platformInfo.isChromeApp;
    var isCordova = platformInfo.isCordova;
    var isDevel = platformInfo.isDevel;

    /* For compressed keys, m*73 + n*34 <= 496 */
    var COPAYER_PAIR_LIMITS = {
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 4,
      6: 4,
      7: 3,
      8: 3,
      9: 2,
      10: 2,
      11: 1,
      12: 1,
    };

    $scope.init = function(tc) {
      $scope.formData = {};
      var defaults = configService.getDefaults();
      $scope.formData.account = 1;
      $scope.formData.bwsurl = defaults.bws.url;
      $scope.TCValues = lodash.range(2, defaults.limits.totalCopayers + 1);
      $scope.formData.totalCopayers = defaults.wallet.totalCopayers;
      $scope.formData.derivationPath = derivationPathHelper.default;
      $scope.setTotalCopayers(tc);
      updateRCSelect(tc);
      updateSeedSourceSelect(tc);
    };

    $scope.showAdvChange = function() {
      $ionicScrollDelegate.resize();
    };

    function updateRCSelect(n) {
      $scope.formData.totalCopayers = n;
      var maxReq = COPAYER_PAIR_LIMITS[n];
      $scope.RCValues = lodash.range(1, maxReq + 1);
      $scope.formData.requiredCopayers = Math.min(parseInt(n / 2 + 1), maxReq);
    };

    function updateSeedSourceSelect(n) {
      var seedOptions = [{
        id: 'new',
        label: gettext('Random'),
      }, {
        id: 'set',
        label: gettext('Specify Recovery Phrase...'),
      }];

      $scope.seedSource = seedOptions[0];

      if (n > 1 && isChromeApp)
        seedOptions.push({
          id: 'ledger',
          label: 'Ledger Hardware Wallet',
        });

      if (isChromeApp || isDevel) {
        seedOptions.push({
          id: 'trezor',
          label: 'Trezor Hardware Wallet',
        });
      }
      $scope.seedOptions = seedOptions;
    };

    $scope.setTotalCopayers = function(tc) {
      $scope.formData.totalCopayers = tc;
      updateRCSelect(tc);
      updateSeedSourceSelect(tc);
    };

    $scope.create = function(form) {
      if (form && form.$invalid) {
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Please enter the required fields'));
        return;
      }

      var opts = {
        name: $scope.formData.walletName,
        m: $scope.formData.requiredCopayers,
        n: $scope.formData.totalCopayers,
        myName: $scope.formData.totalCopayers > 1 ? $scope.formData.myName : null,
        networkName: $scope.formData.testnetEnabled ? 'testnet' : 'livenet',
        bwsurl: $scope.formData.bwsurl,
        singleAddress: $scope.formData.singleAddressEnabled,
        walletPrivKey: $scope.formData._walletPrivKey, // Only for testing
      };

      var setSeed = $scope.seedSource.id == 'set';
      if (setSeed) {

        var words = $scope.formData.privateKey || '';
        if (words.indexOf(' ') == -1 && words.indexOf('prv') == 1 && words.length > 108) {
          opts.extendedPrivateKey = words;
        } else {
          opts.mnemonic = words;
        }
        opts.passphrase = $scope.formData.passphrase;

        var pathData = derivationPathHelper.parse($scope.formData.derivationPath);
        if (!pathData) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Invalid derivation path'));
          return;
        }

        opts.account = pathData.account;
        opts.networkName = pathData.networkName;
        opts.derivationStrategy = pathData.derivationStrategy;

      } else {
        opts.passphrase = $scope.formData.createPassphrase;
      }

      if (setSeed && !opts.mnemonic && !opts.extendedPrivateKey) {
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Please enter the wallet recovery phrase'));
        return;
      }

      if ($scope.seedSource.id == 'ledger' || $scope.seedSource.id == 'trezor') {
        var account = $scope.formData.account;
        if (!account || account < 1) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Invalid account number'));
          return;
        }

        if ($scope.seedSource.id == 'trezor')
          account = account - 1;

        opts.account = account;
        ongoingProcess.set('connecting' + $scope.seedSource.id, true);

        var src = $scope.seedSource.id == 'ledger' ? ledger : trezor;

        src.getInfoForNewWallet(opts.n > 1, account, function(err, lopts) {
          ongoingProcess.set('connecting' + $scope.seedSource.id, false);
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), err);
            return;
          }
          opts = lodash.assign(lopts, opts);
          _create(opts);
        });
      } else {
        _create(opts);
      }
    };

    function _create(opts) {
      ongoingProcess.set('creatingWallet', true);
      $timeout(function() {

        profileService.createWallet(opts, function(err, client) {
          ongoingProcess.set('creatingWallet', false);
          if (err) {
            $log.warn(err);
            popupService.showAlert(gettextCatalog.getString('Error'), err);
            return;
          }

          walletService.updateRemotePreferences(client, {}, function() {
            $log.debug('Remote preferences saved for:' + client.credentials.walletId)
          });


          if ($scope.seedSource.id == 'set') {
            profileService.setBackupFlag(client.credentials.walletId);
          }
          $ionicHistory.removeBackView();
          if (!client.isComplete()) {
            $ionicHistory.nextViewOptions({
              disableAnimate: true
            });
            $state.go('tabs.home');
            $timeout(function() {
              $state.transitionTo('tabs.copayers', {
                walletId: client.credentials.walletId
              });
            }, 100);
          }
          else $state.go('tabs.home')
        });
      }, 100);
    }
  });

'use strict';

angular.module('copayApp.controllers').controller('DevLoginController', function($scope, $rootScope, $routeParams, identityService) {

  var mail = $routeParams.mail;
  var password = $routeParams.password;

  var form = {};
  form.email = {};
  form.password = {};
  form.email.$modelValue = mail;
  form.password.$modelValue = password;

  identityService.open($scope, form);

});

'use strict';

angular.module('copayApp.controllers').controller('exportController',
  function($scope, $timeout, $log, $ionicHistory, backupService, walletService, storageService, profileService, platformInfo, gettextCatalog, $state, $stateParams, popupService) {
    var wallet = profileService.getWallet($stateParams.walletId);

    var init = function() {
      $scope.formData = {};
      $scope.isEncrypted = wallet.isPrivKeyEncrypted();
      $scope.isCordova = platformInfo.isCordova;
      $scope.isSafari = platformInfo.isSafari;
      $scope.formData.noSignEnabled = false;
      $scope.showAdvanced = false;
      $scope.wallet = wallet;
      $scope.canSign = wallet.canSign();

      walletService.getEncodedWalletInfo(wallet, function(err, code) {
        if (err || !code) {
          $log.warn(err);
          return $ionicHistory.goBack();
        }

        if (!code)
          $scope.formData.supported = false;
        else {
          $scope.formData.supported = true;
          $scope.formData.exportWalletInfo = code;
        }

        $timeout(function() {
          $scope.$apply();
        }, 1);
      });
    };

    /*
      EXPORT WITHOUT PRIVATE KEY - PENDING
    */

    $scope.noSignEnabledChange = function() {
      if (!$scope.formData.supported) return;

      walletService.getEncodedWalletInfo(wallet, function(err, code) {
        if (err) {
          $log.error(err);
          $scope.formData.supported = false;
          $scope.formData.exportWalletInfo = null;
        } else {
          $scope.formData.supported = true;
          $scope.formData.exportWalletInfo = code;
        }
        $timeout(function() {
          $scope.$apply();
        }, 1);
      });
    };

    $scope.downloadWalletBackup = function() {
      $scope.getAddressbook(function(err, localAddressBook) {
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Failed to export'));
          return;
        }
        var opts = {
          noSign: $scope.formData.noSignEnabled,
          addressBook: localAddressBook
        };

        backupService.walletDownload($scope.formData.password, opts, function(err) {
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Failed to export'));
            return;
          }
          $ionicHistory.removeBackView();
          $state.go('tabs.home');
        });
      });
    };

    $scope.getAddressbook = function(cb) {
      storageService.getAddressbook(wallet.credentials.network, function(err, addressBook) {
        if (err) return cb(err);

        var localAddressBook = [];
        try {
          localAddressBook = JSON.parse(addressBook);
        } catch (ex) {
          $log.warn(ex);
        }

        return cb(null, localAddressBook);
      });
    };

    $scope.getBackup = function(cb) {
      $scope.getAddressbook(function(err, localAddressBook) {
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Failed to export'));
          return cb(null);
        }
        var opts = {
          noSign: $scope.formData.noSignEnabled,
          addressBook: localAddressBook
        };

        var ew = backupService.walletExport($scope.formData.password, opts);
        if (!ew) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Failed to export'));
        }
        return cb(ew);
      });
    };

    $scope.viewWalletBackup = function() {
      $timeout(function() {
        $scope.getBackup(function(backup) {
          var ew = backup;
          if (!ew) return;
          $scope.backupWalletPlainText = ew;
        });
      }, 100);
    };

    $scope.copyWalletBackup = function() {
      $scope.getBackup(function(backup) {
        var ew = backup;
        if (!ew) return;
        window.cordova.plugins.clipboard.copy(ew);
        window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
      });
    };

    $scope.sendWalletBackup = function() {
      window.plugins.toast.showShortCenter(gettextCatalog.getString('Preparing backup...'));
      var name = (wallet.credentials.walletName || wallet.credentials.walletId);
      if (wallet.alias) {
        name = wallet.alias + ' [' + name + ']';
      }
      $scope.getBackup(function(backup) {
        var ew = backup;
        if (!ew) return;

        if ($scope.formData.noSignEnabled)
          name = name + '(No Private Key)';

        var subject = 'Copay Wallet Backup: ' + name;
        var body = 'Here is the encrypted backup of the wallet ' + name + ': \n\n' + ew + '\n\n To import this backup, copy all text between {...}, including the symbols {}';
        window.plugins.socialsharing.shareViaEmail(
          body,
          subject,
          null, // TO: must be null or an array
          null, // CC: must be null or an array
          null, // BCC: must be null or an array
          null, // FILES: can be null, a string, or an array
          function() {},
          function() {}
        );
      });
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      init();
    });

  });

'use strict';

angular.module('copayApp.controllers').controller('glideraController',
  function($scope, $timeout, $ionicModal, $log, storageService, glideraService, ongoingProcess, platformInfo, externalLinkService, popupService, gettextCatalog) {

    $scope.network = glideraService.getEnvironment();

    $scope.openExternalLink = function(url, target) {
      externalLinkService.open(url, target);
    };

    var initGlidera = function(accessToken) {
      $scope.token = null;
      $scope.permissions = null;
      $scope.email = null;
      $scope.personalInfo = null;
      $scope.txs = null;
      $scope.status = null;
      $scope.limits = null;

      ongoingProcess.set('connectingGlidera', true);
      glideraService.init($scope.token, function(err, glidera) {
        ongoingProcess.set('connectingGlidera');
        if (err || !glidera) {
          if (err) popupService.showAlert(gettextCatalog.getString('Error'), err);
          return;
        }
        $scope.token = glidera.token;
        $scope.permissions = glidera.permissions;
        $scope.update({fullUpdate: true});
      });
    };

    $scope.update = function(opts) {
      if (!$scope.token || !$scope.permissions) return;
      $log.debug('Updating Glidera Account...');
      var accessToken = $scope.token;
      var permissions = $scope.permissions;

      opts = opts || {};

      glideraService.getStatus(accessToken, function(err, data) {
        $scope.status = data;
      });

      glideraService.getLimits(accessToken, function(err, limits) {
        $scope.limits = limits;
      });

      if (permissions.transaction_history) {
        glideraService.getTransactions(accessToken, function(err, data) {
          $scope.txs = data;
        });
      }

      if (permissions.view_email_address && opts.fullUpdate) {
        glideraService.getEmail(accessToken, function(err, data) {
          $scope.email = data.email;
        });
      }
      if (permissions.personal_info && opts.fullUpdate) {
        glideraService.getPersonalInfo(accessToken, function(err, data) {
          $scope.personalInfo = data;
        });
      }
    };

    this.getAuthenticateUrl = function() {
      return glideraService.getOauthCodeUrl();
    };

    this.submitOauthCode = function(code) {
      ongoingProcess.set('connectingGlidera', true);
      $timeout(function() {
        glideraService.getToken(code, function(err, data) {
          ongoingProcess.set('connectingGlidera', false);
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), err);
          } else if (data && data.access_token) {
            storageService.setGlideraToken($scope.network, data.access_token, function() {
              initGlidera(data.access_token);
              $timeout(function() {
                $scope.$apply();
              }, 100);
            });
          }
        });
      }, 100);
    };

    this.openTxModal = function(token, tx) {
      var self = this;

      $scope.self = self;
      $scope.tx = tx;

      glideraService.getTransaction(token, tx.transactionUuid, function(err, tx) {
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Could not get transactions'));
          return;
        }
        $scope.tx = tx;
      });

      $ionicModal.fromTemplateUrl('views/modals/glidera-tx-details.html', {
        scope: $scope,
        backdropClickToClose: false,
        hardwareBackButtonClose: false,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.glideraTxDetailsModal = modal;
        $scope.glideraTxDetailsModal.show();
      });
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data){
      initGlidera();
    });

  });

'use strict';
angular.module('copayApp.controllers').controller('glideraUriController',
  function($scope, $log, $stateParams, $timeout, glideraService, storageService, $state, ongoingProcess, popupService, gettextCatalog) {

    var submitOauthCode = function(code) {
      $log.debug('Glidera Oauth Code:' + code);
      $scope.network = glideraService.getEnvironment();
      ongoingProcess.set('connectingGlidera', true);
      $timeout(function() {
        glideraService.getToken(code, function(err, data) {
          ongoingProcess.set('connectingGlidera', false);
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), err);
          } else if (data && data.access_token) {
            storageService.setGlideraToken($scope.network, data.access_token, function() {
              $timeout(function() {
                $state.go('tabs.buyandsell.glidera');
                $scope.$apply();
              }, 500);
            });
          }
        });
      }, 100);
    };

    $scope.$on("$ionicView.enter", function(event, data){
      if ($stateParams.url) {
        var match = $stateParams.url.match(/code=(.+)/);
        if (match && match[1]) {
          submitOauthCode(match[1]);
          return;
        }
      }
      $log.error('Bad state: ' + JSON.stringify($stateParams));
    });
  });

'use strict';

angular.module('copayApp.controllers').controller('headController',
  function($scope, $window, $log, glideraService) {
    $scope.appConfig = $window.appConfig;
    $log.info('Running head controller:' + $window.appConfig.nameCase)
  });

'use strict';

angular.module('copayApp.controllers').controller('importController',
  function($scope, $timeout, $log, $state, $stateParams, $ionicHistory, profileService, configService, sjcl, ledger, trezor, derivationPathHelper, platformInfo, bwcService, ongoingProcess, walletService, popupService, gettextCatalog) {

    var isChromeApp = platformInfo.isChromeApp;
    var isDevel = platformInfo.isDevel;
    var reader = new FileReader();
    var defaults = configService.getDefaults();
    var errors = bwcService.getErrors();

    $scope.init = function() {
      $scope.isSafari = platformInfo.isSafari;
      $scope.isCordova = platformInfo.isCordova;
      $scope.formData = {};
      $scope.formData.bwsurl = defaults.bws.url;
      $scope.formData.derivationPath = derivationPathHelper.default;
      $scope.formData.account = 1;
      $scope.importErr = false;

      if ($stateParams.code)
        $scope.processWalletInfo($stateParams.code);

      $scope.seedOptions = [];

      if (isChromeApp) {
        $scope.seedOptions.push({
          id: 'ledger',
          label: 'Ledger Hardware Wallet',
        });
      }

      if (isChromeApp || isDevel) {
        $scope.seedOptions.push({
          id: 'trezor',
          label: 'Trezor Hardware Wallet',
        });
        $scope.seedSource = $scope.seedOptions[0];
      }
    };

    $scope.processWalletInfo = function(code) {
      if (!code) return;

      $scope.importErr = false;
      var parsedCode = code.split('|');

      if (parsedCode.length != 5) {
        /// Trying to import a malformed wallet export QR code
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Incorrect code format'));
        return;
      }

      var info = {
        type: parsedCode[0],
        data: parsedCode[1],
        network: parsedCode[2],
        derivationPath: parsedCode[3],
        hasPassphrase: parsedCode[4] == 'true' ? true : false
      };

      if (info.type == 1 && info.hasPassphrase)
        popupService.showAlert(gettextCatalog.getString('Password required. Make sure to enter your password in advanced options'));

      $scope.formData.derivationPath = info.derivationPath;
      $scope.formData.testnetEnabled = info.network == 'testnet' ? true : false;

      $timeout(function() {
        $scope.formData.words = info.data;
        $scope.$apply();
      }, 1);
    };

    var _importBlob = function(str, opts) {
      var str2, err;
      try {
        str2 = sjcl.decrypt($scope.formData.password, str);
      } catch (e) {
        err = gettextCatalog.getString('Could not decrypt file, check your password');
        $log.warn(e);
      };

      if (err) {
        popupService.showAlert(gettextCatalog.getString('Error'), err);
        return;
      }

      ongoingProcess.set('importingWallet', true);
      opts.compressed = null;
      opts.password = null;

      $timeout(function() {
        profileService.importWallet(str2, opts, function(err, client) {
          ongoingProcess.set('importingWallet', false);
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), err);
            return;

          }
          finish(client);
        });
      }, 100);
    };

    var _importExtendedPrivateKey = function(xPrivKey, opts) {
      ongoingProcess.set('importingWallet', true);
      $timeout(function() {
        profileService.importExtendedPrivateKey(xPrivKey, opts, function(err, client) {
          ongoingProcess.set('importingWallet', false);
          if (err) {
            if (err instanceof errors.NOT_AUTHORIZED) {
              $scope.importErr = true;
            } else {
              popupService.showAlert(gettextCatalog.getString('Error'), err);
            }
            return $timeout(function() {
              $scope.$apply();
            });
          }
          finish(client);
        });
      }, 100);
    };

    /*
      IMPORT FROM PUBLIC KEY - PENDING

    var _importExtendedPublicKey = function(xPubKey, opts) {
      ongoingProcess.set('importingWallet', true);
      $timeout(function() {
        profileService.importExtendedPublicKey(opts, function(err, walletId) {
          ongoingProcess.set('importingWallet', false);
          if (err) {
            $scope.error = err;
            return $timeout(function() {
              $scope.$apply();
            });
          }

          profileService.setBackupFlag(walletId);
           if ($stateParams.fromOnboarding) {
             profileService.setDisclaimerAccepted(function(err) {
               if (err) $log.error(err);
             });
           }

          $state.go('tabs.home');
        });
      }, 100);
    };
    */

    var _importMnemonic = function(words, opts) {
      ongoingProcess.set('importingWallet', true);

      $timeout(function() {
        profileService.importMnemonic(words, opts, function(err, client) {
          ongoingProcess.set('importingWallet', false);

          if (err) {
            if (err instanceof errors.NOT_AUTHORIZED) {
              $scope.importErr = true;
            } else {
              popupService.showAlert(gettextCatalog.getString('Error'), err);
            }
            return $timeout(function() {
              $scope.$apply();
            });
          }
          finish(client);
        });
      }, 100);
    };

    $scope.setDerivationPath = function() {
      $scope.formData.derivationPath = $scope.formData.testnetEnabled ? derivationPathHelper.defaultTestnet : derivationPathHelper.default;
    };

    $scope.getFile = function() {
      // If we use onloadend, we need to check the readyState.
      reader.onloadend = function(evt) {
        if (evt.target.readyState == FileReader.DONE) { // DONE == 2
          var opts = {};
          opts.bwsurl = $scope.formData.bwsurl;
          _importBlob(evt.target.result, opts);
        }
      }
    };

    $scope.importBlob = function(form) {
      if (form.$invalid) {
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('There is an error in the form'));
        return;
      }

      var backupFile = $scope.formData.file;
      var backupText = $scope.formData.backupText;
      var password = $scope.formData.password;

      if (!backupFile && !backupText) {
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Please, select your backup file'));
        return;
      }

      if (backupFile) {
        reader.readAsBinaryString(backupFile);
      } else {
        var opts = {};
        opts.bwsurl = $scope.formData.bwsurl;
        _importBlob(backupText, opts);
      }
    };

    $scope.importMnemonic = function(form) {
      if (form.$invalid) {
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('There is an error in the form'));
        return;
      }

      var opts = {};

      if ($scope.formData.bwsurl)
        opts.bwsurl = $scope.formData.bwsurl;

      var pathData = derivationPathHelper.parse($scope.formData.derivationPath);

      if (!pathData) {
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Invalid derivation path'));
        return;
      }

      opts.account = pathData.account;
      opts.networkName = pathData.networkName;
      opts.derivationStrategy = pathData.derivationStrategy;

      var words = $scope.formData.words || null;

      if (!words) {
        popupService.showAlert(gettextCatalog.getString('Please enter the recovery phrase'));
      } else if (words.indexOf('xprv') == 0 || words.indexOf('tprv') == 0) {
        return _importExtendedPrivateKey(words, opts);
      } else if (words.indexOf('xpub') == 0 || words.indexOf('tpuv') == 0) {
        return _importExtendedPublicKey(words, opts);
      } else {
        var wordList = words.split(/[\u3000\s]+/);

        if ((wordList.length % 3) != 0) {
          popupService.showAlert(gettextCatalog.getString('Wrong number of recovery words:') + wordList.length);
          return;
        }
      }

      opts.passphrase = $scope.formData.passphrase || null;
      _importMnemonic(words, opts);
    };

    $scope.importTrezor = function(account, isMultisig) {
      trezor.getInfoForNewWallet(isMultisig, account, function(err, lopts) {
        ongoingProcess.clear();
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), err);
          return;
        }

        lopts.externalSource = 'trezor';
        lopts.bwsurl = $scope.formData.bwsurl;
        ongoingProcess.set('importingWallet', true);
        $log.debug('Import opts', lopts);

        profileService.importExtendedPublicKey(lopts, function(err, wallet) {
          ongoingProcess.set('importingWallet', false);
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), err);
            return;
          }
          finish(wallet);
        });
      }, 100);
    };

    $scope.importHW = function(form) {
      if (form.$invalid || $scope.formData.ccount < 0) {
        popupService.showAlert(gettextCatalog.getString('There is an error in the form'));
        return;
      }

      $scope.importErr = false;

      var account = $scope.formData.ccount;

      if ($scope.seedSource.id == 'trezor') {
        if (account < 1) {
          popupService.showAlert(gettextCatalog.getString('Invalid account number'));
          return;
        }
        account = account - 1;
      }

      switch ($scope.seedSource.id) {
        case ('ledger'):
          ongoingProcess.set('connectingledger', true);
          $scope.importLedger(account);
          break;
        case ('trezor'):
          ongoingProcess.set('connectingtrezor', true);
          $scope.importTrezor(account, $scope.formData.isMultisig);
          break;
        default:
          throw ('Error: bad source id');
      };
    };

    $scope.importLedger = function(account) {
      ledger.getInfoForNewWallet(true, account, function(err, lopts) {
        ongoingProcess.clear();
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), err);
          return;
        }

        lopts.externalSource = 'ledger';
        lopts.bwsurl = $scope.formData.bwsurl;
        ongoingProcess.set('importingWallet', true);
        $log.debug('Import opts', lopts);

        profileService.importExtendedPublicKey(lopts, function(err, wallet) {
          ongoingProcess.set('importingWallet', false);
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), err);
            return;
          }
          finish(wallet);
        });
      }, 100);
    };

    var finish = function(wallet) {
      walletService.updateRemotePreferences(wallet, {}, function() {
        $log.debug('Remote preferences saved for:' + wallet.credentials.walletId)
      });

      profileService.setBackupFlag(wallet.credentials.walletId);
      if ($stateParams.fromOnboarding) {
        profileService.setDisclaimerAccepted(function(err) {
          if (err) $log.error(err);
        });
      }
      $ionicHistory.removeBackView();
      $state.go('tabs.home', {
        fromOnboarding: $stateParams.fromOnboarding
      });
    };
  });

'use strict';

angular.module('copayApp.controllers').controller('joinController',
  function($scope, $rootScope, $timeout, $state, $ionicHistory, profileService, configService, storageService, applicationService, gettext, gettextCatalog, lodash, ledger, trezor, platformInfo, derivationPathHelper, ongoingProcess, walletService, $log, $stateParams, popupService) {

    var isChromeApp = platformInfo.isChromeApp;
    var isDevel = platformInfo.isDevel;

    var self = this;
    var defaults = configService.getDefaults();
    $scope.bwsurl = defaults.bws.url;
    $scope.derivationPath = derivationPathHelper.default;
    $scope.account = 1;


    this.onQrCodeScanned = function(data) {
      $scope.secret = data;
      if ($scope.joinForm) {
        $scope.joinForm.secret.$setViewValue(data);
        $scope.joinForm.secret.$render();
      }
    };

    if ($stateParams.url) {
      var data = $stateParams.url;
      data = data.replace('copay:', '');
      this.onQrCodeScanned(data);
    }

    var updateSeedSourceSelect = function() {
      self.seedOptions = [{
        id: 'new',
        label: gettext('Random'),
      }, {
        id: 'set',
        label: gettext('Specify Recovery Phrase...'),
      }];
      $scope.seedSource = self.seedOptions[0];


      if (isChromeApp) {
        self.seedOptions.push({
          id: 'ledger',
          label: 'Ledger Hardware Wallet',
        });
      }

      if (isChromeApp || isDevel) {
        self.seedOptions.push({
          id: 'trezor',
          label: 'Trezor Hardware Wallet',
        });
      }
    };

    this.setSeedSource = function() {
      self.seedSourceId = $scope.seedSource.id;

      $timeout(function() {
        $rootScope.$apply();
      });
    };

    this.join = function(form) {
      if (form && form.$invalid) {
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Please enter the required fields'));
        return;
      }

      var opts = {
        secret: form.secret.$modelValue,
        myName: form.myName.$modelValue,
        bwsurl: $scope.bwsurl,
      }

      var setSeed = self.seedSourceId == 'set';
      if (setSeed) {
        var words = form.privateKey.$modelValue;
        if (words.indexOf(' ') == -1 && words.indexOf('prv') == 1 && words.length > 108) {
          opts.extendedPrivateKey = words;
        } else {
          opts.mnemonic = words;
        }
        opts.passphrase = form.passphrase.$modelValue;

        var pathData = derivationPathHelper.parse($scope.derivationPath);
        if (!pathData) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Invalid derivation path'));
          return;
        }
        opts.account = pathData.account;
        opts.networkName = pathData.networkName;
        opts.derivationStrategy = pathData.derivationStrategy;
      } else {
        opts.passphrase = form.createPassphrase.$modelValue;
      }

      opts.walletPrivKey = $scope._walletPrivKey; // Only for testing


      if (setSeed && !opts.mnemonic && !opts.extendedPrivateKey) {
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Please enter the wallet recovery phrase'));
        return;
      }

      if (self.seedSourceId == 'ledger' || self.seedSourceId == 'trezor') {
        var account = $scope.account;
        if (!account || account < 1) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Invalid account number'));
          return;
        }

        if (self.seedSourceId == 'trezor')
          account = account - 1;

        opts.account = account;
        ongoingProcess.set('connecting' + self.seedSourceId, true);
        var src = self.seedSourceId == 'ledger' ? ledger : trezor;

        src.getInfoForNewWallet(true, account, function(err, lopts) {
          ongoingProcess.set('connecting' + self.seedSourceId, false);
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), err);
            return;
          }
          opts = lodash.assign(lopts, opts);
          self._join(opts);
        });
      } else {

        self._join(opts);
      }
    };

    this._join = function(opts) {
      ongoingProcess.set('joiningWallet', true);
      $timeout(function() {
        profileService.joinWallet(opts, function(err, client) {
          ongoingProcess.set('joiningWallet', false);
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), err);
            return;
          }

          walletService.updateRemotePreferences(client, {}, function() {
            $log.debug('Remote preferences saved for:' + client.credentials.walletId)
          });
          $ionicHistory.removeBackView();
          $state.go('tabs.home');
        });
      }, 100);
    };

    updateSeedSourceSelect();
    self.setSeedSource();
  });

'use strict';

angular.module('copayApp.controllers').controller('amazonCardDetailsController', function($scope, $log, $timeout, bwcError, amazonService, lodash, ongoingProcess, popupService, gettextCatalog) {

  $scope.cancelGiftCard = function() {
    ongoingProcess.set('Canceling gift card...', true);
    amazonService.cancelGiftCard($scope.card, function(err, data) {
      ongoingProcess.set('Canceling gift card...', false);
      if (err) {
        popupService.showAlert(gettextCatalog.getString('Error'), bwcError.msg(err));
        return;
      }
      $scope.card.cardStatus = data.cardStatus;
      amazonService.savePendingGiftCard($scope.card, null, function(err) {
        $scope.$emit('UpdateAmazonList');
      });
    });
  };

  $scope.remove = function() {
    amazonService.savePendingGiftCard($scope.card, {
      remove: true
    }, function(err) {
      $scope.$emit('UpdateAmazonList');
      $scope.cancel();
    });
  };

  $scope.refreshGiftCard = function() {
    amazonService.getPendingGiftCards(function(err, gcds) {
      if (err) {
        popupService.showAlert(gettextCatalog.getString('Error'), err);
        return;
      }
      lodash.forEach(gcds, function(dataFromStorage) {
        if (dataFromStorage.status == 'PENDING' && dataFromStorage.invoiceId == $scope.card.invoiceId) {
          $log.debug("creating gift card");
          amazonService.createGiftCard(dataFromStorage, function(err, giftCard) {
            if (err) {
              popupService.showAlert(gettextCatalog.getString('Error'), bwcError.msg(err));
              return;
            }
            if (!lodash.isEmpty(giftCard)) {
              var newData = {};
              lodash.merge(newData, dataFromStorage, giftCard);
              amazonService.savePendingGiftCard(newData, null, function(err) {
                $log.debug("Saving new gift card");
                $scope.card = newData;
                $scope.$emit('UpdateAmazonList');
                $timeout(function() {
                  $scope.$digest();
                });
              });
            } else $log.debug("pending gift card not available yet");
          });
        }
      });
    });
  };

  $scope.cancel = function() {
    $scope.amazonCardDetailsModal.hide();
  };

});

'use strict';

angular.module('copayApp.controllers').controller('bitpayCardConfirmationController', function($scope, $timeout, $state, bitpayCardService) {

  $scope.ok = function() {
    bitpayCardService.logout(function() {
      $state.go('bitpayCard.main');
    });
    $scope.cancel();
  };

  $scope.cancel = function() {
    $scope.bitpayCardConfirmationModal.hide();
  };

});

'use strict';

angular.module('copayApp.controllers').controller('coinbaseConfirmationController', function($scope, $timeout, coinbaseService, applicationService) {

  $scope.ok = function() {

    coinbaseService.logout($scope.network, function() {

      $timeout(function() {
        applicationService.restart();
      }, 1000);
    });
    $scope.cancel();
  };

  $scope.cancel = function() {
    $scope.coinbaseConfirmationModal.hide();
  };

});

'use strict';

angular.module('copayApp.controllers').controller('coinbaseTxDetailsController', function($scope, $rootScope, coinbaseService) {

  $scope.remove = function() {
    coinbaseService.savePendingTransaction($scope.tx, {
      remove: true
    }, function(err) {
      $rootScope.$emit('Local/CoinbaseTx');
      $scope.cancel();
    });
  };

  $scope.cancel = function() {
    $scope.coinbaseTxDetailsModal.hide();
  };

});

'use strict';

angular.module('copayApp.controllers').controller('confirmationController', function($scope) {

  $scope.ok = function() {
    $scope.loading = true;
    $scope.okAction();
    $scope.confirmationModal.hide();
  };

  $scope.cancel = function() {
    $scope.confirmationModal.hide();
  };

});

'use strict';

angular.module('copayApp.controllers').controller('customAmountController', function($scope, $timeout, $filter, platformInfo, rateService) {
  var self = $scope.self;

  $scope.unitName = self.unitName;
  $scope.alternativeAmount = self.alternativeAmount;
  $scope.alternativeName = self.alternativeName;
  $scope.alternativeIsoCode = self.alternativeIsoCode;
  $scope.isRateAvailable = self.isRateAvailable;
  $scope.unitToSatoshi = self.unitToSatoshi;
  $scope.unitDecimals = self.unitDecimals;
  var satToUnit = 1 / self.unitToSatoshi;
  $scope.showAlternative = false;
  $scope.isCordova = platformInfo.isCordova;

  Object.defineProperty($scope,
    "_customAlternative", {
      get: function() {
        return $scope.customAlternative;
      },
      set: function(newValue) {
        $scope.customAlternative = newValue;
        if (typeof(newValue) === 'number' && $scope.isRateAvailable) {
          $scope.customAmount = parseFloat((rateService.fromFiat(newValue, $scope.alternativeIsoCode) * satToUnit).toFixed($scope.unitDecimals), 10);
        } else {
          $scope.customAmount = null;
        }
      },
      enumerable: true,
      configurable: true
    });

  Object.defineProperty($scope,
    "_customAmount", {
      get: function() {
        return $scope.customAmount;
      },
      set: function(newValue) {
        $scope.customAmount = newValue;
        if (typeof(newValue) === 'number' && $scope.isRateAvailable) {
          $scope.customAlternative = parseFloat((rateService.toFiat(newValue * $scope.unitToSatoshi, $scope.alternativeIsoCode)).toFixed(2), 10);
        } else {
          $scope.customAlternative = null;
        }
        $scope.alternativeAmount = $scope.customAlternative;
      },
      enumerable: true,
      configurable: true
    });

  $scope.submitForm = function(form) {
    var satToBtc = 1 / 100000000;
    var amount = form.amount.$modelValue;
    var amountSat = parseInt((amount * $scope.unitToSatoshi).toFixed(0));
    $timeout(function() {
      $scope.customizedAmountUnit = amount + ' ' + $scope.unitName;
      $scope.customizedAlternativeUnit = $filter('formatFiatAmount')(form.alternative.$modelValue) + ' ' + $scope.alternativeIsoCode;
      if ($scope.unitName == 'bits') {
        amount = (amountSat * satToBtc).toFixed(8);
      }
      $scope.customizedAmountBtc = amount;
    }, 1);
  };

  $scope.toggleAlternative = function() {
    $scope.showAlternative = !$scope.showAlternative;
  };

  $scope.shareAddress = function(uri) {
    if (platformInfo.isCordova) {
      window.plugins.socialsharing.share(uri, null, null, null);
    }
  };

  $scope.cancel = function() {
    $scope.customAmountModal.hide();
  };
});

'use strict';

angular.module('copayApp.controllers').controller('glideraTxDetailsController', function($scope) {

  $scope.cancel = function() {
    $scope.glideraTxDetailsModal.hide();
  };

});

'use strict';

angular.module('copayApp.controllers').controller('payproController', function($scope) {
  var self = $scope.self;

  $scope.cancel = function() {
    $scope.payproModal.hide();
  };
});

'use strict';

angular.module('copayApp.controllers').controller('receiveTipsController', function($scope, $log, storageService) {
  $scope.close = function() {
    $log.debug('Receive tips accepted');
    storageService.setReceiveTipsAccepted(true, function(err) {
      $scope.receiveTipsModal.hide();
    });
  }
});

'use strict';

angular.module('copayApp.controllers').controller('scannerController', function($scope, $timeout, storageService, $ionicModal, platformInfo) {

  // QR code Scanner
  var video;
  var canvas;
  var $video;
  var context;
  var localMediaStream;
  var prevResult;
  var scanTimer;

  var _scan = function(evt) {
    if (localMediaStream) {
      context.drawImage(video, 0, 0, 300, 225);
      try {
        qrcode.decode();
      } catch (e) {
        //qrcodeError(e);
      }
    }
    scanTimer = $timeout(_scan, 800);
  };

  var _scanStop = function() {
    $timeout.cancel(scanTimer);
    if (localMediaStream && localMediaStream.active) {
      var localMediaStreamTrack = localMediaStream.getTracks();
      for (var i = 0; i < localMediaStreamTrack.length; i++) {
        localMediaStreamTrack[i].stop();
      }
    } else {
      try {
        localMediaStream.stop();
      } catch (e) {
        // Older Chromium not support the STOP function
      };
    }
    localMediaStream = null;
    video.src = '';
  };

  qrcode.callback = function(data) {
    if (prevResult != data) {
      prevResult = data;
      return;
    }
    _scanStop();
    $scope.cancel();
    $scope.onScan({
      data: data
    });
  };

  var _successCallback = function(stream) {
    video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
    localMediaStream = stream;
    video.play();
    $timeout(_scan, 1000);
  };

  var _videoError = function(err) {
    $scope.cancel();
  };

  var setScanner = function() {
    navigator.getUserMedia = navigator.getUserMedia ||
      navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
      navigator.msGetUserMedia;
    window.URL = window.URL || window.webkitURL ||
      window.mozURL || window.msURL;
  };

  $scope.init = function() {
    if (platformInfo.isCordova) scannerInit();
    else checkTips();
  };

  function checkTips() {
    //TODO addapt tips to the new QR plugin (mobile)
    storageService.getScanTipsAccepted(function(err, accepted) {
      if (err) $log.warn(err);
      if (accepted) {
        scannerInit();
        return;
      }

      $timeout(function() {
        $ionicModal.fromTemplateUrl('views/modals/scan-tips.html', {
          scope: $scope
        }).then(function(modal) {
          $scope.scanTipsModal = modal;
          $scope.scanTipsModal.show();
        });
      }, 1000);
    });
  };

  $scope.$on('TipsModalClosed', function(event) {
    scannerInit();
  });

  function scannerInit() {
    setScanner();
    $timeout(function() {
      if ($scope.beforeScan) {
        $scope.beforeScan();
      }
      canvas = document.getElementById('qr-canvas');
      context = canvas.getContext('2d');

      video = document.getElementById('qrcode-scanner-video');
      $video = angular.element(video);
      canvas.width = 300;
      canvas.height = 225;
      context.clearRect(0, 0, 300, 225);

      navigator.getUserMedia({
        video: true
      }, _successCallback, _videoError);
    }, 500);
  };

  $scope.cancel = function() {
    _scanStop();
    $scope.scannerModal.hide();
    $scope.scannerModal.remove();
  };

});

'use strict';

angular.module('copayApp.controllers').controller('scanTipsController', function($scope, $log, storageService) {
  $scope.close = function() {
    $log.debug('Scan tips accepted');
    storageService.setScanTipsAccepted(true, function(err) {
      $scope.$emit('TipsModalClosed', function() {});
      $scope.scanTipsModal.hide();
    });
  }
});

'use strict';

angular.module('copayApp.controllers').controller('searchController', function($scope, $rootScope, $interval, $timeout, $filter, $log, $ionicModal, $ionicPopover, $ionicNavBarDelegate, $state, $stateParams, $ionicScrollDelegate, bwcError, profileService, lodash, configService, gettext, gettextCatalog, platformInfo, walletService) {

  var HISTORY_SHOW_LIMIT = 10;
  var currentTxHistoryPage = 0;
  var wallet;
  var isCordova = platformInfo.isCordova;
  $scope.txHistorySearchResults = [];
  $scope.filteredTxHistory = [];

  $scope.updateSearchInput = function(search) {
    if (isCordova)
      window.plugins.toast.hide();
    currentTxHistoryPage = 0;
    throttleSearch(search);
    $ionicScrollDelegate.resize();
  }

  var throttleSearch = lodash.throttle(function(search) {

    function filter(search) {
      $scope.filteredTxHistory = [];

      function computeSearchableString(tx) {
        var addrbook = '';
        if (tx.addressTo && self.addressbook && self.addressbook[tx.addressTo]) addrbook = self.addressbook[tx.addressTo] || '';
        var searchableDate = computeSearchableDate(new Date(tx.time * 1000));
        var message = tx.message ? tx.message : '';
        var comment = tx.note ? tx.note.body : '';
        var addressTo = tx.addressTo ? tx.addressTo : '';
        return ((tx.amountStr + message + addressTo + addrbook + searchableDate + comment).toString()).toLowerCase();
      }

      function computeSearchableDate(date) {
        var day = ('0' + date.getDate()).slice(-2).toString();
        var month = ('0' + (date.getMonth() + 1)).slice(-2).toString();
        var year = date.getFullYear();
        return [month, day, year].join('/');
      };

      if (lodash.isEmpty(search)) {
        $scope.txHistoryShowMore = false;
        return [];
      }

      $scope.filteredTxHistory = lodash.filter($scope.completeTxHistory, function(tx) {
        if (!tx.searcheableString) tx.searcheableString = computeSearchableString(tx);
        return lodash.includes(tx.searcheableString, search.toLowerCase());
      });

      if ($scope.filteredTxHistory.length > HISTORY_SHOW_LIMIT) $scope.txHistoryShowMore = true;
      else $scope.txHistoryShowMore = false;

      return $scope.filteredTxHistory;
    };
    $scope.txHistorySearchResults = filter(search).slice(0, HISTORY_SHOW_LIMIT);
    if (isCordova)
      window.plugins.toast.showShortBottom(gettextCatalog.getString('Matches: ' + $scope.filteredTxHistory.length));
    $timeout(function() {
      $rootScope.$apply();
    });

  }, 1000);

  $scope.moreSearchResults = function() {
    currentTxHistoryPage++;
    $scope.showHistory();
    $scope.$broadcast('scroll.infiniteScrollComplete');
  };

  $scope.showHistory = function() {
    $scope.txHistorySearchResults = $scope.filteredTxHistory ? $scope.filteredTxHistory.slice(0, (currentTxHistoryPage + 1) * HISTORY_SHOW_LIMIT) : [];
    $scope.txHistoryShowMore = $scope.filteredTxHistory.length > $scope.txHistorySearchResults.length;
  };

});

'use strict';

angular.module('copayApp.controllers').controller('txDetailsController', function($log, $timeout, $scope, $filter, $stateParams, ongoingProcess, walletService, lodash, gettextCatalog, profileService, configService, txFormatService, externalLinkService, popupService) {
  var config = configService.getSync();
  var configWallet = config.wallet;
  var walletSettings = configWallet.settings;
  var wallet;
  $scope.title = gettextCatalog.getString('Transaction');

  $scope.init = function() {
    wallet = $scope.wallet;
    $scope.alternativeIsoCode = walletSettings.alternativeIsoCode;
    $scope.color = wallet.color;
    $scope.copayerId = wallet.credentials.copayerId;
    $scope.isShared = wallet.credentials.n > 1;
    $scope.btx.feeLevel = walletSettings.feeLevel;

    if ($scope.btx.action != 'invalid') {
      if ($scope.btx.action == 'sent') $scope.title = gettextCatalog.getString('Sent Funds');
      if ($scope.btx.action == 'received') $scope.title = gettextCatalog.getString('Received Funds');
      if ($scope.btx.action == 'moved') $scope.title = gettextCatalog.getString('Moved Funds');
    }

    updateMemo();
    initActionList();
    getAlternativeAmount();
  };

  function updateMemo() {
    wallet.getTxNote({
      txid: $scope.btx.txid
    }, function(err, note) {
      if (err || !note) {
        $log.debug(gettextCatalog.getString('Could not fetch transaction note'));
        return;
      }
      $scope.note = note;
      $timeout(function() {
        $scope.$apply();
      });
    });
  };

  function initActionList() {
    $scope.actionList = [];
    if ($scope.btx.action != 'sent' || !$scope.isShared) return;

    var actionDescriptions = {
      created: gettextCatalog.getString('Proposal Created'),
      accept: gettextCatalog.getString('Accepted'),
      reject: gettextCatalog.getString('Rejected'),
      broadcasted: gettextCatalog.getString('Broadcasted'),
    };

    $scope.actionList.push({
      type: 'created',
      time: $scope.btx.createdOn,
      description: actionDescriptions['created'],
      by: $scope.btx.creatorName
    });

    lodash.each($scope.btx.actions, function(action) {
      $scope.actionList.push({
        type: action.type,
        time: action.createdOn,
        description: actionDescriptions[action.type],
        by: action.copayerName
      });
    });

    $scope.actionList.push({
      type: 'broadcasted',
      time: $scope.btx.time,
      description: actionDescriptions['broadcasted'],
    });
  };

  $scope.showCommentPopup = function() {
    var opts = {};
    if ($scope.btx.note && $scope.btx.note.body) opts.defaultText = $scope.btx.note.body;

    popupService.showPrompt(null, gettextCatalog.getString('Memo'), opts, function(text) {
      if (typeof text == "undefined") return;

      $log.debug('Saving memo');

      var args = {
        txid: $scope.btx.txid,
        body: text
      };

      wallet.editTxNote(args, function(err) {
        if (err) {
          $log.debug('Could not save tx comment');
          return;
        }
        // This is only to refresh the current screen data
        $scope.btx.note = null;
        if (args.body) {
          $scope.btx.note = {};
          $scope.btx.note.body = text;
          $scope.btx.note.editedByName = wallet.credentials.copayerName;
          $scope.btx.note.editedOn = Math.floor(Date.now() / 1000);
        }
        $scope.btx.searcheableString = null;
        $timeout(function() {
          $scope.$apply();
        });
      });
    });
  };

  var getAlternativeAmount = function() {
    var satToBtc = 1 / 100000000;

    wallet.getFiatRate({
      code: $scope.alternativeIsoCode,
      ts: $scope.btx.time * 1000
    }, function(err, res) {
      if (err) {
        $log.debug('Could not get historic rate');
        return;
      }
      if (res && res.rate) {
        var alternativeAmountBtc = ($scope.btx.amount * satToBtc).toFixed(8);
        $scope.rateDate = res.fetchedOn;
        $scope.rateStr = res.rate + ' ' + $scope.alternativeIsoCode;
        $scope.alternativeAmountStr = $filter('formatFiatAmount')(alternativeAmountBtc * res.rate) + ' ' + $scope.alternativeIsoCode;
        $timeout(function() {
          $scope.$apply();
        });
      }
    });
  };

  $scope.openExternalLink = function(url, target) {
    externalLinkService.open(url, target);
  };

  $scope.getShortNetworkName = function() {
    var n = wallet.credentials.network;
    return n.substring(0, 4);
  };

  $scope.cancel = function() {
    $scope.txDetailsModal.hide();
  };
});

'use strict';

angular.module('copayApp.controllers').controller('txpDetailsController', function($scope, $rootScope, $timeout, $interval, $ionicModal, ongoingProcess, platformInfo, $ionicScrollDelegate, txFormatService, fingerprintService, bwcError, gettextCatalog, lodash, walletService, popupService) {
  var self = $scope.self;
  var tx = $scope.tx;
  var copayers = $scope.copayers;
  var isGlidera = $scope.isGlidera;
  var GLIDERA_LOCK_TIME = 6 * 60 * 60;
  var now = Math.floor(Date.now() / 1000);
  var countDown;

  $scope.init = function() {
    $scope.loading = null;
    $scope.isCordova = platformInfo.isCordova;
    $scope.copayerId = $scope.wallet.credentials.copayerId;
    $scope.isShared = $scope.wallet.credentials.n > 1;
    $scope.canSign = $scope.wallet.canSign() || $scope.wallet.isPrivKeyExternal();
    $scope.color = $scope.wallet.color;
    $scope.data = {};

    initActionList();
    checkPaypro();
  }

  function initActionList() {
    $scope.actionList = [];

    if (!$scope.isShared) return;

    var actionDescriptions = {
      created: gettextCatalog.getString('Proposal Created'),
      accept: gettextCatalog.getString('Accepted'),
      reject: gettextCatalog.getString('Rejected'),
      broadcasted: gettextCatalog.getString('Broadcasted'),
    };

    $scope.actionList.push({
      type: 'created',
      time: tx.createdOn,
      description: actionDescriptions['created'],
      by: tx.creatorName
    });

    lodash.each(tx.actions, function(action) {
      $scope.actionList.push({
        type: action.type,
        time: action.createdOn,
        description: actionDescriptions[action.type],
        by: action.copayerName
      });
    });
  };

  $scope.$on('accepted', function(event) {
    $scope.sign();
  });

  // ToDo: use tx.customData instead of tx.message
  if (tx.message === 'Glidera transaction' && isGlidera) {
    tx.isGlidera = true;
    if (tx.canBeRemoved) {
      tx.canBeRemoved = (Date.now() / 1000 - (tx.ts || tx.createdOn)) > GLIDERA_LOCK_TIME;
    }
  }

  var setSendError = function(msg) {
    var error = msg || gettextCatalog.getString('Could not send payment');
    popupService.showAlert(gettextCatalog.getString('Error'), error);
  }

  $scope.sign = function() {
    $scope.loading = true;
    walletService.publishAndSign($scope.wallet, $scope.tx, function(err, txp) {
      $scope.$emit('UpdateTx');
      if (err) return setSendError(err);
      $scope.close();
    });
  };

  function setError(err, prefix) {
    $scope.loading = false;
    popupService.showAlert(gettextCatalog.getString('Error'), bwcError.msg(err, prefix));
  };

  $scope.reject = function(txp) {
    $scope.loading = true;

    walletService.reject($scope.wallet, $scope.tx, function(err, txpr) {
      if (err)
        return setError(err, gettextCatalog.getString('Could not reject payment'));

      $scope.close();
    });


  };

  $scope.remove = function() {
    $scope.loading = true;

    $timeout(function() {
      ongoingProcess.set('removeTx', true);
      walletService.removeTx($scope.wallet, $scope.tx, function(err) {
        ongoingProcess.set('removeTx', false);

        // Hacky: request tries to parse an empty response
        if (err && !(err.message && err.message.match(/Unexpected/))) {
          $scope.$emit('UpdateTx');
          return setError(err, gettextCatalog.getString('Could not delete payment proposal'));
        }

        $scope.close();
      });
    }, 10);
  };

  $scope.broadcast = function(txp) {
    $scope.loading = true;

    $timeout(function() {
      ongoingProcess.set('broadcastTx', true);
      walletService.broadcastTx($scope.wallet, $scope.tx, function(err, txpb) {
        ongoingProcess.set('broadcastTx', false);

        if (err) {
          return setError(err, gettextCatalog.getString('Could not broadcast payment'));
        }

        $scope.close();
      });
    }, 10);
  };

  $scope.getShortNetworkName = function() {
    return $scope.wallet.credentials.networkName.substring(0, 4);
  };

  function checkPaypro() {
    if (tx.payProUrl && !platformInfo.isChromeApp) {
      $scope.wallet.fetchPayPro({
        payProUrl: tx.payProUrl,
      }, function(err, paypro) {
        if (err) return;
        tx.paypro = paypro;
        paymentTimeControl(tx.paypro.expires);
        $timeout(function() {
          $ionicScrollDelegate.resize();
        }, 100);
      });
    }
  };

  function paymentTimeControl(expirationTime) {
    $scope.paymentExpired = false;
    setExpirationTime();

    countDown = $interval(function() {
      setExpirationTime();
    }, 1000);

    function setExpirationTime() {
      var now = Math.floor(Date.now() / 1000);
      if (now > expirationTime) {
        $scope.paymentExpired = true;
        if (countDown) $interval.cancel(countDown);
        return;
      }
      var totalSecs = expirationTime - now;
      var m = Math.floor(totalSecs / 60);
      var s = totalSecs % 60;
      $scope.expires = ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
    };
  };

  lodash.each(['TxProposalRejectedBy', 'TxProposalAcceptedBy', 'transactionProposalRemoved', 'TxProposalRemoved', 'NewOutgoingTx', 'UpdateTx'], function(eventName) {
    $rootScope.$on(eventName, function() {
      $scope.wallet.getTx($scope.tx.id, function(err, tx) {
        if (err) {
          if (err.message && err.message == 'TX_NOT_FOUND' &&
            (eventName == 'transactionProposalRemoved' || eventName == 'TxProposalRemoved')) {
            $scope.tx.removed = true;
            $scope.tx.canBeRemoved = false;
            $scope.tx.pendingForUs = false;
            $scope.$apply();
          }
          return;
        }

        var action = lodash.find(tx.actions, {
          copayerId: $scope.wallet.credentials.copayerId
        });

        $scope.tx = txFormatService.processTx(tx);

        if (!action && tx.status == 'pending')
          $scope.tx.pendingForUs = true;

        $scope.updateCopayerList();
        $scope.$apply();
      });
    });
  });

  $scope.updateCopayerList = function() {
    lodash.map($scope.copayers, function(cp) {
      lodash.each($scope.tx.actions, function(ac) {
        if (cp.id == ac.copayerId) {
          cp.action = ac.type;
        }
      });
    });
  };

  $scope.close = function() {
    $scope.loading = null;
    $scope.txpDetailsModal.hide();
  };
});

'use strict';

angular.module('copayApp.controllers').controller('txStatusController', function($scope, $timeout, $state, $ionicHistory, $log, addressbookService) {

  if ($scope.cb) $timeout($scope.cb, 100);
  $scope.fromSendTab = $ionicHistory.viewHistory().backView && $ionicHistory.viewHistory().backView.stateName === "tabs.send.amount" ||  "tabs.send";

  $scope.cancel = function() {
    $scope.txStatusModal.hide();
    if ($scope.fromSendTab) {
      $ionicHistory.removeBackView();
      $state.go('tabs.home');
    }
  };

  $scope.save = function(addressbookEntry) {
    $scope.txStatusModal.hide();
    $ionicHistory.nextViewOptions({
      disableAnimate: true,
      disableBack: true
    });
    $ionicHistory.removeBackView();
    $state.go('tabs.send.addressbook', {
      fromSendTab: true,
      addressbookEntry: addressbookEntry
    });
  }

  addressbookService.list(function(err, ab) {
    if (err) $log.error(err);
    if (ab[$scope.tx.toAddress]) {
      $scope.entryExist = true;
      $log.debug('Entry already exist');
    }
  })

});

'use strict';

angular.module('copayApp.controllers').controller('walletsController', function($scope, $timeout, bwcError, profileService) {

  $scope.selectWallet = function(walletId) {

    var client = profileService.getClient(walletId);
    $scope.errorSelectedWallet = {};

    profileService.isReady(client, function(err) {
      if (err) {
        $scope.errorSelectedWallet[walletId] = bwcError.msg(err);
        $timeout(function() {
          $scope.$apply();
        });
        return;
      }

      $scope.$emit('walletSelected', walletId);
    });
  };

  $scope.cancel = function() {
    $scope.walletsModal.hide();
  };

});

'use strict';

angular.module('copayApp.controllers').controller('backupRequestController', function($scope, $state, $stateParams, $ionicPopup, popupService, gettextCatalog) {

  $scope.walletId = $stateParams.walletId;

  $scope.openPopup = function() {

    var title = gettextCatalog.getString('Without a backup, you could lose money.');
    var message = gettextCatalog.getString('If this device is damaged, this app is delted, or you migrate to another device, neither you nor BitPay can recover your funds.');
    var okText = gettextCatalog.getString('I understand');
    var cancelText = gettextCatalog.getString('Go back');
    popupService.showConfirm(title, message, okText, cancelText, function(val) {
      if (val) {
        var title = gettextCatalog.getString('Are you sure you want to skip the backup?');
        var message = gettextCatalog.getString('You can create a backup later from your wallet settings.');
        var okText = gettextCatalog.getString('Yes, skip backup');
        var cancelText = gettextCatalog.getString('Go back');
        popupService.showConfirm(title, message, okText, cancelText, function(val) {
          if (val) {
            $state.go('onboarding.disclaimer');
          }
        });
      }
    });
  }

});

'use strict';

angular.module('copayApp.controllers').controller('backupWarningController', function($scope, $state, $timeout, $stateParams, $ionicPopup, profileService, $ionicModal) {

  $scope.walletId = $stateParams.walletId;
  $scope.openPopup = function() {
    $ionicModal.fromTemplateUrl('views/includes/screenshotWarningModal.html', {
      scope: $scope,
      backdropClickToClose: false,
      hardwareBackButtonClose: false
    }).then(function(modal) {
      $scope.warningModal = modal;
      $scope.warningModal.show();
    });

    $scope.close = function() {
      $scope.warningModal.hide();
      if ($stateParams.from == 'onboarding.backupRequest')
        $state.go('onboarding.backup', {
          walletId: $stateParams.walletId
        });
      else
        $state.go($stateParams.from + '.backup', {
          walletId: $stateParams.walletId
        });
    };
  }

  $scope.goBack = function() {
    $state.go($stateParams.from, {
      walletId: $stateParams.walletId
    });
  };

});

'use strict';

angular.module('copayApp.controllers').controller('collectEmailController', function($scope, $state, $timeout, $stateParams, profileService, configService, walletService, platformInfo) {

  var isCordova = platformInfo.isCordova;
  var isWP = platformInfo.isWP;
  var usePushNotifications = isCordova && !isWP;
  var requiresOptIn = platformInfo.isIOS;

  var wallet = profileService.getWallet($stateParams.walletId);
  var walletId = wallet.credentials.walletId;
  $scope.data = {};
  $scope.data.accept = false;

  $scope.save = function() {
    var opts = {
      emailFor: {}
    };
    opts.emailFor[walletId] = $scope.email;
    walletService.updateRemotePreferences(wallet, {
      email: $scope.email,
    }, function(err) {
      if (err) $log.warn(err);
      configService.set(opts, function(err) {
        if (err) $log.warn(err);
        $scope.goNextView();
      });
    });
  };

  $scope.goNextView = function() {
    if (!usePushNotifications) {
      $state.go('onboarding.backupRequest', {
        walletId: walletId
      });
    }
    else if (requiresOptIn) {
      $state.go('onboarding.notifications', {
        walletId: walletId
      });
    } else {
      profileService.pushNotificationsInit();
      $state.go('onboarding.backupRequest', {
        walletId: walletId
      });
    }
  };

  $scope.confirm = function(emailForm) {
    if (emailForm.$invalid) return;
    $scope.confirmation = true;
    $scope.email = emailForm.email.$modelValue;
  };

  $scope.cancel = function() {
    $scope.confirmation = false;
    $timeout(function() {
      $scope.$digest();
    }, 1);
  };

});

'use strict';

angular.module('copayApp.controllers').controller('disclaimerController', function($scope, $timeout, $state, $log, $ionicModal, profileService, uxLanguage, externalLinkService) {

  $scope.init = function() {
    $scope.lang = uxLanguage.currentLanguage;
    $scope.terms = {};
    $scope.accept1 = $scope.accept2 = $scope.accept3 = false;
    $timeout(function() {
      $scope.$apply();
    }, 1);
  };

  $scope.confirm = function() {
    profileService.setDisclaimerAccepted(function(err) {
      if (err) $log.error(err);
      else {
        $state.go('tabs.home', {
          fromOnboarding: true
        });
      }
    });
  };

  $scope.openExternalLink = function(url, target) {
    externalLinkService.open(url, target);
  };

  $scope.openTermsModal = function() {
    $ionicModal.fromTemplateUrl('views/modals/terms.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.termsModal = modal;
      $scope.termsModal.show();
    });
  };
});

'use strict';

angular.module('copayApp.controllers').controller('notificationsController', function($scope, $state, $stateParams, profileService) {

  $scope.walletId = $stateParams.walletId;
  $scope.allowNotif = function() {
    profileService.pushNotificationsInit();
    $state.go('onboarding.backupRequest', {
      walletId: $scope.walletId
    });
  }

});

'use strict';

angular.module('copayApp.controllers').controller('termsController', function($scope, $log, $state, $window, uxLanguage, profileService, externalLinkService) {
  $scope.lang = uxLanguage.currentLanguage;
  $scope.disclaimerUrl = $window.appConfig.disclaimerUrl;

  $scope.confirm = function() {
    profileService.setDisclaimerAccepted(function(err) {
      if (err) $log.error(err);
      else {
        $state.go('tabs.home', {
          fromOnboarding: true
        });
      }
    });
  };

  $scope.openExternalLink = function(url, target) {
    externalLinkService.open(url, target);
  };

});

'use strict';
angular.module('copayApp.controllers').controller('tourController',
  function($scope, $state, $log, $timeout, ongoingProcess, profileService) {

    var tries = 0;

    $scope.init = function() {
      $scope.data = {
        index: 0
      };

      $scope.options = {
        loop: false,
        effect: 'flip',
        speed: 500,
        spaceBetween: 100
      }
    };

    $scope.createDefaultWallet = function() {
      ongoingProcess.set('creatingWallet', true);
      profileService.createDefaultWallet(function(err, walletClient) {
        if (err) {
          $log.warn(err);

          return $timeout(function() {
            $log.warn('Retrying to create default wallet......');
            if (tries == 3) {
              tries == 0;
              return $scope.createDefaultWallet();
            } else {
              tries += 1;
              return $scope.createDefaultWallet();
            }
          }, 3000);
        };
        ongoingProcess.set('creatingWallet', false);
        var wallet = walletClient;
        $state.go('onboarding.collectEmail', {
          fromOnboarding: true,
          walletId: wallet.credentials.walletId
        });
      });
    };

    $scope.goBack = function() {
      if ($scope.data.index != 0) $scope.slider.slidePrev();
      else $state.go('onboarding.welcome');
    }

    $scope.slideNext = function() {
      if ($scope.data.index != 2) $scope.slider.slideNext();
      else $state.go('onboarding.welcome');
    }

    $scope.$on("$ionicSlides.sliderInitialized", function(event, data) {
      $scope.slider = data.slider;
    });

    $scope.$on("$ionicSlides.slideChangeStart", function(event, data) {
      $scope.data.index = data.slider.activeIndex;
    });

    $scope.$on("$ionicSlides.slideChangeEnd", function(event, data) {});
  });

'use strict';

angular.module('copayApp.controllers').controller('welcomeController', function($scope, $state, $timeout, $log, $ionicPopup, profileService) {

  $scope.goImport = function(code) {
    $state.go('onboarding.import', {
      fromOnboarding: true,
      code: code
    });
  };

  $scope.createProfile = function() {
    $log.debug('Creating profile');
    profileService.createProfile(function(err) {
      if (err) $log.warn(err);
    });
  };

});

angular.module('copayApp.controllers').controller('paperWalletController',
  function($scope, $timeout, $log, $ionicModal, $ionicHistory, popupService, gettextCatalog, platformInfo, configService, profileService, $state, bitcore, ongoingProcess, txFormatService, $stateParams, walletService) {

    $scope.onQrCodeScanned = function(data) {
      $scope.formData.inputData = data;
      $scope.onData(data);
    };

    $scope.onData = function(data) {
      $scope.scannedKey = data;
      $scope.isPkEncrypted = (data.substring(0, 2) == '6P');
    };

    function _scanFunds(cb) {
      function getPrivateKey(scannedKey, isPkEncrypted, passphrase, cb) {
        if (!isPkEncrypted) return cb(null, scannedKey);
        wallet.decryptBIP38PrivateKey(scannedKey, passphrase, null, cb);
      };

      function getBalance(privateKey, cb) {
        wallet.getBalanceFromPrivateKey(privateKey, cb);
      };

      function checkPrivateKey(privateKey) {
        try {
          new bitcore.PrivateKey(privateKey, 'livenet');
        } catch (err) {
          return false;
        }
        return true;
      };

      getPrivateKey($scope.scannedKey, $scope.isPkEncrypted, $scope.passphrase, function(err, privateKey) {
        if (err) return cb(err);
        if (!checkPrivateKey(privateKey)) return cb(new Error('Invalid private key'));

        getBalance(privateKey, function(err, balance) {
          if (err) return cb(err);
          return cb(null, privateKey, balance);
        });
      });
    };

    $scope.scanFunds = function() {
      $scope.privateKey = '';
      $scope.balanceSat = 0;

      ongoingProcess.set('scanning', true);
      $timeout(function() {
        _scanFunds(function(err, privateKey, balance) {
          ongoingProcess.set('scanning', false);
          if (err) {
            $log.error(err);
            popupService.showAlert(gettextCatalog.getString('Error scanning funds:'), err || err.toString());
          } else {
            $scope.privateKey = privateKey;
            $scope.balanceSat = balance;
            var config = configService.getSync().wallet.settings;
            $scope.balance = txFormatService.formatAmount(balance) + ' ' + config.unitName;
            $scope.scanned = true;
          }

          $scope.$apply();
        });
      }, 100);
    };

    function _sweepWallet(cb) {
      walletService.getAddress(wallet, true, function(err, destinationAddress) {
        if (err) return cb(err);

        wallet.buildTxFromPrivateKey($scope.privateKey, destinationAddress, null, function(err, tx) {
          if (err) return cb(err);

          wallet.broadcastRawTx({
            rawTx: tx.serialize(),
            network: 'livenet'
          }, function(err, txid) {
            if (err) return cb(err);
            return cb(null, destinationAddress, txid);
          });
        });
      });
    };

    $scope.sweepWallet = function() {
      ongoingProcess.set('sweepingWallet', true);
      $scope.sending = true;

      $timeout(function() {
        _sweepWallet(function(err, destinationAddress, txid) {
          ongoingProcess.set('sweepingWallet', false);
          $scope.sending = false;
          if (err) {
            $log.error(err);
            popupService.showAlert(gettextCatalog.getString('Error sweeping wallet:'), err || err.toString());
          } else {
            $scope.openStatusModal('broadcasted', function() {
              $ionicHistory.removeBackView();
              $state.go('tabs.home');
            });
          }
          $scope.$apply();
        });
      }, 100);
    };

    $scope.openStatusModal = function(type, cb) {
      $scope.tx = {};
      $scope.tx.amountStr = $scope.balance;
      $scope.type = type;
      $scope.color = wallet.backgroundColor;
      $scope.cb = cb;

      $ionicModal.fromTemplateUrl('views/modals/tx-status.html', {
        scope: $scope
      }).then(function(modal) {
        $scope.txStatusModal = modal;
        $scope.txStatusModal.show();
      });
    };

    $scope.$on("$ionicView.enter", function(event, data) {
      var wallet = profileService.getWallet($stateParams.walletId);
      $scope.wallet = wallet;
      $scope.isCordova = platformInfo.isCordova;
      $scope.needsBackup = wallet.needsBackup;
      $scope.walletAlias = wallet.name;
      $scope.walletName = wallet.credentials.walletName;
      $scope.formData = {};
      $scope.formData.inputData = null;
      $scope.scannedKey = null;
      $scope.balance = null;
      $scope.balanceSat = null;
      $scope.scanned = false;
      $timeout(function() {
        $scope.$apply();
      }, 10);
    });
  });

'use strict';
angular.module('copayApp.controllers').controller('paymentUriController',
  function($rootScope, $scope, $stateParams, $location, $timeout, $ionicHistory, profileService, configService, lodash, bitcore, $state) {
    function strip(number) {
      return (parseFloat(number.toPrecision(12)));
    };

    // Build bitcoinURI with querystring
    this.init = function() {
      var query = [];
      this.bitcoinURI = $stateParams.url;

      var URI = bitcore.URI;
      var isUriValid = URI.isValid(this.bitcoinURI);
      if (!URI.isValid(this.bitcoinURI)) {
        this.error = true;
        return;
      }
      var uri = new URI(this.bitcoinURI);

      if (uri && uri.address) {
        var config = configService.getSync().wallet.settings;
        var unitToSatoshi = config.unitToSatoshi;
        var satToUnit = 1 / unitToSatoshi;
        var unitName = config.unitName;

        if (uri.amount) {
          uri.amount = strip(uri.amount * satToUnit) + ' ' + unitName;
        }
        uri.network = uri.address.network.name;
        this.uri = uri;
      }
    };

    this.getWallets = function(network) {

      $scope.wallets = [];
      lodash.forEach(profileService.getWallets(network), function(w) {
        var client = profileService.getClient(w.id);
        profileService.isReady(client, function(err) {
          if (err) return;
          $scope.wallets.push(w);
        })
      });
    };

    this.selectWallet = function(wid) {
      var self = this;
      profileService.setAndStoreFocus(wid, function() {});
      $ionicHistory.removeBackView();
      $state.go('tabs.home');
      $timeout(function() {
        $rootScope.$emit('paymentUri', self.bitcoinURI);
      }, 1000);
    };
  });

'use strict';

angular.module('copayApp.controllers').controller('preferencesController',
  function($scope, $rootScope, $timeout, $log, $stateParams, $ionicHistory, gettextCatalog, configService, profileService, fingerprintService, walletService) {
    var wallet = profileService.getWallet($stateParams.walletId);
    var walletId = wallet.credentials.walletId;
    $scope.wallet = wallet;

    $scope.encryptChange = function() {
      if (!wallet) return;
      var val = $scope.encryptEnabled.value;

      if (val && !walletService.isEncrypted(wallet)) {
        $log.debug('Encrypting private key for', wallet.name);
        walletService.encrypt(wallet, function(err) {
          if (err) {
            $log.warn(err);

            // ToDo show error?
            $scope.encryptEnabled.value = false;
            return;
          }
          profileService.updateCredentials(JSON.parse(wallet.export()), function() {
            $log.debug('Wallet encrypted');
            return;
          });
        })
      } else if (!val && walletService.isEncrypted(wallet)) {
        walletService.decrypt(wallet, function(err) {
          if (err) {
            $log.warn(err);

            // ToDo show error?
            $scope.encryptEnabled.value = true;
            return;
          }
          profileService.updateCredentials(JSON.parse(wallet.export()), function() {
            $log.debug('Wallet decrypted');
            return;
          });
        })
      }
    };

    $scope.touchIdChange = function() {
      var newStatus = $scope.touchIdEnabled.value;
      walletService.setTouchId(wallet, !!newStatus, function(err) {
        if (err) {
          $scope.touchIdEnabled.value = !newStatus;
          $timeout(function() {
            $scope.$apply();
          }, 1);
          return;
        }
        $log.debug('Touch Id status changed: ' + newStatus);
      });
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      $scope.externalSource = null;

      if (!wallet)
        return $ionicHistory.goBack();

      var config = configService.getSync();

      $scope.encryptEnabled = {
        value: walletService.isEncrypted(wallet)
      };

      if (wallet.isPrivKeyExternal)
        $scope.externalSource = wallet.getPrivKeyExternalSourceName() == 'ledger' ? 'Ledger' : 'Trezor';

      $scope.touchIdAvailable = fingerprintService.isAvailable();
      $scope.touchIdEnabled = {
        value: config.touchIdFor ? config.touchIdFor[walletId] : null
      };

      $scope.deleted = false;
      if (wallet.credentials && !wallet.credentials.mnemonicEncrypted && !wallet.credentials.mnemonic) {
        $scope.deleted = true;
      }
    });
  });

'use strict';

angular.module('copayApp.controllers').controller('preferencesAbout',
  function($scope, $window, gettextCatalog, externalLinkService) {

    $scope.title = gettextCatalog.getString('About') + ' ' + $window.appConfig.nameCase;
    $scope.version = $window.version;
    $scope.commitHash = $window.commitHash;
    $scope.name = $window.appConfig.gitHubRepoName;

    $scope.openExternalLink = function(url, target) {
      externalLinkService.open(url, target);
    };
  });

'use strict';

angular.module('copayApp.controllers').controller('preferencesAdvancedController', function($scope, $timeout, $stateParams, profileService) {
  var wallet = profileService.getWallet($stateParams.walletId);
  $scope.network = wallet.network;

  $timeout(function() {
    $scope.$apply();
  }, 1);
});

'use strict';

angular.module('copayApp.controllers').controller('preferencesAliasController',
  function($scope, $timeout, $stateParams, $ionicHistory, gettextCatalog, configService, profileService, walletService) {
    var wallet = profileService.getWallet($stateParams.walletId);
    var walletId = wallet.credentials.walletId;
    var config = configService.getSync();

    $scope.walletName = wallet.credentials.walletName;
    $scope.alias = {
      value: (config.aliasFor && config.aliasFor[walletId]) || wallet.credentials.walletName
    };

    $scope.save = function() {
      var opts = {
        aliasFor: {}
      };

      opts.aliasFor[walletId] = $scope.alias.value;

      configService.set(opts, function(err) {
        if (err) $log.warn(err);
        $ionicHistory.goBack();
      });
    };
  });

'use strict';

angular.module('copayApp.controllers').controller('preferencesAltCurrencyController',
  function($scope, $log, $timeout, $ionicHistory, gettextCatalog, configService, rateService, lodash, profileService, walletService) {

    var next = 10;
    var completeAlternativeList;

    var config = configService.getSync();
    $scope.currentCurrency = config.wallet.settings.alternativeIsoCode;
    $scope.listComplete = false;

    rateService.whenAvailable(function() {
      completeAlternativeList = rateService.listAlternatives();
      lodash.remove(completeAlternativeList, function(c) {
        return c.isoCode == 'BTC';
      });
      $scope.altCurrencyList = completeAlternativeList.slice(0, next);
    });

    $scope.loadMore = function() {
      $timeout(function() {
        $scope.altCurrencyList = completeAlternativeList.slice(0, next);
        next += 10;
        $scope.listComplete = $scope.altCurrencyList.length >= completeAlternativeList.length;
        $scope.$broadcast('scroll.infiniteScrollComplete');
      }, 100);
    };

    $scope.save = function(newAltCurrency) {
      var opts = {
        wallet: {
          settings: {
            alternativeName: newAltCurrency.name,
            alternativeIsoCode: newAltCurrency.isoCode,
          }
        }
      };

      configService.set(opts, function(err) {
        if (err) $log.warn(err);

        $ionicHistory.goBack();
        walletService.updateRemotePreferences(profileService.getWallets(), {}, function() {
          $log.debug('Remote preferences saved');
        });
      });
    };
  });

'use strict';

angular.module('copayApp.controllers').controller('preferencesBitpayCardController',
  function($scope, $state, $timeout, bitpayCardService, popupService) {

    $scope.logout = function() {
      var title = 'Are you sure you would like to log out of your Bitpay Card account?';
      popupService.showConfirm(title, null, null, null, function(res) {
        if (res) logout();
      });
    };

    var logout = function() {
      bitpayCardService.logout(function() {
        $timeout(function() {
          $state.go('bitpayCard.main');
        }, 100);
      });
    };

  });

'use strict';

angular.module('copayApp.controllers').controller('preferencesBwsUrlController',
  function($scope, $log, $stateParams, configService, applicationService, profileService, storageService) {
    $scope.success = null;

    var wallet = profileService.getWallet($stateParams.walletId);
    var walletId = wallet.credentials.walletId;
    var defaults = configService.getDefaults();
    var config = configService.getSync();

    $scope.bwsurl = {
      value: (config.bwsFor && config.bwsFor[walletId]) || defaults.bws.url
    };

    $scope.resetDefaultUrl = function() {
      $scope.bwsurl.value = defaults.bws.url;
    };

    $scope.save = function() {

      var bws;
      switch ($scope.bwsurl.value) {
        case 'prod':
        case 'production':
          bws = 'https://bws.bitpay.com/bws/api'
          break;
        case 'sta':
        case 'staging':
          bws = 'https://bws-staging.b-pay.net/bws/api'
          break;
        case 'loc':
        case 'local':
          bws = 'http://localhost:3232/bws/api'
          break;
      };
      if (bws) {
        $log.info('Using BWS URL Alias to ' + bws);
        $scope.bwsurl.value = bws;
      }

      var opts = {
        bwsFor: {}
      };
      opts.bwsFor[walletId] = $scope.bwsurl.value;

      configService.set(opts, function(err) {
        if (err) $log.debug(err);
        storageService.setCleanAndScanAddresses(walletId, function() {
          applicationService.restart();
        });
      });
    };
  });

'use strict';

angular.module('copayApp.controllers').controller('preferencesCoinbaseController',
  function($scope, $timeout, $ionicModal, applicationService, coinbaseService) {

    this.revokeToken = function(testnet) {
      $scope.network = testnet ? 'testnet' : 'livenet';

      $ionicModal.fromTemplateUrl('views/modals/coinbase-confirmation.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.coinbaseConfirmationModal = modal;
        $scope.coinbaseConfirmationModal.show();
      });
    };

  });

'use strict';

angular.module('copayApp.controllers').controller('preferencesColorController', function($scope, $log, $stateParams, $ionicHistory, gettextCatalog, configService, profileService) {
      $scope.colorList = [
        {color: "#DD4B39", name: "Cinnabar"},
        {color: "#F38F12", name: "Carrot Orange"},
        {color: "#FAA77F", name: "Light Salmon"},
        {color: "#D0B136", name: "Metallic Gold"},
        {color: "#9EDD72", name: "Feijoa"},
        {color: "#29BB9C", name: "Shamrock"},
        {color: "#019477", name: "Observatory"},
        {color: "#77DADA", name: "Turquoise Blue"},
        {color: "#4A90E2", name: "Cornflower Blue"},
        {color: "#484ED3", name: "Free Speech Blue"},
        {color: "#9B59B6", name: "Deep Lilac"},
        {color: "#E856EF", name: "Free Speech Magenta"},
        {color: "#FF599E", name: "Brilliant Rose"},
        {color: "#7A8C9E", name: "Light Slate Grey"}
      ];

  var wallet = profileService.getWallet($stateParams.walletId);
  $scope.wallet = wallet;
  var walletId = wallet.credentials.walletId;
  var config = configService.getSync();
  config.colorFor = config.colorFor || {};

  $scope.currentColor = config.colorFor[walletId] || '#4A90E2';

  $scope.save = function(color) {
    var opts = {
      colorFor: {}
    };
    opts.colorFor[walletId] = color;

    configService.set(opts, function(err) {
      if (err) $log.warn(err);
      $ionicHistory.goBack();
    });
  };
});

'use strict';

angular.module('copayApp.controllers').controller('preferencesDeleteWalletController',
  function($scope, $stateParams, $ionicHistory, gettextCatalog, lodash, profileService, $state, ongoingProcess, popupService) {
    var wallet = profileService.getWallet($stateParams.walletId);
    $scope.alias = lodash.isEqual(wallet.name, wallet.credentials.walletName) ? null : wallet.name + ' ';
    $scope.walletName = wallet.credentials.walletName;

    $scope.showDeletePopup = function() {
      var title = gettextCatalog.getString('Warning!');
      var message = gettextCatalog.getString('Are you sure you want to delete this wallet?');
      popupService.showConfirm(title, message, null, null, function(res) {
        if (res) deleteWallet();
      });
    };

    function deleteWallet() {
      ongoingProcess.set('deletingWallet', true);
      profileService.deleteWalletClient(wallet, function(err) {
        ongoingProcess.set('deletingWallet', false);
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), err.message || err);
        } else {
          $ionicHistory.removeBackView();
          $state.go('tabs.home');
        }
      });
    };
  });

'use strict';

angular.module('copayApp.controllers').controller('preferencesDeleteWordsController', function($scope, $ionicHistory, $stateParams, gettextCatalog, confirmDialog, lodash, profileService, gettext) {
  var wallet = profileService.getWallet($stateParams.walletId);
  var msg = gettext('Are you sure you want to delete the recovery phrase?');
  var successMsg = gettext('Recovery phrase deleted');
  $scope.needsBackup = wallet.needsBackup;

  if (lodash.isEmpty(wallet.credentials.mnemonic) && lodash.isEmpty(wallet.credentials.mnemonicEncrypted))
    $scope.deleted = true;

  $scope.delete = function() {
    confirmDialog.show(msg, function(ok) {
      if (ok) {
        wallet.clearMnemonic();
        profileService.updateCredentials(JSON.parse(wallet.export()), function() {
          $ionicHistory.goBack();
        });
      }
    });
  };
});

'use strict';

angular.module('copayApp.controllers').controller('preferencesEmailController', function($scope, $ionicHistory, $stateParams, gettextCatalog, profileService, walletService, configService) {

  var wallet = profileService.getWallet($stateParams.walletId);
  var walletId = wallet.credentials.walletId;

  var config = configService.getSync();
  config.emailFor = config.emailFor || {};
  $scope.email = {
    value: config.emailFor && config.emailFor[walletId]
  };

  $scope.save = function() {
    var opts = {
      emailFor: {}
    };
    opts.emailFor[walletId] = $scope.email.value;

    walletService.updateRemotePreferences(wallet, {
      email: $scope.email.value,
    }, function(err) {
      if (err) $log.warn(err);
      configService.set(opts, function(err) {
        if (err) $log.warn(err);
        $ionicHistory.goBack();
      });
    });
  };
});

'use strict';

angular.module('copayApp.controllers').controller('preferencesFeeController', function($scope, $timeout, $ionicHistory, gettextCatalog, configService, feeService, ongoingProcess) {

  ongoingProcess.set('gettingFeeLevels', true);
  feeService.getFeeLevels(function(levels) {
    ongoingProcess.set('gettingFeeLevels', false);
    $scope.feeLevels = levels;
    $scope.$apply();
  });

  $scope.save = function(newFee) {
    var opts = {
      wallet: {
        settings: {
          feeLevel: newFee.level
        }
      }
    };

    configService.set(opts, function(err) {
      if (err) $log.debug(err);
      $scope.currentFeeLevel = newFee.level;
      $ionicHistory.goBack();
      $timeout(function() {
        $scope.$apply();
      }, 100);
    });
  };

  $scope.$on("$ionicView.enter", function(event, data){
    $scope.feeOpts = feeService.feeOpts;
    $scope.currentFeeLevel = feeService.getCurrentFeeLevel();
  });
});

'use strict';

angular.module('copayApp.controllers').controller('preferencesGlideraController',
  function($scope, $log, $timeout, $state, ongoingProcess, glideraService, popupService, gettextCatalog) {

    $scope.update = function(opts) {
      if (!$scope.token || !$scope.permissions) return;
      $log.debug('Updating Glidera Account...');
      var accessToken = $scope.token;
      var permissions = $scope.permissions;

      opts = opts || {};

      glideraService.getStatus(accessToken, function(err, data) {
        $scope.status = data;
      });

      glideraService.getLimits(accessToken, function(err, limits) {
        $scope.limits = limits;
      });

      if (permissions.transaction_history) {
        glideraService.getTransactions(accessToken, function(err, data) {
          $scope.txs = data;
        });
      }

      if (permissions.view_email_address && opts.fullUpdate) {
        glideraService.getEmail(accessToken, function(err, data) {
          $scope.email = data;
        });
      }
      if (permissions.personal_info && opts.fullUpdate) {
        glideraService.getPersonalInfo(accessToken, function(err, data) {
          $scope.personalInfo = data;
        });
      }
    };

    $scope.revokeToken = function() {
      popupService.showConfirm('Glidera', 'Are you sure you would like to log out of your Glidera account?', null, null, function(res) {
        if (res) {
          glideraService.removeToken(function() {
            $timeout(function() {
              $state.go('tabs.buyandsell.glidera');
            }, 100);
          });
        }
      });
    };

    $scope.$on("$ionicView.enter", function(event, data){
      $scope.network = glideraService.getEnvironment();

      $scope.token = accessToken;
      $scope.permissions = null;
      $scope.email = null;
      $scope.personalInfo = null;
      $scope.txs = null;
      $scope.status = null;
      $scope.limits = null;

      ongoingProcess.set('connectingGlidera', true);
      glideraService.init($scope.token, function(err, glidera) {
        ongoingProcess.set('connectingGlidera');
        if (err || !glidera) {
          if (err) popupService.showAlert(gettextCatalog.getString('Error'), err);
          return;
        }
        $scope.token = glidera.token;
        $scope.permissions = glidera.permissions;
        $scope.update({
          fullUpdate: true
        });
      });
    });

  });

'use strict';

angular.module('copayApp.controllers').controller('preferencesHistory',
  function($scope, $log, $stateParams, $timeout, $state, $ionicHistory, gettextCatalog, storageService, platformInfo, profileService, lodash) {
    $scope.wallet = profileService.getWallet($stateParams.walletId);
    $scope.csvReady = false;
    $scope.isCordova = platformInfo.isCordova;

    $scope.csvHistory = function(cb) {
      var allTxs = [];

      function getHistory(cb) {
        storageService.getTxHistory($scope.wallet.id, function(err, txs) {
          if (err) return cb(err);

          var txsFromLocal = [];
          try {
            txsFromLocal = JSON.parse(txs);
          } catch (ex) {
            $log.warn(ex);
          }

          allTxs.push(txsFromLocal);
          return cb(null, lodash.compact(lodash.flatten(allTxs)));
        });
      };

      $log.debug('Generating CSV from History');
      getHistory(function(err, txs) {
        if (err || lodash.isEmpty(txs)) {
          if (err) $log.warn('Failed to generate CSV:', err);
          else $log.warn('Failed to generate CSV: no transactions');
          if (cb) return cb(err);
          return;
        }
        $log.debug('Wallet Transaction History Length:', txs.length);

        $scope.satToUnit = 1 / $scope.unitToSatoshi;
        var data = txs;
        var satToBtc = 1 / 100000000;
        $scope.csvContent = [];
        $scope.csvFilename = 'Copay-' + $scope.wallet.name + '.csv';
        $scope.csvHeader = ['Date', 'Destination', 'Description', 'Amount', 'Currency', 'Txid', 'Creator', 'Copayers', 'Comment'];

        var _amount, _note, _copayers, _creator, _comment;
        data.forEach(function(it, index) {
          var amount = it.amount;

          if (it.action == 'moved')
            amount = 0;

          _copayers = '';
          _creator = '';

          if (it.actions && it.actions.length > 1) {
            for (var i = 0; i < it.actions.length; i++) {
              _copayers += it.actions[i].copayerName + ':' + it.actions[i].type + ' - ';
            }
            _creator = (it.creatorName && it.creatorName != 'undefined') ? it.creatorName : '';
          }
          _amount = (it.action == 'sent' ? '-' : '') + (amount * satToBtc).toFixed(8);
          _note = it.message || '';
          _comment = it.note ? it.note.body : '';

          if (it.action == 'moved')
            _note += ' Moved:' + (it.amount * satToBtc).toFixed(8)

          $scope.csvContent.push({
            'Date': formatDate(it.time * 1000),
            'Destination': it.addressTo || '',
            'Description': _note,
            'Amount': _amount,
            'Currency': 'BTC',
            'Txid': it.txid,
            'Creator': _creator,
            'Copayers': _copayers,
            'Comment': _comment
          });

          if (it.fees && (it.action == 'moved' || it.action == 'sent')) {
            var _fee = (it.fees * satToBtc).toFixed(8)
            $scope.csvContent.push({
              'Date': formatDate(it.time * 1000),
              'Destination': 'Bitcoin Network Fees',
              'Description': '',
              'Amount': '-' + _fee,
              'Currency': 'BTC',
              'Txid': '',
              'Creator': '',
              'Copayers': ''
            });
          }
        });

        $scope.csvReady = true;
        $timeout(function() {
          $scope.$apply();
        }, 100);

        if (cb)
          return cb();
        return;
      });

      function formatDate(date) {
        var dateObj = new Date(date);
        if (!dateObj) {
          $log.debug('Error formating a date');
          return 'DateError'
        }
        if (!dateObj.toJSON()) {
          return '';
        }

        return dateObj.toJSON();
      };
    };

    $scope.clearTransactionHistory = function() {
      storageService.removeTxHistory($scope.wallet.id, function(err) {
        if (err) {
          $log.error(err);
          return;
        }
        $scope.$emit('Local/ClearHistory');

        $timeout(function() {
          $ionicHistory.removeBackView();
          $state.go('tabs.home');
        }, 100);
      });
    };

    $scope.$on("$ionicView.enter", function(event, data) {
      $scope.csvHistory();
    });
  });

'use strict';

angular.module('copayApp.controllers').controller('preferencesInformation',
  function($scope, $log, $timeout, $ionicHistory, $ionicScrollDelegate, platformInfo, gettextCatalog, lodash, profileService, configService, $stateParams, walletService, $state) {
    var base = 'xpub';
    var wallet = profileService.getWallet($stateParams.walletId);
    var walletId = wallet.id;

    var config = configService.getSync();
    var b = 1;
    $scope.isCordova = platformInfo.isCordova;
    config.colorFor = config.colorFor || {};

    $scope.sendAddrs = function() {
      function formatDate(ts) {
        var dateObj = new Date(ts * 1000);
        if (!dateObj) {
          $log.debug('Error formating a date');
          return 'DateError';
        }
        if (!dateObj.toJSON()) {
          return '';
        }
        return dateObj.toJSON();
      };

      $timeout(function() {
        wallet.getMainAddresses({
          doNotVerify: true
        }, function(err, addrs) {
          if (err) {
            $log.warn(err);
            return;
          };

          var body = 'Copay Wallet "' + $scope.walletName + '" Addresses\n  Only Main Addresses are  shown.\n\n';
          body += "\n";
          body += addrs.map(function(v) {
            return ('* ' + v.address + ' ' + base + v.path.substring(1) + ' ' + formatDate(v.createdOn));
          }).join("\n");

          window.plugins.socialsharing.shareViaEmail(
            body,
            'Copay Addresses',
            null, // TO: must be null or an array
            null, // CC: must be null or an array
            null, // BCC: must be null or an array
            null, // FILES: can be null, a string, or an array
            function() {},
            function() {}
          );

          $timeout(function() {
            $scope.$apply();
          }, 1000);
        });
      }, 100);
    };

    $scope.saveBlack = function() {
      function save(color) {
        var opts = {
          colorFor: {}
        };
        opts.colorFor[walletId] = color;

        configService.set(opts, function(err) {
          $ionicHistory.removeBackView();
          $state.go('tabs.home');
          if (err) $log.warn(err);
        });
      };

      if (b != 5) return b++;
      save('#202020');
    };

    $scope.scan = function() {
      walletService.startScan(wallet);
      $ionicHistory.removeBackView();
      $state.go('tabs.home');
    };

    $scope.$on("$ionicView.enter", function(event, data) {
      var c = wallet.credentials;
      var basePath = c.getBaseAddressDerivationPath();

      $scope.wallet = wallet;
      $scope.walletName = c.walletName;
      $scope.walletId = c.walletId;
      $scope.network = c.network;
      $scope.addressType = c.addressType || 'P2SH';
      $scope.derivationStrategy = c.derivationStrategy || 'BIP45';
      $scope.basePath = basePath;
      $scope.M = c.m;
      $scope.N = c.n;
      $scope.pubKeys = lodash.pluck(c.publicKeyRing, 'xPubKey');
      $scope.addrs = null;

      wallet.getMainAddresses({
        doNotVerify: true
      }, function(err, addrs) {
        if (err) {
          $log.warn(err);
          return;
        };
        var last10 = [],
          i = 0,
          e = addrs.pop();
        while (i++ < 10 && e) {
          e.path = base + e.path.substring(1);
          last10.push(e);
          e = addrs.pop();
        }
        $scope.addrs = last10;
        $timeout(function() {
          $scope.$apply();
        });
        $ionicScrollDelegate.resize();
      });
    });

  });

'use strict';

angular.module('copayApp.controllers').controller('preferencesLanguageController',
  function($scope, $log, $ionicHistory, gettextCatalog, configService, profileService, uxLanguage, walletService, externalLinkService) {

    $scope.availableLanguages = uxLanguage.getLanguages();

    $scope.openExternalLink = function(url, target) {
      externalLinkService.open(url, target);
    };

    $scope.save = function(newLang) {
      var opts = {
        wallet: {
          settings: {
            defaultLanguage: newLang
          }
        }
      };

      configService.set(opts, function(err) {
        if (err) $log.warn(err);

        $ionicHistory.goBack();
        uxLanguage.init(function() {
          walletService.updateRemotePreferences(profileService.getWallets(), {}, function() {
            $log.debug('Remote preferences saved');
          });
        });
      });
    };

    $scope.$on("$ionicView.enter", function(event, data){
      $scope.currentLanguage = uxLanguage.getCurrentLanguage();
    });
  });

'use strict';

angular.module('copayApp.controllers').controller('preferencesLogs',
  function($scope, historicLog, gettextCatalog) {

    $scope.$on("$ionicView.enter", function(event, data) {
      $scope.logs = historicLog.get();

      $scope.prepare = function() {
        var log = 'Copay Session Logs\n Be careful, this could contain sensitive private data\n\n';
        log += '\n\n';
        log += $scope.logs.map(function(v) {
          return v.msg;
        }).join('\n');

        return log;
      };

      $scope.sendLogs = function() {
        var body = $scope.prepare();

        window.plugins.socialsharing.shareViaEmail(
          body,
          'Copay Logs',
          null, // TO: must be null or an array
          null, // CC: must be null or an array
          null, // BCC: must be null or an array
          null, // FILES: can be null, a string, or an array
          function() {},
          function() {}
        );
      };

    });
  });

'use strict';

angular.module('copayApp.controllers').controller('preferencesUnitController', function($scope, $log, configService, $ionicHistory, gettextCatalog, walletService, profileService) {

  var config = configService.getSync();
  $scope.unitList = [{
    name: 'bits (1,000,000 bits = 1BTC)',
    shortName: 'bits',
    value: 100,
    decimals: 2,
    code: 'bit',
  }, {
    name: 'BTC',
    shortName: 'BTC',
    value: 100000000,
    decimals: 8,
    code: 'btc',
  }];

  $scope.save = function(newUnit) {
    var opts = {
      wallet: {
        settings: {
          unitName: newUnit.shortName,
          unitToSatoshi: newUnit.value,
          unitDecimals: newUnit.decimals,
          unitCode: newUnit.code,
        }
      }
    };

    configService.set(opts, function(err) {
      if (err) $log.warn(err);

      $ionicHistory.goBack();
      walletService.updateRemotePreferences(profileService.getWallets(), {}, function() {
        $log.debug('Remote preferences saved');
      });
    });
  };

  $scope.$on("$ionicView.enter", function(event, data){
    $scope.currentUnit = config.wallet.settings.unitCode;
  });
});


'use strict';

angular.module('copayApp.controllers').controller('proposalsController',
  function($timeout, $scope, profileService, $log, txpModalService) {

    $scope.fetchingProposals = true;

    $scope.$on("$ionicView.enter", function(event, data){
      profileService.getTxps(50, function(err, txps) {
        $scope.fetchingProposals = false;
        if (err) {
          $log.error(err);
          return;
        }
        $scope.txps = txps;
        $timeout(function() {
          $scope.$apply();
        }, 1);
      });
    });

    $scope.openTxpModal = txpModalService.open;
  });

'use strict';

angular.module('copayApp.controllers').controller('sellCoinbaseController',
  function($rootScope, $scope, $log, $timeout, $ionicModal, lodash, profileService, coinbaseService, configService, walletService, fingerprintService, ongoingProcess, go) {

    var self = this;
    var client;

    $scope.priceSensitivity = [
      {
        value: 0.5,
        name: '0.5%'
      },
      {
        value: 1,
        name: '1%'
      },
      {
        value: 2,
        name: '2%'
      },
      {
        value: 5,
        name: '5%'
      },
      {
        value: 10,
        name: '10%'
      }
    ];
    $scope.selectedPriceSensitivity = $scope.priceSensitivity[1];

    this.init = function(testnet) {
      self.allWallets = profileService.getWallets(testnet ? 'testnet' : 'livenet', 1);

      client = profileService.focusedClient;
      if (client && client.credentials.m == 1) {
        $timeout(function() {
          self.selectedWalletId = client.credentials.walletId;
          self.selectedWalletName = client.credentials.walletName;
          $scope.$apply();
        }, 100);
      }
    };

    this.getPaymentMethods = function(token) {
      coinbaseService.getPaymentMethods(token, function(err, p) {
        if (err) {
          self.error = err;
          return;
        }
        self.paymentMethods = [];
        lodash.each(p.data, function(pm) {
          if (pm.allow_sell) {
            self.paymentMethods.push(pm);
          }
          if (pm.allow_sell && pm.primary_sell) {
            $scope.selectedPaymentMethod = pm;
          }
        });
      });
    };

    this.getPrice = function(token) {
      var currency = 'USD';
      coinbaseService.sellPrice(token, currency, function(err, s) {
        if (err) return;
        self.sellPrice = s.data || null;
      });
    };

    $scope.openWalletsModal = function(wallets) {
      self.error = null;

      $scope.type = 'SELL';
      $scope.wallets = wallets;
      $scope.noColor = true;
      $scope.self = self;

      $ionicModal.fromTemplateUrl('views/modals/wallets.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.walletsModal = modal;
        $scope.walletsModal.show();
      });

      $scope.$on('walletSelected', function(ev, walletId) {
        $timeout(function() {
          client = profileService.getClient(walletId);
          self.selectedWalletId = walletId;
          self.selectedWalletName = client.credentials.walletName;
          $scope.$apply();
        }, 100);
        $scope.walletsModal.hide();
      });
    };

    this.depositFunds = function(token, account) {
      self.error = null;
      if ($scope.amount) {
        this.createTx(token, account, $scope.amount)
      } else if ($scope.fiat) {
        var btcValue = ($scope.fiat / self.sellPrice.amount).toFixed(8);
        this.createTx(token, account, btcValue);
      }
    };

    this.sellRequest = function(token, account, ctx) {
      self.error = null;
      if (!ctx.amount) return;
      var accountId = account.id;
      var data = ctx.amount;
      data['payment_method'] = $scope.selectedPaymentMethod.id || null;
      ongoingProcess.set('Sending request...', true);
      coinbaseService.sellRequest(token, accountId, data, function(err, sell) {
        ongoingProcess.set('Sending request...', false);
        if (err) {
          self.error = err;
          return;
        }
        self.sellInfo = sell.data;
      });
    };

    this.confirmSell = function(token, account, sell) {
      self.error = null;
      var accountId = account.id;
      var sellId = sell.id;
      ongoingProcess.set('Selling Bitcoin...', true);
      coinbaseService.sellCommit(token, accountId, sellId, function(err, data) {
        ongoingProcess.set('Selling Bitcoin...', false);
        if (err) {
          self.error = err;
          return;
        }
        self.success = data.data;
        $scope.$emit('Local/CoinbaseTx');
      });
    };

    this.createTx = function(token, account, amount) {
      self.error = null;

      if (!client) {
        self.error = 'No wallet selected';
        return;
      }

      var accountId = account.id;
      var dataSrc = {
        name: 'Received from Copay: ' + self.selectedWalletName
      };
      var outputs = [];
      var config = configService.getSync();
      var configWallet = config.wallet;
      var walletSettings = configWallet.settings;


      ongoingProcess.set('Creating Transaction...', true);
      $timeout(function() {

        coinbaseService.createAddress(token, accountId, dataSrc, function(err, data) {
          if (err) {
            ongoingProcess.set('Creating Transaction...', false);
            self.error = err;
            return;
          }

          var address, comment;

          address = data.data.address;
          amount = parseInt((amount * 100000000).toFixed(0));
          comment = 'Send funds to Coinbase Account: ' + account.name;

          outputs.push({
            'toAddress': address,
            'amount': amount,
            'message': comment
          });

          var txp = {
            toAddress: address,
            amount: amount,
            outputs: outputs,
            message: comment,
            payProUrl: null,
            excludeUnconfirmedUtxos: configWallet.spendUnconfirmed ? false : true,
            feeLevel: walletSettings.feeLevel || 'normal'
          };

          walletService.createTx(client, txp, function(err, createdTxp) {
            if (err) {
              $log.debug(err);
              ongoingProcess.set('Creating Transaction...', false);
              self.error = {
                errors: [{
                  message: 'Could not create transaction: ' + err.message
                }]
              };
              $scope.$apply();
              return;
            }
            ongoingProcess.set('Creating Transaction...', false);
            $scope.$emit('Local/NeedsConfirmation', createdTxp, function(accept) {
              if (accept) {
                self.confirmTx(createdTxp, function(err, tx) {
                  ongoingProcess.clear();
                  if (err) {
                    self.error = {
                      errors: [{
                        message: 'Could not create transaction: ' + err.message
                      }]
                    };
                    return;
                  }
                  ongoingProcess.set('Checking Transaction...', false);
                  coinbaseService.getTransactions(token, accountId, function(err, ctxs) {
                    if (err) {
                      $log.debug(err);
                      return;
                    }
                    lodash.each(ctxs.data, function(ctx) {
                      if (ctx.type == 'send' && ctx.from) {
                        ongoingProcess.clear();
                        if (ctx.status == 'completed') {
                          self.sellRequest(token, account, ctx);
                        } else {
                          // Save to localstorage
                          ctx['price_sensitivity'] = $scope.selectedPriceSensitivity;
                          ctx['sell_price_amount'] = self.sellPrice ? self.sellPrice.amount : '';
                          ctx['sell_price_currency'] = self.sellPrice ? self.sellPrice.currency : 'USD';
                          ctx['description'] = 'Copay Wallet: ' + client.credentials.walletName;
                          coinbaseService.savePendingTransaction(ctx, null, function(err) {
                            if (err) $log.debug(err);
                            self.sendInfo = ctx;
                            $timeout(function() {
                              $scope.$emit('Local/CoinbaseTx');
                            }, 1000);
                          });
                        }
                        return false;
                      }
                    });
                  });
                });
              } else {
                go.path('coinbase');
              }
            });
          });
        });
      }, 100);
    };

    this.confirmTx = function(txp, cb) {

      // TODO see walletService createAndPublish
    };

  });

'use strict';

angular.module('copayApp.controllers').controller('sellGlideraController',
  function($scope, $timeout, $log, profileService, glideraService, bwcError, lodash, walletService, configService, ongoingProcess, popupService, gettextCatalog) {

    var self = this;
    this.data = {};
    this.show2faCodeInput = null;
    this.success = null;
    var wallet;
    $scope.network = glideraService.getEnvironment();

    $scope.$on('Wallet/Changed', function(event, w) {
      if (lodash.isEmpty(w)) {
        $log.debug('No wallet provided');
        return;
      }
      wallet = w;
      $log.debug('Wallet changed: ' + w.name);
    });

    $scope.update = function(opts) {
      if (!$scope.token || !$scope.permissions) return;
      $log.debug('Updating Glidera Account...');
      var accessToken = $scope.token;
      var permissions = $scope.permissions;

      opts = opts || {};

      glideraService.getStatus(accessToken, function(err, data) {
        $scope.status = data;
      });

      glideraService.getLimits(accessToken, function(err, limits) {
        $scope.limits = limits;
      });

      if (permissions.transaction_history) {
        glideraService.getTransactions(accessToken, function(err, data) {
          $scope.txs = data;
        });
      }

      if (permissions.view_email_address && opts.fullUpdate) {
        glideraService.getEmail(accessToken, function(err, data) {
          $scope.email = data.email;
        });
      }
      if (permissions.personal_info && opts.fullUpdate) {
        glideraService.getPersonalInfo(accessToken, function(err, data) {
          $scope.personalInfo = data;
        });
      }
    };

    this.getSellPrice = function(token, price) {
      var self = this;
      if (!price || (price && !price.qty && !price.fiat)) {
        self.sellPrice = null;
        return;
      }
      self.gettingSellPrice = true;
      glideraService.sellPrice(token, price, function(err, sellPrice) {
        self.gettingSellPrice = false;
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Could not get exchange information. Please, try again'));
          return;
        }
        self.sellPrice = sellPrice;
      });
    };

    this.get2faCode = function(token) {
      var self = this;
      ongoingProcess.set('Sending 2FA code...', true);
      $timeout(function() {
        glideraService.get2faCode(token, function(err, sent) {
          ongoingProcess.set('Sending 2FA code...', false);
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Could not send confirmation code to your phone'));
          } else {
            self.show2faCodeInput = sent;
          }
        });
      }, 100);
    };

    this.createTx = function(token, permissions, twoFaCode) {
      var self = this;
      var outputs = [];
      var config = configService.getSync();
      var configWallet = config.wallet;
      var walletSettings = configWallet.settings;

      if (!wallet) {
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('No wallet selected'));
        return;
      }

      ongoingProcess.set('creatingTx', true);
      walletService.getAddress(wallet, null, function(err, refundAddress) {
        if (!refundAddress) {
          ongoingProcess.clear();
          popupService.showAlert(gettextCatalog.getString('Error'), bwcError.msg(err, 'Could not create address'));
          return;
        }
        glideraService.getSellAddress(token, function(err, sellAddress) {
          if (!sellAddress || err) {
            ongoingProcess.clear();
            popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Could not get the destination bitcoin address'));
            return;
          }
          var amount = parseInt((self.sellPrice.qty * 100000000).toFixed(0));
          var comment = 'Glidera transaction';

          outputs.push({
            'toAddress': sellAddress,
            'amount': amount,
            'message': comment
          });

          var txp = {
            toAddress: sellAddress,
            amount: amount,
            outputs: outputs,
            message: comment,
            payProUrl: null,
            excludeUnconfirmedUtxos: configWallet.spendUnconfirmed ? false : true,
            feeLevel: walletSettings.feeLevel || 'normal',
            customData: {
              'glideraToken': token
            }
          };

          walletService.createTx(wallet, txp, function(err, createdTxp) {
            ongoingProcess.clear();
            if (err) {
              popupService.showAlert(gettextCatalog.getString('Error'), err.message || bwcError.msg(err));
              return;
            }
            walletService.prepare(wallet, function(err, password) {
              if (err) {
                ongoingProcess.clear();
                popupService.showAlert(gettextCatalog.getString('Error'), err.message || bwcError.msg(err));
                return;
              }
              ongoingProcess.set('signingTx', true);
              walletService.publishTx(wallet, createdTxp, function(err, publishedTxp) {
                if (err) {
                  ongoingProcess.clear();
                  popupService.showAlert(gettextCatalog.getString('Error'), err.message || bwcError.msg(err));
                  return;
                }

                walletService.signTx(wallet, publishedTxp, password, function(err, signedTxp) {
                  if (err) {
                    ongoingProcess.clear();
                    popupService.showAlert(gettextCatalog.getString('Error'), err.message || bwcError.msg(err));
                    walletService.removeTx(wallet, signedTxp, function(err) {
                      if (err) $log.debug(err);
                    });
                    return;
                  }
                  var rawTx = signedTxp.raw;
                  var data = {
                    refundAddress: refundAddress,
                    signedTransaction: rawTx,
                    priceUuid: self.sellPrice.priceUuid,
                    useCurrentPrice: self.sellPrice.priceUuid ? false : true,
                    ip: null
                  };
                  ongoingProcess.set('Selling Bitcoin', true);
                  glideraService.sell(token, twoFaCode, data, function(err, data) {
                    ongoingProcess.clear();
                    if (err) {
                      popupService.showAlert(gettextCatalog.getString('Error'), err.message || bwcError.msg(err));
                      return;
                    }
                    self.success = data;
                    $timeout(function() {
                      $scope.$digest();
                    });
                  });
                });
              });
            });
          });
        });
      });
    };

    $scope.$on("$ionicView.enter", function(event, data){
      $scope.token = null;
      $scope.permissions = null;
      $scope.email = null;
      $scope.personalInfo = null;
      $scope.txs = null;
      $scope.status = null;
      $scope.limits = null;

      ongoingProcess.set('connectingGlidera', true);
      glideraService.init($scope.token, function(err, glidera) {
        ongoingProcess.set('connectingGlidera');
        if (err || !glidera) {
          if (err) popupService.showAlert(gettextCatalog.getString('Error'), err);
          return;
        }
        $scope.token = glidera.token;
        $scope.permissions = glidera.permissions;
        $scope.update({fullUpdate: true});
      });

      $scope.wallets = profileService.getWallets({
        network: $scope.network,
        n: 1,
        onlyComplete: true
      });
    });
  });

'use strict';

angular.module('copayApp.controllers').controller('tabHomeController',
  function($rootScope, $timeout, $scope, $state, $stateParams, $ionicModal, $ionicScrollDelegate, gettextCatalog, lodash, popupService, ongoingProcess, profileService, walletService, configService, $log, platformInfo, storageService, txpModalService, $window) {
    var wallet;
    $scope.externalServices = {};
    $scope.bitpayCardEnabled = true; // TODO
    $scope.openTxpModal = txpModalService.open;
    $scope.version = $window.version;
    $scope.name = $window.appConfig.nameCase;
    $scope.homeTip = $stateParams.fromOnboarding;

    $scope.openNotificationModal = function(n) {
      wallet = profileService.getWallet(n.walletId);

      if (n.txid) {
        openTxModal(n);
      } else {
        var txp = lodash.find($scope.txps, {
          id: n.txpId
        });
        if (txp) {
          txpModalService.open(txp);
        } else {
          ongoingProcess.set('loadingTxInfo', true);
          walletService.getTxp(wallet, n.txpId, function(err, txp) {
            var _txp = txp;
            ongoingProcess.set('loadingTxInfo', false);
            if (err) {
              $log.warn('No txp found');
              return popupService.showAlert(null, gettextCatalog.getString('Transaction not found'));
            }
            txpModalService.open(_txp);
          });
        }
      }
    };

    var openTxModal = function(n) {
      wallet = profileService.getWallet(n.walletId);

      ongoingProcess.set('loadingTxInfo', true);
      walletService.getTx(wallet, n.txid, function(err, tx) {
        ongoingProcess.set('loadingTxInfo', false);

        if (err) {
          $log.error(err);
          return popupService.showAlert(gettextCatalog.getString('Error'), err);
        }

        if (!tx) {
          $log.warn('No tx found');
          return popupService.showAlert(null, gettextCatalog.getString('Transaction not found'));
        }

        $scope.wallet = wallet;
        $scope.btx = lodash.cloneDeep(tx);
        $ionicModal.fromTemplateUrl('views/modals/tx-details.html', {
          scope: $scope
        }).then(function(modal) {
          $scope.txDetailsModal = modal;
          $scope.txDetailsModal.show();
        });

        walletService.getTxNote(wallet, n.txid, function(err, note) {
          if (err) $log.debug(gettextCatalog.getString('Could not fetch transaction note'));
          $scope.btx.note = note;
        });
      });
    };

    $scope.openWallet = function(wallet) {
      if (!wallet.isComplete()) {
        return $state.go('tabs.copayers', {
          walletId: wallet.credentials.walletId
        });
      }

      $state.go('tabs.details', {
        walletId: wallet.credentials.walletId
      });
    };

    function updateTxps() {
      profileService.getTxps({
        limit: 3
      }, function(err, txps, n) {
        if (err) $log.error(err);
        $scope.txps = txps;
        $scope.txpsN = n;
        $ionicScrollDelegate.resize();

        $timeout(function() {
          $scope.$apply();
        }, 1);
      })
    };

    $scope.updateAllWallets = function() {
      $scope.wallets = profileService.getWallets();
      if (lodash.isEmpty($scope.wallets)) return;

      var i = $scope.wallets.length;
      var j = 0;
      var timeSpan = 60 * 60 * 24 * 7;
      var notifications = [];

      lodash.each($scope.wallets, function(wallet) {
        walletService.getStatus(wallet, {}, function(err, status) {
          if (err) {
            $log.error(err);
          } else {
            wallet.status = status;
          }
          if (++j == i) {
            updateTxps();
          }
        });
      });

      $scope.fetchingNotifications = true;
      profileService.getNotifications({
        limit: 3
      }, function(err, n) {
        if (err) {
          console.log('[tab-home.js.35:err:]', $log.error(err)); //TODO
          return;
        }
        $scope.fetchingNotifications = false;
        $scope.notifications = n;
        $ionicScrollDelegate.resize();

        $timeout(function() {
          $scope.$apply();
        }, 1);

      })
    };

    $scope.updateWallet = function(wallet) {
      $log.debug('Updating wallet:' + wallet.name)
      walletService.getStatus(wallet, {}, function(err, status) {
        if (err) {
          $log.error(err); //TODO
          return;
        }
        wallet.status = status;

        $scope.fetchingNotifications = true;
        profileService.getNotifications({
          limit: 3
        }, function(err, notifications) {
          $scope.fetchingNotifications = false;
          if (err) {
            console.log('[tab-home.js.35:err:]', $log.error(err)); //TODO
            return;
          }
          $scope.notifications = notifications;

          updateTxps();
        })
      });
    };

    $scope.hideHomeTip = function() {
      $scope.homeTip = null;
      $state.transitionTo($state.current, null, {
        reload: true,
        inherit: false,
        notify: false
      });
    };

    $scope.nextStep = function() {
      lodash.each(['AmazonGiftCards', 'BitpayCard', 'BuyAndSell'], function(service) {
        storageService.getNextStep(service, function(err, value) {
          $scope.externalServices[service] = value ? true : false;
          $ionicScrollDelegate.resize();
        });
      });
    };

    $scope.shouldHideNextSteps = function() {
      $scope.hideNextSteps = !$scope.hideNextSteps;
      $ionicScrollDelegate.resize();
    };

    var listeners = [
      $rootScope.$on('bwsEvent', function(e, walletId, type, n) {
        var wallet = profileService.getWallet(walletId);
        $scope.updateWallet(wallet);
      }),
      $rootScope.$on('Local/TxAction', function(e, walletId) {
        $log.debug('Got action for wallet ' + walletId);
        var wallet = profileService.getWallet(walletId);
        $scope.updateWallet(wallet);
      }),
    ];

    $scope.$on('$destroy', function() {
      lodash.each(listeners, function(x) {
        x();
      });
    });

    $scope.$on("$ionicView.enter", function(event, data) {
      configService.whenAvailable(function() {
        var config = configService.getSync();
        var isWindowsPhoneApp = platformInfo.isWP && platformInfo.isCordova;
        $scope.glideraEnabled = config.glidera.enabled && !isWindowsPhoneApp;
        $scope.coinbaseEnabled = config.coinbase.enabled && !isWindowsPhoneApp;
      });
      $scope.nextStep();
      $scope.updateAllWallets();
    });
  });

'use strict';

angular.module('copayApp.controllers').controller('tabReceiveController', function($scope, $timeout, $log, $ionicModal, $state, $ionicHistory, storageService, platformInfo, walletService, profileService, configService, lodash, gettextCatalog, popupService) {

  $scope.isCordova = platformInfo.isCordova;
  $scope.isNW = platformInfo.isNW;

  $scope.checkTips = function(force) {
    storageService.getReceiveTipsAccepted(function(err, accepted) {
      if (err) $log.warn(err);
      if (accepted && !force) return;

      $timeout(function() {
        $ionicModal.fromTemplateUrl('views/modals/receive-tips.html', {
          scope: $scope
        }).then(function(modal) {
          $scope.receiveTipsModal = modal;
          $scope.receiveTipsModal.show();
        });
      }, force ? 1 : 1000);
    });
  };

  $scope.shareAddress = function(addr) {
    if ($scope.generatingAddress) return;
    if ($scope.isCordova) {
      window.plugins.socialsharing.share('bitcoin:' + addr, null, null, null);
    }
  };

  $scope.setAddress = function(forceNew) {
    if ($scope.generatingAddress || !$scope.wallet.isComplete()) return;

    $scope.addr = null;
    $scope.generatingAddress = true;
    $timeout(function() {
      walletService.getAddress($scope.wallet, forceNew, function(err, addr) {
        $scope.generatingAddress = false;
        if (err) popupService.showAlert(gettextCatalog.getString('Error'), err);
        $scope.addr = addr;
        if ($scope.wallet.showBackupNeededModal) $scope.openBackupNeededModal();
        $scope.$apply();
      });
    }, 100);

  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    if (!$scope.isCordova) $scope.checkTips();
    $scope.wallets = profileService.getWallets();
    $scope.$on('Wallet/Changed', function(event, wallet) {
      if (!wallet) {
        $log.debug('No wallet provided');
        return;
      }
      $scope.wallet = wallet;
      $log.debug('Wallet changed: ' + wallet.name);
      $scope.setAddress();
    });
  });

  $scope.goCopayers = function() {
    $ionicHistory.removeBackView();
    $ionicHistory.nextViewOptions({
      disableAnimate: true
    });
    $state.go('tabs.home');
    $timeout(function() {
      $state.transitionTo('tabs.copayers', {
        walletId: $scope.wallet.credentials.walletId
      });
    }, 100);
  };

  $scope.openBackupNeededModal = function() {
    $ionicModal.fromTemplateUrl('views/includes/backupNeededPopup.html', {
      scope: $scope,
      backdropClickToClose: false,
      hardwareBackButtonClose: false
    }).then(function(modal) {
      $scope.BackupNeededModal = modal;
      $scope.BackupNeededModal.show();
    });
  };

  $scope.close = function() {
    $scope.BackupNeededModal.hide();
    $scope.BackupNeededModal.remove();
    profileService.setBackupNeededModalFlag($scope.wallet.credentials.walletId);
  };

  $scope.doBackup = function() {
    $scope.close();
    $scope.goToBackupFlow();
  };

  $scope.goToBackupFlow = function() {
    $state.go('tabs.receive.backupWarning', {
      from: 'tabs.receive',
      walletId: $scope.wallet.credentials.walletId
    });
  }
});

'use strict';

angular.module('copayApp.controllers').controller('tabSendController', function($scope, $log, $timeout, $ionicScrollDelegate, addressbookService, profileService, lodash, $state, walletService, incomingData) {

  var originalList;
  var CONTACTS_SHOW_LIMIT = 10;
  var currentContactsPage = 0;

  var updateList = function() {
    originalList = [];

    var wallets = profileService.getWallets({
      onlyComplete: true
    });
    $scope.hasWallets = lodash.isEmpty(wallets) ? false : true;
    $scope.oneWallet = wallets.length == 1;

    lodash.each(wallets, function(v) {
      originalList.push({
        color: v.color,
        name: v.name,
        isWallet: true,
        getAddress: function(cb) {
          walletService.getAddress(v, false, cb);
        },
      });
    });

    addressbookService.list(function(err, ab) {
      if (err) $log.error(err);

      $scope.hasContacts = lodash.isEmpty(ab) ? false : true;
      var completeContacts = [];
      lodash.each(ab, function(v, k) {
        completeContacts.push({
          name: lodash.isObject(v) ? v.name : v,
          address: k,
          email: lodash.isObject(v) ? v.email : null,
          getAddress: function(cb) {
            return cb(null, k);
          },
        });
      });

      var contacts = completeContacts.slice(0, (currentContactsPage + 1) * CONTACTS_SHOW_LIMIT);
      $scope.contactsShowMore = completeContacts.length > contacts.length;
      originalList = originalList.concat(contacts);
      $scope.list = lodash.clone(originalList);

      $timeout(function() {
        $ionicScrollDelegate.resize();
        $scope.$apply();
      }, 10);
    });
  };

  $scope.showMore = function() {
    currentContactsPage++;
    updateList();
  };

  $scope.findContact = function(search) {

    if (incomingData.redir(search)) {
      return;
    }

    if (!search || search.length < 2) {
      $scope.list = originalList;
      $timeout(function() {
        $scope.$apply();
      }, 10);
      return;
    }

    var result = lodash.filter(originalList, function(item) {
      var val = item.name;
      return lodash.includes(val.toLowerCase(), search.toLowerCase());
    });

    $scope.list = result;
  };

  $scope.goToAmount = function(item) {
    item.getAddress(function(err, addr) {
      if (err || !addr) {
        $log.error(err);
        return;
      }
      $log.debug('Got toAddress:' + addr + ' | ' + item.name);
      return $state.transitionTo('tabs.send.amount', {
        isWallet: item.isWallet,
        toAddress: addr,
        toName: item.name,
        toEmail: item.email
      })
    });
  };

  $scope.onQrCodeScanned = function(data) {
    if (!incomingData.redir(data)) {
      $ionicPopup.alert({
        title: 'Invalid data',
      });
    }
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.formData = {
      search: null
    };
    updateList();
  });

});

'use strict';

angular.module('copayApp.controllers').controller('tabSettingsController', function($scope, $rootScope, $log, $window, lodash, configService, uxLanguage, platformInfo, pushNotificationsService, profileService, feeService) {

  var updateConfig = function() {

    var config = configService.getSync();
    var isCordova = platformInfo.isCordova;
    var isWP = platformInfo.isWP;
    var isIOS = platformInfo.isIOS;

    $scope.appName = $window.appConfig.nameCase;

    $scope.unitName = config.wallet.settings.unitName;
    $scope.currentLanguageName = uxLanguage.getCurrentLanguageName();
    $scope.selectedAlternative = {
      name: config.wallet.settings.alternativeName,
      isoCode: config.wallet.settings.alternativeIsoCode
    };
    $scope.feeOpts = feeService.feeOpts;
    $scope.currentFeeLevel = feeService.getCurrentFeeLevel();
    $scope.usePushNotifications = isCordova && !isWP;
    $scope.PNEnabledByUser = true;
    $scope.isIOSApp = isIOS && isCordova;
    if ($scope.isIOSApp) {
      cordova.plugins.diagnostic.isRemoteNotificationsEnabled(function(isEnabled) {
        $scope.PNEnabledByUser = isEnabled;
        $scope.$digest();
      });
    }
    $scope.spendUnconfirmed = {
      value: config.wallet.spendUnconfirmed
    };
    $scope.glideraEnabled = {
      value: config.glidera.enabled
    };
    $scope.coinbaseEnabled = config.coinbase.enabled;
    $scope.pushNotifications = {
      value: config.pushNotifications.enabled
    };
    $scope.otherWallets = lodash.filter(profileService.getWallets(self.network), function(w) {
      return w.id != self.walletId;
    });
    $scope.wallets = profileService.getWallets();
  };

  $scope.openSettings = function() {
    cordova.plugins.diagnostic.switchToSettings(function() {
      $log.debug('switched to settings');
    }, function(err) {
      $log.debug(err);
    });
  };

  $scope.spendUnconfirmedChange = function() {
    var opts = {
      wallet: {
        spendUnconfirmed: $scope.spendUnconfirmed.value
      }
    };
    configService.set(opts, function(err) {
      if (err) $log.debug(err);
    });
  };

  $scope.pushNotificationsChange = function() {
    var opts = {
      pushNotifications: {
        enabled: $scope.pushNotifications.value
      }
    };
    configService.set(opts, function(err) {
      if (opts.pushNotifications.enabled)
        pushNotificationsService.enableNotifications(profileService.walletClients);
      else
        pushNotificationsService.disableNotifications(profileService.walletClients);
      if (err) $log.debug(err);
    });
  };

  $scope.glideraChange = function() {
    var opts = {
      glidera: {
        enabled: $scope.glideraEnabled.value
      }
    };
    configService.set(opts, function(err) {
      if (err) $log.debug(err);
    });
  };

  $scope.coinbaseChange = function() {
    var opts = {
      coinbase: {
        enabled: $scope.coinbaseEnabled
      }
    };
    configService.set(opts, function(err) {
      if (err) $log.debug(err);
    });
  };

  $scope.$on("$ionicView.enter", function(event, data) {
    updateConfig();
  });

});

'use strict';

angular.module('copayApp.controllers').controller('tabsController', function($rootScope, $log, $scope, $state, $stateParams, $timeout, incomingData, lodash) {

  $scope.onScan = function(data) {
    if (!incomingData.redir(data)) {
      $ionicPopup.alert({
        title: 'Invalid data',
      });
    }
  }

  $scope.setScanFn = function(scanFn) {
    $scope.scan = function() {
      $log.debug('Scanning...');
      scanFn();
    };
  };

  $scope.importInit = function() {
    $scope.fromOnboarding = $stateParams.fromOnboarding;
    $timeout(function() {
      $scope.$apply();
    }, 1);
  };

  var hideTabsViews = [
    'tabs.send.amount',
    'tabs.send.confirm',
    'tabs.send.addressbook',
    'tabs.addressbook',
    'tabs.addressbook.add',
    'tabs.addressbook.view',
    'tabs.preferences.backupWarning',
    'tabs.preferences.backup',
    'tabs.receive.backupWarning',
    'tabs.receive.backup',
  ];

  $rootScope.$on('$ionicView.beforeEnter', function() {

    $rootScope.hideTabs = false;

    var currentState = $state.current.name;

    lodash.each(hideTabsViews, function(view) {
      if (currentState === view) {
        $rootScope.hideTabs = true;
      }
    });
  });

});

'use strict';

angular.module('copayApp.controllers').controller('termOfUseController',
  function($scope, $window, uxLanguage, gettextCatalog, externalLinkService) {
    $scope.lang = uxLanguage.currentLanguage;
    $scope.disclaimerUrl = $window.appConfig.disclaimerUrl;

    $scope.openExternalLink = function(url, target) {
      externalLinkService.open(url, target);
    };
  });

'use strict';

angular.module('copayApp.controllers').controller('translatorsController',
  function($scope, externalLinkService) {
    $scope.openExternalLink = function(url, target) {
      externalLinkService.open(url, target);
    };
  });

'use strict';

angular.module('copayApp.controllers').controller('versionController', function() {
  this.version = window.version;
  this.commitHash = window.commitHash;
});

'use strict';

angular.module('copayApp.controllers').controller('walletDetailsController', function($scope, $rootScope, $interval, $timeout, $filter, $log, $ionicModal, $ionicPopover, $state, $stateParams, profileService, lodash, configService, gettext, gettextCatalog, platformInfo, walletService, $ionicPopup, txpModalService, externalLinkService) {
  var isCordova = platformInfo.isCordova;
  var isWP = platformInfo.isWP;
  var isAndroid = platformInfo.isAndroid;
  var isChromeApp = platformInfo.isChromeApp;

  var HISTORY_SHOW_LIMIT = 10;
  var currentTxHistoryPage;
  var wallet;
  $scope.txps = [];

  $scope.openExternalLink = function(url, target) {
    externalLinkService.open(url, target);
  };

  var setPendingTxps = function(txps) {

    /* Uncomment to test multiple outputs */

    // var txp = {
    //   message: 'test multi-output',
    //   fee: 1000,
    //   createdOn: new Date() / 1000,
    //   outputs: [],
    //   wallet: wallet
    // };
    //
    // function addOutput(n) {
    //   txp.outputs.push({
    //     amount: 600,
    //     toAddress: '2N8bhEwbKtMvR2jqMRcTCQqzHP6zXGToXcK',
    //     message: 'output #' + (Number(n) + 1)
    //   });
    // };
    // lodash.times(15, addOutput);
    // txps.push(txp);

    if (!txps) {
      $scope.txps = [];
      return;
    }
    $scope.txps = lodash.sortBy(txps, 'createdOn').reverse();
  };


  $scope.updateStatus = function(force) {
    $scope.updatingStatus = true;
    $scope.updateStatusError = false;
    $scope.walletNotRegistered = false;

    walletService.getStatus(wallet, {
      force: !!force,
    }, function(err, status) {
      $scope.updatingStatus = false;
      if (err) {
        if (err === 'WALLET_NOT_REGISTERED') {
          $scope.walletNotRegistered = true;
        } else {
          $scope.updateStatusError = true;
        }
        $scope.status = null;
        return;
      }

      setPendingTxps(status.pendingTxps);

      $scope.status = status;
      $timeout(function() {
        $scope.$apply();
      }, 1);

    });
  };


  $scope.openTxpModal = txpModalService.open;

  var listeners = [
    $rootScope.$on('bwsEvent', function(e, walletId) {
      if (walletId == wallet.id)
        $scope.updateStatus();
    }),
    $rootScope.$on('Local/TxAction', function(e, walletId) {
      if (walletId == wallet.id)
        $scope.updateStatus();
    }),
  ];

  $scope.$on('$destroy', function() {
    lodash.each(listeners, function(x) {
      x();
    });
  });


  $scope.openSearchModal = function() {
    $scope.color = wallet.color;

    $ionicModal.fromTemplateUrl('views/modals/search.html', {
      scope: $scope,
      focusFirstInput: true
    }).then(function(modal) {
      $scope.searchModal = modal;
      $scope.searchModal.show();
    });

    $scope.close = function() {
      $scope.searchModal.hide();
    }
  };

  $scope.openTxModal = function(btx) {
    $scope.btx = lodash.cloneDeep(btx);
    $scope.walletId = wallet.id;
    $ionicModal.fromTemplateUrl('views/modals/tx-details.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.txDetailsModal = modal;
      $scope.txDetailsModal.show();
    });
  };

  $scope.recreate = function() {
    walletService.recreate(wallet, function(err) {
      $scope.init();
      if (err) return;
      $timeout(function() {
        walletService.startScan(wallet, function() {
          $scope.$apply();
        });
      });
    });
  };

  $scope.updateTxHistory = function(cb) {
    if (!cb) cb = function() {};
    if ($scope.updatingTxHistory) return;

    $scope.updatingTxHistory = true;
    $scope.updateTxHistoryError = false;
    $scope.updatingTxHistoryProgress = null;

    var progressFn = function(txs) {
      $scope.updatingTxHistoryProgress = txs ? txs.length : 0;
      $scope.completeTxHistory = txs;
      $scope.showHistory();
      $timeout(function() {
        $scope.$apply();
      }, 1);
    };

    $timeout(function() {
      walletService.getTxHistory(wallet, {
        progressFn: progressFn,
      }, function(err, txHistory) {
        $scope.updatingTxHistory = false;
        if (err) {
          $scope.txHistory = null;
          $scope.updateTxHistoryError = true;
          return;
        }
        $scope.completeTxHistory = txHistory;

        $scope.showHistory();

        $timeout(function() {
          $scope.$apply();
        }, 1);
        return cb();
      });
    });
  };

  $scope.showHistory = function() {
    if ($scope.completeTxHistory) {
      $scope.txHistory = $scope.completeTxHistory.slice(0, (currentTxHistoryPage + 1) * HISTORY_SHOW_LIMIT);
      $scope.txHistoryShowMore = $scope.completeTxHistory.length > $scope.txHistory.length;
    }
  };

  $scope.showMore = function() {
    currentTxHistoryPage++;
    $scope.showHistory();
    $scope.$broadcast('scroll.infiniteScrollComplete');
  };

  $scope.updateAll = function(cb)  {
    $scope.updateStatus(false);
    $scope.updateTxHistory(cb);
  };

  $scope.hideToggle = function() {
    profileService.toggleHideBalanceFlag(wallet.credentials.walletId, function(err) {
      if (err) $log.error(err);
    });
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data){
    currentTxHistoryPage = 0;
    $scope.completeTxHistory = [];

    wallet = profileService.getWallet($stateParams.walletId);

    /* Set color for header bar */
    $scope.walletDetailsColor = wallet.color;
    $scope.walletDetailsName = wallet.name;
    $scope.wallet = wallet;

    $scope.requiresMultipleSignatures = wallet.credentials.m > 1;
    $scope.newTx = false;

    $scope.updateAll(function() {
      if ($stateParams.txid) {
        var tx = lodash.find($scope.completeTxHistory, {
          txid: $stateParams.txid
        });
        if (tx) {
          $scope.openTxModal(tx);
        } else {
          $ionicPopup.alert({
            title: gettext('TX not available'),
          });
        }
      } else if ($stateParams.txpId) {
        var txp = lodash.find($scope.txps, {
          id: $stateParams.txpId
        });
        if (txp) {
          $scope.openTxpModal(txp);
        } else {
          $ionicPopup.alert({
            title: gettext('Proposal not longer available'),
          });
        }
      }
    });
  });
});

angular.module('copayApp').run(['gettextCatalog', function (gettextCatalog) {
/* jshint -W100 */
    gettextCatalog.setStrings('cs', {"(possible double spend)":"(pravděpodobná dvojitá platba)","(Trusted)":"(Věrohodný)","[Balance Hidden]":"[skrytý zůstatek]","{{fee}} will be deducted for bitcoin networking fees":"{{fee}} bude odečteno jako poplatek bitcoinové síti","{{feeRateStr}} of the transaction":"{{feeRateStr}} z transakce","{{index.m}}-of-{{index.n}}":"{{index.m}} z {{index.n}}","{{index.txProgress}} transactions downloaded":"{{index.txProgress}} transakce stažena","{{item.m}}-of-{{item.n}}":"{{item.m}} z {{item.n}}","* A payment proposal can be deleted if 1) you are the creator, and no other copayer has signed, or 2) 24 hours have passed since the proposal was created.":"* Návrh k platbě může být odstraněn pokud 1) jste jej vytvořil(a) a žádný spoluplátce jej nepodepsal 2) Uběhlo 24 hodin od vytvoření návrhu.","<b>IF YOU LOSE ACCESS TO YOUR COPAY WALLET OR YOUR ENCRYPTED PRIVATE KEYS AND YOU HAVE NOT SEPARATELY STORED A BACKUP OF YOUR WALLET AND CORRESPONDING PASSWORD, YOU ACKNOWLEDGE AND AGREE THAT ANY BITCOIN YOU HAVE ASSOCIATED WITH THAT COPAY WALLET WILL BECOME INACCESSIBLE.</b>":"<b>POKUD ZTRATÍTE PŘÍSTUP K VAŠI SPOLUPLÁTCOVSKÉ PENĚŽENCE NEBO VAŠÍM ŠIFROVANÝM KLÍČŮM A NEMÁTE ULOŽENOU ZÁLOHU VAŠI PENĚŽENKY A HESLEM ZVLÁŠTĚ, BERETE NA VĚDOMÍ ŽE VŠECHNY BITCOINY ULOŽENÉ V TÉTO SPOLUPLÁTCOVSKÉ PENĚŽENCE NEBUDOU DOSTUPNÉ. </b>","A multisignature bitcoin wallet":"A vícepodpisová bitcoin peněženka","About Copay":"O Copay","Accept":"Přijmout","Account":"Účet","Account Number":"Číslo účtu","Activity":"Aktivita","Add a new entry":"Přidat nový záznam","Add wallet":"Přidat peněženku","Address":"Adresa","Address Type":"Typ adresy","Advanced":"Pokročilé","Alias":"Název","Alias for <i>{{index.walletName}}</i>":"Název pro <i>{{index.walletName}}</i>","All contributions to Copay's translation are welcome. Sign up at crowdin.com and join the Copay project at":"Všichni spoluúčastníci překladů Copay jsou vítání. Přihlaště se na crowdin.com a přidejte se k projektu Copay na","All transaction requests are irreversible.":"Všechny žádosti o platbu jsou nevratné.","Alternative Currency":"Alternativní měna","Amount":"Částka","Amount in":"Částka v","Are you sure you want to delete this wallet?":"Opravdu si přejete odstranit tuto peněženku?","Available Balance":"Dostupný zůstatek","Average confirmation time: {{fee.nbBlocks * 10}} minutes":"Průměrný čas potvrzení je: {{fee.nbBlocks * 10}} minut","Back":"Zpět","Backup":"Záloha","Backup failed":"Chyba zálohování","Backup Needed":"Vyžadována záloha","Backup now":"Vytvořit zálohu","Bad wallet invitation":"Chybný požadavek do peněženky","Balance By Address":"Zůstatek adres","BIP32 path for address derivation":"BIP32 cesta pro derivaci adres","Bitcoin address":"Bitcoin adresa","Bitcoin Network Fee Policy":"Zásady poplatků bitcoinové sítě","Bitcoin URI is NOT valid!":"Bitcoin URI neni platná!","Broadcast Payment":"Vysílání platby","Broadcasting transaction":"Vysílání transakce","Browser unsupported":"Nepodporovaný prohlížeč","Calculating fee":"Vypočítávám poplatek","Cancel":"Zrušit","Cancel and delete the wallet":"Zrušit a odstranit peněženku","Cannot create transaction. Insufficient funds":"Nelze vytvořit transakci. Nedostatek prostředků","Cannot join the same wallet more that once":"Nelze spojit stejnou peněženku více než jednou","Cannot sign: The payment request has expired":"Chyba podpisu: Návrh platby vypršel","Certified by":"Ověřeno od","Changing wallet alias only affects the local wallet name.":"Změna názvu peněženky bude aktualizovat pouze název na tomto zařízení.","Choose a backup file from your computer":"Vyberte zálohu z PC","Clear cache":"Vymazat cache","Close":"Zavřít","Color":"Barva","Commit hash":"Hash softwaru","Confirm":"Potvrdit","Confirmations":"Potvrzení","Congratulations!":"Gratulujeme!","Connection reset by peer":"Spojení obnoveno uzlem","Continue":"Pokračovat","Copayer already in this wallet":"Spoluplátce je již v peněžence","Copayer already voted on this spend proposal":"Spoluplátce pro tento návrh již hlasoval","Copayer data mismatch":"Data spoluplátce nesouhlasí","Copayers":"Spoluplátci","Copied to clipboard":"Zkopírováno","Copy this text as it is to a safe place (notepad or email)":"Zkopírujte tento text do bezpečného místa (např. email nebo poznámkový blok)","Copy to clipboard":"Zkopírovat","Could not access Wallet Service: Not found":"Nebylo možné navázat spojení se službou peněženky: Nebyla nalezena","Could not broadcast payment":"Nebylo možné vyslat platbu","Could not build transaction":"Nebylo možné sestavit transakci","Could not create address":"Nebylo možné vytvořit adresu","Could not create payment proposal":"Nebylo možné vytvořit návrh platby","Could not create using the specified extended private key":"Nebylo možné vytvořit rozšířený veřejný klíč","Could not create using the specified extended public key":"Nebylo možné vytvořit rozšířený veřejný klíč","Could not delete payment proposal":"Nepodařilo se odstranit návrh platby","Could not fetch payment information":"Nebylo možné získat údaje platby","Could not get fee value":"Nebylo možné získat hodnotu poplatku","Could not import":"Chyba importu","Could not join wallet":"Chyba spojování peněženek","Could not recognize a valid Bitcoin QR Code":"Bitcoin QR kód nebyl rozpoznán","Could not reject payment":"Chyba odmítnutí platby","Could not send payment":"Chyba při odesílání platby","Could not update Wallet":"Chyba při aktualizování platby","Create":"Vytvořit","Create {{requiredCopayers}}-of-{{totalCopayers}} wallet":"Vytvořit peněženku {{requiredCopayers}}-z-{{totalCopayers}}","Create new wallet":"Vytvořit novou peněženku","Create, join or import":"Vytvořit, spojit nebo importovat","Created by":"Vytvořil","Creating transaction":"Vytvářím transakci","Creating Wallet...":"Vytvářím peněženku...","Current fee rate for this policy: {{fee.feePerKBUnit}}/kiB":"Současná zásadu poplatků je: {{fee.feePerKBUnit}}/kiB","Date":"Datum","Decrypting a paper wallet could take around 5 minutes on this device. please be patient and keep the app open.":"Dešifrování papírové peněženky může na tomto zařízení trvat okolo 5 minut, buďte prosím trpělivý a nechejte aplikaci otevřenou.","Delete it and create a new one":"Smazat a vytvořit novou","Delete Payment Proposal":"Odstranit návrh platby","Delete wallet":"Odstranit peněženku","Delete Wallet":"Odstranit peněženku","Deleting Wallet...":"Mažu peněženku...","Derivation Path":"Cesta derivace","Derivation Strategy":"Způsob derivace","Details":"Detail","Disabled":"Nedostupné","Do not include private key":"Nevyplňujte soukromý klíč","Don't see your language on Crowdin? Contact the Owner on Crowdin! We'd love to support your language.":"Nevidíte na Crowdin váš jazyk? Kontaktujte správce repozitáře na Crowdin. Rádi váš jazyk přidáme.","Done":"Hotovo","Download":"Stáhnout","Economy":"Ekonomický","Edit":"Upravit","Email for wallet notifications":"Email pro upozornění","Email Notifications":"Email upozornění","Empty addresses limit reached. New addresses cannot be generated.":"Limit prázdných adres dovrše. Nové adresy nemohou být vytvořeny.","Enable push notifications":"Povolit notifikace","Encrypted export file saved":"Šifrovaný soubor byl vytvořen","Enter your password":"Vyplňte heslo","Error at Wallet Service":"Chyba Služby Peněženky","Error creating wallet":"Chyba vytváření peněženky","Expired":"Vyprošelo","Expires":"Vyprší","Export options":"Možnosti exportu","Export to file":"Exportovat do souboru","Export Wallet":"Exportovat peněženku","Extended Public Keys":"Rozšířený veřejný klíč","Failed to export":"Chyba exportu","Failed to verify backup. Please check your information":"Chyba ověření zálohy. Zkontrolujte zadané informace","Family vacation funds":"Úspory rodiny na dovolenou","Fee":"Poplatek","Fetching Payment Information":"Stahuji platební údaje","Finish":"Konec","French":"Francouzština","Funds are locked by pending spend proposals":"Zůstatky jsou blokovány probíhajícím návrhem platby","Funds found":"Zůstatky nalezeny","Funds received":"Obdržena platba","Funds will be transferred to":"Částka bude převedena k","Generate new address":"Vytvořit novou adresu","Generate QR Code":"Vytvořit QR kód","Generating .csv file...":"Vytvářím .csv soubor...","German":"Němčina","Getting address for wallet {{selectedWalletName}} ...":"Získávání adres peněženky {{selectedWalletName}} ...","Global preferences":"Obecná nastavení","Hardware wallet":"Hardware peněženka","Hardware Wallet":"Hardwarová peněženka","Hide advanced options":"Skrýt rozšířená nastavení","I affirm that I have read, understood, and agree with these terms.":"Potvrzuji, že jsem si přečetl, porozuměl a odsouhlasil uvedené podmínky.","I AGREE. GET STARTED":"SOUHLASÍM. ZAČÍT","Import":"Import","Import backup":"Import zálohy","Import wallet":"Import peněženky","Importing Wallet...":"Importuji peněženku...","In no event shall the authors of the software, employees and affiliates of Bitpay, copyright holders, or BitPay, Inc. be held liable for any claim, damages or other liability, whether in an action of contract, tort, or otherwise, arising from, out of or in connection with the software.":"Za žádných okolností autoři softwaru, zaměstnanci a přidružené osoby z Bitpay, vlastníci ochranných známek, BitPay, Inc nejsou odpovědni za škody nebo náhradu nákladů, plynoucí z používání tohoto softwaru.","Incorrect address network":"Neplatná síť adres","Insufficient funds":"Nedostatečná částka","Insufficient funds for fee":"Nedostatečný zůstatek pro poplatek","Invalid":"Neplatné","Invalid account number":"Neplatné číslo účtu","Invalid address":"Neplatná adresa","Invalid derivation path":"Neplatná cesta derivace","Invitation to share a Copay Wallet":"Pozvánka ke sdílené Copay Peněžence","Japanese":"Japonština","John":"John","Join":"Spojit","Join my Copay wallet. Here is the invitation code: {{secret}} You can download Copay for your phone or desktop at https://copay.io":"Propojení mé Copay peněženky. Toto je kód pozvánky: {{secret}} Copay je možné stáhnout do telefonu nebo počítače na https://copay.io","Join shared wallet":"Spojit sdílenou peněženku","Joining Wallet...":"Spojuji peněženky...","Key already associated with an existing wallet":"Klíč je již spojený s některou z peněženek","Label":"Štítek","Language":"Jazyk","Last Wallet Addresses":"Poslední adresa peněženky","Learn more about Copay backups":"Dozvědět se více o zálohování Copay","Loading...":"Načítám...","locked by pending payments":"zablokováno probíhající platbou","Locktime in effect. Please wait to create a new spend proposal":"Čekání na locktime. Prosím vyčkejte na vytvoření nového platebního návrhu","Locktime in effect. Please wait to remove this spend proposal":"Čekání na locktime. Prosím vyčkejte na vytvoření tohoto platebního návrhu","Make a payment to":"Vytvořit platbu pro","Matches:":"Shody:","me":"já","Me":"Já","Memo":"Poznámka","Merchant message":"Zpráva obchodníka","Message":"Zpráva","Missing private keys to sign":"Chybějící soukromý klíč pro podpis","Moved":"Přesunuto","Multiple recipients":"Více příjemců","My Bitcoin address":"Moje bitcoin adresa","My contacts":"Moje kontakty","My wallets":"Moje peněženky","Need to do backup":"Vyžaduje zálohu","Network":"Síť","Network connection error":"Chyba síťového spojení","New Payment Proposal":"Nový návrh platby","No hardware wallets supported on this device":"Toto zařízení nejsou podporována žádná hardware zařízení","No transactions yet":"Žádné transakce","Normal":"Normální","Not authorized":"Neautorizováno","Not completed":"Nedokončeno","Not valid":"Neplatné","Note":"Poznámka","Note: a total of {{amountAboveMaxSizeStr}} were excluded. The maximum size allowed for a transaction was exceeded":"Poznámka: celkem {{amountAboveMaxSizeStr}} bylo vyloučeno. Byla překročena maximální povolená velikost transakce","Note: a total of {{amountBelowFeeStr}} were excluded. These funds come from UTXOs smaller than the network fee provided.":"Pozn.: bylo vyloučeno celkem {{amountBelowFeeStr}}. Tyto prostředky pocházejí z menších UTXO, než kolik činí poplatek sítě.","Official English Disclaimer":"Oficiální Disclaimer v Angličtině","Only Main (not change) addresses are shown. The addresses on this list were not verified locally at this time.":"Viditelné jsou pouze hlavní (ne adresy pro vratky). Adresy na tomto seznamu nebyly lokálně ověřeny.","Open Settings app":"Otevřít nastavení aplikace","optional":"nepovinný","Paper Wallet Private Key":"Soukromý klíč papírové peněženky","Participants":"Účastníci","Passphrase":"Heslo","Password":"Heslo","Paste invitation here":"Pozvánku zkopírujte sem","Paste the backup plain text code":"Zálohu zkopírujte sem","Paste your paper wallet private key here":"Soukromý klíč papírové peněženky zkopírujte sem","Pasted from clipboard":"Zkopírovano","Pay To":"Placeno komu","Payment Accepted":"Platba přijata","Payment accepted, but not yet broadcasted":"Platba přijata, ale doposud nebyla odeslána","Payment accepted. It will be broadcasted by Glidera. In case there is a problem, it can be deleted 6 hours after it was created.":"Platba přijata. Bude vyslánat do sítě pomocí Glidera. V případě, že nastanou komplikace, může být odstraněna po 6 hodinách od vytvoření.","Payment details":"Údaje platby","Payment expires":"Expirace platby","Payment Proposal":"Návrh platby","Payment Proposal Created":"Návrh platby byl vytvořen","Payment Proposal Rejected":"Návrh platby byl odmítnut","Payment Proposal Rejected by Copayer":"Návrh platby odmítnut spoluplátcem","Payment Proposal Signed by Copayer":"Návrh platby byl podepsán spoluplátcem","Payment Proposals":"Návrhy plateb","Payment Protocol Invalid":"Neplatný platební protokol","Payment Protocol not supported on Chrome App":"Chrome App nepodporuje Platební protokol","Payment Rejected":"Platba odmítnuta","Payment request":"Žádost platby","Payment Sent":"Platba odeslána","Payment to":"Platba komu","Pending Confirmation":"Vyčkávající potvrzení","Permanently delete this wallet. THIS ACTION CANNOT BE REVERSED":"Trvalé odstraněné této peněženky. NELZE VRÁTIT ZPĚT","Personal Wallet":"Osobní peněženka","Please enter the required fields":"Vyplňte požadovaná pole","Please tap the words in order to confirm your backup phrase is correctly written.":"Potvrďte pořadí slov pro potvrzení správnosti zálohy.","Please upgrade Copay to perform this action":"Pro tuto funkci je potřeba aktualizovat Copay","Please, select your backup file":"Vyberte soubor zálohy","Preparing backup...":"Připravuji zálohu...","Press again to exit":"Pro ukončení stiskněte tlačítko znovu","Priority":"Priorita","Private key is encrypted, cannot sign":"Soukromý klíč je šifrovaný, nelze podepsat","Push notifications for Copay are currently disabled. Enable them in the Settings app.":"Oznámení pro Copay jsou v současné době zakázána. Povolte v nastavení aplikace.","QR Code":"QR kód","QR-Scanner":"QR čtečka","Receive":"Přijmout","Received":"Přijato","Recipients":"Příjemci","Recreate":"Znovu vytvářím","Recreating Wallet...":"Znovu vytvářím peněženku...","Reject":"Odmítnout","Release Information":"Vypouštění informací","Remove":"Odstranit","Repeat password":"Heslo znovu","Request a specific amount":"Vyžádat konkrétní částku","Required":"Vyžadováno","Required number of signatures":"Vyžadováno více podpisuů","Retrieving inputs information":"Načítání informací vstupů","Russian":"Ruština","Save":"Uložit","Scan addresses for funds":"Naskenujte adresu pro zobrazení zůstatku","Scan Fingerprint":"Skenovat otisk","Scan Finished":"Skenování dokončeno","Scan status finished with error":"Status skenování je chybová","Scan Wallet Funds":"Skenovat zůstatek peněženky","Scan your fingerprint please":"Naskenujte prosím svůj otisk","Scanning Wallet funds...":"Skenuji zůstatek peněženky...","Search transactions":"Vyhledávám transakce","Security preferences":"Nastavení zabezpečení","See it on the blockchain":"Zobrazit na blockchainu","Select a backup file":"Vybrat soubor zálohy","Select a wallet":"Vybrat peněženku","Self-signed Certificate":"Vlastnoručně podepsaný certifikát","Send":"Odesláno","Send addresses by email":"Odeslat adresy emailem","Send bitcoin":"Odeslat BTC","Send by email":"Odeslat emailem","Send Max":"Odeslat max","Sending":"Odesílám","Sending transaction":"Odesílání transakce","Sent":"Odesláno","Server response could not be verified":"Server nemůže být ověřen","Session log":"Log sekce","SET":"NASTAVIT","Set default url":"Nastavit výchozí URL","Set up a password":"Nastavit heslo","Setting up email notifications could weaken your privacy, if the wallet service provider is compromised. Information available to an attacker would include your wallet addresses and its balance, but no more.":"Nastavení emailových notifikací může snížit vaše soukromí, pokud je poskytovatel emailu napaden. Útočník by mohl mít k dispozici vaše adresy peněženek a zůstatek, soukromé klíče k ovládání zůstatků ne.","Settings":"Nastavení","Share address":"Sdílet adresu","Share invitation":"Sdílet pozvánku","Share this invitation with your copayers":"Sdílet tuto pozvánku se spoluplátci","Share this wallet address to receive payments. To protect your privacy, new addresses are generated automatically once you use them.":"Sdílet adresu této peněženky pro přijímání plateb. Pro ochranu soukromí po použití adresy je generována nová.","Shared Wallet":"Sdílená peněženka","Show advanced options":"Zobrazit rozšířená nastavení","Signatures rejected by server":"Podpisy byly serverem odmítnuty","Spanish":"Španělština","Spend proposal is not accepted":"Návrh platby nebyl přijat","Spend proposal not found":"Návrh platby nebyl nalezen","Success":"Úspěšné","Sweep paper wallet":"Převést papírovou peněženku","Sweep Wallet":"Převést peněženku","Tap to retry":"Klikněte pro zopakování pokusu","Terms of Use":"Podmínky používání","The authors of the software, employees and affiliates of Bitpay, copyright holders, and BitPay, Inc. cannot retrieve your private keys or passwords if you lose or forget them and cannot guarantee transaction confirmation as they do not have control over the Bitcoin network.":"Autoři tohoto software, zaměstnanci a ostatní z Bitpay, vlastníci ochranných známek, BitPay, Inc, nemůže obnovit vaše soukromé klíče nebo hesla, pokud dojde ke ztrátě a negarantuje potvrzení transakcí, protože nedrží kontrolu nad Bitcoin sítí.","The Ledger Chrome application is not installed":"Chrome aplikace pro Leger není instalována","The payment was created but could not be completed. Please try again from home screen":"Platba byla vytvořena ale nemohla být dokončena. Opakujte akci z domovské obrazovky","The payment was removed by creator":"Platba byla odstraněna tvůrcem","The request could not be understood by the server":"Požadavek nebyl serverem pochopen","The software does not constitute an account where BitPay or other third parties serve as financial intermediaries or custodians of your bitcoin.":"Tento software nepředstavuje účet kde BitPay nebo jiné třetí strany slouží jako finanční zprostředkovatelé nebo správci vašeho bitcoin.","The software you are about to use functions as a free, open source, and multi-signature digital wallet.":"Software který hodláte začít používat je zdarma, open-source, vícepodpisová digitální peněženka.","The spend proposal is not pending":"Platební návrh neočekává další schválení","The wallet \"{{walletName}}\" was deleted":"Peněženka \"{{walletName}}\" byla odstraněna","There are no wallets to make this payment":"Pro platbu je potřeba založit peněženku","There is a new version of Copay. Please update":"Existuje nová verze Copay. Proveďte aktualizaci","There is an error in the form":"Na formuláři je chyba","This transaction has become invalid; possibly due to a double spend attempt.":"Transakce je neplatná, zřejmě kvůli pokusu o dvojí platbu.","This wallet is not registered at the given Bitcore Wallet Service (BWS). You can recreate it from the local information.":"Tato peněženka není registrována na Bitcore Wallet Service (BWS). Můžete jej znovu vytvořit z lokální informací.","Time":"Čas","To":"Komu","To restore this {{index.m}}-{{index.n}} <b>shared</b> wallet you will need":"Pro obnovu této {{index.m}} z {{index.n}} <b>sdílené</b> peněženky potřebujete","To the fullest extent permitted by law, this software is provided “as is” and no representations or warranties can be made of any kind, express or implied, including but not limited to the warranties of merchantability, fitness or a particular purpose and noninfringement.":"V plném rozsahu povoleném zákonem tento software je poskytován \"tak jak je\" a žádné prohlášení ani záruky nemohou být zaručeny.","too long!":"příliš dlouho!","Total Locked Balance":"Blokovaný zůstatek","Total number of copayers":"Počet spoluplátců","Touch ID Failed":"Chyba Touch ID","Transaction":"Transakce","Transaction already broadcasted":"Transakce byla již odeslána","Transaction History":"Historie transakcí","Translation Credits":"Poděkování překladatelům","Translators":"Překladatelé","Try again":"Zkusit znovu","Unconfirmed":"Nepotvrzené","Unit":"Jednotka","Unsent transactions":"Neodeslaná transakce","Updating transaction history. Please stand by.":"Aktualizuji historii transakcí.","Updating Wallet...":"Aktualizuji peněženku...","Use Unconfirmed Funds":"Použít nepotvrzené částky","Version":"Verze","View":"Pohled","Waiting for copayers":"Vyčkávání na spoluplátce","Waiting...":"Vyčkávání...","Wallet already exists":"Peněženka již existuje","Wallet Configuration (m-n)":"Nastavení peněženky (m z n)","Wallet Export":"Export peněženky","Wallet Id":"Id peněženky","Wallet incomplete and broken":"Peněženka je neúplná a chybná","Wallet Information":"Údaje peněženky","Wallet Invitation":"Pozvánka peněženky","Wallet Invitation is not valid!":"Neplatná pozvánka peněženky!","Wallet is full":"Peněženka je plná","Wallet is locked":"Peněženka je zablokována","Wallet is not complete":"Peněženka není úplná","Wallet name":"Název peněženky","Wallet Name (at creation)":"Název peněženky (při vytváření)","Wallet Network":"Síť peněženky","Wallet not found":"Peněženka nenalezena","Wallet service not found":"Služba peněženky nenalezena","WARNING: Not including the private key allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.":"VAROVÁNÍ: Bez vložení soukromého klíče je možná kontrola zůstatků peněženek, historie transakcí a vytváření návrhů plateb z exportu. Nicméně, tyto údaje neumožňují (podepsat) návrhy plateb, tudíž <b>zůstatky nebudou z exportů ovladatelné<b>.","WARNING: The private key of this wallet is not available. The export allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.":"VAROVÁNÍ: Soukromý klíč této peněženky není dostupný. Export umožňuje kontrolu zůstatků peněženky, historii transakcí, vytvoření návrhu platby z exportu. Nicméně neumožňuje potvrdit (podepsat) návrhy, <b>zůstatky budou z exportu neovladatelné</b>.","Warning: this transaction has unconfirmed inputs":"Varování: Tato transakce odesílá nepotvrzené zůstatky","WARNING: UNTRUSTED CERTIFICATE":"VAROVÁNÍ: NEDŮVĚRYHODNÝ CERTIFIKÁT","WARNING: Wallet not registered":"VÁROVÁNÍ: Neregistrovaná peněženka","Warning!":"Varování!","We reserve the right to modify this disclaimer from time to time.":"Rezervujeme si právu upravit podmínky užívání.","WELCOME TO COPAY":"VÍTEJTE V COPAY","While the software has undergone beta testing and continues to be improved by feedback from the open-source user and developer community, we cannot guarantee that there will be no bugs in the software.":"Zatímco software byl podroben testování beta a nadále je vylepšován zpětnou vazbou od open source uživatelské a vývojářské komunity, nemůžeme zaručit, že nedojde k žádným chybám v softwaru.","Yes":"Ano","You acknowledge that your use of this software is at your own discretion and in compliance with all applicable laws.":"Potvrzujete, že používáte tento software na vlastní uvážení a v souladu se všemi platnými zákony.","You are responsible for safekeeping your passwords, private key pairs, PINs and any other codes you use to access the software.":"Jste odpovědni za bezpečné uchování hesel, soukromých klíčů, PINů a další údajů potřebných pro ovládání softwaru.","You assume any and all risks associated with the use of the software.":"Berete na vědomí risk spojený s používání tohoto softwaru.","You backed up your wallet. You can now restore this wallet at any time.":"Zálohovali jste peněženku. Nyní je možné přistoupit k obnově.","You can safely install your wallet on another device and use it from multiple devices at the same time.":"Bezpečně můžete instalovat peněženku na jiné zařízení a použít jej z jiného zařízení ve stejnou dobu.","Your nickname":"Vaše přezdívka","Your password":"Vaše heslo","Your wallet has been imported correctly":"Vaše peněženka byla úspěšně importována"});
    gettextCatalog.setStrings('de', {"(possible double spend)":"(mögliche Doppelausgabe)","(Trusted)":"(Vertraut)","[Balance Hidden]":"[Guthaben versteckt]","{{fee}} will be deducted for bitcoin networking fees":"{{fee}} wird als Netzwerkgebühr abgezogen","{{feeRateStr}} of the transaction":"{{feeRateStr}} der Transaktion","{{index.m}}-of-{{index.n}}":"{{index.m}}-von-{{index.n}}","{{index.result.length - index.txHistorySearchResults.length}} more":"{{index.result.length - index.txHistorySearchResults.length}} weitere","{{index.txProgress}} transactions downloaded":"{{index.txProgress}} Transaktionen werden heruntergeladen","{{item.m}}-of-{{item.n}}":"{{item.m}}-von-{{item.n}}","* A payment proposal can be deleted if 1) you are the creator, and no other copayer has signed, or 2) 24 hours have passed since the proposal was created.":"* Ein Zahlungsvorschlag kann gelöscht werden, wenn 1) Du diesen erzeugt hast und noch kein anderer Copayer unterschrieben hat, oder 2) 24 Stunden vergangen sind, seit der Vorschlag erstellt wurde.","<b>IF YOU LOSE ACCESS TO YOUR COPAY WALLET OR YOUR ENCRYPTED PRIVATE KEYS AND YOU HAVE NOT SEPARATELY STORED A BACKUP OF YOUR WALLET AND CORRESPONDING PASSWORD, YOU ACKNOWLEDGE AND AGREE THAT ANY BITCOIN YOU HAVE ASSOCIATED WITH THAT COPAY WALLET WILL BECOME INACCESSIBLE.</b>":"<b>WENN DER ZUGRIFF AUF DAS COPAY WALLET ODER DEN VERSCHLÜSSELTEN PRIVATEN SCHLÜSSELN VERLOREN GEHT UND KEINE SICHERUNG DES WALLETS UND KORRESPONDIERENDEM PASSWORT EXISTIERT, DANN WIRD BESTÄTIGT UND AKZEPTIERT, DASS AUF ALLE MIT DIESEM WALLET VERBUNDENEN BITCOIN KEIN ZUGRIFF MEHR MÖGLICH IST.</b>","<b>OR</b> 1 wallet export file and the remaining quorum of wallet recovery phrases (e.g. in a 3-5 wallet: 1 wallet export file + 2 wallet recovery phrases of any of the other copayers).":"<b>ODER</b> 1 Exportdatei des Wallets und und die noch benötigten Wallet-Wiederherstellungsphrasen (z.B. für ein 3-5 Wallet: 1 Exportdatei + 2 Wallet-Wiederherstellungsphrasen anderer Copayer).","<b>OR</b> the wallet recovery phrase of <b>all</b> copayers in the wallet":"<b>ODER</b> die Wallet-Wiederherstellungsphrasen <b>aller</b> Copayer des Wallets","<b>OR</b> the wallet recovery phrases of <b>all</b> copayers in the wallet":"<b>ODER</b> die Wallet-Wiederherstellungsphrasen <b>aller</b> Copayer des Wallets","A multisignature bitcoin wallet":"Ein Bitcoin Wallet mit Mehrfachunterschriften","About Copay":"Über Copay","Accept":"Akzeptieren","Account":"Benutzerkonto","Account Number":"Kontonummer","Activity":"Aktivität","Add a new entry":"Einen neuen Eintrag hinzufügen","Add a Password":"Passwort festlegen","Add an optional password to secure the recovery phrase":"Ein optionales Passwort zur Sicherung der Wiederherstellungsphrase hinzufügen","Add comment":"Kommentar hinzufügen","Add wallet":"Wallet hinzufügen","Address":"Adresse","Address Type":"Adresstyp","Advanced":"Erweitert","Alias":"Alias","Alias for <i>{{index.walletName}}</i>":"Alias für <i>{{index.walletName}}</i>","All contributions to Copay's translation are welcome. Sign up at crowdin.com and join the Copay project at":"Alle Beiträge zur Übersetzung von Copay sind willkommen. Melde Dich bei crowdin.com an verbinde Dich mit dem Copay-Projekt über","All transaction requests are irreversible.":"Transaktionen können unmöglich rückgängig gemacht werden.","Alternative Currency":"Alternative Währung","Amount":"Betrag","Amount below minimum allowed":"Betrag unter zulässigem Minimum","Amount in":"Betrag in","Are you sure you want to delete the recovery phrase?":"Sind Sie sicher, dass Sie die Wiederherstellungsphrase löschen möchten?","Are you sure you want to delete this wallet?":"Soll das Wallet wirklich gelöscht werden?","Auditable":"Prüffähig","Available Balance":"Verfügbarer Gesamtbetrag","Average confirmation time: {{fee.nbBlocks * 10}} minutes":"Durchschnittliche Zeit für die Bestätigung der Transaktion: {{fee.nbBlocks * 10}} Minuten","Back":"Zurück","Backup":"Sicherung","Backup failed":"Backup ist fehlgeschlagen","Backup Needed":"Backup wird benötigt","Backup now":"Jetzt sichern","Bad wallet invitation":"Ungültige Einladung","Balance By Address":"Guthaben nach Adresse","Before receiving funds, you must backup your wallet. If this device is lost, it is impossible to access your funds without a backup.":"Es ist notwendig Ihre Brieftasche zu sichern bevor Sie Beträge empfangen. Wenn Sie dieses Gerät verlieren, ist es ohne Sicherung unmöglich auf empfangene Beträge zuzugreifen.","BETA: Android Key Derivation Test:":"BETA: Android Key Derivation Test:","BIP32 path for address derivation":"BIP32 Pfad für die Adressen-Ableitung","Bitcoin address":"Bitcoinadresse","Bitcoin Network Fee Policy":"Bitcoin-Netzwerk Gebührenübersicht","Bitcoin transactions may include a fee collected by miners on the network. The higher the fee, the greater the incentive a miner has to include that transaction in a block. Current fees are determined based on network load and the selected policy.":"Für Bitcoin-Transaktionen können Gebühren hinzugefügt werden. Transaktionen mit höheren Gebühren werden meist schneller verarbeitet und bestätigt. Die tatsächlichen Gebühren werden anhand der Netzwerklast und der ausgewählte Richtlinie bestimmt.","Bitcoin URI is NOT valid!":"Bitcoin URI ist NICHT gültig!","Broadcast Payment":"Zahlung übermitteln","Broadcasting transaction":"Übermittlung der Transaktion","Browser unsupported":"Der eingesetzte Browser wird nicht unterstützt","Calculating fee":"Mining-Fee Berechnung","Cancel":"Abbruch","Cancel and delete the wallet":"Abbrechen und Brieftasche löschen","Cannot create transaction. Insufficient funds":"Transaktion kann nicht erstellt werden. Keine Deckung","Cannot join the same wallet more that once":"An einem Wallet kann nicht mehrfach teilgenommen werden","Cannot sign: The payment request has expired":"Signieren nicht möglich: die Zahlungsanforderung ist abgelaufen","Certified by":"Zertifiziert von","Changing wallet alias only affects the local wallet name.":"Änderung der Aliases hat nur Auswirkungen auf den lokalen Namen des Wallets","Chinese":"Chinesisch","Choose a backup file from your computer":"Bitte eine Sicherungsdatei vom Computer wählen","Clear cache":"Cache leeren","Close":"Schließen","Color":"Farbe","Comment":"Kommentar","Commit hash":"Hash übertragen","Confirm":"Bestätigen","Confirm your wallet recovery phrase":"Bestätigen Sie Ihre Wallet-Wiederherstellungsphrase","Confirmations":"Bestätigungen","Congratulations!":"Herzlichen Glückwunsch!","Connecting to Coinbase...":"Verbinde mit Coinbase...","Connecting to Glidera...":"Verbinde mit Glidera...","Connection reset by peer":"Verbindung von Peer zurückgesetzt","Continue":"Weiter","Copayer already in this wallet":"Copayer nimmt bereits teil","Copayer already voted on this spend proposal":"Copayer hat schon für diesen Zahlungsvorschlag angestimmt","Copayer data mismatch":"Copayer Datenkonflikt","Copayers":"Copayer","Copied to clipboard":"In die Zwischenablage kopiert","Copy this text as it is to a safe place (notepad or email)":"Diesen Text an einem sichern Ort einfügen (Notepad oder E-Mail)","Copy to clipboard":"In die Zwischenablage kopieren","Could not access the wallet at the server. Please check:":"Kein Zugriff auf Wallet des Servers. Überprüfen Sie bitte:","Could not access wallet":"Auf Wallet konnte nicht zugegriffen werden","Could not access Wallet Service: Not found":"Auf den Wallet-Dienst konnte nicht zugegriffen werden: Nicht gefunden","Could not broadcast payment":"Zahlung konnte nicht gesendet werden","Could not build transaction":"Transaktion konnte nicht erstellt werden","Could not create address":"Adresse konnte nicht erstellt werden","Could not create payment proposal":"Es kann kein Zahlungsvorschlag erzeugt werden","Could not create using the specified extended private key":"Erzeugung mit erweiterten privaten Schlüssel nicht möglich","Could not create using the specified extended public key":"Erzeugung mit dem angegebenen erweiterten öffentlichen Schlüssel nicht möglich","Could not create: Invalid wallet recovery phrase":"Wallet-Wiederherstellungsphrase nicht gültig","Could not decrypt file, check your password":"Datei konnte nicht entschlüsselt werden, bitte das Passwort überprüfen","Could not delete payment proposal":"Zahlungsvorschlag konnte nicht gelöscht werden","Could not fetch payment information":"Zahlungsinformationen können nicht abgerufen werden","Could not get fee value":"Gebühr konnte nicht ermittelt werden","Could not import":"Import nicht möglich","Could not import. Check input file and spending password":"Import nicht möglich. Bitte Datei und Berechtigungscode überprüfen","Could not join wallet":"Beteiligung am Wallet nicht möglich","Could not recognize a valid Bitcoin QR Code":"Es konnte kein gültiger Bitcoin-QR-Code erkannt werden","Could not reject payment":"Zahlung konnte nicht abgelehnt werden","Could not send payment":"Zahlung kann nicht gesendet werden","Could not update Wallet":"Wallet kann nicht aktualisiert werden","Create":"Erzeugen","Create {{requiredCopayers}}-of-{{totalCopayers}} wallet":"Ein {{requiredCopayers}}-von-{{totalCopayers}} Wallet erzeugen","Create new wallet":"Neues Wallet erzeugen","Create, join or import":"NEU | TEILNAHME | IMPORT","Created by":"Erstellt von","Creating transaction":"Transaktion erstellen","Creating Wallet...":"Wallet erstellen...","Current fee rate for this policy: {{fee.feePerKBUnit}}/kiB":"Aktuelle Gebühr für dieses Einstellung: {{fee.feePerKBUnit}}/KiB","Czech":"Tschechisch","Date":"Datum","Decrypting a paper wallet could take around 5 minutes on this device. please be patient and keep the app open.":"Das Entschlüsseln eines Paperwallets kann auf diesem Gerät bis zu 5 Minuten dauern. Bitte abwarten und die App nicht beenden.","Delete it and create a new one":"Löschen und neues Wallet erzeugen","Delete Payment Proposal":"Zahlungsvorschlag löschen","Delete recovery phrase":"Wiederherstellungsphrase löschen","Delete Recovery Phrase":"Wiederherstellungsphrase löschen","Delete wallet":"Wallet löschen","Delete Wallet":"Wallet löschen","Deleting Wallet...":"Wallet wird gelöscht...","Derivation Path":"Ableitungsstruktur","Derivation Strategy":"Ableitungstrategie","Description":"Beschreibung","Details":"Details","Disabled":"Deaktiviert","Do not include private key":"Den privaten Schlüssel nicht einbeziehen","Don't see your language on Crowdin? Contact the Owner on Crowdin! We'd love to support your language.":"Wird deine Sprache auf Crowdin nicht angezeigt? Kontaktiere den Support von Crowdin, denn wir würden deine Sprache gerne hinzufügen.","Done":"Fertig","Download":"Herunterladen","Economy":"Wirtschaftlich","Edit":"Bearbeiten","Edit comment":"Kommentar bearbeiten","Edited by":"Editiert von","Email for wallet notifications":"E-Mail für Wallet Benachrichtigungen","Email Notifications":"Benachrichtigunen per E-Mail","Empty addresses limit reached. New addresses cannot be generated.":"Obergrenze für leere Adressen erreicht. Neue Adressen können nicht generiert werden.","Enable Coinbase Service":"Coinbase-Dienst aktivieren","Enable Glidera Service":"Glidera-Dienst aktivieren","Enable push notifications":"Pushbenachrichtigungen aktivieren","Encrypted export file saved":"Verschlüsselte Exportdatei gespeichert","Enter the recovery phrase (BIP39)":"Wiederherstellungsphrase eingeben (BIP39)","Enter your password":"Passwort eingeben","Enter your spending password":"Berechtigungscode eingeben","Error at Wallet Service":"Fehler beim Wallet-Dienst","Error creating wallet":"Fehler beim Erstellen des Wallets","Expired":"Abgelaufen","Expires":"Gültig bis","Export options":"Export-Optionen","Export to file":"In eine Datei exportieren","Export Wallet":"Wallet exportieren","Exporting via QR not supported for this wallet":"Für diese Wallet ist Export per QR nicht unterstützt","Extended Public Keys":"Erweiterte öffentliche Schlüssel","Extracting Wallet Information...":"Entpacke Wallet...","Failed to export":"Fehler beim Exportieren","Failed to verify backup. Please check your information":"Die Überprüfung der Sicherung ist gescheitert. Bitte überprüfen Sie Ihre Angaben","Family vacation funds":"Familienurlaub","Fee":"Gebühr","Fetching Payment Information":"Zahlungsinformationen abrufen","File/Text":"Datei/Text","Finger Scan Failed":"Abtasten des Fingerabdrucks gescheitert","Finish":"Beenden","For audit purposes":"Zur Kontrolle","French":"Français","From the destination device, go to Add wallet &gt; Import wallet and scan this QR code":"Gehen Sie auf Wallet Hinzufügen &gt; Wallet Importieren von dem Zielgerät und scannen Sie diesen QR-Code","Funds are locked by pending spend proposals":"Beträge sind durch ausstehende Zahlungsvorschläge gesperrt","Funds found":"Beträge gefunden","Funds received":"Beträge empfangen","Funds will be transferred to":"Beträge werden überwiesen an","Generate new address":"Neue Adresse erzeugen","Generate QR Code":"QR-Code generieren","Generating .csv file...":"CSV-Datei erzeugen...","German":"Deutsch","Getting address for wallet {{selectedWalletName}} ...":"Ermittle die Adresse des Wallets {{selectedWalletName}}...","Global preferences":"Globale Einstellungen","Hardware wallet":"Hardware-Wallet","Hardware Wallet":"Hardware-Wallet","Hide advanced options":"Erweiterte Optionen ausblenden","I affirm that I have read, understood, and agree with these terms.":"Ich bestätige, dass ich diese Bedingungen gelesen habe, diese verstehe und diesen zustimme.","I AGREE. GET STARTED":"Ich stimme zu. Lege los!","Import":"Import","Import backup":"Importiere Sicherung","Import wallet":"Wallet importieren","Importing Wallet...":"Wallet wird importiert...","In no event shall the authors of the software, employees and affiliates of Bitpay, copyright holders, or BitPay, Inc. be held liable for any claim, damages or other liability, whether in an action of contract, tort, or otherwise, arising from, out of or in connection with the software.":"Die Autoren der Software, Mitarbeiter und Partner von Bitpay, Inhaber von Urheberrechten oder Bitpay Inc., haften in keinem Fall für Schäden oder Ansprüche, die sich im Rahmen einer Klage zum Vertrag, unerlaubter Handlung, auf andere Weise oder aus bzw. im Zusammenhang mit der Software ergeben.","In order to verify your wallet backup, please type your password:":"Um die Sicherung der Wallet zu überprüfen, geben Sie bitte Ihr Passwort ein:","Incorrect address network":"Falsche Netzwerk-Adresse","Incorrect code format":"QR code hat falsches Format","Insufficient funds":"Nicht ausreichendes Guthaben","Insufficient funds for fee":"Nicht ausreichendes Guthaben für die Gebühr","Invalid":"Ungültig","Invalid account number":"Ungültige Kontonummer","Invalid address":"Ungültige Adresse","Invalid derivation path":"Ungültige Ableitungsstruktur","Invitation to share a Copay Wallet":"Einladung zum Copay-Wallet teilen","Italian":"Italienisch","Japanese":"日本語","John":"Sascha","Join":"Teilnehmen","Join my Copay wallet. Here is the invitation code: {{secret}} You can download Copay for your phone or desktop at https://copay.io":"Copay Wallet beitreten. Hier ist der Einladungscode: {{secret}} Die Desktopversion oder die App fürs Handy kann auf https://copay.io heruntergeladen werden","Join shared wallet":"Gemeinschaftliches Wallet","Joining Wallet...":"Teilnahme am Wallet einrichten...","Key already associated with an existing wallet":"Schlüssel ist bereits mit einem existierenden Wallet verbunden","Label":"Beschreibung","Language":"Sprache","Last Wallet Addresses":"Letzte Wallet-Adressen","Learn more about Copay backups":"Erfahren Sie mehr über Copay-Sicherungen","Loading...":"Lade...","locked by pending payments":"durch ausstehende Zahlungen gesperrt","Locktime in effect. Please wait to create a new spend proposal":"Zeitsperre aktiv. Bitte mit neuem Zahlungsvorschlag warten","Locktime in effect. Please wait to remove this spend proposal":"Zeitsperre aktiv. Bitte auf die Entfernung des Zahlungsvorschlags warten","Make a payment to":"Sende eine Zahlung an","Matches:":"Übereinstimmungen:","me":"Ich","Me":"Ich","Memo":"Notiz","Merchant message":"Händlernachricht","Message":"Nachricht","Missing parameter":"Angabe fehlt","Missing private keys to sign":"Zum Signieren fehlen die privaten Schlüssel","Moved":"Verschoben","Multiple recipients":"Mehrere Empfänger","My Bitcoin address":"Eigene Bitcoinadresse","My contacts":"Meine Kontakte","My wallets":"Meine Wallets","Need to do backup":"Zuerst ist eine Sicherung notwendig","Network":"Netzwerk","Network connection error":"Netzwerkverbindungsfehler","New Payment Proposal":"Neue Zahlungsvorschlag","New Random Recovery Phrase":"Neue zufällige Wiederherstellungsphrase","No hardware wallets supported on this device":"Hardware-Wallets werden auf diesem Gerät nicht unterstützt","No transactions yet":"Noch keine Transaktionen","Normal":"Normal","Not authorized":"Nicht berechtigt","Not completed":"Nicht abgeschlossen","Not enough funds for fee":"Das Guthaben reicht nicht für die Gebühr","Not valid":"Nicht gültig","Note":"Notiz","Note: a total of {{amountAboveMaxSizeStr}} were excluded. The maximum size allowed for a transaction was exceeded":"Hinweis: insgesamt wurden {{amountAboveMaxSizeStr}} ausgeschlossen. Die maximale Größe für eine Transaktion wurde überschritten","Note: a total of {{amountBelowFeeStr}} were excluded. These funds come from UTXOs smaller than the network fee provided.":"Hinweis: insgesamt {{amountBelowFeeStr}} wurden ausgeschlossen. Diese Gelder stammen aus UTXOs, die kleiner sind als die Netzwerkgebühr.","NOTE: To import a wallet from a 3rd party software, please go to Add Wallet &gt; Create Wallet, and specify the Recovery Phrase there.":"Hinweis: Um eine Brieftasche aus einer 3rd-Party-Software zu importieren, gehen Sie bitte auf Wallet Hinzufügen &gt; Wallet Importieren, und geben Sie die Wiederhestellungsphrase ein.","Official English Disclaimer":"Offizieller englischer Haftungsausschluss","OKAY":"Okay","Once you have copied your wallet recovery phrase down, it is recommended to delete it from this device.":"Sobald Sie Ihre Wallet-Wiederherstellungsphrase kopiert haben, wird empfohlen, diese vom Gerät zu löschen.","Only Main (not change) addresses are shown. The addresses on this list were not verified locally at this time.":"Nur die Haupt (unveränderbaren) Adressen werden angezeigt. Die Adressen in dieser Liste sind momentan noch nicht lokal überprüft.","Open Settings app":"Einstellungen öffnen","optional":"zusätzlich","Paper Wallet Private Key":"Privater Schlüssel des Paperwallets","Participants":"Teilnehmer","Passphrase":"Passphrase","Password":"Passwort","Password required. Make sure to enter your password in advanced options":"Passwort erforderlich. Geben Sie Ihr Passwort in den erweiterten Optionen ein","Paste invitation here":"Einladung hier einfügen","Paste the backup plain text code":"Den Klartext der Sicherung einfügen","Paste your paper wallet private key here":"Privaten Schlüssel des Paperwallets hier einfügen","Pasted from clipboard":"Aus der Zwischenablage eingefügt","Pay To":"Zahle an","Payment Accepted":"Zahlung angenommen","Payment accepted, but not yet broadcasted":"Zahlung akzeptiert, aber noch nicht übermittelt","Payment accepted. It will be broadcasted by Glidera. In case there is a problem, it can be deleted 6 hours after it was created.":"Zahlung akzeptiert. Sie wird durch Glidera übermittelt. Falls ein Problem auftritt, kann sie nach einer Wartezeit von 6 Stunden gelöscht werden.","Payment details":"Zahlungsdetails","Payment expires":"Zahlung läuft ab","Payment Proposal":"Zahlungsvorschlag","Payment Proposal Created":"Zahlungsvorschlag erstellt","Payment Proposal Rejected":"Zahlungsvorschlag abgelehnt","Payment Proposal Rejected by Copayer":"Zahlungsvorschlag wurde vom Copayer abgelehnt","Payment Proposal Signed by Copayer":"Zahlungsvorschlag wurde vom Copayer abgezeichnet","Payment Proposals":"Zahlungsvorschläge","Payment Protocol Invalid":"Ungültiges Zahlungsprotokoll","Payment Protocol not supported on Chrome App":"Zahlungsprotokoll wird nicht von der Chrome App unterstützt","Payment Rejected":"Zahlung abgelehnt","Payment request":"Zahlungsanforderung","Payment Sent":"Zahlung gesendet","Payment to":"Zahlung an","Pending Confirmation":"Ausstehende Bestätigung","Permanently delete this wallet. THIS ACTION CANNOT BE REVERSED":"Wallet dauerhaft löschen. DIESE AKTION KANN NICHT RÜCKGÄNGIG GEMACHT WERDEN","Personal Wallet":"Persönliches Wallet","Please enter the recovery phrase":"Bitte geben Sie die Wiederherstellungsphrase ein","Please enter the required fields":"Bitte die benötigten Felder ausfüllen","Please enter the wallet recovery phrase":"Bitte geben Sie die Wallet-Wiederherstellungsphrase ein","Please tap the words in order to confirm your backup phrase is correctly written.":"Bitte tippen Sie auf die Wörter, um zu bestätigen, dass Ihre Backup-Phrase richtig geschrieben ist.","Please upgrade Copay to perform this action":"Bitte Copay aktualisieren, um diese Aktion auszuführen","Please wait to be redirected...":"Bitte warten Sie bis Sie umgeleitet werden...","Please, select your backup file":"Bitte die Sicherungsdatei wählen","Polish":"Polnisch","Preferences":"Einstellungen","Preparing backup...":"Sicherung wird vorbereitet...","preparing...":"in Arbeit...","Press again to exit":"Zum Beenden erneut drücken","Priority":"höchste Priorität","Private key is encrypted, cannot sign":"Der private Schlüssel ist verschlüsselt, signieren ist nicht möglich","Push notifications for Copay are currently disabled. Enable them in the Settings app.":"Pushbenachrichtigungen für Copay sind derzeit deaktiviert. Aktivieren sie Sie in den Einstellungen.","QR Code":"QR-Code","QR-Scanner":"QR-Scanner","Receive":"Empfangen","Received":"Empfangen","Recipients":"Empfänger","Recovery Phrase":"Wiederherstellungsphrase","Recovery phrase deleted":"Wiederherstellungsphrase gelöscht","Recreate":"Wiederherstellen","Recreating Wallet...":"Wallet wiederherstellen...","Reject":"Ablehnen","Release Information":"Information zur Veröffentlichung","Remove":"Entfernen","Repeat password":"Passwort wiederholen","Repeat the password":"Passwort wiederholen","Repeat the spending password":"Berechtigungscode wiederholen","Request a specific amount":"Einen bestimmten Betrag anfordern","Request Spending Password":"Berechtigungscode abfragen","Required":"Benötigt","Required number of signatures":"Erforderliche Anzahl von Signaturen","Retrieving inputs information":"Eingänge werden abgerufen","Russian":"Pусский","Save":"Speichern","Scan addresses for funds":"Adresse auf neue Beträge überprüfen","Scan Fingerprint":"Fingerabdruck scannen","Scan Finished":"Überprüfung abgeschlossen","Scan status finished with error":"Überprüfung wurde mit Fehlern beendet","Scan Wallet Funds":"Prüfe Beträge des Wallets","Scan your fingerprint please":"Scannen Sie bitte Ihren Fingerabdruck","Scanning Wallet funds...":"Prüfe Wallet auf neue Beträge...","Search transactions":"Transaktionen durchsuchen","Search Transactions":"Transaktionen durchsuchen","Security preferences":"Sicherheitseinstellungen","See it on the blockchain":"Im Blockchain anzeigen","Select a backup file":"Eine Sicherungsdatei auswählen","Select a wallet":"Wallet wählen","Self-signed Certificate":"Selbstsigniertes Zertifikat","Send":"Senden","Send addresses by email":"Adressen per e-Mail versenden","Send bitcoin":"Bitcoins senden","Send by email":"Per E-Mail versenden","Send Max":"Alles senden","Sending":"Senden","Sending transaction":"Sende Transaktion","Sent":"Gesendet","Server response could not be verified":"Antwort des Servers konnte nicht verifiziert werden","Session log":"Sitzungsprotokoll","SET":"EINRICHTEN","Set default url":"Festlegen der Standard-URL","Set up a password":"Passwort einrichten","Set up a spending password":"Berechtigungscode einrichten","Setting up email notifications could weaken your privacy, if the wallet service provider is compromised. Information available to an attacker would include your wallet addresses and its balance, but no more.":"Das Einrichten einer E-Mail Benachrichtigung schwächt die Privatsphäre, wenn der Wallet Service Anbieter kompromittiert wurde. Der Angreifer  kann jedoch nur Wallet Adresse und Guthaben erfahren, mehr nicht.","Settings":"Einstellungen","Share address":"Adresse teilen","Share invitation":"Einladung teilen","Share this invitation with your copayers":"Einladung mit Copayern teilen","Share this wallet address to receive payments":"Geben Sie diese Adresse weiter um Zahlungen zu erhalten","Share this wallet address to receive payments. To protect your privacy, new addresses are generated automatically once you use them.":"Um Zahlungen zu empfangen, die hier angegebene Adresse teilen. Um die Privatsphäre zu schützen wird nach jeder Nutzung eine neue Adresse erzeugt.","Shared Wallet":"Wallet teilen","Show advanced options":"Erweiterte Optionen anzeigen","Signatures rejected by server":"Signaturen wurden vom Server abgelehnt","Signing transaction":"Unterschreibe Transaktion","Single Address Wallet":"Wallet mit einer einzigen Adresse","Spanish":"Español","Specify Recovery Phrase...":"Wiederherstellungsphrase angeben...","Spend proposal is not accepted":"Zahlungsvorschlag wurde nicht akzeptiert","Spend proposal not found":"Zahlungsvorschlag wurde nicht gefunden","Spending Password needed":"Berechtigungscode erforderlich","Spending Passwords do not match":"Berechtigungscodes stimmen nicht überein","Success":"Erfolgreich","Super Economy":"Niedrigste Priorität","Sweep paper wallet":"Paperwallet löschen","Sweep Wallet":"Wallet löschen","Sweeping Wallet...":"Leere Wallet...","Tap and hold to show":"Anzeigen durch tippen und halten","Tap to retry":"Zum Wiederholen antippen","Terms of Use":"Nutzungsbedingungen","The authors of the software, employees and affiliates of Bitpay, copyright holders, and BitPay, Inc. cannot retrieve your private keys or passwords if you lose or forget them and cannot guarantee transaction confirmation as they do not have control over the Bitcoin network.":"Die Autoren der Software, Mitarbeiter und Partner von Bitpay, Inhaber von Urheberrechten und BitPay, Inc. können nicht Ihre privaten Schlüssel oder Kennwörter abrufen, wenn diese verloren gehen oder vergessen werden und können die Durchführung von Transaktionen, auch nach Bestätigungen, nicht garantieren, da sie keine Kontrolle über das Bitcoin-Netzwerk haben.","The derivation path":"Die Ableitungsstruktur","The Ledger Chrome application is not installed":"Die Chrome-Anwendung für Ledger ist nicht installiert","The password of the recovery phrase (if set)":"Das Passwort der Wiederherstellungsphrase (wenn eingestellt)","The payment was created but could not be completed. Please try again from home screen":"Die Zahlung wurde erzeugt, kann aber nicht abgeschlossen werden. Bitte erneut über die Startseite versuchen","The payment was removed by creator":"Die Zahlung wurde vom Ersteller entfernt","The recovery phrase could require a password to be imported":"Um die Wiederherstellungsphrase zu importieren könnte ein Passwort nötig sein","The request could not be understood by the server":"Die Anforderung konnte nicht vom Server interpretiert werden","The software does not constitute an account where BitPay or other third parties serve as financial intermediaries or custodians of your bitcoin.":"Die Software erzeugt kein Benutzerkonto, bei dem Bitpay oder sonstige Dritte als Finanzvermittler oder Verwalter der Bitcoin fungieren.","The software you are about to use functions as a free, open source, and multi-signature digital wallet.":"Die Software, die genutzt werden soll, fungiert als freies, quelloffenes und digitales mehrfachunterschriften Wallet.","The spend proposal is not pending":"Der Zahlungsvorschlag ist nicht ausstehend","The wallet \"{{walletName}}\" was deleted":"Wallet \"{{walletName}}\" wurde gelöscht","The Wallet Recovery Phrase could require a password to be imported":"Um die Wiederherstellungsphrase zu importieren könnte ein Passwort nötig sein","The wallet service URL":"Die URL des Wallet-Diensts","There are no wallets to make this payment":"Es gibt keine Wallets, um diese Zahlung auszuführen","There is a new version of Copay. Please update":"Es gibt eine neue Version von Copay. Bitte aktualisieren","There is an error in the form":"Es ist ein Fehler im Formular aufgetreten","This recovery phrase was created with a password. To recover this wallet both the recovery phrase and password are needed.":"Diese Wiederherstellungsphrase entstand mit einem Passwort. Zur Wiederherstellung der Wallet sind die Wiederherstellungsphrase und das Passwort erforderlich.","This transaction has become invalid; possibly due to a double spend attempt.":"Diese Transaktion ist wurde ungültig; dies kann durch eine versuchte Doppelzahlung verursacht worden sein.","This wallet is not registered at the given Bitcore Wallet Service (BWS). You can recreate it from the local information.":"Dieses Wallet ist nicht beim angegebenen Bitcore Wallet Service (BWS) registriert. Bitte aus den lokalen Informationen wiederherstellen","Time":"Zeit","To":"An","To restore this {{index.m}}-{{index.n}} <b>shared</b> wallet you will need":"Voraussetzungen um dieses <b>geteilte</b> {{index.m}}-{{index.n}} Wallet wiederherzustellen","To the fullest extent permitted by law, this software is provided “as is” and no representations or warranties can be made of any kind, express or implied, including but not limited to the warranties of merchantability, fitness or a particular purpose and noninfringement.":"Unter voller Ausschöpfung geltenden Rechts wird diese Software \"wie besehen\" zur Verfügung gestellt ohne irgendwelche Zusicherungen oder Gewährleistungen aller Art, ausdrücklich oder stillschweigend, einschließlich aber nicht beschränkt auf Garantien der Handelstauglichkeit, Brauchbarkeit oder eines bestimmten Zwecks oder der Nichtverletzung der Rechte Dritter.","too long!":"zu lang!","Total Locked Balance":"Ingesamt gesperrter Gesamtsaldo","Total number of copayers":"Gesamtanzahl der Copayer","Touch ID Failed":"Touch-ID gescheitert","Transaction":"Transaktion","Transaction already broadcasted":"Transaktion wurde bereits übermittelt","Transaction History":"Transaktionsverlauf","Translation Credits":"Danksagung an die Übersetzer","Translators":"Übersetzer","Try again":"Nochmal versuchen","Type the Recovery Phrase (usually 12 words)":"Wiederherstellungsphrase eingeben (in der Regel 12 Wörter)","Unconfirmed":"Unbestätigt","Unit":"Währungseinheit","Unsent transactions":"Nicht vesendete Transaktionen","Updating transaction history. Please stand by.":"Aktualisieren des Transaktionsverlaufs. Bitte warten.","Updating Wallet...":"Wallet aktualisieren...","Use Unconfirmed Funds":"Unbestätigte Mittel einsetzen","Validating recovery phrase...":"Überprüfe Wiederherstellungsphrase...","Validating wallet integrity...":"Überprüfe Wallet-Integrität...","Version":"Version","View":"Ansicht","Waiting for copayers":"Warte auf copayer","Waiting for Ledger...":"Warte auf Ledger...","Waiting for Trezor...":"Warte auf Trezor...","Waiting...":"Warte...","Wallet already exists":"Wallet exstiert bereits","Wallet already in Copay":"Wallet ist bereits in Copay","Wallet Configuration (m-n)":"Wallet-Konfiguration (m-n)","Wallet Export":"Wallet-Export","Wallet Id":"Wallet-Id","Wallet incomplete and broken":"Wallet unvollständig oder defekt","Wallet Information":"Wallet-Informationen","Wallet Invitation":"Wallet Einladung","Wallet Invitation is not valid!":"Wallet Einladung nicht gültig!","Wallet is full":"Maximale Teilnehmerzahl erreicht","Wallet is locked":"Wallet ist gesperrt","Wallet is not complete":"Wallet ist unvollständig","Wallet name":"Name des Wallets","Wallet Name (at creation)":"Wallet-Name (bei der Erzeugung)","Wallet needs backup":"Wallet braucht Sicherung","Wallet Network":"Wallet-Netzwerk","Wallet not found":"Wallet nicht gefunden","Wallet not registered at the wallet service. Recreate it from \"Create Wallet\" using \"Advanced Options\" to set your recovery phrase":"Wallet ist nicht beim Wallet-Service registiert. Neu erzeugen mit \"Neues Wallet erzeugen\" und \"Erweiterte Optionen\" um die Wiederherstellungsphrase anzugeben","Wallet Preferences":"Wallet Voreinstellungen","Wallet Recovery Phrase":"Wallet-Wiederherstellungsphrase","Wallet Recovery Phrase is invalid":"Wallet-Wiederherstellungsphrase ist ungültig","Wallet recovery phrase not available. You can still export it from Advanced &gt; Export.":"Wallet-Wiederherstellungsphrase ist nicht verfügbar. Export über Erweitert &gt; Wallet exportieren ist noch möglich.","Wallet service not found":"Wallet-Dienst nicht gefunden","WARNING: Key derivation is not working on this device/wallet. Actions cannot be performed on this wallet.":"Warnung: Ableitung der Schlüssel funktioniert nicht auf diesem Gerät/Wallet. Aktionen können nicht mit dieser Wallet durchgeführt werden.","WARNING: Not including the private key allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.":"WARNUNG: Ohne das Hinzufügen des privaten Schlüssels, ist es möglich das Guthaben und die Transaktionshistorie einzusehen, sowie Zahlungsvorschläge zu erzeugen. Allerdings können Vorschläge nicht ausgeführt (unterschrieben) werden und es ist <b>kein Zugriff auf Guthaben möglich</b>.","WARNING: The password cannot be recovered. <b>Be sure to write it down</b>. The wallet can not be restored without the password.":"Warnung: Das Passwort kann nicht wiederhergestellt werden. <b>Achten Sie darauf, es aufzuschreiben</b>. Das Wallet kann nicht ohne das Passwort wiederhergestellt werden.","WARNING: The private key of this wallet is not available. The export allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.":"WARNUNG: Der private Schlüssel ist nicht verfügbar. Dieser Export ermöglicht das Guthaben und die Transaktionshistorie zu prüfen, sowie Zahlungsvorschläge zu erzeugen. Allerdings können Vorschläge nicht ausgeführt (unterschrieben) werden und so ist <b>kein Zugriff auf Guthaben möglich</b>.","Warning: this transaction has unconfirmed inputs":"Warnung: Diese Transaktion hat unbestätigte Eingänge","WARNING: UNTRUSTED CERTIFICATE":"WARNUNG: NICHT VERTRAUENSWÜRDIGES ZERTIFIKAT","WARNING: Wallet not registered":"WARNUNG: Wallet nicht registriert","Warning!":"Warnung!","We reserve the right to modify this disclaimer from time to time.":"Wir behalten uns das Recht vor, diese Erklärung von Zeit zu Zeit zu ändern.","WELCOME TO COPAY":"Willkommen bei COPAY","While the software has undergone beta testing and continues to be improved by feedback from the open-source user and developer community, we cannot guarantee that there will be no bugs in the software.":"Solange sich diese Software im Betastadium befindet und weiterhin durch Feedback der Open-Source Nutzer und Entwickler-Community verbessert wird, können wir nicht garantieren, dass diese frei von Fehlern ist.","Write your wallet recovery phrase":"Wallet-Wiederherstellungsphrase notieren","Wrong number of recovery words:":"Falsche Anzahl von Wiederherstellungswörtern:","Wrong spending password":"Falscher Berechtigungscode","Yes":"Ja","You acknowledge that your use of this software is at your own discretion and in compliance with all applicable laws.":"Sie bestätigen, die Software nach eigenem Ermessen und in Übereinstimmung der anwendbaren Gesetze zu verwenden.","You are responsible for safekeeping your passwords, private key pairs, PINs and any other codes you use to access the software.":"Sie sind verantwortlich für die Verwahrung Ihrer Kennwörter, privaten Schlüsselpaaren, PINs und anderen Codes, die zum Zugriff auf die Software verwendet werden.","You assume any and all risks associated with the use of the software.":"Sie übernehmen allen Risiken im Zusammenhang mit der Nutzung der Software.","You backed up your wallet. You can now restore this wallet at any time.":"Sie haben Ihre Wallet gesichert. Sie können sie nun jederzeit wiederherstellen.","You can safely install your wallet on another device and use it from multiple devices at the same time.":"Das Wallet kann sicher auf einem anderen Gerät installiert und von mehreren Geräten gleichzeitig verwendet werden.","You do not have any wallet":"Kein Wallet vorhanden","You need the wallet recovery phrase to restore this personal wallet. Write it down and keep them somewhere safe.":"Sie benötigen die Wallet-Wiederherstellungsphrase, um Ihre persönliche Wallet wiederherzustellen. Schreiben Sie sie auf und bewahren Sie sie an einem sicheren Ort auf.","Your nickname":"Name des Teilnehmers","Your password":"Passwort","Your spending password":"Ihr Berechtigungscode","Your wallet has been imported correctly":"Das Wallet wurde korrekt importiert","Your wallet key will be encrypted. The Spending Password cannot be recovered. Be sure to write it down":"Ihr Wallet wird verschlüsselt werden. Der Berechtigungscode kann nicht wiederhergestellt werden. Achten Sie darauf, ihn aufzuschreiben","Your wallet recovery phrase and access to the server that coordinated the initial wallet creation. You still need {{index.m}} keys to spend.":"Die Wallet-Wiederherstellungsphrase und der Zugriff auf den Server, die die Wallet ursprünglich erzeugten. Es werden noch {{index.m}} Schlüssel benötigt."});
    gettextCatalog.setStrings('el', {"(possible double spend)":"(πιθανό διπλό ξόδεμα)","(Trusted)":"(Εμπιστευτικό)","[Balance Hidden]":"[Υπόλοιπο Κρυμένο]","{{fee}} will be deducted for bitcoin networking fees":"{{fee}}, θα προεξοφληθεί ώς τέλος του δικτύου bitcoin","{{feeRateStr}} of the transaction":"{{feeRateStr}} της συναλλαγής","{{index.m}}-of-{{index.n}}":"{{index.m}}-του-{{index.n}}","{{index.result.length - index.txHistorySearchResults.length}} more":"{{index.result.length - index.txHistorySearchResults.length}} περισσότερα","{{index.txProgress}} transactions downloaded":"{{index.txProgress}} οι συναλλαγές μεταφορτώθηκαν","{{item.m}}-of-{{item.n}}":"{{item.m}}-του-{{item.n}}","* A payment proposal can be deleted if 1) you are the creator, and no other copayer has signed, or 2) 24 hours have passed since the proposal was created.":"Μια πρόταση πληρωμής μπορεί να διαγραφεί εάν 1) είστε ο δημιουργός, και κανένας άλλος χρήστης του copay δεν έχει υπογράψει, ή 2) έχουν περάσει 24 ώρες απο την ώρα που η πρόταση δημιουργήθηκε.","<b>IF YOU LOSE ACCESS TO YOUR COPAY WALLET OR YOUR ENCRYPTED PRIVATE KEYS AND YOU HAVE NOT SEPARATELY STORED A BACKUP OF YOUR WALLET AND CORRESPONDING PASSWORD, YOU ACKNOWLEDGE AND AGREE THAT ANY BITCOIN YOU HAVE ASSOCIATED WITH THAT COPAY WALLET WILL BECOME INACCESSIBLE.</b>":"<b>ΕΑΝ ΧΑΣΕΤΕ ΤΗΝ ΠΡΟΣΒΑΣΗ ΝΑ ΣΑΣ ΣΤΟ ΠΟΡΤΟΦΌΛΙ COPAY Ή ΣΤΑ ΚΡΥΠΤΟΓΡΑΦΗΜΕΝΑ ΙΔΙΩΤΙΚΑ ΣΑΣ ΚΛΕΙΔΙΑ ΚΑΙ ΔΕΝ ΑΠΟΘΗΚΕΥΣΑΤΕ ΧΩΡΙΣΤΆ ΕΝΑ ΑΝΤΙΓΡΑΦΟ ΑΣΦΑΛΕΙΑΣ ΤΟΥ ΠΟΡΤΟΦΟΛΙΟΥ ΚΑΙ ΤΟΥ ΑΝΤΙΣΤΟΙΧΟΥ ΚΩΔΙΚΟΥ ΠΡΌΣΒΑΣΗΣ, ΑΠΟΔΕΧΕΣΤΕ ΚΑΙ ΣΥΜΦΩΝΕΙΤΕ ΟΤΙ ΟΠΟΙΑΔΗΠΟΤΕ ΠΟΣΟΤΗΤΑ BITCOIN ΠΟΥ ΕΧΕΤΕ ΣΥΣΧΕΤΙΣΕΙ ΜΕ ΤΟ ΠΟΡΤΟΦΟΛΙ ΤΟΥ COPAY ΘΑ ΓΙΝΟΥΝ ΑΠΡΟΣΠΕΛΑΣΤΑ.</b>","A multisignature bitcoin wallet":"Ένα πορτοφόλι bitcoin με δυνατότητα πολλαπλών υπογραφών","About Copay":"Σχετικά με το Copay","Accept":"Αποδοχή","Account":"Λογαριασμός","Account Number":"Αριθμός λογαριασμού","Activity":"Δραστηριότητα","Add a new entry":"Προσθέστε Καταχώρηση","Add a Password":"Προσθέστε Κωδικό","Add an optional password to secure the recovery phrase":"Προσθέστε προαιρετικό κωδικό για να ασφαλίσετε τη φράση επαναφοράς","Add comment":"Προσθήκη σχολίου","Add wallet":"Προσθήκη Πορτοφολιού","Address":"Διεύθυνση","Address Type":"Τύπος Διεύθυνσης","Advanced":"Για προχωρημένους","Alias":"Ψευδώνυμο","Alias for <i>{{index.walletName}}</i>":"Ψευδώνυμο για <i>{{index.walletName}}</i>","All contributions to Copay's translation are welcome. Sign up at crowdin.com and join the Copay project at":"Όλες οι εισηγήσεις στην μετάφραση του Copay είναι ευπρόσδεκτες. Εγγραφείτε στο crowdin.com για να συμμετάσχετε στο έργο Copay","All transaction requests are irreversible.":"Όλες οι αιτήσεις για συναλλαγές είναι αμετάκλητες.","Alternative Currency":"Εναλλακτικό Νόμισμα","Amount":"Ποσό","Amount below minimum allowed":"Ποσό χαμηλότερο από το κατώτερο επιτρεπόμενο","Amount in":"Ποσό εισόδου","Are you sure you want to delete the recovery phrase?":"Σίγουρα θέλετε να σβήσετε τη φράση επαναφοράς;","Are you sure you want to delete this wallet?":"Είσαι σίγουρος ότι θέλετε να διαγράψετε αυτό το πορτοφόλι?","Auditable":"Ελέγξιμο","Available Balance":"Διαθέσιμο Υπόλοιπο","Average confirmation time: {{fee.nbBlocks * 10}} minutes":"Μέσος χρόνος επιβεβαίωσης: {{fee.nbBlocks * 10}} λεπτά","Back":"Πίσω","Backup":"Αντίγραφο Ασφαλείας","Backup failed":"Αποτυχία αντιγράφου επαναφοράς","Backup Needed":"Απαιτείται αντίγραφο επαναφοράς","Backup now":"Πάρτε Αντίγραφο Ασφαλείας τώρα","Bad wallet invitation":"Κακή πρόσκληση πορτοφολιού","Balance By Address":"Υπόλοιπο ανά διεύθυνση","Before receiving funds, you must backup your wallet. If this device is lost, it is impossible to access your funds without a backup.":"Για να μπορέσετε να λάβετε κεφάλαια, πρέπει πρώτα να δημιουργήσετε ένα αντίγραφο ασφαλείας (backup). Στην περίπτωση που χαθεί αυτή η συσκευή, θα είναι αδύνατο να έχετε πρόσβαση στα κεφάλαια σας χωρίς το αντίγραφο ασφαλείας.","BETA: Android Key Derivation Test:":"ΒΕΤΑ: Δοκιμή παραγωγής κλειδιού:","BIP32 path for address derivation":"διαδρομή BIP32 για παραγωγή διεύθυνσης","Bitcoin address":"Διεύθυνση Bitcoin","Bitcoin Network Fee Policy":"Πολιτική Χρέωσης Δικτύου Bitcoin","Bitcoin transactions may include a fee collected by miners on the network. The higher the fee, the greater the incentive a miner has to include that transaction in a block. Current fees are determined based on network load and the selected policy.":"Οι συναλλαγές Bitcoin μπορεί να περιλαμβάνουν μια αμοιβή που εισπράττουν οι miners του δικτύου. Όσο υψηλότερο είναι αυτό το τέλος, τόσο μεγαλύτερο είναι και το κίνητρο ενός miner να συμπεριλάβει αυτή τη συναλλαγή σε ένα block. Οι παρουσιαζόμενη αμοιβή καθορίζεται με βάση το φορτίο του δικτύου και την επιλεγμένη πολιτική.","Bitcoin URI is NOT valid!":"Το σύστημα Bitcoin URI δεν είναι έγκυρο!","Broadcast Payment":"Μετάδοση Πληρωμής","Broadcasting transaction":"Μεταδίδοντας την συναλλαγή","Browser unsupported":"Ο πλοηγός δέν υποστηρίζεται","Calculating fee":"Υπολογισμός αμοιβής","Cancel":"Άκυρο","Cancel and delete the wallet":"Ακύρωση και διαγραφή του πορτοφολιού","Cannot create transaction. Insufficient funds":"Δεν ήταν δυνατή η δημιουργία συναλλαγής. Ανεπαρκή κεφάλαια","Cannot join the same wallet more that once":"Δεν μπορείτε να ενταχθείτε στο ίδιο πορτοφόλι περισσότερες απο μία φορές","Cannot sign: The payment request has expired":"Δεν ήταν δυνατή η υπογραφή: Η αίτηση πληρωμής έχει λήξει","Certified by":"Πιστοποιήθηκε από","Changing wallet alias only affects the local wallet name.":"Αλλάζοντας το ψευδώνυμο του πορτοφολιού επηρεάζει μόνο το τοπικό όνομα πορτοφολιού.","Chinese":"Κινεζικά","Choose a backup file from your computer":"Επιλέξτε ένα αντίγραφο ασφαλείας απο τον υπολογιστή σας","Clear cache":"Εκκαθάριση προσωρινής μνήμης (cache)","Close":"Κλείσιμο","Color":"Χρώμα","Comment":"Σχόλιο","Commit hash":"Δέσμευση λύσης","Confirm":"Επιβεβαίωση","Confirm your wallet recovery phrase":"Επιβεβαιώσετε τη φράση αποκατάστασης για το πορτοφόλι σας","Confirmations":"Επιβεβαιώσεις","Congratulations!":"Συγχαρητήρια!","Connecting to Coinbase...":"Συνδέεται στο Coinbase...","Connecting to Glidera...":"Συνδέεται στο Glidera...","Connection reset by peer":"Επαναφορά σύνδεσης","Continue":"Συνεχίστε","Copayer already in this wallet":"Copayers ήδη σε αυτό το πορτοφόλι","Copayer already voted on this spend proposal":"Copayer που έχουν ήδη ψηφίσει αυτή την πρόταση","Copayer data mismatch":"Ασυμφωνία δεδομένων του copayer","Copayers":"Μέλη του πορτοφολιού Copay","Copied to clipboard":"Αντιγράφηκε στο πρόχειρο","Copy this text as it is to a safe place (notepad or email)":"Αντιγράψτε αυτο το κείμενο ώς έχει σε ασφαλές μέρος (σε εφαρμογή κειμένου ή ηλεκτρονικό ταχυδρομείο)","Copy to clipboard":"Αντιγραφή στο πρόχειρο","Could not access the wallet at the server. Please check:":"Δεν ήταν δυνατή η πρόσβαση στο πορτοφόλι στον διακομιστή. Παρακαλώ ελέγξετε:","Could not access wallet":"Δεν ήταν δυνατή η πρόσβαση στο πορτοφόλι","Could not access Wallet Service: Not found":"Δεν ήταν δυνατή η πρόσβαση στην υπηρεσία του πορτοφολιού: δεν βρέθηκε","Could not broadcast payment":"Δεν μπορέσαμε να μεταδώσουμε την πληρωμή","Could not build transaction":"Δε μπορώ να δημιουργήσω τη συναλλαγή","Could not create address":"Δεν μπορέσαμε να δημιουργήσουμε την διεύθυνση","Could not create payment proposal":"Δεν ήταν δυνατή η δημιουργία πρότασης πληρωμής","Could not create using the specified extended private key":"Δεν ήταν δυνατή η δημιουργία χρησιμοποιώντας το συγκεκριμένο ιδιωτικό κλειδί επέκτασης","Could not create using the specified extended public key":"Δεν ήταν δυνατή η δημιουργία χρησιμοποιώντας το συγκεκριμένο εκτεταμένο δημόσιο κλειδί","Could not create: Invalid wallet recovery phrase":"Δεν ήταν δυνατή η δημιουργία: Μη έγκυρη φράση αποκατάστασης πορτοφολιού","Could not decrypt file, check your password":"Δεν ήταν δυνατή η αποκρυπτογράφηση του αρχείου, ελέγξτε τον κωδικό σας","Could not delete payment proposal":"Δεν είναι δυνατή η διαγραφή της πρότασης πληρωμής","Could not fetch payment information":"Δεν ήταν δυνατή η ανάκτηση των στοιχείων πληρωμής","Could not get fee value":"Δεν ήταν δυνατή η λήψη της αξίας της αμοιβής","Could not import":"Η εισαγωγή απέτυχε","Could not import. Check input file and spending password":"Δεν ήταν δυνατή η εισαγωγή. Ελέγξτε το αρχείο και τον κωδικό πρόσβασης","Could not join wallet":"Δεν μπορείτε να συμμετάσχετε στο πορτοφόλι","Could not recognize a valid Bitcoin QR Code":"Δεν ήταν δυνατή η αναγνώριση ενός έγκυρου κωδικού QR για Βitcoin","Could not reject payment":"Δεν μπορέσαμε να απορρίψουμε την πληρωμή","Could not send payment":"Δεν είναι δυνατή η αποστολή της πληρωμής","Could not update Wallet":"Δεν ήταν δυνατή η ενημέρωση του πορτοφολιού","Create":"Δημιουργία","Create {{requiredCopayers}}-of-{{totalCopayers}} wallet":"Δημιουργία {{requiredCopayers}} των {{totalCopayers}} του πορτοφολιού","Create new wallet":"Δημιουργήστε νέο πορτοφόλι","Create, join or import":"Δημιουργία, συμμετοχή ή εισαγωγή","Created by":"Δημιουργήθηκε από","Creating transaction":"Δημιουργία συναλλαγής","Creating Wallet...":"Δημιουργία του Πορτοφολιού...","Current fee rate for this policy: {{fee.feePerKBUnit}}/kiB":"Σημερινό ποσοστό αμοιβής για αυτήν την πολιτική: {{fee.feePerKBUnit}}/kiB","Czech":"Τσέχικα","Date":"Ημερομηνία","Decrypting a paper wallet could take around 5 minutes on this device. please be patient and keep the app open.":"Η αποκρυπτογράφηση ενός χάρτινου πορτοφολιού μπορεί να πάρει περίπου 5 λεπτά σε αυτή την συσκευή. Κάντε υπομονή και κρατήστε την εφαρμογή ανοικτή.","Delete it and create a new one":"Διαγράψετε το και δημιουργήστε ένα νέο","Delete Payment Proposal":"Διαγράψτε την Πρόταση Πληρωμής","Delete recovery phrase":"Σβήσιμο φράσης επαναφοράς","Delete Recovery Phrase":"Σβήσιμο φράσης επαναφοράς","Delete wallet":"Διαγραφή Πορτοφολιού","Delete Wallet":"Διαγραφή Πορτοφολιού","Deleting Wallet...":"Διαγραφή πορτοφολιού...","Derivation Path":"Διαδρομή παραγωγής","Derivation Strategy":"Στρατηγική παραγωγής","Description":"Περιγραφή","Details":"Λεπτομέρειες","Disabled":"Απενεργοποιημένο","Do not include private key":"Μην συμπεριλάβετε το ιδιωτικό κλειδί","Don't see your language on Crowdin? Contact the Owner on Crowdin! We'd love to support your language.":"Δεν βλέπετε τη γλώσσα σας στο Crowdin; Επικοινωνήστε με τον ιδιοκτήτη στο Crowdin! Θα θέλαμε να υποστηρίξουμε τη γλώσσα σας.","Done":"Ολοκλήρωση","Download":"Μεταφόρτωση","Economy":"Οικονομία","Edit":"Έπεξεργασία","Edit comment":"Επεξεργασία σχολίου","Edited by":"Επεξεργασία από","Email for wallet notifications":"Το ηλεκτρονικό σας ταχυδρομείο για τις ειδοποιήσεις του πορτοφόλιού σας","Email Notifications":"Ειδοποιήσεις Email","Empty addresses limit reached. New addresses cannot be generated.":"Το όριο άδειων διευθύνσεων ξεπεράστηκε. Δεν μπορούν να δημιουργηθούν νέες διευθύνσεις.","Enable Coinbase Service":"Ενεργοποιήση υπηρεσίας Coinbase","Enable Glidera Service":"Ενεργοποίηση υπηρεσίας Glidera","Enable push notifications":"Ενεργοποίηση ειδοποιήσεων push","Encrypted export file saved":"Η εξαγωγή κρυπτογραφημένου αρχείου αποθηκεύτηκε","Enter the recovery phrase (BIP39)":"Εισάγετε τη φράση αποκατάστασης (BIP39)","Enter your password":"Παρακαλώ εισάγετε τον κωδικό σας","Enter your spending password":"Εισάγετε τον κωδικό πληρωμών","Error at Wallet Service":"Σφάλμα στην υπηρεσία του πορτοφολιού","Error creating wallet":"Σφάλμα στην δημιουργία πορτοφολιού","Expired":"Έληξε","Expires":"Λήγει","Export options":"Επιλογές εξαγωγής","Export to file":"Εξαγωγή σε αρχείο","Export Wallet":"Εξαγωγή πορτοφολιού","Exporting via QR not supported for this wallet":"Η εξαγωγή μέσω QR δεν υποστηρίζεται για αυτο το πορτοφόλι","Extended Public Keys":"Εκτεταμένα δημόσια κλειδιά","Family vacation funds":"Χρήματα διακοπών της οικογένειας","Fee":"Αμοιβή","Fetching Payment Information":"Λήψη Πληροφοριών Πληρωμής","Finish":"Τερματισμός","French":"Γαλλικά","Funds are locked by pending spend proposals":"Τα χρήματα είναι κλειδωμένα από εν αναμονή προτάσεις αποστολής","Funds received":"Χρήματα ελήφθησαν","Generate new address":"Δημιουργία νέας διεύθυνσης","Generate QR Code":"Δημιουργία Κώδικα QR","Generating .csv file...":"Δημιουργία .csv αρχείου...","German":"Γερμανικά","Getting address for wallet {{selectedWalletName}} ...":"Λήψη διεύθυνσης για το πορτοφόλι {{selectedWalletName}} ...","Hardware wallet":"Υλικό πορτοφόλι","Hide advanced options":"Απόκρυψη Προχωρημένων επιλογών","I affirm that I have read, understood, and agree with these terms.":"Βεβαιώνω ότι έχω διαβάσει, κατανοήσει και συμφωνήσει με αυτούς τους όρους.","Import":"Εισαγωγή","Import backup":"Εισαγωγή αντιγράφου ασφαλείας","Import wallet":"Εισαγωγή πορτοφολιού","In no event shall the authors of the software, employees and affiliates of Bitpay, copyright holders, or BitPay, Inc. be held liable for any claim, damages or other liability, whether in an action of contract, tort, or otherwise, arising from, out of or in connection with the software.":"Σε καμία περίπτωση οι συντάκτες του λογισμικού, οι συνεργάτες του Bitpay, οι κατόχοι πνευματικών δικαιωμάτων, ή η BitPay α.ε. ευθύνεται για οποιαδήποτε αξίωση, ζημία ή άλλη ευθύνη, είτε βαση κάποιας σύμβασης, αδικοπραξίας, ή άλλο, που προκύπτει από την σχέση σας με το λογισμικό.","Incorrect address network":"Εσφαλμένη διεύθυνση δικτύου","Insufficient funds":"Ανεπαρκές χρηματικό υπόλοιπο","Insufficient funds for fee":"Ανεπαρκής χρηματοδότηση για την αμοιβή","Invalid":"Μη έγκυρο","Invalid address":"Μη έγκυρη διεύθυνση","Invitation to share a Copay Wallet":"Πρόσκληση για τον διαμοιρασμό ενός πορτοφολιού Copay","Japanese":"Ιαπωνικά","John":"Ιωάννης","Join":"Συμμετοχή","Join my Copay wallet. Here is the invitation code: {{secret}} You can download Copay for your phone or desktop at https://copay.io":"Συμμετάσχετε στο πορτοφόλι μου Copay. Εδώ είναι ο κωδικός πρόσκλησης: {{secret}} μπορείτε να κατεβάσετε το Copay για το τηλέφωνο σας ή τον υπολογιστή σας στο https://copay.io","Join shared wallet":"Συμμετοχή σε κοινόχρηστο πορτοφόλι","Joining Wallet...":"Εισαγωγή στο Πορτοφόλι...","Language":"Γλώσσα","Last Wallet Addresses":"Διευθύνσεις τελευταίων πορτοφολιών","Loading...":"Φόρτωση...","locked by pending payments":"κλειδωμένο από εκκρεμούσες πληρωμές","Locktime in effect. Please wait to create a new spend proposal":"Κλείδωμα σε ισχύ. Σας παρακαλώ περιμένετε για να δημιουργήσετε μια νέα πρόταση","Locktime in effect. Please wait to remove this spend proposal":"Κλείδωμα σε ισχύ. Σας παρακαλώ περιμένετε για να αφαιρέσετε αυτή την πρόταση","Make a payment to":"Κάντε μια πληρωμή σε","me":"Εγώ","Me":"Εγώ","Memo":"Σημείωση","Merchant message":"Μήνυμα Εμπόρου","Message":"Μήνυμα","Missing parameter":"Λείπει παράμετρος","Moved":"Μετακινήθηκε","Multiple recipients":"Πολλαπλοί παραλήπτες","My Bitcoin address":"Η  διεύθυνση Bitcoin μου","My contacts":"Οι επαφές μου","My wallets":"Τα πορτοφόλια μου","Network":"Δίκτυο","Network connection error":"Σφάλμα σύνδεσης δικτύου","New Payment Proposal":"Νέα Πρόταση Πληρωμής","No transactions yet":"Δεν υπάρχουν συναλλαγές ακόμα","Normal":"Κανονική","Not authorized":"Δεν επιτρέπεται","Not valid":"Δεν είναι έγκυρη","Note":"Σημείωση","optional":"προαιρετικό","Paper Wallet Private Key":"Προσωπικό κλειδί χάρτινου πορτοφολιού","Participants":"Συμμετέχοντες","Passphrase":"Φράση κωδικός","Password":"Κωδικός πρόσβασης","Paste invitation here":"Επικολλήστε την πρόσκληση σας εδώ","Paste the backup plain text code":"Επικολλήστε τον κώδικα δημιουργίας αντιγράφων ασφαλείας εδώ","Pay To":"Πληρωμή Πρός","Payment Accepted":"Πληρωμή Αποδεκτή","Payment details":"Λεπτομέρειες πληρωμής","Payment Proposal":"Πρόταση Πληρωμής","Payment Proposal Created":"Πρόταση Πληρωμής Δημιουργήθηκε","Payment Proposal Rejected":"Πρόταση Πληρωμής Απορρίφθηκε","Payment Proposal Rejected by Copayer":"Το Copayer Απέρριψε την Πρόταση Πληρωμής","Payment Proposal Signed by Copayer":"Η Πρόταση Πληρωμής Υπογράφηκε από το Copayer","Payment Proposals":"Πρόταση Πληρωμής","Payment Protocol not supported on Chrome App":"Το Πρωτόκολλο Πληρωμής δεν υποστηρίζεται στην εφαρμογή Chrome","Payment Rejected":"Πληρωμή Απερρίφθη","Payment request":"Αίτηση πληρωμής","Payment Sent":"Πληρωμή Εστάλη","Payment to":"Πληρωμή σε","Pending Confirmation":"Υπό επιβεβαίωση","Permanently delete this wallet. THIS ACTION CANNOT BE REVERSED":"Να διαγράφεί μόνιμα αυτό το πορτοφόλι? ΑΥΤΗ Η ΕΝΕΡΓΕΙΑ ΔΕΝ ΜΠΟΡΕΙ ΝΑ ΑΝΤΙΣΤΡΑΦΕΙ","Personal Wallet":"Προσωπικό πορτοφόλι","Please enter the required fields":"Παρακαλώ εισάγετε τα απαιτούμενα πεδία","Please upgrade Copay to perform this action":"Παρακαλώ αναβαθμίστε το Copay για να εκτελέσετε αυτήν την ενέργεια","Please, select your backup file":"Παρακαλώ, επιλέξτε το αρχείο αντιγράφου ασφαλείας","Polish":"Πολωνικά","Preferences":"Προτιμήσεις","Preparing backup...":"Προετοιμασία δημιουργίας αντιγράφων ασφαλείας...","preparing...":"Προετοιμασία...","Press again to exit":"Πιέστε ξανά για έξοδο","Priority":"Προτεραιότητα","Private key is encrypted, cannot sign":"Το ιδιωτικό κλειδί είναι κρυπτογραφημένο, η υπογραφή δεν ήταν εφικτή","Push notifications for Copay are currently disabled. Enable them in the Settings app.":"Οι ειδοποιήσεις push για Copay είναι απενεργοποιημένη αυτήν τη στιγμή. Ενεργοποιήστε τες στις Ρυθμίσεις της εφαρμογής.","QR Code":"Κωδικός QR","QR-Scanner":"Σαρωτής QR","Receive":"Λάβετε","Received":"Ληφθέντα","Recipients":"Παραλήπτες","Recovery Phrase":"Φράση ανάκτησης","Recovery phrase deleted":"Η Φράση Ανάκτησης διαγράφηκε","Recreate":"Αναδημιουργία","Recreating Wallet...":"Αναδημιουργία πορτοφολιού...","Reject":"Απόρριψη","Release Information":"Πληροφορίες Έκδοσης","Remove":"Αφαίρεση","Repeat password":"Επανάληψη κωδικού","Repeat the password":"Επανάληψη κωδικού","Repeat the spending password":"Επανάληψη κωδικού πληρωμών","Request a specific amount":"Ζητήστε ένα συγκεκριμένο ποσό","Request Spending Password":"Αίτηση κωδικού πληρωμών","Required":"Απαιτείτε","Required number of signatures":"Απαιτούμενος αριθμός υπογραφών","Retrieving inputs information":"Ανάκτηση πληροφοριών εισαγωγής","Russian":"Ρωσσικά","Save":"Αποθήκευση","Scan addresses for funds":"Σάρωση διευθύνσεων για χρήματα","Scan Fingerprint":"Σάρωση δακτυλικού αποτυπωμάτως","Scan Finished":"Η σάρωση ολοκληρώθηκε","Scan status finished with error":"Η σάρωση έχει τελειώσει με σφάλματα","Scan Wallet Funds":"Σάρωση κεφαλαίων πορτοφολιού","Scan your fingerprint please":"Σαρώστε το δακτυλικό σας αποτύπωμα","Scanning Wallet funds...":"Σάρωση χρημάτων Πορτοφολιού...","Search transactions":"Αναζήτηση συναλλαγών","Search Transactions":"Αναζήτηση συναλλαγών","Security preferences":"Ρυθμίσεις ασφαλείας","See it on the blockchain":"Δείτε τη συναλλαγή στην αλυσίδα συναλλαγών","Select a backup file":"Επιλέξτε ένα αρχείο αντιγράφου ασφαλείας","Select a wallet":"Επιλέξτε ένα πορτοφόλι","Send":"Αποστολή","Send by email":"Αποστολή με email","Sent":"Εξερχόμενα","Session log":"Ημερολόγιο συνεδριών","SET":"Ορισμός","Set up a password":"Ορίστε έναν κωδικό πρόσβασης","Setting up email notifications could weaken your privacy, if the wallet service provider is compromised. Information available to an attacker would include your wallet addresses and its balance, but no more.":"Ενεργοποιώντας τις ενημερώσεις μέσω ηλεκτρονικού ταχυδρομείου μπορεί να μειωθεί η ιδιωτικότητα σας, εάν ο πάροχος του πορτοφολιού παραβιαστεί. Οι πληροφορίες που θα διαθέτει ένας εισβολέας θα περιλαμβάνουν τις διευθύνσεις του πορτοφόλιου σας και το ποσόν των χρημάτων σας, αλλά τίποτα περισσότερο.","Share address":"Μοιραστείτε τη διεύθυνση","Share invitation":"Μοιραστείτε μια πρόσκληση","Share this invitation with your copayers":"Μοιραστείτε αυτήν την πρόσκληση με άλλους copayers","Share this wallet address to receive payments. To protect your privacy, new addresses are generated automatically once you use them.":"Μοιραστείτε αυτή τη διεύθυνση πορτοφόλιού ώστε να λάβετε πληρωμές. Για την προστασία της ιδιωτικότητας σας, νέες διευθύνσεις δημιουργούνται αυτόματα μόλις χρησιμοποιήσετε τις παλιές.","Shared Wallet":"Κοινόχρηστο πορτοφόλι","Show advanced options":"Εμφάνιση προχωρημένων επιλογών","Signatures rejected by server":"Οι υπογραφές απορρίφθηκαν από το διακομιστή","Spanish":"Ισπανικά","Spend proposal is not accepted":"Η πρόταση δεν έγινε αποδεκτή","Spend proposal not found":"Η πρόταση δεν βρέθηκε","Success":"Επιτυχία","Tap to retry":"Πατήστε για να προσπαθήσετε ξανά","Terms of Use":"Όροι Χρήσης","The authors of the software, employees and affiliates of Bitpay, copyright holders, and BitPay, Inc. cannot retrieve your private keys or passwords if you lose or forget them and cannot guarantee transaction confirmation as they do not have control over the Bitcoin network.":"Οι συγγραφείς του λογισμικού, οι εργαζόμενοι και οι συνεργάτες του Bitpay, οι κατόχοι πνευματικών δικαιωμάτων, και η BitPay α.ε., δεν μπορούν να ανακτήσουν ιδιωτικά κλειδιά ή τους κωδικούς πρόσβασης σας, εάν χάσετε ή ξεχασετε αυτούς και δεν μπορούν να εγγυηθούν την επιβεβαίωση της συναλλαγής, δεδομένου ότι δεν έχουν τον έλεγχο του δικτύου Bitcoin.","The payment was created but could not be completed. Please try again from home screen":"Η πληρωμή δημιουργήθηκε, αλλά δεν ήταν δυνατό να ολοκληρωθεί. Παρακαλώ ξαναπροσπαθήστε από την αρχική οθόνη","The payment was removed by creator":"Η πληρωμή έχει αφαιρεθεί από τον δημιουργό της","The software does not constitute an account where BitPay or other third parties serve as financial intermediaries or custodians of your bitcoin.":"Το λογισμικό δεν αποτελεί ένα λογαριασμό όπου το BitPay ή άλλα τρίτα μέρη χρησιμεύουν ως ενδιάμεσοι χρηματοπιστωτικοί οργανισμοί ή θεματοφύλακες των bitcoin σας.","The software you are about to use functions as a free, open source, and multi-signature digital wallet.":"Το λογισμικό που πρόκειται να χρησιμοποιήσετε λειτουργεί ως ένα δωρεάν, ανοικτού κώδικα και πολλαπλών υπογραφών ψηφιακό πορτοφόλι.","The spend proposal is not pending":"Δεν εκκρεμεί η πρόταση","The wallet \"{{walletName}}\" was deleted":"Διαγράφηκε το πορτοφόλι \"{{walletName}}\"","There are no wallets to make this payment":"Δεν υπάρχουν πορτοφόλια για να πραγματοποιηθεί η πληρωμή","There is an error in the form":"Υπάρχει ένα λάθος στη φόρμα εισαγωγής","This transaction has become invalid; possibly due to a double spend attempt.":"Αυτή η συναλλαγή είναι άκυρη, πιθανόν λόγω μιας προσπάθειας διπλού ξοδέματος.","This wallet is not registered at the given Bitcore Wallet Service (BWS). You can recreate it from the local information.":"Το πορτοφόλι δεν έχει καταχωρηθεί στη Βάση Δεδομένων Πορτοφολιών Bitcore (BWS). Μπορείτε να την ξαναδημιουργήσετε από τις τοπικές πληροφορίες.","Time":"Ώρα","To":"Προς","To the fullest extent permitted by law, this software is provided “as is” and no representations or warranties can be made of any kind, express or implied, including but not limited to the warranties of merchantability, fitness or a particular purpose and noninfringement.":"Στο μέγιστο βαθμό που επιτρέπει το δίκαιο, το λογισμικό παρέχεται \"ως έχει\" και καμία δήλωση ή εγγύηση μπορεί να γίνει του κάθε είδους, ρητή ή σιωπηρή, συμπεριλαμβανομένων, αλλά μη περιορισμένων, των εγγυήσεων εμπορευσιμότητας, καταλληλότητας ή συγκεκριμένου σκοπού και νομιμότητας.","too long!":"πάρα πολύ μεγάλο μέγεθος!","Total Locked Balance":"Συνολικό Κλειδωμένο Υπόλοιπο","Transaction":"Συναλλαγή","Transaction already broadcasted":"Συναλλαγή που έχει ήδη μεταδοθεί","Translation Credits":"Λεπτομέρειες Μετάφρασης","Translators":"Μεταφραστές","Unconfirmed":"Ανεπιβεβαίωτες","Unit":"Μονάδα","Unsent transactions":"Μη Απεσταλμένες συναλλαγές","Updating Wallet...":"Ενημέρωση πορτοφολιού...","Use Unconfirmed Funds":"Χρήση Ανεπιβεβαίωτων Ποσών","Version":"Έκδοση","Waiting for copayers":"Αναμονή για copayers","Waiting...":"Σε αναμονή...","Wallet already exists":"Υπάρχει ήδη το πορτοφόλι","Wallet incomplete and broken":"Πορτοφόλι ελλιπές και χαλασμένο","Wallet Invitation":"Πρόσκληση πορτοφολιού","Wallet Invitation is not valid!":"Η πρόσκληση πορτοφολιού δεν είναι έγκυρη!","Wallet is full":"Το πορτοφόλι είναι γεμάτο","Wallet is not complete":"Το πορτοφόλι δεν είναι πλήρες","Wallet name":"Όνομα πορτοφολιού","Wallet not found":"Το πορτοφόλι δεν βρέθηκε","Wallet service not found":"Η υπηρεσία του πορτοφολιού δεν βρέθηκε","Warning: this transaction has unconfirmed inputs":"Προειδοποίηση: αυτή η συναλλαγή έχει ανεπιβεβαίωτες εισροές","WARNING: Wallet not registered":"Προειδοποίηση: Το πορτοφόλι δεν έχει καταχωρηθεί","Warning!":"Προειδοποίηση!","We reserve the right to modify this disclaimer from time to time.":"Διατηρούμε το δικαίωμα να τροποποιήσουμε αυτή την αποποίηση ευθυνών από καιρό σε καιρό.","WELCOME TO COPAY":"ΚΑΛΩΣ ΗΛΘΑΤΕ ΣΤΟ COPAY","While the software has undergone beta testing and continues to be improved by feedback from the open-source user and developer community, we cannot guarantee that there will be no bugs in the software.":"Ενώ το λογισμικό έχει υποβληθεί σε δοκιμή beta και συνεχίζει να βελτιώνεται από χρήστες ανοικτού κώδικα και την κοινότητα των προγραμματιστών, εμείς δεν μπορούμε να εγγυηθούμε ότι δεν θα υπάρξει κανένα σφάλμα στο λογισμικό.","Yes":"Ναι","You acknowledge that your use of this software is at your own discretion and in compliance with all applicable laws.":"Αναγνωρίζετε ότι η χρήση αυτού του λογισμικού είναι στην κρίση σας και σε συμφωνία με όλους τους ισχύοντες νόμους.","You are responsible for safekeeping your passwords, private key pairs, PINs and any other codes you use to access the software.":"Είστε υπεύθυνος για τη διαφύλαξή των κωδικών πρόσβασής σας, το ιδιωτικό ζεύγος κλειδιών, τετραψήφιων κωδικών PIN και οποιουσδήποτε άλλους κωδικούς που χρησιμοποιείτε για να έχετε πρόσβαση στο λογισμικό.","You assume any and all risks associated with the use of the software.":"Αναλάμβανετε κάθε κινδύνο που συνδέεται με τη χρήση του λογισμικού.","Your nickname":"Το ψευδώνυμό σας","Your password":"Ο κωδικός σας","Your wallet has been imported correctly":"Το πορτοφόλι σας έχει εισαχθεί σωστά"});
    gettextCatalog.setStrings('es', {"(possible double spend)":"(Posible doble gasto)","(Trusted)":"(De confianza)","[Balance Hidden]":"[Balance Oculto]","{{fee}} will be deducted for bitcoin networking fees":"{{fee}} se descontará por comisión de la red bitcoin","{{feeRateStr}} of the transaction":"{{feeRateStr}} de la transacción","{{index.m}}-of-{{index.n}}":"{{index.m}}-de-{{index.n}}","{{index.result.length - index.txHistorySearchResults.length}} more":"{{index.result.length - index.txHistorySearchResults.length}} más","{{index.txProgress}} transactions downloaded":"{{index.txProgress}} transacciones descargadas","{{item.m}}-of-{{item.n}}":"{{item.m}}-de-{{item.n}}","* A payment proposal can be deleted if 1) you are the creator, and no other copayer has signed, or 2) 24 hours have passed since the proposal was created.":"* Una propuesta de pago puede ser eliminada si 1) Ud. es el creador, y ningún otro copayer la haya firmado, o 2) hayan transcurrido 24 horas desde la creación de la propuesta.","<b>IF YOU LOSE ACCESS TO YOUR COPAY WALLET OR YOUR ENCRYPTED PRIVATE KEYS AND YOU HAVE NOT SEPARATELY STORED A BACKUP OF YOUR WALLET AND CORRESPONDING PASSWORD, YOU ACKNOWLEDGE AND AGREE THAT ANY BITCOIN YOU HAVE ASSOCIATED WITH THAT COPAY WALLET WILL BECOME INACCESSIBLE.</b>":"<b>SI UD. PIERDE ACCESO A SU MONEDERO COPAY O A SUS CLAVES PRIVADAS ENCRIPTADAS Y NO HA GUARDADO POR SEPARADO UNA COPIA DE SEGURIDAD DE SU MONEDERO Y CONTRASEÑA CORRESPONDIENTES, USTED RECONOCE Y ACEPTA QUE CUALQUIER BITCOIN QUE HA ASOCIADO CON ESE MONEDERO COPAY SERÁ INACCESIBLE.</b>","<b>OR</b> 1 wallet export file and the remaining quorum of wallet recovery phrases (e.g. in a 3-5 wallet: 1 wallet export file + 2 wallet recovery phrases of any of the other copayers).":"<b>O</b> 1 archivo exportado del monedero y el quórum restante de la frase de recuperación (por ejemplo en un monedero 3-5: 1 archivo exportado + 2 frases de recuperación del monedero de cualquiera de los otros copayers).","<b>OR</b> the wallet recovery phrase of <b>all</b> copayers in the wallet":"<b>O</b> la frase de recuperación de <b>todos</b> los copayers del monedero","<b>OR</b> the wallet recovery phrases of <b>all</b> copayers in the wallet":"<b>O</b> las frases de recuperación de <b>todos</b> los copayers del monedero","A multisignature bitcoin wallet":"Monedero multifirma de bitcoin","About Copay":"Acerca de Copay","Accept":"Aceptar","Account":"Cuenta","Account Number":"Número de cuenta","Activity":"Actividad","Add a new entry":"Agregar una nueva entrada","Add a Password":"Agregar una contraseña","Add an optional password to secure the recovery phrase":"Agregar una contraseña opcional para asegurar la frase de recuperación","Add comment":"Añadir comentario","Add wallet":"Agregar monedero","Address":"Dirección","Address Type":"Tipo de Dirección","Advanced":"Avanzado","Alias":"Alias","Alias for <i>{{index.walletName}}</i>":"Alias de <i>{{index.walletName}}</i>","All contributions to Copay's translation are welcome. Sign up at crowdin.com and join the Copay project at":"Todas las contribuciones a la traducción de Copay son bienvenidas. Regístrese en crowdin.com y únase al proyecto Copay en","All transaction requests are irreversible.":"Todas las solicitudes de transacciones son irreversibles.","Alternative Currency":"Moneda Alternativa","Amount":"Importe","Amount below minimum allowed":"Cantidad por debajo del mínimo permitido","Amount in":"Importe en","Are you sure you want to delete the recovery phrase?":"¿Está seguro que quiere eliminar la frase de recuperación?","Are you sure you want to delete this wallet?":"¿Estas seguro de borrar este monedero?","Auditable":"Auditables","Available Balance":"Balance disponible","Average confirmation time: {{fee.nbBlocks * 10}} minutes":"Tiempo promedio de confirmación: {{fee.nbBlocks * 10}} minutos","Back":"Volver","Backup":"Copia de seguridad","Backup failed":"Falló la copia de seguridad","Backup Needed":"Se requiere hacer copia de seguridad","Backup now":"Realizar copia de seguridad ahora","Bad wallet invitation":"Invitación incorrecta al monedero","Balance By Address":"Balance por Dirección","Before receiving funds, you must backup your wallet. If this device is lost, it is impossible to access your funds without a backup.":"Antes de recibir fondos, es necesario hacer una copia de seguridad de su monedero. Si pierde este dispositivo, es imposible tener acceso a sus fondos sin una copia de seguridad.","BETA: Android Key Derivation Test:":"BETA: Prueba de derivación de claves Android:","BIP32 path for address derivation":"BIP32 para el camino de derivación de direcciones","Bitcoin address":"Dirección bitcoin","Bitcoin Network Fee Policy":"Política de Comisión de la Red Bitcoin","Bitcoin transactions may include a fee collected by miners on the network. The higher the fee, the greater the incentive a miner has to include that transaction in a block. Current fees are determined based on network load and the selected policy.":"Las transacciones de Bitcoin pueden incluir una comisión colectada por los mineros en la red. Cuanto mayor sea la comisión, mayor será el incentivo para que el minero incluya esa transacción en un bloque. Las comisiones actuales se determinan en base a la carga de la red y a la política seleccionada.","Bitcoin URI is NOT valid!":"¡Bitcoin URI no es válida!","Broadcast Payment":"Enviar Pago","Broadcasting transaction":"Finalizando transacción","Browser unsupported":"Navegador no soportado","Buy and Sell":"Comprar y Vender","Calculating fee":"Calculando comisión","Cancel":"Cancelar","Cancel and delete the wallet":"Cancelar y borrar el monedero","Cannot create transaction. Insufficient funds":"No se puede crear transacciones. Insuficiencia de fondos","Cannot join the same wallet more that once":"No puede unirse al mismo monedero más de una vez","Cannot sign: The payment request has expired":"No se pudo firmar: la solicitud de pago ha expirado","Certified by":"Certificado por","Changing wallet alias only affects the local wallet name.":"Cambiar el alias del monedero solo afecta al nombre del monedero local.","Chinese":"Chino","Choose a backup file from your computer":"Seleccione el archivo de copia de seguridad de su computadora","Clear cache":"Limpiar cache","Close":"Cerrar","Color":"Color","Comment":"Comentario","Commit hash":"Commit hash","Confirm":"Confirmar","Confirm your wallet recovery phrase":"Confirmar frase de recuperación del monedero","Confirmations":"Confirmaciones","Congratulations!":"¡Felicitaciones!","Connecting to Coinbase...":"Conectando a Coinbase...","Connecting to Glidera...":"Conectando a Glidera...","Connection reset by peer":"Conexión re establecida","Continue":"Continuar","Copayer already in this wallet":"Ya se encuentra en este monedero","Copayer already voted on this spend proposal":"Ya ha votado en esta propuesta de gasto","Copayer data mismatch":"Discrepancia en los datos del Copayer","Copayers":"Copayers","Copied to clipboard":"Copiado al portapapeles","Copy this text as it is to a safe place (notepad or email)":"Copiar el texto como esta en un lugar seguro (bloc de notas o correo electrónico)","Copy to clipboard":"Copiar al portapapeles","Could not access the wallet at the server. Please check:":"No se pudo acceder al monedero del servidor. Por favor verificar:","Could not access wallet":"No se pudo acceder al monedero","Could not access Wallet Service: Not found":"No se pudo acceder a Wallet Service: No encontrado","Could not broadcast payment":"No se pudo enviar el pago","Could not build transaction":"No se pudo construir la transacción","Could not create address":"No se pudo crear la dirección","Could not create payment proposal":"No se pudo crear la propuesta de pago","Could not create using the specified extended private key":"No se pudo crear el monedero usando la clave privada ingresada","Could not create using the specified extended public key":"No se pudo crear con la clave pública extendida especificada","Could not create: Invalid wallet recovery phrase":"No se pudo crear: frase de recuperación inválida","Could not decrypt file, check your password":"No se pudo descifrar el archivo, verifique su contraseña","Could not delete payment proposal":"No se pudo eliminar la propuesta de pago","Could not fetch payment information":"No se pudo obtener información del pago","Could not get fee value":"No se pudo obtener valor de la comisión","Could not import":"No se pudo importar","Could not import. Check input file and spending password":"No se pudo importar. Verifique el archivo y la contraseña para enviar","Could not join wallet":"No se pudo unir al monedero","Could not recognize a valid Bitcoin QR Code":"No se reconoció el código QR de Bitcoin válido","Could not reject payment":"No se pudo rechazar el pago","Could not send payment":"No se pudo enviar el pago","Could not update Wallet":"No se pudo actualizar el monedero","Create":"Crear","Create {{requiredCopayers}}-of-{{totalCopayers}} wallet":"Crea monedero {{requiredCopayers}}-de-{{totalCopayers}}","Create new wallet":"Crear un nuevo monedero","Create, join or import":"Crear, unirse o importar","Created by":"Creado por","Creating transaction":"Creando transacción","Creating Wallet...":"Creando monedero...","Current fee rate for this policy: {{fee.feePerKBUnit}}/kiB":"Comisión actual para esta política: {{fee.feePerKBUnit}}/kiB","Czech":"Checo","Date":"Fecha","Decrypting a paper wallet could take around 5 minutes on this device. please be patient and keep the app open.":"Descifrar un monedero de papel podría tomar alrededor de 5 minutos en este dispositivo. Por favor, sea paciente y mantenga la aplicación abierta.","Delete it and create a new one":"Borrar y crear uno nuevo","Delete Payment Proposal":"Eliminar Propuesta de Pago","Delete recovery phrase":"Eliminar frase de recuperación","Delete Recovery Phrase":"Eliminar Frase de Recuperación","Delete wallet":"Eliminar monedero","Delete Wallet":"Eliminar Monedero","Deleting Wallet...":"Eliminando Monedero...","Derivation Path":"Camino de derivación","Derivation Strategy":"Estrategia de derivación","Description":"Descripción","Details":"Detalles","Disabled":"Deshabilitado","Do not include private key":"No incluir la clave privada","Don't see your language on Crowdin? Contact the Owner on Crowdin! We'd love to support your language.":"¿No ve su idioma en Crowdin? Contáctese con el encargado del proyecto! Nos encantaría soportar su idioma.","Done":"Listo","Download":"Descargar","Economy":"Económico","Edit":"Editar","Edit comment":"Editar comentario","Edited by":"Editado por","Email for wallet notifications":"Correo electrónico para notificaciones del monedero","Email Notifications":"Notificaciones por Correo electrónico","Empty addresses limit reached. New addresses cannot be generated.":"Se ha alcanzado el límite de direcciones vacías. No se pueden generar nuevas direcciones.","Enable Coinbase Service":"Habilitar Coinbase","Enable Glidera Service":"Habilitar Glidera","Enable push notifications":"Activar notificaciones push","Encrypted export file saved":"El archivo cifrado se ha exportado y guardado","Enter the recovery phrase (BIP39)":"Introduzca la frase de recuperación (BIP39)","Enter your password":"Ingrese su contraseña","Enter your spending password":"Introduzca la contraseña para enviar","Error at Wallet Service":"Error en Wallet Service","Error creating wallet":"Error al crear monedero","Expired":"Expirada","Expires":"Expira","Export options":"Opciones de exportación","Export to file":"Exportar a archivo","Export Wallet":"Exportar Monedero","Exporting via QR not supported for this wallet":"Exportar vía código QR no es compatible para este monedero","Extended Public Keys":"Claves Públicas Extendidas","Extracting Wallet Information...":"Obteniendo Información del Monedero...","Failed to export":"Error al exportar","Failed to verify backup. Please check your information":"No se pudo comprobar la copia de seguridad. Por favor verifique su información","Family vacation funds":"Fondos para vacaciones en familia","Fee":"Comisión","Fetching Payment Information":"Obteniendo información del pago","File/Text":"Archivo/Texto","Finger Scan Failed":"Fallo en la verificación de la huella","Finish":"Finalizar","For audit purposes":"Para propósitos de auditoría","French":"Francés","From the destination device, go to Add wallet &gt; Import wallet and scan this QR code":"Desde el dispositivo de destino, ir a Agregar monedero &gt; Importar y escanear este código QR","Funds are locked by pending spend proposals":"Los fondos están bloqueados por propuestas de gastos pendientes","Funds found":"Fondos encontrados","Funds received":"Fondos Recibidos","Funds will be transferred to":"Los fondos serán transferidos a","Generate new address":"Generar nueva dirección","Generate QR Code":"Generar código QR","Generating .csv file...":"Generando archivo .csv...","German":"Alemán","Getting address for wallet {{selectedWalletName}} ...":"Obteniendo direcciones para el monedero {{selectedWalletName}} ...","Global preferences":"Preferencias globales","Hardware wallet":"Monedero de Hardware","Hardware Wallet":"Monedero Físico","Hide advanced options":"Ocultar opciones avanzadas","I affirm that I have read, understood, and agree with these terms.":"Confirmo haber leído, entendido y aceptado estos términos.","I AGREE. GET STARTED":"DE ACUERDO. COMENZAR","Import":"Importar","Import backup":"Importar copia de seguridad","Import wallet":"Importar monedero","Importing Wallet...":"Importando Monedero...","In no event shall the authors of the software, employees and affiliates of Bitpay, copyright holders, or BitPay, Inc. be held liable for any claim, damages or other liability, whether in an action of contract, tort, or otherwise, arising from, out of or in connection with the software.":"En ningún caso los autores, empleados y afiliados de Bitpay, los titulares de derechos de autor, o BitPay, Inc. serán declarados responsables de los reclamos, daños o cualquier otra responsabilidad, ya sea en una acción de contrato, agravio o de otra manera, que surja fuera de la conexión con el software.","In order to verify your wallet backup, please type your password:":"Con el fin de verificar la copia de seguridad del monedero, por favor escriba su contraseña:","Incorrect address network":"Dirección de red incorrecta","Incorrect code format":"Formato de código incorrecto","Insufficient funds":"Fondos insuficientes","Insufficient funds for fee":"Fondos insuficientes para el pago de la comisión","Invalid":"Inválido","Invalid account number":"Número de cuenta inválido","Invalid address":"Dirección inválida","Invalid derivation path":"Camino de derivación no válido","Invitation to share a Copay Wallet":"Invitación para compartir un monedero de Copay","Italian":"Italiano","Japanese":"Japonés","John":"Juan","Join":"Unirse","Join my Copay wallet. Here is the invitation code: {{secret}} You can download Copay for your phone or desktop at https://copay.io":"Únase a mi monedero Copay. Aquí esta el código de invitación: {{secret}}. Puedes descargar Copay a su teléfono o computadora desde https://copay.io","Join shared wallet":"Unirse a un monedero compartido","Joining Wallet...":"Uniéndose al monedero...","Key already associated with an existing wallet":"La clave ya esta asociada a un monedero existente","Label":"Etiqueta","Language":"Idioma","Last Wallet Addresses":"Últimas Direcciones del Monedero","Learn more about Copay backups":"Más información sobre copias de seguridad en Copay","Loading...":"Cargando...","locked by pending payments":"bloqueado por pagos pendientes","Locktime in effect. Please wait to create a new spend proposal":"Bloqueo temporal. Por favor espere para crear una nueva propuesta de gasto","Locktime in effect. Please wait to remove this spend proposal":"Bloqueo temporal. Por favor espere para eliminar esta propuesta de gasto","Make a payment to":"Hacer un pago a","Matches:":"Coincidencias:","me":"yo","Me":"Yo","Memo":"Nota","Merchant message":"Mensaje del negocio","Message":"Mensaje","Missing parameter":"Faltan parámetros","Missing private keys to sign":"Faltan las claves privadas para firmar","Moved":"Movido","Multiple recipients":"Varios destinatarios","My Bitcoin address":"Mi dirección Bitcoin","My contacts":"Mis contactos","My wallets":"Mis monederos","Need to do backup":"Necesita hacer una copias de seguridad","Network":"Red","Network connection error":"Error de conexión a la red","New Payment Proposal":"Nueva Propuesta de Pago","New Random Recovery Phrase":"Nueva frase de recuperación aleatoria","No hardware wallets supported on this device":"No hay monederos hardware compatibles con este dispositivo","No transactions yet":"Sin transacciones todavía","Normal":"Normal","Not authorized":"No autorizado","Not completed":"No completado","Not enough funds for fee":"No hay suficientes fondos para la comisión","Not valid":"No válido","Note":"Nota","Note: a total of {{amountAboveMaxSizeStr}} were excluded. The maximum size allowed for a transaction was exceeded":"Nota: se excluyeron un total de {{amountAboveMaxSizeStr}}. El tamaño máximo permitido para una transacción se ha excedido","Note: a total of {{amountBelowFeeStr}} were excluded. These funds come from UTXOs smaller than the network fee provided.":"Nota: se excluyeron un total de {{amountBelowFeeStr}}. Estos fondos provienen de UTXOs más pequeños que la tarifa de red suministrada.","NOTE: To import a wallet from a 3rd party software, please go to Add Wallet &gt; Create Wallet, and specify the Recovery Phrase there.":"Nota: Para importar un monedero de un software de tercero, por favor vaya a Añadir Monedero &gt; Crear Monedero, y especificar la frase de recuperación allí.","Official English Disclaimer":"Renuncia oficial en inglés","OKAY":"LISTO","Once you have copied your wallet recovery phrase down, it is recommended to delete it from this device.":"Una vez que ha copiado la frase de recuperación del monedero en un papel, es recomendable eliminarla del dispositivo.","Only Main (not change) addresses are shown. The addresses on this list were not verified locally at this time.":"Sólo las direcciones principales aparecen (no las usadas para el vuelto). Las direcciones de esta lista no fueron verificadas localmente en este momento.","Open Settings app":"Abrir Configuración de la Aplicación","optional":"opcional","Paper Wallet Private Key":"Clave privada del monedero de papel","Participants":"Participantes","Passphrase":"Contraseña","Password":"Contraseña","Password required. Make sure to enter your password in advanced options":"Contraseña necesaria. Asegúrese de introducir su contraseña en opciones avanzadas","Paste invitation here":"Pegar invitación aquí","Paste the backup plain text code":"Pegar copia de seguridad en texto plano","Paste your paper wallet private key here":"Pegar la clave privada del monedero aquí","Pasted from clipboard":"Pegado desde el portapapeles","Pay To":"Pagar A","Payment Accepted":"Pago Aceptado","Payment accepted, but not yet broadcasted":"Pago aceptado, pero aún no fue enviado","Payment accepted. It will be broadcasted by Glidera. In case there is a problem, it can be deleted 6 hours after it was created.":"Pago aceptado. Se transmitirá por Glidera. En caso de que haya un problema, puede eliminar la transacción 6 horas después de fue creada.","Payment details":"Detalles del pago","Payment expires":"Pago expira","Payment Proposal":"Propuesta de Pago","Payment Proposal Created":"Propuesta de Pago Creada","Payment Proposal Rejected":"Propuesta de Pago Rechazada","Payment Proposal Rejected by Copayer":"Propuesta de Pago Rechazada por Copayer","Payment Proposal Signed by Copayer":"Propuesta de Pago Firmada por Copayer","Payment Proposals":"Propuestas de Pago","Payment Protocol Invalid":"Protocolo de Pago Inválido","Payment Protocol not supported on Chrome App":"El protocolo de pago no está soportado en Chrome","Payment Rejected":"Pago Rechazado","Payment request":"Solicitud de pago","Payment Sent":"Pago Enviado","Payment to":"Pago a","Pending Confirmation":"Confirmación Pendiente","Permanently delete this wallet. THIS ACTION CANNOT BE REVERSED":"Borrar permanentemente este monedero. ESTA ACCIÓN NO PUEDE SER REVERTIDA","Personal Wallet":"Monedero Personal","Please enter the recovery phrase":"Por favor ingrese la frase de recuperación","Please enter the required fields":"Por favor ingrese los campos requeridos","Please enter the wallet recovery phrase":"Por favor ingrese la frase de recuperación del monedero","Please tap the words in order to confirm your backup phrase is correctly written.":"Por favor presione las palabras para confirmar que su copia de seguridad está correctamente escrita.","Please upgrade Copay to perform this action":"Por favor actualice Copay para realizar esta acción","Please wait to be redirected...":"Por favor, espere a ser redirigido...","Please, select your backup file":"Por favor, seleccione el archivo de copia de seguridad","Polish":"Polaco","Preferences":"Preferencias","Preparing backup...":"Preparando copia de seguridad...","preparing...":"preparando...","Press again to exit":"Presione nuevamente para salir","Priority":"Prioritario","Private key is encrypted, cannot sign":"La clave privada esta encriptada, no puede firmar","Push notifications for Copay are currently disabled. Enable them in the Settings app.":"Notificaciones push para Copay están deshabilitadas. Habilitarla en la configuración de la aplicación.","QR Code":"Código QR","QR-Scanner":"Lector de QR","Receive":"Recibir","Received":"Recibido","Recipients":"Destinatarios","Recovery Phrase":"Frase de Recuperación","Recovery phrase deleted":"Frase de recuperación eliminada","Recreate":"Recrear","Recreating Wallet...":"Recreando Monedero...","Reject":"Rechazar","Release Information":"Información de la versión","Remove":"Eliminar","Repeat password":"Escriba nuevamente la contraseña","Repeat the password":"Repetir la contraseña","Repeat the spending password":"Repetir la contraseña para enviar","Request a specific amount":"Solicitar importe específico","Request Spending Password":"Solicitar contraseña para enviar","Required":"Requerido","Required number of signatures":"Número requerido de firmas","Retrieving inputs information":"Recuperando información de las entradas","Russian":"Ruso","Save":"Guardar","Scan addresses for funds":"Busca direcciones con fondos","Scan Fingerprint":"Lector de huella digital","Scan Finished":"Búsqueda Finalizada","Scan status finished with error":"La búsqueda finalizó con error","Scan Wallet Funds":"Buscar fondos del monedero","Scan your fingerprint please":"Por favor ingrese su huella digital","Scanning Wallet funds...":"Buscando fondos en el Monedero...","Search transactions":"Buscar transacciones","Search Transactions":"Buscar transacciones","Security preferences":"Preferencias de seguridad","See it on the blockchain":"Ver en la blockchain","Select a backup file":"Seleccionar el archivo de copia de seguridad","Select a wallet":"Seleccionar un monedero","Self-signed Certificate":"Certificado autofirmado","Send":"Enviar","Send addresses by email":"Enviar las direcciones por email","Send bitcoin":"Enviar bitcoin","Send by email":"Enviar por correo electrónico","Send Max":"Enviar máximo","Sending":"Enviando","Sending transaction":"Enviando transacción","Sent":"Enviado","Server response could not be verified":"La respuesta del servidor no se ha podido verificar","Session log":"Registro de sesión","SET":"ESTABLECER","Set default url":"Establecer URL predeterminada","Set up a password":"Configurar una contraseña","Set up a spending password":"Configurar contraseña para enviar","Setting up email notifications could weaken your privacy, if the wallet service provider is compromised. Information available to an attacker would include your wallet addresses and its balance, but no more.":"Configurar notificaciones por correo electrónico podría debilitar su privacidad, si el proveedor de Wallet Service se ve comprometido. La información disponible para un atacante incluiría sus direcciones del monedero y su balance, pero no más.","Settings":"Configuración","Share address":"Compartir dirección","Share invitation":"Compartir invitación","Share this invitation with your copayers":"Compartir esta invitación con sus copayers","Share this wallet address to receive payments":"Compartir esta dirección del monedero para recibir pagos","Share this wallet address to receive payments. To protect your privacy, new addresses are generated automatically once you use them.":"Compartir esta dirección para recibir pagos. Para proteger su privacidad, se generan nuevas direcciones automáticamente luego de recibir un pago.","Shared Wallet":"Monedero Compartido","Show advanced options":"Mostrar opciones avanzadas","Signatures rejected by server":"Firmas rechazadas por el servidor","Signing transaction":"Firmando transacción","Single Address Wallet":"Monedero de una sola dirección","Spanish":"Español","Specify Recovery Phrase...":"Especificar la frase de recuperación...","Spend proposal is not accepted":"La propuesta de gasto no se ha aceptado","Spend proposal not found":"La propuesta de gasto no se ha encontrado","Spending Password needed":"Se necesita la contraseña para enviar","Spending Passwords do not match":"Las contraseña para enviar no coinciden","Success":"Listo","Super Economy":"Súper Económico","Sweep paper wallet":"Importar monedero en papel","Sweep Wallet":"Importar Monedero","Sweeping Wallet...":"Leyendo el Monedero...","Tap and hold to show":"Tocar y mantener para mostrar","Tap to retry":"Toque para reintentar","Terms of Use":"Términos de Uso","The authors of the software, employees and affiliates of Bitpay, copyright holders, and BitPay, Inc. cannot retrieve your private keys or passwords if you lose or forget them and cannot guarantee transaction confirmation as they do not have control over the Bitcoin network.":"Los autores de los software, empleados y afiliados de Bitpay, los titulares de derechos de autor, y BitPay, Inc. no pueden recuperar sus claves privadas o contraseñas si se pierde o se olvida de ellos y no se puede garantizar la confirmación de la transacción, ya que no tienen control sobre la red Bitcoin.","The derivation path":"La ruta de derivación","The Ledger Chrome application is not installed":"La aplicación Ledger de Chrome no esta instalada","The password of the recovery phrase (if set)":"La contraseña de la frase de recuperación (si existe)","The payment was created but could not be completed. Please try again from home screen":"El pago fue creado pero no se pudo completar. Por favor intente nuevamente desde la pantalla de inicio","The payment was removed by creator":"El pago fue eliminado por el creador","The recovery phrase could require a password to be imported":"La frase de recuperación podría requerir una contraseña para ser importada","The request could not be understood by the server":"La solicitud no pudo ser comprendida por el servidor","The software does not constitute an account where BitPay or other third parties serve as financial intermediaries or custodians of your bitcoin.":"El software no constituye una cuenta donde BitPay u otras terceras partes sirven como intermediarios financieros o custodios de su bitcoin.","The software you are about to use functions as a free, open source, and multi-signature digital wallet.":"El software que va a utilizar es un monedero digital de código abierto y multi-firmas.","The spend proposal is not pending":"La propuesta de gasto no esta pendiente","The wallet \"{{walletName}}\" was deleted":"El monedero \"{{walletName}}\" fue eliminado","The Wallet Recovery Phrase could require a password to be imported":"La frase de recuperación del monedero podría requerir una contraseña para ser importado","The wallet service URL":"URL de Wallet Service","There are no wallets to make this payment":"No dispone de monederos para realizar este pago","There is a new version of Copay. Please update":"Hay una nueva versión de Copay. Por favor actualizar","There is an error in the form":"Hay un error en el formulario","This recovery phrase was created with a password. To recover this wallet both the recovery phrase and password are needed.":"Esta frase de recuperación fue creada con una contraseña. Para recuperar este monedero, la frase de recuperación y la contraseña son necesarios.","This transaction has become invalid; possibly due to a double spend attempt.":"Esta transacción se ha invalidado; posiblemente debido a un intento de doble gasto.","This wallet is not registered at the given Bitcore Wallet Service (BWS). You can recreate it from the local information.":"Este monedero no esta registrado en el servidor de Bitcore Wallet Service (BWS). Debe recrearlo con la información local disponible.","Time":"Hora","To":"Para","To restore this {{index.m}}-{{index.n}} <b>shared</b> wallet you will need":"Para restaurar el monedero <b>compartido</b> {{index.m}}-{{index.n}} necesitará","To the fullest extent permitted by law, this software is provided “as is” and no representations or warranties can be made of any kind, express or implied, including but not limited to the warranties of merchantability, fitness or a particular purpose and noninfringement.":"En la máxima medida permitida por la ley, este software se proporciona \"tal cual está\" y no asume la responsabilidad ni ofrece garantías de ningún tipo, expresa o implícita, incluyendo, pero no limitado a las garantías comerciales, de conveniencia o a un propósito particular.","too long!":"¡demasiado largo!","Total Locked Balance":"Balance Total Bloqueado","Total number of copayers":"Número total de copayers","Touch ID Failed":"Falló Touch ID","Transaction":"Transacción","Transaction already broadcasted":"La transacción ya fue enviada","Transaction History":"Historial de Transacciones","Translation Credits":"Créditos de traducción","Translators":"Traductores","Try again":"Vuelva a intentarlo","Type the Recovery Phrase (usually 12 words)":"Escriba la frase de recuperación (normalmente 12 palabras)","Unconfirmed":"Sin confirmar","Unit":"Unidad","Unsent transactions":"Transacciones no enviadas","Updating transaction history. Please stand by.":"Actualizando el historial de transacciones. Por favor aguarde un momento.","Updating Wallet...":"Actualizando Monedero...","Use Unconfirmed Funds":"Utilizar los fondos sin confirmar","Validating recovery phrase...":"Validando la frase de recuperación...","Validating wallet integrity...":"Validación de integridad del monedero...","Version":"Versión","View":"Ver","Waiting for copayers":"Esperando a los demás copayers","Waiting for Ledger...":"Esperando a Ledger...","Waiting for Trezor...":"Esperando a Trezor...","Waiting...":"Esperando...","Wallet already exists":"El monedero ya existe","Wallet already in Copay":"El monedero ya existe en Copay","Wallet Configuration (m-n)":"Configuración del Monedero (m-n)","Wallet Export":"Exportar Monedero","Wallet Id":"Id del Monedero","Wallet incomplete and broken":"Monedero incompleto y roto","Wallet Information":"Información del Monedero","Wallet Invitation":"Invitación para unirse al monedero","Wallet Invitation is not valid!":"¡Invitación no válida!","Wallet is full":"El monedero está completo","Wallet is locked":"Monedero bloqueado","Wallet is not complete":"El monedero no esta completo","Wallet name":"Nombre del monedero","Wallet Name (at creation)":"Nombre del Monedero (al crear)","Wallet needs backup":"El monedero requiere copia de seguridad","Wallet Network":"Red del Monedero","Wallet not found":"Monedero no encontrado","Wallet not registered at the wallet service. Recreate it from \"Create Wallet\" using \"Advanced Options\" to set your recovery phrase":"El monedero no esta registrado en Wallet Service. Para volver a crear, utilice \"Crear Monedero\", \"Opciones avanzadas\" e ingrese la frase de recuperación","Wallet Preferences":"Preferencias del Monedero","Wallet Recovery Phrase":"Frase de recuperación del monedero","Wallet Recovery Phrase is invalid":"La frase de recuperación es inválida","Wallet recovery phrase not available. You can still export it from Advanced &gt; Export.":"La frase de recuperación del monedero no está disponible. Todavía puede exportar de avanzado &gt; Exportar.","Wallet service not found":"Wallet Service no encontrado","WARNING: Key derivation is not working on this device/wallet. Actions cannot be performed on this wallet.":"ADVERTENCIA: Derivación de la clave no funciona en este dispositivo/monedero. Acciones no pueden realizarse en este monedero.","WARNING: Not including the private key allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.":"ADVERTENCIA: No incluir la clave privada permite verificar el saldo del monedero, historial de transacciones y crear propuestas de gastos. Sin embargo, no permite aprobar propuestas (firmar), así que <b>los fondos no serán accesibles al exportar</b>.","WARNING: The password cannot be recovered. <b>Be sure to write it down</b>. The wallet can not be restored without the password.":"ADVERTENCIA: La contraseña no puede ser recuperada. <b>Asegúrese de escribirlo en papel</b>. El monedero no puede ser restaurado sin la contraseña.","WARNING: The private key of this wallet is not available. The export allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.":"ADVERTENCIA: La clave privada de este monedero no está disponible. La exportación permite verificar el saldo del monedero, historial de transacciones y crear propuestas de gastos en la exportación. Sin embargo, no permite aprobar propuestas (firmar), así que <b>los fondos no serán accesibles al exportar</b>.","Warning: this transaction has unconfirmed inputs":"Advertencia: esta operación tiene entradas sin confirmar","WARNING: UNTRUSTED CERTIFICATE":"ADVERTENCIA: NO ES DE CONFIANZA EL CERTIFICADO","WARNING: Wallet not registered":"ADVERTENCIA: Monedero no registrado","Warning!":"¡Advertencia!","We reserve the right to modify this disclaimer from time to time.":"Nos reservamos el derecho a modificar el presente aviso legal de vez en cuando.","WELCOME TO COPAY":"BIENVENIDO A COPAY","While the software has undergone beta testing and continues to be improved by feedback from the open-source user and developer community, we cannot guarantee that there will be no bugs in the software.":"Mientras que el software ha experimentado pruebas en beta y aún sigue mejorando mediante la retroalimentación de la comunidad de desarrollador y usuarios de código abierto, no podemos garantizar que no habrá errores en el software.","Write your wallet recovery phrase":"Escriba la frase de recuperación del monedero","Wrong number of recovery words:":"Número incorrecto de palabras:","Wrong spending password":"Contraseña para enviar incorrecta","Yes":"Si","You acknowledge that your use of this software is at your own discretion and in compliance with all applicable laws.":"Usted reconoce que el uso de este software es bajo tu propia responsabilidad y en cumplimiento con todas las leyes aplicables.","You are responsible for safekeeping your passwords, private key pairs, PINs and any other codes you use to access the software.":"Usted es responsable de la custodia de sus contraseñas, pares de claves privadas, PIN y cualquier otro código que se utiliza para acceder al software.","You assume any and all risks associated with the use of the software.":"Usted asume todos los riesgos asociados con el uso del software.","You backed up your wallet. You can now restore this wallet at any time.":"Ya realizó una copia de seguridad de su monedero. Ahora puede restaurarlo en cualquier momento.","You can safely install your wallet on another device and use it from multiple devices at the same time.":"Con seguridad puede instalar su monedero en otro dispositivo y usarlo desde varios dispositivos al mismo tiempo.","You do not have any wallet":"No tienes ningún monedero","You need the wallet recovery phrase to restore this personal wallet. Write it down and keep them somewhere safe.":"Necesita la frase de recuperación para restaurar su monedero personal. Anótela y guárdela en algún lugar seguro.","Your nickname":"Sobrenombre","Your password":"Contraseña","Your spending password":"Contraseña para enviar","Your wallet has been imported correctly":"El monedero se ha importado correctamente","Your wallet key will be encrypted. The Spending Password cannot be recovered. Be sure to write it down":"La clave del monedero se cifrará. La contraseña para enviar no puede ser recuperada. Asegúrese de escribirla","Your wallet recovery phrase and access to the server that coordinated the initial wallet creation. You still need {{index.m}} keys to spend.":"Su frase de recuperación del monedero y el acceso al servidor que coordina la creación del monedero inicial. Aún necesita de {{index.m}} claves para enviar."});
    gettextCatalog.setStrings('fr', {"(possible double spend)":"(double dépense possible)","(Trusted)":"(Fiable)","[Balance Hidden]":"[Solde masqué]","{{fee}} will be deducted for bitcoin networking fees":"{{fee}} seront déduits pour les frais de réseau Bitcoin","{{feeRateStr}} of the transaction":"{{feeRateStr}} de la transaction","{{index.m}}-of-{{index.n}}":"{{index.m}}-sur-{{index.n}}","{{index.result.length - index.txHistorySearchResults.length}} more":"{{index.result.length - index.txHistorySearchResults.length}} de plus","{{index.txProgress}} transactions downloaded":"{{index.txProgress}} transactions téléchargées","{{item.m}}-of-{{item.n}}":"{{item.m}}-sur-{{item.n}}","* A payment proposal can be deleted if 1) you are the creator, and no other copayer has signed, or 2) 24 hours have passed since the proposal was created.":"* Une proposition de paiement peut être supprimée si vous en êtes le créateur et qu'aucun des autres copayers n'a signé, ou si 24 heures sont passées depuis la création de la proposition.","<b>IF YOU LOSE ACCESS TO YOUR COPAY WALLET OR YOUR ENCRYPTED PRIVATE KEYS AND YOU HAVE NOT SEPARATELY STORED A BACKUP OF YOUR WALLET AND CORRESPONDING PASSWORD, YOU ACKNOWLEDGE AND AGREE THAT ANY BITCOIN YOU HAVE ASSOCIATED WITH THAT COPAY WALLET WILL BECOME INACCESSIBLE.</b>":"<b>SI VOUS PERDEZ L'ACCÈS À VOTRE PORTEFEUILLE COPAY OU À VOS CLÉS PRIVÉES CHIFFRÉES ET QUE VOUS N'AVEZ PAS ENTREPOSÉ SÉPARÉMENT UNE SAUVEGARDE DE VOTRE PORTEFEUILLE ET LES MOTS DE PASSE CORRESPONDANT, VOUS RECONNAISSEZ ET ACCEPTEZ QUE LES BITCOINS QUE VOUS AVEZ ASSOCIÉ À CE PORTEFEUILLE COPAY DEVIENNENT INACCESSIBLES.</b>","<b>OR</b> 1 wallet export file and the remaining quorum of wallet recovery phrases (e.g. in a 3-5 wallet: 1 wallet export file + 2 wallet recovery phrases of any of the other copayers).":"<b>OU</b> 1 fichier d'exportation de portefeuille et le quorum restant en phrases de récupération de portefeuille (ex. dans un portefeuille 3-5 : 1 fichier d'exportation du portefeuille + 2 phrases de récupération du portefeuille de n'importe quels autres copayers).","<b>OR</b> the wallet recovery phrase of <b>all</b> copayers in the wallet":"<b>OU</b> la phrase de récupération de portefeuille de <b>tous</b> les copayers du portefeuille","<b>OR</b> the wallet recovery phrases of <b>all</b> copayers in the wallet":"<b>OU</b> les phrases de récupération de portefeuille de <b>tous</b> les copayers du portefeuille","A multisignature bitcoin wallet":"Un portefeuille bitcoin multi-signatures","About Copay":"À propos de Copay","Accept":"Accepter","Account":"Compte","Account Number":"Numéro de compte","Activity":"Activité","Add a new entry":"Ajouter une nouvelle entrée","Add a Password":"Ajouter un mot de passe","Add an optional password to secure the recovery phrase":"Ajouter un mot de passe optionnel pour sécuriser la phrase de récupération","Add comment":"Ajouter un commentaire","Add wallet":"Ajouter portefeuille","Address":"Adresse","Address Type":"Type d'adresse","Advanced":"Paramètres avancés","Alias":"Alias","Alias for <i>{{index.walletName}}</i>":"Alias pour <i>{{index.walletName}}</i>","All contributions to Copay's translation are welcome. Sign up at crowdin.com and join the Copay project at":"Toutes les contributions à la traduction de Copay sont les bienvenues. Inscrivez-vous sur crowdin.com et rejoignez le projet Copay sur","All transaction requests are irreversible.":"Toutes les transactions sont irréversibles.","Alternative Currency":"Devise alternative","Amount":"Montant","Amount below minimum allowed":"Montant en dessous du minimum autorisé","Amount in":"Montant en","Are you sure you want to delete the recovery phrase?":"Êtes-vous sûr(e) de vouloir supprimer la phrase de récupération ?","Are you sure you want to delete this wallet?":"Êtes-vous certain(e) de vouloir supprimer ce portefeuille ?","Auditable":"Vérifiable","Available Balance":"Solde disponible","Average confirmation time: {{fee.nbBlocks * 10}} minutes":"Temps de confirmation moyen : {{fee.nbBlocks * 10}} minutes","Back":"Retour","Backup":"Sauvegarder","Backup failed":"La sauvegarde a échoué","Backup Needed":"Sauvegarde requise","Backup now":"Sauvegarder","Bad wallet invitation":"Mauvaise invitation de portefeuille","Balance By Address":"Solde par adresse","Before receiving funds, you must backup your wallet. If this device is lost, it is impossible to access your funds without a backup.":"Avant de recevoir des fonds, vous devez sauvegarder votre portefeuille. Si vous perdez cet appareil, vos fonds seront irrécupérables sans une sauvegarde.","BETA: Android Key Derivation Test:":"BETA: Android Key Derivation Test:","BIP32 path for address derivation":"Chemin BIP32 pour la dérivation de l'adresse","Bitcoin address":"Adresse Bitcoin","Bitcoin Network Fee Policy":"Frais de réseau","Bitcoin transactions may include a fee collected by miners on the network. The higher the fee, the greater the incentive a miner has to include that transaction in a block. Current fees are determined based on network load and the selected policy.":"Les transactions Bitcoin peuvent inclure des frais prélevés par les mineurs du réseau. Plus les frais sont importants, et plus un mineur sera incité à inclure cette transaction dans un bloc. Les frais actuels sont déterminés en fonction de la charge du réseau et du choix sélectionné.","Bitcoin URI is NOT valid!":"L'URI Bitcoin n'est pas valide !","Broadcast Payment":"Diffuser le paiement","Broadcasting transaction":"Diffusion de la transaction","Browser unsupported":"Navigateur non supporté","Buy and Sell":"Acheter et Vendre","Calculating fee":"Calcul des frais","Cancel":"Annuler","Cancel and delete the wallet":"Annuler et supprimer le portefeuille","Cannot create transaction. Insufficient funds":"Impossible de créer la transaction. Fonds insuffisants","Cannot join the same wallet more that once":"Impossible de rejoindre le même portefeuille plus d'une fois","Cannot sign: The payment request has expired":"Impossible de signer : la demande de paiement a expiré","Certified by":"Certifié par","Changing wallet alias only affects the local wallet name.":"La modification d'un alias de portefeuille affecte uniquement le nom du portefeuille local.","Chinese":"Chinois","Choose a backup file from your computer":"Choisissez un fichier de sauvegarde depuis votre ordinateur","Clear cache":"Vider le cache","Close":"Fermer","Color":"Couleur","Comment":"Commentaire","Commit hash":"Commit hash","Confirm":"Confirmer","Confirm your wallet recovery phrase":"Confirmez votre phrase de récupération du portefeuille","Confirmations":"Confirmations","Congratulations!":"Félicitations !","Connecting to Coinbase...":"Connexion à Coinbase...","Connecting to Glidera...":"Connexion à Glidera...","Connection reset by peer":"Connexion réinitialisée par un pair","Continue":"Continuer","Copayer already in this wallet":"Copayer déjà dans ce portefeuille","Copayer already voted on this spend proposal":"Le Copayer a déjà voté pour cette proposition de dépense","Copayer data mismatch":"Les données Copayer ne correspondent pas","Copayers":"Copayers","Copied to clipboard":"Copié dans le presse-papier","Copy this text as it is to a safe place (notepad or email)":"Copiez ce texte présenté tel quel vers un endroit sûr (bloc-notes ou e-mail)","Copy to clipboard":"Copier dans le presse-papier","Could not access the wallet at the server. Please check:":"Impossible d'accéder au portefeuille via le serveur. Veuillez vérifier :","Could not access wallet":"Impossible d’accéder au portefeuille","Could not access Wallet Service: Not found":"Impossible d'accéder au Wallet Service : Introuvable","Could not broadcast payment":"Impossible de diffuser le paiement","Could not build transaction":"Impossible de créer la transaction","Could not create address":"Impossible de créer l'adresse","Could not create payment proposal":"Impossible de créer la proposition de paiement","Could not create using the specified extended private key":"Impossible de créer en utilisant la clé privée étendue spécifiée","Could not create using the specified extended public key":"Impossible de créer en utilisant la clé publique étendue spécifiée","Could not create: Invalid wallet recovery phrase":"Impossible de créer : Phrase de récupération du portefeuille invalide","Could not decrypt file, check your password":"Impossible de déchiffrer le fichier, vérifiez votre mot de passe","Could not delete payment proposal":"Impossible de supprimer la proposition de paiement","Could not fetch payment information":"Impossible de récupérer les informations de paiement","Could not get fee value":"Impossible d'obtenir la valeur des frais","Could not import":"Impossible d'importer","Could not import. Check input file and spending password":"Impossible d'importer. Vérifiez le fichier d'entrée et le code de dépenses","Could not join wallet":"Impossible de rejoindre le portefeuille","Could not recognize a valid Bitcoin QR Code":"Impossible de reconnaître un code QR Bitcoin valide","Could not reject payment":"Impossible de rejeter le paiement","Could not send payment":"Impossible d'envoyer le paiement","Could not update Wallet":"Impossible de mettre à jour le portefeuille","Create":"Créer","Create {{requiredCopayers}}-of-{{totalCopayers}} wallet":"Créer un portefeuille {{requiredCopayers}}-sur-{{totalCopayers}}","Create new wallet":"Créer","Create, join or import":"Créer, rejoindre ou importer","Created by":"Créée par","Creating transaction":"Création de la transaction","Creating Wallet...":"Création du portefeuille...","Current fee rate for this policy: {{fee.feePerKBUnit}}/kiB":"Frais actuels pour ce choix : {{fee.feePerKBUnit}}/kiB","Czech":"Tchèque","Date":"Date","Decrypting a paper wallet could take around 5 minutes on this device. please be patient and keep the app open.":"Le déchiffrement d'un portefeuille de papier peut prendre environ 5 minutes sur cet appareil. Veuillez être patient et gardez l'application ouverte.","Delete it and create a new one":"Le supprimer et en créer un nouveau","Delete Payment Proposal":"Supprimer la proposition de paiement","Delete recovery phrase":"Supprimer la phrase de récupération","Delete Recovery Phrase":"Supprimer la phrase de récupération","Delete wallet":"Supprimer le portefeuille","Delete Wallet":"Supprimer le portefeuille","Deleting Wallet...":"Suppression du portefeuille...","Derivation Path":"Chemin de dérivation","Derivation Strategy":"Stratégie de dérivation","Description":"Description","Details":"Détails","Disabled":"Désactivé","Do not include private key":"Ne pas inclure la clé privée","Don't see your language on Crowdin? Contact the Owner on Crowdin! We'd love to support your language.":"Vous ne voyez pas votre langue sur Crowdin ? Contactez le propriétaire sur Crowdin ! Nous serions ravis de prendre en charge votre langue.","Done":"Terminé","Download":"Télécharger","Economy":"Faibles","Edit":"Modifier","Edit comment":"Modifier le commentaire","Edited by":"Modifié par","Email for wallet notifications":"E-mail pour les notifications de portefeuille","Email Notifications":"Notifications e-mail","Empty addresses limit reached. New addresses cannot be generated.":"La limite d'adresses vides a été atteinte. Les nouvelles adresses ne peuvent plus être générées.","Enable Coinbase Service":"Activer le service Coinbase","Enable Glidera Service":"Activer le service Glidera","Enable push notifications":"Autoriser les notifications push","Encrypted export file saved":"Le fichier d'exportation chiffré a été enregistré","Enter the recovery phrase (BIP39)":"Saisissez la phrase de récupération (BIP39)","Enter your password":"Écrivez votre mot de passe","Enter your spending password":"Saisissez votre code de dépenses","Error at Wallet Service":"Erreur au niveau de Wallet Service","Error creating wallet":"Erreur de création du portefeuille","Expired":"Expiré","Expires":"Expire","Export options":"Options d'exportation","Export to file":"Exporter vers un fichier","Export Wallet":"Exporter le portefeuille","Exporting via QR not supported for this wallet":"L'exportation via QR n'est pas supportée pour ce portefeuille","Extended Public Keys":"Clés publiques étendues","Extracting Wallet Information...":"Extraction des informations du portefeuille...","Failed to export":"Impossible d'exporter","Failed to verify backup. Please check your information":"Impossible de vérifier la sauvegarde. Veuillez vérifier vos informations","Family vacation funds":"Fonds pour les vacances familiales","Fee":"Frais","Fetching Payment Information":"Récupération des informations de paiement","File/Text":"Fichier / Texte","Finger Scan Failed":"La numérisation digitale a échoué","Finish":"Terminer","For audit purposes":"À des fins de vérification","French":"Français","From the destination device, go to Add wallet &gt; Import wallet and scan this QR code":"Depuis le périphérique de destination, allez sur « Ajouter portefeuille » &gt; « Importer » et numérisez ce code QR","Funds are locked by pending spend proposals":"Les fonds sont verrouillés par des propositions de dépenses en attente","Funds found":"Fonds trouvés","Funds received":"Fonds reçus","Funds will be transferred to":"Les fonds seront transférés à","Generate new address":"Générer une nouvelle adresse","Generate QR Code":"Générer un code QR","Generating .csv file...":"Génération du fichier .csv...","German":"Allemand","Getting address for wallet {{selectedWalletName}} ...":"Obtention d'une adresse pour le portefeuille {{selectedWalletName}} ...","Global preferences":"Préférences globales","Hardware wallet":"Portefeuille matériel","Hardware Wallet":"Portefeuille matériel","Hide advanced options":"Masquer les options avancées","I affirm that I have read, understood, and agree with these terms.":"Je confirme que j'ai lu, compris et suis d'accord avec ces conditions.","I AGREE. GET STARTED":"J’ACCEPTE. COMMENCER","Import":"Importer","Import backup":"Importer la sauvegarde","Import wallet":"Importer","Importing Wallet...":"Importation du portefeuille...","In no event shall the authors of the software, employees and affiliates of Bitpay, copyright holders, or BitPay, Inc. be held liable for any claim, damages or other liability, whether in an action of contract, tort, or otherwise, arising from, out of or in connection with the software.":"En aucun cas les auteurs du logiciel, employés et sociétés affiliés de Bitpay, détenteurs de droits d'auteur, ou BitPay, Inc. ne peuvent être tenus responsables de toute réclamation, dommages ou autre responsabilité, que ce soit dans une action contractuelle, délictuelle ou autre, découlant ou en étant en connexion avec le logiciel.","In order to verify your wallet backup, please type your password:":"Afin de vérifier votre sauvegarde du portefeuille, veuillez saisir votre mot de passe :","Incorrect address network":"Adresse réseau incorrecte","Incorrect code format":"Format du code incorrect","Insufficient funds":"Fonds insuffisants","Insufficient funds for fee":"Fonds insuffisants pour les frais","Invalid":"Invalide","Invalid account number":"Numéro de compte invalide","Invalid address":"Adresse invalide","Invalid derivation path":"Chemin de dérivation invalide","Invitation to share a Copay Wallet":"Invitation pour partager un portefeuille Copay","Italian":"Italien","Japanese":"Japonais","John":"John","Join":"Rejoindre","Join my Copay wallet. Here is the invitation code: {{secret}} You can download Copay for your phone or desktop at https://copay.io":"Rejoignez mon portefeuille Copay. Voici le code d'invitation : {{secret}} Vous pouvez télécharger Copay pour votre téléphone ou pour votre ordinateur sur https://copay.io","Join shared wallet":"Rejoindre","Joining Wallet...":"Connexion au portefeuille...","Key already associated with an existing wallet":"La clé est déjà associée avec un portefeuille existant","Label":"Étiquette","Language":"Langue","Last Wallet Addresses":"Dernières adresses du portefeuille","Learn more about Copay backups":"En savoir plus sur les sauvegardes de Copay","Loading...":"Chargement...","locked by pending payments":"verrouillés par les paiements en attente","Locktime in effect. Please wait to create a new spend proposal":"Locktime effectif. Veuillez patienter pour créer une nouvelle proposition de dépense","Locktime in effect. Please wait to remove this spend proposal":"Locktime effectif. Veuillez patienter pour supprimer cette proposition de dépense","Make a payment to":"Faire un paiement à","Matches:":"Correspondances :","me":"moi","Me":"Moi","Memo":"Note","Merchant message":"Message marchand","Message":"Message","Missing parameter":"Paramètre manquant","Missing private keys to sign":"Clés privées manquantes pour signer","Moved":"Déplacés","Multiple recipients":"Plusieurs destinataires","My Bitcoin address":"Mon adresse Bitcoin","My contacts":"Mes contacts","My wallets":"Mes portefeuilles","Need to do backup":"Vous devez faire une sauvegarde","Network":"Réseau","Network connection error":"Erreur de connexion réseau","New Payment Proposal":"Nouvelle proposition de paiement","New Random Recovery Phrase":"Nouvelle phrase de récupération aléatoire","No hardware wallets supported on this device":"Aucun portefeuille matériel pris en charge sur cet appareil","No transactions yet":"Aucune transaction","Normal":"Normaux","Not authorized":"Non autorisé","Not completed":"Inachevée","Not enough funds for fee":"Pas assez de fonds pour les frais","Not valid":"Invalide","Note":"Note","Note: a total of {{amountAboveMaxSizeStr}} were excluded. The maximum size allowed for a transaction was exceeded":"Note : un total de {{amountAboveMaxSizeStr}} a été exclu. La taille maximale autorisée d'une transaction a été dépassée","Note: a total of {{amountBelowFeeStr}} were excluded. These funds come from UTXOs smaller than the network fee provided.":"Note : un total de {{amountBelowFeeStr}} a été exclu. Ces fonds proviennent d'une entrée plus petite que les frais de réseau prévus.","NOTE: To import a wallet from a 3rd party software, please go to Add Wallet &gt; Create Wallet, and specify the Recovery Phrase there.":"Remarque : Pour importer un portefeuille d’un autre logiciel que Copay, veuillez aller dans « Ajouter portefeuille » &gt; « Créer » et spécifier la phrase de récupération.","Official English Disclaimer":"Clause de non-responsabilité anglaise officielle","OKAY":"OK","Once you have copied your wallet recovery phrase down, it is recommended to delete it from this device.":"Une fois que vous avez écrit votre phrase de récupération du portefeuille, il est recommandé de la supprimer de cet appareil.","Only Main (not change) addresses are shown. The addresses on this list were not verified locally at this time.":"Seules les adresses principales (pas celles de change) sont indiquées. Les adresses sur cette liste n'ont pas été vérifiées localement à ce moment.","Open Settings app":"Ouvrir les paramètres de l'appli","optional":"optionnelle","Paper Wallet Private Key":"Clé privée du portefeuille de papier","Participants":"Participants","Passphrase":"Phrase de passe","Password":"Mot de passe","Password required. Make sure to enter your password in advanced options":"Mot de passe requis. Veuillez saisir votre mot de passe dans les options avancées","Paste invitation here":"Collez l'invitation ici","Paste the backup plain text code":"Collez le code texte de sauvegarde","Paste your paper wallet private key here":"Collez ici votre clé privée du portefeuille de papier","Pasted from clipboard":"Collé depuis le presse-papier","Pay To":"Payer à","Payment Accepted":"Paiement accepté","Payment accepted, but not yet broadcasted":"Paiement accepté, mais pas encore diffusé","Payment accepted. It will be broadcasted by Glidera. In case there is a problem, it can be deleted 6 hours after it was created.":"Paiement accepté. Il sera diffusé par Glidera. Dans le cas où il y a un problème, il peut être supprimé 6 heures après avoir été créé.","Payment details":"Détails du paiement","Payment expires":"Paiement expiré","Payment Proposal":"Proposition de paiement","Payment Proposal Created":"Proposition de paiement créée","Payment Proposal Rejected":"Proposition de paiement rejetée","Payment Proposal Rejected by Copayer":"Proposition de paiement rejetée par les Copayer","Payment Proposal Signed by Copayer":"Proposition de paiement signée par les Copayers","Payment Proposals":"Propositions de paiement","Payment Protocol Invalid":"Protocole de paiement invalide","Payment Protocol not supported on Chrome App":"Le protocole de paiement n'est pas supporté sur l'application Chrome","Payment Rejected":"Paiement rejeté","Payment request":"Demande de paiement","Payment Sent":"Paiement envoyé","Payment to":"Paiement à","Pending Confirmation":"Confirmation en attente","Permanently delete this wallet. THIS ACTION CANNOT BE REVERSED":"Supprimer définitivement ce portefeuille.<br><b>CETTE ACTION NE PEUT PAS ÊTRE ANNULÉE</b>","Personal Wallet":"Portefeuille personnel","Please enter the recovery phrase":"Veuillez saisir la phrase de récupération","Please enter the required fields":"Veuillez saisir les champs requis","Please enter the wallet recovery phrase":"Veuillez saisir la phrase de récupération du portefeuille","Please tap the words in order to confirm your backup phrase is correctly written.":"Veuillez sélectionner les mots afin de confirmer que votre phrase de sauvegarde est correctement écrite.","Please upgrade Copay to perform this action":"Veuillez mettre à jour Copay pour effectuer cette action","Please wait to be redirected...":"Veuillez attendre la redirection...","Please, select your backup file":"Veuillez sélectionner votre fichier de sauvegarde","Polish":"Polonais","Preferences":"Préférences","Preparing backup...":"Préparation de la sauvegarde...","preparing...":"préparation...","Press again to exit":"Appuyez de nouveau pour quitter","Priority":"Importants","Private key is encrypted, cannot sign":"La clé privée est chiffrée, impossible de signer","Push notifications for Copay are currently disabled. Enable them in the Settings app.":"Les notifications push de Copay sont actuellement désactivées. Activez-les dans les paramètres de l'appli.","QR Code":"Code QR","QR-Scanner":"QR-Scanner","Receive":"Recevoir","Received":"Reçus","Recipients":"Destinataire(s)","Recovery Phrase":"Phrase de récupération","Recovery phrase deleted":"Phrase de récupération supprimée","Recreate":"Recréer","Recreating Wallet...":"Recréation du portefeuille...","Reject":"Rejeter","Release Information":"Informations de version","Remove":"Supprimer","Repeat password":"Confirmez le mot de passe","Repeat the password":"Confirmez le mot de passe","Repeat the spending password":"Confirmez le code de dépenses","Request a specific amount":"Demander un montant précis","Request Spending Password":"Demander un code de dépenses","Required":"Requis","Required number of signatures":"Nombre requis de signatures","Retrieving inputs information":"Récupération des informations d'entrée","Russian":"Russe","Save":"Valider","Scan addresses for funds":"Analyser les adresses pour des fonds","Scan Fingerprint":"Scanner l'empreinte digitale","Scan Finished":"Analyse terminée","Scan status finished with error":"Analyse terminée avec des erreurs","Scan Wallet Funds":"Analyser les fonds du portefeuille","Scan your fingerprint please":"Veuillez scanner votre empreinte digitale","Scanning Wallet funds...":"Analyse des fonds du portefeuille...","Search transactions":"Rechercher des transactions","Search Transactions":"Rechercher des transactions","Security preferences":"Préférences de sécurité","See it on the blockchain":"Voir sur la blockchain","Select a backup file":"Sélectionner un fichier de sauvegarde","Select a wallet":"Sélectionner un portefeuille","Self-signed Certificate":"Certificat auto-signé","Send":"Envoyer","Send addresses by email":"Envoyer les adresses par e-mail","Send bitcoin":"Envoyer les bitcoins","Send by email":"Envoyer par e-mail","Send Max":"Envoyer le maximum","Sending":"Envoi","Sending transaction":"Envoi de la transaction","Sent":"Envoyés","Server response could not be verified":"La réponse du serveur n'a pas pu être vérifiée","Session log":"Journal de session","SET":"DÉFINIR","Set default url":"Définir l'url par défaut","Set up a password":"Spécifiez un mot de passe","Set up a spending password":"Configurer un code de dépenses","Setting up email notifications could weaken your privacy, if the wallet service provider is compromised. Information available to an attacker would include your wallet addresses and its balance, but no more.":"Configurer des notifications e-mail peut affaiblir votre anonymat si le fournisseur du service de portefeuille est compromis. Les informations disponibles à un attaquant incluent les adresses de votre portefeuille et leurs soldes, mais rien de plus.","Settings":"Paramètres","Share address":"Partager l'adresse","Share invitation":"Partager l'invitation","Share this invitation with your copayers":"Partagez cette invitation avec vos copayers","Share this wallet address to receive payments":"Partagez cette adresse de portefeuille pour recevoir des paiements","Share this wallet address to receive payments. To protect your privacy, new addresses are generated automatically once you use them.":"Partagez cette adresse de portefeuille pour recevoir des paiements. Pour protéger votre anonymat, de nouvelles adresses sont générées automatiquement une fois que vous les utilisez.","Shared Wallet":"Portefeuille partagé","Show advanced options":"Afficher les options avancées","Signatures rejected by server":"Signatures rejetées par le serveur","Signing transaction":"Signature de la transaction","Single Address Wallet":"Portefeuille d'adresse unique","Spanish":"Espagnol","Specify Recovery Phrase...":"Spécifier la phrase de récupération...","Spend proposal is not accepted":"La proposition de dépense n'est pas acceptée","Spend proposal not found":"Propostion de dépense introuvable","Spending Password needed":"Code de dépenses requis","Spending Passwords do not match":"Les codes de dépenses ne correspondent pas","Success":"Succès","Super Economy":"Infimes","Sweep paper wallet":"Balayer un portefeuille de papier","Sweep Wallet":"Balayer un portefeuille","Sweeping Wallet...":"Balayage du portefeuille...","Tap and hold to show":"Appuyez et maintenez pour afficher","Tap to retry":"Tapotez pour réessayer","Terms of Use":"Conditions d'utilisation","The authors of the software, employees and affiliates of Bitpay, copyright holders, and BitPay, Inc. cannot retrieve your private keys or passwords if you lose or forget them and cannot guarantee transaction confirmation as they do not have control over the Bitcoin network.":"Les auteurs de ce logiciel, employés et sociétés affiliés à BitPay, détenteurs de droits d'auteur, et BitPay, Inc. ne peuvent pas récupérer vos clés privées ou mots de passe si vous les perdez et ne peuvent pas garantir la confirmation des transactions étant donné qu'ils n'ont pas de contrôle sur le réseau Bitcoin.","The derivation path":"Le chemin de dérivation","The Ledger Chrome application is not installed":"L'application Ledger pour Chrome n'est pas installée","The password of the recovery phrase (if set)":"Le mot de passe de la phrase de récupération (si configuré)","The payment was created but could not be completed. Please try again from home screen":"Le paiement a été créé mais n'a pas pu être achevé. Veuillez réessayer depuis l'écran d'accueil","The payment was removed by creator":"Le paiement a été supprimé par le créateur","The recovery phrase could require a password to be imported":"La phrase de récupération pourrait demander un mot de passe pour être importée","The request could not be understood by the server":"La demande n'a pas été comprise par le serveur","The software does not constitute an account where BitPay or other third parties serve as financial intermediaries or custodians of your bitcoin.":"Le logiciel ne constitue pas un compte où BitPay, ou des tiers, agissent comme des intermédiaires financiers ou dépositaires de vos bitcoins.","The software you are about to use functions as a free, open source, and multi-signature digital wallet.":"Le logiciel que vous êtes sur le point d'utiliser fonctionne comme un portefeuille numérique gratuit, open source et multi-signatures.","The spend proposal is not pending":"La proposition de dépense n'est pas en attente","The wallet \"{{walletName}}\" was deleted":"Le portefeuille \"{{walletName}}\" a été supprimé","The Wallet Recovery Phrase could require a password to be imported":"La phrase de récupération du portefeuille pourrait demander un mot de passe pour être importée","The wallet service URL":"L’URL du service de portefeuille","There are no wallets to make this payment":"Il n'y a pas de portefeuilles pour faire ce paiement","There is a new version of Copay. Please update":"Il y a une nouvelle version de Copay. Veuillez mettre à jour","There is an error in the form":"Il y a une erreur dans la forme","This recovery phrase was created with a password. To recover this wallet both the recovery phrase and password are needed.":"Cette phrase de récupération a été créée avec un mot de passe. Pour récupérer ce portefeuille, la phrase de récupération et le mot de passe sont requis.","This transaction has become invalid; possibly due to a double spend attempt.":"Cette transaction est devenue invalide ; il s'agit peut-être d'une tentative de double dépense.","This wallet is not registered at the given Bitcore Wallet Service (BWS). You can recreate it from the local information.":"Ce portefeuille n'est pas enregistré dans le Bitcore Wallet Service (BWS) donné. Vous pouvez le recréer depuis l'information locale.","Time":"Ancienneté","To":"À","To restore this {{index.m}}-{{index.n}} <b>shared</b> wallet you will need":"Pour restaurer ce portefeuille <b>partagé</b> {{index.m}}-{{index.n}} vous aurez besoin de","To the fullest extent permitted by law, this software is provided “as is” and no representations or warranties can be made of any kind, express or implied, including but not limited to the warranties of merchantability, fitness or a particular purpose and noninfringement.":"Dans toute la mesure permise par la loi, ce logiciel est fourni “tel quel” et aucune représentation ou garantie ne peut être faite de toute nature, expresse ou implicite, y compris, mais sans s'y limiter, aux garanties de qualité marchande, à la conformité ou à un usage particulier et absent de contrefaçon.","too long!":"trop long !","Total Locked Balance":"Solde verrouillé total","Total number of copayers":"Nombre total de copayers","Touch ID Failed":"Touch ID a échoué","Transaction":"Transaction","Transaction already broadcasted":"Transaction déjà diffusée","Transaction History":"Historique des transactions","Translation Credits":"Crédits de traduction","Translators":"Traducteurs","Try again":"Réessayer","Type the Recovery Phrase (usually 12 words)":"Saisissez la phrase de récupération (généralement 12 mots)","Unconfirmed":"Non confirmée","Unit":"Unité","Unsent transactions":"Transactions non envoyées","Updating transaction history. Please stand by.":"Mise à jour de l'historique des transactions. Veuillez patienter.","Updating Wallet...":"Mise à jour du portefeuille...","Use Unconfirmed Funds":"Utiliser les fonds non confirmés","Validating recovery phrase...":"Validation de la phrase de récupération...","Validating wallet integrity...":"Validation de l’intégrité du portefeuille...","Version":"Version","View":"Voir","Waiting for copayers":"Attente des copayers","Waiting for Ledger...":"En attente de Ledger...","Waiting for Trezor...":"En attente de Trezor...","Waiting...":"Attente...","Wallet already exists":"Le portefeuille existe déjà","Wallet already in Copay":"Le portefeuille existe déjà dans Copay","Wallet Configuration (m-n)":"Configuration du portefeuille (m-n)","Wallet Export":"Exportation du portefeuille","Wallet Id":"Id du portefeuille","Wallet incomplete and broken":"Portefeuille incomplet et cassé ","Wallet Information":"Informations du portefeuille","Wallet Invitation":"Invitation de portefeuille","Wallet Invitation is not valid!":"L'invitation de portefeuille n'est pas valide !","Wallet is full":"Le portefeuille est plein","Wallet is locked":"Le portefeuille est verrouillé","Wallet is not complete":"Le portefeuille n'est pas complet","Wallet name":"Nom du portefeuille","Wallet Name (at creation)":"Nom du portefeuille (à la création)","Wallet needs backup":"Le portefeuille a besoin d'une sauvegarde","Wallet Network":"Réseau du portefeuille","Wallet not found":"Portefeuille introuvable","Wallet not registered at the wallet service. Recreate it from \"Create Wallet\" using \"Advanced Options\" to set your recovery phrase":"Le portefeuille n'est pas enregistré au Wallet Service. Vous pouvez le recréer depuis « Créer » en utilisant les « Options avancées » pour configurer votre phrase de récupération","Wallet Preferences":"Préférences du portefeuille","Wallet Recovery Phrase":"Phrase de récupération","Wallet Recovery Phrase is invalid":"La phrase de récupération du portefeuille est invalide","Wallet recovery phrase not available. You can still export it from Advanced &gt; Export.":"La phrase de récupération du portefeuille n'est pas disponible. Vous pouvez toujours l'exporter depuis les « Paramètres avancés » &gt; « Exporter ».","Wallet service not found":"Wallet Service introuvable","WARNING: Key derivation is not working on this device/wallet. Actions cannot be performed on this wallet.":"ATTENTION : La dérivation de la clé ne fonctionne pas sur cet appareil / portefeuille. Impossible d’effectuer des actions sur ce portefeuille.","WARNING: Not including the private key allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.":"ATTENTION : Ne pas inclure la clé privée permet de vérifier le solde du portefeuille, l'historique des transactions, et de créer des demandes de dépenses depuis le fichier exporté. Cependant, cela ne permet pas d'approuver (signer) les propositions <b>et les fonds ne seront pas accessibles depuis le fichier exporté</b>.","WARNING: The password cannot be recovered. <b>Be sure to write it down</b>. The wallet can not be restored without the password.":"ATTENTION : Le mot de passe ne peut pas être récupéré. <b>Veillez l'écrire sur papier</b>. Le portefeuille ne peut pas être restauré sans le mot de passe.","WARNING: The private key of this wallet is not available. The export allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.":"ATTENTION : La clé privée de ce portefeuille n'est pas disponible. L'exportation permet de vérifier le solde du portefeuille, l'historique des transactions, et de créer des propositions de dépenses depuis le fichier exporté. Cependant, cela ne permet pas d'approuver (signer) les propositions <b>et les fonds ne seront pas accessibles depuis le fichier exporté</b>.","Warning: this transaction has unconfirmed inputs":"ATTENTION : Cette transaction a des entrées non confirmées","WARNING: UNTRUSTED CERTIFICATE":"ATTENTION : CERTIFICAT NON APPROUVÉ","WARNING: Wallet not registered":"ATTENTION : Portefeuille non enregistré","Warning!":"Attention !","We reserve the right to modify this disclaimer from time to time.":"Nous nous réservons le droit de modifier cette clause de non-responsabilité de temps à autre.","WELCOME TO COPAY":"BIENVENUE SUR COPAY","While the software has undergone beta testing and continues to be improved by feedback from the open-source user and developer community, we cannot guarantee that there will be no bugs in the software.":"Bien que le logiciel ait subi des tests bêta et continue d'être amélioré par les retours d'utilisateurs et de développeurs de la communauté open source, nous ne pouvons pas garantir qu'il n'y aura plus de bugs dans le logiciel.","Write your wallet recovery phrase":"Écrivez votre phrase de récupération du portefeuille","Wrong number of recovery words:":"Nombre incorrect de mots de récupération :","Wrong spending password":"Code de dépenses incorrect","Yes":"Oui","You acknowledge that your use of this software is at your own discretion and in compliance with all applicable laws.":"Vous reconnaissez que votre utilisation de ce logiciel est à votre propre discrétion et est en conformité avec toutes les lois applicables.","You are responsible for safekeeping your passwords, private key pairs, PINs and any other codes you use to access the software.":"Vous êtes responsable de la sauvegarde de vos mots de passe, paires de clés privées, codes PIN et autres codes que vous utilisez pour accéder au logiciel.","You assume any and all risks associated with the use of the software.":"Vous assumez tous les risques associés à l'utilisation du logiciel.","You backed up your wallet. You can now restore this wallet at any time.":"Vous avez sauvegardé votre portefeuille. Vous pouvez maintenant restaurer ce portefeuille à n'importe quel moment.","You can safely install your wallet on another device and use it from multiple devices at the same time.":"Vous pouvez installer en toute sécurité votre portefeuille sur un autre appareil et l'utiliser à partir de plusieurs périphériques en même temps.","You do not have any wallet":"Vous n'avez aucun portefeuille","You need the wallet recovery phrase to restore this personal wallet. Write it down and keep them somewhere safe.":"Vous avez besoin de la phrase de récupération du portefeuille pour restaurer ce portefeuille personnel. Notez-la et conservez-la dans un endroit sûr.","Your nickname":"Votre surnom","Your password":"Votre mot de passe","Your spending password":"Votre code de dépenses","Your wallet has been imported correctly":"Votre portefeuille a été correctement importé","Your wallet key will be encrypted. The Spending Password cannot be recovered. Be sure to write it down":"La clé de votre portefeuille sera chiffrée. Le code de dépenses ne peut pas être récupéré. N'oubliez pas de l'écrire","Your wallet recovery phrase and access to the server that coordinated the initial wallet creation. You still need {{index.m}} keys to spend.":"Votre phrase de récupération du portefeuille et l'accès au serveur qui a coordonné la création du portefeuille initial. Vous avez encore besoin de {{index.m}} clés pour dépenser."});
    gettextCatalog.setStrings('it', {"(possible double spend)":"(possibile doppia spesa)","(Trusted)":"(Fidato)","[Balance Hidden]":"[Fondi Nascosti]","{{fee}} will be deducted for bitcoin networking fees":"{{fee}} verranno detratti come commissione del network","{{feeRateStr}} of the transaction":"{{feeRateStr}} della transazione","{{index.m}}-of-{{index.n}}":"{{index.m}}-di-{{index.n}}","{{index.result.length - index.txHistorySearchResults.length}} more":"{{index.result.length - index.txHistorySearchResults.length}} altre","{{index.txProgress}} transactions downloaded":"{{index.txProgress}} transazioni scaricate","{{item.m}}-of-{{item.n}}":"{{item.m}}-di-{{item.n}}","* A payment proposal can be deleted if 1) you are the creator, and no other copayer has signed, or 2) 24 hours have passed since the proposal was created.":"* Una proposta di pagamento può essere eliminata se 1) Tu sei il creatore e nessun altro copayer ha firmato, oppure 2) Sono passate 24 ore da quando la proposta e' stata creata.","<b>IF YOU LOSE ACCESS TO YOUR COPAY WALLET OR YOUR ENCRYPTED PRIVATE KEYS AND YOU HAVE NOT SEPARATELY STORED A BACKUP OF YOUR WALLET AND CORRESPONDING PASSWORD, YOU ACKNOWLEDGE AND AGREE THAT ANY BITCOIN YOU HAVE ASSOCIATED WITH THAT COPAY WALLET WILL BECOME INACCESSIBLE.</b>":"<b>Se perdi l'accesso al tuo portafoglio COPAY o tuo crittografato chiavi PRIVATE e non hai archiviato separatamente una copia di BACKUP del vostro portafoglio e la corrispondente PASSWORD, tu riconosci e accetti che qualsiasi BITCOIN associato con quel portafoglio COPAY diventerà inaccessibile.</b>","<b>OR</b> 1 wallet export file and the remaining quorum of wallet recovery phrases (e.g. in a 3-5 wallet: 1 wallet export file + 2 wallet recovery phrases of any of the other copayers).":"<b>O</b> 1 file di portafoglio esportato e il restante quorum di frasi di recupero portafoglio (ad esempio in un 3-5 portafogli: 1 file di portafoglio esportato + 2 frasi di recupero portafoglio di qualsiasi degli altri copayers).","<b>OR</b> the wallet recovery phrase of <b>all</b> copayers in the wallet":"<b>O</b> la frase di recupero di portafoglio di <b>tutti</b> i copayers nel portafoglio","<b>OR</b> the wallet recovery phrases of <b>all</b> copayers in the wallet":"<b>O</b> le frasi di recupero di portafoglio di <b>tutti</b> i copayers nel portafoglio","A multisignature bitcoin wallet":"Un portafoglio bitcoin multifirma","About Copay":"Circa Copay","Accept":"Accetta","Account":"Conto","Account Number":"Numero del Conto","Activity":"Attività","Add a new entry":"Aggiungi una nuova voce","Add a Password":"Aggiungi una Password","Add an optional password to secure the recovery phrase":"Aggiungere una password facoltativa per proteggere la frase di recupero","Add comment":"Aggiungi commento","Add wallet":"Aggiungi un portafoglio","Address":"Indirizzo","Address Type":"Tipo di indirizzo","Advanced":"Avanzato","Alias":"Alias","Alias for <i>{{index.walletName}}</i>":"Alias per <i>{{index.walletName}}</i>","All contributions to Copay's translation are welcome. Sign up at crowdin.com and join the Copay project at":"Tutti i contributori alla traduzione di Copay sono i benvenuti. Iscriviti a crowdin e unisciti al progetto Copay presso","All transaction requests are irreversible.":"Tutte le richieste di transazione sono irreversibili.","Alternative Currency":"Valuta alternativa","Amount":"Ammontare","Amount below minimum allowed":"Importo inferiore al minimo consentito","Amount in":"Importo in","Are you sure you want to delete the recovery phrase?":"Sei sicuro di voler cancellare la frase di recupero?","Are you sure you want to delete this wallet?":"Sei sicuro di voler eliminare questo portafoglio?","Auditable":"Controllabile","Available Balance":"Saldo disponibile","Average confirmation time: {{fee.nbBlocks * 10}} minutes":"Tempo medio di conferma: {{fee.nbBlocks * 10}} minuti","Back":"Indietro","Backup":"Backup","Backup failed":"Backup non riuscito","Backup Needed":"Backup necessario","Backup now":"Esegui backup ora","Bad wallet invitation":"Invito al wallet non corretto","Balance By Address":"Bilancio per indirizzo","Before receiving funds, you must backup your wallet. If this device is lost, it is impossible to access your funds without a backup.":"Prima di ricevere del denaro, devi fare un un backup del tuo portafoglio. Se si perde questo dispositivo, sarà impossibile accedere ai tuoi fondi senza un backup.","BETA: Android Key Derivation Test:":"BETA: Test di derivazione di chiave Android:","BIP32 path for address derivation":"Percorso BIP32 per generare l'indirizzo","Bitcoin address":"Indirizzo Bitcoin","Bitcoin Network Fee Policy":"Criterio delle Commissioni del Bitcoin Network","Bitcoin transactions may include a fee collected by miners on the network. The higher the fee, the greater the incentive a miner has to include that transaction in a block. Current fees are determined based on network load and the selected policy.":"Le transazioni bitcoin possono includere una tassa raccolta dai minatori della rete. Più alta è la commissione, maggiore sarà l'incentivo per un minatore a includere tale transazione in un blocco. Le commissioni attuali sono in base al carico della rete e ai criteri selezionati.","Bitcoin URI is NOT valid!":"Il Bitcoin URI NON è valido!","Broadcast Payment":"Diffusione del Pagamento","Broadcasting transaction":"Diffondendo la transazione","Browser unsupported":"Browser non supportato","Calculating fee":"Calcolo commissione","Cancel":"Annulla","Cancel and delete the wallet":"Cancella e rimuovi il portafoglio","Cannot create transaction. Insufficient funds":"Impossibile creare la transazione. Fondi non sufficienti","Cannot join the same wallet more that once":"Non è possibile aggiungere un portafoglio più di una volta","Cannot sign: The payment request has expired":"Impossibile firmare: la richiesta di pagamento è scaduta","Certified by":"Certificato da","Changing wallet alias only affects the local wallet name.":"Il cambiamento degli alias dei portafogli influenza solo il nome del portafoglio locale.","Chinese":"Cinese","Choose a backup file from your computer":"Seleziona un file di backup dal tuo computer","Clear cache":"Svuota la cache","Close":"Chiudi","Color":"Colore","Comment":"Commento","Commit hash":"Commit hash","Confirm":"Conferma","Confirm your wallet recovery phrase":"Confermare la vostra frase di recupero del portafoglio","Confirmations":"Conferme","Congratulations!":"Complimenti!","Connecting to Coinbase...":"Connessione a Coinbase...","Connecting to Glidera...":"Connessione a Glidera...","Connection reset by peer":"Connessione ripristinata dall'utente","Continue":"Continua","Copayer already in this wallet":"Copayer già in questo portafoglio","Copayer already voted on this spend proposal":"Copayer già votato su questa proposta","Copayer data mismatch":"Mancata corrispondenza dei dati del copayer","Copayers":"Copayers","Copied to clipboard":"Copiato negli appunti","Copy this text as it is to a safe place (notepad or email)":"Copia questo testo cosí com'è in un posto sicuro (blocco note o email)","Copy to clipboard":"Copia negli appunti","Could not access the wallet at the server. Please check:":"Non può accedere al portafoglio sul server. Si prega di controllare:","Could not access wallet":"Impossibile accedere al portafoglio","Could not access Wallet Service: Not found":"Impossibile accedere al Wallet Service: non trovato","Could not broadcast payment":"Impossibile trasmettere il pagamento","Could not build transaction":"Non è possibile generare la transazione","Could not create address":"Impossibile creare un indirizzo","Could not create payment proposal":"Non posso creare la proposta di pagamento","Could not create using the specified extended private key":"Non posso crearlo utilizzando la chiave privata estesa specificata","Could not create using the specified extended public key":"Non è possibile creare usando questa chiave estesa pubblica","Could not create: Invalid wallet recovery phrase":"Impossibile creare: Frase di recupero portafoglio non valida","Could not decrypt file, check your password":"Impossibile decifrare il file, controlla la tua password","Could not delete payment proposal":"Impossibile eliminare la proposta di pagamento","Could not fetch payment information":"Impossibile recuperare le informazioni di pagamento","Could not get fee value":"Non ha ottenuto il valore della commissione","Could not import":"Impossibile importare","Could not import. Check input file and spending password":"Impossibile importare. Controlla il file da importare e la password di spesa","Could not join wallet":"Impossibile partecipare al portafoglio","Could not recognize a valid Bitcoin QR Code":"Impossibile riconoscere un Codice QR Bitcoin valido","Could not reject payment":"Impossibile rifiutare il pagamento","Could not send payment":"Impossibile inviare il pagamento","Could not update Wallet":"Impossibile aggiornare il Portafoglio","Create":"Crea","Create {{requiredCopayers}}-of-{{totalCopayers}} wallet":"Crea portafoglio {{requiredCopayers}}-di-{{totalCopayers}}","Create new wallet":"Crea nuovo portafoglio","Create, join or import":"Crea, partecipa o importa","Created by":"Creato da","Creating transaction":"Creazione transazione","Creating Wallet...":"Creazione Portafoglio...","Current fee rate for this policy: {{fee.feePerKBUnit}}/kiB":"Tassa corrente per questa policy: {{fee.feePerKBUnit}}/kiB","Czech":"Ceco","Date":"Data","Decrypting a paper wallet could take around 5 minutes on this device. please be patient and keep the app open.":"Decodificare un portafoglio potrebbe impiegare circa 5 minuti su questo dispositivo. Attendere e tenere l'applicazione aperta.","Delete it and create a new one":"Eliminalo e creane uno nuovo","Delete Payment Proposal":"Elimina Proposta di Pagamento","Delete recovery phrase":"Elimina frase di recupero","Delete Recovery Phrase":"Elimina Frase di Recupero","Delete wallet":"Elimina portafoglio","Delete Wallet":"Elimina Portafoglio","Deleting Wallet...":"Eliminazione del portafoglio...","Derivation Path":"Percorso derivato","Derivation Strategy":"Strategia di derivazione","Description":"Descrizione","Details":"Dettagli","Disabled":"Disabilitato","Do not include private key":"Non includere la chiave privata","Don't see your language on Crowdin? Contact the Owner on Crowdin! We'd love to support your language.":"Non vedi la tua lingua su Crowdin? Contatta il proprietario su Crowdin! Ci piacerebbe supportare la lingua.","Done":"Fatto","Download":"Download","Economy":"Economia","Edit":"Modifica","Edit comment":"Modifica commento","Edited by":"Modificato da","Email for wallet notifications":"Email per le notifiche del portafoglio","Email Notifications":"Notifiche Email","Empty addresses limit reached. New addresses cannot be generated.":"Raggiunto il limite degli indirizzi vuoti. Non possono essere generati nuovi indirizzi.","Enable Coinbase Service":"Abilitare servizio Coinbase","Enable Glidera Service":"Abilitare servizio Glidera","Enable push notifications":"Abilitare le notifiche push","Encrypted export file saved":"Backup criptato salvato","Enter the recovery phrase (BIP39)":"Inserire la frase di recupero (BIP39)","Enter your password":"Inserisci la tua password","Enter your spending password":"Inserisci la tua password di spesa","Error at Wallet Service":"Errore del Wallet Service","Error creating wallet":"Errore creazione portafoglio","Expired":"Scaduta","Expires":"Scadenza","Export options":"Opzioni di esportazione","Export to file":"Esporta in un file","Export Wallet":"Esporta portafoglio","Exporting via QR not supported for this wallet":"Per questo portafoglio non è supportata l'esportazione tramite QR","Extended Public Keys":"Chiave pubblica estesa","Extracting Wallet Information...":"Estrazione delle informazioni sul portafoglio...","Failed to export":"Esportazione non riuscita","Failed to verify backup. Please check your information":"Impossibile verificare il backup. Si prega di controllare le informazioni","Family vacation funds":"Fondi vacanza di famiglia","Fee":"Tassa","Fetching Payment Information":"Recuperando le informazioni del pagamento","File/Text":"File/Testo","Finger Scan Failed":"Scansione dito fallita","Finish":"Fine","For audit purposes":"Per finalità di controllo","French":"Francese","From the destination device, go to Add wallet &gt; Import wallet and scan this QR code":"Dal dispositivo di destinazione, andare in Aggiungi portafoglio &gt; Importare portafoglio e scansionare questo codice QR","Funds are locked by pending spend proposals":"I fondi sono bloccati in attesa della proposta di pagamento","Funds found":"Fondi trovati","Funds received":"Fondi ricevuti","Funds will be transferred to":"I fondi saranno trasferiti a","Generate new address":"Genera un nuovo indirizzo","Generate QR Code":"Genera un codice QR","Generating .csv file...":"Genera un file .csv...","German":"Tedesco","Getting address for wallet {{selectedWalletName}} ...":"Ottengo l'indirizzo per il portafoglio {{selectedWalletName}}...","Global preferences":"Preferenze globali","Hardware wallet":"Portafoglio hardware","Hardware Wallet":"Portafoglio Hardware","Hide advanced options":"Nascondi opzioni avanzate","I affirm that I have read, understood, and agree with these terms.":"Affermo di aver letto, compreso e accettato questi termini.","I AGREE. GET STARTED":"Sono d'accordo. INIZIARE","Import":"Importa","Import backup":"Importa backup","Import wallet":"Importa un portafoglio","Importing Wallet...":"Importazione del Portafoglio...","In no event shall the authors of the software, employees and affiliates of Bitpay, copyright holders, or BitPay, Inc. be held liable for any claim, damages or other liability, whether in an action of contract, tort, or otherwise, arising from, out of or in connection with the software.":"In nessun caso gli autori del software, dipendenti e affiliati di Bitpay, detentori del copyright o BitPay, Inc potranno essere ritenuti responsabili per qualsiasi danno o altra responsabilità, sia in un'azione di contratto, torto, o altro, derivanti da, su o in relazione al software.","In order to verify your wallet backup, please type your password:":"Per verificare il backup del tuo portafoglio, inserire la password:","Incorrect address network":"Indirizzo della rete incorretto","Incorrect code format":"Formato qrcode non corretto","Insufficient funds":"Fondi insufficienti","Insufficient funds for fee":"Fondi insufficienti per la commissione","Invalid":"Invalido","Invalid account number":"Numero di conto non valido","Invalid address":"Indirizzo non valido","Invalid derivation path":"Percorso di derivazione non valido","Invitation to share a Copay Wallet":"Invito a condividere un portafoglio Copay","Italian":"Italiano","Japanese":"Giapponese","John":"John","Join":"Unisciti","Join my Copay wallet. Here is the invitation code: {{secret}} You can download Copay for your phone or desktop at https://copay.io":"Unisciti al mio portafoglio Copay. Ecco il codice di invito: {{secret}} Puoi scaricare Copay dal tuo telefono o computer da https://copay.io","Join shared wallet":"Unisciti al portafoglio condiviso","Joining Wallet...":"Unendo al portafoglio...","Key already associated with an existing wallet":"Chiave già associata ad un portafoglio esistente","Label":"Etichetta","Language":"Lingua","Last Wallet Addresses":"Indirizzi dell'ultimo portafoglio","Learn more about Copay backups":"Ulteriori informazioni sui backup Copay","Loading...":"Caricamento...","locked by pending payments":"bloccati da pagamenti in sospeso","Locktime in effect. Please wait to create a new spend proposal":"Locktime in effetto. Si prega di attendere per creare una nuova proposta di pagamento","Locktime in effect. Please wait to remove this spend proposal":"Locktime in effetto. Si prega di attendere per rimuovere questa proposta di pagamento","Make a payment to":"Effettuare un pagamento a","Matches:":"Corrispondenze:","me":"io","Me":"Io","Memo":"Nota","Merchant message":"Messaggio commerciale","Message":"Messaggio","Missing parameter":"Parametro mancante","Missing private keys to sign":"Chiavi private per la firma mancanti","Moved":"Spostato","Multiple recipients":"Più destinatari","My Bitcoin address":"Il mio indirizzo Bitcoin","My contacts":"I miei contatti","My wallets":"I miei portafogli","Need to do backup":"Necessario eseguire backup","Network":"Network","Network connection error":"Errore di connessione alla rete","New Payment Proposal":"Nuova proposta di pagamento","New Random Recovery Phrase":"Nuova Frase Casuale di Recupero","No hardware wallets supported on this device":"Nessun portafoglio hardware supportato da questo dispositivo","No transactions yet":"Ancora nessuna transazione","Normal":"Normale","Not authorized":"Non autorizzato","Not completed":"Non completato","Not enough funds for fee":"Non ci sono abbastanza fondi per la commissione","Not valid":"Non valido","Note":"Nota","Note: a total of {{amountAboveMaxSizeStr}} were excluded. The maximum size allowed for a transaction was exceeded":"Nota: un totale di {{amountAboveMaxSizeStr}} sono stati esclusi. È stata superata la dimensione massima consentita per una transazione","Note: a total of {{amountBelowFeeStr}} were excluded. These funds come from UTXOs smaller than the network fee provided.":"Nota: un totale di {{amountBelowFeeStr}} sono stati esclusi. Questi fondi provengono da UTXO inferiori rispetto alla tariffa di rete richiesta.","NOTE: To import a wallet from a 3rd party software, please go to Add Wallet &gt; Create Wallet, and specify the Recovery Phrase there.":"Nota: Per importare un portafoglio da un software di terze parti, si prega di andare in Aggiungi portafoglio &gt; Crea portafoglio, e specificare la frase di recupero.","Official English Disclaimer":"Dichiarazione di esclusione di responsabilità ufficiale in inglese","OKAY":"VA BENE","Once you have copied your wallet recovery phrase down, it is recommended to delete it from this device.":"Una volta che avrai copiato la tua frase di recupero portafoglio su un foglio di carta, si consiglia di cancellarla da questo dispositivo.","Only Main (not change) addresses are shown. The addresses on this list were not verified locally at this time.":"Sono mostrati solo gli indirizzi principali (non modificati). Gli indirizzi in questo elenco non sono stati verificati localmente in questo momento.","Open Settings app":"Aprire Impostazioni app","optional":"opzionale","Paper Wallet Private Key":"Chiave privata del Paper Wallet","Participants":"Partecipanti","Passphrase":"Passphrase","Password":"Password","Password required. Make sure to enter your password in advanced options":"Password necessaria. Assicurarsi di immettere la password nelle impostazioni avanzate","Paste invitation here":"Incolla qui l'invito","Paste the backup plain text code":"Incolla qui il codice di backup","Paste your paper wallet private key here":"Incolla la chiave privata del tuo Paper Wallet qui","Pasted from clipboard":"Incollato dagli appunti","Pay To":"Paga A","Payment Accepted":"Pagamento Accettato","Payment accepted, but not yet broadcasted":"Pagamento accettato, ma non ancora inviata alla rete","Payment accepted. It will be broadcasted by Glidera. In case there is a problem, it can be deleted 6 hours after it was created.":"Pagamento accettato. Esso sarà trasmesso attraverso la rete Glidera. Nel caso in cui ci fosse un problema, si potrà eliminarlo 6 ore dopo che è stato creato.","Payment details":"Dettagli pagamento","Payment expires":"Pagamento scaduto","Payment Proposal":"Proposta di Pagamento","Payment Proposal Created":"Proposta di Pagamento Creata","Payment Proposal Rejected":"Proposta di Pagamento Rifiutata","Payment Proposal Rejected by Copayer":"Proposta di Pagamento Rifiutata dai Copayers","Payment Proposal Signed by Copayer":"Proposta di Pagamento Firmata dai Copayers","Payment Proposals":"Proposte di Pagamento","Payment Protocol Invalid":"Protocollo di pagamento non valido","Payment Protocol not supported on Chrome App":"Proposta di Pagamento non supportata dall'applicazione Chrome","Payment Rejected":"Pagamento Rifiutato","Payment request":"Richiesta di pagamento","Payment Sent":"Pagamento Inviato","Payment to":"Pagamento a","Pending Confirmation":"In attesa di conferma","Permanently delete this wallet. THIS ACTION CANNOT BE REVERSED":"Elimina definitivamente questo portafoglio. QUESTA AZIONE NON PUO' ESSERE INVERTITA","Personal Wallet":"Portafoglio Personale","Please enter the recovery phrase":"Si prega di inserire la frase di recupero","Please enter the required fields":"Per favore completa i campi richiesti","Please enter the wallet recovery phrase":"Si prega di inserire la frase di recupero del portafoglio","Please tap the words in order to confirm your backup phrase is correctly written.":"Si prega di toccare le parole al fine di confermare la che vostra frase di backup è scritta correttamente.","Please upgrade Copay to perform this action":"Si prega di aggiornare Copay per eseguire questa azione","Please wait to be redirected...":"Si prega di attendere per il reindirizzamento...","Please, select your backup file":"Per favore, selezione il tuo file di backup","Polish":"Polacco","Preferences":"Preferenze","Preparing backup...":"Preparando il backup...","preparing...":"preparazione...","Press again to exit":"Premi ancora per uscire","Priority":"Priorità","Private key is encrypted, cannot sign":"La chiave privata è crittografata, non è possibile accedere","Push notifications for Copay are currently disabled. Enable them in the Settings app.":"Le notifiche push per Copay sono attualmente disabilitate. Abilitarle nel menu Impostazioni.","QR Code":"Codice QR","QR-Scanner":"QR-Scanner","Receive":"Ricevi","Received":"Ricevuti","Recipients":"Destinatari","Recovery Phrase":"Frase di Recupero","Recovery phrase deleted":"Frase di recupero eliminata","Recreate":"Ricrea","Recreating Wallet...":"Ricreando Portafoglio...","Reject":"Rifiuta","Release Information":"Informazioni Release","Remove":"Rimuovere","Repeat password":"Ripeti password","Repeat the password":"Ripeti la password","Repeat the spending password":"Ripetere la password di spesa","Request a specific amount":"Richiedi un importo specifico","Request Spending Password":"Richiedere Password di spesa","Required":"Richiesto","Required number of signatures":"Selezionare il numero necessario di firme","Retrieving inputs information":"Recupero delle informazioni iniziali","Russian":"Russo","Save":"Salva","Scan addresses for funds":"Scansione degli indirizzi per fondi","Scan Fingerprint":"Scansione impronte","Scan Finished":"Scansione terminata","Scan status finished with error":"La scansione è terminata con un errore","Scan Wallet Funds":"Scansione dei fondi del portafoglio","Scan your fingerprint please":"Per cortesia procedere alla scansione dell'impronta digitale","Scanning Wallet funds...":"Scansione fondi Portafoglio...","Search transactions":"Ricerca transazioni","Search Transactions":"Cerca Transazioni","Security preferences":"Preferenze di sicurezza","See it on the blockchain":"Guardala nella blockchain","Select a backup file":"Seleziona un file di backup","Select a wallet":"Selezionare un portafoglio","Self-signed Certificate":"Certificato autofirmato","Send":"Invia","Send addresses by email":"Invia indirizzi via Email","Send bitcoin":"Invia bitcoin","Send by email":"Invia via email","Send Max":"Invia il massimo","Sending":"Invio in corso","Sending transaction":"Invio transazione","Sent":"Inviato","Server response could not be verified":"La risposta del server non può essere verificata","Session log":"Registro sessione","SET":"IMPOSTA","Set default url":"Imposta url predefinito","Set up a password":"Imposta una password","Set up a spending password":"Impostare una password di spesa","Setting up email notifications could weaken your privacy, if the wallet service provider is compromised. Information available to an attacker would include your wallet addresses and its balance, but no more.":"Impostando le notifiche e-mail potrebbe indebolire la tua privacy se il provider di servizio del portafoglio è compromesso. Le informazioni disponibili ad un utente malintenzionato potrebbero includere l'indirizzo del tuo portafoglio e il suo saldo, ma non di più.","Settings":"Impostazioni","Share address":"Condividi l'indirizzo","Share invitation":"Condividi l'invito","Share this invitation with your copayers":"Condividi questo invito con i tuoi copayers","Share this wallet address to receive payments":"Condividere questo indirizzo di portafoglio per ricevere pagamenti","Share this wallet address to receive payments. To protect your privacy, new addresses are generated automatically once you use them.":"Condividi questo indirizzo del portafoglio per ricevere pagamenti. Per proteggere la tua privacy, ad ogni utilizzo sono generati nuovi indirizzi.","Shared Wallet":"Portafoglio Condiviso","Show advanced options":"Mostra opzioni avanzate","Signatures rejected by server":"Firme rifiutate dal server","Signing transaction":"Firmando transazione","Single Address Wallet":"Singolo indirizzo di portafoglio","Spanish":"Spagnolo","Specify Recovery Phrase...":"Specificare la frase di recupero...","Spend proposal is not accepted":"La proposta di pagamento non è accettata","Spend proposal not found":"Proposta di pagamento non trovata","Spending Password needed":"Necessaria password di spesa","Spending Passwords do not match":"Le password di spesa non combaciano","Success":"Completato","Super Economy":"Super Economica","Sweep paper wallet":"Spazzare il portafoglio di carta","Sweep Wallet":"Portafoglio Sweep","Sweeping Wallet...":"Spazzolamento Portafoglio...","Tap and hold to show":"Toccare e tenere premuto per mostrare","Tap to retry":"Tocca per riprovare","Terms of Use":"Termini di Utilizzo","The authors of the software, employees and affiliates of Bitpay, copyright holders, and BitPay, Inc. cannot retrieve your private keys or passwords if you lose or forget them and cannot guarantee transaction confirmation as they do not have control over the Bitcoin network.":"Gli autori del software, dipendenti e affiliati di Bitpay, detentori del copyright e BitPay, Inc non possono recuperare la tua password o chiave privata se si perde o si dimentica e non può garantire la conferma della transazione poiché non hanno controllo della rete Bitcoin.","The derivation path":"Il percorso di derivazione","The Ledger Chrome application is not installed":"Non è installata l'applicazione di contabilità Chrome","The password of the recovery phrase (if set)":"La password della frase recupero (se impostata)","The payment was created but could not be completed. Please try again from home screen":"Il pagamento è stato creato ma è stato impossibile completarlo. Per favore prova di nuovo dalla schermata iniziale","The payment was removed by creator":"Il pagamento è stato rimosso dal creatore","The recovery phrase could require a password to be imported":"La frase di recupero potrebbe richiedere una password per essere importata","The request could not be understood by the server":"La richiesta potrebbe non essere compresa dal server","The software does not constitute an account where BitPay or other third parties serve as financial intermediaries or custodians of your bitcoin.":"Il software non costituisce un account dove BitPay o altre terze parti servono come intermediari finanziari o custodi dei tuoi bitcoin.","The software you are about to use functions as a free, open source, and multi-signature digital wallet.":"Il software che si sta per utilizzare è un portafoglio libero, open source e con multi-firma digitale.","The spend proposal is not pending":"La proposta di pagamento non è in sospeso","The wallet \"{{walletName}}\" was deleted":"Il portafoglio {{walletName}} è stato eliminato","The Wallet Recovery Phrase could require a password to be imported":"La frase di recupero portafoglio potrebbe richiedere una password per essere importata","The wallet service URL":"L'URL del servizio di portafoglio","There are no wallets to make this payment":"Non ci sono portafogli per effettuare questo pagamento","There is a new version of Copay. Please update":"C'è una nuova versione di Copay. Si prega di aggiornare","There is an error in the form":"C'è un errore nel form","This recovery phrase was created with a password. To recover this wallet both the recovery phrase and password are needed.":"Questa frase di recupero è stata creata con una password. Per recuperare questo portafoglio sono necessari sia la frase di recupero e che la password.","This transaction has become invalid; possibly due to a double spend attempt.":"Questa transazione è diventata invalida; forse a causa di un tentativo di doppia spesa.","This wallet is not registered at the given Bitcore Wallet Service (BWS). You can recreate it from the local information.":"Questo portafoglio non è registrato al Bitcore Wallet Service (BWS). Puoi ricrearlo dalle informazioni locali.","Time":"Tempo","To":"A","To restore this {{index.m}}-{{index.n}} <b>shared</b> wallet you will need":"Per ripristinare questo portafoglio <b>condiviso</b> di {{index.m}}-{{index.n}} tu avrai bisogno","To the fullest extent permitted by law, this software is provided “as is” and no representations or warranties can be made of any kind, express or implied, including but not limited to the warranties of merchantability, fitness or a particular purpose and noninfringement.":"La misura massima consentita dalla legge, questo software è fornito \"così com'è\" e alcuna dichiarazione o garanzia può essere fatto di alcun tipo, esplicite o implicite, comprese ma non limitate alle garanzie di commerciabilità, adattamenti o uno scopo particolare e non violazione.","too long!":"troppo lungo!","Total Locked Balance":"Totale Importo Bloccato","Total number of copayers":"Numero totale di copayer","Touch ID Failed":"Touch ID Fallito","Transaction":"Transazione","Transaction already broadcasted":"Transazione già trasmessa","Transaction History":"Cronologia delle transazioni","Translation Credits":"Ringraziamenti per la traduzione","Translators":"Traduttori","Try again":"Riprova","Type the Recovery Phrase (usually 12 words)":"Digitare la Frase di Recupero (tipicamente 12 parole)","Unconfirmed":"Non confermato","Unit":"Unità","Unsent transactions":"Transazioni non inviate","Updating transaction history. Please stand by.":"Aggiornamento cronologia delle transazioni. Siete pregati di attendere.","Updating Wallet...":"Aggiornamento portafoglio...","Use Unconfirmed Funds":"Usa i fondi non confermati","Validating recovery phrase...":"Validazione della frase di recupero...","Validating wallet integrity...":"Validazione integrità del portafoglio...","Version":"Versione","View":"Visualizza","Waiting for copayers":"In attesa di copayers","Waiting for Ledger...":"In attesa del Ledger...","Waiting for Trezor...":"In attesa del Trezor...","Waiting...":"In attesa...","Wallet already exists":"Il portafoglio esiste già","Wallet already in Copay":"Portafoglio già in Copay","Wallet Configuration (m-n)":"Configurazione di portafoglio (m-n)","Wallet Export":"Esportazione portafoglio","Wallet Id":"Id portafoglio","Wallet incomplete and broken":"Portafoglio incompleto e danneggiato","Wallet Information":"Informazioni sul portafoglio","Wallet Invitation":"Invito Portafoglio","Wallet Invitation is not valid!":"Invito Portafoglio non valido!","Wallet is full":"Portafoglio è pieno","Wallet is locked":"Il portafoglio è bloccato","Wallet is not complete":"Portafoglio non è completo","Wallet name":"Nome Portafoglio","Wallet Name (at creation)":"Nome portafoglio (al momento della creazione)","Wallet needs backup":"Il portafoglio richiede password","Wallet Network":"Portafoglio di rete","Wallet not found":"Portafoglio non trovato","Wallet not registered at the wallet service. Recreate it from \"Create Wallet\" using \"Advanced Options\" to set your recovery phrase":"Portafoglio non registrato presso il servizio di portafoglio. Ricrearlo da \"Creare portafoglio\" tramite \"Opzioni avanzate\" per impostare la tua frase di recupero","Wallet Preferences":"Preferenze del Portafogli","Wallet Recovery Phrase":"Frase di recupero del portafoglio","Wallet Recovery Phrase is invalid":"Frase di recupero del portafoglio non è valida","Wallet recovery phrase not available. You can still export it from Advanced &gt; Export.":"Frase di recupero del portafoglio non disponibile. È comunque possibile esportarla da Avanzate &gt; Esporta.","Wallet service not found":"Wallet service non trovato","WARNING: Key derivation is not working on this device/wallet. Actions cannot be performed on this wallet.":"ATTENZIONE: La derivazione della chiave non funziona su questo dispositivo/portafoglio. Le operazioni non possono essere eseguite su questo portafoglio.","WARNING: Not including the private key allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.":"AVVISO: L'esclusione della chiave privata permette di controllare il bilancio del portafoglio, la cronologia delle transazioni e creare proposte di spesa dall'esportazione. Tuttavia, non consente di approvare le proposte (firma), così <b>fondi non saranno accessibili dall'esportazione</b>.","WARNING: The password cannot be recovered. <b>Be sure to write it down</b>. The wallet can not be restored without the password.":"ATTENZIONE: La password non può essere recuperata. <b>Assicurati di scrivertela</b>. Il portafoglio non può essere ripristinato senza la password.","WARNING: The private key of this wallet is not available. The export allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.":"AVVISO: La chiave privata di questo portafoglio non è disponibile. L'esportazione permette di controllare il bilancio del portafoglio, la cronologia delle transazioni e creare proposte di spesa dall'esportazione. Tuttavia, non consente di approvare le proposte (firma), così <b>fondi non saranno accessibili dall'esportazione</b>.","Warning: this transaction has unconfirmed inputs":"Attenzione: questa transazione ha inputs non confermati","WARNING: UNTRUSTED CERTIFICATE":"ATTENZIONE: CERTIFICATO NON ATTENDIBILE","WARNING: Wallet not registered":"AVVISO: Portafoglio non registrato","Warning!":"Attenzione!","We reserve the right to modify this disclaimer from time to time.":"Ci riserviamo il diritto di modificare di volta in volta il presente disclaimer.","WELCOME TO COPAY":"BENVENUTO A COPAY","While the software has undergone beta testing and continues to be improved by feedback from the open-source user and developer community, we cannot guarantee that there will be no bugs in the software.":"Mentre il software è stato sottoposto a test beta e continua a essere migliorato da un feedback dall'utente open source e comunità di sviluppatori, non possiamo garantire che non ci sarà nessun bug nel software.","Write your wallet recovery phrase":"Scrivi la tua frase di recupero del portafoglio","Wrong number of recovery words:":"Numero errato delle parole di recupero:","Wrong spending password":"Password per spesa errata","Yes":"Sì","You acknowledge that your use of this software is at your own discretion and in compliance with all applicable laws.":"L'utente riconosce che l'utilizzo di questo software è a tua discrezione e nel rispetto di tutte le leggi applicabili.","You are responsible for safekeeping your passwords, private key pairs, PINs and any other codes you use to access the software.":"Tu sei responsabile per la custodia le password, le coppie di chiavi private, PINs e qualsiasi altro codice da utilizzare per accedere al software.","You assume any and all risks associated with the use of the software.":"Vi assumete tutti i rischi associati all'utilizzo del software.","You backed up your wallet. You can now restore this wallet at any time.":"È stato eseguito il Backup del tuo portafoglio. È ora possibile ripristinare questo portafoglio in qualsiasi momento.","You can safely install your wallet on another device and use it from multiple devices at the same time.":"* Puoi installare in modo sicuro il tuo portafoglio su un altro device e usarlo da più dispositivi contemporaneamente.","You do not have any wallet":"Non hai alcun portafoglio","You need the wallet recovery phrase to restore this personal wallet. Write it down and keep them somewhere safe.":"Devi avere la frase di recupero portafoglio per ripristinare questo portafoglio personale. Scrivitela e tienila in un posto sicuro.","Your nickname":"Il tuo nickname","Your password":"La tua password","Your spending password":"La tua password di spesa","Your wallet has been imported correctly":"Il tuo portafoglio è stato importato correttamente","Your wallet key will be encrypted. The Spending Password cannot be recovered. Be sure to write it down":"La chiave del tuo portafoglio verrà crittografata. La Password di Spesa non può essere recuperata. Assicurati quindi di scriverla su di un foglio di carta","Your wallet recovery phrase and access to the server that coordinated the initial wallet creation. You still need {{index.m}} keys to spend.":"La tua frase di recupero portafoglio e accesso al server che ha coordinato la creazione iniziale del portafoglio. Hai ancora bisogno delle chiavi {{index.m}} prima di spendere."});
    gettextCatalog.setStrings('ja', {"(possible double spend)":"(二重払い可能性あり)","(Trusted)":"(信頼済み)","[Balance Hidden]":"[残高非表示中]","{{fee}} will be deducted for bitcoin networking fees":"{{fee}} のビットコインネットワーク手数料が差し引かれます。","{{feeRateStr}} of the transaction":"{{feeRateStr}} のレート","{{index.m}}-of-{{index.n}}":"{{index.m}}-of-{{index.n}}","{{index.result.length - index.txHistorySearchResults.length}} more":"あと {{index.result.length - index.txHistorySearchResults.length}}","{{index.txProgress}} transactions downloaded":"{{index.txProgress}} 個の取引ダウンロード済み","{{item.m}}-of-{{item.n}}":"{{item.m}}-of-{{item.n}}","* A payment proposal can be deleted if 1) you are the creator, and no other copayer has signed, or 2) 24 hours have passed since the proposal was created.":"* 送金の提案の取下げは①他のウォレット参加者に署名されていなかった場合、提案者に提案を取り下げることができます。②提案の起案から24時間が経っても解決しなかった場合、全員に取り下げることができます。","<b>IF YOU LOSE ACCESS TO YOUR COPAY WALLET OR YOUR ENCRYPTED PRIVATE KEYS AND YOU HAVE NOT SEPARATELY STORED A BACKUP OF YOUR WALLET AND CORRESPONDING PASSWORD, YOU ACKNOWLEDGE AND AGREE THAT ANY BITCOIN YOU HAVE ASSOCIATED WITH THAT COPAY WALLET WILL BECOME INACCESSIBLE.</b>":"<b>Copayウォレットとその中にある秘密鍵の情報を紛失してしまい、尚且つバックアップが無い、若しくはそのバックアップを暗号化した際のパスワードが分からないなどの状況に陥ってしまえば、そのウォレットに含まれた全てのビットコインが永久送金不可能となってしまうことを認識し、同意するものとします。</b>","<b>OR</b> 1 wallet export file and the remaining quorum of wallet recovery phrases (e.g. in a 3-5 wallet: 1 wallet export file + 2 wallet recovery phrases of any of the other copayers).":"<b>または</b> 従来ウォレットエクスポートファイル１つに加えて残りの必須人数の復元フレーズ (例： 3-of-5 ウォレットでは従来ウォレットバックアップ１つに加え、他の参加者２人分の復元フレーズさえあればウォレットは復元できます)","<b>OR</b> the wallet recovery phrase of <b>all</b> copayers in the wallet":"<b>または</b> 参加者 <b>全員</b> のウォレット復元フレーズ","<b>OR</b> the wallet recovery phrases of <b>all</b> copayers in the wallet":"<b>または</b> 参加者 <b>全員</b> のウォレット復元フレーズ","A multisignature bitcoin wallet":"マルチシグネチャビットコインウォレット","About Copay":"Copayについて","Accept":"承諾","Account":"ポケット","Account Number":"ポケット番号","Activity":"履歴","Add a new entry":"新規追加","Add a Password":"パスワードを追加","Add an optional password to secure the recovery phrase":"フレーズを守るために任意のパスワードをかけて下さい","Add comment":"コメントを追加","Add wallet":"ウォレットを追加","Address":"アドレス","Address Type":"アドレスの種類","Advanced":"上級者向け","Alias":"通称","Alias for <i>{{index.walletName}}</i>":"<i>{{index.walletName}}</i> の通称設定","All contributions to Copay's translation are welcome. Sign up at crowdin.com and join the Copay project at":"Copayの翻訳は簡単に投稿することができます。crowdin.comのアカウント作成の後、自由にご参加いただけるプロジェクトページはこちら","All transaction requests are irreversible.":"署名が完了してしまった取引は取り消しが不可能となります。","Alternative Currency":"表示通貨","Amount":"金額","Amount below minimum allowed":"送金可能最少額を下回っています","Amount in":"換算済金額","Are you sure you want to delete the recovery phrase?":"復元フレーズを削除してもよろしいですか？","Are you sure you want to delete this wallet?":"本当にこのウォレットを削除しても\n宜しいですか？","Auditable":"監査用","Available Balance":"送金可能残高","Average confirmation time: {{fee.nbBlocks * 10}} minutes":"承認までの時間(平均)： {{fee.nbBlocks * 10}} 分","Back":"戻る","Backup":"バックアップ","Backup failed":"バックアップ失敗","Backup Needed":"要バックアップ","Backup now":"今すぐバックアップ","Bad wallet invitation":"不正なウォレット招待コード","Balance By Address":"アドレスごとの残高","Before receiving funds, you must backup your wallet. If this device is lost, it is impossible to access your funds without a backup.":"お金を受け取る前に、このウォレットのバックアップを取っておくことを必ずしていただきます。一ウォレットごとにバックアップは一回です。バックアップを取らないまま、この端末が紛失・故障されてしまったら全残高が消失されてしまいます。","BETA: Android Key Derivation Test:":"β機能： アンドロイド鍵派生テスト","BIP32 path for address derivation":"階級アドレス派生のパス","Bitcoin address":"ビットコインアドレス","Bitcoin Network Fee Policy":"ビットコインネットワークの手数料設定","Bitcoin transactions may include a fee collected by miners on the network. The higher the fee, the greater the incentive a miner has to include that transaction in a block. Current fees are determined based on network load and the selected policy.":"円滑な送金をしていただくために、ビットコインの送金には少量の手数料を付けることが義務付けられております。この手数料はビットコインのネットワークを運用する人たちに寄付され、より高い手数料であればより優先的にブロックに含まれ、承認されます。選択された手数料基準やネットワークの混雑状況により、その時点で払われるべき手数料が変動することがあります。","Bitcoin URI is NOT valid!":"Bitcoin URI が無効です！","Broadcast Payment":"取引送信","Broadcasting transaction":"取引送信中","Browser unsupported":"ブラウザ未対応","Buy and Sell":"購入と売却","Calculating fee":"手数料計算中...","Cancel":"キャンセル","Cancel and delete the wallet":"キャンセルし、ウォレットを削除","Cannot create transaction. Insufficient funds":"取引を作成できません。資金不足です。","Cannot join the same wallet more that once":"同じ端末で同じウォレットに複数回参加することができません。","Cannot sign: The payment request has expired":"署名できません: 支払い請求の期限が切れています。","Certified by":"証明元：","Changing wallet alias only affects the local wallet name.":"ウォレット通称を変更しても、この端末でしか変わりません。","Chinese":"中国語","Choose a backup file from your computer":"パソコンからバックアップファイルを選択して下さい。","Clear cache":"キャッシュを消去","Close":"閉じる","Color":"色","Comment":"コメント","Commit hash":"コミットのハッシュ値","Confirm":"確認","Confirm your wallet recovery phrase":"復元フレーズを確認","Confirmations":"承認回数","Congratulations!":"おめでとうございます！","Connecting to Coinbase...":"Coinbase に接続中…","Connecting to Glidera...":"Glidera に接続中…","Connection reset by peer":"接続がピアによってリセットされました","Continue":"続ける","Copayer already in this wallet":"ウォレット参加者が既に存在しています。","Copayer already voted on this spend proposal":"ウォレット参加者が既に送金の提案の意思表明をしています。","Copayer data mismatch":"ウォレット参加者のデータ不整合","Copayers":"ウォレット参加者","Copied to clipboard":"クリップボードにコピーしました","Copy this text as it is to a safe place (notepad or email)":"このテキストを安全な場所に貼り付けて保管して下さい (メモ帳やメールの下書きなど)","Copy to clipboard":"クリップボードへコピー","Could not access the wallet at the server. Please check:":"サーバーにてウォレットの確認ができませんでした。こちらをご確認下さい:","Could not access wallet":"ウォレットにアクセスできませんでした。","Could not access Wallet Service: Not found":"Wallet Serviceにアクセスできませんでした: 見つかりません","Could not broadcast payment":"送金を配信できませんでした。","Could not build transaction":"取引を作成できませんでした。","Could not create address":"アドレスを生成できませんでした。","Could not create payment proposal":"送金の提案を作成できませんでした","Could not create using the specified extended private key":"指定された拡張秘密鍵で作成できませんでした。","Could not create using the specified extended public key":"指定された拡張公開鍵で作成できませんでした。","Could not create: Invalid wallet recovery phrase":"作成できません：ウォレットの復元フレーズが不正です。","Could not decrypt file, check your password":"複合化できませんでした。パスワードが正しいかご確認下さい。","Could not delete payment proposal":"送金の提案を削除できませんでした","Could not fetch payment information":"支払い情報が取得できませんでした。","Could not get fee value":"手数料の金額を取得できませんでした。","Could not import":"インポートできませんでした。","Could not import. Check input file and spending password":"インポートできませんでした。入力ファイルとパスワードが正しいかご確認下さい。","Could not join wallet":"ウォレットに参加できませんでした。","Could not recognize a valid Bitcoin QR Code":"有効なビットコインQRコードが認識できませんでした。","Could not reject payment":"送金を却下できませんでした。","Could not send payment":"送金できませんでした。","Could not update Wallet":"ウォレットが更新できませんでした。","Create":"作成","Create {{requiredCopayers}}-of-{{totalCopayers}} wallet":"{{requiredCopayers}}-of-{{totalCopayers}} ウォレットを作成","Create new wallet":"新規ウォレット作成","Create, join or import":"作成、参加、インポート","Created by":"作成者","Creating transaction":"取引作成中…","Creating Wallet...":"ウォレット作成中…","Current fee rate for this policy: {{fee.feePerKBUnit}}/kiB":"この手数料基準の現レート： {{fee.feePerKBUnit}}/kiB","Czech":"チェコ語","Date":"日付","Decrypting a paper wallet could take around 5 minutes on this device. please be patient and keep the app open.":"暗号化されたペーパーウォレットはこの端末だと解読に5分以上掛かる場合がございます。アプリを閉じたり他のアプリに切り替えたりせずに、終了するまでそのままお待ち下さい。","Delete it and create a new one":"削除して新規作成","Delete Payment Proposal":"送金の提案を削除","Delete recovery phrase":"復元フレーズを削除","Delete Recovery Phrase":"復元フレーズを削除","Delete wallet":"ウォレットを削除","Delete Wallet":"ウォレットを削除","Deleting Wallet...":"ウォレット削除中…","Derivation Path":"派生パス","Derivation Strategy":"派生パス","Description":"詳細","Details":"詳細","Disabled":"無効","Do not include private key":"秘密鍵を含めない","Don't see your language on Crowdin? Contact the Owner on Crowdin! We'd love to support your language.":"ご自分の言語はCrowdinで見当たりませんか？Crowdinの管理者に連絡とってみてください。是非とも対応したく思っております。","Done":"完了","Download":"ダウンロード","Economy":"節約","Edit":"編集","Edit comment":"コメントを編集","Edited by":"編集者","Email for wallet notifications":"メールによるウォレットのお知らせ","Email Notifications":"メールのお知らせ","Empty addresses limit reached. New addresses cannot be generated.":"未使用アドレスを生成しすぎたため、これ以上アドレスを生成することができません。","Enable Coinbase Service":"Coinbase連携を有効にする","Enable Glidera Service":"Glidera連携を有効にする","Enable push notifications":"プッシュ通知を有効化","Encrypted export file saved":"暗号化されたバックアップ保存しました","Enter the recovery phrase (BIP39)":"復元フレーズの単語をご入力下さい。","Enter your password":"パスワードを入力して下さい。","Enter your spending password":"パスワードを入力してください","Error at Wallet Service":"Wallet Serviceにてエラー","Error creating wallet":"ウォレット作成時にエラー","Expired":"期限切れ","Expires":"有効期限：","Export options":"エクスポート設定","Export to file":"ファイルへのエクスポート","Export Wallet":"ウォレットをエクスポート","Exporting via QR not supported for this wallet":"このウォレットはQRによるエクスポートに対応していません","Extended Public Keys":"拡張公開鍵","Extracting Wallet Information...":"ウォレット情報を抽出中…","Failed to export":"エクスポートに失敗しました。","Failed to verify backup. Please check your information":"バックアップを確認できませんでした。転記した情報をご確認ください。","Family vacation funds":"家族旅行貯金","Fee":"手数料","Fetching Payment Information":"支払い情報要求しています…","File/Text":"ファイル/テキスト","Finger Scan Failed":"指紋認証に失敗しました","Finish":"完了","For audit purposes":"監査用機能","French":"フランス語","From the destination device, go to Add wallet &gt; Import wallet and scan this QR code":"移行先の端末では、ウォレットを追加から、ウォレットをインポートの画面でQRをスキャンして下さい。","Funds are locked by pending spend proposals":"協議中の送金の提案により、資金がロックされています。","Funds found":"残高がありました","Funds received":"着金あり","Funds will be transferred to":"送金先","Generate new address":"新規アドレスを生成","Generate QR Code":"QRコードを生成","Generating .csv file...":"CSVファイル作成中…","German":"ドイツ語","Getting address for wallet {{selectedWalletName}} ...":"「{{selectedWalletName}}」のアドレスを取得中…","Global preferences":"アプリ設定","Hardware wallet":"ハードウェアウォレット","Hardware Wallet":"ハードウェアウォレット","Hide advanced options":"詳細設定を非表示","I affirm that I have read, understood, and agree with these terms.":"内容をよく読み、理解し、同意します。","I AGREE. GET STARTED":"同意して始めます","Import":"インポート","Import backup":"バックアップをインポート","Import wallet":"ウォレットをインポート","Importing Wallet...":"ウォレットインポート中…","In no event shall the authors of the software, employees and affiliates of Bitpay, copyright holders, or BitPay, Inc. be held liable for any claim, damages or other liability, whether in an action of contract, tort, or otherwise, arising from, out of or in connection with the software.":"和訳は簡単な要約と考えて下さい。","In order to verify your wallet backup, please type your password:":"ウォレットのバックアップを確認するためには、復元フレーズ用のパスワードをご入力下さい。","Incorrect address network":"アドレスのネットワークが不正です。","Incorrect code format":"コードの形式が異なります","Insufficient funds":"残高不足","Insufficient funds for fee":"手数料付けるには残高が足りません","Invalid":"無効","Invalid account number":"無効なポケット番号です。","Invalid address":"不正アドレス","Invalid derivation path":"無効な派生パス","Invitation to share a Copay Wallet":"Copay共有ウォレットへの招待","Italian":"イタリア語","Japanese":"日本語","John":"山田太郎","Join":"参加","Join my Copay wallet. Here is the invitation code: {{secret}} You can download Copay for your phone or desktop at https://copay.io":"Copayの共有ウォレット作りました： {{secret}} この招待コードを入力して、ウォレットに参加して下さい。アプリのダウンロードは https://copay.io にてどうぞ！","Join shared wallet":"共有ウォレットに参加","Joining Wallet...":"ウォレット参加中…","Key already associated with an existing wallet":"この鍵は既存のウォレットにて登録されています","Label":"ラベル","Language":"言語設定","Last Wallet Addresses":"最新ウォレットアドレス","Learn more about Copay backups":"Copay のバックアップの種類について","Loading...":"読み込み中...","locked by pending payments":"未対応送金の提案によりロック中","Locktime in effect. Please wait to create a new spend proposal":"Locktime待ち中です。新しい送金の提案が作成できるまであとしばらくお待ち下さい。","Locktime in effect. Please wait to remove this spend proposal":"Locktime待ち中です。この送金の提案が削除できるまであとしばらくお待ち下さい。","Make a payment to":"支払いは次の宛先へ","Matches:":"結果:","me":"自分","Me":"自分","Memo":"メモ","Merchant message":"お店からのメッセージ：","Message":"メッセージ","Missing parameter":"不足しているパラメータ","Missing private keys to sign":"署名するための秘密鍵がありません。","Moved":"移動済","Multiple recipients":"複数送金先","My Bitcoin address":"私のビットコインアドレス：","My contacts":"連絡先","My wallets":"アプリ内ウォレット","Need to do backup":"バックアップを行う必要があります。","Network":"ネットワーク","Network connection error":"ネットワーク接続エラー","New Payment Proposal":"新しい送金の提案","New Random Recovery Phrase":"新規復元フレーズ","No hardware wallets supported on this device":"この端末ではハードウェアウォレットがサポートされていません","No transactions yet":"取引がありません","Normal":"通常","Not authorized":"権限がありません。","Not completed":"未完了","Not enough funds for fee":"手数料含めたら残高が不足しています。","Not valid":"無効です","Note":"メモ","Note: a total of {{amountAboveMaxSizeStr}} were excluded. The maximum size allowed for a transaction was exceeded":"注意：合計{{amountAboveMaxSizeStr}} を除外しました。取引に許可される最大サイズを超えました","Note: a total of {{amountBelowFeeStr}} were excluded. These funds come from UTXOs smaller than the network fee provided.":"注意：合計 {{amountBelowFeeStr}} を除外しました。これらのビットコインは手数料よりも低い額となるため除外しました。","NOTE: To import a wallet from a 3rd party software, please go to Add Wallet &gt; Create Wallet, and specify the Recovery Phrase there.":"注意：他アプリのウォレットをインポートする場合、ウォレットを追加 &gt; 新規ウォレット作成にて復元フレーズを指定するオプションを詳細設定にて有効にして下さい。","Official English Disclaimer":"公式免責事項 (英語)","OKAY":"OK","Once you have copied your wallet recovery phrase down, it is recommended to delete it from this device.":"復元フレーズを控えたら、このデバイスから削除することをおすすめします。","Only Main (not change) addresses are shown. The addresses on this list were not verified locally at this time.":"受け取り用のアドレスしか表示していません。現時点ではローカルの端末ではアドレスの正確性を二重確認していなくて、サーバーを信じる必要があります。","Open Settings app":"設定を開く","optional":"任意","Paper Wallet Private Key":"ペーパーウォレット秘密鍵","Participants":"参加者","Passphrase":"パスワード","Password":"パスワード","Password required. Make sure to enter your password in advanced options":"パスワードが必要です。上級者向け設定にてパスワードを入力してください。","Paste invitation here":"招待コードをこちらへ貼り付けて下さい","Paste the backup plain text code":"バックアップの文字をここに貼り付けて下さい","Paste your paper wallet private key here":"ペーパーウォレットの秘密鍵をここに貼り付けて下さい","Pasted from clipboard":"クリップボードから貼り付け","Pay To":"支払い先","Payment Accepted":"支払いが完了しました","Payment accepted, but not yet broadcasted":"取引が承認されましたが、まだ送信していません。","Payment accepted. It will be broadcasted by Glidera. In case there is a problem, it can be deleted 6 hours after it was created.":"取引が承認されました。Glideraより送信されます。問題があった場合、送金命令を出す６時間以内に取り消すことができます。","Payment details":"支払いの詳細","Payment expires":"支払い請求の有効期限","Payment Proposal":"送金の提案","Payment Proposal Created":"送金の提案が作成されました","Payment Proposal Rejected":"送金の提案が却下されました","Payment Proposal Rejected by Copayer":"送金の提案が他の参加者によって却下されました。","Payment Proposal Signed by Copayer":"送金の提案が他の参加者によって署名されました。","Payment Proposals":"送金の提案","Payment Protocol Invalid":"ペイメントプロトコルが不正です。","Payment Protocol not supported on Chrome App":"クロームのアプリではペイメントプロトコールがサポートされていません。","Payment Rejected":"送金が却下されました","Payment request":"支払い請求","Payment Sent":"送金が完了しました","Payment to":"支払い先","Pending Confirmation":"承認待ち","Permanently delete this wallet. THIS ACTION CANNOT BE REVERSED":"永久にこのウォレットを削除します。\n二度と取り戻せない行為ですのどご注意下さい。","Personal Wallet":"個人用ウォレット","Please enter the recovery phrase":"復元フレーズをご入力下さい","Please enter the required fields":"必須項目をご入力下さい","Please enter the wallet recovery phrase":"復元フレーズをご入力下さい","Please tap the words in order to confirm your backup phrase is correctly written.":"正しい順番に単語をタップして、ちゃんと書き留めてあることをご確認下さい。","Please upgrade Copay to perform this action":"この操作を実行するにはCopayを最新バージョンに更新してください","Please wait to be redirected...":"ページが切り替わるまでお待ちください...","Please, select your backup file":"バックアップファイルを選択","Polish":"ポーランド語","Preferences":"設定","Preparing backup...":"バックアップを準備中...","preparing...":"準備中...","Press again to exit":"もう一度押して終了","Priority":"優先","Private key is encrypted, cannot sign":"秘密鍵が暗号化されており署名できません。","Push notifications for Copay are currently disabled. Enable them in the Settings app.":"Copayのプッシュ通知は現在無効です。アプリ設定で有効にします。","QR Code":"QRコード","QR-Scanner":"QRコードを読み取って下さい","Receive":"受取","Received":"受取済み","Recipients":"受取人","Recovery Phrase":"復元フレーズ","Recovery phrase deleted":"復元フレーズ削除済み","Recreate":"再登録","Recreating Wallet...":"ウォレットを再作成中…","Reject":"却下","Release Information":"リリース情報","Remove":"削除","Repeat password":"パスワードを再入力","Repeat the password":"パスワードの再入力","Repeat the spending password":"パスワードの再入力","Request a specific amount":"指定金額を要求","Request Spending Password":"送金時のパスワード入力","Required":"入力必須","Required number of signatures":"必要な署名の数を選択","Retrieving inputs information":"入力情報の取得中","Russian":"ロシア語","Save":"保存","Scan addresses for funds":"アドレスの残高照会","Scan Fingerprint":"指紋スキャン","Scan Finished":"スキャン完了","Scan status finished with error":"スキャンがエラーに終わりました","Scan Wallet Funds":"ウォレット残高照会","Scan your fingerprint please":"指紋をスキャンしてください","Scanning Wallet funds...":"ウォレット残高照会中…","Search transactions":"取引を検索","Search Transactions":"取引を検索","Security preferences":"セキュリティ設定","See it on the blockchain":"ブロックチェーンで詳細を閲覧","Select a backup file":"バックアップファイルを選択","Select a wallet":"ウォレットを選択","Self-signed Certificate":"自己署名証明書","Send":"送信","Send addresses by email":"ビットコインアドレスをメールにて共有","Send bitcoin":"ビットコインを送金","Send by email":"メールで送信","Send Max":"最大額を送金","Sending":"送信中","Sending transaction":"取引送信中","Sent":"送金済み","Server response could not be verified":"サーバーからの返答を検証できませんでした","Session log":"セッションのログ","SET":"指定","Set default url":"デフォルトURLに設定","Set up a password":"パスワードを設定","Set up a spending password":"パスワードを設定","Setting up email notifications could weaken your privacy, if the wallet service provider is compromised. Information available to an attacker would include your wallet addresses and its balance, but no more.":"メールのお知らせを有効にすると、悪意のあるサーバー運用者ならあなたの全てのアドレスとそれぞれの残高・履歴情報が把握できプライバシーの侵害に繋がる可能性があります。","Settings":"設定","Share address":"アドレスを共有","Share invitation":"招待コードを共有","Share this invitation with your copayers":"ウォレット参加者に\nこの招待コードを\n送って下さい。","Share this wallet address to receive payments":"送金を受けるためにはこのウォレットアドレスを共有して下さい。","Share this wallet address to receive payments. To protect your privacy, new addresses are generated automatically once you use them.":"これを人に共有することでビットコインを送ってもらうことができます。プライバシー向上の観点から、アドレスが1回でも使用されたら新しいアドレスが自動生成されます。","Shared Wallet":"共有ウォレットに参加","Show advanced options":"詳細設定を表示","Signatures rejected by server":"サーバーより署名が却下されました。","Signing transaction":"取引署名中","Single Address Wallet":"単一アドレスウォレット","Spanish":"スペイン語","Specify Recovery Phrase...":"復元フレーズを指定…","Spend proposal is not accepted":"送金の提案が受諾されませんでした。","Spend proposal not found":"送金の提案が見つかりませんでした。","Spending Password needed":"パスワードが必要","Spending Passwords do not match":"パスワードが一致しません","Success":"成功","Super Economy":"超節約","Sweep paper wallet":"ペーパーウォレットの全残高インポート","Sweep Wallet":"ウォレットの全残高インポート","Sweeping Wallet...":"ビットコイン回収中…","Tap and hold to show":"長押しで表示","Tap to retry":"タップしてやり直し","Terms of Use":"利用規約","The authors of the software, employees and affiliates of Bitpay, copyright holders, and BitPay, Inc. cannot retrieve your private keys or passwords if you lose or forget them and cannot guarantee transaction confirmation as they do not have control over the Bitcoin network.":"このソフトの開発者、BitPayの従業員とその関係者、著作権所有者、BitPay, Inc. 自体もパスワード・秘密鍵・パスワードなどへのアクセスが不可能なため、教えることがだきません、なお、ビットコインのネットワークへの影響が無いので、取引の取り消しや優先的な承認などはできません。","The derivation path":"派生パス","The Ledger Chrome application is not installed":"Ledgerのクロームアプリがインストールされていません。","The password of the recovery phrase (if set)":"復元フレーズ用のパスワード(設定してある場合のみ)","The payment was created but could not be completed. Please try again from home screen":"送金の提案は作成されましたが完了できませんでした。ホーム画面からやり直して下さい。","The payment was removed by creator":"送金の提案が作成者により削除されました","The recovery phrase could require a password to be imported":"復元フレーズにパスワードをかけることができるのでかけてある場合はインポート時に必要です。","The request could not be understood by the server":"サーバーが要求を処理できませんでした。","The software does not constitute an account where BitPay or other third parties serve as financial intermediaries or custodians of your bitcoin.":"BitPay, Inc. 若しくはその他の第三者がアクセス権限を管理する、若しくはデジタル資産の代理保管を行うサービスではありません。","The software you are about to use functions as a free, open source, and multi-signature digital wallet.":"当ソフトウェアは無料のオープンソースプロジェクトで、マルチシグネチャを用いるデジタルウォレットです。","The spend proposal is not pending":"送金の提案が協議中ではありません。","The wallet \"{{walletName}}\" was deleted":"ウォレット \"{{walletName}}\" が削除されました","The Wallet Recovery Phrase could require a password to be imported":"復元フレーズにパスワードをかけることができるのでかけてある場合はインポート時に必要です。","The wallet service URL":"ウォレットサービスのURL","There are no wallets to make this payment":"送金可能なウォレットがありません","There is a new version of Copay. Please update":"Copay の新しいバージョンがあります。更新してください。","There is an error in the form":"フォームにエラーがありました","This recovery phrase was created with a password. To recover this wallet both the recovery phrase and password are needed.":"この復元フレーズにパスワードがかかっています。このウォレットを復元するためには、復元フレーズに加え、パスワードも必要です。","This transaction has become invalid; possibly due to a double spend attempt.":"この取引が無効になりました。二重払いの可能性があります。","This wallet is not registered at the given Bitcore Wallet Service (BWS). You can recreate it from the local information.":"現在設定中のBitcore Wallet Service (BWS) サーバーにて、このウォレットの登録がありません。再登録を行うこともできます。","Time":"時刻","To":"宛先","To restore this {{index.m}}-{{index.n}} <b>shared</b> wallet you will need":"この {{index.m}}-of-{{index.n}} <b>共有</b>ウォレットを復元するに必要なものは","To the fullest extent permitted by law, this software is provided “as is” and no representations or warranties can be made of any kind, express or implied, including but not limited to the warranties of merchantability, fitness or a particular purpose and noninfringement.":"このソフトはそのままの提供となり、このソフトの利用に関わるあらゆる責任とリスクを自己責任で被り、利用するものとし、いかなる損害が発生しても、このソフトの開発者、BitPayの従業員とその関係者、著作権所有者、BitPay, Inc. 自体も責任を求めることは無いと誓います。","too long!":"長すぎます！","Total Locked Balance":"ロック中の残高","Total number of copayers":"参加人数を選択して下さい。","Touch ID Failed":"Touch ID が失敗しました。","Transaction":"取引","Transaction already broadcasted":"取引は既に配信されました。","Transaction History":"取引履歴","Translation Credits":"翻訳ボランティアの皆さん","Translators":"翻訳者","Try again":"もう一度やり直してください。","Type the Recovery Phrase (usually 12 words)":"復元フレーズの単語 (通常 12 個) を入力して下さい。","Unconfirmed":"未承認","Unit":"単位","Unsent transactions":"未送信取引","Updating transaction history. Please stand by.":"取引履歴を更新します。しばらくお待ちください。","Updating Wallet...":"ウォレット更新中…","Use Unconfirmed Funds":"未承認ビットコインを使用","Validating recovery phrase...":"復元フレーズを検証中…","Validating wallet integrity...":"ウォレットの整合性を検証中...","Version":"バージョン","View":"表示","Waiting for copayers":"ウォレット参加者を待っています","Waiting for Ledger...":"Ledger を待っています...","Waiting for Trezor...":"Trezor を待っています...","Waiting...":"少々お待ち下さい…","Wallet already exists":"既存のウォレットです","Wallet already in Copay":"Copay内の既存のウォレットです","Wallet Configuration (m-n)":"ウォレット構成 (m-of-n)","Wallet Export":"ウォレットのエクスポート","Wallet Id":"ウォレットID","Wallet incomplete and broken":"ウォレットが未完成で破損しています","Wallet Information":"ウォレット詳細","Wallet Invitation":"ウォレット招待","Wallet Invitation is not valid!":"ウォレット招待コードが無効です！","Wallet is full":"ウォレットがいっぱいです。","Wallet is locked":"ウォレットがロックされています。","Wallet is not complete":"ウォレットが未完成です。","Wallet name":"ウォレット名","Wallet Name (at creation)":"ウォレット名 (作成時)","Wallet needs backup":"ウォレットバックアップが必要","Wallet Network":"ウォレットのネットワーク","Wallet not found":"ウォレットが見つかりません。","Wallet not registered at the wallet service. Recreate it from \"Create Wallet\" using \"Advanced Options\" to set your recovery phrase":"このウォレットは Wallet Service にて登録されていません。再び「新規作成」メニューから詳細設定を選び、復元フレーズをご入力下さい。","Wallet Preferences":"ウォレット個別設定","Wallet Recovery Phrase":"復元フレーズ","Wallet Recovery Phrase is invalid":"ウォレットシードが不正です。","Wallet recovery phrase not available. You can still export it from Advanced &gt; Export.":"ウォレットの復元フレーズがありません。バックアップファイルの作成は「上級者向け」⇒「エクスポート」からアクセスできます。","Wallet service not found":"Wallet serviceが見つかりません。","WARNING: Key derivation is not working on this device/wallet. Actions cannot be performed on this wallet.":"注意：このデバイスでは鍵の派生がちゃんと動いておりません。このウォレットは正常に動作しません。","WARNING: Not including the private key allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.":"注意：このウォレットは秘密鍵がありません。残高の確認、取引履歴の確認、送金の提案ができます。しかし、<b>送金の提案を承諾 (署名) できません</b>。","WARNING: The password cannot be recovered. <b>Be sure to write it down</b>. The wallet can not be restored without the password.":"注意：パスワードを復元することができませんしリセットできません。<b>絶対に忘れないようにしてください。</b>パスワードなしにこのバックアップファイルを復元することはできません。","WARNING: The private key of this wallet is not available. The export allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.":"注意：このウォレットは秘密鍵がありません。残高の確認、取引履歴の確認、送金の提案ができます。しかし、<b>送金の提案を承諾 (署名) できません</b>。","Warning: this transaction has unconfirmed inputs":"注意: この取引は未承認資金が含まれており、承認されるまで商品等をお渡しするのを待つことをお勧めします。","WARNING: UNTRUSTED CERTIFICATE":"警告: 信頼されていない証明書","WARNING: Wallet not registered":"注意：ウォレットが未登録","Warning!":"注意！","We reserve the right to modify this disclaimer from time to time.":"下記に英語の規約がありますので、英語が理解できる方は是非熟読して下さい。","WELCOME TO COPAY":"ようこそ COPAY へ","While the software has undergone beta testing and continues to be improved by feedback from the open-source user and developer community, we cannot guarantee that there will be no bugs in the software.":"このソフトは長いテスト期間を経てリリースしましたが、今後バグや不具合が見つからないという保障はございません。","Write your wallet recovery phrase":"復元フレーズを書き留めて下さい","Wrong number of recovery words:":"単語の数が間違っています：","Wrong spending password":"不正なパスワード","Yes":"はい","You acknowledge that your use of this software is at your own discretion and in compliance with all applicable laws.":"この規約に同意することで、自己責任で利用するものとし、このソフトを用いてお住まいの地域の法令の違反はしないことを意味します。","You are responsible for safekeeping your passwords, private key pairs, PINs and any other codes you use to access the software.":"このソフトを正常に利用するために必要なパスワード、秘密鍵、暗証番号などの秘密情報は自己責任で管理するものとします。","You assume any and all risks associated with the use of the software.":"この規約の言葉や表現のニュアンスによる解釈が必要となった場合、規約の元である英語のものを正とします。","You backed up your wallet. You can now restore this wallet at any time.":"新しいウォレットを正常にバックアップできました。いつでもこのウォレットが復元できます。","You can safely install your wallet on another device and use it from multiple devices at the same time.":"安全にウォレットを別のデバイスにインポートして、同じウォレットを複数の端末でご利用いただけます。","You do not have any wallet":"ウォレットがありません","You need the wallet recovery phrase to restore this personal wallet. Write it down and keep them somewhere safe.":"この個人用ウォレットを復元するには復元フレーズが必要です。紙などに書き留めておき、安全な場所で保管して下さい。","Your nickname":"自分のハンドルネーム","Your password":"パスワード","Your spending password":"送金時のパスワード","Your wallet has been imported correctly":"ウォレットが正常にインポートされました。","Your wallet key will be encrypted. The Spending Password cannot be recovered. Be sure to write it down":"ウォレットの鍵が暗号化されます。Copayでは送金時のパスワードをリセットしてくれる機能がありませんので、パスワードを忘れないよう、控えておいて下さい。","Your wallet recovery phrase and access to the server that coordinated the initial wallet creation. You still need {{index.m}} keys to spend.":"ウォレットの復元フレーズとそのウォレットが登録してあるサーバーへのアクセスが最低条件です。ただし、送金完了させるにはまだ {{index.m}} 個の鍵が他の参加者の間で持っていないといけませんので、他の参加者のバックアップも合わせてご確認下さい。"});
    gettextCatalog.setStrings('ko', {"(possible double spend)":"(이중 사용 가능성 있음)","(Trusted)":"(Trusted)","{{fee}} will be deducted for bitcoin networking fees":"{{fee}} will be deducted for bitcoin networking fees","{{index.m}}-of-{{index.n}}":"{{index.m}}-of-{{index.n}}","{{item.m}}-of-{{item.n}}":"{{item.m}}-of-{{item.n}}","{{len}} wallets imported. Funds scanning in progress. Hold on to see updated balance":"{{len}} 개의 지갑을 가져왔습니다. 잔액을 조회하고 있습니다. 갱신된 잔액을 확인하려면 기다려 주세요","* A payment proposal can be deleted if 1) you are the creator, and no other copayer has signed, or 2) 24 hours have passed since the proposal was created.":"* 지불제안은 다음 조건이 만족할 때 지울 수 있습니다. 1) 당신이 작성자이고, 다른 지갑 참여자가 사인하지 않았을 때, 또는 2) 제안이 작성된 지 24시간 이상이 지났을 때.","<b>IF YOU LOSE ACCESS TO YOUR COPAY WALLET OR YOUR ENCRYPTED PRIVATE KEYS AND YOU HAVE NOT SEPARATELY STORED A BACKUP OF YOUR WALLET AND CORRESPONDING PASSWORD, YOU ACKNOWLEDGE AND AGREE THAT ANY BITCOIN YOU HAVE ASSOCIATED WITH THAT COPAY WALLET WILL BECOME INACCESSIBLE.</b>":"<b>IF YOU LOSE ACCESS TO YOUR COPAY WALLET OR YOUR ENCRYPTED PRIVATE KEYS AND YOU HAVE NOT SEPARATELY STORED A BACKUP OF YOUR WALLET AND CORRESPONDING PASSWORD, YOU ACKNOWLEDGE AND AGREE THAT ANY BITCOIN YOU HAVE ASSOCIATED WITH THAT COPAY WALLET WILL BECOME INACCESSIBLE.</b>","<b>OR</b> 1 wallet export file and the remaining quorum of wallet seeds (e.g. in a 3-5 wallet: 1 wallet export file + 2 wallet seeds of any of the other copayers).":"<b>OR</b> 1 wallet export file and the remaining quorum of wallet seeds (e.g. in a 3-5 wallet: 1 wallet export file + 2 wallet seeds of any of the other copayers).","<b>OR</b> the wallet seed of <b>all</b> copayers in the wallet":"<b>OR</b> the wallet seed of <b>all</b> copayers in the wallet","<b>OR</b> the wallet seeds of <b>all</b> copayers in the wallet":"<b>OR</b> the wallet seeds of <b>all</b> copayers in the wallet","A multisignature bitcoin wallet":"다중서명 비트코인 지갑","About Copay":"Copay에 대하여","Accept":"승인","Add a Seed Passphrase":"Add a Seed Passphrase","Add an optional passphrase to secure the seed":"Add an optional passphrase to secure the seed","Add wallet":"지갑 추가","Address":"주소","Address Type":"Address Type","Advanced":"고급","Advanced Send":"Advanced Send","Agree":"동의","Alias for <i>{{index.walletName}}</i>":"<i>{{index.walletName}}</i>의 별명","All contributions to Copay's translation are welcome. Sign up at crowdin.com and join the Copay project at":"All contributions to Copay's translation are welcome. Sign up at crowdin.com and join the Copay project at","All transaction requests are irreversible.":"All transaction requests are irreversible.","Already have a wallet?":"이미 지갑을 가지고 있나요?","Alternative Currency":"표시 통화","Amount":"금액","Amount below dust threshold":"Amount below dust threshold","Amount in":"Amount in","Applying changes":"변경 사항 적용 중","Are you sure you want to delete the backup words?":"Are you sure you want to delete the backup words?","Are you sure you want to delete this wallet?":"정말로 지갑을 삭제하시겠습니까?","Available Balance":"사용 가능한 잔액","Average confirmation time: {{fee.nbBlocks * 10}} minutes":"Average confirmation time: {{fee.nbBlocks * 10}} minutes","Back":"뒤로","Backup":"백업","Backup now":"지금 백업","Backup words deleted":"Backup words deleted","Bad wallet invitation":"Bad wallet invitation","Balance By Address":"Balance By Address","Before receiving funds, it is highly recommended you backup your wallet keys.":"비트코인을 받기 전에 지갑의 키를 백업하길 강력히 권장합니다.","Bitcoin address":"비트코인 주소","Bitcoin Network Fee Policy":"비트코인 네트워크 수수료 설정","Bitcoin transactions may include a fee collected by miners on the network. The higher the fee, the greater the incentive a miner has to include that transaction in a block. Actual fees are determined based on network load and the selected policy.":"Bitcoin transactions may include a fee collected by miners on the network. The higher the fee, the greater the incentive a miner has to include that transaction in a block. Actual fees are determined based on network load and the selected policy.","Bitcoin URI is NOT valid!":"비트코인 URI가 유효하지 않습니다!","Broadcast Payment":"Broadcast Payment","Broadcasting Payment":"결제 전송 중","Broadcasting transaction":"Broadcasting transaction","Browser unsupported":"지원되지 않는 브라우저","Cancel":"취소","CANCEL":"취소","Cannot join the same wallet more that once":"Cannot join the same wallet more that once","Certified by":"Certified by","Changing wallet alias only affects the local wallet name.":"Changing wallet alias only affects the local wallet name.","Choose a backup file from your computer":"컴퓨터에서 백업 파일을 골라주세요","Choose a wallet to send funds":"돈을 보낼 지갑을 선택해주세요","Close":"닫기","Color":"색상","Commit hash":"커밋 해시","Confirm":"Confirm","Confirmations":"승인횟수","Connecting to {{create.hwWallet}} Wallet...":"Connecting to {{create.hwWallet}} Wallet...","Connecting to {{import.hwWallet}} Wallet...":"Connecting to {{import.hwWallet}} Wallet...","Connecting to {{join.hwWallet}} Wallet...":"Connecting to {{join.hwWallet}} Wallet...","Copayer already in this wallet":"Copayer already in this wallet","Copayer already voted on this spend proposal":"Copayer already voted on this spend proposal","Copayer data mismatch":"Copayer data mismatch","Copayers":"Copayers","Copied to clipboard":"Copied to clipboard","Copy this text as it is to a safe place (notepad or email)":"이 텍스트를 있는 그대로 복사해두세요(메모장이나 이메일등으로)","Copy to clipboard":"클립보드에 복사","Could not accept payment":"Could not accept payment","Could not access Wallet Service: Not found":"Could not access Wallet Service: Not found","Could not broadcast payment":"Could not broadcast payment","Could not create address":"Could not create address","Could not create payment proposal":"Could not create payment proposal","Could not create using the specified extended private key":"Could not create using the specified extended private key","Could not create using the specified extended public key":"Could not create using the specified extended public key","Could not create: Invalid wallet seed":"Could not create: Invalid wallet seed","Could not decrypt":"Could not decrypt","Could not decrypt file, check your password":"Could not decrypt file, check your password","Could not delete payment proposal":"Could not delete payment proposal","Could not fetch payment information":"Could not fetch payment information","Could not fetch transaction history":"거래내역을 가져올 수 없습니다","Could not import":"Could not import","Could not import. Check input file and password":"가져올 수 없습니다. 파일과 패스워드를 확인해 주세요","Could not join wallet":"Could not join wallet","Could not recognize a valid Bitcoin QR Code":"유효한 비트코인 QR코드를 인식할 수 없었습니다","Could not reject payment":"Could not reject payment","Could not send payment":"Could not send payment","Could not update Wallet":"지갑을 업데이트할 수 없습니다","Create":"작성","Create {{requiredCopayers}}-of-{{totalCopayers}} wallet":"{{requiredCopayers}}-of-{{totalCopayers}} 지갑 만들기","Create new wallet":"새로운 지갑 만들기","Create, join or import":"만들기, 참가하기, 불러오기","Created by":"작성자","Creating Profile...":"프로필 만드는 중..","Creating transaction":"Creating transaction","Creating Wallet...":"지갑 만드는 중...","Current fee rate for this policy: {{fee.feePerKBUnit}}/kiB":"Current fee rate for this policy: {{fee.feePerKBUnit}}/kiB","Date":"날짜","Decrypting a paper wallet could take around 5 minutes on this device. please be patient and keep the app open.":"Decrypting a paper wallet could take around 5 minutes on this device. please be patient and keep the app open.","Delete it and create a new one":"이 지갑을 삭제하고 새로운 지갑 만들기","Delete Payment Proposal":"지불제안 삭제","Delete wallet":"지갑 삭제","Delete Wallet":"지갑 삭제","DELETE WORDS":"DELETE WORDS","Deleting payment":"Deleting payment","Derivation Strategy":"Derivation Strategy","Details":"상세","Disabled":"Disabled","Do not include private key":"Do not include private key","Don't see your language on Crowdin? Contact the Owner on Crowdin! We'd love to support your language.":"Don't see your language on Crowdin? Contact the Owner on Crowdin! We'd love to support your language.","Download":"Download","Download CSV file":"CSV 파일 다운로드","Economy":"Economy","Email":"Email","Email for wallet notifications":"Email for wallet notifications","Email Notifications":"이메일 알림","Encrypted export file saved":"Encrypted export file saved","Enter the seed words (BIP39)":"Enter the seed words (BIP39)","Enter your password":"패스워드를 입력해주세요","Error at Wallet Service":"Error at Wallet Service","Error creating wallet":"지갑 생성 중 오류","Error importing wallet:":"지갑 가져오는 중 오류","Expires":"Expires","Export":"Export","Export options":"Export options","Extended Public Keys":"Extended Public Keys","External Private Key:":"External Private Key:","Failed to export":"Failed to export","Failed to import wallets":"지갑 가져오기 실패","Family vacation funds":"가족 휴가 자금","Fee":"수수료","Fee Policy":"Fee Policy","Fee policy for this transaction":"Fee policy for this transaction","Fetching Payment Information":"Fetching Payment Information","File/Text Backup":"File/Text Backup","French":"French","Funds are locked by pending spend proposals":"Funds are locked by pending spend proposals","Funds found":"Funds found","Funds received":"Funds received","Funds will be transfered to":"Funds will be transfered to","Generate new address":"새로운 주소 생성","Generate QR Code":"Generate QR Code","Generating .csv file...":".csv 파일 생성중...","German":"German","GET STARTED":"시작하기","Getting address for wallet {{selectedWalletName}} ...":"'{{selectedWalletName}}' 지갑의 주소 얻는 중...","Global settings":"전역 설정","Go back":"뒤로 가기","Greek":"Greek","Hardware wallet":"Hardware wallet","Hardware Wallet":"Hardware Wallet","Have a Backup from Copay v0.9?":"Copay v0.9용 백업을 가지고 계신가요?","Hide advanced options":"Hide advanced options","Hide Wallet Seed":"Hide Wallet Seed","History":"내역","Home":"홈","I affirm that I have read, understood, and agree with these terms.":"I affirm that I have read, understood, and agree with these terms.","Import":"가져오기","Import backup":"백업 가져오기","Import from Ledger":"Import from Ledger","Import from the Cloud?":"클라우드에서 가져올까요?","Import from TREZOR":"Import from TREZOR","Import here":"Import here","Import wallet":"지갑 가져오기","Importing wallet...":"지갑 가져오는 중...","Importing...":"가져오는 중...","In no event shall the authors of the software, employees and affiliates of Bitpay, copyright holders, or BitPay, Inc. be held liable for any claim, damages or other liability, whether in an action of contract, tort, or otherwise, arising from, out of or in connection with the software.":"In no event shall the authors of the software, employees and affiliates of Bitpay, copyright holders, or BitPay, Inc. be held liable for any claim, damages or other liability, whether in an action of contract, tort, or otherwise, arising from, out of or in connection with the software.","Incorrect address network":"Incorrect address network","Insufficient funds":"Insufficient funds","Insufficient funds for fee":"Insufficient funds for fee","Invalid":"Invalid","Invalid address":"Invalid address","Invitation to share a Copay Wallet":"Invitation to share a Copay Wallet","Italian":"Italian","Japanese":"Japanese","John":"John","Join":"참가","Join my Copay wallet. Here is the invitation code: {{secret}} You can download Copay for your phone or desktop at https://copay.io":"Join my Copay wallet. Here is the invitation code: {{secret}} You can download Copay for your phone or desktop at https://copay.io","Join shared wallet":"공유지갑에 참가","Joining Wallet...":"지갑에 참가하는 중...","Key already associated with an existing wallet":"Key already associated with an existing wallet","Language":"언어","Last Wallet Addresses":"Last Wallet Addresses","Learn more about Copay backups":"Learn more about Copay backups","Learn more about Wallet Migration":"지갑 이동에 대해 더 알아보기","Loading...":"Loading...","locked by pending payments":"locked by pending payments","Locktime in effect. Please wait to create a new spend proposal":"Locktime in effect. Please wait to create a new spend proposal","Locktime in effect. Please wait to remove this spend proposal":"Locktime in effect. Please wait to remove this spend proposal","Make a payment to":"Make a payment to","me":"me","Me":"나","Memo":"메모","Merchant message":"Merchant message","Message":"메시지","More":"More","Moved":"Moved","Multisignature wallet":"다중서명 지갑","My Bitcoin address":"나의 비트코인 주소","Network":"네트워크","Network connection error":"Network connection error","New Payment Proposal":"새 지불제안","No Private key":"No Private key","No transactions yet":"No transactions yet","Normal":"Normal","Not authorized":"Not authorized","Not valid":"Not valid","Note":"메모","Official English Disclaimer":"Official English Disclaimer","Once you have copied your wallet seed down, it is recommended to delete it from this device.":"Once you have copied your wallet seed down, it is recommended to delete it from this device.","Only Main (not change) addresses are shown. The addresses on this list were not verified locally at this time.":"Only Main (not change) addresses are shown. The addresses on this list were not verified locally at this time.","optional":"선택사항","Paper Wallet Private Key":"Paper Wallet Private Key","Participants":"참가자","Passphrase":"Passphrase","Passphrase (if you have one)":"Passphrase (if you have one)","Password":"Password","Password needed":"비밀번호가 필요합니다","Passwords do not match":"비밀번호가 일치하지 않습니다","Paste invitation here":"Paste invitation here","Paste the backup plain text code":"Paste the backup plain text code","Paste your paper wallet private key here":"Paste your paper wallet private key here","Pay To":"Pay To","Payment Accepted":"Payment Accepted","Payment accepted, but not yet broadcasted":"Payment accepted, but not yet broadcasted","Payment accepted. It will be broadcasted by Glidera. In case there is a problem, it can be deleted 6 hours after it was created.":"Payment accepted. It will be broadcasted by Glidera. In case there is a problem, it can be deleted 6 hours after it was created.","Payment details":"Payment details","Payment Proposal":"지불제안","Payment Proposal Created":"Payment Proposal Created","Payment Proposal Rejected":"Payment Proposal Rejected","Payment Proposal Rejected by Copayer":"Payment Proposal Rejected by Copayer","Payment Proposal Signed by Copayer":"Payment Proposal Signed by Copayer","Payment Proposals":"지불제안","Payment Protocol Invalid":"Payment Protocol Invalid","Payment Protocol not supported on Chrome App":"Payment Protocol not supported on Chrome App","Payment rejected":"Payment rejected","Payment Rejected":"Payment Rejected","Payment request":"Payment request","Payment sent":"Payment sent","Payment Sent":"Payment Sent","Payment to":"Payment to","Pending Confirmation":"Pending Confirmation","Permanently delete this wallet. THIS ACTION CANNOT BE REVERSED":"Permanently delete this wallet. THIS ACTION CANNOT BE REVERSED","Personal Wallet":"Personal Wallet","Please enter the required fields":"Please enter the required fields","Please enter the seed words":"Please enter the seed words","Please enter the wallet seed":"Please enter the wallet seed","Please upgrade Copay to perform this action":"Please upgrade Copay to perform this action","Please, select your backup file":"Please, select your backup file","Portuguese":"Portuguese","Preferences":"Preferences","Preparing backup...":"Preparing backup...","Priority":"Priority","QR Code":"QR코드","QR-Scanner":"QR스캐너","Receive":"Receive","Received":"Received","Recipients":"Recipients","Reconnecting to Wallet Service...":"Reconnecting to Wallet Service...","Recreate":"Recreate","Recreating Wallet...":"Recreating Wallet...","Reject":"거절","Rejecting payment":"Rejecting payment","Release Information":"Release Information","Repeat password":"패스워드 다시 입력","Request a specific amount":"Request a specific amount","Request Password for Spending Funds":"Request Password for Spending Funds","Requesting Ledger Wallet to sign":"Requesting Ledger Wallet to sign","Required":"Required","Required number of signatures":"Required number of signatures","Retrying...":"다시 시도 중...","Russian":"Russian","Save":"Save","Saving preferences...":"Saving preferences...","Scan addresses for funds":"Scan addresses for funds","Scan Finished":"Scan Finished","Scan status finished with error":"Scan status finished with error","Scan Wallet Funds":"Scan Wallet Funds","Scanning wallet funds...":"Scanning wallet funds...","Scanning Wallet funds...":"Scanning Wallet funds...","See it on the blockchain":"블록체인에서 보기","Seed passphrase":"Seed passphrase","Seed Passphrase":"Seed Passphrase","Select a backup file":"백업 파일 선택","Select a wallet":"Select a wallet","Self-signed Certificate":"Self-signed Certificate","Send":"Send","Send All":"Send All","Send all by email":"Send all by email","Send by email":"Send by email","Sending funds...":"Sending funds...","Sent":"Sent","Server":"서버","Server response could not be verified":"Server response could not be verified","Session log":"세션 로그","SET":"SET","Set up a Export Password":"Set up a Export Password","Set up a password":"패스워드 설정","Setting up email notifications could weaken your privacy, if the wallet service provider is compromised. Information available to an attacker would include your wallet addresses and its balance, but no more.":"Setting up email notifications could weaken your privacy, if the wallet service provider is compromised. Information available to an attacker would include your wallet addresses and its balance, but no more.","settings":"설정","Share address":"Share address","Share invitation":"Share invitation","Share this invitation with your copayers":"Share this invitation with your copayers","Share this wallet address to receive payments. To protect your privacy, new addresses are generated automatically once you use them.":"Share this wallet address to receive payments. To protect your privacy, new addresses are generated automatically once you use them.","Shared Wallet":"공유 지갑","Show advanced options":"Show advanced options","Show Wallet Seed":"Show Wallet Seed","Signatures rejected by server":"Signatures rejected by server","Signing payment":"Signing payment","SKIP BACKUP":"백업 건너뛰기","Spanish":"Spanish","Specify your wallet seed":"Specify your wallet seed","Spend proposal is not accepted":"Spend proposal is not accepted","Spend proposal not found":"Spend proposal not found","Still not done":"Still not done","Success":"성공","Sweep paper wallet":"Sweep paper wallet","Sweep Wallet":"Sweep Wallet","Tap to retry":"Tap to retry","Terms of Use":"이용약관","Testnet":"Testnet","The authors of the software, employees and affiliates of Bitpay, copyright holders, and BitPay, Inc. cannot retrieve your private keys or passwords if you lose or forget them and cannot guarantee transaction confirmation as they do not have control over the Bitcoin network.":"The authors of the software, employees and affiliates of Bitpay, copyright holders, and BitPay, Inc. cannot retrieve your private keys or passwords if you lose or forget them and cannot guarantee transaction confirmation as they do not have control over the Bitcoin network.","The Ledger Chrome application is not installed":"The Ledger Chrome application is not installed","The payment was created but could not be completed. Please try again from home screen":"The payment was created but could not be completed. Please try again from home screen","The payment was created but could not be signed. Please try again from home screen":"The payment was created but could not be signed. Please try again from home screen","The payment was removed by creator":"The payment was removed by creator","The payment was signed but could not be broadcasted. Please try again from home screen":"The payment was signed but could not be broadcasted. Please try again from home screen","The private key for this wallet is encrypted. Exporting keep the private key encrypted in the export archive.":"The private key for this wallet is encrypted. Exporting keep the private key encrypted in the export archive.","The seed could require a passphrase to be imported":"The seed could require a passphrase to be imported","The software does not constitute an account where BitPay or other third parties serve as financial intermediaries or custodians of your bitcoin.":"The software does not constitute an account where BitPay or other third parties serve as financial intermediaries or custodians of your bitcoin.","The software you are about to use functions as a free, open source, and multi-signature digital wallet.":"The software you are about to use functions as a free, open source, and multi-signature digital wallet.","The spend proposal is not pending":"The spend proposal is not pending","The wallet \"{{walletName}}\" was deleted":"The wallet \"{{walletName}}\" was deleted","There are no wallets to make this payment":"There are no wallets to make this payment","There is an error in the form":"There is an error in the form","This transaction has become invalid; possibly due to a double spend attempt.":"This transaction has become invalid; possibly due to a double spend attempt.","This wallet is not registered at the given Bitcore Wallet Service (BWS). You can recreate it from the local information.":"This wallet is not registered at the given Bitcore Wallet Service (BWS). You can recreate it from the local information.","Time":"시간","To":"To","To restore this {{index.m}}-{{index.n}} <b>shared</b> wallet you will need":"To restore this {{index.m}}-{{index.n}} <b>shared</b> wallet you will need","To the fullest extent permitted by law, this software is provided “as is” and no representations or warranties can be made of any kind, express or implied, including but not limited to the warranties of merchantability, fitness or a particular purpose and noninfringement.":"To the fullest extent permitted by law, this software is provided “as is” and no representations or warranties can be made of any kind, express or implied, including but not limited to the warranties of merchantability, fitness or a particular purpose and noninfringement.","too long!":"너무 깁니다!","Total":"Total","Total Locked Balance":"Total Locked Balance","Total number of copayers":"Total number of copayers","Transaction":"Transaction","Transaction already broadcasted":"Transaction already broadcasted","Translation Credits":"Translation Credits","Translators":"Translators","Type the Seed Word (usually 12 words)":"Type the Seed Word (usually 12 words)","Unable to send transaction proposal":"Unable to send transaction proposal","Unconfirmed":"Unconfirmed","Unit":"단위","Unsent transactions":"Unsent transactions","Updating Wallet...":"Updating Wallet...","Use Ledger hardware wallet":"Use Ledger hardware wallet","Use TREZOR hardware wallet":"Use TREZOR hardware wallet","Use Unconfirmed Funds":"Use Unconfirmed Funds","Username":"Username","Version":"버전","View":"View","Waiting for copayers":"Waiting for copayers","Waiting...":"대기 중...","Wallet":"Wallet","Wallet Alias":"지갑 별명","Wallet already exists":"이미 존재하는 지갑입니다","Wallet Already Imported:":"이미 가져온 지갑:","Wallet already in Copay:":"Wallet already in Copay:","Wallet Configuration (m-n)":"Wallet Configuration (m-n)","Wallet Export":"Wallet Export","Wallet Id":"Wallet Id","Wallet incomplete and broken":"Wallet incomplete and broken","Wallet Information":"Wallet Information","Wallet Invitation":"지갑 초대","Wallet Invitation is not valid!":"지갑 초대가 유효하지 않습니다!","Wallet is full":"Wallet is full","Wallet is not complete":"Wallet is not complete","Wallet name":"지갑 이름","Wallet Name (at creation)":"Wallet Name (at creation)","Wallet Network":"Wallet Network","Wallet not found":"Wallet not found","Wallet not registed at the Wallet Service. Recreate it from \"Create Wallet\" using \"Advanced Options\" to set your seed":"Wallet not registed at the Wallet Service. Recreate it from \"Create Wallet\" using \"Advanced Options\" to set your seed","Wallet Seed":"Wallet Seed","Wallet Seed could require a passphrase to be imported":"Wallet Seed could require a passphrase to be imported","Wallet seed is invalid":"Wallet seed is invalid","Wallet seed not available. You can still export it from Advanced &gt; Export.":"Wallet seed not available. You can still export it from Advanced &gt; Export.","Wallet service not found":"Wallet service not found","WARNING: Backup needed":"경고: 백업이 필요합니다","WARNING: Not including the private key allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.":"WARNING: Not including the private key allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.","WARNING: Passphrase cannot be recovered. <b>Be sure to write it down</b>. The wallet can not be restored without the passphrase.":"WARNING: Passphrase cannot be recovered. <b>Be sure to write it down</b>. The wallet can not be restored without the passphrase.","WARNING: The private key of this wallet is not available. The export allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.":"WARNING: The private key of this wallet is not available. The export allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.","WARNING: This seed was created with a passphrase. To recover this wallet both the mnemonic and passphrase are needed.":"WARNING: This seed was created with a passphrase. To recover this wallet both the mnemonic and passphrase are needed.","Warning: this transaction has unconfirmed inputs":"Warning: this transaction has unconfirmed inputs","WARNING: UNTRUSTED CERTIFICATE":"WARNING: UNTRUSTED CERTIFICATE","WARNING: Wallet not registered":"WARNING: Wallet not registered","Warning!":"경고!","We reserve the right to modify this disclaimer from time to time.":"We reserve the right to modify this disclaimer from time to time.","WELCOME TO COPAY":"WELCOME TO COPAY","While the software has undergone beta testing and continues to be improved by feedback from the open-source user and developer community, we cannot guarantee that there will be no bugs in the software.":"While the software has undergone beta testing and continues to be improved by feedback from the open-source user and developer community, we cannot guarantee that there will be no bugs in the software.","Write it down and keep them somewhere safe.":"Write it down and keep them somewhere safe.","Wrong number of seed words:":"Wrong number of seed words:","Wrong password":"잘못된 비밀번호","Yes":"Yes","You acknowledge that your use of this software is at your own discretion and in compliance with all applicable laws.":"You acknowledge that your use of this software is at your own discretion and in compliance with all applicable laws.","You are responsible for safekeeping your passwords, private key pairs, PINs and any other codes you use to access the software.":"You are responsible for safekeeping your passwords, private key pairs, PINs and any other codes you use to access the software.","You assume any and all risks associated with the use of the software.":"You assume any and all risks associated with the use of the software.","You can safely install your wallet on another device and use it from multiple devices at the same time.":"You can safely install your wallet on another device and use it from multiple devices at the same time.","You do not have a wallet":"지갑이 없습니다","You need the wallet seed to restore this personal wallet.":"You need the wallet seed to restore this personal wallet.","Your backup password":"백업 패스워드","Your export password":"Your export password","Your nickname":"당신의 닉네임","Your password":"당신의 비밀번호","Your profile password":"프로필 패스워드","Your wallet has been imported correctly":"지갑을 정상적으로 가져왔습니다","Your wallet key will be encrypted. Password cannot be recovered. Be sure to write it down":"Your wallet key will be encrypted. Password cannot be recovered. Be sure to write it down","Your Wallet Seed":"Your Wallet Seed","Your wallet seed and access to the server that coordinated the initial wallet creation. You still need {{index.m}} keys to spend.":"Your wallet seed and access to the server that coordinated the initial wallet creation. You still need {{index.m}} keys to spend."});
    gettextCatalog.setStrings('nl', {"(possible double spend)":"(mogelijk dubbel besteed)","(Trusted)":"(Trusted)","{{fee}} will be deducted for bitcoin networking fees":"{{fee}} will be deducted for bitcoin networking fees","{{index.m}}-of-{{index.n}}":"{{index.m}}-of-{{index.n}}","{{item.m}}-of-{{item.n}}":"{{item.m}}-of-{{item.n}}","{{len}} wallets imported. Funds scanning in progress. Hold on to see updated balance":"{{len}} wallets imported. Funds scanning in progress. Hold on to see updated balance","* A payment proposal can be deleted if 1) you are the creator, and no other copayer has signed, or 2) 24 hours have passed since the proposal was created.":"* Een betalingsvoorstel kan worden verwijderd als 1) u de aanmaker bent, en geen andere medebetaler heeft ondertekend, of 2) 24 uur zijn verstreken sinds het voorstel werd aangemaakt.","<b>IF YOU LOSE ACCESS TO YOUR COPAY WALLET OR YOUR ENCRYPTED PRIVATE KEYS AND YOU HAVE NOT SEPARATELY STORED A BACKUP OF YOUR WALLET AND CORRESPONDING PASSWORD, YOU ACKNOWLEDGE AND AGREE THAT ANY BITCOIN YOU HAVE ASSOCIATED WITH THAT COPAY WALLET WILL BECOME INACCESSIBLE.</b>":"<b>IF YOU LOSE ACCESS TO YOUR COPAY WALLET OR YOUR ENCRYPTED PRIVATE KEYS AND YOU HAVE NOT SEPARATELY STORED A BACKUP OF YOUR WALLET AND CORRESPONDING PASSWORD, YOU ACKNOWLEDGE AND AGREE THAT ANY BITCOIN YOU HAVE ASSOCIATED WITH THAT COPAY WALLET WILL BECOME INACCESSIBLE.</b>","<b>OR</b> 1 wallet export file and the remaining quorum of wallet seeds (e.g. in a 3-5 wallet: 1 wallet export file + 2 wallet seeds of any of the other copayers).":"<b>OR</b> 1 wallet export file and the remaining quorum of wallet seeds (e.g. in a 3-5 wallet: 1 wallet export file + 2 wallet seeds of any of the other copayers).","<b>OR</b> the wallet seed of <b>all</b> copayers in the wallet":"<b>OR</b> the wallet seed of <b>all</b> copayers in the wallet","<b>OR</b> the wallet seeds of <b>all</b> copayers in the wallet":"<b>OR</b> the wallet seeds of <b>all</b> copayers in the wallet","A multisignature bitcoin wallet":"A multisignature bitcoin wallet","About Copay":"About Copay","Accept":"Accept","Add a Seed Passphrase":"Add a Seed Passphrase","Add an optional passphrase to secure the seed":"Add an optional passphrase to secure the seed","Add wallet":"Add wallet","Address":"Address","Address Type":"Address Type","Advanced":"Advanced","Advanced Send":"Advanced Send","Agree":"Agree","Alias for <i>{{index.walletName}}</i>":"Alias for <i>{{index.walletName}}</i>","All contributions to Copay's translation are welcome. Sign up at crowdin.com and join the Copay project at":"All contributions to Copay's translation are welcome. Sign up at crowdin.com and join the Copay project at","All transaction requests are irreversible.":"All transaction requests are irreversible.","Already have a wallet?":"Already have a wallet?","Alternative Currency":"Alternative Currency","Amount":"Amount","Amount below dust threshold":"Amount below dust threshold","Amount in":"Amount in","Applying changes":"Applying changes","Are you sure you want to delete the backup words?":"Are you sure you want to delete the backup words?","Are you sure you want to delete this wallet?":"Are you sure you want to delete this wallet?","Available Balance":"Available Balance","Average confirmation time: {{fee.nbBlocks * 10}} minutes":"Average confirmation time: {{fee.nbBlocks * 10}} minutes","Back":"Back","Backup":"Backup","Backup now":"Backup now","Backup words deleted":"Backup words deleted","Bad wallet invitation":"Bad wallet invitation","Balance By Address":"Balance By Address","Before receiving funds, it is highly recommended you backup your wallet keys.":"Before receiving funds, it is highly recommended you backup your wallet keys.","Bitcoin address":"Bitcoin address","Bitcoin Network Fee Policy":"Bitcoin Network Fee Policy","Bitcoin transactions may include a fee collected by miners on the network. The higher the fee, the greater the incentive a miner has to include that transaction in a block. Actual fees are determined based on network load and the selected policy.":"Bitcoin transactions may include a fee collected by miners on the network. The higher the fee, the greater the incentive a miner has to include that transaction in a block. Actual fees are determined based on network load and the selected policy.","Bitcoin URI is NOT valid!":"Bitcoin URI is NOT valid!","Broadcast Payment":"Broadcast Payment","Broadcasting Payment":"Broadcasting Payment","Broadcasting transaction":"Broadcasting transaction","Browser unsupported":"Browser unsupported","Cancel":"Cancel","CANCEL":"CANCEL","Cannot join the same wallet more that once":"Cannot join the same wallet more that once","Certified by":"Certified by","Changing wallet alias only affects the local wallet name.":"Changing wallet alias only affects the local wallet name.","Choose a backup file from your computer":"Choose a backup file from your computer","Choose a wallet to send funds":"Choose a wallet to send funds","Close":"Close","Color":"Color","Commit hash":"Commit hash","Confirm":"Confirm","Confirmations":"Confirmations","Connecting to {{create.hwWallet}} Wallet...":"Connecting to {{create.hwWallet}} Wallet...","Connecting to {{import.hwWallet}} Wallet...":"Connecting to {{import.hwWallet}} Wallet...","Connecting to {{join.hwWallet}} Wallet...":"Connecting to {{join.hwWallet}} Wallet...","Copayer already in this wallet":"Copayer already in this wallet","Copayer already voted on this spend proposal":"Copayer already voted on this spend proposal","Copayer data mismatch":"Copayer data mismatch","Copayers":"Copayers","Copied to clipboard":"Copied to clipboard","Copy this text as it is to a safe place (notepad or email)":"Copy this text as it is to a safe place (notepad or email)","Copy to clipboard":"Copy to clipboard","Could not accept payment":"Could not accept payment","Could not access Wallet Service: Not found":"Could not access Wallet Service: Not found","Could not broadcast payment":"Could not broadcast payment","Could not create address":"Could not create address","Could not create payment proposal":"Could not create payment proposal","Could not create using the specified extended private key":"Could not create using the specified extended private key","Could not create using the specified extended public key":"Could not create using the specified extended public key","Could not create: Invalid wallet seed":"Could not create: Invalid wallet seed","Could not decrypt":"Could not decrypt","Could not decrypt file, check your password":"Could not decrypt file, check your password","Could not delete payment proposal":"Could not delete payment proposal","Could not fetch payment information":"Could not fetch payment information","Could not fetch transaction history":"Could not fetch transaction history","Could not import":"Could not import","Could not import. Check input file and password":"Could not import. Check input file and password","Could not join wallet":"Could not join wallet","Could not recognize a valid Bitcoin QR Code":"Could not recognize a valid Bitcoin QR Code","Could not reject payment":"Could not reject payment","Could not send payment":"Could not send payment","Could not update Wallet":"Could not update Wallet","Create":"Create","Create {{requiredCopayers}}-of-{{totalCopayers}} wallet":"Create {{requiredCopayers}}-of-{{totalCopayers}} wallet","Create new wallet":"Create new wallet","Create, join or import":"Create, join or import","Created by":"Created by","Creating Profile...":"Creating Profile...","Creating transaction":"Creating transaction","Creating Wallet...":"Creating Wallet...","Current fee rate for this policy: {{fee.feePerKBUnit}}/kiB":"Current fee rate for this policy: {{fee.feePerKBUnit}}/kiB","Date":"Date","Decrypting a paper wallet could take around 5 minutes on this device. please be patient and keep the app open.":"Decrypting a paper wallet could take around 5 minutes on this device. please be patient and keep the app open.","Delete it and create a new one":"Delete it and create a new one","Delete Payment Proposal":"Delete Payment Proposal","Delete wallet":"Delete wallet","Delete Wallet":"Delete Wallet","DELETE WORDS":"DELETE WORDS","Deleting payment":"Deleting payment","Derivation Strategy":"Derivation Strategy","Details":"Details","Disabled":"Disabled","Do not include private key":"Do not include private key","Don't see your language on Crowdin? Contact the Owner on Crowdin! We'd love to support your language.":"Don't see your language on Crowdin? Contact the Owner on Crowdin! We'd love to support your language.","Download":"Download","Download CSV file":"Download CSV file","Economy":"Economy","Email":"Email","Email for wallet notifications":"Email for wallet notifications","Email Notifications":"Email Notifications","Encrypted export file saved":"Encrypted export file saved","Enter the seed words (BIP39)":"Enter the seed words (BIP39)","Enter your password":"Enter your password","Error at Wallet Service":"Error at Wallet Service","Error creating wallet":"Error creating wallet","Error importing wallet:":"Error importing wallet:","Expires":"Expires","Export":"Export","Export options":"Export options","Extended Public Keys":"Extended Public Keys","External Private Key:":"External Private Key:","Failed to export":"Failed to export","Failed to import wallets":"Failed to import wallets","Family vacation funds":"Family vacation funds","Fee":"Fee","Fee Policy":"Fee Policy","Fee policy for this transaction":"Fee policy for this transaction","Fetching Payment Information":"Fetching Payment Information","File/Text Backup":"File/Text Backup","French":"French","Funds are locked by pending spend proposals":"Funds are locked by pending spend proposals","Funds found":"Funds found","Funds received":"Funds received","Funds will be transfered to":"Funds will be transfered to","Generate new address":"Generate new address","Generate QR Code":"Generate QR Code","Generating .csv file...":"Generating .csv file...","German":"German","GET STARTED":"GET STARTED","Getting address for wallet {{selectedWalletName}} ...":"Getting address for wallet {{selectedWalletName}} ...","Global settings":"Global settings","Go back":"Go back","Greek":"Greek","Hardware wallet":"Hardware wallet","Hardware Wallet":"Hardware Wallet","Have a Backup from Copay v0.9?":"Have a Backup from Copay v0.9?","Hide advanced options":"Hide advanced options","Hide Wallet Seed":"Hide Wallet Seed","History":"History","Home":"Home","I affirm that I have read, understood, and agree with these terms.":"I affirm that I have read, understood, and agree with these terms.","Import":"Import","Import backup":"Import backup","Import from Ledger":"Import from Ledger","Import from the Cloud?":"Import from the Cloud?","Import from TREZOR":"Import from TREZOR","Import here":"Import here","Import wallet":"Import wallet","Importing wallet...":"Importing wallet...","Importing...":"Importing...","In no event shall the authors of the software, employees and affiliates of Bitpay, copyright holders, or BitPay, Inc. be held liable for any claim, damages or other liability, whether in an action of contract, tort, or otherwise, arising from, out of or in connection with the software.":"In no event shall the authors of the software, employees and affiliates of Bitpay, copyright holders, or BitPay, Inc. be held liable for any claim, damages or other liability, whether in an action of contract, tort, or otherwise, arising from, out of or in connection with the software.","Incorrect address network":"Incorrect address network","Insufficient funds":"Insufficient funds","Insufficient funds for fee":"Insufficient funds for fee","Invalid":"Invalid","Invalid address":"Invalid address","Invitation to share a Copay Wallet":"Invitation to share a Copay Wallet","Italian":"Italian","Japanese":"Japanese","John":"John","Join":"Join","Join my Copay wallet. Here is the invitation code: {{secret}} You can download Copay for your phone or desktop at https://copay.io":"Join my Copay wallet. Here is the invitation code: {{secret}} You can download Copay for your phone or desktop at https://copay.io","Join shared wallet":"Join shared wallet","Joining Wallet...":"Joining Wallet...","Key already associated with an existing wallet":"Key already associated with an existing wallet","Language":"Language","Last Wallet Addresses":"Last Wallet Addresses","Learn more about Copay backups":"Learn more about Copay backups","Learn more about Wallet Migration":"Learn more about Wallet Migration","Loading...":"Loading...","locked by pending payments":"locked by pending payments","Locktime in effect. Please wait to create a new spend proposal":"Locktime in effect. Please wait to create a new spend proposal","Locktime in effect. Please wait to remove this spend proposal":"Locktime in effect. Please wait to remove this spend proposal","Make a payment to":"Make a payment to","me":"me","Me":"Me","Memo":"Memo","Merchant message":"Merchant message","Message":"Message","More":"More","Moved":"Moved","Multisignature wallet":"Multisignature wallet","My Bitcoin address":"My Bitcoin address","Network":"Network","Network connection error":"Network connection error","New Payment Proposal":"New Payment Proposal","No Private key":"No Private key","No transactions yet":"No transactions yet","Normal":"Normal","Not authorized":"Not authorized","Not valid":"Not valid","Note":"Note","Official English Disclaimer":"Official English Disclaimer","Once you have copied your wallet seed down, it is recommended to delete it from this device.":"Once you have copied your wallet seed down, it is recommended to delete it from this device.","Only Main (not change) addresses are shown. The addresses on this list were not verified locally at this time.":"Only Main (not change) addresses are shown. The addresses on this list were not verified locally at this time.","optional":"optional","Paper Wallet Private Key":"Paper Wallet Private Key","Participants":"Participants","Passphrase":"Passphrase","Passphrase (if you have one)":"Passphrase (if you have one)","Password":"Password","Password needed":"Password needed","Passwords do not match":"Passwords do not match","Paste invitation here":"Paste invitation here","Paste the backup plain text code":"Paste the backup plain text code","Paste your paper wallet private key here":"Paste your paper wallet private key here","Pay To":"Pay To","Payment Accepted":"Payment Accepted","Payment accepted, but not yet broadcasted":"Payment accepted, but not yet broadcasted","Payment accepted. It will be broadcasted by Glidera. In case there is a problem, it can be deleted 6 hours after it was created.":"Payment accepted. It will be broadcasted by Glidera. In case there is a problem, it can be deleted 6 hours after it was created.","Payment details":"Payment details","Payment Proposal":"Payment Proposal","Payment Proposal Created":"Payment Proposal Created","Payment Proposal Rejected":"Payment Proposal Rejected","Payment Proposal Rejected by Copayer":"Payment Proposal Rejected by Copayer","Payment Proposal Signed by Copayer":"Payment Proposal Signed by Copayer","Payment Proposals":"Payment Proposals","Payment Protocol Invalid":"Payment Protocol Invalid","Payment Protocol not supported on Chrome App":"Payment Protocol not supported on Chrome App","Payment rejected":"Payment rejected","Payment Rejected":"Payment Rejected","Payment request":"Payment request","Payment sent":"Payment sent","Payment Sent":"Payment Sent","Payment to":"Payment to","Pending Confirmation":"Pending Confirmation","Permanently delete this wallet. THIS ACTION CANNOT BE REVERSED":"Permanently delete this wallet. THIS ACTION CANNOT BE REVERSED","Personal Wallet":"Personal Wallet","Please enter the required fields":"Please enter the required fields","Please enter the seed words":"Please enter the seed words","Please enter the wallet seed":"Please enter the wallet seed","Please upgrade Copay to perform this action":"Please upgrade Copay to perform this action","Please, select your backup file":"Please, select your backup file","Portuguese":"Portuguese","Preferences":"Preferences","Preparing backup...":"Preparing backup...","Priority":"Priority","QR Code":"QR Code","QR-Scanner":"QR-Scanner","Receive":"Receive","Received":"Received","Recipients":"Recipients","Reconnecting to Wallet Service...":"Reconnecting to Wallet Service...","Recreate":"Recreate","Recreating Wallet...":"Recreating Wallet...","Reject":"Reject","Rejecting payment":"Rejecting payment","Release Information":"Release Information","Repeat password":"Repeat password","Request a specific amount":"Request a specific amount","Request Password for Spending Funds":"Request Password for Spending Funds","Requesting Ledger Wallet to sign":"Requesting Ledger Wallet to sign","Required":"Required","Required number of signatures":"Required number of signatures","Retrying...":"Retrying...","Russian":"Russian","Save":"Save","Saving preferences...":"Saving preferences...","Scan addresses for funds":"Scan addresses for funds","Scan Finished":"Scan Finished","Scan status finished with error":"Scan status finished with error","Scan Wallet Funds":"Scan Wallet Funds","Scanning wallet funds...":"Scanning wallet funds...","Scanning Wallet funds...":"Scanning Wallet funds...","See it on the blockchain":"See it on the blockchain","Seed passphrase":"Seed passphrase","Seed Passphrase":"Seed Passphrase","Select a backup file":"Select a backup file","Select a wallet":"Select a wallet","Self-signed Certificate":"Self-signed Certificate","Send":"Send","Send All":"Send All","Send all by email":"Send all by email","Send by email":"Send by email","Sending funds...":"Sending funds...","Sent":"Sent","Server":"Server","Server response could not be verified":"Server response could not be verified","Session log":"Session log","SET":"SET","Set up a Export Password":"Set up a Export Password","Set up a password":"Set up a password","Setting up email notifications could weaken your privacy, if the wallet service provider is compromised. Information available to an attacker would include your wallet addresses and its balance, but no more.":"Setting up email notifications could weaken your privacy, if the wallet service provider is compromised. Information available to an attacker would include your wallet addresses and its balance, but no more.","settings":"settings","Share address":"Share address","Share invitation":"Share invitation","Share this invitation with your copayers":"Share this invitation with your copayers","Share this wallet address to receive payments. To protect your privacy, new addresses are generated automatically once you use them.":"Share this wallet address to receive payments. To protect your privacy, new addresses are generated automatically once you use them.","Shared Wallet":"Shared Wallet","Show advanced options":"Show advanced options","Show Wallet Seed":"Show Wallet Seed","Signatures rejected by server":"Signatures rejected by server","Signing payment":"Signing payment","SKIP BACKUP":"SKIP BACKUP","Spanish":"Spanish","Specify your wallet seed":"Specify your wallet seed","Spend proposal is not accepted":"Spend proposal is not accepted","Spend proposal not found":"Spend proposal not found","Still not done":"Still not done","Success":"Success","Sweep paper wallet":"Sweep paper wallet","Sweep Wallet":"Sweep Wallet","Tap to retry":"Tap to retry","Terms of Use":"Terms of Use","Testnet":"Testnet","The authors of the software, employees and affiliates of Bitpay, copyright holders, and BitPay, Inc. cannot retrieve your private keys or passwords if you lose or forget them and cannot guarantee transaction confirmation as they do not have control over the Bitcoin network.":"The authors of the software, employees and affiliates of Bitpay, copyright holders, and BitPay, Inc. cannot retrieve your private keys or passwords if you lose or forget them and cannot guarantee transaction confirmation as they do not have control over the Bitcoin network.","The Ledger Chrome application is not installed":"The Ledger Chrome application is not installed","The payment was created but could not be completed. Please try again from home screen":"The payment was created but could not be completed. Please try again from home screen","The payment was created but could not be signed. Please try again from home screen":"The payment was created but could not be signed. Please try again from home screen","The payment was removed by creator":"The payment was removed by creator","The payment was signed but could not be broadcasted. Please try again from home screen":"The payment was signed but could not be broadcasted. Please try again from home screen","The private key for this wallet is encrypted. Exporting keep the private key encrypted in the export archive.":"The private key for this wallet is encrypted. Exporting keep the private key encrypted in the export archive.","The seed could require a passphrase to be imported":"The seed could require a passphrase to be imported","The software does not constitute an account where BitPay or other third parties serve as financial intermediaries or custodians of your bitcoin.":"The software does not constitute an account where BitPay or other third parties serve as financial intermediaries or custodians of your bitcoin.","The software you are about to use functions as a free, open source, and multi-signature digital wallet.":"The software you are about to use functions as a free, open source, and multi-signature digital wallet.","The spend proposal is not pending":"The spend proposal is not pending","The wallet \"{{walletName}}\" was deleted":"The wallet \"{{walletName}}\" was deleted","There are no wallets to make this payment":"There are no wallets to make this payment","There is an error in the form":"There is an error in the form","This transaction has become invalid; possibly due to a double spend attempt.":"This transaction has become invalid; possibly due to a double spend attempt.","This wallet is not registered at the given Bitcore Wallet Service (BWS). You can recreate it from the local information.":"This wallet is not registered at the given Bitcore Wallet Service (BWS). You can recreate it from the local information.","Time":"Time","To":"To","To restore this {{index.m}}-{{index.n}} <b>shared</b> wallet you will need":"To restore this {{index.m}}-{{index.n}} <b>shared</b> wallet you will need","To the fullest extent permitted by law, this software is provided “as is” and no representations or warranties can be made of any kind, express or implied, including but not limited to the warranties of merchantability, fitness or a particular purpose and noninfringement.":"To the fullest extent permitted by law, this software is provided “as is” and no representations or warranties can be made of any kind, express or implied, including but not limited to the warranties of merchantability, fitness or a particular purpose and noninfringement.","too long!":"too long!","Total":"Total","Total Locked Balance":"Total Locked Balance","Total number of copayers":"Total number of copayers","Transaction":"Transaction","Transaction already broadcasted":"Transaction already broadcasted","Translation Credits":"Translation Credits","Translators":"Translators","Type the Seed Word (usually 12 words)":"Type the Seed Word (usually 12 words)","Unable to send transaction proposal":"Unable to send transaction proposal","Unconfirmed":"Unconfirmed","Unit":"Unit","Unsent transactions":"Unsent transactions","Updating Wallet...":"Updating Wallet...","Use Ledger hardware wallet":"Use Ledger hardware wallet","Use TREZOR hardware wallet":"Use TREZOR hardware wallet","Use Unconfirmed Funds":"Use Unconfirmed Funds","Username":"Username","Version":"Version","View":"View","Waiting for copayers":"Waiting for copayers","Waiting...":"Waiting...","Wallet":"Wallet","Wallet Alias":"Wallet Alias","Wallet already exists":"Wallet already exists","Wallet Already Imported:":"Wallet Already Imported:","Wallet already in Copay:":"Wallet already in Copay:","Wallet Configuration (m-n)":"Wallet Configuration (m-n)","Wallet Export":"Wallet Export","Wallet Id":"Wallet Id","Wallet incomplete and broken":"Wallet incomplete and broken","Wallet Information":"Wallet Information","Wallet Invitation":"Wallet Invitation","Wallet Invitation is not valid!":"Wallet Invitation is not valid!","Wallet is full":"Wallet is full","Wallet is not complete":"Wallet is not complete","Wallet name":"Wallet name","Wallet Name (at creation)":"Wallet Name (at creation)","Wallet Network":"Wallet Network","Wallet not found":"Wallet not found","Wallet not registed at the Wallet Service. Recreate it from \"Create Wallet\" using \"Advanced Options\" to set your seed":"Wallet not registed at the Wallet Service. Recreate it from \"Create Wallet\" using \"Advanced Options\" to set your seed","Wallet Seed":"Wallet Seed","Wallet Seed could require a passphrase to be imported":"Wallet Seed could require a passphrase to be imported","Wallet seed is invalid":"Wallet seed is invalid","Wallet seed not available. You can still export it from Advanced &gt; Export.":"Wallet seed not available. You can still export it from Advanced &gt; Export.","Wallet service not found":"Wallet service not found","WARNING: Backup needed":"WARNING: Backup needed","WARNING: Not including the private key allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.":"WARNING: Not including the private key allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.","WARNING: Passphrase cannot be recovered. <b>Be sure to write it down</b>. The wallet can not be restored without the passphrase.":"WARNING: Passphrase cannot be recovered. <b>Be sure to write it down</b>. The wallet can not be restored without the passphrase.","WARNING: The private key of this wallet is not available. The export allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.":"WARNING: The private key of this wallet is not available. The export allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.","WARNING: This seed was created with a passphrase. To recover this wallet both the mnemonic and passphrase are needed.":"WARNING: This seed was created with a passphrase. To recover this wallet both the mnemonic and passphrase are needed.","Warning: this transaction has unconfirmed inputs":"Warning: this transaction has unconfirmed inputs","WARNING: UNTRUSTED CERTIFICATE":"WARNING: UNTRUSTED CERTIFICATE","WARNING: Wallet not registered":"WARNING: Wallet not registered","Warning!":"Warning!","We reserve the right to modify this disclaimer from time to time.":"We reserve the right to modify this disclaimer from time to time.","WELCOME TO COPAY":"WELCOME TO COPAY","While the software has undergone beta testing and continues to be improved by feedback from the open-source user and developer community, we cannot guarantee that there will be no bugs in the software.":"While the software has undergone beta testing and continues to be improved by feedback from the open-source user and developer community, we cannot guarantee that there will be no bugs in the software.","Write it down and keep them somewhere safe.":"Write it down and keep them somewhere safe.","Wrong number of seed words:":"Wrong number of seed words:","Wrong password":"Wrong password","Yes":"Yes","You acknowledge that your use of this software is at your own discretion and in compliance with all applicable laws.":"You acknowledge that your use of this software is at your own discretion and in compliance with all applicable laws.","You are responsible for safekeeping your passwords, private key pairs, PINs and any other codes you use to access the software.":"You are responsible for safekeeping your passwords, private key pairs, PINs and any other codes you use to access the software.","You assume any and all risks associated with the use of the software.":"You assume any and all risks associated with the use of the software.","You can safely install your wallet on another device and use it from multiple devices at the same time.":"You can safely install your wallet on another device and use it from multiple devices at the same time.","You do not have a wallet":"You do not have a wallet","You need the wallet seed to restore this personal wallet.":"You need the wallet seed to restore this personal wallet.","Your backup password":"Your backup password","Your export password":"Your export password","Your nickname":"Your nickname","Your password":"Your password","Your profile password":"Your profile password","Your wallet has been imported correctly":"Your wallet has been imported correctly","Your wallet key will be encrypted. Password cannot be recovered. Be sure to write it down":"Your wallet key will be encrypted. Password cannot be recovered. Be sure to write it down","Your Wallet Seed":"Your Wallet Seed","Your wallet seed and access to the server that coordinated the initial wallet creation. You still need {{index.m}} keys to spend.":"Your wallet seed and access to the server that coordinated the initial wallet creation. You still need {{index.m}} keys to spend."});
    gettextCatalog.setStrings('pl', {"(possible double spend)":"(możliwa podwójna wypłata)","(Trusted)":"(Zaufany)","[Balance Hidden]":"[Balans Ukryty]","{{fee}} will be deducted for bitcoin networking fees":"{{fee}} zostanie potrącone jako prowizja sieci bitcoin","{{feeRateStr}} of the transaction":"{{feeRateStr}} transakcji","{{index.m}}-of-{{index.n}}":"{{index.m}}-z-{{index.n}}","{{index.result.length - index.txHistorySearchResults.length}} more":"{{index.result.length - index.txHistorySearchResults.length}} więcej","{{index.txProgress}} transactions downloaded":"{{index.txProgress}} transakcji pobrane","{{item.m}}-of-{{item.n}}":"{{item.m}}-z-{{item.n}}","* A payment proposal can be deleted if 1) you are the creator, and no other copayer has signed, or 2) 24 hours have passed since the proposal was created.":"* Wniosek wypłaty może być usunięty jeśli: 1) Po utworzeniu nie zatwierdził go żaden inny współwłaściciel portfela lub 2) minęły 24 godziny od kiedy wniosek został utworzony.","<b>IF YOU LOSE ACCESS TO YOUR COPAY WALLET OR YOUR ENCRYPTED PRIVATE KEYS AND YOU HAVE NOT SEPARATELY STORED A BACKUP OF YOUR WALLET AND CORRESPONDING PASSWORD, YOU ACKNOWLEDGE AND AGREE THAT ANY BITCOIN YOU HAVE ASSOCIATED WITH THAT COPAY WALLET WILL BECOME INACCESSIBLE.</b>":"<b>JEŚLI UŻYTKOWNIK STRACI DOSTĘP DO PORTFELA COPAY LUB ZASZYFROWANYCH KLUCZY PRYWATNYCH, A NIE MA ZAPISANEJ KOPII ZAPASOWEJ PORTFELA I HASŁA, PRZYJMUJE DO WIADOMOŚCI, ŻE JAKIEKOLWIEK POSIADANE BITCOINY ZWIĄZANE Z TYM PORTFELEM COPAY BĘDĄ NIEDOSTĘPNE.</b>","<b>OR</b> 1 wallet export file and the remaining quorum of wallet recovery phrases (e.g. in a 3-5 wallet: 1 wallet export file + 2 wallet recovery phrases of any of the other copayers).":"<b>LUB</b> 1 plik eksportu portfela i reszta wymaganych fraz odzyskiwania portfela (np. w portfelu 3-5: 1 plik eksportu portfela + 2 frazy odzyskiwania któregokolwiek z pozostałych współwłaścicieli portfela).","<b>OR</b> the wallet recovery phrase of <b>all</b> copayers in the wallet":"<b>LUB</b> frazy odzyskiwania <b>wszystkich</b> współwłaścicieli portfela","<b>OR</b> the wallet recovery phrases of <b>all</b> copayers in the wallet":"<b>LUB</b> fraz odzyskiwania <b>wszystkich</b> współwłaścicieli portfela","A multisignature bitcoin wallet":"Portfel bitcoin z multipodpisami","About Copay":"Informacje o Copay","Accept":"Akceptuj","Account":"Konto","Account Number":"Numer konta","Activity":"Transakcje","Add a new entry":"Dodaj nowy wpis","Add a Password":"Dodaj hasło","Add an optional password to secure the recovery phrase":"Dodaj opcjonalne hasło do bezpiecznego odzyskiwania frazy","Add comment":"Dodaj komentarz","Add wallet":"Dodaj portfel","Address":"Adres","Address Type":"Rodzaj adresu","Advanced":"Zaawansowane","Alias":"Nazwa","Alias for <i>{{index.walletName}}</i>":"Nazwa dla <i>{{index.walletName}}</i>","All contributions to Copay's translation are welcome. Sign up at crowdin.com and join the Copay project at":"Wkład do tłumaczenia Copay mile widziany. Zapisz się na crowdin.com i dołącz do projektu Copay na","All transaction requests are irreversible.":"Transakcji nie można wycofać.","Alternative Currency":"Alternatywna waluta","Amount":"Kwota","Amount below minimum allowed":"Kwota poniżej minimum dozwolona","Amount in":"Kwota w","Are you sure you want to delete the recovery phrase?":"Czy na pewno chcesz usunąć frazę?","Are you sure you want to delete this wallet?":"Czy na pewno chcesz usunąć ten portfel?","Auditable":"Weryfikowalny","Available Balance":"Dostępne saldo","Average confirmation time: {{fee.nbBlocks * 10}} minutes":"Średni czas potwierdzenia: {{fee.nbBlocks * 10}} minut","Back":"Powrót","Backup":"Kopia zapasowa","Backup failed":"Tworzenie kopii zapasowej nie powiodło się","Backup Needed":"Potrzebna kopia zapasowa","Backup now":"Utwórz kopię zapasową teraz","Bad wallet invitation":"Nieprawidłowe zaproszenie","Balance By Address":"Saldo wg adresu","Before receiving funds, you must backup your wallet. If this device is lost, it is impossible to access your funds without a backup.":"Przed otrzymaniem środków, konieczne jest wykonanie kopii zapasowej portfela. Jeśli utracisz to urządzenie, dostęp do funduszy bez kopii zapasowej będzie niemożliwy.","BETA: Android Key Derivation Test:":"BETA: Test Android Key Derivation:","BIP32 path for address derivation":"BIP32 ścieżka dla adresu derywacji","Bitcoin address":"Adres bitcoin","Bitcoin Network Fee Policy":"Polityka prowizji sieci bitcoin","Bitcoin transactions may include a fee collected by miners on the network. The higher the fee, the greater the incentive a miner has to include that transaction in a block. Current fees are determined based on network load and the selected policy.":"Transakcje bitcoinowe mogą zawierać prowizję pobieraną przez górników. Im wyższa prowizja, tym większa zachęta dla górnika, aby zawarł tę transakcję w bloku. Rzeczywiste opłaty ustala się w oparciu o obciążenie sieci i wybraną politykę.","Bitcoin URI is NOT valid!":"Bitcoin URI jest nieprawidłowy!","Broadcast Payment":"Przekaż płatność","Broadcasting transaction":"Przekazywanie transakcji","Browser unsupported":"Przeglądarka nieobsługiwana","Calculating fee":"Obliczanie prowizji","Cancel":"Anuluj","Cancel and delete the wallet":"Anuluj i usuń portfel","Cannot create transaction. Insufficient funds":"Nie można utworzyć transakcji. Niewystarczające fundusze","Cannot join the same wallet more that once":"Nie można dołączyć tego samego portfela więcej niż raz","Cannot sign: The payment request has expired":"Nie można podpisać: Wniosek wypłaty wygasł","Certified by":"Certyfikowane przez","Changing wallet alias only affects the local wallet name.":"Zmiana nazwy portfela wpływa tylko na jego nazwę lokalną.","Chinese":"chiński","Choose a backup file from your computer":"Wybierz plik kopii zapasowej z komputera","Clear cache":"Wyczyść pamięć podręczną","Close":"Zamknij","Color":"Kolor","Comment":"Skomentuj","Commit hash":"Zatwierdzony hash","Confirm":"Potwierdź","Confirm your wallet recovery phrase":"Potwierdź swoją frazę odzyskiwania portfela","Confirmations":"Potwierdzenia","Congratulations!":"Gratulacje!","Connecting to Coinbase...":"Łączenie z Coinbase...","Connecting to Glidera...":"Łączenie z Gildera...","Connection reset by peer":"Połączenie zostało zresetowane","Continue":"Dalej","Copayer already in this wallet":"Użytkownik jest już w tym portfelu","Copayer already voted on this spend proposal":"Użytkownik głosował już za tym wnioskiem wypłaty","Copayer data mismatch":"Niezgodność danych współwłaściciela portfela","Copayers":"Współwłaściciele portfela","Copied to clipboard":"Skopiowano do schowka","Copy this text as it is to a safe place (notepad or email)":"Skopiuj ten tekst w bezpiecznym miejscu (notatnik lub e-mail)","Copy to clipboard":"Skopiuj do schowka","Could not access the wallet at the server. Please check:":"Nie można uzyskać dostępu do portfela na serwerze. Proszę sprawdzić:","Could not access wallet":"Nie można uzyskać dostępu do portfela","Could not access Wallet Service: Not found":"Brak dostępu do Wallet Service: Nie znaleziono","Could not broadcast payment":"Wypłata nie może zostać wysłana","Could not build transaction":"Nie udało się utworzyć transakcji","Could not create address":"Nie można utworzyć adresu","Could not create payment proposal":"Nie można wygenerować wniosku wypłaty","Could not create using the specified extended private key":"Nie można utworzyć przy użyciu określonego rozszerzonego klucza prywatnego","Could not create using the specified extended public key":"Nie można utworzyć przy użyciu określonego rozszerzonego klucza publicznego","Could not create: Invalid wallet recovery phrase":"Nie można utworzyć: niepoprawna fraza odzyskiwania portfela","Could not decrypt file, check your password":"Nie można odszyfrować pliku, sprawdź hasło","Could not delete payment proposal":"Nie można usunąć wniosku wypłaty","Could not fetch payment information":"Informacje dotyczące wypłaty nie mogą zostać pobrane","Could not get fee value":"Nie można uzyskać kwoty prowizji","Could not import":"Nie można zaimportować","Could not import. Check input file and spending password":"Nie można zaimportować. Sprawdź plik wejściowy i hasło","Could not join wallet":"Nie można dołączyć portfela","Could not recognize a valid Bitcoin QR Code":"Nie udało się rozpoznać poprawnego kodu QR","Could not reject payment":"Wypłata nie może być odrzucona","Could not send payment":"Wypłata nie może zostać wysłana","Could not update Wallet":"Nie można zaktualizować portfela","Create":"Utwórz","Create {{requiredCopayers}}-of-{{totalCopayers}} wallet":"Utwórz portfel {{requiredCopayers}} z {{totalCopayers}}","Create new wallet":"Utwórz nowy portfel","Create, join or import":"Utwórz, dołącz lub importuj","Created by":"Utworzony przez","Creating transaction":"Tworzenie transakcji","Creating Wallet...":"Tworzenie portfela...","Current fee rate for this policy: {{fee.feePerKBUnit}}/kiB":"Obecna stawka prowizji dla tych ustawień: {{fee.feePerKBUnit}}/KiB","Czech":"czeski","Date":"Data","Decrypting a paper wallet could take around 5 minutes on this device. please be patient and keep the app open.":"Odszyfrowywanie papierowego portfela zajmie na tym urządzeniu około 5 minut. Prosimy o niezamykanie aplikacji.","Delete it and create a new one":"Usuń i utwórz nowy portfel","Delete Payment Proposal":"Usuń wniosek wypłaty","Delete recovery phrase":"Usuń frazę odzyskiwania","Delete Recovery Phrase":"Usuń Frazę Odzyskiwania","Delete wallet":"Usuń portfel","Delete Wallet":"Usuń portfel","Deleting Wallet...":"Usuwanie portfela...","Derivation Path":"Ścieżka derywacji","Derivation Strategy":"Strategia derywacji","Description":"Opis","Details":"Szczegóły","Disabled":"Wyłącz","Do not include private key":"Nie uwzględniaj klucza prywatnego","Don't see your language on Crowdin? Contact the Owner on Crowdin! We'd love to support your language.":"Nie widzisz swojego języka na Crowdin? Skontaktuj się z właścicielem projektu, ponieważ bardzo chcielibyśmy, wspierać twój język.","Done":"Gotowe","Download":"Pobierz","Economy":"Ekonomiczna","Edit":"Edytuj","Edit comment":"Edytuj komentarz","Edited by":"Edytowane przez","Email for wallet notifications":"Adres e-mail dla powiadomień portfela","Email Notifications":"Powiadomienia e-mail","Empty addresses limit reached. New addresses cannot be generated.":"Puste adresy osiągnęły limit. Nowe adresy nie mogą być generowane.","Enable Coinbase Service":"Włącz usługę Coinbase","Enable Glidera Service":"Włącz usługę Glidera","Enable push notifications":"Włącz powiadomienia","Encrypted export file saved":"Zaszyfrowany plik eksportu zapisany","Enter the recovery phrase (BIP39)":"Wprowadź frazę odzyskiwania (BIP39)","Enter your password":"Wprowadź hasło","Enter your spending password":"Wprowadź hasło w celu wypłaty","Error at Wallet Service":"Błąd na Wallet Service","Error creating wallet":"Błąd podczas tworzenia portfela","Expired":"Wygasł","Expires":"Wygasa","Export options":"Opcje eksportu","Export to file":"Eksportuj do pliku","Export Wallet":"Eksport portfela","Exporting via QR not supported for this wallet":"Dla tego portfela nie jest obsługiwany eksport przez QR","Extended Public Keys":"Rozszerzone klucze publiczne","Extracting Wallet Information...":"Wyodrębnianie danych z portfela...","Failed to export":"Nie udało się wyeksportować","Failed to verify backup. Please check your information":"Nie udało się zweryfikować kopii zapasowej. Proszę sprawdzić swoje dane","Family vacation funds":"Fundusz wczasów rodzinnych","Fee":"Prowizja","Fetching Payment Information":"Pobieranie informacji o płatności","File/Text":"Plik/Tekst","Finger Scan Failed":"Skanowanie odcisku nie powiodło się","Finish":"Zakończ","For audit purposes":"Do celów audytu","French":"francuski","From the destination device, go to Add wallet &gt; Import wallet and scan this QR code":"Z urządzenia docelowego, przejdź do Dodaj portfel &gt; Import portfela i Zeskanuj ten kod QR","Funds are locked by pending spend proposals":"Fundusze są zablokowane przez rozpatrywane wniosku wypłaty","Funds found":"Znaleziono środki","Funds received":"Otrzymano środki","Funds will be transferred to":"Środki będą przekazane do","Generate new address":"Generuj nowy adres","Generate QR Code":"Generowanie kodu QR","Generating .csv file...":"Generowanie pliku csv...","German":"niemiecki","Getting address for wallet {{selectedWalletName}} ...":"Otrzymywanie adresu dla portfela {{selectedWalletName}} ...","Global preferences":"Ogólne preferencje","Hardware wallet":"Portfel sprzętowy","Hardware Wallet":"Portfel sprzętowy","Hide advanced options":"Ukryj opcje zaawansowane","I affirm that I have read, understood, and agree with these terms.":"Potwierdzam, że przeczytałem, zrozumiałem i zgadza się z regulaminem.","I AGREE. GET STARTED":"ZGADZAM SIĘ. ZACZYNAMY","Import":"Importuj","Import backup":"Importuj kopię zapasową","Import wallet":"Importuj portfel","Importing Wallet...":"Importowanie portfela...","In no event shall the authors of the software, employees and affiliates of Bitpay, copyright holders, or BitPay, Inc. be held liable for any claim, damages or other liability, whether in an action of contract, tort, or otherwise, arising from, out of or in connection with the software.":"W żadnym wypadku autorzy oprogramowania, pracownicy i oddziały Bitpay, posiadacze praw autorskich, czy BitPay, Inc. nie ponoszą odpowiedzialności za wszelkie roszczenia, odszkodowania lub inne zobowiązania, zarówno wynikające z umowy, czynu niedozwolonego lub z innego tytułu, związanego z oprogramowaniem.","In order to verify your wallet backup, please type your password:":"W celu weryfikacji kopii zapasowej portfela wpisz swoje hasło:","Incorrect address network":"Nieprawidłowy adres sieciowy","Incorrect code format":"Niepoprawny format kodu","Insufficient funds":"Nie ma wystarczającej ilości środków","Insufficient funds for fee":"Niewystarczające środki na prowizję","Invalid":"Nieprawidłowy","Invalid account number":"Nieprawidłowy numer konta","Invalid address":"Nieprawidłowy adres","Invalid derivation path":"Nieprawidłowa ścieżka derywacji","Invitation to share a Copay Wallet":"Zaproszenie do współdzielenia portfela Copay","Italian":"włoski","Japanese":"japoński","John":"Jan","Join":"Dołącz","Join my Copay wallet. Here is the invitation code: {{secret}} You can download Copay for your phone or desktop at https://copay.io":"Dołącz do mojego portfela Copay. Kod zaproszenia: {{secret}} Wersję desktopową lub aplikację na telefon można pobrać z https://copay.io","Join shared wallet":"Dołącz do portfela","Joining Wallet...":"Dołączanie do portfela...","Key already associated with an existing wallet":"Klucz jest już powiązany z istniejącym portfelem","Label":"Etykieta","Language":"Język","Last Wallet Addresses":"Ostatnie adresy portfela","Learn more about Copay backups":"Dowiedz się więcej o kopiach zapasowych Copay","Loading...":"Ładowanie...","locked by pending payments":"zablokowane przez oczekujące wypłaty","Locktime in effect. Please wait to create a new spend proposal":"Skuteczna blokada. Proszę czekać, aby utworzyć nowy wniosek wypłaty","Locktime in effect. Please wait to remove this spend proposal":"Skuteczna blokada. Proszę czekać, aby usunąć wniosek wypłaty","Make a payment to":"Wypłać do","Matches:":"Dopasowania:","me":"ja","Me":"Ja","Memo":"Notatka","Merchant message":"Wiadomość handlowa","Message":"Wiadomość","Missing parameter":"Brak parametru","Missing private keys to sign":"Brak kluczy prywatnych do podpisania","Moved":"Przeniesiony","Multiple recipients":"Wielu odbiorców","My Bitcoin address":"Mój adres Bitcoin","My contacts":"Moje kontakty","My wallets":"Moje portfele","Need to do backup":"Musisz zrobić kopię zapasową","Network":"Sieć","Network connection error":"Błąd połączenia z siecią","New Payment Proposal":"Nowy wniosek wypłaty","New Random Recovery Phrase":"Nowa losowa fraza odzyskiwania","No hardware wallets supported on this device":"Portfele sprzętowe nie są obsługiwane przez to urządzenie","No transactions yet":"Brak transakcji","Normal":"Zwykła","Not authorized":"Brak autoryzacji","Not completed":"Nie ukończono","Not enough funds for fee":"Brak środków na opłacenie prowizji","Not valid":"Nieprawidłowy","Note":"Notatka","Note: a total of {{amountAboveMaxSizeStr}} were excluded. The maximum size allowed for a transaction was exceeded":"Uwaga: łącznie kwota {{amountAboveMaxSizeStr}} została wyłączona. Został przekroczony maksymalny rozmiar dozwolony dla transakcji","Note: a total of {{amountBelowFeeStr}} were excluded. These funds come from UTXOs smaller than the network fee provided.":"Uwaga: łącznie kwota {{amountBelowFeeStr}} została wyłączona. Fundusze te pochodzą z UTXOs mniejszych niż gwarantowana prowizja sieci.","NOTE: To import a wallet from a 3rd party software, please go to Add Wallet &gt; Create Wallet, and specify the Recovery Phrase there.":"Uwaga: Aby zaimportować portfel z oprogramowania innego niż Copay, przejdź do Dodaj Portfel &gt; Utwórz Portfel, i podaj tam frazę odzyskiwania.","Official English Disclaimer":"Oficjalna rezygnacja w języku angielskim","OKAY":"W PORZĄDKU","Once you have copied your wallet recovery phrase down, it is recommended to delete it from this device.":"Po skopiowaniu frazy odzyskiwania portfela, zaleca się usunięcie jej z urządzenia.","Only Main (not change) addresses are shown. The addresses on this list were not verified locally at this time.":"Wyświetlane są tylko główne (niezmienne) adresy. Adresy na tej liście nie zostały w tej chwili zweryfikowane lokalnie.","Open Settings app":"Otwórz ustawienia aplikacji","optional":"opcjonalnie","Paper Wallet Private Key":"Klucz prywatny portfela papierowego","Participants":"Uczestnicy","Passphrase":"Hasło","Password":"Hasło","Password required. Make sure to enter your password in advanced options":"Wymagane hasło. Upewnij się, aby wprowadzić hasło w opcjach zaawansowanych","Paste invitation here":"Wklej tutaj zaproszenie","Paste the backup plain text code":"Wklej tekst kodu kopii zapasowej","Paste your paper wallet private key here":"Wklej tutaj prywatny klucz portfela papierowego","Pasted from clipboard":"Wklejone ze schowka","Pay To":"Zapłać","Payment Accepted":"Wypłata zaakceptowana","Payment accepted, but not yet broadcasted":"Wypłata zaakceptowana, ale jeszcze nie nadana","Payment accepted. It will be broadcasted by Glidera. In case there is a problem, it can be deleted 6 hours after it was created.":"Wypłata zaakceptowana. Będzie nadana przez Glidera. W przypadku wystąpienia problemu, może być usunięta 6 godzin po utworzeniu.","Payment details":"Szczegóły wypłaty","Payment expires":"Płatność wygasa","Payment Proposal":"Wniosek wypłaty","Payment Proposal Created":"Wniosek wypłaty utworzony","Payment Proposal Rejected":"Wniosek wypłaty odrzucony","Payment Proposal Rejected by Copayer":"Wniosek wypłaty odrzucony przez współwłaściciela portfela","Payment Proposal Signed by Copayer":"Wniosek wypłaty zatwierdzony przez współwłaściciela portfela","Payment Proposals":"Wniosek wypłaty","Payment Protocol Invalid":"Protokół wypłaty nieprawidłowy","Payment Protocol not supported on Chrome App":"Protokół wypłaty nieobsługiwany przez Chrome","Payment Rejected":"Wypłata odrzucona","Payment request":"Wniosek o płatność","Payment Sent":"Płatność wysłana","Payment to":"Wypłata dla","Pending Confirmation":"Oczekiwanie na potwierdzenie","Permanently delete this wallet. THIS ACTION CANNOT BE REVERSED":"Trwale usuń ten portfel. TEN KROK JEST NIEODWRACALNY","Personal Wallet":"Portfel osobisty","Please enter the recovery phrase":"Wpisz frazę odzyskiwania","Please enter the required fields":"Proszę wypełnić wymagane pola","Please enter the wallet recovery phrase":"Wpisz frazę odzyskiwania portfela","Please tap the words in order to confirm your backup phrase is correctly written.":"Proszę wybrać słowa w celu potwierdzenia poprawności frazy odzyskiwania.","Please upgrade Copay to perform this action":"Proszę uaktualnić Copay, by móc wykonać tę operację","Please wait to be redirected...":"Proszę czekać na przekierowanie...","Please, select your backup file":"Proszę wybrać plik kopii zapasowej","Polish":"polski","Preferences":"Ustawienia","Preparing backup...":"Przygotowywanie kopii zapasowej...","preparing...":"Przygotowywanie...","Press again to exit":"Naciśnij ponownie, aby wyjść","Priority":"Priorytetowa","Private key is encrypted, cannot sign":"Klucz prywatny jest zaszyfrowany, nie można podpisać","Push notifications for Copay are currently disabled. Enable them in the Settings app.":"Powiadomienia Copay są obecnie wyłączone. Włącz je w ustawieniach aplikacji.","QR Code":"Kod QR","QR-Scanner":"Skaner kodów QR","Receive":"Otrzymaj","Received":"Otrzymane","Recipients":"Odbiorcy","Recovery Phrase":"Fraza odzyskiwania","Recovery phrase deleted":"Fraza odzyskiwania usunięta","Recreate":"Przywróć","Recreating Wallet...":"Przywracanie portfela...","Reject":"Odrzuć","Release Information":"Informacje o wersji","Remove":"Usuń","Repeat password":"Powtórz hasło","Repeat the password":"Powtórz hasło","Repeat the spending password":"Powtórz hasło wypłat","Request a specific amount":"Prośba o konkretną kwotę","Request Spending Password":"Wymaganie Hasła Wypłat","Required":"Wymagania","Required number of signatures":"Wymagana liczba podpisów","Retrieving inputs information":"Pobieranie informacji o danych wejściowych","Russian":"rosyjski","Save":"Zapisz","Scan addresses for funds":"Skanuj adresy w celu znalezienia środków","Scan Fingerprint":"Skanuj linie papilarne","Scan Finished":"Skanowanie zakończone","Scan status finished with error":"Stan skanowania zakończony błędem","Scan Wallet Funds":"Skanuj środki portfela","Scan your fingerprint please":"Proszę zeskanować linie papilarne","Scanning Wallet funds...":"Skanowanie środków portfela...","Search transactions":"Szukaj transakcji","Search Transactions":"Szukaj transakcji","Security preferences":"Ustawienia zabezpieczeń","See it on the blockchain":"Zobacz w blockchainie","Select a backup file":"Wybierz plik kopii zapasowej","Select a wallet":"Wybierz portfel","Self-signed Certificate":"Certyfikat z podpisem własnym","Send":"Wyślij","Send addresses by email":"Wyślij adresy przez e-mail","Send bitcoin":"Wyślij bitcoiny","Send by email":"Wyślij przez e-mail","Send Max":"Wyślij wszystko","Sending":"Wysyłanie","Sending transaction":"Wysyłanie transakcji","Sent":"Wysłane","Server response could not be verified":"Odpowiedź serwera nie mogła zostać zweryfikowana","Session log":"Dziennik sesji","SET":"ZATWIERDŹ","Set default url":"Ustaw domyślny adres url","Set up a password":"Ustawianie hasła","Set up a spending password":"Wprowadź hasło w celu wypłaty","Setting up email notifications could weaken your privacy, if the wallet service provider is compromised. Information available to an attacker would include your wallet addresses and its balance, but no more.":"Włączenie powiadomień e-mail może mieć wpływ na twoją prywatność, jeżeli usługodawca portfela będzie narażony na ataki cyberprzestępców. Informacje dostępne dla atakującego będą zawierać jedynie adres twojego portfela i saldo.","Settings":"Ustawienia","Share address":"Udostępnij adres","Share invitation":"Wyślij zaproszenie","Share this invitation with your copayers":"Wyślij zaproszenie współwłaścicielom portfela","Share this wallet address to receive payments":"Udostępnij ten adres portfela w celu otrzymania płatności","Share this wallet address to receive payments. To protect your privacy, new addresses are generated automatically once you use them.":"Udostępnij ten adres w celu otrzymania płatności. Aby chronić twoją prywatność nowe adresy są generowane automatycznie po ich użyciu.","Shared Wallet":"Współdzielony portfel","Show advanced options":"Pokaż opcje zaawansowane","Signatures rejected by server":"Podpisy odrzucone przez serwer","Signing transaction":"Podpisywanie transakcji","Single Address Wallet":"Pojedynczy adres portfela","Spanish":"hiszpański","Specify Recovery Phrase...":"Określ Frazę Odzyskiwania...","Spend proposal is not accepted":"Wniosek wypłaty nie został przyjęty","Spend proposal not found":"Wniosek wypłaty nie został znaleziony","Spending Password needed":"Wymagane Hasło Wypłat","Spending Passwords do not match":"Podane hasła różnią się","Success":"Udało się","Super Economy":"Super Ekonomiczna","Sweep paper wallet":"Wyczyść papierowy portfel","Sweep Wallet":"Wyczyść portfel","Sweeping Wallet...":"Sczytywanie portfela...","Tap and hold to show":"Dotknij i przytrzymaj, aby pokazać","Tap to retry":"Ponów próbę","Terms of Use":"Warunki użytkowania","The authors of the software, employees and affiliates of Bitpay, copyright holders, and BitPay, Inc. cannot retrieve your private keys or passwords if you lose or forget them and cannot guarantee transaction confirmation as they do not have control over the Bitcoin network.":"Autorzy oprogramowania, pracownicy i asystenci Bitpay, posiadacze praw autorskich i BitPay Inc. nie mogą odzyskać kluczy prywatnych lub haseł w wypadku ich utraty i nie mogą zagwarantować potwierdzenia transakcji, ponieważ nie mają kontroli nad siecią Bitcoin.","The derivation path":"Ścieżka derywacji","The Ledger Chrome application is not installed":"Aplikacja Ledger Chrome nie jest zainstalowana","The password of the recovery phrase (if set)":"Hasło odzyskiwania frazy (jeśli ustawione)","The payment was created but could not be completed. Please try again from home screen":"Wypłata została utworzona, ale nie może być zakończona. Spróbuj ponownie na stronie głównej","The payment was removed by creator":"Wypłata została usunięta przez jej twórcę","The recovery phrase could require a password to be imported":"Fraza odzyskiwania może wymagać hasła do zaimportowania","The request could not be understood by the server":"Wniosek nie został zrozumiany przez serwer","The software does not constitute an account where BitPay or other third parties serve as financial intermediaries or custodians of your bitcoin.":"Oprogramowanie nie jest kontem, gdzie BitPay lub inne osoby trzecie mogą służyć jako pośrednicy finansowi lub opiekunowie twoich bitcoinów.","The software you are about to use functions as a free, open source, and multi-signature digital wallet.":"Oprogramowanie to jest darmowym, open source, obsługującym multipodpisy cyfrowym portfelem.","The spend proposal is not pending":"Wniosek płatności nie jest oczekujący","The wallet \"{{walletName}}\" was deleted":"Portfel \"{{walletName}}\" został usunięty","The Wallet Recovery Phrase could require a password to be imported":"Fraza odzyskiwania portfela może wymagać hasła do zaimportowania","The wallet service URL":"Adres URL usługi Portfel","There are no wallets to make this payment":"Brak portfela, aby dokonać tej wypłaty","There is a new version of Copay. Please update":"Jest dostępna nowa wersja Copay. Proszę zaktualizować","There is an error in the form":"Wystąpił błąd w postaci","This recovery phrase was created with a password. To recover this wallet both the recovery phrase and password are needed.":"Ta fraza odzyskiwania został utworzona przy użyciu hasła. Aby odzyskać ten portfel potrzebna jest fraza odzyskiwania i hasło.","This transaction has become invalid; possibly due to a double spend attempt.":"Ta transakcja jest nieprawidłowa. Może to być spowodowane próbą podwójnej płatności.","This wallet is not registered at the given Bitcore Wallet Service (BWS). You can recreate it from the local information.":"Ten portfel nie jest zarejestrowany na Bitcore Wallet Service (BWS). Możesz go odtworzyć z lokalnego nośnika.","Time":"Czas","To":"Do","To restore this {{index.m}}-{{index.n}} <b>shared</b> wallet you will need":"Aby przywrócić ten {{index.m}}-{{index.n}} <b>wspólny</b> portfel musisz","To the fullest extent permitted by law, this software is provided “as is” and no representations or warranties can be made of any kind, express or implied, including but not limited to the warranties of merchantability, fitness or a particular purpose and noninfringement.":"W najszerszym zakresie dozwolonym przez prawo, to oprogramowanie jest dostarczane w stanie, w jakim jest (\"jak widać\") bez jakiejkolwiek gwarancji, ani wyraźnej, ani domyślnej, w tym między innymi domyślnych gwarancji co do przydatności handlowej, przydatności do określonych zastosowań i nienaruszalności.","too long!":"za długo!","Total Locked Balance":"Łącznie zablokowane środki","Total number of copayers":"Liczba współwłaścicieli portfela","Touch ID Failed":"Odczyt Touch ID nie powiódł się","Transaction":"Transakcja","Transaction already broadcasted":"Transakcja została już wysłana","Transaction History":"Historia transakcji","Translation Credits":"Przetłumaczone przez","Translators":"Tłumacze","Try again":"Spróbuj ponownie","Type the Recovery Phrase (usually 12 words)":"Wpisz frazę odzyskiwania (zazwyczaj 12 słów)","Unconfirmed":"Niepotwierdzone","Unit":"Jednostka","Unsent transactions":"Niewysłane transakcje","Updating transaction history. Please stand by.":"Aktualizowanie historii transakcji. Proszę czekać.","Updating Wallet...":"Aktualizowanie portfela...","Use Unconfirmed Funds":"Użyj niepotwierdzonych środków","Validating recovery phrase...":"Sprawdzanie poprawności frazy odzyskiwania...","Validating wallet integrity...":"Sprawdzanie integralności portfela...","Version":"Wersja","View":"Widok","Waiting for copayers":"Oczekiwanie na współwłaścicieli portfela","Waiting for Ledger...":"Oczekiwanie na Ledger...","Waiting for Trezor...":"Oczekiwanie na Trezor...","Waiting...":"Oczekiwanie...","Wallet already exists":"Portfel już istnieje","Wallet already in Copay":"Portfel jest już w Copay","Wallet Configuration (m-n)":"Konfiguracja portfela (m-n)","Wallet Export":"Eksport portfela","Wallet Id":"Id Portfela","Wallet incomplete and broken":"Awaria: Portfel nie działa","Wallet Information":"Informacje o portfelu","Wallet Invitation":"Zaproszenie do portfela","Wallet Invitation is not valid!":"Zaproszenie do portfela jest nieważne!","Wallet is full":"Portfel jest pełny","Wallet is locked":"Portfel jest zablokowany","Wallet is not complete":"Portfel jest niekompletny","Wallet name":"Nazwa portfela","Wallet Name (at creation)":"Nazwa portfela (oryginalna)","Wallet needs backup":"Portfel wymaga kopii zapasowej","Wallet Network":"Sieć portfela","Wallet not found":"Nie znaleziono portfela","Wallet not registered at the wallet service. Recreate it from \"Create Wallet\" using \"Advanced Options\" to set your recovery phrase":"Portfel nie jest zarejestrowany w Wallet Service. Odtwórz go używając polecenia \"Utwórz portfel\" z wykorzystaniem frazy odzyskiwania w ustawieniach zaawansowanych","Wallet Preferences":"Preferencje Portfela","Wallet Recovery Phrase":"Fraza Odzyskiwania Portfela","Wallet Recovery Phrase is invalid":"Fraza odzyskiwania portfela nieprawidłowa","Wallet recovery phrase not available. You can still export it from Advanced &gt; Export.":"Fraza odzyskiwania portfela niedostępna. Nadal można go wyeksportować w: Zaawansowane &gt; Eksport portfela.","Wallet service not found":"Nie znaleziono serwera","WARNING: Key derivation is not working on this device/wallet. Actions cannot be performed on this wallet.":"Ostrzeżenie: klucz derywacji nie działa na tym urządzeniu/portfel. Działania dla tego portfela nie można wykonać.","WARNING: Not including the private key allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.":"UWAGA: Jeśli plik eksportu nie zawiera klucza prywatnego, możliwe będzie jedynie sprawdzenie salda i historii transakcji, jak również wygenerowanie wniosków o płatność. Nie może być on jednak używany do sprawdzania poprawności (podpisywania) wniosków płatności, więc <b>środki z wyeksportowanego pliku nie będą dostępne</b>.","WARNING: The password cannot be recovered. <b>Be sure to write it down</b>. The wallet can not be restored without the password.":"OSTRZEŻENIE: Hasła nie można odzyskać. <b>Pamiętaj, aby je zapisać</b>. Portfela nie można przywrócić bez hasła.","WARNING: The private key of this wallet is not available. The export allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.":"UWAGA: Klucz prywatny nie jest dostępny. Ten eksport umożliwia sprawdzenie salda i historii transakcji, jak również wygenerowanie wniosków o płatność. Nie może być on jednak używany do sprawdzania poprawności (podpisywania) wniosków płatności, więc <b>środki z wyeksportowanego pliku nie będą dostępne</b>.","Warning: this transaction has unconfirmed inputs":"Ostrzeżenie: ta transakcja ma niepotwierdzone dane wejściowe","WARNING: UNTRUSTED CERTIFICATE":"OSTRZEŻENIE: CERTYFIKAT NIEZAUFANY","WARNING: Wallet not registered":"Ostrzeżenie: Portfel niezarejestrowany","Warning!":"Ostrzeżenie!","We reserve the right to modify this disclaimer from time to time.":"Zastrzegamy sobie prawo do wprowadzania zmian w niniejszych warunkach użytkowania.","WELCOME TO COPAY":"WITAMY W COPAY","While the software has undergone beta testing and continues to be improved by feedback from the open-source user and developer community, we cannot guarantee that there will be no bugs in the software.":"Dopóki oprogramowanie jest w fazie testów i nadal, dzięki informacjom od użytkowników i społeczności programistów, dokonywane są poprawki, nie możemy zagwarantować, że będzie ono wolne od błędów.","Write your wallet recovery phrase":"Wpisz swoją frazę odzyskiwania portfela","Wrong number of recovery words:":"Nieprawidłowa ilość słów frazy:","Wrong spending password":"Nieprawidłowe hasło wypłat","Yes":"Tak","You acknowledge that your use of this software is at your own discretion and in compliance with all applicable laws.":"Użytkownik przyjmuje do wiadomości, że korzysta z tego oprogramowania na własną odpowiedzialność i zgodnie z obowiązującym prawem.","You are responsible for safekeeping your passwords, private key pairs, PINs and any other codes you use to access the software.":"Użytkownik jest odpowiedzialny za przechowywanie swoich haseł, kluczy publicznych i prywatnych, numerów PIN i innych kodów, których używa do uzyskania dostępu do oprogramowania.","You assume any and all risks associated with the use of the software.":"Użytkownik bierze na siebie wszelkie ryzyko związane z korzystaniem z tego oprogramowania.","You backed up your wallet. You can now restore this wallet at any time.":"Wykonałeś kopię zapasową portfela. Teraz możesz go odtworzyć w każdej chwili.","You can safely install your wallet on another device and use it from multiple devices at the same time.":"Możesz bezpiecznie zainstalować swój portfel na innym urządzeniu i używać go z wieloma urządzeniami jednocześnie.","You do not have any wallet":"Nie masz żadnego portfela","You need the wallet recovery phrase to restore this personal wallet. Write it down and keep them somewhere safe.":"Potrzebujesz frazę odzyskiwania, aby móc odtworzyć ten portfel. Zapisz ją i przechowuj w bezpiecznym miejscu.","Your nickname":"Twój nick","Your password":"Twoje hasło","Your spending password":"Twoje hasło wypłat","Your wallet has been imported correctly":"Twój portfel został zaimportowany poprawnie","Your wallet key will be encrypted. The Spending Password cannot be recovered. Be sure to write it down":"Klucz portfela będzie zaszyfrowany. Hasło wypłat nie może być odzyskane. Pamiętaj, aby je zapisać","Your wallet recovery phrase and access to the server that coordinated the initial wallet creation. You still need {{index.m}} keys to spend.":"Twoja fraza odzyskiwania i dostęp do serwera koordynowały tworzenie początkowego portfela. Musisz jeszcze {{index.m}} w celu dokonania płatności."});
    gettextCatalog.setStrings('pt', {"(possible double spend)":"(possible double spend)","(Trusted)":"(Trusted)","{{fee}} will be deducted for bitcoin networking fees":"{{fee}} will be deducted for bitcoin networking fees","{{index.m}}-of-{{index.n}}":"{{index.m}}-of-{{index.n}}","{{item.m}}-of-{{item.n}}":"{{item.m}}-of-{{item.n}}","{{len}} wallets imported. Funds scanning in progress. Hold on to see updated balance":"{{len}} carteiras importadas. Recursos de digitalização em andamento. Espere para ver o saldo atualizado","* A payment proposal can be deleted if 1) you are the creator, and no other copayer has signed, or 2) 24 hours have passed since the proposal was created.":"* A payment proposal can be deleted if 1) you are the creator, and no other copayer has signed, or 2) 24 hours have passed since the proposal was created.","<b>IF YOU LOSE ACCESS TO YOUR COPAY WALLET OR YOUR ENCRYPTED PRIVATE KEYS AND YOU HAVE NOT SEPARATELY STORED A BACKUP OF YOUR WALLET AND CORRESPONDING PASSWORD, YOU ACKNOWLEDGE AND AGREE THAT ANY BITCOIN YOU HAVE ASSOCIATED WITH THAT COPAY WALLET WILL BECOME INACCESSIBLE.</b>":"<b>IF YOU LOSE ACCESS TO YOUR COPAY WALLET OR YOUR ENCRYPTED PRIVATE KEYS AND YOU HAVE NOT SEPARATELY STORED A BACKUP OF YOUR WALLET AND CORRESPONDING PASSWORD, YOU ACKNOWLEDGE AND AGREE THAT ANY BITCOIN YOU HAVE ASSOCIATED WITH THAT COPAY WALLET WILL BECOME INACCESSIBLE.</b>","<b>OR</b> 1 wallet export file and the remaining quorum of wallet seeds (e.g. in a 3-5 wallet: 1 wallet export file + 2 wallet seeds of any of the other copayers).":"<b>OR</b> 1 wallet export file and the remaining quorum of wallet seeds (e.g. in a 3-5 wallet: 1 wallet export file + 2 wallet seeds of any of the other copayers).","<b>OR</b> the wallet seed of <b>all</b> copayers in the wallet":"<b>OR</b> the wallet seed of <b>all</b> copayers in the wallet","<b>OR</b> the wallet seeds of <b>all</b> copayers in the wallet":"<b>OR</b> the wallet seeds of <b>all</b> copayers in the wallet","A multisignature bitcoin wallet":"Uma carteira de bitcoin multi-assinada","About Copay":"Sobre a Copay","Accept":"Aceitar","Add a Seed Passphrase":"Add a Seed Passphrase","Add an optional passphrase to secure the seed":"Add an optional passphrase to secure the seed","Add wallet":"Adicionar carteira","Address":"Endereço","Address Type":"Address Type","Advanced":"Avançado","Advanced Send":"Advanced Send","Agree":"Concordar","Alias for <i>{{index.walletName}}</i>":"Alias for <i>{{index.walletName}}</i>","All contributions to Copay's translation are welcome. Sign up at crowdin.com and join the Copay project at":"All contributions to Copay's translation are welcome. Sign up at crowdin.com and join the Copay project at","All transaction requests are irreversible.":"All transaction requests are irreversible.","Already have a wallet?":"Já tem uma carteira?","Alternative Currency":"Moeda Alternativa","Amount":"﻿Valor","Amount below dust threshold":"Amount below dust threshold","Amount in":"Montante em","Applying changes":"Aplicar alterações","Are you sure you want to delete the backup words?":"Are you sure you want to delete the backup words?","Are you sure you want to delete this wallet?":"Tem certeza que deseja excluir esta carteira?","Available Balance":"Saldo Disponível","Average confirmation time: {{fee.nbBlocks * 10}} minutes":"Average confirmation time: {{fee.nbBlocks * 10}} minutes","Back":"Voltar","Backup":"Backup","Backup now":"Backup agora","Backup words deleted":"Backup words deleted","Bad wallet invitation":"Bad wallet invitation","Balance By Address":"Balance By Address","Before receiving funds, it is highly recommended you backup your wallet keys.":"Antes de receber fundos, é altamente recomendável que você faça backup de suas chaves de carteira.","Bitcoin address":"Endereço Bitcoin","Bitcoin Network Fee Policy":"Bitcoin Network Fee Policy","Bitcoin transactions may include a fee collected by miners on the network. The higher the fee, the greater the incentive a miner has to include that transaction in a block. Actual fees are determined based on network load and the selected policy.":"Bitcoin transactions may include a fee collected by miners on the network. The higher the fee, the greater the incentive a miner has to include that transaction in a block. Actual fees are determined based on network load and the selected policy.","Bitcoin URI is NOT valid!":"Bitcoin URI não é válido!","Broadcast Payment":"Transmitir Pagamento","Broadcasting Payment":"Transmitindo Pagamento","Broadcasting transaction":"Transmitindo transação","Browser unsupported":"Navegador não suportado","Cancel":"Cancelar","CANCEL":"CANCELAR","Cannot join the same wallet more that once":"Cannot join the same wallet more that once","Certified by":"Certificado por","Changing wallet alias only affects the local wallet name.":"Alterando o apelido da carteira somente afeta o nome da carteira local.","Choose a backup file from your computer":"Escolha um arquivo de backup do seu computador","Choose a wallet to send funds":"Choose a wallet to send funds","Close":"Fechar","Color":"Cor","Commit hash":"Commit de hash","Confirm":"Confirm","Confirmations":"Confirmações","Connecting to {{create.hwWallet}} Wallet...":"Connecting to {{create.hwWallet}} Wallet...","Connecting to {{import.hwWallet}} Wallet...":"Connecting to {{import.hwWallet}} Wallet...","Connecting to {{join.hwWallet}} Wallet...":"Connecting to {{join.hwWallet}} Wallet...","Copayer already in this wallet":"Copayer already in this wallet","Copayer already voted on this spend proposal":"Copayer already voted on this spend proposal","Copayer data mismatch":"Copayer data mismatch","Copayers":"Copayers","Copied to clipboard":"Copied to clipboard","Copy this text as it is to a safe place (notepad or email)":"Copie este texto como está para um lugar seguro (bloco de notas ou e-mail)","Copy to clipboard":"Copiar para área de transferência","Could not accept payment":"Could not accept payment","Could not access Wallet Service: Not found":"Could not access Wallet Service: Not found","Could not broadcast payment":"Could not broadcast payment","Could not create address":"Could not create address","Could not create payment proposal":"Não foi possível criar proposta de pagamento","Could not create using the specified extended private key":"Não foi possível criar usando a chave privada estendida especificada","Could not create using the specified extended public key":"Could not create using the specified extended public key","Could not create: Invalid wallet seed":"Could not create: Invalid wallet seed","Could not decrypt":"Could not decrypt","Could not decrypt file, check your password":"Não foi possível descriptografar o arquivo, verifique sua senha","Could not delete payment proposal":"Could not delete payment proposal","Could not fetch payment information":"Não foi possível obter a informação do pagamento","Could not fetch transaction history":"Não foi possível obter o histórico de transação","Could not import":"Could not import","Could not import. Check input file and password":"Não foi possível importar. Verifique o arquivo de entrada e senha","Could not join wallet":"Could not join wallet","Could not recognize a valid Bitcoin QR Code":"Could not recognize a valid Bitcoin QR Code","Could not reject payment":"Could not reject payment","Could not send payment":"Não foi possível enviar o pagamento","Could not update Wallet":"Não é possível atualizar carteira","Create":"Criar","Create {{requiredCopayers}}-of-{{totalCopayers}} wallet":"Create {{requiredCopayers}}-of-{{totalCopayers}} wallet","Create new wallet":"Criando nova carteira","Create, join or import":"Criar, participar ou importar","Created by":"Criado por","Creating Profile...":"Criando Perfil…","Creating transaction":"Criando transação","Creating Wallet...":"Criando Carteira…","Current fee rate for this policy: {{fee.feePerKBUnit}}/kiB":"Current fee rate for this policy: {{fee.feePerKBUnit}}/kiB","Date":"Data","Decrypting a paper wallet could take around 5 minutes on this device. please be patient and keep the app open.":"Decrypting a paper wallet could take around 5 minutes on this device. please be patient and keep the app open.","Delete it and create a new one":"Apagar e criar um novo","Delete Payment Proposal":"Excluir Proposta de Pagamento","Delete wallet":"Excluir carteira","Delete Wallet":"Excluir Carteira","DELETE WORDS":"DELETE WORDS","Deleting payment":"Excluindo pagamento","Derivation Strategy":"Derivation Strategy","Details":"Detalhes","Disabled":"Desabilitado","Do not include private key":"Do not include private key","Don't see your language on Crowdin? Contact the Owner on Crowdin! We'd love to support your language.":"Don't see your language on Crowdin? Contact the Owner on Crowdin! We'd love to support your language.","Download":"Download","Download CSV file":"Download CSV file","Economy":"Economy","Email":"Email","Email for wallet notifications":"Email for wallet notifications","Email Notifications":"Notificações por E-mail","Encrypted export file saved":"Encrypted export file saved","Enter the seed words (BIP39)":"Enter the seed words (BIP39)","Enter your password":"Digite sua senha","Error at Wallet Service":"Error at Wallet Service","Error creating wallet":"Erro na criação da carteira","Error importing wallet:":"Erro importando carteira:","Expires":"﻿Expira","Export":"Export","Export options":"Export options","Extended Public Keys":"Extended Public Keys","External Private Key:":"External Private Key:","Failed to export":"Failed to export","Failed to import wallets":"Falha ao importar carteiras","Family vacation funds":"Fundos de férias com a família","Fee":"Fee","Fee Policy":"Fee Policy","Fee policy for this transaction":"Fee policy for this transaction","Fetching Payment Information":"Buscando Informação de Pagamento","File/Text Backup":"File/Text Backup","French":"Francês","Funds are locked by pending spend proposals":"Funds are locked by pending spend proposals","Funds found":"Funds found","Funds received":"Fundos recebidos","Funds will be transfered to":"Funds will be transfered to","Generate new address":"Gerar novo endereço","Generate QR Code":"Generate QR Code","Generating .csv file...":"Generating .csv file...","German":"Alemão","GET STARTED":"COMEÇAR","Getting address for wallet {{selectedWalletName}} ...":"Getting address for wallet {{selectedWalletName}} ...","Global settings":"Configurações globais","Go back":"Go back","Greek":"Grego","Hardware wallet":"Hardware wallet","Hardware Wallet":"Hardware Wallet","Have a Backup from Copay v0.9?":"Tem um Backup do Copay v 0.9?","Hide advanced options":"Hide advanced options","Hide Wallet Seed":"Hide Wallet Seed","History":"História","Home":"Início","I affirm that I have read, understood, and agree with these terms.":"I affirm that I have read, understood, and agree with these terms.","Import":"Importar","Import backup":"Importar backup","Import from Ledger":"Import from Ledger","Import from the Cloud?":"Importar da nuvem?","Import from TREZOR":"Import from TREZOR","Import here":"Importar aqui","Import wallet":"Importar carteira","Importing wallet...":"Importando carteira…","Importing...":"Importando…","In no event shall the authors of the software, employees and affiliates of Bitpay, copyright holders, or BitPay, Inc. be held liable for any claim, damages or other liability, whether in an action of contract, tort, or otherwise, arising from, out of or in connection with the software.":"In no event shall the authors of the software, employees and affiliates of Bitpay, copyright holders, or BitPay, Inc. be held liable for any claim, damages or other liability, whether in an action of contract, tort, or otherwise, arising from, out of or in connection with the software.","Incorrect address network":"Incorrect address network","Insufficient funds":"Insufficient funds","Insufficient funds for fee":"Insufficient funds for fee","Invalid":"Invalid","Invalid address":"Invalid address","Invitation to share a Copay Wallet":"Invitation to share a Copay Wallet","Italian":"Italiano","Japanese":"﻿Japonês","John":"John","Join":"Participar","Join my Copay wallet. Here is the invitation code: {{secret}} You can download Copay for your phone or desktop at https://copay.io":"Join my Copay wallet. Here is the invitation code: {{secret}} You can download Copay for your phone or desktop at https://copay.io","Join shared wallet":"Associando carteira compartilhada","Joining Wallet...":"Associando-se a Carteira…","Key already associated with an existing wallet":"Key already associated with an existing wallet","Language":"Idioma","Last Wallet Addresses":"Last Wallet Addresses","Learn more about Copay backups":"Learn more about Copay backups","Learn more about Wallet Migration":"Saiba mais sobre Migração de Carteira","Loading...":"Loading...","locked by pending payments":"bloqueado por pagamentos pendentes","Locktime in effect. Please wait to create a new spend proposal":"Locktime in effect. Please wait to create a new spend proposal","Locktime in effect. Please wait to remove this spend proposal":"Locktime in effect. Please wait to remove this spend proposal","Make a payment to":"Fazer um pagamento para","me":"me","Me":"Eu","Memo":"Nota","Merchant message":"Mensagem do Comerciante","Message":"Mensagem","More":"Mais","Moved":"Movido","Multisignature wallet":"Carteira multi-assinada","My Bitcoin address":"Meu endereço Bitcoin","Network":"Rede","Network connection error":"Network connection error","New Payment Proposal":"Nova Proposta de Pagamento","No Private key":"No Private key","No transactions yet":"Nenhuma transação ainda","Normal":"Normal","Not authorized":"Not authorized","Not valid":"Inválido","Note":"Nota","Official English Disclaimer":"Official English Disclaimer","Once you have copied your wallet seed down, it is recommended to delete it from this device.":"Once you have copied your wallet seed down, it is recommended to delete it from this device.","Only Main (not change) addresses are shown. The addresses on this list were not verified locally at this time.":"Only Main (not change) addresses are shown. The addresses on this list were not verified locally at this time.","optional":"opcional","Paper Wallet Private Key":"Paper Wallet Private Key","Participants":"Participantes","Passphrase":"Passphrase","Passphrase (if you have one)":"Passphrase (if you have one)","Password":"Senha","Password needed":"Senha necessária","Passwords do not match":"As senhas não coincidem","Paste invitation here":"Cole o convite aqui","Paste the backup plain text code":"Cole o texto puro do backup aqui","Paste your paper wallet private key here":"Paste your paper wallet private key here","Pay To":"Pagar Para","Payment Accepted":"﻿Pagamento Aceito","Payment accepted, but not yet broadcasted":"Payment accepted, but not yet broadcasted","Payment accepted. It will be broadcasted by Glidera. In case there is a problem, it can be deleted 6 hours after it was created.":"Payment accepted. It will be broadcasted by Glidera. In case there is a problem, it can be deleted 6 hours after it was created.","Payment details":"Detalhes do pagamento","Payment Proposal":"Proposta de Pagamento","Payment Proposal Created":"Proposta de Pagamento Criada","Payment Proposal Rejected":"Proposta de Pagamento Rejeitada","Payment Proposal Rejected by Copayer":"Proposta de Pagamento Rejeitada pelo Copayer","Payment Proposal Signed by Copayer":"Proposta de Pagamento Assinada pelo Copayer","Payment Proposals":"Propostas de Pagamento","Payment Protocol Invalid":"Payment Protocol Invalid","Payment Protocol not supported on Chrome App":"Protocolo de pagamento não suportado no Chrome App","Payment rejected":"Payment rejected","Payment Rejected":"Pagamento Rejeitado","Payment request":"Pedido de pagamento","Payment sent":"Payment sent","Payment Sent":"Pagamento Enviado","Payment to":"Pagamento para","Pending Confirmation":"Pending Confirmation","Permanently delete this wallet. THIS ACTION CANNOT BE REVERSED":"Permanently delete this wallet. THIS ACTION CANNOT BE REVERSED","Personal Wallet":"Carteira Pessoal","Please enter the required fields":"Por favor, preencha os campos obrigatórios","Please enter the seed words":"Please enter the seed words","Please enter the wallet seed":"Please enter the wallet seed","Please upgrade Copay to perform this action":"Please upgrade Copay to perform this action","Please, select your backup file":"Por favor, selecione seu arquivo de backup","Portuguese":"Português","Preferences":"Preferências","Preparing backup...":"Preparing backup...","Priority":"Priority","QR Code":"QR Code","QR-Scanner":"QR-Scanner","Receive":"﻿Receber","Received":"Recebido","Recipients":"Recipients","Reconnecting to Wallet Service...":"Reconectando ao Serviço de Carteira…","Recreate":"Recriado","Recreating Wallet...":"Recriando Carteira…","Reject":"Rejeitar","Rejecting payment":"Rejeitando pagamento","Release Information":"Liberar Informação","Repeat password":"Repetir Senha","Request a specific amount":"Request a specific amount","Request Password for Spending Funds":"Request Password for Spending Funds","Requesting Ledger Wallet to sign":"Requesting Ledger Wallet to sign","Required":"Obrigatório","Required number of signatures":"Required number of signatures","Retrying...":"Repetindo…","Russian":"Russian","Save":"Salvar","Saving preferences...":"Salvando preferências…","Scan addresses for funds":"Pesquisando endereços por fundos","Scan Finished":"Pesquisa Finalizada","Scan status finished with error":"Pesquisa de status finalizada com erro","Scan Wallet Funds":"Scan Wallet Funds","Scanning wallet funds...":"Scanning wallet funds...","Scanning Wallet funds...":"Pesquisando fundos de carteira…","See it on the blockchain":"Veja no blockchain","Seed passphrase":"Seed passphrase","Seed Passphrase":"Seed Passphrase","Select a backup file":"Selecione um arquivo de backup","Select a wallet":"Selecione uma carteira","Self-signed Certificate":"Self-signed Certificate","Send":"Enviar","Send All":"Send All","Send all by email":"Send all by email","Send by email":"Enviar por E-mail","Sending funds...":"Sending funds...","Sent":"Enviado","Server":"Servidor","Server response could not be verified":"Server response could not be verified","Session log":"Log da sessão","SET":"DEFINIR","Set up a Export Password":"Set up a Export Password","Set up a password":"Configure uma senha","Setting up email notifications could weaken your privacy, if the wallet service provider is compromised. Information available to an attacker would include your wallet addresses and its balance, but no more.":"Configurar notificações de e-mail pode enfraquecer sua privacidade se o prestador de serviços de carteira está comprometido. As informações disponíveis para um invasor podem incluir seus endereços carteira e seu saldo, nada mais.","settings":"configurações","Share address":"Compartilhar endereço","Share invitation":"Compartilhar convite","Share this invitation with your copayers":"Compartilhe este convite com seus copayers","Share this wallet address to receive payments. To protect your privacy, new addresses are generated automatically once you use them.":"Compartilhe este endereço da carteira para receber pagamentos. Para proteger sua privacidade, novos endereços são gerados automaticamente cada vez que você usá-los.","Shared Wallet":"Compartilhar Carteira","Show advanced options":"Show advanced options","Show Wallet Seed":"Show Wallet Seed","Signatures rejected by server":"Signatures rejected by server","Signing payment":"Pagamento assinado","SKIP BACKUP":"PULAR BACKUP","Spanish":"Espanhol","Specify your wallet seed":"Specify your wallet seed","Spend proposal is not accepted":"Spend proposal is not accepted","Spend proposal not found":"Spend proposal not found","Still not done":"Still not done","Success":"Sucesso","Sweep paper wallet":"Sweep paper wallet","Sweep Wallet":"Sweep Wallet","Tap to retry":"Bata para repetir","Terms of Use":"Terms of Use","Testnet":"Testnet","The authors of the software, employees and affiliates of Bitpay, copyright holders, and BitPay, Inc. cannot retrieve your private keys or passwords if you lose or forget them and cannot guarantee transaction confirmation as they do not have control over the Bitcoin network.":"The authors of the software, employees and affiliates of Bitpay, copyright holders, and BitPay, Inc. cannot retrieve your private keys or passwords if you lose or forget them and cannot guarantee transaction confirmation as they do not have control over the Bitcoin network.","The Ledger Chrome application is not installed":"The Ledger Chrome application is not installed","The payment was created but could not be completed. Please try again from home screen":"O pagamento foi criado mas não pode ser completado. Por favor, tente novamente a partir da tela inicial.","The payment was created but could not be signed. Please try again from home screen":"The payment was created but could not be signed. Please try again from home screen","The payment was removed by creator":"O pagamento foi removido pelo criador","The payment was signed but could not be broadcasted. Please try again from home screen":"The payment was signed but could not be broadcasted. Please try again from home screen","The private key for this wallet is encrypted. Exporting keep the private key encrypted in the export archive.":"The private key for this wallet is encrypted. Exporting keep the private key encrypted in the export archive.","The seed could require a passphrase to be imported":"The seed could require a passphrase to be imported","The software does not constitute an account where BitPay or other third parties serve as financial intermediaries or custodians of your bitcoin.":"The software does not constitute an account where BitPay or other third parties serve as financial intermediaries or custodians of your bitcoin.","The software you are about to use functions as a free, open source, and multi-signature digital wallet.":"The software you are about to use functions as a free, open source, and multi-signature digital wallet.","The spend proposal is not pending":"The spend proposal is not pending","The wallet \"{{walletName}}\" was deleted":"A carteira “{{walletName}}” foi removida","There are no wallets to make this payment":"There are no wallets to make this payment","There is an error in the form":"Existe um erro no formulário","This transaction has become invalid; possibly due to a double spend attempt.":"This transaction has become invalid; possibly due to a double spend attempt.","This wallet is not registered at the given Bitcore Wallet Service (BWS). You can recreate it from the local information.":"Esta carteira não está registrada no dado serviço Wallet Service Bitcore (BWS) informado. Você pode recriá-la a partir da informação local.","Time":"﻿Hora","To":"Para","To restore this {{index.m}}-{{index.n}} <b>shared</b> wallet you will need":"To restore this {{index.m}}-{{index.n}} <b>shared</b> wallet you will need","To the fullest extent permitted by law, this software is provided “as is” and no representations or warranties can be made of any kind, express or implied, including but not limited to the warranties of merchantability, fitness or a particular purpose and noninfringement.":"To the fullest extent permitted by law, this software is provided “as is” and no representations or warranties can be made of any kind, express or implied, including but not limited to the warranties of merchantability, fitness or a particular purpose and noninfringement.","too long!":"muito tempo!","Total":"Total","Total Locked Balance":"Saldo Total Bloqueado","Total number of copayers":"Total number of copayers","Transaction":"Transação","Transaction already broadcasted":"Transaction already broadcasted","Translation Credits":"Translation Credits","Translators":"Translators","Type the Seed Word (usually 12 words)":"Type the Seed Word (usually 12 words)","Unable to send transaction proposal":"Impossível enviar a proposta de transação","Unconfirmed":"Não confirmado","Unit":"﻿Unidade","Unsent transactions":"Transações não enviadas","Updating Wallet...":"Atualizando Carteira…","Use Ledger hardware wallet":"Use Ledger hardware wallet","Use TREZOR hardware wallet":"Use TREZOR hardware wallet","Use Unconfirmed Funds":"Use Unconfirmed Funds","Username":"Username","Version":"﻿Versão","View":"View","Waiting for copayers":"Aguardando copayers","Waiting...":"Aguardando…","Wallet":"Wallet","Wallet Alias":"Apelido da Carteira","Wallet already exists":"A carteira já existe","Wallet Already Imported:":"Carteira já importada:","Wallet already in Copay:":"Wallet already in Copay:","Wallet Configuration (m-n)":"Wallet Configuration (m-n)","Wallet Export":"Wallet Export","Wallet Id":"Wallet Id","Wallet incomplete and broken":"Carteira incompleta e quebrada","Wallet Information":"Wallet Information","Wallet Invitation":"Convite para Carteira","Wallet Invitation is not valid!":"O convite para carteira não é válido!","Wallet is full":"Wallet is full","Wallet is not complete":"Wallet is not complete","Wallet name":"Nome da carteira","Wallet Name (at creation)":"Wallet Name (at creation)","Wallet Network":"Wallet Network","Wallet not found":"Wallet not found","Wallet not registed at the Wallet Service. Recreate it from \"Create Wallet\" using \"Advanced Options\" to set your seed":"Wallet not registed at the Wallet Service. Recreate it from \"Create Wallet\" using \"Advanced Options\" to set your seed","Wallet Seed":"Wallet Seed","Wallet Seed could require a passphrase to be imported":"Wallet Seed could require a passphrase to be imported","Wallet seed is invalid":"Wallet seed is invalid","Wallet seed not available. You can still export it from Advanced &gt; Export.":"Wallet seed not available. You can still export it from Advanced &gt; Export.","Wallet service not found":"Wallet service not found","WARNING: Backup needed":"Atenção: Backup necessário","WARNING: Not including the private key allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.":"WARNING: Not including the private key allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.","WARNING: Passphrase cannot be recovered. <b>Be sure to write it down</b>. The wallet can not be restored without the passphrase.":"WARNING: Passphrase cannot be recovered. <b>Be sure to write it down</b>. The wallet can not be restored without the passphrase.","WARNING: The private key of this wallet is not available. The export allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.":"WARNING: The private key of this wallet is not available. The export allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.","WARNING: This seed was created with a passphrase. To recover this wallet both the mnemonic and passphrase are needed.":"WARNING: This seed was created with a passphrase. To recover this wallet both the mnemonic and passphrase are needed.","Warning: this transaction has unconfirmed inputs":"Warning: this transaction has unconfirmed inputs","WARNING: UNTRUSTED CERTIFICATE":"WARNING: UNTRUSTED CERTIFICATE","WARNING: Wallet not registered":"Atenção: Carteira não registrada","Warning!":"Atenção!","We reserve the right to modify this disclaimer from time to time.":"We reserve the right to modify this disclaimer from time to time.","WELCOME TO COPAY":"BEM-VINDO A COPAY","While the software has undergone beta testing and continues to be improved by feedback from the open-source user and developer community, we cannot guarantee that there will be no bugs in the software.":"While the software has undergone beta testing and continues to be improved by feedback from the open-source user and developer community, we cannot guarantee that there will be no bugs in the software.","Write it down and keep them somewhere safe.":"Write it down and keep them somewhere safe.","Wrong number of seed words:":"Wrong number of seed words:","Wrong password":"Senha errada","Yes":"Sim","You acknowledge that your use of this software is at your own discretion and in compliance with all applicable laws.":"You acknowledge that your use of this software is at your own discretion and in compliance with all applicable laws.","You are responsible for safekeeping your passwords, private key pairs, PINs and any other codes you use to access the software.":"You are responsible for safekeeping your passwords, private key pairs, PINs and any other codes you use to access the software.","You assume any and all risks associated with the use of the software.":"You assume any and all risks associated with the use of the software.","You can safely install your wallet on another device and use it from multiple devices at the same time.":"You can safely install your wallet on another device and use it from multiple devices at the same time.","You do not have a wallet":"Você não tem uma carteira","You need the wallet seed to restore this personal wallet.":"You need the wallet seed to restore this personal wallet.","Your backup password":"Sua senha de backup","Your export password":"Your export password","Your nickname":"Seu apelido","Your password":"Sua senha","Your profile password":"Sua senha de perfil","Your wallet has been imported correctly":"Sua carteira foi importada corretamente","Your wallet key will be encrypted. Password cannot be recovered. Be sure to write it down":"Your wallet key will be encrypted. Password cannot be recovered. Be sure to write it down","Your Wallet Seed":"Your Wallet Seed","Your wallet seed and access to the server that coordinated the initial wallet creation. You still need {{index.m}} keys to spend.":"Your wallet seed and access to the server that coordinated the initial wallet creation. You still need {{index.m}} keys to spend."});
    gettextCatalog.setStrings('ru', {"(possible double spend)":"(возможна двойная трата)","(Trusted)":"(Доверенный)","[Balance Hidden]":"[Баланс скрыт]","{{fee}} will be deducted for bitcoin networking fees":"{{fee}} будет использовано для оплаты комиссии","{{feeRateStr}} of the transaction":"{{feeRateStr}} транзакции","{{index.m}}-of-{{index.n}}":"{{index.m}}-из-{{index.n}}","{{index.result.length - index.txHistorySearchResults.length}} more":"{{index.result.length - index.txHistorySearchResults.length}} больше","{{index.txProgress}} transactions downloaded":"{{index.txProgress}} транзакций скачено","{{item.m}}-of-{{item.n}}":"{{item.m}}-из-{{item.n}}","* A payment proposal can be deleted if 1) you are the creator, and no other copayer has signed, or 2) 24 hours have passed since the proposal was created.":"* Предложенный платёж может быть удалён если 1) вы создали этот платёж и никто его еще не подписал, или если 2) прошло более 24 часов с момента его создания.","<b>IF YOU LOSE ACCESS TO YOUR COPAY WALLET OR YOUR ENCRYPTED PRIVATE KEYS AND YOU HAVE NOT SEPARATELY STORED A BACKUP OF YOUR WALLET AND CORRESPONDING PASSWORD, YOU ACKNOWLEDGE AND AGREE THAT ANY BITCOIN YOU HAVE ASSOCIATED WITH THAT COPAY WALLET WILL BECOME INACCESSIBLE.</b>":"<b>ЕСЛИ ВЫ ПОТЕРЯЕТЕ ДОСТУП К ВАШЕМУ КОШЕЛЬКУ COPAY ИЛИ ВАШИМ ЗАШИФРОВАННЫМ ЗАКРЫТЫМ КЛЮЧАМ, ПРИ ТОМ ЧТО У ВАС НЕТ ОТДЕЛЬНОЙ РЕЗЕРВНОЙ КОПИИ ВАШЕГО КОШЕЛЬКА И СООТВЕТСТВУЮЩЕМУ ЕМУ ПАРОЛЯ, ВЫ ПРИЗНАЁТЕ И СОГЛАШАЕТЕСЬ С ТЕМ ЧТО ВСЕ БИТКОЙНЫ АССОЦИИРОВАННЫЕ С ЭТИМ КОШЕЛЬКОМ СТАНУТ НЕДОСТУПНЫ.</b>","<b>OR</b> 1 wallet export file and the remaining quorum of wallet recovery phrases (e.g. in a 3-5 wallet: 1 wallet export file + 2 wallet recovery phrases of any of the other copayers).":"<b>ИЛИ</b> один экспортный файл и кворум остальных ключевых словосочетаний (например в кошельке 3-5: экспортный файл и два ключевых словосочетания двух любых совладельцев).","<b>OR</b> the wallet recovery phrase of <b>all</b> copayers in the wallet":"<b>ИЛИ</b> ключевое словосочетание <b>всех</b> совладельцев кошелька","<b>OR</b> the wallet recovery phrases of <b>all</b> copayers in the wallet":"<b>ИЛИ</b> ключевые словосочетания <b>всех</b> совладельцев кошелька","A multisignature bitcoin wallet":"Биткойн-кошелёк с мультиподписью","About Copay":"О Copay","Accept":"Принять","Account":"Аккаунт","Account Number":"Номер аккаунта","Activity":"Активность","Add a new entry":"Добавить новую запись","Add a Password":"Защитить паролем","Add an optional password to secure the recovery phrase":"Добавьте необязательный пароль для защиты ключевого словосочетания","Add comment":"Добавить комментарий","Add wallet":"Добавить кошелёк","Address":"Адрес","Address Type":"Тип адреса","Advanced":"Дополнительные возможности","Alias":"Псевдоним","Alias for <i>{{index.walletName}}</i>":"Псевдоним для <i>{{index.walletName}}</i>","All contributions to Copay's translation are welcome. Sign up at crowdin.com and join the Copay project at":"Любой вклад в перевод Copay приветствуются. Регистрируйтесь на crowdin.com и присоединяйтесь к проекту Copay на","All transaction requests are irreversible.":"Все транзакции являются необратимыми.","Alternative Currency":"Альтернативная валюта","Amount":"Сумма","Amount below minimum allowed":"Сумма ниже допустимого минимума","Amount in":"Сумма в","Are you sure you want to delete the recovery phrase?":"Вы уверены, что хотите удалить ключевое словосочетание?","Are you sure you want to delete this wallet?":"Вы точно хотите удалить этот кошелек?","Auditable":"Проверяемый","Available Balance":"Доступный баланс","Average confirmation time: {{fee.nbBlocks * 10}} minutes":"Среднее время подтверждения: {{fee.nbBlocks * 10}} минут","Back":"Назад","Backup":"Резервное копирование","Backup failed":"Сбой резервного копирования","Backup Needed":"Требуется резервное копирование","Backup now":"Создать резервную копию","Bad wallet invitation":"Недействительное приглашение","Balance By Address":"Баланс на адресах","Before receiving funds, you must backup your wallet. If this device is lost, it is impossible to access your funds without a backup.":"Прежде чем получать переводы вы должны создать резервную копию кошелька. Если это устройство будет утеряно, вы не сможете получить доступ к вашим средствам без резервной копии.","BETA: Android Key Derivation Test:":"БЕТА: Тест деривации ключей Android:","BIP32 path for address derivation":"Укажите BIP32 для генерации адресов","Bitcoin address":"Биткойн-адрес","Bitcoin Network Fee Policy":"Политика комиссии в сети Биткойн","Bitcoin transactions may include a fee collected by miners on the network. The higher the fee, the greater the incentive a miner has to include that transaction in a block. Current fees are determined based on network load and the selected policy.":"Биткойн-транзакции могут включать комиссию, собираемую майнерами в сети. Чем выше комиссия, тем больше стимул для майнера включить транзакцию в блок. Текущая комиссия определяется на основе сетевой нагрузки и выбранной политики.","Bitcoin URI is NOT valid!":"Биткойн URI недействителен!","Broadcast Payment":"Отправить платёж","Broadcasting transaction":"Отправка транзакции","Browser unsupported":"Браузер не поддерживается","Calculating fee":"Вычисление комиссии","Cancel":"Отмена","Cancel and delete the wallet":"Отменить и удалить кошелёк","Cannot create transaction. Insufficient funds":"Не удается создать транзакцию. Недостаточно средств","Cannot join the same wallet more that once":"Нельзя присоединиться к одному и тому же кошельку более одного раза","Cannot sign: The payment request has expired":"Не удалось подписать: запрос платежа истёк","Certified by":"Сертифицирован","Changing wallet alias only affects the local wallet name.":"Изменение псевдонима кошелька сохраняется только локально.","Chinese":"Китайский","Choose a backup file from your computer":"Выберите файл резервной копии","Clear cache":"Очистить кэш","Close":"Закрыть","Color":"Цвет","Comment":"Комментарий","Commit hash":"Хэш версии","Confirm":"Подтвердить","Confirm your wallet recovery phrase":"Подтвердите ваше ключевое словосочетание","Confirmations":"Подтверждения","Congratulations!":"Поздравляем!","Connecting to Coinbase...":"Подключение к Coinbase...","Connecting to Glidera...":"Подключение к Glidera...","Connection reset by peer":"Соединение сброшено другой стороной","Continue":"Продолжить","Copayer already in this wallet":"Совладелец кошелька уже присоединился","Copayer already voted on this spend proposal":"Совладелец кошелька уже проголосовал по этому предложению платежа","Copayer data mismatch":"Несоответствие данных совладельца кошелька","Copayers":"Совладельцы кошелька","Copied to clipboard":"Скопировано в буфер обмена","Copy this text as it is to a safe place (notepad or email)":"Скопируйте этот текст как есть (в блокнот или письмо)","Copy to clipboard":"Скопировать в буфер обмена","Could not access the wallet at the server. Please check:":"Не удалось получить доступ к кошельку на сервере. Пожалуйста, проверьте:","Could not access wallet":"Не удалось получить доступ к кошельку","Could not access Wallet Service: Not found":"Не удалось получить доступ к серверу Bitcore: не найден","Could not broadcast payment":"Не удалось отправить платёж","Could not build transaction":"Не удалось создать транзакцию","Could not create address":"Не удалось создать адрес","Could not create payment proposal":"Не удалось создать предложение платежа","Could not create using the specified extended private key":"Не удалось создать используя указанный расширенный закрытый ключ","Could not create using the specified extended public key":"Не удалось создать используя указанный расширенный открытый ключ","Could not create: Invalid wallet recovery phrase":"Не удалось создать: недействительное ключевое словосочетание","Could not decrypt file, check your password":"Не удалось расшифровать файл, проверьте пароль","Could not delete payment proposal":"Не удалось удалить предложение платежа","Could not fetch payment information":"Не удалось получить информацию о платеже","Could not get fee value":"Не удалось получить информацию о комиссии","Could not import":"Не удалось импортировать","Could not import. Check input file and spending password":"Не удалось импортировать. Проверьте импортируемый файл и платёжный пароль","Could not join wallet":"Не удалось присоединиться к кошельку","Could not recognize a valid Bitcoin QR Code":"Не удалось распознать адрес в QR-коде","Could not reject payment":"Не удалось отклонить платёж","Could not send payment":"Не удалось отправить платёж","Could not update Wallet":"Не удалось обновить кошелёк","Create":"Создать","Create {{requiredCopayers}}-of-{{totalCopayers}} wallet":"Создать кошелёк {{requiredCopayers}}-из-{{totalCopayers}}","Create new wallet":"Создать новый кошелёк","Create, join or import":"Создать, присоединиться или импортировать","Created by":"Создан","Creating transaction":"Создание транзакции","Creating Wallet...":"Создание кошелька...","Current fee rate for this policy: {{fee.feePerKBUnit}}/kiB":"Текущая комиссия для этой политики: {{fee.feePerKBUnit}}/kiB","Czech":"Чешский","Date":"Дата","Decrypting a paper wallet could take around 5 minutes on this device. please be patient and keep the app open.":"Расшифровка бумажного кошелька может занять до пяти минут на этом устройстве. Пожалуйста, будьте терпеливы и держите приложение открытым.","Delete it and create a new one":"Удалите и создайте заново","Delete Payment Proposal":"Удалить предложенный платёж","Delete recovery phrase":"Удалить ключевое словосочетание","Delete Recovery Phrase":"Удалить ключевое словосочетание","Delete wallet":"Удалить кошелёк","Delete Wallet":"Удалить кошелёк","Deleting Wallet...":"Удаление кошелька...","Derivation Path":"Путь деривации","Derivation Strategy":"Стратегия деривации","Description":"Описание","Details":"Подробности","Disabled":"Отключены","Do not include private key":"Не включать закрытый ключ","Don't see your language on Crowdin? Contact the Owner on Crowdin! We'd love to support your language.":"Не видите свой язык на Crowdin? Свяжитесь с владельцем по Crowdin! Мы с удовольствием поддержим ваш язык.","Done":"Завершено","Download":"Скачать","Economy":"Экономичная","Edit":"Редактировать","Edit comment":"Отредактировать комментарий","Edited by":"Отредактировано","Email for wallet notifications":"Укажите email для получения уведомлений","Email Notifications":"Email-уведомления","Empty addresses limit reached. New addresses cannot be generated.":"Достигнут предел пустых адресов. Новые адреса больше не могут быть сгенерированы.","Enable Coinbase Service":"Включить поддержку Coinbase","Enable Glidera Service":"Включить поддержку Glidera","Enable push notifications":"Включить Push-уведомления","Encrypted export file saved":"Зашифрованная резервная копия сохранена","Enter the recovery phrase (BIP39)":"Введите ключевое словосочетание (BIP39)","Enter your password":"Введите пароль","Enter your spending password":"Введите платёжный пароль","Error at Wallet Service":"Ошибка на сервере Bitcore","Error creating wallet":"Ошибка создания кошелька","Expired":"Истекла","Expires":"Срок действия","Export options":"Параметры экспорта","Export to file":"Экспорт в файл","Export Wallet":"Экспорт кошелька","Exporting via QR not supported for this wallet":"Экспорт QR-кодом не поддерживается для этого кошелька","Extended Public Keys":"Расширенные открытые ключи","Extracting Wallet Information...":"Извлечение информации о кошельке...","Failed to export":"Не удалось экспортировать","Failed to verify backup. Please check your information":"Не удалось проверить резервную копию. Пожалуйста, сверьте введённую мнемонику","Family vacation funds":"Отпускной бюджет","Fee":"Комиссия","Fetching Payment Information":"Извлечение информации о платеже","File/Text":"Файл/текст","Finger Scan Failed":"Не удалось сканировать отпечаток пальца","Finish":"Готово","For audit purposes":"Для целей ревизии","French":"французский","From the destination device, go to Add wallet &gt; Import wallet and scan this QR code":"На целевом устройстве выберите \"Добавить кошелёк\" &gt; \"Импорт кошелька\" и отсканируйте этот QR-код","Funds are locked by pending spend proposals":"Средства заблокированы ожидающим предложением платежа","Funds found":"Средства найдены","Funds received":"Получен перевод","Funds will be transferred to":"Средства будут переведены на","Generate new address":"Создать новый адрес","Generate QR Code":"Сгенерировать QR-код","Generating .csv file...":"Создание .сsv-файла...","German":"немецкий","Getting address for wallet {{selectedWalletName}} ...":"Получение адреса для кошелька {{selectedWalletName}}...","Global preferences":"Глобальные параметры","Hardware wallet":"Аппаратный кошелёк","Hardware Wallet":"Аппаратный кошелёк","Hide advanced options":"Скрыть дополнительные настройки","I affirm that I have read, understood, and agree with these terms.":"Я подтверждаю, что я прочитал(а), понял(а) и согласен(а) с настоящими условиями.","I AGREE. GET STARTED":"Принять и продолжить","Import":"Импорт","Import backup":"Импорт резервной копии","Import wallet":"Импорт кошелька","Importing Wallet...":"Импортирование кошелька...","In no event shall the authors of the software, employees and affiliates of Bitpay, copyright holders, or BitPay, Inc. be held liable for any claim, damages or other liability, whether in an action of contract, tort, or otherwise, arising from, out of or in connection with the software.":"Ни при каких обстоятельствах авторы программного обеспечения, сотрудники и филиалов Bitpay, правообладатели, или BitPay Inc. не могут быть ответственным за любые претензии, убытки или нести иную ответственность, будь то действие контракта, деликта или иным образом вытекающие из или в связи с программным обеспечением.","In order to verify your wallet backup, please type your password:":"Для проверки резервной копии кошелька необходимо указать пароль:","Incorrect address network":"Неверный адрес","Incorrect code format":"Некорректный формат QR-кода","Insufficient funds":"Недостаточно средств","Insufficient funds for fee":"Недостаточно средств на комиссию","Invalid":"Недействительно","Invalid account number":"Недопустимый номер аккаунта","Invalid address":"Неверный адрес","Invalid derivation path":"Недействительный путь деривации","Invitation to share a Copay Wallet":"Приглашение присоединиться к кошельку Copay","Italian":"Итальянский","Japanese":"японский","John":"John","Join":"Присоединиться","Join my Copay wallet. Here is the invitation code: {{secret}} You can download Copay for your phone or desktop at https://copay.io":"Присоединяйся к моему кошельку Copay. Код приглашения: {{secret}} Ты можешь загрузить Copay для своего телефона или настольного компьютера на сайте https://copay.io","Join shared wallet":"Присоединиться к общему кошельку","Joining Wallet...":"Присоединение к кошельку...","Key already associated with an existing wallet":"Ключ уже связан с существующим кошельком","Label":"Метка","Language":"Язык","Last Wallet Addresses":"Последние адреса","Learn more about Copay backups":"Узнайте больше о резервном копировании","Loading...":"Загрузка...","locked by pending payments":"заблокировано неподтверждёнными платежами","Locktime in effect. Please wait to create a new spend proposal":"Действует блокировка. Пожалуйста, подождите, чтобы создать новое предложение платежа","Locktime in effect. Please wait to remove this spend proposal":"Действует блокировка. Пожалуйста, подождите, чтобы удалить это предложение платежа","Make a payment to":"Сделать платёж","Matches:":"Совпадения:","me":"мне","Me":"Я","Memo":"Памятка","Merchant message":"Сообщение от продавца","Message":"Сообщение","Missing parameter":"Недостающий параметр","Missing private keys to sign":"Отсутствуют закрытые ключи для подписи","Moved":"Перемещено","Multiple recipients":"Несколько получателей","My Bitcoin address":"Мой биткойн-адрес","My contacts":"Мои контакты","My wallets":"Мои кошельки","Need to do backup":"Необходимо создать резервную копию","Network":"Сеть","Network connection error":"Ошибка подключения","New Payment Proposal":"Новое предложение платежа","New Random Recovery Phrase":"Сгенерированное случайным образом ключевое словосочетание","No hardware wallets supported on this device":"Аппаратные кошельки не поддерживаются на этом устройстве","No transactions yet":"Транзакций пока не было","Normal":"Обычная","Not authorized":"Не авторизован","Not completed":"Не завершено","Not enough funds for fee":"Недостаточно средств для уплаты комиссии","Not valid":"Недействительно","Note":"Примечание","Note: a total of {{amountAboveMaxSizeStr}} were excluded. The maximum size allowed for a transaction was exceeded":"Примечание: в общей сложности {{amountAboveMaxSizeStr}} были исключены. Превышен максимальный размер транзакции","Note: a total of {{amountBelowFeeStr}} were excluded. These funds come from UTXOs smaller than the network fee provided.":"Примечание: в общей сложности {{amountBelowFeeStr}} были исключены. Эти средства входят в UTXOs меньших, чем комиссия сети.","NOTE: To import a wallet from a 3rd party software, please go to Add Wallet &gt; Create Wallet, and specify the Recovery Phrase there.":"Примечание: для импортирования кошелька из другой программы откройте \"Добавить кошелек\" &gt; \"Создать новый кошелек\", и укажите там ключевое словосочетание.","Official English Disclaimer":"Официальный оригинал","OKAY":"ХОРОШО","Once you have copied your wallet recovery phrase down, it is recommended to delete it from this device.":"Рекомендуется удалить ключевое словосочетание с устройства, как только вы скопировали его.","Only Main (not change) addresses are shown. The addresses on this list were not verified locally at this time.":"Отображаются только основные адреса (не со сдачей). Адреса в этом списке на данный момент ещё не были проверены локально.","Open Settings app":"Открыть Параметры","optional":"необязательно","Paper Wallet Private Key":"Закрытый ключ бумажного кошелька","Participants":"Участники","Passphrase":"Пароль импортируемого кошелька","Password":"Пароль","Password required. Make sure to enter your password in advanced options":"Необходим пароль. Убедитесь, что вы ввели ваш пароль в дополнительных настройках","Paste invitation here":"Вставьте приглашение сюда","Paste the backup plain text code":"Вставьте код резервной копии обычным текстом","Paste your paper wallet private key here":"Вставьте закрытый ключ бумажного кошелька сюда","Pasted from clipboard":"Вставлено из буфера обмена","Pay To":"Отправить платёж","Payment Accepted":"Платёж принят","Payment accepted, but not yet broadcasted":"Платёж принят, но пока не отправлен","Payment accepted. It will be broadcasted by Glidera. In case there is a problem, it can be deleted 6 hours after it was created.":"Платёж принят и будет отправлен Glidera. В случае проблем он может быть удалён спустя шесть часов после создания.","Payment details":"Детали платежа","Payment expires":"Платёж истекает","Payment Proposal":"Предложение платежа","Payment Proposal Created":"Создано предложение платежа","Payment Proposal Rejected":"Предложение платежа отклонено","Payment Proposal Rejected by Copayer":"Предложение платежа отклонено совладельцем кошелька","Payment Proposal Signed by Copayer":"Предложение платежа подписано совладельцем кошелька","Payment Proposals":"Предложение платежа","Payment Protocol Invalid":"Недействительный протокол оплаты","Payment Protocol not supported on Chrome App":"Платёжный протокол не поддерживается в приложении Chrome","Payment Rejected":"Платёж отклонён","Payment request":"Запрос платежа","Payment Sent":"Платёж отправлен","Payment to":"Платёж","Pending Confirmation":"Ожидание подтверждения","Permanently delete this wallet. THIS ACTION CANNOT BE REVERSED":"Окончательно удалить этот кошелёк. ЭТО ДЕЙСТВИЕ НЕ МОЖЕТ БЫТЬ ОТМЕНЕНО","Personal Wallet":"Личный кошелёк","Please enter the recovery phrase":"Введите ключевое словосочетание","Please enter the required fields":"Пожалуйста, заполните необходимые поля","Please enter the wallet recovery phrase":"Введите ключевое словосочетание кошелька","Please tap the words in order to confirm your backup phrase is correctly written.":"Коснитесь слов чтобы подтвердить, что ваша резервная копия корректно записана.","Please upgrade Copay to perform this action":"Пожалуйста, обновите Copay для выполнения этого действия","Please wait to be redirected...":"Дождитесь перенаправления...","Please, select your backup file":"Пожалуйста, выберите ваш файл резервной копии","Polish":"Польский","Preferences":"Параметры","Preparing backup...":"Подготовка резервной копии...","preparing...":"Подготавливается...","Press again to exit":"Нажмите еще раз для выхода","Priority":"Приоритетная","Private key is encrypted, cannot sign":"Закрытый ключ зашифрован, не удалось подписать","Push notifications for Copay are currently disabled. Enable them in the Settings app.":"Push-уведомления для Copay в настоящее время отключены. Включите их в Параметрах.","QR Code":"QR-код","QR-Scanner":"QR-сканер","Receive":"Получить","Received":"Получен","Recipients":"Получатели","Recovery Phrase":"Ключевое словосочетание","Recovery phrase deleted":"Ключевое словосочетание удалено","Recreate":"Создать заново","Recreating Wallet...":"Воссоздаю кошелёк...","Reject":"Отклонить","Release Information":"Информация о выпуске","Remove":"Удалить","Repeat password":"Повторите пароль","Repeat the password":"Повторите пароль","Repeat the spending password":"Повторно введите платёжный пароль","Request a specific amount":"Запросить определенную сумму","Request Spending Password":"Запрашивать платёжный пароль","Required":"Необходимо","Required number of signatures":"Требуемое число подписей","Retrieving inputs information":"Получение информации о входах","Russian":"русский","Save":"Сохранить","Scan addresses for funds":"Просканировать адреса для обнаружения средств","Scan Fingerprint":"Сканирование отпечатка пальца","Scan Finished":"Сканирование завершено","Scan status finished with error":"Сканирование завершено с ошибкой","Scan Wallet Funds":"Сканирование кошелька","Scan your fingerprint please":"Пожалуйста отсканируйте ваш отпечаток пальца","Scanning Wallet funds...":"Сканирование адресов кошелька...","Search transactions":"Поиск транзакций","Search Transactions":"Поиск транзакций","Security preferences":"Настройки безопасности","See it on the blockchain":"Посмотреть в блокчейне","Select a backup file":"Выберите файл резервной копии","Select a wallet":"Выберите кошелёк","Self-signed Certificate":"Самозаверенные сертификат","Send":"Отправить","Send addresses by email":"Отправить адреса по email","Send bitcoin":"Отправить","Send by email":"Отправить на email","Send Max":"Отправить максимум","Sending":"Отправка","Sending transaction":"Отправка транзакции","Sent":"Отправлено","Server response could not be verified":"Ответ сервера не может быть проверен","Session log":"Журнал сеанса","SET":"УСТАНОВИТЬ","Set default url":"Установить адресом по-умолчанию","Set up a password":"Задайте пароль","Set up a spending password":"Установить платёжный пароль","Setting up email notifications could weaken your privacy, if the wallet service provider is compromised. Information available to an attacker would include your wallet addresses and its balance, but no more.":"Включение email-уведомлений может ослабить вашу конфиденциальность, если владелец сервера Bitcore будет скомпрометирован. Информация доступная злоумышленнику будет включать адреса вашего кошелька и его баланс, но ничего больше.","Settings":"Параметры","Share address":"Отправить адрес","Share invitation":"Отправить приглашение","Share this invitation with your copayers":"Отправьте приглашение совладельцам кошелька","Share this wallet address to receive payments":"Используйте этот адрес кошелька для получения платежей","Share this wallet address to receive payments. To protect your privacy, new addresses are generated automatically once you use them.":"Используйте этот адрес для получения платежей. Для защиты вашей конфиденциальности, новые адреса создаются как только вы использовали старые.","Shared Wallet":"Общий кошелёк","Show advanced options":"Показать дополнительные настройки","Signatures rejected by server":"Подписи отклонены сервером","Signing transaction":"Подписание транзакции","Single Address Wallet":"Кошелек с одним адресом","Spanish":"испанский","Specify Recovery Phrase...":"Указать ключевое словосочетание...","Spend proposal is not accepted":"Предложение платежа не принято","Spend proposal not found":"Предложение платежа не найдено","Spending Password needed":"Необходим платёжный пароль","Spending Passwords do not match":"Платёжные пароли не совпадают","Success":"Успешно","Super Economy":"Очень экономичная","Sweep paper wallet":"Пополнить с бумажного кошелька","Sweep Wallet":"Считать кошелёк","Sweeping Wallet...":"Считывание кошелька...","Tap and hold to show":"Коснитесь и удерживайте, чтобы показать","Tap to retry":"Повторить","Terms of Use":"Условия использования","The authors of the software, employees and affiliates of Bitpay, copyright holders, and BitPay, Inc. cannot retrieve your private keys or passwords if you lose or forget them and cannot guarantee transaction confirmation as they do not have control over the Bitcoin network.":"Авторы данного программного обеспечения, сотрудники и помощники Bitpay, владельцы авторских прав и BitPay Inc. не могут восстановить закрытые ключи или пароли если вы потеряете или забудете их, и не могут гарантировать подтверждение транзакции, так как они не имеют контроля над сетью Биткойн.","The derivation path":"Путь деривации","The Ledger Chrome application is not installed":"Приложение Ledger для Chrome не установлено","The password of the recovery phrase (if set)":"Пароль ключевого словосочетания (если установлен)","The payment was created but could not be completed. Please try again from home screen":"Платёж был создан, но не может быть завершен. Пожалуйста, попробуйте снова с главной страницы","The payment was removed by creator":"Платёж был удалён его создателем","The recovery phrase could require a password to be imported":"Для импортирования ключевого словосочетания может потребовать пароль","The request could not be understood by the server":"Запрос не распознан сервером","The software does not constitute an account where BitPay or other third parties serve as financial intermediaries or custodians of your bitcoin.":"Программное обеспечение не представляет собой счет, обслуживаемый BitPay или иными третьим лицами в качестве финансовых посредников или хранителями ваших биткойнов.","The software you are about to use functions as a free, open source, and multi-signature digital wallet.":"Программное обеспечение, которое вы начнёте сейчас использовать, функционирует как свободное, открытое программное обеспечение, и цифровой кошелёк с мультиподписью.","The spend proposal is not pending":"Предложение платежа не в ожидании","The wallet \"{{walletName}}\" was deleted":"Кошелёк «{{walletName}}» был удален","The Wallet Recovery Phrase could require a password to be imported":"Для импортирования ключевого словосочетания кошелька может потребовать пароль","The wallet service URL":"Адрес сервера Bitcore","There are no wallets to make this payment":"Нет кошельков, чтобы осуществить этот платёж","There is a new version of Copay. Please update":"Вышла новая версия Copay. Пожалуйста, обновитесь","There is an error in the form":"Ошибка в форме","This recovery phrase was created with a password. To recover this wallet both the recovery phrase and password are needed.":"Это ключевое словосочетание было создано с паролем. Для восстановления кошелька необходимо ключевое словосочетание и его пароль.","This transaction has become invalid; possibly due to a double spend attempt.":"Эта транзакция стала недействительной; возможно из-за попытки двойной траты.","This wallet is not registered at the given Bitcore Wallet Service (BWS). You can recreate it from the local information.":"Это кошелёк не зарегистрирован на данном сервере Bitcore. Вы можете воссоздать его из локальной информации.","Time":"Время","To":"Кому","To restore this {{index.m}}-{{index.n}} <b>shared</b> wallet you will need":"Для восстановления этого {{index.m}}-{{index.n}} <b>общего</b> кошелька вам понадобится","To the fullest extent permitted by law, this software is provided “as is” and no representations or warranties can be made of any kind, express or implied, including but not limited to the warranties of merchantability, fitness or a particular purpose and noninfringement.":"В максимальной степени, разрешенной законом, данное программное обеспечение предоставляется “как есть” и без каких-либо явных, или подразумеваемых, заверений или гарантий, включая, но не ограничиваясь, товарную гарантию, пригодность для конкретной цели и ненарушения прав на интеллектуальную собственность.","too long!":"слишком долго!","Total Locked Balance":"Всего заблокировано средств","Total number of copayers":"Количество совладельцев","Touch ID Failed":"Ошибка Touch ID","Transaction":"Транзакция","Transaction already broadcasted":"Транзакция уже отправлена","Transaction History":"История транзакций","Translation Credits":"Благодарность за перевод","Translators":"Переводчики","Try again":"Попрoбуйте снова","Type the Recovery Phrase (usually 12 words)":"Введите ключевое словосочетание (обычно двенадцать слов)","Unconfirmed":"Неподтверждено","Unit":"Единица измерения","Unsent transactions":"Неотправленные транзакции","Updating transaction history. Please stand by.":"Обновление истории транзакций. Пожалуйста подождите.","Updating Wallet...":"Обновление кошелька...","Use Unconfirmed Funds":"Использовать неподтверждённые средства","Validating recovery phrase...":"Проверка ключевого словосочетания...","Validating wallet integrity...":"Проверка целостности кошелька...","Version":"Версия","View":"Просмотреть","Waiting for copayers":"Ожидание совладельцев кошелька","Waiting for Ledger...":"Ожидание Ledger...","Waiting for Trezor...":"Ожидание Trezor...","Waiting...":"Ожидание...","Wallet already exists":"Кошелёк уже существует","Wallet already in Copay":"Кошелёк уже в Copay","Wallet Configuration (m-n)":"Конфигурация кошелька (m-n)","Wallet Export":"Экспорт кошелька","Wallet Id":"Идентификатор кошелька","Wallet incomplete and broken":"Сбой: кошелёк не работает","Wallet Information":"Информация о кошельке","Wallet Invitation":"Приглашение присоединиться к кошельку","Wallet Invitation is not valid!":"Приглашение присоединиться к кошельку недействительно!","Wallet is full":"Все уже присоединены","Wallet is locked":"Кошелёк заблокирован","Wallet is not complete":"Не все ещё присоединились","Wallet name":"Название кошелька","Wallet Name (at creation)":"Название кошелька (при создании)","Wallet needs backup":"Необходимо создать резервную копию","Wallet Network":"Сеть кошелька","Wallet not found":"Кошелёк не найден","Wallet not registered at the wallet service. Recreate it from \"Create Wallet\" using \"Advanced Options\" to set your recovery phrase":"Кошелёк не зарегистрирован на сервере Bitcore. Пересоздайте кошелёк воспользовавшись дополнительными настройками, чтобы указать ключевое словосочетание","Wallet Preferences":"Параметры кошелька","Wallet Recovery Phrase":"Ключевое словосочетание кошелька","Wallet Recovery Phrase is invalid":"Ключевое словосочетание кошелька недействительно","Wallet recovery phrase not available. You can still export it from Advanced &gt; Export.":"Ключевое словосочетание недоступно. Вы все ещё можете экспортировать его в настройках кошелька \"Дополнительные возможности &gt; Экспорт кошелька\".","Wallet service not found":"Сервер Bitcore не найден","WARNING: Key derivation is not working on this device/wallet. Actions cannot be performed on this wallet.":"ВНИМАНИЕ: Деривация ключей не работает на этом устройстве/кошельке. Никакие действия не могут быть произведены с этим кошельком.","WARNING: Not including the private key allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.":"ВНИМАНИЕ: если экспортируемый файл не включает закрытый ключ, поэтому позволит только просматривать баланс, историю транзакций и предлагать платежи. Однако, его нельзя будет использовать для одобрения (подписания) предложенных платежей, поэтому <b>средства не будет доступны из экспортируемого файла</b>.","WARNING: The password cannot be recovered. <b>Be sure to write it down</b>. The wallet can not be restored without the password.":"ВНИМАНИЕ: Пароль нельзя восстановить. <b>Убедитесь, что вы его записали</b>. Этот кошелёк нельзя будет восстановить без пароля.","WARNING: The private key of this wallet is not available. The export allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.":"ВНИМАНИЕ: Закрытый ключ этого кошелька недоступен. Экспортируемый файл позволит только просматривать баланс, историю транзакций и предлагать платежи. Однако, его нельзя будет использовать для одобрения (подписания) предложенных платежей, поэтому <b>средства не будет доступны из экспортируемого файла</b>.","Warning: this transaction has unconfirmed inputs":"Предупреждение: эта транзакция имеет неподтвержденные входы","WARNING: UNTRUSTED CERTIFICATE":"ВНИМАНИЕ: НЕНАДЕЖНЫЙ СЕРТИФИКАТ","WARNING: Wallet not registered":"ВНИМАНИЕ: Кошелёк не зарегистрирован","Warning!":"Внимание!","We reserve the right to modify this disclaimer from time to time.":"Мы оставляем за собой право время от времени изменять данный отказ от ответственности.","WELCOME TO COPAY":"ДОБРО ПОЖАЛОВАТЬ В COPAY","While the software has undergone beta testing and continues to be improved by feedback from the open-source user and developer community, we cannot guarantee that there will be no bugs in the software.":"Пока программное обеспечение находится на этапе тестирования и продолжает улучшаться благодаря обратной связи от пользователей и сообщества разработчиков, мы не можем гарантировать, что в программном обеспечении не будет никаких ошибок.","Write your wallet recovery phrase":"Запишите ваше ключевое словосочетание","Wrong number of recovery words:":"Неподходящее количество слов в ключевом словосочетании:","Wrong spending password":"Неверный платёжный пароль","Yes":"Да","You acknowledge that your use of this software is at your own discretion and in compliance with all applicable laws.":"Вы подтверждаете, что вы используете программное обеспечение по вашему собственному усмотрению и в соответствии с применяемыми законами.","You are responsible for safekeeping your passwords, private key pairs, PINs and any other codes you use to access the software.":"Вы ответственны за хранение ваших паролей, открытых и закрытых ключей, ПИНов и других кодов, которые вы используете для доступа к программному обеспечению.","You assume any and all risks associated with the use of the software.":"Вы берете на себя все риски связанные с использованием данного программного обеспечения.","You backed up your wallet. You can now restore this wallet at any time.":"Резервная копия создана. Теперь вы можете восстановить кошелёк в любое время.","You can safely install your wallet on another device and use it from multiple devices at the same time.":"Вы можете установить ваш кошелек на другое устройство и использовать его с нескольких устройств одновременно.","You do not have any wallet":"У вас нет кошельков","You need the wallet recovery phrase to restore this personal wallet. Write it down and keep them somewhere safe.":"Для восстановления этого кошелька нужно ключевое словосочетание. Запишите его и надёжно спрячьте.","Your nickname":"Ваше имя","Your password":"Ваш пароль","Your spending password":"Ваш платёжный пароль","Your wallet has been imported correctly":"Ваш кошелёк был успешно импортирован","Your wallet key will be encrypted. The Spending Password cannot be recovered. Be sure to write it down":"Ваш кошелёк будет зашифрован. Платёжный пароль невозможно восстановить. Убедитесь, что записали его.","Your wallet recovery phrase and access to the server that coordinated the initial wallet creation. You still need {{index.m}} keys to spend.":"Ключевое словосочетание и доступ к серверу, координировавшему начальное создание кошелька. Вам всё ещё нужно {{index.m}} для совершения платежей."});
    gettextCatalog.setStrings('sq', {"(possible double spend)":"(possible double spend)","(Trusted)":"(Trusted)","{{fee}} will be deducted for bitcoin networking fees":"{{fee}} will be deducted for bitcoin networking fees","{{index.m}}-of-{{index.n}}":"{{index.m}}-of-{{index.n}}","{{item.m}}-of-{{item.n}}":"{{item.m}}-of-{{item.n}}","{{len}} wallets imported. Funds scanning in progress. Hold on to see updated balance":"{{len}} wallets imported. Funds scanning in progress. Hold on to see updated balance","* A payment proposal can be deleted if 1) you are the creator, and no other copayer has signed, or 2) 24 hours have passed since the proposal was created.":"* A payment proposal can be deleted if 1) you are the creator, and no other copayer has signed, or 2) 24 hours have passed since the proposal was created.","<b>IF YOU LOSE ACCESS TO YOUR COPAY WALLET OR YOUR ENCRYPTED PRIVATE KEYS AND YOU HAVE NOT SEPARATELY STORED A BACKUP OF YOUR WALLET AND CORRESPONDING PASSWORD, YOU ACKNOWLEDGE AND AGREE THAT ANY BITCOIN YOU HAVE ASSOCIATED WITH THAT COPAY WALLET WILL BECOME INACCESSIBLE.</b>":"<b>IF YOU LOSE ACCESS TO YOUR COPAY WALLET OR YOUR ENCRYPTED PRIVATE KEYS AND YOU HAVE NOT SEPARATELY STORED A BACKUP OF YOUR WALLET AND CORRESPONDING PASSWORD, YOU ACKNOWLEDGE AND AGREE THAT ANY BITCOIN YOU HAVE ASSOCIATED WITH THAT COPAY WALLET WILL BECOME INACCESSIBLE.</b>","<b>OR</b> 1 wallet export file and the remaining quorum of wallet seeds (e.g. in a 3-5 wallet: 1 wallet export file + 2 wallet seeds of any of the other copayers).":"<b>OR</b> 1 wallet export file and the remaining quorum of wallet seeds (e.g. in a 3-5 wallet: 1 wallet export file + 2 wallet seeds of any of the other copayers).","<b>OR</b> the wallet seed of <b>all</b> copayers in the wallet":"<b>OR</b> the wallet seed of <b>all</b> copayers in the wallet","<b>OR</b> the wallet seeds of <b>all</b> copayers in the wallet":"<b>OR</b> the wallet seeds of <b>all</b> copayers in the wallet","A multisignature bitcoin wallet":"A multisignature bitcoin wallet","About Copay":"Rreth Copay","Accept":"Prano","Add a Seed Passphrase":"Add a Seed Passphrase","Add an optional passphrase to secure the seed":"Add an optional passphrase to secure the seed","Add wallet":"Shto kuletë","Address":"Adresa","Address Type":"Address Type","Advanced":"Avancuar","Advanced Send":"Dërgim i avancuar","Agree":"Pranoj","Alias for <i>{{index.walletName}}</i>":"Nofka për <i>{{index.walletName}}</i>","All contributions to Copay's translation are welcome. Sign up at crowdin.com and join the Copay project at":"All contributions to Copay's translation are welcome. Sign up at crowdin.com and join the Copay project at","All transaction requests are irreversible.":"All transaction requests are irreversible.","Already have a wallet?":"Tashmë keni një kuletë?","Alternative Currency":"Monedhë alternative","Amount":"Shuma","Amount below dust threshold":"Amount below dust threshold","Amount in":"Shuma në","Applying changes":"Duke aplikuar ndryshimet","Are you sure you want to delete the backup words?":"Are you sure you want to delete the backup words?","Are you sure you want to delete this wallet?":"Jeni i sigurtë që doni të fshini këtë kuletë?","Available Balance":"Shuma në dispozicion","Average confirmation time: {{fee.nbBlocks * 10}} minutes":"Koha mesatare e konfirmimit: {{fee.nbBlocks * 10}} minuta","Back":"Prapa","Backup":"Kopje rezervë","Backup now":"Krijo kopjen rezervë tani","Backup words deleted":"Backup words deleted","Bad wallet invitation":"Bad wallet invitation","Balance By Address":"Balance By Address","Before receiving funds, it is highly recommended you backup your wallet keys.":"Before receiving funds, it is highly recommended you backup your wallet keys.","Bitcoin address":"Bitcoin adresa","Bitcoin Network Fee Policy":"Bitcoin Network Fee Policy","Bitcoin transactions may include a fee collected by miners on the network. The higher the fee, the greater the incentive a miner has to include that transaction in a block. Actual fees are determined based on network load and the selected policy.":"Bitcoin transactions may include a fee collected by miners on the network. The higher the fee, the greater the incentive a miner has to include that transaction in a block. Actual fees are determined based on network load and the selected policy.","Bitcoin URI is NOT valid!":"Bitcoin URI NUK është valid!","Broadcast Payment":"Transmeto pagesën","Broadcasting Payment":"Duke transmetuar pagesën","Broadcasting transaction":"Duke transmetuar transaksionin","Browser unsupported":"Shfletues i pambështetur","Cancel":"Anulo","CANCEL":"ANULO","Cannot join the same wallet more that once":"Cannot join the same wallet more that once","Certified by":"Çertifikuar nga","Changing wallet alias only affects the local wallet name.":"Ndërrimi i nofkës së kuletës ndikon vetëm në emrin lokal të kuletës.","Choose a backup file from your computer":"Choose a backup file from your computer","Choose a wallet to send funds":"Choose a wallet to send funds","Close":"Close","Color":"Color","Commit hash":"Commit hash","Confirm":"Confirm","Confirmations":"Confirmations","Connecting to {{create.hwWallet}} Wallet...":"Connecting to {{create.hwWallet}} Wallet...","Connecting to {{import.hwWallet}} Wallet...":"Connecting to {{import.hwWallet}} Wallet...","Connecting to {{join.hwWallet}} Wallet...":"Connecting to {{join.hwWallet}} Wallet...","Copayer already in this wallet":"Copayer already in this wallet","Copayer already voted on this spend proposal":"Copayer already voted on this spend proposal","Copayer data mismatch":"Copayer data mismatch","Copayers":"Copayers","Copied to clipboard":"Copied to clipboard","Copy this text as it is to a safe place (notepad or email)":"Copy this text as it is to a safe place (notepad or email)","Copy to clipboard":"Copy to clipboard","Could not accept payment":"Could not accept payment","Could not access Wallet Service: Not found":"Could not access Wallet Service: Not found","Could not broadcast payment":"Could not broadcast payment","Could not create address":"Could not create address","Could not create payment proposal":"Could not create payment proposal","Could not create using the specified extended private key":"Could not create using the specified extended private key","Could not create using the specified extended public key":"Could not create using the specified extended public key","Could not create: Invalid wallet seed":"Could not create: Invalid wallet seed","Could not decrypt":"Could not decrypt","Could not decrypt file, check your password":"Could not decrypt file, check your password","Could not delete payment proposal":"Could not delete payment proposal","Could not fetch payment information":"Could not fetch payment information","Could not fetch transaction history":"Could not fetch transaction history","Could not import":"Could not import","Could not import. Check input file and password":"Could not import. Check input file and password","Could not join wallet":"Could not join wallet","Could not recognize a valid Bitcoin QR Code":"Could not recognize a valid Bitcoin QR Code","Could not reject payment":"Could not reject payment","Could not send payment":"Could not send payment","Could not update Wallet":"Could not update Wallet","Create":"Create","Create {{requiredCopayers}}-of-{{totalCopayers}} wallet":"Create {{requiredCopayers}}-of-{{totalCopayers}} wallet","Create new wallet":"Create new wallet","Create, join or import":"Create, join or import","Created by":"Created by","Creating Profile...":"Creating Profile...","Creating transaction":"Creating transaction","Creating Wallet...":"Creating Wallet...","Current fee rate for this policy: {{fee.feePerKBUnit}}/kiB":"Current fee rate for this policy: {{fee.feePerKBUnit}}/kiB","Date":"Date","Decrypting a paper wallet could take around 5 minutes on this device. please be patient and keep the app open.":"Decrypting a paper wallet could take around 5 minutes on this device. please be patient and keep the app open.","Delete it and create a new one":"Delete it and create a new one","Delete Payment Proposal":"Delete Payment Proposal","Delete wallet":"Delete wallet","Delete Wallet":"Delete Wallet","DELETE WORDS":"DELETE WORDS","Deleting payment":"Deleting payment","Derivation Strategy":"Derivation Strategy","Details":"Details","Disabled":"Disabled","Do not include private key":"Do not include private key","Don't see your language on Crowdin? Contact the Owner on Crowdin! We'd love to support your language.":"Don't see your language on Crowdin? Contact the Owner on Crowdin! We'd love to support your language.","Download":"Download","Download CSV file":"Download CSV file","Economy":"Economy","Email":"Email","Email for wallet notifications":"Email for wallet notifications","Email Notifications":"Email Notifications","Encrypted export file saved":"Encrypted export file saved","Enter the seed words (BIP39)":"Enter the seed words (BIP39)","Enter your password":"Enter your password","Error at Wallet Service":"Error at Wallet Service","Error creating wallet":"Error creating wallet","Error importing wallet:":"Error importing wallet:","Expires":"Expires","Export":"Export","Export options":"Export options","Extended Public Keys":"Extended Public Keys","External Private Key:":"External Private Key:","Failed to export":"Failed to export","Failed to import wallets":"Failed to import wallets","Family vacation funds":"Family vacation funds","Fee":"Fee","Fee Policy":"Fee Policy","Fee policy for this transaction":"Fee policy for this transaction","Fetching Payment Information":"Fetching Payment Information","File/Text Backup":"File/Text Backup","French":"French","Funds are locked by pending spend proposals":"Funds are locked by pending spend proposals","Funds found":"Funds found","Funds received":"Funds received","Funds will be transfered to":"Funds will be transfered to","Generate new address":"Generate new address","Generate QR Code":"Generate QR Code","Generating .csv file...":"Generating .csv file...","German":"German","GET STARTED":"GET STARTED","Getting address for wallet {{selectedWalletName}} ...":"Getting address for wallet {{selectedWalletName}} ...","Global settings":"Global settings","Go back":"Go back","Greek":"Greek","Hardware wallet":"Hardware wallet","Hardware Wallet":"Hardware Wallet","Have a Backup from Copay v0.9?":"Have a Backup from Copay v0.9?","Hide advanced options":"Hide advanced options","Hide Wallet Seed":"Hide Wallet Seed","History":"History","Home":"Home","I affirm that I have read, understood, and agree with these terms.":"I affirm that I have read, understood, and agree with these terms.","Import":"Import","Import backup":"Import backup","Import from Ledger":"Import from Ledger","Import from the Cloud?":"Import from the Cloud?","Import from TREZOR":"Import from TREZOR","Import here":"Import here","Import wallet":"Import wallet","Importing wallet...":"Importing wallet...","Importing...":"Importing...","In no event shall the authors of the software, employees and affiliates of Bitpay, copyright holders, or BitPay, Inc. be held liable for any claim, damages or other liability, whether in an action of contract, tort, or otherwise, arising from, out of or in connection with the software.":"In no event shall the authors of the software, employees and affiliates of Bitpay, copyright holders, or BitPay, Inc. be held liable for any claim, damages or other liability, whether in an action of contract, tort, or otherwise, arising from, out of or in connection with the software.","Incorrect address network":"Incorrect address network","Insufficient funds":"Insufficient funds","Insufficient funds for fee":"Insufficient funds for fee","Invalid":"Invalid","Invalid address":"Invalid address","Invitation to share a Copay Wallet":"Invitation to share a Copay Wallet","Italian":"Italian","Japanese":"Japanese","John":"John","Join":"Join","Join my Copay wallet. Here is the invitation code: {{secret}} You can download Copay for your phone or desktop at https://copay.io":"Join my Copay wallet. Here is the invitation code: {{secret}} You can download Copay for your phone or desktop at https://copay.io","Join shared wallet":"Join shared wallet","Joining Wallet...":"Joining Wallet...","Key already associated with an existing wallet":"Key already associated with an existing wallet","Language":"Language","Last Wallet Addresses":"Last Wallet Addresses","Learn more about Copay backups":"Learn more about Copay backups","Learn more about Wallet Migration":"Learn more about Wallet Migration","Loading...":"Loading...","locked by pending payments":"locked by pending payments","Locktime in effect. Please wait to create a new spend proposal":"Locktime in effect. Please wait to create a new spend proposal","Locktime in effect. Please wait to remove this spend proposal":"Locktime in effect. Please wait to remove this spend proposal","Make a payment to":"Make a payment to","me":"me","Me":"Me","Memo":"Memo","Merchant message":"Merchant message","Message":"Message","More":"More","Moved":"Moved","Multisignature wallet":"Multisignature wallet","My Bitcoin address":"My Bitcoin address","Network":"Network","Network connection error":"Network connection error","New Payment Proposal":"New Payment Proposal","No Private key":"No Private key","No transactions yet":"No transactions yet","Normal":"Normal","Not authorized":"Not authorized","Not valid":"Not valid","Note":"Note","Official English Disclaimer":"Official English Disclaimer","Once you have copied your wallet seed down, it is recommended to delete it from this device.":"Once you have copied your wallet seed down, it is recommended to delete it from this device.","Only Main (not change) addresses are shown. The addresses on this list were not verified locally at this time.":"Only Main (not change) addresses are shown. The addresses on this list were not verified locally at this time.","optional":"optional","Paper Wallet Private Key":"Paper Wallet Private Key","Participants":"Participants","Passphrase":"Passphrase","Passphrase (if you have one)":"Passphrase (if you have one)","Password":"Password","Password needed":"Password needed","Passwords do not match":"Passwords do not match","Paste invitation here":"Paste invitation here","Paste the backup plain text code":"Paste the backup plain text code","Paste your paper wallet private key here":"Paste your paper wallet private key here","Pay To":"Pay To","Payment Accepted":"Payment Accepted","Payment accepted, but not yet broadcasted":"Payment accepted, but not yet broadcasted","Payment accepted. It will be broadcasted by Glidera. In case there is a problem, it can be deleted 6 hours after it was created.":"Payment accepted. It will be broadcasted by Glidera. In case there is a problem, it can be deleted 6 hours after it was created.","Payment details":"Payment details","Payment Proposal":"Payment Proposal","Payment Proposal Created":"Payment Proposal Created","Payment Proposal Rejected":"Payment Proposal Rejected","Payment Proposal Rejected by Copayer":"Payment Proposal Rejected by Copayer","Payment Proposal Signed by Copayer":"Payment Proposal Signed by Copayer","Payment Proposals":"Payment Proposals","Payment Protocol Invalid":"Payment Protocol Invalid","Payment Protocol not supported on Chrome App":"Payment Protocol not supported on Chrome App","Payment rejected":"Payment rejected","Payment Rejected":"Payment Rejected","Payment request":"Payment request","Payment sent":"Payment sent","Payment Sent":"Payment Sent","Payment to":"Payment to","Pending Confirmation":"Pending Confirmation","Permanently delete this wallet. THIS ACTION CANNOT BE REVERSED":"Permanently delete this wallet. THIS ACTION CANNOT BE REVERSED","Personal Wallet":"Personal Wallet","Please enter the required fields":"Please enter the required fields","Please enter the seed words":"Please enter the seed words","Please enter the wallet seed":"Please enter the wallet seed","Please upgrade Copay to perform this action":"Please upgrade Copay to perform this action","Please, select your backup file":"Please, select your backup file","Portuguese":"Portuguese","Preferences":"Preferences","Preparing backup...":"Preparing backup...","Priority":"Priority","QR Code":"QR Code","QR-Scanner":"QR-Scanner","Receive":"Receive","Received":"Received","Recipients":"Recipients","Reconnecting to Wallet Service...":"Reconnecting to Wallet Service...","Recreate":"Recreate","Recreating Wallet...":"Recreating Wallet...","Reject":"Reject","Rejecting payment":"Rejecting payment","Release Information":"Release Information","Repeat password":"Repeat password","Request a specific amount":"Request a specific amount","Request Password for Spending Funds":"Request Password for Spending Funds","Requesting Ledger Wallet to sign":"Requesting Ledger Wallet to sign","Required":"Required","Required number of signatures":"Required number of signatures","Retrying...":"Retrying...","Russian":"Russian","Save":"Save","Saving preferences...":"Saving preferences...","Scan addresses for funds":"Scan addresses for funds","Scan Finished":"Scan Finished","Scan status finished with error":"Scan status finished with error","Scan Wallet Funds":"Scan Wallet Funds","Scanning wallet funds...":"Scanning wallet funds...","Scanning Wallet funds...":"Scanning Wallet funds...","See it on the blockchain":"See it on the blockchain","Seed passphrase":"Seed passphrase","Seed Passphrase":"Seed Passphrase","Select a backup file":"Select a backup file","Select a wallet":"Select a wallet","Self-signed Certificate":"Self-signed Certificate","Send":"Send","Send All":"Send All","Send all by email":"Send all by email","Send by email":"Send by email","Sending funds...":"Sending funds...","Sent":"Sent","Server":"Server","Server response could not be verified":"Server response could not be verified","Session log":"Session log","SET":"SET","Set up a Export Password":"Set up a Export Password","Set up a password":"Set up a password","Setting up email notifications could weaken your privacy, if the wallet service provider is compromised. Information available to an attacker would include your wallet addresses and its balance, but no more.":"Setting up email notifications could weaken your privacy, if the wallet service provider is compromised. Information available to an attacker would include your wallet addresses and its balance, but no more.","settings":"settings","Share address":"Share address","Share invitation":"Share invitation","Share this invitation with your copayers":"Share this invitation with your copayers","Share this wallet address to receive payments. To protect your privacy, new addresses are generated automatically once you use them.":"Share this wallet address to receive payments. To protect your privacy, new addresses are generated automatically once you use them.","Shared Wallet":"Shared Wallet","Show advanced options":"Show advanced options","Show Wallet Seed":"Show Wallet Seed","Signatures rejected by server":"Signatures rejected by server","Signing payment":"Signing payment","SKIP BACKUP":"SKIP BACKUP","Spanish":"Spanish","Specify your wallet seed":"Specify your wallet seed","Spend proposal is not accepted":"Spend proposal is not accepted","Spend proposal not found":"Spend proposal not found","Still not done":"Still not done","Success":"Success","Sweep paper wallet":"Sweep paper wallet","Sweep Wallet":"Sweep Wallet","Tap to retry":"Tap to retry","Terms of Use":"Terms of Use","Testnet":"Testnet","The authors of the software, employees and affiliates of Bitpay, copyright holders, and BitPay, Inc. cannot retrieve your private keys or passwords if you lose or forget them and cannot guarantee transaction confirmation as they do not have control over the Bitcoin network.":"The authors of the software, employees and affiliates of Bitpay, copyright holders, and BitPay, Inc. cannot retrieve your private keys or passwords if you lose or forget them and cannot guarantee transaction confirmation as they do not have control over the Bitcoin network.","The Ledger Chrome application is not installed":"The Ledger Chrome application is not installed","The payment was created but could not be completed. Please try again from home screen":"The payment was created but could not be completed. Please try again from home screen","The payment was created but could not be signed. Please try again from home screen":"The payment was created but could not be signed. Please try again from home screen","The payment was removed by creator":"The payment was removed by creator","The payment was signed but could not be broadcasted. Please try again from home screen":"The payment was signed but could not be broadcasted. Please try again from home screen","The private key for this wallet is encrypted. Exporting keep the private key encrypted in the export archive.":"The private key for this wallet is encrypted. Exporting keep the private key encrypted in the export archive.","The seed could require a passphrase to be imported":"The seed could require a passphrase to be imported","The software does not constitute an account where BitPay or other third parties serve as financial intermediaries or custodians of your bitcoin.":"The software does not constitute an account where BitPay or other third parties serve as financial intermediaries or custodians of your bitcoin.","The software you are about to use functions as a free, open source, and multi-signature digital wallet.":"The software you are about to use functions as a free, open source, and multi-signature digital wallet.","The spend proposal is not pending":"The spend proposal is not pending","The wallet \"{{walletName}}\" was deleted":"The wallet \"{{walletName}}\" was deleted","There are no wallets to make this payment":"There are no wallets to make this payment","There is an error in the form":"There is an error in the form","This transaction has become invalid; possibly due to a double spend attempt.":"This transaction has become invalid; possibly due to a double spend attempt.","This wallet is not registered at the given Bitcore Wallet Service (BWS). You can recreate it from the local information.":"This wallet is not registered at the given Bitcore Wallet Service (BWS). You can recreate it from the local information.","Time":"Time","To":"To","To restore this {{index.m}}-{{index.n}} <b>shared</b> wallet you will need":"To restore this {{index.m}}-{{index.n}} <b>shared</b> wallet you will need","To the fullest extent permitted by law, this software is provided “as is” and no representations or warranties can be made of any kind, express or implied, including but not limited to the warranties of merchantability, fitness or a particular purpose and noninfringement.":"To the fullest extent permitted by law, this software is provided “as is” and no representations or warranties can be made of any kind, express or implied, including but not limited to the warranties of merchantability, fitness or a particular purpose and noninfringement.","too long!":"too long!","Total":"Total","Total Locked Balance":"Total Locked Balance","Total number of copayers":"Total number of copayers","Transaction":"Transaction","Transaction already broadcasted":"Transaction already broadcasted","Translation Credits":"Translation Credits","Translators":"Translators","Type the Seed Word (usually 12 words)":"Type the Seed Word (usually 12 words)","Unable to send transaction proposal":"Unable to send transaction proposal","Unconfirmed":"Unconfirmed","Unit":"Unit","Unsent transactions":"Unsent transactions","Updating Wallet...":"Updating Wallet...","Use Ledger hardware wallet":"Use Ledger hardware wallet","Use TREZOR hardware wallet":"Use TREZOR hardware wallet","Use Unconfirmed Funds":"Use Unconfirmed Funds","Username":"Username","Version":"Version","View":"View","Waiting for copayers":"Waiting for copayers","Waiting...":"Waiting...","Wallet":"Wallet","Wallet Alias":"Wallet Alias","Wallet already exists":"Wallet already exists","Wallet Already Imported:":"Wallet Already Imported:","Wallet already in Copay:":"Wallet already in Copay:","Wallet Configuration (m-n)":"Wallet Configuration (m-n)","Wallet Export":"Wallet Export","Wallet Id":"Wallet Id","Wallet incomplete and broken":"Wallet incomplete and broken","Wallet Information":"Wallet Information","Wallet Invitation":"Wallet Invitation","Wallet Invitation is not valid!":"Wallet Invitation is not valid!","Wallet is full":"Wallet is full","Wallet is not complete":"Wallet is not complete","Wallet name":"Wallet name","Wallet Name (at creation)":"Wallet Name (at creation)","Wallet Network":"Wallet Network","Wallet not found":"Wallet not found","Wallet not registed at the Wallet Service. Recreate it from \"Create Wallet\" using \"Advanced Options\" to set your seed":"Wallet not registed at the Wallet Service. Recreate it from \"Create Wallet\" using \"Advanced Options\" to set your seed","Wallet Seed":"Wallet Seed","Wallet Seed could require a passphrase to be imported":"Wallet Seed could require a passphrase to be imported","Wallet seed is invalid":"Wallet seed is invalid","Wallet seed not available. You can still export it from Advanced &gt; Export.":"Wallet seed not available. You can still export it from Advanced &gt; Export.","Wallet service not found":"Wallet service not found","WARNING: Backup needed":"WARNING: Backup needed","WARNING: Not including the private key allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.":"WARNING: Not including the private key allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.","WARNING: Passphrase cannot be recovered. <b>Be sure to write it down</b>. The wallet can not be restored without the passphrase.":"WARNING: Passphrase cannot be recovered. <b>Be sure to write it down</b>. The wallet can not be restored without the passphrase.","WARNING: The private key of this wallet is not available. The export allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.":"WARNING: The private key of this wallet is not available. The export allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.","WARNING: This seed was created with a passphrase. To recover this wallet both the mnemonic and passphrase are needed.":"WARNING: This seed was created with a passphrase. To recover this wallet both the mnemonic and passphrase are needed.","Warning: this transaction has unconfirmed inputs":"Warning: this transaction has unconfirmed inputs","WARNING: UNTRUSTED CERTIFICATE":"WARNING: UNTRUSTED CERTIFICATE","WARNING: Wallet not registered":"WARNING: Wallet not registered","Warning!":"Warning!","We reserve the right to modify this disclaimer from time to time.":"We reserve the right to modify this disclaimer from time to time.","WELCOME TO COPAY":"WELCOME TO COPAY","While the software has undergone beta testing and continues to be improved by feedback from the open-source user and developer community, we cannot guarantee that there will be no bugs in the software.":"While the software has undergone beta testing and continues to be improved by feedback from the open-source user and developer community, we cannot guarantee that there will be no bugs in the software.","Write it down and keep them somewhere safe.":"Write it down and keep them somewhere safe.","Wrong number of seed words:":"Wrong number of seed words:","Wrong password":"Wrong password","Yes":"Yes","You acknowledge that your use of this software is at your own discretion and in compliance with all applicable laws.":"You acknowledge that your use of this software is at your own discretion and in compliance with all applicable laws.","You are responsible for safekeeping your passwords, private key pairs, PINs and any other codes you use to access the software.":"You are responsible for safekeeping your passwords, private key pairs, PINs and any other codes you use to access the software.","You assume any and all risks associated with the use of the software.":"You assume any and all risks associated with the use of the software.","You can safely install your wallet on another device and use it from multiple devices at the same time.":"You can safely install your wallet on another device and use it from multiple devices at the same time.","You do not have a wallet":"You do not have a wallet","You need the wallet seed to restore this personal wallet.":"You need the wallet seed to restore this personal wallet.","Your backup password":"Your backup password","Your export password":"Your export password","Your nickname":"Your nickname","Your password":"Your password","Your profile password":"Your profile password","Your wallet has been imported correctly":"Your wallet has been imported correctly","Your wallet key will be encrypted. Password cannot be recovered. Be sure to write it down":"Your wallet key will be encrypted. Password cannot be recovered. Be sure to write it down","Your Wallet Seed":"Your Wallet Seed","Your wallet seed and access to the server that coordinated the initial wallet creation. You still need {{index.m}} keys to spend.":"Your wallet seed and access to the server that coordinated the initial wallet creation. You still need {{index.m}} keys to spend."});
    gettextCatalog.setStrings('tr', {"(possible double spend)":"(olası çift harcama)","(Trusted)":"(Güvenilir)","{{fee}} will be deducted for bitcoin networking fees":"{{fee}} bitcoin ağ ücreti olarak düşülecektir","{{index.m}}-of-{{index.n}}":"{{index.m}} te {{index.n}}","{{item.m}}-of-{{item.n}}":"{{item.n}} te {{item.m}}","{{len}} wallets imported. Funds scanning in progress. Hold on to see updated balance":"{{len}} cüzdanı içe aktarıldı. Fonlar taranırken ve güncellenirken bekleyiniz","* A payment proposal can be deleted if 1) you are the creator, and no other copayer has signed, or 2) 24 hours have passed since the proposal was created.":"* Ödeme isteği; 1) kaynağı sizseniz, başka bir kullanıcı tarafından imzalanmamışsa veya 2) üzerinden 24 saat geçmişse silinebilir.","<b>IF YOU LOSE ACCESS TO YOUR COPAY WALLET OR YOUR ENCRYPTED PRIVATE KEYS AND YOU HAVE NOT SEPARATELY STORED A BACKUP OF YOUR WALLET AND CORRESPONDING PASSWORD, YOU ACKNOWLEDGE AND AGREE THAT ANY BITCOIN YOU HAVE ASSOCIATED WITH THAT COPAY WALLET WILL BECOME INACCESSIBLE.</b>":"<b>COPAY CÜZDANINIZA ERİŞİMİNİZİ KAYBEDER VEYA GEREKLİ ŞİFRESİ İLE BİRLİKTE CÜZDANINIZI ÖZEL ANAHTARLA BİRLİKTE YEDEKLEMEZSENİZ, COPAY CÜZDANINIZDAKİ BİTCOİN'LERE ERİŞİMİNİZİN KALMAYACAĞINI KABUL EDER VE ONAYLIYORSUNUZ DEMEKTİR.</b>","A multisignature bitcoin wallet":"Çoklu imzalı bitcoin cüzdanı","About Copay":"Copay Hakkında","Accept":"Onay","Add an optional passphrase to secure the seed":"Kurtarma sözcüklerinin güvenliği için opsiyonel parola ekle","Add wallet":"Cüzdan ekle","Address":"Adres","Address Type":"Adres Türü","Advanced":"Gelişmiş","Advanced Send":"Gelişmiş Gönderme","Agree":"Kabul","Alias for <i>{{index.walletName}}</i>":"<i>{{index.walletName}}</i> için takma ad","All contributions to Copay's translation are welcome. Sign up at crowdin.com and join the Copay project at":"Copay'nın çevirisi için tüm katkılarınızı bekliyoruz. Crowdin.com sitesine kayıt olun ve Copay Projesi'ne katılın","All transaction requests are irreversible.":"Işlem isteklerinin hiç biri geri alınamaz.","Already have a wallet?":"Zaten bir cüzdanınız var mı?","Alternative Currency":"Alternatif Para Birimi","Amount":"Tutar","Amount below dust threshold":"Kabul edilenden düşük miktar","Amount in":"Tutar","Are you sure you want to delete the backup words?":"Yedekleme kelimelerini silmek istediğinizden emin misiniz?","Are you sure you want to delete this wallet?":"Bu cüzdanı silmek istediğinizden emin misiniz?","Available Balance":"Kullanılabilir Bakiye","Average confirmation time: {{fee.nbBlocks * 10}} minutes":"Ortalama onay süresi: {{fee.nbBlocks * 10}} dakika","Back":"Geri","Backup":"Yedekleme","Backup now":"Şimdi yedekle","Backup words deleted":"Yedekleme kelimeleri silindi","Bad wallet invitation":"Geçersiz cüzdan daveti","Balance By Address":"Adrese göre Bakiye","Before receiving funds, it is highly recommended you backup your wallet keys.":"Para almadan önce cüzdanınızı mutlaka yedeklemeniz önerilir.","Bitcoin address":"Bitcoin adresi","Bitcoin Network Fee Policy":"Bitcoin ağ ücret politikası","Bitcoin transactions may include a fee collected by miners on the network. The higher the fee, the greater the incentive a miner has to include that transaction in a block. Actual fees are determined based on network load and the selected policy.":"Bitcoin işlemlerine ağda madenciler tarafından toplanan ücret dahildir. Daha yüksek ücret, madenciler için işleminizi bloklarına eklemek için daha teşvik edicidir. Gerçek ücretler ağ yüküne ve seçili ilkeye göre belirlenir.","Bitcoin URI is NOT valid!":"Bitcoin URI geçerli değil!","Broadcast Payment":"Ödemeyi Yayınla","Broadcasting Payment":"Ödeme Yayınlanıyor","Broadcasting transaction":"İşlem yayınlanıyor","Browser unsupported":"Desteklenmeyen tarayıcı","Cancel":"İptal","CANCEL":"İPTAL","Cannot join the same wallet more that once":"Aynı cüzdana birden fazla kez girilemez","Certified by":"Tarafından sertifikalı","Changing wallet alias only affects the local wallet name.":"Cüzdan takma adı değişikliği sadece yerel cüzdan adını etkiler.","Choose a backup file from your computer":"Bilgisayarınızdan bir yedek dosyası seçin","Close":"Kapat","Color":"Renk","Commit hash":"Commit hash","Confirm":"Onayla","Confirmations":"Onaylı","Copayer already in this wallet":"Copayer zaten bu cüzdan içinde","Copayer already voted on this spend proposal":"Copayer bu teklifi oylamış","Copayer data mismatch":"Copayer veri uyuşmazlığı","Copayers":"Copayers","Copied to clipboard":"Panoya kopyalandı","Copy this text as it is to a safe place (notepad or email)":"Bu metni güvenli bir yere kopyalayın (Not Defteri veya e-posta)","Copy to clipboard":"Panoya kopyala","Could not accept payment":"Ödeme kabul edilemedi","Could not access Wallet Service: Not found":"Cüzdan hizmetine erişilemedi: Bulunamadı","Could not broadcast payment":"Ödeme yayınlanamadı","Could not create address":"Adres oluşturulamadı","Could not create payment proposal":"Ödeme teklifi oluşturulamadı","Could not create using the specified extended private key":"Belirtilen genişletilmiş özel anahtar kullanılarak oluşturulamadı","Could not create using the specified extended public key":"Belirtilen genişletilmiş genel anahtar kullanılarak oluşturulamadı","Could not create: Invalid wallet seed":"Oluşturulamadı: geçersiz cüzdan kelimeleri","Could not decrypt file, check your password":"Dosyanın şifresi çözülemedi, parolanızı kontrol edin","Could not delete payment proposal":"Ödeme teklifi silinemedi","Could not fetch payment information":"Ödeme bilgileri alınamadı","Could not fetch transaction history":"İşlem geçmişi alınamadı","Could not import":"İçe alınamadı","Could not import. Check input file and password":"İçe alınamadı. Dosyayı ve parolanızı kontrol edin","Could not join wallet":"Cüzdana katılma başarısız","Could not recognize a valid Bitcoin QR Code":"Geçerli bir Bitcoin QR kodu tanımıyor","Could not reject payment":"Ödeme reddedilemedi","Could not send payment":"Ödeme gönderemedi","Could not update Wallet":"Cüzdan güncellenemedi","Create":"Oluştur","Create {{requiredCopayers}}-of-{{totalCopayers}} wallet":"{{totalCopayers}} {{requiredCopayers}} için cüzdan oluştur","Create new wallet":"Yeni cüzdan oluştur","Create, join or import":"Oluştur, birleştir veya içe al","Created by":"Oluşturan Kişi","Creating Profile...":"Profil oluşturuluyor...","Creating transaction":"İşlem oluşturuluyor","Creating Wallet...":"Cüzdan oluşturuluyor...","Current fee rate for this policy: {{fee.feePerKBUnit}}/kiB":"Bu ilke için geçerli ücret oranı: {{fee.feePerKBUnit}}/kiB","Date":"Tarih","Delete it and create a new one":"Sil ve yeni bir tane oluştur","Delete Payment Proposal":"Ödeme teklifini sil","Delete wallet":"Cüzdanı sil","Delete Wallet":"Cüzdanı Sil","DELETE WORDS":"KELİMELERİ SİL","Deleting payment":"Ödeme siliniyor","Derivation Strategy":"Türetme Stratejisi","Details":"Ayrıntılar","Disabled":"Devre Dışı","Do not include private key":"Özel anahtarı dahil etme","Don't see your language on Crowdin? Contact the Owner on Crowdin! We'd love to support your language.":"Kendi dilinizi görmüyor musunuz? Crowdin kurucusu ile irtibata geçin! Dilinizi desteklemekten mutluluk duyarız.","Download":"İndir","Download CSV file":"CSV dosyasını indir","Economy":"Ekonomik","Email":"E-posta","Email for wallet notifications":"E-posta ile cüzdan bildirimleri","Email Notifications":"E-posta Bildirimleri","Encrypted export file saved":"Dışa alınan şifrelenmiş dosya kaydedildi","Enter the seed words (BIP39)":"Kurtarma sözcüklerini girin (BIP39)","Enter your password":"Parolanızı girin","Error at Wallet Service":"Cüzdan hizmeti hatası","Error creating wallet":"Cüzdan oluşturma hatası","Error importing wallet:":"Cüzdan içe alma hatası:","Expires":"Sona Erme","Export options":"Dışa aktarma seçenekleri","Extended Public Keys":"Genişletilmiş Genel Anahtarlar","Failed to export":"Dışa aktarma başarısız oldu","Failed to import wallets":"Cüzdan içe alma başarısız oldu","Family vacation funds":"Aile tatil fonları","Fee":"Ücret","Fee Policy":"Ücret politikası","Fee policy for this transaction":"Bu işlem için ücret politikası","Fetching Payment Information":"Ödeme Bilgileri Alınıyor","File/Text Backup":"Dosya/Metin Yedekleme","French":"Fransızca","Funds are locked by pending spend proposals":"Fonlar bekleyen işlem teklifleri tarafından kilitlendi","Funds received":"Ödeme alındı","Generate new address":"Yeni adres oluştur","Generate QR Code":"QR kodu oluştur","Generating .csv file...":"Csv dosyası oluşturuluyor...","German":"Almanca","GET STARTED":"Başlarken","Getting address for wallet {{selectedWalletName}} ...":"{{selectedWalletName}} için cüzdan adresi alınıyor...","Global settings":"Genel ayarlar","Go back":"Geri dön","Greek":"Yunanca","Hardware wallet":"Donanım cüzdanı","Have a Backup from Copay v0.9?":"Copay v0.9 sürümünden bir yedeğiniz mi var?","Hide advanced options":"Gelişmiş seçenekleri gizle","Hide Wallet Seed":"Cüzdan Sözcüklerini Gizle","History":"Geçmiş","Home":"Ana sayfa","I affirm that I have read, understood, and agree with these terms.":"Bu koşulları okuduğumu, anladığımı ve kabul ettiğimi onaylıyorum.","Import":"İçe aktar","Import backup":"Yedeği içe aktar","Import from the Cloud?":"Yedeği buluttan mı aktaracaksınız?","Import here":"Buraya içe aktar","Import wallet":"Cüzdanı içe aktar","Importing wallet...":"Cüzdan içe aktarılıyor...","Importing...":"İçe aktarılıyor...","Incorrect address network":"Yanlış adres ağı","Insufficient funds":"Yetersiz bakiye","Insufficient funds for fee":"Ücret için yetersiz bakiye","Invalid":"Geçersiz","Invalid address":"Geçersiz adres","Invitation to share a Copay Wallet":"Copay cüzdanını paylaşmak için davet","Italian":"İtalyanca","Japanese":"Japonca","John":"John","Join":"Katıl","Join my Copay wallet. Here is the invitation code: {{secret}} You can download Copay for your phone or desktop at https://copay.io":"Copay cüzdanıma katılın. İşte davetiye kodu: {{secret}} Copay'i telefon veya masaüstü ortamlarına indirmek için https://copay.io","Join shared wallet":"Paylaşılan cüzdana katıl","Joining Wallet...":"Cüzdana katılınılıyor...","Language":"Dil","Last Wallet Addresses":"Son Cüzdan Adresleri","Learn more about Copay backups":"Copay yedeklemeleri hakkında daha fazla bilgi edinin","Learn more about Wallet Migration":"Cüzdan birleştirme hakkında daha fazla bilgi","Loading...":"Yükleneniyor...","locked by pending payments":"bekleyen ödemeler yüzünden kilitlendi","Locktime in effect. Please wait to create a new spend proposal":"Yeni bir harcama teklifi oluşturmak için lütfen biraz bekleyin","Locktime in effect. Please wait to remove this spend proposal":"Harcama teklifini kaldırmak için lütfen biraz bekleyin","Make a payment to":"Ödeme yapılacak kişi","me":"ben","Me":"Beni","Memo":"Kısa Not","Merchant message":"Tüccar mesajı","Message":"Mesajınız","Moved":"Taşındı","My Bitcoin address":"Bitcoin adresim","Network":"Ağ","Network connection error":"Ağ bağlantı hatası","New Payment Proposal":"Yeni ödeme teklifi","No transactions yet":"Henüz hiç bir işlem yok","Normal":"Normal","Not authorized":"Yetkili değil","Not valid":"Geçerli değil","Note":"Not","Official English Disclaimer":"Resmi İngilizce Yasal Uyarı","Only Main (not change) addresses are shown. The addresses on this list were not verified locally at this time.":"Yalnızca ana (değişmemiş) adresler gösteriliyor. Bu listedeki adresler yerel olarak şu anda doğrulanmadı.","optional":"isteğe bağlı","Participants":"Katılımcılar","Passphrase":"Parola","Password":"Parola","Password needed":"Parola gerekli","Passwords do not match":"Parolalar eşleşmiyor","Paste invitation here":"Daveti buraya yapıştır","Paste the backup plain text code":"Yedek düz metin kodu yapıştırın","Pay To":"Ödenecek Kişi","Payment Accepted":"Ödeme Kabul Edildi","Payment accepted, but not yet broadcasted":"Ödeme kabul edildi ama henüz yayınlanmadı","Payment accepted. It will be broadcasted by Glidera. In case there is a problem, it can be deleted 6 hours after it was created.":"Ödeme kabul edildi ve Glidera tarafından yayınlanacak. Bir sorun oluşması durumunda, yaratıldıktan 6 saat sonra silinebilir.","Payment details":"Ödeme detayları","Payment Proposal":"Ödeme Teklifi","Payment Proposal Created":"Ödeme Teklifi Oluşturuldu","Payment Proposal Rejected":"Ödeme Teklifi Reddedildi","Payment Proposal Rejected by Copayer":"Ödeme teklifi bir Copayer tarafından reddedildi","Payment Proposal Signed by Copayer":"Ödeme teklifi bir Copayer tarafından kabul edildi","Payment Proposals":"Ödeme Teklifleri","Payment Protocol Invalid":"Ödeme Protokolü Geçersiz","Payment Protocol not supported on Chrome App":"Ödeme Protokolü Chrome uygulaması üzerinde desteklenmiyor","Payment rejected":"Ödeme reddedildi","Payment Rejected":"Ödeme Reddedildi","Payment request":"Ödeme talebi","Payment sent":"Ödeme gönderildi","Payment Sent":"Ödeme Gönderildi","Payment to":"Ödenecek","Pending Confirmation":"Onay Bekleniyor","Permanently delete this wallet. THIS ACTION CANNOT BE REVERSED":"Bu cüzdanı kalıcı olarak sil. BU EYLEM GERİ ALINAMAZ","Personal Wallet":"Kişisel Cüzdan","Please enter the required fields":"Lütfen gerekli alanları girin","Please enter the seed words":"Lütfen kurtarma sözcüklerini girin","Please enter the wallet seed":"Lütfen cüzdan sözcüklerini girin","Please upgrade Copay to perform this action":"Bu eylemi gerçekleştirmek için lütfen Copay sürümünü yükseltin","Please, select your backup file":"Lütfen yedek dosyanızı seçin","Portuguese":"Portekizce","Preferences":"Tercihler","Preparing backup...":"Yedekleme hazırlanıyor...","Priority":"Öncelikli","QR Code":"QR Kodu","QR-Scanner":"QR-Tarayıcı","Receive":"Alma","Received":"Alındı","Recipients":"Alıcılar","Reconnecting to Wallet Service...":"Cüzdan servisine bağlanıyor...","Recreate":"Yeniden oluştur","Recreating Wallet...":"Cüzdan yeniden oluşturuluyor...","Reject":"Reddet","Rejecting payment":"Ödeme reddediliyor","Release Information":"Sürüm Bilgileri","Repeat password":"Şifreyi tekrarla","Request a specific amount":"Belirli bir miktar iste","Requesting Ledger Wallet to sign":"Ana defter, imzalanmak için isteniyor","Required":"Zorunlu","Required number of signatures":"Gerekli imza sayısı","Retrying...":"Yeniden deneniyor...","Russian":"Rusça","Save":"Kaydet","Saving preferences...":"Tercihler kaydediliyor...","Scan addresses for funds":"Fonlar için adresleri tara","Scan Finished":"Tarama tamamlandı","Scan status finished with error":"Tarama işlemi hatalı bitti","Scanning Wallet funds...":"Cüzdan para miktarı taranıyor...","See it on the blockchain":"Blockchain üzerinde gör","Seed passphrase":"Kurtarma sözcükleri parolası","Seed Passphrase":"Kurtarma Sözcükleri Parolası","Select a backup file":"Yedek dosyasını seçin","Select a wallet":"Bir cüzdan seçin","Self-signed Certificate":"Kendinden imzalı Sertifika","Send":"Gönder","Send All":"Tümünü Gönder","Send by email":"E-posta ile gönder","Sent":"Gönderildi","Server":"Sunucu","Server response could not be verified":"Sunucu yanıtı doğrulanamadı","Session log":"Oturum günlüğü","SET":"AYARLA","Set up a Export Password":"Dışa Alım parolası ayarla","Set up a password":"Parola ayarla","Setting up email notifications could weaken your privacy, if the wallet service provider is compromised. Information available to an attacker would include your wallet addresses and its balance, but no more.":"E-posta bildirimleri ayarlamak gizliliğinizi zayıflatabilir. Cüzdan sağlayıcısı ele geçirilirse, bazı bilgiler saldırganların eline geçebilir ancak bu bilgiler sadece cüzdan adresiniz ve bakiyeniz olacaktır.","Share address":"Adresi paylaş","Share invitation":"Davet paylaş","Share this invitation with your copayers":"Bu daveti copayers ile paylaş","Share this wallet address to receive payments. To protect your privacy, new addresses are generated automatically once you use them.":"Ödemeler için bu cüzdan adresinizi paylaşın. Gizliliğinizi korumak için, her kullandığınızda yeni bir adres otomatik olarak üretilir.","Shared Wallet":"Paylaşımlı Cüzdan","Show advanced options":"Gelişmiş seçenekleri göster","Show Wallet Seed":"Cüzdan Kurtarma Sözcüklerini Göster","Signatures rejected by server":"İmzalar sunucu tarafından reddedildi","Signing payment":"Ödeme imzalanıyor","SKIP BACKUP":"YEDEKLEMEYİ GEÇ","Spanish":"İspanyolca","Spend proposal is not accepted":"Harcama teklifi kabul edilmedi","Spend proposal not found":"Harcama teklifi bulunamadı","Still not done":"Halen tamamlanmadı","Success":"Başarılı","Tap to retry":"Yeniden denemek için dokunun","Terms of Use":"Kullanım Şartları","Testnet":"TestNet","The Ledger Chrome application is not installed":"Ledger Chrome uygulaması kurulu değil","The payment was created but could not be completed. Please try again from home screen":"Ödeme oluşturuldu ancak tamamlanamadı. Lütfen ana ekrandan yeniden deneyin","The payment was created but could not be signed. Please try again from home screen":"Ödeme oluşturuldu ancak tamamlanamadı. Lütfen ana ekrandan yeniden deneyin","The payment was removed by creator":"Ödeme yaratıcısı tarafından kaldırıldı","The payment was signed but could not be broadcasted. Please try again from home screen":"Ödeme imzalandı ancak değil yayınlanmadı. Lütfen ana ekrandan yeniden deneyin","The private key for this wallet is encrypted. Exporting keep the private key encrypted in the export archive.":"Bu cüzdan için özel anahtar şifrelidir. Dışa alım durumunda yine şifreli kalacaktır.","The seed could require a passphrase to be imported":"Kurtarma sözcükleri içe alım için parola gerektirebilir","The spend proposal is not pending":"Harcama teklifi beklemede değil","The wallet \"{{walletName}}\" was deleted":"\"{{walletName}}\" cüzdanı silindi","There are no wallets to make this payment":"Bu ödemeyi yapmak için hiçbir cüzdan yok","There is an error in the form":"Formda bir hata oluştu","This transaction has become invalid; possibly due to a double spend attempt.":"Bu işlem muhtemel bir çift harcama girişimi yüzünden geçersiz hale geldi.","This wallet is not registered at the given Bitcore Wallet Service (BWS). You can recreate it from the local information.":"Bu cüzdan Bitcore cüzdan Servisi'ne (BWS) kayıtlı değil. Yerel bilgilerle yeniden oluşturabilirsiniz.","Time":"Zaman","To":"Alıcı","To restore this {{index.m}}-{{index.n}} <b>shared</b> wallet you will need":"{{index.m}}-{{index.n}} kurtarma için <b>paylaşılan</b> bir cüzdana ihtiyacınız var","too long!":"çok uzun!","Total":"Toplam","Total Locked Balance":"Toplam Kilitli Bakiye","Total number of copayers":"Copayers toplam sayısı","Transaction":"İşlem","Transaction already broadcasted":"İşlem zaten yayınlanmış","Translation Credits":"Çeviride Emeği Geneçler","Translators":"Çevirmenler","Type the Seed Word (usually 12 words)":"Kurtarma Sözcüklerini Girin (genelde 12 sözcük)","Unable to send transaction proposal":"İşlem teklifi gönderilemedi","Unconfirmed":"Onaylanmamış","Unit":"Birim","Unsent transactions":"Gönderilmemiş işlemler","Updating Wallet...":"Cüzdan güncelleniyor...","Use Unconfirmed Funds":"Doğrulanmamış fonları kullan","Username":"Kullanıcı adı","Version":"Sürüm","Waiting for copayers":"Copayers bekleniyor","Waiting...":"Bekliyor...","Wallet":"Cüzdan","Wallet Alias":"Cüzdan takma adı","Wallet already exists":"Cüzdan zaten var","Wallet Already Imported:":"Cüzdan zaten içe alındı:","Wallet already in Copay:":"Copay'de kayıtlı olan cüzdan:","Wallet Configuration (m-n)":"Cüzdan Yapılandırma (m-n)","Wallet Id":"Cüzdan Id","Wallet incomplete and broken":"Cüzdan eksik ve arızalı","Wallet Information":"Cüzdan Bilgisi","Wallet Invitation":"Cüzdan daveti","Wallet Invitation is not valid!":"Cüzdan daveti geçerli değil!","Wallet is full":"Cüzdan dolu","Wallet is not complete":"Cüzdan tamamlanmadı","Wallet name":"Cüzdan ismi","Wallet Name (at creation)":"Cüzdan ismi (oluşturmadaki)","Wallet Network":"Cüzdan Ağı","Wallet not found":"Cüzdan bulunamadı","Wallet not registed at the Wallet Service. Recreate it from \"Create Wallet\" using \"Advanced Options\" to set your seed":"Cüzdan kayıtlı değil. Kurtarma sözcükleri belirlemek için Cüzdan Servisinden kaydedebilirsiniz","Wallet Seed":"Cüzdan Kurtarma Sözcükleri","Wallet Seed could require a passphrase to be imported":"Cüzdan kurtarma sözcükleri içe alım için parola gerektirebilir","Wallet seed is invalid":"Cüzdan kurtarma sözcükleri geçersiz","Wallet seed not available. You can still export it from Advanced &gt; Export.":"Cüzdan kurtarma sözcükleri kullanılabilir değil. Yine de Gelişmiş &gt; Dışa Alım adımından dışa alabilirsiniz.","Wallet service not found":"Cüzdan hizmeti bulunamadı","WARNING: Backup needed":"Uyarı: Yedekleme gereklidir","WARNING: Not including the private key allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.":"Özel anahtar olmadan cüzdanınızdaki miktarı ve işlem geçmişini görebilir, ödeme isteği oluşturabilirsiniz ancak herhangi bir ödeme gönderemezsiniz (sign) yani cüzdandaki paraya <b>ulaşılamaz</b> olarak kalır.","WARNING: Passphrase cannot be recovered. <b>Be sure to write it down</b>. The wallet can not be restored without the passphrase.":"UYARI: Parola kurtarma seçeneği yoktur. <b>Bir yere yazdığınızdan emin olun</b>. Cüzdanınız parola olmadan kurtarılamaz.","WARNING: The private key of this wallet is not available. The export allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.":"UYARI: Bu cüzdan için için özel anahtar kullanılabilir değil. Özel anahtar olmadan cüzdanınızdaki miktarı ve işlem geçmişini görebilir, ödeme isteği oluşturabilirsiniz ancak herhangi bir ödeme gönderemezsiniz (sign) yani cüzdandaki paraya <b>ulaşılamaz</b> olarak kalır.","WARNING: This seed was created with a passphrase. To recover this wallet both the mnemonic and passphrase are needed.":"Kurtarma sözcükleri bir parola ile desteklendi. Bu cüzdanı kurtarmak için, kurtarma sözcüklerine ve parolaya ihtiyaç olacaktır.","Warning: this transaction has unconfirmed inputs":"Uyarı: Bu işlem doğrulanmamış girişler içeriyor","WARNING: UNTRUSTED CERTIFICATE":"UYARI: GÜVENİLİR OLMAYAN SERTİFİKA","WARNING: Wallet not registered":"UYARI: Cüzdan kayıtlı değil","Warning!":"Uyarı!","We reserve the right to modify this disclaimer from time to time.":"Zaman zaman bu reddi değiştirme hakkımızı saklı tutarız.","WELCOME TO COPAY":"COPAY'E HOŞGELDİNİZ","Write it down and keep them somewhere safe.":"Not edin ve güvenli bir yerde saklayın.","Wrong number of seed words:":"Kurtarma sözcükleri sayısı yanlış:","Wrong password":"Hatalı şifre","Yes":"Evet","You can safely install your wallet on another device and use it from multiple devices at the same time.":"Cüzdanınızı başka bir cihaza güvenle kurabilir ve aynı anda birden çok platformda kullanabilirsiniz.","You do not have a wallet":"Cüzdanınız yok","You need the wallet seed to restore this personal wallet.":"Bu cüzdanı yüklemek için kurtarma sözcüklerine ihtiyacınız var.","Your backup password":"Yedekleme parolanız","Your export password":"Dışa alım parolanız","Your nickname":"Takma adınız","Your password":"Parolanız","Your profile password":"Profil parolanız","Your wallet has been imported correctly":"Cüzdan başarıyla içe aktarıldı","Your wallet key will be encrypted. Password cannot be recovered. Be sure to write it down":"Cüzdan anahtarınız şifrelenecek ve parolanız için bir kurtarma seçeneği olmayacak. Parolanızı bir yere yazdığınızdan emin olun","Your Wallet Seed":"Cüzdan Kurtama Sözcükleriniz"});
    gettextCatalog.setStrings('zh', {"(possible double spend)":"（重复支付）","(Trusted)":"（可信的）","[Balance Hidden]":"[隐藏余额]","{{fee}} will be deducted for bitcoin networking fees":"扣除比特币网络费 {{fee}}","{{feeRateStr}} of the transaction":"交易的{{feeRateStr}}","{{index.m}}-of-{{index.n}}":"{{index.n}} 分之 {{index.m}}","{{index.result.length - index.txHistorySearchResults.length}} more":"{{index.result.length - index.txHistorySearchResults.length}} 更多","{{index.txProgress}} transactions downloaded":"{{index.txProgress}} 条交易已下载","{{item.m}}-of-{{item.n}}":"{{item.n}} 分之 {{item.m}}","* A payment proposal can be deleted if 1) you are the creator, and no other copayer has signed, or 2) 24 hours have passed since the proposal was created.":"* 如果 1) 你是创造者，及没有其他 copayer 签名，或 2) 24 小时已经过去，支付提议将被删除。","<b>IF YOU LOSE ACCESS TO YOUR COPAY WALLET OR YOUR ENCRYPTED PRIVATE KEYS AND YOU HAVE NOT SEPARATELY STORED A BACKUP OF YOUR WALLET AND CORRESPONDING PASSWORD, YOU ACKNOWLEDGE AND AGREE THAT ANY BITCOIN YOU HAVE ASSOCIATED WITH THAT COPAY WALLET WILL BECOME INACCESSIBLE.</b>":"<b>如果你无法访问你的 COPAY 钱包或加密私钥，及你没有分开储存钱包备份和相应密码，你承认并同意有关 COPAY 钱包里的任何比特币将不可被存取。</b>","<b>OR</b> 1 wallet export file and the remaining quorum of wallet recovery phrases (e.g. in a 3-5 wallet: 1 wallet export file + 2 wallet recovery phrases of any of the other copayers).":"<b>或</b> 1 钱包导出文件和钱包恢复短语的剩余法定人数 (例如在 3-5 钱包︰1 钱包导出文件 + 任何其他 copayers 的 2 钱包恢复短语)。","<b>OR</b> the wallet recovery phrase of <b>all</b> copayers in the wallet":"<b>或</b> 钱包里的 <b>所有</b> copayers 的钱包恢复短语","<b>OR</b> the wallet recovery phrases of <b>all</b> copayers in the wallet":"<b>或</b> 钱包里的 <b>所有</b> copayers 的钱包恢复短语","A multisignature bitcoin wallet":"多重签名比特币钱包","About Copay":"Copay 简介","Accept":"同意","Account":"帐户","Account Number":"帐号","Activity":"活动","Add a new entry":"添加新条目","Add a Password":"添加密码","Add an optional password to secure the recovery phrase":"添加可选的密码，以保护恢复短语","Add comment":"添加评论","Add wallet":"添加钱包","Address":"地址","Address Type":"地址类型","Advanced":"進階","Alias":"别名","Alias for <i>{{index.walletName}}</i>":"<i>{{index.walletName}}</i>别名","All contributions to Copay's translation are welcome. Sign up at crowdin.com and join the Copay project at":"欢迎大家为 Copay 提供翻译，注册 crowdin.com 并加入 Copay 项目","All transaction requests are irreversible.":"所有交易请求均不可逆。","Alternative Currency":"替代货币","Amount":"数额","Amount below minimum allowed":"数额低于最低允许值","Amount in":"已转换的数额","Are you sure you want to delete the recovery phrase?":"你确定要删除恢复短语吗?","Are you sure you want to delete this wallet?":"确定要删除这钱包？","Auditable":"可审核","Available Balance":"可用余额","Average confirmation time: {{fee.nbBlocks * 10}} minutes":"平均确认时间: {{fee.nbBlocks * 10}} 分钟","Back":"返回","Backup":"备份","Backup failed":"备份失败","Backup Needed":"需要备份","Backup now":"现在备份","Bad wallet invitation":"坏钱包邀请","Balance By Address":"地址余额","Before receiving funds, you must backup your wallet. If this device is lost, it is impossible to access your funds without a backup.":"接收资金前, 务必备份你的钱包。如果你遗失此设备，就无法在没有备份的情况下找回资金。","BETA: Android Key Derivation Test:":"BETA: Android 密钥衍生测试︰","BIP32 path for address derivation":"BIP32 路径的地址衍生","Bitcoin address":"比特币地址","Bitcoin Network Fee Policy":"比特币网络手续费策略","Bitcoin transactions may include a fee collected by miners on the network. The higher the fee, the greater the incentive a miner has to include that transaction in a block. Current fees are determined based on network load and the selected policy.":"比特币交易可能包括网络矿工所收取的费用。收费越高，交易数据块包含矿工的奖励也越大。当前收费的确定取决于网络负载和所选定的策略。","Bitcoin URI is NOT valid!":"比特币 URI 无效！","Broadcast Payment":"广播支付","Broadcasting transaction":"正在广播交易","Browser unsupported":"浏览器不被支持","Calculating fee":"正在计算费用","Cancel":"取消","Cancel and delete the wallet":"取消并删除钱包","Cannot create transaction. Insufficient funds":"不能创建交易。资金不足","Cannot join the same wallet more that once":"无法重复加入同一个钱包","Cannot sign: The payment request has expired":"无法签名︰支付请求已过期","Certified by":"通过认证：","Changing wallet alias only affects the local wallet name.":"更改钱包别名只会影响本地钱包名称。","Chinese":"中文","Choose a backup file from your computer":"从你的计算机选择一个备份文件","Clear cache":"清空缓存","Close":"关闭","Color":"颜色","Comment":"评论","Commit hash":"提交哈希","Confirm":"确定","Confirm your wallet recovery phrase":"确认你的钱包恢复短语","Confirmations":"确认","Congratulations!":"恭喜！","Connecting to Coinbase...":"正在连接 Coinbase...","Connecting to Glidera...":"正在连接 Glidera...","Connection reset by peer":"连接被对方重置","Continue":"继续","Copayer already in this wallet":"Copayer 已经在这个钱包里","Copayer already voted on this spend proposal":"Copayer 已经表决此花费提议","Copayer data mismatch":"Copayer 的数据不匹配","Copayers":"Copayers","Copied to clipboard":"已复制到剪贴板","Copy this text as it is to a safe place (notepad or email)":"将此文本复制到一个安全的地方（记事本或电子邮件）","Copy to clipboard":"复制到剪贴板","Could not access the wallet at the server. Please check:":"无法访问服务器上的钱包。请确认︰","Could not access wallet":"无法访问钱包","Could not access Wallet Service: Not found":"不能访问 Wallet Service︰ 找不到","Could not broadcast payment":"无法广播支付","Could not build transaction":"无法建立交易","Could not create address":"无法创建地址","Could not create payment proposal":"无法创建支付提议","Could not create using the specified extended private key":"无法使用指定的扩展私人密钥创建","Could not create using the specified extended public key":"无法使用指定的扩展的公钥创建","Could not create: Invalid wallet recovery phrase":"无法创建 ︰ 无效的钱包恢复短语","Could not decrypt file, check your password":"无法解密文件，请检查你的密码","Could not delete payment proposal":"无法删除支付提议","Could not fetch payment information":"无法获取支付信息","Could not get fee value":"无法获取手续费率","Could not import":"无法导入","Could not import. Check input file and spending password":"无法导入。请检查输入文件和支付密码","Could not join wallet":"无法加入钱包","Could not recognize a valid Bitcoin QR Code":"无法识别有效的比特币 QR 代码","Could not reject payment":"无法拒绝支付","Could not send payment":"无法发送支付","Could not update Wallet":"无法更新钱包","Create":"创建","Create {{requiredCopayers}}-of-{{totalCopayers}} wallet":"创建{{totalCopayers}}-的-{{requiredCopayers}} 的钱包","Create new wallet":"创建新钱包","Create, join or import":"创建、 加入或导入","Created by":"创建者:","Creating transaction":"正在创建交易","Creating Wallet...":"正在创建钱包...","Current fee rate for this policy: {{fee.feePerKBUnit}}/kiB":"此策略的当前收费率︰{{fee.feePerKBUnit}}/kiB","Czech":"捷克文","Date":"日期","Decrypting a paper wallet could take around 5 minutes on this device. please be patient and keep the app open.":"在此设备上解密纸钱包可能需要大约 5 分钟。请耐心等候并保持程序开着。","Delete it and create a new one":"删除并创建新的","Delete Payment Proposal":"删除支付提议","Delete recovery phrase":"删除恢复短语","Delete Recovery Phrase":"删除恢复短语","Delete wallet":"删除钱包","Delete Wallet":"删除钱包","Deleting Wallet...":"正在删除钱包...","Derivation Path":"衍生路径","Derivation Strategy":"衍生策略","Description":"说明","Details":"详细信息","Disabled":"未启用","Do not include private key":"不包括私钥","Don't see your language on Crowdin? Contact the Owner on Crowdin! We'd love to support your language.":"在 Crowdin 找不到你的语言？请联系 Crowdin 的所有者！我们很乐意支持你的语言。","Done":"完成","Download":"下载","Economy":"经济","Edit":"编辑","Edit comment":"编辑评论","Edited by":"编辑者：","Email for wallet notifications":"发送钱包通知到邮箱","Email Notifications":"邮箱通知","Empty addresses limit reached. New addresses cannot be generated.":"已达到空地址限制。无法生成新的地址。","Enable Coinbase Service":"启用 Coinbase 服务","Enable Glidera Service":"启用 Glidera 服务","Enable push notifications":"启用推式通知","Encrypted export file saved":"已保存加密的导出文件","Enter the recovery phrase (BIP39)":"输入恢复短语 (BIP39)","Enter your password":"请输入你的密码","Enter your spending password":"输入你的支付密码","Error at Wallet Service":"Wallet Service 出现错误","Error creating wallet":"创建钱包时出现错误","Expired":"已过期","Expires":"到期","Export options":"导出选项","Export to file":"导出到文件","Export Wallet":"导出钱包","Exporting via QR not supported for this wallet":"此钱包不支持通过 QR 的导出","Extended Public Keys":"扩展的公钥","Extracting Wallet Information...":"正在获取钱包信息...","Failed to export":"导出失败","Failed to verify backup. Please check your information":"验证备份失败。请检查你的信息","Family vacation funds":"家庭度假资金","Fee":"费用","Fetching Payment Information":"获取支付信息","File/Text":"文件/文本","Finger Scan Failed":"指纹扫描失败","Finish":"完成","For audit purposes":"供审计目的","French":"法语","From the destination device, go to Add wallet &gt; Import wallet and scan this QR code":"从目标设备，请到添加钱包 &gt; 导入钱包和扫描此 QR 代码","Funds are locked by pending spend proposals":"资金由未决的花费提议锁定","Funds found":"找到资金","Funds received":"收到的资金","Funds will be transferred to":"资金将会转移到","Generate new address":"生成新的地址","Generate QR Code":"生成 QR 码","Generating .csv file...":"正在生成 .csv 文件...","German":"德语","Getting address for wallet {{selectedWalletName}} ...":"获取{{selectedWalletName}} 钱包的地址...","Global preferences":"全局首选项","Hardware wallet":"硬件钱包","Hardware Wallet":"硬件钱包","Hide advanced options":"隐藏高级选项","I affirm that I have read, understood, and agree with these terms.":"我确定已阅读、理解并同意这些条款。","I AGREE. GET STARTED":"我同意。现即开始","Import":"导入","Import backup":"导入备份","Import wallet":"导入钱包","Importing Wallet...":"正在导入钱包...","In no event shall the authors of the software, employees and affiliates of Bitpay, copyright holders, or BitPay, Inc. be held liable for any claim, damages or other liability, whether in an action of contract, tort, or otherwise, arising from, out of or in connection with the software.":"在任何情况下，软件作者、Bitpay 的员工及附属公司、版权持有人或 BitPay，Inc. 均不对由软件引起，与软件有关联或无关联，所任何索赔、损害或其他责任，无论是合同诉讼、侵权行为或其他，产生从本合同或与本软件有关。","In order to verify your wallet backup, please type your password:":"为了验证你的钱包备份，请键入你的密码：","Incorrect address network":"地址网络不正确","Incorrect code format":"代码格式不正确","Insufficient funds":"资金不足","Insufficient funds for fee":"费用的资金不足","Invalid":"无效","Invalid account number":"帐户号无效","Invalid address":"地址无效","Invalid derivation path":"衍生路径无效","Invitation to share a Copay Wallet":"邀请分享 Copay 钱包","Italian":"義大利文","Japanese":"日语","John":"John","Join":"加入","Join my Copay wallet. Here is the invitation code: {{secret}} You can download Copay for your phone or desktop at https://copay.io":"加入我的 Copay 钱包。这是邀请码 ︰ {{secret}} 你可以在 https://copay.io 下载 Copay 到你的手机或桌式电脑","Join shared wallet":"加入共享钱包","Joining Wallet...":"正在加入钱包...","Key already associated with an existing wallet":"钥已经关联现有的钱包","Label":"标签","Language":"语言","Last Wallet Addresses":"最后的钱包地址","Learn more about Copay backups":"了解更多关于 Copay 备份","Loading...":"正在加载...","locked by pending payments":"被未决支付锁定","Locktime in effect. Please wait to create a new spend proposal":"Locktime 在进行中。请稍等以创建新的花费提议","Locktime in effect. Please wait to remove this spend proposal":"Locktime 在进行中。请稍等以删除花费提议","Make a payment to":"支付给","Matches:":"匹配：","me":"我","Me":"我","Memo":"便签","Merchant message":"商家的消息","Message":"信息","Missing parameter":"缺失参数","Missing private keys to sign":"遗失需要签名的私钥","Moved":"已调动","Multiple recipients":"多个接收者","My Bitcoin address":"我的比特币地址","My contacts":"我的联系人","My wallets":"我的钱包","Need to do backup":"需要做备份","Network":"网络","Network connection error":"网络连接错误","New Payment Proposal":"新的支付提议","New Random Recovery Phrase":"新的随机恢复短语","No hardware wallets supported on this device":"此设备不支持硬件钱包","No transactions yet":"没有交易记录","Normal":"常规","Not authorized":"尚未授权","Not completed":"未完成","Not enough funds for fee":"费用的资金不足","Not valid":"无效","Note":"备注","Note: a total of {{amountAboveMaxSizeStr}} were excluded. The maximum size allowed for a transaction was exceeded":"备注︰共有{{amountAboveMaxSizeStr}} 被排除了。超出了交易允许的最大体积","Note: a total of {{amountBelowFeeStr}} were excluded. These funds come from UTXOs smaller than the network fee provided.":"备注：共有{{amountBelowFeeStr}} 被排除了。这些来自 UTXOs 的资金小于提供的网络费用。","NOTE: To import a wallet from a 3rd party software, please go to Add Wallet &gt; Create Wallet, and specify the Recovery Phrase there.":"注意︰欲从第三方软件导入钱包，请到添加钱包 &gt; 创建钱包，并指定恢复短语。","Official English Disclaimer":"官方英文免责声明","OKAY":"OKAY","Once you have copied your wallet recovery phrase down, it is recommended to delete it from this device.":"一旦抄下你的钱包恢复短语，建议从此设备上删除。","Only Main (not change) addresses are shown. The addresses on this list were not verified locally at this time.":"只显示主要（不改变）的地址。这个时候不本地验证此列表上的地址。","Open Settings app":"打开设置应用","optional":"可选","Paper Wallet Private Key":"纸钱包私钥","Participants":"参与者","Passphrase":"密码短语","Password":"密码","Password required. Make sure to enter your password in advanced options":"需要密码。请务必在高级选项中输入你的密码","Paste invitation here":"在此粘贴邀请","Paste the backup plain text code":"粘贴备份的纯文本代码","Paste your paper wallet private key here":"在此粘贴你的纸钱包私钥","Pasted from clipboard":"自剪贴板粘贴","Pay To":"支付给","Payment Accepted":"已接受支付","Payment accepted, but not yet broadcasted":"支付已被接受，但尚未广播","Payment accepted. It will be broadcasted by Glidera. In case there is a problem, it can be deleted 6 hours after it was created.":"支付以被接受。它将由 Glidera 广播。如果出现问题，它可以在创建后的 6 个小时内删除。","Payment details":"支付明细","Payment expires":"支付期满","Payment Proposal":"支付提议","Payment Proposal Created":"支付提议已创建","Payment Proposal Rejected":"支付提议已被拒绝","Payment Proposal Rejected by Copayer":"支付提议已被 Copayer 拒绝","Payment Proposal Signed by Copayer":"支付提议已获 Copayer 签名","Payment Proposals":"支付提议","Payment Protocol Invalid":"支付协议无效","Payment Protocol not supported on Chrome App":"支付协议不支持 Chrome 应用程序","Payment Rejected":"支付被拒绝","Payment request":"支付请求","Payment Sent":"支付已发送","Payment to":"支付给","Pending Confirmation":"待确认","Permanently delete this wallet. THIS ACTION CANNOT BE REVERSED":"永久删除这个钱包。此操作无法撤消","Personal Wallet":"个人钱包","Please enter the recovery phrase":"请输入恢复短语","Please enter the required fields":"请输入必须填写的信息","Please enter the wallet recovery phrase":"请输入钱包恢复短语","Please tap the words in order to confirm your backup phrase is correctly written.":"请按顺序点击词句，以确认你的备份短语填写正确。","Please upgrade Copay to perform this action":"请升级 Copay 以执行此操作","Please wait to be redirected...":"请等待重新定向...","Please, select your backup file":"请选择你的备份文件","Polish":"波兰文","Preferences":"偏好","Preparing backup...":"正在准备备份...","preparing...":"准备中...","Press again to exit":"再按一次退出","Priority":"优先","Private key is encrypted, cannot sign":"私钥已加密，无法签名","Push notifications for Copay are currently disabled. Enable them in the Settings app.":"Copay 的推式通知目前未启用。请在设置应用里启用它。","QR Code":"QR 码","QR-Scanner":"QR-扫描仪","Receive":"接收","Received":"已接收","Recipients":"接收者","Recovery Phrase":"恢复短语","Recovery phrase deleted":"恢复短语已删除","Recreate":"重新创建","Recreating Wallet...":"正在重新创建的钱包...","Reject":"拒絕","Release Information":"发布信息","Remove":"移除","Repeat password":"重复输入密码","Repeat the password":"重复密码","Repeat the spending password":"重复支付密码","Request a specific amount":"请求特定数额","Request Spending Password":"请求支付密码","Required":"必需","Required number of signatures":"所需的签名数","Retrieving inputs information":"正在获取输入的信息。","Russian":"俄语","Save":"保存","Scan addresses for funds":"扫描资金的地址","Scan Fingerprint":"扫描指纹","Scan Finished":"扫描完成","Scan status finished with error":"扫描完成，出现错误","Scan Wallet Funds":"扫描钱包资金","Scan your fingerprint please":"请扫描你的指纹","Scanning Wallet funds...":"正在扫描钱包资金...","Search transactions":"搜索交易","Search Transactions":"搜索交易","Security preferences":"安全首选项","See it on the blockchain":"在区块链查看","Select a backup file":"选择备份文件","Select a wallet":"选择钱包","Self-signed Certificate":"自签名证书","Send":"发送","Send addresses by email":"通过电邮发送地址","Send bitcoin":"发送比特币","Send by email":"通过电邮发送","Send Max":"发送最大","Sending":"正在发送","Sending transaction":"正在发送交易","Sent":"已发送","Server response could not be verified":"无法验证服务器响应","Session log":"会话日志","SET":"设置","Set default url":"设置默认的 url","Set up a password":"设置密码","Set up a spending password":"设置支付密码","Setting up email notifications could weaken your privacy, if the wallet service provider is compromised. Information available to an attacker would include your wallet addresses and its balance, but no more.":"设置电邮通知可能会削弱你的隐私，如果钱包服务提供商受到损害。攻击者可能获得的信息包括你的钱包地址及其结余，可仅此而已。","Settings":"设置","Share address":"共享地址","Share invitation":"共享邀请","Share this invitation with your copayers":"将此邀请与你的 copayers 共享","Share this wallet address to receive payments":"分享此钱包地址，以接收付款","Share this wallet address to receive payments. To protect your privacy, new addresses are generated automatically once you use them.":"共享此钱包地址，以便接收支付。为了保护你的隐私，一旦你使用它们，新地址将自动生成。","Shared Wallet":"共享的钱包","Show advanced options":"显示高级选项","Signatures rejected by server":"签名被服务器拒绝","Signing transaction":"签名交易","Single Address Wallet":"单一地址钱包","Spanish":"西班牙语","Specify Recovery Phrase...":"指定恢复短语......","Spend proposal is not accepted":"花费提议不被接受","Spend proposal not found":"找不到花费提议","Spending Password needed":"需要支付密码","Spending Passwords do not match":"支付密码不匹配","Success":"成功","Super Economy":"超级经济","Sweep paper wallet":"Sweep 纸钱包","Sweep Wallet":"Sweep 钱包","Sweeping Wallet...":"正在导出钱包","Tap and hold to show":"点击并按住以显示","Tap to retry":"点击以重试","Terms of Use":"使用条款","The authors of the software, employees and affiliates of Bitpay, copyright holders, and BitPay, Inc. cannot retrieve your private keys or passwords if you lose or forget them and cannot guarantee transaction confirmation as they do not have control over the Bitcoin network.":"如果你遗失或忘记私钥或密码，软件作者、Bitpay 的员工及附属公司、版权持有人或 BitPay，Inc. 均无法取回你的私钥或密码，由于他们没有比特币网络的管理权，他们并不能保证交易确认。","The derivation path":"衍生路径","The Ledger Chrome application is not installed":"Ledger Chrome 应用程序未安装","The password of the recovery phrase (if set)":"恢复短语的密码 (如已设置)","The payment was created but could not be completed. Please try again from home screen":"支付已创建，但无法完成。请从首页再试一次","The payment was removed by creator":"支付已被创建者移除","The recovery phrase could require a password to be imported":"恢复短语需要密码才能导入","The request could not be understood by the server":"服务器不理解此请求","The software does not constitute an account where BitPay or other third parties serve as financial intermediaries or custodians of your bitcoin.":"此软件并不构成一个账户，让 BitPay 或其他第三方作为金融中介机构或保管人以保管你的比特币。","The software you are about to use functions as a free, open source, and multi-signature digital wallet.":"你将使用的软件是一个免费、开放源代码和多重签名的数字钱包。","The spend proposal is not pending":"花费提议不是未决","The wallet \"{{walletName}}\" was deleted":"\"{{walletName}}\"钱包已删除","The Wallet Recovery Phrase could require a password to be imported":"钱包恢复短语需要密码才能导入","The wallet service URL":"钱包服务 URL","There are no wallets to make this payment":"没有钱包以进行此支付","There is a new version of Copay. Please update":"Copay 有新版本。请更新","There is an error in the form":"表格中有错误","This recovery phrase was created with a password. To recover this wallet both the recovery phrase and password are needed.":"此恢复短语是用密码创建。为了恢复此钱包，需要恢复短语和密码。","This transaction has become invalid; possibly due to a double spend attempt.":"此交易已无效; 可能是双花尝试导致。","This wallet is not registered at the given Bitcore Wallet Service (BWS). You can recreate it from the local information.":"此钱包不在给定的 Bitcore Wallet Service (BWS) 注册。你可以从本地信息重新创建它。","Time":"时间","To":"发送到","To restore this {{index.m}}-{{index.n}} <b>shared</b> wallet you will need":"要恢复此 {{index.m}}{{index.n}} <b>共享</b> 钱包，你需要","To the fullest extent permitted by law, this software is provided “as is” and no representations or warranties can be made of any kind, express or implied, including but not limited to the warranties of merchantability, fitness or a particular purpose and noninfringement.":"在法律允许的最大范围内，本软件“按原样”提供，不提供任何形式、明示 或暗示的担保或陈述，包括但不是限于商品适销性，针对特定目的的适用性或非侵害性的保证。","too long!":"太长了 ！","Total Locked Balance":"锁定结余的总额","Total number of copayers":"Copayers 的总数","Touch ID Failed":"触摸 ID 失败","Transaction":"交易","Transaction already broadcasted":"交易已经广播","Transaction History":"交易历史记录","Translation Credits":"翻译志愿者","Translators":"翻译者","Try again":"重新尝试","Type the Recovery Phrase (usually 12 words)":"键入恢复短语 （通常 12 个字）","Unconfirmed":"未确认","Unit":"单位","Unsent transactions":"未发送的交易","Updating transaction history. Please stand by.":"更新交易历史记录。请等待。","Updating Wallet...":"正在更新钱包...","Use Unconfirmed Funds":"使用未经确认的资金","Validating recovery phrase...":"正在验证恢复短语。。。","Validating wallet integrity...":"正在验证钱包完整性。。。","Version":"版本","View":"查看","Waiting for copayers":"正在等待 copayers","Waiting for Ledger...":"正在等待 Ledger...","Waiting for Trezor...":"正在等待 Trezor...","Waiting...":"等待中...","Wallet already exists":"钱包已存在","Wallet already in Copay":"钱包已经在 Copay","Wallet Configuration (m-n)":"钱包配置 (m n)","Wallet Export":"钱包导出","Wallet Id":"钱包 Id","Wallet incomplete and broken":"钱包不完整和损坏","Wallet Information":"钱包信息","Wallet Invitation":"钱包邀请","Wallet Invitation is not valid!":"钱包邀请无效！","Wallet is full":"钱包已满","Wallet is locked":"钱包被锁定","Wallet is not complete":"钱包不完整","Wallet name":"钱包名称","Wallet Name (at creation)":"钱包名称（在创建时）","Wallet needs backup":"钱包需要备份","Wallet Network":"钱包网","Wallet not found":"找不到钱包","Wallet not registered at the wallet service. Recreate it from \"Create Wallet\" using \"Advanced Options\" to set your recovery phrase":"钱包不在 Wallet Service 注册。使用“创建钱包\"的\"高级选项\"设置你的恢复短语以重新创建它","Wallet Preferences":"钱包首选项","Wallet Recovery Phrase":"钱包恢复短语","Wallet Recovery Phrase is invalid":"无效的钱包恢复短语","Wallet recovery phrase not available. You can still export it from Advanced &gt; Export.":"没有可用的钱包恢复短语。你仍然可以从 Advanced &gt; Export 中导出。","Wallet service not found":"找不到 Wallet Service","WARNING: Key derivation is not working on this device/wallet. Actions cannot be performed on this wallet.":"警告︰此设备/钱包无法运行钥匙衍生。无法在此钱包上执行操作。","WARNING: Not including the private key allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.":"警告︰不包括私钥，以检查钱包余额、交易历史记录，及从导出创建开销提议。可是，不允许批准（签名）提议，因此 <b>资金将无法从导出访问</b>。","WARNING: The password cannot be recovered. <b>Be sure to write it down</b>. The wallet can not be restored without the password.":"警告︰密码不能恢复。<b>必须要把它抄写下来</b>。如果没有密码，钱包无法恢复。","WARNING: The private key of this wallet is not available. The export allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.":"警告︰此钱包没有可用的私钥。导出可以检查钱包余额、交易历史记录，及从导出创建开销提议。可是，不允许批准（签名）提议，因此 <b>资金将无法从导出访问</b>。","Warning: this transaction has unconfirmed inputs":"警告︰此交易有未经确认的输入","WARNING: UNTRUSTED CERTIFICATE":"警告︰不受信任的证书","WARNING: Wallet not registered":"警告 ︰ 钱包没有注册","Warning!":"警告！​​​​​","We reserve the right to modify this disclaimer from time to time.":"我们保留权利以修改此免责声明。","WELCOME TO COPAY":"欢迎使用 COPAY","While the software has undergone beta testing and continues to be improved by feedback from the open-source user and developer community, we cannot guarantee that there will be no bugs in the software.":"虽然软件经历了 beta 测试，并持续获得开源用户和开发者社区的反馈而改进，我们无法保证软件没有错误。","Write your wallet recovery phrase":"抄写下你的钱包恢复短语","Wrong number of recovery words:":"恢复词句数不正确：","Wrong spending password":"支付密码错误","Yes":"是","You acknowledge that your use of this software is at your own discretion and in compliance with all applicable laws.":"你承认和同意使用此软件是你自己的判断，并遵守所有适用法律。","You are responsible for safekeeping your passwords, private key pairs, PINs and any other codes you use to access the software.":"你有责任保管你的密码、私钥对，PINs 及你用以访问软件的任何其他代码。","You assume any and all risks associated with the use of the software.":"你承担使用本软件的任何和所有相关风险。","You backed up your wallet. You can now restore this wallet at any time.":"你已备份了钱包。你现在可以在任何时候复原此钱包。","You can safely install your wallet on another device and use it from multiple devices at the same time.":"你可以安全地在另一台设备上安装你的钱包,并同时在多个设备上使用。","You do not have any wallet":"你没有任何钱包","You need the wallet recovery phrase to restore this personal wallet. Write it down and keep them somewhere safe.":"你需要钱包恢复短语以恢复此个人钱包。把它抄写下来，并存放在安全的地方。","Your nickname":"你的昵称","Your password":"你的密码","Your spending password":"你的支付密码","Your wallet has been imported correctly":"你的钱包已正确导入","Your wallet key will be encrypted. The Spending Password cannot be recovered. Be sure to write it down":"你的钱包钥匙将被加密。支付密码不能恢复。必须把它抄写下来","Your wallet recovery phrase and access to the server that coordinated the initial wallet creation. You still need {{index.m}} keys to spend.":"你的钱包恢复短语及访问协调初始钱包创建的服务器。你仍然需要 {{index.m}} 钥匙来支付。"});
/* jshint +W100 */
}]);
window.version="0.14.0";
window.commitHash="22ec924";
window.appConfig={"//":"        Modify it at app-template/","packageName":"bitpay","packageDescription":"Secure Bitcoin Wallet","userVisibleName":"BitPay","purposeLine":"Secure Bitcoin Wallet","bundleName":"wallet","appUri":"bitpay","name":"bitpay","nameNoSpace":"bitpay","nameCase":"BitPay","nameCaseNoSpace":"BitPay","gitHubRepoName":"bitpay-wallet","disclaimerUrl":"","url":"https://bitpay.com","appDescription":"Secure Bitcoin Storage","winAppName":"BitPayWallet","wpPublisherId":"{}","wpProductId":"{}","pushSenderId":"1036948132229","description":"Secure Bitcoin Storage","version":"0.14.0","androidVersion":"1","_extraCSS":null,"_enabledExtensions":{"coinbase":true,"glidera":true,"debitcard":true,"amazon":true}};
window.externalServices={};
'use strict';

angular.element(document).ready(function() {

  // Run copayApp after device is ready.
  var startAngular = function() {
    angular.bootstrap(document, ['copayApp']);
  };


  function handleOpenURL(url) {
    if ('cordova' in window) {
      console.log('DEEP LINK:' + url);
      cordova.fireDocumentEvent('handleopenurl', {
        url: url
      });
    } else {
      console.log("ERROR: Cannont handle open URL in non-cordova apps")
    }
  };

  /* Cordova specific Init */
  if ('cordova' in window) {

    window.handleOpenURL = handleOpenURL;


    document.addEventListener('deviceready', function() {

      window.open = cordova.InAppBrowser.open;

      // Create a sticky event for handling the app being opened via a custom URL
      cordova.addStickyDocumentEventHandler('handleopenurl');
      startAngular();
    }, false);

  } else {
    startAngular();
  }

});

window.TREZOR_CHROME_URL = './bower_components/trezor-connect/chrome/wrapper.html';


this.TrezorConnect = (function () {
    'use strict';

    var chrome = window.chrome;
    var IS_CHROME_APP = chrome && chrome.app && chrome.app.window;

    var ERR_TIMED_OUT = 'Loading timed out';
    var ERR_WINDOW_CLOSED = 'Window closed';
    var ERR_WINDOW_BLOCKED = 'Window blocked';
    var ERR_ALREADY_WAITING = 'Already waiting for a response';
    var ERR_CHROME_NOT_CONNECTED = 'Internal Chrome popup is not responding.';

    var DISABLE_LOGIN_BUTTONS = window.TREZOR_DISABLE_LOGIN_BUTTONS || false;
    var CHROME_URL = window.TREZOR_CHROME_URL || './chrome/wrapper.html';
    var POPUP_URL = window.TREZOR_POPUP_URL || 'https://trezor.github.io/connect/popup/popup.html';
    var POPUP_PATH = window.TREZOR_POPUP_PATH || 'https://trezor.github.io/connect/';
    var POPUP_ORIGIN = window.TREZOR_POPUP_ORIGIN || 'https://trezor.github.io';

    var POPUP_INIT_TIMEOUT = 15000;

    /**
     * Public API.
     */
    function TrezorConnect() {

        var manager = new PopupManager();

        /**
         * Popup errors.
         */
        this.ERR_TIMED_OUT = ERR_TIMED_OUT;
        this.ERR_WINDOW_CLOSED = ERR_WINDOW_CLOSED;
        this.ERR_WINDOW_BLOCKED = ERR_WINDOW_BLOCKED;
        this.ERR_ALREADY_WAITING = ERR_ALREADY_WAITING;
        this.ERR_CHROME_NOT_CONNECTED = ERR_CHROME_NOT_CONNECTED;

        /**
         * @param {boolean} value
         */
        this.closeAfterSuccess = function (value) { manager.closeAfterSuccess = value; };

        /**
         * @param {boolean} value
         */
        this.closeAfterFailure = function (value) { manager.closeAfterFailure = value; };

        /**
         * @typedef XPubKeyResult
         * @param {boolean} success
         * @param {?string} error
         * @param {?string} xpubkey  serialized extended public key
         * @param {?string} path     BIP32 serializd path of the key
         */

        /**
         * Load BIP32 extended public key by path.
         *
         * Path can be specified either in the string form ("m/44'/1/0") or as
         * raw integer array. In case you omit the path, user is asked to select
         * a BIP32 account to export, and the result contains m/44'/0'/x' node
         * of the account.
         *
         * @param {?(string|array<number>)} path
         * @param {function(XPubKeyResult)} callback
         */
        this.getXPubKey = function (path, callback) {
            if (typeof path === 'string') {
                path = parseHDPath(path);
            }
            manager.sendWithChannel({
                type: 'xpubkey',
                path: path
            }, callback);
        };

        /**
         * @typedef SignTxResult
         * @param {boolean} success
         * @param {?string} error
         * @param {?string} serialized_tx      serialized tx, in hex, including signatures
         * @param {?array<string>} signatures  array of input signatures, in hex
         */

        /**
         * Sign a transaction in the device and return both serialized
         * transaction and the signatures.
         *
         * @param {array<TxInputType>} inputs
         * @param {array<TxOutputType>} outputs
         * @param {function(SignTxResult)} callback
         *
         * @see https://github.com/trezor/trezor-common/blob/master/protob/types.proto
         */
        this.signTx = function (inputs, outputs, callback) {
            manager.sendWithChannel({
                type: 'signtx',
                inputs: inputs,
                outputs: outputs
            }, callback);
        };

        /**
         * @typedef TxRecipient
         * @param {number} amount   the amount to send, in satoshis
         * @param {string} address  the address of the recipient
         */

        /**
         * Compose a transaction by doing BIP-0044 discovery, letting the user
         * select an account, and picking UTXO by internal preferences.
         * Transaction is then signed and returned in the same format as
         * `signTx`.  Only supports BIP-0044 accounts (single-signature).
         *
         * @param {array<TxRecipient>} recipients
         * @param {function(SignTxResult)} callback
         */
        this.composeAndSignTx = function (recipients, callback) {
            manager.sendWithChannel({
                type: 'composetx',
                recipients: recipients
            }, callback);
        };

        /**
         * @typedef RequestLoginResult
         * @param {boolean} success
         * @param {?string} error
         * @param {?string} public_key  public key used for signing, in hex
         * @param {?string} signature   signature, in hex
         */

        /**
         * Sign a login challenge for active origin.
         *
         * @param {?string} hosticon
         * @param {string} challenge_hidden
         * @param {string} challenge_visual
         * @param {string|function(RequestLoginResult)} callback
         *
         * @see https://github.com/trezor/trezor-common/blob/master/protob/messages.proto
         */
        this.requestLogin = function (
            hosticon,
            challenge_hidden,
            challenge_visual,
            callback
        ) {
            if (typeof callback === 'string') {
                // special case for a login through <trezor:login> button.
                // `callback` is name of global var
                callback = window[callback];
            }
            if (!callback) {
                throw new TypeError('TrezorConnect: login callback not found');
            }
            manager.sendWithChannel({
                type: 'login',
                icon: hosticon,
                challenge_hidden: challenge_hidden,
                challenge_visual: challenge_visual
            }, callback);
        };

        var LOGIN_CSS =
            '<style>@import url("@connect_path@/login_buttons.css")</style>';

        var LOGIN_ONCLICK =
            'TrezorConnect.requestLogin('
            + "'@hosticon@','@challenge_hidden@','@challenge_visual@','@callback@'"
            + ')';

        var LOGIN_HTML =
            '<div id="trezorconnect-wrapper">'
            + '  <a id="trezorconnect-button" onclick="' + LOGIN_ONCLICK + '">'
            + '    <span id="trezorconnect-icon"></span>'
            + '    <span id="trezorconnect-text">@text@</span>'
            + '  </a>'
            + '  <span id="trezorconnect-info">'
            + '    <a id="trezorconnect-infolink" href="https://www.buytrezor.com/"'
            + '       target="_blank">What is TREZOR?</a>'
            + '  </span>'
            + '</div>';

        /**
         * Find <trezor:login> elements and replace them with login buttons.
         * It's not required to use these special elements, feel free to call
         * `TrezorConnect.requestLogin` directly.
         */
        this.renderLoginButtons = function () {
            var elements = document.getElementsByTagName('trezor:login');

            for (var i = 0; i < elements.length; i++) {
                var e = elements[i];
                var text = e.getAttribute('text') || 'Sign in with TREZOR';
                var callback = e.getAttribute('callback') || '';
                var hosticon = e.getAttribute('icon') || '';
                var challenge_hidden = e.getAttribute('challenge_hidden') || '';
                var challenge_visual = e.getAttribute('challenge_visual') || '';

                // it's not valid to put markup into attributes, so let users
                // supply a raw text and make TREZOR bold
                text = text.replace('TREZOR', '<strong>TREZOR</strong>');

                e.parentNode.innerHTML =
                    (LOGIN_CSS + LOGIN_HTML)
                    .replace('@text@', text)
                    .replace('@callback@', callback)
                    .replace('@hosticon@', hosticon)
                    .replace('@challenge_hidden@', challenge_hidden)
                    .replace('@challenge_visual@', challenge_visual)
                    .replace('@connect_path@', POPUP_PATH);
            }
        };
    }

    /*
     * `getXPubKey()`
     */

    function parseHDPath(string) {
        return string
            .toLowerCase()
            .split('/')
            .filter(function (p) { return p !== 'm'; })
            .map(function (p) {
                var n = parseInt(p);
                if (p[p.length - 1] === "'") { // hardened index
                    n = n | 0x80000000;
                }
                return n;
            });
    }

    /*
     * Popup management
     */

    function ChromePopup(url, name, width, height) {
        var left = (screen.width - width) / 2;
        var top = (screen.height - height) / 2;
        var opts = {
            id: name,
            innerBounds: {
                width: width,
                height: height,
                left: left,
                top: top
            }
        };

        var closed = function () {
            if (this.onclose) {
                this.onclose(false); // never report as blocked
            }
        }.bind(this);

        var opened = function (w) {
            this.window = w;
            this.window.onClosed.addListener(closed);
        }.bind(this);

        chrome.app.window.create(url, opts, opened);

        this.name = name;
        this.window = null;
        this.onclose = null;
    }

    function ChromeChannel(popup, waiting) {
        var port = null;

        var respond = function (data) {
            if (waiting) {
                var w = waiting;
                waiting = null;
                w(data);
            }
        };

        var setup = function (p) {
            if (p.name === popup.name) {
                port = p;
                port.onMessage.addListener(respond);
                chrome.runtime.onConnect.removeListener(setup);
            }
        };

        chrome.runtime.onConnect.addListener(setup);

        this.respond = respond;

        this.close = function () {
            chrome.runtime.onConnect.removeListener(setup);
            port.onMessage.removeListener(respond);
            port.disconnect();
            port = null;
        };

        this.send = function (value, callback) {
            if (waiting === null) {
                waiting = callback;

                if (port) {
                    port.postMessage(value);
                } else {
                    throw new Error(ERR_CHROME_NOT_CONNECTED);
                }
            } else {
                throw new Error(ERR_ALREADY_WAITING);
            }
        };
    }

    function Popup(url, origin, name, width, height) {
        var left = (screen.width - width) / 2;
        var top = (screen.height - height) / 2;
        var opts =
            'width=' + width +
            ',height=' + height +
            ',left=' + left +
            ',top=' + top +
            ',menubar=no' +
            ',toolbar=no' +
            ',location=no' +
            ',personalbar=no' +
            ',status=no';
        var w = window.open(url, name, opts);

        var interval;
        var blocked = w.closed;
        var iterate = function () {
            if (w.closed) {
                clearInterval(interval);
                if (this.onclose) {
                    this.onclose(blocked);
                }
            }
        }.bind(this);
        interval = setInterval(iterate, 100);

        this.window = w;
        this.origin = origin;
        this.onclose = null;
    }

    function Channel(popup, waiting) {

        var respond = function (data) {
            if (waiting) {
                var w = waiting;
                waiting = null;
                w(data);
            }
        };

        var receive = function (event) {
            if (event.source === popup.window && event.origin === popup.origin) {
                respond(event.data);
            }
        };

        window.addEventListener('message', receive);

        this.respond = respond;

        this.close = function () {
            window.removeEventListener('message', receive);
        };

        this.send = function (value, callback) {
            if (waiting === null) {
                waiting = callback;
                popup.window.postMessage(value, popup.origin);
            } else {
                throw new Error(ERR_ALREADY_WAITING);
            }
        };
    }

    function ConnectedChannel(p) {

        var ready = function () {
            clearTimeout(this.timeout);
            this.popup.onclose = null;
            this.ready = true;
            this.onready();
        }.bind(this);

        var closed = function (blocked) {
            clearTimeout(this.timeout);
            this.channel.close();
            if (blocked) {
                this.onerror(new Error(ERR_WINDOW_BLOCKED));
            } else {
                this.onerror(new Error(ERR_WINDOW_CLOSED));
            }
        }.bind(this);

        var timedout = function () {
            this.popup.onclose = null;
            if (this.popup.window) {
                this.popup.window.close();
            }
            this.channel.close();
            this.onerror(new Error(ERR_TIMED_OUT));
        }.bind(this);

        if (IS_CHROME_APP) {
            this.popup = new ChromePopup(p.chromeUrl, p.name, p.width, p.height);
            this.channel = new ChromeChannel(this.popup, ready);
        } else {
            this.popup = new Popup(p.url, p.origin, p.name, p.width, p.height);
            this.channel = new Channel(this.popup, ready);
        }

        this.timeout = setTimeout(timedout, POPUP_INIT_TIMEOUT);

        this.popup.onclose = closed;

        this.ready = false;
        this.onready = null;
        this.onerror = null;
    }

    function PopupManager() {
        var cc = null;

        var closed = function () {
            cc.channel.respond(new Error(ERR_WINDOW_CLOSED));
            cc.channel.close();
            cc = null;
        };

        var open = function (callback) {
            cc = new ConnectedChannel({
                name: 'trezor-connect',
                width: 600,
                height: 500,
                origin: POPUP_ORIGIN,
                path: POPUP_PATH,
                url: POPUP_URL,
                chromeUrl: CHROME_URL
            });
            cc.onready = function () {
                cc.popup.onclose = closed;
                callback(cc.channel);
            };
            cc.onerror = function (error) {
                cc = null;
                callback(error);
            };
        }.bind(this);

        this.closeAfterSuccess = true;
        this.closeAfterFailure = true;

        this.close = function () {
            if (cc && cc.popup.window) {
                cc.popup.window.close();
            }
        };

        this.waitForChannel = function (callback) {
            if (cc) {
                if (cc.ready) {
                    callback(cc.channel);
                } else {
                    callback(new Error(ERR_ALREADY_WAITING));
                }
            } else {
                open(callback);
            }
        };

        this.sendWithChannel = function (message, callback) {

            var respond = function (response) {
                var succ = response.success && this.closeAfterSuccess;
                var fail = !response.success && this.closeAfterFailure;
                if (succ || fail) {
                    this.close();
                }
                callback(response);
            }.bind(this);

            var onresponse = function (response) {
                if (response instanceof Error) {
                    var error = response;
                    respond({ success: false, error: error.message });
                } else {
                    respond(response);
                }
            };

            var onchannel = function (channel) {
                if (channel instanceof Error) {
                    var error = channel;
                    respond({ success: false, error: error.message });
                } else {
                    channel.send(message, onresponse);
                }
            };

            this.waitForChannel(onchannel);
        };
    }

    var exports = new TrezorConnect();

    if (!IS_CHROME_APP && !DISABLE_LOGIN_BUTTONS) {
        exports.renderLoginButtons();
    }

    return exports;

}());
