import type { ReactNode } from 'react';

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

export function FilterButton({ active, onClick, children }: FilterButtonProps) {
  return (
    <button type="button" className={`filter-btn ${active ? 'active' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}
