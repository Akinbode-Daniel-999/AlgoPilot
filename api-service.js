// API Service for Real-time Market Data
// Supports multiple free APIs with fallback mechanisms

class MarketDataAPI {
    constructor() {
        // API endpoints
        this.apis = {
            coingecko: 'https://api.coingecko.com/api/v3',
            coincap: 'https://api.coincap.io/v2',
            binance: 'https://api.binance.com/api/v3',
            exchangerate: 'https://api.exchangerate-api.com/v4/latest',
            alphavantage: 'https://www.alphavantage.co/query',
            cryptocompare: 'https://min-api.cryptocompare.com/data'
        };

        // Cache for API responses
        this.cache = new Map();
        this.cacheTimeout = 60000; // 1 minute cache

        // Supported pairs
        this.forexPairs = [
            'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD',
            'NZD/USD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'EUR/CHF', 'AUD/JPY',
            'GBP/CHF', 'EUR/AUD', 'USD/CNY', 'USD/HKD', 'USD/SGD', 'USD/INR'
        ];

        this.cryptoPairs = [
            'BTC/USD', 'ETH/USD', 'BNB/USD', 'XRP/USD', 'ADA/USD', 'SOL/USD',
            'DOT/USD', 'DOGE/USD', 'AVAX/USD', 'MATIC/USD', 'LINK/USD', 'UNI/USD',
            'LTC/USD', 'BCH/USD', 'XLM/USD', 'ATOM/USD', 'ALGO/USD', 'VET/USD',
            'TRX/USD', 'FIL/USD', 'ETC/USD', 'THETA/USD', 'XMR/USD', 'AAVE/USD'
        ];
    }

    // Get cached data or fetch new
    async getCachedData(key, fetcher) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        const data = await fetcher();
        this.cache.set(key, { data, timestamp: Date.now() });
        return data;
    }

    // Fetch crypto price from CoinGecko
    async getCryptoPrice(symbol) {
        try {
            const coinId = this.getCoinGeckoId(symbol);
            const url = `${this.apis.coingecko}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`;
            
            const response = await fetch(url);
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

    // Fallback: Get crypto price from Binance
    async getCryptoPriceFromBinance(symbol) {
        try {
            const pair = symbol.replace('/', '') + 'T'; // BTC/USD -> BTCUSDT
            const url = `${this.apis.binance}/ticker/24hr?symbol=${pair}`;
            
            const response = await fetch(url);
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

    // Get Forex rate from Exchange Rate API
    async getForexRate(pair) {
        try {
            const [base, quote] = pair.split('/');
            const url = `${this.apis.exchangerate}/${base}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            return {
                price: data.rates[quote] || 0,
                change24h: 0 // Exchange Rate API doesn't provide 24h change
            };
        } catch (error) {
            console.error('Exchange Rate API error:', error);
            return { price: 0, change24h: 0 };
        }
    }

    // Get historical data for charting
    async getHistoricalData(pair, days = 30) {
        const cacheKey = `hist_${pair}_${days}`;
        
        return this.getCachedData(cacheKey, async () => {
            if (this.isCryptoPair(pair)) {
                return this.getCryptoHistoricalData(pair, days);
            } else {
                return this.getForexHistoricalData(pair, days);
            }
        });
    }

    // Get crypto historical data from CoinGecko
    async getCryptoHistoricalData(pair, days) {
        try {
            const symbol = pair.split('/')[0];
            const coinId = this.getCoinGeckoId(symbol);
            const url = `${this.apis.coingecko}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            return data.prices.map(([timestamp, price]) => ({
                date: new Date(timestamp),
                open: price,
                high: price * 1.001,
                low: price * 0.999,
                close: price,
                volume: Math.random() * 1000000 + 500000
            }));
        } catch (error) {
            console.error('Historical data error:', error);
            return this.generateSyntheticData(pair, days);
        }
    }

    // Get Forex historical data (simulated for free tier)
    async getForexHistoricalData(pair, days) {
        // For free tier, we'll generate realistic data based on current price
        const currentData = await this.getForexRate(pair);
        return this.generateSyntheticData(pair, days, currentData.price);
    }

    // Generate synthetic historical data (fallback)
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

    // Get current market data for a pair
    async getCurrentPrice(pair) {
        const cacheKey = `price_${pair}`;
        
        return this.getCachedData(cacheKey, async () => {
            if (this.isCryptoPair(pair)) {
                const symbol = pair.split('/')[0];
                return this.getCryptoPrice(symbol);
            } else {
                return this.getForexRate(pair);
            }
        });
    }

    // Get all available pairs
    getAllPairs() {
        return {
            forex: this.forexPairs,
            crypto: this.cryptoPairs,
            all: [...this.forexPairs, ...this.cryptoPairs]
        };
    }

    // Helper: Check if pair is crypto
    isCryptoPair(pair) {
        return this.cryptoPairs.includes(pair);
    }

    // Helper: Get CoinGecko ID from symbol
    getCoinGeckoId(symbol) {
        const mapping = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'BNB': 'binancecoin',
            'XRP': 'ripple',
            'ADA': 'cardano',
            'SOL': 'solana',
            'DOT': 'polkadot',
            'DOGE': 'dogecoin',
            'AVAX': 'avalanche-2',
            'MATIC': 'matic-network',
            'LINK': 'chainlink',
            'UNI': 'uniswap',
            'LTC': 'litecoin',
            'BCH': 'bitcoin-cash',
            'XLM': 'stellar',
            'ATOM': 'cosmos',
            'ALGO': 'algorand',
            'VET': 'vechain',
            'TRX': 'tron',
            'FIL': 'filecoin',
            'ETC': 'ethereum-classic',
            'THETA': 'theta-token',
            'XMR': 'monero',
            'AAVE': 'aave'
        };
        return mapping[symbol] || symbol.toLowerCase();
    }

    // Helper: Get default price for a pair
    getDefaultPrice(pair) {
        if (pair.includes('BTC')) return 45000;
        if (pair.includes('ETH')) return 2500;
        if (pair.includes('EUR/USD')) return 1.1;
        if (pair.includes('GBP/USD')) return 1.25;
        if (pair.includes('USD/JPY')) return 150;
        return 1.0;
    }

    // WebSocket connection for real-time updates (Binance)
    connectWebSocket(pair, callback) {
        if (!this.isCryptoPair(pair)) {
            console.log('WebSocket only available for crypto pairs');
            return null;
        }

        const symbol = pair.replace('/', '').toLowerCase() + 'usdt';
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@ticker`);
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            callback({
                price: parseFloat(data.c),
                change24h: parseFloat(data.P),
                volume: parseFloat(data.v)
            });
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return ws;
    }

    // Get market overview (top movers, etc.)
    async getMarketOverview() {
        try {
            const url = `${this.apis.coingecko}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`;
            const response = await fetch(url);
            const data = await response.json();
            
            return data.map(coin => ({
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

// Export singleton instance
const marketDataAPI = new MarketDataAPI();

// For use in browser
if (typeof window !== 'undefined') {
    window.MarketDataAPI = marketDataAPI;
}