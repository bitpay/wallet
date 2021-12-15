import { Component, ViewEncapsulation } from '@angular/core';
import { AppProvider } from 'src/app/providers/app/app';
import { ExternalLinkProvider } from 'src/app/providers/external-link/external-link';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';

@Component({
  selector: 'miner-fee-warning',
  templateUrl: 'miner-fee-warning.html',
  styleUrls: ['miner-fee-warning.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MinerFeeWarningComponent extends ActionSheetParent {
  public appName: string;

  constructor(
    private appProvider: AppProvider,
    private externalLinkProvider: ExternalLinkProvider
  ) {
    super();
    this.appName = this.appProvider.info.nameCase;
  }

  public confirm(): void {
    this.dismiss();
  }

  public openExternalLink(): void {
    const url =
      'https://support.bitpay.com/hc/en-us/articles/115004439366-Why-is-my-recommended-bitcoin-miner-fee-so-high-';
    this.externalLinkProvider.open(url);
  }
}
