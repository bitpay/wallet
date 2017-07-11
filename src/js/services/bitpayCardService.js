'use strict';

angular.module('copayApp.services').factory('bitpayCardService', function($log, $rootScope, $filter, lodash, storageService, bitauthService, platformInfo, moment, appIdentityService, bitpayService, nextStepsService, txFormatService, appConfigService) {
  var root = {};

  var _setError = function(msg, e) {
    $log.error(msg);
    var error = (e && e.data && e.data.error) ? e.data.error : msg;
    return error;
  };

  var _processTransactions = function(invoices, history) {
    invoices = invoices ||  [];
    for (var i = 0; i < invoices.length; i++) {
      var matched = false;
      for (var j = 0; j < history.length; j++) {
        if (history[j].description[0] && history[j].description[0].indexOf(invoices[i].id) > -1) {
          matched = true;
        }
      }
      var isInvoiceLessThanOneDayOld = moment() < moment(new Date(invoices[i].invoiceTime)).add(1, 'day');
      if (!matched && isInvoiceLessThanOneDayOld) {
        var isInvoiceUnderpaid = invoices[i].exceptionStatus === 'paidPartial';

        if (['paid', 'confirmed', 'complete'].indexOf(invoices[i].status) >= 0 ||
          (invoices[i].status === 'invalid' || isInvoiceUnderpaid)) {

          history.unshift({
            timestamp: new Date(invoices[i].invoiceTime),
            description: invoices[i].itemDesc,
            amount: invoices[i].price,
            type: '00611 = Client Funded Deposit',
            pending: true,
            status: invoices[i].status,
            transactionId: invoices[i].transactions && invoices[i].transactions[0] ? invoices[i].transactions[0].txid : '',
            exceptionStatus: invoices[i].exceptionStatus
          });
        }
      }
    }
    return history;
  };

  root.sync = function(apiContext, cb) {
    var json = {
      method: 'getDebitCards'
    };
    // Get Debit Cards
    bitpayService.post('/api/v2/' + apiContext.token, json, function(data) {
      if (data && data.data.error) return cb(data.data.error);
      $log.info('BitPay Get Debit Cards: SUCCESS');

      var cards = [];

      lodash.each(data.data.data, function(x) {
        var n = {};

        if (!x.eid || !x.id || !x.lastFourDigits || !x.token) {
          $log.warn('BAD data from BitPay card' + JSON.stringify(x));
          return;
        }

        n.eid = x.eid;
        n.id = x.id;
        n.lastFourDigits = x.lastFourDigits;
        n.token = x.token;
        n.currency = x.currency;
        n.country = x.country;
        cards.push(n);
      });

      storageService.setBitpayDebitCards(bitpayService.getEnvironment().network, apiContext.pairData.email, cards, function(err) {
        root.registerNextStep();
        return cb(err, cards);
      });
    }, function(data) {
      return cb(_setError('BitPay Card Error: Get Debit Cards', data));
    });
  };

  root.setCurrencySymbol = function(card) {
    // Sets a currency symbol.
    // Uses the currency code if no symbol is mapped (should never happen).
    // Backaward compatibility for FirstView cards (all USD).
    // This avoids users having to re-pair their account.
    if (!card.currency) {
      card.currency = 'USD';
    }
    card.currencySymbol = root.currencySymbols[card.currency] || card.currency + ' ';
  };

  // opts: range
  root.getHistory = function(cardId, opts, cb) {
    var invoices, transactions;
    opts = opts || {};

    var json = {
      method: 'getInvoiceHistory',
      params: JSON.stringify(opts)
    };

    appIdentityService.getIdentity(bitpayService.getEnvironment().network, function(err, appIdentity) {
      if (err) return cb(err);

      root.getCards(function(err, data) {
        if (err) return cb(err);
        var card = lodash.find(data, {
          id: cardId
        });

        if (!card)
          return cb(_setError('Card not found'));

        // Get invoices
        bitpayService.post('/api/v2/' + card.token, json, function(data) {
          $log.info('BitPay Get Invoices: SUCCESS');
          invoices = data.data.data || [];

          if (lodash.isEmpty(invoices))
            $log.info('No invoices');

          json = {
            method: 'getTransactionHistory',
            params: JSON.stringify(opts)
          };
          // Get transactions list
          bitpayService.post('/api/v2/' + card.token, json, function(data) {
            $log.info('BitPay Get Transactions: SUCCESS');
            transactions = data.data.data || {};
            transactions['txs'] = _processTransactions(invoices, transactions.transactionList);

            root.setLastKnownBalance(cardId, transactions.currentCardBalance, function() {});

            return cb(data.data.error, transactions);
          }, function(data) {
            return cb(_setError('BitPay Card Error: Get Transactions', data));
          });
        }, function(data) {
          return cb(_setError('BitPay Card Error: Get Invoices', data));
        });
      });
    });
  };

  root.topUp = function(cardId, opts, cb) {
    opts = opts || {};
    var json = {
      method: 'generateTopUpInvoice',
      params: JSON.stringify(opts)
    };
    appIdentityService.getIdentity(bitpayService.getEnvironment().network, function(err, appIdentity) {
      if (err) return cb(err);

      root.getCards(function(err, data) {
        if (err) return cb(err);

        var card = lodash.find(data, {
          id: cardId
        });

        if (!card)
          return cb(_setError('Card not found'));

        bitpayService.post('/api/v2/' + card.token, json, function(data) {
          $log.info('BitPay TopUp: SUCCESS');
          if (data.data.error) {
            return cb(data.data.error);
          } else {
            return cb(null, data.data.data.invoice);
          }
        }, function(data) {
          return cb(_setError('BitPay Card Error: TopUp', data));
        });
      });
    });
  };

  root.getInvoice = function(id, cb) {
    bitpayService.get('/invoices/' + id, function(data) {
      $log.info('BitPay Get Invoice: SUCCESS');
      return cb(data.data.error, data.data.data);
    }, function(data) {
      return cb(_setError('BitPay Card Error: Get Invoice', data));
    });
  };

  // get all cards, for all accounts.
  root.getCards = function(cb) {
    storageService.getBitpayDebitCards(bitpayService.getEnvironment().network, cb);
  };

  root.getLastKnownBalance = function(cardId, cb) {
    storageService.getBalanceCache(cardId, cb);
  };

  root.addLastKnownBalance = function(card, cb) {
    var now = Math.floor(Date.now() / 1000);
    var showRange = 600; // 10min;

    root.getLastKnownBalance(card.eid, function(err, data) {
      if (data) {
        data = JSON.parse(data);
        card.balance = data.balance;
        card.updatedOn = (data.updatedOn < now - showRange) ? data.updatedOn : null;
      }
      return cb();
    });
  };

  root.setLastKnownBalance = function(cardId, balance, cb) {

    storageService.setBalanceCache(cardId, {
      balance: balance,
      updatedOn: Math.floor(Date.now() / 1000),
    }, cb);
  };

  root.remove = function(cardId, cb) {
    storageService.removeBitpayDebitCard(bitpayService.getEnvironment().network, cardId, function(err) {
      if (err) {
        $log.error('Error removing BitPay debit card: ' + err);
        return cb(err);
      }
      root.registerNextStep();
      storageService.removeBalanceCache(cardId, cb);
    });
  };

  root.getRates = function(currency, cb) {
    bitpayService.get('/rates/' + currency, function(data) {
      $log.info('BitPay Get Rates: SUCCESS');
      return cb(data.data.error, data.data.data);
    }, function(data) {
      return cb(_setError('BitPay Error: Get Rates', data));
    });
  };


  root.get = function(opts, cb) {
    root.getCards(function(err, cards) {
      if (err) return;

      if (lodash.isEmpty(cards)) {
        return cb();
      }

      if (opts.cardId) {
        cards = lodash.filter(cards, function(x) {
          return opts.cardId == x.eid;
        });
      }

      // Async, no problem
      lodash.each(cards, function(x) {

        root.setCurrencySymbol(x);
        root.addLastKnownBalance(x, function() {});

        // async refresh
        if (!opts.noRefresh) {
          root.getHistory(x.id, {}, function(err, data) {
            if (err) return;
            root.addLastKnownBalance(x, function() {});
          });
        }
      });

      return cb(null, cards);
    });
  };

  /*
   * CONSTANTS
   */

  root.currencySymbols = {
    'EUR': '€',
    'GBP': '£',
    'USD': '$'
  };

  root.bpTranCodes = {
    '00611': {
      merchant: {
        name: 'BitPay',
        city: 'Atlanta',
        state: 'GA'
      },
      category: 'bp001',
      description: 'Top-Up'
    },
    '602': {
      merchant: {
        name: 'ATM Withdrawal Fee',
      },
      category: 'bp002',
      description: ''
    },
    '604': {
      merchant: {
        name: 'Foreign Transaction Fee',
      },
      category: 'bp002',
      description: ''
    },
    '606': {
      merchant: {
        name: 'International ATM Fee',
      },
      category: 'bp002',
      description: ''
    },
    '00240': {
      merchant: {
        name: 'ACH Debit Fee',
      },
      category: 'bp002',
      description: ''
    },
    '5032': {
      merchant: {
        name: 'ACH Debit',
      },
      category: 'bp002',
      description: ''
    },
    '37': {
      merchant: {
        name: 'ACH / Payroll Deposit',
      },
      category: 'bp002',
      description: ''
    },
    '10036': {
      merchant: {
        name: 'Inactivity Fee (90 days)',
      },
      category: 'bp002',
      description: ''
    },
    '9991': { // General assignment of a fee for WC card
      merchant: {
        name: 'Transaction Fee',
      },
      category: 'bp002',
      description: ''
    }
  };

  root.iconMap = {
    742: 'medical',
    763: 'plant',
    780: 'plant',
    1520: 'repair',
    1711: 'repair',
    1731: 'repair',
    1740: 'repair',
    1750: 'repair',
    1761: 'repair',
    1771: 'repair',
    1799: 'repair',
    2741: 'books',
    2791: 'books',
    2842: 'clean',
    3000: 'airplane',
    3001: 'airplane',
    3002: 'airplane',
    3003: 'airplane',
    3004: 'airplane',
    3005: 'airplane',
    3006: 'airplane',
    3007: 'airplane',
    3008: 'airplane',
    3009: 'airplane',
    3010: 'airplane',
    3011: 'airplane',
    3012: 'airplane',
    3013: 'airplane',
    3014: 'airplane',
    3015: 'airplane',
    3016: 'airplane',
    3017: 'airplane',
    3018: 'airplane',
    3019: 'airplane',
    3020: 'airplane',
    3021: 'airplane',
    3022: 'airplane',
    3023: 'airplane',
    3024: 'airplane',
    3025: 'airplane',
    3026: 'airplane',
    3027: 'airplane',
    3028: 'airplane',
    3029: 'airplane',
    3030: 'airplane',
    3031: 'airplane',
    3032: 'airplane',
    3033: 'airplane',
    3034: 'airplane',
    3035: 'airplane',
    3036: 'airplane',
    3037: 'airplane',
    3038: 'airplane',
    3039: 'airplane',
    3040: 'airplane',
    3041: 'airplane',
    3042: 'airplane',
    3043: 'airplane',
    3044: 'airplane',
    3045: 'airplane',
    3046: 'airplane',
    3047: 'airplane',
    3048: 'airplane',
    3049: 'airplane',
    3050: 'airplane',
    3051: 'airplane',
    3052: 'airplane',
    3053: 'airplane',
    3054: 'airplane',
    3055: 'airplane',
    3056: 'airplane',
    3057: 'airplane',
    3058: 'airplane',
    3059: 'airplane',
    3060: 'airplane',
    3061: 'airplane',
    3062: 'airplane',
    3063: 'airplane',
    3064: 'airplane',
    3065: 'airplane',
    3066: 'airplane',
    3067: 'airplane',
    3068: 'airplane',
    3069: 'airplane',
    3070: 'airplane',
    3071: 'airplane',
    3072: 'airplane',
    3073: 'airplane',
    3074: 'airplane',
    3075: 'airplane',
    3076: 'airplane',
    3077: 'airplane',
    3078: 'airplane',
    3079: 'airplane',
    3080: 'airplane',
    3081: 'airplane',
    3082: 'airplane',
    3083: 'airplane',
    3084: 'airplane',
    3085: 'airplane',
    3086: 'airplane',
    3087: 'airplane',
    3088: 'airplane',
    3089: 'airplane',
    3090: 'airplane',
    3091: 'airplane',
    3092: 'airplane',
    3093: 'airplane',
    3094: 'airplane',
    3095: 'airplane',
    3096: 'airplane',
    3097: 'airplane',
    3098: 'airplane',
    3099: 'airplane',
    3100: 'airplane',
    3101: 'airplane',
    3102: 'airplane',
    3103: 'airplane',
    3104: 'airplane',
    3105: 'airplane',
    3106: 'airplane',
    3107: 'airplane',
    3108: 'airplane',
    3109: 'airplane',
    3110: 'airplane',
    3111: 'airplane',
    3112: 'airplane',
    3113: 'airplane',
    3114: 'airplane',
    3115: 'airplane',
    3116: 'airplane',
    3117: 'airplane',
    3118: 'airplane',
    3119: 'airplane',
    3120: 'airplane',
    3121: 'airplane',
    3122: 'airplane',
    3123: 'airplane',
    3124: 'airplane',
    3125: 'airplane',
    3126: 'airplane',
    3127: 'airplane',
    3128: 'airplane',
    3129: 'airplane',
    3130: 'airplane',
    3131: 'airplane',
    3132: 'airplane',
    3133: 'airplane',
    3134: 'airplane',
    3135: 'airplane',
    3136: 'airplane',
    3137: 'airplane',
    3138: 'airplane',
    3139: 'airplane',
    3140: 'airplane',
    3141: 'airplane',
    3142: 'airplane',
    3143: 'airplane',
    3144: 'airplane',
    3145: 'airplane',
    3146: 'airplane',
    3147: 'airplane',
    3148: 'airplane',
    3149: 'airplane',
    3150: 'airplane',
    3151: 'airplane',
    3152: 'airplane',
    3153: 'airplane',
    3154: 'airplane',
    3155: 'airplane',
    3156: 'airplane',
    3157: 'airplane',
    3158: 'airplane',
    3159: 'airplane',
    3160: 'airplane',
    3161: 'airplane',
    3162: 'airplane',
    3163: 'airplane',
    3164: 'airplane',
    3165: 'airplane',
    3166: 'airplane',
    3167: 'airplane',
    3168: 'airplane',
    3169: 'airplane',
    3170: 'airplane',
    3171: 'airplane',
    3172: 'airplane',
    3173: 'airplane',
    3174: 'airplane',
    3175: 'airplane',
    3176: 'airplane',
    3177: 'airplane',
    3178: 'airplane',
    3179: 'airplane',
    3180: 'airplane',
    3181: 'airplane',
    3182: 'airplane',
    3183: 'airplane',
    3184: 'airplane',
    3185: 'airplane',
    3186: 'airplane',
    3187: 'airplane',
    3188: 'airplane',
    3189: 'airplane',
    3190: 'airplane',
    3191: 'airplane',
    3192: 'airplane',
    3193: 'airplane',
    3194: 'airplane',
    3195: 'airplane',
    3196: 'airplane',
    3197: 'airplane',
    3198: 'airplane',
    3199: 'airplane',
    3200: 'airplane',
    3201: 'airplane',
    3202: 'airplane',
    3203: 'airplane',
    3204: 'airplane',
    3205: 'airplane',
    3206: 'airplane',
    3207: 'airplane',
    3208: 'airplane',
    3209: 'airplane',
    3210: 'airplane',
    3211: 'airplane',
    3212: 'airplane',
    3213: 'airplane',
    3214: 'airplane',
    3215: 'airplane',
    3216: 'airplane',
    3217: 'airplane',
    3218: 'airplane',
    3219: 'airplane',
    3220: 'airplane',
    3221: 'airplane',
    3222: 'airplane',
    3223: 'airplane',
    3224: 'airplane',
    3225: 'airplane',
    3226: 'airplane',
    3227: 'airplane',
    3228: 'airplane',
    3229: 'airplane',
    3230: 'airplane',
    3231: 'airplane',
    3232: 'airplane',
    3233: 'airplane',
    3234: 'airplane',
    3235: 'airplane',
    3236: 'airplane',
    3237: 'airplane',
    3238: 'airplane',
    3239: 'airplane',
    3240: 'airplane',
    3241: 'airplane',
    3242: 'airplane',
    3243: 'airplane',
    3244: 'airplane',
    3245: 'airplane',
    3246: 'airplane',
    3247: 'airplane',
    3248: 'airplane',
    3249: 'airplane',
    3250: 'airplane',
    3251: 'airplane',
    3252: 'airplane',
    3253: 'airplane',
    3254: 'airplane',
    3255: 'airplane',
    3256: 'airplane',
    3257: 'airplane',
    3258: 'airplane',
    3259: 'airplane',
    3260: 'airplane',
    3261: 'airplane',
    3262: 'airplane',
    3263: 'airplane',
    3264: 'airplane',
    3265: 'airplane',
    3266: 'airplane',
    3267: 'airplane',
    3268: 'airplane',
    3269: 'airplane',
    3270: 'airplane',
    3271: 'airplane',
    3272: 'airplane',
    3273: 'airplane',
    3274: 'airplane',
    3275: 'airplane',
    3276: 'airplane',
    3277: 'airplane',
    3278: 'airplane',
    3279: 'airplane',
    3280: 'airplane',
    3281: 'airplane',
    3282: 'airplane',
    3283: 'airplane',
    3284: 'airplane',
    3285: 'airplane',
    3286: 'airplane',
    3287: 'airplane',
    3288: 'airplane',
    3289: 'airplane',
    3290: 'airplane',
    3291: 'airplane',
    3292: 'airplane',
    3293: 'airplane',
    3294: 'airplane',
    3295: 'airplane',
    3296: 'airplane',
    3297: 'airplane',
    3298: 'airplane',
    3299: 'airplane',
    3351: 'car',
    3352: 'car',
    3353: 'car',
    3354: 'car',
    3355: 'car',
    3356: 'car',
    3357: 'car',
    3358: 'car',
    3359: 'car',
    3360: 'car',
    3361: 'car',
    3362: 'car',
    3363: 'car',
    3364: 'car',
    3365: 'car',
    3366: 'car',
    3367: 'car',
    3368: 'car',
    3369: 'car',
    3370: 'car',
    3371: 'car',
    3372: 'car',
    3373: 'car',
    3374: 'car',
    3375: 'car',
    3376: 'car',
    3377: 'car',
    3378: 'car',
    3379: 'car',
    3380: 'car',
    3381: 'car',
    3382: 'car',
    3383: 'car',
    3384: 'car',
    3385: 'car',
    3386: 'car',
    3387: 'car',
    3388: 'car',
    3389: 'car',
    3390: 'car',
    3391: 'car',
    3392: 'car',
    3393: 'car',
    3394: 'car',
    3395: 'car',
    3396: 'car',
    3397: 'car',
    3398: 'car',
    3399: 'car',
    3400: 'car',
    3401: 'car',
    3402: 'car',
    3403: 'car',
    3404: 'car',
    3405: 'car',
    3406: 'car',
    3407: 'car',
    3408: 'car',
    3409: 'car',
    3410: 'car',
    3411: 'car',
    3412: 'car',
    3413: 'car',
    3414: 'car',
    3415: 'car',
    3416: 'car',
    3417: 'car',
    3418: 'car',
    3419: 'car',
    3420: 'car',
    3421: 'car',
    3422: 'car',
    3423: 'car',
    3424: 'car',
    3425: 'car',
    3426: 'car',
    3427: 'car',
    3428: 'car',
    3429: 'car',
    3430: 'car',
    3431: 'car',
    3432: 'car',
    3433: 'car',
    3434: 'car',
    3435: 'car',
    3436: 'car',
    3437: 'car',
    3438: 'car',
    3439: 'car',
    3440: 'car',
    3441: 'car',
    3501: 'hotel',
    3502: 'hotel',
    3503: 'hotel',
    3504: 'hotel',
    3505: 'hotel',
    3506: 'hotel',
    3507: 'hotel',
    3508: 'hotel',
    3509: 'hotel',
    3510: 'hotel',
    3511: 'hotel',
    3512: 'hotel',
    3513: 'hotel',
    3514: 'hotel',
    3515: 'hotel',
    3516: 'hotel',
    3517: 'hotel',
    3518: 'hotel',
    3519: 'hotel',
    3520: 'hotel',
    3521: 'hotel',
    3522: 'hotel',
    3523: 'hotel',
    3524: 'hotel',
    3525: 'hotel',
    3526: 'hotel',
    3527: 'hotel',
    3528: 'hotel',
    3529: 'hotel',
    3530: 'hotel',
    3531: 'hotel',
    3532: 'hotel',
    3533: 'hotel',
    3534: 'hotel',
    3535: 'hotel',
    3536: 'hotel',
    3537: 'hotel',
    3538: 'hotel',
    3539: 'hotel',
    3540: 'hotel',
    3541: 'hotel',
    3542: 'hotel',
    3543: 'hotel',
    3544: 'hotel',
    3545: 'hotel',
    3546: 'hotel',
    3547: 'hotel',
    3548: 'hotel',
    3549: 'hotel',
    3550: 'hotel',
    3551: 'hotel',
    3552: 'hotel',
    3553: 'hotel',
    3554: 'hotel',
    3555: 'hotel',
    3556: 'hotel',
    3557: 'hotel',
    3558: 'hotel',
    3559: 'hotel',
    3560: 'hotel',
    3561: 'hotel',
    3562: 'hotel',
    3563: 'hotel',
    3564: 'hotel',
    3565: 'hotel',
    3566: 'hotel',
    3567: 'hotel',
    3568: 'hotel',
    3569: 'hotel',
    3570: 'hotel',
    3571: 'hotel',
    3572: 'hotel',
    3573: 'hotel',
    3574: 'hotel',
    3575: 'hotel',
    3576: 'hotel',
    3577: 'hotel',
    3578: 'hotel',
    3579: 'hotel',
    3580: 'hotel',
    3581: 'hotel',
    3582: 'hotel',
    3583: 'hotel',
    3584: 'hotel',
    3585: 'hotel',
    3586: 'hotel',
    3587: 'hotel',
    3588: 'hotel',
    3589: 'hotel',
    3590: 'hotel',
    3591: 'hotel',
    3592: 'hotel',
    3593: 'hotel',
    3594: 'hotel',
    3595: 'hotel',
    3596: 'hotel',
    3597: 'hotel',
    3598: 'hotel',
    3599: 'hotel',
    3600: 'hotel',
    3601: 'hotel',
    3602: 'hotel',
    3603: 'hotel',
    3604: 'hotel',
    3605: 'hotel',
    3606: 'hotel',
    3607: 'hotel',
    3608: 'hotel',
    3609: 'hotel',
    3610: 'hotel',
    3611: 'hotel',
    3612: 'hotel',
    3613: 'hotel',
    3614: 'hotel',
    3615: 'hotel',
    3616: 'hotel',
    3617: 'hotel',
    3618: 'hotel',
    3619: 'hotel',
    3620: 'hotel',
    3621: 'hotel',
    3622: 'hotel',
    3623: 'hotel',
    3624: 'hotel',
    3625: 'hotel',
    3626: 'hotel',
    3627: 'hotel',
    3628: 'hotel',
    3629: 'hotel',
    3630: 'hotel',
    3631: 'hotel',
    3632: 'hotel',
    3633: 'hotel',
    3634: 'hotel',
    3635: 'hotel',
    3636: 'hotel',
    3637: 'hotel',
    3638: 'hotel',
    3639: 'hotel',
    3640: 'hotel',
    3641: 'hotel',
    3642: 'hotel',
    3643: 'hotel',
    3644: 'hotel',
    3645: 'hotel',
    3646: 'hotel',
    3647: 'hotel',
    3648: 'hotel',
    3649: 'hotel',
    3650: 'hotel',
    3651: 'hotel',
    3652: 'hotel',
    3653: 'hotel',
    3654: 'hotel',
    3655: 'hotel',
    3656: 'hotel',
    3657: 'hotel',
    3658: 'hotel',
    3659: 'hotel',
    3660: 'hotel',
    3661: 'hotel',
    3662: 'hotel',
    3663: 'hotel',
    3664: 'hotel',
    3665: 'hotel',
    3666: 'hotel',
    3667: 'hotel',
    3668: 'hotel',
    3669: 'hotel',
    3670: 'hotel',
    3671: 'hotel',
    3672: 'hotel',
    3673: 'hotel',
    3674: 'hotel',
    3675: 'hotel',
    3676: 'hotel',
    3677: 'hotel',
    3678: 'hotel',
    3679: 'hotel',
    3680: 'hotel',
    3681: 'hotel',
    3682: 'hotel',
    3683: 'hotel',
    3684: 'hotel',
    3685: 'hotel',
    3686: 'hotel',
    3687: 'hotel',
    3688: 'hotel',
    3689: 'hotel',
    3690: 'hotel',
    3691: 'hotel',
    3692: 'hotel',
    3693: 'hotel',
    3694: 'hotel',
    3695: 'hotel',
    3696: 'hotel',
    3697: 'hotel',
    3698: 'hotel',
    3699: 'hotel',
    3700: 'hotel',
    3701: 'hotel',
    3702: 'hotel',
    3703: 'hotel',
    3704: 'hotel',
    3705: 'hotel',
    3706: 'hotel',
    3707: 'hotel',
    3708: 'hotel',
    3709: 'hotel',
    3710: 'hotel',
    3711: 'hotel',
    3712: 'hotel',
    3713: 'hotel',
    3714: 'hotel',
    3715: 'hotel',
    3716: 'hotel',
    3717: 'hotel',
    3718: 'hotel',
    3719: 'hotel',
    3720: 'hotel',
    3721: 'hotel',
    3722: 'hotel',
    3723: 'hotel',
    3724: 'hotel',
    3725: 'hotel',
    3726: 'hotel',
    3727: 'hotel',
    3728: 'hotel',
    3729: 'hotel',
    3730: 'hotel',
    3731: 'hotel',
    3732: 'hotel',
    3733: 'hotel',
    3734: 'hotel',
    3735: 'hotel',
    3736: 'hotel',
    3737: 'hotel',
    3738: 'hotel',
    3739: 'hotel',
    3740: 'hotel',
    3741: 'hotel',
    3742: 'hotel',
    3743: 'hotel',
    3744: 'hotel',
    3745: 'hotel',
    3746: 'hotel',
    3747: 'hotel',
    3748: 'hotel',
    3749: 'hotel',
    3750: 'hotel',
    3751: 'hotel',
    3752: 'hotel',
    3753: 'hotel',
    3754: 'hotel',
    3755: 'hotel',
    3756: 'hotel',
    3757: 'hotel',
    3758: 'hotel',
    3759: 'hotel',
    3760: 'hotel',
    3761: 'hotel',
    3762: 'hotel',
    3763: 'hotel',
    3764: 'hotel',
    3765: 'hotel',
    3766: 'hotel',
    3767: 'hotel',
    3768: 'hotel',
    3769: 'hotel',
    3770: 'hotel',
    3771: 'hotel',
    3772: 'hotel',
    3773: 'hotel',
    3774: 'hotel',
    3775: 'hotel',
    3776: 'hotel',
    3777: 'hotel',
    3778: 'hotel',
    3779: 'hotel',
    3780: 'hotel',
    3781: 'hotel',
    3782: 'hotel',
    3783: 'hotel',
    3784: 'hotel',
    3785: 'hotel',
    3786: 'hotel',
    3787: 'hotel',
    3788: 'hotel',
    3789: 'hotel',
    3790: 'hotel',
    3816: 'hotel',
    3835: 'hotel',
    4011: 'car',
    4111: 'car',
    4112: 'car',
    4119: 'car',
    4121: 'car',
    4131: 'car',
    4214: 'car',
    4215: 'bus',
    4225: 'default',
    4411: 'boat',
    4457: 'boat',
    4468: 'boat',
    4511: 'airplane',
    4582: 'airplane',
    4722: 'airplane',
    4723: 'airplane',
    4784: 'car',
    4789: 'car',
    4812: 'car',
    4814: 'telephone',
    4815: 'telephone',
    4816: 'computer',
    4821: 'money',
    4829: 'money',
    4899: 'television',
    4900: 'gas',
    5013: 'car',
    5021: 'default',
    5039: 'repair',
    5044: 'computer',
    5045: 'computer',
    5046: 'default',
    5047: 'medical',
    5051: 'default',
    5065: 'default',
    5072: 'default',
    5074: 'default',
    5085: 'default',
    5094: 'diamond-ring',
    5099: 'default',
    5111: 'default',
    5122: 'medical',
    5131: 'default',
    5137: 'shirt',
    5139: 'shoes',
    5169: 'gas',
    5172: 'gas',
    5192: 'books',
    5193: 'plant',
    5198: 'repair',
    5199: 'repair',
    5200: 'repair',
    5211: 'repair',
    5231: 'repair',
    5251: 'default',
    5261: 'plant',
    5271: 'bus',
    5300: 'purchase',
    5309: 'purchase',
    5310: 'purchase',
    5311: 'purchase',
    5331: 'purchase',
    5399: 'purchase',
    5411: 'food',
    5422: 'food',
    5441: 'food',
    5451: 'food',
    5462: 'food',
    5499: 'food',
    5511: 'car',
    5521: 'car',
    5531: 'car',
    5532: 'car',
    5533: 'car',
    5541: 'gas',
    5542: 'gas',
    5551: 'boat',
    5561: 'motorcycle',
    5571: 'motorcycle',
    5592: 'default',
    5598: 'default',
    5599: 'car',
    5611: 'shirt',
    5621: 'shirt',
    5631: 'shirt',
    5641: 'shirt',
    5651: 'shirt',
    5655: 'shirt',
    5661: 'shoes',
    5681: 'default',
    5691: 'shirt',
    5697: 'default',
    5698: 'default',
    5699: 'default',
    5712: 'default',
    5713: 'default',
    5714: 'default',
    5718: 'default',
    5719: 'default',
    5722: 'default',
    5732: 'computer',
    5733: 'music',
    5734: 'computer',
    5735: 'music',
    5811: 'food',
    5812: 'food',
    5813: 'cocktail',
    5814: 'food',
    5815: 'books',
    5816: 'computer',
    5817: 'default',
    5818: 'default',
    5832: 'default',
    5912: 'medical',
    5921: 'cocktail',
    5931: 'default',
    5932: 'default',
    5933: 'default',
    5935: 'default',
    5937: 'default',
    5940: 'bicycle',
    5941: 'bicycle',
    5942: 'books',
    5943: 'default',
    5944: 'clock',
    5945: 'toy',
    5946: 'camera',
    5947: 'default',
    5948: 'default',
    5949: 'default',
    5950: 'default',
    5960: 'default',
    5961: 'mail',
    5962: 'telephone',
    5963: 'default',
    5964: 'telephone',
    5965: 'telephone',
    5966: 'telephone',
    5967: 'telephone',
    5968: 'telephone',
    5969: 'telephone',
    5970: 'art',
    5971: 'art',
    5972: 'coins',
    5973: 'default',
    5975: 'default',
    5976: 'default',
    5977: 'default',
    5978: 'default',
    5983: 'gas',
    5992: 'plant',
    5993: 'default',
    5994: 'newspaper',
    5995: 'pet',
    5996: 'cocktail',
    5997: 'purchase',
    5998: 'tent',
    5999: 'money',
    6010: 'money',
    6011: 'money',
    6012: 'money',
    6051: 'money',
    6211: 'money',
    6300: 'money',
    6381: 'money',
    6399: 'repair',
    6513: 'repair',
    7011: 'hotel',
    7012: 'hotel',
    7032: 'park',
    7033: 'park',
    7210: 'shirt',
    7211: 'shirt',
    7216: 'shirt',
    7217: 'default',
    7221: 'camera',
    7230: 'scissors',
    7251: 'shoe',
    7261: 'sadface',
    7273: 'smiley-face',
    7276: 'money',
    7277: 'people',
    7278: 'people',
    7296: 'shirt',
    7297: 'smiley-face',
    7298: 'smiley-face',
    7299: 'default',
    7311: 'default',
    7321: 'default',
    7332: 'computer',
    7333: 'camera',
    7338: 'computer',
    7339: 'people',
    7342: 'bug',
    7349: 'default',
    7361: 'people',
    7372: 'computer',
    7375: 'computer',
    7379: 'computer',
    7392: 'people',
    7393: 'search',
    7394: 'default',
    7395: 'car',
    7399: 'car',
    7511: 'truck',
    7512: 'car',
    7513: 'truck',
    7519: 'truck',
    7523: 'car',
    7531: 'car',
    7534: 'car',
    7535: 'car',
    7538: 'car',
    7542: 'car',
    7549: 'truck',
    7622: 'television',
    7623: 'default',
    7629: 'default',
    7631: 'watch',
    7641: 'furniture',
    7692: 'default',
    7699: 'default',
    7800: 'money',
    7801: 'money',
    7802: 'money',
    7829: 'money',
    7832: 'film',
    7841: 'film',
    7911: 'music',
    7922: 'ticket',
    7929: 'ticket',
    7932: 'music',
    7933: 'bowling',
    7941: 'football',
    7991: 'people',
    7992: 'golf',
    7993: 'game',
    7994: 'game',
    7995: 'coins',
    7996: 'ticket',
    7997: 'money',
    7998: 'ticket',
    7999: 'people',
    8011: 'medical',
    8021: 'medical',
    8031: 'medical',
    8041: 'medical',
    8042: 'medical',
    8043: 'medical',
    8044: 'medical',
    8049: 'medical',
    8050: 'medical',
    8062: 'medical',
    8071: 'medical',
    8099: 'medical',
    8111: 'law',
    8211: 'books',
    8220: 'books',
    8241: 'books',
    8244: 'books',
    8249: 'books',
    8299: 'people',
    8351: 'people',
    8398: 'people',
    8641: 'people',
    8651: 'people',
    8661: 'people',
    8675: 'car',
    8699: 'people',
    8734: 'medical',
    8911: 'tree',
    8931: 'books',
    8999: 'suitcase',
    9211: 'law',
    9222: 'law',
    9223: 'law',
    9311: 'law',
    9399: 'default',
    9402: 'mail',
    9405: 'default',
    9700: 'default',
    9701: 'default',
    9702: 'default',
    9950: 'default',
    'bp001': 'bitcoin-topup',
    'bp002': 'default'
  };

  var nextStepItem = {
    name: 'bitpaycard',
    title: 'Add BitPay Visa® Card',
    icon: 'icon-bitpay-card',
    sref: 'tabs.bitpayCardIntro',
  };


  root.registerNextStep = function() {
    // Disable BitPay Card
    if (!appConfigService._enabledExtensions.debitcard) return;
    root.getCards(function(err, cards) {
      if (lodash.isEmpty(cards)) {
        nextStepsService.register(nextStepItem);
      } else {
        nextStepsService.unregister(nextStepItem.name);
      }
    });
  };

  root.registerNextStep();
  return root;

});
