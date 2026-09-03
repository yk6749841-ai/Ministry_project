export default function AccessDenied({ onBack }) {
  return (
    <section className="card" dir="rtl">
      <header className="card__head">
        <h1>אין הרשאה</h1>
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          חזרה לרשימה
        </button>
      </header>
      <p className="muted">לתפקיד שלך אין הרשאה לצפות במסך זה.</p>
    </section>
  )
}
