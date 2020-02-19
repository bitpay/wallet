import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
// tslint:disable-next-line:no-submodule-imports
import 'web-animations-js/web-animations.min';

import { AppModule } from './app.module';

// Note: loader import location set using "esmLoaderPath" within the output target confg
// tslint:disable-next-line:no-submodule-imports
import { defineCustomElements as BpQRCode } from 'qr-code-component-ng/dist/loader';

platformBrowserDynamic().bootstrapModule(AppModule);
BpQRCode(window);
