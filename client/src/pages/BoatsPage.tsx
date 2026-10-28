import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBoats, useCreateBoat } from '../hooks/useBoats';
import { useToast } from '../context/ToastContext';
import { Header } from '../components/layout/Header';
import { BoatCard } from '../components/boats/BoatCard';
import { RegisterBoatModal } from '../components/boats/RegisterBoatModal';
import { Button } from '../components/common/Button';
import type { Boat, CreateBoatInput } from '../types/boat';

export const BoatsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: boats = [], isLoading, error } = useBoats();
  const { mutateAsync: createBoat, isPending: isSubmitting } = useCreateBoat();

  const handleRegisterBoat = async (data: CreateBoatInput) => {
    try {
      const newBoat = await createBoat(data);
      showToast(`${newBoat.name} registered`);
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register boat';
      showToast(msg);
    }
  };

  return (
    <div>
      <Header
        title="Boats"
        subtitle={`${boats.length} registered vessels`}
        actions={
          <Button onClick={() => setIsModalOpen(true)}>+ Register boat</Button>
        }
      />

      {error && (
        <div
          role="alert"
          style={{
            background: 'var(--r)',
            color: 'var(--rt)',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '16px',
          }}
        >
          Failed to load vessels: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      {isLoading ? (
        <div className="card empty">
          <p>Loading vessels...</p>
        </div>
      ) : boats.length > 0 ? (
        <div
          className="grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '16px',
          }}
        >
          {boats.map((boat: Boat) => (
            <BoatCard
              key={boat.id}
              boat={boat}
              onClick={() => navigate(`/boats/${boat.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="card empty">
          <p>No boats registered yet.</p>
          <Button onClick={() => setIsModalOpen(true)} style={{ marginTop: '12px' }}>
            Register your first vessel
          </Button>
        </div>
      )}

      <RegisterBoatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleRegisterBoat}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
