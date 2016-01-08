'use strict';
angular.module('copayApp.services')
  .factory('uxLanguage', function languageService($log, lodash, gettextCatalog, amMoment, configService) {
    var root = {};

    root.availableLanguages = [{
      name: 'English',
      isoCode: 'en',
    }, {
      name: 'Français',
      isoCode: 'fr',
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
      name: 'Pусский',
      isoCode: 'ru',
    }];

    root.currentLanguage = null;

    root._detect = function() {
      // Auto-detect browser language
      var userLang, androidLang;

      if (navigator && navigator.userAgent && (androidLang = navigator.userAgent.match(/android.*\W(\w\w)-(\w\w)\W/i))) {
        userLang = androidLang[1];
      } else {
        // works for iOS and Android 4.x
        userLang = navigator.userLanguage || navigator.language;
      }
      userLang = userLang ? (userLang.split('-', 1)[0] || 'en') : 'en';

      // Set only available languages
      userLang = lodash.find(root.availableLanguages, {
        'isoCode': userLang
      }) ? userLang : 'en';

      return userLang;
    };

    root._set = function(lang) {
      $log.debug('Setting default language: ' + lang);
      gettextCatalog.setCurrentLanguage(lang);
      amMoment.changeLocale(lang);
      root.currentLanguage = lang;
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

    root.init = function() {
      root._set(root._detect());
    };

    root.update = function() {
      var userLang = configService.getSync().wallet.settings.defaultLanguage;

      if (!userLang) {
        userLang = root._detect();
      }

      if (userLang != gettextCatalog.getCurrentLanguage()) {
        root._set(userLang);
      }
      return userLang;
    };

    root.getName = function(lang) {
      return lodash.result(lodash.find(root.availableLanguages, {
        'isoCode': lang
      }), 'name');
    };

    return root;
  });
