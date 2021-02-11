import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, ViewController } from 'ionic-angular';
import _ from 'lodash';
import { AppProvider } from '../app/app';
import { IABCardProvider } from '../in-app-browser/card';
import { LocationProvider } from '../location/location';
import { PersistenceProvider } from '../persistence/persistence';
import { PlatformProvider } from '../platform/platform';

interface FeatureList {
  app: string[];
  platform: string[];
  majorversion: number;
  minorversion: number;
  country?: string[];
  dummy: string;
  features: Feature[];
}
interface Feature {
  title: string;
  details: string;
  image?: string;
  tryit?: TryIt;
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
    private iabCardProvider: IABCardProvider,
    private events: Events
  ) {
    this.feature_list = [
      {
        majorversion: 12,
        minorversion: 0,
        app: ['bitpay'],
        platform: ['cordova'],
        dummy: this.translate.instant('dummy'),
        features: [
          {
            title: 'Trading now supported!',
            details:
              'Now you can quickly and safely exchange funds from one crypto wallet to another.',
            image: 'assets/img/new-feature/12/12-1.png'
          },
          {
            title: 'Exchange directly from your wallets',
            details:
              'Now you can quickly and safely exchange funds from one crypto wallet to another.',
            image: 'assets/img/new-feature/12/12-2.png'
          },
          {
            title: 'DAI and WBTC added',
            details:
              'Store, Send, and Receive some of the top crypto assets used in Decentralized Finance (DeFi). DAI is a USD pegged stable coin and WBTC is an ERC20 token pegged to Bitcoin.',
            image: 'assets/img/new-feature/12/12-3.png'
          },
          {
            title: 'Interact with DeFi and other DApps',
            details:
              'Try it out by selecting WalletConnect from settings, then scanning a DApp or DeFi QR code.',
            image: 'assets/img/new-feature/12/12-4.png'
          }
        ]
      },
      {
        majorversion: 12,
        minorversion: 1,
        app: ['bitpay'],
        platform: ['ios'],
        dummy: this.translate.instant('dummy'),
        country: ['US'],
        features: [
          {
            title: 'Connect to Apple Pay',
            details:
              "Now it's easy to use your BitPay MasterCard with Apple Pay making payments in stores, in apps, and online even easier.",
            image: 'assets/img/new-feature/12.1/12.1-1.png'
          },
          {
            title: 'Setup your virtual card',
            details:
              'To get started, go to your card settings and select “Add to Apple Wallet”',
            image: 'assets/img/new-feature/12.1/12.1-2.png',
            tryit: async (viewCtrl: ViewController) => {
              await viewCtrl.dismiss({ done: true });
              const cards = await this.persistenceProvider.getBitpayDebitCards(
                this.NETWORK
              );
              const virtualCard = cards.find(
                c => c.provider === 'galileo' && c.cardType === 'virtual'
              );
              if (virtualCard) {
                // go to card settings directly
                this.iabCardProvider.loadingWrapper(() => {
                  this.iabCardProvider.show();
                  setTimeout(() => {
                    this.iabCardProvider.sendMessage(
                      {
                        message: `openSettings?${virtualCard.id}`
                      },
                      () => {}
                    );
                  });
                });
              } else {
                // new signup - * using events over navCtrl due to dependency issue
                this.events.publish('IncomingDataRedir', {
                  name: 'BitPayCardIntroPage'
                });
              }
            }
          }
        ]
      }
    ];
  }

  async get() {
    await this.locationProv.countryPromise.then(data => (this.country = data));
    const list = this.feature_list.filter(
      vs =>
        vs.majorversion === this.appProv.version.major &&
        vs.minorversion === this.appProv.version.minor &&
        (vs.app.length == 0 ||
          vs.app[0] === '*' ||
          vs.app.find(
            app => app === String(this.appProv.info.name).toLocaleLowerCase()
          )) &&
        (vs.platform.length == 0 ||
          vs.platform[0] === '*' ||
          vs.platform.find(plat => this.platProv.getPlatform() === plat)) &&
        (!vs.country ||
          vs.country[0] === '*' ||
          vs.country.indexOf(this.country) != -1) &&
        vs.features.length > 0
    );
    return list && list.length > 0
      ? _.orderBy(list, ['majorversion', 'minorversion'], ['desc', 'desc'])[0]
      : undefined;
  }
}
