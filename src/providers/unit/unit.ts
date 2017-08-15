import { Injectable } from '@angular/core';
import { Logger } from '@nsalaun/ng-logger';

import { ConfigProvider } from '../../providers/config/config';

import * as _ from 'lodash';

interface Unit {
  name: string;
  shortName: string;
  value: number;
  decimals: number;
  code: string;
}

@Injectable()
export class UnitProvider {
  public info: Unit;
  private unitList: Array<Unit> = [{
    name: 'bits (1,000,000 bits = 1BTC)',
    shortName: 'bits',
    value: 100,
    decimals: 2,
    code: 'bit',
  }, {
    name: 'BTC',
    shortName: 'BTC',
    value: 100000000,
    decimals: 8,
    code: 'btc',
  }];

  constructor(
    private config: ConfigProvider,
    private logger: Logger
  ) {
    this.logger.info('UnitProvider initialized.');
  }

  private getItem(code: string) {
    return _.find(this.unitList, {
      'code': code
    });
  }

  init(config: object) {
    let code = config['wallet']['settings']['unitCode']; // TODO
    this.info = this.getItem(code);
  }

  getList() {
    return this.unitList;
  }

  getCode() {
    return this.info.code;
  }

  setUnit(code: string) {
    this.info = this.getItem(code);
    this.config.set({ wallet: { settings: this.info } });
  }

}
