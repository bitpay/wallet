import { Injectable } from '@angular/core';
import { Logger } from 'angular2-logger/core';
import lodash from 'lodash';

import { ConfigService } from './config.service';
import { TextService } from './text.service';

@Injectable()
export class UxLanguageService {
  win: any = window;
  navigator: any = this.win.navigatior;

  currentLanguage: any = null;

  availableLanguages = [{
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

  constructor(
    public configService: ConfigService,
    public logger: Logger,
    public textService: TextService
  ) {}

  _detect(cb) {

    return cb('en'); //disable auto detection for release;

    var userLang;
    if (this.navigator && this.navigator.globalization) {

      this.navigator.globalization.getPreferredLanguage((preferedLanguage) => {
        // works for iOS and Android 4.x
        userLang = preferedLanguage.value;
        userLang = userLang ? (userLang.split('-', 1)[0] || 'en') : 'en';
        // Set only available languages
        userLang = this.isAvailableLanguage(userLang);
        return cb(userLang);
      });
    } else {
      // Auto-detect browser language
      userLang = this.navigator.userLanguage || this.navigator.language;
      userLang = userLang ? (userLang.split('-', 1)[0] || 'en') : 'en';
      // Set only available languages
      userLang = this.isAvailableLanguage(userLang);
      return cb(userLang);
    }
  }

  isAvailableLanguage(userLang) {
    return lodash.find(this.availableLanguages, {
      'isoCode': userLang
    }) ? userLang : 'en';
  }

  _set(lang) {
    this.logger.debug('Setting default language: ' + lang);
    this.textService.gettextCatalog.setCurrentLanguage(lang);
    this.currentLanguage = lang;

    if (lang == 'zh') lang = lang + '-CN'; // Fix for Chinese Simplified
    //amMoment.changeLocale(lang);
  };

  getCurrentLanguage() {
    return this.currentLanguage;
  };

  getCurrentLanguageName() {
    return this.getName(this.currentLanguage);
  };

  getCurrentLanguageInfo() {
    return lodash.find(this.availableLanguages, {
      'isoCode': this.currentLanguage
    });
  };

  getLanguages() {
    return this.availableLanguages;
  };

  init(cb) {
    this.configService.whenAvailable((config) => {
      let userLang = config.wallet.settings.defaultLanguage;

      if (userLang && userLang != this.currentLanguage) {
        this._set(userLang);
      } else {
        this._detect((lang) => {
          this._set(lang);
        });
      }
      if (cb) return cb();
    });
  };

  getName(lang) {
    return lodash.result(lodash.find(this.availableLanguages, {
      'isoCode': lang
    }), 'name');
  };

}
