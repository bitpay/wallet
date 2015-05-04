'use strict';

var unsupported;

if (window && window.navigator) {
  var rxaosp = window.navigator.userAgent.match(/Android.*AppleWebKit\/([\d.]+)/);
  var isaosp = (rxaosp && rxaosp[1] < 537);
  if (!window.cordova && isaosp)
    unsupported = true;
  if (unsupported) {
    window.location = '#/unsupported';
  }
}


//Setting up route
angular
  .module('copayApp')
  .config(function(historicLogProvider, $provide, $logProvider, $stateProvider, $urlRouterProvider, $animateProvider) {
    $urlRouterProvider.otherwise('/');

    $animateProvider.classNameFilter(/^(?:(?!ng-animate-disabled).)*$/);

    $logProvider.debugEnabled(true);
    $provide.decorator('$log', ['$delegate',
      function($delegate) {
        var historicLog = historicLogProvider.$get();

        ['debug', 'info', 'warn', 'error', 'log'].forEach(function(level) {
          var orig = $delegate[level];
          $delegate[level] = function() {
            var args = [].slice.call(arguments);
            if (!Array.isArray(args)) args = [args];
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
                v = v.toString();
                if (v.length > 200)
                  v = v.substr(0, 197) + '...';
              } catch (e) {
                console.log('Error at log decorator:', e);
                v = 'undefined';
              }
              return v;
            });
            try {
              if (window.cordova)
                console.log(args.join(' '));
              historicLog.add(level, args.join(' '));
              orig.apply(null, args);
            } catch (e) {
              console.log('Error at log decorator:', e);
            }
          };
        });
        return $delegate;
      }
    ]);

    $stateProvider
      .state('splash', {
        url: '/splash',
        needProfile: false,
        views: {
          'main': {
            templateUrl: 'views/splash/1.html'
          }
        }
      })
      .state('walletHome', {
        url: '/',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/walletHome.html'
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html'
          },
          'menu': {
            templateUrl: 'views/includes/menu.html',
            controller: function($scope) {
              $scope.activeMenu = 'walletHome';
            }
          }
        }
      })
      .state('createProfile', {
        url: '/createProfile',
        needProfile: false,
        views: {
          'main': {
            templateUrl: 'views/createProfile.html',
            controller: function($scope) {
              $scope.mainDark = true;
              $scope.noColor = true;
            }
          }
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
      .state('uri-payment', {
        url: '/uri-payment/:data',
        templateUrl: 'views/paymentUri.html',
        views: {
          'main': {
            templateUrl: 'views/paymentUri.html',
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html',
            controller: function($scope) {
              $scope.goBackToState = 'walletHome';
              $scope.noColor = true;
            }
          }
        },
        needProfile: true
      })
      .state('selectWalletForPayment', {
        url: '/selectWalletForPayment',
        controller: 'walletForPaymentController',
        needProfile: true
      })
      .state('join', {
        url: '/join',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/join.html'
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html',
            controller: function($scope, gettext) {
              $scope.titleSection = gettext('Join shared wallet');
              $scope.goBackToState = 'add';
              $scope.noColor = true;
            }
          }
        }
      })
      .state('import', {
        url: '/import',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/import.html'
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html',
            controller: function($scope, gettext) {
              $scope.titleSection = gettext('Import wallet');
              $scope.goBackToState = 'add';
              $scope.noColor = true;
            }
          }
        }
      })
      .state('importProfile', {
        url: '/importProfile',
        templateUrl: 'views/importProfile.html',
        needProfile: false
      })
      .state('importLegacy', {
        url: '/importLegacy',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/importLegacy.html',
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html',
            controller: function($scope, gettext) {
              $scope.titleSection = gettext('Import legacy wallet');
              $scope.goBackToState = 'add';
              $scope.noColor = true;
            }
          }
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
          'topbar': {
            templateUrl: 'views/includes/topbar.html',
            controller: function($scope, gettext) {
              $scope.titleSection = gettext('Create new wallet');
              $scope.goBackToState = 'add';
              $scope.noColor = true;
            }
          }
        }
      })
      .state('copayers', {
        url: '/copayers',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/copayers.html'
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html'
          }
        }
      })
      .state('preferences', {
        url: '/preferences',
        templateUrl: 'views/preferences.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferences.html'
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html',
            controller: function($scope) {
              $scope.titleSection = 'Preferences';
              $scope.closeToHome = true;
            }
          }
        }
      })
      .state('preferencesLanguage', {
        url: '/preferencesLanguage',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesLanguage.html'
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html',
            controller: function($scope, gettext) {
              $scope.titleSection = gettext('Language');
              $scope.goBackToState = 'preferences';
              $scope.noColor = true;
            }
          }
        }
      })
      .state('preferencesUnit', {
        url: '/preferencesUnit',
        templateUrl: 'views/preferencesUnit.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesUnit.html'
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html',
            controller: function($scope, gettext) {
              $scope.titleSection = gettext('Unit');
              $scope.goBackToState = 'preferences';
              $scope.noColor = true;
            }
          }
        }
      })
      .state('preferencesAdvanced', {
        url: '/preferencesAdvanced',
        templateUrl: 'views/preferencesAdvanced.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesAdvanced.html'
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html',
            controller: function($scope) {
              $scope.titleSection = 'Advanced';
              $scope.goBackToState = 'preferences';
            }
          }
        }
      })
      .state('preferencesColor', {
        url: '/preferencesColor',
        templateUrl: 'views/preferencesColor.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesColor.html'
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html',
            controller: function($scope, gettext) {
              $scope.titleSection = gettext('Color');
              $scope.goBackToState = 'preferences';
            }
          }
        }
      })

    .state('preferencesAltCurrency', {
        url: '/preferencesAltCurrency',
        templateUrl: 'views/preferencesAltCurrency.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesAltCurrency.html'
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html',
            controller: function($scope, gettext) {
              $scope.titleSection = gettext('Alternative Currency');
              $scope.goBackToState = 'preferences';
              $scope.noColor = true;
            }
          }
        }
      })
      .state('preferencesBwsUrl', {
        url: '/preferencesBwsUrl',
        templateUrl: 'views/preferencesBwsUrl.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesBwsUrl.html'
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html',
            controller: function($scope) {
              $scope.titleSection = 'Bitcore Wallet Service';
              $scope.goBackToState = 'preferences';
              $scope.noColor = true;
            }
          }
        }
      })
      .state('delete', {
        url: '/delete',
        templateUrl: 'views/preferencesDeleteWallet.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesDeleteWallet.html'
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html',
            controller: function($scope, gettext) {
              $scope.titleSection = gettext('Delete Wallet');
              $scope.goBackToState = 'preferences';
              $scope.goBackToState = 'preferencesAdvanced';
            }
          }
        }
      })
      .state('about', {
        url: '/about',
        templateUrl: 'views/preferencesAbout.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesAbout.html'
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html',
            controller: function($scope, gettext) {
              $scope.titleSection = gettext('About');
              $scope.goBackToState = 'preferences';
              $scope.noColor = true;
            }
          }
        }
      })
      .state('logs', {
        url: '/logs',
        templateUrl: 'views/preferencesLogs.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesLogs.html'
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html',
            controller: function($scope, gettext) {
              $scope.titleSection = gettext('Logs');
              $scope.goBackToState = 'about';
              $scope.noColor = true;
            }
          }
        }
      })
      .state('backup', {
        url: '/backup',
        templateUrl: 'views/backup.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/backup.html'
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html',
            controller: function($scope, gettext) {
              $scope.titleSection = gettext('Backup');
              $scope.goBackToState = 'preferences';
            }
          }
        }
      })
      .state('settings', {
        url: '/settings',
        controller: 'settingsController',
        templateUrl: 'views/settings.html',
        needProfile: false
      })
      .state('warning', {
        url: '/warning',
        controller: 'warningController',
        templateUrl: 'views/warning.html',
        needProfile: false
      })

    .state('add', {
        url: '/add',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/add.html'
          },
          'topbar': {
            templateUrl: 'views/includes/topbar.html',
            controller: function($scope, gettext) {
              $scope.titleSection = gettext('Add wallet');
              $scope.closeToHome = true;
              $scope.noColor = true;
            }
          }
        }
      })
      .state('cordova', {
        url: '/cordova/:status',
        views: {
          'main': {
            controller: function($rootScope, $stateParams, go) {
              switch ($stateParams.status) {
                case 'resume':
                  $rootScope.$emit('Local/Resume');
                  break;
                case 'offline':
                  $rootScope.$emit('Local/Offline');
                  break;
              };
              go.walletHome();
            }
          }
        },
        needProfile: false
      });
  })
  .run(function($rootScope, $state, $log, gettextCatalog, uriHandler, isCordova, amMoment, profileService) {
    FastClick.attach(document.body);

    // Auto-detect browser language
    var userLang, androidLang;

    if (navigator && navigator.userAgent && (androidLang = navigator.userAgent.match(/android.*\W(\w\w)-(\w\w)\W/i))) {
      userLang = androidLang[1];
    } else {
      // works for iOS and Android 4.x
      userLang = navigator.userLanguage || navigator.language;
    }

    userLang = userLang ? (userLang.split('-', 1)[0] || 'en') : 'en';
    gettextCatalog.setCurrentLanguage(userLang);
    amMoment.changeLocale(userLang);

    // Register URI handler, not for mobileApp
    if (!isCordova) {
      uriHandler.register();
    }

    var pageWeight = {
      walletHome: 0,
      receive: 0,
      send: 0,
      history: 0,
      preferences: 0,
      preferencesColor: 12,
      backup: 12,
      preferencesAdvanced: 12,
      delete: 13,
      preferencesLanguage: 12,
      preferencesUnit: 12,
      preferencesAltCurrency: 12,
      preferencesBwsUrl: 12,
      about: 12,
      logs: 13,
      add: 0,
      create: 12,
      join: 12,
      import: 12,
      importLegacy: 12
    };


    $rootScope.$on('$stateChangeSuccess', function() {
      $rootScope.$emit('Animation/Disable');
    });

    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
      if (pageWeight[fromState.name] > pageWeight[toState.name]) {
        $rootScope.$emit('Animation/SwipeRight');
      } else if (pageWeight[fromState.name] < pageWeight[toState.name]) {
        $rootScope.$emit('Animation/SwipeLeft');
      }

      if (!profileService.profile && toState.needProfile) {

        // Give us time to open / create the profile
        event.preventDefault();

        // Try to open local profile
        profileService.loadAndBindProfile(function(err) {
          if (err) {
            if (err.message.match('NOPROFILE')) {
              $log.debug('No profile... redirecting');
              $state.transitionTo('splash');
            } else {
              throw new Error(err); // TODO
            }
          } else {
            $log.debug('Profile loaded ... Starting UX.');
            $state.transitionTo(toState.name || toState, toParams);
          }
        });
      }

      if (profileService.focusedClient && !profileService.focusedClient.isComplete() && toState.walletShouldBeComplete) {

        $state.transitionTo('copayers');
        event.preventDefault();
      }
    });
  });
