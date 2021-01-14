import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import * as _ from 'lodash';

import { File } from '@ionic-native/file';

// providers
import { ConfigProvider } from '../../providers/config/config';
import { LanguageProvider } from '../../providers/language/language';
import { Logger } from '../../providers/logger/logger';
import { PersistenceProvider } from '../../providers/persistence/persistence';
import { PlatformProvider } from '../platform/platform';
import { ThemeProvider } from '../theme/theme';

/* TODO: implement interface properly
interface App {
  packageName: string;
  packageDescription: string;
  packageNameId: string;
  themeColor: string;
  userVisibleName: string;
  purposeLine: string;
  bundleName: string;
  appUri: string;
  name: string;
  nameNoSpace: string;
  nameCase: string;
  nameCaseNoSpace: string;
  gitHubRepoName: string;
  gitHubRepoUrl: string;
  gitHubRepoBugs: string;
  disclaimerUrl: string;
  url: string;
  appDescription: string;
  winAppName: string;
  WindowsStoreIdentityName: string;
  WindowsStoreDisplayName: string;
  windowsAppId: string;
  pushSenderId: string;
  description: string;
  version: string;
  androidVersion: string;
  commitHash: string;
  _extraCSS: string;
  _enabledExtensions;
}*/
export interface Version {
  major: number;
  minor: number;
  patch: number;
}
@Injectable()
export class AppProvider {
  public info: any = {};
  public version: Version;
  public servicesInfo;
  public homeBalance: any;
  public isLockModalOpen: boolean;
  private jsonPathApp: string = 'assets/appConfig.json';
  private jsonPathServices: string = 'assets/externalServices.json';

  constructor(
    public http: HttpClient,
    private logger: Logger,
    private language: LanguageProvider,
    public config: ConfigProvider,
    private persistence: PersistenceProvider,
    private file: File,
    private platformProvider: PlatformProvider,
    private themeProvider: ThemeProvider
  ) {
    this.logger.debug('AppProvider initialized');
  }

  public async load() {
    await Promise.all([this.getInfo(), this.loadProviders()]);
  }

  public setTotalBalance() {
    this.persistence.getTotalBalance().then(data => {
      if (!data) return;
      if (_.isString(data)) {
        data = JSON.parse(data);
      }
      this.homeBalance = data;
    });
  }

  private async getInfo() {
    [this.servicesInfo, this.info] = await Promise.all([
      this.getServicesInfo(),
      this.getAppInfo()
    ]);
    if (this.platformProvider.isCordova) {
      this.info = JSON.parse(this.info);
      this.servicesInfo = JSON.parse(this.servicesInfo);
    }
    this.version = this.formatVersionString();
  }

  private formatVersionString(): Version {
    var formattedNumber = this.info.version.replace(/^v/i, '').split('.');
    return {
      major: +formattedNumber[0],
      minor: +formattedNumber[1],
      patch: +formattedNumber[2]
    };
  }

  private async loadProviders() {
    await this.persistence.load();
    await this.config.load();
    await this.themeProvider.load();
    await this.language.load();
  }

  private getAppInfo() {
    if (this.platformProvider.isCordova) {
      return this.file.readAsText(
        this.file.applicationDirectory + 'www/',
        this.jsonPathApp
      );
    } else {
      return this.http.get(this.jsonPathApp).toPromise();
    }
  }

  private getServicesInfo() {
    if (this.platformProvider.isCordova) {
      return this.file.readAsText(
        this.file.applicationDirectory + 'www/',
        this.jsonPathServices
      );
    } else {
      return this.http.get(this.jsonPathServices).toPromise();
    }
  }
}
