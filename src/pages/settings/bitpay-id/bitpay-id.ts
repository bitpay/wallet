import { Component } from '@angular/core';

// providers
import { Logger } from '../../../providers';

@Component({
  selector: 'bitpay-id',
  templateUrl: 'bitpay-id.html'
})
export class BitPayIdPage {
  constructor(private logger: Logger) {}

  ionViewDidLoad() {
    this.logger.info('Loaded: BitPayID page');
  }
}
