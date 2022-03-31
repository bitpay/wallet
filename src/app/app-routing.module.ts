import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AddPage } from './pages/add/add';
import { CreateWalletPage } from './pages/add/create-wallet/create-wallet';
import { ImportWalletPage } from './pages/add/import-wallet/import-wallet';
import { JoinWalletPage } from './pages/add/join-wallet/join-wallet';
import { SelectCurrencyPage } from './pages/add/select-currency/select-currency';
import { SendFeedbackPage } from './pages/feedback/send-feedback/send-feedback';
import { PricePage } from './pages/home/price-page/price-page';
import { FeatureEducationPage } from './pages/onboarding/feature-education/feature-education';
import { RecoveryKeyPage } from './pages/onboarding/recovery-key/recovery-key';
import { ScanPage } from './pages/scan/scan';
import { AboutPage } from './pages/settings/about/about';
import { SessionLogPage } from './pages/settings/about/session-log/session-log';
import { AddressbookAddPage } from './pages/settings/addressbook/add/add';
import { AddressbookPage } from './pages/settings/addressbook/addressbook';
import { AddressbookViewPage } from './pages/settings/addressbook/view/view';
import { AdvancedPage } from './pages/settings/advanced/advanced';
import { WalletRecoverPage } from './pages/settings/advanced/wallet-recover-page/wallet-recover-page';
import { AltCurrencyPage } from './pages/settings/alt-currency/alt-currency';
import { FeePolicyPage } from './pages/settings/fee-policy/fee-policy';
import { KeySettingsPage } from './pages/settings/key-settings/key-settings';
import { LanguagePage } from './pages/settings/language/language';
import { LocalThemePage } from './pages/settings/local-theme/local-theme';
import { LockPage } from './pages/settings/lock/lock';
import { NavigationPage } from './pages/settings/navigation/navigation';
import { NotificationsPage } from './pages/settings/notifications/notifications';
import { SharePage } from './pages/settings/share/share';
import { WalletSettingsPage } from './pages/settings/wallet-settings/wallet-settings';
import { RedirectGuard } from './providers';
import { BackupKeyPage } from './pages/backup/backup-key/backup-key';
import { BackupGamePage } from './pages/backup/backup-game/backup-game';
import { WalletDetailsPage } from './pages/wallet-details/wallet-details';
import { AddWalletPage } from './pages/add-wallet/add-wallet';
import { SendPage } from './pages/send/send';
import { AmountPage } from './pages/send/amount/amount';
import { WalletNamePage } from './pages/settings/wallet-settings/wallet-name/wallet-name';
import { WalletInformationPage } from './pages/settings/wallet-settings/wallet-settings-advanced/wallet-information/wallet-information';
import { WalletAddressesPage } from './pages/settings/wallet-settings/wallet-settings-advanced/wallet-addresses/wallet-addresses';
import { WalletExportPage } from './pages/settings/wallet-settings/wallet-settings-advanced/wallet-export/wallet-export';
import { WalletServiceUrlPage } from './pages/settings/wallet-settings/wallet-settings-advanced/wallet-service-url/wallet-service-url';
import { WalletTransactionHistoryPage } from './pages/settings/wallet-settings/wallet-settings-advanced/wallet-transaction-history/wallet-transaction-history';
import { WalletDuplicatePage } from './pages/settings/wallet-settings/wallet-settings-advanced/wallet-duplicate/wallet-duplicate';
import { WalletDeletePage } from './pages/settings/wallet-settings/wallet-delete/wallet-delete';
import { WalletMnemonicRecoverPage } from './pages/settings/advanced/wallet-recover-page/wallet-mnemonic-recover-page/wallet-mnemonic-recover-page';
import { ClearEncryptPasswordPage } from './pages/settings/key-settings/clear-encrypt-password/clear-encrypt-password';
import { KeyDeletePage } from './pages/settings/key-settings/key-delete/key-delete';
import { KeyQrExportPage } from './pages/settings/key-settings/key-qr-export/key-qr-export';
import { ExtendedPrivateKeyPage } from './pages/settings/key-settings/extended-private-key/extended-private-key';
import { KeyNamePage } from './pages/settings/key-settings/key-name/key-name';
import { LockMethodPage } from './pages/onboarding/lock-method/lock-method';
import { ProposalsNotificationsPage } from './pages/wallets/proposals-notifications/proposals-notifications';
import { ConfirmPage } from './pages/send/confirm/confirm';
import { MultiSendPage } from './pages/send/multi-send/multi-send';
import { SelectInputsPage } from './pages/send/select-inputs/select-inputs';
import { TransferToModalPage } from './pages/send/transfer-to-modal/transfer-to-modal';
import { CustomAmountPage } from './pages/receive/custom-amount/custom-amount';
import { AddFundsPage } from './pages/onboarding/add-funds/add-funds';
import { CopayersPage } from './pages/add/copayers/copayers';
import { PaperWalletPage } from './pages/paper-wallet/paper-wallet';
import { TokenDetailsPage } from './pages/token-details/token-details';
import { ConfirmTokenPage } from './pages/confirm-token/confirm-token';
import { TokenInforPage } from './pages/token-info/token-info';
import { SelectInputsSendPage } from './pages/send/send-select-inputs/send-select-inputs';
import { AccountsPage } from './pages/accounts/accounts';
import { SettingsPage } from './pages/settings/settings';
import { SearchContactPage } from './pages/search/search-contact/search-contact.component';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'feature-education',
    component: FeatureEducationPage
  },
  {
    path: 'about',
    component: AboutPage,
  },
  {
    path: 'accounts-page',
    component: AccountsPage
  },
  {
    path: 'token-details',
    component: TokenDetailsPage
  },
  {
    path: 'token-info',
    component: TokenInforPage
  },
  {
    path: 'confirm-token',
    component: ConfirmTokenPage
  },
  
  {
    path: 'alt-curency',
    component: AltCurrencyPage,
  },
  {
    path: 'language',
    component: LanguagePage,
  },
  {
    path: 'advanced',
    component: AdvancedPage,
  },
  {
    path: 'local-theme',
    component: LocalThemePage,
  },
  {
    path: 'navigation',
    component: NavigationPage,
  },
  {
    path: 'addressbook',
    component: AddressbookPage,
  },
  {
    path: 'fee-policy',
    component: FeePolicyPage,
  },
  {
    path: 'notifications',
    component: NotificationsPage,
  },
  {
    path: 'wallet-settings',
    component: WalletSettingsPage,
  },
  {
    path: 'share',
    component: SharePage,
  },
  {
    path: 'lock',
    component: LockPage,
  },
  {
    path: 'key-settings',
    component: KeySettingsPage,
  },
  {
    path: 'add',
    component: AddPage,
  },
  {
    path: 'wallet-recover',
    component: WalletRecoverPage,
  },
  {
    path: 'address-book-add',
    component: AddressbookAddPage,
  },
  {
    path: 'address-book-view',
    component: AddressbookViewPage,
  },
  {
    path: 'scan',
    component: ScanPage,
  },
  {
    path: 'price',
    component: PricePage,
  },
  {
    path: 'session-log',
    component: SessionLogPage,
  },
  {
    path: 'send-feedback',
    component: SendFeedbackPage,
  },
  {
    path: 'share',
    component: SharePage,
  },
  {
    path: 'select-currency',
    component: SelectCurrencyPage,
  },
  {
    path: 'join-wallet',
    component: JoinWalletPage,
  },
  {
    path: 'create-wallet',
    component: CreateWalletPage,
  },
  {
    path: 'import-wallet',
    component: ImportWalletPage,
  },
  {
    path: 'recovery-key',
    component: RecoveryKeyPage,
  },
  {
    path: 'wallet-details',
    component: WalletDetailsPage,
  },
  {
    path: 'send-page',
    component: SendPage,
  },
  {
    path: 'add-wallet',
    component: AddWalletPage,
  },
  {
    path: 'amount',
    component: AmountPage,
  },
  {
    path: 'wallet-name',
    component: WalletNamePage,
  },
  {
    path: 'wallet-information',
    component: WalletInformationPage,
  },
  {
    path: 'wallet-addresses',
    component: WalletAddressesPage,
  },
  {
    path: 'wallet-export',
    component: WalletExportPage,
  },
  {
    path: 'wallet-service-url',
    component: WalletServiceUrlPage,
  },
  {
    path: 'wallet-transaction-history',
    component: WalletTransactionHistoryPage,
  },
  {
    path: 'wallet-duplicate',
    component: WalletDuplicatePage,
  },
  {
    path: 'wallet-delete',
    component: WalletDeletePage,
  },
  {
    path: 'wallet-mnemonic-recover',
    component: WalletMnemonicRecoverPage,
  },
  {
    path: 'backup-key',
    component: BackupKeyPage,
  },
  {
    path: 'backup-game',
    component: BackupGamePage,
  },
  {
    path: 'clear-encrypt-password',
    component: ClearEncryptPasswordPage,
  },
  {
    path: 'key-delete',
    component: KeyDeletePage,
  },
  {
    path: 'key-qr-export',
    component: KeyQrExportPage,
  },
  {
    path: 'extended-private-key',
    component: ExtendedPrivateKeyPage,
  },
  {
    path: 'key-name',
    component: KeyNamePage,
  },
  {
    path: 'lock-method',
    component: LockMethodPage,
    canActivate: [RedirectGuard]
  },
  {
    path: 'proposals-notifications',
    component: ProposalsNotificationsPage,
  },
  {
    path: 'confirm',
    component: ConfirmPage,
  },
  {
    path: 'multi-send',
    component: MultiSendPage,
  },
  {
    path: 'select-inputs',
    component: SelectInputsPage,
  },
  {
    path: 'send-select-inputs',
    component: SelectInputsSendPage,
  },
  {
    path: 'transfer-to-modal',
    component: TransferToModalPage,
  },
  {
    path: 'custom-amount',
    component: CustomAmountPage,
  },
  {
    path: 'add-funds',
    component: AddFundsPage,
  },
  {
    path: 'copayers',
    component: CopayersPage,
  }, 
  {
    path: 'paper-wallet',
    component: PaperWalletPage,
  },
  {
    path: 'address-book-add',
    component: AddressbookAddPage,
  },
  {
    path: 'setting',
    component: SettingsPage
  },
  {
    path: 'search-contact',
    component: SearchContactPage
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
