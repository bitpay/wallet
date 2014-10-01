'use strict';

var Wallet = copay.Wallet;
var PrivateKey = copay.PrivateKey;
var Network = requireMock('FakeNetwork');
var Blockchain = requireMock('FakeBlockchain');
var TransactionBuilder = bitcore.TransactionBuilder;
var Transaction = bitcore.Transaction;
var Address = bitcore.Address;
var PayPro = bitcore.PayPro;
var bignum = bitcore.Bignum;
var startServer = copay.FakePayProServer; // TODO should be require('./mocks/FakePayProServer');
var localMock = requireMock('FakeLocalStorage');
var sessionMock = requireMock('FakeLocalStorage');
var Storage = copay.Storage;

var server;

var walletConfig = {
  requiredCopayers: 1,
  totalCopayers: 1,
  spendUnconfirmed: true,
  reconnectDelay: 100,
  networkName: 'testnet',
  storage: requireMock('FakeLocalStorage').storageParams,
};

var getNewEpk = function() {
  return new PrivateKey({
      networkName: walletConfig.networkName,
    })
    .deriveBIP45Branch()
    .extendedPublicKeyString();
};

describe('PayPro (in Wallet) model', function() {

  if (!is_browser) {
    var createW = function(N, conf) {
      var c = JSON.parse(JSON.stringify(conf || walletConfig));
      if (!N) N = c.totalCopayers;

      var mainPrivateKey = new copay.PrivateKey({
        networkName: walletConfig.networkName
      });
      var mainCopayerEPK = mainPrivateKey.deriveBIP45Branch().extendedPublicKeyString();
      c.privateKey = mainPrivateKey;

      c.publicKeyRing = new copay.PublicKeyRing({
        networkName: c.networkName,
        requiredCopayers: Math.min(N, c.requiredCopayers),
        totalCopayers: N,
      });
      c.publicKeyRing.addCopayer(mainCopayerEPK);

      c.txProposals = new copay.TxProposals({
        networkName: c.networkName,
      });

      var storage = new Storage(walletConfig.storage);
      storage._setPassphrase('xxx');
      var network = new Network(walletConfig.network);
      var blockchain = new Blockchain(walletConfig.blockchain);
      c.storage = storage;
      c.network = network;
      c.blockchain = blockchain;

      c.addressBook = {
        '2NFR2kzH9NUdp8vsXTB4wWQtTtzhpKxsyoJ': {
          label: 'John',
          copayerId: '026a55261b7c898fff760ebe14fd22a71892295f3b49e0ca66727bc0a0d7f94d03',
          createdTs: 1403102115,
          hidden: false
        },
        '2MtP8WyiwG7ZdVWM96CVsk2M1N8zyfiVQsY': {
          label: 'Jennifer',
          copayerId: '032991f836543a492bd6d0bb112552bfc7c5f3b7d5388fcbcbf2fbb893b44770d7',
          createdTs: 1403103115,
          hidden: false
        }
      };

      c.networkName = walletConfig.networkName;
      c.version = '0.0.1';

      return new Wallet(c);
    }

    var unspentTest = [{
      "address": "dummy",
      "scriptPubKey": "dummy",
      "txid": "2ac165fa7a3a2b535d106a0041c7568d03b531e58aeccdd3199d7289ab12cfc1",
      "vout": 1,
      "amount": 10,
      "confirmations": 7
    }];

    var createW2 = function(privateKeys, N, conf) {
      if (!N) N = 3;
      var w = createW(N, conf);
      should.exist(w);

      var pkr = w.publicKeyRing;

      for (var i = 0; i < N - 1; i++) {
        if (privateKeys) {
          var k = privateKeys[i];
          pkr.addCopayer(k ? k.deriveBIP45Branch().extendedPublicKeyString() : getNewEpk());
        } else {
          pkr.addCopayer(getNewEpk());
        }
      }

      return w;
    };

    var cachedW2 = null;
    var cachedW2obj = null;
    var cachedCreateW2 = function() {
      if (!cachedW2) {
        cachedW2 = createW2();
        cachedW2obj = cachedW2.toObj();
        cachedW2obj.opts.reconnectDelay = 100;
      }
      var w = Wallet.fromObj(cachedW2obj, cachedW2.storage, cachedW2.network, cachedW2.blockchain);
      return w;
    };

    var createWallet = function() {
      var w = cachedCreateW2();
      unspentTest[0].address = w.publicKeyRing.getAddress(1, true, w.publicKey).toString();
      unspentTest[0].scriptPubKey = w.publicKeyRing.getScriptPubKeyHex(1, true, w.publicKey);
      w.getUnspent = function(cb) {
        return setTimeout(function() {
          return cb(null, unspentTest, unspentTest);
        }, 1);
      };
      return w;
    };

    it('#start the example server', function(done) {
      startServer(function(err, s) {
        if (err) return done(err);
        server = s;
        server.uri = 'https://localhost:8080/-';
        done();
      });
    });

    var pr;
    var ppw;

    ppw = createWallet();

    it('#retrieve a payment request message via http', function(done) {
      var w = ppw;
      should.exist(w);

      var req = {
        headers: {
          'Host': 'localhost:8080',
          'Accept': PayPro.PAYMENT_REQUEST_CONTENT_TYPE + ', ' + PayPro.PAYMENT_ACK_CONTENT_TYPE,
          'Content-Type': 'application/octet-stream',
          'Content-Length': '0'
        },
        socket: {
          remoteAddress: 'localhost',
          remotePort: 8080
        },
        body: {}
      };

      Object.keys(req.headers).forEach(function(key) {
        req.headers[key.toLowerCase()] = req.headers[key];
      });

      server.GET['/-/request'](req, function(err, res, body) {
        var data = PayPro.PaymentRequest.decode(body);
        pr = new PayPro();
        pr = pr.makePaymentRequest(data);
        done();
      });
    });

    it('#send a payment message via http', function(done) {
      var w = ppw;
      should.exist(w);

      var ver = pr.get('payment_details_version');
      var pki_type = pr.get('pki_type');
      var pki_data = pr.get('pki_data');
      var details = pr.get('serialized_payment_details');
      var sig = pr.get('signature');

      var certs = PayPro.X509Certificates.decode(pki_data);
      certs = certs.certificate;

      var verified = pr.verify();

      if (!verified) {
        return done(new Error('Server sent a bad signature.'));
      }

      details = PayPro.PaymentDetails.decode(details);
      var pd = new PayPro();
      pd = pd.makePaymentDetails(details);

      var network = pd.get('network');
      var outputs = pd.get('outputs');
      var time = pd.get('time');
      var expires = pd.get('expires');
      var memo = pd.get('memo');
      var payment_url = pd.get('payment_url');
      var merchant_data = pd.get('merchant_data');

      var priv = w.privateKey;
      var pkr = w.publicKeyRing;

      var opts = {
        remainderOut: {
          address: w._doGenerateAddress(true).toString()
        }
      };

      var outs = [];
      outputs.forEach(function(output) {
        var amount = output.get('amount');
        var script = {
          offset: output.get('script').offset,
          limit: output.get('script').limit,
          buffer: new Buffer(new Uint8Array(
            output.get('script').buffer))
        };

        // big endian
        var v = new Buffer(8);
        v[0] = (amount.high >> 24) & 0xff;
        v[1] = (amount.high >> 16) & 0xff;
        v[2] = (amount.high >> 8) & 0xff;
        v[3] = (amount.high >> 0) & 0xff;
        v[4] = (amount.low >> 24) & 0xff;
        v[5] = (amount.low >> 16) & 0xff;
        v[6] = (amount.low >> 8) & 0xff;
        v[7] = (amount.low >> 0) & 0xff;

        var s = script.buffer.slice(script.offset, script.limit);
        var net = network === 'main' ? 'livenet' : 'testnet';
        var addr = bitcore.Address.fromScriptPubKey(new bitcore.Script(s), net);

        outs.push({
          address: addr[0].toString(),
          amountSatStr: bitcore.Bignum.fromBuffer(v, {
            // XXX for some reason, endian is ALWAYS 'big'
            // in node (in the browser it behaves correctly)
            endian: 'big',
            size: 1
          }).toString(10)
        });
      });

      var b = new bitcore.TransactionBuilder(opts)
        .setUnspent(unspentTest)
        .setOutputs(outs);

      outputs.forEach(function(output, i) {
        var script = {
          offset: output.get('script').offset,
          limit: output.get('script').limit,
          buffer: new Buffer(new Uint8Array(
            output.get('script').buffer))
        };
        var s = script.buffer.slice(script.offset, script.limit);
        b.tx.outs[i].s = s;
      });

      var selectedUtxos = b.getSelectedUnspent();
      var inputChainPaths = selectedUtxos.map(function(utxo) {
        return pkr.pathForAddress(utxo.address);
      });

      b = b.setHashToScriptMap(pkr.getRedeemScriptMap(inputChainPaths));

      if (priv) {
        var keys = priv.getForPaths(inputChainPaths);
        var signed = b.sign(keys);
      }

      var tx = b.build();

      var refund_outputs = [];

      var refund_to = w.publicKeyRing.getPubKeys(0, false, w.getMyCopayerId())[0];

      var total = outputs.reduce(function(total, _, i) {
        // XXX reverse endianness to work around bignum bug:
        var txv = tx.outs[i].v;
        var v = new Buffer(8);
        for (var j = 0; j < 8; j++) v[j] = txv[7 - j];
        return total.add(bignum.fromBuffer(v, {
          endian: 'big',
          size: 1
        }));
      }, bitcore.Bignum('0', 10));

      var rpo = new PayPro();
      rpo = rpo.makeOutput();

      rpo.set('amount', +total.toString(10));

      rpo.set('script',
        Buffer.concat([
          new Buffer([
            118, // OP_DUP
            169, // OP_HASH160
            76, // OP_PUSHDATA1
            20, // number of bytes
          ]),
          // needs to be ripesha'd
          bitcore.util.sha256ripe160(refund_to),
          new Buffer([
            136, // OP_EQUALVERIFY
            172 // OP_CHECKSIG
          ])
        ])
      );

      refund_outputs.push(rpo.message);

      var pay = new PayPro();
      pay = pay.makePayment();
      pay.set('merchant_data', new Buffer([0, 1]));
      pay.set('transactions', [tx.serialize()]);
      pay.set('refund_to', refund_outputs);
      pay.set('memo', 'Hi server, I would like to give you some money.');

      pay = pay.serialize();

      var req = {
        headers: {
          'Host': 'localhost:8080',
          'Accept': PayPro.PAYMENT_REQUEST_CONTENT_TYPE + ', ' + PayPro.PAYMENT_ACK_CONTENT_TYPE,
          'Content-Type': PayPro.PAYMENT_CONTENT_TYPE,
          'Content-Length': pay.length + ''
        },
        socket: {
          remoteAddress: 'localhost',
          remotePort: 8080
        },
        body: pay,
        data: pay
      };

      Object.keys(req.headers).forEach(function(key) {
        req.headers[key.toLowerCase()] = req.headers[key];
      });

      server.POST['/-/pay'](req, function(err, res, body) {
        if (err) return done(err);

        var data = PayPro.PaymentACK.decode(body);
        var ack = new PayPro();
        ack = ack.makePaymentACK(data);

        var payment = ack.get('payment');
        var memo = ack.get('memo');

        payment = PayPro.Payment.decode(payment);
        var pay = new PayPro();
        payment = pay.makePayment(payment);

        var tx = payment.message.transactions[0];

        if (!tx) {
          return done(new Error('No tx in payment ACK.'));
        }

        if (tx.buffer) {
          tx.buffer = new Buffer(new Uint8Array(tx.buffer));
          tx.buffer = tx.buffer.slice(tx.offset, tx.limit);
          var ptx = new bitcore.Transaction();
          ptx.parse(tx.buffer);
          tx = ptx;
        }

        var ackTotal = outputs.reduce(function(total, _, i) {
          // XXX reverse endianness to work around bignum bug:
          var txv = tx.outs[i].v;
          var v = new Buffer(8);
          for (var j = 0; j < 8; j++) v[j] = txv[7 - j];
          return total.add(bignum.fromBuffer(v, {
            endian: 'big',
            size: 1
          }));
        }, bitcore.Bignum('0', 10));

        ackTotal.toString(10).should.equal(total.toString(10));

        done();
      });
    });

    it('#retrieve a payment request message via http', function(done) {
      var w = ppw;
      should.exist(w);

      var req = {
        headers: {
          'Host': 'localhost:8080',
          'Accept': PayPro.PAYMENT_REQUEST_CONTENT_TYPE + ', ' + PayPro.PAYMENT_ACK_CONTENT_TYPE,
          'Content-Type': 'application/octet-stream',
          'Content-Length': '0'
        },
        socket: {
          remoteAddress: 'localhost',
          remotePort: 8080
        },
        body: {}
      };

      Object.keys(req.headers).forEach(function(key) {
        req.headers[key.toLowerCase()] = req.headers[key];
      });

      server.GET['/-/request'](req, function(err, res, body) {
        var data = PayPro.PaymentRequest.decode(body);
        pr = new PayPro();
        pr = pr.makePaymentRequest(data);
        done();
      });
    });

    it('#send a payment message via http', function(done) {
      var w = ppw;
      should.exist(w);

      var ver = pr.get('payment_details_version');
      var pki_type = pr.get('pki_type');
      var pki_data = pr.get('pki_data');
      var details = pr.get('serialized_payment_details');
      var sig = pr.get('signature');

      var certs = PayPro.X509Certificates.decode(pki_data);
      certs = certs.certificate;

      var verified = pr.verify();

      if (!verified) {
        return done(new Error('Server sent a bad signature.'));
      }

      details = PayPro.PaymentDetails.decode(details);
      var pd = new PayPro();
      pd = pd.makePaymentDetails(details);

      var network = pd.get('network');
      var outputs = pd.get('outputs');
      var time = pd.get('time');
      var expires = pd.get('expires');
      var memo = pd.get('memo');
      var payment_url = pd.get('payment_url');
      var merchant_data = pd.get('merchant_data');

      var priv = w.privateKey;
      var pkr = w.publicKeyRing;

      var opts = {
        remainderOut: {
          address: w._doGenerateAddress(true).toString()
        }
      };

      var outs = [];
      outputs.forEach(function(output) {
        var amount = output.get('amount');
        var script = {
          offset: output.get('script').offset,
          limit: output.get('script').limit,
          buffer: new Buffer(new Uint8Array(
            output.get('script').buffer))
        };

        // big endian
        var v = new Buffer(8);
        v[0] = (amount.high >> 24) & 0xff;
        v[1] = (amount.high >> 16) & 0xff;
        v[2] = (amount.high >> 8) & 0xff;
        v[3] = (amount.high >> 0) & 0xff;
        v[4] = (amount.low >> 24) & 0xff;
        v[5] = (amount.low >> 16) & 0xff;
        v[6] = (amount.low >> 8) & 0xff;
        v[7] = (amount.low >> 0) & 0xff;

        var s = script.buffer.slice(script.offset, script.limit);
        var net = network === 'main' ? 'livenet' : 'testnet';
        var addr = bitcore.Address.fromScriptPubKey(new bitcore.Script(s), net);

        outs.push({
          address: addr[0].toString(),
          amountSatStr: bitcore.Bignum.fromBuffer(v, {
            // XXX for some reason, endian is ALWAYS 'big'
            // in node (in the browser it behaves correctly)
            endian: 'big',
            size: 1
          }).toString(10)
        });
      });

      var b = new bitcore.TransactionBuilder(opts)
        .setUnspent(unspentTest)
        .setOutputs(outs);

      outputs.forEach(function(output, i) {
        var script = {
          offset: output.get('script').offset,
          limit: output.get('script').limit,
          buffer: new Buffer(new Uint8Array(
            output.get('script').buffer))
        };
        var s = script.buffer.slice(script.offset, script.limit);
        b.tx.outs[i].s = s;
      });

      var selectedUtxos = b.getSelectedUnspent();
      var inputChainPaths = selectedUtxos.map(function(utxo) {
        return pkr.pathForAddress(utxo.address);
      });

      b = b.setHashToScriptMap(pkr.getRedeemScriptMap(inputChainPaths));

      if (priv) {
        var keys = priv.getForPaths(inputChainPaths);
        var signed = b.sign(keys);
      }

      var tx = b.build();

      var refund_outputs = [];

      var refund_to = w.publicKeyRing.getPubKeys(0, false, w.getMyCopayerId())[0];

      var total = outputs.reduce(function(total, _, i) {
        // XXX reverse endianness to work around bignum bug:
        var txv = tx.outs[i].v;
        var v = new Buffer(8);
        for (var j = 0; j < 8; j++) v[j] = txv[7 - j];
        return total.add(bignum.fromBuffer(v, {
          endian: 'big',
          size: 1
        }));
      }, bitcore.Bignum('0', 10));

      var rpo = new PayPro();
      rpo = rpo.makeOutput();

      rpo.set('amount', +total.toString(10));

      rpo.set('script',
        Buffer.concat([
          new Buffer([
            118, // OP_DUP
            169, // OP_HASH160
            76, // OP_PUSHDATA1
            20, // number of bytes
          ]),
          // needs to be ripesha'd
          bitcore.util.sha256ripe160(refund_to),
          new Buffer([
            136, // OP_EQUALVERIFY
            172 // OP_CHECKSIG
          ])
        ])
      );

      refund_outputs.push(rpo.message);

      var pay = new PayPro();
      pay = pay.makePayment();
      pay.set('merchant_data', new Buffer([0, 1]));
      pay.set('transactions', [tx.serialize()]);
      pay.set('refund_to', refund_outputs);
      pay.set('memo', 'Hi server, I would like to give you some money.');

      pay = pay.serialize();

      var req = {
        headers: {
          'Host': 'localhost:8080',
          'Accept': PayPro.PAYMENT_REQUEST_CONTENT_TYPE + ', ' + PayPro.PAYMENT_ACK_CONTENT_TYPE,
          'Content-Type': PayPro.PAYMENT_CONTENT_TYPE,
          'Content-Length': pay.length + ''
        },
        socket: {
          remoteAddress: 'localhost',
          remotePort: 8080
        },
        body: pay,
        data: pay
      };

      Object.keys(req.headers).forEach(function(key) {
        req.headers[key.toLowerCase()] = req.headers[key];
      });

      server.POST['/-/pay'](req, function(err, res, body) {
        if (err) return done(err);

        var data = PayPro.PaymentACK.decode(body);
        var ack = new PayPro();
        ack = ack.makePaymentACK(data);

        var payment = ack.get('payment');
        var memo = ack.get('memo');

        payment = PayPro.Payment.decode(payment);
        var pay = new PayPro();
        payment = pay.makePayment(payment);

        var tx = payment.message.transactions[0];

        if (!tx) {
          return done(new Error('No tx in payment ACK.'));
        }

        if (tx.buffer) {
          tx.buffer = new Buffer(new Uint8Array(tx.buffer));
          tx.buffer = tx.buffer.slice(tx.offset, tx.limit);
          var ptx = new bitcore.Transaction();
          ptx.parse(tx.buffer);
          tx = ptx;
        }

        var ackTotal = outputs.reduce(function(total, _, i) {
          // XXX reverse endianness to work around bignum bug:
          var txv = tx.outs[i].v;
          var v = new Buffer(8);
          for (var j = 0; j < 8; j++) v[j] = txv[7 - j];
          return total.add(bignum.fromBuffer(v, {
            endian: 'big',
            size: 1
          }));
        }, bitcore.Bignum('0', 10));

        ackTotal.toString(10).should.equal(total.toString(10));

        should.exist(ack);
        memo.should.equal('Thank you for your payment!');

        done();
      });
    });

    ppw = createWallet();

    it('#retrieve a payment request message via model', function(done) {
      var w = ppw;
      should.exist(w);
      // Caches Payment Request but does not add TX proposal
      w.fetchPaymentTx({
        uri: 'https://localhost:8080/-/request'
      }, function(err, merchantData) {
        if (err) return done(err);
        merchantData.pr.pd.payment_url.should.equal('https://localhost:8080/-/pay');
        return done();
      });
    });

    it('#add tx proposal based on payment message via model', function(done) {
      var w = ppw;
      should.exist(w);
      var options = {
        uri: 'https://localhost:8080/-/request'
      };
      var req = w.paymentRequests[options.uri];
      should.exist(req);
      delete w.paymentRequests[options.uri];
      w.receivePaymentRequest(options, req.pr, function(err, ntxid, merchantData) {
        should.equal(err, null);
        should.exist(ntxid);
        should.exist(merchantData);
        w._ntxid = ntxid;
        merchantData.pr.pd.payment_url.should.equal('https://localhost:8080/-/pay');
        return done();
      });
    });

    it('#add tx proposal based on payment message via model', function(done) {
      var w = ppw;
      should.exist(w);
      w.sendPaymentTx(w._ntxid, function(txid, merchantData) {
        should.exist(txid);
        should.exist(merchantData);
        should.exist(merchantData.ack);
        merchantData.ack.memo.should.equal('Thank you for your payment!');
        return done();
      });
    });

    it('#send a payment request using payment api', function(done) {
      var w = createWallet();
      should.exist(w);
      var uri = 'bitcoin:2NBzZdFBoQymDgfzH2Pmnthser1E71MmU47?amount=0.00003&r=' + server.uri + '/request';
      var memo = 'Hello, server. I\'d like to make a payment.';
      w.createPaymentTx({
        uri: uri,
        memo: memo
      }, function(err, ntxid, merchantData) {
        should.equal(err, null);
        should.exist(ntxid);
        should.exist(merchantData);
        if (w.isShared()) {
          return done();
        } else {
          w.sendPaymentTx(ntxid, {
            memo: memo
          }, function(txid, merchantData) {
            should.exist(txid);
            should.exist(merchantData);
            return done();
          });
        }
      });
    });

    it('#send a payment request with merchant prefix', function(done) {
      var w = createWallet();
      should.exist(w);
      var address = 'Merchant: ' + server.uri + '/request\nMemo: foo';
      var commentText = 'Hello, server. I\'d like to make a payment.';
      var uri;

      // Replicates code in controllers/send.js:
      if (address.indexOf('bitcoin:') === 0) {
        uri = new bitcore.BIP21(address).data;
      } else if (address.indexOf('Merchant: ') === 0) {
        uri = address.split(/\s+/)[1];
      }

      w.createPaymentTx({ uri: uri, memo: commentText }, function(err, ntxid, merchantData) {
        should.equal(err, null);
        if (w.isShared()) {
          should.exist(ntxid);
          should.exist(merchantData);
          return done();
        } else {
          should.exist(merchantData);
          w.sendTx(ntxid, function(txid, merchantData) {
            should.exist(txid);
            should.exist(merchantData);
            return done();
          });
        }
      });
    });

    it('#send a payment request with bitcoin uri', function(done) {
      var w = createWallet();
      should.exist(w);
      var address = 'bitcoin:2NBzZdFBoQymDgfzH2Pmnthser1E71MmU47?amount=0.00003&r=' + server.uri + '/request';
      var commentText = 'Hello, server. I\'d like to make a payment.';
      w.createPaymentTx({ uri: address, memo: commentText }, function(err, ntxid, merchantData) {
        should.equal(err, null);
        if (w.isShared()) {
          should.exist(ntxid);
          should.exist(merchantData);
          return done();
        } else {
          w.sendTx(ntxid, function(txid, merchantData) {
            should.exist(txid);
            should.exist(merchantData);
            return done();
          });
        }
      });
    });

    it('#try to sign a tampered payment request (raw)', function(done) {
      var w = createWallet();
      should.exist(w);
      var address = 'bitcoin:2NBzZdFBoQymDgfzH2Pmnthser1E71MmU47?amount=0.00003&r=' + server.uri + '/request';
      var commentText = 'Hello, server. I\'d like to make a payment.';
      w.createPaymentTx({ uri: address, memo: commentText }, function(err, ntxid, merchantData) {
        should.equal(err, null);
        should.exist(ntxid);
        should.exist(merchantData);

        // Tamper with payment request in its raw form:
        var data = new Buffer(merchantData.raw, 'hex');
        data = PayPro.PaymentRequest.decode(data);
        var pr = new PayPro();
        pr = pr.makePaymentRequest(data);
        var details = pr.get('serialized_payment_details');
        details = PayPro.PaymentDetails.decode(details);
        var pd = new PayPro();
        pd = pd.makePaymentDetails(details);
        var outputs = pd.get('outputs');
        outputs[outputs.length - 1].set('amount', 1000000000);
        pd.set('outputs', outputs);
        pr.set('serialized_payment_details', pd.serialize());
        merchantData.raw = pr.serialize().toString('hex');

        var myId = w.getMyCopayerId();
        var txp = w.txProposals.get(ntxid);
        should.exist(txp);
        should.exist(txp.signedBy[myId]);
        should.not.exist(txp.rejectedBy[myId]);

        w.verifyPaymentRequest(ntxid).should.equal(false);

        return done();
      });
    });

    it('#try to sign a tampered payment request (abstract)', function(done) {
      var w = createWallet();
      should.exist(w);
      var address = 'bitcoin:2NBzZdFBoQymDgfzH2Pmnthser1E71MmU47?amount=0.00003&r=' + server.uri + '/request';
      var commentText = 'Hello, server. I\'d like to make a payment.';
      w.createPaymentTx({ uri: address, memo: commentText }, function(err, ntxid, merchantData) {
        should.equal(err, null);
        should.exist(ntxid);
        should.exist(merchantData);

        // Tamper with payment request in its abstract form:
        var outputs = merchantData.pr.pd.outputs;
        var output = outputs[outputs.length - 1];
        var amount = output.amount;
        amount.low = 2;

        var myId = w.getMyCopayerId();
        var txp = w.txProposals.get(ntxid);
        should.exist(txp);
        should.exist(txp.signedBy[myId]);
        should.not.exist(txp.rejectedBy[myId]);

        w.verifyPaymentRequest(ntxid).should.equal(false);

        return done();
      });
    });

    it('#try to sign a tampered txp tx (abstract)', function(done) {
      var w = createWallet();
      should.exist(w);
      var address = 'bitcoin:2NBzZdFBoQymDgfzH2Pmnthser1E71MmU47?amount=0.00003&r=' + server.uri + '/request';
      var commentText = 'Hello, server. I\'d like to make a payment.';
      w.createPaymentTx({ uri: address, memo: commentText }, function(err, ntxid, merchantData) {
        should.equal(err, null);
        should.exist(ntxid);
        should.exist(merchantData);

        // Tamper with payment request in its abstract form:
        var txp = w.txProposals.get(ntxid);
        var tx = txp.builder.tx || txp.builder.build();
        tx.outs[0].v = new Buffer([2, 0, 0, 0, 0, 0, 0, 0]);

        var myId = w.getMyCopayerId();
        var txp = w.txProposals.get(ntxid);
        should.exist(txp);
        should.exist(txp.signedBy[myId]);
        should.not.exist(txp.rejectedBy[myId]);

        w.verifyPaymentRequest(ntxid).should.equal(false);

        return done();
      });
    });

    it('#sign an untampered payment request', function(done) {
      var w = createWallet();
      should.exist(w);
      var address = 'bitcoin:2NBzZdFBoQymDgfzH2Pmnthser1E71MmU47?amount=0.00003&r=' + server.uri + '/request';
      var commentText = 'Hello, server. I\'d like to make a payment.';
      w.createPaymentTx({ uri: address, memo: commentText }, function(err, ntxid, merchantData) {
        should.equal(err, null);
        should.exist(ntxid);
        should.exist(merchantData);

        var myId = w.getMyCopayerId();
        var txp = w.txProposals.get(ntxid);
        should.exist(txp);
        should.exist(txp.signedBy[myId]);
        should.not.exist(txp.rejectedBy[myId]);

        w.verifyPaymentRequest(ntxid).should.equal(true);

        return done();
      });
    });

    it('#close payment server', function(done) {
      server.close(function() {
        return done();
      });
    });
  }
});
