export type Status = 'todo' | 'in_progress' | 'done'
export type Priority = 'low' | 'medium' | 'high'

export type Task = {
  id: string
  title: string
  description: string
  status: Status
  priority: Priority
  dueDate: string | null
  tags: string[]
  position: number
  createdAt: string
  updatedAt: string
}

export type TaskInput = {
  title: string
  description: string
  status: Status
  priority: Priority
  dueDate: string | null
  tags: string[]
}

export const STATUS_LABEL: Record<Status, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
}

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}
