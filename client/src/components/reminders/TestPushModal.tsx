import React from 'react';
import type { DocumentItem } from '../../types/document';
import { formatDate } from '../documents/DocumentRow';
import { Button } from '../common/Button';

export interface TestPushModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  onRenewed: (docId: number) => void;
  onSnooze: () => void;
}

export const TestPushModal: React.FC<TestPushModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  onRenewed,
  onSnooze,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Lock screen notification simulator"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(20, 30, 50, 0.45)',
        backdropFilter: 'blur(3px)',
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
        style={{
          background: 'linear-gradient(160deg, #dce6fb, #e8defa 60%, #fde6e6)',
          borderRadius: '26px',
          padding: '26px 18px',
          color: '#26344b',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 12px 32px rgba(20, 30, 50, 0.25)',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.7)', borderRadius: '99px', padding: '3px 12px', marginBottom: '8px' }}>
          <small style={{ color: '#2b3f7a', fontWeight: 700 }}>
            Simulator: Owner Lock Screen Preview
          </small>
        </div>

        <div style={{ fontSize: '46px', fontWeight: 300, letterSpacing: '-0.02em', margin: '4px 0 16px' }}>
          9:41
        </div>

        {doc ? (
          <div
            className="n"
            style={{
              background: 'rgba(255, 255, 255, 0.94)',
              borderRadius: '18px',
              padding: '14px',
              display: 'flex',
              gap: '12px',
              textAlign: 'left',
              boxShadow: '0 4px 16px rgba(40, 60, 100, 0.1)',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: '#cfdafb',
                color: '#2b3f7a',
                display: 'grid',
                placeItems: 'center',
                fontSize: '18px',
                flexShrink: 0,
              }}
            >
              ⚓
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b style={{ fontSize: '13px', display: 'block', color: '#16202f' }}>
                {doc.type} {doc.daysLeft < 0 ? 'has expired' : `expires in ${doc.daysLeft} days`}
              </b>
              <small style={{ color: '#4f5f80', display: 'block', marginTop: '2px' }}>
                {doc.boat?.name ?? 'Vessel'} · {formatDate(doc.expiryDate)}. Submit it for renewal.
              </small>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <Button size="sm" variant="green" onClick={() => onRenewed(doc.id)}>
                  I’ve renewed
                </Button>
                <Button size="sm" variant="outline" onClick={onSnooze}>
                  Snooze
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.92)',
              borderRadius: '18px',
              padding: '20px',
              textAlign: 'center',
            }}
          >
            <b>All caught up</b>
            <p className="mu" style={{ marginTop: '4px' }}>
              Every document is currently submitted.
            </p>
            <Button size="sm" variant="outline" onClick={onClose} style={{ marginTop: '12px' }}>
              Close
            </Button>
          </div>
        )}

        <div style={{ marginTop: '14px', textAlign: 'center' }}>
          <small style={{ fontSize: '11px', color: '#556688', opacity: 0.9 }}>
            Interactive template preview. Does not dispatch real device notifications.
          </small>
        </div>
      </div>
    </div>
  );
};
