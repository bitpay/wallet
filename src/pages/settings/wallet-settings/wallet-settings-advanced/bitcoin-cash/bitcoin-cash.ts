import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { App, Events, NavParams } from 'ionic-angular';
import * as lodash from 'lodash';
import { Logger } from '../../../../../providers/logger/logger';

// Providers
import { BwcErrorProvider } from '../../../../../providers/bwc-error/bwc-error';
import { BwcProvider } from '../../../../../providers/bwc/bwc';
import { ExternalLinkProvider } from '../../../../../providers/external-link/external-link';
import { OnGoingProcessProvider } from '../../../../../providers/on-going-process/on-going-process';
import { PopupProvider } from '../../../../../providers/popup/popup';
import { ProfileProvider } from '../../../../../providers/profile/profile';
import { PushNotificationsProvider } from '../../../../../providers/push-notifications/push-notifications';
import { TxFormatProvider } from '../../../../../providers/tx-format/tx-format';
import {
  WalletOptions,
  WalletProvider
} from '../../../../../providers/wallet/wallet';
import { TabsPage } from '../../../../tabs/tabs';

@Component({
  selector: 'page-bitcoin-cash',
  templateUrl: 'bitcoin-cash.html'
})
export class BitcoinCashPage {
  private errors;

  public availableWallet;
  public nonEligibleWallet;
  public error;

  constructor(
    private app: App,
    private walletProvider: WalletProvider,
    private profileProvider: ProfileProvider,
    private txFormatProvider: TxFormatProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private popupProvider: PopupProvider,
    private pushNotificationsProvider: PushNotificationsProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private bwcProvider: BwcProvider,
    private logger: Logger,
    private translate: TranslateService,
    private events: Events,
    private navParams: NavParams
  ) {
    this.errors = this.bwcProvider.getErrors();
  }

  ionViewWillEnter() {
    let wallet = this.profileProvider.getWallet(this.navParams.data.walletId);

    // Filter out already duplicated wallets
    let walletsBCH = this.profileProvider.getWallets({
      coin: 'bch',
      network: 'livenet'
    });

    let xPubKeyIndex = lodash.keyBy(walletsBCH, 'credentials.xPubKey');

    if (xPubKeyIndex[wallet.credentials.xPubKey]) {
      wallet.excludeReason = this.translate.instant('Already duplicated');
      this.nonEligibleWallet = wallet;
    } else if (wallet.credentials.derivationStrategy != 'BIP44') {
      wallet.excludeReason = this.translate.instant('Non BIP44 wallet');
      this.nonEligibleWallet = wallet;
    } else if (!wallet.canSign()) {
      wallet.excludeReason = this.translate.instant('Read only wallet');
      this.nonEligibleWallet = wallet;
    } else if (wallet.needsBackup) {
      wallet.excludeReason = this.translate.instant('Needs backup');
      this.nonEligibleWallet = wallet;
    } else {
      this.availableWallet = wallet;
    }

    if (!this.availableWallet) return;

    this.walletProvider
      .getBalance(this.availableWallet, { coin: 'bch' })
      .then(balance => {
        this.availableWallet.bchBalance = this.txFormatProvider.formatAmountStr(
          'bch',
          balance.availableAmount
        );
        this.availableWallet.error = null;
      })
      .catch(err => {
        this.availableWallet.error =
          err === 'WALLET_NOT_REGISTERED'
            ? this.translate.instant('Wallet not registered')
            : this.bwcErrorProvider.msg(err);
        this.logger.error(err);
      });
  }

  public duplicate(wallet) {
    this.logger.debug(
      'Duplicating wallet for BCH: ' + wallet.id + ': ' + wallet.name
    );

    let opts: Partial<WalletOptions> = {
      name: wallet.name + '[BCH]',
      m: wallet.m,
      n: wallet.n,
      myName: wallet.credentials.copayerName,
      networkName: wallet.network,
      coin: 'bch',
      walletPrivKey: wallet.credentials.walletPrivKey,
      compliantDerivation: wallet.credentials.compliantDerivation
    };

    const setErr = err => {
      this.bwcErrorProvider.cb(err, 'Could not duplicate').then(errorMsg => {
        this.logger.warn('Duplicate BCH', errorMsg);
        this.popupProvider.ionicAlert(errorMsg, null, 'OK');
        return;
      });
    };

    const importOrCreate: () => Promise<{
      newWallet: any;
      isNew?: boolean;
    }> = () => {
      return new Promise((resolve, reject) => {
        this.walletProvider
          .getStatus(wallet, {})
          .then(status => {
            opts.singleAddress = status.wallet.singleAddress;

            // first try to import
            this.profileProvider
              .importExtendedPrivateKey(opts.extendedPrivateKey, opts)
              .then(newWallet => {
                return resolve({ newWallet });
              })
              .catch(err => {
                if (!(err instanceof this.errors.NOT_AUTHORIZED)) {
                  return reject(err);
                }
                // create and store a wallet
                this.profileProvider
                  .createWallet(opts)
                  .then(newWallet => {
                    return resolve({ newWallet, isNew: true });
                  })
                  .catch(err => {
                    return reject(err);
                  });
              });
          })
          .catch(err => {
            return reject(err);
          });
      });
    };

    // Multisig wallets? add Copayers
    function addCopayers(newWallet, isNew, cb) {
      if (!isNew) return cb();
      if (wallet.n == 1) return cb();

      this.logger.info(
        'Adding copayers for BCH wallet config:' + wallet.m + '-' + wallet.n
      );

      this.walletProvider.copyCopayers(wallet, newWallet, err => {
        if (err) {
          return cb(err);
        }
        return cb();
      });
    }

    this.walletProvider
      .getKeys(wallet)
      .then(keys => {
        opts.extendedPrivateKey = keys.xPrivKey;
        this.onGoingProcessProvider.set('duplicatingWallet');
        importOrCreate()
          .then(result => {
            let newWallet = result.newWallet;
            let isNew = result.isNew;

            this.walletProvider.updateRemotePreferences(newWallet);
            this.pushNotificationsProvider.updateSubscription(newWallet);

            addCopayers(newWallet, isNew, err => {
              this.onGoingProcessProvider.clear();
              if (err) {
                return setErr(err);
              }
              if (isNew) {
                this.walletProvider.startScan(newWallet);
              }

              this.events.publish('status:updated');
              this.app.getRootNavs()[0].setRoot(TabsPage);
            });
          })
          .catch(err => {
            this.onGoingProcessProvider.clear();
            setErr(err);
          });
      })
      .catch(err => {
        setErr(err);
      });
  }

  public openHelpExternalLink(): void {
    let url =
      'https://support.bitpay.com/hc/en-us/articles/115005019583-How-Can-I-Recover-Bitcoin-Cash-BCH-from-My-Wallet-';
    let optIn = true;
    let title = null;
    let message = this.translate.instant(
      'Help and support information is available at the website'
    );
    let okText = this.translate.instant('Open');
    let cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(
      url,
      optIn,
      title,
      message,
      okText,
      cancelText
    );
  }
}
