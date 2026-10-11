import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api/client';
import { qk } from '@/services/query-client';
import type { Dashboard } from '@/types/api';

export function useDashboard(today: string) {
  return useQuery({
    queryKey: qk.dashboard(today),
    queryFn: () => api.get<Dashboard>('/dashboard', { params: { today } }),
    placeholderData: (prev) => prev,
  });
}
