import { Injectable } from '@angular/core';
import { Logger } from '@nsalaun/ng-logger';
import { TranslateService } from '@ngx-translate/core';

import { ConfigProvider } from '../config/config';

import * as _ from "lodash";

@Injectable()
export class LanguageProvider {
  public availables: Array<any> = [
    {
      name: 'English',
      isoCode: 'en'
    }, {
      name: 'Español',
      isoCode: 'es'
    }, {
      name: 'Français',
      isoCode: 'fr',
    }, {
      name: 'Italiano',
      isoCode: 'it',
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
    }
  ];
  public current: string;

  constructor(
    private logger: Logger,
    private translate: TranslateService,
    private config: ConfigProvider
  ) {
    this.logger.info('LanguageProvider initialized.');
  }

  load() {
    return new Promise((resolve, reject) => {
      // Get from browser
      let browserLang = this.translate.getBrowserLang();
      let validBrowserLang = this.getName(browserLang) ? true : false;

      this.config.load().then((config) => {
        let configLanguage = config['wallet']['settings']['defaultLanguage'];
        if (configLanguage) this.current = configLanguage;
        else {
          if (validBrowserLang) this.current = browserLang;
          else this.current = this.getDefaultLanguage(); // default
        }
        this.translate.setDefaultLang(this.current);
        resolve(true);
      });
    });
  }

  set(lang: string) {
    this.current = lang;
    this.translate.use(lang);
    this.config.set({language: lang});
  }

  getName(lang: string) {
    return _.result(_.find(this.availables, {
      'isoCode': lang
    }), 'name');
  }

  getDefaultLanguage() {
    return this.availables[0]['isoCode'];
  }

  getCurrentLanguage() {
    return this.current;
  }

  getLanguages() {
    return this.availables;
  }

}
