import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Logger } from '../../providers/logger/logger';

// providers
import { ConfigProvider } from '../../providers/config/config';
import { LanguageProvider } from '../../providers/language/language';
import { PersistenceProvider } from '../../providers/persistence/persistence';
import { PlatformProvider } from '../../providers/platform/platform';

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
    private platformProvider: PlatformProvider
  ) {
    this.logger.debug('AppProvider initialized');
  }

  public async load() {
    await Promise.all([this.getInfo(), this.loadProviders()]);
    this.setCustomMenuBarNW();
    this.persistence.getPersistentLogs();
    this.persistence.checkLogsConfig();
  }

  private async getInfo() {
    [this.servicesInfo, this.info] = await Promise.all([
      this.getServicesInfo(),
      this.getAppInfo()
    ]);
  }

  private async loadProviders() {
    this.persistence.load();
    await this.config.load();
    this.language.load();
  }

  private getAppInfo() {
    return this.http.get(this.jsonPathApp).toPromise();
  }

  private getServicesInfo() {
    return this.http.get(this.jsonPathServices).toPromise();
  }

  public setCustomMenuBarNW() {
    if (!this.platformProvider.isNW) {
      return;
    }
    let gui = (window as any).require('nw.gui');
    let win = gui.Window.get();
    let nativeMenuBar = new gui.Menu({
      type: 'menubar'
    });
    try {
      nativeMenuBar.createMacBuiltin(this.info.nameCase);
    } catch (e) {
      this.logger.warn('This is not OSX');
    }
    win.menu = nativeMenuBar;
  }
}
