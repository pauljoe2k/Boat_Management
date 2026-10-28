import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AddDocumentPage } from '../pages/AddDocumentPage';
import { ToastProvider } from '../context/ToastContext';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>{children}</BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
};

describe('AddDocumentPage Form & Interactions', () => {
  it('renders all form fields and default values', async () => {
    render(<AddDocumentPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Add document')).toBeInTheDocument();
    expect(screen.getByLabelText('Document expiry date')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save document' })).toBeInTheDocument();
  });

  it('displays the expected reminder timing preview based on expiry date', async () => {
    render(<AddDocumentPage />, { wrapper: createWrapper() });

    const dateInput = screen.getByLabelText('Document expiry date');
    
    // Set a date 100 days in the future
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 100);
    const dateStr = futureDate.toISOString().slice(0, 10);

    fireEvent.change(dateInput, { target: { value: dateStr } });

    await waitFor(() => {
      expect(screen.getByText(/Expected reminder timing \(Calculated preview\)/i)).toBeInTheDocument();
      expect(screen.getByText(/60 days prior to expiry/i)).toBeInTheDocument();
    });
  });

  it('rejects unsupported file attachment types', async () => {
    render(<AddDocumentPage />, { wrapper: createWrapper() });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = new File(['executable content'], 'virus.exe', { type: 'application/x-msdownload' });

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(screen.getByText(/Supported formats: PDF, JPG, PNG or WEBP/i)).toBeInTheDocument();
    });
  });

  it('accepts valid PDF attachments and displays filename with remove button', async () => {
    render(<AddDocumentPage />, { wrapper: createWrapper() });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = new File(['dummy pdf content'], 'vessel_survey.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(screen.getByText(/vessel_survey.pdf/i)).toBeInTheDocument();
      expect(screen.getByTitle('Remove attachment')).toBeInTheDocument();
    });

    // Clicking remove clears attachment
    fireEvent.click(screen.getByTitle('Remove attachment'));
    await waitFor(() => {
      expect(screen.queryByText(/vessel_survey.pdf/i)).not.toBeInTheDocument();
    });
  });
});
