
import React from 'react';
import { Team } from '../types';

interface DecibelMeterProps {
  currentDb: number;
  threshold: number;
  team: Team;
}

const DecibelMeter: React.FC<DecibelMeterProps> = ({ currentDb, threshold, team }) => {
  const minDb = 30;
  const maxDb = 120;

  const normalizedValue = Math.min(Math.max((currentDb - minDb) / (maxDb - minDb), 0), 1);
  const thresholdNormalized = (threshold - minDb) / (maxDb - minDb);

  const isAbove = currentDb >= threshold;
  const teamColorHex = team === 'red' ? '#ef4444' : '#3b82f6';

  // Speedometer arc: 210° start → 330° sweep (same as before)
  const startAngle = 150;
  const sweepAngle = 240;
  const needleAngle = startAngle + normalizedValue * sweepAngle;

  const polarToCartesian = (cx: number, cy: number, r: number, deg: number) => {
    const rad = (deg - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  // Build tick segments — each is a short arc stroke, colour changes but position never moves
  const TICK_COUNT = 32;
  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const frac = i / (TICK_COUNT - 1);
    const angle = startAngle + frac * sweepAngle;
    const isMajor = i % 4 === 0;
    const inner = polarToCartesian(100, 100, isMajor ? 68 : 71, angle);
    const outer = polarToCartesian(100, 100, 78, angle);
    const isActive = frac <= normalizedValue;
    const isPastThreshold = frac >= thresholdNormalized;
    return { inner, outer, isActive, isPastThreshold, isMajor, angle, frac };
  });

  // Label positions for major ticks
  const labels = [0, 4, 8, 12, 16, 20, 24, 28, 32].map(i => {
    const frac = i / (TICK_COUNT - 1);
    const angle = startAngle + frac * sweepAngle;
    const pos = polarToCartesian(100, 100, 60, angle);
    const dbVal = Math.round(minDb + frac * (maxDb - minDb));
    return { pos, dbVal };
  });

  // Needle tip & tail
  const needleTip = polarToCartesian(100, 100, 70, needleAngle);
  const needleTail = polarToCartesian(100, 100, -10, needleAngle);

  return (
    <div className="w-full max-w-md mx-auto select-none">
      <svg viewBox="0 0 200 200" className="w-full drop-shadow-2xl">

        {/* Background track ring */}
        <circle cx="100" cy="100" r="80" fill="none" stroke="#0f172a" strokeWidth="18" />

        {/* Static tick marks — only colour/opacity changes, never position */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.inner.x} y1={t.inner.y}
            x2={t.outer.x} y2={t.outer.y}
            strokeWidth={t.isMajor ? 2.5 : 1.5}
            strokeLinecap="round"
            style={{
              stroke: t.isActive
                ? (t.isPastThreshold ? teamColorHex : '#94a3b8')
                : '#1e293b',
              opacity: t.isActive ? 1 : 0.35,
              filter: t.isActive && t.isPastThreshold
                ? `drop-shadow(0 0 4px ${teamColorHex})`
                : 'none',
              transition: 'stroke 0.08s, opacity 0.08s',
            }}
          />
        ))}

        {/* Threshold marker */}
        {(() => {
          const a = startAngle + thresholdNormalized * sweepAngle;
          const p1 = polarToCartesian(100, 100, 64, a);
          const p2 = polarToCartesian(100, 100, 82, a);
          return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" />;
        })()}

        {/* Scale labels */}
        {labels.map((l, i) => (
          <text
            key={i}
            x={l.pos.x} y={l.pos.y}
            fill="#334155"
            fontSize="7"
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="FuturaRedBull"
            fontWeight="bold"
          >
            {l.dbVal}
          </text>
        ))}

        {/* Needle — thin line, rotates only */}
        <line
          x1={needleTail.x} y1={needleTail.y}
          x2={needleTip.x} y2={needleTip.y}
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            stroke: isAbove ? teamColorHex : '#64748b',
            filter: isAbove ? `drop-shadow(0 0 6px ${teamColorHex})` : 'none',
            transition: 'stroke 0.1s',
          }}
        />

        {/* Pivot cap */}
        <circle cx="100" cy="100" r="5" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />

        {/* Centre readout */}
        <text
          x="100" y="118"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="22"
          fontFamily="FuturaRedBull"
          fontWeight="900"
          style={{
            fill: isAbove ? teamColorHex : '#64748b',
            transition: 'fill 0.1s',
          }}
        >
          {Math.round(currentDb)}
        </text>
        <text x="100" y="133" textAnchor="middle" fill="#334155" fontSize="6" fontFamily="FuturaRedBull" fontWeight="bold" letterSpacing="3">
          DECIBELS
        </text>

        {/* Status */}
        <circle cx="100" cy="153" r="2.5" style={{ fill: isAbove ? teamColorHex : '#1e293b', transition: 'fill 0.1s' }} />
        <text x="100" y="164" textAnchor="middle" fontSize="5.5" fontFamily="FuturaRedBull" fontWeight="bold" letterSpacing="2" style={{ fill: isAbove ? teamColorHex : '#334155', transition: 'fill 0.1s' }}>
          {isAbove ? 'THRESHOLD BREACH' : 'LISTENING'}
        </text>

      </svg>
    </div>
  );
};

export default DecibelMeter;
