import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Logger } from '@nsalaun/ng-logger';
import 'rxjs/add/operator/map';

import { LanguageProvider } from '../../providers/language/language';
import { ConfigProvider } from '../../providers/config/config';

interface App {
  WindowsStoreDisplayName: string;
  WindowsStoreIdentityName: string;
  androidVersion: string;
  appDescription: string;
  appUri: string;
  bundleName: string;
  commitHash: string;
  description: string;
  disclaimerUrl: string;
  gitHubRepoBugs: string;
  gitHubRepoName: string;
  gitHubRepoUrl: string;
  name: string;
  nameCase: string;
  nameCaseNoSpace: string;
  nameNoSpace: string;
  packageDescription: string;
  packageName: string;
  packageNameId: string;
  purposeLine: string;
  pushSenderId: string;
  statusBarColor: string;
  url: string;
  userVisibleName: string;
  version: string;
  winAppName: string;
  windowsAppId: string;
  _enabledExtensions: {
    amazon: boolean;
    coinbase: boolean;
    glidera: boolean;
  }
  _extraCSS: string;
}

@Injectable()
export class AppProvider {
  public info: App;
  private jsonPath: string = 'assets/appConfig.json';

  constructor(
    public http: Http,
    private logger: Logger,
    private language: LanguageProvider,
    private config: ConfigProvider
  ) {
    this.logger.info('AppProvider initialized.');
  }

  public load() {
    return new Promise((resolve, reject) => {
      this.config.load().then((config) => {
        // storage -> config -> language -> unit -> app
        // Everything ok
        this.language.init(config);
        this.getInfo().subscribe((info) => {
          this.info = info;
          resolve(true);
        });
      }).catch((err) => {
        // Something may be wrong
        reject(err);
      });
    });
  }

  getInfo() {
    return this.http.get(this.jsonPath)
      .map((res: Response) => res.json());
  }
}
