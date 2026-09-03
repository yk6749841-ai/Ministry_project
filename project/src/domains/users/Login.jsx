import { useState } from 'react'
import { login } from './usersApi'

export default function Login({ onLoggedIn }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const user = await login(username.trim(), password)
      onLoggedIn(user)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <form className="card login__card" dir="rtl" onSubmit={handleSubmit}>
        <h1>התחברות</h1>

        <label className="field">
          <span className="field__label">שם משתמש</span>
          <input
            className="field__input"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label className="field">
          <span className="field__label">סיסמה</span>
          <input
            className="field__input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p className="alert alert--error">{error}</p>}

        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? 'מתחבר…' : 'התחבר'}
        </button>

        <p className="muted login__hint">
          משתמשי דמו: sara · david · michal (הסיסמה = שם המשתמש + 123)
        </p>
      </form>
    </div>
  )
}
