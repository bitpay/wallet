var DEFAULT_CONFIG = {
    networkName: 'yangcoin',
    coin: 'yng',
    bwsurl: 'http://192.168.0.12:3232/bws/api',
    showMoney: false,
    networks: ['livenet', 'ventas', 'litecoin', 'yangcoin']
}
var COIN_CONFIG = {
    btc: {
        bwsurl: 'https://192.168.0.12:3232/bws/api',
        insight: 'https://insight.bitpay.com'
    },
    ltc: {
        bwsurl: 'http://192.168.0.12:3232/bws/api',
        insight: 'http://192.168.0.12:3001/insight'
    },
    ven: {
        bwsurl: 'http://192.168.0.12:3232/bws/api',
        insight: 'http://192.168.0.12:3001'
    },
    yng: {
        bwsurl: 'http://192.168.0.12:3232/bws/api',
        insight: 'http://192.168.0.12:23080/insight-yng'
    },
}