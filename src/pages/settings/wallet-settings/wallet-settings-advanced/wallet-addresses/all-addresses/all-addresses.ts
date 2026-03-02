import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { Logger } from '../../../../../../providers/logger/logger';

// native
import { SocialSharing } from '@ionic-native/social-sharing';

// providers
import { AppProvider } from '../../../../../../providers/app/app';
import { OnGoingProcessProvider } from '../../../../../../providers/on-going-process/on-going-process';
import { PlatformProvider } from '../../../../../../providers/platform/platform';

@Component({
  selector: 'page-all-addresses',
  templateUrl: 'all-addresses.html'
})
export class AllAddressesPage {
  public noBalance;
  public withBalance;
  public coin: string;
  public isCordova: boolean;
  public allAddresses;

  private walletName: string;

  constructor(
    private navParams: NavParams,
    private viewCtrl: ViewController,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private socialSharing: SocialSharing,
    private appProvider: AppProvider,
    private logger: Logger,
    private platformProvider: PlatformProvider
  ) {
    this.walletName = this.navParams.data.walletName;
    this.noBalance = this.navParams.data.noBalance;
    this.withBalance = this.navParams.data.withBalance;
    this.coin = this.navParams.data.coin;
    this.allAddresses = this.noBalance.concat(this.withBalance);
    this.isCordova = this.platformProvider.isCordova;
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

  private formatDate(ts: number) {
    const dateObj = new Date(ts * 1000);
    if (!dateObj) {
      this.logger.warn('Error formating a date');
      return 'DateError';
    }
    if (!dateObj.toJSON()) {
      return '';
    }
    return dateObj.toJSON();
  }

  public sendByEmail() {
    this.onGoingProcessProvider.set('sendingByEmail');
    setTimeout(() => {
      this.onGoingProcessProvider.clear();
      const appName = this.appProvider.info.nameCase;

      let body: string =
        appName +
        ' Wallet "' +
        this.walletName +
        '" Addresses\n  Only Main Addresses are  shown.\n\n';
      body += '\n';
      body += this.allAddresses
        .map(v => {
          return (
            '* ' +
            v.address +
            ' xpub' +
            v.path.substring(1) +
            ' ' +
            this.formatDate(v.createdOn)
          );
        })
        .join('\n');

      const subject = appName + ' Addresses';

      // Check if sharing via email is supported
      this.socialSharing
        .canShareViaEmail()
        .then(() => {
          this.logger.info('sharing via email is possible');
          this.socialSharing
            .shareViaEmail(
              body,
              subject,
              null, // TO: must be null or an array
              null, // CC: must be null or an array
              null, // BCC: must be null or an array
              null // FILES: can be null, a string, or an array
            )
            .then(data => {
              this.logger.info('Email created successfully: ', data);
            })
            .catch(err => {
              this.logger.error('socialSharing Error: ', err);
            });
        })
        .catch(() => {
          this.logger.warn('sharing via email is not possible');
          this.socialSharing.share(body, subject).catch(err => {
            this.logger.error('socialSharing Error: ', err);
          });
        });
    });
  }
}
