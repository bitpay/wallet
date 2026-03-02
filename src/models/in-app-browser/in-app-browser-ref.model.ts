/// <reference types="cordova-plugin-inappbrowser" />

import { Subject } from 'rxjs';
export interface InAppBrowserRef extends InAppBrowser {
  events$?: Subject<Event>;
  error?: boolean;
}
