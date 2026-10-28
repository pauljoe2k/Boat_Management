import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boatService } from '../services/boatService';
import type { Boat, BoatDetail, CreateBoatInput } from '../types/boat';

export const useBoats = () => {
  return useQuery<Boat[]>({
    queryKey: ['boats'],
    queryFn: () => boatService.getBoats(),
  });
};

export const useBoat = (id: number | null) => {
  return useQuery<BoatDetail>({
    queryKey: ['boat', id],
    queryFn: () => boatService.getBoatById(id!),
    enabled: id !== null && !isNaN(id),
  });
};

export const useCreateBoat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBoatInput) => boatService.createBoat(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boats'] });
    },
  });
};
