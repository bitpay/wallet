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
    $ionicConfigProvider.views.maxCache(0);

    // TABS BOTTOM
    $ionicConfigProvider.tabs.position('bottom');

    // NAV TITTLE CENTERED
    $ionicConfigProvider.navBar.alignTitle('center');

    // NAV BUTTONS ALIGMENT
    $ionicConfigProvider.navBar.positionPrimaryButtons('left');
    $ionicConfigProvider.navBar.positionSecondaryButtons('right');

    // NAV BACK-BUTTON TEXT/ICON
    $ionicConfigProvider.backButton.icon('ion-arrow-left-c').text('');
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
      templateUrl: 'views/starting.html'
    })

    .state('buyandsell', {
      url: '/buyandsell',
      templateUrl: 'views/buyandsell.html'
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
        templateUrl: 'views/glideraUri.html'
      })
      .state('uricoinbase', {
        url: '/uri-coinbase/:url',
        templateUrl: 'views/coinbaseUri.html'
      })
      .state('activity', {
        url: '/activity',
        templateUrl: 'views/activity.html'
      })


    /*
     *
     * Wallet
     *
     */

    .state('wallet', {
        url: '/wallet/{walletId}/{fromOnboarding}',
        abstract: true,
        template: '<ion-nav-view name="wallet"></ion-nav-view>'
      })
      .state('wallet.details', {
        url: '/details',
        views: {
          'wallet': {
            templateUrl: 'views/walletDetails.html'
          }
        },
        params: {
          txid: null,
          txpId: null,
        },
      })
      .state('wallet.preferences', {
        url: '/preferences',
        views: {
          'wallet': {
            templateUrl: 'views/preferences.html'
          }
        }
      })
      .state('wallet.preferencesAlias', {
        url: '/preferencesAlias',
        views: {
          'wallet': {
            templateUrl: 'views/preferencesAlias.html'
          }
        }
      })
      .state('wallet.preferencesColor', {
        url: '/preferencesColor',
        views: {
          'wallet': {
            templateUrl: 'views/preferencesColor.html'
          }
        }
      })
      .state('wallet.preferencesEmail', {
        url: '/preferencesEmail',
        views: {
          'wallet': {
            templateUrl: 'views/preferencesEmail.html'
          }
        }
      })
      .state('wallet.backup', {
        url: '/backup',
        views: {
          'wallet': {
            templateUrl: 'views/backup.html'
          }
        }
      })
      .state('wallet.preferencesAdvanced', {
        url: '/preferencesAdvanced',
        views: {
          'wallet': {
            templateUrl: 'views/preferencesAdvanced.html'
          }
        }
      })
      .state('wallet.information', {
        url: '/information',
        views: {
          'wallet': {
            templateUrl: 'views/preferencesInformation.html'
          }
        }
      })
      .state('wallet.export', {
        abstract: true,
        url: '/export',
        views: {
          'wallet': {
            templateUrl: 'views/export.html'
          }
        }
      })
      .state('wallet.export.file', {
        url: '/tab-export-file',
        needProfile: true,
        views: {
          'tab-export-file': {
            templateUrl: 'views/tab-export-file.html',
          },
        }
      })
      .state('wallet.export.qrCode', {
        url: '/tab-export-qrCode',
        needProfile: true,
        views: {
          'tab-export-qrCode': {
            templateUrl: 'views/tab-export-qrCode.html',
          },
        }
      })
      .state('wallet.preferencesBwsUrl', {
        url: '/preferencesBwsUrl',
        views: {
          'wallet': {
            templateUrl: 'views/preferencesBwsUrl.html'
          }
        }
      })
      .state('wallet.preferencesHistory', {
        url: '/preferencesHistory',
        views: {
          'wallet': {
            templateUrl: 'views/preferencesHistory.html'
          }
        }
      })
      .state('wallet.deleteWords', {
        url: '/deleteWords',
        views: {
          'wallet': {
            templateUrl: 'views/preferencesDeleteWords.html'
          }
        }
      })
      .state('wallet.delete', {
        url: '/delete',
        views: {
          'wallet': {
            templateUrl: 'views/preferencesDeleteWallet.html'
          }
        }
      })
      .state('wallet.copayers', {
        url: '/copayers',
        views: {
          'wallet': {
            templateUrl: 'views/copayers.html'
          }
        }
      })
      .state('wallet.paperWallet', {
        url: '/paperWallet',
        views: {
          'wallet': {
            templateUrl: 'views/paperWallet.html'
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
        templateUrl: 'views/tabs.html'
      })
      .state('tabs.home', {
        url: '/home',
        views: {
          'tab-home': {
            templateUrl: 'views/tab-home.html',
          }
        }
      })
      .state('tabs.receive', {
        url: '/receive',
        views: {
          'tab-receive': {
            templateUrl: 'views/tab-receive.html',
          }
        }
      })
      .state('tabs.send', {
        url: '/send',
        views: {
          'tab-send': {
            templateUrl: 'views/tab-send.html',
          }
        }
      })
      .state('tabs.settings', {
        url: '/settings',
        views: {
          'tab-settings': {
            templateUrl: 'views/tab-settings.html',
          }
        }
      })

    /*
     *
     * Send
     *
     */

    .state('send', {
      url: '/send',
      abstract: true,
      template: '<ion-nav-view name="send"></ion-nav-view>'
    })

    .state('send.amount', {
        url: '/amount/:toAddress/:toName',
        views: {
          'send': {
            templateUrl: 'views/amount.html'
          }
        }
      })
      .state('send.confirm', {
        url: '/confirm/:toAddress/:toName/:toAmount/:description/:paypro',
        views: {
          'send': {
            templateUrl: 'views/confirm.html'
          }
        }
      })


    /*
     *
     * Add
     *
     */

    .state('add', {
        url: '/add',
        abstract: true,
        template: '<ion-nav-view name="add"></ion-nav-view>'
      })
      .state('add.main', {
        url: '/main',
        views: {
          'add': {
            templateUrl: 'views/add.html',
            controller: function(platformInfo) {
              if (platformInfo.isCordova && StatusBar.isVisible) {
                StatusBar.backgroundColorByHexString("#4B6178");
              }
            }
          }
        }
      })
      .state('add.join', {
        url: '/join/:url',
        views: {
          'add': {
            templateUrl: 'views/join.html'
          },
        }
      })
      .state('add.import', {
        url: '/import',
        abstract: true,
        views: {
          'add': {
            templateUrl: 'views/import.html'
          },
        }
      })
      .state('add.import.phrase', {
        url: '/tab-import-phrase',
        views: {
          'tab-import-phrase': {
            templateUrl: 'views/tab-import-phrase.html',
          },
        }
      })
      .state('add.import.file', {
        url: '/tab-import-file',
        views: {
          'tab-import-file': {
            templateUrl: 'views/tab-import-file.html',
          },
        }
      })
      .state('add.import.hardware', {
        url: '/tab-import-hardware',
        views: {
          'tab-import-hardware': {
            templateUrl: 'views/tab-import-hardware.html',
          },
        }
      })
      .state('add.create', {
        url: '/create',
        abstract: true,
        templateUrl: 'views/create.html',
        views: {
          'add': {
            templateUrl: 'views/create.html'
          },
        }
      })
      .state('add.create.personal', {
        url: '/tab-create-personal',
        views: {
          'tab-create-personal': {
            templateUrl: 'views/tab-create-personal.html',
          },
        }
      })
      .state('add.create.shared', {
        url: '/tab-create-shared',
        views: {
          'tab-create-shared': {
            templateUrl: 'views/tab-create-shared.html',
          },
        }
      })

    /*
     *
     * Global Settings
     *
     */

    .state('settings', {
        url: '/settings',
        abstract: true,
        template: '<ion-nav-view name="settings"></ion-nav-view>'
      })
      .state('settings.language', {
        url: '/language',
        views: {
          'settings': {
            templateUrl: 'views/preferencesLanguage.html'
          }
        }
      })
      .state('settings.unit', {
        url: '/unit',
        views: {
          'settings': {
            templateUrl: 'views/preferencesUnit.html'
          }
        }
      })
      .state('settings.fee', {
        url: '/fee',
        views: {
          'settings': {
            templateUrl: 'views/preferencesFee.html'
          }
        }
      })
      .state('settings.altCurrency', {
        url: '/altCurrency',
        views: {
          'settings': {
            templateUrl: 'views/preferencesAltCurrency.html'
          }
        }
      })
      .state('settings.about', {
        url: '/about',
        views: {
          'settings': {
            templateUrl: 'views/preferencesAbout.html'
          }
        }
      })
      .state('settings.logs', {
        url: '/logs',
        views: {
          'settings': {
            templateUrl: 'views/preferencesLogs.html'
          }
        }
      })
      .state('settings.termsOfUse', {
        url: '/termsOfUse',
        views: {
          'settings': {
            templateUrl: 'views/termsOfUse.html',
          }
        }
      })
      .state('settings.translators', {
        url: '/translators',
        views: {
          'settings': {
            templateUrl: 'views/translators.html'
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
        url: '/collectEmail',
        views: {
          'onboarding': {
            templateUrl: 'views/onboarding/collectEmail.html'
          }
        }
      })
      .state('onboarding.notifications', {
        url: '/notifications',
        views: {
          'onboarding': {
            templateUrl: 'views/onboarding/notifications.html'
          }
        }
      })
      .state('onboarding.backupRequest', {
        url: '/backupRequest',
        views: {
          'onboarding': {
            templateUrl: 'views/onboarding/backupRequest.html'
          }
        }
      })
      .state('onboarding.backupWarning', {
        url: '/backupWarning',
        views: {
          'onboarding': {
            templateUrl: 'views/onboarding/backupWarning.html'
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

    /*
     *
     * Glidera
     *
     *
     */

    .state('glidera', {
        url: '/glidera',
        abstract: true,
        template: '<ion-nav-view name="glidera"></ion-nav-view>'
      })
      .state('glidera.main', {
        url: '/main',
        views: {
          'glidera': {
            templateUrl: 'views/glidera.html'
          }
        }
      })
      .state('glidera.buy', {
        url: '/buy',
        views: {
          'glidera': {
            templateUrl: 'views/buyGlidera.html'
          }
        }
      })
      .state('glidera.sell', {
        url: '/sell',
        views: {
          'glidera': {
            templateUrl: 'views/sellGlidera.html'
          }
        }
      })
      .state('glidera.preferences', {
        url: '/preferences',
        views: {
          'glidera': {
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
     * Amazon Gift Card
     *
     */

    .state('amazon', {
        url: '/amazon',
        abstract: true,
        template: '<ion-nav-view name="amazon"></ion-nav-view>'
      })
      .state('amazon.main', {
        url: '/main',
        views: {
          'amazon': {
            templateUrl: 'views/amazon.html'
          }
        }
      })
      .state('amazon.buy', {
        url: '/buy',
        views: {
          'amazon': {
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
  .run(function($rootScope, $state, $location, $log, $timeout, $ionicHistory, $ionicPlatform, lodash, platformInfo, profileService, uxLanguage, gettextCatalog, openURLService) {

    if (platformInfo.isCordova) {
      if (screen.width < 768) {
        screen.lockOrientation('portrait');
      } else {
        window.addEventListener("orientationchange", function() {
          var leftMenuWidth = document.querySelector("ion-side-menu[side='left']").clientWidth;
          if (screen.orientation.includes('portrait')) {
            // Portrait
            document.querySelector("ion-side-menu-content").style.width = (screen.width - leftMenuWidth) + "px";
          } else {
            // Landscape
            document.querySelector("ion-side-menu-content").style.width = (screen.height - leftMenuWidth) + "px";
          }
        });
      }
    } else {
      if (screen.width >= 768) {
        window.addEventListener('resize', lodash.throttle(function() {
          $rootScope.$emit('Local/WindowResize');
        }, 100));
      }
    }

    uxLanguage.init();
    openURLService.init();

    $ionicPlatform.ready(function() {
      if (platformInfo.isCordova) {

        window.addEventListener('native.keyboardhide', function() {
          $timeout(function() {
            $rootScope.shouldHideMenuBar = false; //show menu bar when keyboard is hidden with back button action on send screen
          }, 100);
        });

        window.addEventListener('native.keyboardshow', function() {
          $timeout(function() {
            $rootScope.shouldHideMenuBar = true; //hide menu bar when keyboard opens with back button action on send screen
          }, 300);
        });

        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
          cordova.plugins.Keyboard.disableScroll(true);
        }
        if (window.StatusBar) {
          StatusBar.styleLightContent();
        }

        $ionicPlatform.registerBackButtonAction(function(e) {

            var fromDisclaimer = $ionicHistory.currentStateName().match(/disclaimer/) ? 'true' : '';
            var fromTabs = $ionicHistory.currentStateName().match(/tabs/) ? 'true' : '';

            if ($rootScope.backButtonPressedOnceToExit || fromDisclaimer) {
              ionic.Platform.exitApp();
            } else if ($ionicHistory.backView() && !fromTabs) {
              $ionicHistory.goBack();
            } else {
              $rootScope.backButtonPressedOnceToExit = true;
              window.plugins.toast.showShortBottom(gettextCatalog.getString('Press again to exit'));
              setInterval(function() {
                $rootScope.backButtonPressedOnceToExit = false;
              }, 5000);
            }
            e.preventDefault();
          },
          101);

        $ionicPlatform.on('pause', function() {
          // Nothing to do
        });

        $ionicPlatform.on('resume', function() {
          $rootScope.$emit('Local/Resume');
        });

        $ionicPlatform.on('menubutton', function() {
          window.location = '#/preferences';
        });

        setTimeout(function() {
          navigator.splashscreen.hide();
        }, 1000);
      }


      $log.info('Init profile...');
      // Try to open local profile
      profileService.loadAndBindProfile(function(err) {
        if (err) {
          if (err.message && err.message.match('NOPROFILE')) {
            $log.debug('No profile... redirecting');
            $state.transitionTo('onboarding.welcome');
          } else if (err.message && err.message.match('NONAGREEDDISCLAIMER')) {
            $log.debug('Display disclaimer... redirecting');
            $state.transitionTo('onboarding.disclaimer');
          } else {
            throw new Error(err); // TODO
          }
        } else {
          profileService.storeProfileIfDirty();
          $log.debug('Profile loaded ... Starting UX.');
          $state.transitionTo('tabs.home');
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

    });
  });
