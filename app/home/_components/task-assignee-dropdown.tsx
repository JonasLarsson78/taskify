import { useState } from 'react'
import styles from '../page.module.css'

type TaskAssigneeDropdownProps = {
  value: string[]
  options: string[]
  busy: boolean
  onSelect: (nextAssignee: string | null) => void
}

function getAssigneeColor(label: string): string {
  if (!label) return 'linear-gradient(135deg, #a8afc8, #8f96b1)'
  const seed = label.charCodeAt(0) % 3
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
  const active = value[0] || ''
  const activeLabel = active || 'Unassigned'

  return (
    <div className={styles.assigneeDropdownWrap}>
      <button
        className={styles.assigneeDropdownTrigger}
        type="button"
        disabled={busy}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span
          className={styles.assigneeSwatch}
          style={{ background: getAssigneeColor(active) }}
        />
        <span>{activeLabel}</span>
        <span className={styles.assigneeChevron}>▾</span>
      </button>

      {open ? (
        <div className={styles.assigneeDropdownMenu}>
          <button
            className={`${styles.assigneeDropdownItem} ${
              !active ? styles.assigneeDropdownItemActive : ''
            }`}
            type="button"
            onClick={() => {
              onSelect(null)
              setOpen(false)
            }}
          >
            <span
              className={styles.assigneeSwatch}
              style={{ background: getAssigneeColor('') }}
            />
            Unassigned
          </button>

          {options.map((option) => (
            <button
              className={`${styles.assigneeDropdownItem} ${
                option === active ? styles.assigneeDropdownItemActive : ''
              }`}
              type="button"
              key={option}
              onClick={() => {
                onSelect(option)
                setOpen(false)
              }}
            >
              <span
                className={styles.assigneeSwatch}
                style={{ background: getAssigneeColor(option) }}
              />
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
