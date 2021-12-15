import { Component, ViewEncapsulation } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

// providers
import { Logger } from '../../providers/logger/logger';
import { ProfileProvider } from '../../providers/profile/profile';

import * as _ from 'lodash';
import { NavController, NavParams } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'page-add-wallet',
  templateUrl: 'add-wallet.html',
  styleUrls: ['/add-wallet.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AddWalletPage {
  public walletsGroups;
  public fromEthCard: boolean;
  public title: string;
  navParamsData;
  constructor(
    private navCtrl: NavController,
    private logger: Logger,
    private profileProvider: ProfileProvider,
    private navParams: NavParams,
    private translate: TranslateService,
    private router: Router,
  ) {
    if (this.router.getCurrentNavigation()) {
      this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData = history ? history.state : {};
    }
    if (_.isEmpty(this.navParamsData) && this.navParams && !_.isEmpty(this.navParams.data)) this.navParamsData = this.navParams.data;
    this.fromEthCard = this.navParamsData.fromEthCard;
    this.title = this.fromEthCard
      ? this.translate.instant('Select Key to add ETH Wallet to')
      : this.translate.instant('Select Key');
    const opts = {
      canAddNewAccount: true,
      showHidden: true
    };
    const wallets = this.profileProvider.getWallets(opts);
    this.walletsGroups = _.values(_.groupBy(wallets, 'keyId'));
  }

  ngOnInit() {
    this.logger.info('Loaded: AddWalletPage');
  }

  getWalletGroup(id) {
    return this.profileProvider.getWalletGroup(id);
  }

  public goToAddPage(keyId?): void {
    if (this.navParamsData.isCreate) {
      if (this.fromEthCard) {
        this.router.navigate(['create-wallet'], {
          state: {
            isShared: false,
            coin: 'eth',
            keyId
          }
        });
      } else {
        this.router.navigate(['/select-currency'], {
          state: {
            isShared: this.navParamsData.isShared,
            isZeroState: keyId ? false : true,
            keyId
          }
        });
      }
    } else if (this.navParamsData.isJoin) {
      this.router.navigate(['/join-wallet'], {
        state: {
          keyId,
          url: this.navParamsData.url
        }
      });
    }
  }
}
