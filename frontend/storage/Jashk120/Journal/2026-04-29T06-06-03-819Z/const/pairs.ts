/**
 * A list of currency pairs and financial instruments available for trading, grouped by category.
 * Each entry includes the pair symbol and optionally a human-readable name.
 */
// currencyPairs.js
export const currencyPairs = [
    // Major Forex Pairs
    { pair: "EUR/USD" },
    { pair: "GBP/USD" },
    { pair: "USD/JPY" },
    { pair: "USD/INR" },
    { pair: "AUD/USD" },
    { pair: "USD/CAD" },
    { pair: "USD/CHF" },
    { pair: "NZD/USD" },
    
    // Minor Forex Pairs
    { pair: "EUR/GBP" },
    { pair: "EUR/JPY" },
    { pair: "GBP/JPY" },
    { pair: "AUD/JPY" },
    { pair: "AUD/NZD" },
    { pair: "EUR/AUD" },
    { pair: "CAD/JPY" },
    { pair: "CHF/JPY" },
  
    // Commodities
    { pair: "XAU/USD", name: "Gold" },
    { pair: "XAG/USD", name: "Silver" },
    { pair: "WTI/USD", name: "Crude Oil (WTI)" },
    { pair: "BRENT/USD", name: "Brent Crude Oil" },
    { pair: "NG/USD", name: "Natural Gas" },
    
    // Metals
    { pair: "XPT/USD", name: "Platinum" },
    { pair: "XPD/USD", name: "Palladium" },
  
    // Indices
    { pair: "US30", name: "Dow Jones 30" },
    { pair: "SPX500", name: "S&P 500" },
    { pair: "NAS100", name: "NASDAQ 100" },
    { pair: "GER30", name: "DAX 30 (Germany)" },
    { pair: "UK100", name: "FTSE 100 (UK)" },
    { pair: "JP225", name: "Nikkei 225 (Japan)" },
  
    // Cryptocurrencies
    { pair: "BTC/USD", name: "Bitcoin" },
    { pair: "ETH/USD", name: "Ethereum" },
    { pair: "LTC/USD", name: "Litecoin" },
    { pair: "XRP/USD", name: "Ripple" },
  ];

/**
 * An array of predefined time range options for filtering data, such as in reports or charts.
 */
export  const options = ["This Week", "This Month", "This Year", "All Time"];