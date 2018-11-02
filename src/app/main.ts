import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
// tslint:disable-next-line:no-submodule-imports
import 'web-animations-js/web-animations.min';

import { AppModule } from './app.module';

platformBrowserDynamic().bootstrapModule(AppModule);
