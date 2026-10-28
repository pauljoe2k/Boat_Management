import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { CreateBoatInput } from '../../types/boat';

const boatSchema = z.object({
  name: z.string().min(2, 'Boat name must be at least 2 characters'),
  reg: z.string().min(3, 'Registration number must be at least 3 characters'),
  owner: z.string().min(2, 'Owner name must be at least 2 characters'),
  kind: z.string().optional(),
  ic: z.string().optional(),
  c: z.enum(['s', 'g', 'l', 'a', 'r']).optional(),
});

type BoatFormData = z.infer<typeof boatSchema>;

export interface RegisterBoatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBoatInput) => Promise<void>;
  isSubmitting?: boolean;
}

export const RegisterBoatModal: React.FC<RegisterBoatModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BoatFormData>({
    resolver: zodResolver(boatSchema),
    defaultValues: {
      name: '',
      reg: '',
      owner: '',
      kind: 'Fishing boat',
      ic: '⛵',
      c: 's',
    },
  });

  const handleFormSubmit = async (data: BoatFormData) => {
    await onSubmit({
      name: data.name,
      reg: data.reg,
      owner: data.owner,
      kind: data.kind || 'Vessel',
      ic: data.ic || '⛵',
      c: data.c || 's',
    });
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register boat">
      <form onSubmit={handleSubmit(handleFormSubmit)} style={{ display: 'grid', gap: '14px' }}>
        <label>
          Boat name
          <input
            {...register('name')}
            placeholder="e.g. Sea Falcon"
            aria-invalid={!!errors.name}
          />
          {errors.name && <span className="field-error">{errors.name.message}</span>}
        </label>

        <label>
          Registration number
          <input
            {...register('reg')}
            placeholder="e.g. KA-MNG-0412"
            aria-invalid={!!errors.reg}
          />
          {errors.reg && <span className="field-error">{errors.reg.message}</span>}
        </label>

        <label>
          Owner
          <input
            {...register('owner')}
            placeholder="e.g. Ravi Naik"
            aria-invalid={!!errors.owner}
          />
          {errors.owner && <span className="field-error">{errors.owner.message}</span>}
        </label>

        <label>
          Vessel type
          <select {...register('kind')}>
            <option value="Fishing trawler">Fishing trawler</option>
            <option value="Fishing boat">Fishing boat</option>
            <option value="Cargo dhow">Cargo dhow</option>
            <option value="Charter boat">Charter boat</option>
            <option value="Ferry">Ferry</option>
            <option value="Yacht">Yacht</option>
            <option value="Speedboat">Speedboat</option>
          </select>
        </label>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Register
          </Button>
        </div>
      </form>
    </Modal>
  );
};
