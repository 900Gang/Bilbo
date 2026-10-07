import { CheckIcon } from './icons'

export default function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const lg = size === 'lg'
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={`grid place-items-center rounded-lg bg-accent text-on-accent ${lg ? 'size-10' : 'size-8'}`}
      >
        <CheckIcon className={lg ? 'size-6' : 'size-5'} strokeWidth={2.5} />
      </span>
      <span className={`font-display font-semibold tracking-tight ${lg ? 'text-3xl' : 'text-2xl'}`}>Bilbo</span>
    </span>
  )
}
