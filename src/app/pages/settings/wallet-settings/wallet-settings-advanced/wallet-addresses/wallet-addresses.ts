import { Component, ViewEncapsulation } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Logger } from '../../../../../providers/logger/logger';

// services
import { BwcErrorProvider } from '../../../../../providers/bwc-error/bwc-error';
import { PopupProvider } from '../../../../../providers/popup/popup';
import { ProfileProvider } from '../../../../../providers/profile/profile';
import { TxFormatProvider } from '../../../../../providers/tx-format/tx-format';
import { WalletProvider } from '../../../../../providers/wallet/wallet';

// pages
import { WalletDetailsPage } from '../../../../wallet-details/wallet-details';
import { AllAddressesPage } from './all-addresses/all-addresses';

import * as _ from 'lodash';
import { ModalController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'page-wallet-addresses',
  templateUrl: 'wallet-addresses.html',
  styleUrls: ['wallet-addresses.scss'],
  encapsulation: ViewEncapsulation.None
})
export class WalletAddressesPage {
  public wallet;
  public loading: boolean;
  public latestUnused;
  public latestWithBalance;
  public viewAll: boolean;
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
  navParamsData;

  constructor(
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private router: Router,
    private logger: Logger,
    private bwcErrorProvider: BwcErrorProvider,
    private popupProvider: PopupProvider,
    private modalCtrl: ModalController,
    private txFormatProvider: TxFormatProvider,
    private translate: TranslateService
  ) {
    if (this.router.getCurrentNavigation()) {
       this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData = history ? history.state : {};
    }
    this.UNUSED_ADDRESS_LIMIT = 5;
    this.BALANCE_ADDRESS_LIMIT = 5;
    this.wallet = this.profileProvider.getWallet(this.navParamsData.walletId);
    this.withBalance = null;
    this.noBalance = null;
  }

  ionViewWillEnter() {
    this.loading = true;
    this.walletProvider
      .getMainAddresses(this.wallet, {
        doNotVerify: true
      })
      .then(allAddresses => {
        const { token, multisigEthInfo } = this.wallet.credentials;
        this.walletProvider
          .getBalance(this.wallet, {
            tokenAddress: token ? token.address : '',
            multisigContractAddress: multisigEthInfo
              ? multisigEthInfo.multisigContractAddress
              : ''
          })
          .then(resp => {
            this.withBalance = resp.byAddress;

            const idx = _.keyBy(this.withBalance, 'address');
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
          const allSum = _.sumBy(resp.allUtxos || 0, 'satoshis');
          const per = (resp.minFee / allSum) * 100;

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
      n.address = this.walletProvider.getAddressView(
        this.wallet.coin,
        this.wallet.network,
        n.address
      );
    });
  }

  public async viewAllAddresses() {
    const modal = await this.modalCtrl.create({
      component: AllAddressesPage,
      componentProps: {
        noBalance: this.noBalance,
        withBalance: this.withBalance,
        coin: this.wallet.coin,
        walletName: this.wallet.name
      }
    });
    await modal.present();
  }

  public scan() {
    this.walletProvider.startScan(this.wallet);
    this.router.navigate([''], { replaceUrl: true }).then(() => {
      setTimeout(() => {
        this.router.navigate(['/wallet-details'], {
          state: { walletId: this.wallet.credentials.walletId }
        });
      }, 1000);
    });
  }
}
