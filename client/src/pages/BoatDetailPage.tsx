import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBoat } from '../hooks/useBoats';
import { useUpdateDocumentStatus } from '../hooks/useDocuments';
import { useToast } from '../context/ToastContext';
import { DocumentTable } from '../components/documents/DocumentTable';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { ProgressBar } from '../components/common/ProgressBar';

export const BoatDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const boatId = id ? parseInt(id, 10) : null;

  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: boat, isLoading, error } = useBoat(boatId);
  const { mutate: updateStatus } = useUpdateDocumentStatus();

  const handleToggleStatus = (docId: number, currentSubmitted: boolean) => {
    const nextSubmitted = !currentSubmitted;
    updateStatus(
      { id: docId, submitted: nextSubmitted },
      {
        onSuccess: () => {
          showToast(nextSubmitted ? 'Marked as submitted' : 'Moved back to pending');
        },
        onError: () => {
          showToast('Failed to update status');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="card empty">
        <p>Loading vessel details...</p>
      </div>
    );
  }

  if (error || !boat) {
    return (
      <div>
        <Button variant="outline" size="sm" onClick={() => navigate('/boats')}>
          ← Boats
        </Button>
        <div className="card empty" style={{ marginTop: '20px' }}>
          <p>Vessel not found.</p>
        </div>
      </div>
    );
  }

  const docCount = boat.documents?.length || 0;
  const subCount = boat.documents?.filter((d) => d.submitted).length || 0;
  const percentage = docCount > 0 ? Math.round((subCount / docCount) * 100) : 0;

  return (
    <div>
      {/* Back button and page title */}
      <div className="top">
        <div>
          <Button variant="outline" size="sm" onClick={() => navigate('/boats')}>
            ← Boats
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                display: 'grid',
                placeItems: 'center',
                fontSize: '22px',
                background: `var(--${boat.c})`,
              }}
            >
              {boat.ic}
            </div>
            <div>
              <h1 style={{ margin: 0 }}>{boat.name}</h1>
              <p className="mu" style={{ margin: '2px 0 0' }}>
                {boat.reg} · {boat.kind} · Owner: {boat.owner}
              </p>
            </div>
          </div>
        </div>

        <Button onClick={() => navigate(`/add?boatId=${boat.id}`)}>
          + Add document
        </Button>
      </div>

      {/* Compliance Indicator Card */}
      <Card style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <b>Document compliance</b>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>
            {subCount} of {docCount} submitted ({percentage}%)
          </span>
        </div>
        <ProgressBar value={percentage} />
      </Card>

      {/* Related Documents Table */}
      <h2 style={{ marginBottom: '12px' }}>Tracked documents</h2>
      <DocumentTable
        documents={boat.documents || []}
        onToggleStatus={handleToggleStatus}
        emptyMessage="No documents registered for this vessel yet."
        showClearButton={false}
      />
    </div>
  );
};
