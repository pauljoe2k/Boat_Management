import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBoat } from '../hooks/useBoats';
import { useUpdateDocumentStatus } from '../hooks/useDocuments';
import { useToast } from '../context/ToastContext';
import { DocumentTable } from '../components/documents/DocumentTable';
import { Button } from '../components/common/Button';

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
          showToast(nextSubmitted ? 'Marked as submitted' : 'Moved back to not submitted');
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

  return (
    <div>
      <div className="top">
        <div>
          <Button variant="outline" size="sm" onClick={() => navigate('/boats')}>
            ← Boats
          </Button>
          <h1 style={{ marginTop: '12px' }}>
            {boat.ic} {boat.name}
          </h1>
          <p className="mu">
            {boat.reg} · {boat.kind} · Owner: {boat.owner}
          </p>
        </div>
        <Button onClick={() => navigate(`/add?boatId=${boat.id}`)}>
          + Add document
        </Button>
      </div>

      <DocumentTable
        documents={boat.documents || []}
        onToggleStatus={handleToggleStatus}
        emptyMessage="No documents registered for this vessel yet."
        showClearButton={false}
      />
    </div>
  );
};
