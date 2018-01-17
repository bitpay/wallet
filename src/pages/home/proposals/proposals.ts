import { Component } from "@angular/core";
import { Logger } from '../../../providers/logger/logger';

//providers
import { AddressBookProvider } from '../../../providers/address-book/address-book';
import { ProfileProvider } from '../../../providers/profile/profile';

@Component({
  selector: 'page-proposals',
  templateUrl: 'proposals.html',
})
export class ProposalsPage {

  public fetchingProposals: boolean;
  public addressbook: any;
  public txps: any;

  constructor(
    private addressBookProvider: AddressBookProvider,
    private logger: Logger,
    private profileProvider: ProfileProvider
  ) {
    this.fetchingProposals = true;
  }

  ionViewDidEnter() {
    this.addressBookProvider.list().then((ab: any) => {
      this.addressbook = ab || {};

      this.profileProvider.getTxps(50).then((txpsData) => {
        this.fetchingProposals = false;
        this.txps = txpsData.txps;
      }).catch((err: any) => {
        this.fetchingProposals = false;
        this.logger.error(err);
      });
    }).catch((err: any) => {
      this.logger.error(err);
    });
  }

}
