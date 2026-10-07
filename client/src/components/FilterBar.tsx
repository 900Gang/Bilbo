import { DEFAULT_FILTERS, SORT_OPTIONS, hasActiveFilters, type Filters, type SortValue } from '../lib/filters'
import { PRIORITY_LABEL, STATUS_LABEL, type Priority, type Status } from '../lib/types'
import { SearchIcon } from './icons'

const select =
  'rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/25'

const STATUS_TABS: { value: Status | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'todo', label: STATUS_LABEL.todo },
  { value: 'in_progress', label: STATUS_LABEL.in_progress },
  { value: 'done', label: STATUS_LABEL.done },
]

type Props = {
  filters: Filters
  onChange: (filters: Filters) => void
}

export default function FilterBar({ filters, onChange }: Props) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => onChange({ ...filters, [key]: value })

  return (
    <div className="space-y-3">
      <div role="group" aria-label="Filter by status" className="-mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {STATUS_TABS.map((tab) => {
          const active = filters.status === tab.value
          return (
            <button
              key={tab.label}
              type="button"
              aria-pressed={active}
              onClick={() => set('status', tab.value)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active ? 'bg-ink text-paper' : 'text-muted hover:bg-line hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-full flex-1 sm:min-w-56">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            aria-label="Search tasks"
            placeholder="Search tasks"
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            className={`${select} w-full pl-9`}
          />
        </div>

        <select
          aria-label="Filter by priority"
          value={filters.priority}
          onChange={(e) => set('priority', e.target.value as Priority | '')}
          className={`${select} flex-1 sm:flex-none`}
        >
          <option value="">Any priority</option>
          {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABEL[p]} priority
            </option>
          ))}
        </select>

        <select
          aria-label="Sort tasks"
          value={filters.sort}
          onChange={(e) => set('sort', e.target.value as SortValue)}
          className={`${select} flex-1 sm:flex-none`}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {hasActiveFilters(filters) && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="rounded-lg px-3 py-2 text-sm font-medium text-accent hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}
