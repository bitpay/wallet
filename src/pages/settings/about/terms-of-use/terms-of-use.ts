import { Component } from '@angular/core';
import { Logger } from '../../../../providers/logger/logger';

@Component({
  selector: 'page-terms-of-use',
  templateUrl: 'terms-of-use.html',
})
export class TermsOfUsePage {

  constructor(
    private logger: Logger
  ) {
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad TermsOfUsePage');
  }

}
