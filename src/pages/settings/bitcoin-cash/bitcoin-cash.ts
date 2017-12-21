import { Component } from "@angular/core";
import { NavController } from 'ionic-angular';
import { Logger } from "@nsalaun/ng-logger";
import * as lodash from 'lodash';

// Pages
import { SettingsPage } from '../../settings/settings';

// Providers
import { WalletProvider } from "../../../providers/wallet/wallet";
import { ProfileProvider } from '../../../providers/profile/profile';
import { BwcErrorProvider } from "../../../providers/bwc-error/bwc-error";
import { TxFormatProvider } from "../../../providers/tx-format/tx-format";
import { BwcProvider } from "../../../providers/bwc/bwc";
import { OnGoingProcessProvider } from "../../../providers/on-going-process/on-going-process";
import { PushNotificationsProvider } from "../../../providers/push-notifications/push-notifications";
import { ExternalLinkProvider } from "../../../providers/external-link/external-link";

@Component({
	selector: 'page-bitcoin-cash',
	templateUrl: 'bitcoin-cash.html',
})
export class BitcoinCashPage {
	private walletsBTC: Array<any>;
	private walletsBCH: Array<any>;
	private errors: any;

	public availableWallets: Array<any>;
	public nonEligibleWallets: Array<any>;
	public error: any;

	constructor(
		private navCtrl: NavController,
		private walletProvider: WalletProvider,
		private profileProvider: ProfileProvider,
		private txFormatProvider: TxFormatProvider,
		private onGoingProcessProvider: OnGoingProcessProvider,
		private pushNotificationsProvider: PushNotificationsProvider,
		private externalLinkProvider: ExternalLinkProvider,
		private bwcErrorProvider: BwcErrorProvider,
		private bwcProvider: BwcProvider,
		private logger: Logger,
	) {
		this.walletsBTC = this.profileProvider.getWallets({
			coin: 'btc',
			onlyComplete: true,
			network: 'livenet'
		});
		this.walletsBCH = [];
		this.availableWallets = [];
		this.nonEligibleWallets = [];
		this.errors = bwcProvider.getErrors();
		this.error = null;
	}

	ionViewWillEnter() {
		// Filter out already duplicated wallets
		this.walletsBCH = this.profileProvider.getWallets({
			coin: 'bch',
			network: 'livenet'
		});

		let xPubKeyIndex = lodash.keyBy(this.walletsBCH, "credentials.xPubKey");

		this.walletsBTC = lodash.filter(this.walletsBTC, function (w) {
			return !xPubKeyIndex[w.credentials.xPubKey];
		});

		lodash.each(this.walletsBTC, (w) => {
			if (w.credentials.derivationStrategy != 'BIP44') {
				w.excludeReason = 'Non BIP44 wallet'; // TODO gettextcatalog
				this.nonEligibleWallets.push(w);
			} else if (!w.canSign()) {
				w.excludeReason = 'Read only wallet'; // TODO gettextcatalog
				this.nonEligibleWallets.push(w);
			} else if (w.needsBackup) {
				w.excludeReason = 'Backup needed'; // TODO gettextcatalog
				this.nonEligibleWallets.push(w);
			} else {
				this.availableWallets.push(w);
			}
		});

		this.availableWallets = this.availableWallets;
		this.nonEligibleWallets = this.nonEligibleWallets;

		lodash.each(this.availableWallets, (wallet) => {
			this.walletProvider.getBalance(wallet, { coin: 'bch' }).then((balance) => {
				this.error = null;
				wallet.bchBalance = this.txFormatProvider.formatAmountStr('bch', balance.availableAmount);
			}).catch((err) => {
				this.logger.error(err);
				this.error = (err === 'WALLET_NOT_REGISTERED') ? 'Wallet not registered' : this.bwcErrorProvider.msg(err);
			});
		});
	}

	openRecoveryToolLink(): void {
		let url = 'https://bitpay.github.io/copay-recovery/';
		let optIn = true;
		let title = 'Open the recovery tool'; //TODO gettextcatalog
		let okText = 'Open'; //TODO gettextcatalog
		let cancelText = 'Go Back'; //TODO gettextcatalog
		this.externalLinkProvider.open(url, optIn, title, null, okText, cancelText);
	}

	duplicate(wallet: any) {
		this.error = null;
		this.logger.debug('Duplicating wallet for BCH:' + wallet.id + ':' + wallet.name);

		let opts: any = {
			name: wallet.name + '[BCH]',
			m: wallet.m,
			n: wallet.n,
			myName: wallet.credentials.copayerName,
			networkName: wallet.network,
			coin: 'bch',
			walletPrivKey: wallet.credentials.walletPrivKey,
			compliantDerivation: wallet.credentials.compliantDerivation,
		};

		let setErr = (err, cb?) => {
			if (!cb) cb = function () {};

			this.error = this.bwcErrorProvider.cb(err, 'Could not duplicate').then(() => {
				return cb(err);
			});
		}

		let importOrCreate = () => {
			return new Promise ((resolve, reject) => {
				this.walletProvider.getStatus(wallet, {}).then((status: any) => {
					opts.singleAddress = status.wallet.singleAddress;
	
					// first try to import
					this.profileProvider.importExtendedPrivateKey(opts.extendedPrivateKey, opts).then((newWallet) => {
						return resolve({ newWallet: newWallet});
					}).catch((err) => {
						if (!(err instanceof this.errors.NOT_AUTHORIZED)) {
							return reject(err);
							// return setErr(err);
						}
						// create and store a wallet
						this.profileProvider.createWallet(opts).then((newWallet) => {
							return resolve({ newWallet: newWallet, isNew: true});
						});
					}).catch((err) => {
						return reject(err);
					});
				}).catch((err) =>{
					return reject(err);
				});
			});
		};

		// Multisig wallets? add Copayers
		function addCopayers(newWallet, isNew, cb) {
			if (!isNew) return cb();
			if (wallet.n == 1) return cb();

			this.logger.info('Adding copayers for BCH wallet config:' + wallet.m + '-' + wallet.n);

			this.walletProvider.copyCopayers(wallet, newWallet, (err) => {
				if (err) {
					this.logger.warn(err);
					return setErr(err, cb);
				} 
				return cb();
			});
		};

		this.walletProvider.getKeys(wallet).then((keys) => {
			opts.extendedPrivateKey = keys.xPrivKey;
			this.onGoingProcessProvider.set('duplicatingWallet', true);
			importOrCreate().then((result: any) => {
				let newWallet = result.newWallet;
				let isNew = result.isNew;

				this.walletProvider.updateRemotePreferences(newWallet);
				this.pushNotificationsProvider.updateSubscription(newWallet);

				addCopayers(newWallet, isNew, (err) => {
					this.onGoingProcessProvider.set('duplicatingWallet', false);
					if (err)
						return setErr(err);

					if (isNew)
						this.walletProvider.startScan(newWallet);

					this.navCtrl.setRoot(SettingsPage);
					this.navCtrl.popToRoot();
					this.navCtrl.parent.select(0);
				});
			}).catch((err) => {
				this.logger.warn(err);
				this.onGoingProcessProvider.set('duplicatingWallet', false);
				this.error = err;
			});
		}).catch((err) => {
			this.logger.warn(err);
			this.onGoingProcessProvider.set('duplicatingWallet', false);
			this.error = err;
		});
	}
}