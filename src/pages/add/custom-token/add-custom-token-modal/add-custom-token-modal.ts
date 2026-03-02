import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ViewController } from 'ionic-angular';
import * as _ from 'lodash';
import {
  ActionSheetProvider,
  AddressProvider,
  WalletProvider
} from '../../../../providers';

@Component({
  selector: 'page-add-custom-token-modal',
  templateUrl: 'add-custom-token-modal.html'
})
export class AddCustomTokenModalPage {
  public token: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
  };

  public address: string;
  public customTokenForm: FormGroup;
  public pairedWallet: any;
  public isValid: boolean;

  constructor(
    private viewCtrl: ViewController,
    private fb: FormBuilder,
    private addressProvider: AddressProvider,
    private translate: TranslateService,
    private walletProvider: WalletProvider,
    private actionSheetProvider: ActionSheetProvider
  ) {
    this.customTokenForm = this.fb.group({
      tokenName: [null, Validators.required],
      tokenAddress: [null, Validators.required],
      tokenSymbol: [null, Validators.required],
      tokenDecimals: [null, Validators.required]
    });
    this.pairedWallet = this.viewCtrl.data.pairedWallet;
  }

  public close(action?: string): void {
    if (action === 'add') {
      this.token = {
        address: this.customTokenForm.value.tokenAddress,
        name: this.customTokenForm.value.tokenName,
        symbol: this.customTokenForm.value.tokenSymbol,
        decimals: this.customTokenForm.value.tokenDecimals
      };
      this.viewCtrl.dismiss({ token: this.token });
    } else this.viewCtrl.dismiss(null);
  }

  public async setTokenInfo() {
    if (_.isEmpty(this.customTokenForm.value.tokenAddress)) return;

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
      await this.actionSheetProvider
        .createInfoSheet('default-error', {
          msg: this.translate.instant(
            'Could not find any ERC20 contract attached to the provided address.'
          ),
          title: this.translate.instant('Error')
        })
        .present();
      this.isValid = undefined;
      return;
    }

    tokenContractInfo.address = this.customTokenForm.value.tokenAddress;

    this.setCustomToken(tokenContractInfo);
  }

  private setCustomToken(tokenContractInfo) {
    this.customTokenForm.controls['tokenAddress'].setValue(
      tokenContractInfo.address
    );
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
}
