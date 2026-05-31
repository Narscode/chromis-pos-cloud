import React from 'react';
import { RevenueTrendPoint, BranchComparisonPoint, ForecastPoint } from '../types';

// ============================================================================
// 1. REVENUE TREND CHART (SVG Area Chart with Gradients)
// ============================================================================
interface RevenueTrendChartProps {
  data: RevenueTrendPoint[];
}

export const RevenueTrendChart: React.FC<RevenueTrendChartProps> = ({ data }) => {
  if (!data || data.length === 0) return <div className="chart-fallback">No revenue data available</div>;

  const width = 500;
  const height = 200;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const revenues = data.map(d => d.revenue);
  const maxRevenue = Math.max(...revenues, 10000) * 1.1; // Add 10% headroom

  // Plot coordinates
  const points = data.map((d, index) => {
    const x = paddingLeft + (index / (data.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (d.revenue / maxRevenue) * chartHeight;
    return { x, y };
  });

  const pathD = points.reduce((acc, p, i) => 
    i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, 
    ''
  );

  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
    : '';

  return (
    <div style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        <defs>
          <linearGradient id="revenueGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingTop + chartHeight * ratio;
          const val = (maxRevenue * (1 - ratio));
          return (
            <g key={idx}>
              <line 
                x1={paddingLeft} 
                y1={y} 
                x2={width - paddingRight} 
                y2={y} 
                stroke="rgba(255,255,255,0.05)" 
                strokeDasharray="4" 
              />
              <text 
                x={paddingLeft - 8} 
                y={y + 4} 
                fill="var(--text-muted)" 
                fontSize="9" 
                textAnchor="end"
              >
                {val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Areas & Lines */}
        {areaD && <path d={areaD} fill="url(#revenueGlow)" />}
        {pathD && <path d={pathD} fill="none" stroke="var(--primary)" strokeWidth="2.5" />}

        {/* Data points */}
        {points.map((p, idx) => (
          <g key={idx} className="chart-dot">
            <circle cx={p.x} cy={p.y} r="4" fill="var(--bg-secondary)" stroke="var(--primary)" strokeWidth="2" />
            <text x={p.x} y={p.y - 8} fill="#fff" fontSize="8" fontWeight="600" textAnchor="middle" opacity="0" className="chart-tooltip">
              {(revenues[idx]/1000).toFixed(0)}k
            </text>
          </g>
        ))}

        {/* X Axis Labels */}
        {data.map((d, index) => {
          const x = paddingLeft + (index / (data.length - 1)) * chartWidth;
          // Show only alternate dates to avoid crowding
          if (data.length > 5 && index % 2 !== 0) return null;
          return (
            <text 
              key={index}
              x={x} 
              y={height - 8} 
              fill="var(--text-muted)" 
              fontSize="9" 
              textAnchor="middle"
            >
              {d.date.substring(5)} {/* MM-DD */}
            </text>
          );
        })}
      </svg>
      <style>{`
        .chart-dot:hover .chart-tooltip { opacity: 1; transition: opacity 0.2s; }
        .chart-dot:hover circle { r: 6; fill: var(--primary); }
      `}</style>
    </div>
  );
};

// ============================================================================
// 2. BRANCH COMPARISON CHART (SVG Bar Chart)
// ============================================================================
interface BranchComparisonChartProps {
  data: BranchComparisonPoint[];
}

export const BranchComparisonChart: React.FC<BranchComparisonChartProps> = ({ data }) => {
  if (!data || data.length === 0) return <div className="chart-fallback">No branch data available</div>;

  const width = 500;
  const height = 200;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const revenues = data.map(d => d.revenue);
  const maxRevenue = Math.max(...revenues, 10000) * 1.1;

  const barWidth = Math.min(45, (chartWidth / data.length) * 0.5);
  const gap = (chartWidth - barWidth * data.length) / (data.length - 1 || 1);

  return (
    <div style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--secondary)" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingTop + chartHeight * ratio;
          const val = (maxRevenue * (1 - ratio));
          return (
            <g key={idx}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(255,255,255,0.05)" />
              <text x={paddingLeft - 8} y={y + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end">
                {val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, index) => {
          const x = paddingLeft + index * (barWidth + gap) + gap / 2;
          const barHeight = (d.revenue / maxRevenue) * chartHeight;
          const y = paddingTop + chartHeight - barHeight;

          return (
            <g key={index} className="chart-bar">
              <rect 
                x={x} 
                y={y} 
                width={barWidth} 
                height={barHeight} 
                fill="url(#barGradient)" 
                rx="4"
                style={{ transition: 'all 0.5s ease' }}
              />
              <text 
                x={x + barWidth / 2} 
                y={y - 8} 
                fill="#fff" 
                fontSize="9" 
                fontWeight="700" 
                textAnchor="middle"
                opacity="0"
                className="bar-tooltip"
              >
                {(d.revenue/1000).toFixed(0)}k
              </text>
              <text 
                x={x + barWidth / 2} 
                y={height - 8} 
                fill="var(--text-secondary)" 
                fontSize="9" 
                fontWeight="500"
                textAnchor="middle"
              >
                {d.name.split(' ')[0]} {/* Shorten name */}
              </text>
            </g>
          );
        })}
      </svg>
      <style>{`
        .chart-bar:hover rect { fill: #34d399; filter: drop-shadow(0 0 6px rgba(52, 211, 153, 0.4)); }
        .chart-bar:hover .bar-tooltip { opacity: 1; transition: opacity 0.2s; }
      `}</style>
    </div>
  );
};

// ============================================================================
// 3. FORECAST VISUALIZATION CHART (Linear regression actual vs prediction)
// ============================================================================
interface ForecastChartProps {
  data: ForecastPoint[];
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ data }) => {
  if (!data || data.length === 0) return <div className="chart-fallback">No forecast model available</div>;

  const width = 500;
  const height = 200;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map(d => Math.max(d.actual || 0, d.forecast)), 10000) * 1.1;

  // Plot actual points
  const actualPoints: { x: number; y: number }[] = [];
  const forecastPoints: { x: number; y: number }[] = [];

  data.forEach((d, index) => {
    const x = paddingLeft + (index / (data.length - 1)) * chartWidth;
    if (d.actual !== null) {
      const yAct = paddingTop + chartHeight - (d.actual / maxVal) * chartHeight;
      actualPoints.push({ x, y: yAct });
    }
    const yFore = paddingTop + chartHeight - (d.forecast / maxVal) * chartHeight;
    forecastPoints.push({ x, y: yFore });
  });

  const actualPathD = actualPoints.reduce((acc, p, i) => 
    i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, 
    ''
  );

  const forecastPathD = forecastPoints.reduce((acc, p, i) => 
    i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, 
    ''
  );

  return (
    <div style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        <defs>
          <linearGradient id="forecastGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingTop + chartHeight * ratio;
          const val = (maxVal * (1 - ratio));
          return (
            <g key={idx}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
              <text x={paddingLeft - 8} y={y + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end">
                {val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Shaded Forecast Area */}
        {forecastPoints.length > 0 && (
          <path 
            d={`${forecastPathD} L ${forecastPoints[forecastPoints.length - 1].x} ${paddingTop + chartHeight} L ${forecastPoints[0].x} ${paddingTop + chartHeight} Z`}
            fill="url(#forecastGlow)"
          />
        )}

        {/* Historical Solid line */}
        {actualPathD && (
          <path d={actualPathD} fill="none" stroke="var(--primary)" strokeWidth="3" />
        )}

        {/* Future Extrapolated Dotted line */}
        {forecastPathD && (
          <path d={forecastPathD} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeDasharray="5,4" />
        )}

        {/* Legend */}
        <g transform={`translate(${paddingLeft + 10}, ${paddingTop + 10})`}>
          <line x1="0" y1="5" x2="15" y2="5" stroke="var(--primary)" strokeWidth="3" />
          <text x="20" y="9" fill="var(--text-secondary)" fontSize="8" fontWeight="600">Historical Sales</text>
          
          <line x1="100" y1="5" x2="115" y2="5" stroke="var(--accent)" strokeWidth="2.5" strokeDasharray="3,2" />
          <text x="120" y="9" fill="var(--text-secondary)" fontSize="8" fontWeight="600">Predictive Forecast</text>
        </g>

        {/* Transition Divider (Actual ends) */}
        {actualPoints.length > 0 && (
          <line 
            x1={actualPoints[actualPoints.length - 1].x} 
            y1={paddingTop} 
            x2={actualPoints[actualPoints.length - 1].x} 
            y2={paddingTop + chartHeight} 
            stroke="var(--warning)" 
            strokeWidth="1"
            strokeDasharray="2,2" 
          />
        )}

        {/* X Axis labels */}
        {data.map((d, index) => {
          const x = paddingLeft + (index / (data.length - 1)) * chartWidth;
          if (data.length > 7 && index % 2 !== 0) return null;
          return (
            <text key={index} x={x} y={height - 8} fill="var(--text-muted)" fontSize="9" textAnchor="middle">
              {d.date.substring(5)}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
