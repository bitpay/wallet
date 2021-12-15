import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { File } from '@ionic-native/file/ngx';
import { TranslateLoader } from '@ngx-translate/core';

import * as gettext from 'gettext-parser';
import { from } from 'rxjs';
import { map } from 'rxjs/operators/map';
import { FileStorage } from '../persistence/storage/file-storage';

import { PlatformProvider } from '../platform/platform';

@Injectable({
  providedIn: 'root'
})
export class LanguageLoader implements TranslateLoader {
  private domain = '';
  private _prefix: string = 'assets/i18n/';
  private _suffix: string = '.po';

  constructor(
    private http: HttpClient,
    private file: File,
    private platformProvider: PlatformProvider,
    private fileStorage: FileStorage
  ) {}
  
  public getTranslation(lang: string): any {
    if (this.platformProvider.isCordova) {
      return from( this.fileStorage
        .readAsText(
          this.file.applicationDirectory + 'public/',
          `${this._prefix}/${lang}${this._suffix}`
        )
        .then(data => {
          return this.parse(data);
        }));
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
