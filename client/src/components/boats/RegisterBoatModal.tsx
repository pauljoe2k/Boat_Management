import React, { useEffect } from 'react';
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
  kind: z.string().min(1, 'Please select a vessel type'),
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

const VESSEL_PRESETS: Record<string, { icon: string; color: 's' | 'g' | 'l' | 'a' | 'r' }> = {
  'Fishing trawler': { icon: '🎣', color: 's' },
  'Fishing boat': { icon: '🐟', color: 'g' },
  'Cargo dhow': { icon: '⚓', color: 'l' },
  'Charter boat': { icon: '⛵', color: 'a' },
  'Ferry': { icon: '🚢', color: 'r' },
  'Yacht': { icon: '⛵', color: 's' },
  'Speedboat': { icon: '🚤', color: 'g' },
};

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
    setValue,
    watch,
    formState: { errors },
  } = useForm<BoatFormData>({
    resolver: zodResolver(boatSchema),
    defaultValues: {
      name: '',
      reg: '',
      owner: '',
      kind: 'Fishing boat',
      ic: '🐟',
      c: 'g',
    },
  });

  const watchedKind = watch('kind');

  useEffect(() => {
    if (watchedKind && VESSEL_PRESETS[watchedKind]) {
      setValue('ic', VESSEL_PRESETS[watchedKind].icon);
      setValue('c', VESSEL_PRESETS[watchedKind].color);
    }
  }, [watchedKind, setValue]);

  const handleFormSubmit = async (data: BoatFormData) => {
    const preset = VESSEL_PRESETS[data.kind] || { icon: '⛵', color: 's' };
    await onSubmit({
      name: data.name,
      reg: data.reg,
      owner: data.owner,
      kind: data.kind,
      ic: data.ic || preset.icon,
      c: data.c || preset.color,
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
            autoFocus
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
            <option value="Fishing trawler">Fishing trawler (🎣)</option>
            <option value="Fishing boat">Fishing boat (🐟)</option>
            <option value="Cargo dhow">Cargo dhow (⚓)</option>
            <option value="Charter boat">Charter boat (⛵)</option>
            <option value="Ferry">Ferry (🚢)</option>
            <option value="Yacht">Yacht (⛵)</option>
            <option value="Speedboat">Speedboat (🚤)</option>
          </select>
        </label>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
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
