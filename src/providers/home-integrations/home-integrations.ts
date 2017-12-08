import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Logger } from '@nsalaun/ng-logger';

import * as _ from 'lodash';

@Injectable()
export class HomeIntegrationsProvider {
  public services: any;
  constructor(
    public http: HttpClient,
    private logger: Logger,
  ) {
    this.logger.info('HomeIntegrationsProviders initialized.');
    this.services = [];
  }

  public register(serviceInfo) {
    // Check if already exists
    if (_.find(this.services, { 'name': serviceInfo.name })) return;
    this.logger.info('Adding home Integrations entry:' + serviceInfo.name);
    this.services.push(serviceInfo);
  };

  public unregister(serviceName) {
    this.services = _.filter(this.services, (x) => {
      return x.name != serviceName
    });
  };

  public get() {
    return this.services;
  };

}

