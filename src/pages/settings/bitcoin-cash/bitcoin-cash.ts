import { Component } from "@angular/core";
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController } from 'ionic-angular';
import * as lodash from 'lodash';
import { Logger } from "../../../providers/logger/logger";

// Providers
import { BwcErrorProvider } from "../../../providers/bwc-error/bwc-error";
import { BwcProvider } from "../../../providers/bwc/bwc";
import { ExternalLinkProvider } from "../../../providers/external-link/external-link";
import { OnGoingProcessProvider } from "../../../providers/on-going-process/on-going-process";
import { PopupProvider } from "../../../providers/popup/popup";
import { ProfileProvider } from '../../../providers/profile/profile';
import { PushNotificationsProvider } from "../../../providers/push-notifications/push-notifications";
import { TxFormatProvider } from "../../../providers/tx-format/tx-format";
import { WalletProvider } from "../../../providers/wallet/wallet";

@Component({
  selector: 'page-bitcoin-cash',
  templateUrl: 'bitcoin-cash.html',
})
export class BitcoinCashPage {
  private walletsBTC: any[];
  private walletsBCH: any[];
  private errors: any;

  public availableWallets: any[];
  public nonEligibleWallets: any[];
  public error: any;

  constructor(
    private navCtrl: NavController,
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
    private events: Events
  ) {
    this.walletsBTC = [];
    this.walletsBCH = [];
    this.availableWallets = [];
    this.nonEligibleWallets = [];
    this.errors = this.bwcProvider.getErrors();
  }

  ionViewWillEnter() {

    this.walletsBTC = this.profileProvider.getWallets({
      coin: 'btc',
      onlyComplete: true,
      network: 'livenet'
    });

    // Filter out already duplicated wallets
    this.walletsBCH = this.profileProvider.getWallets({
      coin: 'bch',
      network: 'livenet'
    });

    let xPubKeyIndex = lodash.keyBy(this.walletsBCH, "credentials.xPubKey");

    this.walletsBTC = lodash.filter(this.walletsBTC, w => {
      return !xPubKeyIndex[w.credentials.xPubKey];
    });

    lodash.each(this.walletsBTC, (w) => {
      if (w.credentials.derivationStrategy != 'BIP44') {
        w.excludeReason = this.translate.instant('Non BIP44 wallet');
        this.nonEligibleWallets.push(w);
      } else if (!w.canSign()) {
        w.excludeReason = this.translate.instant('Read only wallet');
        this.nonEligibleWallets.push(w);
      } else if (w.needsBackup) {
        w.excludeReason = this.translate.instant('Needs backup');
        this.nonEligibleWallets.push(w);
      } else {
        this.availableWallets.push(w);
      }
    });

    lodash.each(this.availableWallets, (wallet) => {
      this.walletProvider.getBalance(wallet, { coin: 'bch' }).then((balance) => {
        wallet.bchBalance = this.txFormatProvider.formatAmountStr('bch', balance.availableAmount);
        wallet.error = null;
      }).catch((err) => {
        wallet.error = (err === 'WALLET_NOT_REGISTERED') ? this.translate.instant('Wallet not registered') : this.bwcErrorProvider.msg(err);
        this.logger.error(err);
      });
    });
  }

  public openRecoveryToolLink(): void {
    let url = 'https://bitpay.github.io/copay-recovery/';
    let optIn = true;
    let title = null;
    let message = this.translate.instant('Open the recovery tool');
    let okText = this.translate.instant('Open');
    let cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(url, optIn, title, message, okText, cancelText);
  }

  public duplicate(wallet: any) {
    this.logger.debug('Duplicating wallet for BCH: ' + wallet.id + ': ' + wallet.name);

    let opts: any = {
      name: wallet.name + '[BCH]',
      m: wallet.m,
      n: wallet.n,
      myName: wallet.credentials.copayerName,
      networkName: wallet.network,
      coin: 'bch',
      walletPrivKey: wallet.credentials.walletPrivKey,
      compliantDerivation: wallet.credentials.compliantDerivation,
    };

    let setErr = (err) => {
      this.bwcErrorProvider.cb(err, 'Could not duplicate').then((errorMsg) => {
        this.logger.warn('Duplicate BCH', errorMsg);
        this.popupProvider.ionicAlert(errorMsg, null, 'OK');
        return;
      });
    }

    let importOrCreate = () => {
      return new Promise((resolve, reject) => {
        this.walletProvider.getStatus(wallet, {}).then((status: any) => {
          opts.singleAddress = status.wallet.singleAddress;

          // first try to import
          this.profileProvider.importExtendedPrivateKey(opts.extendedPrivateKey, opts).then((newWallet) => {
            return resolve({ newWallet });
          }).catch((err) => {
            if (!(err instanceof this.errors.NOT_AUTHORIZED)) {
              return reject(err);
            }
            // create and store a wallet
            this.profileProvider.createWallet(opts).then((newWallet) => {
              return resolve({ newWallet, isNew: true });
            }).catch((err) => {
              return reject(err);
            });
          });
        }).catch((err) => {
          return reject(err);
        });
      });
    };

    // Multisig wallets? add Copayers
    function addCopayers(newWallet, isNew, cb) {
      if (!isNew) return cb();
      if (wallet.n == 1) return cb();

      this.logger.info('Adding copayers for BCH wallet config:' + wallet.m + '-' + wallet.n);

      this.walletProvider.copyCopayers(wallet, newWallet, (err) => {
        if (err) {
          return cb(err);
        }
        return cb();
      });
    };

    this.walletProvider.getKeys(wallet).then((keys) => {
      opts.extendedPrivateKey = keys.xPrivKey;
      this.onGoingProcessProvider.set('duplicatingWallet');
      importOrCreate().then((result: any) => {
        let newWallet = result.newWallet;
        let isNew = result.isNew;

        this.walletProvider.updateRemotePreferences(newWallet);
        this.pushNotificationsProvider.updateSubscription(newWallet);

        addCopayers(newWallet, isNew, (err) => {
          this.onGoingProcessProvider.clear();
          if (err) {
            return setErr(err);
          }
          if (isNew) {
            this.walletProvider.startScan(newWallet);
          }

          this.events.publish('status:updated');
          this.navCtrl.popToRoot({ animate: false }).then(() => {
            this.navCtrl.parent.select(0);
          });
        });
      }).catch((err) => {
        this.onGoingProcessProvider.clear();
        setErr(err);
      });
    }).catch((err) => {
      setErr(err);
    });
  }
}
