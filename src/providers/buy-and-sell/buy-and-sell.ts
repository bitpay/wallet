
import { Injectable } from '@angular/core';
import { Logger } from '@nsalaun/ng-logger';

//providers
import { NextStepsProvider } from '../next-steps/next-steps';

import * as _ from "lodash";

@Injectable()
export class BuyAndSellProvider {

  private updateNextStepsDebunced: any;
  private services: any;
  private linkedServices: any;

  constructor(
    private logger: Logger,
    private nextStepsProvider: NextStepsProvider
  ) {
    this.logger.info('BuyAndSellProvider initialized.');
    this.updateNextStepsDebunced = _.debounce(this.update, 1000);
    this.services = [];
    this.linkedServices = [];
  }

  public update() {

    var newLinked = _.filter(this.services, (x) => {
      return x.linked;
    });

    // This is to preserve linkedServices pointer
    while (this.linkedServices.length)
      this.linkedServices.pop();

    while (newLinked.length)
      this.linkedServices.push(newLinked.pop());
    //

    this.logger.debug('buyAndSell Service, updating nextSteps. linked/total: ' + this.linkedServices.length + '/' + this.services.length);

    if (this.linkedServices.length == 0) {
      this.nextStepsProvider.register({
        title: 'Buy or Sell Bitcoin',
        name: 'buyandsell',
        icon: 'assets/img/app/icon-bitcoin.svg',
        page: 'BuyAndSellPage',
      });
    } else {
      this.nextStepsProvider.unregister({
        name: 'buyandsell',
      });
    };
  }


  public register(serviceInfo) {
    this.services.push(serviceInfo);
    this.logger.info('Adding Buy and Sell service: ' + serviceInfo.name + ' linked: ' + serviceInfo.linked);
    this.updateNextStepsDebunced();
  }


  public updateLink(name, linked) {
    var service = _.find(this.services, (x) => {
      return x.name == name;
    });
    this.logger.info('Updating Buy and Sell service: ' + name + ' linked: ' + linked);
    service.linked = linked

    this.update();
  }


  public get() {
    return this.services;
  }


  public getLinked() {
    return this.linkedServices;
  }
}

