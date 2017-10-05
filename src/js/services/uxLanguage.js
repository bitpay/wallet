'use strict';
angular.module('copayApp.services')
  .factory('uxLanguage', function languageService($log, lodash, gettextCatalog, amMoment, configService) {
    var root = {};

    root.currentLanguage = null;

    root.availableLanguages = [{
      name: 'English',
      isoCode: 'en',
    }, {
      name: 'Español',
      isoCode: 'es',
    }, {
      name: 'Français',
      isoCode: 'fr',
    }, {
      name: 'Italiano',
      isoCode: 'it',
    }, {
      name: 'Nederlands',
      isoCode: 'nl',
    }, {
      name: 'Polski',
      isoCode: 'pl',
    }, {
      name: 'Deutsch',
      isoCode: 'de',
    }, {
      name: '日本語',
      isoCode: 'ja',
      useIdeograms: true,
    }, {
      name: '中文（简体）',
      isoCode: 'zh',
      useIdeograms: true,
    }, {
      name: 'Pусский',
      isoCode: 'ru',
    }, {
      name: 'Português',
      isoCode: 'pt',
    }];

    // }, {
    //   name: 'Český',
    //   isoCode: 'cs',
    // }

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
