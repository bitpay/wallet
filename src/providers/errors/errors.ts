import { Injectable } from '@angular/core';

// providers
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { Logger } from '../../providers/logger/logger';

@Injectable()
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
}
