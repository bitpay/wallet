import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Logger } from '@nsalaun/ng-logger';

import * as _ from 'lodash';

@Injectable()
export class NextStepsProvider {

  public services: any;

  constructor(
    public http: HttpClient,
    private logger: Logger,
  ) {
    this.logger.info('NextStepsProvider initialized.');
    this.services = [];
  }

  public register(serviceInfo) {
    this.logger.info('Adding NextSteps entry:' + serviceInfo.name);

    if (!_.find(this.services, function (x) {
      return x.name == serviceInfo.name;
    })) {
      this.services.push(serviceInfo);
    }
  };

  public unregister(serviceName) {

    var newS = _.filter(this.services, (x) => {
      return x.name != serviceName;
    });

    // Found?
    if (newS.length == this.services.length) return;

    this.logger.info('Removing NextSteps entry:' + serviceName);
    // This is to preserve services pointer
    while (this.services.length)
      this.services.pop();

    while (newS.length)
      this.services.push(newS.pop());
  };

  public get() {
    return this.services;
  };

}
