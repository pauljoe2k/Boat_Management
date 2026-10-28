import { useQuery, useMutation } from '@tanstack/react-query';
import { reminderService } from '../services/reminderService';
import type { ReminderItem } from '../types/reminder';

export const useReminders = () => {
  return useQuery<ReminderItem[]>({
    queryKey: ['reminders'],
    queryFn: () => reminderService.getReminders(),
  });
};

export const useTestPush = () => {
  return useMutation({
    mutationFn: () => reminderService.sendTestPush(),
  });
};
