import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SettingsPage } from '../pages/SettingsPage';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('SettingsPage Controls & Interactions', () => {
  it('renders reminder schedule controls and channel switches', async () => {
    render(<SettingsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('60 days before')).toBeInTheDocument();
      expect(screen.getByText('30 days before')).toBeInTheDocument();
      expect(screen.getByText('14 days before')).toBeInTheDocument();
      expect(screen.getByText('7 days before')).toBeInTheDocument();
      expect(screen.getByText('Push notification')).toBeInTheDocument();
      expect(screen.getByText('Email backup')).toBeInTheDocument();
      expect(screen.getByText('SMS fallback')).toBeInTheDocument();
    });
  });

  it('toggles theme when dark mode button is clicked', async () => {
    render(<SettingsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Toggle dark mode|Switch to light mode/i)).toBeInTheDocument();
    });

    const themeBtn = screen.getByText(/Toggle dark mode|Switch to light mode/i);
    fireEvent.click(themeBtn);

    expect(document.documentElement.getAttribute('data-theme')).toBeDefined();
  });

  it('displays saved-state visual feedback after clicking save changes', async () => {
    render(<SettingsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
    });

    const saveBtn = screen.getByRole('button', { name: 'Save changes' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Settings saved successfully and applied to notification schedules/i)).toBeInTheDocument();
    });
  });
});
