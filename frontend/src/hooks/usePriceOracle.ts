import { useState, useEffect } from 'react';

export function usePriceOracle() {
  const [basePrice, setBasePrice] = useState(1.50);

  useEffect(() => {
    const interval = setInterval(() => {
      setBasePrice(prev => {
        // More volatile: ±10 cents
        const change = (Math.random() - 0.5) * 0.20;
        const newPrice = prev + change;
        // Keep between $1.20-$2.00
        return Math.max(1.20, Math.min(2.00, newPrice));
      });
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  console.log('Current OCT price:', basePrice); // Debug log

  return {
    octPrice: basePrice,
    octPriceInCents: Math.floor(basePrice * 100),
  };
}
