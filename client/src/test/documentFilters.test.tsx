import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentFilters } from '../components/documents/DocumentFilters';
import type { Boat } from '../types/boat';

describe('DocumentFilters Component', () => {
  const mockBoats: Boat[] = [
    { id: 1, name: 'Sea Falcon', reg: 'KA-MNG-0412', owner: 'Ravi Naik', kind: 'Trawler', ic: '🎣', c: 's' },
    { id: 2, name: 'Blue Pearl', reg: 'KA-MNG-0877', owner: 'Ravi Naik', kind: 'Boat', ic: '🐟', c: 'g' },
  ];

  it('renders all status chips with the active one highlighted', () => {
    render(
      <DocumentFilters
        search=""
        onSearchChange={vi.fn()}
        status="due"
        onStatusChange={vi.fn()}
        boatId="all"
        onBoatIdChange={vi.fn()}
        sort="days"
        onSortChange={vi.fn()}
        boats={mockBoats}
      />
    );

    const dueChip = screen.getByRole('button', { name: 'Due in 60 days' });
    expect(dueChip).toHaveClass('on');

    const allChip = screen.getByRole('button', { name: 'All' });
    expect(allChip).not.toHaveClass('on');
  });

  it('triggers onStatusChange when a chip is clicked', () => {
    const handleStatus = vi.fn();
    render(
      <DocumentFilters
        search=""
        onSearchChange={vi.fn()}
        status="all"
        onStatusChange={handleStatus}
        boatId="all"
        onBoatIdChange={vi.fn()}
        sort="days"
        onSortChange={vi.fn()}
        boats={mockBoats}
      />
    );

    const submittedChip = screen.getByRole('button', { name: 'Submitted' });
    fireEvent.click(submittedChip);

    expect(handleStatus).toHaveBeenCalledWith('yes');
  });

  it('triggers onSearchChange when input changes', () => {
    const handleSearch = vi.fn();
    render(
      <DocumentFilters
        search=""
        onSearchChange={handleSearch}
        status="all"
        onStatusChange={vi.fn()}
        boatId="all"
        onBoatIdChange={vi.fn()}
        sort="days"
        onSortChange={vi.fn()}
        boats={mockBoats}
      />
    );

    const input = screen.getByPlaceholderText('Search boat, owner or document');
    fireEvent.change(input, { target: { value: 'Falcon' } });

    expect(handleSearch).toHaveBeenCalledWith('Falcon');
  });

  it('triggers onBoatIdChange when boat dropdown changes', () => {
    const handleBoatChange = vi.fn();
    render(
      <DocumentFilters
        search=""
        onSearchChange={vi.fn()}
        status="all"
        onStatusChange={vi.fn()}
        boatId="all"
        onBoatIdChange={handleBoatChange}
        sort="days"
        onSortChange={vi.fn()}
        boats={mockBoats}
      />
    );

    const select = screen.getByLabelText('Filter by boat');
    fireEvent.change(select, { target: { value: '2' } });

    expect(handleBoatChange).toHaveBeenCalledWith('2');
  });
});
