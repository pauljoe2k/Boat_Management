import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface ToastContextType {
  showToast: (message: string, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<number | null>(null);

  const showToast = useCallback((message: string, durationMs = 2500) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setToastMessage(message);
    setIsVisible(true);

    timerRef.current = window.setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setToastMessage(null), 300);
    }, durationMs);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
            transform: isVisible ? 'translate(-50%, 0)' : 'translate(-50%, 40px)',
            opacity: isVisible ? 1 : 0,
            background: 'var(--ink)',
            color: 'var(--bg)',
            padding: '11px 20px',
            borderRadius: '99px',
            boxShadow: 'var(--sh)',
            fontWeight: 600,
            fontSize: '13px',
            zIndex: 100,
            transition: 'opacity 0.25s ease, transform 0.25s ease',
            pointerEvents: 'none',
          }}
        >
          {toastMessage}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
