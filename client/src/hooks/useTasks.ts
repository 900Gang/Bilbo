import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Task, TaskInput } from '../lib/types'

const KEY = ['tasks']

export function useTasks() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => (await api.get<{ tasks: Task[] }>('/tasks')).data.tasks,
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TaskInput) => (await api.post<{ task: Task }>('/tasks', input)).data.task,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

type UpdateVars = { id: string } & Partial<TaskInput>

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: UpdateVars) =>
      (await api.patch<{ task: Task }>(`/tasks/${id}`, patch)).data.task,
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: KEY })
      const prev = qc.getQueryData<Task[]>(KEY)
      qc.setQueryData<Task[]>(KEY, (old) => old?.map((t) => (t.id === vars.id ? { ...t, ...vars } : t)))
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`)
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEY })
      const prev = qc.getQueryData<Task[]>(KEY)
      qc.setQueryData<Task[]>(KEY, (old) => old?.filter((t) => t.id !== id))
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}