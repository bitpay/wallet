import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';

// services
import { CurrencyProvider } from '../../../../../providers/currency/currency';
import { Logger } from '../../../../../providers/logger/logger';
import { ProfileProvider } from '../../../../../providers/profile/profile';

@Component({
  selector: 'page-wallet-information',
  templateUrl: 'wallet-information.html',
  styleUrls: ['wallet-information.scss']
})
export class WalletInformationPage {
  public wallet;
  public walletId: string;
  public walletName: string;
  public N: number;
  public M: number;
  public copayers;
  public copayerId;
  public balanceByAddress;
  public account: number;
  public coin: string;
  public network: string;
  public addressType: string;
  public rootPath: string;
  public pubKeys;
  public externalSource: string;
  public canSign: boolean;
  public unitToSatoshi: number;
  public linkedEthWalletName: string;
  navParamsData;

  constructor(
    private profileProvider: ProfileProvider,
    private currencyProvider: CurrencyProvider,
    private router: Router,
    private logger: Logger
  ) {
    if (this.router.getCurrentNavigation()) {
       this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData =  history ? history.state : undefined;
    }
  }

  ngOnInit(){
    this.logger.info('Loaded:  WalletInformationPage');
  }

  ionViewWillEnter() {
    this.wallet = this.profileProvider.getWallet(this.navParamsData.walletId);
    this.walletName = this.wallet.name;
    this.coin = this.wallet.coin.toUpperCase();
    this.unitToSatoshi = this.currencyProvider.getPrecision(
      this.wallet.coin
    ).unitToSatoshi;
    this.walletId = this.wallet.credentials.walletId;
    this.N = this.wallet.credentials.n;
    this.M = this.wallet.credentials.m;
    if (!_.isEmpty(this.wallet.cachedStatus)) {
      this.copayers = this.wallet.cachedStatus.wallet.copayers;
    }
    this.copayerId = this.wallet.credentials.copayerId;
    this.balanceByAddress = this.wallet.balanceByAddress;
    this.account = this.wallet.credentials.account;
    this.network = this.wallet.credentials.network;
    this.addressType = this.wallet.credentials.addressType || 'P2SH';
    this.rootPath = this.wallet.credentials.rootPath;
    this.pubKeys = _.map(this.wallet.credentials.publicKeyRing, 'xPubKey');
    this.externalSource = null;
    this.canSign = this.wallet.canSign;
    this.linkedEthWalletName = this.wallet.linkedEthWalletName;
  }

  public isUtxoCoin(): boolean {
    return this.currencyProvider.isUtxoCoin(this.wallet.coin);
  }
}
