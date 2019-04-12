import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// providers
import { Logger } from '../../providers/logger/logger';
import { PlatformProvider } from '../platform/platform';

declare var cordova: any;

@Injectable()
export class HttpRequestsProvider {
  private isIOS: boolean;

  constructor(
    private http: HttpClient,
    private logger: Logger,
    private platformProvider: PlatformProvider
  ) {
    this.logger.debug('HttpRequestsProvider Provider initialized');
    this.isIOS = this.platformProvider.isIOS;
  }

  public post(url, data, headers?): Observable<any> {
    if (this.isIOS) {
      return new Observable(observer => {
        cordova.plugin.http.setDataSerializer('json');
        cordova.plugin.http.post(
          url,
          data,
          headers,
          res => {
            try {
              res.data = JSON.parse(res.data);
            } catch (e) {
              // TODO
            }
            observer.next(res.data);
            observer.complete();
          },
          err => {
            observer.error(err.error);
          }
        );
      });
    } else return this.http.post(url, data, { headers });
  }

  public get(url, params?, headers?): Observable<any> {
    if (this.isIOS) {
      return new Observable(observer => {
        cordova.plugin.http.setDataSerializer('json');
        cordova.plugin.http.get(
          url,
          params,
          headers,
          res => {
            try {
              res.data = JSON.parse(res.data);
            } catch (e) {
              // TODO
            }
            observer.next(res.data);
            observer.complete();
          },
          err => {
            observer.error(err.error);
          }
        );
      });
    } else return this.http.get(url, { headers });
  }
}
