import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { File } from '@ionic-native/file';
import { Logger } from '../../providers/logger/logger';

// providers
import { ConfigProvider } from '../../providers/config/config';
import { LanguageProvider } from '../../providers/language/language';
import { PersistenceProvider } from '../../providers/persistence/persistence';
import { PlatformProvider } from '../platform/platform';

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

@Injectable()
export class AppProvider {
  public info: any = {};
  public servicesInfo;
  private jsonPathApp: string = 'assets/appConfig.json';
  private jsonPathServices: string = 'assets/externalServices.json';

  constructor(
    public http: HttpClient,
    private logger: Logger,
    private language: LanguageProvider,
    public config: ConfigProvider,
    private persistence: PersistenceProvider,
    private file: File,
    private platformProvider: PlatformProvider
  ) {
    this.logger.debug('AppProvider initialized');
  }

  public async load() {
    await Promise.all([this.getInfo(), this.loadProviders()]);
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
  }

  private async loadProviders() {
    this.persistence.load();
    await this.config.load();
    this.language.load();
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
