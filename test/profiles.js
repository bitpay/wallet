var incomplete2of2Wallet = {
  "network": "livenet",
  "xPrivKey": "xprv9s21ZrQH143K27bhzfejhNcitEAJgLKCfdLxwhr1FLu43FLqLwscAxXgmkucpF4k8eGmepSctkiQDbcR98Qd1bzSeDuR9jeyQAQEanPT2A4",
  "xPubKey": "xpub6CkPnrzSUp9qzBVM3hpo4oS2JKC6GJq6brE1yW59QrnhDpvkFLakpxUGRGXH62fiXb5S2VbnD4h2DLoCMfSkwfonbNgNYTJw9Ko5SqWEqCR",
  "requestPrivKey": "0cb89231b31dfaae9034ba794b9c48597eb573429f7b4b1f95e1945b22166bd5",
  "requestPubKey": "022941a5ecb8c7224f812ad6b03bd1c9bb77861080b21703eabe18ef9a72b48e72",
  "copayerId": "3d4eb9b439eee1b2b73cf792eda52e420f4665109c7234a50cf3cdbf296ea8fb",
  "publicKeyRing": [{
    "xPubKey": "xpub6CkPnrzSUp9qzBVM3hpo4oS2JKC6GJq6brE1yW59QrnhDpvkFLakpxUGRGXH62fiXb5S2VbnD4h2DLoCMfSkwfonbNgNYTJw9Ko5SqWEqCR",
    "requestPubKey": "022941a5ecb8c7224f812ad6b03bd1c9bb77861080b21703eabe18ef9a72b48e72"
  }],
  "walletId": "7bd8d22f-d132-43e1-b259-d5b430752553",
  "walletName": "A test wallet",
  "m": 2,
  "n": 2,
  "walletPrivKey": "Kz4CFSTgLzoYfMkt97BTBotUbZYXjMts6Ej9HbVfCf5oLmun1BXy",
  "personalEncryptingKey": "1fgFP/uoLhVxJiMXOWQznA==",
  "sharedEncryptingKey": "FZIY4+p4TfBAKRclKtrROw==",
  "copayerName": "me",
  "mnemonic": "dizzy cycle skirt decrease exotic fork sure mixture hair vapor copper hero",
  "entropySource": "79e60ad83e04ee40967147fd6ac58f986c7dcf6c82b125fb4e8c30ff9f9584ee",
  "mnemonicHasPassphrase": false,
  "derivationStrategy": "BIP44",
  "account": 0,
  "addressType": "P2SH"
};
var testnet1of1Wallet = {
  "network": "testnet",
  "xPrivKey": "tprv8ZgxMBicQKsPdK35ubrjCCpPCaBZA7QyKtxNNDWvYyjDAhtxV1HVNLzqwntAJ5QH1RTksRSfbuHLUYvMdGFmy9vHCb4yDRAR2zKqmX8mVa8",
  "xPubKey": "tpubDDN7B6QnxsbomkZfPFRj6CVtC7LVh6ufoTpvzHfutjiHbu4hmiEGYDzxo5mgfqkQkBuwZPFkTYLNmQeLg7eFvdb4SFH1LW35sQD6xfymmRP",
  "requestPrivKey": "aa39d4d780ad7ec36e26cbd0c0250bce85dfdd8aa7f2222ec7c86d6d62f242d7",
  "requestPubKey": "038bb7cc1238280e893dd6949bfce770a319892b3c9045112ec7810191d4157ced",
  "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
  "publicKeyRing": [{
    "xPubKey": "tpubDDN7B6QnxsbomkZfPFRj6CVtC7LVh6ufoTpvzHfutjiHbu4hmiEGYDzxo5mgfqkQkBuwZPFkTYLNmQeLg7eFvdb4SFH1LW35sQD6xfymmRP",
    "requestPubKey": "038bb7cc1238280e893dd6949bfce770a319892b3c9045112ec7810191d4157ced"
  }],
  "walletId": "66d3afc9-7d76-4b25-850e-aa62fcc53a7d",
  "walletName": "kk",
  "m": 1,
  "n": 1,
  "walletPrivKey": "1d6eb8e5a9f8944e97c2f13423c137ce912fac00f7eb5b3ffe6e3c161ea98bf7",
  "personalEncryptingKey": "A2dQiAwpFY2xwIhE26ClFQ==",
  "sharedEncryptingKey": "z0BtAIFclGQMH6eHqK9e3w==",
  "copayerName": "me",
  "mnemonic": "cheese where alarm job conduct donkey license pave congress pepper fence current",
  "entropySource": "5c84e65837c0fbd11db935953dbacb60f5c33f40ecfe95e0feded1f62a5ee15d",
  "mnemonicHasPassphrase": false,
  "derivationStrategy": "BIP44",
  "account": 0,
  "addressType": "P2PKH"
};

var PROFILE = {
  incomplete2of2: {
    credentials: [incomplete2of2Wallet],
    createdOn: 1463519749,
    disclaimerAccepted: true,
  },
  testnet1of1: {
    credentials: [testnet1of1Wallet],
    createdOn: 1463519749,
    disclaimerAccepted: true,
  },
};
