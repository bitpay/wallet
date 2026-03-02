import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { File } from '@ionic-native/file';
import { TranslateLoader } from '@ngx-translate/core';

import * as gettext from 'gettext-parser';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators/map';

import { PlatformProvider } from '../platform/platform';

@Injectable()
export class LanguageLoader implements TranslateLoader {
  private domain = '';
  private _prefix: string = 'assets/i18n/';
  private _suffix: string = '.po';

  constructor(
    private http: HttpClient,
    private file: File,
    private platformProvider: PlatformProvider
  ) {}

  public getTranslation(lang: string): Observable<any> {
    if (this.platformProvider.isCordova) {
      return Observable.fromPromise(
        this.file
          .readAsText(
            this.file.applicationDirectory + 'www/',
            `${this._prefix}/${lang}${this._suffix}`
          )
          .then(data => {
            return this.parse(data);
          })
      );
    } else {
      return this.http
        .get(`${this._prefix}/${lang}${this._suffix}`, { responseType: 'text' })
        .pipe(map((contents: string) => this.parse(contents)));
    }
  }

  public parse(contents: string): any {
    let translations: { [key: string]: string } = {};

    const po = gettext.po.parse(contents, 'utf-8');
    if (!po.translations.hasOwnProperty(this.domain)) {
      return translations;
    }

    Object.keys(po.translations[this.domain]).forEach(key => {
      const translation: string = po.translations[this.domain][
        key
      ].msgstr.pop();
      if (key.length > 0 && translation.length > 0) {
        translations[key] = translation;
      }
    });

    return translations;
  }
}
