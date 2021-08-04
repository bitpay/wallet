import { Injectable } from '@angular/core';

import { Logger } from '../../providers/logger/logger';

@Injectable()
export class LocationProvider {
  public countryPromise: Promise<string>;
  constructor(private logger: Logger) {
    this.logger.debug('LocationProvider initialized');
  }

}
