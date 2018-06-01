import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

import * as _ from 'lodash';

const exchangeList: object[] = [{ name: 'coinbase' }, { name: 'glidera' }];

@Injectable()
export class HomeIntegrationsProvider {
  public services: any;
  constructor(public http: HttpClient, private logger: Logger) {
    this.logger.info('HomeIntegrationsProviders initialized.');
    this.services = [];
  }

  public register(serviceInfo) {
    // Check if already exists
    if (_.find(this.services, { name: serviceInfo.name })) return;
    this.logger.info('Adding home Integrations entry:' + serviceInfo.name);
    this.services.push(serviceInfo);
  }

  public unregister(serviceName) {
    this.services = _.filter(this.services, x => {
      return x.name != serviceName;
    });
  }

  public updateLink(serviceName, token) {
    this.services = _.filter(this.services, x => {
      if (x.name == serviceName) x.linked = !!token;
      return x;
    });
  }

  public updateConfig(serviceName, show) {
    this.services = _.filter(this.services, x => {
      if (x.name == serviceName) x.show = !!show;
      return x;
    });
  }

  public get() {
    return _.orderBy(this.services, ['name'], ['asc']);
  }

  public getAvailableExchange() {
    let exchangeServices = _.intersectionBy(
      this.services,
      exchangeList,
      'name'
    );
    return _.filter(exchangeServices, { linked: true, show: true });
  }
}
