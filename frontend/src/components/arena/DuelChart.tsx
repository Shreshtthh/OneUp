import { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { GlassCard } from '../ui/GlassCard';

interface DuelChartProps {
  creatorBalance: bigint;
  opponentBalance: bigint;
  creatorStartBalance: bigint;  // 👈 NEEDED for ROI calc
  opponentStartBalance: bigint; // 👈 NEEDED for ROI calc
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

  // Helper: Calculate ROI %
  const getRoi = (current: bigint, start: bigint) => {
    if (start === 0n) return 0;
    const diff = current - start;
    // ROI = (Diff / Start) * 100
    // Multiply by 100 first to keep precision in BigInt before division, then convert to float
    return Number((diff * 10000n) / start) / 100; 
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 1. Create Chart
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

    // 2. Add Series (Creator = Neon Blue)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const creatorSeries = (chart as any).addLineSeries({
      color: '#00f0ff', // Neon Blue
      lineWidth: 2,
      title: 'Creator ROI %',
      crosshairMarkerVisible: true,
    });

    // 3. Add Series (Opponent = Neon Pink)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const opponentSeries = (chart as any).addLineSeries({
      color: '#ff00ff', // Neon Pink
      lineWidth: 2,
      title: 'Opponent ROI %',
      crosshairMarkerVisible: true,
    });

    chartRef.current = chart;
    creatorSeriesRef.current = creatorSeries;
    opponentSeriesRef.current = opponentSeries;

    // 4. Set Initial Baseline (0%)
    const now = Math.floor(Date.now() / 1000);
    const initialRoiCreator = getRoi(creatorBalance, creatorStartBalance);
    const initialRoiOpponent = getRoi(opponentBalance, opponentStartBalance);

    // Initialize with at least one point so it's not empty
    creatorSeries.setData([{ time: now as Time, value: initialRoiCreator }]);
    opponentSeries.setData([{ time: now as Time, value: initialRoiOpponent }]);
    
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

  // 5. Live Updates
  useEffect(() => {
    if (!creatorSeriesRef.current || !opponentSeriesRef.current) return;

    const time = Math.floor(Date.now() / 1000);
    const creatorRoi = getRoi(creatorBalance, creatorStartBalance);
    const opponentRoi = getRoi(opponentBalance, opponentStartBalance);

    creatorSeriesRef.current.update({ time: time as Time, value: creatorRoi });
    opponentSeriesRef.current.update({ time: time as Time, value: opponentRoi });
    
  }, [creatorBalance, opponentBalance, creatorStartBalance, opponentStartBalance]);

  return (
    <GlassCard className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">Live Performance (ROI %)</h3>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-neon-blue"></span>
            <span className="text-gray-400">Creator</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-neon-pink"></span>
            <span className="text-gray-400">Opponent</span>
          </div>
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full h-[400px]" />
    </GlassCard>
  );
}