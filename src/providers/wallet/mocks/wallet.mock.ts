import { TransactionProposal } from '../wallet';
import { PendingTxpMock } from './pending-txp.mock';

export interface StatusMock {
  balance: {
    totalAmount: number;
    lockedAmount: number;
    totalConfirmedAmount: number;
    lockedConfirmedAmount: number;
    availableAmount: number;
    availableConfirmedAmount: number;
    byAddress: Array<{
      address: string;
      path: string;
      amount: number;
    }>;
  };
  isValid: boolean;
  pendingTxps: PendingTxpMock[];
  wallet: {
    singleAddress: boolean;
  };

  statusUpdatedOn?: number;
  email?: string;
  balanceByAddress?;
  totalBalanceSat?: number;
  lockedBalanceSat?: number;
  availableBalanceSat?: number;
  totalBytesToSendMax?: number;
  pendingAmount?: number;
  spendableAmount?: number;
  unitToSatoshi?: number;
  satToUnit?: number;
  totalBalanceStr?: string;
  lockedBalanceStr?: string;
  availableBalanceStr?: string;
  spendableBalanceStr?: string;
  pendingBalanceStr?: string;
  alternativeName?: string;
  alternativeIsoCode?: string;
}

export const sendMaxInfoMock = {
  amount: 300000,
  amountAboveMaxSize: 0,
  amountBelowFee: 780000,
  fee: 480000,
  feePerKb: 100000,
  inputs: [
    {
      txid: 'txid1',
      address: 'address1',
      satoshis: 100000
    },
    {
      txid: 'txid2',
      address: 'address2',
      satoshis: 200000
    }
  ],
  size: 4869,
  utxosAboveMaxSize: 0,
  utxosBelowFee: 73
};

export const txsFromLocal = [
  {
    amount: 10000,
    fees: 99,
    txid: 'txid1',
    confirmations: 50,
    recent: false,
    time: Date.now()
  },
  {
    amount: 10000,
    fees: 99,
    txid: 'txid2',
    confirmations: 80,
    recent: false,
    time: Date.now()
  }
];

export const statusMock: StatusMock = {
  balance: {
    totalAmount: 500000000,
    lockedAmount: 100000000,
    totalConfirmedAmount: 500000000,
    lockedConfirmedAmount: 100000000,
    availableAmount: 400000000,
    availableConfirmedAmount: 400000000,
    byAddress: [
      {
        address: 'address1',
        path: 'm/1/219',
        amount: 2000000
      },
      {
        address: 'address2',
        path: 'm/1/26',
        amount: 7000000
      }
    ]
  },
  isValid: true,
  pendingTxps: [],
  wallet: {
    singleAddress: false
  }
};

export class WalletMock {
  cachedStatus: StatusMock;
  copayerId: string;
  completeHistory?;
  credentials: {
    addressType: string;
    scanStatus: string;
    walletId: string;
    keyId: string;
    walletName: string;
    network?: string;
    publicKeyRing?: any[];
    coin: string;
  };
  coin: string;
  id: string;
  m: number;
  n: number;
  needsBackup?: boolean;
  network: string;
  notAuthorized?: boolean;
  pendingTxps: PendingTxpMock[];
  scanning?: boolean;
  status: StatusMock;
  totalBalanceSat: string;
  completeHistoryIsValid: boolean;

  constructor() {
    this.cachedStatus = statusMock;
    this.credentials = {
      addressType: 'P2PKH',
      scanStatus: null,
      walletId: 'walletid1',
      walletName: 'Test wallet',
      keyId: 'keyId1',
      coin: 'btc'
    };
    this.coin = 'btc';
    this.id = 'walletid1';
    this.needsBackup = false;
    this.network = 'livenet';
    this.pendingTxps = [];
    this.scanning = null;
    this.status = statusMock;
    this.totalBalanceSat = '0.01 BTC';
  }
  isComplete() {
    return true;
  }
  getStatus(_opts, cb) {
    return cb(null, this.status);
  }
  getRootPath() {
    return 'path';
  }
  setNotificationsInterval(_x) {}

  getTxNote(_opts, cb) {
    return cb(null, 'Note');
  }
  getTxNotes(_opts, cb) {
    const notes = [
      {
        txid: 'txid1'
      },
      {
        txid: 'txid2'
      }
    ];
    return cb(null, notes);
  }
  editTxNote(_opts, cb) {
    return cb(null, 'NoteEdited');
  }
  getTx(_txpid, cb) {
    const tx = {
      txid: 'txid'
    };
    return cb(null, tx);
  }
  getTxHistory(_opts, cb) {
    const txsFromLocal = [
      {
        amount: 10000,
        fees: 99,
        txid: 'txid1',
        confirmations: 50,
        recent: false
      },
      {
        amount: 10000,
        fees: 99,
        txid: 'txid2',
        confirmations: 80,
        recent: false
      }
    ];
    return cb(null, txsFromLocal);
  }
  createTxProposal(_txp, cb) {
    const txp: TransactionProposal = {
      coin: 'btc',
      amount: 1000,
      from: 'address1',
      toAddress: 'address1',
      outputs: [
        {
          toAddress: 'address1',
          amount: 1000,
          message: 'msg1',
          data: 'data'
        }
      ],
      inputs: null,
      fee: 99,
      message: 'message1',
      payProUrl: null,
      excludeUnconfirmedUtxos: false,
      feePerKb: 100,
      feeLevel: 'normal',
      dryRun: false
    };
    return cb(null, txp);
  }
  publishTxProposal(_opts, cb) {
    const txpPublished = _opts.txp;
    return cb(null, txpPublished);
  }
  pushSignatures(_txp, _signatures, cb) {
    const signedTxp = _txp;
    return cb(null, signedTxp);
  }
  broadcastRawTx(_txp, cb) {
    const broadcastedTxp = _txp;
    return cb(null, broadcastedTxp);
  }
  broadcastTxProposal(_txp, cb) {
    const broadcastedTxp = _txp;
    const memo = 'memo1';
    return cb(null, broadcastedTxp, memo);
  }
  rejectTxProposal(_txp, _opt, cb) {
    const rejectedTxp = {
      txid: 'txid1'
    };
    return cb(null, rejectedTxp);
  }
  removeTxProposal(_txp, cb) {
    return cb(null);
  }
  savePreferences(_pref, cb) {
    return cb(null);
  }
  recreateWallet(cb) {
    return cb(null);
  }
  startScan(_opts, cb) {
    return cb(null);
  }
  getMainAddresses(_opts, cb) {
    const addresses = [
      {
        address: 'address1'
      },
      {
        address: 'address2'
      }
    ];
    return cb(null, addresses);
  }
  getBalance(_opts, cb) {
    const balance = {
      totalAmount: 1000
    };
    return cb(null, balance);
  }
  getUtxos(_opts, cb) {
    const utxos = [
      {
        satoshis: 1000
      },
      {
        satoshis: 2000
      },
      {
        satoshis: 3000
      },
      {
        satoshis: 9000000
      }
    ];
    return cb(null, utxos);
  }
  getKeys(_pass) {
    const keysWithMnemonics = {
      mnemonic: 'mom mom mom mom mom mom mom mom mom mom mom mom',
      xPrivKey: 'xPrivKey1'
    };
    const keysWithoutMnemonics = {
      xPrivKey: 'xPrivKey1'
    };

    const keys =
      _pass == 'password1' ? keysWithMnemonics : keysWithoutMnemonics;
    return keys;
  }
  getSendMaxInfo(_opts, cb) {
    return cb(null, sendMaxInfoMock);
  }
  createAddress(_opts, cb) {
    const addr = {
      address: '1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69' // Use a valid address to get a resolved promise
    };
    return cb(null, addr);
  }
}
