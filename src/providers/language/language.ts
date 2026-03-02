import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Logger } from '../../providers/logger/logger';

import { ConfigProvider } from '../config/config';

import * as _ from 'lodash';
import * as moment from 'moment';

@Injectable()
export class LanguageProvider {
  private languages = [
    {
      name: 'English',
      isoCode: 'en'
    },
    {
      name: 'Español',
      isoCode: 'es'
    },
    {
      name: 'Français',
      isoCode: 'fr'
    },
    {
      name: 'Italiano',
      isoCode: 'it'
    },
    {
      name: 'Nederlands',
      isoCode: 'nl'
    },
    {
      name: 'Polski',
      isoCode: 'pl'
    },
    {
      name: 'Deutsch',
      isoCode: 'de'
    },
    {
      name: '日本語',
      isoCode: 'ja',
      useIdeograms: true
    },
    {
      name: '中文（简体）',
      isoCode: 'zh',
      useIdeograms: true
    },
    {
      name: 'Pусский',
      isoCode: 'ru'
    },
    {
      name: 'Português',
      isoCode: 'pt'
    }
  ];
  private current: string;

  constructor(
    private logger: Logger,
    private translate: TranslateService,
    private configProvider: ConfigProvider
  ) {
    this.logger.debug('LanguageProvider initialized');
    this.translate.onLangChange.subscribe(event => {
      this.logger.info('Setting new default language to: ' + event.lang);
    });
  }

  public load() {
    let lang = this.configProvider.get().wallet.settings.defaultLanguage;
    if (!_.isEmpty(lang)) this.current = lang;
    else {
      // Get from browser
      const browserLang = this.translate.getBrowserLang();
      this.current = this.getName(browserLang)
        ? browserLang
        : this.getDefault();
    }
    this.logger.info('Default language: ' + this.current);
    this.translate.setDefaultLang(this.current);
    moment.locale(this.current);
  }

  public set(lang: string): void {
    this.current = lang;
    this.translate.use(lang);
    moment.locale(lang);
    this.configProvider.set({
      wallet: { settings: { defaultLanguage: lang } }
    });
  }

  public getName(lang: string): string {
    return _.result(
      _.find(this.languages, {
        isoCode: lang
      }),
      'name'
    );
  }

  private getDefault(): string {
    return this.languages[0]['isoCode'];
  }

  public getCurrent() {
    return this.current;
  }

  public getAvailables() {
    return this.languages;
  }
}
