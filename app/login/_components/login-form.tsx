import styles from '../page.module.css'

type LoginFormProps = {
  email: string
  password: string
  loading: boolean
  error: string | null
  onChangeEmail: (value: string) => void
  onChangePassword: (value: string) => void
  onSubmit: (event: React.FormEvent) => void
}

export default function LoginForm({
  email,
  password,
  loading,
  error,
  onChangeEmail,
  onChangePassword,
  onSubmit,
}: LoginFormProps) {
  return (
    <section className={styles.authPanel}>
      <form onSubmit={onSubmit} className={styles.form}>
        <h2 className={styles.title}>Logga in</h2>
        <p className={styles.subtitle}>Fortsatt till din workspace-oversikt</p>

        {error && <div className={styles.error}>{error}</div>}

        <label className={styles.label}>
          <div className={styles.labelTitle}>E-post</div>
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
          <div className={styles.labelTitle}>Losenord</div>
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
          {loading ? 'Loggar in...' : 'Logga in'}
        </button>
      </form>
    </section>
  )
}
