import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api/client';
import { qk } from '@/services/query-client';
import type { Note, NoteInput } from '@/types/api';

export function useNotes() {
  return useQuery({ queryKey: qk.notes, queryFn: () => api.get<Note[]>('/notes') });
}

export function useNote(id: string | undefined) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: [...qk.notes, id],
    enabled: !!id,
    queryFn: () => api.get<Note>(`/notes/${id}`),
    initialData: () => qc.getQueryData<Note[]>(qk.notes)?.find((n) => n.id === id),
  });
}

export function useSaveNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: Partial<NoteInput> }) =>
      id ? api.patch<Note>(`/notes/${id}`, input) : api.post<Note>('/notes', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notes }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/notes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notes }),
  });
}
