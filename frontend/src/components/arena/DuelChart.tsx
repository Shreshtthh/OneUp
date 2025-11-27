import { useEffect, useRef } from 'react';
import { createChart, ColorType, LineSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { GlassCard } from '../ui/GlassCard';

interface DuelChartProps {
  creatorBalance: bigint;
  opponentBalance: bigint;
  creatorStartBalance: bigint;
  opponentStartBalance: bigint;
}

export function DuelChart({ 
  creatorBalance, 
  opponentBalance, 
  creatorStartBalance, 
  opponentStartBalance 
}: DuelChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const creatorSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const opponentSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const lastUpdateRef = useRef<Time>(0 as Time); // ✅ Track last update time

  // Helper: Calculate ROI %
  const getRoi = (current: bigint, start: bigint) => {
    if (start === 0n) return 0;
    const diff = current - start;
    return Number((diff * 10000n) / start) / 100; 
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create Chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      },
    });

    // Add Series
    const creatorSeries = chart.addSeries(LineSeries, {
      color: '#4FFFEF', // Ethereal Cyan
      lineWidth: 3,
      title: 'Creator ROI %',
      crosshairMarkerVisible: true,
    });

    const opponentSeries = chart.addSeries(LineSeries, {
      color: '#FF00FF', // Magenta
      lineWidth: 3,
      title: 'Opponent ROI %',
      crosshairMarkerVisible: true,
    });

    chartRef.current = chart;
    creatorSeriesRef.current = creatorSeries;
    opponentSeriesRef.current = opponentSeries;

    // Set Initial Baseline
    const now = Math.floor(Date.now() / 1000) as Time;
    lastUpdateRef.current = now;

    const initialRoiCreator = getRoi(creatorBalance, creatorStartBalance);
    const initialRoiOpponent = getRoi(opponentBalance, opponentStartBalance);

    creatorSeries.setData([{ time: now, value: initialRoiCreator }]);
    opponentSeries.setData([{ time: now, value: initialRoiOpponent }]);
    
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Live Updates
  useEffect(() => {
    if (!creatorSeriesRef.current || !opponentSeriesRef.current) return;

    const now = Math.floor(Date.now() / 1000);
    
    // ✅ FIX: Only update if at least 2 seconds have passed
    if (now <= (lastUpdateRef.current as number) + 1) {
      return; // Skip update if less than 2 seconds
    }

    const creatorRoi = getRoi(creatorBalance, creatorStartBalance);
    const opponentRoi = getRoi(opponentBalance, opponentStartBalance);

    // Update chart
    creatorSeriesRef.current.update({ time: now as Time, value: creatorRoi });
    opponentSeriesRef.current.update({ time: now as Time, value: opponentRoi });
    
    lastUpdateRef.current = now as Time; // ✅ Update last time
    
  }, [creatorBalance, opponentBalance, creatorStartBalance, opponentStartBalance]);

  const currentCreatorRoi = getRoi(creatorBalance, creatorStartBalance);
  const currentOpponentRoi = getRoi(opponentBalance, opponentStartBalance);

  return (
    <GlassCard className="p-6" glow="cyan">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gradient">Live Performance (ROI %)</h3>
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-ethereal-cyan shadow-glow-cyan"></span>
            <span className="text-gray-400">Creator</span>
            <span className="text-ethereal-cyan font-bold">{currentCreatorRoi.toFixed(2)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#FF00FF] shadow-glow-purple"></span>
            <span className="text-gray-400">Opponent</span>
            <span className="text-[#FF00FF] font-bold">{currentOpponentRoi.toFixed(2)}%</span>
          </div>
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full h-[400px] rounded-lg bg-black/20" />
      
      <div className="text-center text-gray-500 text-sm mt-4">
        📊 Chart updates every 2 seconds as portfolio values change
      </div>
    </GlassCard>
  );
}
