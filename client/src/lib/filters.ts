import type { Priority, Status } from './types'

export type SortValue = 'createdAt:desc' | 'createdAt:asc' | 'dueDate:asc' | 'priority:desc' | 'title:asc'

export type Filters = {
  search: string
  status: Status | ''
  priority: Priority | ''
  sort: SortValue
}

export const DEFAULT_FILTERS: Filters = {
  search: '',
  status: '',
  priority: '',
  sort: 'createdAt:desc',
}

export const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'dueDate:asc', label: 'Due soonest' },
  { value: 'priority:desc', label: 'Highest priority' },
  { value: 'title:asc', label: 'Title A-Z' },
]

export function hasActiveFilters(f: Filters) {
  return f.search.trim() !== '' || f.status !== '' || f.priority !== ''
}