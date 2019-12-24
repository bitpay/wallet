import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { InAppBrowserRef } from '../../models/in-app-browser/in-app-browser-ref.model';
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { Logger } from '../../providers/logger/logger';

const IAB_CONFIG =
  'directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,hidden=yes,clearcache=yes,hidespinner=yes';

@Injectable()
export class InAppBrowserProvider {
  // add new refs here
  refs: {
    card?: InAppBrowserRef;
  } = {};

  constructor(
    private logger: Logger,
    private actionSheetProvider: ActionSheetProvider,
    private translate: TranslateService
  ) {
    this.logger.debug('InAppBrowserProvider initialized');
  }

  public createIABInstance(
    refName: string,
    url: string,
    initScript?: string
  ): Promise<InAppBrowserRef> {
    return new Promise((res, rej) => {
      try {
        const ref: InAppBrowserRef = window.open(url, '_blank', IAB_CONFIG);
        if (initScript) {
          // script that executes inside of inappbrowser when loaded
          const initIAB = () => {
            ref.executeScript(
              {
                code: initScript
              },
              () => ref.removeEventListener('loadstop', initIAB)
            );
          };
          ref.addEventListener('loadstop', initIAB);
        }

        ref.addEventListener('loaderror', () => {
          this.logger.debug(`InAppBrowserProvider -> ${refName} load error`);
          ref.error = true;
          ref.show = () => {
            this.actionSheetProvider
              .createInfoSheet('default-error', {
                msg: this.translate.instant(
                  'Uh oh something went wrong! Please try again later.'
                ),
                title: this.translate.instant('Error')
              })
              .present();
          };
        });

        // add observable to listen for url changes
        ref.events$ = Observable.fromEvent(ref, 'message');

        // providing two ways to get ref - caching it here and also returning it
        this.refs[refName] = ref;

        res(ref);
      } catch (err) {
        rej();
      }
    });
  }
}
