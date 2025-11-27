import { useEffect, useRef } from 'react';
import { createChart, LineSeries } from 'lightweight-charts';
import type { IChartApi, Time } from 'lightweight-charts';
import { GlassCard } from '../ui/GlassCard';
import { usePriceOracle } from '../../hooks/usePriceOracle';

export function PriceChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const { octPrice } = usePriceOracle();
  
  const priceDataRef = useRef<Array<{ time: number; value: number }>>([]);

  // Track price history
  useEffect(() => {
    const now = Math.floor(Date.now() / 1000);
    priceDataRef.current.push({ time: now, value: octPrice });
    
    // Keep last 100 points
    if (priceDataRef.current.length > 100) {
      priceDataRef.current.shift();
    }
  }, [octPrice]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#9CA3AF',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 250,
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
    });

    const lineSeries = chart.addSeries(LineSeries, {
      color: '#FFD700',
      lineWidth: 2,
      priceFormat: {
        type: 'price',
        precision: 4,
        minMove: 0.0001,
      },
    });

    chartRef.current = chart;

    // Update chart with price data
    const updateChart = () => {
      if (priceDataRef.current.length > 0) {
        lineSeries.setData(
          priceDataRef.current.map(d => ({ time: d.time as Time, value: d.value }))
        );
        chart.timeScale().fitContent();
      }
    };

    const interval = setInterval(updateChart, 3000);

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  return (
    <GlassCard className="p-4" glow="none">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-300">💰 OCT/USD Price</h4>
        <div className="text-2xl font-bold text-ethereal-gold">
          ${octPrice.toFixed(4)}
        </div>
      </div>
      <div 
        ref={chartContainerRef} 
        className="rounded-lg overflow-hidden bg-black/20"
        style={{ height: '250px' }}
      />
      <div className="mt-2 text-xs text-gray-500 text-center">
        Live price feed updates every 3 seconds
      </div>
    </GlassCard>
  );
}
