var DEFAULT_CONFIG = {
    networkName: 'ventas',
    coin: 'ven',
    bwsurl: 'http://localhost:3232/bws/api',
    showMoney: false,
    networks: ['livenet', 'ventas', 'litecoin']
}
var COIN_CONFIG = {
    btc: {
        bwsurl: 'https://localhost:3232/bws/api',
        insight: 'https://insight.bitpay.com'
    },
    ltc: {
        bwsurl: 'http://localhost:3232/bws/api',
        insight: 'http://localhost:3001/insight'
    },
    ven: {
        bwsurl: 'http://localhost:3232/bws/api',
        insight: 'http://localhost:3001'
    },
    tbc: {
        bwsurl: 'http://localhost:3232/bws/api',
        insight: 'http://localhost:3001/insight-tbc'
    },
}