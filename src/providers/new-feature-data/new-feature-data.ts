import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AppProvider } from '../app/app';

interface FeatureList {
  version: string;
  dummy: string;
  features: Feature[];
}
interface Feature {
  title: string;
  details: string;
  image?: string;
  tryit: TryIt;
}
interface TryIt {
  name: string;
  params?: any;
}
@Injectable()
export class NewFeatureData {
  private feature_list: FeatureList[];
  constructor(private app: AppProvider, private translate: TranslateService) {
    this.feature_list = [
      {
        version: '0.0.0',
        dummy: this.translate.instant('dummy'),
        features: []
      }
    ];
  }

  get() {
    const list = this.feature_list.filter(
      vs => vs.version === this.app.info.version && vs.features.length > 0
    );
    return list && list.length > 0 ? list[0] : undefined;
  }
}
