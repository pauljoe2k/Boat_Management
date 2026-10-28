import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentRow, getDaysText, formatDate } from '../components/documents/DocumentRow';
import type { DocumentItem } from '../types/document';

describe('DocumentRow Component', () => {
  const mockDoc: DocumentItem = {
    id: 1,
    boatId: 1,
    type: 'Insurance',
    expiryDate: '2026-12-15',
    daysLeft: 47,
    submitted: false,
    boat: {
      id: 1,
      name: 'Sea Falcon',
      reg: 'KA-MNG-0412',
      owner: 'Ravi Naik',
    },
  };

  it('renders document details correctly', () => {
    render(<DocumentRow document={mockDoc} onToggleStatus={vi.fn()} />);

    expect(screen.getByText('Insurance')).toBeInTheDocument();
    expect(screen.getByText(/Sea Falcon · KA-MNG-0412/)).toBeInTheDocument();
    expect(screen.getByText('Not submitted')).toBeInTheDocument();
    expect(screen.getByText('47 days left')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mark Insurance as submitted/i })).toBeInTheDocument();
  });

  it('calls onToggleStatus when clicking Mark submitted', () => {
    const handleToggle = vi.fn();
    render(<DocumentRow document={mockDoc} onToggleStatus={handleToggle} />);

    const button = screen.getByRole('button', { name: /Mark Insurance as submitted/i });
    fireEvent.click(button);

    expect(handleToggle).toHaveBeenCalledWith(1, false);
  });

  it('renders Undo button for submitted documents', () => {
    const submittedDoc: DocumentItem = { ...mockDoc, submitted: true };
    const handleToggle = vi.fn();
    render(<DocumentRow document={submittedDoc} onToggleStatus={handleToggle} />);

    expect(screen.getByText('Submitted')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /Mark Insurance as not submitted/i });
    expect(button).toHaveTextContent('Undo');

    fireEvent.click(button);
    expect(handleToggle).toHaveBeenCalledWith(1, true);
  });

  it('formats getDaysText for positive, zero, and negative offsets', () => {
    expect(getDaysText(45)).toBe('45 days left');
    expect(getDaysText(0)).toBe('Expires today');
    expect(getDaysText(-6)).toBe('6 days overdue');
  });

  it('formats dates consistently', () => {
    const formatted = formatDate('2026-12-15');
    expect(formatted).toContain('2026');
    expect(formatted).toContain('Dec');
  });
});
