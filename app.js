const { useEffect, useMemo, useRef, useState } = React;

const ROUTES = {
  login: 'login',
  signup: 'signup',
  forgot: 'forgot',
  dashboard: 'dashboard',
  oauth: 'oauth-callback'
};

const AUTH_STORAGE_KEY = 'users';
const CURRENT_USER_KEY = 'currentUser';
const REMEMBER_KEY = 'rememberedUser';

const OAUTH_CONFIG = {
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'openid email profile',
    clientId: 'YOUR_GOOGLE_CLIENT_ID'
  },
  facebook: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    scope: 'email public_profile',
    clientId: 'YOUR_FACEBOOK_APP_ID'
  }
};

const MARKET_OPTIONS = [
  { label: 'Forex Major Pairs', options: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'NZD/USD', 'USD/CAD'] },
  { label: 'Forex Minor Pairs', options: ['EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'EUR/AUD', 'GBP/AUD'] },
  { label: 'Cryptocurrency', options: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'XRP/USD', 'ADA/USD', 'DOGE/USD', 'DOT/USD', 'BNB/USD', 'LTC/USD', 'AVAX/USD'] },
  { label: 'Commodities & Metals', options: ['XAU/USD', 'XAG/USD', 'XPT/USD', 'XPD/USD', 'USO/USD', 'NGAS/USD'] },
  { label: 'Indices & Stocks', options: ['SPX/USD', 'NDX/USD', 'DJI/USD', 'FTSE/GBP', 'DAX/EUR'] }
];

function getStoredUsers() {
  return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || '[]');
}

function saveStoredUsers(users) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));
}

function setCurrentUser(user, remember = false) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  if (remember) {
    localStorage.setItem(REMEMBER_KEY, JSON.stringify({ login: user.username || user.email }));
  } else {
    localStorage.removeItem(REMEMBER_KEY);
  }
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null');
}

function clearCurrentUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

function getRouteFromHash() {
  const hash = window.location.hash.replace('#', '');
  const [path, search = ''] = hash.split('?');
  const route = path.replace('/', '') || ROUTES.login;
  return { route, search };
}

function buildHash(route, params = {}) {
  const searchParams = new URLSearchParams(params);
  const query = searchParams.toString();
  return `#/${route}${query ? `?${query}` : ''}`;
}

function useHashRoute() {
  const [routeState, setRouteState] = useState(getRouteFromHash());

  useEffect(() => {
    const handler = () => setRouteState(getRouteFromHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return routeState;
}

function navigate(route, params = {}) {
  window.location.hash = buildHash(route, params);
}

function applyTheme(theme) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isLight = theme === 'light' || (theme === 'auto' && !prefersDark);
  document.body.classList.toggle('light-theme', isLight);
  document.body.setAttribute('data-theme', isLight ? 'light' : 'dark');
}

function useTheme() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'auto');

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return [theme, setTheme];
}

function buildRedirectUri(path) {
  if (window.location.origin === 'null') {
    return path;
  }
  return `${window.location.origin}/${path}`;
}

function buildOAuthUrl(provider) {
  const config = OAUTH_CONFIG[provider];
  const redirectUri = buildRedirectUri('oauth-callback.html');
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scope,
    state: JSON.stringify({ provider })
  });
  return `${config.authUrl}?${params.toString()}`;
}

function startOAuthFlow(provider, returnTo) {
  navigate(ROUTES.oauth, { provider, returnTo });
}

function getSeededNumber(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateHistoricalData(pair, days = 180) {
  const seed = getSeededNumber(pair);
  const data = [];
  let price = seed % 100 === 0 ? 100 : (seed % 1000) / 10 + 1;
  const volatility = pair.includes('BTC') || pair.includes('ETH') ? 0.03 : pair.includes('USD') ? 0.01 : 0.015;
  const trend = (seed % 7 - 3) * 0.0004;

  for (let i = 0; i < days; i += 1) {
    const change = (Math.sin(i / 9) + Math.cos(i / 13)) * 0.001 + (Math.random() - 0.5) * volatility + trend;
    price = Math.max(0.1, price * (1 + change));
    data.push({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000),
      close: Number(price.toFixed(4))
    });
  }
  return data;
}

function calculateSMA(data, period) {
  return data.map((point, index) => {
    if (index < period - 1) return null;
    const slice = data.slice(index - period + 1, index + 1);
    const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
    return sum / period;
  });
}

function calculateRSI(data, period) {
  return data.map((_, index) => {
    if (index < period) return null;
    let gains = 0;
    let losses = 0;
    for (let i = index - period + 1; i <= index; i += 1) {
      const change = data[i].close - data[i - 1].close;
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    const avgGain = gains / period;
    const avgLoss = losses / period || 0.0001;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  });
}

function generateSignals(data, fastMA, slowMA, rsi) {
  return data.map((_, index) => {
    if (index === 0 || fastMA[index] === null || slowMA[index] === null || rsi[index] === null) {
      return 'HOLD';
    }
    const prevFast = fastMA[index - 1];
    const prevSlow = slowMA[index - 1];
    const currFast = fastMA[index];
    const currSlow = slowMA[index];
    const currRSI = rsi[index];
    if (prevFast <= prevSlow && currFast > currSlow && currRSI < 70) {
      return 'BUY';
    }
    if (prevFast >= prevSlow && currFast < currSlow && currRSI > 30) {
      return 'SELL';
    }
    return 'HOLD';
  });
}

function runBacktest(data, signals, initialCapital, positionSize) {
  let capital = initialCapital;
  let position = 0;
  let trades = 0;
  let wins = 0;

  signals.forEach((signal, index) => {
    const price = data[index].close;
    if (signal === 'BUY' && position === 0) {
      position = (capital * (positionSize / 100)) / price;
      capital -= position * price;
      trades += 1;
    }
    if (signal === 'SELL' && position > 0) {
      const proceeds = position * price;
      const profit = proceeds - initialCapital * (positionSize / 100) / trades;
      if (profit > 0) wins += 1;
      capital += proceeds;
      position = 0;
    }
  });

  const finalValue = capital + position * data[data.length - 1].close;
  const totalReturn = ((finalValue - initialCapital) / initialCapital) * 100;
  const winRate = trades ? (wins / trades) * 100 : 0;

  return {
    finalValue,
    totalReturn,
    trades,
    winRate
  };
}

function ThemeToggle({ theme, setTheme }) {
  return (
    <div className="theme-toggle" id="themeToggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      <i className={`fas ${theme === 'light' ? 'fa-sun' : 'fa-moon'}`}></i>
    </div>
  );
}

function LoginView({ theme, setTheme }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const remembered = useMemo(() => JSON.parse(localStorage.getItem(REMEMBER_KEY) || 'null'), []);

  useEffect(() => {
    if (remembered?.login) {
      setIdentifier(remembered.login);
      setRemember(true);
    }
  }, [remembered]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const users = getStoredUsers();
    const user = users.find((candidate) => {
      const match = [candidate.username, candidate.email].some(
        (value) => value && value.toLowerCase() === identifier.toLowerCase()
      );
      return match && candidate.password === password;
    });

    if (!identifier || !password) {
      setError('Please enter your username/email and password.');
      return;
    }

    if (!user) {
      setError('Invalid credentials. Please try again or reset your password.');
      return;
    }

    setCurrentUser(user, remember);
    navigate(ROUTES.dashboard);
  };

  return (
    <div className="app-shell">
      <div className="floating-element"></div>
      <div className="floating-element"></div>
      <ThemeToggle theme={theme} setTheme={setTheme} />
      <div className="auth-card animate__animated animate__fadeIn">
        <div className="logo" style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 60,
            height: 60,
            background: 'linear-gradient(135deg, #2d7a2d, #00d4ff)',
            borderRadius: 15,
            margin: '0 auto 15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            color: 'white',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)'
          }}>
            <i className="fas fa-chart-line"></i>
          </div>
        </div>
        <h2>Welcome back to AlgoPilot</h2>
        <p className="subtitle">Algorithmic FX & crypto trading for your final year project</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Username or Email"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />
            <i className="fas fa-user"></i>
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <i className="fas fa-lock"></i>
          </div>
          <div className="form-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <button type="button" className="forgot-password hash-link" onClick={() => navigate(ROUTES.forgot)}>
              Forgot Password?
            </button>
          </div>
          <button type="submit" className="login-btn">Login to Dashboard</button>
          {error && <div className="error-msg" style={{ display: 'block' }}>{error}</div>}
        </form>

        <div className="social-auth">
          <div className="divider"><span>Or continue with</span></div>
          <div className="social-login">
            <button className="social-btn google" type="button" onClick={() => startOAuthFlow('google', 'login')}>
              <i className="fab fa-google"></i>
            </button>
            <button className="social-btn facebook" type="button" onClick={() => startOAuthFlow('facebook', 'login')}>
              <i className="fab fa-facebook-f"></i>
            </button>
          </div>
          <div className="oauth-links">
            <p>OAuth redirect page: <code>oauth-callback.html</code></p>
            <a href={buildOAuthUrl('google')} target="_blank" rel="noopener">Google OAuth link</a>
            <a href={buildOAuthUrl('facebook')} target="_blank" rel="noopener">Facebook OAuth link</a>
          </div>
        </div>

        <div className="auth-links">
          New to AlgoPilot?
          <button type="button" className="hash-link" onClick={() => navigate(ROUTES.signup)}>Create an account</button>
        </div>
      </div>
    </div>
  );
}

function SignupView({ theme, setTheme }) {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.username || form.username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }

    const users = getStoredUsers();
    if (users.some((user) => user.username?.toLowerCase() === form.username.toLowerCase())) {
      setError('Username already exists.');
      return;
    }

    if (users.some((user) => user.email?.toLowerCase() === form.email.toLowerCase())) {
      setError('Email already exists.');
      return;
    }

    const user = {
      id: Math.random().toString(36).slice(2),
      username: form.username,
      email: form.email,
      password: form.password,
      createdAt: new Date().toISOString(),
      verified: false,
      balance: 10000
    };

    users.push(user);
    saveStoredUsers(users);
    setCurrentUser(user);
    setSuccess('🎉 Account created successfully! Redirecting to dashboard...');

    setTimeout(() => navigate(ROUTES.dashboard), 1200);
  };

  return (
    <div className="app-shell">
      <div className="floating-element"></div>
      <div className="floating-element"></div>
      <ThemeToggle theme={theme} setTheme={setTheme} />
      <div className="auth-card animate__animated animate__fadeIn">
        <div className="logo">
          <div className="logo-icon"><i className="fas fa-user-plus"></i></div>
        </div>
        <h2>Create Your AlgoPilot Account</h2>
        <p className="subtitle">Design and implement a FX & crypto trading strategy for your final year project</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              required
            />
            <i className="fas fa-user"></i>
          </div>
          <div className="form-group">
            <input
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
            <i className="fas fa-envelope"></i>
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
            <i className="fas fa-lock"></i>
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="Confirm Password"
              value={form.confirm}
              onChange={(event) => setForm({ ...form, confirm: event.target.value })}
              required
            />
            <i className="fas fa-lock"></i>
          </div>
          <button type="submit" className="login-btn">Create Account</button>
          {error && <div className="error-msg" style={{ display: 'block' }}>{error}</div>}
          {success && <div className="signup-msg" style={{ display: 'block' }}>{success}</div>}
        </form>

        <div className="social-signup">
          <div className="divider"><span>Or sign up with</span></div>
          <div className="social-buttons">
            <button className="social-btn google" type="button" onClick={() => startOAuthFlow('google', 'signup')}>
              <i className="fab fa-google"></i> Google
            </button>
            <button className="social-btn facebook" type="button" onClick={() => startOAuthFlow('facebook', 'signup')}>
              <i className="fab fa-facebook-f"></i> Facebook
            </button>
          </div>
          <div className="oauth-links">
            <p>OAuth redirect page: <code>oauth-callback.html</code></p>
            <a href={buildOAuthUrl('google')} target="_blank" rel="noopener">Google OAuth link</a>
            <a href={buildOAuthUrl('facebook')} target="_blank" rel="noopener">Facebook OAuth link</a>
          </div>
        </div>

        <div className="auth-links">
          Already have an account?
          <button type="button" className="hash-link" onClick={() => navigate(ROUTES.login)}>Log in here</button>
        </div>
      </div>
    </div>
  );
}

function ForgotView({ theme, setTheme }) {
  const [identifier, setIdentifier] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' });

  const handleSubmit = (event) => {
    event.preventDefault();
    const users = getStoredUsers();
    const match = users.find((user) => {
      return [user.username, user.email]
        .filter(Boolean)
        .some((value) => value.toLowerCase() === identifier.toLowerCase());
    });

    if (!identifier) {
      setStatus({ message: 'Please enter your email or username.', type: 'error' });
      return;
    }

    if (!match) {
      setStatus({ message: 'We could not find that account. Please sign up or try another email.', type: 'error' });
      return;
    }

    setStatus({ message: `Reset instructions have been sent to ${match.email || 'your email'}.`, type: 'success' });
  };

  return (
    <div className="app-shell">
      <div className="floating-element"></div>
      <div className="floating-element"></div>
      <ThemeToggle theme={theme} setTheme={setTheme} />
      <div className="auth-card animate__animated animate__fadeIn">
        <div className="logo" style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 60,
            height: 60,
            background: 'linear-gradient(135deg, #2d7a2d, #00d4ff)',
            borderRadius: 15,
            margin: '0 auto 15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            color: 'white',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)'
          }}>
            <i className="fas fa-unlock-alt"></i>
          </div>
        </div>
        <h2>Reset your password</h2>
        <p className="subtitle">Enter your email or username to receive a reset link.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Email or Username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />
            <i className="fas fa-envelope"></i>
          </div>
          <button type="submit" className="login-btn">Send reset instructions</button>
          {status.message && (
            <div className={`status-msg ${status.type}`} style={{ display: 'block' }}>{status.message}</div>
          )}
        </form>
        <div className="auth-links">
          Remembered your password?
          <button type="button" className="hash-link" onClick={() => navigate(ROUTES.login)}>Back to login</button>
        </div>
      </div>
    </div>
  );
}

function OAuthCallbackView({ theme, setTheme, search }) {
  const [status, setStatus] = useState({ message: '', type: '' });

  useEffect(() => {
    const params = new URLSearchParams(search);
    const provider = params.get('provider');
    const returnTo = params.get('returnTo') || 'login';

    if (!provider || !['google', 'facebook'].includes(provider)) {
      setStatus({ message: 'Invalid OAuth provider. Please return to login.', type: 'error' });
      return;
    }

    const users = getStoredUsers();
    const providerUser = {
      id: `social_${provider}_${Date.now()}`,
      username: `${provider}_trader`,
      email: `${provider}_trader@${provider}.example`,
      password: 'oauth',
      provider,
      createdAt: new Date().toISOString(),
      verified: true,
      balance: 10000
    };

    const existing = users.find((user) => user.provider === provider);
    const activeUser = existing || providerUser;

    if (!existing) {
      users.push(activeUser);
      saveStoredUsers(users);
    }

    setCurrentUser(activeUser, true);
    setStatus({ message: `Connected with ${provider}. Redirecting to your dashboard...`, type: 'success' });

    setTimeout(() => navigate(ROUTES.dashboard), 1000);
  }, [search]);

  return (
    <div className="app-shell">
      <div className="floating-element"></div>
      <div className="floating-element"></div>
      <ThemeToggle theme={theme} setTheme={setTheme} />
      <div className="auth-card animate__animated animate__fadeIn">
        <div className="logo" style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 60,
            height: 60,
            background: 'linear-gradient(135deg, #2d7a2d, #00d4ff)',
            borderRadius: 15,
            margin: '0 auto 15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            color: 'white',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)'
          }}>
            <i className="fas fa-shield-alt"></i>
          </div>
        </div>
        <h2>Connecting your account</h2>
        <p className="subtitle">Completing OAuth sign-in and redirecting you to AlgoPilot.</p>
        {status.message && (
          <div className={`status-msg ${status.type}`} style={{ display: 'block' }}>{status.message}</div>
        )}
        <div className="auth-links">
          Need to retry?
          <button type="button" className="hash-link" onClick={() => navigate(ROUTES.login)}>Back to login</button>
        </div>
      </div>
    </div>
  );
}

function DashboardView({ theme, setTheme }) {
  const [market, setMarket] = useState('EUR/USD');
  const [fastMA, setFastMA] = useState(10);
  const [slowMA, setSlowMA] = useState(30);
  const [rsiPeriod, setRsiPeriod] = useState(14);
  const [initialCapital, setInitialCapital] = useState(10000);
  const [positionSize, setPositionSize] = useState(10);
  const [metrics, setMetrics] = useState(null);
  const chartRef = useRef(null);

  const currentUser = getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      navigate(ROUTES.login);
    }
  }, [currentUser]);

  const historicalData = useMemo(() => generateHistoricalData(market), [market]);

  useEffect(() => {
    if (!chartRef.current) return;
    const dates = historicalData.map((point) => point.date);
    const prices = historicalData.map((point) => point.close);
    const fast = calculateSMA(historicalData, Number(fastMA));
    const slow = calculateSMA(historicalData, Number(slowMA));

    const traces = [
      { x: dates, y: prices, type: 'scatter', mode: 'lines', name: `${market} Close`, line: { color: '#10b981' } },
      { x: dates, y: fast, type: 'scatter', mode: 'lines', name: 'Fast MA', line: { color: '#00d4ff' } },
      { x: dates, y: slow, type: 'scatter', mode: 'lines', name: 'Slow MA', line: { color: '#f59e0b' } }
    ];

    Plotly.newPlot(chartRef.current, traces, {
      margin: { t: 30, r: 20, l: 40, b: 40 },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { color: theme === 'dark' ? '#f1f5f9' : '#0f172a' },
      xaxis: { showgrid: false },
      yaxis: { gridcolor: theme === 'dark' ? '#334155' : '#e2e8f0' }
    }, { responsive: true });
  }, [historicalData, fastMA, slowMA, market, theme]);

  const handleRunBacktest = () => {
    const fast = calculateSMA(historicalData, Number(fastMA));
    const slow = calculateSMA(historicalData, Number(slowMA));
    const rsi = calculateRSI(historicalData, Number(rsiPeriod));
    const signals = generateSignals(historicalData, fast, slow, rsi);
    const results = runBacktest(historicalData, signals, Number(initialCapital), Number(positionSize));
    setMetrics(results);
  };

  return (
    <div className="container">
      <nav className="navbar">
        <div className="nav-left">
          <span className="brand">AlgoPilot <span className="pro-badge">PRO</span></span>
        </div>
        <div className="nav-right">
          <span className="user-greeting">Hello, <strong>{currentUser?.username || currentUser?.email || 'Trader'}</strong>!</span>
          <label className="theme-switch" title="Toggle Dark Mode">
            <input type="checkbox" checked={theme === 'dark'} onChange={(event) => setTheme(event.target.checked ? 'dark' : 'light')} />
            <span className="slider"></span>
          </label>
          <button className="logout-btn" onClick={() => { clearCurrentUser(); navigate(ROUTES.login); }}>Logout</button>
        </div>
      </nav>

      <div className="strategy-info project-overview">
        <div className="strategy-header">
          <h3>Final Year Project: FX & Crypto Algorithmic Trading</h3>
          <span className="strategy-badge">RESEARCH</span>
        </div>
        <p>This dashboard demonstrates the design and implementation of an algorithmic trading strategy for foreign exchange and cryptocurrency markets.</p>
        <ul className="project-list">
          <li>📊 Live market ingestion, preprocessing, and technical indicator pipeline.</li>
          <li>🧠 Dual moving-average crossover with RSI confirmation and volatility safeguards.</li>
          <li>🛡️ Risk controls: position sizing, capital allocation, and drawdown monitoring.</li>
          <li>📈 Backtesting, performance analytics, and trade journaling for evaluation.</li>
        </ul>
      </div>

      <div className="controls-section">
        <h3 className="section-title">Strategy Parameters</h3>
        <div className="controls">
          <div className="control-group">
            <label>Market Pair</label>
            <select value={market} onChange={(event) => setMarket(event.target.value)}>
              {MARKET_OPTIONS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="control-group">
            <label>Fast MA Period</label>
            <input type="number" value={fastMA} min={5} max={50} onChange={(event) => setFastMA(event.target.value)} />
          </div>
          <div className="control-group">
            <label>Slow MA Period</label>
            <input type="number" value={slowMA} min={20} max={100} onChange={(event) => setSlowMA(event.target.value)} />
          </div>
          <div className="control-group">
            <label>RSI Period</label>
            <input type="number" value={rsiPeriod} min={10} max={30} onChange={(event) => setRsiPeriod(event.target.value)} />
          </div>
          <div className="control-group">
            <label>Initial Capital</label>
            <input type="number" value={initialCapital} min={1000} step={1000} onChange={(event) => setInitialCapital(event.target.value)} />
          </div>
          <div className="control-group">
            <label>Position Size (%)</label>
            <input type="number" value={positionSize} min={1} max={100} onChange={(event) => setPositionSize(event.target.value)} />
          </div>
        </div>
        <button className="run-backtest-btn" onClick={handleRunBacktest}>Run Backtest with Historical Data</button>
      </div>

      <div className="dashboard">
        <div className="card">
          <div className="card-header"><h2>Historical Price Chart</h2></div>
          <div ref={chartRef}></div>
        </div>
        <div className="card">
          <div className="card-header"><h2>Performance Metrics</h2></div>
          {metrics ? (
            <div className="metrics-grid">
              <div className="metric"><span>Total Return</span><strong>{metrics.totalReturn.toFixed(2)}%</strong></div>
              <div className="metric"><span>Final Value</span><strong>${metrics.finalValue.toFixed(2)}</strong></div>
              <div className="metric"><span>Trades</span><strong>{metrics.trades}</strong></div>
              <div className="metric"><span>Win Rate</span><strong>{metrics.winRate.toFixed(1)}%</strong></div>
            </div>
          ) : (
            <p>Run the backtest to view performance metrics.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const { route, search } = useHashRoute();
  const [theme, setTheme] = useTheme();

  useEffect(() => {
    if (!window.location.hash) {
      navigate(ROUTES.login);
    }
  }, []);

  useEffect(() => {
    const authRoutes = [ROUTES.login, ROUTES.signup, ROUTES.forgot, ROUTES.oauth];
    const isAuth = authRoutes.includes(route);
    document.body.classList.toggle('auth-body', isAuth);
    document.body.classList.toggle('dashboard-body', !isAuth);
  }, [route]);

  if (route === ROUTES.signup) {
    return <SignupView theme={theme} setTheme={setTheme} />;
  }

  if (route === ROUTES.forgot) {
    return <ForgotView theme={theme} setTheme={setTheme} />;
  }

  if (route === ROUTES.oauth) {
    return <OAuthCallbackView theme={theme} setTheme={setTheme} search={search} />;
  }

  if (route === ROUTES.dashboard) {
    return <DashboardView theme={theme} setTheme={setTheme} />;
  }

  return <LoginView theme={theme} setTheme={setTheme} />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
