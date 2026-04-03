import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { createPortal } from 'react-dom'
import styles from '../page.module.css'
import type { AssigneeOption } from '../model'

type TaskAssigneeDropdownProps = {
  value: number[]
  options: AssigneeOption[]
  busy: boolean
  onSelect: (nextAssigneeId: number | null) => void
}

function getAssigneeColor(seedValue: number): string {
  if (!seedValue) return 'linear-gradient(135deg, #a8afc8, #8f96b1)'
  const seed = seedValue % 3
  if (seed === 0) return 'linear-gradient(135deg, #ff8fab, #ff5f98)'
  if (seed === 1) return 'linear-gradient(135deg, #6f5ad6, #59a4ff)'
  return 'linear-gradient(135deg, #ffcc16, #ff9f1a)'
}

export default function TaskAssigneeDropdown({
  value,
  options,
  busy,
  onSelect,
}: TaskAssigneeDropdownProps) {
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({})
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const activeAssigneeId = value[0] ?? null
  const activeOption =
    activeAssigneeId === null
      ? null
      : options.find((option) => option.id === activeAssigneeId) ?? null
  const activeLabel = activeOption?.label || 'Unassigned'

  function updateMenuPosition() {
    const button = buttonRef.current
    if (!button || typeof window === 'undefined') return

    const rect = button.getBoundingClientRect()
    const menuWidth = Math.max(rect.width, 180)
    const maxLeft = Math.max(12, window.innerWidth - menuWidth - 12)
    const left = Math.min(rect.left, maxLeft)
    const top = rect.bottom + 6

    setMenuStyle({
      position: 'fixed',
      top,
      left,
      width: menuWidth,
      maxWidth: 'min(260px, calc(100vw - 24px))',
      zIndex: 1200,
    })
  }

  useLayoutEffect(() => {
    if (!open) return
    updateMenuPosition()
  }, [open])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node | null
      if (
        (target && wrapRef.current?.contains(target)) ||
        (target && menuRef.current?.contains(target))
      ) {
        return
      }

      setOpen(false)
    }

    function handleWindowChange() {
      updateMenuPosition()
    }

    document.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('resize', handleWindowChange)
    window.addEventListener('scroll', handleWindowChange, true)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('resize', handleWindowChange)
      window.removeEventListener('scroll', handleWindowChange, true)
    }
  }, [open])

  return (
    <div
      ref={wrapRef}
      className={styles.assigneeDropdownWrap}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        ref={buttonRef}
        className={styles.assigneeDropdownTrigger}
        type="button"
        disabled={busy}
        onClick={(event) => {
          event.stopPropagation()
          setOpen((prev) => {
            const nextOpen = !prev
            if (nextOpen) {
              requestAnimationFrame(() => updateMenuPosition())
            }
            return nextOpen
          })
        }}
      >
        <span
          className={styles.assigneeSwatch}
          style={{ background: getAssigneeColor(activeAssigneeId ?? 0) }}
        />
        <span>{activeLabel}</span>
        <span className={styles.assigneeChevron}>▾</span>
      </button>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={menuRef}
              className={styles.assigneeDropdownMenu}
              style={menuStyle}
            >
              <button
                className={`${styles.assigneeDropdownItem} ${
                  activeAssigneeId === null
                    ? styles.assigneeDropdownItemActive
                    : ''
                }`}
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onSelect(null)
                  setOpen(false)
                }}
              >
                <span
                  className={styles.assigneeSwatch}
                  style={{ background: getAssigneeColor(0) }}
                />
                Unassigned
              </button>

              {options.map((option) => (
                <button
                  className={`${styles.assigneeDropdownItem} ${
                    option.id === activeAssigneeId
                      ? styles.assigneeDropdownItemActive
                      : ''
                  }`}
                  type="button"
                  key={option.id}
                  onClick={(event) => {
                    event.stopPropagation()
                    onSelect(option.id)
                    setOpen(false)
                  }}
                >
                  <span
                    className={styles.assigneeSwatch}
                    style={{ background: getAssigneeColor(option.id) }}
                  />
                  {option.label}
                </button>
              ))}
            </div>,
            document.body
          )
        : null}
    </div>
  )
}
