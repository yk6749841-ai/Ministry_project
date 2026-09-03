import { useState } from 'react'
import { generateReturnHomePackage } from './occupancyPackageService'

export default function ReturnHomePackageButton({ reportId, documentUrl = '', onGenerated }) {
  const [phase, setPhase] = useState('idle') // idle | working | error
  const [localUrl, setLocalUrl] = useState('')
  const [error, setError] = useState('')

  const url = documentUrl || localUrl

  async function handleGenerate() {
    setPhase('working')
    setError('')
    try {
      const result = await generateReturnHomePackage(reportId)
      setLocalUrl(result.url)
      setPhase('idle')
      if (onGenerated) onGenerated()
    } catch (err) {
      setError(err.message)
      setPhase('error')
    }
  }

  if (url) {
    return (
      <span className="rh-package rh-package--done" dir="rtl">
        <a
          className="rh-package__doc"
          href={url}
          target="_blank"
          rel="noreferrer"
          title="פתח מסמך שהופק"
        >
          📄
        </a>
        <a className="rh-package__link" href={url} target="_blank" rel="noreferrer">
          צפייה
        </a>
        <a className="rh-package__link" href={`${url}?download=1`} download>
          הורדה
        </a>
      </span>
    )
  }

  return (
    <div className="rh-package" dir="rtl">
      <button
        type="button"
        className="btn btn--ghost"
        onClick={handleGenerate}
        disabled={phase === 'working'}
      >
        {phase === 'working' ? 'מפיק…' : 'הפק תיק אכלוס מחדש'}
      </button>
      {phase === 'error' && <span className="rh-package__error">{error}</span>}
    </div>
  )
}
