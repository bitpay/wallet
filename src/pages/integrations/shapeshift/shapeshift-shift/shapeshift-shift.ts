import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController } from 'ionic-angular';
import * as _ from 'lodash';
import { Logger } from '../../../../providers/logger/logger';

// Pages
import { AmountPage } from './../../../send/amount/amount';

// Providers
import { ActionSheetProvider } from '../../../../providers/action-sheet/action-sheet';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { PopupProvider } from '../../../../providers/popup/popup';
import { ProfileProvider } from '../../../../providers/profile/profile';
import { ShapeshiftProvider } from '../../../../providers/shapeshift/shapeshift';

@Component({
  selector: 'page-shapeshift-shift',
  templateUrl: 'shapeshift-shift.html'
})
export class ShapeshiftShiftPage {
  private allWallets;

  public toWallets;
  public fromWallets;
  public fromWallet;
  public toWallet;
  public limit;
  public network: string;
  public fromWalletSelectorTitle: string;
  public toWalletSelectorTitle: string;
  public termsAccepted: boolean;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private logger: Logger,
    private navCtrl: NavController,
    private popupProvider: PopupProvider,
    private profileProvider: ProfileProvider,
    private shapeshiftProvider: ShapeshiftProvider,
    private translate: TranslateService
  ) {
    this.toWallets = [];
    this.fromWallets = [];
    this.fromWalletSelectorTitle = 'From';
    this.toWalletSelectorTitle = 'To';
    this.termsAccepted = false;
    this.network = this.shapeshiftProvider.getNetwork();

    this.allWallets = this.profileProvider.getWallets({
      onlyComplete: true,
      network: this.network
    });

    if (_.isEmpty(this.allWallets)) {
      this.showErrorAndBack(
        null,
        this.translate.instant('No wallets available to use ShapeShift')
      );
      return;
    }

    this.fromWallets = this.allWallets.filter(w => {
      return w.cachedStatus && w.cachedStatus.availableBalanceSat > 0;
    });

    if (_.isEmpty(this.fromWallets)) {
      this.showErrorAndBack(
        null,
        this.translate.instant('No wallets with funds')
      );
      return;
    }
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: ShapeshiftShiftPage');
  }

  ionViewDidEnter() {
    this.termsAccepted = false;
  }

  public openTerms() {
    let url = 'https://shapeshift.com/terms-of-service';
    this.externalLinkProvider.open(url);
  }

  private showErrorAndBack(title: string, msg, noExit?: boolean): void {
    title = title ? title : this.translate.instant('Error');
    this.logger.error(msg);
    msg = msg && msg.errors ? msg.errors[0].message : msg.message || msg;
    this.popupProvider.ionicAlert(title, msg).then(() => {
      this.toWallet = this.limit = null;
      if (!noExit) this.navCtrl.pop();
    });
  }

  private showToWallets(): void {
    this.toWallets = this.allWallets.filter(
      w =>
        !w.needsBackup &&
        w.id != this.fromWallet.id &&
        w.coin != this.fromWallet.coin
    );

    if (_.isEmpty(this.toWallets)) {
      let msg = this.translate.instant(
        'Destination wallet needs to be backed up'
      );
      this.showErrorAndBack(null, msg);
      return;
    }
  }

  public onFromWalletSelect(wallet): void {
    this.fromWallet = wallet;
    this.toWallet = null; // Clear variable to select wallet again
    this.showToWallets();
  }

  public onToWalletSelect(wallet): void {
    this.toWallet = wallet;
    this.updateMarketInfo();
  }

  private updateMarketInfo() {
    if (!this.fromWallet || !this.toWallet) return;
    let msg = this.translate.instant(
      'ShapeShift is not available at this moment. Please, try again later.'
    );
    let pair = this.fromWallet.coin + '_' + this.toWallet.coin;

    this.shapeshiftProvider.getMarketInfo(pair, (error, limit) => {
      if (error) return this.showErrorAndBack(null, error, true);
      this.limit = limit;
      if (this.limit['rate'] == 0) return this.showErrorAndBack(null, msg);
    });
  }

  public setAmount(): void {
    if (!this.termsAccepted) {
      return;
    }

    if (this.toWallet.needsBackup) {
      let title = this.translate.instant('Needs backup');
      let msg = this.translate.instant(
        'The destination wallet is not backed up. Please, complete the backup process before continue.'
      );
      this.popupProvider.ionicAlert(title, msg);
      return;
    }

    this.navCtrl.push(AmountPage, {
      nextPage: 'ShapeshiftConfirmPage',
      fixedUnit: true,
      coin: this.fromWallet.coin,
      id: this.fromWallet.id,
      toWalletId: this.toWallet.id
    });
  }

  public showWallets(selector: string): void {
    let walletsForActionSheet = [];
    let selectedWalletId: string;
    let title: string =
      selector == 'from'
        ? this.fromWalletSelectorTitle
        : this.toWalletSelectorTitle;
    if (selector == 'from') {
      walletsForActionSheet = this.fromWallets;
      selectedWalletId = this.fromWallet ? this.fromWallet.id : null;
    } else if (selector == 'to') {
      walletsForActionSheet = this.toWallets;
      selectedWalletId = this.toWallet ? this.toWallet.id : null;
    }
    const params = {
      wallets: walletsForActionSheet,
      selectedWalletId,
      title
    };
    const walletSelector = this.actionSheetProvider.createWalletSelector(
      params
    );
    walletSelector.present();
    walletSelector.onDidDismiss(wallet => {
      if (!_.isEmpty(wallet)) this.onWalletSelect(wallet, selector);
    });
  }

  public onWalletSelect(wallet, selector: string): void {
    if (selector == 'from') {
      this.onFromWalletSelect(wallet);
    } else if (selector == 'to') {
      this.onToWalletSelect(wallet);
    }
  }
}
