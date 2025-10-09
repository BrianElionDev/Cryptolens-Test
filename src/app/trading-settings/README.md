# Trading Settings

A comprehensive trading settings page that allows users to configure position sizes and leverage for all supported exchanges.

## Features

### 🏦 Exchange Management

- **Multi-Exchange Support**: Configure settings for Binance, KuCoin, Bybit, and OKX
- **Enable/Disable**: Toggle exchanges on/off for trading
- **Exchange-Specific Settings**: Individual configuration for each exchange

### 💰 Position Size Configuration

- **Default Position Size**: Set the default position size in USDT for each exchange
- **Maximum Position Size**: Define the maximum allowed position size
- **Risk Management**: Configure risk percentage per exchange

### 📈 Leverage Settings

- **Leverage Selection**: Choose from 1x, 2x, 3x, 5x, 10x, 20x, 50x, 100x
- **Risk Warnings**: Built-in warnings for high leverage trading
- **Exchange-Specific**: Different leverage settings per exchange

### 📊 Overview Dashboard

- **Active Exchanges**: Count of enabled exchanges
- **Total Position Size**: Sum of all position sizes across exchanges
- **Average Leverage**: Calculated average leverage across enabled exchanges
- **Average Risk**: Calculated average risk percentage
- **Settings Summary Table**: Complete overview of all settings

## Technical Implementation

### State Management

- **Zustand Store**: Persistent state management with localStorage
- **TypeScript**: Fully typed interfaces for type safety
- **Real-time Updates**: Immediate UI updates on setting changes

### API Integration

- **REST API**: `/api/trading-settings` endpoint for server-side persistence
- **Validation**: Server-side validation of all settings
- **Error Handling**: Comprehensive error handling and user feedback

### UI Components

- **Modern Design**: Glassmorphic design with gradient backgrounds
- **Responsive**: Mobile-friendly responsive design
- **Accessibility**: Proper labels and keyboard navigation
- **Toast Notifications**: User feedback for all actions

## Usage

1. **Navigate to Settings**: Click "Trading Settings" in the navigation menu
2. **Configure Exchanges**: Enable/disable exchanges and set their parameters
3. **Set Position Sizes**: Configure default and maximum position sizes
4. **Choose Leverage**: Select appropriate leverage for each exchange
5. **Save Settings**: Click "Save Settings" to persist changes
6. **View Overview**: Check the overview tab for summary statistics

## File Structure

```
src/app/trading-settings/
├── page.tsx                 # Main settings page component
├── README.md               # This documentation
└── ...

src/stores/
└── tradingSettingsStore.ts # Zustand store for state management

src/hooks/
└── useTradingSettings.ts   # Custom hook with helper functions

src/app/api/trading-settings/
└── route.ts                # API endpoint for settings persistence
```

## Default Settings

- **Binance**: 100 USDT position size, 1x leverage, 2% risk, enabled
- **KuCoin**: 100 USDT position size, 1x leverage, 2% risk, enabled
- **Bybit**: 100 USDT position size, 1x leverage, 2% risk, disabled
- **OKX**: 100 USDT position size, 1x leverage, 2% risk, disabled

## Security Considerations

- **Input Validation**: All inputs are validated on both client and server
- **Risk Warnings**: Built-in warnings for high leverage trading
- **Local Storage**: Settings are persisted locally for convenience
- **API Validation**: Server-side validation prevents invalid configurations
