import { formatMoney } from '@/lib/money';
import type { Paise } from '@/domain/types';

type Tone = 'neutral' | 'positive' | 'negative' | 'auto';

interface MoneyProps {
  value: Paise;
  /** 'auto' colours by sign; the rest are explicit. */
  tone?: Tone;
  className?: string;
}

export function Money({ value, tone = 'neutral', className = '' }: MoneyProps) {
  const resolved = tone === 'auto' ? (value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral') : tone;
  const toneClass = resolved === 'positive' ? 'is-positive' : resolved === 'negative' ? 'is-negative' : '';
  return <span className={`amount ${toneClass} ${className}`.trim()}>{formatMoney(value)}</span>;
}
