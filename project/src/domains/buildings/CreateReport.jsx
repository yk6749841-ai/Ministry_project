import { useState } from 'react'
import { createReport } from './buildingsApi'

const EMPTY_FORM = {
  reporterName: '',
  address: '',
  damageType: '',
  description: '',
  familyEmail: '',
  apartmentsInBuilding: '',
  hasDamagePhotos: false,
  hasEngineerReport: false,
  eligibilityChecked: false,
  socialApproval: false,
}

const TEXT_FIELDS = [
  { name: 'reporterName', label: 'שם מוסר הדיווח', type: 'text' },
  { name: 'address', label: 'כתובת', type: 'text' },
  { name: 'damageType', label: 'סוג הנזק', type: 'text' },
  { name: 'familyEmail', label: 'אימייל משפחה', type: 'email' },
  { name: 'description', label: 'תיאור', type: 'textarea' },
]

const CHECK_FIELDS = [
  { name: 'hasDamagePhotos', label: 'קיימות תמונות נזק' },
  { name: 'hasEngineerReport', label: 'קיים דו"ח מהנדס' },
  { name: 'eligibilityChecked', label: 'בוצעה בדיקת זכאות' },
  { name: 'socialApproval', label: 'התקבל אישור חברתי' },
]

export default function CreateReport({ onCreated, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }))

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const created = await createReport({
        reporterName: form.reporterName.trim(),
        address: form.address.trim(),
        damageType: form.damageType.trim(),
        description: form.description.trim(),
        familyEmail: form.familyEmail.trim(),
        apartmentsInBuilding: Number(form.apartmentsInBuilding) || 0,
        hasDamagePhotos: form.hasDamagePhotos,
        hasEngineerReport: form.hasEngineerReport,
        eligibilityChecked: form.eligibilityChecked,
        socialApproval: form.socialApproval,
      })
      onCreated(created.id)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  const canSubmit = TEXT_FIELDS.every((field) => form[field.name].trim()) && !submitting

  return (
    <section className="card">
      <header className="card__head">
        <h1>יצירת דיווח</h1>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          חזרה לרשימה
        </button>
      </header>

      <form className="form" onSubmit={handleSubmit}>
        {TEXT_FIELDS.map((field) => (
          <label key={field.name} className="field">
            <span className="field__label">{field.label}</span>
            {field.type === 'textarea' ? (
              <textarea
                className="field__input"
                rows={4}
                value={form[field.name]}
                onChange={(event) => setField(field.name, event.target.value)}
                required
              />
            ) : (
              <input
                className="field__input"
                type={field.type}
                value={form[field.name]}
                onChange={(event) => setField(field.name, event.target.value)}
                required
              />
            )}
          </label>
        ))}

        <label className="field">
          <span className="field__label">מספר דירות במבנה</span>
          <input
            className="field__input"
            type="number"
            min="0"
            step="1"
            value={form.apartmentsInBuilding}
            onChange={(event) => setField('apartmentsInBuilding', event.target.value)}
          />
        </label>

        <fieldset className="check-group">
          {CHECK_FIELDS.map((field) => (
            <label key={field.name} className="check">
              <input
                type="checkbox"
                checked={form[field.name]}
                onChange={(event) => setField(field.name, event.target.checked)}
              />
              <span>{field.label}</span>
            </label>
          ))}
        </fieldset>

        {error && <p className="alert alert--error">{error}</p>}

        <div className="form__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            ביטול
          </button>
          <button type="submit" className="btn btn--primary" disabled={!canSubmit}>
            {submitting ? 'יוצר…' : 'צור דיווח'}
          </button>
        </div>
      </form>
    </section>
  )
}
