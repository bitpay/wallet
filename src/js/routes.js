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
    $ionicConfigProvider.views.swipeBackEnabled(false);

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

    .state('tabs.wallet', {
        url: '/wallet/{walletId}/{fromOnboarding}',
        views: {
          'tab-home@tabs': {
            controller: 'walletDetailsController',
            templateUrl: 'views/walletDetails.html'
          }
        }
      })
      .state('tabs.activity', {
        url: '/activity',
        views: {
          'tab-home@tabs': {
            controller: 'activityController',
            templateUrl: 'views/activity.html',
          }
        }
      })
      .state('tabs.proposals', {
        url: '/proposals',
        views: {
          'tab-home@tabs': {
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
      .state('tabs.scan', {
        url: '/scan',
        views: {
          'tab-scan': {
            controller: 'tabScanController',
            templateUrl: 'views/tab-scan.html',
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

    .state('tabs.notifications', {
        url: '/notifications',
        views: {
          'tab-settings@tabs': {
            controller: 'preferencesNotificationsController',
            templateUrl: 'views/preferencesNotifications.html'
          }
        }
      })
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
      .state('tabs.advanced', {
        url: '/advanced',
        views: {
          'tab-settings@tabs': {
            controller: 'advancedSettingsController',
            templateUrl: 'views/advancedSettings.html'
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
        url: '/disclaimer/:walletId/:backedUp',
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

      .state('tabs.bitpayCard', {
        url: '/bitpay-card',
        views: {
          'tab-home@tabs': {
            controller: 'bitpayCardController',
            controllerAs: 'bitpayCard',
            templateUrl: 'views/bitpayCard.html'
          }
        }
      })
      .state('tabs.bitpayCard.amount', {
        url: '/amount/:isCard/:toName',
        views: {
          'tab-home@tabs': {
            controller: 'amountController',
            templateUrl: 'views/amount.html'
          }
        }
      })
      .state('tabs.bitpayCard.confirm', {
        url: '/confirm/:isCard/:toAddress/:toName/:toAmount/:toEmail/:description/:paypro',
        views: {
          'tab-home@tabs': {
            controller: 'confirmController',
            templateUrl: 'views/confirm.html'
          }
        }
      })
      .state('tabs.bitpayCard.preferences', {
        url: '/preferences',
        views: {
          'tab-home@tabs': {
            templateUrl: 'views/preferencesBitpayCard.html'
          }
        }
      });
  })
  .run(function($rootScope, $state, $location, $log, $timeout, $ionicHistory, $ionicPlatform, lodash, platformInfo, profileService, uxLanguage, gettextCatalog, openURLService, storageService, scannerService) {

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
          scannerService.gentleInitialize();
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

      if (!toState.name.match(/onboarding/)) return;
      var state = {};
      state.name = toState.name;
      state.toParams = toParams;
      if (state.name != 'starting') storageService.setLastState(JSON.stringify(state), function() {});
    });
  });
