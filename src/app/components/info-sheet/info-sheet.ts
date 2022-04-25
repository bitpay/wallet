import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { ExternalLinkProvider } from 'src/app/providers/external-link/external-link';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';
import { InfoSheetTemplate } from './info-sheet-template';
const configProvider = require('src/assets/appConfig.json')

@Component({
  selector: 'info-sheet',
  templateUrl: 'info-sheet.html',
  styleUrls: ['info-sheet.scss'],
  encapsulation: ViewEncapsulation.None
})
export class InfoSheetComponent extends ActionSheetParent {
  @ViewChild(InfoSheetTemplate, {static: false})
  infoSheetTemplate: InfoSheetTemplate;
  public eTokenFee = configProvider.eTokenFee;
  constructor(private externalLinkProvider: ExternalLinkProvider) {
    super();
  }
  ngAfterViewInit() {
    this.infoSheetTemplate.onDismiss.subscribe(option => {
      this.dismiss(option);
    });
  }

  public openInBrowser(url) {
    if (!url) return;
    this.externalLinkProvider.open(url);
    this.dismiss();
  }

  public optionClicked(option): void {
    this.dismiss(option);
  }
}

export const INFO_SHEET_COMPONENTS = [InfoSheetComponent, InfoSheetTemplate];
