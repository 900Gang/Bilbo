import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Filters } from '../lib/filters'
import type { Task, TaskInput } from '../lib/types'

const BASE_KEY = ['tasks']

export function useTasks(filters: Filters) {
  const [sort, order] = filters.sort.split(':')
  const params = {
    search: filters.search.trim() || undefined,
    status: filters.status || undefined,
    priority: filters.priority || undefined,
    tag: filters.tag || undefined,
    sort,
    order,
  }
  return useQuery({
    queryKey: [...BASE_KEY, params],
    queryFn: async () => (await api.get<{ tasks: Task[] }>('/tasks', { params })).data.tasks,
    placeholderData: keepPreviousData,
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TaskInput) => (await api.post<{ task: Task }>('/tasks', input)).data.task,
    onSuccess: () => qc.invalidateQueries({ queryKey: BASE_KEY }),
  })
}

type UpdateVars = { id: string } & Partial<TaskInput>

// Optimistic updates touch every cached filter variant, then roll back on error.
function snapshot(qc: ReturnType<typeof useQueryClient>) {
  return qc.getQueriesData<Task[]>({ queryKey: BASE_KEY })
}

function restore(qc: ReturnType<typeof useQueryClient>, prev?: ReturnType<typeof snapshot>) {
  prev?.forEach(([key, data]) => qc.setQueryData(key, data))
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: UpdateVars) =>
      (await api.patch<{ task: Task }>(`/tasks/${id}`, patch)).data.task,
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: BASE_KEY })
      const prev = snapshot(qc)
      qc.setQueriesData<Task[]>({ queryKey: BASE_KEY }, (old) =>
        old?.map((t) => (t.id === vars.id ? { ...t, ...vars } : t)),
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => restore(qc, ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: BASE_KEY }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`)
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: BASE_KEY })
      const prev = snapshot(qc)
      qc.setQueriesData<Task[]>({ queryKey: BASE_KEY }, (old) => old?.filter((t) => t.id !== id))
      return { prev }
    },
    onError: (_err, _id, ctx) => restore(qc, ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: BASE_KEY }),
  })
}

// Saves a new manual order. Only the cached lists sorted by "My order" are rearranged optimistically.
export function useReorderTasks() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await api.post('/tasks/reorder', { ids })
    },
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: BASE_KEY })
      const prev = snapshot(qc)
      qc.setQueriesData<Task[]>(
        { queryKey: BASE_KEY, predicate: (query) => (query.queryKey[1] as { sort?: string } | undefined)?.sort === 'position' },
        (old) => {
          if (!old) return old
          const byId = new Map(old.map((t) => [t.id, t]))
          const next = ids.map((id) => byId.get(id)).filter((t): t is Task => !!t)
          return next.length === old.length ? next : old
        },
      )
      return { prev }
    },
    onError: (_err, _ids, ctx) => restore(qc, ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: BASE_KEY }),
  })
}
