// API Service for Real-time Market Data with resilient fallbacks
class MarketDataAPI {
    constructor() {
        this.apis = {
            coingecko: 'https://api.coingecko.com/api/v3',
            frankfurter: 'https://api.frankfurter.app',
            binance: 'https://api.binance.com/api/v3'
        };

        this.cache = new Map();
        this.cacheTimeout = 60000;

        this.cryptoPairs = [
            'BTC/USD', 'ETH/USD', 'BNB/USD', 'XRP/USD', 'ADA/USD', 'SOL/USD',
            'DOT/USD', 'DOGE/USD', 'AVAX/USD', 'MATIC/USD', 'LINK/USD', 'UNI/USD',
            'LTC/USD', 'BCH/USD', 'XLM/USD', 'ATOM/USD', 'ALGO/USD', 'VET/USD',
            'TRX/USD', 'FIL/USD', 'ETC/USD', 'THETA/USD', 'XMR/USD', 'AAVE/USD'
        ];
    }

    async getCachedData(key, fetcher, ttl = this.cacheTimeout) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < ttl) {
            return cached.data;
        }

        const data = await fetcher();
        this.cache.set(key, { data, timestamp: Date.now() });
        return data;
    }

    async getAllPairs() {
        const forex = await this.getCachedData('forex_pairs_all', async () => {
            const response = await fetch(`${this.apis.frankfurter}/currencies`);
            if (!response.ok) throw new Error('Unable to load currency list');
            const currencies = await response.json();

            return Object.keys(currencies)
                .filter((code) => code !== 'USD')
                .sort()
                .map((code) => `${code}/USD`);
        }, 1000 * 60 * 60 * 12);

        return {
            forex,
            crypto: this.cryptoPairs,
            all: [...forex, ...this.cryptoPairs]
        };
    }

    async getCryptoPrice(symbol) {
        try {
            const coinId = this.getCoinGeckoId(symbol);
            const url = `${this.apis.coingecko}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('CoinGecko price unavailable');
            const data = await response.json();

            return {
                price: data[coinId]?.usd || 0,
                change24h: data[coinId]?.usd_24h_change || 0
            };
        } catch (error) {
            console.error('CoinGecko API error:', error);
            return this.getCryptoPriceFromBinance(symbol);
        }
    }

    async getCryptoPriceFromBinance(symbol) {
        try {
            const pair = `${symbol}USDT`;
            const url = `${this.apis.binance}/ticker/24hr?symbol=${pair}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Binance price unavailable');
            const data = await response.json();

            return {
                price: parseFloat(data.lastPrice),
                change24h: parseFloat(data.priceChangePercent)
            };
        } catch (error) {
            console.error('Binance API error:', error);
            return { price: 0, change24h: 0 };
        }
    }

    async getForexRate(pair) {
        try {
            const [base, quote] = pair.split('/');
            const response = await fetch(`${this.apis.frankfurter}/latest?amount=1&from=${base}&to=${quote}`);
            if (!response.ok) throw new Error('Frankfurter latest unavailable');
            const data = await response.json();

            return {
                price: data.rates[quote] || 0,
                change24h: 0
            };
        } catch (error) {
            console.error('Forex API error:', error);
            return { price: 0, change24h: 0 };
        }
    }

    async getHistoricalData(pair, days = 30) {
        const cacheKey = `hist_${pair}_${days}`;

        return this.getCachedData(cacheKey, async () => {
            if (this.isCryptoPair(pair)) {
                return this.getCryptoHistoricalData(pair, days);
            }
            return this.getForexHistoricalData(pair, days);
        });
    }

    async getCryptoHistoricalData(pair, days) {
        try {
            const symbol = pair.split('/')[0];
            const coinId = this.getCoinGeckoId(symbol);
            const response = await fetch(`${this.apis.coingecko}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`);
            if (!response.ok) throw new Error('CoinGecko chart unavailable');
            const data = await response.json();

            return data.prices.map(([timestamp, price], index) => {
                const prev = index > 0 ? data.prices[index - 1][1] : price;
                const open = prev;
                const close = price;
                const span = Math.abs(close - open) * 0.35;

                return {
                    date: new Date(timestamp),
                    open,
                    high: Math.max(open, close) + span,
                    low: Math.max(0, Math.min(open, close) - span),
                    close,
                    volume: Math.random() * 1000000 + 500000
                };
            });
        } catch (error) {
            console.error('Crypto historical data error:', error);
            return this.generateSyntheticData(pair, days);
        }
    }

    async getForexHistoricalData(pair, days) {
        try {
            const [base, quote] = pair.split('/');
            const endDate = new Date();
            const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
            const toISO = (date) => date.toISOString().split('T')[0];

            const url = `${this.apis.frankfurter}/${toISO(startDate)}..${toISO(endDate)}?from=${base}&to=${quote}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Frankfurter timeseries unavailable');
            const payload = await response.json();

            const points = Object.entries(payload.rates || {})
                .sort(([a], [b]) => new Date(a) - new Date(b))
                .map(([date, rates]) => ({ date: new Date(date), close: rates[quote] }));

            if (!points.length) {
                const current = await this.getForexRate(pair);
                return this.generateSyntheticData(pair, days, current.price);
            }

            return points.map((point, index) => {
                const prevClose = index > 0 ? points[index - 1].close : point.close;
                const open = prevClose;
                const close = point.close;
                const spread = Math.max(close * 0.0008, Math.abs(close - open) * 0.5);

                return {
                    date: point.date,
                    open,
                    high: Math.max(open, close) + spread,
                    low: Math.max(0, Math.min(open, close) - spread),
                    close,
                    volume: Math.random() * 300000 + 120000
                };
            });
        } catch (error) {
            console.error('Forex historical data error:', error);
            const current = await this.getForexRate(pair);
            return this.generateSyntheticData(pair, days, current.price || this.getDefaultPrice(pair));
        }
    }

    generateSyntheticData(pair, days, currentPrice = null) {
        const data = [];
        let price = currentPrice || this.getDefaultPrice(pair);
        const volatility = this.isCryptoPair(pair) ? 0.02 : 0.005;

        for (let i = days; i >= 0; i--) {
            const change = (Math.random() - 0.5) * volatility;
            price = price * (1 + change);

            const open = price * (1 + (Math.random() - 0.5) * 0.002);
            const close = price * (1 + (Math.random() - 0.5) * 0.002);
            const high = Math.max(open, close) * (1 + Math.random() * 0.003);
            const low = Math.min(open, close) * (1 - Math.random() * 0.003);

            data.push({
                date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
                open,
                high,
                low,
                close,
                volume: Math.random() * 1000000 + 500000
            });
        }

        return data;
    }

    async getCurrentPrice(pair) {
        const cacheKey = `price_${pair}`;
        return this.getCachedData(cacheKey, async () => {
            if (this.isCryptoPair(pair)) {
                const symbol = pair.split('/')[0];
                return this.getCryptoPrice(symbol);
            }
            return this.getForexRate(pair);
        }, 15000);
    }

    isCryptoPair(pair) {
        return this.cryptoPairs.includes(pair);
    }

    getCoinGeckoId(symbol) {
        const mapping = {
            BTC: 'bitcoin',
            ETH: 'ethereum',
            BNB: 'binancecoin',
            XRP: 'ripple',
            ADA: 'cardano',
            SOL: 'solana',
            DOT: 'polkadot',
            DOGE: 'dogecoin',
            AVAX: 'avalanche-2',
            MATIC: 'matic-network',
            LINK: 'chainlink',
            UNI: 'uniswap',
            LTC: 'litecoin',
            BCH: 'bitcoin-cash',
            XLM: 'stellar',
            ATOM: 'cosmos',
            ALGO: 'algorand',
            VET: 'vechain',
            TRX: 'tron',
            FIL: 'filecoin',
            ETC: 'ethereum-classic',
            THETA: 'theta-token',
            XMR: 'monero',
            AAVE: 'aave'
        };
        return mapping[symbol] || symbol.toLowerCase();
    }

    getDefaultPrice(pair) {
        if (pair.includes('BTC')) return 45000;
        if (pair.includes('ETH')) return 2500;
        if (pair.includes('EUR/USD')) return 1.1;
        if (pair.includes('GBP/USD')) return 1.25;
        if (pair.includes('USD/JPY')) return 150;
        return 1;
    }

    async getMarketOverview() {
        try {
            const response = await fetch(`${this.apis.coingecko}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`);
            if (!response.ok) throw new Error('CoinGecko overview unavailable');
            const data = await response.json();

            return data.map((coin) => ({
                symbol: coin.symbol.toUpperCase(),
                name: coin.name,
                price: coin.current_price,
                change24h: coin.price_change_percentage_24h,
                marketCap: coin.market_cap,
                volume: coin.total_volume
            }));
        } catch (error) {
            console.error('Market overview error:', error);
            return [];
        }
    }
}

const marketDataAPI = new MarketDataAPI();

if (typeof window !== 'undefined') {
    window.MarketDataAPI = marketDataAPI;
}
