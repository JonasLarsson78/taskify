import styles from '../page.module.css'
import type { AppContent } from '../../../lib/content'

type LoginFormProps = {
  email: string
  password: string
  loading: boolean
  error: string | null
  content: AppContent['login']
  onChangeEmail: (value: string) => void
  onChangePassword: (value: string) => void
  onSubmit: (event: React.FormEvent) => void
}

export default function LoginForm({
  email,
  password,
  loading,
  error,
  content,
  onChangeEmail,
  onChangePassword,
  onSubmit,
}: LoginFormProps) {
  return (
    <section className={styles.authPanel}>
      <form onSubmit={onSubmit} className={styles.form}>
        <h2 className={styles.title}>{content.title}</h2>
        <p className={styles.subtitle}>{content.subtitle}</p>

        {error && <div className={styles.error}>{error}</div>}

        <label className={styles.label}>
          <div className={styles.labelTitle}>{content.email}</div>
          <input
            type="email"
            value={email}
            onChange={(e) => onChangeEmail(e.target.value)}
            required
            className={styles.input}
            placeholder="name@company.com"
          />
        </label>

        <label className={styles.label}>
          <div className={styles.labelTitle}>{content.password}</div>
          <input
            type="password"
            value={password}
            onChange={(e) => onChangePassword(e.target.value)}
            required
            className={styles.input}
            placeholder="••••••••"
          />
        </label>

        <button type="submit" disabled={loading} className={styles.submit}>
          {loading ? content.submitting : content.submit}
        </button>
      </form>
    </section>
  )
}
