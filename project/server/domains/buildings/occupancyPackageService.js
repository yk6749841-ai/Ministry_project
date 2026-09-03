// "שרות תיק אכלוס" — Occupancy Package Service. Part of the Buildings domain
// (the rehabilitation process). Decides when a return-home package may be
// produced and generates the document.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { logger } from '../../shared/logger.js'
import { GENERATED_DIR } from '../../shared/paths.js'
import { hasBudgetRequest, isQueuedForWork } from './buildingRules.js'
import { sendNotificationWithRetry } from './notificationClient.js'

const REQUIRED_STATUS = 'REHAB_DONE'

const FAMILY_NOTIFICATION_BODY = [
  'שלום,',
  'אנו שמחים לעדכן כי המבנה שלכם אושר לחזרה לבית.',
  'תיק האכלוס הוכן בהצלחה.',
  'בברכה,',
  'משרד הבינוי והשיכון',
].join('\n')

const STATUS_LABELS = {
  WAITING_FOR_VALIDATION: 'ממתין לאימות',
  NEW: 'חדש',
  IN_REVIEW: 'בבדיקה',
  REHAB_IN_PROGRESS: 'מבנה בתהליך שיקום',
  REHAB_DONE: 'תהליך שיקום הסתיים',
}

// Requirement: engineer report + eligibility check + a budget request exists +
// rehabilitation finished. Reuses the shared rules rather than restating them.
export function canGenerateReturnHomePackage(building) {
  return (
    isQueuedForWork(building) &&
    hasBudgetRequest(building) &&
    building.status === REQUIRED_STATUS
  )
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"]/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch],
  )
}

function buildDocumentHtml(building) {
  const rows = [
    ['מזהה מבנה', building.id],
    ['כתובת', building.address],
    ['מספר דירות', building.apartmentsInBuilding],
    ['סטטוס זכאות', building.eligibilityChecked ? 'בדיקת זכאות בוצעה' : 'בדיקת זכאות לא בוצעה'],
    ['סטטוס תקציב', hasBudgetRequest(building) ? 'קיימת בקשת תקציב' : 'אין בקשת תקציב'],
    ['סטטוס שיקום', STATUS_LABELS[building.status] ?? building.status],
  ]
  const generatedAt = new Date().toLocaleString('he-IL')
  const tableRows = rows
    .map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`)
    .join('\n        ')

  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<title>תיק אכלוס מחדש — ${escapeHtml(building.address)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Arial, "Helvetica Neue", sans-serif; color: #1f2430;
         background: #f2f3f5; margin: 0; padding: 32px; }
  .doc { max-width: 800px; margin: 0 auto; background: #fff; border: 1px solid #d9dce2;
         padding: 48px 56px; }
  .doc__header { text-align: center; border-bottom: 3px double #1f2430; padding-bottom: 20px;
                 margin-bottom: 28px; }
  .doc__org { font-size: 13px; letter-spacing: .12em; color: #57536a; }
  h1 { font-size: 24px; margin: 10px 0 0; }
  table { width: 100%; border-collapse: collapse; margin: 24px 0; }
  th, td { text-align: right; padding: 12px 14px; border-bottom: 1px solid #e6e8ec; font-size: 15px; }
  th { width: 34%; color: #57536a; font-weight: 600; }
  .doc__statement { margin-top: 32px; padding: 18px; text-align: center; font-size: 18px;
                    font-weight: 700; background: #e9f7ef; color: #1c7a45; border: 1px solid #b8e6c9; }
  .doc__footer { margin-top: 36px; font-size: 12px; color: #8b8b8b; text-align: center; }
  @media print { body { background: #fff; padding: 0; } .doc { border: 0; padding: 0; } }
</style>
</head>
<body>
  <div class="doc">
    <div class="doc__header">
      <div class="doc__org">משרד הבינוי והשיכון</div>
      <h1>תיק אכלוס מחדש</h1>
    </div>
    <table>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
    <div class="doc__statement">ניתן לאכלוס מחדש</div>
    <div class="doc__footer">הופק בתאריך ${escapeHtml(generatedAt)}</div>
  </div>
</body>
</html>`
}

export async function generateReturnHomePackage(building) {
  const ctx = { settlementName: building.settlementId, buildingId: building.id }

  // Simulate heavy PDF composition — wait one second before producing the file.
  logger.info('PDF_GENERATION_STARTED', ctx)
  await new Promise((resolve) => setTimeout(resolve, 1000))
  await mkdir(GENERATED_DIR, { recursive: true })
  const fileName = `return-home-package-${building.id}.html`
  await writeFile(path.join(GENERATED_DIR, fileName), buildDocumentHtml(building), 'utf8')
  logger.info('PDF_GENERATION_COMPLETED', ctx)

  // The document was produced successfully — notify the family. The client
  // retries up to 3 times; each attempt is logged separately by the mock server.
  logger.info('NOTIFICATION_SEND_STARTED', ctx)
  const notification = await sendNotificationWithRetry({
    buildingId: building.id,
    settlementId: building.settlementId,
    email: building.familyEmail,
    subject: `אישור חזרה לבית ${building.address}`,
    body: FAMILY_NOTIFICATION_BODY,
  })

  return { url: `/api/files/${fileName}`, fileName, messageId: notification.messageId }
}

export async function readGeneratedFile(fileName) {
  // Only a bare file name from our own directory — no path traversal.
  if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) return null
  try {
    return await readFile(path.join(GENERATED_DIR, fileName), 'utf8')
  } catch {
    return null
  }
}
