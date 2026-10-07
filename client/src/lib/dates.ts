import type { Task } from './types'

type DueFields = Pick<Task, 'dueDate' | 'status'>

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { timeZone: 'UTC', day: 'numeric', month: 'short' })
}

// Due dates are plain calendar dates stored at UTC midnight, so compare them as YYYY-MM-DD strings
// against the user's local calendar date. That keeps "today" correct in every time zone.
export function todayString(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function isOverdue(task: DueFields) {
  return task.status !== 'done' && !!task.dueDate && task.dueDate.slice(0, 10) < todayString()
}

export function isDueToday(task: DueFields) {
  return task.status !== 'done' && !!task.dueDate && task.dueDate.slice(0, 10) === todayString()
}

export function needsAttention(task: DueFields) {
  return isOverdue(task) || isDueToday(task)
}

export function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

export function greeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 5) return 'Good evening'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
