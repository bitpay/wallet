var DEFAULT_CONFIG = {
    networkName: 'ventas',
    coin: 'ven',
    bwsurl: 'http://bws-m.bitchk.com/bws/api',
    showMoney: false,
    networks: ['livenet', 'ventas', 'litecoin']
}
var COIN_CONFIG = {
    btc: {
        bwsurl: 'http://bws-m.bitchk.com/bws/api',
        insight: 'https://insight.bitpay.com'
    },
    ltc: {
        bwsurl: 'http://bws-m.bitchk.com/bws/api',
        insight: 'http://localhost:3001/insight'
    },
    ven: {
        bwsurl: 'http://bws-m.bitchk.com/bws/api',
        insight: 'http://insight.ventasnu.com'
    },
    tbc: {
        bwsurl: 'http://bws-m.bitchk.com/bws/api',
        insight: 'http://insight.teracoex.com'
    },
}