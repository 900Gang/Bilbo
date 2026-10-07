import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TaskRow, { type TaskRowProps } from './TaskRow'
import { GripIcon } from './icons'

// A TaskRow that can be dragged by its handle, with mouse, touch or keyboard (Space, then arrow keys).
export default function SortableTaskRow(props: Omit<TaskRowProps, 'rowRef' | 'rowStyle' | 'dragging' | 'handle'>) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: props.task.id,
  })

  return (
    <TaskRow
      {...props}
      rowRef={setNodeRef}
      rowStyle={{ transform: CSS.Transform.toString(transform), transition }}
      dragging={isDragging}
      handle={
        <button
          type="button"
          ref={setActivatorNodeRef}
          aria-label={`Reorder "${props.task.title}"`}
          className="-mx-1 grid h-6 w-6 min-h-0 shrink-0 cursor-grab touch-none place-items-center self-start rounded text-muted hover:text-ink active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripIcon className="size-4" />
        </button>
      }
    />
  )
}
