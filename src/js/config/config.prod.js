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
        insight: 'https://insight.bitpay.com',
        network: 'litvenet'
    },
    ltc: {
        bwsurl: 'http://bws.bitchk.com/bws/api',
        insight: 'http://localhost:3001/insight',
        network: 'ltcnet'
    },
    ven: {
        bwsurl: 'http://bws.bitchk.com/bws/api',
        insight: 'http://insight.ventasnu.com',
        network: 'ventas'
    },
    tbc: {
        bwsurl: 'http://bws.bitchk.com/bws/api',
        insight: 'http://insight.teracoex.com/insight',
        network: 'terabit'
    },
}