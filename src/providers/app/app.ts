import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Logger } from '@nsalaun/ng-logger';
import 'rxjs/add/operator/map';

import { LanguageProvider } from '../../providers/language/language';
import { ConfigProvider } from '../../providers/config/config';
import { TouchIdProvider } from '../../providers/touchid/touchid';

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
  _enabledExtensions: object;
}

@Injectable()
export class AppProvider {
  public info: App;
  private jsonPath: string = 'assets/appConfig.json';

  constructor(
    public http: Http,
    private logger: Logger,
    private language: LanguageProvider,
    private config: ConfigProvider,
    private touchid: TouchIdProvider
  ) {
    this.logger.info('AppProvider initialized.');
  }

  public load() {
    return new Promise((resolve, reject) => {
      this.config.load().then(() => {
        this.language.load();
        this.touchid.init();
        this.getInfo().subscribe((info) => {
          this.info = info;
          resolve();
        });
      }).catch((err) => {
        this.logger.error(err);
        reject();
      });
    });
  }

  private getInfo() {
    return this.http.get(this.jsonPath)
      .map((res: Response) => res.json());
  }
}
