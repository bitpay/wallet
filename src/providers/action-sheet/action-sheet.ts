import { ComponentRef, Injectable } from '@angular/core';
import { ActionSheetParent } from '../../components/action-sheet/action-sheet-parent';
import { IncomingDataMenuComponent } from '../../components/incoming-data-menu/incoming-data-menu';
import { InfoSheetComponent } from '../../components/info-sheet/info-sheet';
import { OptionsSheetComponent } from '../../components/options-sheet/options-sheet';
import { WalletGroupSelectorComponent } from '../../components/wallet-group-selector/wallet-group-selector';
import { WalletSelectorComponent } from '../../components/wallet-selector/wallet-selector';
import { DomProvider } from '../../providers/dom/dom';

export type InfoSheetType =
  | 'address-copied'
  | 'archive-all-gift-cards'
  | 'archive-gift-card'
  | 'appreciate-review'
  | 'backup-failed'
  | 'backup-needed-with-activity'
  | 'backup-ready'
  | 'backup-ready-wallet-group'
  | 'backup-later-warning'
  | 'backup-safeguard-warning'
  | 'copayers'
  | 'copy-to-clipboard'
  | 'copied-gift-card-claim-code'
  | 'copied-invoice-url'
  | 'custom-amount'
  | 'default-error'
  | 'gift-card-archived'
  | 'gift-cards-unavailable'
  | 'insufficient-funds'
  | 'above-maximum-gift-card-amount'
  | 'below-minimum-gift-card-amount'
  | 'legacy-address-info'
  | 'miner-fee'
  | 'miner-fee-notice'
  | 'payment-request'
  | 'print-required'
  | 'receiving-bitcoin'
  | 'sensitive-info'
  | 'in-app-notification'
  | 'request-feature'
  | 'report-issue';

export type OptionsSheetType =
  | 'address-options'
  | 'gift-card-options'
  | 'incoming-data';

export interface WalletSelectorParams {
  wallets: any[];
  selectedWalletId: string;
  title: string;
}
export interface WalletGroupSelectorParams {
  walletGroups: any[];
  selectedWalletGroupId: string;
}
@Injectable()
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

  public createWalletSelector(
    params: WalletSelectorParams
  ): WalletSelectorComponent {
    return this.setupSheet<WalletSelectorComponent>(
      WalletSelectorComponent,
      null,
      params
    ).instance;
  }

  public createWalletGroupSelector(
    params: WalletGroupSelectorParams
  ): WalletGroupSelectorComponent {
    return this.setupSheet<WalletGroupSelectorComponent>(
      WalletGroupSelectorComponent,
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
