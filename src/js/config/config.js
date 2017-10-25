var DEFAULT_CONFIG = {
    networkName: 'ventas',
    coin: 'ven',
    bwsurl: 'http://bws.bitchk.com/bws/api',
    showMoney: false,
    networks: ['livenet', 'ventas', 'litecoin']
}
var COIN_CONFIG = {
    btc: {
        bwsurl: 'http://bws.bitchk.com/bws/api',
        insight: 'https://insight.bitpay.com'
    },
    ltc: {
        bwsurl: 'http://bws.bitchk.com/bws/api',
        insight: 'http://insight-ltc.bitchk.com/insight'
    },
    ven: {
        bwsurl: 'http://bws.bitchk.com/bws/api',
        insight: 'http://insight.ventasnu.com'
    },
    tbc: {
        bwsurl: 'http://bws.bitchk.com/bws/api',
        insight: 'http://insight.teracoex.com/insight'
    },
}