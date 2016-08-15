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
angular.module('copayApp').config(function(historicLogProvider, $provide, $logProvider, $stateProvider, $urlRouterProvider, $compileProvider) {
    $urlRouterProvider.otherwise('/tabs');

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
      .state('translators', {
        url: '/translators',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/translators.html'
          }
        }
      })
      .state('disclaimer', {
        url: '/disclaimer',
        needProfile: false,
        views: {
          'main': {
            templateUrl: 'views/disclaimer.html',
          }
        }
      })
      .state('walletDetails', {
        url: '/details',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/walletDetails.html',
          },
        },
        params: {
          walletId: null,
        },
      })
      .state('walletHome', {
        url: '/old',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/walletHome.html',
          },
        }
      })
      .state('tabs', {
        url: '/tabs',
        needProfile: true,
        abstract: true,
        views: {
          'main': {
            templateUrl: 'views/tabs.html',
          },
        }
      })
      .state('tabs.home', {
        url: '/home',
        needProfile: true,
        views: {
          'tab-home': {
            templateUrl: 'views/tab-home.html',
          },
        }
      })
      .state('tabs.receive', {
        url: '/receive',
        needProfile: true,
        views: {
          'tab-receive': {
            templateUrl: 'views/tab-receive.html',
          },
        }
      })
      .state('tabs.send', {
        url: '/send',
        needProfile: true,
        views: {
          'tab-send': {
            templateUrl: 'views/tab-send.html',
          },
        }
      })
      .state('tabs.settings', {
        url: '/settings',
        needProfile: true,
        views: {
          'tab-settings': {
            templateUrl: 'views/tab-settings.html',
          },
        }
      })

 
 

    .state('unsupported', {
        url: '/unsupported',
        needProfile: false,
        views: {
          'main': {
            templateUrl: 'views/unsupported.html'
          }
        }
      })
      .state('uri', {
        url: '/uri/:url',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/uri.html'
          }
        }
      })
      .state('uripayment', {
        url: '/uri-payment/:url',
        templateUrl: 'views/paymentUri.html',
        views: {
          'main': {
            templateUrl: 'views/paymentUri.html',
          },
        },
        needProfile: true
      })
      .state('join', {
        url: '/join',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/join.html'
          },
        }
      })
      .state('import', {
        url: '/import',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/import.html'
          },
        }
      })
      .state('create', {
        url: '/create',
        templateUrl: 'views/create.html',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/create.html'
          },
        }
      })
      .state('copayers', {
        url: '/copayers',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/copayers.html'
          },
        }
      })
      .state('preferences', {
        url: '/preferences',
        templateUrl: 'views/preferences.html',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferences.html',
          },
        }
      })
      .state('preferencesLanguage', {
        url: '/preferencesLanguage',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesLanguage.html'
          },
        }
      })
      .state('preferencesUnit', {
        url: '/preferencesUnit',
        templateUrl: 'views/preferencesUnit.html',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesUnit.html'
          },
        }
      })
      .state('preferencesFee', {
        url: '/preferencesFee',
        templateUrl: 'views/preferencesFee.html',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesFee.html'
          },
        }
      })
      .state('uriglidera', {
        url: '/uri-glidera/:url',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/glideraUri.html'
          },
        }
      })
      .state('glidera', {
        url: '/glidera',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/glidera.html'
          },
        }
      })
      .state('buyGlidera', {
        url: '/buy',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/buyGlidera.html'
          },
        }
      })
      .state('sellGlidera', {
        url: '/sell',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/sellGlidera.html'
          },
        }
      })
      .state('preferencesGlidera', {
        url: '/preferencesGlidera',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesGlidera.html'
          },
        }
      })
      .state('bitpayCard', {
        url: '/bitpay-card',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/bitpayCard.html'
          },
        }
      })
      .state('preferencesBitpayCard', {
        url: '/preferences-bitpay-card',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesBitpayCard.html'
          },
        }
      })
      .state('coinbase', {
        url: '/coinbase',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/coinbase.html'
          },
        }
      })
      .state('preferencesCoinbase', {
        url: '/preferencesCoinbase',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesCoinbase.html'
          },
        }
      })
      .state('uricoinbase', {
        url: '/uri-coinbase/:url',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/coinbaseUri.html'
          },
        }
      })
      .state('buyCoinbase', {
        url: '/buycoinbase',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/buyCoinbase.html'
          },
        }
      })
      .state('sellCoinbase', {
        url: '/sellcoinbase',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/sellCoinbase.html'
          },
        }
      })
      .state('buyandsell', {
        url: '/buyandsell',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/buyAndSell.html',
            controller: function(platformInfo) {
              if (platformInfo.isCordova && StatusBar.isVisible) {
                StatusBar.backgroundColorByHexString("#4B6178");
              }
            }
          }
        }
      })
      .state('amazon', {
        url: '/amazon',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/amazon.html'
          },
        }
      })
      .state('buyAmazon', {
        url: '/buyamazon',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/buyAmazon.html'
          },
        }
      })
      .state('preferencesAdvanced', {
        url: '/preferencesAdvanced',
        templateUrl: 'views/preferencesAdvanced.html',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesAdvanced.html'
          },
        }
      })
      .state('preferencesColor', {
        url: '/preferencesColor',
        templateUrl: 'views/preferencesColor.html',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesColor.html'
          },
        }
      })
      .state('preferencesAltCurrency', {
        url: '/preferencesAltCurrency',
        templateUrl: 'views/preferencesAltCurrency.html',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesAltCurrency.html'
          },
        }
      })
      .state('preferencesAlias', {
        url: '/preferencesAlias',
        templateUrl: 'views/preferencesAlias.html',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesAlias.html'
          },

        }
      })
      .state('preferencesEmail', {
        url: '/preferencesEmail',
        templateUrl: 'views/preferencesEmail.html',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesEmail.html'
          },

        }
      })
      .state('preferencesBwsUrl', {
        url: '/preferencesBwsUrl',
        templateUrl: 'views/preferencesBwsUrl.html',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesBwsUrl.html'
          },

        }
      })
      .state('preferencesHistory', {
        url: '/preferencesHistory',
        templateUrl: 'views/preferencesHistory.html',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesHistory.html'
          },

        }
      })
      .state('deleteWords', {
        url: '/deleteWords',
        templateUrl: 'views/preferencesDeleteWords.html',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesDeleteWords.html'
          },
        }
      })
      .state('delete', {
        url: '/delete',
        templateUrl: 'views/preferencesDeleteWallet.html',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesDeleteWallet.html'
          },
        }
      })
      .state('information', {
        url: '/information',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesInformation.html'
          },
        }
      })
      .state('about', {
        url: '/about',
        templateUrl: 'views/preferencesAbout.html',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesAbout.html'
          },
        }
      })
      .state('logs', {
        url: '/logs',
        templateUrl: 'views/preferencesLogs.html',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesLogs.html'
          },
        }
      })
      .state('export', {
        url: '/export',
        templateUrl: 'views/export.html',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/export.html'
          },
        }
      })
      .state('paperWallet', {
        url: '/paperWallet',
        templateUrl: 'views/paperWallet.html',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/paperWallet.html'
          },
        }
      })
      .state('backup', {
        url: '/backup',
        templateUrl: 'views/backup.html',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/backup.html'
          },
        }
      })
      .state('preferencesGlobal', {
        url: '/preferencesGlobal',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesGlobal.html',
          },
        }
      })
      .state('termOfUse', {
        url: '/termOfUse',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/termOfUse.html',
          },
        }
      })
      .state('add', {
        url: '/add',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/add.html',
            controller: function(platformInfo) {
              if (platformInfo.isCordova && StatusBar.isVisible) {
                StatusBar.backgroundColorByHexString("#4B6178");
              }
            }
          }
        }
      });
  })
  .run(function($rootScope, $state, $location, $log, $timeout, $ionicPlatform, lodash, platformInfo, profileService, uxLanguage, go, gettextCatalog) {

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

        if (window.cordova.plugins.Keyboard) {
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
          cordova.plugins.Keyboard.disableScroll(false);
        }

        $ionicPlatform.registerBackButtonAction(function(event) {
          event.preventDefault();
        }, 100);

        var secondBackButtonPress = false;
        var intval = setInterval(function() {
          secondBackButtonPress = false;
        }, 5000);

        $ionicPlatform.on('pause', function() {
          // Nothing to do
        });

        $ionicPlatform.on('resume', function() {
          $rootScope.$emit('Local/Resume');
        });

        $ionicPlatform.on('backbutton', function(event) {

          var loc = window.location;
          var fromDisclaimer = loc.toString().match(/disclaimer/) ? 'true' : '';
          var fromHome = loc.toString().match(/index\.html#\/$/) ? 'true' : '';

          if (fromDisclaimer == 'true')
            navigator.app.exitApp();

          if (platformInfo.isMobile && fromHome == 'true') {
            if (secondBackButtonPress)
              navigator.app.exitApp();
            else
              window.plugins.toast.showShortBottom(gettextCatalog.getString('Press again to exit'));
          }

          if (secondBackButtonPress)
            clearInterval(intval);
          else
            secondBackButtonPress = true;

          $timeout(function() {
            $rootScope.$emit('Local/SetTab', 'walletHome', true);
          }, 100);

          go.walletHome();
        });

        $ionicPlatform.on('menubutton', function() {
          window.location = '#/preferences';
        });

        setTimeout(function() {
          navigator.splashscreen.hide();
        }, 1000);
      }
    });

    uxLanguage.init();

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

      if (!profileService.profile && toState.needProfile) {

        // Give us time to open / create the profile
        event.preventDefault();
        // Try to open local profile
        profileService.loadAndBindProfile(function(err) {
          if (err) {
            if (err.message && err.message.match('NOPROFILE')) {
              $log.debug('No profile... redirecting');
              $state.transitionTo('disclaimer');
            } else if (err.message && err.message.match('NONAGREEDDISCLAIMER')) {
              $log.debug('Display disclaimer... redirecting');
              $state.transitionTo('disclaimer');
            } else {
              throw new Error(err); // TODO
            }
          } else {
            profileService.storeProfileIfDirty();
            $log.debug('Profile loaded ... Starting UX.');
            $state.transitionTo(toState.name || toState, toParams);
          }
        });
      }
      // else {
      //   if (profileService.focusedClient && !profileService.focusedClient.isComplete() && toState.walletShouldBeComplete) {
      //
      //     $state.transitionTo('copayers');
      //   }
      // }
    });
  });
