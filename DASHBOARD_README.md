# Trading Dashboard

A comprehensive trading dashboard that displays real-time portfolio data and P&L analytics from multiple exchanges.

## Features

### 🔄 Real-time Data

- **Auto-refresh**: Data updates every 30-60 seconds
- **Live Portfolio**: Current balances and holdings
- **P&L Tracking**: Daily and weekly profit/loss calculations

### 📊 Platform Support

- **Binance**: Full integration with API keys
- **KuCoin**: Placeholder for future implementation
- **Multi-platform**: View data across all platforms or filter by specific exchange

### 📈 Analytics

- **Overall Stats**: Total P&L, win rate, trade count, average P&L
- **Platform-specific**: Individual exchange performance
- **Time Periods**: Switch between daily and weekly views
- **Top Performers**: Best and worst trades, top coins

## Setup

### Environment Variables

Add these to your `.env` file:

```env
BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_api_secret
```

### API Endpoints

#### `/api/binance`

Fetches Binance account data including:

- Account balance and portfolio value
- Individual asset holdings with USD values
- Account permissions (trading, withdrawal, deposit)
- Real-time price data

#### `/api/pnl`

Calculates P&L data from the trades table:

- Daily or weekly P&L summary
- Win rate and trade statistics
- Best/worst trades
- Top performing coins
- Platform-specific filtering

## Usage

1. **Navigate to Dashboard**: Click "Dashboard" in the navigation menu
2. **Select Time Period**: Choose "Today" or "This Week" for P&L calculations
3. **Filter Platform**: View all platforms or filter by specific exchange
4. **Refresh Data**: Use the "Refresh All" button for manual updates

## Data Sources

- **Portfolio Data**: Direct API calls to exchange APIs
- **P&L Data**: Calculated from the `trades` table using `pnl_usd` field
- **Trade Statistics**: Derived from trade history and performance metrics

## Security

- API keys are stored securely in environment variables
- All API calls are made server-side to protect credentials
- Binance API uses HMAC-SHA256 signature authentication

## Future Enhancements

- [ ] KuCoin integration
- [ ] More detailed charting
- [ ] Historical performance tracking
- [ ] Risk metrics and alerts
- [ ] Export functionality
