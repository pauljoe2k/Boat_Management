import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterBoatModal } from '../components/boats/RegisterBoatModal';

describe('RegisterBoatModal Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <RegisterBoatModal
        isOpen={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.queryByText('Register boat')).not.toBeInTheDocument();
  });

  it('renders form inputs when isOpen is true', () => {
    render(
      <RegisterBoatModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByText('Register boat')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Sea Falcon')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. KA-MNG-0412')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Ravi Naik')).toBeInTheDocument();
  });

  it('validates required fields before submitting', async () => {
    const handleSubmit = vi.fn();
    render(
      <RegisterBoatModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />
    );

    const submitBtn = screen.getByRole('button', { name: 'Register' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Boat name must be at least 2 characters/i)).toBeInTheDocument();
    });
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('submits valid data successfully', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <RegisterBoatModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('e.g. Sea Falcon'), {
      target: { value: 'Southern Star' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. KA-MNG-0412'), {
      target: { value: 'GA-PNJ-5566' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. Ravi Naik'), {
      target: { value: 'Anita D’Souza' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Southern Star',
          reg: 'GA-PNJ-5566',
          owner: 'Anita D’Souza',
        })
      );
    });
  });
});
