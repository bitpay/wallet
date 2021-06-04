import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';

// Providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { AddressProvider } from '../../../providers/address/address';
import { ProfileProvider } from '../../../providers/profile/profile';
import { WalletProvider } from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-custom-token',
  templateUrl: 'custom-token.html'
})
export class CustomTokenPage {
  public pairedWallet: any;
  public keyId: string;
  public isOpenSelector: boolean;
  public customTokenForm: FormGroup;
  public isValid: boolean;

  constructor(
    private profileProvider: ProfileProvider,
    private actionSheetProvider: ActionSheetProvider,
    private navParams: NavParams,
    private fb: FormBuilder,
    private walletProvider: WalletProvider,
    private navCtrl: NavController,
    private events: Events,
    private addressProvider: AddressProvider,
    private translate: TranslateService
  ) {
    this.keyId = this.navParams.get('keyId');
    this.customTokenForm = this.fb.group({
      tokenName: [null, Validators.required],
      tokenAddress: [null, Validators.required],
      tokenSymbol: [null, Validators.required],
      tokenDecimals: [null, Validators.required]
    });
    this.showInvoiceWarning();
  }

  public showPairedWalletSelector() {
    this.isOpenSelector = true;
    const eligibleWallets = this.keyId
      ? this.profileProvider.getWalletsFromGroup({
          keyId: this.keyId,
          coin: 'eth',
          m: 1,
          n: 1
        })
      : [];

    const walletSelector = this.actionSheetProvider.createInfoSheet(
      'linkEthWallet',
      {
        wallets: eligibleWallets
      }
    );
    walletSelector.present();
    walletSelector.onDidDismiss(pairedWallet => {
      this.isOpenSelector = false;
      if (!_.isEmpty(pairedWallet)) {
        this.pairedWallet = pairedWallet;
      }
    });
  }

  public createAndBindTokenWallet() {
    const customToken = {
      keyId: this.keyId,
      name: this.customTokenForm.value.tokenName,
      address: this.customTokenForm.value.tokenAddress,
      symbol: this.customTokenForm.value.tokenSymbol.toLowerCase(),
      decimals: this.customTokenForm.value.tokenDecimals
    };

    if (!_.isEmpty(this.pairedWallet)) {
      this.profileProvider
        .createCustomTokenWallet(this.pairedWallet, customToken)
        .then(() => {
          // store preferences for the paired eth wallet
          this.walletProvider.updateRemotePreferences(this.pairedWallet);
          this.navCtrl.popToRoot().then(() => {
            this.events.publish('Local/FetchWallets');
          });
        });
    }
  }

  public async setTokenInfo() {
    const opts = {
      tokenAddress: this.customTokenForm.value.tokenAddress
    };

    this.customTokenForm.controls['tokenName'].setValue(null);
    this.customTokenForm.controls['tokenSymbol'].setValue(null);
    this.customTokenForm.controls['tokenDecimals'].setValue(null);

    const isValid = this.checkCoinAndNetwork(
      this.customTokenForm.value.tokenAddress
    );
    if (!isValid) return;

    let tokenContractInfo;
    try {
      tokenContractInfo = await this.walletProvider.getTokenContractInfo(
        this.pairedWallet,
        opts
      );
    } catch (error) {
      this.actionSheetProvider
        .createInfoSheet('default-error', {
          msg: this.translate.instant(
            'Could not find any ERC20 contract attach to the provided address'
          ),
          title: this.translate.instant('Error')
        })
        .present();
      this.isValid = undefined;
      return;
    }

    this.customTokenForm.controls['tokenName'].setValue(tokenContractInfo.name);
    this.customTokenForm.controls['tokenSymbol'].setValue(
      tokenContractInfo.symbol
    );
    this.customTokenForm.controls['tokenDecimals'].setValue(
      tokenContractInfo.decimals
    );
  }

  private checkCoinAndNetwork(address: string): boolean {
    const addrData = this.addressProvider.getCoinAndNetwork(
      address,
      this.pairedWallet.network
    );
    this.isValid = Boolean(
      addrData &&
        this.pairedWallet.coin == addrData.coin &&
        this.pairedWallet.network == addrData.network
    );
    return this.isValid;
  }

  public showInvoiceWarning() {
    const warningActionSheet = this.actionSheetProvider.createInfoSheet(
      'custom-tokens-warning'
    );
    warningActionSheet.present();
    warningActionSheet.onDidDismiss(_ => {
      this.showPairedWalletSelector();
    });
  }
}
