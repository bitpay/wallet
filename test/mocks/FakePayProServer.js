'use strict';

var is_browser = typeof process == 'undefined'
  || typeof process.versions === 'undefined';
var bitcore = bitcore || require('bitcore');
var PayPro = bitcore.PayPro;

var G = is_browser ? window : global;
G.SSL_UNTRUSTED = true;

var x509 = {
  priv: ''
    + 'LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFcEFJQkFBS0NBUUVBeFRKdUsyYUdM'
    + 'bjFkWEpLRGg0TXdQTFVrbDNISTVwR25HNWFjNGwvMGlobXE4Y3dDCitGVlBnWk1TNTlheWtpc0Ir'
    + 'ekM3dnR2a0prL2J2K0JTT1g3b3hkSXN1TDNkS1FGcHVYWFZmcmRiOTV3WW40TSsKL25qRWhYTWxo'
    + 'Vk1IL09DaUFnOUpLaFRLV0w2R1JXWkFBaEE3bEJSaGdTTkRUaVRDNTFDYmlLN3hBNnBONCt0UQpI'
    + 'eG9tSlBYclpSa2JCMmtsT2ZXd2J2OTNZM0oxS0ZEK2kwUE1RSEx3N3JoRXVteEM5MytISFVWWVZI'
    + 'N0gxVFBaCkgxYmRVSkowMmdRZXlsSnNzWUNKeWRaUHpOVC96dXRzL0tKV2RSdjVseHdHOXU5dE1O'
    + 'TWdoSmJtQWFNa01HaSsKbzdQTkV5UDNxSEZyWXBZaHM1cHFMSE1STkI3OFFNOUllTmpMRndJREFR'
    + 'QUJBb0lCQVFERVJyalBiQUdjbmwxaAorZGIrOTczNGZ0aElBUkpWSko1dTRFK1JKcThSRWhGTEVL'
    + 'UFlKNW0yUC94dVZBMXpYV2xnYXhaRUZ6d1VRaUpZCjdsOEpLVjlwSHhReVlaQ1M4dndYZzhpWGtz'
    + 'dndQaWRvQmN1YW4vd0RWQ1FCZXk2VkxjVXpSYUd1Ui9sTHNYK1YKN2Z0QjBvUnFsSXFrYmNQZE1N'
    + 'dnFUeG93UnVoUG11Q3JWVGpPNHBiTnFuU09OUExPaUovRkFYYjJwZnpGZnBCUgpHeCtFTW16d2Ur'
    + 'SEZuSkJHRGhIWjk5bm4vVEJmYUp6TlZDcURZLzNid3o1WDdIUU5ZN1QrSnlUVUZzZVE5NHhzCnpy'
    + 'a2lidGRmVGNUanB1K1VoWm80c1p6Q3IrZkhHWm9FOUdEUHF0ZDRnQ3ByazRFS0pzbXFCRVN4QlhT'
    + 'RGhZZ04KOXBVRDM4c1pBb0dCQU9yZkRqdDZaL0ZDamFuVThXek5GaWYrOVQxQTJ4b013RDVWU2xN'
    + 'dVJyWW1HbGZyMEM5TQpmMUVvZ2l2dVRrYnA3cmtnZFRhWVRTYndmTnFaQkt4Y3R5YzdCaGRwWnhE'
    + 'RVdKa2Z5cThxVngvem1Cek1JK1ZzCjJLYi9hcHZXcmJlb3NET0NyeUg1YzhKc1VUOXhUWDNYYnhF'
    + 'anlPSlFCU1lHRE1qUHlKNkU5czZMQW9HQkFOYnYKd2d0S2Nra0tLbDJhNXZzaGR2RENnNnFLL1Fn'
    + 'T20vNktUSlVKRVNqaHoydFIrZlBWUjcwVEg5UmhoVFJscERXQgpCd3oyU2NCc1RRNDIvTGsxRnky'
    + 'MFQvck12S3VmSEw1VE1BNGZ6NWRxMUxIbmN6ejZVazVnWEtBT09rUjlVdVhpClR0eTNoREcyQkM4'
    + 'Nk1LTVJ4SjUxRWJxam94d0VSMTAwU2FuTVBmTWxBb0dBSUhLY1pyOHNhUHBHMC9XbFBPREEKZE5v'
    + 'V1MxWVFidkxnQkR5SVBpR2doejJRV2lFcjY3em53ZkNVdXpqNiszVUtFKzFXQkNyYVRjemZrdHVj'
    + 'OTZyLwphcDRPNDJFZWFnU1dNT0ZoZ1AyYWQ4R1JmRGovcEl4N0NlY3pkVUFkVThnc1A1R0lYR3M0'
    + 'QU40eUEwL0Y0dUxHCloxbklRT3ZKS2syZnFvWjZNdHd2dEswQ2dZRUFnSjdGTGVDRTkzUmYyZGdD'
    + 'ZFRHWGJZZlpKc3M1bEFLNkV0NUwKNmJ1ZFN5dWw1Z0VPWkgyekNsQlJjZFJSMUFNbSt1V1ZoSW8x'
    + 'cERLckFlQ2g1MnIvemRmakxLQXNIejkrQWQ3aQpHUEdzVmw0Vm5jaDFTMzQ0bHJKUGUzQklLZ2dj'
    + 'L1hncDNTYnNzcHJMY2orT0wyZElrOUpXbzZ1Y3hmMUJmMkwwCjJlbGhBUWtDZ1lCWHN5elZWL1pK'
    + 'cVhOcFdDZzU1TDNVRm9UTHlLU3FsVktNM1dpRzVCS240QWF6VkNITCtHUVUKeHd4U2dSOWZRNElu'
    + 'dStyUHJOM0lteWswbEtQR0Y5U3pDUlJUaUpGUjcyc05xbE82bDBWOENXUkFQVFBKY2dxVgoxVThO'
    + 'SEs4YjNaaUlvR0orbXNOenBkeHJqNjJIM0E2K1krQXNOWTRTbVVUWEg5eWpnK251a2c9PQotLS0t'
    + 'LUVORCBSU0EgUFJJVkFURSBLRVktLS0tLQo=',
  pub: ''
    + 'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FR'
    + 'OEFNSUlCQ2dLQ0FRRUF4VEp1SzJhR0xuMWRYSktEaDRNdwpQTFVrbDNISTVwR25HNWFjNGwvMGlo'
    + 'bXE4Y3dDK0ZWUGdaTVM1OWF5a2lzQit6Qzd2dHZrSmsvYnYrQlNPWDdvCnhkSXN1TDNkS1FGcHVY'
    + 'WFZmcmRiOTV3WW40TSsvbmpFaFhNbGhWTUgvT0NpQWc5SktoVEtXTDZHUldaQUFoQTcKbEJSaGdT'
    + 'TkRUaVRDNTFDYmlLN3hBNnBONCt0UUh4b21KUFhyWlJrYkIya2xPZld3YnY5M1kzSjFLRkQraTBQ'
    + 'TQpRSEx3N3JoRXVteEM5MytISFVWWVZIN0gxVFBaSDFiZFVKSjAyZ1FleWxKc3NZQ0p5ZFpQek5U'
    + 'L3p1dHMvS0pXCmRSdjVseHdHOXU5dE1OTWdoSmJtQWFNa01HaStvN1BORXlQM3FIRnJZcFloczVw'
    + 'cUxITVJOQjc4UU05SWVOakwKRndJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==',
  der: ''
    + 'MIIDBjCCAe4CCQDI2qWdA3/VpDANBgkqhkiG9w0BAQUFADBFMQswCQYDVQQGEwJBVTETMBEGA1UE'
    + 'CAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMB4XDTE0MDcx'
    + 'NjAxMzM1MVoXDTE1MDcxNjAxMzM1MVowRTELMAkGA1UEBhMCQVUxEzARBgNVBAgMClNvbWUtU3Rh'
    + 'dGUxITAfBgNVBAoMGEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDCCASIwDQYJKoZIhvcNAQEBBQAD'
    + 'ggEPADCCAQoCggEBAMUybitmhi59XVySg4eDMDy1JJdxyOaRpxuWnOJf9IoZqvHMAvhVT4GTEufW'
    + 'spIrAfswu77b5CZP27/gUjl+6MXSLLi93SkBabl11X63W/ecGJ+DPv54xIVzJYVTB/zgogIPSSoU'
    + 'yli+hkVmQAIQO5QUYYEjQ04kwudQm4iu8QOqTePrUB8aJiT162UZGwdpJTn1sG7/d2NydShQ/otD'
    + 'zEBy8O64RLpsQvd/hx1FWFR+x9Uz2R9W3VCSdNoEHspSbLGAicnWT8zU/87rbPyiVnUb+ZccBvbv'
    + 'bTDTIISW5gGjJDBovqOzzRMj96hxa2KWIbOaaixzETQe/EDPSHjYyxcCAwEAATANBgkqhkiG9w0B'
    + 'AQUFAAOCAQEAL6AMMfC3TlRcmsIgHxjVD4XYtISlldnrn2X9zvFbJKCpNy8XQQosQxrhyfzPHQKj'
    + 'lS2L/KCGMnjx9QkYD2Hlp1MJ1uVv9888th/gcZOv3Or3hQyi5K1Sh5xCG+69lUOqUEGu9B4irsqo'
    + 'FomQVbQolSy+t4apdJi7kuEDwFDk4gZiVEfsuX+naN5a6pCnWnhX1Vf4fKwfkLobKKXm2zQVsjxl'
    + 'wBAqOEmJGDLoRMXH56qJnEZ/dqsczaJOHQSi9mFEHL0r5rsEDTT5AVxdnBfNnyGaCH7/zANEko+F'
    + 'GBj1JdJaJgFTXdbxDoyoPTPD+LJqSK5XYToo46y/T0u9CLveNA==',
  pem: ''
    + 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURCakNDQWU0Q0NRREkycVdkQTMvVnBEQU5C'
    + 'Z2txaGtpRzl3MEJBUVVGQURCRk1Rc3dDUVlEVlFRR0V3SkIKVlRFVE1CRUdBMVVFQ0F3S1UyOXRa'
    + 'UzFUZEdGMFpURWhNQjhHQTFVRUNnd1lTVzUwWlhKdVpYUWdWMmxrWjJsMApjeUJRZEhrZ1RIUmtN'
    + 'QjRYRFRFME1EY3hOakF4TXpNMU1Wb1hEVEUxTURjeE5qQXhNek0xTVZvd1JURUxNQWtHCkExVUVC'
    + 'aE1DUVZVeEV6QVJCZ05WQkFnTUNsTnZiV1V0VTNSaGRHVXhJVEFmQmdOVkJBb01HRWx1ZEdWeWJt'
    + 'VjAKSUZkcFpHZHBkSE1nVUhSNUlFeDBaRENDQVNJd0RRWUpLb1pJaHZjTkFRRUJCUUFEZ2dFUEFE'
    + 'Q0NBUW9DZ2dFQgpBTVV5Yml0bWhpNTlYVnlTZzRlRE1EeTFKSmR4eU9hUnB4dVduT0pmOUlvWnF2'
    + 'SE1BdmhWVDRHVEV1ZldzcElyCkFmc3d1NzdiNUNaUDI3L2dVamwrNk1YU0xMaTkzU2tCYWJsMTFY'
    + 'NjNXL2VjR0orRFB2NTR4SVZ6SllWVEIvemcKb2dJUFNTb1V5bGkraGtWbVFBSVFPNVFVWVlFalEw'
    + 'NGt3dWRRbTRpdThRT3FUZVByVUI4YUppVDE2MlVaR3dkcApKVG4xc0c3L2QyTnlkU2hRL290RHpF'
    + 'Qnk4TzY0Ukxwc1F2ZC9oeDFGV0ZSK3g5VXoyUjlXM1ZDU2ROb0VIc3BTCmJMR0FpY25XVDh6VS84'
    + 'N3JiUHlpVm5VYitaY2NCdmJ2YlREVElJU1c1Z0dqSkRCb3ZxT3p6Uk1qOTZoeGEyS1cKSWJPYWFp'
    + 'eHpFVFFlL0VEUFNIall5eGNDQXdFQUFUQU5CZ2txaGtpRzl3MEJBUVVGQUFPQ0FRRUFMNkFNTWZD'
    + 'MwpUbFJjbXNJZ0h4alZENFhZdElTbGxkbnJuMlg5enZGYkpLQ3BOeThYUVFvc1F4cmh5ZnpQSFFL'
    + 'amxTMkwvS0NHCk1uang5UWtZRDJIbHAxTUoxdVZ2OTg4OHRoL2djWk92M09yM2hReWk1SzFTaDV4'
    + 'Q0crNjlsVU9xVUVHdTlCNGkKcnNxb0ZvbVFWYlFvbFN5K3Q0YXBkSmk3a3VFRHdGRGs0Z1ppVkVm'
    + 'c3VYK25hTjVhNnBDblduaFgxVmY0Zkt3ZgprTG9iS0tYbTJ6UVZzanhsd0JBcU9FbUpHRExvUk1Y'
    + 'SDU2cUpuRVovZHFzY3phSk9IUVNpOW1GRUhMMHI1cnNFCkRUVDVBVnhkbkJmTm55R2FDSDcvekFO'
    + 'RWtvK0ZHQmoxSmRKYUpnRlRYZGJ4RG95b1BUUEQrTEpxU0s1WFlUb28KNDZ5L1QwdTlDTHZlTkE9'
    + 'PQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg=='
};

x509.priv = new Buffer(x509.priv, 'base64');
x509.pub = new Buffer(x509.pub, 'base64');
x509.der = new Buffer(x509.der, 'base64');
x509.pem = new Buffer(x509.pem, 'base64');

function startServer(cb) {
  if (G.$http && G.$http.__server) {
    setTimeout(function() {
      return cb(null, G.$http.__server);
    }, 1);
    return;
  }

  var old;
  if (G.$http) {
    old = G.$http;
  }

  var server = {
    POST: {

      /**
       * Receive "I want to pay"
       */

      '/-/request': function(req, cb) {
        var res = {
          statusCode: 200,
          headers: {},
          body: {}
        };

        var uid = 0;

        console.log('Received payment "request" from %s.', req.socket.remoteAddress);

        var outputs = [];

        [2000, 1000].forEach(function(value) {
          var po = new PayPro();
          po = po.makeOutput();
          // number of satoshis to be paid
          po.set('amount', value);
          // a TxOut script where the payment should be sent. similar to OP_CHECKSIG
          po.set('script', new Buffer([
            118, // OP_DUP
            169, // OP_HASH160
            76,  // OP_PUSHDATA1
            20,  // number of bytes
            55,
            48,
            254,
            188,
            186,
            4,
            186,
            208,
            205,
            71,
            108,
            251,
            130,
            15,
            156,
            55,
            215,
            70,
            111,
            217,
            136, // OP_EQUALVERIFY
            172  // OP_CHECKSIG
          ]));
          outputs.push(po.message);
        });

        /**
         * Payment Details
         */

        var mdata = new Buffer([0]);
        uid++;
        if (uid > 0xffff) {
          throw new Error('UIDs bigger than 0xffff not supported.');
        } else if (uid > 0xff) {
          mdata = new Buffer([(uid >> 8) & 0xff, (uid >> 0) & 0xff])
        } else {
          mdata = new Buffer([0, uid])
        }
        var now = Date.now() / 1000 | 0;
        var pd = new PayPro();
        pd = pd.makePaymentDetails();
        pd.set('network', 'test');
        pd.set('outputs', outputs);
        pd.set('time', now);
        pd.set('expires', now + 60 * 60 * 24);
        pd.set('memo', 'Hello, this is the server, we would like some money.');
        var port = +req.headers.host.split(':')[1] || server.port;
        pd.set('payment_url', 'https://localhost:' + port + '/-/pay');
        pd.set('merchant_data', mdata);

        /*
         * PaymentRequest
         */

        var cr = new PayPro();
        cr = cr.makeX509Certificates();
        cr.set('certificate', [x509.der]);

        // We send the PaymentRequest to the customer
        var pr = new PayPro();
        pr = pr.makePaymentRequest();
        pr.set('payment_details_version', 1);
        pr.set('pki_type', 'x509+sha256');
        pr.set('pki_data', cr.serialize());
        pr.set('serialized_payment_details', pd.serialize());
        pr.sign(x509.priv);

        pr = pr.serialize();

        // BIP-71 - set the content-type
        res.headers['Content-Type'] = PayPro.PAYMENT_REQUEST_CONTENT_TYPE;
        res.headers['Content-Length'] = pr.length + '';
        res.headers['Content-Transfer-Encoding'] = 'binary';

        res.body = pr;

        return cb(null, res, res.body);
      },

      /**
       * Receive Payment
       */

      '/-/pay': function(req, cb) {
        var body = req.body;

        console.log('Received Payment Message Body:');
        console.log(body.toString('hex'));

        var res = {
          statusCode: 200,
          headers: {},
          body: {}
        };

        body = PayPro.Payment.decode(body);

        var pay = new PayPro();
        pay = pay.makePayment(body);
        var merchant_data = pay.get('merchant_data');
        var transactions = pay.get('transactions');
        var refund_to = pay.get('refund_to');
        var memo = pay.get('memo');

        console.log('Received Payment from %s.', req.socket.remoteAddress);
        console.log('Customer Message: %s', memo);
        console.log('Payment Message:');
        console.log(pay);

        // We send this to the customer after receiving a Payment
        // Then we propogate the transaction through bitcoin network
        var ack = new PayPro();
        ack = ack.makePaymentACK();
        ack.set('payment', pay.message);
        ack.set('memo', 'Thank you for your payment!');

        ack = ack.serialize();

        // BIP-71 - set the content-type
        res.headers['Content-Type'] = PayPro.PAYMENT_ACK_CONTENT_TYPE;
        res.headers['Content-Length'] = ack.length + '';
        res.headers['Content-Transfer-Encoding'] = 'binary';

        transactions = transactions.map(function(tx) {
          tx.buffer = tx.buffer.slice(tx.offset, tx.limit);
          var ptx = new bitcore.Transaction();
          ptx.parse(tx.buffer);
          return ptx;
        });

        transactions.forEach(function(tx) {
          var id = tx.getHash().toString('hex');
          console.log('');
          console.log('Sending transaction with txid: %s', id);
          console.log(tx.getStandardizedObject());
        });

        res.body = ack;

        return cb(null, res, res.body);
      }
    },
    listen: function(port, cb) {
      if (cb) return cb();
    },
    close: function(cb) {
      if (old) G.$http = old;
      return cb();
    }
  };

  G.$http = function(options) {
    var ret = {
      success: function(cb) {
        this._success = cb;
        return this;
      },
      error: function(cb) {
        this._error = cb;
        return this;
      },
      _success: function() {
        ;
      },
      _error: function(_, err) {
        throw err;
      }
    };
    var method = (options.method || 'GET').toUpperCase();
    var uri = options.uri || options.url;
    var path = uri.replace(/^https?:\/\/[^\/]+/, '');
    var req = options;
    req.headers = req.headers || {};
    req.body = req.data || req.body || {};
    req.socket = {
      remoteAddress: 'localhost'
    };
    req.headers['Host'] = 'localhost:8080';
    Object.keys(req.headers).forEach(function(key) {
      req.headers[key] = req.headers[key] + '';
      req.headers[key.toLowerCase()] = req.headers[key] + '';
    });
    setTimeout(function() {
      server[method][path](req, function(err, res, body) {
        if (err) return ret._error(null, err, null, options);
        Object.keys(res.headers).forEach(function(key) {
          res.headers[key] = res.headers[key] + '';
          res.headers[key.toLowerCase()] = res.headers[key] + '';
        });
        return ret._success(body, res.statusCode, res.headers, options);
      });
    }, 1);
    return ret;
  };

  G.$http.__server = server;

  setTimeout(function() {
    return cb(null, server);
  }, 1);
}

module.exports = startServer;
