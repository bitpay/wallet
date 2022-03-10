import { Component, ComponentRef, ViewEncapsulation } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';

// Providers

import * as _ from 'lodash';
import { InfoSheetType } from 'src/app/providers/action-sheet/action-sheet';
import { InfoSheetComponent } from '../info-sheet/info-sheet';
import { Platform } from '@ionic/angular';
import { Logger } from 'src/app/providers/logger/logger';
import { WalletProvider } from 'src/app/providers/wallet/wallet';
import { EventManagerService } from 'src/app/providers/event-manager.service';
import { BwcErrorProvider } from 'src/app/providers/bwc-error/bwc-error';
import { Coin, CurrencyProvider } from 'src/app/providers/currency/currency';
import { AddressProvider } from 'src/app/providers/address/address';
import { DomProvider } from 'src/app/providers/dom/dom';
import { ConfigProvider } from 'src/app/providers/config/config';
import { NgxQrcodeErrorCorrectionLevels } from '@techiediaries/ngx-qrcode';
import { ProfileProvider } from 'src/app/providers/profile/profile';

@Component({
  selector: 'wallet-receive',
  templateUrl: 'wallet-receive.html',
  styleUrls: ['wallet-receive.scss'],
  encapsulation : ViewEncapsulation.None
})
export class WalletReceiveComponent extends ActionSheetParent {
  public protocolHandler: string;
  public address: string;
  public qrAddress: string;
  public wallet;
  public showShareButton: boolean;
  public loading: boolean;
  public playAnimation: boolean;
  public newAddressError: boolean;
  public bchCashAddress: string;
  public bchAddrFormat: string;
  public disclaimerAccepted: boolean;
  public showingWarning: boolean;
  public ecashFormat ;
  public isShowEtoken;

  private onResumeSubscription: Subscription;
  private retryCount: number = 0;
  typeErrorQr =  NgxQrcodeErrorCorrectionLevels;

  constructor(
    private logger: Logger,
    private walletProvider: WalletProvider,
    private events: EventManagerService,
    private bwcErrorProvider: BwcErrorProvider,
    private platform: Platform,
    public currencyProvider: CurrencyProvider,
    private addressProvider: AddressProvider,
    private domProvider: DomProvider,
    private configProvider: ConfigProvider
  ) {
    super();
  }

  ngOnInit() {
    this.wallet = this.params.wallet;
    this.bchAddrFormat = 'cashAddress';
    this.ecashFormat = 'ecashAddress';
    this.disclaimerAccepted = false;
    this.setAddress();
    this.isShowEtoken = this.wallet.coin == 'xec' && this.wallet.isSlpToken;
  }

  changeToTokenAddress(ecashAdress) {
    const { prefix, type, hash } = this.addressProvider.decodeAddress(ecashAdress);
    const etoken = this.addressProvider.encodeAddress('etoken', type, hash, ecashAdress);
    this.updateQrAddress(etoken, null);
  }
  changetokenEcashAddress(eTokenAdress) {
    const { prefix, type, hash } = this.addressProvider.decodeAddress(eTokenAdress);
    const ecashAdress = this.addressProvider.encodeAddress('ecash', type, hash, eTokenAdress);
    this.updateQrAddress(ecashAdress, null);
  }

  public setQrAddressToken(address) {
    if (this.ecashFormat === 'eTokenAddress') {
      this.changeToTokenAddress(address)
    }
    else {
      this.changetokenEcashAddress(address)
    }
  }

  ionViewWillLeave() {
    this.onResumeSubscription.unsubscribe();
    this.events.unsubscribe('bwsEvent', this.bwsEventHandler);
  }

  ionViewWillEnter() {
    this.events.subscribe('bwsEvent', this.bwsEventHandler);
    this.onResumeSubscription = this.platform.resume.subscribe(() => {
      this.setAddress();
      this.events.subscribe('bwsEvent', this.bwsEventHandler);
    });
  }

  private bwsEventHandler: any = (walletId, type, n) => {
    if (
      this.wallet.credentials.walletId == walletId &&
      type == 'NewIncomingTx' &&
      n.data
    ) {
      let addr =
        this.address.indexOf(':') > -1
          ? this.address.split(':')[1]
          : this.address;
      if (n.data.address == addr) this.setAddress(true);
    }
  };

  public async setAddress(newAddr?: boolean, failed?: boolean): Promise<void> {
    if (
      !this.wallet ||
      !this.wallet.isComplete() ||
      (this.wallet.needsBackup && this.wallet.network == 'livenet')
    )
      return;

    this.loading = newAddr || _.isEmpty(this.address) ? true : false;

    this.walletProvider
      .getAddress(this.wallet, newAddr)
      .then(addr => {
        this.newAddressError = false;
        this.loading = false;
        if (!addr) return;
        const address = this.walletProvider.getAddressView(
          this.wallet.coin,
          this.wallet.network,
          addr
        );
        if (this.address && this.address != address) {
          this.playAnimation = true;
        }
        if (this.wallet.coin === 'bch' || this.wallet.coin === 'xec') this.bchCashAddress = address;

        this.updateQrAddress(address, newAddr);
      })
      .catch(err => {
        this.logger.warn('Retrying to create new adress:' + ++this.retryCount);
        if (this.retryCount > 3) {
          this.retryCount = 0;
          this.loading = false;
          this.dismiss(err);
        } else if (err == 'INVALID_ADDRESS') {
          // Generate new address if the first one is invalid ( fix for concatenated addresses )
          if (!failed) {
            this.setAddress(newAddr, true);
            this.logger.warn(this.bwcErrorProvider.msg(err, 'Receive'));
            return;
          }
          this.setAddress(false); // failed to generate new address -> get last saved address
        } else {
          this.setAddress(false); // failed to generate new address -> get last saved address
        }
        this.logger.warn(this.bwcErrorProvider.msg(err, 'Receive'));
      });
  }

  private async updateQrAddress(address, newAddr?: boolean): Promise<void> {
    if (this.wallet.coin === 'bch') {
      address =
        this.bchAddrFormat === 'legacy'
          ? this.addressProvider.getLegacyBchAddressFormat(this.bchCashAddress)
          : this.bchCashAddress;
    }
    if (newAddr) {
      await timer(400).toPromise();
    }
    this.address = address;

    await timer(200).toPromise();
    this.playAnimation = false;
  }

  public setQrAddress() {
    if (this.bchAddrFormat === 'legacy') this.showFirstWarning();
    else {
      this.disclaimerAccepted = false;
      this.updateQrAddress(this.bchCashAddress, false);
    }
  }

  public createInfoSheet(type: InfoSheetType, params?): InfoSheetComponent {
    return this.setupSheet<InfoSheetComponent>(InfoSheetComponent, type, params)
      .instance;
  }

  private setupSheet<T extends ActionSheetParent>(
    componentType: { new (...args): T },
    sheetType?: string,
    params?
  ): ComponentRef<T> {
    const sheet = this.domProvider.appendComponentToBody<T>(componentType);
    sheet.instance.componentRef = sheet;
    sheet.instance.sheetType = sheetType;
    sheet.instance.params = params;
    return sheet;
  }

  private showFirstWarning() {
    const infoSheet = this.createInfoSheet('bch-legacy-warning-1');
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (option) {
        this.showSecondWarning();
      } else {
        this.disclaimerAccepted = false;
        this.bchAddrFormat = 'cashAddress';
      }
    });
  }

  public showSecondWarning() {
    const infoSheet = this.createInfoSheet('bch-legacy-warning-2');
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (option) {
        const legacyAddr = this.addressProvider.getLegacyBchAddressFormat(
          this.bchCashAddress
        );
        this.disclaimerAccepted = true;
        this.updateQrAddress(legacyAddr, false);
      } else {
        this.disclaimerAccepted = false;
        this.bchAddrFormat = 'cashAddress';
      }
    });
  }

}
