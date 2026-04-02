'use client'

import styles from './loader.module.css'

type Props = {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

export default function Loader({ size = 'md', message = 'Laddar...' }: Props) {
  const sizeClass =
    size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : styles.md

  return (
    <div className="flex items-center justify-center gap-3 min-h-[120px]">
      <div
        className={`${styles.loader} ${sizeClass}`}
        role="status"
        aria-label="loading"
      />
      {message && <span className={styles.message}>{message}</span>}
    </div>
  )
}
