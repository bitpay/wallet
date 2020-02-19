import { async, ComponentFixture } from '@angular/core/testing';
import { TestUtils } from '../../../../test';

import { FormatCurrencyPipe } from '../../../../pipes/format-currency';
import { CurrencyProvider } from '../../../../providers/currency/currency';
import { ClaimCodeType } from '../../../../providers/gift-card/gift-card.types';
import { OnGoingProcessProvider } from '../../../../providers/on-going-process/on-going-process';
import { PayproProvider } from '../../../../providers/paypro/paypro';
import { ReplaceParametersProvider } from '../../../../providers/replace-parameters/replace-parameters';
import { TxFormatProvider } from '../../../../providers/tx-format/tx-format';
import { WalletProvider } from '../../../../providers/wallet/wallet';
import { ConfirmCardPurchasePage } from '../confirm-card-purchase/confirm-card-purchase';

import * as moment from 'moment';

describe('ConfirmCardPurchasePage', () => {
  let fixture: ComponentFixture<ConfirmCardPurchasePage>;
  let instance: ConfirmCardPurchasePage;
  let testBed;
  let payproProvider;
  let currencyProvider;
  let onGoingProcessProvider;
  let txFormatProvider;
  let walletProvider;
  let formatCurrencyPipeSpy;
  let replaceParametersProvider;

  var currencies = ['xrp', 'btc', 'eth', 'bch', 'usdc'];

  var payproCurrencyInvoices = {
    xrp: {
      invoice: {
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
      accessKey: '',
      totalDiscount: 10
    },
    btc: {
      invoice: {
        url: 'https://test.bitpay.com/invoice?id=QkVbrWd2vKnu2ddLWAN2u4',
        status: 'new',
        price: 1,
        currency: 'USD',
        invoiceTime: 1582051602013,
        expirationTime: 1582052502013,
        currentTime: 1582052366870,
        id: 'QkVbrWd2vKnu2ddLWAN2u4',
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
          BTC: 10000,
          BCH: 240500,
          ETH: 3560000000000000,
          GUSD: 100,
          PAX: 1000000000000000000,
          USDC: 1000000,
          XRP: 3372795
        },
        paymentTotals: {
          BTC: 10100,
          BCH: 240500,
          ETH: 3560000000000000,
          GUSD: 100,
          PAX: 1000000000000000000,
          USDC: 1000000,
          XRP: 3372795
        },
        paymentDisplayTotals: {
          BTC: '0.000101',
          BCH: '0.002405',
          ETH: '0.003560',
          GUSD: '1.00',
          PAX: '1.00',
          USDC: '1.00',
          XRP: '3.372795'
        },
        paymentDisplaySubTotals: {
          BTC: '0.000100',
          BCH: '0.002405',
          ETH: '0.003560',
          GUSD: '1.00',
          PAX: '1.00',
          USDC: '1.00',
          XRP: '3.372795'
        },
        exchangeRates: {
          BTC: {
            USD: 10009.589999999998,
            BCH: 24.032629051620646,
            ETH: 35.63019257466272,
            GUSD: 10009.589999999998,
            PAX: 10009.589999999998,
            USDC: 10009.589999999998,
            XRP: 33756.879805746656
          },
          BCH: {
            USD: 415.79999999999995,
            BTC: 0.04154012148337595,
            ETH: 1.4800840066920584,
            GUSD: 415.79999999999995,
            PAX: 415.79999999999995,
            USDC: 415.79999999999995,
            XRP: 1402.2662889518413
          },
          ETH: {
            USD: 280.88,
            BTC: 0.028061061381074164,
            BCH: 0.6743817527010804,
            GUSD: 280.88,
            PAX: 280.88,
            USDC: 280.88,
            XRP: 947.2548226089302
          },
          GUSD: {
            USD: 1,
            BTC: 0.00009990409207161125,
            BCH: 0.0024009603841536613,
            ETH: 0.0035596055956999962,
            PAX: 1,
            USDC: 1,
            XRP: 3.372453797382976
          },
          PAX: {
            USD: 1,
            BTC: 0.00009990409207161125,
            BCH: 0.0024009603841536613,
            ETH: 0.0035596055956999962,
            GUSD: 1,
            USDC: 1,
            XRP: 3.372453797382976
          },
          USDC: {
            USD: 1,
            BTC: 0.00009990409207161125,
            BCH: 0.0024009603841536613,
            ETH: 0.0035596055956999962,
            GUSD: 1,
            PAX: 1,
            XRP: 3.372453797382976
          },
          XRP: {
            USD: 0.29649,
            BTC: 0.00002962056425831202,
            BCH: 0.0007118607442977191,
            ETH: 0.0010553874630690918,
            GUSD: 0.29649,
            PAX: 0.29649,
            USDC: 0.29649
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
              'bitcoin:?r=https://test.bitpay.com/i/QkVbrWd2vKnu2ddLWAN2u4',
            BIP73: 'https://test.bitpay.com/i/QkVbrWd2vKnu2ddLWAN2u4',
            BIP21: 'bitcoin:mvXEW2EMXoRnoYqzozuDnUuwJ9wzid1agY?amount=0.000101',
            ADDRESS: 'mvXEW2EMXoRnoYqzozuDnUuwJ9wzid1agY'
          },
          BCH: {
            BIP72b:
              'bitcoincash:?r=https://test.bitpay.com/i/QkVbrWd2vKnu2ddLWAN2u4',
            BIP73: 'https://test.bitpay.com/i/QkVbrWd2vKnu2ddLWAN2u4',
            BIP21:
              'bitcoincash:qzjfw6jxrxxu8s20cp40rtgq5zqyhf3qhs82zzf0gu?amount=0.002405',
            ADDRESS: 'qzjfw6jxrxxu8s20cp40rtgq5zqyhf3qhs82zzf0gu'
          },
          ETH: {
            EIP681:
              'ethereum:?r=https://test.bitpay.com/i/QkVbrWd2vKnu2ddLWAN2u4'
          },
          GUSD: {
            EIP681b:
              'ethereum:?r=https://test.bitpay.com/i/QkVbrWd2vKnu2ddLWAN2u4'
          },
          PAX: {
            EIP681b:
              'ethereum:?r=https://test.bitpay.com/i/QkVbrWd2vKnu2ddLWAN2u4'
          },
          USDC: {
            EIP681b:
              'ethereum:?r=https://test.bitpay.com/i/QkVbrWd2vKnu2ddLWAN2u4'
          },
          XRP: {
            BIP72b:
              'ripple:?r=https://test.bitpay.com/i/QkVbrWd2vKnu2ddLWAN2u4',
            BIP73: 'https://test.bitpay.com/i/QkVbrWd2vKnu2ddLWAN2u4',
            RIP681: 'https://test.bitpay.com/i/QkVbrWd2vKnu2ddLWAN2u4',
            BIP21:
              'ripple:rhWuk1hvRBVwyVSexe6aXuDri72ZeDWBro?amount=3.372795?tag=830870593',
            ADDRESS: 'rhWuk1hvRBVwyVSexe6aXuDri72ZeDWBro',
            INVOICEID:
              'E70E86B38210997FDA8353A83602C50D948691398EAAA6C6ECC5894D3D156430',
            DESTINATIONTAG: 830870593
          }
        },
        token:
          '767cdhmwtn7XgW1QrSkuEwder1ngXavk3dMUw8KWPo3mnCrVuhMmSL8BayV5ULaZEJ'
      },
      accessKey: '',
      totalDiscount: 10
    },
    eth: {
      invoice: {
        url: 'https://test.bitpay.com/invoice?id=DaWRHwYKc3P4RhDsYYo2pE',
        status: 'new',
        price: 1,
        currency: 'USD',
        invoiceTime: 1582057526475,
        expirationTime: 1582058426475,
        currentTime: 1582058120560,
        id: 'DaWRHwYKc3P4RhDsYYo2pE',
        lowFeeDetected: false,
        amountPaid: 0,
        displayAmountPaid: '0',
        exceptionStatus: false,
        refundAddressRequestPending: false,
        buyerProvidedEmail: 'bsnowden@bitpay.com',
        buyerProvidedInfo: {
          selectedWallet: 'bitpay',
          selectedTransactionCurrency: 'ETH',
          emailAddress: 'bsnowden@bitpay.com'
        },
        paymentSubtotals: {
          BTC: 9900,
          BCH: 237900,
          ETH: 3506000000000000,
          GUSD: 100,
          PAX: 1000000000000000000,
          USDC: 1000000,
          XRP: 3332445
        },
        paymentTotals: {
          BTC: 10000,
          BCH: 237900,
          ETH: 3506000000000000,
          GUSD: 100,
          PAX: 1000000000000000000,
          USDC: 1000000,
          XRP: 3332445
        },
        paymentDisplayTotals: {
          BTC: '0.000100',
          BCH: '0.002379',
          ETH: '0.003506',
          GUSD: '1.00',
          PAX: '1.00',
          USDC: '1.00',
          XRP: '3.332445'
        },
        paymentDisplaySubTotals: {
          BTC: '0.000099',
          BCH: '0.002379',
          ETH: '0.003506',
          GUSD: '1.00',
          PAX: '1.00',
          USDC: '1.00',
          XRP: '3.332445'
        },
        exchangeRates: {
          BTC: {
            USD: 10091.99,
            BCH: 23.99997621878716,
            ETH: 35.37449612674822,
            GUSD: 10091.99,
            PAX: 10091.99,
            USDC: 10091.99,
            XRP: 33614.195783232855
          },
          BCH: {
            USD: 420.3999999999999,
            BTC: 0.04165675782798255,
            ETH: 1.473588278593711,
            GUSD: 420.3999999999999,
            PAX: 420.3999999999999,
            USDC: 420.3999999999999,
            XRP: 1400.2598008193715
          },
          ETH: {
            USD: 285.2,
            BTC: 0.02826000792707095,
            BCH: 0.6782401902497027,
            GUSD: 285.2,
            PAX: 285.2,
            USDC: 285.2,
            XRP: 949.9383805748926
          },
          GUSD: {
            USD: 1,
            BTC: 0.00009908838684106223,
            BCH: 0.0023781212841854937,
            ETH: 0.0035052052297662025,
            PAX: 1,
            USDC: 1,
            XRP: 3.330779735536089
          },
          PAX: {
            USD: 1,
            BTC: 0.00009908838684106223,
            BCH: 0.0023781212841854937,
            ETH: 0.0035052052297662025,
            GUSD: 1,
            USDC: 1,
            XRP: 3.330779735536089
          },
          USDC: {
            USD: 1,
            BTC: 0.00009908838684106223,
            BCH: 0.0023781212841854937,
            ETH: 0.0035052052297662025,
            GUSD: 1,
            PAX: 1,
            XRP: 3.330779735536089
          },
          XRP: {
            USD: 0.30008,
            BTC: 0.000029734443123265956,
            BCH: 0.0007136266349583829,
            ETH: 0.0010518419853482422,
            GUSD: 0.30008,
            PAX: 0.30008,
            USDC: 0.30008
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
              'bitcoin:?r=https://test.bitpay.com/i/DaWRHwYKc3P4RhDsYYo2pE',
            BIP73: 'https://test.bitpay.com/i/DaWRHwYKc3P4RhDsYYo2pE',
            BIP21: 'bitcoin:mm5zTXF88QfkowdBV4wh8YaZgZodbDszP7?amount=0.0001',
            ADDRESS: 'mm5zTXF88QfkowdBV4wh8YaZgZodbDszP7'
          },
          BCH: {
            BIP72b:
              'bitcoincash:?r=https://test.bitpay.com/i/DaWRHwYKc3P4RhDsYYo2pE',
            BIP73: 'https://test.bitpay.com/i/DaWRHwYKc3P4RhDsYYo2pE',
            BIP21:
              'bitcoincash:qq73s225dx30yy8n0sxgkq0zc2vff7ct9cha8znk5c?amount=0.002379',
            ADDRESS: 'qq73s225dx30yy8n0sxgkq0zc2vff7ct9cha8znk5c'
          },
          ETH: {
            EIP681:
              'ethereum:?r=https://test.bitpay.com/i/DaWRHwYKc3P4RhDsYYo2pE'
          },
          GUSD: {
            EIP681b:
              'ethereum:?r=https://test.bitpay.com/i/DaWRHwYKc3P4RhDsYYo2pE'
          },
          PAX: {
            EIP681b:
              'ethereum:?r=https://test.bitpay.com/i/DaWRHwYKc3P4RhDsYYo2pE'
          },
          USDC: {
            EIP681b:
              'ethereum:?r=https://test.bitpay.com/i/DaWRHwYKc3P4RhDsYYo2pE'
          },
          XRP: {
            BIP72b:
              'ripple:?r=https://test.bitpay.com/i/DaWRHwYKc3P4RhDsYYo2pE',
            BIP73: 'https://test.bitpay.com/i/DaWRHwYKc3P4RhDsYYo2pE',
            RIP681: 'https://test.bitpay.com/i/DaWRHwYKc3P4RhDsYYo2pE',
            BIP21:
              'ripple:rhWuk1hvRBVwyVSexe6aXuDri72ZeDWBro?amount=3.332445?tag=830895303',
            ADDRESS: 'rhWuk1hvRBVwyVSexe6aXuDri72ZeDWBro',
            INVOICEID:
              'B9FEE2E4DF777599241D0494DBAE5EEBF87D437EF69D3730C2C74F72EBF179B7',
            DESTINATIONTAG: 830895303
          }
        },
        token:
          '767cdhmwtn7XgW1QrSkuEwfRf6VgbZvhbjjwZ7V6QL3FKugdEMQxu3SoMGGg87eCHT'
      },
      accessKey: '',
      totalDiscount: 10
    },
    bch: {
      invoice: {
        url: 'https://test.bitpay.com/invoice?id=2AzAQr31hLYvTEr78VAMQG',
        status: 'new',
        price: 1,
        currency: 'USD',
        invoiceTime: 1582059997577,
        expirationTime: 1582060897577,
        currentTime: 1582060280484,
        id: '2AzAQr31hLYvTEr78VAMQG',
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
          BTC: 9700,
          BCH: 234000,
          ETH: 3494000000000000,
          GUSD: 100,
          PAX: 1000000000000000000,
          USDC: 1000000,
          XRP: 3302510
        },
        paymentTotals: {
          BTC: 9800,
          BCH: 234000,
          ETH: 3494000000000000,
          GUSD: 100,
          PAX: 1000000000000000000,
          USDC: 1000000,
          XRP: 3302510
        },
        paymentDisplayTotals: {
          BTC: '0.000098',
          BCH: '0.002340',
          ETH: '0.003494',
          GUSD: '1.00',
          PAX: '1.00',
          USDC: '1.00',
          XRP: '3.302510'
        },
        paymentDisplaySubTotals: {
          BTC: '0.000097',
          BCH: '0.002340',
          ETH: '0.003494',
          GUSD: '1.00',
          PAX: '1.00',
          USDC: '1.00',
          XRP: '3.302510'
        },
        exchangeRates: {
          BTC: {
            USD: 10268.48,
            BCH: 23.99896529750104,
            ETH: 35.8649016799972,
            GUSD: 10268.48,
            PAX: 10268.48,
            USDC: 10268.48,
            XRP: 33888.25451305238
          },
          BCH: {
            USD: 427.4,
            BTC: 0.04161753350386721,
            ETH: 1.4927875379833049,
            GUSD: 427.4,
            PAX: 427.4,
            USDC: 427.4,
            XRP: 1410.5145044717997
          },
          ETH: {
            USD: 286.21,
            BTC: 0.027869336135100217,
            BCH: 0.6689153465554564,
            GUSD: 286.21,
            PAX: 286.21,
            USDC: 286.21,
            XRP: 944.5562852711131
          },
          GUSD: {
            USD: 1,
            BTC: 0.00009737373304601593,
            BCH: 0.0023371487598457647,
            ETH: 0.0034927176836296323,
            PAX: 1,
            USDC: 1,
            XRP: 3.3002211148146925
          },
          PAX: {
            USD: 1,
            BTC: 0.00009737373304601593,
            BCH: 0.0023371487598457647,
            ETH: 0.0034927176836296323,
            GUSD: 1,
            USDC: 1,
            XRP: 3.3002211148146925
          },
          USDC: {
            USD: 1,
            BTC: 0.00009737373304601593,
            BCH: 0.0023371487598457647,
            ETH: 0.0034927176836296323,
            GUSD: 1,
            PAX: 1,
            XRP: 3.3002211148146925
          },
          XRP: {
            USD: 0.3028,
            BTC: 0.000029484766366333618,
            BCH: 0.0007076886444812976,
            ETH: 0.0010575949146030526,
            GUSD: 0.3028,
            PAX: 0.3028,
            USDC: 0.3028
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
              'bitcoin:?r=https://test.bitpay.com/i/2AzAQr31hLYvTEr78VAMQG',
            BIP73: 'https://test.bitpay.com/i/2AzAQr31hLYvTEr78VAMQG',
            BIP21: 'bitcoin:mhkXVm6RQRKR6YaxPrUjdxYu1XYzfqJutu?amount=0.000098',
            ADDRESS: 'mhkXVm6RQRKR6YaxPrUjdxYu1XYzfqJutu'
          },
          BCH: {
            BIP72b:
              'bitcoincash:?r=https://test.bitpay.com/i/2AzAQr31hLYvTEr78VAMQG',
            BIP73: 'https://test.bitpay.com/i/2AzAQr31hLYvTEr78VAMQG',
            BIP21:
              'bitcoincash:qqvgzhly963c35amtuqu2xajlrf3axswqs8hty3qql?amount=0.00234',
            ADDRESS: 'qqvgzhly963c35amtuqu2xajlrf3axswqs8hty3qql'
          },
          ETH: {
            EIP681:
              'ethereum:?r=https://test.bitpay.com/i/2AzAQr31hLYvTEr78VAMQG'
          },
          GUSD: {
            EIP681b:
              'ethereum:?r=https://test.bitpay.com/i/2AzAQr31hLYvTEr78VAMQG'
          },
          PAX: {
            EIP681b:
              'ethereum:?r=https://test.bitpay.com/i/2AzAQr31hLYvTEr78VAMQG'
          },
          USDC: {
            EIP681b:
              'ethereum:?r=https://test.bitpay.com/i/2AzAQr31hLYvTEr78VAMQG'
          },
          XRP: {
            BIP72b:
              'ripple:?r=https://test.bitpay.com/i/2AzAQr31hLYvTEr78VAMQG',
            BIP73: 'https://test.bitpay.com/i/2AzAQr31hLYvTEr78VAMQG',
            RIP681: 'https://test.bitpay.com/i/2AzAQr31hLYvTEr78VAMQG',
            BIP21:
              'ripple:rhWuk1hvRBVwyVSexe6aXuDri72ZeDWBro?amount=3.30251?tag=830906017',
            ADDRESS: 'rhWuk1hvRBVwyVSexe6aXuDri72ZeDWBro',
            INVOICEID:
              '9C2CE9ED8DC3524A50324F073431CA4F8EFEDE77DE6DCCC0D52D28E04CC7F9ED',
            DESTINATIONTAG: 830906017
          }
        },
        token:
          '767cdhmwtn7XgW1QrSkuEwnniSXKwYD5SDzyi6q1HMSwKE8cDUwRBkhDvENYfYkX9t'
      },
      accessKey: '',
      totalDiscount: 10
    },
    usdc: {
      invoice: {
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
            BIP72b:
              'bitcoin:?r=https://test.bitpay.com/i/WS2wmcyMcGJYzVNY9daD7w',
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
            EIP681:
              'ethereum:?r=https://test.bitpay.com/i/WS2wmcyMcGJYzVNY9daD7w'
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
            BIP72b:
              'ripple:?r=https://test.bitpay.com/i/WS2wmcyMcGJYzVNY9daD7w',
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
      },
      accessKey: '',
      totalDiscount: ''
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
    },
    btc: {
      time: '2020-02-18T18:46:42.013Z',
      expires: '2020-02-18T19:01:42.013Z',
      memo:
        'Payment request for BitPay invoice QkVbrWd2vKnu2ddLWAN2u4 for merchant Ross Enterprise',
      paymentUrl: 'https://test.bitpay.com/i/QkVbrWd2vKnu2ddLWAN2u4',
      paymentId: 'QkVbrWd2vKnu2ddLWAN2u4',
      chain: 'BTC',
      network: 'test',
      instructions: [
        {
          type: 'transaction',
          requiredFeeRate: 1,
          outputs: [
            {
              amount: 10100,
              address: 'mvXEW2EMXoRnoYqzozuDnUuwJ9wzid1agY'
            }
          ],
          toAddress: 'mvXEW2EMXoRnoYqzozuDnUuwJ9wzid1agY',
          amount: 10100
        }
      ]
    },
    eth: {
      time: '2020-02-18T20:25:26.475Z',
      expires: '2020-02-18T20:40:26.475Z',
      memo:
        'Payment request for BitPay invoice DaWRHwYKc3P4RhDsYYo2pE for merchant Ross Enterprise',
      paymentUrl: 'https://test.bitpay.com/i/DaWRHwYKc3P4RhDsYYo2pE',
      paymentId: 'DaWRHwYKc3P4RhDsYYo2pE',
      chain: 'ETH',
      network: 'test',
      instructions: [
        {
          type: 'transaction',
          value: 3506000000000000,
          to: '0xa14513bb6ec5276651c6bb8ffddc90d363a157f1',
          data:
            '0xb6b4af05000000000000000000000000000000000000000000000000000c74b03c952000000000000000000000000000000000000000000000000000000000027d064ee0000000000000000000000000000000000000000000000000000001705d320e65dff3d79bf6ec87166b7230e8967668706bc52a715495f93890d57094640b8311aea6d4e24b4c7af2f89822aa8d381eb7dd13ad871357d981a5426b8eeed12854000000000000000000000000000000000000000000000000000000000000001b416642d2693806b3d6130fb88031934a4700898bea04e20c2547bec50898f49658cbd617285c0c796470e83a44532b969f04f334fa21569725956434206677010000000000000000000000000000000000000000000000000000000000000000',
          gasPrice: 10687500000,
          amount: 3506000000000000,
          toAddress: '0xa14513bb6ec5276651c6bb8ffddc90d363a157f1'
        }
      ]
    },
    bch: {
      time: '2020-02-18T21:06:37.577Z',
      expires: '2020-02-18T21:21:37.577Z',
      memo:
        'Payment request for BitPay invoice 2AzAQr31hLYvTEr78VAMQG for merchant Ross Enterprise',
      paymentUrl: 'https://test.bitpay.com/i/2AzAQr31hLYvTEr78VAMQG',
      paymentId: '2AzAQr31hLYvTEr78VAMQG',
      chain: 'BCH',
      network: 'test',
      instructions: [
        {
          type: 'transaction',
          requiredFeeRate: 1,
          outputs: [
            {
              amount: 234000,
              address: 'qqvgzhly963c35amtuqu2xajlrf3axswqs8hty3qql'
            }
          ],
          amount: 234000,
          toAddress: 'qqvgzhly963c35amtuqu2xajlrf3axswqs8hty3qql'
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
      message: ' Gift Card',
      customData: {
        giftCardName: 'Visa Debit Card',
        service: 'giftcards'
      },
      payProUrl: 'https://test.bitpay.com/i/LQiQz1oti8k98h1csWCkJ',
      excludeUnconfirmedUtxos: true,
      invoiceID:
        '9F1B853E79C8651CB38485E3C2467531AFC3F0B96CCF6D17EF3F4274FC7095FF',
      tokenAddress: '',
      feeLevel: 'normal',
      origToAddress: 'rKpTKoJSFbCoZkwydRv7NWTiBgNrdTXJ24',
      from: 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV',
      giftData: {
        currency: 'usd',
        date: moment().unix() * 1000,
        amount: 5000,
        uuid: undefined,
        accessKey: '',
        invoiceId: 'LQiQz1oti8k98h1csWCkJ',
        invoiceUrl: 'https://test.bitpay.com/invoice?id=LQiQz1oti8k98h1csWCkJ',
        invoiceTime: 1580928152576,
        name: 'Visa Debit Card'
      }
    },
    btc: {
      coin: 'btc',
      amount: 10100,
      toAddress: 'mvXEW2EMXoRnoYqzozuDnUuwJ9wzid1agY',
      outputs: [
        {
          toAddress: 'mvXEW2EMXoRnoYqzozuDnUuwJ9wzid1agY',
          amount: 10100,
          message: undefined,
          data: undefined
        }
      ],
      message: ' Gift Card',
      customData: { giftCardName: 'Visa Debit Card', service: 'giftcards' },
      payProUrl: 'https://test.bitpay.com/i/QkVbrWd2vKnu2ddLWAN2u4',
      excludeUnconfirmedUtxos: true,
      tokenAddress: '',
      feeLevel: 'normal',
      origToAddress: 'mvXEW2EMXoRnoYqzozuDnUuwJ9wzid1agY',
      from: 'n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF'
    },
    eth: {
      coin: 'eth',
      amount: 3506000000000000,
      toAddress: '0xa14513bb6ec5276651c6bb8ffddc90d363a157f1',
      outputs: [
        {
          toAddress: '0xa14513bb6ec5276651c6bb8ffddc90d363a157f1',
          amount: 3506000000000000,
          message: undefined,
          data:
            '0xb6b4af05000000000000000000000000000000000000000000000000000c74b03c952000000000000000000000000000000000000000000000000000000000027d064ee0000000000000000000000000000000000000000000000000000001705d320e65dff3d79bf6ec87166b7230e8967668706bc52a715495f93890d57094640b8311aea6d4e24b4c7af2f89822aa8d381eb7dd13ad871357d981a5426b8eeed12854000000000000000000000000000000000000000000000000000000000000001b416642d2693806b3d6130fb88031934a4700898bea04e20c2547bec50898f49658cbd617285c0c796470e83a44532b969f04f334fa21569725956434206677010000000000000000000000000000000000000000000000000000000000000000'
        }
      ],
      message: ' Gift Card',
      customData: { giftCardName: 'Visa Debit Card', service: 'giftcards' },
      payProUrl: 'https://test.bitpay.com/i/DaWRHwYKc3P4RhDsYYo2pE',
      excludeUnconfirmedUtxos: true,
      tokenAddress: '',
      feeLevel: 'normal',
      origToAddress: '0xa14513bb6ec5276651c6bb8ffddc90d363a157f1',
      from: '0x635B4764D1939DfAcD3a8014726159abC277BecC'
    },
    bch: {
      coin: 'bch',
      amount: 234000,
      toAddress: 'qqvgzhly963c35amtuqu2xajlrf3axswqs8hty3qql',
      outputs: [
        {
          toAddress: 'qqvgzhly963c35amtuqu2xajlrf3axswqs8hty3qql',
          amount: 234000,
          message: undefined,
          data: undefined
        }
      ],
      message: ' Gift Card',
      customData: { giftCardName: 'Visa Debit Card', service: 'giftcards' },
      payProUrl: 'https://test.bitpay.com/i/2AzAQr31hLYvTEr78VAMQG',
      excludeUnconfirmedUtxos: true,
      tokenAddress: '',
      feeLevel: 'normal',
      origToAddress: 'qqvgzhly963c35amtuqu2xajlrf3axswqs8hty3qql',
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
      customData: { giftCardName: 'Visa Debit Card', service: 'giftcards' },
      message: ' Gift Card',
      payProUrl: 'https://test.bitpay.com/i/WS2wmcyMcGJYzVNY9daD7w',
      excludeUnconfirmedUtxos: true,
      tokenAddress: '',
      feeLevel: 'normal',
      origToAddress: '0x44d69d16C711BF966E3d00A46f96e02D16BDdf1f',
      from: '0x635B4764D1939DfAcD3a8014726159abC277BecC'
    }
  };

  beforeEach(async(() => {
    TestUtils.configurePageTestingModule([ConfirmCardPurchasePage]).then(
      testEnv => {
        fixture = testEnv.fixture;
        instance = testEnv.instance;
        testBed = testEnv.testBed;

        payproProvider = testBed.get(PayproProvider);
        currencyProvider = testBed.get(CurrencyProvider);
        onGoingProcessProvider = testBed.get(OnGoingProcessProvider);
        txFormatProvider = testBed.get(TxFormatProvider);
        walletProvider = testBed.get(WalletProvider);
        formatCurrencyPipeSpy = spyOn(
          FormatCurrencyPipe.prototype,
          'transform'
        ).and.returnValue('$' + '12');
        replaceParametersProvider = testBed.get(ReplaceParametersProvider);
        spyOn(replaceParametersProvider, 'replace').and.returnValue(
          ' Gift Card'
        );
        fixture.detectChanges();
      }
    );
  }));

  afterEach(() => {
    fixture.destroy();
  });

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
    it('paypro test for ' + currency, async () => {
      let parseAmountObj = {
        amount: 1000,
        currency,
        alternativeIsoCode: 'USD',
        amountSat: '',
        amountUnitStr: ''
      };

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
          } else {
          }
        }
      };

      instance.amount = 5000;
      instance.currency = 'usd';
      instance.wallet = wallet;
      instance.totalAmount = 1000;
      instance.activationFee = 40;
      instance.cardConfig = {
        name: 'Visa Debit Card',
        emailRequired: true,
        cardImage: '',
        currency: '',
        displayName: '',
        logo: '',
        logoBackgroundColor: '',
        icon: '',
        terms: '',
        website: '',
        defaultClaimCodeType: ClaimCodeType.code
      };

      spyOn(currencyProvider, 'isERCToken').and.returnValue(
        Promise.resolve(isERCTokenHelper(currency))
      );
      spyOn(instance as any, 'promptEmail').and.returnValue('test@bitpay.com');
      spyOn(onGoingProcessProvider, 'set');
      spyOn(onGoingProcessProvider, 'clear');

      spyOn(payproProvider as any, 'getPayProDetails').and.returnValue(
        Promise.resolve(payproDetailsForCurrency)
      );

      spyOn(txFormatProvider as any, 'parseAmount').and.returnValue(
        Promise.resolve(parseAmountObj)
      );

      spyOn(txFormatProvider as any, 'formatAmountStr').and.returnValue('');

      spyOn(currencyProvider as any, 'isUtxoCoin').and.returnValue(
        isUTXOHelper(currency)
      );

      let createInvoiceSpy = spyOn(
        instance as any,
        'createInvoice'
      ).and.returnValue(Promise.resolve(testInvoice));

      spyOn(currencyProvider as any, 'getChain').and.returnValue(
        instance.wallet.coin.toLowerCase()
      );
      spyOn(instance as any, 'satToFiat').and.callThrough();
      let initializeSpy = spyOn(
        instance as any,
        'initialize'
      ).and.callThrough();
      spyOn(walletProvider, 'getAddress').and.returnValue(
        Promise.resolve(mockedAddress)
      );
      let createTxSpy = spyOn(instance as any, 'createTx').and.callThrough();
      let walletSpyCreateTx = spyOn(
        walletProvider as any,
        'createTx'
      ).and.callThrough();
      spyOn(instance as any, 'logGiftCardPurchaseEvent').and.callFake(() => {});

      await instance.onWalletSelect(instance.wallet);
      expect(currencyProvider.isERCToken).toHaveBeenCalled();
      expect(onGoingProcessProvider.set).toHaveBeenCalled();
      expect(createInvoiceSpy).toHaveBeenCalled();
      expect(initializeSpy).toHaveBeenCalled();
      expect(createTxSpy).toHaveBeenCalled();
      expect(walletSpyCreateTx).toHaveBeenCalled();
      expect(formatCurrencyPipeSpy).toHaveBeenCalled();

      let key = 'giftData';

      delete instance.tx[key];
      delete expectedCreatedTx[key];

      expect((instance as any).tx).toEqual(expectedCreatedTx);
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
});
