# AlgoTrade - Algorithmic Trading Dashboard

A complete web-based algorithmic trading platform for forex and cryptocurrency markets with user authentication and real-time backtesting capabilities.

## 📁 Project Structure

```
AlgoTrade/
│
├── login.html              ← Login page (START HERE)
├── login.css              ← Login page styles
├── login.js               ← Login authentication logic
│
├── signup.html            ← User registration page
├── signup.css             ← Signup page styles
├── signup.js              ← Signup logic
│
├── main.html              ← Main trading dashboard
├── main.css               ← Dashboard styles with responsive design
├── main.js                ← Trading algorithms and chart logic
│
└── README.md              ← This file
```

## 🚀 How to Use

### 1. Setup
1. Download all files into a single folder
2. Keep all files in the same directory (no subfolders needed)
3. Open `login.html` in your web browser

### 2. User Flow
**Step 1: Sign Up**
- Click "Sign up" link on login page
- Create a new account (username min 3 chars, password min 4 chars)
- You'll be redirected to login page

**Step 2: Login**
- Enter your credentials
- Click "Login"
- You'll be redirected to the main dashboard

**Step 3: Use Dashboard**
- View real-time trading signals
- Adjust strategy parameters
- Run backtests with different settings
- Toggle between light/dark mode
- View performance metrics and charts

### 3. Features

#### 🔐 Authentication System
- Secure user registration and login
- Session management using localStorage
- Automatic redirect if not logged in
- Clean logout functionality

#### 📊 Trading Dashboard
- **Multiple Markets**: Forex (EUR/USD), Bitcoin, Ethereum
- **Trading Strategy**: Moving Average Crossover with RSI Filter
- **Customizable Parameters**:
  - Fast MA Period (5-50)
  - Slow MA Period (20-100)
  - RSI Period (10-30)
  - Initial Capital ($1000+)
  - Position Size (1-100%)

#### 📈 Analysis Tools
- **Performance Metrics**: Total return, final capital, net profit/loss, Sharpe ratio
- **Trade Statistics**: Total trades, completed trades, profitable trades, win rate
- **Risk Metrics**: Max drawdown, current RSI, volatility
- **Interactive Charts**:
  - Price action with buy/sell signals
  - Portfolio equity curve
  - RSI technical indicators

#### 🎨 User Experience
- Light and Dark mode
- Fully responsive design (mobile, tablet, desktop)
- Smooth animations and transitions
- Real-time chart updates

## 📱 Responsive Design

### Desktop (1024px+)
- Full sidebar navigation
- 4-column dashboard grid
- Expanded charts

### Tablet (768px - 1023px)
- Collapsible mobile menu
- 2-column dashboard grid
- Optimized chart sizes

### Mobile (< 768px)
- Hamburger menu
- Single column layout
- Touch-optimized controls
- Compact charts

## 🎨 Theme System

### Light Mode (Default)
- Fresh green and white color scheme
- Easy on the eyes for daytime use
- Professional appearance

### Dark Mode
- Dark backgrounds with green accents
- Reduced eye strain for nighttime use
- Automatic chart color adaptation

## 💾 Data Storage

Uses browser localStorage for:
- User credentials (users array)
- Current logged-in user
- Theme preference (light/dark)

**Note**: Data persists across sessions but is stored locally in the browser.

## 🔧 Technical Details

### Technologies Used
- **HTML5**: Structure
- **CSS3**: Styling with CSS Variables for theming
- **JavaScript (ES6+)**: Logic and interactivity
- **Plotly.js**: Interactive charts

### Trading Algorithm
**Strategy**: Moving Average Crossover + RSI Filter

**Buy Signal**:
- Fast MA crosses above Slow MA
- RSI < 70 (not overbought)

**Sell Signal**:
- Fast MA crosses below Slow MA
- RSI > 30 (not oversold)

### Performance Calculations
- **Sharpe Ratio**: Risk-adjusted return measure
- **Max Drawdown**: Largest peak-to-trough decline
- **Win Rate**: Percentage of profitable trades
- **Total Return**: (Final Capital - Initial Capital) / Initial Capital × 100%

## 🌐 Browser Compatibility

Tested and working on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 📝 For Final Year Project

### What to Include in Your Report

1. **Introduction**
   - Problem statement
   - Objectives of algorithmic trading

2. **System Design**
   - Architecture diagram
   - Database design (localStorage)
   - User flow diagrams

3. **Implementation**
   - Authentication system
   - Trading algorithm explanation
   - Chart visualization implementation

4. **Testing**
   - Unit testing approach
   - User acceptance testing
   - Performance testing

5. **Results**
   - Screenshots of the dashboard
   - Backtest results analysis
   - Performance comparison

6. **Conclusion**
   - Achievements
   - Limitations
   - Future enhancements

### Screenshots to Include
- Login page
- Signup page
- Main dashboard (light mode)
- Main dashboard (dark mode)
- Mobile responsive view
- Charts with signals
- Performance metrics

## 🔮 Future Enhancements

- Real API integration (Binance, Coinbase)
- Multiple trading strategies
- Email notifications for signals
- Trade history export (CSV/PDF)
- Portfolio management
- Social trading features
- Machine learning predictions

## ⚠️ Disclaimer

This is a simulation tool for educational purposes. Not financial advice. Do not use real money based on these signals without proper research and risk management.

## 👨‍💻 Author

Created as a Final Year Computer Science Project
Algorithmic Trading Strategy for Foreign Exchange and Cryptocurrency Markets

---

**Good luck with your project! 🚀**