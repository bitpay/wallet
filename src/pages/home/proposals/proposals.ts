import { Component, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController, Platform } from 'ionic-angular';
import { Subscription } from 'rxjs';

// providers
import { AddressBookProvider } from '../../../providers/address-book/address-book';
import { Logger } from '../../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { ProfileProvider } from '../../../providers/profile/profile';
import { WalletProvider } from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-proposals',
  templateUrl: 'proposals.html'
})
export class ProposalsPage {
  public addressbook;
  public txps;

  private zone;
  private onResumeSubscription: Subscription;
  private onPauseSubscription: Subscription;

  constructor(
    private plt: Platform,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private addressBookProvider: AddressBookProvider,
    private logger: Logger,
    private profileProvider: ProfileProvider,
    private translate: TranslateService,
    private events: Events,
    private walletProvider: WalletProvider,
    private navCtrl: NavController
  ) {
    this.zone = new NgZone({ enableLongStackTrace: false });
  }

  ionViewWillEnter() {
    this.updateAddressBook();
    this.updatePendingProposals();

    this.subscribeBwsEvents();
    this.subscribeLocalTxAction();


    this.onResumeSubscription = this.plt.resume.subscribe(() => {
      this.subscribeBwsEvents();
      this.subscribeLocalTxAction();
    });

    this.onPauseSubscription = this.plt.pause.subscribe(() => {
      this.events.unsubscribe('bwsEvent');
      this.events.unsubscribe('Local/TxAction');
    });
  }

  ngOnDestroy() {
    this.events.unsubscribe('bwsEvent');
    this.events.unsubscribe('Local/TxAction');
    this.onResumeSubscription.unsubscribe();
    this.onPauseSubscription.unsubscribe();
  }

  private subscribeBwsEvents(): void {
    this.events.subscribe('bwsEvent', (walletId: string) => {
      this.updateWallet({ walletId });
    });
  }

  private subscribeLocalTxAction(): void {
    this.events.subscribe('Local/TxAction', opts => {
      this.updateWallet(opts);
    });
  }

  private updateAddressBook(): void {
    this.addressBookProvider
      .list()
      .then(ab => {
        this.addressbook = ab || {};
      })
      .catch(err => {
        this.logger.error(err);
      });
  }

  private updateWallet(opts): void {
    const loading = this.translate.instant(
      'Updating pending proposals... Please stand by'
    );
    this.onGoingProcessProvider.set(loading);
    const wallet = this.profileProvider.getWallet(opts.walletId);
    this.walletProvider
      .getStatus(wallet, opts)
      .then(status => {
        wallet.status = status;
        wallet.error = null;
        this.profileProvider.setLastKnownBalance(
          wallet.id,
          wallet.status.availableBalanceStr
        );

        // Update txps
        this.updatePendingProposals();
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        this.logger.error(err);
      });
  }

  private updatePendingProposals(): void {
    this.profileProvider
      .getTxps({ limit: 50 })
      .then(txpsData => {
        this.onGoingProcessProvider.clear();
        this.zone.run(() => {
          this.txps = txpsData.txps;
          if (this.txps && !this.txps[0]) {
            this.navCtrl.pop();
          }
        });
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        this.logger.error(err);
      });
  }
}
