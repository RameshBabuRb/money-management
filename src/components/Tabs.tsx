interface Tab<T extends string> {
  id: T;
  label: string;
}

interface TabsProps<T extends string> {
  tabs: readonly Tab<T>[];
  current: T;
  onChange: (id: T) => void;
  ariaLabel: string;
  /** 'bar' underlines; 'segment' is a boxed control, for a nested row. */
  variant?: 'bar' | 'segment';
}

/**
 * Two tab rows can appear on one screen, so the nested one looks
 * deliberately different: same component, different skin.
 */
export function Tabs<T extends string>({
  tabs,
  current,
  onChange,
  ariaLabel,
  variant = 'bar',
}: TabsProps<T>) {
  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    onChange(tabs[(index + step + tabs.length) % tabs.length]!.id);
  }

  return (
    <div className={variant === 'bar' ? 'tabs' : 'subtabs'} role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          className={variant === 'bar' ? 'tab' : undefined}
          aria-selected={tab.id === current}
          tabIndex={tab.id === current ? 0 : -1}
          onClick={() => onChange(tab.id)}
          onKeyDown={(event) => onKeyDown(event, index)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
