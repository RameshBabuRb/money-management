import { Money } from '@/components/Money';
import { sumAmounts } from '@/domain/selectors';
import type { SpendSlice } from '@/domain/selectors';

/** A circle of radius 100/2π has a circumference of 100, so dash lengths read as percentages. */
const R = 15.9155;

export function SpendPie({ slices }: { slices: readonly SpendSlice[] }) {
  const total = sumAmounts(slices);
  if (total === 0) return null;

  let offset = 0;
  const arcs = slices.map((slice, index) => {
    const share = (slice.amount / total) * 100;
    const arc = { ...slice, share, offset, index };
    offset += share;
    return arc;
  });

  return (
    <div className="pie">
      <svg className="pie__chart" viewBox="0 0 42 42" role="img" aria-label="Spending split by what it was for">
        {arcs.map((arc) => (
          <circle
            key={arc.label}
            cx="21"
            cy="21"
            r={R}
            fill="none"
            stroke={`var(--slice-${arc.index + 1})`}
            strokeWidth="10"
            strokeDasharray={`${arc.share} ${100 - arc.share}`}
            strokeDashoffset={25 - arc.offset}
          />
        ))}
      </svg>

      <ul className="pie__legend">
        {arcs.map((arc) => (
          <li key={arc.label}>
            <span className="pie__swatch" style={{ background: `var(--slice-${arc.index + 1})` }} />
            <span className="pie__label">{arc.label}</span>
            <span className="pie__share">{Math.round(arc.share)}%</span>
            <Money value={arc.amount} className="pie__amount" />
          </li>
        ))}
      </ul>
    </div>
  );
}
