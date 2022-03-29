import { ComponentRef, Injectable } from '@angular/core';
import { ActionSheetParent } from 'src/app/components/action-sheet/action-sheet-parent';
import { EmailComponent } from 'src/app/components/email-component/email-component';
import { EncryptPasswordComponent } from 'src/app/components/encrypt-password/encrypt-password';
import { FooterMenuComponent } from 'src/app/components/footer-menu/footer-menu';
import { IncomingDataMenuComponent } from 'src/app/components/incoming-data-menu/incoming-data-menu';
import { InfoSheetComponent } from 'src/app/components/info-sheet/info-sheet';
import { MemoComponent } from 'src/app/components/memo-component/memo-component';
import { MinerFeeWarningComponent } from 'src/app/components/miner-fee-warning/miner-fee-warning';
import { MultisignInfoComponent } from 'src/app/components/multisign-info/multisign-info.component';
import { NeedsBackupComponent } from 'src/app/components/needs-backup/needs-backup';
import { OptionsSheetComponent } from 'src/app/components/options-sheet/options-sheet';
import { PhoneSheet } from 'src/app/components/phone-sheet/phone-sheet';
import { WalletReceiveComponent } from 'src/app/components/wallet-receive/wallet-receive';
import { WalletSelectorComponent } from 'src/app/components/wallet-selector/wallet-selector';
import { WalletTabOptionsComponent } from 'src/app/components/wallet-tab-options/wallet-tab-options';
import { AddressbookAddPage } from 'src/app/pages/settings/addressbook/add/add';
import { DomProvider } from '../dom/dom';


export type InfoSheetType =
  | 'activation-fee-included'
  | 'address-copied'
  | 'archive-all-gift-cards'
  | 'archive-gift-card'
  | 'appreciate-review'
  | 'backup-needed-with-activity'
  | 'backup-ready'
  | 'backup-later-warning'
  | 'backup-safeguard-warning'
  | 'copy-to-clipboard'
  | 'copied-gift-card-claim-code'
  | 'copied-invoice-url'
  | 'default-error'
  | 'erc20-eth-fee-info'
  | 'gift-card-archived'
  | 'gift-cards-unavailable'
  | 'hide-gift-card-discount-item'
  | 'insufficient-funds'
  | 'insufficient-funds-for-fee'
  | 'import-no-wallet-warning'
  | 'above-maximum-gift-card-amount'
  | 'below-minimum-gift-card-amount'
  | 'legacy-address-info'
  | 'linkEthWallet'
  | 'max-amount-allowed'
  | 'min-amount-allowed'
  | 'miner-fee-notice'
  | 'one-phone-country'
  | 'payment-request'
  | 'payment-method-changed'
  | 'print-required'
  | 'send-max-min-amount'
  | 'sensitive-info'
  | 'in-app-notification'
  | 'request-feature'
  | 'report-issue'
  | 'new-key'
  | 'wrong-encrypt-password'
  | 'bch-legacy-warning-1'
  | 'bch-legacy-warning-2'
  | 'network-coin-warning'
  | 'speed-up-tx'
  | 'speed-up-notice'
  | 'unconfirmed-inputs'
  | 'rbf-tx'
  | 'total-amount'
  | 'subtotal-amount'
  | 'no-wallets-available'
  | 'recovery-phrase-length'
  | 'no-wallets-error'
  | 'wyre-error'
  | 'protect-money'
  | 'pincode-info'
  | 'key-verification-required'
  | 'encrypt-password-warning'
  | 'auth-required'
  | 'verification-required'
  | 'incorrect-recovery-prhase'
  | 'correct-recovery-prhase'
  | 'unsupported-alt-currency'
  | 'custom-fee-warning'
  | 'sync-wallets'
  | 'testnet-warning-1'
  | 'multisig-instantiation'
  | 'join-wallet-warning'
  | 'delete-key'
  | 'reset-all-setting'
  | 'help-and-support'
  | 'invalid-qr'
  | 'delete-contact';

export type OptionsSheetType =
  | 'wallet-options'
  | 'gift-card-options'
  | 'incoming-data'
  | 'address-book'
  | 'send-options';

export interface WalletSelectorParams {
  wallets: any[];
  selectedWalletId: string;
  title: string;
  coinbaseData?: {
    user: any[];
    availableAccounts: any[];
  };
}

export interface WalletReceiveParams {
  wallet: any;
}

export interface WalletTabOptionsParams {
  walletsGroups: any;
}

export interface FooterMenuParams {
  clipboardData: string;
}

@Injectable({
  providedIn: 'root'
})
export class ActionSheetProvider {
  constructor(private domProvider: DomProvider) {}
  public createOptionsSheet(
    type: OptionsSheetType,
    params?
  ): OptionsSheetComponent {
    return this.setupSheet<OptionsSheetComponent>(
      OptionsSheetComponent,
      type,
      params
    ).instance;
  }

  public createIncomingDataMenu(params?): IncomingDataMenuComponent {
    return this.setupSheet<IncomingDataMenuComponent>(
      IncomingDataMenuComponent,
      null,
      params
    ).instance;
  }
  
  public createInfoSheet(type: InfoSheetType, params?): InfoSheetComponent {
    return this.setupSheet<InfoSheetComponent>(InfoSheetComponent, type, params)
      .instance;
  }

  public createMemoComponent(memo): MemoComponent {
    return this.setupSheet<MemoComponent>(MemoComponent, null, { memo })
      .instance;
  }

  public createEmailComponent(): EmailComponent {
    return this.setupSheet<EmailComponent>(EmailComponent).instance;
  }

  public createPhoneSheet(params): PhoneSheet {
    return this.setupSheet<PhoneSheet>(PhoneSheet, null, params).instance;
  }

  public createWalletSelector(
    params: WalletSelectorParams
  ): WalletSelectorComponent {
    return this.setupSheet<WalletSelectorComponent>(
      WalletSelectorComponent,
      null,
      params
    ).instance;
  }

  public createWalletReceive(
    params: WalletReceiveParams
  ): WalletReceiveComponent {
    return this.setupSheet<WalletReceiveComponent>(
      WalletReceiveComponent,
      null,
      params
    ).instance;
  }

  public createNeedsBackup(): NeedsBackupComponent {
    return this.setupSheet<NeedsBackupComponent>(NeedsBackupComponent, null)
      .instance;
  }

  public createMultisignInfo(params): MultisignInfoComponent {
    return this.setupSheet<MultisignInfoComponent>(MultisignInfoComponent, null, params)
      .instance;
  }

  public createWalletTabOptions(
    params: WalletTabOptionsParams
  ): WalletTabOptionsComponent {
    return this.setupSheet<WalletTabOptionsComponent>(
      WalletTabOptionsComponent,
      null,
      params
    ).instance;
  }

  public createEncryptPasswordComponent(params?): EncryptPasswordComponent {
    return this.setupSheet<EncryptPasswordComponent>(
      EncryptPasswordComponent,
      null,
      params
      )
      .instance;
  }

  public createAddContactComponent(params?): AddressbookAddPage {
    return this.setupSheet<AddressbookAddPage>(
      AddressbookAddPage,
      null,
      params
      )
      .instance;
  }

  public createMinerFeeWarningComponent(): MinerFeeWarningComponent {
    return this.setupSheet<MinerFeeWarningComponent>(MinerFeeWarningComponent)
      .instance;
  }

  public createFooterMenu(params?: FooterMenuParams): FooterMenuComponent {
    return this.setupSheet<FooterMenuComponent>(
      FooterMenuComponent,
      null,
      params
    ).instance;
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
}
