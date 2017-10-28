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

    // CHECKBOX CIRCLE
    $ionicConfigProvider.form.checkbox('circle');

    // USE NATIVE SCROLLING
    $ionicConfigProvider.scrolling.jsScrolling(false);

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
        template: '<ion-view id="starting"><ion-content><div class="block-spinner row"><ion-spinner class="spinner-stable" icon="crescent"></ion-spinner></div></ion-content></ion-view>'
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

      /*
       *
       * Wallet
       *
       */

      .state('tabs.wallet', {
        url: '/wallet/:walletId/:fromOnboarding',
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
      .state('tabs.wallet.tx-details', {
        url: '/tx-details/:txid',
        views: {
          'tab-home@tabs': {
            controller: 'txDetailsController',
            templateUrl: 'views/tx-details.html'
          }
        }
      })
      .state('tabs.wallet.backupWarning', {
        url: '/backupWarning/:from/:walletId',
        views: {
          'tab-home@tabs': {
            controller: 'backupWarningController',
            templateUrl: 'views/backupWarning.html'
          }
        }
      })
      .state('tabs.wallet.backup', {
        url: '/backup/:walletId',
        views: {
          'tab-home@tabs': {
            templateUrl: 'views/backup.html',
            controller: 'backupController'
          }
        }
      })

      .state('tabs.wallet.addresses', {
        url: '/addresses/:walletId/:toAddress',
        views: {
          'tab-home@tabs': {
            controller: 'addressesController',
            templateUrl: 'views/addresses.html'
          }
        }
      })
      .state('tabs.wallet.allAddresses', {
        url: '/allAddresses/:walletId',
        views: {
          'tab-home@tabs': {
            controller: 'addressesController',
            templateUrl: 'views/allAddresses.html'
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
      .state('scanner', {
        url: '/scanner',
        params: {
          passthroughMode: null,
        },
        controller: 'tabScanController',
        templateUrl: 'views/tab-scan.html'
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
        url: '/amount/:recipientType/:toAddress/:toName/:toEmail/:toColor/:privatePayment',
        views: {
          'tab-send@tabs': {
            controller: 'amountController',
            templateUrl: 'views/amount.html'
          }
        }
      })
      .state('tabs.send.confirm', {
        url: '/confirm/:recipientType/:toAddress/:toName/:toAmount/:toEmail/:toColor/:description/:useSendMax',
        views: {
          'tab-send@tabs': {
            controller: 'confirmController',
            templateUrl: 'views/confirm.html'
          }
        },
        params: {
          paypro: null
        }
      })
      .state('tabs.send.confirm-private', {
        url: '/confirm-private/:recipientType/:toAddress/:toName/:toAmount/:toEmail/:toColor/:description/:useSendMax/:privatePayment',
        views: {
          'tab-send@tabs': {
            controller: 'confirmPrivateController',
            templateUrl: 'views/confirmPrivate.html'
          }
        },
        params: {
          paypro: null
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
            templateUrl: 'views/join.html',
            controller: 'joinController'
          },
        }
      })
      .state('tabs.add.import', {
        url: '/import/:code',
        views: {
          'tab-home@tabs': {
            templateUrl: 'views/import.html',
            controller: 'importController'
          },
        },
      })
      .state('tabs.add.create-personal', {
        url: '/create-personal',
        views: {
          'tab-home@tabs': {
            templateUrl: 'views/tab-create-personal.html',
            controller: 'createController'
          },
        }
      })
      .state('tabs.add.create-shared', {
        url: '/create-shared',
        views: {
          'tab-home@tabs': {
            templateUrl: 'views/tab-create-shared.html',
            controller: 'createController'
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
            templateUrl: 'views/termsOfUse.html'
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
      .state('tabs.lockSetup', {
        url: '/lockSetup',
        views: {
          'tab-settings@tabs': {
            controller: 'lockSetupController',
            templateUrl: 'views/lockSetup.html',
          }
        }
      })
      .state('tabs.pin', {
        url: '/pin/:action',
        views: {
          'tab-settings@tabs': {
            controller: 'pinController',
            templateUrl: 'views/pin.html',
            cache: false
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
      .state('tabs.preferences.backupWarning', {
        url: '/backupWarning/:from',
        views: {
          'tab-settings@tabs': {
            controller: 'backupWarningController',
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
      .state('tabs.preferences.preferencesExternal', {
        url: '/preferencesExternal',
        views: {
          'tab-settings@tabs': {
            controller: 'preferencesExternalController',
            templateUrl: 'views/preferencesExternal.html'
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
        url: '/view/:address/:email/:name',
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
       * Addresses
       *
       */

      .state('tabs.settings.addresses', {
        url: '/addresses/:walletId/:toAddress',
        views: {
          'tab-settings@tabs': {
            controller: 'addressesController',
            templateUrl: 'views/addresses.html'
          }
        }
      })
      .state('tabs.settings.allAddresses', {
        url: '/allAddresses/:walletId',
        views: {
          'tab-settings@tabs': {
            controller: 'addressesController',
            templateUrl: 'views/allAddresses.html'
          }
        }
      })

      /*
       *
       * Request Specific amount
       *
       */

      .state('tabs.paymentRequest', {
        url: '/payment-request',
        abstract: true,
        params: {
          id: null,
          nextStep: 'tabs.paymentRequest.confirm'
        }
      })

      .state('tabs.paymentRequest.amount', {
        url: '/amount',
        views: {
          'tab-receive@tabs': {
            controller: 'amountController',
            templateUrl: 'views/amount.html'
          }
        }
      })
      .state('tabs.paymentRequest.confirm', {
        url: '/confirm/:amount/:currency',
        views: {
          'tab-receive@tabs': {
            controller: 'customAmountController',
            templateUrl: 'views/customAmount.html'
          }
        }
      })

      /*
       *
       * Init backup flow
       *
       */

      .state('tabs.receive.backupWarning', {
        url: '/backupWarning/:from/:walletId',
        views: {
          'tab-receive@tabs': {
            controller: 'backupWarningController',
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
       * Paper Wallet
       *
       */

      .state('tabs.home.paperWallet', {
        url: '/paperWallet/:privateKey',
        views: {
          'tab-home@tabs': {
            controller: 'paperWalletController',
            templateUrl: 'views/paperWallet.html'
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
            templateUrl: 'views/onboarding/welcome.html',
            controller: 'welcomeController'
          }
        }
      })
      .state('onboarding.tour', {
        url: '/tour',
        views: {
          'onboarding': {
            templateUrl: 'views/onboarding/tour.html',
            controller: 'tourController'
          }
        }
      })
      .state('onboarding.collectEmail', {
        url: '/collectEmail/:walletId',
        views: {
          'onboarding': {
            templateUrl: 'views/onboarding/collectEmail.html',
            controller: 'collectEmailController'
          }
        }
      })
      .state('onboarding.backupRequest', {
        url: '/backupRequest/:walletId',
        views: {
          'onboarding': {
            templateUrl: 'views/onboarding/backupRequest.html',
            controller: 'backupRequestController'
          }
        }
      })
      .state('onboarding.backupWarning', {
        url: '/backupWarning/:from/:walletId',
        views: {
          'onboarding': {
            templateUrl: 'views/backupWarning.html',
            controller: 'backupWarningController'
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
        url: '/disclaimer/:walletId/:backedUp/:resume',
        views: {
          'onboarding': {
            templateUrl: 'views/onboarding/disclaimer.html',
            controller: 'disclaimerController'
          }
        }
      })
      .state('onboarding.terms', {
        url: '/terms',
        views: {
          'onboarding': {
            templateUrl: 'views/onboarding/terms.html',
            controller: 'termsController'
          }
        }
      })
      .state('onboarding.import', {
        url: '/import',
        views: {
          'onboarding': {
            templateUrl: 'views/import.html',
            controller: 'importController'
          },
        },
        params: {
          code: null,
          fromOnboarding: null
        },
      })

      /*
       *
       * Feedback
       *
       */

      .state('tabs.feedback', {
        url: '/feedback',
        views: {
          'tab-settings@tabs': {
            templateUrl: 'views/feedback/send.html',
            controller: 'sendController'
          }
        }
      })
      .state('tabs.shareApp', {
        url: '/shareApp/:score/:skipped/:fromSettings',
        views: {
          'tab-settings@tabs': {
            controller: 'completeController',
            templateUrl: 'views/feedback/complete.html'
          }
        }
      })
      .state('tabs.rate', {
        url: '/rate',
        abstract: true
      })
      .state('tabs.rate.send', {
        url: '/send/:score',
        views: {
          'tab-home@tabs': {
            templateUrl: 'views/feedback/send.html',
            controller: 'sendController'
          }
        }
      })
      .state('tabs.rate.complete', {
        url: '/complete/:score/:skipped',
        views: {
          'tab-home@tabs': {
            controller: 'completeController',
            templateUrl: 'views/feedback/complete.html'
          }
        }
      })
      .state('tabs.rate.rateApp', {
        url: '/rateApp/:score',
        views: {
          'tab-home@tabs': {
            controller: 'rateAppController',
            templateUrl: 'views/feedback/rateApp.html'
          }
        }
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
            controller: 'buyandsellController',
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
        url: '/glidera/:code',
        views: {
          'tab-home@tabs': {
            controller: 'glideraController',
            controllerAs: 'glidera',
            templateUrl: 'views/glidera.html'
          }
        }
      })
      .state('tabs.buyandsell.glidera.amount', {
        url: '/amount/:nextStep/:currency',
        views: {
          'tab-home@tabs': {
            controller: 'amountController',
            templateUrl: 'views/amount.html'
          }
        }
      })
      .state('tabs.buyandsell.glidera.buy', {
        url: '/buy/:amount/:currency',
        views: {
          'tab-home@tabs': {
            controller: 'buyGlideraController',
            templateUrl: 'views/buyGlidera.html'
          }
        }
      })
      .state('tabs.buyandsell.glidera.sell', {
        url: '/sell/:amount/:currency',
        views: {
          'tab-home@tabs': {
            controller: 'sellGlideraController',
            templateUrl: 'views/sellGlidera.html'
          }
        }
      })
      .state('tabs.preferences.glidera', {
        url: '/glidera',
        views: {
          'tab-settings@tabs': {
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

      .state('tabs.buyandsell.coinbase', {
        url: '/coinbase/:code',
        views: {
          'tab-home@tabs': {
            controller: 'coinbaseController',
            controllerAs: 'coinbase',
            templateUrl: 'views/coinbase.html'
          }
        }
      })
      .state('tabs.preferences.coinbase', {
        url: '/coinbase',
        views: {
          'tab-settings@tabs': {
            controller: 'preferencesCoinbaseController',
            templateUrl: 'views/preferencesCoinbase.html'
          }
        }
      })
      .state('tabs.buyandsell.coinbase.amount', {
        url: '/amount/:nextStep/:currency',
        views: {
          'tab-home@tabs': {
            controller: 'amountController',
            templateUrl: 'views/amount.html'
          }
        }
      })
      .state('tabs.buyandsell.coinbase.buy', {
        url: '/buy/:amount/:currency',
        views: {
          'tab-home@tabs': {
            controller: 'buyCoinbaseController',
            templateUrl: 'views/buyCoinbase.html'
          }
        }
      })
      .state('tabs.buyandsell.coinbase.sell', {
        url: '/sell/:amount/:currency',
        views: {
          'tab-home@tabs': {
            controller: 'sellCoinbaseController',
            templateUrl: 'views/sellCoinbase.html'
          }
        }
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
      .state('tabs.giftcards.amazon.cards', {
        url: '/cards',
        views: {
          'tab-home@tabs': {
            controller: 'amazonCardsController',
            templateUrl: 'views/amazonCards.html'
          }
        },
        params: {
          invoiceId: null
        }
      })
      .state('tabs.giftcards.amazon.amount', {
        url: '/amount',
        views: {
          'tab-home@tabs': {
            controller: 'amountController',
            templateUrl: 'views/amount.html'
          }
        },
        params: {
          nextStep: 'tabs.giftcards.amazon.buy',
          currency: 'USD',
          forceCurrency: true
        }
      })
      .state('tabs.giftcards.amazon.buy', {
        url: '/buy/:amount/:currency',
        views: {
          'tab-home@tabs': {
            controller: 'buyAmazonController',
            templateUrl: 'views/buyAmazon.html'
          }
        }
      })

      /*
       *
       * BitPay Card
       *
       */

      .state('tabs.bitpayCardIntro', {
        url: '/bitpay-card-intro/:secret/:email/:otp',
        views: {
          'tab-home@tabs': {
            controller: 'bitpayCardIntroController',
            templateUrl: 'views/bitpayCardIntro.html'
          }
        }
      })
      .state('tabs.bitpayCard', {
        url: '/bitpay-card',
        views: {
          'tab-home@tabs': {
            controller: 'bitpayCardController',
            controllerAs: 'bitpayCard',
            templateUrl: 'views/bitpayCard.html'
          }
        },
        params: {
          id: null,
          currency: 'USD',
          useSendMax: null
        }
      })
      .state('tabs.bitpayCard.amount', {
        url: '/amount/:nextStep',
        views: {
          'tab-home@tabs': {
            controller: 'amountController',
            templateUrl: 'views/amount.html'
          }
        }
      })
      .state('tabs.bitpayCard.topup', {
        url: '/topup/:amount',
        views: {
          'tab-home@tabs': {
            controller: 'topUpController',
            templateUrl: 'views/topup.html'
          }
        }
      })
      .state('tabs.preferences.bitpayServices', {
        url: '/bitpay-services',
        views: {
          'tab-settings@tabs': {
            controller: 'preferencesBitpayServicesController',
            templateUrl: 'views/preferencesBitpayServices.html'
          }
        }
      });
  })
  .run(function($rootScope, $state, $location, $log, $timeout, startupService, ionicToast, fingerprintService, $ionicHistory, $ionicPlatform, $window, appConfigService, lodash, platformInfo, profileService, uxLanguage, gettextCatalog, openURLService, storageService, scannerService, configService, emailService, /* plugins START HERE => */ coinbaseService, glideraService, amazonService, bitpayCardService, applicationService) {

    uxLanguage.init();

    $ionicPlatform.ready(function() {
      if (screen.width < 768 && platformInfo.isCordova)
        screen.lockOrientation('portrait');

      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard && !platformInfo.isWP) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
        cordova.plugins.Keyboard.disableScroll(true);
      }

      window.addEventListener('native.keyboardshow', function() {
        document.body.classList.add('keyboard-open');
      });

      $ionicPlatform.registerBackButtonAction(function(e) {

        //from root tabs view
        var matchHome = $ionicHistory.currentStateName() == 'tabs.home' ? true : false;
        var matchReceive = $ionicHistory.currentStateName() == 'tabs.receive' ? true : false;
        var matchScan = $ionicHistory.currentStateName() == 'tabs.scan' ? true : false;
        var matchSend = $ionicHistory.currentStateName() == 'tabs.send' ? true : false;
        var matchSettings = $ionicHistory.currentStateName() == 'tabs.settings' ? true : false;

        var fromTabs = matchHome | matchReceive | matchScan | matchSend | matchSettings;

        //onboarding with no back views
        var matchWelcome = $ionicHistory.currentStateName() == 'onboarding.welcome' ? true : false;
        var matchCollectEmail = $ionicHistory.currentStateName() == 'onboarding.collectEmail' ? true : false;
        var matchBackupRequest = $ionicHistory.currentStateName() == 'onboarding.backupRequest' ? true : false;
        var backedUp = $ionicHistory.backView().stateName == 'onboarding.backup' ? true : false;
        var noBackView = $ionicHistory.backView().stateName == 'starting' ? true : false;
        var matchDisclaimer = $ionicHistory.currentStateName() == 'onboarding.disclaimer' && (backedUp || noBackView) ? true : false;

        var fromOnboarding = matchCollectEmail | matchBackupRequest | matchWelcome | matchDisclaimer;

        //views with disable backbutton
        var matchComplete = $ionicHistory.currentStateName() == 'tabs.rate.complete' ? true : false;
        var matchLockedView = $ionicHistory.currentStateName() == 'lockedView' ? true : false;
        var matchPin = $ionicHistory.currentStateName() == 'pin' ? true : false;

        if ($ionicHistory.backView() && !fromTabs && !fromOnboarding && !matchComplete && !matchPin && !matchLockedView) {
          $ionicHistory.goBack();
        } else
        if ($rootScope.backButtonPressedOnceToExit) {
          navigator.app.exitApp();
        } else {
          $rootScope.backButtonPressedOnceToExit = true;
          $rootScope.$apply(function() {
            ionicToast.show(gettextCatalog.getString('Press again to exit'), 'bottom', false, 1000);
          });
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
        applicationService.appLockModal('check');
      });

      $ionicPlatform.on('menubutton', function() {
        window.location = '#/preferences';
      });

      $log.info('Init profile...');
      // Try to open local profile
      profileService.loadAndBindProfile(function(err) {
        $ionicHistory.nextViewOptions({
          disableAnimate: true
        });
        if (err) {
          if (err.message && err.message.match('NOPROFILE')) {
            $log.debug('No profile... redirecting');
            $state.go('onboarding.welcome');
          } else if (err.message && err.message.match('NONAGREEDDISCLAIMER')) {
            if (lodash.isEmpty(profileService.getWallets())) {
              $log.debug('No wallets and no disclaimer... redirecting');
              $state.go('onboarding.welcome');
            } else {
              $log.debug('Display disclaimer... redirecting');
              $state.go('onboarding.disclaimer', {
                resume: true
              });
            }
          } else {
            throw new Error(err); // TODO
          }
        } else {
          profileService.storeProfileIfDirty();
          $log.debug('Profile loaded ... Starting UX.');
          scannerService.gentleInitialize();
          // Reload tab-home if necessary (from root path: starting)
          $state.go('starting', {}, {
            'reload': true,
            'notify': $state.current.name == 'starting' ? false : true
          }).then(function() {
            $ionicHistory.nextViewOptions({
              disableAnimate: true,
              historyRoot: true
            });
            $state.transitionTo('tabs.home').then(function() {
              // Clear history
              $ionicHistory.clearHistory();
            });
            applicationService.appLockModal('check');
          });
        };
        // After everything have been loaded
        $timeout(function() {
          emailService.init(); // Update email subscription if necessary
          openURLService.init();
        }, 1000);
      });
    });

    if (platformInfo.isNW) {
      var gui = require('nw.gui');
      var win = gui.Window.get();
      var nativeMenuBar = new gui.Menu({
        type: "menubar"
      });
      try {
        nativeMenuBar.createMacBuiltin(appConfigService.nameCase);
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
