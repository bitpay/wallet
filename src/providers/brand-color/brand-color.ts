import { Injectable } from '@angular/core';

// Providers
import { AppProvider } from '../../providers/app/app';

@Injectable()
export class BrandColorProvider {
  constructor(public appProvider: AppProvider) {}

  public getBrandColor(): string {
    const isBitPayApp = this.appProvider.info.name == 'bitpay' ? true : false;
    const brandColor = isBitPayApp ? '#202C67' : '#202C67';
    return brandColor;
  }
}
