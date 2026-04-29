```typescript
import { useEffect, useState } from "react";

/**
 * Custom React hook that fetches the current exchange rate between two currencies.
 *
 * It queries the Open Exchange Rates API to get the latest rate from the base currency
 * to the quote currency. The rate is automatically re-fetched whenever either currency code changes.
 *
 * @param baseCurrency - The three-letter currency code of the base currency (e.g., "USD").
 * @param quoteCurrency - The three-letter currency code of the target/quote currency (e.g., "EUR").
 * @returns The exchange rate as a number, or `null` if the rate is not yet available, the currencies are invalid, or an error occurs.
 */
function useCurrencyInfo(baseCurrency, quoteCurrency) {
  const [exchangeRate, setExchangeRate] = useState(null);

  useEffect(() => {
    if (!baseCurrency || !quoteCurrency) return;

    fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.rates && data.rates[quoteCurrency]) {
          setExchangeRate(data.rates[quoteCurrency]);
        } else {
          setExchangeRate(null);
        }
      })
      .catch((error) => {
        console.error("Error fetching currency data:", error);
        setExchangeRate(null);
      });
  }, [baseCurrency, quoteCurrency]);

  return exchangeRate;
}

export default useCurrencyInfo;
```