var walletInfo = {
  "wallet": {
    "version": "1.0.0",
    "createdOn": 1463511645,
    "id": "7bd8d22f-d132-43e1-b259-d5b430752553",
    "name": "{\"iv\":\"BZQVWAP6d1e4G8Fq1rQKbA==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"70OA+k4+xTPxim+QSdDtA5/Cf055\"}",
    "m": 2,
    "n": 2,
    "status": "pending",
    "publicKeyRing": [],
    "copayers": [{
      "version": 2,
      "createdOn": 1463511988,
      "id": "3d4eb9b439eee1b2b73cf792eda52e420f4665109c7234a50cf3cdbf296ea8fb",
      "name": "{\"iv\":\"BZQVWAP6d1e4G8Fq1rQKbA==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"wwZd+2LQgYR6cA==\"}",
      "xPubKey": "xpub6CkPnrzSUp9qzBVM3hpo4oS2JKC6GJq6brE1yW59QrnhDpvkFLakpxUGRGXH62fiXb5S2VbnD4h2DLoCMfSkwfonbNgNYTJw9Ko5SqWEqCR",
      "requestPubKey": "022941a5ecb8c7224f812ad6b03bd1c9bb77861080b21703eabe18ef9a72b48e72",
      "signature": "30440220521623cf346f667658c00f1dea113407f23cecf02932c7dcb4b8bf35f1836b7a02202c77b8e4260942f4e13a58faae1f92e1130bae1157492056347e66741150eb2c",
      "requestPubKeys": [{
        "key": "022941a5ecb8c7224f812ad6b03bd1c9bb77861080b21703eabe18ef9a72b48e72",
        "signature": "30440220521623cf346f667658c00f1dea113407f23cecf02932c7dcb4b8bf35f1836b7a02202c77b8e4260942f4e13a58faae1f92e1130bae1157492056347e66741150eb2c"
      }],
      "customData": "{\"iv\":\"BZQVWAP6d1e4G8Fq1rQKbA==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"YJqN/LtkCY0cOB235RtbGEAY7wKGT0cUUpAvUeLkAUKz3/1axsYZtnG+PU0jHtwQvgmKNLkNcXNR60K+tyRpU0TG1z8pyx4gKwwD3Dt7KzA=\"}"
    }],
    "pubKey": "026d95bb5cc2a30c19e22379ae78b4757aaa2dd0ccbd15a1db054fb50cb98ed361",
    "network": "livenet",
    "derivationStrategy": "BIP44",
    "addressType": "P2SH",
    "addressManager": {
      "version": 2,
      "derivationStrategy": "BIP44",
      "receiveAddressIndex": 0,
      "changeAddressIndex": 0,
      "copayerIndex": 2147483647
    },
    "scanStatus": null
  },
  "preferences": {},
  "pendingTxps": [],
  "balance": {
    "totalAmount": 0,
    "lockedAmount": 0,
    "totalConfirmedAmount": 0,
    "lockedConfirmedAmount": 0,
    "availableAmount": 0,
    "availableConfirmedAmount": 0,
    "byAddress": [],
    "totalBytesToSendMax": 0,
    "totalBytesToSendConfirmedMax": 0
  }
};

var FIXTURES = {

  // store preferences
  '1eda3e702196b8d5d82fae129249bc79f0d5be2f5309a4e39855e7eb4ad31428': {},

  // Incomplete wallet status
  'd05582c35aa545494e3f3be9713efa9df112d36a324350f6b7141996b824bce2': walletInfo,
  // ^ same thing, twostep=1
  '56f430fcd3987d37d5818b1c0a716544c0115cd1b65e3bf163006b1823494ad2': walletInfo,
  // put /preferences
  '8fb7fc4644c3828a7df61185a08504c685df0867b21c6ad2a386d69bc3a1a568': {},
  //
  '980fad92e75cdfdfe59d139bf1f65ff3ccb7b0e56718637fd9de5842f7875312': {
    "version": "1.0.0",
    "createdOn": 1463520484,
    "walletId": "7bd8d22f-d132-43e1-b259-d5b430752553",
    "copayerId": "3d4eb9b439eee1b2b73cf792eda52e420f4665109c7234a50cf3cdbf296ea8fb",
    "email": null,
    "language": null,
    "unit": "bit"
  },

  // Complete 1-1 wallet status
  //
  'adf7024c3573a59f42e712d894bcc1f41eb8f946a8aefba52359e2b034bdf0d4': {
    "wallet": {
      "version": "1.0.0",
      "createdOn": 1455745883,
      "id": "66d3afc9-7d76-4b25-850e-aa62fcc53a7d",
      "name": "kk",
      "m": 1,
      "n": 1,
      "status": "complete",
      "copayers": [{
        "version": 2,
        "createdOn": 1455745883,
        "id": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
        "name": "copayer 1",
        "requestPubKeys": [{
          "key": "038bb7cc1238280e893dd6949bfce770a319892b3c9045112ec7810191d4157ced",
          "signature": "304402207fe3d127734bea08231597f7f06bf61b5dd8c9ba63cf512fd4b0fac2d5d9144c022028566c6fdc959c1c107f9c0d79f8b287aa500bf5a3e022b9ea49eb33392e4566"
        }]
      }],
      "network": "testnet",
      "derivationStrategy": "BIP44",
      "addressType": "P2PKH",
      "scanStatus": "success"
    },
    "preferences": {},
    "pendingTxps": [],
    "balance": {
      "totalAmount": 1847686,
      "lockedAmount": 0,
      "totalConfirmedAmount": 1847686,
      "lockedConfirmedAmount": 0,
      "availableAmount": 1847686,
      "availableConfirmedAmount": 1847686,
      "byAddress": [{
        "address": "mnZ3vC2u2GcAbWBvxVnB5V4F8QcwKg3fkp",
        "path": "m/1/46",
        "amount": 1843286
      }, {
        "address": "n2mwd1JeJWCaLTfTAZMJtiWVyC3y1Wbfid",
        "path": "m/0/16",
        "amount": 4400
      }],
      "totalBytesToSendMax": 578,
      "totalBytesToSendConfirmedMax": 578
    }
  },
  // History
  '499c8fcad0c1895054a82b3d2f8df81fd98789871f1d87e5aa88521177bb15fb': [{
    "txid": "49d69287e6e284b5ae845ef61e90dc6709e6a3f1f0c94cf665ff1d8d6e4efc71",
    "action": "sent",
    "amount": 1000000,
    "fees": 9720,
    "time": 1462156858,
    "addressTo": "mrYKc2NYioXxbQSSRDdUh9QwBYS3h3BFvV",
    "confirmations": 40706,
    "outputs": [{
      "amount": 1000000,
      "address": "mrYKc2NYioXxbQSSRDdUh9QwBYS3h3BFvV"
    }]
  }, {
    "txid": "2e9f7e73208c70fea6ab51944c9de33cb2d0cc936a98386e0024c743844cdf3f",
    "action": "sent",
    "amount": 10000,
    "fees": 9720,
    "time": 1462138505,
    "addressTo": "mtevLzhkNMeV1T8px5aghSjT5WeeXQVT2i",
    "confirmations": 40897,
    "outputs": [{
      "amount": 10000,
      "address": "mtevLzhkNMeV1T8px5aghSjT5WeeXQVT2i"
    }]
  }, {
    "txid": "d799112cb54e60019503219af445172eeaa1f6fb41ee3a27bedc70c95ac6e70b",
    "action": "sent",
    "amount": 10000,
    "fees": 2439,
    "time": 1462072762,
    "addressTo": "mtevLzhkNMeV1T8px5aghSjT5WeeXQVT2i",
    "confirmations": 41387,
    "outputs": [{
      "amount": 10000,
      "address": "mtevLzhkNMeV1T8px5aghSjT5WeeXQVT2i"
    }]
  }, {
    "txid": "9dd0971ad83bfb276ac76811352bc92c55d9f51a0038157614b35896913c2cea",
    "action": "sent",
    "amount": 2200,
    "fees": 4261,
    "time": 1462070325,
    "addressTo": "mtevLzhkNMeV1T8px5aghSjT5WeeXQVT2i",
    "confirmations": 41389,
    "outputs": [{
      "amount": 2200,
      "address": "mtevLzhkNMeV1T8px5aghSjT5WeeXQVT2i"
    }]
  }, {
    "txid": "094b30e77fdfc20617ed9da08c46d0e342c0cc6a5271e59fc59c4e731681ad51",
    "action": "sent",
    "amount": 1100,
    "fees": 2439,
    "time": 1462043263,
    "addressTo": "mmvNFchzzpWX5Yzx3j5A1vLf5KV9KtGEfo",
    "confirmations": 41650,
    "outputs": [{
      "amount": 1100,
      "address": "mmvNFchzzpWX5Yzx3j5A1vLf5KV9KtGEfo"
    }],
  }],
  // txhistory 1-1 testnet
  'be65742a355b926d4e7bc7acf5194930474ec8db885e2c65f22791b7cdb8c4f0': [{
    "txid": "6fa0a54f0d7e8518f8622bd6e84224ea41bbf0cd6238ad127d1751b924e915a2",
    "action": "sent",
    "amount": 10000,
    "fees": 2439,
    "time": 1462035742,
    "addressTo": "mtevLzhkNMeV1T8px5aghSjT5WeeXQVT2i",
    "confirmations": 41748,
    "outputs": [{
      "amount": 10000,
      "address": "mtevLzhkNMeV1T8px5aghSjT5WeeXQVT2i",
      "message": null
    }],
    "proposalId": "014620287996740afec64f-2b23-4fa9-9ba1-21a9939334e8",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1462028803,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "310d2792edd87e7cbeb77907ca3c70ec8f061dd806f1618b21e5224d8cf2b5b7",
    "action": "sent",
    "amount": 10000,
    "fees": 2439,
    "time": 1462029578,
    "addressTo": "mmvNFchzzpWX5Yzx3j5A1vLf5KV9KtGEfo",
    "confirmations": 41802,
    "outputs": [{
      "amount": 10000,
      "address": "mmvNFchzzpWX5Yzx3j5A1vLf5KV9KtGEfo",
      "message": null
    }],
    "proposalId": "0146202332218821437804-3a42-4179-b4ef-779651699120",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1462023324,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "ba06ed943dbbf6d8316c8da67acee71e648a1db6e8eb54bff7832500f2e71263",
    "action": "sent",
    "amount": 21000,
    "fees": 9000,
    "time": 1462028414,
    "addressTo": "mtevLzhkNMeV1T8px5aghSjT5WeeXQVT2i",
    "confirmations": 41822,
    "outputs": [{
      "amount": 21000,
      "address": "mtevLzhkNMeV1T8px5aghSjT5WeeXQVT2i",
      "message": null
    }],
    "proposalId": "014620205262398f9fbb3c-fa0e-4e89-8c01-c462aeac75de",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1462020528,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "bf13ca5e0375185a1ce1e6c2068d0ae5a7965e72e71d715e63df00b586600155",
    "action": "sent",
    "amount": 22200,
    "fees": 2439,
    "time": 1462028360,
    "addressTo": "mtevLzhkNMeV1T8px5aghSjT5WeeXQVT2i",
    "confirmations": 41816,
    "outputs": [{
      "amount": 22200,
      "address": "mtevLzhkNMeV1T8px5aghSjT5WeeXQVT2i",
      "message": null
    }],
    "proposalId": "01462020614530e1178805-4eae-497e-b20a-e81ac3c3dd37",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1462021427,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "1d3ca0adb421f7fc5290ab5018b9f167a5b9f506a0d4aec61064f90cee43afd2",
    "action": "sent",
    "amount": 22200,
    "fees": 2439,
    "time": 1462028357,
    "addressTo": "mmvNFchzzpWX5Yzx3j5A1vLf5KV9KtGEfo",
    "confirmations": 41805,
    "outputs": [{
      "amount": 22200,
      "address": "mmvNFchzzpWX5Yzx3j5A1vLf5KV9KtGEfo",
      "message": null
    }],
    "proposalId": "01462021663526fac48a42-10b0-4c45-a196-48a80ae61ae5",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1462022922,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "d7aa52c264719da786d3d0e6139c2e280834db02354fc334dc8d1d0c96a4cb77",
    "action": "sent",
    "amount": 1100,
    "fees": 3300,
    "time": 1462008652,
    "addressTo": "mtevLzhkNMeV1T8px5aghSjT5WeeXQVT2i",
    "confirmations": 41991,
    "outputs": [{
      "amount": 1100,
      "address": "mtevLzhkNMeV1T8px5aghSjT5WeeXQVT2i",
      "message": null
    }],
    "proposalId": "01462001958646d502eeb6-8829-4f09-951c-fdbae655343d",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1462001961,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "23b4e0b3ef1fd90a42c7088c3464d11c3ede9109d657602c8e811f3a14f377bd",
    "action": "sent",
    "amount": 22200,
    "fees": 10000,
    "time": 1462008652,
    "addressTo": "mtevLzhkNMeV1T8px5aghSjT5WeeXQVT2i",
    "confirmations": 41991,
    "outputs": [{
      "amount": 22200,
      "address": "mtevLzhkNMeV1T8px5aghSjT5WeeXQVT2i",
      "message": null
    }],
    "proposalId": "01462002020568ca4b9a61-f7e9-417e-a5af-d9d986f648db",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1462002170,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "15df3120c5690e479878441362117214ee27be656f90504ebd895eb50e8188be",
    "action": "received",
    "amount": 2959321,
    "fees": 6985,
    "time": 1462008609,
    "confirmations": 41995,
    "outputs": [{
      "amount": 2959321,
      "address": "n2mwd1JeJWCaLTfTAZMJtiWVyC3y1Wbfid"
    }]
  }, {
    "txid": "3fe0f1edca7f4999759d06da0e1a7179048fd7f24bf25af030a341ee4ef50f80",
    "action": "received",
    "amount": 10000,
    "fees": 2439,
    "time": 1461990151,
    "confirmations": 42324,
    "outputs": [{
      "amount": 10000,
      "address": "n2mwd1JeJWCaLTfTAZMJtiWVyC3y1Wbfid"
    }]
  }, {
    "txid": "4e2b3359dc53de7f6b6c3e374548bb22f6edf9b36c55e20f38fc9b01d045dd52",
    "action": "received",
    "amount": 11100,
    "fees": 2439,
    "time": 1461963912,
    "confirmations": 42816,
    "outputs": [{
      "amount": 11100,
      "address": "n2mwd1JeJWCaLTfTAZMJtiWVyC3y1Wbfid"
    }]
  }, {
    "txid": "3f661f7f43fc9b7a5fe8fc394398c864d9b76431a277bcbe020e342427a5540f",
    "action": "received",
    "amount": 10000,
    "fees": 2439,
    "time": 1461963855,
    "confirmations": 42828,
    "outputs": [{
      "amount": 10000,
      "address": "n2mwd1JeJWCaLTfTAZMJtiWVyC3y1Wbfid"
    }]
  }, {
    "txid": "3cd04bf9e46cce847d58b8d0fbbb6d5635e026aec3fd54fe0b980c8e603f235e",
    "action": "received",
    "amount": 10000,
    "fees": 2439,
    "time": 1461963834,
    "confirmations": 42827,
    "outputs": [{
      "amount": 10000,
      "address": "n2mwd1JeJWCaLTfTAZMJtiWVyC3y1Wbfid"
    }]
  }, {
    "txid": "a1e27edbac77faf5e9109d675f5132afeea8c7a5751685a0fb18ab0501bc8673",
    "action": "received",
    "amount": 10000,
    "fees": 2438,
    "time": 1461949047,
    "confirmations": 43222,
    "outputs": [{
      "amount": 10000,
      "address": "n2mwd1JeJWCaLTfTAZMJtiWVyC3y1Wbfid"
    }]
  }, {
    "txid": "abc01e2a966fdcb64de6f2185e5a677f35dd2657469788ca98014dba23f54d0a",
    "action": "received",
    "amount": 10000,
    "fees": 2438,
    "time": 1461945399,
    "confirmations": 43301,
    "outputs": [{
      "amount": 10000,
      "address": "n2mwd1JeJWCaLTfTAZMJtiWVyC3y1Wbfid"
    }]
  }, {
    "txid": "c6ef1b2596a16624030a70467654e82bb6d3f211e768e606d7a41d2856c04181",
    "action": "received",
    "amount": 4400,
    "fees": 6405,
    "time": 1461878525,
    "confirmations": 45958,
    "outputs": [{
      "amount": 4400,
      "address": "n2mwd1JeJWCaLTfTAZMJtiWVyC3y1Wbfid"
    }]
  }, {
    "txid": "bfeeafb79e22d92a936ad5ba3e806c9c2f86ab9676ff754ee6be9c66dc0ec8c1",
    "action": "received",
    "amount": 2200,
    "fees": 2438,
    "time": 1461855553,
    "confirmations": 49553,
    "outputs": [{
      "amount": 2200,
      "address": "n2mwd1JeJWCaLTfTAZMJtiWVyC3y1Wbfid"
    }]
  }, {
    "txid": "9d01c610927833f7bbc10c75623f73063687c44fad3f9f3730fb6df8727e3661",
    "action": "received",
    "amount": 2200,
    "fees": 2438,
    "time": 1461855468,
    "confirmations": 49591,
    "outputs": [{
      "amount": 2200,
      "address": "n2mwd1JeJWCaLTfTAZMJtiWVyC3y1Wbfid"
    }]
  }, {
    "txid": "b7bb9dad39055f3dbe8943d03ffbd6463312107883386edbfc276a91cf64943d",
    "action": "received",
    "amount": 11100,
    "fees": 2439,
    "time": 1461780282,
    "confirmations": 60334,
    "outputs": [{
      "amount": 11100,
      "address": "n2mwd1JeJWCaLTfTAZMJtiWVyC3y1Wbfid"
    }]
  }, {
    "txid": "7ce9a68bd8951d6cfefd9ac5ab4b3ee0196b5ee24bbf0f28196bcc7bd5313edb",
    "action": "sent",
    "amount": 4138994,
    "fees": 16790,
    "time": 1460566285,
    "addressTo": "mmXGGqzRhFeEJFufUJrwtnk3VuQEJHyKhh",
    "confirmations": 83134,
    "outputs": [{
      "amount": 4138994,
      "address": "mmXGGqzRhFeEJFufUJrwtnk3VuQEJHyKhh",
      "message": null
    }],
    "proposalId": "01460558645581d749b541-721b-4fa4-ac57-67c4aa6f6c52",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1460558648,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "659667057122f1e5ed25fa7d650809c907bfb6e5cff6e2ede2fabc13442ebd75",
    "action": "received",
    "amount": 3930983,
    "fees": 7859,
    "time": 1460566285,
    "confirmations": 83134,
    "outputs": [{
      "amount": 3930983,
      "address": "mtnUUgPrfSzMCEPaBbshwnwfKJWxZtYBs6"
    }]
  }, {
    "txid": "d3b0882fc40533d41c02bff0a616a2d46b1c689876a9420985781d0edad1151e",
    "action": "sent",
    "amount": 4400,
    "fees": 10789,
    "time": 1459470932,
    "addressTo": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
    "confirmations": 90091,
    "outputs": [{
      "amount": 4400,
      "address": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
      "message": null
    }],
    "proposalId": "01459463705829b29f0237-b1c3-456c-9df7-c4d3382e1c44",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1459463713,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "d02f616767b72b4817dc2c6c29fd07046b57f2f7f0910ef2a0d79599b4fcbe5e",
    "action": "sent",
    "amount": 3300,
    "fees": 11244,
    "time": 1459470932,
    "addressTo": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
    "confirmations": 90091,
    "outputs": [{
      "amount": 3300,
      "address": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
      "message": null
    }],
    "proposalId": "0145946365335296086038-0213-46b5-8b13-1eca1269698f",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1459463655,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "9655e1110aa57c6f2ca505e9b19dd5b38e61fb3315ac0e53d6b315dd0d67b661",
    "action": "sent",
    "amount": 24300,
    "fees": 10789,
    "time": 1459468226,
    "addressTo": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
    "confirmations": 90117,
    "outputs": [{
      "amount": 24300,
      "address": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
      "message": null
    }],
    "proposalId": "01459462361539714519e1-f9c4-4c5a-91fd-b0b12da50ae9",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1459462364,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "2e2562b5ec002dba96af62e8bcfa9b3b65f6f60e96488bc59fbeee3174f750a4",
    "action": "sent",
    "amount": 23200,
    "fees": 10789,
    "time": 1459468140,
    "addressTo": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
    "confirmations": 90124,
    "outputs": [{
      "amount": 23200,
      "address": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
      "message": null
    }],
    "proposalId": "01459462091745b84c94ff-3650-4113-842a-6b49fa379f5e",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1459462094,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "75a7aa5fa4d03fd484ee26e0a4aad37ccb0e735dd03027dab63fb12ae8a9cd3b",
    "action": "sent",
    "amount": 23100,
    "fees": 10789,
    "time": 1459468129,
    "addressTo": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
    "confirmations": 90129,
    "outputs": [{
      "amount": 23100,
      "address": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
      "message": null
    }],
    "proposalId": "014594616413651df5dce6-ddc3-4b19-9721-381fd78006db",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1459461644,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "7e0494d6c81ee22b24e815f53116cdd143ce2ec4e34bacb7ee5886807f2ac5b0",
    "action": "sent",
    "amount": 12600,
    "fees": 10789,
    "time": 1459468071,
    "addressTo": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
    "confirmations": 90142,
    "outputs": [{
      "amount": 12600,
      "address": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
      "message": null
    }],
    "proposalId": "01459460699253fa66c2cd-4fbb-497d-9086-c45c312f4e24",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1459460701,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "b41721474cbc224bbe0f8cc70f3a70219b630962d89e4c369b2009ceda412cb0",
    "action": "sent",
    "amount": 12400,
    "fees": 10789,
    "time": 1459467803,
    "addressTo": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
    "confirmations": 90144,
    "outputs": [{
      "amount": 12400,
      "address": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
      "message": null
    }],
    "proposalId": "01459460605840904d9d5a-ea90-42e5-b147-b9ae65b30f0f",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1459460608,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "90c224336162b6391db5be322c1908e7d9d9026545d268d216b3cda664492a2d",
    "action": "sent",
    "amount": 12300,
    "fees": 10789,
    "time": 1459467133,
    "addressTo": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
    "confirmations": 90159,
    "outputs": [{
      "amount": 12300,
      "address": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
      "message": null
    }],
    "proposalId": "014594599176299186cfc9-46b5-4786-bf74-bcdfbe64851d",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1459459920,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "ea33f2e62e940c32e883916ed20ee49421228f8af5f50b9674c1be6517d46387",
    "action": "sent",
    "amount": 13200,
    "fees": 10789,
    "time": 1459466976,
    "addressTo": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
    "confirmations": 90137,
    "outputs": [{
      "amount": 13200,
      "address": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
      "message": null
    }],
    "proposalId": "01459461019978babbaa89-4af2-4c89-bc1c-c3111f4d96d1",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1459461022,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "6bc31aca5ac5d9a72bb6f12274c4dd34cbdcdf1150998faa3f6d2a848c9e25c6",
    "action": "sent",
    "amount": 13100,
    "fees": 10789,
    "time": 1459466976,
    "addressTo": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
    "confirmations": 90137,
    "outputs": [{
      "amount": 13100,
      "address": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
      "message": null
    }],
    "proposalId": "0145946093051133caeeb7-55a7-4c2b-a2c4-cd175c0ec9c3",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1459460933,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "ff167d85c34920255af023d7202545cab1b731d86c6704c6aafa03f5e46155c1",
    "action": "sent",
    "amount": 12700,
    "fees": 10789,
    "time": 1459464433,
    "addressTo": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
    "confirmations": 90175,
    "outputs": [{
      "amount": 12700,
      "address": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
      "message": null
    }],
    "proposalId": "01459458885274a8c84629-1141-4dd2-8402-4d8e4185d796",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1459458889,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "82b8b6c0a1f8d0f212aafc5e6ca9a18376001d1895399fffeb94c3d996a7adf5",
    "action": "sent",
    "amount": 12900,
    "fees": 10789,
    "time": 1459464433,
    "addressTo": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
    "confirmations": 90175,
    "outputs": [{
      "amount": 12900,
      "address": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
      "message": null
    }],
    "proposalId": "014594589322742b7adc21-d181-4d8d-a4a9-ccf34a548d18",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1459458934,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "330a37ba9a886b9548181fdaa31b2327338e4363947471a6af33b219c085b7f5",
    "action": "sent",
    "amount": 12200,
    "fees": 10789,
    "time": 1459462699,
    "addressTo": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
    "confirmations": 90228,
    "outputs": [{
      "amount": 12200,
      "address": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
      "message": null
    }],
    "proposalId": "014594552277499d2e2dc5-674f-466e-af41-b89930d92c4a",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1459455565,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "e8105445a8bfb885588f01d79f2f228759f5c5503ff5feb254f42c2f185a262c",
    "action": "sent",
    "amount": 12100,
    "fees": 10789,
    "time": 1459461311,
    "addressTo": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
    "confirmations": 90247,
    "outputs": [{
      "amount": 12100,
      "address": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
      "message": null
    }],
    "proposalId": "01459454478687a5d6462a-5497-412b-80a7-21dfd8eb8a08",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1459454482,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "d58e4953d28538f7ad317a419e3ae44ea38d57947b637b5b7d7154b40e069e81",
    "action": "sent",
    "amount": 11600,
    "fees": 10789,
    "time": 1459460981,
    "addressTo": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
    "confirmations": 90251,
    "outputs": [{
      "amount": 11600,
      "address": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
      "message": null
    }],
    "proposalId": "01459454054176abfedc09-21a7-4fc3-bb7d-5f0a23493917",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1459454056,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "1e6cc8f69f5d6130196e5b253bf66e1c384e1eda3897812cef005a4792b3cf0f",
    "action": "sent",
    "amount": 11300,
    "fees": 10789,
    "time": 1459460319,
    "addressTo": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
    "confirmations": 90270,
    "outputs": [{
      "amount": 11300,
      "address": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
      "message": null
    }],
    "proposalId": "01459453123419006f582d-d3f4-4f6d-bb5e-ffb26a5bafe3",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1459453126,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "04087ee2e89f5fb80eb20f0b0c4363532967cde86052ac8a9425292e3c1054a7",
    "action": "sent",
    "amount": 11200,
    "fees": 10789,
    "time": 1459460054,
    "addressTo": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
    "confirmations": 90274,
    "outputs": [{
      "amount": 11200,
      "address": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
      "message": null
    }],
    "proposalId": "01459452926578b1accfed-410e-4a14-9640-392211500d98",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1459452930,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "35ef08935b01f97b48738478fe5dddac22c53619c6722fa19eee10102869a7bb",
    "action": "sent",
    "amount": 11100,
    "fees": 10789,
    "time": 1459460044,
    "addressTo": "mg8s31BLMXs6BX33XKRpxhno5Sk9PsA44s",
    "confirmations": 90276,
    "outputs": [{
      "amount": 11100,
      "address": "mg8s31BLMXs6BX33XKRpxhno5Sk9PsA44s",
      "message": null
    }],
    "proposalId": "014594528886574922a970-27ab-4499-8006-795a7e46117f",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1459452892,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "4e7ad490b24c02c2dae3d65e690e031bd634c3458bfd057b4a61223cec1c0e28",
    "action": "sent",
    "amount": 11500,
    "fees": 10789,
    "time": 1459459598,
    "addressTo": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
    "confirmations": 90265,
    "outputs": [{
      "amount": 11500,
      "address": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
      "message": null
    }],
    "proposalId": "01459453278803f5779d1a-7dd2-4da0-85ce-8b1254279a78",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1459453295,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "2164ad58166f9d6a6a3d9a32bb68bc6942fff5c44e38a4a399d84530f27ef693",
    "action": "sent",
    "amount": 11400,
    "fees": 10789,
    "time": 1459459151,
    "addressTo": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
    "confirmations": 90268,
    "outputs": [{
      "amount": 11400,
      "address": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
      "message": null
    }],
    "proposalId": "0145945316225536ebe7e8-7542-44ec-a5a5-58070566768c",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1459453165,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "7bbf03f6cdb749cd15986d0752e94362a0f127f34988282a3335e63fd7b6d610",
    "action": "sent",
    "amount": 10900,
    "fees": 10789,
    "time": 1459451596,
    "addressTo": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
    "confirmations": 90402,
    "outputs": [{
      "amount": 10900,
      "address": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
      "message": null
    }],
    "proposalId": "014594453156721f0d836d-ff16-412f-9e09-0d6be57df9fe",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1459445318,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "e1c084f3fb30f935423391844d08c3234d9d2cf3df7a8a7b8eae22e19a0a53b2",
    "action": "sent",
    "amount": 10600,
    "fees": 10789,
    "time": 1459445798,
    "addressTo": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
    "confirmations": 90696,
    "outputs": [{
      "amount": 10600,
      "address": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
      "message": null
    }],
    "proposalId": "014594385235427db69e99-4583-4d8c-bf5f-a2ecdf32a055",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1459438526,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "9e594ff0efd56bdc6a72e6abbd75664514fdea07c0a6cec2f817635646cff311",
    "action": "sent",
    "amount": 10700,
    "fees": 10789,
    "time": 1459445798,
    "addressTo": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
    "confirmations": 90696,
    "outputs": [{
      "amount": 10700,
      "address": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
      "message": null
    }],
    "proposalId": "01459438576264173becd3-58d4-43a6-ba59-8ed3f404cdb7",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1459438579,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "f2d474ac2f1e7eefda31ee10ac1d066c779f1ad0ee4d889b6bf40421e6ff2dad",
    "action": "sent",
    "amount": 10800,
    "fees": 10789,
    "time": 1459445515,
    "addressTo": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
    "confirmations": 90658,
    "outputs": [{
      "amount": 10800,
      "address": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
      "message": null
    }],
    "proposalId": "014594394521198be1ffc9-534e-4a97-8686-fdd2d1e3a74e",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1459439454,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "cb2630e133815fb3ef657281bc473bb37d47ad74a7505a2c98b4548e5e65240d",
    "action": "sent",
    "amount": 10200,
    "fees": 10789,
    "time": 1459439023,
    "addressTo": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
    "confirmations": 90959,
    "outputs": [{
      "amount": 10200,
      "address": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
      "message": null
    }],
    "proposalId": "0145943285575853dc8430-4d1e-457f-a948-237b07993838",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1459432869,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "870cd74f04fa4336beb4e16c9cc98e5a685d96169c06ad38f3c878f41332053c",
    "action": "sent",
    "amount": 10100,
    "fees": 10789,
    "time": 1459439023,
    "addressTo": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
    "confirmations": 90959,
    "outputs": [{
      "amount": 10100,
      "address": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
      "message": null
    }],
    "proposalId": "01459432810452854a20c8-885c-4f35-8580-ee529c969909",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1459432818,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "c2e57b795230da721a0a6d2a33df989be40cf461f4561da5f905f1d6c1ed853e",
    "action": "sent",
    "amount": 10000,
    "fees": 10789,
    "time": 1459438900,
    "addressTo": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
    "confirmations": 90962,
    "outputs": [{
      "amount": 10000,
      "address": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
      "message": null
    }],
    "proposalId": "01459432716856b5a9a977-4de9-4beb-b01b-f68ee362efb4",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1459432720,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "45a9795ae068b785d6f6e900e03664e0487149fbfd8900eb53781e93f7316f7c",
    "action": "sent",
    "amount": 10000,
    "fees": 15770,
    "time": 1459438190,
    "addressTo": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
    "confirmations": 90998,
    "outputs": [{
      "amount": 10000,
      "address": "mqxPAtiNaoL4ERWN9JfVisfuGpFwACVcJ3",
      "message": null
    }],
    "proposalId": "01459432205652d2c3014b-5a9c-4de3-af24-8f44cbbb4df5",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1459432208,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "c2b3cb6b3637c91cca729edcaaeb4485b4a1c5346f3af556d33379c4b4cb19ac",
    "action": "sent",
    "amount": 12000,
    "fees": 5388,
    "time": 1459259755,
    "addressTo": "moQ14yiyqWqzahmRZ6KL7GtKyuzqeBT4M9",
    "confirmations": 96314,
    "outputs": [{
      "amount": 12000,
      "address": "moQ14yiyqWqzahmRZ6KL7GtKyuzqeBT4M9",
      "message": "{\"iv\":\"XnN6hBRjL4T4n3xpBZ4ZFw==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"eZKrLwXM5sp3RcFXYRbeXTCq2uMJcwAfRVnrSEIkf/msfDDqZu+jNdfznCKuDSYosfA=\"}"
    }],
    "proposalId": "014592594354211a81a4ff-b6b4-4247-b71e-1c8bfc1ea508",
    "creatorName": "me",
    "message": "{\"iv\":\"iItl0hV7SXM7quiCBALfog==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"NSh38LEAU9+kkfbYuy8bLFMbVbVv5Z24wuogEwpEHriD1uv6Rf3L15WRHXxBYqvuqys=\"}",
    "actions": [{
      "createdOn": 1459259441,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "3e976b19e87be23e013cdb622b98efaa4b2052e6f5c707d0e3457aa58cd523ab",
    "action": "received",
    "amount": 10000,
    "fees": 10000,
    "time": 1459259163,
    "confirmations": 96315,
    "outputs": [{
      "amount": 10000,
      "address": "my4e3acTkzvCJgsvyFpggqUb7rfuyG8iEc"
    }]
  }],
  // txhistory 1-1, 2
  '2c4af081dae765e35850747e06643e09d93ac9516e05a929375988b198d69f26': [{
    "txid": "a671aa78b56b7979c916a19c82cdf8cfffd97876484a31a4832fa17c72148542",
    "action": "received",
    "amount": 100000,
    "fees": 10000,
    "time": 1459257914,
    "confirmations": 96317,
    "outputs": [{
      "amount": 100000,
      "address": "my4e3acTkzvCJgsvyFpggqUb7rfuyG8iEc"
    }]
  }, {
    "txid": "5dd2c1b857e4992b6c877d9eb741b1f6fa4fc01516220737c0172cd37a26a306",
    "action": "sent",
    "amount": 100000,
    "fees": 2441,
    "time": 1458778160,
    "addressTo": "mhGs6cXT3wVKcDkfKPB8shjeAEXZEJKoDm",
    "confirmations": 120825,
    "outputs": [{
      "amount": 100000,
      "address": "mhGs6cXT3wVKcDkfKPB8shjeAEXZEJKoDm",
      "message": "{\"iv\":\"MdtPv8JanU52VK64K1LAyg==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"09iDO3M5gtJ+QPQTkG+l/8bP3F3CjvNGur5a/XmFKU5gBNjVVM4hdFnabmo9ChfhsTc=\"}"
    }],
    "proposalId": "01458774041083fede594e-eb57-42fb-89c0-3cbe63f87677",
    "creatorName": "me",
    "message": "{\"iv\":\"krU7VnmA+HAFzatN2dIHzg==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"IALcaPyp3dT/XsVeeoYlg2ShBkSEJf74LiNA+wSme975rFMbT2KmqJ2nbisoH9Pslqw=\"}",
    "actions": [{
      "createdOn": 1458774043,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "4c10410d2e548fb0b3e0b8b003aa989dce3a217b0b4f5a02b7eaf1eec0c0e976",
    "action": "sent",
    "amount": 10000,
    "fees": 2442,
    "time": 1458676045,
    "addressTo": "mnBXMU5MdHcBNPcptXJPWt8DcA6tBsBxaY",
    "confirmations": 121208,
    "outputs": [{
      "amount": 10000,
      "address": "mnBXMU5MdHcBNPcptXJPWt8DcA6tBsBxaY",
      "message": "{\"iv\":\"MsqqMibQPn795kUzd9hbIQ==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"22Y3mhl8jNZuYYap+SyknpTtjZyLPvwWxrAsNOUVCCjYFW2FyHkikMEjdOHrOo1gGeQ=\"}"
    }],
    "proposalId": "01458670772449704cc37a-6cd1-48e9-b149-33a4f5c8969b",
    "creatorName": "me",
    "message": "{\"iv\":\"J+M9Yq5w/qvE2QPQj7bBAA==\",\"v\":1,\"iter\":1,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"ct\":\"wmh2Nc0WR01A7c2F4RX4pTNKyutqNS7ycmzTPR/1qFoa9PxQNxZ0Ayk6bQ7/1OF+CxQ=\"}",
    "actions": [{
      "createdOn": 1458670775,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "0bc904d9a5d0302c1e96e83934c5f7bf5e393edf0775357f2d70e8503049ed77",
    "action": "received",
    "amount": 10000,
    "fees": 2442,
    "time": 1458673216,
    "confirmations": 121222,
    "outputs": [{
      "amount": 10000,
      "address": "mgT191EgiJ28ZCH5sWNi8CR92yNDeJsK7j"
    }]
  }, {
    "txid": "337996785b7feb3fe1be110be24feb285fbef1f1bc3fd55a1d9982dbcc5b8369",
    "action": "received",
    "amount": 332200,
    "fees": 2580,
    "time": 1457100611,
    "confirmations": 125404,
    "outputs": [{
      "amount": 332200,
      "address": "mtADmkGAef8PWbLr6WVw7hPaAWw2D3ZLYH"
    }]
  }, {
    "txid": "b28d2339decd0bff7eae9c8ad3a8b2bb6b699db89984888b07902c51e7e1f9a6",
    "action": "received",
    "amount": 55600,
    "fees": 19604,
    "time": 1457099388,
    "confirmations": 125406,
    "outputs": [{
      "amount": 55600,
      "address": "mtADmkGAef8PWbLr6WVw7hPaAWw2D3ZLYH"
    }]
  }, {
    "txid": "a34e25c55cdb5baa413de7087cfe6d0c122167cfe943be91a5e0a666897270de",
    "action": "received",
    "amount": 500000,
    "fees": 19590,
    "time": 1457096927,
    "confirmations": 125411,
    "outputs": [{
      "amount": 500000,
      "address": "mtADmkGAef8PWbLr6WVw7hPaAWw2D3ZLYH"
    }]
  }, {
    "txid": "b2d350f67358f1eff5f843eb6632f9f0ed4e3150c03e1f90567046143c6f4e77",
    "action": "sent",
    "amount": 95000,
    "fees": 9275,
    "time": 1455826850,
    "addressTo": "mgQVwWAddjvKbqQuHbpffhnyhoxiD6Dh58",
    "confirmations": 132609,
    "outputs": [{
      "amount": 95000,
      "address": "mgQVwWAddjvKbqQuHbpffhnyhoxiD6Dh58",
      "message": null
    }],
    "proposalId": "0145582679356996ffe38e-cd23-4b0e-b069-afe2e4d0c0d0",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1455826796,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "f491c4f9fc7d1adb37a2afe9e99ed6024ec61423e456701e1c162d0339486252",
    "action": "sent",
    "amount": 10000,
    "fees": 5725,
    "time": 1455826577,
    "addressTo": "mpbPujs9h2U8esvzF6GUiQQnaCFtXm8Hfc",
    "confirmations": 132614,
    "outputs": [{
      "amount": 10000,
      "address": "mpbPujs9h2U8esvzF6GUiQQnaCFtXm8Hfc",
      "message": null
    }],
    "proposalId": "014558265370960569d8b7-e9ef-4100-9bd5-41cd992927f1",
    "creatorName": "me",
    "message": null,
    "actions": [{
      "createdOn": 1455826541,
      "type": "accept",
      "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
      "copayerName": "me",
      "comment": null
    }],
    "customData": null
  }, {
    "txid": "4a0b79d685368ca747ebc735cf506ea9eedb3da4908d900e630351b5717db91e",
    "action": "received",
    "amount": 20000,
    "fees": 5160,
    "time": 1455752018,
    "confirmations": 135802,
    "outputs": [{
      "amount": 20000,
      "address": "mk3kXbgkmFEkuo71HKRcCXM1szbA4QN3cn"
    }]
  }, {
    "txid": "b147d0c2714bd1f86203d0cfe5623ed0781806bf914b9439afb8de4ad367ebc7",
    "action": "received",
    "amount": 100000,
    "fees": 6929,
    "time": 1455221488,
    "confirmations": 163212,
    "outputs": [{
      "amount": 100000,
      "address": "mk3kXbgkmFEkuo71HKRcCXM1szbA4QN3cn"
    }]
  }],
  // put preferences
  'f25ae222016306f9142ff0ab91151f77045183470df822d283808d077b0bb4c1': {},
  // get preferences
  '6ad6c7b8372131a41f4ca547f2119e7d53d2adfd57728f1d5a776db7ebfddb5f': {
    "version": "1.0.0",
    "createdOn": 1463598797,
    "walletId": "66d3afc9-7d76-4b25-850e-aa62fcc53a7d",
    "copayerId": "5c474b568bde8cd39efe069cd6aff2a80ab1cb18d3b9ae81f8225286f94856bc",
    "email": null,
    "language": "en",
    "unit": "bit"
  },
};
