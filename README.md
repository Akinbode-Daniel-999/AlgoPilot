# AlgoPilot - Algorithmic Trading Project (React)

A React-based algorithmic trading project for forex and cryptocurrency markets, featuring local authentication, historical backtesting, and a final-year project dashboard.

## 📁 Project Structure

```
AlgoPilot/
├── index.html              ← React single-page entry (START HERE)
├── app.js                  ← React application + routing + trading logic
├── app.css                 ← App-level helpers
├── login.css               ← Shared auth styling
├── signup.css              ← Signup styling
├── forgot.css              ← Forgot password styling
├── main.css                ← Dashboard styling
├── oauth-callback.css      ← OAuth callback styling
├── login.html              ← Legacy redirect → React login route
├── signup.html             ← Legacy redirect → React signup route
├── forgot.html             ← Legacy redirect → React forgot route
├── main.html               ← Legacy redirect → React dashboard route
└── README.md               ← This file
```

## 🚀 How to Use

### 1. Setup
1. Download all files into a single folder
2. Keep all files in the same directory (no subfolders needed)
3. Open `index.html` in your web browser

### 2. User Flow
- **Sign Up** → Create a new account and land on the dashboard
- **Login** → Authenticate with your saved credentials
- **Forgot Password** → Simulated reset link via localStorage lookup
- **Social Login (Demo)** → Simulated Google/Facebook OAuth redirect

### 3. Features

#### 🔐 Authentication System
- Local user storage (`localStorage`)
- Remember-me support
- OAuth callback simulation (Google/Facebook)
- Redirect-friendly legacy pages

#### 📊 Trading Dashboard
- **Markets**: Forex majors/minors, crypto, commodities, indices
- **Strategy**: Moving Average Crossover + RSI filter
- **Historical Data**: Deterministic historical series for every market pair
- **Backtesting**: Performance metrics (return, win rate, trades)
- **Charts**: Plotly-based interactive price & indicator chart

#### 🎓 Final Year Project Focus
- Project overview highlights system design, data pipeline, and evaluation
- Report-ready copy for academic documentation
## 🧪 Testing
- Open `index.html` and navigate using the hash routes:
  - `#/login`, `#/signup`, `#/forgot`, `#/dashboard`, `#/oauth-callback`

## 🔧 Tech Stack
- **React 18 (CDN + Babel)**
- **Plotly.js**
- **HTML/CSS/JS**

## ⚠️ Disclaimer
This is a simulation tool for educational purposes. Not financial advice.
