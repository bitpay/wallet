import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../../../providers/logger/logger';

// providers
import { BwcErrorProvider } from '../../../../../providers/bwc-error/bwc-error';
import { OnGoingProcessProvider } from '../../../../../providers/on-going-process/on-going-process';
import { PopupProvider } from '../../../../../providers/popup/popup';
import { ProfileProvider } from '../../../../../providers/profile/profile';
import { TxFormatProvider } from '../../../../../providers/tx-format/tx-format';
import { WalletProvider } from '../../../../../providers/wallet/wallet';

// pages
import { AllAddressesPage } from './all-addresses/all-addresses';

import * as _ from 'lodash';

@Component({
  selector: 'page-wallet-addresses',
  templateUrl: 'wallet-addresses.html'
})
export class WalletAddressesPage {
  public wallet;
  public loading: boolean;
  public latestUnused;
  public latestWithBalance;
  public viewAll: boolean;
  public gapReached: boolean;
  public lowUtxosNb: number;
  public allUtxosNb: number;
  public lowUtxosSum: string;
  public allUtxosSum: string;
  public minFee: string;
  public minFeePer: string;

  private UNUSED_ADDRESS_LIMIT: number;
  private BALANCE_ADDRESS_LIMIT: number;
  private withBalance;
  private noBalance;

  constructor(
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private logger: Logger,
    private bwcErrorProvider: BwcErrorProvider,
    private popupProvider: PopupProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private modalCtrl: ModalController,
    private txFormatProvider: TxFormatProvider,
    private translate: TranslateService
  ) {
    this.UNUSED_ADDRESS_LIMIT = 5;
    this.BALANCE_ADDRESS_LIMIT = 5;
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.withBalance = null;
    this.noBalance = null;
  }

  ionViewWillEnter() {
    this.loading = true;
    this.walletProvider
      .getMainAddresses(this.wallet, {})
      .then(allAddresses => {
        this.walletProvider
          .getBalance(this.wallet, {})
          .then(resp => {
            this.withBalance = resp.byAddress;

            var idx = _.keyBy(this.withBalance, 'address');
            this.noBalance = _.reject(allAddresses, x => {
              return idx[x.address];
            });

            this.processList(this.noBalance);
            this.processList(this.withBalance);

            this.latestUnused = _.slice(
              this.noBalance,
              0,
              this.UNUSED_ADDRESS_LIMIT
            );
            this.latestWithBalance = _.slice(
              this.withBalance,
              0,
              this.BALANCE_ADDRESS_LIMIT
            );
            this.viewAll =
              this.noBalance.length > this.UNUSED_ADDRESS_LIMIT ||
              this.withBalance.length > this.BALANCE_ADDRESS_LIMIT;

            this.loading = false;
          })
          .catch(err => {
            this.logger.error(err);
            this.loading = false;
            this.popupProvider.ionicAlert(
              this.bwcErrorProvider.msg(
                err,
                this.translate.instant('Could not update wallet')
              )
            );
          });
      })
      .catch(err => {
        this.logger.error(err);
        this.loading = false;
        this.popupProvider.ionicAlert(
          this.bwcErrorProvider.msg(
            err,
            this.translate.instant('Could not update wallet')
          )
        );
      });

    this.walletProvider
      .getLowUtxos(this.wallet)
      .then(resp => {
        if (resp && resp.allUtxos && resp.allUtxos.length) {
          let allSum = _.sumBy(resp.allUtxos || 0, 'satoshis');
          let per = (resp.minFee / allSum) * 100;

          this.lowUtxosNb = resp.lowUtxos.length;
          this.allUtxosNb = resp.allUtxos.length;
          this.lowUtxosSum = this.txFormatProvider.formatAmountStr(
            this.wallet.coin,
            _.sumBy(resp.lowUtxos || 0, 'satoshis')
          );
          this.allUtxosSum = this.txFormatProvider.formatAmountStr(
            this.wallet.coin,
            allSum
          );
          this.minFee = this.txFormatProvider.formatAmountStr(
            this.wallet.coin,
            resp.minFee || 0
          );
          this.minFeePer = per.toFixed(2) + '%';
        }
      })
      .catch(err => {
        this.logger.warn('GetLowUtxos', err);
      });
  }

  private processList(list): void {
    _.each(list, n => {
      n.path = n.path ? n.path.replace(/^m/g, 'xpub') : null;
      n.address = this.walletProvider.getAddressView(this.wallet, n.address);
    });
  }

  public newAddress(): void {
    if (this.gapReached) return;

    this.onGoingProcessProvider.set('generatingNewAddress');
    this.walletProvider
      .getAddress(this.wallet, true)
      .then((addr: string) => {
        this.walletProvider
          .getMainAddresses(this.wallet, { limit: 1 })
          .then(_addr => {
            this.onGoingProcessProvider.clear();
            if (addr != _addr[0].address) {
              this.popupProvider.ionicAlert(
                this.translate.instant('Error'),
                this.translate.instant(
                  'New address could not be generated. Please try again.'
                )
              );
              return;
            }
            this.noBalance = [_addr[0]].concat(this.noBalance);

            this.processList(this.noBalance);

            this.latestUnused = _.slice(
              this.noBalance,
              0,
              this.UNUSED_ADDRESS_LIMIT
            );
            this.viewAll = this.noBalance.length > this.UNUSED_ADDRESS_LIMIT;
          })
          .catch(err => {
            this.logger.error(err);
            this.onGoingProcessProvider.clear();
            this.popupProvider.ionicAlert(this.translate.instant('Error'), err);
          });
      })
      .catch(err => {
        this.logger.error(err);
        this.onGoingProcessProvider.clear();
        if (err.toString().match('MAIN_ADDRESS_GAP_REACHED')) {
          this.gapReached = true;
        } else {
          this.popupProvider.ionicAlert('Error', err);
        }
      });
  }

  public viewAllAddresses(): void {
    let modal = this.modalCtrl.create(AllAddressesPage, {
      noBalance: this.noBalance,
      withBalance: this.withBalance,
      coin: this.wallet.coin,
      walletName: this.wallet.name,
      walletColor: this.wallet.color
    });
    modal.present();
  }

  public async scan(): Promise<void> {
    this.walletProvider.startScan(this.wallet);
    return this.navCtrl.popToRoot();
  }
}
