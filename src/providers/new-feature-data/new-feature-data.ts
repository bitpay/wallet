import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ViewController } from 'ionic-angular';
import _ from 'lodash';
import { AppProvider } from '../app/app';
import { LocationProvider } from '../location/location';
import { Logger } from '../logger/logger';
import { PersistenceProvider } from '../persistence/persistence';
import { PlatformProvider } from '../platform/platform';

interface FeatureList {
  app: string[];
  platform: string[];
  major: number;
  minor: number;
  patch: number;
  country?: string[];
  dummy: string;
  features: Feature[];
}
interface Feature {
  slideTitle?: string;
  title: string;
  details: string;
  image?: Image;
  tryit?: TryIt;
}
interface Image {
  path: string;
  fitClass?: boolean;
}
interface TryIt {
  name: string;
  params?: any;
}
export type TryItType = ((viewCtrl?: ViewController) => void) | TryIt | boolean;

@Injectable()
export class NewFeatureData {
  private feature_list: FeatureList[];
  private country: string;
  private NETWORK = 'livenet';
  constructor(
    private appProv: AppProvider,
    private locationProv: LocationProvider,
    private platProv: PlatformProvider,
    private translate: TranslateService,
    private persistenceProvider: PersistenceProvider,
    private logger: Logger
  ) {
    this.persistenceProvider.getNetwork().then((network: string) => {
      if (network) {
        this.NETWORK = network;
      }
      this.logger.log(`persistence initialized with ${this.NETWORK}`);
    });

    this.feature_list = [
      {
        major: 12,
        minor: 8,
        patch: 1,
        app: ['*'],
        platform: ['*'],
        dummy: this.translate.instant('dummy'),
        features: [
          {
            title: this.translate.instant('Swap Tokens'),
            details: this.translate.instant(
              'Easily swap hundreds of ERC-20 tokens through Decentralized Exchanges (DEXs).'
            ),
            image: {
              path: 'assets/img/new-feature/12.8/12.8-1-swap-crypto.svg'
            }
          },
          {
            title: this.translate.instant('Add ERC-20 Tokens'),
            details: this.translate.instant(
              'Now you can add ERC-20 tokens to keep track of all your digital assets in one place. In your wallet, tap + and ‘Add Token’ to add.'
            ),
            image: {
              path: 'assets/img/new-feature/12.8/12.8-1-erc20.svg'
            }
          }
        ]
      }
    ];
  }

  async get() {
    await this.locationProv.countryPromise.then(data => (this.country = data));
    const platform = this.platProv.getPlatform();
    const list = this.feature_list.filter(vs => {
      if (vs.platform.length > 1) {
        vs.platform.forEach((p, i) => {
          if (p !== '*' && p !== platform) vs.features.splice(i, 1);
        });
      }

      return (
        this.appProv.meetsVersion(vs) &&
        (vs.app.length == 0 ||
          vs.app[0] === '*' ||
          vs.app.find(
            app => app === String(this.appProv.info.name).toLowerCase()
          )) &&
        (vs.platform.length == 0 ||
          vs.platform[0] === '*' ||
          vs.platform.find(plat => platform === plat)) &&
        (!vs.country ||
          vs.country[0] === '*' ||
          vs.country.indexOf(this.country) != -1) &&
        vs.features.length > 0
      );
    });
    return list && list.length > 0
      ? _.orderBy(list, ['major', 'minor', 'patch'], ['desc', 'desc'])[0]
      : undefined;
  }
}
