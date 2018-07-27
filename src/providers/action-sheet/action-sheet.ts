import { ComponentRef, Injectable } from '@angular/core';
import { ActionSheetParent } from '../../components/action-sheet/action-sheet-parent';
import { InfoSheetComponent } from '../../components/info-sheet/info-sheet';
import { OptionsSheetComponent } from '../../components/options-sheet/options-sheet';
import { WalletSelectorComponent } from '../../components/wallet-selector/wallet-selector';
import { DomProvider } from '../../providers/dom/dom';

export type InfoSheetType =
  | 'address-copied'
  | 'copayers'
  | 'custom-amount'
  | 'default-error'
  | 'miner-fee'
  | 'miner-fee-notice'
  | 'paper-key-unverified'
  | 'paper-key-unverified-with-activity'
  | 'receiving-bitcoin'
  | 'insufficient-funds';

export type OptionsSheetType = 'address-options';
export interface WalletSelectorParams {
  wallets: any[];
  selectedWalletId: string;
  title: string;
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
