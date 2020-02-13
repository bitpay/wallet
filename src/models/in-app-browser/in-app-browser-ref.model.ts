/// <reference types="cordova-plugin-inappbrowser" />

import { Observable } from 'rxjs';
export interface InAppBrowserRef extends InAppBrowser {
  events$?: Observable<Event>;
  error?: boolean;
}
