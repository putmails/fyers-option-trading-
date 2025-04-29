# Fyers Options Trading Platform

A React application for options trading using the Fyers API. This platform provides authentication with Fyers, options chain visualization, and trading capabilities.

## Features

- **Authentication**: OAuth2 integration with Fyers API
- **Options Chain**: View and analyze option chains with real-time data
- **Option Analysis**: Calculate Greeks, implied volatility, and more
- **Trading Interface**: Place option orders directly from the platform
- **Portfolio Tracking**: Monitor your positions and account details

## Technical Stack

- **Frontend**: React with Vite, Material UI
- **API**: Fyers Web SDK v3
- **Routing**: React Router
- **State Management**: React Context API
- **Utilities**: Cookies for authentication storage

## Setup Instructions

### Prerequisites

- Node.js and npm installed
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

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory and can be deployed to any static hosting service.

## Project Structure

```
src/
├── components/       # Reusable components
│   ├── Header.jsx    # Navigation header
│   ├── LoginForm.jsx # Authentication form
│   ├── Dashboard/    # Dashboard components
│   └── common/       # Common utility components
├── pages/            # Page components
│   ├── Home.jsx      # Landing page with login
│   ├── AuthCallback.jsx # OAuth callback handler
│   └── Dashboard.jsx # Main dashboar
```
