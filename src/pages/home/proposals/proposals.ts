import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Logger } from '../../../providers/logger/logger';

// providers
import { AddressBookProvider } from '../../../providers/address-book/address-book';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { ProfileProvider } from '../../../providers/profile/profile';

@Component({
  selector: 'page-proposals',
  templateUrl: 'proposals.html'
})
export class ProposalsPage {
  public addressbook;
  public txps;

  constructor(
    private onGoingProcessProvider: OnGoingProcessProvider,
    private addressBookProvider: AddressBookProvider,
    private logger: Logger,
    private profileProvider: ProfileProvider,
    private translate: TranslateService
  ) {}

  ionViewWillEnter() {
    this.addressBookProvider
      .list()
      .then(ab => {
        this.addressbook = ab || {};

        let loading = this.translate.instant(
          'Updating pending proposals... Please stand by'
        );
        this.onGoingProcessProvider.set(loading);
        this.profileProvider
          .getTxps(50)
          .then(txpsData => {
            this.onGoingProcessProvider.clear();
            this.txps = txpsData.txps;
          })
          .catch(err => {
            this.onGoingProcessProvider.clear();
            this.logger.error(err);
          });
      })
      .catch(err => {
        this.logger.error(err);
      });
  }
}
