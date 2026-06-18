'use client';

import { useState, useEffect, useRef } from 'react';
import { voronoiMapSimulation } from 'd3-voronoi-map';
import styles from './page.module.css';

// Deterministic HSL gradient generator for each character
function getHslColors(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash % 360);
  const h2 = (h1 + 40) % 360;
  return {
    color1: `hsl(${h1}, 75%, 70%)`,
    color2: `hsl(${h2}, 80%, 50%)`
  };
}

// Seeded PRNG generator (LCG) for deterministic initial placement
function getSeededPRNG(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// True centroid calculation for 2D polygon
function getCentroid(polygon) {
  if (!polygon || polygon.length === 0) return null;
  
  // Close the polygon if not closed, or exclude duplicate last point
  let pts = polygon;
  if (polygon.length > 1 && 
      polygon[polygon.length - 1][0] === polygon[0][0] && 
      polygon[polygon.length - 1][1] === polygon[0][1]) {
    pts = polygon.slice(0, -1);
  }
  
  const n = pts.length;
  let area = 0;
  let cx = 0;
  let cy = 0;
  
  for (let i = 0; i < n; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const factor = p1[0] * p2[1] - p2[0] * p1[1];
    area += factor;
    cx += (p1[0] + p2[0]) * factor;
    cy += (p1[1] + p2[1]) * factor;
  }
  
  area = area / 2.0;
  if (Math.abs(area) < 1e-4) {
    let sx = 0, sy = 0;
    for (const p of pts) { sx += p[0]; sy += p[1]; }
    return { x: sx / n, y: sy / n };
  }
  
  cx = cx / (6.0 * area);
  cy = cy / (6.0 * area);
  return { x: cx, y: cy };
}

export default function TreemapView({ data }) {
  const [cells, setCells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredChar, setHoveredChar] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);
  const svgRef = useRef(null);

  const width = 1000;
  const height = 600;

  // Compute Voronoi "land-grab" cells once data is loaded on the client
  useEffect(() => {
    if (!data || data.length === 0) return;

    try {
      // Ensure all characters have a count of at least 1 so they are visible and not omitted
      const processedData = data.map(d => ({
        ...d,
        count: Math.max(1, d.count)
      }));

      const clip = [[0, 0], [0, height], [width, height], [width, 0]];
      const prng = getSeededPRNG(42); // Seeded LCG for deterministic layouts

      // Initialize d3-voronoi-map simulation
      const simulation = voronoiMapSimulation(processedData)
        .weight(d => d.count)
        .clip(clip)
        .prng(prng)
        .minWeightRatio(0.0001) // Support extremely small weights (up to 1/10000 of max)
        .convergenceRatio(0.001) // High precision threshold
        .maxIterationCount(300); // Allow up to 300 iterations for convergence

      // Run simulation synchronously to get final layout
      let state = simulation.state();
      while (!state.ended) {
        simulation.tick();
        state = simulation.state();
      }

      const polygons = state.polygons;
      const computedCells = polygons.map((p, i) => {
        const orig = p.site.originalObject.data.originalData;
        const colors = getHslColors(orig.name);
        const centroid = getCentroid(p) || { x: p.site.x, y: p.site.y };

        // Bounding box size to determine content visibility
        let minX = width, maxX = 0, minY = height, maxY = 0;
        for (const pt of p) {
          minX = Math.min(minX, pt[0]);
          maxX = Math.max(maxX, pt[0]);
          minY = Math.min(minY, pt[1]);
          maxY = Math.max(maxY, pt[1]);
        }
        const cellWidth = maxX - minX;
        const cellHeight = maxY - minY;

        // Convert to path D string
        const pathD = 'M' + p.map(pt => `${pt[0]},${pt[1]}`).join('L') + 'Z';

        return {
          id: orig.id || orig.name,
          name: orig.name,
          count: orig.count,
          icon: orig.icon,
          pathD,
          centroid,
          cellWidth,
          cellHeight,
          colors
        };
      });

      requestAnimationFrame(() => {
        setCells(computedCells);
        setLoading(false);
      });
    } catch (err) {
      console.error('Voronoi computation failed:', err);
      requestAnimationFrame(() => {
        setLoading(false);
      });
    }
  }, [data]);

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  if (loading) {
    return (
      <div className={styles.chartContainer} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: `${height}px` }}>
        <div className={styles.spinner}></div>
        <div style={{ color: '#94a3b8', marginLeft: '12px' }}>인포그래픽 지도 생성 중...</div>
      </div>
    );
  }

  return (
    <div className={styles.chartContainer} style={{ position: 'relative', overflow: 'hidden' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        style={{ display: 'block', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredChar(null)}
      >
        <defs>
          {cells.map((cell, i) => (
            <linearGradient key={`grad-${i}`} id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={cell.colors.color1} />
              <stop offset="100%" stopColor={cell.colors.color2} />
            </linearGradient>
          ))}
        </defs>

        <g>
          {cells.map((cell, i) => {
            const isHovered = hoveredChar?.name === cell.name;
            
            // Dynamically scale icon size based on cell dimensions
            const maxIconSize = 42;
            const iconSize = Math.max(12, Math.min(maxIconSize, cell.cellWidth * 0.45, cell.cellHeight * 0.45));
            const showIcon = cell.cellWidth >= 20 && cell.cellHeight >= 20;
            const showText = cell.cellWidth >= 40 && cell.cellHeight >= 30;

            return (
              <g
                key={`cell-${i}`}
                onMouseEnter={() => setHoveredChar(cell)}
                style={{ cursor: 'pointer' }}
              >
                {/* Weighted Voronoi (Power Diagram) Polygonal Path */}
                <path
                  d={cell.pathD}
                  fill={`url(#grad-${i})`}
                  stroke="rgba(15, 23, 42, 0.85)"
                  strokeWidth={isHovered ? 4.5 : 1.25}
                  style={{
                    transition: 'stroke-width 0.15s ease, filter 0.15s ease',
                    filter: isHovered ? 'brightness(1.15) drop-shadow(0 4px 12px rgba(255,255,255,0.18))' : 'none',
                  }}
                />

                {/* Avatar Icon placed at the exact polygon centroid */}
                {showIcon && cell.icon && (
                  <g transform={`translate(${cell.centroid.x}, ${cell.centroid.y})`}>
                    <clipPath id={`avatar-clip-${i}`}>
                      <circle cx="0" cy={showText ? -iconSize * 0.35 : 0} r={iconSize / 2} />
                    </clipPath>
                    <circle
                      cx="0"
                      cy={showText ? -iconSize * 0.35 : 0}
                      r={iconSize / 2 + 1}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.75)"
                      strokeWidth="1.5"
                    />
                    <image
                      href={cell.icon}
                      x={-iconSize / 2}
                      y={showText ? -iconSize * 0.85 : -iconSize / 2}
                      width={iconSize}
                      height={iconSize}
                      clipPath={`url(#avatar-clip-${i})`}
                      referrerPolicy="no-referrer"
                    />
                  </g>
                )}

                {/* Character Name text */}
                {showText && (
                  <g transform={`translate(${cell.centroid.x}, ${cell.centroid.y})`}>
                    {/* Shadow for readability */}
                    <text
                      x="0"
                      y={iconSize * 0.5 + 4}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#000"
                      fontSize={cell.cellWidth >= 75 ? "11.5" : "9"}
                      fontWeight="800"
                      opacity="0.8"
                      stroke="#000"
                      strokeWidth="2.5"
                    >
                      {cell.name}
                    </text>
                    <text
                      x="0"
                      y={iconSize * 0.5 + 4}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#fff"
                      fontSize={cell.cellWidth >= 75 ? "11.5" : "9"}
                      fontWeight="800"
                      style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
                    >
                      {cell.name}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Tooltip following the cursor */}
      {hoveredChar && tooltipPos && (
        <div
          style={{
            position: 'absolute',
            left: tooltipPos.x + 15,
            top: tooltipPos.y + 15,
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '10px 14px',
            color: '#fff',
            pointerEvents: 'none',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6)',
            zIndex: 100,
            fontSize: '0.875rem',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'left 0.1s ease, top 0.1s ease',
          }}
        >
          {hoveredChar.icon && (
            <img
              src={hoveredChar.icon}
              alt={hoveredChar.name}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                objectFit: 'cover',
                border: '1.5px solid rgba(255,255,255,0.2)'
              }}
              referrerPolicy="no-referrer"
            />
          )}
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{hoveredChar.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '2px' }}>
              투고 수: <span style={{ color: '#818cf8', fontWeight: 'bold' }}>{hoveredChar.count.toLocaleString()}</span>개
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
