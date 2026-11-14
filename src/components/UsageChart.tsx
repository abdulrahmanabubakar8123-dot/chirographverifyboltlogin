import React, { useState } from 'react';
import { BarChart3, Play, Sparkles } from 'lucide-react';
import type { DailyUsagePoint } from '../types/console';

interface UsageChartProps {
  data: DailyUsagePoint[];
}

export const UsageChart: React.FC<UsageChartProps> = ({
  data,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalVerifications = data.reduce((acc, point) => acc + point.verifications, 0);
  const maxVal = Math.max(...data.map((d) => d.verifications), 10);
  const yTicks = [0, Math.round(maxVal * 0.5), maxVal];

  const svgWidth = 640;
  const svgHeight = 224;
  const padLeft = 36;
  const padRight = 14;
  const padTop = 18;
  const padBottom = 28;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const getX = (index: number) => {
    if (data.length <= 1) return padLeft + plotWidth / 2;
    return padLeft + (index / (data.length - 1)) * plotWidth;
  };

  const getY = (value: number) => {
    if (maxVal === 0) return padTop + plotHeight;
    return padTop + plotHeight - (value / maxVal) * plotHeight;
  };

  const linePath = data
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${getX(index).toFixed(1)} ${getY(point.verifications).toFixed(1)}`)
    .join(' ');

  const areaPath =
    data.length > 0
      ? `${linePath} L ${getX(data.length - 1).toFixed(1)} ${(padTop + plotHeight).toFixed(1)} L ${getX(0).toFixed(1)} ${(padTop + plotHeight).toFixed(1)} Z`
      : '';

  const hoveredPoint = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div className="relative w-full">
      <div className="relative w-full h-[224px] select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible"
          role="img"
          aria-label="Verification usage chart over time"
        >
          <defs>
            <linearGradient id="chiroUsageGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Ticks */}
          {yTicks.map((tick, idx) => {
            const y = getY(tick);
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  x2={svgWidth - padRight}
                  y1={y}
                  y2={y}
                  className="stroke-zinc-200 dark:stroke-white/[0.07]"
                  strokeWidth="1"
                  strokeDasharray={tick === 0 ? undefined : '3 3'}
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-zinc-400 dark:fill-zinc-600 text-[10px] font-mono tabular-nums"
                >
                  {totalVerifications === 0 && tick > 0 ? '' : tick}
                </text>
              </g>
            );
          })}

          {/* Area & Line Series when populated */}
          {totalVerifications > 0 && (
            <>
              <path d={areaPath} fill="url(#chiroUsageGradient)" />
              <path
                d={linePath}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* X-Axis Labels */}
          {data.map((point, index) => {
            const showLabel = index === 0 || index === Math.floor(data.length / 2) || index === data.length - 1;
            if (!showLabel) return null;
            return (
              <text
                key={point.date}
                x={getX(index)}
                y={svgHeight - 6}
                textAnchor={index === 0 ? 'start' : index === data.length - 1 ? 'end' : 'middle'}
                className="fill-zinc-400 dark:fill-zinc-600 text-[10px] font-mono"
              >
                {point.label}
              </text>
            );
          })}

          {/* Interactive Hover Columns */}
          {totalVerifications > 0 &&
            data.map((point, index) => {
              const cx = getX(index);
              const cy = getY(point.verifications);
              const colWidth = plotWidth / Math.max(data.length, 1);
              const isHovered = hoveredIndex === index;

              return (
                <g
                  key={point.date}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-crosshair"
                >
                  <rect
                    x={cx - colWidth / 2}
                    y={padTop}
                    width={colWidth}
                    height={plotHeight}
                    fill="transparent"
                  />
                  {isHovered && (
                    <>
                      <line
                        x1={cx}
                        x2={cx}
                        y1={padTop}
                        y2={padTop + plotHeight}
                        className="stroke-white/20 dark:stroke-white/20"
                        strokeWidth="1"
                      />
                      <circle
                        cx={cx}
                        cy={cy}
                        r="4"
                        className="fill-blue-500 stroke-white dark:stroke-black"
                        strokeWidth="2"
                      />
                    </>
                  )}
                </g>
              );
            })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && hoveredIndex !== null && totalVerifications > 0 && (
          <div
            className="pointer-events-none absolute top-2 z-10 rounded-lg border border-zinc-200 dark:border-white/[0.14] bg-white dark:bg-[#141417] px-3 py-2 shadow-lg text-xs"
            style={{
              left: `${Math.min(Math.max((hoveredIndex / (data.length - 1)) * 78 + 8, 6), 68)}%`,
            }}
          >
            <p className="font-medium text-zinc-950 dark:text-white mb-1">
              {hoveredPoint.label}, 2026
            </p>
            <div className="flex items-center gap-3 text-[11px] font-mono tabular-nums">
              <span className="text-zinc-600 dark:text-zinc-300">
                Total: <strong className="text-zinc-950 dark:text-white">{hoveredPoint.verifications}</strong>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400">
                Pass: {hoveredPoint.passed}
              </span>
              <span className="text-amber-600 dark:text-amber-400">
                Flag: {hoveredPoint.flagged}
              </span>
            </div>
          </div>
        )}

        {/* Actionable Empty State Overlay */}
        {totalVerifications === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 dark:bg-[#141417] text-zinc-500 dark:text-zinc-400 mb-3">
              <BarChart3 className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium text-zinc-950 dark:text-white">
              No verification events recorded yet
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
              Run a test verification request or preview 14-day traffic to inspect throughput and pass rates.
            </p>

          </div>
        )}
      </div>
    </div>
  );
};
