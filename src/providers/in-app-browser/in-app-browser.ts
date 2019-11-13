import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { InAppBrowserRef } from '../../models/in-app-browser/in-app-browser-ref.model';
import { Logger } from '../../providers/logger/logger';

const IAB_CONFIG =
  'directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,hidden=yes,clearcache=yes,hidespinner=yes';

@Injectable()
export class InAppBrowserProvider {
  // add new refs here
  refs: {
    bitpayId?: InAppBrowserRef;
  } = {};

  constructor(private logger: Logger) {
    this.logger.debug('InAppBrowserProvider initialized');
  }

  public createIABInstance(
    refName: string,
    url: string,
    initScript: string
  ): InAppBrowserRef {
    const ref: InAppBrowserRef = window.open(url, '_blank', IAB_CONFIG);
    // script that executes inside of inappbrowser when loaded
    const initIAB = () => {
      ref.insertCSS(
        {
          code:
            'body{padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);}'
        },
        null
      );
      ref.executeScript(
        {
          code: initScript
        },
        () => ref.removeEventListener('loadstop', initIAB)
      );
    };

    if (initScript) {
      ref.addEventListener('loadstop', initIAB);
    }

    // add observable to listen for url changes
    ref.events$ = Observable.fromEvent(ref, 'message');

    // providing two ways to get ref - caching it here and also returning it
    this.refs[refName] = ref;

    return ref;
  }
}
