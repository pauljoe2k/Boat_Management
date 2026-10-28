import React from 'react';
import type { Boat } from '../../types/boat';
import type { DocumentFilterStatus, DocumentSortOption } from '../../types/document';

export interface DocumentFiltersProps {
  search: string;
  onSearchChange: (search: string) => void;
  status: DocumentFilterStatus;
  onStatusChange: (status: DocumentFilterStatus) => void;
  boatId: string | number;
  onBoatIdChange: (boatId: string | number) => void;
  sort: DocumentSortOption;
  onSortChange: (sort: DocumentSortOption) => void;
  boats: Boat[];
}

const CHIPS: { value: DocumentFilterStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'no', label: 'Not submitted' },
  { value: 'yes', label: 'Submitted' },
  { value: 'due', label: 'Due in 60 days' },
  { value: 'over', label: 'Overdue' },
];

export const DocumentFilters: React.FC<DocumentFiltersProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  boatId,
  onBoatIdChange,
  sort,
  onSortChange,
  boats,
}) => {
  return (
    <div style={{ display: 'grid', gap: '10px', marginBottom: '14px' }}>
      {/* Status Chips */}
      <div
        className="bar"
        role="group"
        aria-label="Filter documents by status"
        style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}
      >
        {CHIPS.map((chip) => {
          const isSelected = status === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              className={`chip ${isSelected ? 'on' : ''}`.trim()}
              onClick={() => onStatusChange(chip.value)}
              style={{
                border: isSelected ? '1px solid var(--ink)' : '1px solid var(--ln)',
                background: isSelected ? 'var(--ink)' : 'var(--sf)',
                color: isSelected ? 'var(--bg)' : 'var(--mu)',
                borderRadius: '99px',
                padding: '7px 15px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                transition: 'all var(--transition-fast)',
              }}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Search, Boat Selector, and Sorter */}
      <div
        className="bar"
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          type="search"
          placeholder="Search boat, owner or document"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search documents"
          style={{
            flex: 1,
            minWidth: '200px',
          }}
        />

        <select
          value={boatId}
          onChange={(e) => onBoatIdChange(e.target.value)}
          aria-label="Filter by boat"
          style={{ width: 'auto' }}
        >
          <option value="all">All boats</option>
          {boats.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as DocumentSortOption)}
          aria-label="Sort documents"
          style={{ width: 'auto' }}
        >
          <option value="days">Soonest first</option>
          <option value="boat">By boat</option>
          <option value="status">Not submitted first</option>
        </select>
      </div>
    </div>
  );
};
