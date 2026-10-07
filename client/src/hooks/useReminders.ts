import { useCallback, useEffect, useState } from 'react'
import { isDueToday, isOverdue, plural, todayString } from '../lib/dates'
import type { Task } from '../lib/types'

const LAST_REMINDER_KEY = 'bilbo:lastReminder'

type Permission = NotificationPermission | 'unsupported'

function currentPermission(): Permission {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
}

// Shows one browser notification per day when tasks are due or overdue.
// Notifications only appear while Bilbo is open in a tab, since there is no background service.
export function useReminders(tasks: Task[] | undefined) {
  const [permission, setPermission] = useState<Permission>(currentPermission)

  const enable = useCallback(async () => {
    if (typeof Notification === 'undefined') return
    setPermission(await Notification.requestPermission())
  }, [])

  useEffect(() => {
    if (!tasks || permission !== 'granted') return
    const today = todayString()
    if (localStorage.getItem(LAST_REMINDER_KEY) === today) return

    const dueToday = tasks.filter(isDueToday).length
    const overdue = tasks.filter(isOverdue).length
    if (dueToday + overdue === 0) return

    const parts = []
    if (dueToday > 0) parts.push(`${plural(dueToday, 'task')} due today`)
    if (overdue > 0) parts.push(`${overdue} overdue`)

    localStorage.setItem(LAST_REMINDER_KEY, today)
    new Notification('Bilbo', { body: parts.join(', '), icon: '/favicon.svg' })
  }, [tasks, permission])

  return { permission, enable }
}
