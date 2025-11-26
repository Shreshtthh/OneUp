import { useEffect, useRef } from 'react';
import { createChart, IChartApi } from 'lightweight-charts';
import { GlassCard } from '../ui/GlassCard';

interface DuelChartProps {
  creatorBalance: bigint;
  opponentBalance: bigint;
}

export function DuelChart({ creatorBalance, opponentBalance }: DuelChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const creatorSeriesRef = useRef<any>(null);
  const opponentSeriesRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.1)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.1)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });

    // Add series
    const creatorSeries = chart.addLineSeries({
      color: '#00f0ff',
      lineWidth: 3,
      title: 'Creator',
    });

    const opponentSeries = chart.addLineSeries({
      color: '#ff00ff',
      lineWidth: 3,
      title: 'Opponent',
    });

    chartRef.current = chart;
    creatorSeriesRef.current = creatorSeries;
    opponentSeriesRef.current = opponentSeries;

    // Resize handler
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!creatorSeriesRef.current || !opponentSeriesRef.current) return;

    const time = Date.now() / 1000;
    const creatorValue = Number(creatorBalance) / 1_000_000_000;
    const opponentValue = Number(opponentBalance) / 1_000_000_000;

    creatorSeriesRef.current.update({ time, value: creatorValue });
    opponentSeriesRef.current.update({ time, value: opponentValue });
  }, [creatorBalance, opponentBalance]);

  return (
    <GlassCard className="p-6">
      <h3 className="text-xl font-bold text-white mb-4">Live Performance</h3>
      <div ref={chartContainerRef} />
    </GlassCard>
  );
}
