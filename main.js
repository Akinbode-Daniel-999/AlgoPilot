// ==================== AUTHENTICATION ====================
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

if (typeof currentUser === 'string') {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const resolvedUser = users.find((user) => user.id === currentUser);
    if (resolvedUser) {
        currentUser = resolvedUser;
        localStorage.setItem('currentUser', JSON.stringify(resolvedUser));
    } else {
        currentUser = null;
    }
}

if (!currentUser) {
    window.location.href = 'login.html';
} else {
    document.getElementById('userName').textContent = currentUser.username || currentUser.email || 'Trader';
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// ==================== THEME + UI ====================
function toggleThemeSwitch(el) {
    const newTheme = el.checked ? 'dark' : 'light';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    if (window.lastData) {
        displayResults(
            window.lastData.data,
            window.lastData.fastMA,
            window.lastData.slowMA,
            window.lastData.rsi,
            window.lastData.signals,
            window.lastData.results,
            window.lastData.initialCapital
        );
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);

    const checkbox = document.getElementById('themeCheckbox');
    if (checkbox && savedTheme === 'dark') {
        checkbox.checked = true;
    }
});

function toggleMenu() {
    document.getElementById('navMenu').classList.toggle('show');
}

document.addEventListener('click', (event) => {
    const navMenu = document.getElementById('navMenu');
    const menuToggle = document.querySelector('.menu-toggle');

    if (navMenu && menuToggle) {
        if (!navMenu.contains(event.target) && !menuToggle.contains(event.target)) {
            navMenu.classList.remove('show');
        }
    }
});

function showAPIStatus(message, type = 'info') {
    const banner = document.getElementById('apiStatus');
    if (!banner) return;

    banner.style.display = 'block';
    banner.textContent = message;
    banner.className = `api-status ${type}`;
}

function hideAPIStatus() {
    const banner = document.getElementById('apiStatus');
    if (banner) {
        banner.style.display = 'none';
    }
}

// ==================== DATA INITIALIZATION ====================
async function initializeMarketPairs() {
    const marketSelect = document.getElementById('market');
    if (!marketSelect || !window.MarketDataAPI) return;

    showAPIStatus('Loading real-time currency universe...', 'info');

    try {
        const { forex, crypto } = await window.MarketDataAPI.getAllPairs();

        const savedPair = localStorage.getItem('selectedMarketPair') || 'EUR/USD';
        const fragment = document.createDocumentFragment();

        const forexGroup = document.createElement('optgroup');
        forexGroup.label = 'Forex (All Currencies vs USD)';
        forex.forEach((pair) => {
            const option = document.createElement('option');
            option.value = pair;
            option.textContent = pair;
            forexGroup.appendChild(option);
        });

        const cryptoGroup = document.createElement('optgroup');
        cryptoGroup.label = 'Cryptocurrency (USD Quote)';
        crypto.forEach((pair) => {
            const option = document.createElement('option');
            option.value = pair;
            option.textContent = pair;
            cryptoGroup.appendChild(option);
        });

        fragment.appendChild(forexGroup);
        fragment.appendChild(cryptoGroup);

        marketSelect.innerHTML = '';
        marketSelect.appendChild(fragment);

        const pairExists = [...marketSelect.options].some((option) => option.value === savedPair);
        marketSelect.value = pairExists ? savedPair : 'EUR/USD';

        marketSelect.addEventListener('change', () => {
            localStorage.setItem('selectedMarketPair', marketSelect.value);
        });

        hideAPIStatus();
    } catch (error) {
        console.error('Failed to initialize market pairs:', error);
        showAPIStatus('Using fallback pair list. Real-time currency list API is temporarily unavailable.', 'warning');
    }
}

async function refreshMarketOverview() {
    const container = document.getElementById('marketOverview');
    if (!container || !window.MarketDataAPI) return;

    try {
        const overview = await window.MarketDataAPI.getMarketOverview();
        if (!overview.length) {
            container.innerHTML = '<p style="color: var(--text-secondary);">Live market overview temporarily unavailable.</p>';
            return;
        }

        container.innerHTML = overview
            .map((asset) => {
                const positive = asset.change24h >= 0;
                return `
                    <div class="market-item">
                        <div class="market-symbol">${asset.symbol}</div>
                        <div class="market-price">$${asset.price.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
                        <div class="market-change ${positive ? 'positive' : 'negative'}">${positive ? '+' : ''}${asset.change24h.toFixed(2)}%</div>
                    </div>
                `;
            })
            .join('');
    } catch (error) {
        console.error('Market overview refresh error:', error);
        container.innerHTML = '<p style="color: var(--text-secondary);">Unable to load market overview right now.</p>';
    }
}

// ==================== STRATEGY CALCULATIONS ====================
function generateMarketData(market, days = 200) {
    const data = [];
    let price = market === 'forex' ? 1.1 : market === 'eth' ? 2000 : 45000;
    const volatility = market === 'forex' ? 0.005 : 0.02;
    const trend = 0.0002;

    for (let i = 0; i < days; i++) {
        const change = (Math.random() - 0.48) * volatility + trend;
        price = price * (1 + change);

        const open = price * (1 + (Math.random() - 0.5) * 0.002);
        const close = price * (1 + (Math.random() - 0.5) * 0.002);
        const high = Math.max(open, close) * (1 + Math.random() * 0.003);
        const low = Math.min(open, close) * (1 - Math.random() * 0.003);

        data.push({
            date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000),
            open,
            high,
            low,
            close,
            volume: Math.random() * 1000000 + 500000
        });
    }

    return data;
}

function calculateSMA(data, period) {
    const sma = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            sma.push(null);
        } else {
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += data[i - j].close;
            }
            sma.push(sum / period);
        }
    }
    return sma;
}

function calculateRSI(data, period) {
    const rsi = [];

    for (let i = 0; i < data.length; i++) {
        if (i < period) {
            rsi.push(null);
            continue;
        }

        let gains = 0;
        let losses = 0;

        for (let j = 0; j < period; j++) {
            const change = data[i - j].close - data[i - j - 1].close;
            if (change > 0) gains += change;
            else losses += Math.abs(change);
        }

        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgGain / (avgLoss || 0.0001);
        rsi.push(100 - (100 / (1 + rs)));
    }

    return rsi;
}

function generateSignals(data, fastMA, slowMA, rsi) {
    const signals = [];

    for (let i = 1; i < data.length; i++) {
        if (!fastMA[i] || !slowMA[i] || !rsi[i]) {
            signals.push('HOLD');
            continue;
        }

        const prevFast = fastMA[i - 1];
        const prevSlow = slowMA[i - 1];
        const currFast = fastMA[i];
        const currSlow = slowMA[i];
        const currRSI = rsi[i];

        if (prevFast <= prevSlow && currFast > currSlow && currRSI < 70) {
            signals.push('BUY');
        } else if (prevFast >= prevSlow && currFast < currSlow && currRSI > 30) {
            signals.push('SELL');
        } else {
            signals.push('HOLD');
        }
    }

    return signals;
}

function backtestStrategy(data, signals, initialCapital, positionSize) {
    let capital = initialCapital;
    let position = 0;
    const trades = [];
    const equity = [initialCapital];

    for (let i = 1; i < data.length; i++) {
        const signal = signals[i];
        const price = data[i].close;

        if (signal === 'BUY' && position === 0) {
            const investAmount = capital * (positionSize / 100);
            position = investAmount / price;
            capital -= investAmount;
            trades.push({ type: 'BUY', price, date: data[i].date, shares: position });
        } else if (signal === 'SELL' && position > 0) {
            const saleAmount = position * price;
            capital += saleAmount;

            const lastBuy = trades.filter((t) => t.type === 'BUY').slice(-1)[0];
            const profit = saleAmount - (lastBuy.shares * lastBuy.price);

            trades.push({ type: 'SELL', price, date: data[i].date, shares: position, profit });
            position = 0;
        }

        equity.push(capital + (position * price));
    }

    if (position > 0) {
        capital += position * data[data.length - 1].close;
    }

    return { trades, equity, finalCapital: capital };
}

// ==================== EXECUTION ====================
async function runBacktest() {
    const market = document.getElementById('market').value;
    const fastMAPeriod = parseInt(document.getElementById('fastMA').value, 10);
    const slowMAPeriod = parseInt(document.getElementById('slowMA').value, 10);
    const rsiPeriod = parseInt(document.getElementById('rsiPeriod').value, 10);
    const initialCapital = parseFloat(document.getElementById('initialCapital').value);
    const positionSize = parseFloat(document.getElementById('positionSize').value);

    document.getElementById('loading').style.display = 'block';
    document.getElementById('runBacktest').disabled = true;

    try {
        showAPIStatus(`Fetching live historical data for ${market}...`, 'info');

        let data = [];
        if (window.MarketDataAPI) {
            data = await window.MarketDataAPI.getHistoricalData(market, 220);
        }

        if (!Array.isArray(data) || data.length < slowMAPeriod + 5) {
            showAPIStatus('Live API has limited history for this pair. Using resilient synthetic fallback.', 'warning');
            data = generateMarketData(market.toLowerCase().includes('usd') ? 'forex' : 'crypto', 220);
        } else {
            hideAPIStatus();
        }

        const fastMA = calculateSMA(data, fastMAPeriod);
        const slowMA = calculateSMA(data, slowMAPeriod);
        const rsi = calculateRSI(data, rsiPeriod);
        const signals = generateSignals(data, fastMA, slowMA, rsi);
        const results = backtestStrategy(data, signals, initialCapital, positionSize);

        window.lastData = { data, fastMA, slowMA, rsi, signals, results, initialCapital };
        displayResults(data, fastMA, slowMA, rsi, signals, results, initialCapital);
    } catch (error) {
        console.error('Backtest failed:', error);
        showAPIStatus('Error fetching real-time API data. Please retry in a moment.', 'warning');
    } finally {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('runBacktest').disabled = false;
    }
}

function getThemeColors() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    return {
        bg: isDark ? '#2d2d2d' : '#ffffff',
        text: isDark ? '#e8e8e8' : '#1a1a1a',
        grid: isDark ? '#404040' : '#e0e0e0',
        primary: isDark ? '#3a8f3a' : '#2d7a2d',
        secondary: isDark ? '#2d7a2d' : '#1a5c1a',
        light: '#51cf66'
    };
}

function displayResults(data, fastMA, slowMA, rsi, signals, results, initialCapital) {
    const totalReturn = ((results.finalCapital - initialCapital) / initialCapital * 100).toFixed(2);
    const buyTrades = results.trades.filter((t) => t.type === 'BUY').length;
    const sellTrades = results.trades.filter((t) => t.type === 'SELL').length;
    const profitableTrades = results.trades.filter((t) => t.type === 'SELL' && t.profit > 0).length;
    const winRate = sellTrades > 0 ? (profitableTrades / sellTrades * 100).toFixed(2) : 0;

    let maxEquity = initialCapital;
    let maxDrawdown = 0;
    results.equity.forEach((eq) => {
        if (eq > maxEquity) maxEquity = eq;
        const drawdown = ((maxEquity - eq) / maxEquity) * 100;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    const returns = [];
    for (let i = 1; i < results.equity.length; i++) {
        returns.push((results.equity[i] - results.equity[i - 1]) / results.equity[i - 1]);
    }
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length);
    const sharpeRatio = (stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0).toFixed(2);

    document.getElementById('performanceMetrics').innerHTML = `
        <div class="metric"><span class="metric-label">Total Return</span><span class="metric-value ${totalReturn >= 0 ? 'positive' : 'negative'}">${totalReturn}%</span></div>
        <div class="metric"><span class="metric-label">Final Capital</span><span class="metric-value">$${results.finalCapital.toFixed(2)}</span></div>
        <div class="metric"><span class="metric-label">Net Profit/Loss</span><span class="metric-value ${(results.finalCapital - initialCapital) >= 0 ? 'positive' : 'negative'}">$${(results.finalCapital - initialCapital).toFixed(2)}</span></div>
        <div class="metric"><span class="metric-label">Sharpe Ratio</span><span class="metric-value">${sharpeRatio}</span></div>
    `;

    document.getElementById('tradeStats').innerHTML = `
        <div class="metric"><span class="metric-label">Total Trades</span><span class="metric-value">${buyTrades}</span></div>
        <div class="metric"><span class="metric-label">Completed Trades</span><span class="metric-value">${sellTrades}</span></div>
        <div class="metric"><span class="metric-label">Profitable Trades</span><span class="metric-value positive">${profitableTrades}</span></div>
        <div class="metric"><span class="metric-label">Win Rate</span><span class="metric-value">${winRate}%</span></div>
    `;

    const lastSignal = signals[signals.length - 1];
    const signalClass = lastSignal === 'BUY' ? 'buy' : lastSignal === 'SELL' ? 'sell' : 'hold';
    document.getElementById('currentSignal').innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div class="signal ${signalClass}" style="font-size: 1.2em; display: inline-block;">${lastSignal}</div>
            <p style="margin-top: 15px; color: var(--text-secondary);">Current Price: $${data[data.length - 1].close.toFixed(6)}</p>
        </div>
    `;

    document.getElementById('riskMetrics').innerHTML = `
        <div class="metric"><span class="metric-label">Max Drawdown</span><span class="metric-value negative">${maxDrawdown.toFixed(2)}%</span></div>
        <div class="metric"><span class="metric-label">Current RSI</span><span class="metric-value">${rsi[rsi.length - 1] ? rsi[rsi.length - 1].toFixed(2) : 'N/A'}</span></div>
        <div class="metric"><span class="metric-label">Volatility</span><span class="metric-value">${(stdDev * 100).toFixed(2)}%</span></div>
    `;

    plotPriceChart(data, fastMA, slowMA, signals);
    plotEquityChart(data, results.equity);
    plotIndicatorChart(data, rsi);
}

function plotPriceChart(data, fastMA, slowMA, signals) {
    const colors = getThemeColors();
    const dates = data.map((d) => d.date);
    const prices = data.map((d) => d.close);

    const buySignals = data.map((d, i) => (signals[i] === 'BUY' ? d.close : null));
    const sellSignals = data.map((d, i) => (signals[i] === 'SELL' ? d.close : null));

    const layout = {
        paper_bgcolor: colors.bg,
        plot_bgcolor: colors.bg,
        font: { color: colors.text },
        xaxis: { title: 'Date', gridcolor: colors.grid, color: colors.text },
        yaxis: { title: 'Price', gridcolor: colors.grid, color: colors.text },
        showlegend: true,
        legend: { x: 0, y: 1, font: { color: colors.text } },
        hovermode: 'x unified',
        margin: { t: 20, b: 50, l: 60, r: 20 }
    };

    Plotly.newPlot('priceChart', [
        { x: dates, y: prices, type: 'scatter', mode: 'lines', name: 'Price', line: { color: colors.primary, width: 2 } },
        { x: dates, y: fastMA, type: 'scatter', mode: 'lines', name: 'Fast MA', line: { color: colors.light, width: 1.5, dash: 'dash' } },
        { x: dates, y: slowMA, type: 'scatter', mode: 'lines', name: 'Slow MA', line: { color: colors.secondary, width: 1.5, dash: 'dash' } },
        { x: dates, y: buySignals, type: 'scatter', mode: 'markers', name: 'Buy Signal', marker: { color: colors.primary, size: 10, symbol: 'triangle-up' } },
        { x: dates, y: sellSignals, type: 'scatter', mode: 'markers', name: 'Sell Signal', marker: { color: '#c92a2a', size: 10, symbol: 'triangle-down' } }
    ], layout, { responsive: true });
}

function plotEquityChart(data, equity) {
    const colors = getThemeColors();
    Plotly.newPlot('equityChart', [{
        x: data.map((d) => d.date),
        y: equity,
        type: 'scatter',
        mode: 'lines',
        name: 'Portfolio Value',
        line: { color: colors.primary, width: 2 },
        fill: 'tozeroy',
        fillcolor: `${colors.primary}20`
    }], {
        paper_bgcolor: colors.bg,
        plot_bgcolor: colors.bg,
        font: { color: colors.text },
        xaxis: { title: 'Date', gridcolor: colors.grid, color: colors.text },
        yaxis: { title: 'Portfolio Value ($)', gridcolor: colors.grid, color: colors.text },
        showlegend: false,
        hovermode: 'x unified',
        margin: { t: 20, b: 50, l: 60, r: 20 }
    }, { responsive: true });
}

function plotIndicatorChart(data, rsi) {
    const colors = getThemeColors();
    const dates = data.map((d) => d.date);

    Plotly.newPlot('indicatorChart', [
        { x: dates, y: rsi, type: 'scatter', mode: 'lines', name: 'RSI', line: { color: colors.primary, width: 2 } },
        { x: dates, y: Array(dates.length).fill(70), type: 'scatter', mode: 'lines', name: 'Overbought (70)', line: { color: '#c92a2a', width: 1, dash: 'dash' } },
        { x: dates, y: Array(dates.length).fill(30), type: 'scatter', mode: 'lines', name: 'Oversold (30)', line: { color: colors.primary, width: 1, dash: 'dash' } }
    ], {
        paper_bgcolor: colors.bg,
        plot_bgcolor: colors.bg,
        font: { color: colors.text },
        xaxis: { title: 'Date', gridcolor: colors.grid, color: colors.text },
        yaxis: { title: 'RSI Value', range: [0, 100], gridcolor: colors.grid, color: colors.text },
        showlegend: true,
        legend: { x: 0, y: 1, font: { color: colors.text } },
        hovermode: 'x unified',
        margin: { t: 20, b: 50, l: 60, r: 20 }
    }, { responsive: true });
}

window.addEventListener('load', async () => {
    await initializeMarketPairs();
    await refreshMarketOverview();
    await runBacktest();

    setInterval(refreshMarketOverview, 60000);
});
