import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { usePrompt } from '../lib/prompt'

export function PromptDialog() {
  const open = usePrompt((s) => s.open)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setValue(open.initial ?? '')
    requestAnimationFrame(() => inputRef.current?.select())
  }, [open])

  if (!open) return null
  const finish = (v: string | null) => {
    usePrompt.setState({ open: null })
    open.resolve(v)
  }

  return (
    <div className="scrim" onMouseDown={() => finish(null)}>
      <div className="dialog prompt-dialog" role="dialog" aria-label={open.title} onMouseDown={(e) => e.stopPropagation()}>
        <div className="dialog-head">
          <strong>{open.title}</strong>
          <span className="grow" />
          <button className="btn icon" onClick={() => finish(null)} title="Cancel">
            <X size={15} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (value.trim()) finish(value.trim())
          }}
        >
          <label className="prompt-field">
            <span>{open.label}</span>
            <input
              ref={inputRef}
              className="input"
              value={value}
              aria-label={open.label}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && finish(null)}
              autoFocus
            />
          </label>
          {open.hint && <p className="hint" style={{ margin: '0 16px 12px' }}>{open.hint}</p>}
          <div className="dialog-foot">
            <span className="grow" />
            <button type="button" className="btn bordered" onClick={() => finish(null)}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={!value.trim()}>
              {open.confirm ?? 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
