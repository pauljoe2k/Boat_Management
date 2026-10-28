import React, { useEffect } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '420px',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(20, 30, 50, 0.45)',
        backdropFilter: 'blur(2px)',
        display: 'grid',
        placeItems: 'center',
        padding: '16px',
        zIndex: 50,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        style={{
          background: 'var(--sf)',
          borderRadius: '22px',
          padding: '24px',
          width: '100%',
          maxWidth,
          display: 'grid',
          gap: '14px',
          boxShadow: 'var(--sh)',
        }}
      >
        {title && <h2>{title}</h2>}
        {children}
      </div>
    </div>
  );
};
