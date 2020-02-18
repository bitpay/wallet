import { async, ComponentFixture } from '@angular/core/testing';
import { TestUtils } from '../../../../test';

import { BitPayCardProvider } from '../../../../providers/bitpay-card/bitpay-card';
import { CurrencyProvider } from '../../../../providers/currency/currency';
import { OnGoingProcessProvider } from '../../../../providers/on-going-process/on-going-process';
import { PayproProvider } from '../../../../providers/paypro/paypro';
import { TxFormatProvider } from '../../../../providers/tx-format/tx-format';
import { WalletProvider } from '../../../../providers/wallet/wallet';

import { BitPayCardTopUpPage } from './bitpay-card-topup';

fdescribe('BitPayCardPurchasePage', () => {
  let fixture: ComponentFixture<BitPayCardTopUpPage>;
  let instance: BitPayCardTopUpPage;
  let testBed;
  let payproProvider;
  let currencyProvider;
  let bitPayCardProvider;
  let onGoingProcessProvider;
  let txFormatProvider;
  let walletProvider;

  var walletSpyCreateTx;

  beforeEach(async(() => {
    TestUtils.configurePageTestingModule([BitPayCardTopUpPage]).then(
      testEnv => {
        fixture = testEnv.fixture;
        instance = testEnv.instance;
        testBed = testEnv.testBed;

        payproProvider = testBed.get(PayproProvider);
        currencyProvider = testBed.get(CurrencyProvider);
        bitPayCardProvider = testBed.get(BitPayCardProvider);
        onGoingProcessProvider = testBed.get(OnGoingProcessProvider);
        txFormatProvider = testBed.get(TxFormatProvider);
        walletProvider = testBed.get(WalletProvider);
        walletSpyCreateTx = spyOn(walletProvider, 'createTx').and.callThrough();
        fixture.detectChanges();
      }
    );
  }));

  afterEach(() => {
    fixture.destroy();
  });

  var currencies = ['xrp', 'btc', 'eth', 'bch', 'usdc'];

  var payproCurrencyInvoices = {
    xrp: {
      url: 'https://test.bitpay.com/invoice?id=LQiQz1oti8k98h1csWCkJ',
      status: 'new',
      price: 1,
      currency: 'USD',
      invoiceTime: 1580928152576,
      expirationTime: 1580929052576,
      currentTime: 1580928201137,
      id: 'LQiQz1oti8k98h1csWCkJ',
      lowFeeDetected: false,
      amountPaid: 0,
      displayAmountPaid: '0',
      exceptionStatus: false,
      refundAddressRequestPending: false,
      buyerProvidedEmail: 'bsnowden@bitpay.com',
      buyerProvidedInfo: {
        selectedWallet: 'genericPayPro',
        selectedTransactionCurrency: 'XRP',
        emailAddress: 'bsnowden@bitpay.com'
      },
      paymentSubtotals: {
        BTC: 10300,
        BCH: 231900,
        ETH: 4915000000000000,
        GUSD: 100,
        PAX: 1000000000000000000,
        USDC: 1000000,
        XRP: 3602305
      },
      paymentTotals: {
        BTC: 10400,
        BCH: 231900,
        ETH: 4915000000000000,
        GUSD: 100,
        PAX: 1000000000000000000,
        USDC: 1000000,
        XRP: 3602305
      },
      paymentDisplayTotals: {
        BTC: '0.000104',
        BCH: '0.002319',
        ETH: '0.004915',
        GUSD: '1.00',
        PAX: '1.00',
        USDC: '1.00',
        XRP: '3.602305'
      },
      paymentDisplaySubTotals: {
        BTC: '0.000103',
        BCH: '0.002319',
        ETH: '0.004915',
        GUSD: '1.00',
        PAX: '1.00',
        USDC: '1.00',
        XRP: '3.602305'
      },
      exchangeRates: {
        BTC: {
          USD: 9661.92,
          BCH: 22.396662030598055,
          ETH: 47.48105558012679,
          GUSD: 9661.92,
          PAX: 9661.92,
          USDC: 9661.92,
          XRP: 34778.87765019258
        },
        BCH: {
          USD: 431.30000000000007,
          BTC: 0.04463911454543761,
          ETH: 2.1195144724556494,
          GUSD: 431.30000000000007,
          PAX: 431.30000000000007,
          USDC: 431.30000000000007,
          XRP: 1552.499910010439
        },
        ETH: {
          USD: 203.46000000000004,
          BTC: 0.021057904580140823,
          BCH: 0.47162726008344935,
          GUSD: 203.46000000000004,
          PAX: 203.46000000000004,
          USDC: 203.46000000000004,
          XRP: 732.371044958785
        },
        GUSD: {
          USD: 1,
          BTC: 0.00010349899036734895,
          BCH: 0.0023180343069077423,
          ETH: 0.004914246400314512,
          PAX: 1,
          USDC: 1,
          XRP: 3.5995824484359815
        },
        PAX: {
          USD: 1,
          BTC: 0.00010349899036734895,
          BCH: 0.0023180343069077423,
          ETH: 0.004914246400314512,
          GUSD: 1,
          USDC: 1,
          XRP: 3.5995824484359815
        },
        USDC: {
          USD: 1,
          BTC: 0.00010349899036734895,
          BCH: 0.0023180343069077423,
          ETH: 0.004914246400314512,
          GUSD: 1,
          PAX: 1,
          XRP: 3.5995824484359815
        },
        XRP: {
          USD: 0.2776,
          BTC: 0.000028731319725976075,
          BCH: 0.0006434863235975893,
          ETH: 0.0013641948007273087,
          GUSD: 0.2776,
          PAX: 0.2776,
          USDC: 0.2776
        }
      },
      supportedTransactionCurrencies: {
        BTC: {
          enabled: true
        },
        BCH: {
          enabled: true
        },
        ETH: {
          enabled: true
        },
        GUSD: {
          enabled: true
        },
        PAX: {
          enabled: true
        },
        USDC: {
          enabled: true
        },
        XRP: {
          enabled: true
        }
      },
      minerFees: {
        BTC: {
          satoshisPerByte: 1,
          totalFee: 100
        },
        BCH: {
          satoshisPerByte: 0,
          totalFee: 0
        },
        ETH: {
          satoshisPerByte: 0,
          totalFee: 0
        },
        GUSD: {
          satoshisPerByte: 0,
          totalFee: 0
        },
        PAX: {
          satoshisPerByte: 0,
          totalFee: 0
        },
        USDC: {
          satoshisPerByte: 0,
          totalFee: 0
        },
        XRP: {
          satoshisPerByte: 0,
          totalFee: 0
        }
      },
      jsonPayProRequired: false,
      paymentCodes: {
        BTC: {
          BIP72b: 'bitcoin:?r=https://test.bitpay.com/i/LQiQz1oti8k98h1csWCkJ',
          BIP73: 'https://test.bitpay.com/i/LQiQz1oti8k98h1csWCkJ',
          BIP21: 'bitcoin:n4nHxgZ7TsGNC2RFDd5cA8zWzYPQNQnxGQ?amount=0.000104',
          ADDRESS: 'n4nHxgZ7TsGNC2RFDd5cA8zWzYPQNQnxGQ'
        },
        BCH: {
          BIP72b:
            'bitcoincash:?r=https://test.bitpay.com/i/LQiQz1oti8k98h1csWCkJ',
          BIP73: 'https://test.bitpay.com/i/LQiQz1oti8k98h1csWCkJ',
          BIP21:
            'bitcoincash:qrlnrrrlreqvm54rcxenp5r3zynkputkpseg64kwt6?amount=0.002319',
          ADDRESS: 'qrlnrrrlreqvm54rcxenp5r3zynkputkpseg64kwt6'
        },
        ETH: {
          EIP681: 'ethereum:?r=https://test.bitpay.com/i/LQiQz1oti8k98h1csWCkJ'
        },
        GUSD: {
          EIP681b: 'ethereum:?r=https://test.bitpay.com/i/LQiQz1oti8k98h1csWCkJ'
        },
        PAX: {
          EIP681b: 'ethereum:?r=https://test.bitpay.com/i/LQiQz1oti8k98h1csWCkJ'
        },
        USDC: {
          EIP681b: 'ethereum:?r=https://test.bitpay.com/i/LQiQz1oti8k98h1csWCkJ'
        },
        XRP: {
          BIP72b: 'ripple:?r=https://test.bitpay.com/i/LQiQz1oti8k98h1csWCkJ',
          BIP73: 'https://test.bitpay.com/i/LQiQz1oti8k98h1csWCkJ',
          RIP681: 'https://test.bitpay.com/i/LQiQz1oti8k98h1csWCkJ',
          BIP21:
            'ripple:rhWuk1hvRBVwyVSexe6aXuDri72ZeDWBro?amount=3.602305?tag=1023578355',
          ADDRESS: 'rhWuk1hvRBVwyVSexe6aXuDri72ZeDWBro',
          INVOICEID:
            '0BC1DFD423C0FABFC9935C9A8E3EA894C925AD25F5274EE81820A80B866F9954',
          DESTINATIONTAG: 1023578355
        }
      },
      token:
        '767cdhmwtn7XgW1QrSkuEwmpjtmbcHMuZQbbkbJzvC2QKAVJS1gSkdeFecvqzTDfYX'
    },
    btc: {
      url: 'https://test.bitpay.com/invoice?id=CkbTEM1JrrmC8LTD7WUUQu',
      status: 'new',
      price: 1,
      currency: 'USD',
      invoiceTime: 1581540894486,
      expirationTime: 1581541794486,
      currentTime: 1581541031072,
      id: 'CkbTEM1JrrmC8LTD7WUUQu',
      lowFeeDetected: false,
      amountPaid: 0,
      displayAmountPaid: '0',
      exceptionStatus: false,
      refundAddressRequestPending: false,
      buyerProvidedEmail: 'bsnowden@bitpay.com',
      buyerProvidedInfo: {
        selectedWallet: 'bitpay',
        selectedTransactionCurrency: 'BTC',
        emailAddress: 'bsnowden@bitpay.com'
      },
      paymentSubtotals: {
        BTC: 9600,
        BCH: 209600,
        ETH: 3695000000000000,
        GUSD: 100,
        PAX: 1000000000000000000,
        USDC: 1000000,
        XRP: 3305676
      },
      paymentTotals: {
        BTC: 9700,
        BCH: 209600,
        ETH: 3695000000000000,
        GUSD: 100,
        PAX: 1000000000000000000,
        USDC: 1000000,
        XRP: 3305676
      },
      paymentDisplayTotals: {
        BTC: '0.000097',
        BCH: '0.002096',
        ETH: '0.003695',
        GUSD: '1.00',
        PAX: '1.00',
        USDC: '1.00',
        XRP: '3.305676'
      },
      paymentDisplaySubTotals: {
        BTC: '0.000096',
        BCH: '0.002096',
        ETH: '0.003695',
        GUSD: '1.00',
        PAX: '1.00',
        USDC: '1.00',
        XRP: '3.305676'
      },
      exchangeRates: {
        BTC: {
          USD: 10391.8,
          BCH: 21.767490573942183,
          ETH: 38.38153277931671,
          GUSD: 10391.8,
          PAX: 10391.8,
          USDC: 10391.8,
          XRP: 34350.786724844635
        },
        BCH: {
          USD: 477.1,
          BTC: 0.04590589820071203,
          ETH: 1.7621421975992615,
          GUSD: 477.1,
          PAX: 477.1,
          USDC: 477.1,
          XRP: 1577.085812508264
        },
        ETH: {
          USD: 270.63,
          BTC: 0.026039642066775715,
          BCH: 0.5668831168831168,
          GUSD: 270.63,
          PAX: 270.63,
          USDC: 270.63,
          XRP: 894.5854819516064
        },
        GUSD: {
          USD: 1,
          BTC: 0.00009621860867891851,
          BCH: 0.0020946795140343527,
          ETH: 0.0036934441366574334,
          PAX: 1,
          USDC: 1,
          XRP: 3.3055665741108022
        },
        PAX: {
          USD: 1,
          BTC: 0.00009621860867891851,
          BCH: 0.0020946795140343527,
          ETH: 0.0036934441366574334,
          GUSD: 1,
          USDC: 1,
          XRP: 3.3055665741108022
        },
        USDC: {
          USD: 1,
          BTC: 0.00009621860867891851,
          BCH: 0.0020946795140343527,
          ETH: 0.0036934441366574334,
          GUSD: 1,
          PAX: 1,
          XRP: 3.3055665741108022
        },
        XRP: {
          USD: 0.30251,
          BTC: 0.00002910709131145964,
          BCH: 0.0006336614997905321,
          ETH: 0.0011173037857802402,
          GUSD: 0.30251,
          PAX: 0.30251,
          USDC: 0.30251
        }
      },
      supportedTransactionCurrencies: {
        BTC: {
          enabled: true
        },
        BCH: {
          enabled: true
        },
        ETH: {
          enabled: true
        },
        GUSD: {
          enabled: true
        },
        PAX: {
          enabled: true
        },
        USDC: {
          enabled: true
        },
        XRP: {
          enabled: true
        }
      },
      minerFees: {
        BTC: {
          satoshisPerByte: 1,
          totalFee: 100
        },
        BCH: {
          satoshisPerByte: 0,
          totalFee: 0
        },
        ETH: {
          satoshisPerByte: 0,
          totalFee: 0
        },
        GUSD: {
          satoshisPerByte: 0,
          totalFee: 0
        },
        PAX: {
          satoshisPerByte: 0,
          totalFee: 0
        },
        USDC: {
          satoshisPerByte: 0,
          totalFee: 0
        },
        XRP: {
          satoshisPerByte: 0,
          totalFee: 0
        }
      },
      jsonPayProRequired: false,
      paymentCodes: {
        BTC: {
          BIP72b: 'bitcoin:?r=https://test.bitpay.com/i/CkbTEM1JrrmC8LTD7WUUQu',
          BIP73: 'https://test.bitpay.com/i/CkbTEM1JrrmC8LTD7WUUQu',
          BIP21: 'bitcoin:mvTB2o5pCFiktvdVtEdxxXP4CsnRRtqK9U?amount=0.000097',
          ADDRESS: 'mvTB2o5pCFiktvdVtEdxxXP4CsnRRtqK9U'
        },
        BCH: {
          BIP72b:
            'bitcoincash:?r=https://test.bitpay.com/i/CkbTEM1JrrmC8LTD7WUUQu',
          BIP73: 'https://test.bitpay.com/i/CkbTEM1JrrmC8LTD7WUUQu',
          BIP21:
            'bitcoincash:qz3a9khtvuplwap5zudqqvuyc8tcyeghavl2u3x79k?amount=0.002096',
          ADDRESS: 'qz3a9khtvuplwap5zudqqvuyc8tcyeghavl2u3x79k'
        },
        ETH: {
          EIP681: 'ethereum:?r=https://test.bitpay.com/i/CkbTEM1JrrmC8LTD7WUUQu'
        },
        GUSD: {
          EIP681b:
            'ethereum:?r=https://test.bitpay.com/i/CkbTEM1JrrmC8LTD7WUUQu'
        },
        PAX: {
          EIP681b:
            'ethereum:?r=https://test.bitpay.com/i/CkbTEM1JrrmC8LTD7WUUQu'
        },
        USDC: {
          EIP681b:
            'ethereum:?r=https://test.bitpay.com/i/CkbTEM1JrrmC8LTD7WUUQu'
        },
        XRP: {
          BIP72b: 'ripple:?r=https://test.bitpay.com/i/CkbTEM1JrrmC8LTD7WUUQu',
          BIP73: 'https://test.bitpay.com/i/CkbTEM1JrrmC8LTD7WUUQu',
          RIP681: 'https://test.bitpay.com/i/CkbTEM1JrrmC8LTD7WUUQu',
          BIP21:
            'ripple:rhWuk1hvRBVwyVSexe6aXuDri72ZeDWBro?amount=3.305676?tag=870624532',
          ADDRESS: 'rhWuk1hvRBVwyVSexe6aXuDri72ZeDWBro',
          INVOICEID:
            'D836FC11D99B9C9468764C24F99B7413A4E86C63347ABDC9F01AC29A5F380A4B',
          DESTINATIONTAG: 870624532
        }
      },
      token:
        '767cdhmwtn7XgW1QrSkuEwkYp153tjGsY6MxpugpPTkdvyZPQQ53eZvmJmgSWF57of'
    },
    eth: {
      url: 'https://bitpay.com/invoice?id=2ZmsZ2Mykzwgxe5R1BGjg3',
      posData:
        'oxqP1dNFce6pdD9at5Te1eTZhSdWEUonYySyAxX1pi9VaoOyQyxTnM1dOYB5dE1K7OexQvumQkS30yrkp47nyGrZ92dRd2ZavKynMGwLgdQ=',
      status: 'new',
      price: 1,
      currency: 'USD',
      itemDesc: 'BitPay Debit Card Top-Up',
      orderId: 'ls@bitpay.com',
      invoiceTime: 1581456193818,
      expirationTime: 1581457093818,
      currentTime: 1581456306002,
      id: '2ZmsZ2Mykzwgxe5R1BGjg3',
      lowFeeDetected: false,
      amountPaid: 0,
      displayAmountPaid: '0',
      exceptionStatus: false,
      refundAddressRequestPending: false,
      buyerProvidedInfo: {
        selectedTransactionCurrency: 'ETH'
      },
      paymentSubtotals: {
        BTC: 9800,
        BCH: 215800,
        ETH: 4204000000000000,
        GUSD: 100,
        PAX: 1000000000000000000,
        USDC: 1000000,
        XRP: 3553429
      },
      paymentTotals: {
        BTC: 13900,
        BCH: 215800,
        ETH: 4204000000000000,
        GUSD: 100,
        PAX: 1000000000000000000,
        USDC: 1000000,
        XRP: 3553429
      },
      paymentDisplayTotals: {
        BTC: '0.000139',
        BCH: '0.002158',
        ETH: '0.004204',
        GUSD: '1.00',
        PAX: '1.00',
        USDC: '1.00',
        XRP: '3.553429'
      },
      paymentDisplaySubTotals: {
        BTC: '0.000098',
        BCH: '0.002158',
        ETH: '0.004204',
        GUSD: '1.00',
        PAX: '1.00',
        USDC: '1.00',
        XRP: '3.553429'
      },
      exchangeRates: {
        BTC: {
          USD: 10250.872000000001,
          BCH: 22.089540145670817,
          ETH: 43.06727165784388,
          GUSD: 10250.872000000001,
          PAX: 10250.872000000001,
          USDC: 10250.872000000001,
          XRP: 36376.408800567784
        },
        BCH: {
          USD: 463.48605,
          BTC: 0.04519165347927703,
          ETH: 1.9472567431308292,
          GUSD: 463.48605,
          PAX: 463.48605,
          USDC: 463.48605,
          XRP: 1644.7340312278213
        },
        ETH: {
          USD: 237.89099500000003,
          BTC: 0.023195277208193053,
          BCH: 0.5126298215747964,
          GUSD: 237.89099500000003,
          PAX: 237.89099500000003,
          USDC: 237.89099500000003,
          XRP: 844.1838005677786
        },
        GUSD: {
          USD: 1,
          BTC: 0.00009750380508599348,
          BCH: 0.0021548937637374476,
          ETH: 0.004201327619527771,
          PAX: 1,
          USDC: 1,
          XRP: 3.5486160397444997
        },
        PAX: {
          USD: 1,
          BTC: 0.00009750380508599348,
          BCH: 0.0021548937637374476,
          ETH: 0.004201327619527771,
          GUSD: 1,
          USDC: 1,
          XRP: 3.5486160397444997
        },
        USDC: {
          USD: 1,
          BTC: 0.00009750380508599348,
          BCH: 0.0021548937637374476,
          ETH: 0.004201327619527771,
          GUSD: 1,
          PAX: 1,
          XRP: 3.5486160397444997
        },
        XRP: {
          USD: 0.2814183,
          BTC: 0.000027439355070831643,
          BCH: 0.0006064265396715943,
          ETH: 0.001182330476430552,
          GUSD: 0.2814183,
          PAX: 0.2814183,
          USDC: 0.2814183
        }
      },
      supportedTransactionCurrencies: {
        BTC: {
          enabled: true
        },
        BCH: {
          enabled: true
        },
        ETH: {
          enabled: true
        },
        GUSD: {
          enabled: true
        },
        PAX: {
          enabled: true
        },
        USDC: {
          enabled: true
        },
        XRP: {
          enabled: true
        }
      },
      minerFees: {
        BTC: {
          satoshisPerByte: 28.224,
          totalFee: 4100
        },
        BCH: {
          satoshisPerByte: 0,
          totalFee: 0
        },
        ETH: {
          satoshisPerByte: 0,
          totalFee: 0
        },
        GUSD: {
          satoshisPerByte: 0,
          totalFee: 0
        },
        PAX: {
          satoshisPerByte: 0,
          totalFee: 0
        },
        USDC: {
          satoshisPerByte: 0,
          totalFee: 0
        },
        XRP: {
          satoshisPerByte: 0,
          totalFee: 0
        }
      },
      jsonPayProRequired: false,
      paymentCodes: {
        BTC: {
          BIP72b: 'bitcoin:?r=https://bitpay.com/i/2ZmsZ2Mykzwgxe5R1BGjg3',
          BIP73: 'https://bitpay.com/i/2ZmsZ2Mykzwgxe5R1BGjg3',
          BIP21: 'bitcoin:1esVnmvywn4kYpYuTHWL2wJ9WpCUCoUx7?amount=0.000139',
          ADDRESS: '1esVnmvywn4kYpYuTHWL2wJ9WpCUCoUx7'
        },
        BCH: {
          BIP72b: 'bitcoincash:?r=https://bitpay.com/i/2ZmsZ2Mykzwgxe5R1BGjg3',
          BIP73: 'https://bitpay.com/i/2ZmsZ2Mykzwgxe5R1BGjg3',
          BIP21:
            'bitcoincash:qqrjnzhku8e8ptex7dm0pexx68uwjap8hcyqr0d6yk?amount=0.002158',
          ADDRESS: 'qqrjnzhku8e8ptex7dm0pexx68uwjap8hcyqr0d6yk'
        },
        ETH: {
          EIP681: 'ethereum:?r=https://bitpay.com/i/2ZmsZ2Mykzwgxe5R1BGjg3'
        },
        GUSD: {
          EIP681b: 'ethereum:?r=https://bitpay.com/i/2ZmsZ2Mykzwgxe5R1BGjg3'
        },
        PAX: {
          EIP681b: 'ethereum:?r=https://bitpay.com/i/2ZmsZ2Mykzwgxe5R1BGjg3'
        },
        USDC: {
          EIP681b: 'ethereum:?r=https://bitpay.com/i/2ZmsZ2Mykzwgxe5R1BGjg3'
        },
        XRP: {
          BIP72b: 'ripple:?r=https://bitpay.com/i/2ZmsZ2Mykzwgxe5R1BGjg3',
          BIP73: 'https://bitpay.com/i/2ZmsZ2Mykzwgxe5R1BGjg3',
          RIP681: 'https://bitpay.com/i/2ZmsZ2Mykzwgxe5R1BGjg3',
          BIP21:
            'ripple:rKpTKoJSFbCoZkwydRv7NWTiBgNrdTXJ24?amount=3.553429?tag=2179428434',
          ADDRESS: 'rKpTKoJSFbCoZkwydRv7NWTiBgNrdTXJ24',
          INVOICEID:
            'F697A1D862CDD634C96695E8902C8AC987B8C5A6A4274052CC113CAFB6F05886',
          DESTINATIONTAG: 2179428434
        }
      },
      token: '5uqeA84nXkFyYDAk2yW3RHab3GCmyxE6E2dkuG9MJG1d7E1t456FPNuvJeroXFz5Q'
    },
    bch: {
      url: 'https://test.bitpay.com/invoice?id=NZ1b5o8gg5LGSK71Tt4ReY',
      status: 'new',
      price: 1,
      currency: 'USD',
      invoiceTime: 1581545776188,
      expirationTime: 1581546676188,
      currentTime: 1581546189800,
      id: 'NZ1b5o8gg5LGSK71Tt4ReY',
      lowFeeDetected: false,
      amountPaid: 0,
      displayAmountPaid: '0',
      exceptionStatus: false,
      refundAddressRequestPending: false,
      buyerProvidedEmail: 'bsnowden@bitpay.com',
      buyerProvidedInfo: {
        selectedWallet: 'bitpay',
        selectedTransactionCurrency: 'BCH',
        emailAddress: 'bsnowden@bitpay.com'
      },
      paymentSubtotals: {
        BTC: 9600,
        BCH: 211000,
        ETH: 3716000000000000,
        GUSD: 100,
        PAX: 1000000000000000000,
        USDC: 1000000,
        XRP: 3301638
      },
      paymentTotals: {
        BTC: 9700,
        BCH: 211000,
        ETH: 3716000000000000,
        GUSD: 100,
        PAX: 1000000000000000000,
        USDC: 1000000,
        XRP: 3301638
      },
      paymentDisplayTotals: {
        BTC: '0.000097',
        BCH: '0.002110',
        ETH: '0.003716',
        GUSD: '1.00',
        PAX: '1.00',
        USDC: '1.00',
        XRP: '3.301638'
      },
      paymentDisplaySubTotals: {
        BTC: '0.000096',
        BCH: '0.002110',
        ETH: '0.003716',
        GUSD: '1.00',
        PAX: '1.00',
        USDC: '1.00',
        XRP: '3.301638'
      },
      exchangeRates: {
        BTC: {
          USD: 10380,
          BCH: 21.884882985452244,
          ETH: 38.544374303750466,
          GUSD: 10380,
          PAX: 10380,
          USDC: 10380,
          XRP: 34252.90390707497
        },
        BCH: {
          USD: 474.00000000000006,
          BTC: 0.045664695891429775,
          ETH: 1.760118826587449,
          GUSD: 474.00000000000006,
          PAX: 474.00000000000006,
          USDC: 474.00000000000006,
          XRP: 1564.1499472016897
        },
        ETH: {
          USD: 269.14,
          BTC: 0.025928684076412255,
          BCH: 0.5674467636516971,
          GUSD: 269.14,
          PAX: 269.14,
          USDC: 269.14,
          XRP: 888.1335797254487
        },
        GUSD: {
          USD: 1,
          BTC: 0.00009633902086799531,
          BCH: 0.002108370229812355,
          ETH: 0.003713330857779428,
          PAX: 1,
          USDC: 1,
          XRP: 3.299894403379092
        },
        PAX: {
          USD: 1,
          BTC: 0.00009633902086799531,
          BCH: 0.002108370229812355,
          ETH: 0.003713330857779428,
          GUSD: 1,
          USDC: 1,
          XRP: 3.299894403379092
        },
        USDC: {
          USD: 1,
          BTC: 0.00009633902086799531,
          BCH: 0.002108370229812355,
          ETH: 0.003713330857779428,
          GUSD: 1,
          PAX: 1,
          XRP: 3.299894403379092
        },
        XRP: {
          USD: 0.30288,
          BTC: 0.000029179162640498416,
          BCH: 0.0006385831752055661,
          ETH: 0.0011246936502042333,
          GUSD: 0.30288,
          PAX: 0.30288,
          USDC: 0.30288
        }
      },
      supportedTransactionCurrencies: {
        BTC: {
          enabled: true
        },
        BCH: {
          enabled: true
        },
        ETH: {
          enabled: true
        },
        GUSD: {
          enabled: true
        },
        PAX: {
          enabled: true
        },
        USDC: {
          enabled: true
        },
        XRP: {
          enabled: true
        }
      },
      minerFees: {
        BTC: {
          satoshisPerByte: 1,
          totalFee: 100
        },
        BCH: {
          satoshisPerByte: 0,
          totalFee: 0
        },
        ETH: {
          satoshisPerByte: 0,
          totalFee: 0
        },
        GUSD: {
          satoshisPerByte: 0,
          totalFee: 0
        },
        PAX: {
          satoshisPerByte: 0,
          totalFee: 0
        },
        USDC: {
          satoshisPerByte: 0,
          totalFee: 0
        },
        XRP: {
          satoshisPerByte: 0,
          totalFee: 0
        }
      },
      jsonPayProRequired: false,
      paymentCodes: {
        BTC: {
          BIP72b: 'bitcoin:?r=https://test.bitpay.com/i/NZ1b5o8gg5LGSK71Tt4ReY',
          BIP73: 'https://test.bitpay.com/i/NZ1b5o8gg5LGSK71Tt4ReY',
          BIP21: 'bitcoin:n4VyWCjVFZw1ReX2AcPCTY9uX7sPLwu58z?amount=0.000097',
          ADDRESS: 'n4VyWCjVFZw1ReX2AcPCTY9uX7sPLwu58z'
        },
        BCH: {
          BIP72b:
            'bitcoincash:?r=https://test.bitpay.com/i/NZ1b5o8gg5LGSK71Tt4ReY',
          BIP73: 'https://test.bitpay.com/i/NZ1b5o8gg5LGSK71Tt4ReY',
          BIP21:
            'bitcoincash:qr7pklykurayu8p2hg5t9z3aykexdqdw3glhsl39pg?amount=0.00211',
          ADDRESS: 'qr7pklykurayu8p2hg5t9z3aykexdqdw3glhsl39pg'
        },
        ETH: {
          EIP681: 'ethereum:?r=https://test.bitpay.com/i/NZ1b5o8gg5LGSK71Tt4ReY'
        },
        GUSD: {
          EIP681b:
            'ethereum:?r=https://test.bitpay.com/i/NZ1b5o8gg5LGSK71Tt4ReY'
        },
        PAX: {
          EIP681b:
            'ethereum:?r=https://test.bitpay.com/i/NZ1b5o8gg5LGSK71Tt4ReY'
        },
        USDC: {
          EIP681b:
            'ethereum:?r=https://test.bitpay.com/i/NZ1b5o8gg5LGSK71Tt4ReY'
        },
        XRP: {
          BIP72b: 'ripple:?r=https://test.bitpay.com/i/NZ1b5o8gg5LGSK71Tt4ReY',
          BIP73: 'https://test.bitpay.com/i/NZ1b5o8gg5LGSK71Tt4ReY',
          RIP681: 'https://test.bitpay.com/i/NZ1b5o8gg5LGSK71Tt4ReY',
          BIP21:
            'ripple:rhWuk1hvRBVwyVSexe6aXuDri72ZeDWBro?amount=3.301638?tag=69851628',
          ADDRESS: 'rhWuk1hvRBVwyVSexe6aXuDri72ZeDWBro',
          INVOICEID:
            '43DB569985CAA736B0BDA2164CD1FE67F5C28618A3E5D710B34324AC44A8D55B',
          DESTINATIONTAG: 69851628
        }
      },
      token:
        '767cdhmwtn7XgW1QrSkuEwqfr4PbJLCauSLMWA7XJCsThq5gDD8jvoPuhUKCTZreRo'
    },
    usdc: {
      url: 'https://test.bitpay.com/invoice?id=WS2wmcyMcGJYzVNY9daD7w',
      status: 'new',
      price: 1,
      currency: 'USD',
      invoiceTime: 1582130408479,
      expirationTime: 1582131308479,
      currentTime: 1582130945167,
      id: 'WS2wmcyMcGJYzVNY9daD7w',
      lowFeeDetected: false,
      amountPaid: 0,
      displayAmountPaid: '0',
      exceptionStatus: false,
      refundAddressRequestPending: false,
      buyerProvidedEmail: 'bsnowden@bitpay.com',
      buyerProvidedInfo: {
        selectedWallet: 'bitpay',
        selectedTransactionCurrency: 'USD',
        emailAddress: 'bsnowden@bitpay.com'
      },
      paymentSubtotals: {
        BTC: 9800,
        BCH: 240700,
        ETH: 3540000000000000,
        GUSD: 100,
        PAX: 1000000000000000000,
        USDC: 1000000,
        XRP: 3362136
      },
      paymentTotals: {
        BTC: 9900,
        BCH: 240700,
        ETH: 3540000000000000,
        GUSD: 100,
        PAX: 1000000000000000000,
        USDC: 1000000,
        XRP: 3362136
      },
      paymentDisplayTotals: {
        BTC: '0.000099',
        BCH: '0.002407',
        ETH: '0.003540',
        GUSD: '1.00',
        PAX: '1.00',
        USDC: '1.00',
        XRP: '3.362136'
      },
      paymentDisplaySubTotals: {
        BTC: '0.000098',
        BCH: '0.002407',
        ETH: '0.003540',
        GUSD: '1.00',
        PAX: '1.00',
        USDC: '1.00',
        XRP: '3.362136'
      },
      exchangeRates: {
        BTC: {
          USD: 10180.01,
          BCH: 24.471177884615383,
          ETH: 36.03926080645732,
          GUSD: 10180.01,
          PAX: 10180.01,
          USDC: 10180.01,
          XRP: 34218.52100840336
        },
        BCH: {
          USD: 415.5,
          BTC: 0.04081524397790967,
          ETH: 1.4709526675399156,
          GUSD: 415.5,
          PAX: 415.5,
          USDC: 415.5,
          XRP: 1396.638655462185
        },
        ETH: {
          USD: 282.4599999999999,
          BTC: 0.027746507374248768,
          BCH: 0.6789903846153845,
          GUSD: 282.4599999999999,
          PAX: 282.4599999999999,
          USDC: 282.4599999999999,
          XRP: 949.4453781512603
        },
        GUSD: {
          USD: 1,
          BTC: 0.00009823163412252629,
          BCH: 0.0024038461538461535,
          ETH: 0.003540198959181506,
          PAX: 1,
          USDC: 1,
          XRP: 3.361344537815126
        },
        PAX: {
          USD: 1,
          BTC: 0.00009823163412252629,
          BCH: 0.0024038461538461535,
          ETH: 0.003540198959181506,
          GUSD: 1,
          USDC: 1,
          XRP: 3.361344537815126
        },
        USDC: {
          USD: 1,
          BTC: 0.00009823163412252629,
          BCH: 0.0024038461538461535,
          ETH: 0.003540198959181506,
          GUSD: 1,
          PAX: 1,
          XRP: 3.361344537815126
        },
        XRP: {
          USD: 0.29743,
          BTC: 0.000029217034937063,
          BCH: 0.0007149759615384616,
          ETH: 0.0010529613764293554,
          GUSD: 0.29743,
          PAX: 0.29743,
          USDC: 0.29743
        }
      },
      supportedTransactionCurrencies: {
        BTC: {
          enabled: true
        },
        BCH: {
          enabled: true
        },
        ETH: {
          enabled: true
        },
        GUSD: {
          enabled: true
        },
        PAX: {
          enabled: true
        },
        USDC: {
          enabled: true
        },
        XRP: {
          enabled: true
        }
      },
      minerFees: {
        BTC: {
          satoshisPerByte: 1,
          totalFee: 100
        },
        BCH: {
          satoshisPerByte: 0,
          totalFee: 0
        },
        ETH: {
          satoshisPerByte: 0,
          totalFee: 0
        },
        GUSD: {
          satoshisPerByte: 0,
          totalFee: 0
        },
        PAX: {
          satoshisPerByte: 0,
          totalFee: 0
        },
        USDC: {
          satoshisPerByte: 0,
          totalFee: 0
        },
        XRP: {
          satoshisPerByte: 0,
          totalFee: 0
        }
      },
      jsonPayProRequired: false,
      paymentCodes: {
        BTC: {
          BIP72b: 'bitcoin:?r=https://test.bitpay.com/i/WS2wmcyMcGJYzVNY9daD7w',
          BIP73: 'https://test.bitpay.com/i/WS2wmcyMcGJYzVNY9daD7w',
          BIP21: 'bitcoin:muyKMqoQ2d9RzJbMRCq52g4j49cLexvsXB?amount=0.000099',
          ADDRESS: 'muyKMqoQ2d9RzJbMRCq52g4j49cLexvsXB'
        },
        BCH: {
          BIP72b:
            'bitcoincash:?r=https://test.bitpay.com/i/WS2wmcyMcGJYzVNY9daD7w',
          BIP73: 'https://test.bitpay.com/i/WS2wmcyMcGJYzVNY9daD7w',
          BIP21:
            'bitcoincash:qz0gu2g3rctzy3mz5yjr9mhhemhl2889ucmeskw2y0?amount=0.002407',
          ADDRESS: 'qz0gu2g3rctzy3mz5yjr9mhhemhl2889ucmeskw2y0'
        },
        ETH: {
          EIP681: 'ethereum:?r=https://test.bitpay.com/i/WS2wmcyMcGJYzVNY9daD7w'
        },
        GUSD: {
          EIP681b:
            'ethereum:?r=https://test.bitpay.com/i/WS2wmcyMcGJYzVNY9daD7w'
        },
        PAX: {
          EIP681b:
            'ethereum:?r=https://test.bitpay.com/i/WS2wmcyMcGJYzVNY9daD7w'
        },
        USDC: {
          EIP681b:
            'ethereum:?r=https://test.bitpay.com/i/WS2wmcyMcGJYzVNY9daD7w'
        },
        XRP: {
          BIP72b: 'ripple:?r=https://test.bitpay.com/i/WS2wmcyMcGJYzVNY9daD7w',
          BIP73: 'https://test.bitpay.com/i/WS2wmcyMcGJYzVNY9daD7w',
          RIP681: 'https://test.bitpay.com/i/WS2wmcyMcGJYzVNY9daD7w',
          BIP21:
            'ripple:rhWuk1hvRBVwyVSexe6aXuDri72ZeDWBro?amount=3.362136?tag=831214200',
          ADDRESS: 'rhWuk1hvRBVwyVSexe6aXuDri72ZeDWBro',
          INVOICEID:
            '8188F5BF322F4E3BA9F747B9D8522834567DF81153844747CE2DE89C462723A9',
          DESTINATIONTAG: 831214200
        }
      },
      token:
        '767cdhmwtn7XgW1QrSkuEwhfTa6h4Na8ihv4Bfgei6R9CHzN3c8v7jW6xhdNbKDX6X'
    }
  };

  var mockedAddresses = {
    xrp: 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV',
    btc: 'n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF',
    eth: '0x635B4764D1939DfAcD3a8014726159abC277BecC',
    bch: 'qrgrmfhu5wgpvmgzp0sw0s52erx8pavyqvj9lcftux',
    usdc: '0x635B4764D1939DfAcD3a8014726159abC277BecC'
  };

  var payproCurrencyPayproDetails = {
    xrp: {
      time: '2020-01-24T18:42:43.416Z',
      expires: '2020-01-24T18:57:43.416Z',
      memo:
        'Payment request for BitPay invoice GtyeVtNVmz7yQFpdJ2gZQE for merchant BitPay Visa® Load (USD-USA)',
      paymentUrl: 'https://bitpay.com/i/LQiQz1oti8k98h1csWCkJ',
      paymentId: 'GtyeVtNVmz7yQFpdJ2gZQE',
      chain: 'XRP',
      network: 'main',
      instructions: [
        {
          type: 'transaction',
          requiredFeeRate: 12,
          outputs: [
            {
              amount: 35649,
              invoiceID:
                '9F1B853E79C8651CB38485E3C2467531AFC3F0B96CCF6D17EF3F4274FC7095FF',
              address: 'rKpTKoJSFbCoZkwydRv7NWTiBgNrdTXJ24'
            }
          ],
          toAddress: 'rKpTKoJSFbCoZkwydRv7NWTiBgNrdTXJ24',
          amount: 35649
        }
      ]
    },
    btc: {
      time: '2020-02-12T20:54:54.486Z',
      expires: '2020-02-12T21:09:54.486Z',
      memo:
        'Payment request for BitPay invoice CkbTEM1JrrmC8LTD7WUUQu for merchant Ross Enterprise',
      paymentUrl: 'https://test.bitpay.com/i/CkbTEM1JrrmC8LTD7WUUQu',
      paymentId: 'CkbTEM1JrrmC8LTD7WUUQu',
      chain: 'BTC',
      network: 'test',
      instructions: [
        {
          type: 'transaction',
          requiredFeeRate: 1,
          outputs: [
            {
              amount: 9700,
              address: 'mvTB2o5pCFiktvdVtEdxxXP4CsnRRtqK9U'
            }
          ],
          amount: 9700,
          toAddress: 'mvTB2o5pCFiktvdVtEdxxXP4CsnRRtqK9U'
        }
      ]
    },
    eth: {
      time: '2020-02-11T21:23:13.818Z',
      expires: '2020-02-11T21:38:13.818Z',
      memo:
        'Payment request for BitPay invoice 2ZmsZ2Mykzwgxe5R1BGjg3 for merchant BitPay Visa® Load (USD-USA)',
      paymentUrl: 'https://bitpay.com/i/2ZmsZ2Mykzwgxe5R1BGjg3',
      paymentId: '2ZmsZ2Mykzwgxe5R1BGjg3',
      chain: 'ETH',
      network: 'main',
      instructions: [
        {
          type: 'transaction',
          value: 4204000000000000,
          to: '0x52dE8D3fEbd3a06d3c627f59D56e6892B80DCf12',
          data:
            '0xb6b4af05000000000000000000000000000000000000000000000000000eef8406a2c00000000000000000000000000000000000000000000000000000000002e9fb5fe400000000000000000000000000000000000000000000000000000170395a72b1669f5a6c2c51024faa4e1ac512f2c60c3e59bd1d220116cc880862fcaabcb406db558cf9463f547f80f9bfa3dc9b406432bdc14f3677c9fd85e66ec1ce22cc01000000000000000000000000000000000000000000000000000000000000001b34787652d967089cc1bc92f8a041c30b59448785550054ff463daf00dc9ec59a19a8ff11b3342daa64a582a176da05b18656fd039ad8192e525a039cb13d3c970000000000000000000000000000000000000000000000000000000000000000',
          gasPrice: 12515500004,
          amount: 4204000000000000,
          toAddress: '0x52dE8D3fEbd3a06d3c627f59D56e6892B80DCf12'
        }
      ]
    },
    bch: {
      time: '2020-02-12T22:16:16.188Z',
      expires: '2020-02-12T22:31:16.188Z',
      memo:
        'Payment request for BitPay invoice NZ1b5o8gg5LGSK71Tt4ReY for merchant Ross Enterprise',
      paymentUrl: 'https://test.bitpay.com/i/NZ1b5o8gg5LGSK71Tt4ReY',
      paymentId: 'NZ1b5o8gg5LGSK71Tt4ReY',
      chain: 'BCH',
      network: 'test',
      instructions: [
        {
          type: 'transaction',
          requiredFeeRate: 1,
          outputs: [
            {
              amount: 211000,
              address: 'qr7pklykurayu8p2hg5t9z3aykexdqdw3glhsl39pg'
            }
          ],
          amount: 211000,
          toAddress: 'qr7pklykurayu8p2hg5t9z3aykexdqdw3glhsl39pg'
        }
      ]
    },
    usdc: {
      time: '2020-02-19T16:40:08.479Z',
      expires: '2020-02-19T16:55:08.479Z',
      memo:
        'Payment request for BitPay invoice WS2wmcyMcGJYzVNY9daD7w for merchant Ross Enterprise',
      paymentUrl: 'https://test.bitpay.com/i/WS2wmcyMcGJYzVNY9daD7w',
      paymentId: 'WS2wmcyMcGJYzVNY9daD7w',
      chain: 'ETH',
      network: 'test',
      currency: 'USDC',
      instructions: [
        {
          type: 'transaction',
          value: 0,
          to: '0x44d69d16C711BF966E3d00A46f96e02D16BDdf1f',
          data:
            '0x095ea7b3000000000000000000000000a14513bb6ec5276651c6bb8ffddc90d363a157f100000000000000000000000000000000000000000000000000000000000f4240',
          gasPrice: 10687500000,
          amount: 0,
          toAddress: '0x44d69d16C711BF966E3d00A46f96e02D16BDdf1f'
        },
        {
          type: 'transaction',
          value: 0,
          to: '0xa14513bb6ec5276651c6bb8ffddc90d363a157f1',
          data:
            '0xb6b4af0500000000000000000000000000000000000000000000000000000000000f4240000000000000000000000000000000000000000000000000000000027d064ee000000000000000000000000000000000000000000000000000000170618a2610b3429d806067e43c604588be79f43a75aa3dd2cfdb7d1502b43a7595b7e22e920d2da5aeb4bfe56612f1fb66537460d24bb9b98a28ecd349d2bcabac7084a0c6000000000000000000000000000000000000000000000000000000000000001b465d683a6552f07305f8610f8ed289eb3519288c41c33484c6f9fe253a4b4b8656409fb7aece21ca85bec813ff7f783ed4ebdce61cad6564bd547d3b2bd1dceb00000000000000000000000044d69d16c711bf966e3d00a46f96e02d16bddf1f',
          gasPrice: 10687500000
        }
      ]
    }
  };

  var payproExpectedCreatedTransactions = {
    xrp: {
      coin: 'xrp',
      amount: 35649,
      toAddress: 'rKpTKoJSFbCoZkwydRv7NWTiBgNrdTXJ24',
      outputs: [
        {
          toAddress: 'rKpTKoJSFbCoZkwydRv7NWTiBgNrdTXJ24',
          amount: 35649,
          message: undefined,
          data: undefined
        }
      ],
      message: ' to undefined',
      customData: { service: 'debitcard' },
      payProUrl: 'https://test.bitpay.com/i/LQiQz1oti8k98h1csWCkJ',
      excludeUnconfirmedUtxos: true,
      invoiceID:
        '9F1B853E79C8651CB38485E3C2467531AFC3F0B96CCF6D17EF3F4274FC7095FF',
      tokenAddress: '',
      feeLevel: 'normal',
      origToAddress: 'rKpTKoJSFbCoZkwydRv7NWTiBgNrdTXJ24',
      from: 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV'
    },
    btc: {
      coin: 'btc',
      amount: 9700,
      toAddress: 'mvTB2o5pCFiktvdVtEdxxXP4CsnRRtqK9U',
      outputs: [
        {
          toAddress: 'mvTB2o5pCFiktvdVtEdxxXP4CsnRRtqK9U',
          amount: 9700,
          message: undefined,
          data: undefined
        }
      ],
      message: ' to undefined',
      customData: { service: 'debitcard' },
      payProUrl: 'https://test.bitpay.com/i/CkbTEM1JrrmC8LTD7WUUQu',
      excludeUnconfirmedUtxos: true,
      tokenAddress: '',
      feeLevel: 'normal',
      origToAddress: 'mvTB2o5pCFiktvdVtEdxxXP4CsnRRtqK9U',
      from: 'n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF'
    },
    eth: {
      coin: 'eth',
      amount: 4204000000000000,
      toAddress: '0x52dE8D3fEbd3a06d3c627f59D56e6892B80DCf12',
      outputs: [
        {
          toAddress: '0x52dE8D3fEbd3a06d3c627f59D56e6892B80DCf12',
          amount: 4204000000000000,
          message: undefined,
          data:
            '0xb6b4af05000000000000000000000000000000000000000000000000000eef8406a2c00000000000000000000000000000000000000000000000000000000002e9fb5fe400000000000000000000000000000000000000000000000000000170395a72b1669f5a6c2c51024faa4e1ac512f2c60c3e59bd1d220116cc880862fcaabcb406db558cf9463f547f80f9bfa3dc9b406432bdc14f3677c9fd85e66ec1ce22cc01000000000000000000000000000000000000000000000000000000000000001b34787652d967089cc1bc92f8a041c30b59448785550054ff463daf00dc9ec59a19a8ff11b3342daa64a582a176da05b18656fd039ad8192e525a039cb13d3c970000000000000000000000000000000000000000000000000000000000000000'
        }
      ],
      message: ' to undefined',
      customData: { service: 'debitcard' },
      payProUrl: 'https://bitpay.com/i/2ZmsZ2Mykzwgxe5R1BGjg3',
      excludeUnconfirmedUtxos: true,
      tokenAddress: '',
      feeLevel: 'normal',
      origToAddress: '0x52dE8D3fEbd3a06d3c627f59D56e6892B80DCf12',
      from: '0x635B4764D1939DfAcD3a8014726159abC277BecC'
    },
    bch: {
      coin: 'bch',
      amount: 211000,
      toAddress: 'qr7pklykurayu8p2hg5t9z3aykexdqdw3glhsl39pg',
      outputs: [
        {
          toAddress: 'qr7pklykurayu8p2hg5t9z3aykexdqdw3glhsl39pg',
          amount: 211000,
          message: undefined,
          data: undefined
        }
      ],
      message: ' to undefined',
      customData: { service: 'debitcard' },
      payProUrl: 'https://test.bitpay.com/i/NZ1b5o8gg5LGSK71Tt4ReY',
      excludeUnconfirmedUtxos: true,
      tokenAddress: '',
      feeLevel: 'normal',
      origToAddress: 'qr7pklykurayu8p2hg5t9z3aykexdqdw3glhsl39pg',
      from: 'qrgrmfhu5wgpvmgzp0sw0s52erx8pavyqvj9lcftux'
    },
    usdc: {
      coin: 'usdc',
      amount: 0,
      toAddress: '0x44d69d16C711BF966E3d00A46f96e02D16BDdf1f',
      outputs: [
        {
          toAddress: '0x44d69d16C711BF966E3d00A46f96e02D16BDdf1f',
          amount: 0,
          message: undefined,
          data:
            '0x095ea7b3000000000000000000000000a14513bb6ec5276651c6bb8ffddc90d363a157f100000000000000000000000000000000000000000000000000000000000f4240'
        },
        {
          toAddress: undefined,
          amount: undefined,
          message: undefined,
          data:
            '0xb6b4af0500000000000000000000000000000000000000000000000000000000000f4240000000000000000000000000000000000000000000000000000000027d064ee000000000000000000000000000000000000000000000000000000170618a2610b3429d806067e43c604588be79f43a75aa3dd2cfdb7d1502b43a7595b7e22e920d2da5aeb4bfe56612f1fb66537460d24bb9b98a28ecd349d2bcabac7084a0c6000000000000000000000000000000000000000000000000000000000000001b465d683a6552f07305f8610f8ed289eb3519288c41c33484c6f9fe253a4b4b8656409fb7aece21ca85bec813ff7f783ed4ebdce61cad6564bd547d3b2bd1dceb00000000000000000000000044d69d16c711bf966e3d00a46f96e02d16bddf1f'
        }
      ],
      message: ' to undefined',
      customData: { service: 'debitcard' },
      payProUrl: 'https://test.bitpay.com/i/WS2wmcyMcGJYzVNY9daD7w',
      excludeUnconfirmedUtxos: true,
      tokenAddress: '',
      feeLevel: 'normal',
      origToAddress: '0x44d69d16C711BF966E3d00A46f96e02D16BDdf1f',
      from: '0x635B4764D1939DfAcD3a8014726159abC277BecC'
    }
  };

  function isUTXOHelper(currency) {
    return currency === 'bch' || currency === 'btc';
  }

  function isERCTokenHelper(currency) {
    return currency === 'usdc';
  }

  function testPayproTxCreationProcess(
    currency,
    testInvoice,
    mockedAddress,
    payproDetailsForCurrency,
    expectedCreatedTx
  ) {
    fit('paypro test for ' + currency, async () => {
      let wallet = {
        coin: currency,
        amount: 100,
        status: {
          totalBalanceStr: '1.000000'
        },
        credentials: {
          token: {
            address: '',
            symbol: '',
            comma: '',
            decimals: ''
          }
        },
        createTxProposal: (txp, cb) => {
          if (txp) {
            return cb(null, txp);
          }
        }
      };

      instance.amount = 10;
      instance.useSendMax = false;
      instance.currencyIsoCode = 'USD';
      instance.wallet = wallet;
      instance.totalAmount = 1000;

      spyOn(currencyProvider, 'isERCToken').and.returnValue(
        Promise.resolve(isERCTokenHelper(currency))
      );
      spyOn(bitPayCardProvider, 'getRatesFromCoin').and.returnValue(
        Promise.resolve()
      );
      spyOn(onGoingProcessProvider, 'set');
      spyOn(onGoingProcessProvider, 'clear');

      let calculateAmountSpy = spyOn<any>(
        instance,
        'calculateAmount'
      ).and.returnValue(
        Promise.resolve({
          amount: 12,
          currency
        })
      );

      spyOn<any>(payproProvider, 'getPayProDetails').and.returnValue(
        Promise.resolve(payproDetailsForCurrency)
      );

      spyOn<any>(txFormatProvider, 'parseAmount').and.returnValue({
        amount: 1000,
        currency,
        alternativeIsoCode: 'USD',
        amountSat: '',
        amountUnitStr: ''
      });

      spyOn<any>(txFormatProvider, 'formatAmountStr').and.returnValue('');
      spyOn<any>(currencyProvider, 'isUtxoCoin').and.returnValue(
        isUTXOHelper(currency)
      );

      let createInvoiceSpy = spyOn<any>(
        instance,
        'createInvoice'
      ).and.returnValue(Promise.resolve(testInvoice));

      spyOn<any>(currencyProvider, 'getChain').and.returnValue(
        instance.wallet.coin.toLowerCase()
      );
      spyOn<any>(instance, 'satToFiat').and.returnValue(Promise.resolve({}));

      let initializeTopUpSpy = spyOn<any>(
        instance,
        'initializeTopUp'
      ).and.callThrough();

      spyOn(walletProvider, 'getAddress').and.returnValue(
        Promise.resolve(mockedAddress)
      );

      let createTxSpy = spyOn<any>(instance, 'createTx').and.callThrough();

      await instance.onWalletSelect(instance.wallet);

      expect(currencyProvider.isERCToken).toHaveBeenCalled();
      expect(onGoingProcessProvider.set).toHaveBeenCalled();
      expect(calculateAmountSpy).toHaveBeenCalled();
      expect(calculateAmountSpy).toHaveBeenCalledWith(instance.wallet);
      expect(txFormatProvider.parseAmount).toHaveBeenCalled();
      expect(createInvoiceSpy).toHaveBeenCalled();
      expect(initializeTopUpSpy).toHaveBeenCalled();
      expect(createTxSpy).toHaveBeenCalled();
      expect(walletSpyCreateTx).toHaveBeenCalled();

      expect((<any>instance).createdTx).toEqual(expectedCreatedTx);
    });
  }

  for (let currency of currencies) {
    testPayproTxCreationProcess(
      currency,
      payproCurrencyInvoices[currency],
      mockedAddresses[currency],
      payproCurrencyPayproDetails[currency],
      payproExpectedCreatedTransactions[currency]
    );
  }

  describe('createTx paypro testing', () => {
    it('xrp', async () => {
      let wallet = {
        coin: 'xrp',
        amount: 100,
        status: {
          totalBalanceStr: '1.000000'
        },
        credentials: {
          token: {
            address: '',
            symbol: '',
            comma: '',
            decimals: ''
          }
        },
        createTxProposal: (txp, cb) => {
          if (txp) {
            return cb(null, txp);
          } else {
          }
        }
      };

      instance.amount = 10;
      instance.useSendMax = false;
      instance.currencyIsoCode = 'USD';
      instance.wallet = wallet;
      instance.totalAmount = 1000;

      spyOn(currencyProvider, 'isERCToken').and.returnValue(
        Promise.resolve(false)
      );
      spyOn(bitPayCardProvider, 'getRatesFromCoin').and.returnValue(
        Promise.resolve()
      );
      spyOn(onGoingProcessProvider, 'set');
      spyOn(onGoingProcessProvider, 'clear');

      let calculateAmountSpy = spyOn<any>(
        instance,
        'calculateAmount'
      ).and.returnValue(
        Promise.resolve({
          amount: 12,
          currency: 'xrp'
        })
      );

      spyOn<any>(payproProvider, 'getPayProDetails').and.returnValue(
        Promise.resolve({
          time: '2020-01-24T18:42:43.416Z',
          expires: '2020-01-24T18:57:43.416Z',
          memo:
            'Payment request for BitPay invoice GtyeVtNVmz7yQFpdJ2gZQE for merchant BitPay Visa® Load (USD-USA)',
          paymentUrl: 'https://bitpay.com/i/GtyeVtNVmz7yQFpdJ2gZQE',
          paymentId: 'GtyeVtNVmz7yQFpdJ2gZQE',
          chain: 'XRP',
          network: 'main',
          instructions: [
            {
              type: 'transaction',
              requiredFeeRate: 12,
              outputs: [
                {
                  amount: 35649,
                  invoiceID:
                    '9F1B853E79C8651CB38485E3C2467531AFC3F0B96CCF6D17EF3F4274FC7095FF',
                  address: 'rKpTKoJSFbCoZkwydRv7NWTiBgNrdTXJ24'
                }
              ],
              toAddress: 'rKpTKoJSFbCoZkwydRv7NWTiBgNrdTXJ24',
              amount: 35649
            }
          ]
        })
      );

      spyOn<any>(txFormatProvider, 'parseAmount').and.returnValue({
        amount: 1000,
        currency: 'xrp',
        alternativeIsoCode: 'USD',
        amountSat: '',
        amountUnitStr: ''
      });

      spyOn<any>(txFormatProvider, 'formatAmountStr').and.returnValue('');
      spyOn<any>(currencyProvider, 'isUtxoCoin').and.returnValue(false);

      let createInvoiceSpy = spyOn<any>(
        instance,
        'createInvoice'
      ).and.returnValue(
        Promise.resolve({
          url: 'https://test.bitpay.com/invoice?id=LQiQz1oti8k98h1csWCkJ',
          status: 'new',
          price: 1,
          currency: 'USD',
          invoiceTime: 1580928152576,
          expirationTime: 1580929052576,
          currentTime: 1580928201137,
          id: 'LQiQz1oti8k98h1csWCkJ',
          lowFeeDetected: false,
          amountPaid: 0,
          displayAmountPaid: '0',
          exceptionStatus: false,
          refundAddressRequestPending: false,
          buyerProvidedEmail: 'bsnowden@bitpay.com',
          buyerProvidedInfo: {
            selectedWallet: 'genericPayPro',
            selectedTransactionCurrency: 'XRP',
            emailAddress: 'bsnowden@bitpay.com'
          },
          paymentSubtotals: {
            BTC: 10300,
            BCH: 231900,
            ETH: 4915000000000000,
            GUSD: 100,
            PAX: 1000000000000000000,
            USDC: 1000000,
            XRP: 3602305
          },
          paymentTotals: {
            BTC: 10400,
            BCH: 231900,
            ETH: 4915000000000000,
            GUSD: 100,
            PAX: 1000000000000000000,
            USDC: 1000000,
            XRP: 3602305
          },
          paymentDisplayTotals: {
            BTC: '0.000104',
            BCH: '0.002319',
            ETH: '0.004915',
            GUSD: '1.00',
            PAX: '1.00',
            USDC: '1.00',
            XRP: '3.602305'
          },
          paymentDisplaySubTotals: {
            BTC: '0.000103',
            BCH: '0.002319',
            ETH: '0.004915',
            GUSD: '1.00',
            PAX: '1.00',
            USDC: '1.00',
            XRP: '3.602305'
          },
          exchangeRates: {
            BTC: {
              USD: 9661.92,
              BCH: 22.396662030598055,
              ETH: 47.48105558012679,
              GUSD: 9661.92,
              PAX: 9661.92,
              USDC: 9661.92,
              XRP: 34778.87765019258
            },
            BCH: {
              USD: 431.30000000000007,
              BTC: 0.04463911454543761,
              ETH: 2.1195144724556494,
              GUSD: 431.30000000000007,
              PAX: 431.30000000000007,
              USDC: 431.30000000000007,
              XRP: 1552.499910010439
            },
            ETH: {
              USD: 203.46000000000004,
              BTC: 0.021057904580140823,
              BCH: 0.47162726008344935,
              GUSD: 203.46000000000004,
              PAX: 203.46000000000004,
              USDC: 203.46000000000004,
              XRP: 732.371044958785
            },
            GUSD: {
              USD: 1,
              BTC: 0.00010349899036734895,
              BCH: 0.0023180343069077423,
              ETH: 0.004914246400314512,
              PAX: 1,
              USDC: 1,
              XRP: 3.5995824484359815
            },
            PAX: {
              USD: 1,
              BTC: 0.00010349899036734895,
              BCH: 0.0023180343069077423,
              ETH: 0.004914246400314512,
              GUSD: 1,
              USDC: 1,
              XRP: 3.5995824484359815
            },
            USDC: {
              USD: 1,
              BTC: 0.00010349899036734895,
              BCH: 0.0023180343069077423,
              ETH: 0.004914246400314512,
              GUSD: 1,
              PAX: 1,
              XRP: 3.5995824484359815
            },
            XRP: {
              USD: 0.2776,
              BTC: 0.000028731319725976075,
              BCH: 0.0006434863235975893,
              ETH: 0.0013641948007273087,
              GUSD: 0.2776,
              PAX: 0.2776,
              USDC: 0.2776
            }
          },
          supportedTransactionCurrencies: {
            BTC: {
              enabled: true
            },
            BCH: {
              enabled: true
            },
            ETH: {
              enabled: true
            },
            GUSD: {
              enabled: true
            },
            PAX: {
              enabled: true
            },
            USDC: {
              enabled: true
            },
            XRP: {
              enabled: true
            }
          },
          minerFees: {
            BTC: {
              satoshisPerByte: 1,
              totalFee: 100
            },
            BCH: {
              satoshisPerByte: 0,
              totalFee: 0
            },
            ETH: {
              satoshisPerByte: 0,
              totalFee: 0
            },
            GUSD: {
              satoshisPerByte: 0,
              totalFee: 0
            },
            PAX: {
              satoshisPerByte: 0,
              totalFee: 0
            },
            USDC: {
              satoshisPerByte: 0,
              totalFee: 0
            },
            XRP: {
              satoshisPerByte: 0,
              totalFee: 0
            }
          },
          jsonPayProRequired: false,
          paymentCodes: {
            BTC: {
              BIP72b:
                'bitcoin:?r=https://test.bitpay.com/i/LQiQz1oti8k98h1csWCkJ',
              BIP73: 'https://test.bitpay.com/i/LQiQz1oti8k98h1csWCkJ',
              BIP21:
                'bitcoin:n4nHxgZ7TsGNC2RFDd5cA8zWzYPQNQnxGQ?amount=0.000104',
              ADDRESS: 'n4nHxgZ7TsGNC2RFDd5cA8zWzYPQNQnxGQ'
            },
            BCH: {
              BIP72b:
                'bitcoincash:?r=https://test.bitpay.com/i/LQiQz1oti8k98h1csWCkJ',
              BIP73: 'https://test.bitpay.com/i/LQiQz1oti8k98h1csWCkJ',
              BIP21:
                'bitcoincash:qrlnrrrlreqvm54rcxenp5r3zynkputkpseg64kwt6?amount=0.002319',
              ADDRESS: 'qrlnrrrlreqvm54rcxenp5r3zynkputkpseg64kwt6'
            },
            ETH: {
              EIP681:
                'ethereum:?r=https://test.bitpay.com/i/LQiQz1oti8k98h1csWCkJ'
            },
            GUSD: {
              EIP681b:
                'ethereum:?r=https://test.bitpay.com/i/LQiQz1oti8k98h1csWCkJ'
            },
            PAX: {
              EIP681b:
                'ethereum:?r=https://test.bitpay.com/i/LQiQz1oti8k98h1csWCkJ'
            },
            USDC: {
              EIP681b:
                'ethereum:?r=https://test.bitpay.com/i/LQiQz1oti8k98h1csWCkJ'
            },
            XRP: {
              BIP72b:
                'ripple:?r=https://test.bitpay.com/i/LQiQz1oti8k98h1csWCkJ',
              BIP73: 'https://test.bitpay.com/i/LQiQz1oti8k98h1csWCkJ',
              RIP681: 'https://test.bitpay.com/i/LQiQz1oti8k98h1csWCkJ',
              BIP21:
                'ripple:rhWuk1hvRBVwyVSexe6aXuDri72ZeDWBro?amount=3.602305?tag=1023578355',
              ADDRESS: 'rhWuk1hvRBVwyVSexe6aXuDri72ZeDWBro',
              INVOICEID:
                '0BC1DFD423C0FABFC9935C9A8E3EA894C925AD25F5274EE81820A80B866F9954',
              DESTINATIONTAG: 1023578355
            }
          },
          token:
            '767cdhmwtn7XgW1QrSkuEwmpjtmbcHMuZQbbkbJzvC2QKAVJS1gSkdeFecvqzTDfYX'
        })
      );

      spyOn<any>(currencyProvider, 'getChain').and.returnValue(
        instance.wallet.coin.toLowerCase()
      );
      spyOn<any>(instance, 'satToFiat').and.returnValue(Promise.resolve({}));

      let initializeTopUpSpy = spyOn<any>(
        instance,
        'initializeTopUp'
      ).and.callThrough();

      spyOn(walletProvider, 'getAddress').and.returnValue(
        Promise.resolve('r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV')
      );

      let createTxSpy = spyOn<any>(instance, 'createTx').and.callThrough();

      await instance.onWalletSelect(instance.wallet);

      expect(currencyProvider.isERCToken).toHaveBeenCalled();
      expect(onGoingProcessProvider.set).toHaveBeenCalled();
      expect(calculateAmountSpy).toHaveBeenCalled();
      expect(calculateAmountSpy).toHaveBeenCalledWith(instance.wallet);
      expect(txFormatProvider.parseAmount).toHaveBeenCalled();
      expect(createInvoiceSpy).toHaveBeenCalled();
      expect(initializeTopUpSpy).toHaveBeenCalled();
      expect(createTxSpy).toHaveBeenCalled();
      expect(walletSpyCreateTx).toHaveBeenCalled();
      expect((<any>instance).createdTx).toEqual({
        coin: 'xrp',
        amount: 35649,
        toAddress: 'rKpTKoJSFbCoZkwydRv7NWTiBgNrdTXJ24',
        outputs: [
          {
            toAddress: 'rKpTKoJSFbCoZkwydRv7NWTiBgNrdTXJ24',
            amount: 35649,
            message: undefined,
            data: undefined
          }
        ],
        message: ' to undefined',
        customData: { service: 'debitcard' },
        payProUrl: 'https://test.bitpay.com/i/LQiQz1oti8k98h1csWCkJ',
        excludeUnconfirmedUtxos: true,
        invoiceID:
          '9F1B853E79C8651CB38485E3C2467531AFC3F0B96CCF6D17EF3F4274FC7095FF',
        tokenAddress: '',
        feeLevel: 'normal',
        origToAddress: 'rKpTKoJSFbCoZkwydRv7NWTiBgNrdTXJ24',
        from: 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV'
      });
      window.console.log((<any>instance).createdTx);
    });

    it('eth', async () => {
      let wallet = {
        coin: 'eth',
        amount: 100,
        status: {
          totalBalanceStr: '1.000000'
        },
        credentials: {
          token: {
            address: '',
            symbol: '',
            comma: '',
            decimals: ''
          }
        },
        createTxProposal: (txp, cb) => {
          if (txp) {
            return cb(null, txp);
          } else {
          }
        }
      };

      instance.amount = 10;
      instance.useSendMax = false;
      instance.currencyIsoCode = 'USD';
      instance.wallet = wallet;
      instance.totalAmount = 1000;

      spyOn(currencyProvider, 'isERCToken').and.returnValue(
        Promise.resolve(true)
      );
      spyOn(bitPayCardProvider, 'getRatesFromCoin').and.returnValue(
        Promise.resolve()
      );
      spyOn(onGoingProcessProvider, 'set');
      spyOn(onGoingProcessProvider, 'clear');

      let calculateAmountSpy = spyOn<any>(
        instance,
        'calculateAmount'
      ).and.returnValue(
        Promise.resolve({
          amount: 12,
          currency: 'eth'
        })
      );

      spyOn<any>(payproProvider, 'getPayProDetails').and.returnValue(
        Promise.resolve({
          time: '2020-02-11T21:23:13.818Z',
          expires: '2020-02-11T21:38:13.818Z',
          memo:
            'Payment request for BitPay invoice 2ZmsZ2Mykzwgxe5R1BGjg3 for merchant BitPay Visa® Load (USD-USA)',
          paymentUrl: 'https://bitpay.com/i/2ZmsZ2Mykzwgxe5R1BGjg3',
          paymentId: '2ZmsZ2Mykzwgxe5R1BGjg3',
          chain: 'ETH',
          network: 'main',
          instructions: [
            {
              type: 'transaction',
              value: 4204000000000000,
              to: '0x52dE8D3fEbd3a06d3c627f59D56e6892B80DCf12',
              data:
                '0xb6b4af05000000000000000000000000000000000000000000000000000eef8406a2c00000000000000000000000000000000000000000000000000000000002e9fb5fe400000000000000000000000000000000000000000000000000000170395a72b1669f5a6c2c51024faa4e1ac512f2c60c3e59bd1d220116cc880862fcaabcb406db558cf9463f547f80f9bfa3dc9b406432bdc14f3677c9fd85e66ec1ce22cc01000000000000000000000000000000000000000000000000000000000000001b34787652d967089cc1bc92f8a041c30b59448785550054ff463daf00dc9ec59a19a8ff11b3342daa64a582a176da05b18656fd039ad8192e525a039cb13d3c970000000000000000000000000000000000000000000000000000000000000000',
              gasPrice: 12515500004
            }
          ]
        })
      );

      spyOn<any>(txFormatProvider, 'parseAmount').and.returnValue({
        amount: 1000,
        currency: 'eth',
        alternativeIsoCode: 'USD',
        amountSat: '',
        amountUnitStr: ''
      });

      spyOn<any>(txFormatProvider, 'formatAmountStr').and.returnValue('');
      spyOn<any>(currencyProvider, 'isUtxoCoin').and.returnValue(false);

      let createInvoiceSpy = spyOn<any>(
        instance,
        'createInvoice'
      ).and.returnValue(
        Promise.resolve({
          url: 'https://bitpay.com/invoice?id=2ZmsZ2Mykzwgxe5R1BGjg3',
          posData:
            'oxqP1dNFce6pdD9at5Te1eTZhSdWEUonYySyAxX1pi9VaoOyQyxTnM1dOYB5dE1K7OexQvumQkS30yrkp47nyGrZ92dRd2ZavKynMGwLgdQ=',
          status: 'new',
          price: 1,
          currency: 'USD',
          itemDesc: 'BitPay Debit Card Top-Up',
          orderId: 'ls@bitpay.com',
          invoiceTime: 1581456193818,
          expirationTime: 1581457093818,
          currentTime: 1581456306002,
          id: '2ZmsZ2Mykzwgxe5R1BGjg3',
          lowFeeDetected: false,
          amountPaid: 0,
          displayAmountPaid: '0',
          exceptionStatus: false,
          refundAddressRequestPending: false,
          buyerProvidedInfo: {
            selectedTransactionCurrency: 'ETH'
          },
          paymentSubtotals: {
            BTC: 9800,
            BCH: 215800,
            ETH: 4204000000000000,
            GUSD: 100,
            PAX: 1000000000000000000,
            USDC: 1000000,
            XRP: 3553429
          },
          paymentTotals: {
            BTC: 13900,
            BCH: 215800,
            ETH: 4204000000000000,
            GUSD: 100,
            PAX: 1000000000000000000,
            USDC: 1000000,
            XRP: 3553429
          },
          paymentDisplayTotals: {
            BTC: '0.000139',
            BCH: '0.002158',
            ETH: '0.004204',
            GUSD: '1.00',
            PAX: '1.00',
            USDC: '1.00',
            XRP: '3.553429'
          },
          paymentDisplaySubTotals: {
            BTC: '0.000098',
            BCH: '0.002158',
            ETH: '0.004204',
            GUSD: '1.00',
            PAX: '1.00',
            USDC: '1.00',
            XRP: '3.553429'
          },
          exchangeRates: {
            BTC: {
              USD: 10250.872000000001,
              BCH: 22.089540145670817,
              ETH: 43.06727165784388,
              GUSD: 10250.872000000001,
              PAX: 10250.872000000001,
              USDC: 10250.872000000001,
              XRP: 36376.408800567784
            },
            BCH: {
              USD: 463.48605,
              BTC: 0.04519165347927703,
              ETH: 1.9472567431308292,
              GUSD: 463.48605,
              PAX: 463.48605,
              USDC: 463.48605,
              XRP: 1644.7340312278213
            },
            ETH: {
              USD: 237.89099500000003,
              BTC: 0.023195277208193053,
              BCH: 0.5126298215747964,
              GUSD: 237.89099500000003,
              PAX: 237.89099500000003,
              USDC: 237.89099500000003,
              XRP: 844.1838005677786
            },
            GUSD: {
              USD: 1,
              BTC: 0.00009750380508599348,
              BCH: 0.0021548937637374476,
              ETH: 0.004201327619527771,
              PAX: 1,
              USDC: 1,
              XRP: 3.5486160397444997
            },
            PAX: {
              USD: 1,
              BTC: 0.00009750380508599348,
              BCH: 0.0021548937637374476,
              ETH: 0.004201327619527771,
              GUSD: 1,
              USDC: 1,
              XRP: 3.5486160397444997
            },
            USDC: {
              USD: 1,
              BTC: 0.00009750380508599348,
              BCH: 0.0021548937637374476,
              ETH: 0.004201327619527771,
              GUSD: 1,
              PAX: 1,
              XRP: 3.5486160397444997
            },
            XRP: {
              USD: 0.2814183,
              BTC: 0.000027439355070831643,
              BCH: 0.0006064265396715943,
              ETH: 0.001182330476430552,
              GUSD: 0.2814183,
              PAX: 0.2814183,
              USDC: 0.2814183
            }
          },
          supportedTransactionCurrencies: {
            BTC: {
              enabled: true
            },
            BCH: {
              enabled: true
            },
            ETH: {
              enabled: true
            },
            GUSD: {
              enabled: true
            },
            PAX: {
              enabled: true
            },
            USDC: {
              enabled: true
            },
            XRP: {
              enabled: true
            }
          },
          minerFees: {
            BTC: {
              satoshisPerByte: 28.224,
              totalFee: 4100
            },
            BCH: {
              satoshisPerByte: 0,
              totalFee: 0
            },
            ETH: {
              satoshisPerByte: 0,
              totalFee: 0
            },
            GUSD: {
              satoshisPerByte: 0,
              totalFee: 0
            },
            PAX: {
              satoshisPerByte: 0,
              totalFee: 0
            },
            USDC: {
              satoshisPerByte: 0,
              totalFee: 0
            },
            XRP: {
              satoshisPerByte: 0,
              totalFee: 0
            }
          },
          jsonPayProRequired: false,
          paymentCodes: {
            BTC: {
              BIP72b: 'bitcoin:?r=https://bitpay.com/i/2ZmsZ2Mykzwgxe5R1BGjg3',
              BIP73: 'https://bitpay.com/i/2ZmsZ2Mykzwgxe5R1BGjg3',
              BIP21:
                'bitcoin:1esVnmvywn4kYpYuTHWL2wJ9WpCUCoUx7?amount=0.000139',
              ADDRESS: '1esVnmvywn4kYpYuTHWL2wJ9WpCUCoUx7'
            },
            BCH: {
              BIP72b:
                'bitcoincash:?r=https://bitpay.com/i/2ZmsZ2Mykzwgxe5R1BGjg3',
              BIP73: 'https://bitpay.com/i/2ZmsZ2Mykzwgxe5R1BGjg3',
              BIP21:
                'bitcoincash:qqrjnzhku8e8ptex7dm0pexx68uwjap8hcyqr0d6yk?amount=0.002158',
              ADDRESS: 'qqrjnzhku8e8ptex7dm0pexx68uwjap8hcyqr0d6yk'
            },
            ETH: {
              EIP681: 'ethereum:?r=https://bitpay.com/i/2ZmsZ2Mykzwgxe5R1BGjg3'
            },
            GUSD: {
              EIP681b: 'ethereum:?r=https://bitpay.com/i/2ZmsZ2Mykzwgxe5R1BGjg3'
            },
            PAX: {
              EIP681b: 'ethereum:?r=https://bitpay.com/i/2ZmsZ2Mykzwgxe5R1BGjg3'
            },
            USDC: {
              EIP681b: 'ethereum:?r=https://bitpay.com/i/2ZmsZ2Mykzwgxe5R1BGjg3'
            },
            XRP: {
              BIP72b: 'ripple:?r=https://bitpay.com/i/2ZmsZ2Mykzwgxe5R1BGjg3',
              BIP73: 'https://bitpay.com/i/2ZmsZ2Mykzwgxe5R1BGjg3',
              RIP681: 'https://bitpay.com/i/2ZmsZ2Mykzwgxe5R1BGjg3',
              BIP21:
                'ripple:rKpTKoJSFbCoZkwydRv7NWTiBgNrdTXJ24?amount=3.553429?tag=2179428434',
              ADDRESS: 'rKpTKoJSFbCoZkwydRv7NWTiBgNrdTXJ24',
              INVOICEID:
                'F697A1D862CDD634C96695E8902C8AC987B8C5A6A4274052CC113CAFB6F05886',
              DESTINATIONTAG: 2179428434
            }
          },
          token:
            '5uqeA84nXkFyYDAk2yW3RHab3GCmyxE6E2dkuG9MJG1d7E1t456FPNuvJeroXFz5Q'
        })
      );

      spyOn<any>(currencyProvider, 'getChain').and.returnValue(
        instance.wallet.coin.toLowerCase()
      );
      spyOn<any>(instance, 'satToFiat').and.returnValue(Promise.resolve({}));

      let initializeTopUpSpy = spyOn<any>(
        instance,
        'initializeTopUp'
      ).and.callThrough();

      spyOn(walletProvider, 'getAddress').and.returnValue(
        Promise.resolve('0x42f96066c9288Ef080cfA688E1E82D087dB5f66C')
      );

      let createTxSpy = spyOn<any>(instance, 'createTx').and.callThrough();

      await instance.onWalletSelect(instance.wallet);

      expect(currencyProvider.isERCToken).toHaveBeenCalled();
      expect(onGoingProcessProvider.set).toHaveBeenCalled();
      expect(calculateAmountSpy).toHaveBeenCalled();
      expect(calculateAmountSpy).toHaveBeenCalledWith(wallet);
      expect(txFormatProvider.parseAmount).toHaveBeenCalled();
      expect(createInvoiceSpy).toHaveBeenCalled();
      expect(initializeTopUpSpy).toHaveBeenCalled();
      expect(createTxSpy).toHaveBeenCalled();
      expect(walletSpyCreateTx).toHaveBeenCalled();
      window.console.log((<any>instance).createdTx);
    });

    it('btc', async () => {
      let wallet = {
        coin: 'btc',
        amount: 100,
        status: {
          totalBalanceStr: '1.000000'
        },
        credentials: {
          token: {
            address: '',
            symbol: '',
            comma: '',
            decimals: ''
          }
        },
        createTxProposal: (txp, cb) => {
          if (txp) {
            return cb(null, txp);
          } else {
          }
        }
      };

      instance.amount = 10;
      instance.useSendMax = false;
      instance.currencyIsoCode = 'USD';
      instance.wallet = wallet;
      instance.totalAmount = 1000;

      spyOn(currencyProvider, 'isERCToken').and.returnValue(
        Promise.resolve(false)
      );
      spyOn(bitPayCardProvider, 'getRatesFromCoin').and.returnValue(
        Promise.resolve()
      );
      spyOn(onGoingProcessProvider, 'set');
      spyOn(onGoingProcessProvider, 'clear');

      let calculateAmountSpy = spyOn<any>(
        instance,
        'calculateAmount'
      ).and.returnValue(
        Promise.resolve({
          amount: 12,
          currency: 'btc'
        })
      );

      spyOn<any>(payproProvider, 'getPayProDetails').and.returnValue(
        Promise.resolve({
          time: '2020-02-12T20:54:54.486Z',
          expires: '2020-02-12T21:09:54.486Z',
          memo:
            'Payment request for BitPay invoice CkbTEM1JrrmC8LTD7WUUQu for merchant Ross Enterprise',
          paymentUrl: 'https://test.bitpay.com/i/CkbTEM1JrrmC8LTD7WUUQu',
          paymentId: 'CkbTEM1JrrmC8LTD7WUUQu',
          chain: 'BTC',
          network: 'test',
          instructions: [
            {
              type: 'transaction',
              requiredFeeRate: 1,
              outputs: [
                {
                  amount: 9700,
                  address: 'mvTB2o5pCFiktvdVtEdxxXP4CsnRRtqK9U'
                }
              ],
              amount: 9700,
              address: 'mvTB2o5pCFiktvdVtEdxxXP4CsnRRtqK9U'
            }
          ]
        })
      );

      spyOn<any>(txFormatProvider, 'parseAmount').and.returnValue({
        amount: 1000,
        currency: 'btc',
        alternativeIsoCode: 'USD',
        amountSat: '',
        amountUnitStr: ''
      });

      spyOn<any>(txFormatProvider, 'formatAmountStr').and.returnValue('');
      spyOn<any>(currencyProvider, 'isUtxoCoin').and.returnValue(false);

      let createInvoiceSpy = spyOn<any>(
        instance,
        'createInvoice'
      ).and.returnValue(
        Promise.resolve({
          url: 'https://test.bitpay.com/invoice?id=CkbTEM1JrrmC8LTD7WUUQu',
          status: 'new',
          price: 1,
          currency: 'USD',
          invoiceTime: 1581540894486,
          expirationTime: 1581541794486,
          currentTime: 1581541031072,
          id: 'CkbTEM1JrrmC8LTD7WUUQu',
          lowFeeDetected: false,
          amountPaid: 0,
          displayAmountPaid: '0',
          exceptionStatus: false,
          refundAddressRequestPending: false,
          buyerProvidedEmail: 'bsnowden@bitpay.com',
          buyerProvidedInfo: {
            selectedWallet: 'bitpay',
            selectedTransactionCurrency: 'BTC',
            emailAddress: 'bsnowden@bitpay.com'
          },
          paymentSubtotals: {
            BTC: 9600,
            BCH: 209600,
            ETH: 3695000000000000,
            GUSD: 100,
            PAX: 1000000000000000000,
            USDC: 1000000,
            XRP: 3305676
          },
          paymentTotals: {
            BTC: 9700,
            BCH: 209600,
            ETH: 3695000000000000,
            GUSD: 100,
            PAX: 1000000000000000000,
            USDC: 1000000,
            XRP: 3305676
          },
          paymentDisplayTotals: {
            BTC: '0.000097',
            BCH: '0.002096',
            ETH: '0.003695',
            GUSD: '1.00',
            PAX: '1.00',
            USDC: '1.00',
            XRP: '3.305676'
          },
          paymentDisplaySubTotals: {
            BTC: '0.000096',
            BCH: '0.002096',
            ETH: '0.003695',
            GUSD: '1.00',
            PAX: '1.00',
            USDC: '1.00',
            XRP: '3.305676'
          },
          exchangeRates: {
            BTC: {
              USD: 10391.8,
              BCH: 21.767490573942183,
              ETH: 38.38153277931671,
              GUSD: 10391.8,
              PAX: 10391.8,
              USDC: 10391.8,
              XRP: 34350.786724844635
            },
            BCH: {
              USD: 477.1,
              BTC: 0.04590589820071203,
              ETH: 1.7621421975992615,
              GUSD: 477.1,
              PAX: 477.1,
              USDC: 477.1,
              XRP: 1577.085812508264
            },
            ETH: {
              USD: 270.63,
              BTC: 0.026039642066775715,
              BCH: 0.5668831168831168,
              GUSD: 270.63,
              PAX: 270.63,
              USDC: 270.63,
              XRP: 894.5854819516064
            },
            GUSD: {
              USD: 1,
              BTC: 0.00009621860867891851,
              BCH: 0.0020946795140343527,
              ETH: 0.0036934441366574334,
              PAX: 1,
              USDC: 1,
              XRP: 3.3055665741108022
            },
            PAX: {
              USD: 1,
              BTC: 0.00009621860867891851,
              BCH: 0.0020946795140343527,
              ETH: 0.0036934441366574334,
              GUSD: 1,
              USDC: 1,
              XRP: 3.3055665741108022
            },
            USDC: {
              USD: 1,
              BTC: 0.00009621860867891851,
              BCH: 0.0020946795140343527,
              ETH: 0.0036934441366574334,
              GUSD: 1,
              PAX: 1,
              XRP: 3.3055665741108022
            },
            XRP: {
              USD: 0.30251,
              BTC: 0.00002910709131145964,
              BCH: 0.0006336614997905321,
              ETH: 0.0011173037857802402,
              GUSD: 0.30251,
              PAX: 0.30251,
              USDC: 0.30251
            }
          },
          supportedTransactionCurrencies: {
            BTC: {
              enabled: true
            },
            BCH: {
              enabled: true
            },
            ETH: {
              enabled: true
            },
            GUSD: {
              enabled: true
            },
            PAX: {
              enabled: true
            },
            USDC: {
              enabled: true
            },
            XRP: {
              enabled: true
            }
          },
          minerFees: {
            BTC: {
              satoshisPerByte: 1,
              totalFee: 100
            },
            BCH: {
              satoshisPerByte: 0,
              totalFee: 0
            },
            ETH: {
              satoshisPerByte: 0,
              totalFee: 0
            },
            GUSD: {
              satoshisPerByte: 0,
              totalFee: 0
            },
            PAX: {
              satoshisPerByte: 0,
              totalFee: 0
            },
            USDC: {
              satoshisPerByte: 0,
              totalFee: 0
            },
            XRP: {
              satoshisPerByte: 0,
              totalFee: 0
            }
          },
          jsonPayProRequired: false,
          paymentCodes: {
            BTC: {
              BIP72b:
                'bitcoin:?r=https://test.bitpay.com/i/CkbTEM1JrrmC8LTD7WUUQu',
              BIP73: 'https://test.bitpay.com/i/CkbTEM1JrrmC8LTD7WUUQu',
              BIP21:
                'bitcoin:mvTB2o5pCFiktvdVtEdxxXP4CsnRRtqK9U?amount=0.000097',
              ADDRESS: 'mvTB2o5pCFiktvdVtEdxxXP4CsnRRtqK9U'
            },
            BCH: {
              BIP72b:
                'bitcoincash:?r=https://test.bitpay.com/i/CkbTEM1JrrmC8LTD7WUUQu',
              BIP73: 'https://test.bitpay.com/i/CkbTEM1JrrmC8LTD7WUUQu',
              BIP21:
                'bitcoincash:qz3a9khtvuplwap5zudqqvuyc8tcyeghavl2u3x79k?amount=0.002096',
              ADDRESS: 'qz3a9khtvuplwap5zudqqvuyc8tcyeghavl2u3x79k'
            },
            ETH: {
              EIP681:
                'ethereum:?r=https://test.bitpay.com/i/CkbTEM1JrrmC8LTD7WUUQu'
            },
            GUSD: {
              EIP681b:
                'ethereum:?r=https://test.bitpay.com/i/CkbTEM1JrrmC8LTD7WUUQu'
            },
            PAX: {
              EIP681b:
                'ethereum:?r=https://test.bitpay.com/i/CkbTEM1JrrmC8LTD7WUUQu'
            },
            USDC: {
              EIP681b:
                'ethereum:?r=https://test.bitpay.com/i/CkbTEM1JrrmC8LTD7WUUQu'
            },
            XRP: {
              BIP72b:
                'ripple:?r=https://test.bitpay.com/i/CkbTEM1JrrmC8LTD7WUUQu',
              BIP73: 'https://test.bitpay.com/i/CkbTEM1JrrmC8LTD7WUUQu',
              RIP681: 'https://test.bitpay.com/i/CkbTEM1JrrmC8LTD7WUUQu',
              BIP21:
                'ripple:rhWuk1hvRBVwyVSexe6aXuDri72ZeDWBro?amount=3.305676?tag=870624532',
              ADDRESS: 'rhWuk1hvRBVwyVSexe6aXuDri72ZeDWBro',
              INVOICEID:
                'D836FC11D99B9C9468764C24F99B7413A4E86C63347ABDC9F01AC29A5F380A4B',
              DESTINATIONTAG: 870624532
            }
          },
          token:
            '767cdhmwtn7XgW1QrSkuEwkYp153tjGsY6MxpugpPTkdvyZPQQ53eZvmJmgSWF57of'
        })
      );

      spyOn<any>(currencyProvider, 'getChain').and.returnValue(
        instance.wallet.coin.toLowerCase()
      );
      spyOn<any>(instance, 'satToFiat').and.returnValue(Promise.resolve({}));

      let initializeTopUpSpy = spyOn<any>(
        instance,
        'initializeTopUp'
      ).and.callThrough();

      spyOn(walletProvider, 'getAddress').and.returnValue(Promise.resolve(''));

      let createTxSpy = spyOn<any>(instance, 'createTx').and.callThrough();

      await instance.onWalletSelect(instance.wallet);

      expect(currencyProvider.isERCToken).toHaveBeenCalled();
      expect(onGoingProcessProvider.set).toHaveBeenCalled();
      expect(calculateAmountSpy).toHaveBeenCalled();
      expect(calculateAmountSpy).toHaveBeenCalledWith(wallet);
      expect(txFormatProvider.parseAmount).toHaveBeenCalled();
      expect(createInvoiceSpy).toHaveBeenCalled();
      expect(initializeTopUpSpy).toHaveBeenCalled();
      expect(createTxSpy).toHaveBeenCalled();
      expect(walletSpyCreateTx).toHaveBeenCalled();
      window.console.log((<any>instance).createdTx);
    });

    it('bch', async () => {
      let wallet = {
        coin: 'bch',
        amount: 100,
        status: {
          totalBalanceStr: '1.000000'
        },
        credentials: {
          token: {
            address: '',
            symbol: '',
            comma: '',
            decimals: ''
          }
        },
        createTxProposal: (txp, cb) => {
          if (txp) {
            return cb(null, txp);
          } else {
          }
        }
      };

      instance.amount = 10;
      instance.useSendMax = false;
      instance.currencyIsoCode = 'USD';
      instance.wallet = wallet;
      instance.totalAmount = 1000;

      spyOn(currencyProvider, 'isERCToken').and.returnValue(
        Promise.resolve(false)
      );
      spyOn(bitPayCardProvider, 'getRatesFromCoin').and.returnValue(
        Promise.resolve()
      );
      spyOn(onGoingProcessProvider, 'set');
      spyOn(onGoingProcessProvider, 'clear');

      let calculateAmountSpy = spyOn<any>(
        instance,
        'calculateAmount'
      ).and.returnValue(
        Promise.resolve({
          amount: 12,
          currency: 'bch'
        })
      );

      spyOn<any>(payproProvider, 'getPayProDetails').and.returnValue(
        Promise.resolve({
          time: '2020-02-12T22:16:16.188Z',
          expires: '2020-02-12T22:31:16.188Z',
          memo:
            'Payment request for BitPay invoice NZ1b5o8gg5LGSK71Tt4ReY for merchant Ross Enterprise',
          paymentUrl: 'https://test.bitpay.com/i/NZ1b5o8gg5LGSK71Tt4ReY',
          paymentId: 'NZ1b5o8gg5LGSK71Tt4ReY',
          chain: 'BCH',
          network: 'test',
          instructions: [
            {
              type: 'transaction',
              requiredFeeRate: 1,
              outputs: [
                {
                  amount: 211000,
                  address: 'qr7pklykurayu8p2hg5t9z3aykexdqdw3glhsl39pg'
                }
              ],
              amount: 211000,
              toAddress: 'qr7pklykurayu8p2hg5t9z3aykexdqdw3glhsl39pg'
            }
          ]
        })
      );

      spyOn<any>(txFormatProvider, 'parseAmount').and.returnValue({
        amount: 1000,
        currency: 'bch',
        alternativeIsoCode: 'USD',
        amountSat: '',
        amountUnitStr: ''
      });

      spyOn<any>(txFormatProvider, 'formatAmountStr').and.returnValue('');
      spyOn<any>(currencyProvider, 'isUtxoCoin').and.returnValue(false);

      let createInvoiceSpy = spyOn<any>(
        instance,
        'createInvoice'
      ).and.returnValue(
        Promise.resolve({
          url: 'https://test.bitpay.com/invoice?id=NZ1b5o8gg5LGSK71Tt4ReY',
          status: 'new',
          price: 1,
          currency: 'USD',
          invoiceTime: 1581545776188,
          expirationTime: 1581546676188,
          currentTime: 1581546189800,
          id: 'NZ1b5o8gg5LGSK71Tt4ReY',
          lowFeeDetected: false,
          amountPaid: 0,
          displayAmountPaid: '0',
          exceptionStatus: false,
          refundAddressRequestPending: false,
          buyerProvidedEmail: 'bsnowden@bitpay.com',
          buyerProvidedInfo: {
            selectedWallet: 'bitpay',
            selectedTransactionCurrency: 'BCH',
            emailAddress: 'bsnowden@bitpay.com'
          },
          paymentSubtotals: {
            BTC: 9600,
            BCH: 211000,
            ETH: 3716000000000000,
            GUSD: 100,
            PAX: 1000000000000000000,
            USDC: 1000000,
            XRP: 3301638
          },
          paymentTotals: {
            BTC: 9700,
            BCH: 211000,
            ETH: 3716000000000000,
            GUSD: 100,
            PAX: 1000000000000000000,
            USDC: 1000000,
            XRP: 3301638
          },
          paymentDisplayTotals: {
            BTC: '0.000097',
            BCH: '0.002110',
            ETH: '0.003716',
            GUSD: '1.00',
            PAX: '1.00',
            USDC: '1.00',
            XRP: '3.301638'
          },
          paymentDisplaySubTotals: {
            BTC: '0.000096',
            BCH: '0.002110',
            ETH: '0.003716',
            GUSD: '1.00',
            PAX: '1.00',
            USDC: '1.00',
            XRP: '3.301638'
          },
          exchangeRates: {
            BTC: {
              USD: 10380,
              BCH: 21.884882985452244,
              ETH: 38.544374303750466,
              GUSD: 10380,
              PAX: 10380,
              USDC: 10380,
              XRP: 34252.90390707497
            },
            BCH: {
              USD: 474.00000000000006,
              BTC: 0.045664695891429775,
              ETH: 1.760118826587449,
              GUSD: 474.00000000000006,
              PAX: 474.00000000000006,
              USDC: 474.00000000000006,
              XRP: 1564.1499472016897
            },
            ETH: {
              USD: 269.14,
              BTC: 0.025928684076412255,
              BCH: 0.5674467636516971,
              GUSD: 269.14,
              PAX: 269.14,
              USDC: 269.14,
              XRP: 888.1335797254487
            },
            GUSD: {
              USD: 1,
              BTC: 0.00009633902086799531,
              BCH: 0.002108370229812355,
              ETH: 0.003713330857779428,
              PAX: 1,
              USDC: 1,
              XRP: 3.299894403379092
            },
            PAX: {
              USD: 1,
              BTC: 0.00009633902086799531,
              BCH: 0.002108370229812355,
              ETH: 0.003713330857779428,
              GUSD: 1,
              USDC: 1,
              XRP: 3.299894403379092
            },
            USDC: {
              USD: 1,
              BTC: 0.00009633902086799531,
              BCH: 0.002108370229812355,
              ETH: 0.003713330857779428,
              GUSD: 1,
              PAX: 1,
              XRP: 3.299894403379092
            },
            XRP: {
              USD: 0.30288,
              BTC: 0.000029179162640498416,
              BCH: 0.0006385831752055661,
              ETH: 0.0011246936502042333,
              GUSD: 0.30288,
              PAX: 0.30288,
              USDC: 0.30288
            }
          },
          supportedTransactionCurrencies: {
            BTC: {
              enabled: true
            },
            BCH: {
              enabled: true
            },
            ETH: {
              enabled: true
            },
            GUSD: {
              enabled: true
            },
            PAX: {
              enabled: true
            },
            USDC: {
              enabled: true
            },
            XRP: {
              enabled: true
            }
          },
          minerFees: {
            BTC: {
              satoshisPerByte: 1,
              totalFee: 100
            },
            BCH: {
              satoshisPerByte: 0,
              totalFee: 0
            },
            ETH: {
              satoshisPerByte: 0,
              totalFee: 0
            },
            GUSD: {
              satoshisPerByte: 0,
              totalFee: 0
            },
            PAX: {
              satoshisPerByte: 0,
              totalFee: 0
            },
            USDC: {
              satoshisPerByte: 0,
              totalFee: 0
            },
            XRP: {
              satoshisPerByte: 0,
              totalFee: 0
            }
          },
          jsonPayProRequired: false,
          paymentCodes: {
            BTC: {
              BIP72b:
                'bitcoin:?r=https://test.bitpay.com/i/NZ1b5o8gg5LGSK71Tt4ReY',
              BIP73: 'https://test.bitpay.com/i/NZ1b5o8gg5LGSK71Tt4ReY',
              BIP21:
                'bitcoin:n4VyWCjVFZw1ReX2AcPCTY9uX7sPLwu58z?amount=0.000097',
              ADDRESS: 'n4VyWCjVFZw1ReX2AcPCTY9uX7sPLwu58z'
            },
            BCH: {
              BIP72b:
                'bitcoincash:?r=https://test.bitpay.com/i/NZ1b5o8gg5LGSK71Tt4ReY',
              BIP73: 'https://test.bitpay.com/i/NZ1b5o8gg5LGSK71Tt4ReY',
              BIP21:
                'bitcoincash:qr7pklykurayu8p2hg5t9z3aykexdqdw3glhsl39pg?amount=0.00211',
              ADDRESS: 'qr7pklykurayu8p2hg5t9z3aykexdqdw3glhsl39pg'
            },
            ETH: {
              EIP681:
                'ethereum:?r=https://test.bitpay.com/i/NZ1b5o8gg5LGSK71Tt4ReY'
            },
            GUSD: {
              EIP681b:
                'ethereum:?r=https://test.bitpay.com/i/NZ1b5o8gg5LGSK71Tt4ReY'
            },
            PAX: {
              EIP681b:
                'ethereum:?r=https://test.bitpay.com/i/NZ1b5o8gg5LGSK71Tt4ReY'
            },
            USDC: {
              EIP681b:
                'ethereum:?r=https://test.bitpay.com/i/NZ1b5o8gg5LGSK71Tt4ReY'
            },
            XRP: {
              BIP72b:
                'ripple:?r=https://test.bitpay.com/i/NZ1b5o8gg5LGSK71Tt4ReY',
              BIP73: 'https://test.bitpay.com/i/NZ1b5o8gg5LGSK71Tt4ReY',
              RIP681: 'https://test.bitpay.com/i/NZ1b5o8gg5LGSK71Tt4ReY',
              BIP21:
                'ripple:rhWuk1hvRBVwyVSexe6aXuDri72ZeDWBro?amount=3.301638?tag=69851628',
              ADDRESS: 'rhWuk1hvRBVwyVSexe6aXuDri72ZeDWBro',
              INVOICEID:
                '43DB569985CAA736B0BDA2164CD1FE67F5C28618A3E5D710B34324AC44A8D55B',
              DESTINATIONTAG: 69851628
            }
          },
          token:
            '767cdhmwtn7XgW1QrSkuEwqfr4PbJLCauSLMWA7XJCsThq5gDD8jvoPuhUKCTZreRo'
        })
      );

      spyOn<any>(currencyProvider, 'getChain').and.returnValue(
        instance.wallet.coin.toLowerCase()
      );
      spyOn<any>(instance, 'satToFiat').and.returnValue(Promise.resolve({}));

      let initializeTopUpSpy = spyOn<any>(
        instance,
        'initializeTopUp'
      ).and.callThrough();

      spyOn(walletProvider, 'getAddress').and.returnValue(
        Promise.resolve('qr7pklykurayu8p2hg5t9z3aykexdqdw3glhsl39pg')
      );

      let createTxSpy = spyOn<any>(instance, 'createTx').and.callThrough();

      await instance.onWalletSelect(instance.wallet);

      expect(currencyProvider.isERCToken).toHaveBeenCalled();
      expect(onGoingProcessProvider.set).toHaveBeenCalled();
      expect(calculateAmountSpy).toHaveBeenCalled();
      expect(calculateAmountSpy).toHaveBeenCalledWith(wallet);
      expect(txFormatProvider.parseAmount).toHaveBeenCalled();
      expect(createInvoiceSpy).toHaveBeenCalled();
      expect(initializeTopUpSpy).toHaveBeenCalled();
      expect(createTxSpy).toHaveBeenCalled();
      window.console.log((<any>instance).createdTx);
    });
  });
});
