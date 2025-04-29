# Advanced Options Trading Platform with Fyers Integration

An advanced React-based options trading platform that integrates with the Fyers API to provide real-time data, sophisticated price analysis, and trading recommendations based on greeks and volatility metrics.

## Features

### Authentication
- OAuth2 flow integration with Fyers API
- Secure token management with cookie storage
- Automatic redirection and session handling

### Options Chain Visualization
- Real-time options chain data from Fyers API
- Support and resistance level detection
- Theoretical price calculation using Black-Scholes model
- IV-HV difference analysis for volatility skew detection
- Visual indicators for trading opportunities

### Advanced Trading Analysis
- Complete Greeks calculation (Delta, Gamma, Theta, Vega)
- Price difference highlighting between market and theoretical prices
- Volatility analysis with IV/HV ratio
- Support and resistance levels identification
- Put-Call ratio analysis
- Trading signals based on comprehensive analysis

### Decision Support
- Automated buy/sell recommendations
- Confidence scores for trading decisions
- Combined analysis of price differentials and volatility skew
- Scenario analysis for different market conditions
- What-if analysis for parameter changes

## Technical Stack

- **Frontend**: React with Vite, Material UI
- **API**: Fyers Web SDK v3
- **Routing**: React Router
- **State Management**: React Context API
- **Utilities**: Cookies for authentication storage
- **Math Models**: Black-Scholes implementation for options pricing

## Project Structure

```
src/
├── components/
│   ├── Header.jsx                # Navigation header
│   ├── LoginForm.jsx             # Authentication form
│   ├── Dashboard/                # Dashboard components
│   │   ├── OptionChain.jsx       # Options chain visualization
│   │   ├── OptionDetails.jsx     # Detailed option analysis
│   │   ├── OptionAnalysis.jsx    # Advanced analysis tools
│   │   ├── TradingForm.jsx       # Order placement form
│   │   └── index.jsx             # Dashboard exports
│   └── common/                   # Common utility components
├── pages/
│   ├── Home.jsx                  # Landing page with login
│   ├── AuthCallback.jsx          # OAuth callback handler
│   ├── Dashboard.jsx             # Main dashboard page
│   └── NotFound.jsx              # 404 page
├── services/
│   ├── api.js                    # General API utilities
│   ├── optionsApi.js             # Options data API services
│   └── fyersAuth.js              # Fyers authentication service
├── utils/
│   ├── cookieHelper.js           # Cookie management utilities
│   ├── optionsHelper.js          # Options calculation utilities
│   ├── optionsAnalysis.js        # Advanced options analysis
│   └── volatilityAnalysis.js     # Volatility metrics analysis
├── context/
│   └── AuthContext.jsx           # Authentication state management
├── App.jsx                       # Main application component
└── main.jsx                      # Application entry point
```

## Setup Instructions

### Prerequisites

- Node.js (v14+) and npm installed
- Fyers trading account
- Fyers API credentials (App ID and Secret Key)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/fyers-options-trading.git
   cd fyers-options-trading
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Fyers API credentials:
   ```
   VITE_FYERS_APP_ID=your-fyers-app-id
   VITE_FYERS_SECRET_KEY=your-fyers-secret-key
   VITE_FYERS_REDIRECT_URI=http://localhost:5173/auth-callback
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Key Components and Their Functions

### OptionChain Component
- Displays the full options chain with calls and puts
- Shows support and resistance levels
- Highlights trading opportunities based on price differentials
- Displays IV/HV ratio for each option

### OptionDetails Component
- Shows detailed analysis of a selected option
- Displays all Greeks and their interpretations
- Shows IV-HV analysis
- Provides trading recommendations with confidence scores

### OptionAnalysis Component
- Provides scenario analysis for different market conditions
- Allows "what-if" analysis with adjustable parameters
- Shows projected outcomes based on price, time, and volatility changes

## Options Analysis Methodology

### Theoretical Price Calculation
The platform calculates theoretical option prices using the Black-Scholes model, taking into account:
- Current underlying price
- Strike price
- Time to expiry
- Implied volatility
- Risk-free interest rate

### Support/Resistance Detection
Support and resistance levels are identified based on:
- Open interest concentration at strike prices
- Price volatility patterns
- Key technical levels

### IV-HV Analysis
The platform compares implied volatility (IV) to historical volatility (HV) to identify:
- Overpriced options (IV > HV)
- Underpriced options (IV < HV)
- Fair value options (IV ≈ HV)

### Trading Signals
Trading signals are generated based on a combination of:
- Theoretical vs. market price differentials
- IV-HV ratio analysis
- Greeks positioning
- Support/resistance proximity

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory and can be deployed to any static hosting service.

## Additional Resources

- [Fyers API Documentation](https://fyers.in/api-documentation/)
- [Black-Scholes Model Reference](https://en.wikipedia.org/wiki/Black–Scholes_model)
- [Options Greeks Reference](https://www.investopedia.com/trading/getting-to-know-the-greeks/)

## License

MIT License