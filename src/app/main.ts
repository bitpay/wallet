import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
// tslint:disable-next-line:no-submodule-imports
import 'web-animations-js/web-animations.min';

import { AppModule } from './app.module';

import { enableProdMode } from '@angular/core';

if (process.env.ENV === 'prod') {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);
