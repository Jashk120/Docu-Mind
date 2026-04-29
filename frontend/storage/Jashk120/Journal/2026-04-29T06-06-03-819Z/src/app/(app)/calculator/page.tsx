```tsx
"use client"

import PositionSizeCard from '@/components/calculatorCards/PositionSizeCard';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';

import React, { useEffect, useState } from 'react';
import { currencyPairs } from '../../../../const/pairs';
import useCurrencyInfo from '../../../../const/useCurrency';
import { ScrollArea } from '@/components/ui/scroll-area';
import MarketDistanceCalculator from '@/components/calculatorCards/MarketDistance';

/**
 * ForexCalculator component provides a UI for performing forex calculations
 * such as position sizing and market distance. It allows users to select a
 * currency pair, input account balance, risk percentage, stop loss in pips,
 * and displays the calculated lot size based on the current exchange rate.
 *
 * @returns A React element containing the forex calculator interface.
 */
const ForexCalculator = () => {
  const [accountBalance, setAccountBalance] = useState("");
  const [riskPercentage, setRiskPercentage] = useState("");
  const [stopLossPips, setStopLossPips] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [lotSize, setLotSize] = useState("");
  const [selectedPair, setSelectedPair] = useState("EUR/USD");
  const [baseCurrency, quoteCurrency] = selectedPair.split("/");
  const fetchedExchangeRate = useCurrencyInfo(baseCurrency, quoteCurrency);
  useEffect(() => {
    if (fetchedExchangeRate) {
      setExchangeRate(fetchedExchangeRate);
    }
  }, [fetchedExchangeRate]);

  return (
    <div className="bg-transparent w-full h-screen flex  flex-col ">
    {/* Header */}
    <div className="bg-gray-800 h-16 mt-4 rounded-3xl w-3/4 mx-auto flex items-center justify-center px-6">
      <h1 className="text-gray-200 text-2xl font-semibold">Forex Calculations</h1>
    </div>  
  
   
    
  
    <div>
    <div className="w-60 ml-20 mt-6 flex border-none flex-col ">
      <label className="text-gray-200 mb-2 text-sm font-semibold">Currency Pair</label>
      <Select value={selectedPair} onValueChange={setSelectedPair}>
        <SelectTrigger className="bg-gray-800 border-none text-gray-200 p-3 rounded-md w-full md:w-1/2">
          <span>{selectedPair || "Select Currency Pair"}</span>
        </SelectTrigger>
        <SelectContent className="bg-gray-800 text-gray-200">
          {currencyPairs.map(({ pair }) => (
            <SelectItem key={pair} value={pair}>
              {pair}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div className=" h-full mt-6  flex flex-col  gap-4">
    <ScrollArea className='h-full w-full'>
      <div className='flex flex-row  justify-center'>
      <PositionSizeCard
        selectedCurrency={selectedPair}
        accountBalance={accountBalance}
        setAccountBalance={setAccountBalance}
        riskPercentage={riskPercentage}
        setRiskPercentage={setRiskPercentage}
        stopLossPips={stopLossPips}
        setStopLossPips={setStopLossPips}
        exchangeRate={exchangeRate}
      />
      <MarketDistanceCalculator/>
      </div>
      </ScrollArea>
    </div>
    </div>
    
  </div>

)}  

export default ForexCalculator;
```