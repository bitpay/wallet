import { Injectable } from '@angular/core';
import { ActionSheetProvider } from '../action-sheet/action-sheet';
import { Logger } from '../logger/logger';

// providers

@Injectable({
  providedIn: 'root'
})
export class ErrorsProvider {
  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private logger: Logger
  ) {
    this.logger.debug('ErrorsProvider initialized');
  }
  
  public showWrongEncryptPasswordError() {
    this.logger.warn('Wrong encrypt password');
    const errorInfoSheet = this.actionSheetProvider.createInfoSheet(
      'wrong-encrypt-password'
    );
    errorInfoSheet.present();
  }

  public showDefaultError(
    err: Error | string,
    infoSheetTitle: string,
    dismissFunction?
  ): void {
    if (!err) return;
    const errorInfoSheet = this.actionSheetProvider.createInfoSheet(
      'default-error',
      { msg: err, title: infoSheetTitle }
    );
    errorInfoSheet.present();
    errorInfoSheet.onDidDismiss(dismissFunction);
  }

  public showNoWalletsAvailableInfo(dismissFunction?) {
    this.logger.warn('No wallets available');
    const errorInfoSheet = this.actionSheetProvider.createInfoSheet(
      'no-wallets-available'
    );
    errorInfoSheet.present();
    errorInfoSheet.onDidDismiss(dismissFunction);
  }

  public showNoWalletError(coin: string, dismissFunction?) {
    this.logger.warn('No wallets able to receive funds');
    const errorInfoSheet = this.actionSheetProvider.createInfoSheet(
      'no-wallets-error',
      { coin }
    );
    errorInfoSheet.present();
    errorInfoSheet.onDidDismiss(dismissFunction);
  }
}
