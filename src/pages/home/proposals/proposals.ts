import { Component } from "@angular/core";
import { Logger } from '../../../providers/logger/logger';
import { TranslateService } from '@ngx-translate/core';

//providers
import { AddressBookProvider } from '../../../providers/address-book/address-book';
import { ProfileProvider } from '../../../providers/profile/profile';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';

@Component({
  selector: 'page-proposals',
  templateUrl: 'proposals.html',
})
export class ProposalsPage {

  public addressbook: any;
  public txps: any;

  constructor(
    private onGoingProcessProvider: OnGoingProcessProvider,
    private addressBookProvider: AddressBookProvider,
    private logger: Logger,
    private profileProvider: ProfileProvider,
    private translate: TranslateService
  ) {
  }

  ionViewWillEnter() {
    this.addressBookProvider.list().then((ab: any) => {
      this.addressbook = ab || {};

      let loading = this.translate.instant('Updating pending proposals... Please stand by');
      this.onGoingProcessProvider.set(loading, true);
      this.profileProvider.getTxps(50).then((txpsData) => {
        this.onGoingProcessProvider.set(loading, false);
        this.txps = txpsData.txps;
      }).catch((err: any) => {
        this.onGoingProcessProvider.set(loading, false);
        this.logger.error(err);
      });
    }).catch((err: any) => {
      this.logger.error(err);
    });
  }

}
