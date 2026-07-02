import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icons.jsx'
import { classNames } from '../lib/util.js'

// Tracks the on-screen keyboard height as a --kb CSS variable (0 on desktop).
// iOS overlays the keyboard on the layout viewport; visualViewport tells us how much.
export function useKeyboardInset() {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => {
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      document.documentElement.style.setProperty('--kb', `${Math.round(kb)}px`)
    }
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    update()
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      document.documentElement.style.setProperty('--kb', '0px')
    }
  }, [])
}

// Bottom-sheet on mobile, centered card on desktop. Lifts above the keyboard via --kb.
export function Modal({ open, onClose, title, children, wide = false }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" onClick={onClose} />
      <div
        style={{ maxHeight: 'calc(92vh - var(--kb, 0px))', transform: 'translateY(calc(-1 * var(--kb, 0px)))' }}
        className={classNames(
          'relative z-10 w-full bg-cream shadow-pop overflow-y-auto',
          'rounded-t-2xl sm:rounded-2xl sm:m-4',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'
        )}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-cream/95 px-4 py-3 backdrop-blur">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button className="btn-ghost !px-2" onClick={onClose} aria-label="Close"><Icon.Close /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

// Inline confirm — renders a small danger prompt in place of the trigger.
export function ConfirmButton({ onConfirm, label = 'Delete', confirmLabel = 'Confirm', className, children }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3500)
    return () => clearTimeout(t)
  }, [armed])
  if (armed) {
    return (
      <span className="inline-flex items-center gap-1">
        <button className="btn bg-red-500 text-white !py-1.5 !px-2.5 text-xs" onClick={() => { setArmed(false); onConfirm() }}>{confirmLabel}</button>
        <button className="btn-ghost !py-1.5 !px-2 text-xs" onClick={() => setArmed(false)}>Cancel</button>
      </span>
    )
  }
  return (
    <button className={className || 'btn-ghost text-red-500 !px-2'} onClick={() => setArmed(true)} aria-label={label}>
      {children || <Icon.Trash />}
    </button>
  )
}

export function Chip({ active, onClick, color = 'accent', children }) {
  const palette = {
    accent: active ? 'bg-accent text-white border-accent' : 'bg-surface border-line text-ink-soft hover:border-accent/40',
    lunch: active ? 'bg-amber-500 text-white border-amber-500' : 'bg-amber-50 border-amber-200 text-amber-700',
  }
  return (
    <button type="button" className={classNames('chip', palette[color])} onClick={onClick}>
      {children}
    </button>
  )
}

export function EmptyState({ title, hint, action }) {
  return (
    <div className="mx-auto max-w-sm px-6 py-16 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-2xl">🍽️</div>
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-ink-soft">{hint}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

// Swipe-left to reveal action buttons behind a row. Pointer-based, so it works
// with touch and mouse drag. Vertical scrolling stays native via touch-action.
const SWIPE_ACTION_WIDTH = 76

export function SwipeRow({ actions = [], children }) {
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const drag = useRef(null)
  const width = actions.length * SWIPE_ACTION_WIDTH

  function onDown(e) {
    drag.current = { startX: e.clientX, startY: e.clientY, baseDx: dx, horizontal: null, id: e.pointerId, moved: false }
  }
  function onMove(e) {
    const d = drag.current
    if (!d) return
    const ddx = e.clientX - d.startX
    const ddy = e.clientY - d.startY
    if (d.horizontal == null) {
      if (Math.abs(ddx) < 8 && Math.abs(ddy) < 8) return
      d.horizontal = Math.abs(ddx) > Math.abs(ddy)
      if (d.horizontal) {
        setDragging(true)
        try { e.currentTarget.setPointerCapture(d.id) } catch { /* ignore */ }
      }
    }
    if (!d.horizontal) return
    d.moved = true
    setDx(Math.min(0, Math.max(-width - 24, d.baseDx + ddx)))
  }
  function onUp() {
    const d = drag.current
    drag.current = null
    setDragging(false)
    if (!d || !d.moved) return
    setDx((cur) => (cur < -width / 2 ? -width : 0))
  }
  function onClickCapture(e) {
    // A drag or an open row swallows the tap (tap closes instead of toggling).
    if (dragging) { e.preventDefault(); e.stopPropagation(); return }
    if (dx !== 0) { e.preventDefault(); e.stopPropagation(); setDx(0) }
  }

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-y-0 right-0 flex">
        {actions.map((a) => (
          <button key={a.label} style={{ width: SWIPE_ACTION_WIDTH }}
            className={classNames('flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-white', a.className)}
            onClick={() => { setDx(0); a.onClick() }}>
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>
      <div
        style={{ transform: `translateX(${dx}px)`, touchAction: 'pan-y' }}
        className={classNames('relative bg-surface', dragging ? '' : 'transition-transform duration-150')}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        onClickCapture={onClickCapture}
      >
        {children}
      </div>
    </div>
  )
}

export function Toast({ show, children }) {
  return (
    <div className={classNames(
      'pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-white shadow-pop transition',
      show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
    )}>
      {children}
    </div>
  )
}
