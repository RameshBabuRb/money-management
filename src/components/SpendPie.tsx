import { Money } from '@/components/Money';
import { sumAmounts } from '@/domain/selectors';
import type { SpendSlice } from '@/domain/selectors';
import { useState } from 'react';

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
  const [colors] = useState<any>([
    { name: "Red", hex: "#FF0000" },
    { name: "Blue", hex: "#0000FF" },
    { name: "Green", hex: "#008000" },
    { name: "Yellow", hex: "#FFFF00" },
    { name: "Orange", hex: "#FFA500" },
    { name: "Purple", hex: "#800080" },
    { name: "Pink", hex: "#FFC0CB" },
    { name: "Black", hex: "#000000" },
    { name: "White", hex: "#FFFFFF" },
    { name: "Gray", hex: "#808080" },
    { name: "Brown", hex: "#A52A2A" },
    { name: "Teal", hex: "#008080" },
    { name: "Cyan", hex: "#00FFFF" },
    { name: "Magenta", hex: "#FF00FF" },
    { name: "Lime", hex: "#00FF00" },
    { name: "Navy", hex: "#000080" },
    { name: "Coral", hex: "#FF7F50" },
    { name: "Gold", hex: "#FFD700" },
    { name: "Silver", hex: "#C0C0C0" },
    { name: "Indigo", hex: "#4B0082" },
    { name: "Olive", hex: "#808000" },
    { name: "Maroon", hex: "#800000" },
    { name: "Crimson", hex: "#DC143C" },
    { name: "Turquoise", hex: "#40E0D0" },
    { name: "Salmon", hex: "#FA8072" },
    { name: "Orchid", hex: "#DA70D6" },
    { name: "Chocolate", hex: "#D2691E" }
  ]);


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
            // stroke={`var(--slice-${arc.index + 1})`}
            stroke={colors[arc.index % colors.length].hex}
            strokeWidth="10"
            strokeDasharray={`${arc.share} ${100 - arc.share}`}
            strokeDashoffset={25 - arc.offset}
          />
        ))}
      </svg>

      <ul className="pie__legend">
        {arcs.map((arc) => (
          <li key={arc.label}>
            {/* <span className="pie__swatch" style={{ background: `var(--slice-${arc.index + 1})` }} /> */}
            <span className="pie__swatch" style={{ background: colors[arc.index % colors.length].hex }} />
            <span className="pie__label">{arc.label}</span>
            <span className="pie__share">{Math.round(arc.share)}%</span>
            <Money value={arc.amount} className="pie__amount" />
          </li>
        ))}
      </ul>
    </div>
  );
}
