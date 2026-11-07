import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, children }: FieldProps) {
  return (
    <div className="field">
      {htmlFor ? (
        <label className="field__label" htmlFor={htmlFor}>
          {label}
        </label>
      ) : (
        <span className="field__label">{label}</span>
      )}
      {children}
    </div>
  );
}
