import { useEffect, useId, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

/**
 * Centered confirmation for anything you can't undo. Escape or the backdrop
 * cancels. With `requireWord`, the confirm button stays off until that word is typed.
 */
export default function ConfirmDialog({
  title,
  body,
  confirm,
  onConfirm,
  onCancel,
  busy = false,
  requireWord,
}: {
  title: string
  body: string
  confirm: string
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
  requireWord?: string
}) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [typed, setTyped] = useState('')
  const id = useId()
  const ready = !busy && (!requireWord || typed.trim() === requireWord)

  useEffect(() => {
    ;(requireWord ? inputRef.current : cancelRef.current)?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel, busy, requireWord])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => !busy && onCancel()}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-body`}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm border-[1.5px] border-foreground bg-background"
      >
        <div className="clap h-3" aria-hidden="true" />
        <div className="p-4 flex flex-col gap-2">
          <h2 id={`${id}-title`} className="k-display text-[24px]">{title}</h2>
          <p id={`${id}-body`} className="text-[14px] text-muted-foreground">{body}</p>
          {requireWord && (
            <label className="flex flex-col gap-1.5 mt-1">
              <span className="k-label text-[10.5px] font-semibold">Type {requireWord} to confirm</span>
              <input
                ref={inputRef}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && ready && onConfirm()}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                className="input-k"
              />
            </label>
          )}
        </div>
        <div className="grid grid-cols-2 border-t-[1.5px] border-foreground">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={busy} className="min-h-[48px] font-extrabold text-[13px] border-e-[1.5px] border-foreground hover:bg-foreground/5 disabled:opacity-60">
            CANCEL
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!ready}
            className="min-h-[48px] font-extrabold text-[13px] bg-k-red text-k-paper hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            {confirm}
          </button>
        </div>
      </div>
    </div>
  )
}
