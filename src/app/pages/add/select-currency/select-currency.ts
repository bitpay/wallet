import { Component, ViewEncapsulation } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import * as _ from 'lodash';

import {
  Coin,
  CoinsMap,
  CurrencyProvider
} from '../../../providers/currency/currency';
import { Token } from '../../../providers/currency/token';
import { ActionSheetProvider } from 'src/app/providers/action-sheet/action-sheet';
import { ModalController, NavParams } from '@ionic/angular';
import { Logger } from 'src/app/providers/logger/logger';
import { WalletProvider } from 'src/app/providers/wallet/wallet';
import { OnGoingProcessProvider } from 'src/app/providers/on-going-process/on-going-process';
import { ProfileProvider } from 'src/app/providers/profile/profile';
import { PushNotificationsProvider } from 'src/app/providers/push-notifications/push-notifications';
import { BwcErrorProvider } from 'src/app/providers/bwc-error/bwc-error';
import { PersistenceProvider } from 'src/app/providers/persistence/persistence';
import { ErrorsProvider } from 'src/app/providers/errors/errors';
import { EventManagerService } from 'src/app/providers/event-manager.service';
import { ActivatedRoute, Router } from '@angular/router';
import { KeyOnboardingPage } from '../../settings/key-settings/key-onboarding/key-onboarding';

@Component({
  selector: 'page-select-currency',
  templateUrl: 'select-currency.html',
  styleUrls: ['select-currency.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SelectCurrencyPage {
  private showKeyOnboarding: boolean;

  public title: string;
  public coin: Coin;
  public coinsSelected = {} as CoinsMap<boolean>;
  public tokensSelected = {} as CoinsMap<boolean>;
  public tokenDisabled = {} as CoinsMap<boolean>;

  public availableChains: string[];
  public availableTokens: Token[];
  public isOnboardingFlow: boolean;
  public isZeroState: boolean;
  public isJoin: boolean;
  public isShared: boolean;
  public keyId;
  navParamsData;
  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private currencyProvider: CurrencyProvider,
    private router: Router,
    private route: ActivatedRoute,
    private logger: Logger,
    public navParam: NavParams,
    private profileProvider: ProfileProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private walletProvider: WalletProvider,
    private pushNotificationsProvider: PushNotificationsProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private translate: TranslateService,
    private modalCtrl: ModalController,
    private persistenceProvider: PersistenceProvider,
    private errorsProvider: ErrorsProvider,
    private events: EventManagerService
  ) {
    if (this.router.getCurrentNavigation()) {
       this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData =  history ? history.state : {};
    }

    this.isJoin = this.navParamsData.isJoin ? this.navParamsData.isJoin : false;
    this.isShared = this.navParamsData.isShared;
    this.keyId = this.navParamsData.keyId;
    this.availableChains =
      this.isShared || this.isJoin
        ? this.currencyProvider.getMultiSigCoins()
        : this.currencyProvider.getAvailableChains();
    this.availableTokens = this.currencyProvider.getAvailableTokens();
    for (const chain of this.availableChains) {
      this.coinsSelected[chain] = false;
    }
    this.coinsSelected.xpi = true;
    this.shouldShowKeyOnboarding();
    this.setTokens();
  }


  ngOnInit() {
    this.logger.info('Loaded: SelectCurrencyPage');
    this.isOnboardingFlow = this.navParamsData.isOnboardingFlow;
    this.route.queryParams.subscribe(params => {
      this.isZeroState = this.router.getCurrentNavigation().extras.state.isZeroState;
    })
    this.title = this.isZeroState
      ? this.translate.instant('Select Currencies')
      : this.translate.instant('Select Currency');
  }

  private shouldShowKeyOnboarding() {
    this.persistenceProvider.getKeyOnboardingFlag().then(value => {
      if (!value) {
        this.showKeyOnboarding = true;
        const wallets = this.profileProvider.getWallets();
        const walletsGroups = _.values(_.groupBy(wallets, 'keyId'));
        walletsGroups.forEach((walletsGroup: any) => {
          if (walletsGroup[0].canAddNewAccount) this.showKeyOnboarding = false;
        });
      } else {
        this.showKeyOnboarding = false;
      }
    });
  }

  async showKeyOnboardingSlides(coins: Coin[]) {
    this.logger.debug('Showing key onboarding');
    const modal = await this.modalCtrl.create({
      component: KeyOnboardingPage,
      componentProps: null,
      showBackdrop: false,
      backdropDismiss: false
    });
    await modal.present();
    const data = await modal.onDidDismiss();
    if(data){
      this.persistenceProvider.setKeyOnboardingFlag();
      this._createWallets(coins);
    }
  }

  public goToCreateWallet(coin: string): void {
    if (this.isJoin) {
    this.router.navigate(['/join-wallet'], {
      state: {
        keyId: this.keyId,
        url: this.navParamsData.url,
        coin
      }});
    } else {
      this.router.navigate(['/create-wallet'], {
        state: {
          isShared: this.isShared,
          coin,
          keyId: this.keyId,
          showKeyOnboarding: this.showKeyOnboarding
        }});
    }
  }

  public getCoinName(coin: Coin | any): string {
    return this.currencyProvider.getCoinName(coin);
  }

  public goToImportWallet(): void {
    this.router.navigate(['/import-wallet']);
  }

  private _createWallets(coins: Coin[]): void {
    const selectedCoins = _.keys(_.pickBy(this.coinsSelected)) as Coin[];
    coins = coins || selectedCoins;
    const selectedTokens = _.keys(_.pickBy(this.tokensSelected));
    this.onGoingProcessProvider.set('creatingWallet');
    this.profileProvider
      .createMultipleWallets(coins, selectedTokens)
      .then(async wallets => {
        this.walletProvider.updateRemotePreferences(wallets);
        this.pushNotificationsProvider.updateSubscription(wallets);
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.profileProvider.setNewWalletGroupOrder(
          wallets[0].credentials.keyId
        );
        this.endProcess(wallets[0].credentials.keyId);
      })
      .catch(e => {
        this.showError(e);
      });
  }

  public createWallets(coins?: Coin[]): void {
    if (this.isZeroState && !this.isOnboardingFlow) {
      this.showInfoSheet(coins);
      return;
    }
    this._createWallets(coins);
  }

  private showError(err) {
    this.onGoingProcessProvider.clear();
    this.logger.error('Create: could not create wallet', err);
    const title = this.translate.instant('Error');
    err = this.bwcErrorProvider.msg(err);
    this.errorsProvider.showDefaultError(err, title);
  }

  private endProcess(keyId?: string) {
    this.onGoingProcessProvider.clear();
    this.router.navigate(['/recovery-key'], {
      state: {
        keyId,
        isOnboardingFlow: this.isOnboardingFlow,
        hideBackButton: true
      }});
  }

  public createAndBindTokenWallet(pairedWallet, token) {
    if (!_.isEmpty(pairedWallet)) {
      this.profileProvider.createTokenWallet(pairedWallet, token).then(() => {
        // store preferences for the paired eth wallet
        this.walletProvider.updateRemotePreferences(pairedWallet);
        if (pairedWallet.needsBackup) {
          this.endProcess();
        } else {
          this.router.navigate(['']).then(() => {
            this.events.publish('Local/FetchWallets');
          });
        }
      });
    }
  }

  public showPairedWalletSelector(token) {
    const eligibleWallets = this.keyId
      ? this.profileProvider.getWalletsFromGroup({
          keyId: this.keyId,
          network: 'livenet',
          pairFor: token
        })
      : [];

    const walletSelector = this.actionSheetProvider.createInfoSheet(
      'linkEthWallet',
      {
        wallets: eligibleWallets,
        token
      }
    );
    walletSelector.present();
    walletSelector.onDidDismiss(pairedWallet => {
      return this.createAndBindTokenWallet(pairedWallet, token);
    });
  }
  public setTokens(coin?: string): void {
    if (coin === 'eth' || !coin) {
      for (const token of this.availableTokens) {
        if (this.isZeroState) {
          this.tokensSelected[token.symbol] = false;
        } else {
          let canCreateit = _.isEmpty(
            this.profileProvider.getWalletsFromGroup({
              keyId: this.keyId,
              network: 'livenet',
              pairFor: token
            })
          );
          this.tokenDisabled[token.symbol] = canCreateit;
        }
      }
    }
  }

  private showInfoSheet(coins: Coin[]) {
    const infoSheet = this.actionSheetProvider.createInfoSheet('new-key');
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (option) {
        this.showKeyOnboardingSlides(coins);
        return;
      }
      this._createWallets(coins);
    });
  }
}
