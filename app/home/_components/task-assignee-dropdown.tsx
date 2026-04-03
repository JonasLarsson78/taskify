import { useState } from 'react'
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
  const activeAssigneeId = value[0] ?? null
  const activeOption =
    activeAssigneeId === null
      ? null
      : options.find((option) => option.id === activeAssigneeId) ?? null
  const activeLabel = activeOption?.label || 'Unassigned'

  return (
    <div
      className={styles.assigneeDropdownWrap}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        className={styles.assigneeDropdownTrigger}
        type="button"
        disabled={busy}
        onClick={(event) => {
          event.stopPropagation()
          setOpen((prev) => !prev)
        }}
      >
        <span
          className={styles.assigneeSwatch}
          style={{ background: getAssigneeColor(activeAssigneeId ?? 0) }}
        />
        <span>{activeLabel}</span>
        <span className={styles.assigneeChevron}>▾</span>
      </button>

      {open ? (
        <div className={styles.assigneeDropdownMenu}>
          <button
            className={`${styles.assigneeDropdownItem} ${
              activeAssigneeId === null ? styles.assigneeDropdownItemActive : ''
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
        </div>
      ) : null}
    </div>
  )
}
