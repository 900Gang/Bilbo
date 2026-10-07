import { BellIcon } from './icons'

type Props = {
  permission: NotificationPermission | 'unsupported'
  onEnable: () => void
}

export default function ReminderPrompt({ permission, onEnable }: Props) {
  if (permission === 'unsupported') return null

  if (permission === 'granted') {
    return (
      <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted">
        <BellIcon className="size-3.5" />
        Daily reminders are on while Bilbo is open.
      </p>
    )
  }

  if (permission === 'denied') {
    return (
      <p className="mt-2 text-xs text-muted">Reminders are blocked. Allow notifications for this site in your browser to turn them on.</p>
    )
  }

  return (
    <button
      type="button"
      onClick={onEnable}
      className="mt-2 inline-flex min-h-0 items-center gap-1.5 rounded-lg text-xs font-medium text-accent hover:underline"
    >
      <BellIcon className="size-3.5" />
      Remind me when tasks are due
    </button>
  )
}
