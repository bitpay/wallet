import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events } from 'ionic-angular';
import { Subject } from 'rxjs/Subject';
import { InAppBrowserRef } from '../../models/in-app-browser/in-app-browser-ref.model';
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { Logger } from '../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../providers/on-going-process/on-going-process';

@Injectable()
export class InAppBrowserProvider {
  // add new refs here
  refs: {
    card?: InAppBrowserRef;
  } = {};

  constructor(
    private logger: Logger,
    private actionSheetProvider: ActionSheetProvider,
    private translate: TranslateService,
    private events: Events,
    private onGoingProcess: OnGoingProcessProvider
  ) {
    this.logger.debug('InAppBrowserProvider initialized');
  }

  public sendMessageToIAB(
    ref: InAppBrowserRef,
    message: object,
    cb?: (...args: any[]) => void
  ) {
    ref.executeScript(
      {
        code: `window.postMessage(${JSON.stringify({ ...message })}, '*')`
      },
      cb
    );
  }

  public createIABInstance(
    refName: string,
    config: string,
    url: string,
    initScript?: string
  ): Promise<InAppBrowserRef> {
    return new Promise((res, rej) => {
      const ref: InAppBrowserRef = window.open(url, '_blank', config);
      ref.postMessage = window.postMessage;

      const initCb = () => {
        if (initScript) {
          // script that executes inside of inappbrowser when loaded
          ref.executeScript(
            {
              code: initScript
            },
            () => {
              ref.removeEventListener('loadstop', initCb);
              this.logger.debug(
                `InAppBrowserProvider -> ${refName} executed init script`
              );
            }
          );
        }
      };
      ref.addEventListener('loadstop', initCb);
      ref.addEventListener('loaderror', err => {
        this.logger.debug(
          `InAppBrowserProvider -> ${refName} ${JSON.stringify(err)} load error`
        );
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
        this.onGoingProcess.clear();
        rej();
      });

      ref.events$ = new Subject<Event>();

      ref.addEventListener('message', e => ref.events$.next(e));
      this.events.subscribe('iab_message_update', e => ref.events$.next(e));
      // providing two ways to get ref - caching it here and also returning it
      this.refs[refName] = ref;

      res(ref);
    });
  }
}
