import { useState } from 'react'
import { DEFAULT_FILTERS, SORT_OPTIONS, hasActiveFilters, type Filters, type SortValue } from '../lib/filters'
import { PRIORITY_LABEL, STATUS_LABEL, type Priority, type Status } from '../lib/types'

const control =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'

type Props = {
  filters: Filters
  onChange: (filters: Filters) => void
}

export default function FilterBar({ filters, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => onChange({ ...filters, [key]: value })
  const active = hasActiveFilters(filters)
  const activeCount = (filters.status ? 1 : 0) + (filters.priority ? 1 : 0)

  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex gap-2 sm:min-w-56 sm:flex-1">
        <input
          type="search"
          aria-label="Search tasks"
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
          className={`${control} min-w-0 flex-1`}
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 sm:hidden dark:border-slate-600 dark:hover:bg-slate-800"
        >
          Filters{activeCount > 0 ? ` (${activeCount})` : ''}
        </button>
      </div>

      <div className={`${open ? 'grid' : 'hidden'} grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center`}>
        <select
          aria-label="Filter by status"
          value={filters.status}
          onChange={(e) => set('status', e.target.value as Status | '')}
          className={control}
        >
          <option value="">All statuses</option>
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by priority"
          value={filters.priority}
          onChange={(e) => set('priority', e.target.value as Priority | '')}
          className={control}
        >
          <option value="">All priorities</option>
          {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABEL[p]}
            </option>
          ))}
        </select>

        <select
          aria-label="Sort tasks"
          value={filters.sort}
          onChange={(e) => set('sort', e.target.value as SortValue)}
          className={`${control} col-span-2 sm:col-span-1`}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {active && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="col-span-2 rounded-lg px-3 py-2 text-sm font-medium text-indigo-600 hover:underline sm:col-span-1 dark:text-indigo-400"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}