import type { Task } from './types'

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { timeZone: 'UTC', day: 'numeric', month: 'short' })
}

export function isOverdue(task: Pick<Task, 'dueDate' | 'status'>) {
  if (!task.dueDate || task.status === 'done') return false
  return new Date(task.dueDate).getTime() < new Date().setUTCHours(0, 0, 0, 0)
}

export function greeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 5) return 'Good evening'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
