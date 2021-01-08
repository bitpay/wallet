/* Pages */
import { AddWalletPage } from '../pages/add-wallet/add-wallet';
import { AddPage } from '../pages/add/add';
import { CopayersPage } from '../pages/add/copayers/copayers';
import { CreateWalletPage } from '../pages/add/create-wallet/create-wallet';
import { ImportWalletPage } from '../pages/add/import-wallet/import-wallet';
import { JoinWalletPage } from '../pages/add/join-wallet/join-wallet';
import { SelectCurrencyPage } from '../pages/add/select-currency/select-currency';
import { BackupGamePage } from '../pages/backup/backup-game/backup-game';
import { BackupKeyPage } from '../pages/backup/backup-key/backup-key';
import { CountrySelectorPage } from '../pages/buy-crypto/country-selector/country-selector';
import { CryptoCoinSelectorPage } from '../pages/buy-crypto/crypto-coin-selector/crypto-coin-selector';
import { CryptoOffersPage } from '../pages/buy-crypto/crypto-offers/crypto-offers';
import { CryptoOrderSummaryPage } from '../pages/buy-crypto/crypto-order-summary/crypto-order-summary';
import { CryptoPaymentMethodPage } from '../pages/buy-crypto/crypto-payment-method/crypto-payment-method';
import { CryptoSettingsPage } from '../pages/buy-crypto/crypto-settings/crypto-settings';
import { ExchangeCheckoutPage } from '../pages/exchange-crypto/exchange-checkout/exchange-checkout';
import { ExchangeCryptoPage } from '../pages/exchange-crypto/exchange-crypto';
import { ExchangeCryptoSettingsPage } from '../pages/exchange-crypto/exchange-crypto-settings/exchange-crypto-settings';
import { SendFeedbackPage } from '../pages/feedback/send-feedback/send-feedback';
import { FinishModalPage } from '../pages/finish/finish';
import { NewFeaturePage } from '../pages/new-feature/new-feature';
import { AddFundsPage } from '../pages/onboarding/add-funds/add-funds';
import { CollectEmailPage } from '../pages/onboarding/collect-email/collect-email';
import { DisclaimerPage } from '../pages/onboarding/disclaimer/disclaimer';
import { FeatureEducationPage } from '../pages/onboarding/feature-education/feature-education';
import { LockMethodPage } from '../pages/onboarding/lock-method/lock-method';
import { RecoveryKeyPage } from '../pages/onboarding/recovery-key/recovery-key';
import { PaperWalletPage } from '../pages/paper-wallet/paper-wallet';
import { SlideToAcceptPage } from '../pages/slide-to-accept/slide-to-accept';
import { TabsPage } from '../pages/tabs/tabs';
import { TxDetailsModal } from '../pages/tx-details/tx-details';
import { TxpDetailsPage } from '../pages/txp-details/txp-details';
import { SearchTxModalPage } from '../pages/wallet-details/search-tx-modal/search-tx-modal';
import { WalletBalanceModal } from '../pages/wallet-details/wallet-balance/wallet-balance';
import { WalletDetailsPage } from '../pages/wallet-details/wallet-details';

// Integrations: Invoice
import { SelectInvoicePage } from '../pages/integrations/invoice/select-invoice/select-invoice';

// Integrations: Changelly
import { ChangellyPage } from '../pages/integrations/changelly/changelly';
import { ChangellyDetailsPage } from '../pages/integrations/changelly/changelly-details/changelly-details';
import { ChangellyTermsPage } from '../pages/integrations/changelly/changelly-terms/changelly-terms';

// Integrations: Coinbase
import { CoinbasePage } from '../pages/integrations/coinbase/coinbase';
import { CoinbaseAccountPage } from '../pages/integrations/coinbase/coinbase-account/coinbase-account';
import { CoinbaseSettingsPage } from '../pages/integrations/coinbase/coinbase-settings/coinbase-settings';
import { CoinbaseTxDetailsPage } from '../pages/integrations/coinbase/coinbase-tx-details/coinbase-tx-details';
import { CoinbaseWithdrawPage } from '../pages/integrations/coinbase/coinbase-withdraw/coinbase-withdraw';

// Integrations: Simplex
import { SimplexPage } from '../pages/integrations/simplex/simplex';
import { SimplexDetailsPage } from '../pages/integrations/simplex/simplex-details/simplex-details';

// Integrations: Wyre
import { WyrePage } from '../pages/integrations/wyre/wyre';
import { WyreDetailsPage } from '../pages/integrations/wyre/wyre-details/wyre-details';

// Integrations: Wallet Connect
import { WalletConnectPage } from '../pages/integrations/wallet-connect/wallet-connect';

// Integrations: BitPayCard
import { BitPayCardPage } from '../pages/integrations/bitpay-card/bitpay-card';
import { BitPayCardHome } from '../pages/integrations/bitpay-card/bitpay-card-home/bitpay-card-home';
import { BitPayCardIntroPage } from '../pages/integrations/bitpay-card/bitpay-card-intro/bitpay-card-intro';
import { BitPayCardTopUpPage } from '../pages/integrations/bitpay-card/bitpay-card-topup/bitpay-card-topup';
import { BitPaySettingsPage } from '../pages/integrations/bitpay-card/bitpay-settings/bitpay-settings';

// Integrations: BitPayCard - Phases

// Phase 1
import { PhaseOneCardIntro } from '../pages/integrations/bitpay-card/bitpay-card-phases/phase-one/phase-one-intro-page/phase-one-intro-page';

/*Includes */
import { CardItemPage } from '../pages/includes/card-item/card-item';
import { CoinSelectorPage } from '../pages/includes/coin-selector/coin-selector';
import { CreateNewWalletPage } from '../pages/includes/create-new-wallet/create-new-wallet';
import { FeedbackCardPage } from '../pages/includes/feedback-card/feedback-card';
import { GravatarPage } from '../pages/includes/gravatar/gravatar';
import { MultipleOutputsPage } from '../pages/includes/multiple-outputs/multiple-outputs';
import { TxpPage } from '../pages/includes/txp/txp';

/* Tabs */
import { CardsPage } from '../pages/cards/cards';
import { HomePage } from '../pages/home/home';
import { ScanPage } from '../pages/scan/scan';
import { SendPage } from '../pages/send/send';
import { SettingsPage } from '../pages/settings/settings';
import { WalletsPage } from '../pages/wallets/wallets';

/* Home */
import { ProposalsNotificationsPage } from '../pages/wallets/proposals-notifications/proposals-notifications';
import { PricePage } from './home/price-page/price-page';

/* Settings */
import { FingerprintModalPage } from '../pages/fingerprint/fingerprint';
import { PIN_COMPONENTS } from '../pages/pin/pin';
import { AboutPage } from '../pages/settings/about/about';
import { SessionLogPage } from '../pages/settings/about/session-log/session-log';
import { AddressbookAddPage } from '../pages/settings/addressbook/add/add';
import { AddressbookPage } from '../pages/settings/addressbook/addressbook';
import { AddressbookViewPage } from '../pages/settings/addressbook/view/view';
import { AdvancedPage } from '../pages/settings/advanced/advanced';
import { AltCurrencyPage } from '../pages/settings/alt-currency/alt-currency';
import { BitPayIdPage } from '../pages/settings/bitpay-id/bitpay-id';
import { FeePolicyPage } from '../pages/settings/fee-policy/fee-policy';
import { LanguagePage } from '../pages/settings/language/language';
import { LocalThemePage } from '../pages/settings/local-theme/local-theme';
import { LockPage } from '../pages/settings/lock/lock';
import { NotificationsPage } from '../pages/settings/notifications/notifications';
import { SharePage } from '../pages/settings/share/share';

/* Wallet Group Settings */
import { ClearEncryptPasswordPage } from '../pages/settings/key-settings/clear-encrypt-password/clear-encrypt-password';
import { ExtendedPrivateKeyPage } from '../pages/settings/key-settings/extended-private-key/extended-private-key';
import { KeyDeletePage } from '../pages/settings/key-settings/key-delete/key-delete';
import { KeyNamePage } from '../pages/settings/key-settings/key-name/key-name';
import { KeyOnboardingPage } from '../pages/settings/key-settings/key-onboarding/key-onboarding';
import { KeyQrExportPage } from '../pages/settings/key-settings/key-qr-export/key-qr-export';
import { KeySettingsPage } from '../pages/settings/key-settings/key-settings';

/* Wallet Settings */
import { WalletDeletePage } from '../pages/settings/wallet-settings/wallet-delete/wallet-delete';
import { WalletNamePage } from '../pages/settings/wallet-settings/wallet-name/wallet-name';
import { WalletSettingsPage } from '../pages/settings/wallet-settings/wallet-settings';
import { WalletMnemonicRecoverPage } from './settings/advanced/wallet-recover-page/wallet-mnemonic-recover-page/wallet-mnemonic-recover-page';
import { WalletRecoverPage } from './settings/advanced/wallet-recover-page/wallet-recover-page';

/* Wallet Advanced Settings */
import { AllAddressesPage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-addresses/all-addresses/all-addresses';
import { WalletAddressesPage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-addresses/wallet-addresses';
import { WalletDuplicatePage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-duplicate/wallet-duplicate';
import { WalletExportPage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-export/wallet-export';
import { WalletInformationPage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-information/wallet-information';
import { WalletServiceUrlPage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-service-url/wallet-service-url';
import { WalletTransactionHistoryPage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-transaction-history/wallet-transaction-history';

/* Send */
import { CreateEthMultisigPage } from '../pages/add/create-eth-multisig/create-eth-multisig';
import { AmountPage } from '../pages/send/amount/amount';
import { ConfirmPage } from '../pages/send/confirm/confirm';
import { MultiSendPage } from '../pages/send/multi-send/multi-send';
import { SelectInputsPage } from '../pages/send/select-inputs/select-inputs';
import { TransferToModalPage } from '../pages/send/transfer-to-modal/transfer-to-modal';
import { TransferToPage } from '../pages/send/transfer-to/transfer-to';

/* Receive */
import { CustomAmountPage } from '../pages/receive/custom-amount/custom-amount';
import { WideHeaderPage } from './templates/wide-header-page/wide-header-page';

import { CardCatalogPage } from './integrations/gift-cards/card-catalog/card-catalog';
import { GIFT_CARD_PAGES } from './integrations/gift-cards/gift-cards';
import { MerchantPage } from './merchant/merchant';

export const PAGES = [
  AddPage,
  AddWalletPage,
  AmountPage,
  AddressbookPage,
  AddressbookAddPage,
  AddressbookViewPage,
  AboutPage,
  AdvancedPage,
  AllAddressesPage,
  AltCurrencyPage,
  BitPayCardHome,
  BitPayCardIntroPage,
  BitPayCardPage,
  BitPaySettingsPage,
  BitPayCardTopUpPage,
  BitPayIdPage,
  CardCatalogPage,
  ChangellyDetailsPage,
  ChangellyPage,
  ChangellyTermsPage,
  CreateWalletPage,
  CreateNewWalletPage,
  CoinbaseAccountPage,
  CoinbasePage,
  CoinbaseTxDetailsPage,
  CoinbaseWithdrawPage,
  CopayersPage,
  CountrySelectorPage,
  CryptoPaymentMethodPage,
  CryptoOrderSummaryPage,
  CryptoOffersPage,
  CryptoCoinSelectorPage,
  CryptoSettingsPage,
  ExchangeCheckoutPage,
  ExchangeCryptoPage,
  ExchangeCryptoSettingsPage,
  SelectInputsPage,
  FeedbackCardPage,
  SharePage,
  ImportWalletPage,
  JoinWalletPage,
  BackupGamePage,
  BackupKeyPage,
  CreateEthMultisigPage,
  ConfirmPage,
  MultiSendPage,
  TransferToModalPage,
  TransferToPage,
  CustomAmountPage,
  DisclaimerPage,
  AddFundsPage,
  FeatureEducationPage,
  LockMethodPage,
  RecoveryKeyPage,
  CollectEmailPage,
  ...GIFT_CARD_PAGES,
  GravatarPage,
  FingerprintModalPage,
  HomePage,
  CardsPage,
  WalletsPage,
  LanguagePage,
  LockPage,
  MerchantPage,
  MultipleOutputsPage,
  PaperWalletPage,
  ...PIN_COMPONENTS,
  PricePage,
  ProposalsNotificationsPage,
  ScanPage,
  SendPage,
  SettingsPage,
  SelectCurrencyPage,
  SelectInvoicePage,
  CoinbaseSettingsPage,
  SimplexPage,
  SimplexDetailsPage,
  WyrePage,
  WyreDetailsPage,
  NotificationsPage,
  FeePolicyPage,
  SearchTxModalPage,
  SessionLogPage,
  SendFeedbackPage,
  FinishModalPage,
  TabsPage,
  TxpDetailsPage,
  TxDetailsModal,
  TxpPage,
  WalletSettingsPage,
  WalletDeletePage,
  WalletNamePage,
  WalletInformationPage,
  WalletAddressesPage,
  WalletExportPage,
  WalletServiceUrlPage,
  WalletTransactionHistoryPage,
  WalletDuplicatePage,
  ExtendedPrivateKeyPage,
  ClearEncryptPasswordPage,
  KeyDeletePage,
  KeyQrExportPage,
  KeySettingsPage,
  KeyNamePage,
  KeyOnboardingPage,
  WalletConnectPage,
  WalletDetailsPage,
  WalletRecoverPage,
  WalletMnemonicRecoverPage,
  WalletBalanceModal,
  WideHeaderPage,
  CardItemPage,
  CoinSelectorPage,
  SlideToAcceptPage,
  LocalThemePage,
  NewFeaturePage,
  // Phases: card pages
  PhaseOneCardIntro
];
