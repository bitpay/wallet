var DEFAULT_CONFIG = {
    networkName: 'yangcoin',
    coin: 'yng',
    bwsurl: 'https://bws.bitchk.com/bws/api',
    showMoney: false,
    networks: ['livenet',
        'litecoin',
        'ventas',
        'yangcoin',
        'quasar', 'qcity',
        'searchcoin',
        'paxcoin'
    ]
}
var COIN_CONFIG = {
    btc: {
        bwsurl: 'https://bws.bitchk.com/bws/api',
        insight: 'http://insight-btc.bitchk.com',
        network: 'litvenet',
        coin: 'btc',
        displayName: "BTC",
        enable: true,
        coinName: "Bitcoin"
    },
    ltc: {
        bwsurl: 'https://bws.bitchk.com/bws/api',
        insight: 'http://insight-ltc.bitchk.com/insight',
        network: 'litecoin',
        coin: 'ltc',
        displayName: "LTC",
        enable: true,
        coinName: "Litecoin"
    },
    ven: {
        bwsurl: 'https://bws.bitchk.com/bws/api',
        insight: 'https://insight.ventasnu.com',
        coin: 'ven',
        displayName: "VEN",
        coinName: "VENTAS",
        enable: true,
    },
    yng: {
        bwsurl: 'https://bws.bitchk.com/bws/api',
        insight: 'https://insight-yng.bitchk.com',
        coin: 'yng',
        displayName: "YNG",
        coinName: "YangCoin",
        enable: true,
    },
    qct: {
        bwsurl: 'https://bws.bitchk.com/bws/api',
        insight: 'https://insight-qct.bitchk.com',
        coin: 'qct',
        displayName: "QCT",
        coinName: "QCity",
        enable: true,
    },
    qac: {
        bwsurl: 'https://bws.bitchk.com/bws/api',
        insight: 'https://insight-qac.bitchk.com',
        coin: 'qac',
        displayName: "QAC",
        coinName: "Quasar",
        enable: true,
    },
    pax: {
        bwsurl: 'https://bws.bitchk.com/bws/api',
        insight: 'https://insight=pax.bitchk.com',
        coin: 'pax',
        displayName: "PAX",
        coinName: "Paxcoin",
        enable: true,
    },
    ssc: {
        bwsurl: 'https://bws.bitchk.com/bws/api',
        insight: 'http://insight.ventasnu.com',
        coin: 'ssc',
        displayName: "SSC",
        coinName: "SearchCoin",
        enable: true,
    }
}