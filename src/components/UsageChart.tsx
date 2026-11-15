import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import type { DailyUsagePoint } from '../types/console';

interface UsageChartProps {
  data: DailyUsagePoint[];
}

/**
 * Verification throughput chart.
 *
 * Stroke and fill run brand-blue → emerald, matching the analytics surfaces.
 * The gradient ids are stable so every mount reuses the same SVG defs.
 */
export const UsageChart: React.FC<UsageChartProps> = ({ data }) => {
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
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'} ${getX(index).toFixed(1)} ${getY(point.verifications).toFixed(1)}`,
    )
    .join(' ');

  const areaPath =
    data.length > 0
      ? `${linePath} L ${getX(data.length - 1).toFixed(1)} ${(padTop + plotHeight).toFixed(1)} L ${getX(0).toFixed(1)} ${(padTop + plotHeight).toFixed(1)} Z`
      : '';

  const hoveredPoint = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div className="relative w-full">
      <div className="relative h-[224px] w-full select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="h-full w-full overflow-visible"
          role="img"
          aria-label="Verification usage chart over time"
        >
          <defs>
            <linearGradient id="chiroUsageStroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B5BFF" />
              <stop offset="65%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <linearGradient id="chiroUsageFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B5BFF" stopOpacity="0.34" />
              <stop offset="55%" stopColor="#10B981" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Horizontal gridlines + y-axis ticks */}
          {yTicks.map((tick, idx) => {
            const y = getY(tick);
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  x2={svgWidth - padRight}
                  y1={y}
                  y2={y}
                  className={tick === 0 ? 'stroke-zinc-300 dark:stroke-white/[0.08]' : 'stroke-zinc-200 dark:stroke-white/[0.06]'}
                  strokeWidth="1"
                  strokeDasharray={tick === 0 ? undefined : '3 3'}
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#71717a"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {totalVerifications === 0 && tick > 0 ? '' : tick}
                </text>
              </g>
            );
          })}

          {/* Area + line series */}
          {totalVerifications > 0 && (
            <>
              <path d={areaPath} fill="url(#chiroUsageFill)" />
              <path
                d={linePath}
                fill="none"
                stroke="url(#chiroUsageStroke)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* X-axis labels */}
          {data.map((point, index) => {
            const showLabel =
              index === 0 || index === Math.floor(data.length / 2) || index === data.length - 1;
            if (!showLabel) return null;
            return (
              <text
                key={point.date}
                x={getX(index)}
                y={svgHeight - 6}
                textAnchor={index === 0 ? 'start' : index === data.length - 1 ? 'end' : 'middle'}
                fill="#71717a"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
              >
                {point.label}
              </text>
            );
          })}

          {/* Interactive hover columns */}
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
                        className="stroke-zinc-300 dark:stroke-white/20"
                        strokeWidth="1"
                      />
                      <circle cx={cx} cy={cy} r="4" fill="#10B981" className="stroke-white dark:stroke-[#05080f]" strokeWidth="2" />
                    </>
                  )}
                </g>
              );
            })}
        </svg>

        {/* Floating tooltip */}
        {hoveredPoint && hoveredIndex !== null && totalVerifications > 0 && (
          <div
            className="glass-panel pointer-events-none absolute top-2 z-10 rounded-xl px-3 py-2 text-xs"
            style={{
              left: `${Math.min(Math.max((hoveredIndex / Math.max(data.length - 1, 1)) * 78 + 8, 6), 68)}%`,
            }}
          >
            <p className="relative z-10 mb-1 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
              {hoveredPoint.label}
            </p>
            <div className="relative z-10 flex items-center gap-3 font-mono text-[11px] tabular-nums">
              <span className="text-zinc-600 dark:text-zinc-300">
                Total:{' '}
                <strong className="text-zinc-950 dark:text-white">{hoveredPoint.verifications}</strong>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400">
                Pass: {hoveredPoint.passed}
              </span>
              <span className="text-amber-600 dark:text-amber-400">Flag: {hoveredPoint.flagged}</span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {totalVerifications === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 pb-4 text-center">
            <div className="morph-socket mb-3 flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400">
              <BarChart3 className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium text-zinc-950 dark:text-white">
              No verification events recorded yet
            </p>
            <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
              Run a test verification request or preview 14-day traffic to inspect throughput and pass
              rates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
