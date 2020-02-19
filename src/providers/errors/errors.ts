import { Injectable } from '@angular/core';

// providers
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { Logger } from '../../providers/logger/logger';

@Injectable()
export class ErrorsProvider {
  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private logger: Logger
  ) {
    this.logger.debug('ErrorsProvider initialized');
  }

  public showWrongEncryptPassswordError(): void {
    this.logger.warn('Wrong encrypt password');
    const errorInfoSheet = this.actionSheetProvider.createInfoSheet(
      'wrong-encrypt-password'
    );
    errorInfoSheet.present();
    errorInfoSheet.onDidDismiss(option => {
      if (option) {
        this.externalLinkProvider.open(
          'https://support.bitpay.com/hc/en-us/articles/115003004403-I-forgot-my-wallet-s-encrypted-password-What-can-I-do-'
        );
      }
    });
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
}
